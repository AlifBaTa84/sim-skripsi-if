import React from 'react';
import { useSchedule } from '../../context/ScheduleContext';
import { auditAllSchedules } from '../../utils/conflictChecker';
import { 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  RotateCcw, 
  Building2, 
  Clock, 
  Users, 
  UserX,
  Sparkles
} from 'lucide-react';
import { formatIndonesianDate } from '../../utils/formatters';

export const AuditConflictsView: React.FC = () => {
  const { schedules, lecturers, rooms, timeSlots, unassignSchedule } = useSchedule();

  const conflicts = auditAllSchedules(schedules, lecturers, rooms);
  const conflictCount = conflicts.length;
  const scheduledCount = schedules.filter(s => s.status === 'scheduled').length;

  const scheduleMap = new Map(schedules.map(s => [s.id, s]));
  const roomMap = new Map(rooms.map(r => [r.id, r.name]));
  const timeSlotMap = new Map(timeSlots.map(t => [t.id, t.label]));

  return (
    <div className="space-y-5">
      {/* ── Top Header Card (Dashboard Integrated) ── */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className={`text-[11px] font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
              conflictCount > 0
                ? 'bg-rose-50 text-rose-700 border-rose-200'
                : 'bg-emerald-50 text-emerald-700 border-emerald-200'
            }`}>
              Audit Integritas Matriks
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mt-1.5 flex items-center gap-2">
            <span>Audit Bentrok Jadwal Sidang</span>
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Validasi komprehensif penugasan dosen penguji, ruangan sidang, dan integritas referensial jadwal
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <div className="flex items-center gap-2 h-10 px-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold">
            <span className="text-slate-500">Total Sidang Terjadwal:</span>
            <span className="font-mono font-bold text-slate-800 text-sm">{scheduledCount}</span>
          </div>
          <div className={`flex items-center gap-2 h-10 px-3.5 rounded-xl border text-xs font-bold ${
            conflictCount > 0
              ? 'bg-rose-50 text-rose-700 border-rose-200'
              : 'bg-emerald-50 text-emerald-700 border-emerald-200'
          }`}>
            <span className={`w-2 h-2 rounded-full ${conflictCount > 0 ? 'bg-rose-500 animate-pulse' : 'bg-emerald-500'}`} />
            <span>{conflictCount > 0 ? `${conflictCount} Bentrok Terdeteksi` : '0 Bentrok (100% Valid)'}</span>
          </div>
        </div>
      </div>

      {/* ── Big Status Banner ── */}
      <div className={`p-5 rounded-2xl border flex items-start gap-4 transition-all ${
        conflictCount > 0
          ? 'bg-rose-50/90 border-rose-200 text-rose-900'
          : 'bg-emerald-50/90 border-emerald-200 text-emerald-900'
      }`}>
        <div className={`p-2.5 rounded-xl shrink-0 ${conflictCount > 0 ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'}`}>
          {conflictCount > 0 ? <AlertTriangle className="w-6 h-6" /> : <CheckCircle2 className="w-6 h-6" />}
        </div>
        <div>
          <h4 className="text-sm font-extrabold">
            {conflictCount > 0
              ? `Perhatian: Ditemukan ${conflictCount} Jadwal Sidang yang Mengalami Bentrok!`
              : 'Sempurna! Seluruh Jadwal Sidang Bebas Bentrok (100% Valid)'}
          </h4>
          <p className="text-xs opacity-90 mt-1 leading-relaxed">
            {conflictCount > 0
              ? 'Terdapat bentrok waktu penugasan dosen penguji atau bentrok penggunaan ruangan pada tanggal dan sesi yang sama. Klik tombol "Kembalikan ke Antrean" untuk memindahkan jadwal tersebut.'
              : `Dari total ${scheduledCount} sidang yang aktif di matriks, tidak ada dosen yang ditugaskan di 2 ruangan bersamaan dan tidak ada ruangan yang dipakai ganda.`}
          </p>
        </div>
      </div>

      {/* ── Conflict Items Section (if any) ── */}
      {conflictCount > 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 space-y-3">
          <h4 className="text-xs font-extrabold uppercase tracking-wider text-rose-700 flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4" />
            <span>Daftar Sidang yang Perlu Resolusi Segera:</span>
          </h4>

          <div className="space-y-3">
            {conflicts.map(c => {
              const item = scheduleMap.get(c.scheduleId);
              if (!item) return null;

              return (
                <div key={c.scheduleId} className="p-4 rounded-xl border border-rose-200 bg-rose-50/40 space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-rose-800 bg-rose-100 px-2.5 py-0.5 rounded-md border border-rose-200">
                        {item.nim}
                      </span>
                      <span className="text-sm font-bold text-slate-900">{item.studentName}</span>
                      <span className="text-xs text-slate-400">•</span>
                      <span className="text-xs font-medium text-slate-600">
                        {formatIndonesianDate(item.date)} ({timeSlotMap.get(item.timeSlotId || '')} WIB - Ruang {roomMap.get(item.roomId || '')})
                      </span>
                    </div>

                    <button
                      onClick={() => unassignSchedule(item.id)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-rose-700 bg-white hover:bg-rose-100 border border-rose-300 rounded-lg shadow-2xs transition-colors self-start sm:self-auto"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Kembalikan ke Antrean</span>
                    </button>
                  </div>

                  <p className="text-xs text-slate-600 font-medium italic">"{item.thesisTitle}"</p>

                  <div className="space-y-1 pt-1">
                    {c.reasons.map((r, idx) => (
                      <p key={idx} className="text-xs text-rose-800 bg-white p-2 rounded-lg border border-rose-200 flex items-center gap-2 font-medium">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                        <span>{r}</span>
                      </p>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}

      {/* ── Integrity Rules Enforced Grid ── */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-4">
        <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
          Standar Batasan Integritas yang Ditegakkan Otomatis
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="flex items-start gap-3 p-4 rounded-xl bg-slate-50 border border-slate-200/70">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
            <div>
              <strong className="text-slate-800 block text-sm">Anti-Bentrok Ruangan (Unique Constraint)</strong>
              <p className="text-slate-500 text-[11px] mt-1 leading-relaxed">
                Setiap ruangan hanya dapat digunakan oleh 1 sesi sidang pada slot waktu dan tanggal yang sama.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-4 rounded-xl bg-slate-50 border border-slate-200/70">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
            <div>
              <strong className="text-slate-800 block text-sm">Anti-Bentrok Dosen Penguji</strong>
              <p className="text-slate-500 text-[11px] mt-1 leading-relaxed">
                Dosen yang sama tidak dapat dialokasikan menguji di dua ruangan sidang berbeda pada jam yang bersamaan.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-4 rounded-xl bg-slate-50 border border-slate-200/70">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
            <div>
              <strong className="text-slate-800 block text-sm">Aturan 3 Dosen Penguji Berbeda</strong>
              <p className="text-slate-500 text-[11px] mt-1 leading-relaxed">
                Ketua Penguji (Reviewer), Penguji 2 (Pembimbing), dan Penguji 3 wajib merupakan 3 akademisi yang berbeda.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-4 rounded-xl bg-slate-50 border border-slate-200/70">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
            <div>
              <strong className="text-slate-800 block text-sm">Integritas Foreign Key &amp; Referensial</strong>
              <p className="text-slate-500 text-[11px] mt-1 leading-relaxed">
                Seluruh mahasiswa, dosen, ruangan, dan slot waktu wajib terdaftar aktif di master data sebelum dijadwalkan.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
