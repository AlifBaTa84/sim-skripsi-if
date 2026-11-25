import * as XLSX from 'xlsx';
import { Lecturer, ImportedStudentRow, ScheduleItem, Room } from '../types';
import { checkScheduleConflict } from './conflictChecker';

/**
 * Clean and normalize lecturer names by stripping academic degrees for fuzzy matching
 * e.g., "Dian Dharmayanti, S.T., M.Kom." -> "dian dharmayanti"
 */
export function normalizeLecturerName(name: string): string {
  if (!name) return '';
  return name
    .toLowerCase()
    .replace(/\b(dr|prof|ir|s\.t|m\.t|m\.kom|s\.kom|m\.si|citpm|ph\.d|m\.sc)\b/gi, '')
    .replace(/[^a-z0-9\s]/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Matches an imported lecturer string against master lecturers list
 */
export function matchLecturerByName(query: string, lecturers: Lecturer[]): Lecturer | null {
  if (!query) return null;
  const cleanQuery = normalizeLecturerName(query);

  // 1. Exact match
  const exact = lecturers.find(l => l.name.toLowerCase() === query.trim().toLowerCase());
  if (exact) return exact;

  // 2. Normalized clean name match
  const normalizedMatch = lecturers.find(l => {
    const cleanLec = normalizeLecturerName(l.name);
    return cleanLec === cleanQuery || cleanLec.includes(cleanQuery) || cleanQuery.includes(cleanLec);
  });
  if (normalizedMatch) return normalizedMatch;

  // 3. Fallback: match by code or last name
  const words = cleanQuery.split(' ').filter(w => w.length > 2);
  if (words.length > 0) {
    const wordMatch = lecturers.find(l => {
      const cleanLec = normalizeLecturerName(l.name);
      return words.some(w => cleanLec.includes(w));
    });
    if (wordMatch) return wordMatch;
  }

  return null;
}

/**
 * Parses uploaded Excel (.xlsx, .xls) or CSV file
 */
export async function parseImportFile(file: File): Promise<any[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const json = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
        resolve(json);
      } catch (err) {
        reject(err);
      }
    };

    reader.onerror = (err) => reject(err);
    reader.readAsBinaryString(file);
  });
}

/**
 * Map raw sheet rows to validated ImportedStudentRow
 * Sumber data tunggal: Data pendaftaran mahasiswa diimpor untuk kegiatan Seminar.
 * Kolom standar: NIM, Nama, Judul, Jenis, Dosen Pembimbing
 * - Dosen Reviewer: Ditentukan oleh Administrator pada Papan Jadwal (tidak ada di file impor)
 * - Data Sidang: Otomatis dibuat oleh sistem saat mahasiswa dinyatakan Lulus Seminar.
 */
export function processImportRows(
  rawRows: any[], 
  lecturers: Lecturer[],
  activityType: 'seminar' | 'sidang' = 'seminar'
): ImportedStudentRow[] {
  const isSeminar = activityType === 'seminar';

  return rawRows.map((row) => {
    // Flexible column lookup (case-insensitive & aliases)
    const findValue = (keys: string[]): string => {
      for (const k of Object.keys(row)) {
        const cleanK = k.toLowerCase().replace(/[^a-z0-9]/g, '');
        for (const target of keys) {
          if (cleanK === target.toLowerCase().replace(/[^a-z0-9]/g, '')) {
            return String(row[k] ?? '').trim();
          }
        }
      }
      return '';
    };

    const nim = findValue(['nim', 'nomorinduk', 'student_id']);
    const nama = findValue(['nama', 'namamahasiswa', 'namalengkap', 'student_name']);
    const judul = findValue(['judul', 'judultugasakhir', 'judulskripsi', 'title']);
    const jenis = findValue(['jenis', 'jenissidang', 'tipe', 'type']) || 'Seminar Proposal';
    const dosenPembimbing = findValue(['dosenpembimbing', 'pembimbing', 'advisor', 'pembimbing1']);
    const dosenReviewer = findValue(['dosenreviewer', 'reviewer', 'pengujireviewer', 'pengujiseminar']);
    const nilaiSeminar = findValue(['nilaiseminar', 'nilai', 'score', 'nilaisempro']);

    const matchedAdvisor = matchLecturerByName(dosenPembimbing, lecturers);
    const matchedReviewer = isSeminar ? null : matchLecturerByName(dosenReviewer, lecturers);

    const validationErrors: string[] = [];
    if (!nim) validationErrors.push('NIM wajib diisi');
    if (!nama) validationErrors.push('Nama mahasiswa wajib diisi');
    if (!judul) validationErrors.push('Judul penelitian/skripsi wajib diisi');
    if (!dosenPembimbing) validationErrors.push('Dosen Pembimbing wajib diisi');
    
    // Pada Seminar (sumber data tunggal), Reviewer tidak boleh dari impor, dipilih di Papan Jadwal
    if (!isSeminar && !dosenReviewer) {
      validationErrors.push('Dosen Reviewer wajib diisi');
    }

    // Rule: Reviewer and Advisor cannot be the same lecturer
    if (matchedAdvisor && matchedReviewer && matchedAdvisor.id === matchedReviewer.id) {
      validationErrors.push('Dosen Pembimbing dan Dosen Reviewer tidak boleh dosen yang sama');
    }

    return {
      nim: nim.toUpperCase(),
      nama: nama.toUpperCase(),
      judul,
      jenis,
      dosenPembimbing,
      dosenReviewer: isSeminar ? '' : dosenReviewer,
      nilaiSeminar: nilaiSeminar || '-',
      activityType,
      matchedAdvisorId: matchedAdvisor?.id,
      matchedReviewerId: matchedReviewer?.id,
      isValid: validationErrors.length === 0,
      validationErrors,
    };
  });
}

export interface Examiner3Candidate {
  lecturer: Lecturer;
  isAvailable: boolean;
  conflictReason?: string;
  reviewerCount: number;        // Banyaknya mahasiswa di mana dosen sebagai Reviewer (Ketua Penguji / P1)
  advisorCount: number;         // Banyaknya mahasiswa di mana dosen sebagai Pembimbing (Penguji 2 / P2)
  primaryLoad: number;          // Total beban sebagai Reviewer atau Pembimbing (P1 + P2)
  examiner3Count: number;       // Banyaknya yang telah ditugaskan sebagai Penguji 3 (P3)
  priorityScore: number;        // Skor beban kumulatif (primaryLoad + examiner3Count)
  proportionLabel: 'Tinggi' | 'Sedang' | 'Rendah'; // Label proporsi keterpilihan Penguji 3
  currentWorkload: number;      // Total sidang aktif dosen
}

/**
 * Menemukan dan mengurutkan calon Dosen Penguji 3 yang memenuhi syarat.
 *
 * Aturan Proporsional:
 * "Proporsi penentuan Dosen sebagai Penguji 3 dilakukan berdasarkan banyaknya yang bersangkutan
 * sebagai Reviewer atau Penguji 2. Semakin banyak menjadi reviewer atau penguji 2 maka akan
 * semakin sedikit proporsi untuk jadi penguji 3, begitu juga sebaliknya. Aturan ini diberlakukan
 * untuk penentuan penguji 3 secara otomatis."
 *
 * Syarat Eksklusi:
 * - Bukan Dosen Pembimbing (Penguji 2)
 * - Bukan Dosen Reviewer (Ketua Penguji)
 *
 * Hierarki Pengurutan:
 * 1. Ketersediaan (bebas bentrok pada tanggal & jam slot target diutamakan)
 * 2. Skor Beban Proporsional Terendah: (primaryLoad + examiner3Count)
 *    Dosen dengan tugas Reviewer & Pembimbing paling sedikit mendapat proporsi Penguji 3 paling besar.
 * 3. Tie-breaker: primaryLoad lebih kecil, lalu examiner3Count lebih kecil, lalu nama alfabetis.
 */
export function getEligibleExaminer3Candidates(
  advisorId: string,
  reviewerId: string,
  lecturers: Lecturer[],
  schedules: ScheduleItem[],
  targetDate?: string,
  targetTimeSlotId?: string,
  rooms?: Room[]
): Examiner3Candidate[] {
  // Exclude advisor and reviewer
  const eligible = lecturers.filter(l => l.id !== advisorId && l.id !== reviewerId);

  // Hitung metrik awal untuk seluruh kandidat
  const mapped = eligible.map(lec => {
    // 1. Frekuensi sebagai Reviewer (P1) di seluruh pengajuan
    const reviewerCount = schedules.filter(s => s.examiner1Id === lec.id).length;

    // 2. Frekuensi sebagai Pembimbing (P2) di seluruh pengajuan
    const advisorCount = schedules.filter(s => s.examiner2Id === lec.id).length;

    // 3. Beban utama sebagai Reviewer atau Penguji 2
    const primaryLoad = reviewerCount + advisorCount;

    // 4. Frekuensi telah ditugaskan sebagai Penguji 3 (P3)
    const examiner3Count = schedules.filter(s => s.examiner3Id === lec.id).length;

    // 5. Total sidang aktif (scheduled atau completed)
    const currentWorkload = schedules.filter(s =>
      (s.status === 'scheduled' || s.status === 'completed') &&
      (s.examiner1Id === lec.id || s.examiner2Id === lec.id || s.examiner3Id === lec.id)
    ).length;

    // 6. Cek ketersediaan jadwal pada slot target jika ditentukan
    let isAvailable = true;
    let conflictReason: string | undefined = undefined;

    if (targetDate && targetTimeSlotId) {
      const concurrentSession = schedules.find(s =>
        (s.status === 'scheduled' || s.status === 'completed') &&
        s.date === targetDate &&
        s.timeSlotId === targetTimeSlotId &&
        (s.examiner1Id === lec.id || s.examiner2Id === lec.id || s.examiner3Id === lec.id)
      );

      if (concurrentSession) {
        isAvailable = false;
        conflictReason = `Sedang bertugas untuk ${concurrentSession.studentName} pada slot ini`;
      }
    }

    // 7. Skor Beban Kumulatif untuk Penentuan Proporsi:
    // Semakin tinggi primaryLoad (banyak Reviewer/Pembimbing), skor semakin besar (prioritas P3 semakin rendah).
    // Semakin rendah primaryLoad, skor semakin kecil (prioritas P3 semakin tinggi / proporsi besar).
    const priorityScore = primaryLoad + examiner3Count;

    return {
      lecturer: lec,
      isAvailable,
      conflictReason,
      reviewerCount,
      advisorCount,
      primaryLoad,
      examiner3Count,
      priorityScore,
      currentWorkload,
    };
  });

  // Hitung rentang primaryLoad untuk label proporsi dinamis
  const primaryLoads = mapped.map(m => m.primaryLoad);
  const minLoad = primaryLoads.length > 0 ? Math.min(...primaryLoads) : 0;
  const maxLoad = primaryLoads.length > 0 ? Math.max(...primaryLoads) : 0;
  const range = maxLoad - minLoad;

  const result: Examiner3Candidate[] = mapped.map(item => {
    let proportionLabel: 'Tinggi' | 'Sedang' | 'Rendah' = 'Sedang';

    if (range <= 1) {
      proportionLabel = 'Sedang';
    } else if (item.primaryLoad <= minLoad + Math.floor(range / 3)) {
      proportionLabel = 'Tinggi'; // Beban P1/P2 sedikit -> Proporsi P3 Tinggi
    } else if (item.primaryLoad >= maxLoad - Math.floor(range / 3)) {
      proportionLabel = 'Rendah'; // Beban P1/P2 banyak -> Proporsi P3 Rendah
    }

    return {
      ...item,
      proportionLabel,
    };
  });

  return result.sort((a, b) => {
    // 1. Ketersediaan (bebas bentrok diutamakan)
    if (a.isAvailable !== b.isAvailable) {
      return a.isAvailable ? -1 : 1;
    }

    // 2. Skor Prioritas Proporsional terendah (primaryLoad + examiner3Count)
    if (a.priorityScore !== b.priorityScore) {
      return a.priorityScore - b.priorityScore;
    }

    // 3. Jika skor sama, dahulukan yang beban Reviewer/Pembimbing-nya paling sedikit
    if (a.primaryLoad !== b.primaryLoad) {
      return a.primaryLoad - b.primaryLoad;
    }

    // 4. Jika masih sama, dahulukan yang penugasan Penguji 3-nya paling sedikit
    if (a.examiner3Count !== b.examiner3Count) {
      return a.examiner3Count - b.examiner3Count;
    }

    // 5. Tie-breaker alfabetis nama dosen
    return a.lecturer.name.localeCompare(b.lecturer.name);
  });
}

/**
 * Sample CSV Template generator
 */
export function getSampleCSVContent(): string {
  const headers = ['NIM', 'Nama', 'Judul', 'Jenis', 'Dosen Pembimbing', 'Dosen Reviewer', 'Nilai Seminar'];
  const samples = [
    [
      '10120301',
      'FARHAN KURNIAWAN',
      'Sistem Rekomendasi Pemilihan Dosen Pembimbing Menggunakan Algoritma Content-Based Filtering',
      'Skripsi',
      'Andri Heryandi, S.T., M.T.',
      'Dian Dharmayanti, S.T., M.Kom.',
      '86.5'
    ],
    [
      '10120305',
      'TIARA ANGGRAENI',
      'Penerapan Algoritma YOLOv8 untuk Deteksi Rambu Lalu Lintas Secara Real-Time pada Kendaraan Otonom',
      'Skripsi',
      'Chrismikha Hardyanto, M.Kom.',
      'Iskandar Ikbal, M.Kom.',
      '88.0'
    ],
    [
      '10120310',
      'RIZKY RAMADHAN',
      'Pengembangan Aplikasi Pemantau Kualitas Udara IoT Berbasis ESP32 dan Dashboard Web',
      'Tugas Akhir',
      'Sopian Alviana, M.Kom.',
      'Angga Setiyadi, M.Kom., CITPM',
      '84.5'
    ],
    [
      '10120315',
      'AULIA CITRA LESTARI',
      'Klasifikasi Tingkat Kematangan Buah Kopi Menggunakan Support Vector Machine Berbasis Fitur Warna HSV',
      'Skripsi',
      'Dr. Marliana Budhiningtias, M.Si.',
      'Taufiq Nurhadi, S.Kom., M.T.',
      '89.0'
    ],
    [
      '10120320',
      'DANI ALDIANSYAH',
      'Audit Keamanan Informasi Sistem Akademik Berbasis Kerangka Kerja ISO/IEC 27001:2022',
      'Skripsi',
      'Angga Setiyadi, M.Kom., CITPM',
      'Andri Heryandi, S.T., M.T.',
      '85.0'
    ]
  ];

  return [headers.join(','), ...samples.map(row => row.map(v => `"${v}"`).join(','))].join('\r\n');
}

/**
 * Downloads a pre-formatted sample Excel/CSV template for the user
 */
export function downloadSampleTemplate(format: 'csv' | 'xlsx' = 'xlsx', activityType: 'seminar' | 'sidang' = 'seminar') {
  const isSeminar = activityType === 'seminar';

  const data = isSeminar
    ? [
        {
          'NIM': '10120301',
          'Nama': 'FARHAN KURNIAWAN',
          'Judul': 'Sistem Rekomendasi Pemilihan Dosen Pembimbing Menggunakan Algoritma Content-Based Filtering',
          'Jenis': 'Seminar Proposal',
          'Dosen Pembimbing': 'Andri Heryandi, S.T., M.T.'
        },
        {
          'NIM': '10120305',
          'Nama': 'TIARA ANGGRAENI',
          'Judul': 'Penerapan Algoritma YOLOv8 untuk Deteksi Rambu Lalu Lintas Secara Real-Time pada Kendaraan Otonom',
          'Jenis': 'Seminar Proposal',
          'Dosen Pembimbing': 'Chrismikha Hardyanto, M.Kom.'
        },
        {
          'NIM': '10120310',
          'Nama': 'RIZKY RAMADHAN',
          'Judul': 'Pengembangan Aplikasi Pemantau Kualitas Udara IoT Berbasis ESP32 dan Dashboard Web',
          'Jenis': 'Seminar Proposal',
          'Dosen Pembimbing': 'Sopian Alviana, M.Kom.'
        }
      ]
    : [
        {
          'NIM': '10120301',
          'Nama': 'FARHAN KURNIAWAN',
          'Judul': 'Sistem Rekomendasi Pemilihan Dosen Pembimbing Menggunakan Algoritma Content-Based Filtering',
          'Jenis': 'Skripsi',
          'Dosen Pembimbing': 'Andri Heryandi, S.T., M.T.',
          'Dosen Reviewer': 'Dian Dharmayanti, S.T., M.Kom.',
          'Nilai Seminar': 86.5
        },
        {
          'NIM': '10120305',
          'Nama': 'TIARA ANGGRAENI',
          'Judul': 'Penerapan Algoritma YOLOv8 untuk Deteksi Rambu Lalu Lintas Secara Real-Time pada Kendaraan Otonom',
          'Jenis': 'Skripsi',
          'Dosen Pembimbing': 'Chrismikha Hardyanto, M.Kom.',
          'Dosen Reviewer': 'Iskandar Ikbal, M.Kom.',
          'Nilai Seminar': 88.0
        },
        {
          'NIM': '10120310',
          'Nama': 'RIZKY RAMADHAN',
          'Judul': 'Pengembangan Aplikasi Pemantau Kualitas Udara IoT Berbasis ESP32 dan Dashboard Web',
          'Jenis': 'Tugas Akhir',
          'Dosen Pembimbing': 'Sopian Alviana, M.Kom.',
          'Dosen Reviewer': 'Angga Setiyadi, M.Kom., CITPM',
          'Nilai Seminar': 84.5
        },
        {
          'NIM': '10120315',
          'Nama': 'AULIA CITRA LESTARI',
          'Judul': 'Klasifikasi Tingkat Kematangan Buah Kopi Menggunakan Support Vector Machine Berbasis Fitur Warna HSV',
          'Jenis': 'Skripsi',
          'Dosen Pembimbing': 'Dr. Marliana Budhiningtias, M.Si.',
          'Dosen Reviewer': 'Taufiq Nurhadi, S.Kom., M.T.',
          'Nilai Seminar': 89.0
        }
      ];

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, isSeminar ? 'Pendaftaran Seminar' : 'Pengajuan Sidang');

  const fileName = isSeminar
    ? `Template_Impor_Pendaftaran_Seminar.${format}`
    : `Template_Impor_Mahasiswa_Sidang.${format}`;

  if (format === 'xlsx') {
    XLSX.writeFile(workbook, fileName);
  } else {
    XLSX.writeFile(workbook, fileName, { bookType: 'csv' });
  }
}

