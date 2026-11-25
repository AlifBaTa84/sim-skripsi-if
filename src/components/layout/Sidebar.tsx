import React, { useState } from 'react';
import { useSchedule } from '../../context/ScheduleContext';
import { UserRole } from '../../types';
import {
  CalendarDays,
  FolderKanban,
  Users,
  GraduationCap,
  Building2,
  Clock,
  FileSpreadsheet,
  ShieldCheck,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  Upload,
  Printer,
  LayoutDashboard,
  UserCheck,
  Tag,
  BookOpen,
  Award,
  Layers,
  Sparkles,
  Menu,
  X,
  Database,
  LogOut,
  KeyRound
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { auditAllSchedules } from '../../utils/conflictChecker';

interface SidebarProps {
  currentNav: string;
  onSelectNav: (nav: string) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
  onOpenImportModal: () => void;
  onOpenExportModal: () => void;
  onOpenAuditModal: () => void;
  onOpenDatabaseModal?: () => void;
  onOpenChangePasswordModal?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentNav,
  onSelectNav,
  isCollapsed,
  onToggleCollapse,
  isMobileOpen,
  onCloseMobile,
  onOpenImportModal,
  onOpenExportModal,
  onOpenAuditModal,
  onOpenDatabaseModal,
  onOpenChangePasswordModal,
}) => {
  const { role, setRole, schedules, lecturers, rooms, academicPeriods } = useSchedule();
  const { currentUser, logout, switchActiveRole } = useAuth();
  const [isMasterOpen, setIsMasterOpen] = useState(true);

  const unassignedCount = schedules.filter(s => s.status === 'unassigned').length;
  const scheduledCount = schedules.filter(s => s.status === 'scheduled').length;
  const allConflicts = auditAllSchedules(schedules, lecturers, rooms);
  const conflictCount = allConflicts.length;

  const handleNavClick = (navKey: string) => {
    onSelectNav(navKey);
    onCloseMobile();
  };

  const allRoles: { id: UserRole; label: string; icon: React.ReactNode }[] = [
    { id: 'admin', label: 'Admin', icon: <ShieldCheck className="w-3.5 h-3.5" /> },
    { id: 'dosen', label: 'Dosen', icon: <UserCheck className="w-3.5 h-3.5" /> },
    { id: 'mahasiswa', label: 'Mhs', icon: <GraduationCap className="w-3.5 h-3.5" /> },
  ];

  const userRoles = allRoles.filter(r =>
    Array.isArray(currentUser?.roles) ? currentUser.roles.includes(r.id) : true
  );

  // Shared nav button class builder (M3 Navigation Drawer Pill Spec)
  const navBtn = (isActive: boolean) =>
    `w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-sm font-semibold transition-all duration-150 ${
      isActive
        ? 'bg-indigo-600 text-white shadow-xs'
        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 active:scale-[0.99]'
    } ${isCollapsed ? 'justify-center px-0' : ''}`;

  const subNavBtn = (isActive: boolean) =>
    `w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium transition-all ${
      isActive
        ? 'bg-indigo-50 text-indigo-900 font-bold border-l-2 border-indigo-600 pl-2.5'
        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
    } ${isCollapsed ? 'justify-center px-0' : ''}`;

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isMobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 lg:hidden transition-opacity"
        />
      )}

      {/* Main Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 bg-white border-r border-slate-200 flex flex-col transition-all duration-300 ease-in-out select-none print:hidden ${
          isCollapsed ? 'w-20' : 'w-64'
        } ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 px-4 flex items-center justify-between border-b border-slate-200 bg-slate-50">
          <div
            onClick={() => handleNavClick('schedule')}
            title="Sistem Informasi Manajemen Skripsi IF UNIKOM"
            className={`flex items-center gap-3 cursor-pointer overflow-hidden ${isCollapsed ? 'justify-center w-full' : ''}`}
          >
            <div className="w-9 h-9 rounded-xl bg-white p-1 border border-slate-200/90 shadow-2xs flex items-center justify-center shrink-0">
              <img
                src="/logo-unikom.png"
                alt="Logo UNIKOM"
                className="w-full h-full object-contain"
              />
            </div>

            {!isCollapsed && (
              <div className="min-w-0">
                <h1 className="text-sm font-bold text-slate-900 tracking-tight leading-none">
                  SIM SKRIPSI
                </h1>
                <p className="text-[11px] font-medium text-slate-400 truncate mt-0.5">
                  IF UNIKOM
                </p>
              </div>
            )}
          </div>

          {/* Desktop Collapse Toggle */}
          {!isCollapsed && (
            <button
              onClick={onToggleCollapse}
              className="hidden lg:flex h-7 w-7 rounded-lg items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
              title="Perkecil Sidebar"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          )}

          {/* Mobile Close Button */}
          <button
            onClick={onCloseMobile}
            className="lg:hidden h-7 w-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Collapsed Toggle Button when minimized */}
        {isCollapsed && (
          <div className="hidden lg:flex justify-center py-2 border-b border-slate-100">
            <button
              onClick={onToggleCollapse}
              className="h-7 w-7 rounded-lg flex items-center justify-center text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
              title="Perluas Sidebar"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Navigation Menus List */}
        <div className="flex-1 overflow-y-auto py-4 px-3 space-y-5">

          {/* SECTION 1: ADMIN MENUS */}
          {role === 'admin' && (
            <div className="space-y-1">
              {!isCollapsed && (
                <div className="px-3 text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">
                  Navigasi Penjadwalan
                </div>
              )}

              {/* Papan Jadwal */}
              <button
                onClick={() => handleNavClick('schedule')}
                className={navBtn(currentNav === 'schedule')}
                title="Papan Jadwal Interaktif (Drag & Drop)"
              >
                <LayoutDashboard className={`w-4 h-4 shrink-0 ${currentNav === 'schedule' ? 'text-white' : 'text-slate-400'}`} />
                {!isCollapsed && (
                  <span className="flex-1 text-left truncate">Papan Jadwal</span>
                )}
                {!isCollapsed && scheduledCount > 0 && (
                  <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                    currentNav === 'schedule' ? 'bg-indigo-500 text-white' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {scheduledCount}
                  </span>
                )}
              </button>

              {/* Impor Data */}
              <button
                onClick={() => handleNavClick('impor')}
                className={navBtn(currentNav === 'impor')}
                title="Impor Data Mahasiswa Seminar (Excel / CSV)"
              >
                <Upload className={`w-4 h-4 shrink-0 ${currentNav === 'impor' ? 'text-white' : 'text-emerald-500'}`} />
                {!isCollapsed && <span className="flex-1 text-left truncate">Impor Mahasiswa</span>}
              </button>

              {/* Rekapitulasi */}
              <button
                onClick={() => handleNavClick('rekapitulasi')}
                className={navBtn(currentNav === 'rekapitulasi')}
                title="Rekapitulasi Sidang & Ekspor Laporan"
              >
                <FileSpreadsheet className={`w-4 h-4 shrink-0 ${currentNav === 'rekapitulasi' ? 'text-white' : 'text-slate-400'}`} />
                {!isCollapsed && <span className="flex-1 text-left truncate">Rekap & Laporan</span>}
              </button>

              {/* Data Master (Accordion) */}
              <div>
                <button
                  onClick={() => setIsMasterOpen(!isMasterOpen)}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-sm font-semibold transition-all duration-150 ${
                    ['master-dosen', 'master-mahasiswa', 'master-ruangan', 'master-waktu', 'master-periode', 'master-pengguna', 'database'].includes(currentNav) && !isMasterOpen
                      ? 'bg-indigo-50 text-indigo-700 font-bold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 active:scale-[0.99]'
                  } ${isCollapsed ? 'justify-center px-0' : ''}`}
                  title="Data Master (Dosen, Mahasiswa, Ruangan, Slot Waktu, Periode Akademik, Pengguna, Database)"
                >
                  <FolderKanban className={`w-4 h-4 shrink-0 ${['master-dosen', 'master-mahasiswa', 'master-ruangan', 'master-waktu', 'master-periode', 'master-pengguna', 'database'].includes(currentNav) ? 'text-indigo-600' : 'text-slate-400'}`} />
                  {!isCollapsed && <span className="flex-1 text-left truncate">Data Master</span>}
                  {!isCollapsed && (
                    isMasterOpen ? (
                      <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                    )
                  )}
                </button>

                {/* Submenu Data Master */}
                {(isMasterOpen || isCollapsed) && (
                  <div className={`space-y-0.5 mt-1 ${!isCollapsed ? 'pl-3 ml-3 border-l-2 border-slate-200' : ''}`}>
                    <button
                      onClick={() => handleNavClick('master-dosen')}
                      className={subNavBtn(currentNav === 'master-dosen')}
                      title="Data Master Dosen Penguji"
                    >
                      <Users className="w-4 h-4 text-indigo-500 shrink-0" />
                      {!isCollapsed && <span className="flex-1 text-left truncate">Data Dosen</span>}
                      {!isCollapsed && (
                        <span className="text-[11px] text-slate-400 font-mono">{lecturers.length}</span>
                      )}
                    </button>

                    <button
                      onClick={() => handleNavClick('master-mahasiswa')}
                      className={subNavBtn(currentNav === 'master-mahasiswa')}
                      title="Data Master Pengajuan Sidang Mahasiswa"
                    >
                      <GraduationCap className="w-4 h-4 text-indigo-500 shrink-0" />
                      {!isCollapsed && <span className="flex-1 text-left truncate">Data Mahasiswa</span>}
                      {!isCollapsed && (
                        <span className="text-[11px] text-slate-400 font-mono">{schedules.length}</span>
                      )}
                    </button>

                    <button
                      onClick={() => handleNavClick('master-ruangan')}
                      className={subNavBtn(currentNav === 'master-ruangan')}
                      title="Data Master Ruangan Sidang"
                    >
                      <Building2 className="w-4 h-4 text-indigo-500 shrink-0" />
                      {!isCollapsed && <span className="flex-1 text-left truncate">Data Ruangan</span>}
                      {!isCollapsed && (
                        <span className="text-[11px] text-slate-400 font-mono">{rooms.length}</span>
                      )}
                    </button>

                    <button
                      onClick={() => handleNavClick('master-waktu')}
                      className={subNavBtn(currentNav === 'master-waktu')}
                      title="Data Master Slot Waktu Sidang"
                    >
                      <Clock className="w-4 h-4 text-indigo-500 shrink-0" />
                      {!isCollapsed && <span className="flex-1 text-left truncate">Data Slot Waktu</span>}
                    </button>

                    <button
                      onClick={() => handleNavClick('master-periode')}
                      className={subNavBtn(currentNav === 'master-periode')}
                      title="Pengaturan Tahun Akademik & Semester (Active Academic Period)"
                    >
                      <CalendarDays className="w-4 h-4 text-indigo-500 shrink-0" />
                      {!isCollapsed && <span className="flex-1 text-left truncate">Periode Akademik</span>}
                      {!isCollapsed && (
                        <span className="text-[11px] text-slate-400 font-mono">{academicPeriods.length}</span>
                      )}
                    </button>

                    <button
                      onClick={() => handleNavClick('master-pengguna')}
                      className={subNavBtn(currentNav === 'master-pengguna')}
                      title="Manajemen Akun & Hak Akses Sistem"
                    >
                      <UserCheck className="w-4 h-4 text-indigo-500 shrink-0" />
                      {!isCollapsed && <span className="flex-1 text-left truncate">Data Pengguna</span>}
                    </button>

                    <button
                      onClick={() => handleNavClick('database')}
                      className={subNavBtn(currentNav === 'database')}
                      title="Manajemen Database & Backup"
                    >
                      <Database className="w-4 h-4 text-indigo-500 shrink-0" />
                      {!isCollapsed && <span className="flex-1 text-left truncate">Manajemen Database</span>}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* SECTION 3: DOSEN MENUS */}
          {role === 'dosen' && (
            <div className="space-y-1">
              {!isCollapsed && (
                <div className="px-3 text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">
                  Menu Dosen Penguji
                </div>
              )}

              <button
                onClick={() => handleNavClick('dosen-personal')}
                className={navBtn(currentNav === 'dosen-personal')}
                title="Jadwal Sidang Personal Dosen"
              >
                <UserCheck className={`w-4 h-4 shrink-0 ${currentNav === 'dosen-personal' ? 'text-white' : 'text-slate-400'}`} />
                {!isCollapsed && <span className="flex-1 text-left truncate">Jadwal Tugas Personal</span>}
              </button>

              <button
                onClick={() => handleNavClick('dosen-master')}
                className={navBtn(currentNav === 'dosen-master')}
                title="Jadwal Lengkap Mingguan/Harian"
              >
                <CalendarDays className={`w-4 h-4 shrink-0 ${currentNav === 'dosen-master' ? 'text-white' : 'text-slate-400'}`} />
                {!isCollapsed && <span className="flex-1 text-left truncate">Jadwal Lengkap Sidang</span>}
              </button>
            </div>
          )}

          {/* SECTION 4: MAHASISWA MENUS */}
          {role === 'mahasiswa' && (
            <div className="space-y-1">
              {!isCollapsed && (
                <div className="px-3 text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">
                  Portal Mahasiswa
                </div>
              )}

              <button
                onClick={() => handleNavClick('mahasiswa-jadwal')}
                className={navBtn(currentNav === 'mahasiswa-jadwal')}
                title="Informasi Jadwal Pelaksanaan Sidang"
              >
                <GraduationCap className={`w-4 h-4 shrink-0 ${currentNav === 'mahasiswa-jadwal' ? 'text-white' : 'text-slate-400'}`} />
                {!isCollapsed && <span className="flex-1 text-left truncate">Jadwal Sidang Saya</span>}
              </button>

              <button
                onClick={() => handleNavClick('mahasiswa-label')}
                className={navBtn(currentNav === 'mahasiswa-label')}
                title="Cetak Label Draft Sidang Skripsi (3 Penguji)"
              >
                <Tag className={`w-4 h-4 shrink-0 ${currentNav === 'mahasiswa-label' ? 'text-white' : 'text-indigo-400'}`} />
                {!isCollapsed && <span className="flex-1 text-left truncate">Cetak Label Draft</span>}
              </button>
            </div>
          )}

        </div>

        {/* Footer: User Profile & Multi-Role Switcher */}
        <div className="p-3 border-t border-slate-200 bg-slate-50">
          {!isCollapsed ? (
            <div className="space-y-3">
              {/* Role Switcher */}
              {userRoles.length > 1 ? (
                <div>
                  <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">
                    <span>Ganti Peran Aktif:</span>
                    <span className="text-[9px] text-purple-600 bg-purple-50 px-1.5 rounded font-bold border border-purple-200">Dual Role</span>
                  </div>
                  <div className={`grid gap-1 p-1 bg-slate-200/50 rounded-xl ${userRoles.length === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
                    {userRoles.map(r => {
                      const isActive = role === r.id;
                      return (
                        <button
                          key={r.id}
                          onClick={() => {
                            setRole(r.id);
                            if (r.id === 'admin') onSelectNav('schedule');
                            if (r.id === 'dosen') onSelectNav('dosen-personal');
                            if (r.id === 'mahasiswa') onSelectNav('mahasiswa-jadwal');
                          }}
                          className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-semibold transition-all ${
                            isActive
                              ? 'bg-white text-indigo-700 shadow-sm'
                              : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                          }`}
                        >
                          <span>{r.icon}</span>
                          <span>{r.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-indigo-50 border border-indigo-100">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Hak Akses:</span>
                  <span className="uppercase text-xs font-bold text-indigo-700">{role}</span>
                </div>
              )}

              {/* User Identity & Logout */}
              <div className="pt-2 border-t border-slate-200 flex items-center justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-slate-900 truncate leading-tight" title={currentUser?.name}>
                    {currentUser?.name || 'Pengguna'}
                  </p>
                  <p className="text-[11px] text-slate-400 font-mono truncate mt-0.5">
                    {currentUser?.email || ''}
                  </p>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  {onOpenChangePasswordModal && (
                    <button
                      onClick={onOpenChangePasswordModal}
                      className="h-8 w-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                      title="Ubah Password Akun"
                    >
                      <KeyRound className="w-4 h-4" />
                    </button>
                  )}

                  <button
                    onClick={logout}
                    className="h-8 w-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                    title="Keluar dari Akun (Logout)"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              {userRoles.length > 1 && (
                <button
                  onClick={() => {
                    const nextRole = role === 'admin' ? 'dosen' : 'admin';
                    setRole(nextRole);
                    if (nextRole === 'admin') onSelectNav('schedule');
                    if (nextRole === 'dosen') onSelectNav('dosen-personal');
                  }}
                  className="h-9 w-9 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center justify-center"
                  title={`Ganti Peran (Saat ini: ${role.toUpperCase()})`}
                >
                  {role === 'admin' ? <ShieldCheck className="w-5 h-5" /> : <UserCheck className="w-5 h-5" />}
                </button>
              )}

              {onOpenChangePasswordModal && (
                <button
                  onClick={onOpenChangePasswordModal}
                  className="h-9 w-9 rounded-xl text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 border border-slate-200 flex items-center justify-center transition-colors"
                  title="Ubah Password"
                >
                  <KeyRound className="w-4 h-4" />
                </button>
              )}

              <button
                onClick={logout}
                className="h-9 w-9 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 flex items-center justify-center"
                title="Keluar (Logout)"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};
