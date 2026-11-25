import React, { useState, useEffect } from 'react';
import { ScheduleItem, Lecturer } from '../../types';
import { useSchedule } from '../../context/ScheduleContext';
import { getEligibleExaminer3Candidates } from '../../utils/importer';
import { formatIndonesianDate } from '../../utils/formatters';
import { 
  X, 
  UserCheck, 
  RotateCcw,
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Sparkles, 
  Search,
  Calendar,
  DoorClosed,
  UserX,
  GraduationCap
} from 'lucide-react';

interface AssignExaminer3ModalProps {
  item: ScheduleItem | null;
  isOpen: boolean;
  onClose: () => void;
}

export const AssignExaminer3Modal: React.FC<AssignExaminer3ModalProps> = ({ item, isOpen, onClose }) => {
  const { lecturers, schedules, rooms, timeSlots, assignExaminer3 } = useSchedule();
  const [selectedLecId, setSelectedLecId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => {
    setSelectedLecId('');
    setSearchQuery('');
  }, [item?.id, isOpen]);

  if (!isOpen || !item) return null;

  const isReplacing = !!item.examiner3Id;

  const lecturerMap = new Map<string, Lecturer>(lecturers.map(l => [l.id, l]));
  const p1 = lecturerMap.get(item.examiner1Id);
  const p2 = lecturerMap.get(item.examiner2Id);
  const currentP3 = item.examiner3Id ? lecturerMap.get(item.examiner3Id) : null;

  const slot = timeSlots.find(ts => ts.id === item.timeSlotId);
  const room = rooms.find(r => r.id === item.roomId);

  // Eligible candidate lecturers (excludes Pembimbing & Reviewer)
  const allCandidates = getEligibleExaminer3Candidates(
    item.examiner2Id, // advisor
    item.examiner1Id, // reviewer
    lecturers,
    schedules,
    item.date,
    item.timeSlotId || undefined,
    rooms
  );

  // If replacing, exclude the current absent examiner from replacement options
  const candidates = isReplacing
    ? allCandidates.filter(c => c.lecturer.id !== item.examiner3Id)
    : allCandidates;

  // Filter by search query if typed
  const filteredCandidates = candidates.filter(cand => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      cand.lecturer.name.toLowerCase().includes(q) ||
      cand.lecturer.code.toLowerCase().includes(q) ||
      cand.lecturer.department.toLowerCase().includes(q)
    );
  });

  // Default selection
  const defaultCandidateId = candidates.find(c => c.isAvailable)?.lecturer.id || candidates[0]?.lecturer.id || '';
  const activeSelection = selectedLecId || (isReplacing ? defaultCandidateId : (item.examiner3Id || defaultCandidateId));

  const handleSave = () => {
    if (!activeSelection) return;
    assignExaminer3(item.id, activeSelection);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-xl w-full border border-slate-200/90 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col my-auto max-h-[90vh]">
        
        {/* Header */}
        <div className={`px-6 py-5 border-b border-slate-100 flex items-center justify-between ${
          isReplacing ? 'bg-amber-50/40' : 'bg-slate-50/50'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
              isReplacing 
                ? 'bg-amber-100 text-amber-700 ring-4 ring-amber-50' 
                : 'bg-teal-50 text-teal-700 ring-4 ring-teal-50/50'
            }`}>
              {isReplacing ? <RotateCcw className="w-5 h-5" /> : <UserCheck className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-tight flex items-center gap-2">
                <span>{isReplacing ? 'Ganti Dosen Penguji 3' : 'Alokasi Dosen Penguji 3'}</span>
                {isReplacing && (
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300">
                    Berhalangan Hadir
                  </span>
                )}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {isReplacing 
                  ? 'Pilih dosen pengganti Penguji 3 yang berhalangan hadir pada sesi pelaksanaan sidang ini'
                  : 'Pilih dosen penguji ke-3 berdasarkan ketersediaan dan pemerataan jadwal'}
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

        {/* Content Body */}
        <div className="p-5 space-y-4 overflow-y-auto">
          
          {/* Berhalangan Hadir Alert Banner */}
          {isReplacing && currentP3 && (
            <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/90 shadow-2xs flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 mt-0.5">
                <UserX className="w-4 h-4 text-rose-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 border border-rose-200 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    Berhalangan Hadir
                  </span>
                  <span className="text-xs font-semibold text-amber-900">Penguji 3 Semula</span>
                </div>
                <p className="text-sm font-bold text-slate-800 line-through decoration-rose-500 decoration-2 mt-1">
                  {currentP3.name}
                </p>
                <p className="text-[11px] text-amber-800 mt-0.5 leading-relaxed">
                  Dosen di atas berhalangan hadir saat pelaksanaan sidang. Pilih dosen pengganti di bawah yang bebas bentrok pada jadwal sidang ini.
                </p>
              </div>
            </div>
          )}

          {/* Student & Session Information */}
          <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/80 space-y-3 text-xs">
            <div>
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                  {item.nim}
                </span>
                <span className="font-bold text-slate-900 uppercase">{item.studentName}</span>
                {item.thesisType && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-200 text-slate-700">
                    {item.thesisType}
                  </span>
                )}
              </div>
              <p className="text-slate-600 line-clamp-1 italic">"{item.thesisTitle}"</p>
            </div>

            {/* Target Session Details (if scheduled) */}
            {item.status === 'scheduled' && item.date && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 p-2.5 rounded-xl bg-white border border-slate-200/90 text-slate-700">
                <div className="flex items-center gap-1.5 min-w-0">
                  <Calendar className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                  <span className="truncate"><strong>Hari:</strong> {formatIndonesianDate(item.date)}</span>
                </div>
                <div className="flex items-center gap-1.5 min-w-0">
                  <Clock className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                  <span className="truncate"><strong>Waktu:</strong> {slot ? `${slot.startTime} - ${slot.endTime} WIB` : item.timeSlotId}</span>
                </div>
                <div className="flex items-center gap-1.5 min-w-0">
                  <DoorClosed className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                  <span className="truncate"><strong>Ruang:</strong> {room?.name || item.roomId}</span>
                </div>
              </div>
            )}

            {/* Locked Roles */}
            <div className="grid grid-cols-2 gap-2.5 pt-1">
              <div className="p-2.5 rounded-xl bg-indigo-50/70 border border-indigo-100">
                <span className="text-[9.5px] uppercase font-bold text-indigo-700 block mb-0.5">
                  Ketua Penguji (Reviewer):
                </span>
                <p className="font-bold text-slate-900 leading-tight truncate">
                  {p1?.name || item.reviewerName || '-'}
                </p>
              </div>

              <div className="p-2.5 rounded-xl bg-sky-50/70 border border-sky-100">
                <span className="text-[9.5px] uppercase font-bold text-sky-700 block mb-0.5">
                  Penguji 2 (Pembimbing):
                </span>
                <p className="font-bold text-slate-900 leading-tight truncate">
                  {p2?.name || item.advisorName || '-'}
                </p>
              </div>
            </div>
          </div>

          {/* Candidate Lecturers Section */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <label className="text-xs font-bold text-slate-800">
                {isReplacing ? 'Pilih Dosen Penguji 3 Pengganti:' : 'Daftar Calon Dosen Penguji 3:'}
              </label>
              <span className="text-[11px] text-slate-500 font-medium">
                ({candidates.length} Dosen Memenuhi Syarat)
              </span>
            </div>

            {/* Aturan Proporsional Notice */}
            <div className="p-2.5 rounded-xl bg-indigo-50/70 border border-indigo-100 text-[11px] text-indigo-900 flex items-start gap-2">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600 shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                <strong>Aturan Proporsional:</strong> Semakin sedikit dosen menjadi Reviewer atau Pembimbing (P1/P2), semakin besar proporsi untuk ditugaskan sebagai Penguji 3, begitu pula sebaliknya.
              </p>
            </div>

            {/* Quick Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Cari nama dosen atau kode..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 transition-all"
              />
            </div>

            {/* List */}
            <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
              {filteredCandidates.length === 0 ? (
                <div className="text-center py-6 text-xs text-slate-400">
                  Tidak ada dosen yang cocok dengan pencarian.
                </div>
              ) : (
                filteredCandidates.map((cand, idx) => {
                  const isSelected = activeSelection === cand.lecturer.id;
                  const isRecommended = idx === 0 && cand.isAvailable;

                  return (
                    <div
                      key={cand.lecturer.id}
                      onClick={() => setSelectedLecId(cand.lecturer.id)}
                      className={`p-3 rounded-2xl border text-left cursor-pointer transition-all duration-150 flex items-center justify-between gap-3 ${
                        isSelected
                          ? isReplacing
                            ? 'bg-amber-50/90 border-amber-500 ring-2 ring-amber-500/20 shadow-xs'
                            : 'bg-teal-50/90 border-teal-500 ring-2 ring-teal-500/20 shadow-xs'
                          : !cand.isAvailable
                          ? 'bg-rose-50/40 border-rose-200 opacity-60'
                          : 'bg-white hover:bg-slate-50 border-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <input
                          type="radio"
                          name="examiner3"
                          checked={isSelected}
                          onChange={() => setSelectedLecId(cand.lecturer.id)}
                          className={isReplacing ? "text-amber-600 focus:ring-amber-500 h-4 w-4" : "text-teal-600 focus:ring-teal-500 h-4 w-4"}
                        />
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                              {cand.lecturer.name}
                            </h4>
                            {isRecommended && (
                              <span className="text-[10px] font-bold text-teal-800 bg-teal-100 border border-teal-300 px-2 py-0.5 rounded-full flex items-center gap-1 shrink-0">
                                <Sparkles className="w-3 h-3" />
                                Rekomendasi Utama
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                            {cand.lecturer.department} • Kode: {cand.lecturer.code}
                          </p>

                          {/* Detail Proporsi & Beban Reviewer/Pembimbing */}
                          <div className="flex items-center gap-1.5 flex-wrap mt-1 text-[10px]">
                            <span className="font-semibold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200/70" title="Beban sebagai Reviewer & Pembimbing">
                              Reviewer/Pembimbing: <strong>{cand.primaryLoad} mhs</strong> ({cand.reviewerCount} Rev + {cand.advisorCount} Pemb)
                            </span>
                            <span className="font-semibold px-2 py-0.5 rounded-md bg-teal-50 text-teal-700 border border-teal-200/70" title="Telah ditugaskan sebagai Penguji 3">
                              Penguji 3: <strong>{cand.examiner3Count}</strong>
                            </span>
                            <span className={`font-bold px-2 py-0.5 rounded-md border ${
                              cand.proportionLabel === 'Tinggi'
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                : cand.proportionLabel === 'Sedang'
                                ? 'bg-amber-50 text-amber-800 border-amber-300'
                                : 'bg-slate-100 text-slate-600 border-slate-300'
                            }`} title="Prioritas alokasi proporsional sebagai Penguji 3">
                              Proporsi P3: {cand.proportionLabel}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="text-[11px] font-semibold text-slate-700">
                          Beban: {cand.currentWorkload} Sidang
                        </div>
                        {cand.isAvailable ? (
                          <span className="text-[11px] font-semibold text-emerald-600 flex items-center justify-end gap-1 mt-0.5">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Bebas Bentrok
                          </span>
                        ) : (
                          <span className="text-[11px] font-semibold text-rose-600 flex items-center justify-end gap-1 mt-0.5" title={cand.conflictReason}>
                            <AlertTriangle className="w-3.5 h-3.5" />
                            Ada Jadwal Lain
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200/80 bg-slate-50/80 flex items-center justify-end gap-3 shrink-0">
          <button
            onClick={onClose}
            className="h-10 px-4 text-xs sm:text-sm font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-xl transition-colors"
          >
            Batal
          </button>
          
          <button
            onClick={handleSave}
            disabled={!activeSelection || (isReplacing && activeSelection === item.examiner3Id)}
            className={`inline-flex items-center justify-center gap-2 h-10 px-5 text-xs sm:text-sm font-semibold text-white rounded-xl shadow-xs transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
              isReplacing 
                ? 'bg-amber-600 hover:bg-amber-700 active:bg-amber-800'
                : 'bg-teal-600 hover:bg-teal-700 active:bg-teal-800'
            }`}
          >
            {isReplacing ? <RotateCcw className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
            <span>{isReplacing ? 'Simpan Penggantian Penguji 3' : 'Tetapkan Penguji 3'}</span>
          </button>
        </div>

      </div>
    </div>
  );
};
