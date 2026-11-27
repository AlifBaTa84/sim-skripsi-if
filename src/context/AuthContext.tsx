/**
 * SISTEM INFORMASI MANAJEMEN SIDANG SKRIPSI (SIM-SIDANG)
 * AuthContext: Manajemen Sesi, RBAC, dan Multi-Peran (Dosen + Admin)
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, UserRole, ScheduleItem, Lecturer } from '../types';
import { validatePassword, validateCaptcha } from '../utils/authValidator';
import { INITIAL_LECTURERS, INITIAL_SCHEDULE_ITEMS } from '../data/mockData';
import { dbRepository } from '../db/repository';
import { PenggunaRecord } from '../db/types';

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

const REGISTERED_USERS_STORAGE_KEY = 'sim_sidang_registered_users_v2';

function readRegisteredUsersFromStorage(): StoredUser[] {
  try {
    const raw = localStorage.getItem(REGISTERED_USERS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.error('Failed to parse registered users', e);
  }
  return [];
}

function saveRegisteredUsersToStorage(users: StoredUser[]): void {
  try {
    localStorage.setItem(REGISTERED_USERS_STORAGE_KEY, JSON.stringify(users));
  } catch (e) {
    console.error('Failed to save registered users', e);
  }
}

async function syncUserToIndexedDB(u: StoredUser): Promise<void> {
  try {
    const existingAll = await dbRepository.getUsers();
    const existing = existingAll.find(
      (rec) =>
        rec.id === u.id ||
        rec.email.toLowerCase() === u.email.toLowerCase() ||
        (u.studentNim && rec.student_nim === u.studentNim) ||
        (u.lecturerId && rec.lecturer_id === u.lecturerId)
    );
    const record: PenggunaRecord = {
      id: existing?.id || u.id,
      email: u.email.toLowerCase(),
      nama: u.name,
      roles: u.roles,
      role_utama: u.activeRole,
      password_hash: u.passwordHash,
      password_required: false,
      lecturer_id: u.lecturerId ?? existing?.lecturer_id,
      student_nim: u.studentNim ?? existing?.student_nim,
      is_active: u.isActive !== false,
      created_at: existing?.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    await dbRepository.saveUser(record);
  } catch (err) {
    console.warn('[AuthContext] Gagal sinkronisasi user ke IndexedDB:', err);
  }
}

/**
 * Sinkronkan data pengguna, dosen, dan jadwal dari IndexedDB ke localStorage
 * agar proses login dan demo akun selalu membaca data aktual dari database.
 */
export async function syncDatabaseToAuthStorage(): Promise<void> {
  try {
    const [dbUsers, dbLecturers, dbSchedules] = await Promise.all([
      dbRepository.getUsers().catch(() => [] as PenggunaRecord[]),
      dbRepository.getLecturers().catch(() => [] as Lecturer[]),
      dbRepository.getScheduleItems().catch(() => [] as ScheduleItem[]),
    ]);

    if (dbLecturers.length > 0 && localStorage.getItem('sim_sidang_lecturers_v2') === null) {
      localStorage.setItem('sim_sidang_lecturers_v2', JSON.stringify(dbLecturers));
    }

    if (dbSchedules.length > 0 && localStorage.getItem('sim_sidang_schedules_v2') === null) {
      localStorage.setItem('sim_sidang_schedules_v2', JSON.stringify(dbSchedules));
    }

    if (dbUsers.length > 0) {
      const localUsers = readRegisteredUsersFromStorage();
      const mergedMap = new Map<string, StoredUser>();

      localUsers.forEach((u) => {
        if (u.email) mergedMap.set(u.email.toLowerCase(), u);
      });

      dbUsers.forEach((u: PenggunaRecord) => {
        const email = u.email.toLowerCase();
        const existing = mergedMap.get(email);
        const fallbackPwd =
          u.roles.includes('mahasiswa')
            ? `Mhs#${u.student_nim || '2025'}`
            : u.roles.includes('admin') && !u.roles.includes('dosen')
            ? 'Admin#2025'
            : 'Dosen#2025';

        mergedMap.set(email, {
          id: u.id,
          name: u.nama,
          email,
          roles: u.roles,
          activeRole: u.role_utama || u.roles[0] || 'mahasiswa',
          lecturerId: u.lecturer_id,
          studentNim: u.student_nim,
          isActive: u.is_active !== false,
          passwordHash: u.password_hash || existing?.passwordHash || fallbackPwd,
        });
      });

      saveRegisteredUsersToStorage(Array.from(mergedMap.values()));
    }
  } catch (err) {
    console.warn('[AuthContext] Gagal menyinkronkan database ke auth storage:', err);
  }
}

export const getActiveDemoAccounts = (): DemoAccount[] => {
  const registeredUsers = readRegisteredUsersFromStorage();

  // 1. Ambil data mahasiswa aktif dari storage
  let schedulesList: ScheduleItem[] = [];
  try {
    const savedSchedules = localStorage.getItem('sim_sidang_schedules_v2');
    if (savedSchedules !== null) {
      const parsed: ScheduleItem[] = JSON.parse(savedSchedules);
      if (Array.isArray(parsed)) schedulesList = parsed;
    } else {
      schedulesList = INITIAL_SCHEDULE_ITEMS;
    }
  } catch (e) {
    console.error('Failed to get schedules for demo accounts', e);
  }

  // 2. Ambil data dosen aktif dari storage
  let lecturersList: Lecturer[] = [];
  try {
    const savedLecturers = localStorage.getItem('sim_sidang_lecturers_v2');
    if (savedLecturers !== null) {
      const parsed: Lecturer[] = JSON.parse(savedLecturers);
      if (Array.isArray(parsed)) lecturersList = parsed;
    } else {
      lecturersList = INITIAL_LECTURERS;
    }
  } catch (e) {
    console.error('Failed to get lecturers for demo accounts', e);
  }

  const findRegisteredForLecturer = (lec: Lecturer): StoredUser | undefined =>
    registeredUsers.find(
      (u) =>
        (u.lecturerId && u.lecturerId === lec.id) ||
        (lec.email && u.email.toLowerCase() === lec.email.toLowerCase()) ||
        (lec.code && u.email.toLowerCase() === `${lec.code.toLowerCase()}@email.ac.id`)
    );

  // Cari dosen multi-peran aktual dari database pengguna + master dosen
  let dualRoleLecturer: Lecturer | undefined = lecturersList.find((l) => {
    const reg = findRegisteredForLecturer(l);
    if (reg) {
      return reg.isActive !== false && reg.roles.includes('admin') && reg.roles.includes('dosen');
    }
    return (
      (l.email && l.email.toLowerCase().includes('dian.dharmayanti')) ||
      l.name.toLowerCase().includes('dian dharmayanti')
    );
  });

  // Cari dosen penguji murni aktual (aktif & bukan multi-role admin)
  const pureLecturer =
    lecturersList.find((l) => {
      if (l.id === dualRoleLecturer?.id) return false;
      const reg = findRegisteredForLecturer(l);
      if (reg && (reg.isActive === false || reg.roles.includes('admin'))) return false;
      return (
        (l.email && l.email.toLowerCase().includes('andri.heryandi')) ||
        l.name.toLowerCase().includes('andri heryandi')
      );
    }) ||
    lecturersList.find((l) => {
      if (l.id === dualRoleLecturer?.id) return false;
      const reg = findRegisteredForLecturer(l);
      return !reg || (reg.isActive !== false && !reg.roles.includes('admin'));
    });

  // Cari administrator utama aktual dari database pengguna
  const regAdmin =
    registeredUsers.find(
      (u) => u.roles.includes('admin') && !u.roles.includes('dosen') && u.isActive !== false
    ) ||
    registeredUsers.find((u) => u.email.toLowerCase() === 'admin@simsidang.ac.id');

  // Cari mahasiswa aktif aktual dari schedules + database pengguna
  const activeStudentItem =
    schedulesList.find((s) => {
      const reg = registeredUsers.find(
        (u) =>
          u.studentNim === s.nim ||
          u.email.toLowerCase() === `${s.nim.toLowerCase()}@mahasiswa.ac.id`
      );
      return s.nim === '10120262' && (!reg || reg.isActive !== false);
    }) ||
    schedulesList.find((s) => {
      const reg = registeredUsers.find(
        (u) =>
          u.studentNim === s.nim ||
          u.email.toLowerCase() === `${s.nim.toLowerCase()}@mahasiswa.ac.id`
      );
      return !reg || reg.isActive !== false;
    });

  const baseAccounts: DemoAccount[] = [];

  // Akun 1: Dosen & Admin (Multi-Peran)
  if (dualRoleLecturer) {
    const reg = findRegisteredForLecturer(dualRoleLecturer);
    const email = reg?.email || dualRoleLecturer.email || `${dualRoleLecturer.code.toLowerCase()}@email.ac.id`;
    const password = reg?.passwordHash || 'Dosen#2025';
    baseAccounts.push({
      label: 'Dosen & Admin (Multi-Peran)',
      roleBadge: 'Dosen + Admin',
      email,
      password,
      description: `${reg?.name || dualRoleLecturer.name} (Bisa beralih peran bebas Dosen & Panitia Sidang)`,
      roles: reg?.roles || ['dosen', 'admin'],
      isAvailable: true,
    });
  } else {
    baseAccounts.push({
      label: 'Dosen & Admin (Multi-Peran)',
      roleBadge: 'Data Kosong',
      email: 'Data Dosen Multi-Peran Kosong',
      password: '',
      description: 'Tidak ada data dosen panitia sidang aktif atau telah dinonaktifkan/dihapus',
      roles: ['dosen', 'admin'],
      isAvailable: false,
      unavailableReason:
        'Akun Dosen Multi-Peran tidak tersedia karena data dosen terkait tidak aktif atau telah dihapus dari sistem.',
    });
  }

  // Akun 2: Administrator Utama
  if (!regAdmin || regAdmin.isActive !== false) {
    baseAccounts.push({
      label: 'Administrator Utama',
      roleBadge: 'Admin Only',
      email: regAdmin?.email || 'admin@simsidang.ac.id',
      password: regAdmin?.passwordHash || 'Admin#2025',
      description: `${regAdmin?.name || 'Administrator Panitia Sidang'} — Akses penuh jadwal matriks, kelola ruangan & slot waktu`,
      roles: ['admin'],
      isAvailable: true,
    });
  } else {
    baseAccounts.push({
      label: 'Administrator Utama',
      roleBadge: 'Nonaktif',
      email: regAdmin.email,
      password: '',
      description: 'Akun administrator saat ini berstatus nonaktif',
      roles: ['admin'],
      isAvailable: false,
      unavailableReason: 'Akun Administrator Utama berstatus nonaktif di Master Pengguna.',
    });
  }

  // Akun 3: Dosen Penguji
  if (pureLecturer) {
    const reg = findRegisteredForLecturer(pureLecturer);
    const email = reg?.email || pureLecturer.email || `${pureLecturer.code.toLowerCase()}@email.ac.id`;
    const password = reg?.passwordHash || 'Dosen#2025';
    baseAccounts.push({
      label: 'Dosen Penguji',
      roleBadge: 'Dosen Only',
      email,
      password,
      description: `${reg?.name || pureLecturer.name} (${pureLecturer.code}) - Akses jadwal personal dan lengkap`,
      roles: ['dosen'],
      isAvailable: true,
    });
  } else {
    baseAccounts.push({
      label: 'Dosen Penguji',
      roleBadge: 'Data Kosong',
      email: 'Data Dosen Kosong',
      password: '',
      description: 'Belum ada data dosen aktif terdaftar atau data telah dihapus',
      roles: ['dosen'],
      isAvailable: false,
      unavailableReason:
        'Data dosen aktif tidak tersedia di sistem. Silakan login sebagai Admin untuk mengelola data dosen.',
    });
  }

  // Akun 4: Mahasiswa Peserta Sidang
  if (activeStudentItem) {
    const reg = registeredUsers.find(
      (u) =>
        u.studentNim === activeStudentItem.nim ||
        u.email.toLowerCase() === `${activeStudentItem.nim.toLowerCase()}@mahasiswa.ac.id`
    );
    const email = reg?.email || `${activeStudentItem.nim}@mahasiswa.ac.id`;
    const password = reg?.passwordHash || `Mhs#${activeStudentItem.nim}`;
    baseAccounts.push({
      label: 'Mahasiswa Peserta Sidang',
      roleBadge: 'Mahasiswa',
      email,
      password,
      description: `${reg?.name || activeStudentItem.studentName} (${activeStudentItem.nim})`,
      roles: ['mahasiswa'],
      isAvailable: true,
    });
  } else {
    baseAccounts.push({
      label: 'Mahasiswa Peserta Sidang',
      roleBadge: 'Data Kosong',
      email: 'Data Mahasiswa Kosong',
      password: '',
      description: 'Belum ada data mahasiswa aktif terdaftar atau data telah dihapus',
      roles: ['mahasiswa'],
      isAvailable: false,
      unavailableReason:
        'Data mahasiswa aktif tidak tersedia di sistem. Silakan login sebagai Admin untuk mengimpor data.',
    });
  }

  return baseAccounts;
};

export async function getActiveDemoAccountsAsync(): Promise<DemoAccount[]> {
  await syncDatabaseToAuthStorage();
  return getActiveDemoAccounts();
}

export const DEMO_ACCOUNTS: DemoAccount[] = getActiveDemoAccounts();

// Seed users database (hanya root administrator sistem, dosen dan mahasiswa disinkronkan otomatis dari master data)
export interface StoredUser extends User {
  passwordHash: string;
}

const INITIAL_USERS: StoredUser[] = [
  {
    id: 'usr-admin-01',
    name: 'Administrator Panitia Sidang',
    email: 'admin@simsidang.ac.id',
    passwordHash: 'Admin#2025',
    roles: ['admin'],
    activeRole: 'admin',
    department: 'Biro Administrasi Akademik',
    isActive: true,
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

          // Jika akun tersimpan adalah dosen, validasi keberadaannya di data master dosen aktif
          if (parsed.lecturerId || (Array.isArray(parsed.roles) && parsed.roles.includes('dosen'))) {
            const savedLecturers = localStorage.getItem('sim_sidang_lecturers_v2');
            if (savedLecturers !== null) {
              const lecturersList: Lecturer[] = JSON.parse(savedLecturers);
              const exists = Array.isArray(lecturersList) && lecturersList.some(
                (l) =>
                  l.id === parsed.lecturerId ||
                  (l.email && l.email.toLowerCase() === parsed.email.toLowerCase()) ||
                  (l.code && `${l.code.toLowerCase()}@univ.ac.id` === parsed.email.toLowerCase())
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

  // Sinkronkan data pengguna, dosen, dan jadwal dari IndexedDB saat mount
  useEffect(() => {
    syncDatabaseToAuthStorage();
  }, []);

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
   * 1. Akun mahasiswa HANYA valid bila data mahasiswa aktif ada di sistem.
   * 2. Akun dosen HANYA valid bila data dosen aktif ada di Master Dosen.
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
      schedulesList = INITIAL_SCHEDULE_ITEMS;
    }

    // b. Muat daftar dosen aktif dari localStorage (menghormati array kosong jika semua dosen dihapus)
    let lecturersList: Lecturer[] = [];
    const savedLecturers = localStorage.getItem('sim_sidang_lecturers_v2');
    if (savedLecturers !== null) {
      try {
        const parsed = JSON.parse(savedLecturers);
        if (Array.isArray(parsed)) {
          lecturersList = parsed;
        }
      } catch (e) {
        console.error('Failed to parse saved lecturers', e);
      }
    } else {
      lecturersList = INITIAL_LECTURERS;
    }

    const matchedStudent = schedulesList.find(
      (s) =>
        s.nim.toLowerCase() === inputClean ||
        `${s.nim.toLowerCase()}@mahasiswa.ac.id` === inputClean
    );

    const matchedLecturer = lecturersList.find((l) => {
      const lecEmail = (l.email || '').toLowerCase();
      const lecCode = (l.code || '').toLowerCase();
      const lecNidn = (l.nidn || '').toLowerCase();

      return (
        lecEmail === inputClean ||
        lecEmail.replace('@univ.ac.id', '@email.ac.id') === inputClean ||
        lecEmail.replace('@email.ac.id', '@univ.ac.id') === inputClean ||
        `${lecCode}@email.ac.id` === inputClean ||
        `${lecCode}@univ.ac.id` === inputClean ||
        lecCode === inputClean ||
        lecNidn === inputClean
      );
    });

    const isLecturerFormat =
      inputClean.includes('@univ.ac.id') ||
      inputClean.includes('@email.ac.id') ||
      inputClean.includes('@lecturer') ||
      matchedLecturer !== undefined;

    // Jika format input adalah mahasiswa tapi datanya tidak ditemukan di sistem aktif -> null
    if (isStudentFormat && !matchedStudent) {
      return null;
    }

    // Jika format input adalah dosen tapi datanya tidak ditemukan di master dosen aktif -> null
    if (isLecturerFormat && !matchedLecturer && !inputClean.includes('admin@simsidang.ac.id')) {
      return null;
    }

    // Helper untuk menjamin passwordHash selalu valid dan tidak pernah kosong/undefined
    const getResolvedPassword = (u: any, isMhsRole: boolean, nim?: string): string => {
      if (u.passwordHash && typeof u.passwordHash === 'string' && u.passwordHash.trim()) {
        return u.passwordHash.trim();
      }
      if (u.password_hash && typeof u.password_hash === 'string' && u.password_hash.trim()) {
        return u.password_hash.trim();
      }
      if (isMhsRole) {
        return `Mhs#${nim || u.studentNim || u.student_nim || '2025'}`;
      }
      if (u.roles && u.roles.includes('admin') && !u.roles.includes('dosen')) {
        return 'Admin#2025';
      }
      return 'Dosen#2025';
    };

    // c. Muat pengguna tersimpan dari localStorage jika ada
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

    // Cari dari akun terdaftar (prioritas: akun yang sudah disesuaikan/diupdate passwordnya)
    const registered = registeredUsers.find(
      (u) =>
        u.email.toLowerCase() === inputClean ||
        (u.studentNim && u.studentNim.toLowerCase() === inputClean) ||
        (u.lecturerId && matchedLecturer && u.lecturerId === matchedLecturer.id)
    );

    if (registered) {
      const isMhs = (registered.roles && registered.roles.includes('mahasiswa')) || Boolean(registered.studentNim);
      const isDsn = (registered.roles && registered.roles.includes('dosen')) || Boolean(registered.lecturerId);

      if (isMhs) {
        // Hanya kembalikan jika mahasiswa masih aktif di schedulesList
        if (matchedStudent) {
          return {
            ...registered,
            name: matchedStudent.studentName,
            department: matchedStudent.studyProgram,
            passwordHash: getResolvedPassword(registered, true, matchedStudent.nim),
            isActive: registered.isActive !== false,
          };
        }
        // Mahasiswa telah dihapus, abaikan cache akun
      } else if (isDsn) {
        // Hanya kembalikan jika dosen masih aktif di master dosen
        if (matchedLecturer) {
          const lecEmail = matchedLecturer.email || registered.email;
          const isDefaultDualAdmin =
            lecEmail.toLowerCase().includes('dian.dharmayanti') ||
            matchedLecturer.name.toLowerCase().includes('dian dharmayanti');
          const defaultRoles: UserRole[] = isDefaultDualAdmin ? ['admin', 'dosen'] : ['dosen'];
          const resolvedRoles: UserRole[] =
            registered.roles && registered.roles.length > 0 ? registered.roles : defaultRoles;

          return {
            ...registered,
            name: matchedLecturer.name,
            email: registered.email || lecEmail,
            roles: resolvedRoles,
            activeRole:
              registered.activeRole && resolvedRoles.includes(registered.activeRole)
                ? registered.activeRole
                : resolvedRoles.includes('admin')
                ? 'admin'
                : 'dosen',
            department: matchedLecturer.department,
            lecturerId: matchedLecturer.id,
            passwordHash: getResolvedPassword(registered, false),
            isActive: registered.isActive !== false,
          };
        }
        // Dosen telah dihapus, abaikan cache akun
      } else {
        // Akun administrator root
        return {
          ...registered,
          passwordHash: getResolvedPassword(registered, false),
          isActive: registered.isActive !== false,
        };
      }
    }

    // d. Cari di daftar seed INITIAL_USERS (hanya root administrator sistem)
    const initial = INITIAL_USERS.find(
      (u) =>
        u.email.toLowerCase() === inputClean ||
        (u.studentNim && u.studentNim.toLowerCase() === inputClean)
    );
    if (initial) {
      return {
        ...initial,
        passwordHash: getResolvedPassword(initial, false),
        isActive: initial.isActive !== false,
      };
    }

    // e. Jika mahasiswa terdaftar aktif di jadwal/antrean, return akun otomatis
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
        isActive: true,
      };
    }

    // f. Jika dosen terdaftar aktif di master data dosen, return akun otomatis
    if (matchedLecturer) {
      const email = matchedLecturer.email || `${matchedLecturer.code.toLowerCase()}@email.ac.id`;
      const isDualAdmin =
        email.toLowerCase().includes('dian.dharmayanti') ||
        matchedLecturer.name.toLowerCase().includes('dian dharmayanti');
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
        isActive: true,
      };
    }

    return null;
  };

  /**
   * Login handler dengan verifikasi:
   * 1. Validasi format email & password
   * 2. Validasi aturan password (8 karakter, huruf besar, huruf kecil, simbol)
   * 3. Validasi Captcha
   * 4. Verifikasi status keaktifan akun
   * 5. Verifikasi kecocokan kredensial
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
        const isLecturerIdentifier =
          email.toLowerCase().includes('@univ.ac.id') ||
          email.toLowerCase().includes('@email.ac.id') ||
          email.toLowerCase().includes('@lecturer');

        let errorMsg = 'Akun dengan alamat email atau NIM ini tidak terdaftar. Pastikan data sudah ditambahkan di Data Master.';
        if (isStudentIdentifier) {
          errorMsg = 'Akun mahasiswa tidak ditemukan. Data mahasiswa tidak terdaftar atau telah dihapus dari sistem.';
        } else if (isLecturerIdentifier) {
          errorMsg = 'Akun dosen tidak ditemukan. Data dosen tidak terdaftar atau telah dihapus dari sistem.';
        }

        return { 
          success: false, 
          error: errorMsg,
        };
      }

      // 5. Cek status aktivasi akun
      if (user.isActive === false) {
        return {
          success: false,
          error: 'Akun Anda saat ini berstatus nonaktif. Silakan hubungi Administrator untuk mengaktifkan kembali akun Anda.',
        };
      }

      // 6. Cek kecocokan password
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
        syncUserToIndexedDB(updatedUser);
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
        syncUserToIndexedDB(updatedTarget);

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

