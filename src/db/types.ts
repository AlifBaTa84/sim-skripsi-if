/**
 * SISTEM INFORMASI MANAJEMEN SIDANG SKRIPSI (SIM-SIDANG)
 * Definisi Model Basis Data Relasional
 */

export interface DosenRecord {
  id: string;
  nidn: string;
  nama: string;
  kode: string;
  program_studi: string;
  email: string;
  foto_url?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface MahasiswaRecord {
  nim: string;
  nama: string;
  program_studi: string;
  tahun_akademik: string;
  email?: string;
  no_telepon?: string;
  created_at: string;
  updated_at: string;
}

export interface RuanganRecord {
  id: string;
  nama: string;
  gedung: string;
  lantai: string;
  kapasitas: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SlotWaktuRecord {
  id: string;
  jam_mulai: string;
  jam_selesai: string;
  label: string;
  urutan: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PeriodeAkademikRecord {
  id: string;
  tahun_akademik: string;
  semester: 'Ganjil' | 'Genap';
  tanggal_mulai?: string;
  tanggal_selesai?: string;
  is_active: boolean;
  status: 'persiapan' | 'berjalan' | 'selesai';
  created_at: string;
  updated_at: string;
}

/**
 * Pendaftaran Seminar (Aturan Bisnis 2.1 & 2.2: same_schedule)
 * Satu pendaftaran seminar mewadahi satu atau lebih pelaksanaan seminar
 */
export interface PendaftaranSeminarRecord {
  id: string;
  mahasiswa_nim: string;
  periode_akademik_id: string; // Periode akademik awal pendaftaran
  judul_penelitian: string;
  jenis: 'Skripsi' | 'Tugas Akhir';
  dosen_pembimbing_id: string; // Dosen Pembimbing (dari impor/penugasan)
  status: 'terdaftar' | 'terjadwal' | 'selesai' | 'dibatalkan';
  status_kelulusan: 'belum_seminar' | 'lulus' | 'belum_lulus';
  pelaksanaan_terakhir_ke: number;
  nilai_akhir?: number;
  created_at: string;
  updated_at: string;
}

/**
 * Riwayat Pelaksanaan Seminar (Setiap percobaan pelaksanaan tercatat mandiri)
 * Mendukung Aturan Bisnis 2.3: cross_period (periode_akademik_id bisa berbeda tiap percobaan)
 */
export interface PelaksanaanSeminarRecord {
  id: string;
  pendaftaran_seminar_id: string; // Relasi ke pendaftaran seminar yang sama
  pelaksanaan_ke: number;         // 1, 2, 3...
  periode_akademik_id: string;    // Periode akademik saat pelaksanaan ini berlangsung
  dosen_reviewer_id?: string;     // Dipilih Admin pada Papan Jadwal (bukan dari impor)
  dosen_pembimbing_id: string;    // Diambil dari pendaftaran seminar
  tanggal?: string;               // YYYY-MM-DD
  slot_waktu_id?: string;
  ruangan_id?: string;
  status_pelaksanaan: 'unassigned' | 'scheduled' | 'ongoing' | 'completed' | 'cancelled';
  hasil: 'belum_dinilai' | 'lulus' | 'belum_lulus';
  nilai?: number;
  catatan_revisi?: string;
  evaluated_at?: string;
  evaluated_by?: string;
  created_at: string;
  updated_at: string;
}

export interface PengajuanSidangRecord {
  id: string;
  mahasiswa_nim: string;
  periode_akademik_id: string; // Foreign Key ke PeriodeAkademikRecord
  pendaftaran_seminar_id?: string; // Foreign Key ke PendaftaranSeminarRecord (Syarat Wajib Sidang)
  pelaksanaan_seminar_id?: string; // Relasi ke riwayat pelaksanaan seminar yang lulus
  judul_skripsi: string;
  jenis: 'Skripsi' | 'Tugas Akhir';
  dosen_reviewer_id: string;  // P1 (Ketua Penguji - Terkunci dari Reviewer Seminar Lulus)
  dosen_pembimbing_id: string; // P2 (Penguji 2 - Terkunci dari Pembimbing Seminar)
  dosen_penguji3_id?: string;  // P3 (Penguji 3 - ditentukan hanya pada saat penjadwalan)
  nilai_seminar?: number;
  status: 'unassigned' | 'scheduled' | 'completed' | 'cancelled';
  catatan?: string;
  completed_at?: string;       // Timestamp saat sidang dinyatakan selesai (data terkunci permanen)
  created_at: string;
  updated_at: string;
}

export interface JadwalSidangRecord {
  id: string;
  jenis_kegiatan?: 'seminar' | 'sidang'; // Default 'sidang' untuk backward compatibility
  pengajuan_id: string;                  // ID pengajuan sidang atau pelaksanaan seminar
  pelaksanaan_seminar_id?: string;       // ID khusus pelaksanaan seminar jika kegiatan seminar
  tanggal: string; // YYYY-MM-DD
  slot_waktu_id: string;
  ruangan_id: string;
  status: 'scheduled' | 'ongoing' | 'completed' | 'cancelled';
  completed_at?: string;       // Timestamp saat kegiatan dinyatakan selesai
  created_at: string;
  updated_at: string;
}

/**
 * Entitas Pengguna & Kredensial Otentikasi Berdasarkan Role
 * - Role 'admin' & 'dosen': Password Wajib disimpan di database (password_required: true, password_hash terisi)
 * - Role 'mahasiswa': Password Tidak Perlu disimpan permanen di database pengguna
 *   (Otentikasi diturunkan langsung dari tabel Mahasiswa via NIM, menghindari redundansi data saat impor massal)
 */
export interface PenggunaRecord {
  id: string;
  email: string;
  nama: string;
  roles: ('admin' | 'dosen' | 'mahasiswa')[];
  role_utama: 'admin' | 'dosen' | 'mahasiswa';
  password_hash?: string;       // Disimpan untuk admin & dosen; opsional untuk mahasiswa jika pernah ubah password
  password_required: boolean;   // true: admin & dosen; false: mahasiswa (dinamis by NIM)
  lecturer_id?: string;         // Relasi FK ke tabel Dosen
  student_nim?: string;         // Relasi FK ke tabel Mahasiswa
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface DatabaseDump {
  version: number;
  exported_at: string;
  periode_akademik: PeriodeAkademikRecord[];
  dosen: DosenRecord[];
  mahasiswa: MahasiswaRecord[];
  ruangan: RuanganRecord[];
  slot_waktu: SlotWaktuRecord[];
  pendaftaran_seminar?: PendaftaranSeminarRecord[];
  pelaksanaan_seminar?: PelaksanaanSeminarRecord[];
  pengajuan_sidang: PengajuanSidangRecord[];
  jadwal_sidang: JadwalSidangRecord[];
  pengguna: PenggunaRecord[];
}

export interface DatabaseIntegrityReport {
  isValid: boolean;
  totalRecords: {
    periode_akademik: number;
    dosen: number;
    mahasiswa: number;
    ruangan: number;
    slot_waktu: number;
    pendaftaran_seminar: number;
    pelaksanaan_seminar: number;
    pengajuan_sidang: number;
    jadwal_sidang: number;
    pengguna: number;
  };
  completedLockedCount: number; // Jumlah sidang selesai yang terkunci permanen
  violations: string[];
}
