import React from 'react';
import { useSchedule } from '../../context/ScheduleContext';
import { UserRole } from '../../types';
import { 
  CalendarDays, 
  ShieldCheck, 
  GraduationCap, 
  UserCheck, 
  RotateCcw, 
  FileSpreadsheet, 
  AlertCircle
} from 'lucide-react';
import { auditAllSchedules } from '../../utils/conflictChecker';

interface HeaderProps {
  onOpenAuditModal: () => void;
  onOpenExportModal: () => void;
  onOpenImportModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({ 
  onOpenAuditModal, 
  onOpenExportModal, 
  onOpenImportModal,
}) => {
  const { 
    role, 
    setRole, 
    schedules, 
    lecturers, 
    rooms, 
    resetData,
    currentLecturerId,
    setCurrentLecturerId,
    currentStudentNim,
    setCurrentStudentNim
  } = useSchedule();

  // Audit count
  const allConflicts = auditAllSchedules(schedules, lecturers, rooms);
  const conflictCount = allConflicts.length;

  const roles: { id: UserRole; label: string; icon: React.ReactNode; desc: string }[] = [
    {
      id: 'admin',
      label: 'Admin / Panitia',
      icon: <ShieldCheck className="w-4 h-4" />,
      desc: 'Drag & Drop Matrix & Manajemen'
    },
    {
      id: 'dosen',
      label: 'Dosen Penguji',
      icon: <UserCheck className="w-4 h-4" />,
      desc: 'Tampilan Jadwal & Per-Dosen'
    },
    {
      id: 'mahasiswa',
      label: 'Mahasiswa',
      icon: <GraduationCap className="w-4 h-4" />,
      desc: 'Jadwal & Cetak Label Draft'
    }
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between py-3 gap-3">
          
          {/* Logo & Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white p-1 border border-slate-200/80 shadow-xs flex items-center justify-center shrink-0">
              <img
                src="/logo-unikom.png"
                alt="Logo UNIKOM"
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-slate-900 tracking-tight leading-none">
                  SIM SKRIPSI
                </h1>
                <span className="text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200/60">
                  IF UNIKOM
                </span>
              </div>
              <p className="text-xs text-slate-500 font-normal mt-0.5">
                Sistem Informasi Manajemen Skripsi IF UNIKOM
              </p>
            </div>
          </div>

          {/* Role Switcher Pill */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200/70 self-start md:self-center">
            {roles.map(r => {
              const isActive = role === r.id;
              return (
                <button
                  key={r.id}
                  onClick={() => setRole(r.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
                    isActive
                      ? 'bg-white text-indigo-700 shadow-xs border border-slate-200/60'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                  }`}
                >
                  <span className={isActive ? 'text-indigo-600' : 'text-slate-400'}>
                    {r.icon}
                  </span>
                  <span>{r.label}</span>
                </button>
              );
            })}
          </div>

          {/* Contextual Action & Profile Selector based on Role */}
          <div className="flex items-center gap-2">
            {role === 'admin' && (
              <>
                <button
                  onClick={onOpenAuditModal}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                    conflictCount > 0
                      ? 'bg-rose-50 text-rose-700 border-rose-300 hover:bg-rose-100'
                      : 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100'
                  }`}
                  title="Cek Status Validasi Matriks Jadwal"
                >
                  {conflictCount > 0 ? (
                    <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
                  ) : (
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  )}
                  <span>{conflictCount > 0 ? `${conflictCount} Bentrok` : '0 Bentrok (Aman)'}</span>
                </button>

                <button
                  onClick={onOpenImportModal}
                  className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-lg shadow-2xs transition-colors"
                  title="Impor Data Mahasiswa dari Excel / CSV"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="hidden sm:inline">Impor XLSX</span>
                </button>

                <button
                  onClick={onOpenExportModal}
                  className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg shadow-2xs transition-colors"
                  title="Ekspor Rekapitulasi Sidang"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-indigo-600" />
                  <span className="hidden sm:inline">Rekap</span>
                </button>

                <button
                  onClick={resetData}
                  className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors"
                  title="Reset Data Awal Mock"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </>
            )}

            {role === 'dosen' && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 font-medium hidden sm:inline">Dosen:</span>
                <select
                  value={currentLecturerId}
                  onChange={(e) => setCurrentLecturerId(e.target.value)}
                  className="text-xs font-medium bg-white text-slate-800 border border-slate-300 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-2xs"
                >
                  {lecturers.map(lec => (
                    <option key={lec.id} value={lec.id}>
                      {lec.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {role === 'mahasiswa' && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 font-medium hidden sm:inline">Mahasiswa:</span>
                <select
                  value={currentStudentNim}
                  onChange={(e) => setCurrentStudentNim(e.target.value)}
                  className="text-xs font-medium bg-white text-slate-800 border border-slate-300 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-2xs"
                >
                  {schedules.map(item => (
                    <option key={item.id} value={item.nim}>
                      {item.nim} - {item.studentName} {item.status === 'scheduled' ? '✓' : '(Antrean)'}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

        </div>
      </div>
    </header>
  );
};

