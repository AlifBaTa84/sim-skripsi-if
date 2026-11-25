import React, { useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { ScheduleItem } from '../../types';
import { DraggableQueueCard } from './DraggableQueueCard';
import { 
  Users, 
  Search, 
  RotateCcw, 
  CheckCircle2, 
  Inbox,
  Upload,
  BookOpen,
  GraduationCap
} from 'lucide-react';
import { useSchedule } from '../../context/ScheduleContext';

interface UnassignedQueueProps {
  onOpenImportModal?: () => void;
  onManualAssign: (item: ScheduleItem) => void;
  onAssignExaminer3: (item: ScheduleItem) => void;
  onAssignReviewer?: (item: ScheduleItem) => void;
  onViewSeminarHistory?: (item: ScheduleItem) => void;
  onRescheduleSeminar?: (item: ScheduleItem) => void;
}

export const UnassignedQueue: React.FC<UnassignedQueueProps> = ({
  onOpenImportModal,
  onManualAssign,
  onAssignExaminer3,
  onAssignReviewer,
  onViewSeminarHistory,
  onRescheduleSeminar,
}) => {
  const { 
    schedules, 
    lecturers, 
    activeDragItem, 
    selectedPeriodId, 
    activePeriod,
    activityTypeFilter
  } = useSchedule();
  const [searchTerm, setSearchTerm] = useState('');

  // Droppable zone so items from grid can be dragged back here to unassign
  const { setNodeRef, isOver } = useDroppable({
    id: 'unassigned-zone',
    data: { type: 'queue' },
  });

  const currentPeriodId = selectedPeriodId || activePeriod?.id;
  
  // Base unassigned list for current viewing period
  const allUnassignedInPeriod = schedules
    .filter(s => s.status === 'unassigned' && (s.academicPeriodId === currentPeriodId || (!s.academicPeriodId && activePeriod?.id === currentPeriodId)))
    .sort((a, b) => a.nim.localeCompare(b.nim, undefined, { numeric: true }));

  // Filter based on activity filter (all / seminar / sidang)
  const filteredByActivity = allUnassignedInPeriod.filter(item => {
    if (activityTypeFilter === 'seminar') return item.activityType === 'seminar';
    if (activityTypeFilter === 'sidang') return item.activityType !== 'seminar';
    return true;
  });

  const totalSeminarQueue = allUnassignedInPeriod.filter(s => s.activityType === 'seminar').length;
  const totalSidangQueue = allUnassignedInPeriod.filter(s => s.activityType !== 'seminar').length;

  // Search filter
  const filteredList = filteredByActivity.filter(item => {
    const q = searchTerm.toLowerCase();
    const studentMatch = item.studentName.toLowerCase().includes(q) || item.nim.includes(q);
    const titleMatch = item.thesisTitle.toLowerCase().includes(q);
    return studentMatch || titleMatch;
  });

  const isDraggingFromGrid = activeDragItem && activeDragItem.status === 'scheduled';

  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col bg-slate-50/80 rounded-2xl border transition-all duration-200 p-4 h-full overflow-hidden ${
        isOver
          ? 'bg-amber-50/90 border-amber-400 ring-2 ring-amber-400/30'
          : 'border-slate-200/80 shadow-xs'
      }`}
    >
      {/* Header: Informasi Jumlah Mahasiswa Belum Terjadwal */}
      <div className="flex flex-col gap-2 p-3 bg-white rounded-2xl border border-slate-200/80 shadow-xs mb-3 shrink-0">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
              <Users className="w-4 h-4" />
            </div>
            <span className="text-sm font-bold text-slate-800 whitespace-nowrap">
              Antrean Belum Terjadwal
            </span>
          </div>

          <span className="text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 rounded-full whitespace-nowrap shrink-0">
            {filteredByActivity.length} Mahasiswa
          </span>
        </div>

        {/* Sub-counts for Seminar & Sidang */}
        <div className="flex items-center gap-2 pt-1 border-t border-slate-100 text-[11px]">
          <span className="inline-flex items-center gap-1 text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md font-semibold border border-emerald-200/60">
            <BookOpen className="w-3 h-3 text-emerald-600" />
            Seminar: {totalSeminarQueue}
          </span>
          <span className="inline-flex items-center gap-1 text-indigo-800 bg-indigo-50 px-2 py-0.5 rounded-md font-semibold border border-indigo-200/60">
            <GraduationCap className="w-3 h-3 text-indigo-600" />
            Sidang: {totalSidangQueue}
          </span>
        </div>
      </div>

      {/* Drop area banner when dragging an item from the grid */}
      {isDraggingFromGrid && (
        <div className={`p-3 rounded-2xl mb-3 border text-center transition-all shrink-0 ${
          isOver 
            ? 'bg-amber-100 border-amber-500 text-amber-900' 
            : 'bg-amber-50 border-dashed border-amber-300 text-amber-800'
        }`}>
          <p className="text-xs font-bold flex items-center justify-center gap-1.5">
            <RotateCcw className="w-3.5 h-3.5" />
            {isOver ? 'Lepaskan untuk Kembalikan ke Antrean' : 'Tarik ke sini untuk Membatalkan Jadwal'}
          </p>
        </div>
      )}

      {/* Search Input */}
      <div className="relative mb-3 shrink-0">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Cari NIM atau nama mahasiswa..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full h-10 text-xs pl-9 pr-3.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 placeholder:text-slate-400 shadow-2xs transition-all"
        />
      </div>

      {/* Queue List */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden space-y-3 pr-1 min-h-0">
        {filteredList.length > 0 ? (
          filteredList.map(item => (
            <DraggableQueueCard
              key={item.id}
              item={item}
              lecturers={lecturers}
              onManualAssign={onManualAssign}
              onAssignExaminer3={onAssignExaminer3}
              onAssignReviewer={onAssignReviewer}
              onViewSeminarHistory={onViewSeminarHistory}
              onRescheduleSeminar={onRescheduleSeminar}
            />
          ))
        ) : (
          <div className="h-full flex flex-col items-center justify-center py-10 px-4 text-center">
            {searchTerm ? (
              <>
                <Search className="w-8 h-8 text-slate-300 mb-2" />
                <p className="text-xs font-semibold text-slate-600">Tidak ada hasil ditemukan</p>
                <p className="text-[11px] text-slate-400 mt-1">Coba kata kunci pencarian lain</p>
              </>
            ) : allUnassignedInPeriod.length === 0 ? (
              <>
                <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mb-2.5">
                  <Inbox className="w-6 h-6 text-slate-400" />
                </div>
                <p className="text-xs font-bold text-slate-700">Belum Ada Data Mahasiswa</p>
                <p className="text-[11px] text-slate-500 mt-1 max-w-[220px] leading-relaxed">
                  Data antrean masih kosong. Silakan impor data mahasiswa (.xlsx) untuk mulai menjadwalkan.
                </p>
                {onOpenImportModal && (
                  <button
                    onClick={onOpenImportModal}
                    className="mt-3.5 inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition-colors shadow-2xs"
                  >
                    <Upload className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Impor Data (.XLSX)</span>
                  </button>
                )}
              </>
            ) : (
              <>
                <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mb-2">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <p className="text-xs font-bold text-slate-700">
                  Semua {activityTypeFilter === 'seminar' ? 'Seminar' : activityTypeFilter === 'sidang' ? 'Sidang' : 'Mahasiswa'} Terjadwal!
                </p>
                <p className="text-[11px] text-slate-500 mt-1 max-w-[200px] leading-relaxed">
                  Seluruh mahasiswa pada kategori filter ini telah memiliki jadwal.
                </p>
              </>
            )}
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="mt-3 pt-2.5 border-t border-slate-200/70 text-[10px] text-slate-400 flex items-center justify-between shrink-0">
        <span className="flex items-center gap-1">
          <Inbox className="w-3 h-3" />
          Tarik kartu ke sel matriks
        </span>
        <span>Seminar (2 Dosen) | Sidang (3 Dosen)</span>
      </div>
    </div>
  );
};
