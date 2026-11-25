/**
 * SISTEM INFORMASI MANAJEMEN SIDANG SKRIPSI (SIM-SIDANG)
 * AuthContext: Manajemen Sesi, RBAC, dan Multi-Peran (Dosen + Admin)
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, UserRole, ScheduleItem, Lecturer } from '../types';
import { validatePassword, validateCaptcha } from '../utils/authValidator';
import { INITIAL_LECTURERS, INITIAL_SCHEDULE_ITEMS } from '../data/mockData';

export interface DemoAccount {
  label: string;
  roleBadge: string;
  email: string;
  password: string;
  description: string;
  roles: UserRole[];
}

export const DEMO_ACCOUNTS: DemoAccount[] = [
  {
    label: 'Dosen & Admin (Multi-Peran)',
    roleBadge: 'Dosen + Admin',
    email: 'dian.dharmayanti@email.ac.id',
    password: 'Dosen#2025',
    description: 'Dosen Penguji 1 sekaligus Panitia Sidang (Bisa beralih peran bebas)',
    roles: ['dosen', 'admin'],
  },
  {
    label: 'Administrator Utama',
    roleBadge: 'Admin Only',
    email: 'admin@simsidang.ac.id',
    password: 'Admin#2025',
    description: 'Akses penuh jadwal matriks, kelola ruangan & slot waktu',
    roles: ['admin'],
  },
  {
    label: 'Dosen Penguji',
    roleBadge: 'Dosen Only',
    email: 'andri.heryandi@email.ac.id',
    password: 'Dosen#2025',
    description: 'Akses jadwal personal dan jadwal lengkap (Read-Only)',
    roles: ['dosen'],
  },
  {
    label: 'Mahasiswa Peserta Sidang',
    roleBadge: 'Mahasiswa',
    email: '10120262@mahasiswa.ac.id',
    password: 'Mhs#10120262',
    description: 'Melihat jadwal pribadi dan cetak 3 slip label draft skripsi',
    roles: ['mahasiswa'],
  },
];

// Seed users database
export interface StoredUser extends User {
  passwordHash: string;
}

const INITIAL_USERS: StoredUser[] = [
  {
    id: 'usr-1',
    name: 'Dian Dharmayanti, S.T., M.Kom.',
    email: 'dian.dharmayanti@email.ac.id',
    passwordHash: 'Dosen#2025',
    roles: ['dosen', 'admin'],
    activeRole: 'admin',
    lecturerId: 'lec-1',
    department: 'Teknik Informatika',
  },
  {
    id: 'usr-2',
    name: 'Administrator Panitia Sidang',
    email: 'admin@simsidang.ac.id',
    passwordHash: 'Admin#2025',
    roles: ['admin'],
    activeRole: 'admin',
    department: 'Biro Administrasi Akademik',
  },
  {
    id: 'usr-3',
    name: 'Andri Heryandi, S.T., M.T.',
    email: 'andri.heryandi@email.ac.id',
    passwordHash: 'Dosen#2025',
    roles: ['dosen'],
    activeRole: 'dosen',
    lecturerId: 'lec-2',
    department: 'Teknik Informatika',
  },
  {
    id: 'usr-4',
    name: 'Chrismikha Hardyanto, M.Kom.',
    email: 'chrismikha.hardyanto@email.ac.id',
    passwordHash: 'Dosen#2025',
    roles: ['dosen'],
    activeRole: 'dosen',
    lecturerId: 'lec-3',
    department: 'Teknik Informatika',
  },
  {
    id: 'usr-5',
    name: 'SHANIA NUR LUTHFIA',
    email: '10120262@mahasiswa.ac.id',
    passwordHash: 'Mhs#10120262',
    roles: ['mahasiswa'],
    activeRole: 'mahasiswa',
    studentNim: '10120262',
    department: 'Teknik Informatika',
  },
  {
    id: 'usr-6',
    name: 'NURUL AMALIA',
    email: '10120264@mahasiswa.ac.id',
    passwordHash: 'Mhs#10120264',
    roles: ['mahasiswa'],
    activeRole: 'mahasiswa',
    studentNim: '10120264',
    department: 'Teknik Informatika',
  },
];

const AUTH_STORAGE_KEY = 'sim_sidang_auth_user_v2';

interface AuthContextType {
  currentUser: User | null;
  isAuthenticated: boolean;
  isMainAdmin: boolean; // Administrator Utama murni (bukan dual role dengan dosen)
  login: (
    email: string,
    password: string,
    captchaInput: string,
    expectedCaptcha: string
  ) => { success: boolean; error?: string };
  logout: () => void;
  switchActiveRole: (newRole: UserRole) => boolean;
  updatePassword: (
    currentPassword: string,
    newPassword: string
  ) => { success: boolean; error?: string };
  resetUserPassword: (
    targetIdentifier: string,
    newPassword?: string
  ) => { success: boolean; error?: string; resetPassword?: string; targetName?: string };
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem(AUTH_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (
          parsed &&
          typeof parsed === 'object' &&
          parsed.email &&
          Array.isArray(parsed.roles) &&
          parsed.roles.length > 0 &&
          parsed.activeRole
        ) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Failed to parse saved user', e);
    }
    // Default: null (harus login terlebih dahulu)
    return null;
  });

  // Simpan status otentikasi saat user berubah
  useEffect(() => {
    try {
      if (currentUser) {
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(currentUser));
      } else {
        localStorage.removeItem(AUTH_STORAGE_KEY);
      }
    } catch (e) {
      console.error('Failed to sync auth state', e);
    }
  }, [currentUser]);

  /**
   * Helper pencarian akun terpadu (memeriksa registered users, initial users,
   * antrean mahasiswa dinamis, dan master data dosen dinamis).
   */
  const findUserAccount = (identifier: string): StoredUser | null => {
    const inputClean = identifier.trim().toLowerCase();

    // a. Muat pengguna tersimpan dari localStorage jika ada
    let registeredUsers: StoredUser[] = [];
    try {
      const storedUsersRaw = localStorage.getItem('sim_sidang_registered_users_v2');
      if (storedUsersRaw) {
        const parsed = JSON.parse(storedUsersRaw);
        if (Array.isArray(parsed)) {
          registeredUsers = parsed;
        }
      }
    } catch (e) {
      console.error('Failed to parse registered users', e);
    }

    // Cari dari akun terdaftar (prioritas tertinggi: akun yang sudah disesuaikan/diupdate passwordnya)
    const registered = registeredUsers.find(
      (u) =>
        u.email.toLowerCase() === inputClean ||
        (u.studentNim && u.studentNim.toLowerCase() === inputClean)
    );
    if (registered) return registered;

    // b. Cari di daftar seed INITIAL_USERS
    const initial = INITIAL_USERS.find(
      (u) =>
        u.email.toLowerCase() === inputClean ||
        (u.studentNim && u.studentNim.toLowerCase() === inputClean)
    );
    if (initial) return initial;

    // c. Cari apakah merupakan mahasiswa yang terdaftar di jadwal/antrean
    let schedulesList: ScheduleItem[] = INITIAL_SCHEDULE_ITEMS;
    try {
      const savedSchedules = localStorage.getItem('sim_sidang_schedules_v2');
      if (savedSchedules) {
        schedulesList = JSON.parse(savedSchedules);
      }
    } catch (e) {
      console.error(e);
    }

    const matchedStudent = schedulesList.find(
      (s) =>
        s.nim.toLowerCase() === inputClean ||
        `${s.nim.toLowerCase()}@mahasiswa.ac.id` === inputClean
    );

    if (matchedStudent) {
      return {
        id: `usr-mhs-${matchedStudent.nim}`,
        name: matchedStudent.studentName,
        email: `${matchedStudent.nim}@mahasiswa.ac.id`,
        passwordHash: `Mhs#${matchedStudent.nim}`,
        roles: ['mahasiswa'],
        activeRole: 'mahasiswa',
        studentNim: matchedStudent.nim,
        department: matchedStudent.studyProgram,
      };
    }

    // d. Cari apakah merupakan dosen di master data (membaca localStorage dinamis, fallback ke INITIAL_LECTURERS)
    let lecturersList: Lecturer[] = INITIAL_LECTURERS;
    try {
      const savedLecturers = localStorage.getItem('sim_sidang_lecturers_v2');
      if (savedLecturers) {
        const parsedLec = JSON.parse(savedLecturers);
        if (Array.isArray(parsedLec) && parsedLec.length > 0) {
          lecturersList = parsedLec;
        }
      }
    } catch (e) {
      console.error('Failed to parse lecturers from storage', e);
    }

    const matchedLecturer = lecturersList.find(
      (l) =>
        (l.email && l.email.toLowerCase() === inputClean) ||
        (l.email && l.email.toLowerCase().replace('@univ.ac.id', '@email.ac.id') === inputClean) ||
        (l.code && l.code.toLowerCase() === inputClean) ||
        (l.nidn && l.nidn.toLowerCase() === inputClean)
    );

    if (matchedLecturer) {
      const email = matchedLecturer.email || `${matchedLecturer.code.toLowerCase()}@univ.ac.id`;
      const isDualAdmin = email.includes('ahmad.fauzi') || matchedLecturer.name.includes('Ahmad Fauzi');
      const roles: UserRole[] = isDualAdmin ? ['admin', 'dosen'] : ['dosen'];

      return {
        id: `usr-lec-${matchedLecturer.id}`,
        name: matchedLecturer.name,
        email: email,
        passwordHash: 'Dosen#2025',
        roles: roles,
        activeRole: isDualAdmin ? 'admin' : 'dosen',
        lecturerId: matchedLecturer.id,
        department: matchedLecturer.department,
      };
    }

    return null;
  };

  /**
   * Login handler dengan verifikasi:
   * 1. Validasi format email & password
   * 2. Validasi aturan password (8 karakter, huruf besar, huruf kecil, simbol)
   * 3. Validasi Captcha
   * 4. Verifikasi kecocokan kredensial
   */
  const login = useCallback(
    (
      email: string,
      password: string,
      captchaInput: string,
      expectedCaptcha: string
    ): { success: boolean; error?: string } => {
      // 1. Cek isian wajib
      if (!email.trim() || !password) {
        return { success: false, error: 'Email dan password wajib diisi.' };
      }

      // 2. Cek Captcha
      if (!validateCaptcha(captchaInput, expectedCaptcha)) {
        return { success: false, error: 'Kode Captcha salah atau tidak sesuai. Silakan coba lagi.' };
      }

      // 3. Validasi Aturan Password (Minimal 8 karakter, huruf besar, kecil, simbol)
      const pwdCheck = validatePassword(password);
      if (!pwdCheck.isValid) {
        return {
          success: false,
          error: `Kebijakan Keamanan: ${pwdCheck.errors.join(', ')}.`,
        };
      }

      // 4. Cari akun pengguna
      const user = findUserAccount(email);

      if (!user) {
        return { 
          success: false, 
          error: 'Akun dengan alamat email atau NIM ini tidak terdaftar. Pastikan data sudah ditambahkan di Data Master.' 
        };
      }

      if (user.passwordHash !== password) {
        return { success: false, error: 'Password yang Anda masukkan salah.' };
      }

      // 5. Berhasil Login - jika multi-role (misal dosen + admin), default role pertama
      const activeRole = user.roles.includes('admin') ? 'admin' : user.roles[0];

      const loggedInUser: User = {
        id: user.id,
        name: user.name,
        email: user.email,
        roles: user.roles,
        activeRole,
        lecturerId: user.lecturerId,
        studentNim: user.studentNim,
        department: user.department,
      };

      setCurrentUser(loggedInUser);
      return { success: true };
    },
    []
  );

  /**
   * Update Password handler:
   * Mengizinkan pengguna aktif (Admin, Dosen, Mahasiswa) memperbarui password-nya sendiri.
   */
  const updatePassword = useCallback(
    (
      currentPassword: string,
      newPassword: string
    ): { success: boolean; error?: string } => {
      if (!currentUser) {
        return { success: false, error: 'Sesi pengguna tidak valid. Silakan login kembali.' };
      }

      if (!currentPassword || !newPassword) {
        return { success: false, error: 'Password saat ini dan password baru wajib diisi.' };
      }

      // Cari akun pengguna
      const user = findUserAccount(currentUser.email);
      if (!user) {
        return { success: false, error: 'Akun pengguna tidak ditemukan di sistem.' };
      }

      // Verifikasi password saat ini
      if (user.passwordHash !== currentPassword) {
        return { success: false, error: 'Password saat ini yang Anda masukkan salah.' };
      }

      // Password baru tidak boleh sama dengan password saat ini
      if (currentPassword === newPassword) {
        return { success: false, error: 'Password baru tidak boleh sama dengan password saat ini.' };
      }

      // Validasi kebijakan keamanan password baru
      const pwdCheck = validatePassword(newPassword);
      if (!pwdCheck.isValid) {
        return {
          success: false,
          error: `Kebijakan Keamanan: ${pwdCheck.errors.join(', ')}.`,
        };
      }

      // Simpan pembaruan ke localStorage (sim_sidang_registered_users_v2)
      try {
        let storedUsers: StoredUser[] = [];
        const raw = localStorage.getItem('sim_sidang_registered_users_v2');
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            storedUsers = parsed;
          }
        }

        const updatedUser: StoredUser = {
          ...user,
          passwordHash: newPassword,
        };

        const existingIdx = storedUsers.findIndex(
          (u) => u.email.toLowerCase() === user.email.toLowerCase()
        );

        if (existingIdx >= 0) {
          storedUsers[existingIdx] = updatedUser;
        } else {
          storedUsers.push(updatedUser);
        }

        localStorage.setItem('sim_sidang_registered_users_v2', JSON.stringify(storedUsers));
        return { success: true };
      } catch (err) {
        console.error('Failed to save updated password', err);
        return { success: false, error: 'Gagal menyimpan password baru ke penyimpanan lokal.' };
      }
    },
    [currentUser]
  );

  /**
   * Logout handler
   */
  const logout = useCallback(() => {
    setCurrentUser(null);
  }, []);

  /**
   * Beralih peran (Switch Role) bagi pengguna yang memiliki lebih dari 1 peran (misal Dosen yang juga Admin)
   */
  const switchActiveRole = useCallback(
    (newRole: UserRole): boolean => {
      if (!currentUser) return false;
      if (!Array.isArray(currentUser.roles) || !currentUser.roles.includes(newRole)) {
        console.warn(`User ${currentUser.email} tidak memiliki hak akses untuk peran ${newRole}`);
        return false;
      }

      setCurrentUser((prev) => (prev ? { ...prev, activeRole: newRole } : null));
      return true;
    },
    [currentUser]
  );

  // Otoritas Administrator (Admin Utama maupun Admin yang juga Dosen)
  const isMainAdmin = Boolean(
    currentUser &&
    Array.isArray(currentUser.roles) &&
    currentUser.roles.includes('admin')
  );

  /**
   * Reset User Password handler:
   * Dapat dieksekusi oleh Administrator.
   * Dapat mereset password Dosen maupun Mahasiswa.
   */
  const resetUserPassword = useCallback(
    (
      targetIdentifier: string,
      customNewPassword?: string
    ): { success: boolean; error?: string; resetPassword?: string; targetName?: string } => {
      // 1. Otorisasi: Administrator
      if (
        !currentUser ||
        !Array.isArray(currentUser.roles) ||
        !currentUser.roles.includes('admin')
      ) {
        return {
          success: false,
          error: 'Akses Ditolak: Hanya pengguna dengan peran Administrator yang memiliki otoritas untuk mereset kata sandi.',
        };
      }

      if (!targetIdentifier.trim()) {
        return { success: false, error: 'Identitas pengguna sasaran (Email/NIM) wajib ditentukan.' };
      }

      // 2. Cari akun sasaran
      const targetUser = findUserAccount(targetIdentifier);
      if (!targetUser) {
        return { success: false, error: 'Pengguna yang dimaksud tidak ditemukan di sistem.' };
      }

      // 3. Tentukan password baru
      let finalPassword = '';
      if (customNewPassword && customNewPassword.trim()) {
        const pwdCheck = validatePassword(customNewPassword.trim());
        if (!pwdCheck.isValid) {
          return {
            success: false,
            error: `Kebijakan Keamanan: ${pwdCheck.errors.join(', ')}.`,
          };
        }
        finalPassword = customNewPassword.trim();
      } else {
        // Default reset password berdasarkan role sasaran:
        if (targetUser.roles.includes('mahasiswa')) {
          finalPassword = targetUser.studentNim ? `Mhs#${targetUser.studentNim}` : 'Mhs#2025';
        } else if (targetUser.roles.includes('admin') && !targetUser.roles.includes('dosen')) {
          finalPassword = 'Admin#2025';
        } else {
          finalPassword = 'Dosen#2025';
        }
      }

      // 4. Simpan ke database persisten localStorage
      try {
        let storedUsers: StoredUser[] = [];
        const raw = localStorage.getItem('sim_sidang_registered_users_v2');
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            storedUsers = parsed;
          }
        }

        const updatedTarget: StoredUser = {
          ...targetUser,
          passwordHash: finalPassword,
        };

        const existingIdx = storedUsers.findIndex(
          (u) =>
            u.email.toLowerCase() === targetUser.email.toLowerCase() ||
            (u.studentNim && targetUser.studentNim && u.studentNim.toLowerCase() === targetUser.studentNim.toLowerCase())
        );

        if (existingIdx >= 0) {
          storedUsers[existingIdx] = updatedTarget;
        } else {
          storedUsers.push(updatedTarget);
        }

        localStorage.setItem('sim_sidang_registered_users_v2', JSON.stringify(storedUsers));

        return {
          success: true,
          resetPassword: finalPassword,
          targetName: targetUser.name,
        };
      } catch (err) {
        console.error('Failed to reset user password', err);
        return { success: false, error: 'Gagal menyimpan reset password ke penyimpanan data.' };
      }
    },
    [currentUser]
  );

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isAuthenticated: !!currentUser,
        isMainAdmin,
        login,
        logout,
        switchActiveRole,
        updatePassword,
        resetUserPassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

