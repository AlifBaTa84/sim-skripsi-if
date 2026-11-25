import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { ScheduleItem, Lecturer } from '../../types';
import { 
  GripVertical, 
  BookOpen, 
  Calendar, 
  GraduationCap, 
  Users, 
  Award,
  History,
  RotateCcw,
  CheckCircle2,
  XCircle,
  AlertCircle,
  UserCheck,
  UserPlus
} from 'lucide-react';

interface DraggableQueueCardProps {
  item: ScheduleItem;
  lecturers: Lecturer[];
  onManualAssign: (item: ScheduleItem) => void;
  onAssignExaminer3?: (item: ScheduleItem) => void;
  onAssignReviewer?: (item: ScheduleItem) => void;
  onViewSeminarHistory?: (item: ScheduleItem) => void;
  onRescheduleSeminar?: (item: ScheduleItem) => void;
}

export const DraggableQueueCard: React.FC<DraggableQueueCardProps> = ({
  item,
  lecturers,
  onManualAssign,
  onAssignExaminer3,
  onAssignReviewer,
  onViewSeminarHistory,
  onRescheduleSeminar,
}) => {
  const isSeminar = item.activityType === 'seminar';
  const hasReviewer = !!item.examiner1Id && item.examiner1Id !== '';
  const isFailedSeminar = isSeminar && item.seminarResult === 'belum_lulus';

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `queue-${item.id}`,
    data: { item, source: 'queue' },
  });

  const lecturerMap = new Map<string, Lecturer>(lecturers.map(l => [l.id, l]));
  const p1 = lecturerMap.get(item.examiner1Id);
  const p2 = lecturerMap.get(item.examiner2Id);
  const p3 = lecturerMap.get(item.examiner3Id);

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined;

  const hasP3 = !!item.examiner3Id && item.examiner3Id !== '';
  const historyCount = item.seminarHistory?.length || 0;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group relative bg-white rounded-2xl p-3.5 border transition-all duration-200 select-none overflow-hidden w-full ${
        isDragging
          ? 'opacity-40 border-dashed border-indigo-400 shadow-none'
          : isSeminar
          ? 'border-emerald-200/90 shadow-xs hover:shadow-md hover:border-emerald-400'
          : 'border-slate-200/90 shadow-xs hover:shadow-md hover:border-indigo-300'
      }`}
    >
      {/* Header Row: Drag handle, NIM, and Activity Badges */}
      <div className="flex items-center justify-between gap-2 mb-2.5 flex-wrap">
        <div
          {...listeners}
          {...attributes}
          className={`flex items-center gap-1.5 cursor-grab active:cursor-grabbing text-slate-400 transition-colors shrink-0 ${
            isSeminar ? 'group-hover:text-emerald-600' : 'group-hover:text-indigo-600'
          }`}
          title="Tahan dan geser (drag) ke kotak jadwal"
        >
          <GripVertical className="w-4 h-4 shrink-0" />
          <span className={`font-mono text-xs font-bold px-2.5 py-0.5 rounded-lg border whitespace-nowrap ${
            isSeminar
              ? 'text-emerald-800 bg-emerald-50 border-emerald-200'
              : 'text-indigo-700 bg-indigo-50 border-indigo-200/80'
          }`}>
            {item.nim}
          </span>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap shrink-0">
          {/* Activity Badge: Seminar vs Sidang */}
          {isSeminar ? (
            <span className="text-[10px] font-extrabold text-emerald-800 bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded-full flex items-center gap-1 whitespace-nowrap">
              <BookOpen className="w-3 h-3 text-emerald-700 shrink-0" />
              <span>Seminar</span>
            </span>
          ) : (
            <span className="text-[10px] font-extrabold text-indigo-800 bg-indigo-100 border border-indigo-200 px-2 py-0.5 rounded-full flex items-center gap-1 whitespace-nowrap">
              <GraduationCap className="w-3 h-3 text-indigo-700 shrink-0" />
              <span>Sidang</span>
            </span>
          )}

          {/* Attempt badge for multi-attempt seminar */}
          {isSeminar && item.attemptNumber && item.attemptNumber > 1 && (
            <span className="text-[10px] font-bold text-amber-800 bg-amber-50 border border-amber-300 px-2 py-0.5 rounded-full whitespace-nowrap">
              Ke-{item.attemptNumber}
            </span>
          )}

          {/* Failed result indicator */}
          {isFailedSeminar && (
            <span className="text-[10px] font-bold text-rose-800 bg-rose-50 border border-rose-300 px-2 py-0.5 rounded-full flex items-center gap-1 whitespace-nowrap">
              <XCircle className="w-3 h-3 text-rose-600 shrink-0" />
              <span>Belum Lulus</span>
            </span>
          )}

          {/* Sidang Prerequisite Badge */}
          {!isSeminar && item.isSeminarPassed && (
            <span
              className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1 whitespace-nowrap"
              title="Memenuhi syarat: Telah Lulus Seminar Proposal"
            >
              <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
              <span>Seminar Lulus</span>
            </span>
          )}

          {item.seminarScore !== undefined && (
            <span
              className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/90 px-2 py-0.5 rounded-full flex items-center gap-1 whitespace-nowrap"
              title="Nilai Seminar"
            >
              <Award className="w-3 h-3 text-emerald-600 shrink-0" />
              <span>{item.seminarScore}</span>
            </span>
          )}
        </div>
      </div>

      {/* Student Name Box */}
      <div className={`p-2.5 rounded-xl border mb-2 ${
        isSeminar ? 'bg-emerald-50/40 border-emerald-100' : 'bg-slate-50 border-slate-100'
      }`}>
        <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 flex items-center justify-between mb-0.5">
          <div className="flex items-center gap-1">
            <GraduationCap className="w-3.5 h-3.5 text-slate-400" />
            <span>Mahasiswa:</span>
          </div>
          {historyCount > 0 && onViewSeminarHistory && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onViewSeminarHistory(item);
              }}
              className="text-[10px] font-bold text-emerald-700 hover:text-emerald-900 bg-emerald-100/70 hover:bg-emerald-200/80 px-2 py-0.5 rounded flex items-center gap-1 transition-colors"
              title="Lihat seluruh riwayat pelaksanaan seminar terdahulu"
            >
              <History className="w-3 h-3" />
              <span>Riwayat ({historyCount})</span>
            </button>
          )}
        </div>
        <h3 className="text-sm font-bold text-slate-900 uppercase leading-snug break-words">
          {item.studentName}
        </h3>
      </div>

      {/* Thesis Title */}
      <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed flex items-start gap-1 mb-2.5">
        <BookOpen className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
        <span className="italic">"{item.thesisTitle}"</span>
      </p>

      {/* Examiners list */}
      <div className="pt-2 border-t border-slate-100 space-y-1.5">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 flex items-center justify-between">
          <span>{isSeminar ? 'Dosen Seminar (2 Dosen):' : 'Susunan Penguji:'}</span>
        </div>

        {/* Examiner 1 */}
        <div className="text-xs text-slate-700 flex items-start gap-2 bg-slate-50/70 p-1.5 rounded-lg border border-slate-100">
          <span className={`w-5 h-5 rounded-md font-bold text-xs flex items-center justify-center shrink-0 mt-0.5 font-mono ${
            isSeminar ? 'bg-emerald-100 text-emerald-800' : 'bg-indigo-100 text-indigo-800'
          }`}>
            {isSeminar ? 'Rev' : 'P1'}
          </span>
          <div className="min-w-0 flex-1">
            {hasReviewer ? (
              <>
                <span className="font-bold text-slate-900 leading-tight block break-words">
                  {p1?.name || item.reviewerName}
                </span>
                <span className="text-[11px] text-emerald-700 font-medium">
                  {isSeminar ? 'Dosen Reviewer' : 'Ketua Penguji (Reviewer)'}
                </span>
              </>
            ) : isSeminar ? (
              <div className="flex items-center justify-between gap-1">
                <div>
                  <span className="text-xs font-bold text-amber-700 block">
                    Belum Ditentukan
                  </span>
                  <span className="text-[10px] text-slate-500">
                    Wajib dipilih sebelum jadwal
                  </span>
                </div>
                {onAssignReviewer && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onAssignReviewer(item);
                    }}
                    className="px-2 py-0.5 text-[10px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded transition-colors flex items-center gap-1 shadow-2xs"
                  >
                    <UserPlus className="w-2.5 h-2.5" />
                    <span>Pilih</span>
                  </button>
                )}
              </div>
            ) : (
              <div>
                <span className="font-bold text-slate-900 leading-tight block break-words">
                  {item.reviewerName || 'Belum Ditentukan'}
                </span>
                <span className="text-[11px] text-indigo-600 font-medium">Ketua Penguji (Reviewer)</span>
              </div>
            )}
          </div>
          {isSeminar && hasReviewer && onAssignReviewer && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAssignReviewer(item);
              }}
              className="text-[10px] font-medium text-slate-500 hover:text-emerald-700 underline shrink-0 mt-0.5"
              title="Ganti Reviewer"
            >
              Ubah
            </button>
          )}
        </div>

        {/* Examiner 2: Pembimbing */}
        <div className="text-xs text-slate-700 flex items-start gap-2 bg-slate-50/70 p-1.5 rounded-lg border border-slate-100">
          <span className="w-5 h-5 rounded-md bg-sky-100 text-sky-800 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5 font-mono">
            {isSeminar ? 'Pem' : 'P2'}
          </span>
          <div className="min-w-0 flex-1">
            <span className="font-bold text-slate-900 leading-tight block break-words">
              {p2?.name || item.advisorName || 'Belum Ditentukan'}
            </span>
            <span className="text-[11px] text-sky-600 font-medium">Dosen Pembimbing</span>
          </div>
        </div>

        {/* Examiner 3: Hanya Sidang Skripsi */}
        {!isSeminar && (
          <div className="text-xs text-slate-700 flex items-start gap-2 bg-slate-50/70 p-1.5 rounded-lg border border-slate-100">
            <span className="w-5 h-5 rounded-md bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5 font-mono">
              P3
            </span>
            <div className="min-w-0 flex-1">
              {hasP3 ? (
                <>
                  <span className="font-bold text-slate-900 leading-tight block break-words">
                    {p3?.name || 'Belum Ditentukan'}
                  </span>
                  <span className="text-[11px] text-teal-600 font-medium">Penguji 3 (Bebas Bentrok)</span>
                </>
              ) : (
                <div>
                  <span className="text-xs font-medium text-slate-500 italic bg-slate-100 px-2 py-0.5 rounded border border-slate-200 inline-block">
                    Ditentukan saat Penjadwalan
                  </span>
                  <span className="text-[11px] text-slate-400 block mt-0.5">
                    Dialokasikan saat geser ke slot matriks
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Quick Actions Footer */}
      <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2">
        {isFailedSeminar && onRescheduleSeminar ? (
          <button
            onClick={() => onRescheduleSeminar(item)}
            className="text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 shadow-2xs"
            title="Jadwalkan ulang seminar untuk mahasiswa yang belum lulus (menggunakan data pendaftaran yang sama)"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Jadwalkan Ulang</span>
          </button>
        ) : (
          <span className="text-xs text-slate-400 italic">
            Tarik ke sel kalender
          </span>
        )}

        <button
          onClick={() => onManualAssign(item)}
          className={`text-xs font-semibold px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 shadow-2xs ${
            isSeminar
              ? 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200'
              : 'text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200/70'
          }`}
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>Pilih Slot</span>
        </button>
      </div>
    </div>
  );
};
