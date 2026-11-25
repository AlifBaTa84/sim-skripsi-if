import React, { useMemo, useState } from 'react';
import { ScheduleItem, Room, TimeSlot, Lecturer } from '../../types';
import { checkScheduleConflict } from '../../utils/conflictChecker';
import {
  X,
  Search,
  GraduationCap,
  Users,
  CheckCircle2,
  AlertTriangle,
  Clock,
  MapPin,
  MousePointerClick,
  BookOpen,
  ChevronRight,
} from 'lucide-react';

interface QuickScheduleModalProps {
  /** Target slot that was clicked */
  targetSlot: TimeSlot | null;
  /** Target room that was clicked */
  targetRoom: Room | null;
  /** Selected date on the board */
  selectedDate: string;
  /** All schedules (to run conflict checks) */
  allSchedules: ScheduleItem[];
  /** All rooms (for conflict engine) */
  allRooms: Room[];
  /** Lecturer list (for display & conflict check) */
  lecturers: Lecturer[];
  /** Unassigned students queue */
  unassignedItems: ScheduleItem[];
  /** Called when the user picks a student */
  onAssign: (itemId: string) => void;
  /** Called to close modal */
  onClose: () => void;
}

export const QuickScheduleModal: React.FC<QuickScheduleModalProps> = ({
  targetSlot,
  targetRoom,
  selectedDate,
  allSchedules,
  allRooms,
  lecturers,
  unassignedItems,
  onAssign,
  onClose,
}) => {
  const [search, setSearch] = useState('');

  const lecturerMap = useMemo(
    () => new Map<string, Lecturer>(lecturers.map(l => [l.id, l])),
    [lecturers]
  );

  // For each unassigned student, run the same conflict check used by drag & drop (sorted by NIM)
  const candidatesWithStatus = useMemo(() => {
    if (!targetSlot || !targetRoom) return [];

    const sorted = [...unassignedItems].sort((a, b) =>
      a.nim.localeCompare(b.nim, undefined, { numeric: true })
    );

    return sorted.map(item => {
      const conflict = checkScheduleConflict(
        item,
        selectedDate,
        targetSlot.id,
        targetRoom.id,
        allSchedules,
        lecturers,
        allRooms
      );
      return { item, conflict };
    });
  }, [unassignedItems, targetSlot, targetRoom, selectedDate, allSchedules, lecturers, allRooms]);

  // Filter by search
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return candidatesWithStatus;
    return candidatesWithStatus.filter(
      ({ item }) =>
        item.studentName.toLowerCase().includes(q) ||
        item.nim.toLowerCase().includes(q) ||
        item.thesisTitle.toLowerCase().includes(q)
    );
  }, [candidatesWithStatus, search]);

  const validCount = filtered.filter(c => !c.conflict.hasConflict).length;
  const conflictCount = filtered.filter(c => c.conflict.hasConflict).length;

  if (!targetSlot || !targetRoom) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white w-full max-w-2xl max-h-[90vh] rounded-3xl shadow-2xl border border-slate-200/90 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">

        {/* ── Modal Header ─────────────────────────────────────────── */}
        <div className="px-6 py-5 border-b border-slate-100 bg-gradient-to-r from-indigo-50/70 to-white flex items-start justify-between gap-3 shrink-0">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
              <MousePointerClick className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
                Jadwalkan ke Slot Ini
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Pilih mahasiswa dari antrean untuk ditempatkan di slot yang dipilih
              </p>
              {/* Slot + Room badge */}
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white rounded-full border border-indigo-200 text-indigo-700 text-xs font-bold shadow-2xs">
                  <Clock className="w-3.5 h-3.5 text-indigo-500" />
                  {targetSlot.label}
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white rounded-full border border-indigo-200 text-indigo-700 text-xs font-bold shadow-2xs">
                  <MapPin className="w-3.5 h-3.5 text-indigo-500" />
                  {targetRoom.name}
                </span>
                <span className="text-xs text-slate-500">
                  {targetRoom.building} · {targetRoom.floor}
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ── Legend & Stats Row ────────────────────────────────────── */}
        <div className="px-5 py-2.5 bg-slate-50/80 border-b border-slate-100 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-4 text-xs">
            <span className="flex items-center gap-1.5 text-emerald-700 font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              {validCount} Bebas Bentrok
            </span>
            <span className="flex items-center gap-1.5 text-rose-600 font-semibold">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
              {conflictCount} Ada Bentrok
            </span>
          </div>
          <span className="text-[11px] text-slate-400">
            {filtered.length} dari {unassignedItems.length} mahasiswa · Diurutkan berdasarkan NIM
          </span>
        </div>

        {/* ── Search Bar ────────────────────────────────────────────── */}
        <div className="px-5 py-3 border-b border-slate-100 shrink-0">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              autoFocus
              type="text"
              placeholder="Cari NIM, nama mahasiswa, atau judul skripsi..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            />
          </div>
        </div>

        {/* ── Candidate List ────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400 gap-3">
              <GraduationCap className="w-12 h-12 text-slate-200 stroke-[1.5]" />
              <div className="text-center">
                <p className="font-semibold text-slate-600">Tidak ada mahasiswa ditemukan</p>
                <p className="text-xs text-slate-400 mt-1">
                  {unassignedItems.length === 0
                    ? 'Semua mahasiswa telah terjadwal. Gunakan antrean untuk menambah.'
                    : 'Coba ubah kata kunci pencarian.'}
                </p>
              </div>
            </div>
          ) : (
            filtered.map(({ item, conflict }) => {
              const p1 = lecturerMap.get(item.examiner1Id);
              const p2 = lecturerMap.get(item.examiner2Id);
              const p3 = lecturerMap.get(item.examiner3Id);
              const isConflict = conflict.hasConflict;

              return (
                <div
                  key={item.id}
                  className={`px-5 py-4 group transition-colors ${
                    isConflict
                      ? 'opacity-60 cursor-not-allowed bg-rose-50/30'
                      : 'hover:bg-indigo-50/50 cursor-pointer'
                  }`}
                  onClick={() => {
                    if (!isConflict) {
                      onAssign(item.id);
                      onClose();
                    }
                  }}
                  title={isConflict ? conflict.reasons.join(' | ') : 'Klik untuk menjadwalkan'}
                >
                  <div className="flex items-start gap-4">
                    {/* Status Icon */}
                    <div className={`mt-0.5 shrink-0 w-9 h-9 rounded-xl flex items-center justify-center ${
                      isConflict
                        ? 'bg-rose-100 text-rose-500'
                        : 'bg-emerald-100 text-emerald-600 group-hover:bg-emerald-200 transition-colors'
                    }`}>
                      {isConflict
                        ? <AlertTriangle className="w-4.5 h-4.5" />
                        : <CheckCircle2 className="w-4.5 h-4.5" />
                      }
                    </div>

                    {/* Student Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                          {item.nim}
                        </span>
                        {item.thesisType && (
                          <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">
                            {item.thesisType}
                          </span>
                        )}
                      </div>

                      <p className="text-sm font-bold text-slate-900 mt-1 leading-tight">
                        {item.studentName}
                      </p>

                      <p className="text-xs text-slate-500 mt-0.5 leading-snug line-clamp-2 italic">
                        <BookOpen className="w-3 h-3 inline text-slate-400 mr-1" />
                        {item.thesisTitle}
                      </p>

                      {/* Examiner Tags */}
                      <div className="flex flex-wrap items-center gap-1.5 mt-2">
                        {[
                          { label: 'P1', name: p1?.name, color: 'bg-indigo-100 text-indigo-700' },
                          { label: 'P2', name: p2?.name, color: 'bg-sky-100 text-sky-700' },
                          { label: 'P3', name: p3?.name, color: 'bg-teal-100 text-teal-700' },
                        ].map(({ label, name, color }) => (
                          name ? (
                            <span
                              key={label}
                              className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${color}`}
                            >
                              <Users className="w-3 h-3" />
                              <strong>{label}:</strong> {name}
                            </span>
                          ) : null
                        ))}
                      </div>

                      {/* Conflict Reason (if any) */}
                      {isConflict && conflict.reasons.length > 0 && (
                        <div className="mt-2 p-2 bg-rose-50 rounded-lg border border-rose-200">
                          <p className="text-[11px] font-semibold text-rose-700 flex items-start gap-1">
                            <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-rose-500" />
                            <span>{conflict.reasons[0]}</span>
                          </p>
                        </div>
                      )}
                    </div>

                    {/* CTA Arrow (only for valid) */}
                    {!isConflict && (
                      <div className="shrink-0 mt-1 text-slate-300 group-hover:text-indigo-500 transition-colors">
                        <ChevronRight className="w-5 h-5" />
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* ── Footer ──────────────────────────────────────────────── */}
        <div className="px-6 py-4 border-t border-slate-200/80 bg-slate-50/80 flex items-center justify-between gap-3 shrink-0">
          <p className="text-xs text-slate-500 flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
            <span>Mahasiswa dengan bentrok jadwal <strong>tidak dapat</strong> dipilih.</span>
          </p>
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

