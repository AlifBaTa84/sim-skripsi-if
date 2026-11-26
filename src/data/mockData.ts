import { Lecturer, Room, TimeSlot, ScheduleItem, AcademicPeriod } from '../types';

export const INITIAL_ACADEMIC_PERIODS: AcademicPeriod[] = [
  {
    id: 'prd-2024-genap',
    academicYear: '2024/2025',
    semester: 'Genap',
    startDate: '2025-02-01',
    endDate: '2025-07-31',
    isActive: false,
    status: 'selesai',
    createdAt: '2025-01-15T08:00:00Z',
    updatedAt: '2025-07-31T17:00:00Z',
  },
  {
    id: 'prd-2025-ganjil',
    academicYear: '2025/2026',
    semester: 'Ganjil',
    startDate: '2025-08-01',
    endDate: '2026-01-31',
    isActive: false,
    status: 'selesai',
    createdAt: '2025-07-20T08:00:00Z',
    updatedAt: '2026-01-31T17:00:00Z',
  },
  {
    id: 'prd-2025-genap',
    academicYear: '2025/2026',
    semester: 'Genap',
    startDate: '2026-02-01',
    endDate: '2026-07-31',
    isActive: true,
    status: 'berjalan',
    createdAt: '2026-01-20T08:00:00Z',
    updatedAt: '2026-02-01T08:00:00Z',
  },
  {
    id: 'prd-2026-ganjil',
    academicYear: '2026/2027',
    semester: 'Ganjil',
    startDate: '2026-08-01',
    endDate: '2027-01-31',
    isActive: false,
    status: 'persiapan',
    createdAt: '2026-02-15T08:00:00Z',
    updatedAt: '2026-02-15T08:00:00Z',
  },
];

export const INITIAL_ROOMS: Room[] = [
  {
    id: 'room-1',
    name: 'R6028',
    building: 'Gedung Smart Campus 6',
    floor: 'Lantai 2',
    capacity: 25,
  },
  {
    id: 'room-2',
    name: 'R4417',
    building: 'Gedung Rektorat Lama',
    floor: 'Lantai 4',
    capacity: 20,
  },
  {
    id: 'room-3',
    name: 'LAB 6',
    building: 'Laboratorium Terpadu',
    floor: 'Lantai 3',
    capacity: 35,
  },
  {
    id: 'room-4',
    name: 'R5012',
    building: 'Gedung Smart Campus 5',
    floor: 'Lantai 1',
    capacity: 20,
  },
];

export const INITIAL_TIME_SLOTS: TimeSlot[] = [
  {
    id: 'slot-1',
    startTime: '09:15',
    endTime: '10:30',
    label: '09.15 - 10.30',
  },
  {
    id: 'slot-2',
    startTime: '10:30',
    endTime: '11:45',
    label: '10.30 - 11.45',
  },
  {
    id: 'slot-3',
    startTime: '13:00',
    endTime: '14:15',
    label: '13.00 - 14.15',
  },
  {
    id: 'slot-4',
    startTime: '14:15',
    endTime: '15:30',
    label: '14.15 - 15.30',
  },
];

export const INITIAL_LECTURERS: Lecturer[] = [
  {
    id: 'lec-1',
    name: 'Dian Dharmayanti, S.T., M.Kom.',
    nidn: '0412088501',
    department: 'Teknik Informatika',
    email: 'dian.dharmayanti@email.ac.id',
    code: 'DD',
  },
  {
    id: 'lec-2',
    name: 'Andri Heryandi, S.T., M.T.',
    nidn: '0420057802',
    department: 'Teknik Informatika',
    email: 'andri.heryandi@email.ac.id',
    code: 'AH',
  },
  {
    id: 'lec-3',
    name: 'Chrismikha Hardyanto, M.Kom.',
    nidn: '0415118903',
    department: 'Sistem Informasi',
    email: 'chrismikha.hardyanto@email.ac.id',
    code: 'CH',
  },
  {
    id: 'lec-4',
    name: 'Iskandar Ikbal, M.Kom.',
    nidn: '0403068201',
    department: 'Teknik Informatika',
    email: 'iskandar.ikbal@email.ac.id',
    code: 'II',
  },
  {
    id: 'lec-5',
    name: 'Sopian Alviana, M.Kom.',
    nidn: '0428098004',
    department: 'Teknik Informatika',
    email: 'sopian.alviana@email.ac.id',
    code: 'SA',
  },
  {
    id: 'lec-6',
    name: 'Angga Setiyadi, M.Kom., CITPM',
    nidn: '0419018402',
    department: 'Sistem Informasi',
    email: 'angga.setiyadi@email.ac.id',
    code: 'AS',
  },
  {
    id: 'lec-7',
    name: 'Dr. Marliana Budhiningtias, M.Si.',
    nidn: '0405027501',
    department: 'Teknik Informatika',
    email: 'marliana.b@email.ac.id',
    code: 'MB',
  },
  {
    id: 'lec-8',
    name: 'Taufiq Nurhadi, S.Kom., M.T.',
    nidn: '0423078802',
    department: 'Sistem Komputer',
    email: 'taufiq.nurhadi@email.ac.id',
    code: 'TN',
  },
];

export const INITIAL_SCHEDULE_ITEMS: ScheduleItem[] = [
  // ── HISTORICAL COMPLETED ITEMS (Periode 2024/2025 Genap - Arsip) ───────────
  {
    id: 'sch-091',
    nim: '10119001',
    studentName: 'ACHMAD FAUZAN',
    thesisTitle: 'Implementasi Algoritma K-Means Dalam Pengelompokan Data Penjualan Produk UKM',
    studyProgram: 'Teknik Informatika',
    academicYear: '2024/2025 Genap',
    academicPeriodId: 'prd-2024-genap',
    thesisType: 'Skripsi',
    reviewerName: 'Dian Dharmayanti, S.T., M.Kom.',
    advisorName: 'Andri Heryandi, S.T., M.T.',
    seminarScore: 89.0,
    examiner1Id: 'lec-1',
    examiner2Id: 'lec-2',
    examiner3Id: 'lec-3',
    date: '2025-02-20',
    timeSlotId: 'slot-1',
    roomId: 'room-1',
    status: 'completed',
    notes: 'Sidang selesai. Nilai kelulusan A. Naskah final telah disahkan perpustakaan.',
  },
  {
    id: 'sch-092',
    nim: '10119045',
    studentName: 'CITRA LESTARI DEWI',
    thesisTitle: 'Analisis Keamanan Jaringan Menggunakan Intrusion Detection System Berbasis Snort',
    studyProgram: 'Teknik Informatika',
    academicYear: '2024/2025 Genap',
    academicPeriodId: 'prd-2024-genap',
    thesisType: 'Skripsi',
    reviewerName: 'Iskandar Ikbal, M.Kom.',
    advisorName: 'Sopian Alviana, M.Kom.',
    seminarScore: 86.5,
    examiner1Id: 'lec-4',
    examiner2Id: 'lec-5',
    examiner3Id: 'lec-6',
    date: '2025-02-20',
    timeSlotId: 'slot-2',
    roomId: 'room-2',
    status: 'completed',
    notes: 'Sidang selesai. Telah menyelesaikan revisi penguji.',
  },

  // ── PERIODE AKTIF (2025/2026 Genap - Berjalan) ──────────────────────────────
  // Scheduled matching user's specific prompt example
  {
    id: 'sch-101',
    nim: '10120262',
    studentName: 'SHANIA NUR LUTHFIA',
    thesisTitle: 'Implementasi Algoritma Genetika Dalam Optimasi Penjadwalan Sidang Skripsi Berbasis Matriks',
    studyProgram: 'Teknik Informatika',
    academicYear: '2025/2026 Genap',
    academicPeriodId: 'prd-2025-genap',
    thesisType: 'Skripsi',
    activityType: 'sidang',
    isSeminarPassed: true,
    reviewerName: 'Dian Dharmayanti, S.T., M.Kom.',
    advisorName: 'Andri Heryandi, S.T., M.T.',
    seminarScore: 87.5,
    examiner1Id: 'lec-1', // Dian Dharmayanti (Reviewer -> Ketua Penguji)
    examiner2Id: 'lec-2', // Andri Heryandi (Pembimbing -> Penguji 2)
    examiner3Id: 'lec-3', // Chrismikha Hardyanto (Penguji 3 dipilih Admin)
    date: '2025-08-02',
    timeSlotId: 'slot-1', // 09.15 - 10.30
    roomId: 'room-1',     // R6028
    status: 'scheduled',
    notes: 'Draft skripsi lengkap, syarat bebas perpustakaan terverifikasi',
  },
  {
    id: 'sch-102',
    nim: '10120101',
    studentName: 'BUDI SANTOSO',
    thesisTitle: 'Rancang Bangun Sistem Presensi Mahasiswa Berbasis Pengenalan Wajah dengan CNN',
    studyProgram: 'Teknik Informatika',
    academicYear: '2025/2026 Genap',
    academicPeriodId: 'prd-2025-genap',
    thesisType: 'Skripsi',
    activityType: 'sidang',
    isSeminarPassed: true,
    reviewerName: 'Iskandar Ikbal, M.Kom.',
    advisorName: 'Sopian Alviana, M.Kom.',
    seminarScore: 85.0,
    examiner1Id: 'lec-4', // Reviewer -> Ketua Penguji
    examiner2Id: 'lec-5', // Pembimbing -> Penguji 2
    examiner3Id: 'lec-6', // Penguji 3 dipilih Admin
    date: '2025-08-02',
    timeSlotId: 'slot-1', // 09.15 - 10.30
    roomId: 'room-2',     // R4417
    status: 'scheduled',
    notes: 'Membutuhkan proyektor HDMI tambahan',
  },
  {
    id: 'sch-103',
    nim: '10120150',
    studentName: 'RENDY WIJAYA',
    thesisTitle: 'Analisis Sentimen Opini Publik Pada Platform X Terhadap Pemilu Menggunakan IndoBERT',
    studyProgram: 'Teknik Informatika',
    academicYear: '2025/2026 Genap',
    academicPeriodId: 'prd-2025-genap',
    thesisType: 'Skripsi',
    activityType: 'sidang',
    isSeminarPassed: true,
    reviewerName: 'Andri Heryandi, S.T., M.T.',
    advisorName: 'Iskandar Ikbal, M.Kom.',
    seminarScore: 88.5,
    examiner1Id: 'lec-2', // Reviewer -> Ketua Penguji
    examiner2Id: 'lec-4', // Pembimbing -> Penguji 2
    examiner3Id: 'lec-7', // Penguji 3 dipilih Admin
    date: '2025-08-02',
    timeSlotId: 'slot-2', // 10.30 - 11.45
    roomId: 'room-1',     // R6028
    status: 'scheduled',
    notes: 'Sudah mengumpulkan bukti uji plagiasi Turnitin 12%',
  },

  // Unassigned Queue Items (Ready to Drag & Drop / Assign Penguji 3)
  {
    id: 'sch-201',
    nim: '10120188',
    studentName: 'MUHAMMAD FADHIL ARIFIN',
    thesisTitle: 'Pengembangan Microservices Architecture Pada E-Commerce Menggunakan Docker & Kubernetes',
    studyProgram: 'Teknik Informatika',
    academicYear: '2025/2026 Genap',
    academicPeriodId: 'prd-2025-genap',
    thesisType: 'Skripsi',
    activityType: 'sidang',
    isSeminarPassed: true,
    reviewerName: 'Dian Dharmayanti, S.T., M.Kom.',
    advisorName: 'Sopian Alviana, M.Kom.',
    seminarScore: 86.0,
    examiner1Id: 'lec-1', // Reviewer -> Ketua Penguji
    examiner2Id: 'lec-5', // Pembimbing -> Penguji 2
    examiner3Id: 'lec-8', // Penguji 3 dipilih Admin
    date: '2025-08-02',
    timeSlotId: null,
    roomId: null,
    status: 'unassigned',
    notes: 'Persetujuan pembimbing lengkap',
  },
  {
    id: 'sch-202',
    nim: '10120204',
    studentName: 'ALIFAH SITI RAHMAWATI',
    thesisTitle: 'Klasifikasi Penyakit Daun Padi Menggunakan Arsitektur MobileNetV2 dan Transfer Learning',
    studyProgram: 'Teknik Informatika',
    academicYear: '2025/2026 Genap',
    academicPeriodId: 'prd-2025-genap',
    thesisType: 'Skripsi',
    activityType: 'sidang',
    isSeminarPassed: true,
    reviewerName: 'Chrismikha Hardyanto, M.Kom.',
    advisorName: 'Angga Setiyadi, M.Kom., CITPM',
    seminarScore: 89.0,
    examiner1Id: 'lec-3', // Reviewer -> Ketua Penguji
    examiner2Id: 'lec-6', // Pembimbing -> Penguji 2
    examiner3Id: 'lec-7', // Penguji 3 dipilih Admin
    date: '2025-08-02',
    timeSlotId: null,
    roomId: null,
    status: 'unassigned',
    notes: 'Sidang online/hybrid siap',
  },
  {
    id: 'sch-203',
    nim: '10120340',
    studentName: 'DIMAS ARYA PRATAMA',
    thesisTitle: 'Sistem Deteksi Intrusi Jaringan Berbasis Deep Learning Menggunakan Dataset CIC-IDS2017',
    studyProgram: 'Sistem Komputer',
    academicYear: '2025/2026 Genap',
    academicPeriodId: 'prd-2025-genap',
    thesisType: 'Tugas Akhir',
    activityType: 'sidang',
    isSeminarPassed: true,
    reviewerName: 'Andri Heryandi, S.T., M.T.',
    advisorName: 'Iskandar Ikbal, M.Kom.',
    seminarScore: 84.0,
    examiner1Id: 'lec-2', // Reviewer -> Ketua Penguji
    examiner2Id: 'lec-4', // Pembimbing -> Penguji 2
    examiner3Id: '',      // Belum dipilih Penguji 3 (Admin can assign based on availability!)
    date: '2025-08-02',
    timeSlotId: null,
    roomId: null,
    status: 'unassigned',
    notes: 'Perangkat demo switch & router disiapkan di lab',
  },
  {
    id: 'sch-204',
    nim: '10120095',
    studentName: 'KEVIN JONATHAN',
    thesisTitle: 'Implementasi Smart Contract Blockchain Ethereum untuk Verifikasi Ijazah Digital',
    studyProgram: 'Sistem Informasi',
    academicYear: '2025/2026 Genap',
    academicPeriodId: 'prd-2025-genap',
    thesisType: 'Skripsi',
    activityType: 'sidang',
    isSeminarPassed: true,
    reviewerName: 'Angga Setiyadi, M.Kom., CITPM',
    advisorName: 'Dian Dharmayanti, S.T., M.Kom.',
    seminarScore: 88.0,
    examiner1Id: 'lec-6', // Reviewer -> Ketua Penguji
    examiner2Id: 'lec-1', // Pembimbing -> Penguji 2
    examiner3Id: '',      // Belum dipilih Penguji 3
    date: '2025-08-02',
    timeSlotId: null,
    roomId: null,
    status: 'unassigned',
    notes: 'Siap uji coba transaksi testnet Sepolia',
  },
  {
    id: 'sch-205',
    nim: '10120412',
    studentName: 'NABILA PUTRI ANJANI',
    thesisTitle: 'Desain Pengalaman Pengguna (UI/UX) Aplikasi Telemedisin Lansia Menggunakan Metode Design Thinking',
    studyProgram: 'Sistem Informasi',
    academicYear: '2025/2026 Genap',
    academicPeriodId: 'prd-2025-genap',
    thesisType: 'Tugas Akhir',
    activityType: 'sidang',
    isSeminarPassed: true,
    reviewerName: 'Sopian Alviana, M.Kom.',
    advisorName: 'Dr. Marliana Budhiningtias, M.Si.',
    seminarScore: 90.0,
    examiner1Id: 'lec-5', // Reviewer -> Ketua Penguji
    examiner2Id: 'lec-7', // Pembimbing -> Penguji 2
    examiner3Id: '',      // Penguji 3 ditentukan hanya pada saat penjadwalan
    date: '2025-08-02',
    timeSlotId: null,
    roomId: null,
    status: 'unassigned',
    notes: 'Prototype Figma & hasil usability testing lengkap',
  },

  // ── KEGIATAN SEMINAR (Aturan Bisnis 2.1 - 2.4) ─────────────────────────────
  // 1. Seminar Terjadwal (Reviewer Dipilih Admin di Papan Jadwal, Pembimbing dari Penugasan)
  {
    id: 'sem-item-1',
    activityType: 'seminar',
    seminarRegistrationId: 'sem-reg-10121001',
    attemptNumber: 1,
    seminarStatus: 'terjadwal',
    seminarResult: 'belum_dinilai',
    nim: '10121001',
    studentName: 'FARHAN NURHIDAYAT',
    thesisTitle: 'Implementasi Arsitektur RAG (Retrieval-Augmented Generation) pada Sistem Tanya Jawab Akademik',
    studyProgram: 'Teknik Informatika',
    academicYear: '2025/2026 Genap',
    academicPeriodId: 'prd-2025-genap',
    thesisType: 'Skripsi',
    advisorName: 'Andri Heryandi, S.T., M.T.',
    examiner2Id: 'lec-2', // Pembimbing
    reviewerName: 'Dian Dharmayanti, S.T., M.Kom.',
    examiner1Id: 'lec-1', // Reviewer (Dipilih Admin pada Papan Jadwal)
    examiner3Id: '',      // Tidak ada Penguji 3 untuk Seminar
    date: '2025-08-02',
    timeSlotId: 'slot-2', // 10.30 - 11.45
    roomId: 'room-2',     // R4417
    status: 'scheduled',
    notes: 'Naskah seminar proposal BAB 1-3 lengkap dan telah disetujui pembimbing.',
  },

  // 2. Seminar Belum Terjadwal (Reviewer Belum Ditentukan oleh Admin)
  {
    id: 'sem-item-2',
    activityType: 'seminar',
    seminarRegistrationId: 'sem-reg-10121015',
    attemptNumber: 1,
    seminarStatus: 'terdaftar',
    seminarResult: 'belum_dinilai',
    nim: '10121015',
    studentName: 'ZAHRA AULIA RAHMAN',
    thesisTitle: 'Analisis Komparasi Model YOLOv8 dan YOLOv9 dalam Deteksi Kerusakan Jalan Raya',
    studyProgram: 'Teknik Informatika',
    academicYear: '2025/2026 Genap',
    academicPeriodId: 'prd-2025-genap',
    thesisType: 'Skripsi',
    advisorName: 'Iskandar Ikbal, M.Kom.',
    examiner2Id: 'lec-4', // Pembimbing
    reviewerName: undefined,
    examiner1Id: '',      // Belum ada Reviewer (Admin wajib memilih pada saat penjadwalan)
    examiner3Id: '',
    date: '2025-08-02',
    timeSlotId: null,
    roomId: null,
    status: 'unassigned',
    notes: 'Pendaftaran seminar baru. Menunggu admin menentukan Dosen Reviewer di Papan Jadwal.',
  },

  // 3. Seminar Penjadwalan Ulang (same_schedule & cross_period: Percobaan ke-2 setelah Percobaan ke-1 Belum Lulus)
  {
    id: 'sem-item-3',
    activityType: 'seminar',
    seminarRegistrationId: 'sem-reg-10121088',
    attemptNumber: 2,
    seminarStatus: 'terdaftar',
    seminarResult: 'belum_dinilai',
    nim: '10121088',
    studentName: 'GILANG RAMADHAN',
    thesisTitle: 'Implementasi Algoritma Q-Learning pada Agen Navigasi Robot Pembersih Lantai',
    studyProgram: 'Teknik Informatika',
    academicYear: '2025/2026 Genap',
    academicPeriodId: 'prd-2025-genap',
    thesisType: 'Skripsi',
    advisorName: 'Sopian Alviana, M.Kom.',
    examiner2Id: 'lec-5', // Pembimbing
    reviewerName: 'Chrismikha Hardyanto, M.Kom.',
    examiner1Id: 'lec-3', // Reviewer
    examiner3Id: '',
    date: '2025-08-02',
    timeSlotId: null,
    roomId: null,
    status: 'unassigned',
    notes: 'Penjadwalan ulang seminar (Percobaan ke-2). Riwayat pelaksanaan sebelumnya tetap tersimpan utuh.',
    seminarHistory: [
      {
        attemptNumber: 1,
        date: '2025-01-18',
        timeSlotId: 'slot-3',
        roomId: 'room-1',
        reviewerId: 'lec-3',
        reviewerName: 'Chrismikha Hardyanto, M.Kom.',
        advisorId: 'lec-5',
        advisorName: 'Sopian Alviana, M.Kom.',
        score: 58.0,
        result: 'belum_lulus',
        feedback: 'Kajian pustaka dan formulasi reward function algoritma Q-Learning belum matang. Diwajibkan seminar ulang.',
        evaluatedAt: '2025-01-18T14:30:00Z',
        evaluatedBy: 'Chrismikha Hardyanto, M.Kom.',
        academicPeriodId: 'prd-2025-ganjil',
        academicYear: '2025/2026 Ganjil',
      },
    ],
  },
];

export const AVAILABLE_DATES = [
  { value: '2025-08-02', label: 'Sabtu, 2 Agustus 2025 (Gelombang 1)', shortLabel: '2 Agu 2025' },
  { value: '2025-08-04', label: 'Senin, 4 Agustus 2025 (Gelombang 2)', shortLabel: '4 Agu 2025' },
  { value: '2025-08-05', label: 'Selasa, 5 Agustus 2025 (Gelombang 3)', shortLabel: '5 Agu 2025' },
];
