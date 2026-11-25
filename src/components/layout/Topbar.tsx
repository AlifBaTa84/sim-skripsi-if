import React from 'react';
import { useSchedule } from '../../context/ScheduleContext';
import {
  Menu,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  UserCheck,
  GraduationCap,
  LogOut,
  KeyRound,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { auditAllSchedules } from '../../utils/conflictChecker';

interface TopbarProps {
  currentNav: string;
  onOpenMobileSidebar: () => void;
  onOpenAuditModal: () => void;
  onOpenExportModal?: () => void;
  onOpenImportModal?: () => void;
  onOpenDatabaseModal?: () => void;
  onOpenChangePasswordModal?: () => void;
}

export const Topbar: React.FC<TopbarProps> = ({
  currentNav,
  onOpenMobileSidebar,
  onOpenAuditModal,
  onOpenChangePasswordModal,
}) => {
  const { role, schedules, lecturers, rooms, activePeriod } = useSchedule();
  const { currentUser, logout, switchActiveRole } = useAuth();

  const allConflicts = auditAllSchedules(schedules, lecturers, rooms);
  const conflictCount = allConflicts.length;

  // Dynamic Page Title Map
  const getPageInfo = (): { title: string } => {
    switch (currentNav) {
      case 'schedule':
        return { title: 'Papan Jadwal' };
      case 'rekapitulasi':
        return { title: 'Rekapitulasi Jadwal Sidang Skripsi' };
      case 'impor':
        return { title: 'Impor Data Mahasiswa Sidang' };
      case 'audit':
        return { title: 'Audit Bentrok Jadwal Sidang' };
      case 'database':
        return { title: 'Manajemen Database' };
      case 'master-periode':
        return { title: 'Pengaturan Tahun Akademik & Semester' };
      case 'master-pengguna':
        return { title: 'Manajemen Akun & Hak Akses' };
      case 'master-dosen':
        return { title: 'Data Master Dosen Penguji' };
      case 'master-dosen-detail':
        return { title: 'Detail Mahasiswa Ujian per Dosen' };
      case 'master-mahasiswa':
        return { title: 'Data Master Mahasiswa' };
      case 'master-ruangan':
        return { title: 'Data Master Ruangan' };
      case 'master-waktu':
        return { title: 'Data Master Slot Waktu' };
      case 'dosen-personal':
        return { title: 'Jadwal Tugas Sidang Personal' };
      case 'dosen-master':
        return { title: 'Jadwal Lengkap Sidang' };
      case 'mahasiswa-jadwal':
        return { title: 'Informasi Jadwal Sidang Pribadi' };
      case 'mahasiswa-label':
        return { title: 'Cetak Label Draft Sidang' };
      default:
        return { title: 'Sistem Informasi Sidang' };
    }
  };

  const pageInfo = getPageInfo();

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-slate-200 shadow-sm print:hidden">
      <div className="px-4 sm:px-6">
        <div className="flex items-center justify-between h-16 gap-4">

          {/* Left: Mobile Hamburger & Page Title Caption */}
          <div className="flex items-center gap-3 min-w-0">
            {/* Mobile Sidebar Hamburger */}
            <button
              onClick={onOpenMobileSidebar}
              className="lg:hidden h-10 w-10 rounded-full flex items-center justify-center text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors shrink-0"
              aria-label="Buka Menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Active Title Caption */}
            <div className="min-w-0">
              <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight leading-tight truncate">
                {pageInfo.title}
              </h1>
            </div>
          </div>

          {/* Right: Actions & User Profile */}
          <div className="flex items-center gap-2 shrink-0">

            {/* Active Academic Period Badge */}
            {activePeriod && (
              <div 
                className="hidden lg:flex items-center gap-2 h-9 px-3.5 text-xs font-semibold rounded-full bg-slate-100 text-slate-700 border border-slate-200"
                title={`Periode Akademik Aktif: ${activePeriod.academicYear} ${activePeriod.semester} (Status: ${activePeriod.status})`}
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                <span className="text-slate-400 font-normal">Periode:</span>
                <span className="font-bold text-slate-800">{activePeriod.academicYear} {activePeriod.semester}</span>
              </div>
            )}

            {/* Conflict Status Pill (Admin) */}
            {role === 'admin' && (
              <button
                onClick={onOpenAuditModal}
                className={`hidden sm:flex items-center gap-2 h-9 px-3.5 text-xs font-semibold rounded-full border transition-all ${
                  conflictCount > 0
                    ? 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                    : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                }`}
                title="Status Integritas Jadwal Sidang"
              >
                {conflictCount > 0 ? (
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                ) : (
                  <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                )}
                <span>
                  {conflictCount > 0 ? `${conflictCount} Bentrok` : '0 Bentrok'}
                </span>
              </button>
            )}


            {/* Multi-Role Switcher */}
            {currentUser && Array.isArray(currentUser.roles) && currentUser.roles.length > 1 && (
              <div className="hidden sm:flex items-center gap-1 p-1 bg-slate-100 rounded-2xl border border-slate-200/80">
                <span className="text-[11px] font-semibold text-slate-500 px-2 uppercase tracking-wider">Peran:</span>
                {currentUser.roles.map(r => (
                  <button
                    key={r}
                    onClick={() => switchActiveRole(r)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-all ${
                      currentUser.activeRole === r
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-white'
                    }`}
                  >
                    {r === 'admin' ? 'Admin' : r === 'dosen' ? 'Dosen' : 'Mhs'}
                  </button>
                ))}
              </div>
            )}

            {/* Divider */}
            <div className="h-7 w-px bg-slate-200 mx-1" />

            {/* User Profile */}
            <div className="flex items-center gap-2.5">
              {currentUser?.lecturerId && lecturers.find(l => l.id === currentUser.lecturerId)?.photoUrl ? (
                <img
                  src={lecturers.find(l => l.id === currentUser.lecturerId)?.photoUrl}
                  alt={currentUser.name}
                  className="w-8 h-8 rounded-full object-cover shadow-xs border border-indigo-200 shrink-0"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white font-bold text-xs flex items-center justify-center shadow-xs uppercase shrink-0">
                  {(currentUser?.name || 'US').slice(0, 2).toUpperCase()}
                </div>
              )}
              <div className="hidden sm:block text-left shrink-0">
                <div className="text-sm font-semibold text-slate-900 leading-tight whitespace-nowrap" title={currentUser?.name}>
                  {currentUser?.name || 'Pengguna'}
                </div>
                <div className="flex items-center gap-1.5 mt-0.5 whitespace-nowrap">
                  <span className={`text-[11px] font-semibold uppercase px-2.5 py-0.5 rounded-full border whitespace-nowrap ${
                    role === 'admin'
                      ? 'text-indigo-700 bg-indigo-50 border-indigo-200'
                      : role === 'dosen'
                      ? 'text-blue-700 bg-blue-50 border-blue-200'
                      : 'text-emerald-700 bg-emerald-50 border-emerald-200'
                  }`}>
                    {role === 'admin'
                      ? (currentUser && Array.isArray(currentUser.roles) && currentUser.roles.includes('dosen')
                          ? 'Panitia Sidang'
                          : 'Administrator Panitia')
                      : role === 'dosen'
                      ? 'Dosen Penguji'
                      : 'Mahasiswa'}
                  </span>
                  {currentUser && Array.isArray(currentUser.roles) && currentUser.roles.length > 1 && (
                    <span className="text-[10px] font-semibold text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded-full border border-purple-200 whitespace-nowrap">
                      Dual
                    </span>
                  )}
                </div>
              </div>

              {onOpenChangePasswordModal && (
                <button
                  onClick={onOpenChangePasswordModal}
                  className="h-9 w-9 rounded-full flex items-center justify-center text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 border border-slate-200 transition-colors"
                  title="Ubah Password Akun"
                >
                  <KeyRound className="w-4 h-4" />
                </button>
              )}

              <button
                onClick={logout}
                className="h-9 w-9 rounded-full flex items-center justify-center text-slate-500 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 transition-colors"
                title="Keluar dari Akun (Logout)"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>

          </div>
        </div>
      </div>
    </header>
  );
};
