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

export interface PengajuanSidangRecord {
  id: string;
  mahasiswa_nim: string;
  periode_akademik_id: string; // Foreign Key ke PeriodeAkademikRecord
  judul_skripsi: string;
  jenis: 'Skripsi' | 'Tugas Akhir';
  dosen_reviewer_id: string;  // P1 (Ketua Penguji)
  dosen_pembimbing_id: string; // P2 (Penguji 2)
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
  pengajuan_id: string;
  tanggal: string; // YYYY-MM-DD
  slot_waktu_id: string;
  ruangan_id: string;
  status: 'scheduled' | 'ongoing' | 'completed' | 'cancelled';
  completed_at?: string;       // Timestamp saat sidang dinyatakan selesai
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
    pengajuan_sidang: number;
    jadwal_sidang: number;
    pengguna: number;
  };
  completedLockedCount: number; // Jumlah sidang selesai yang terkunci permanen
  violations: string[];
}
