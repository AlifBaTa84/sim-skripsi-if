export type UserRole = 'admin' | 'dosen' | 'mahasiswa';

export interface Lecturer {
  id: string;
  name: string;
  nidn: string;
  department: string;
  email: string;
  code: string;
  photoUrl?: string; // URL foto profil dosen (base64 data URL atau path)
}

export interface Room {
  id: string;
  name: string;
  building: string;
  floor: string;
  capacity: number;
}

export interface TimeSlot {
  id: string;
  startTime: string; // e.g. "09:15"
  endTime: string;   // e.g. "10:30"
  label: string;     // e.g. "09.15 - 10.30"
}

export interface AcademicPeriod {
  id: string;
  academicYear: string; // e.g. "2026/2027"
  semester: 'Ganjil' | 'Genap';
  startDate?: string;   // YYYY-MM-DD
  endDate?: string;     // YYYY-MM-DD
  isActive: boolean;
  status: 'persiapan' | 'berjalan' | 'selesai';
  createdAt?: string;
  updatedAt?: string;
}

export type ActivityType = 'seminar' | 'sidang';

export type SeminarRegistrationStatus = 'terdaftar' | 'terjadwal' | 'dalam_proses' | 'selesai' | 'dibatalkan';

export type SeminarExecutionStatus = 'unassigned' | 'scheduled' | 'completed' | 'cancelled';

export type SeminarResult = 'belum_dinilai' | 'lulus' | 'belum_lulus';

export interface SeminarHistoryItem {
  id?: string;
  attemptNumber: number;          // Pelaksanaan ke-1, ke-2, ke-3...
  date: string;
  timeSlotId: string | null;
  roomId: string | null;
  reviewerId: string;
  reviewerName: string;
  advisorId: string;
  advisorName: string;
  score?: number;
  result: SeminarResult;
  feedback?: string;
  evaluatedAt?: string;
  evaluatedBy?: string;
  academicPeriodId: string;
  academicYear: string;
}

export interface ScheduleItem {
  id: string;
  nim: string;
  studentName: string;
  thesisTitle: string;
  studyProgram: string;
  academicYear: string;
  academicPeriodId?: string;    // Relasi FK ke Periode Akademik aktif/historis
  thesisType?: string;          // e.g. 'Skripsi' | 'Tugas Akhir' (dari kolom Jenis)
  
  // Jenis Kegiatan: 'seminar' atau 'sidang' (default 'sidang')
  activityType?: ActivityType;
  
  // Seminar Specific Properties (Decision 2.1 & 2.2)
  seminarRegistrationId?: string;
  attemptNumber?: number;             // Pelaksanaan ke-N pada pendaftaran yang sama (same_schedule)
  seminarStatus?: SeminarRegistrationStatus;
  seminarResult?: SeminarResult;      // 'belum_dinilai' | 'lulus' | 'belum_lulus'
  seminarHistory?: SeminarHistoryItem[]; // Riwayat pelaksanaan sebelumnya tetap tersimpan
  isSeminarPassed?: boolean;          // Status sah kelayakan mengikuti Sidang (Syarat Wajib Sidang)
  
  // Examiners:
  // - Pada Seminar: examiner1Id = Reviewer (Dipilih Admin pada Papan Jadwal), examiner2Id = Pembimbing, examiner3Id = '' (Tidak ada P3)
  // - Pada Sidang: examiner1Id = Ketua Penguji (Terkunci dari Reviewer Seminar Lulus), examiner2Id = Pembimbing Seminar, examiner3Id = Ditentukan Admin
  advisorName?: string;         // Dosen Pembimbing (Seminar & Sidang)
  reviewerName?: string;        // Dosen Reviewer (Ketua Penguji)
  seminarScore?: string | number; // Nilai Seminar Proposal/Kemajuan
  examiner1Id: string;          // Reviewer (Seminar) / Ketua Penguji (Sidang)
  examiner2Id: string;          // Pembimbing (Seminar & Sidang)
  examiner3Id: string;          // Penguji 3 (Hanya Sidang, Seminar kosong)
  date: string;                 // YYYY-MM-DD
  timeSlotId: string | null;
  roomId: string | null;
  status: 'unassigned' | 'scheduled' | 'completed';
  notes?: string;
}

export interface ImportedStudentRow {
  nim: string;
  nama: string;
  judul: string;
  jenis: string;
  dosenPembimbing: string;
  dosenReviewer?: string;       // Opsional pada Impor Seminar
  nilaiSeminar?: string | number;
  activityType?: ActivityType;
  matchedAdvisorId?: string;
  matchedReviewerId?: string;
  selectedExaminer3Id?: string;
  isValid: boolean;
  validationErrors: string[];
}

export interface ConflictCheckResult {
  hasConflict: boolean;
  reasons: string[];
  conflictType?: 'room_busy' | 'examiner1_busy' | 'examiner2_busy' | 'examiner3_busy' | 'student_busy';
  details?: {
    lecturerName?: string;
    existingStudent?: string;
    existingRoom?: string;
  }[];
}

export interface FilterState {
  searchQuery: string;
  selectedDate: string;
  selectedRoomId: string;
  selectedLecturerId: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  roles: UserRole[];       // Mendukung peran ganda, misal: ['dosen', 'admin']
  activeRole: UserRole;    // Peran aktif yang sedang digunakan
  lecturerId?: string;     // ID relasi ke Dosen jika akun dosen
  studentNim?: string;     // NIM relasi ke Mahasiswa jika akun mahasiswa
  department?: string;
  avatarUrl?: string;
}

export interface PasswordValidationResult {
  isValid: boolean;
  hasMinLength: boolean; // Minimal 8 karakter
  hasUppercase: boolean; // Huruf besar (A-Z)
  hasLowercase: boolean; // Huruf kecil (a-z)
  hasSymbol: boolean;    // Simbol (!@#$%^&*...)
  errors: string[];
}
