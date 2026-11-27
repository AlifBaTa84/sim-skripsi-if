import { dbRepository } from '../db/repository';
import { PenggunaRecord } from '../db/types';
import { Lecturer } from '../types';

const REGISTERED_USERS_KEY = 'sim_sidang_registered_users_v2';

/**
 * Helper internal untuk membaca dan menyinkronkan daftar pengguna terdaftar di localStorage
 */
function getRegisteredUsersFromStorage(): any[] {
  try {
    const raw = localStorage.getItem(REGISTERED_USERS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (err) {
    console.warn('[AccountProvisioner] Gagal membaca registered users dari localStorage:', err);
  }
  return [];
}

function saveRegisteredUsersToStorage(users: any[]): void {
  try {
    localStorage.setItem(REGISTERED_USERS_KEY, JSON.stringify(users));
  } catch (err) {
    console.warn('[AccountProvisioner] Gagal menyimpan registered users ke localStorage:', err);
  }
}

/**
 * Otomatis membuat dan menyediakan akun login untuk Dosen baru (Automatic Provisioning).
 * - Peran: 'dosen' (atau multi-peran ['admin', 'dosen'] jika relevan)
 * - Password standar: 'Dosen#2025'
 * - Tersimpan di IndexedDB & LocalStorage
 */
export async function autoProvisionLecturer(lecturer: Lecturer): Promise<PenggunaRecord> {
  const email = (lecturer.email || `${lecturer.code.toLowerCase()}@email.ac.id`).toLowerCase();
  const isDefaultDualAdmin = email.includes('dian.dharmayanti') || lecturer.name.toLowerCase().includes('dian dharmayanti');
  const defaultRoles: ('admin' | 'dosen' | 'mahasiswa')[] = isDefaultDualAdmin ? ['admin', 'dosen'] : ['dosen'];

  // Cek apakah user sudah ada di localStorage agar tidak menimpa password/role/status yang sudah diubah admin
  const localList = getRegisteredUsersFromStorage();
  const idx = localList.findIndex(
    (u) => (u.email && u.email.toLowerCase() === email) || (u.lecturerId && u.lecturerId === lecturer.id)
  );
  const existingLocal = idx >= 0 ? localList[idx] : null;

  const resolvedRoles: ('admin' | 'dosen' | 'mahasiswa')[] =
    existingLocal && Array.isArray(existingLocal.roles) && existingLocal.roles.length > 0
      ? existingLocal.roles
      : defaultRoles;
  const resolvedRoleUtama = existingLocal?.activeRole || (resolvedRoles.includes('admin') ? 'admin' : 'dosen');
  const resolvedPassword = existingLocal?.passwordHash || 'Dosen#2025';
  const resolvedIsActive = existingLocal?.isActive !== undefined ? existingLocal.isActive : true;

  const userRecord: PenggunaRecord = {
    id: existingLocal?.id || `usr-lec-${lecturer.id}`,
    email,
    nama: lecturer.name,
    roles: resolvedRoles,
    role_utama: resolvedRoleUtama,
    password_hash: resolvedPassword,
    password_required: false,
    lecturer_id: lecturer.id,
    is_active: resolvedIsActive,
    created_at: existingLocal?.createdAt || new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  // 1. Simpan ke IndexedDB
  try {
    await dbRepository.saveUser(userRecord);
  } catch (err) {
    console.warn('[AccountProvisioner] Gagal menyimpan akun dosen ke IndexedDB:', err);
  }

  // 2. Simpan ke localStorage registered users
  const localUserObj = {
    id: userRecord.id,
    name: userRecord.nama,
    email: userRecord.email,
    passwordHash: userRecord.password_hash,
    roles: userRecord.roles,
    activeRole: userRecord.role_utama,
    isActive: userRecord.is_active,
    lecturerId: lecturer.id,
    createdAt: userRecord.created_at,
    updatedAt: userRecord.updated_at,
  };

  if (idx >= 0) {
    localList[idx] = { ...localList[idx], ...localUserObj };
  } else {
    localList.push(localUserObj);
  }
  saveRegisteredUsersToStorage(localList);

  return userRecord;
}

/**
 * Otomatis membuat dan menyediakan akun login untuk Mahasiswa baru (Automatic Provisioning).
 * - Peran: 'mahasiswa'
 * - Email: `${nim}@mahasiswa.ac.id`
 * - Password standar: `Mhs#${nim}`
 * - Tersimpan di IndexedDB & LocalStorage
 */
export async function autoProvisionStudent(student: {
  nim: string;
  name: string;
  email?: string;
  studyProgram?: string;
}): Promise<PenggunaRecord> {
  const cleanNim = student.nim.trim();
  const email = (student.email || `${cleanNim.toLowerCase()}@mahasiswa.ac.id`).toLowerCase();

  const userRecord: PenggunaRecord = {
    id: `usr-mhs-${cleanNim}`,
    email,
    nama: student.name.trim(),
    roles: ['mahasiswa'],
    role_utama: 'mahasiswa',
    password_hash: `Mhs#${cleanNim}`,
    password_required: false,
    student_nim: cleanNim,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  // 1. Simpan ke IndexedDB
  try {
    await dbRepository.saveUser(userRecord);
  } catch (err) {
    console.warn('[AccountProvisioner] Gagal menyimpan akun mahasiswa ke IndexedDB:', err);
  }

  // 2. Simpan ke localStorage registered users
  const localList = getRegisteredUsersFromStorage();
  const idx = localList.findIndex(
    (u) => (u.email && u.email.toLowerCase() === email) || (u.studentNim && u.studentNim === cleanNim)
  );

  const localUserObj = {
    id: userRecord.id,
    name: userRecord.nama,
    email: userRecord.email,
    passwordHash: userRecord.password_hash,
    roles: userRecord.roles,
    activeRole: userRecord.role_utama,
    isActive: true,
    studentNim: cleanNim,
    department: student.studyProgram || 'Teknik Informatika',
    createdAt: userRecord.created_at,
    updatedAt: userRecord.updated_at,
  };

  if (idx >= 0) {
    localList[idx] = { ...localList[idx], ...localUserObj };
  } else {
    localList.push(localUserObj);
  }
  saveRegisteredUsersToStorage(localList);

  return userRecord;
}

/**
 * Otomatis menyediakan akun dalam jumlah banyak (bulk) untuk hasil impor Excel / CSV.
 */
export async function autoProvisionBulkStudents(
  students: { nim: string; name: string; email?: string; studyProgram?: string }[]
): Promise<number> {
  if (!students || students.length === 0) return 0;

  const localList = getRegisteredUsersFromStorage();
  let provisionCount = 0;

  for (const st of students) {
    if (!st.nim) continue;
    const cleanNim = st.nim.trim();
    const email = (st.email || `${cleanNim.toLowerCase()}@mahasiswa.ac.id`).toLowerCase();

    const userRecord: PenggunaRecord = {
      id: `usr-mhs-${cleanNim}`,
      email,
      nama: st.name.trim(),
      roles: ['mahasiswa'],
      role_utama: 'mahasiswa',
      password_hash: `Mhs#${cleanNim}`,
      password_required: false,
      student_nim: cleanNim,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Save ke IndexedDB
    dbRepository.saveUser(userRecord).catch((err) => {
      console.warn('[AccountProvisioner] Gagal menyimpan bulk user ke IndexedDB:', err);
    });

    // Update list local storage
    const idx = localList.findIndex(
      (u) => (u.email && u.email.toLowerCase() === email) || (u.studentNim && u.studentNim === cleanNim)
    );

    const localUserObj = {
      id: userRecord.id,
      name: userRecord.nama,
      email: userRecord.email,
      passwordHash: userRecord.password_hash,
      roles: userRecord.roles,
      activeRole: userRecord.role_utama,
      isActive: true,
      studentNim: cleanNim,
      department: st.studyProgram || 'Teknik Informatika',
      createdAt: userRecord.created_at,
      updatedAt: userRecord.updated_at,
    };

    if (idx >= 0) {
      localList[idx] = { ...localList[idx], ...localUserObj };
    } else {
      localList.push(localUserObj);
    }

    provisionCount++;
  }

  saveRegisteredUsersToStorage(localList);
  return provisionCount;
}
