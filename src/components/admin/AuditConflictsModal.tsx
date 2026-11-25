import React from 'react';
import { useSchedule } from '../../context/ScheduleContext';
import { X, ShieldCheck, AlertTriangle, CheckCircle2, RotateCcw } from 'lucide-react';
import { auditAllSchedules } from '../../utils/conflictChecker';
import { formatIndonesianDate } from '../../utils/formatters';

interface AuditConflictsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuditConflictsModal: React.FC<AuditConflictsModalProps> = ({ isOpen, onClose }) => {
  const { schedules, lecturers, rooms, unassignSchedule } = useSchedule();

  if (!isOpen) return null;

  const conflicts = auditAllSchedules(schedules, lecturers, rooms);
  const conflictCount = conflicts.length;
  const scheduledCount = schedules.filter(s => s.status === 'scheduled').length;

  const scheduleMap = new Map(schedules.map(s => [s.id, s]));

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-xl w-full border border-slate-200/90 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
              conflictCount > 0 ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-700'
            }`}>
              {conflictCount > 0 ? (
                <AlertTriangle className="w-5 h-5" />
              ) : (
                <ShieldCheck className="w-5 h-5" />
              )}
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
                Audit Integritas Matriks Jadwal
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Deteksi otomatis bentrok dosen, ruangan, dan mahasiswa
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Audit Summary Box */}
        <div className="p-6">
          <div className={`p-4 rounded-xl border flex items-center gap-3.5 mb-4 ${
            conflictCount > 0
              ? 'bg-rose-50/80 border-rose-200 text-rose-900'
              : 'bg-emerald-50/80 border-emerald-200 text-emerald-900'
          }`}>
            {conflictCount > 0 ? (
              <AlertTriangle className="w-6 h-6 text-rose-600 shrink-0" />
            ) : (
              <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
            )}
            <div>
              <h4 className="text-sm font-bold">
                {conflictCount > 0
                  ? `Ditemukan ${conflictCount} Jadwal Bentrok!`
                  : 'Sempurna! Semua Jadwal Bebas Bentrok (100% Valid)'}
              </h4>
              <p className="text-xs opacity-90 mt-0.5">
                {conflictCount > 0
                  ? 'Harap sesuaikan atau pindahkan jadwal di bawah ini.'
                  : `Dari ${scheduledCount} sidang yang telah dijadwalkan, tidak ada dosen atau ruangan yang mengalami tabrakan jadwal.`}
              </p>
            </div>
          </div>

          {/* List of conflicts if any */}
          {conflictCount > 0 ? (
            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
              {conflicts.map(c => {
                const item = scheduleMap.get(c.scheduleId);
                if (!item) return null;

                return (
                  <div key={c.scheduleId} className="p-3.5 rounded-xl border border-rose-200 bg-rose-50/40">
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-xs font-bold text-rose-800 bg-rose-100 px-2 py-0.5 rounded">
                          {item.nim}
                        </span>
                        <span className="text-xs font-bold text-slate-800">{item.studentName}</span>
                      </div>
                      <button
                        onClick={() => unassignSchedule(item.id)}
                        className="text-xs text-rose-600 hover:text-rose-800 hover:bg-rose-100 px-2 py-1 rounded-md transition-colors flex items-center gap-1 font-semibold"
                      >
                        <RotateCcw className="w-3 h-3" />
                        Kembalikan ke Antrean
                      </button>
                    </div>

                    <p className="text-xs text-slate-600 mb-2">{item.thesisTitle}</p>

                    <div className="space-y-1">
                      {c.reasons.map((r, idx) => (
                        <p key={idx} className="text-[11px] text-rose-700 bg-white/80 p-1.5 rounded border border-rose-200">
                          ⚠️ {r}
                        </p>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-6 text-center text-slate-400">
              <p className="text-xs font-medium text-slate-600">
                Papan penjadwalan beroperasi dalam kondisi optimal.
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                Sistem validasi real-time mencegah penempatan kartu jika terjadi bentrok.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200/80 bg-slate-50/80 flex items-center justify-end">
          <button
            onClick={onClose}
            className="h-10 px-5 text-sm font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-xl transition-colors shadow-2xs"
          >
            Tutup
          </button>
        </div>

      </div>
    </div>
  );
};

