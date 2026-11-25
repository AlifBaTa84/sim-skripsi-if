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

export interface ScheduleItem {
  id: string;
  nim: string;
  studentName: string;
  thesisTitle: string;
  studyProgram: string;
  academicYear: string;
  academicPeriodId?: string;    // Relasi FK ke Periode Akademik aktif/historis
  thesisType?: string;          // e.g. 'Skripsi' | 'Tugas Akhir' (dari kolom Jenis)
  advisorName?: string;         // Dosen Pembimbing (menjadi Penguji 2)
  reviewerName?: string;        // Dosen Reviewer (menjadi Ketua Penguji)
  seminarScore?: string | number; // Nilai Seminar Proposal/Kemajuan
  examiner1Id: string;          // Ketua Penguji (Dosen Reviewer)
  examiner2Id: string;          // Penguji 2 (Dosen Pembimbing)
  examiner3Id: string;          // Penguji 3 (Dipilih admin berdasarkan ketersediaan waktu bebas bentrok)
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
  dosenReviewer: string;
  nilaiSeminar: string | number;
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
