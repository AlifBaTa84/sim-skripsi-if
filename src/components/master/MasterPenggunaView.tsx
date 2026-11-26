import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Users,
  Search,
  Filter,
  UserCheck,
  Shield,
  GraduationCap,
  Sparkles,
  KeyRound,
  Pencil,
  Trash2,
  Mail,
  CheckCircle2,
  XCircle,
  RefreshCw,
  BadgeAlert,
  UserX,
  Info
} from 'lucide-react';
import { useSchedule } from '../../context/ScheduleContext';
import { useAuth } from '../../context/AuthContext';
import { dbRepository } from '../../db/repository';
import { PenggunaRecord } from '../../db/types';
import { EditUserModal } from './EditUserModal';
import { DeleteUserModal } from './DeleteUserModal';
import { AdminResetPasswordModal, ResetTargetUser } from '../admin/AdminResetPasswordModal';

export const MasterPenggunaView: React.FC = () => {
  const { lecturers, schedules, addToast } = useSchedule();
  const { currentUser, isMainAdmin } = useAuth();

  // Modals state
  const [editingUser, setEditingUser] = useState<PenggunaRecord | null>(null);
  const [deletingUser, setDeletingUser] = useState<PenggunaRecord | null>(null);
  const [resetTargetUser, setResetTargetUser] = useState<ResetTargetUser | null>(null);

  // Filter & search state
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'dosen' | 'mahasiswa'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  // Stored users state
  const [storedUsers, setStoredUsers] = useState<PenggunaRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load and assemble all users
  const refreshUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      // 1. Fetch from IndexedDB
      let dbUsers: PenggunaRecord[] = [];
      try {
        dbUsers = await dbRepository.getUsers();
      } catch (e) {
        console.warn('Could not fetch users from IndexedDB:', e);
      }

      // 2. Fetch from localStorage registered users
      let localUsers: any[] = [];
      try {
        const raw = localStorage.getItem('sim_sidang_registered_users_v2');
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) localUsers = parsed;
        }
      } catch (e) {
        console.warn('Could not fetch users from localStorage:', e);
      }

      // 3. Assemble complete list
      const userMap = new Map<string, PenggunaRecord>();

      // Base default super admin
      userMap.set('admin@simsidang.ac.id', {
        id: 'usr-admin-01',
        email: 'admin@simsidang.ac.id',
        nama: 'Administrator Utama',
        roles: ['admin'],
        role_utama: 'admin',
        password_required: false,
        is_active: true,
        created_at: '2025-01-01T08:00:00Z',
        updated_at: '2025-01-01T08:00:00Z',
      });

      // Populate from lecturers
      lecturers.forEach((lec) => {
        const email = (lec.email || `${lec.code.toLowerCase()}@univ.ac.id`).toLowerCase();
        // Check if lecturer is dual-role admin
        const isDualAdmin = email.includes('ahmad.fauzi') || lec.name.includes('Ahmad Fauzi');
        const roles: ('admin' | 'dosen' | 'mahasiswa')[] = isDualAdmin ? ['admin', 'dosen'] : ['dosen'];

        userMap.set(email, {
          id: `usr-lec-${lec.id}`,
          email,
          nama: lec.name,
          roles,
          role_utama: isDualAdmin ? 'admin' : 'dosen',
          password_hash: 'Dosen#2025',
          password_required: false,
          lecturer_id: lec.id,
          is_active: true,
          created_at: '2025-01-05T08:00:00Z',
          updated_at: '2025-01-05T08:00:00Z',
        });
      });

      // Populate from students in schedules (deduplicated by NIM)
      schedules.forEach((sch) => {
        const nim = sch.nim?.trim();
        if (nim) {
          const email = `${nim.toLowerCase()}@mahasiswa.ac.id`;
          if (!userMap.has(email)) {
            userMap.set(email, {
              id: `usr-mhs-${nim}`,
              email,
              nama: sch.studentName,
              roles: ['mahasiswa'],
              role_utama: 'mahasiswa',
              password_hash: `Mhs#${nim}`,
              password_required: false,
              student_nim: nim,
              is_active: true,
              created_at: '2025-01-10T08:00:00Z',
              updated_at: '2025-01-10T08:00:00Z',
            });
          }
        }
      });

      // Merge localStorage registered users (which might have updated passwords or customized roles/status)
      localUsers.forEach((u) => {
        const email = u.email?.toLowerCase();
        if (email) {
          const isMhs = (u.roles && u.roles.includes('mahasiswa')) || Boolean(u.studentNim) || email.includes('@mahasiswa.ac.id');
          if (isMhs) {
            // Pastikan mahasiswa masih aktif di data schedules, jika sudah dihapus jangan dimuat
            const activeMhs = schedules.some(
              (s) => s.nim === u.studentNim || `${s.nim.toLowerCase()}@mahasiswa.ac.id` === email
            );
            if (!activeMhs) return;
          }
          const existing = userMap.get(email);
          userMap.set(email, {
            id: u.id || existing?.id || `usr-${Date.now()}`,
            nama: u.name || existing?.nama || 'Pengguna',
            email,
            roles: Array.isArray(u.roles) && u.roles.length > 0 ? u.roles : existing?.roles || ['mahasiswa'],
            role_utama: u.activeRole || existing?.role_utama || (Array.isArray(u.roles) ? u.roles[0] : 'mahasiswa'),
            password_required: u.passwordRequired !== undefined ? u.passwordRequired : false,
            lecturer_id: u.lecturerId || existing?.lecturer_id,
            student_nim: u.studentNim || existing?.student_nim,
            is_active: u.isActive !== undefined ? u.isActive : existing?.is_active ?? true,
            created_at: u.createdAt || existing?.created_at || new Date().toISOString(),
            updated_at: u.updatedAt || existing?.updated_at || new Date().toISOString(),
          });
        }
      });

      // Merge IndexedDB users (highest priority for newly added / edited records)
      dbUsers.forEach((u) => {
        const email = u.email?.toLowerCase();
        if (email) {
          const isMhs = (u.roles && u.roles.includes('mahasiswa')) || Boolean(u.student_nim) || email.includes('@mahasiswa.ac.id');
          if (isMhs) {
            // Pastikan mahasiswa masih aktif di data schedules, jika sudah dihapus jangan dimuat
            const activeMhs = schedules.some(
              (s) => s.nim === u.student_nim || `${s.nim.toLowerCase()}@mahasiswa.ac.id` === email
            );
            if (!activeMhs) return;
          }
          const existing = userMap.get(email);
          userMap.set(email, {
            ...existing,
            ...u,
          });
        }
      });

      setStoredUsers(Array.from(userMap.values()));
    } catch (err) {
      console.error('Error loading users:', err);
    } finally {
      setIsLoading(false);
    }
  }, [lecturers, schedules]);

  useEffect(() => {
    refreshUsers();
  }, [refreshUsers]);

  // Sync to localStorage
  const syncToLocalStorage = (usersList: PenggunaRecord[]) => {
    try {
      const localFormat = usersList.map((u) => ({
        id: u.id,
        name: u.nama,
        email: u.email,
        roles: u.roles,
        activeRole: u.role_utama,
        isActive: u.is_active,
        studentNim: u.student_nim,
        lecturerId: u.lecturer_id,
        updatedAt: u.updated_at,
        createdAt: u.created_at,
      }));
      localStorage.setItem('sim_sidang_registered_users_v2', JSON.stringify(localFormat));
    } catch (e) {
      console.error('Failed to sync to localStorage:', e);
    }
  };

  // Handle Edit User
  const handleEditUser = async (updatedUser: PenggunaRecord) => {
    try {
      // 1. Save to IndexedDB
      await dbRepository.saveUser(updatedUser);

      // 2. Update state
      const updated = storedUsers.map((u) => (u.id === updatedUser.id ? updatedUser : u));
      setStoredUsers(updated);

      // 3. Sync to localStorage
      syncToLocalStorage(updated);

      addToast('success', 'Pengguna Diperbarui', `Informasi akun "${updatedUser.nama}" berhasil disimpan.`);
    } catch (err) {
      console.error('Gagal memperbarui pengguna:', err);
      addToast('error', 'Gagal', 'Terjadi kesalahan saat memperbarui akun pengguna.');
    }
  };

  // Handle Delete User
  const handleDeleteUser = async (userId: string) => {
    const target = storedUsers.find((u) => u.id === userId);
    if (!target) return;

    try {
      // 1. Delete from IndexedDB
      await dbRepository.deleteUser(userId);

      // 2. Update state
      const updated = storedUsers.filter((u) => u.id !== userId);
      setStoredUsers(updated);

      // 3. Sync to localStorage
      syncToLocalStorage(updated);

      addToast('success', 'Pengguna Dihapus', `Akun pengguna "${target.nama}" telah berhasil dihapus.`);
    } catch (err) {
      console.error('Gagal menghapus pengguna:', err);
      addToast('error', 'Gagal', 'Terjadi kesalahan saat menghapus akun pengguna.');
    }
  };

  // Filtered users calculation
  const filteredUsers = useMemo(() => {
    return storedUsers.filter((user) => {
      // Filter role
      if (roleFilter !== 'all') {
        if (!user.roles.includes(roleFilter)) return false;
      }

      // Filter status
      if (statusFilter !== 'all') {
        if (statusFilter === 'active' && !user.is_active) return false;
        if (statusFilter === 'inactive' && user.is_active) return false;
      }

      // Search term
      if (searchTerm.trim()) {
        const q = searchTerm.trim().toLowerCase();
        const matchName = user.nama.toLowerCase().includes(q);
        const matchEmail = user.email.toLowerCase().includes(q);
        const matchNim = user.student_nim?.toLowerCase().includes(q) ?? false;
        const matchId = user.id.toLowerCase().includes(q);
        return matchName || matchEmail || matchNim || matchId;
      }

      return true;
    });
  }, [storedUsers, roleFilter, statusFilter, searchTerm]);

  // KPI Calculations
  const stats = useMemo(() => {
    const total = storedUsers.length;
    const adminCount = storedUsers.filter((u) => u.roles.includes('admin')).length;
    const dosenCount = storedUsers.filter((u) => u.roles.includes('dosen')).length;
    const mhsCount = storedUsers.filter((u) => u.roles.includes('mahasiswa')).length;
    const activeCount = storedUsers.filter((u) => u.is_active).length;
    return { total, adminCount, dosenCount, mhsCount, activeCount };
  }, [storedUsers]);

  // Initials for avatar
  const getInitials = (name: string) => {
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
              Data Master
            </span>
            <span className="text-[11px] font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              Auto Provisioning
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mt-1.5 flex items-center gap-2.5">
            <UserCheck className="w-6 h-6 text-indigo-600" />
            <span>Manajemen Akun & Hak Akses</span>
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Kelola akun pengguna, kredensial, status aktivasi, dan hak akses sistem SIM SKRIPSI.
          </p>
        </div>

        <div className="flex items-center gap-4 shrink-0">
          <div className="text-right">
            <span className="text-xs text-slate-400 font-medium block">Total Pengguna</span>
            <span className="text-2xl font-bold text-indigo-700 font-mono">{stats.total} Akun</span>
          </div>
        </div>
      </div>

      {/* Automatic Account Provisioning Info Banner */}
      <div className="bg-indigo-50/70 border border-indigo-100 rounded-2xl p-4 flex items-start sm:items-center justify-between gap-3 text-indigo-900">
        <div className="flex items-start sm:items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0 mt-0.5 sm:mt-0">
            <Info className="w-4 h-4" />
          </div>
          <div className="text-xs sm:text-sm">
            <span className="font-bold text-indigo-950">Automatic Account Provisioning Aktif: </span>
            <span className="text-slate-600">
              Akun dosen dan mahasiswa dibuat secara otomatis saat penambahan Master Data Dosen dan impor data Pengajuan Sidang Mahasiswa. Halaman ini digunakan untuk mengelola hak akses, status aktivasi, dan reset kata sandi.
            </span>
          </div>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Total Pengguna */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Total Pengguna</span>
            <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-slate-800 font-mono">{stats.total}</span>
            <span className="text-xs text-slate-400 ml-1.5">Akun Terdaftar</span>
          </div>
          <div className="mt-2 text-xs text-emerald-600 font-medium flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{stats.activeCount} akun berstatus aktif</span>
          </div>
        </div>

        {/* Administrator */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Administrator</span>
            <div className="w-9 h-9 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600">
              <Shield className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-purple-700 font-mono">{stats.adminCount}</span>
            <span className="text-xs text-slate-400 ml-1.5">Operator & Admin</span>
          </div>
          <div className="mt-2 text-xs text-slate-500">
            Hak akses kendali penuh sistem
          </div>
        </div>

        {/* Dosen Penguji */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Dosen Penguji</span>
            <div className="w-9 h-9 rounded-xl bg-sky-50 flex items-center justify-center text-sky-600">
              <UserCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-sky-700 font-mono">{stats.dosenCount}</span>
            <span className="text-xs text-slate-400 ml-1.5">Dosen Terhubung</span>
          </div>
          <div className="mt-2 text-xs text-slate-500">
            Akses penilaian & jadwal sidang
          </div>
        </div>

        {/* Mahasiswa */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Mahasiswa</span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
              <GraduationCap className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-amber-700 font-mono">{stats.mhsCount}</span>
            <span className="text-xs text-slate-400 ml-1.5">Peserta Sidang</span>
          </div>
          <div className="mt-2 text-xs text-slate-500">
            Akses portal peserta ujian skripsi
          </div>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari berdasarkan nama, email, NIM, atau ID pengguna..."
            className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all placeholder:text-slate-400"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
            >
              Hapus
            </button>
          )}
        </div>

        {/* Select Filters */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Role Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400 shrink-0" />
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as any)}
              aria-label="Filter Peran Pengguna"
              className="text-sm bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all cursor-pointer"
            >
              <option value="all">Semua Peran</option>
              <option value="admin">Administrator</option>
              <option value="dosen">Dosen Penguji</option>
              <option value="mahasiswa">Mahasiswa</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              aria-label="Filter Status Akun"
              className="text-sm bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all cursor-pointer"
            >
              <option value="all">Semua Status</option>
              <option value="active">Aktif</option>
              <option value="inactive">Nonaktif</option>
            </select>
          </div>

          {/* Refresh button */}
          <button
            onClick={refreshUsers}
            disabled={isLoading}
            className="p-2 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl border border-slate-200 transition-colors"
            title="Muat ulang data pengguna"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-slate-800">Daftar Akun Pengguna</h3>
            <span className="text-xs bg-indigo-100 text-indigo-700 font-mono px-2 py-0.5 rounded-full font-semibold">
              {filteredUsers.length} Terdaftar
            </span>
          </div>
          <span className="text-xs text-slate-400">
            Menampilkan data kredensial dan hak akses portal
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50/80 text-slate-500 text-xs uppercase tracking-wider font-semibold border-b border-slate-200/80">
              <tr>
                <th className="py-3 px-4 w-12 text-center">No</th>
                <th className="py-3 px-4">Nama Pengguna</th>
                <th className="py-3 px-4">Email / Kredensial</th>
                <th className="py-3 px-4">Hak Akses (Peran)</th>
                <th className="py-3 px-4 text-center">Status Akun</th>
                <th className="py-3 px-4 text-center">Aksi Manajemen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-normal">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <RefreshCw className="w-6 h-6 animate-spin text-indigo-500" />
                      <span className="text-sm">Memuat basis data pengguna...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <UserX className="w-8 h-8 text-slate-300" />
                      <span className="text-sm font-semibold text-slate-600">Tidak ada data pengguna ditemukan</span>
                      <span className="text-xs text-slate-400">Coba ubah kata kunci pencarian atau filter yang dipilih.</span>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user, idx) => {
                  const isCurrentSelf =
                    (currentUser?.id && user.id === currentUser.id) ||
                    (currentUser?.email && user.email.toLowerCase() === currentUser.email.toLowerCase());
                  const isPrimaryAdmin = user.email.toLowerCase() === 'admin@simsidang.ac.id';

                  return (
                    <tr
                      key={user.id}
                      className="hover:bg-slate-50/80 transition-colors group"
                    >
                      {/* No */}
                      <td className="py-3 px-4 text-center font-mono text-xs text-slate-400">
                        {idx + 1}
                      </td>

                      {/* Nama Pengguna & Avatar */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                            user.roles.includes('admin')
                              ? 'bg-purple-100 text-purple-700 ring-2 ring-purple-200'
                              : user.roles.includes('dosen')
                              ? 'bg-sky-100 text-sky-700 ring-2 ring-sky-200'
                              : 'bg-amber-100 text-amber-700 ring-2 ring-amber-200'
                          }`}>
                            {getInitials(user.nama)}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-slate-800 truncate block">
                                {user.nama}
                              </span>
                              {isCurrentSelf && (
                                <span className="text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 py-0.2 rounded-md">
                                  Anda
                                </span>
                              )}
                              {isPrimaryAdmin && (
                                <span className="text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 px-1.5 py-0.2 rounded-md">
                                  Utama
                                </span>
                              )}
                            </div>
                            <span className="text-xs text-slate-400 font-mono block">
                              ID: {user.id}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Email & Kredensial */}
                      <td className="py-3 px-4">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-xs font-mono text-slate-700 font-medium flex items-center gap-1.5">
                            <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            {user.email}
                          </span>
                          {user.student_nim && (
                            <span className="text-[11px] text-slate-500 font-mono">
                              NIM: <span className="font-semibold text-slate-700">{user.student_nim}</span>
                            </span>
                          )}
                          {user.lecturer_id && (
                            <span className="text-[11px] text-slate-500 font-mono">
                              Ref Dosen ID: <span className="font-semibold text-slate-700">{user.lecturer_id}</span>
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Hak Akses / Peran */}
                      <td className="py-3 px-4">
                        <div className="flex flex-wrap items-center gap-1.5">
                          {user.roles.map((r) => {
                            if (r === 'admin') {
                              return (
                                <span
                                  key={r}
                                  className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200"
                                >
                                  <Shield className="w-3 h-3 text-purple-500" />
                                  Administrator
                                </span>
                              );
                            }
                            if (r === 'dosen') {
                              return (
                                <span
                                  key={r}
                                  className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-200"
                                >
                                  <UserCheck className="w-3 h-3 text-sky-500" />
                                  Dosen
                                </span>
                              );
                            }
                            return (
                              <span
                                key={r}
                                className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200"
                              >
                                <GraduationCap className="w-3 h-3 text-amber-500" />
                                Mahasiswa
                              </span>
                            );
                          })}
                        </div>
                      </td>

                      {/* Status Akun */}
                      <td className="py-3 px-4 text-center">
                        {user.is_active ? (
                          <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Aktif
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                            Nonaktif
                          </span>
                        )}
                      </td>

                      {/* Aksi Manajemen */}
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Reset Password */}
                          <button
                            onClick={() => {
                              const roleType: 'admin' | 'dosen' | 'mahasiswa' = user.roles.includes('admin')
                                ? 'admin'
                                : user.roles.includes('dosen')
                                ? 'dosen'
                                : 'mahasiswa';
                              setResetTargetUser({
                                name: user.nama,
                                email: user.email,
                                nim: user.student_nim,
                                roleType,
                              });
                            }}
                            className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors border border-transparent hover:border-amber-200"
                            title="Reset Kata Sandi Pengguna"
                          >
                            <KeyRound className="w-4 h-4" />
                          </button>

                          {/* Edit User */}
                          <button
                            onClick={() => setEditingUser(user)}
                            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors border border-transparent hover:border-indigo-200"
                            title="Ubah Data Pengguna"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>

                          {/* Delete User */}
                          <button
                            onClick={() => setDeletingUser(user)}
                            disabled={isCurrentSelf || isPrimaryAdmin}
                            className={`p-1.5 rounded-lg transition-colors border border-transparent ${
                              isCurrentSelf || isPrimaryAdmin
                                ? 'text-slate-300 cursor-not-allowed'
                                : 'text-slate-500 hover:text-rose-600 hover:bg-rose-50 hover:border-rose-200'
                            }`}
                            title={
                              isCurrentSelf
                                ? 'Anda tidak dapat menghapus akun sendiri'
                                : isPrimaryAdmin
                                ? 'Akun Super Admin Utama dilindungi'
                                : 'Hapus Akun Pengguna'
                            }
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit User Modal */}
      <EditUserModal
        isOpen={!!editingUser}
        onClose={() => setEditingUser(null)}
        onSuccess={handleEditUser}
        user={editingUser}
        existingEmails={storedUsers.map((u) => u.email)}
      />

      {/* Delete User Modal */}
      <DeleteUserModal
        isOpen={!!deletingUser}
        onClose={() => setDeletingUser(null)}
        onConfirm={handleDeleteUser}
        user={deletingUser}
        currentUserId={currentUser?.id}
        currentUserEmail={currentUser?.email}
      />

      {/* Admin Reset Password Modal */}
      <AdminResetPasswordModal
        isOpen={!!resetTargetUser}
        onClose={() => setResetTargetUser(null)}
        targetUser={resetTargetUser}
      />
    </div>
  );
};
