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
  isAvailable?: boolean;
  unavailableReason?: string;
}

export const getActiveDemoAccounts = (): DemoAccount[] => {
  let firstStudent: { nim: string; name: string } | null = null;
  try {
    const savedSchedules = localStorage.getItem('sim_sidang_schedules_v2');
    if (savedSchedules !== null) {
      const parsed: ScheduleItem[] = JSON.parse(savedSchedules);
      if (Array.isArray(parsed) && parsed.length > 0) {
        firstStudent = {
          nim: parsed[0].nim,
          name: parsed[0].studentName,
        };
      }
    } else {
      if (INITIAL_SCHEDULE_ITEMS.length > 0) {
        firstStudent = {
          nim: INITIAL_SCHEDULE_ITEMS[0].nim,
          name: INITIAL_SCHEDULE_ITEMS[0].studentName,
        };
      }
    }
  } catch (e) {
    console.error('Failed to get student for demo accounts', e);
  }

  const baseAccounts: DemoAccount[] = [
    {
      label: 'Dosen & Admin (Multi-Peran)',
      roleBadge: 'Dosen + Admin',
      email: 'dian.dharmayanti@email.ac.id',
      password: 'Dosen#2025',
      description: 'Dosen Penguji 1 sekaligus Panitia Sidang (Bisa beralih peran bebas)',
      roles: ['dosen', 'admin'],
      isAvailable: true,
    },
    {
      label: 'Administrator Utama',
      roleBadge: 'Admin Only',
      email: 'admin@simsidang.ac.id',
      password: 'Admin#2025',
      description: 'Akses penuh jadwal matriks, kelola ruangan & slot waktu',
      roles: ['admin'],
      isAvailable: true,
    },
    {
      label: 'Dosen Penguji',
      roleBadge: 'Dosen Only',
      email: 'andri.heryandi@email.ac.id',
      password: 'Dosen#2025',
      description: 'Akses jadwal personal dan jadwal lengkap (Read-Only)',
      roles: ['dosen'],
      isAvailable: true,
    },
  ];

  if (firstStudent) {
    baseAccounts.push({
      label: 'Mahasiswa Peserta Sidang',
      roleBadge: 'Mahasiswa',
      email: `${firstStudent.nim}@mahasiswa.ac.id`,
      password: `Mhs#${firstStudent.nim}`,
      description: `${firstStudent.name} (${firstStudent.nim})`,
      roles: ['mahasiswa'],
      isAvailable: true,
    });
  } else {
    baseAccounts.push({
      label: 'Mahasiswa Peserta Sidang',
      roleBadge: 'Data Kosong',
      email: 'Data Mahasiswa Kosong',
      password: '',
      description: 'Belum ada data mahasiswa terdaftar atau data telah dihapus',
      roles: ['mahasiswa'],
      isAvailable: false,
      unavailableReason: 'Data mahasiswa tidak tersedia di sistem (telah dihapus atau belum diimpor). Silakan login sebagai Admin untuk mengimpor data.',
    });
  }

  return baseAccounts;
};

export const DEMO_ACCOUNTS: DemoAccount[] = getActiveDemoAccounts();

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
          // Jika akun tersimpan adalah mahasiswa, validasi keberadaannya di data mahasiswa aktif
          if (parsed.activeRole === 'mahasiswa' || parsed.studentNim) {
            const savedSchedules = localStorage.getItem('sim_sidang_schedules_v2');
            if (savedSchedules !== null) {
              const schedulesList: ScheduleItem[] = JSON.parse(savedSchedules);
              const exists = Array.isArray(schedulesList) && schedulesList.some(
                (s) =>
                  s.nim === parsed.studentNim ||
                  `${s.nim.toLowerCase()}@mahasiswa.ac.id` === parsed.email.toLowerCase()
              );
              if (!exists) {
                localStorage.removeItem(AUTH_STORAGE_KEY);
                return null;
              }
            }
          }
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
   * Menegakkan aturan Automatic Account Provisioning:
   * Akun mahasiswa HANYA valid bila data mahasiswa aktif ada di sistem.
   */
  const findUserAccount = (identifier: string): StoredUser | null => {
    const inputClean = identifier.trim().toLowerCase();
    const isStudentFormat = inputClean.includes('@mahasiswa.ac.id') || /^[0-9]+$/.test(inputClean);

    // a. Muat daftar jadwal / mahasiswa aktif dari localStorage
    let schedulesList: ScheduleItem[] = [];
    const savedSchedules = localStorage.getItem('sim_sidang_schedules_v2');
    if (savedSchedules !== null) {
      try {
        const parsed = JSON.parse(savedSchedules);
        if (Array.isArray(parsed)) {
          schedulesList = parsed;
        }
      } catch (e) {
        console.error('Failed to parse saved schedules', e);
      }
    } else {
      // First run sebelum ada modifikasi data jadwal
      schedulesList = INITIAL_SCHEDULE_ITEMS;
    }

    const matchedStudent = schedulesList.find(
      (s) =>
        s.nim.toLowerCase() === inputClean ||
        `${s.nim.toLowerCase()}@mahasiswa.ac.id` === inputClean
    );

    // Jika format input adalah mahasiswa tapi datanya tidak ditemukan (kosong atau telah dihapus),
    // tolak akses akun mahasiswa secara mutlak.
    if (isStudentFormat && !matchedStudent) {
      return null;
    }

    // b. Muat pengguna tersimpan dari localStorage jika ada
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

    if (registered) {
      const isMhs = registered.roles.includes('mahasiswa') || Boolean(registered.studentNim);
      if (isMhs) {
        // Hanya kembalikan jika mahasiswa masih aktif di schedulesList
        if (matchedStudent) {
          return {
            ...registered,
            name: matchedStudent.studentName,
            department: matchedStudent.studyProgram,
          };
        }
        // Jika data mahasiswa sudah dihapus dari sistem, abaikan cache akun terdaftar
      } else {
        return registered;
      }
    }

    // c. Cari di daftar seed INITIAL_USERS (hanya akun admin dan dosen inti)
    const initial = INITIAL_USERS.find(
      (u) =>
        u.email.toLowerCase() === inputClean ||
        (u.studentNim && u.studentNim.toLowerCase() === inputClean)
    );
    if (initial) return initial;

    // d. Jika mahasiswa terdaftar aktif di jadwal/antrean, return akun otomatis
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

    // e. Cari apakah merupakan dosen di master data (membaca localStorage dinamis, fallback ke INITIAL_LECTURERS)
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
        const isStudentIdentifier = email.toLowerCase().includes('@mahasiswa.ac.id') || /^[0-9]+$/.test(email.trim());
        return { 
          success: false, 
          error: isStudentIdentifier
            ? 'Akun mahasiswa tidak ditemukan. Data mahasiswa tidak terdaftar atau telah dihapus dari sistem.'
            : 'Akun dengan alamat email atau NIM ini tidak terdaftar. Pastikan data sudah ditambahkan di Data Master.' 
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

