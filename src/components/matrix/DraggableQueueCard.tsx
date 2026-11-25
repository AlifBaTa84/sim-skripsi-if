import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { ScheduleItem, Lecturer } from '../../types';
import { GripVertical, BookOpen, Clock, Calendar, GraduationCap, Users, UserPlus, Award } from 'lucide-react';

interface DraggableQueueCardProps {
  item: ScheduleItem;
  lecturers: Lecturer[];
  onManualAssign: (item: ScheduleItem) => void;
  onAssignExaminer3?: (item: ScheduleItem) => void;
}

export const DraggableQueueCard: React.FC<DraggableQueueCardProps> = ({
  item,
  lecturers,
  onManualAssign,
  onAssignExaminer3,
}) => {
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

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group relative bg-white rounded-2xl p-3.5 border transition-all duration-200 select-none overflow-hidden w-full ${
        isDragging
          ? 'opacity-40 border-dashed border-indigo-400 shadow-none'
          : 'border-slate-200/90 shadow-xs hover:shadow-md hover:border-indigo-300'
      }`}
    >
      {/* Drag handle, NIM, and Badges (Skripsi, Nilai Seminar) */}
      <div className="flex items-center justify-between gap-2 mb-2.5 flex-wrap">
        <div
          {...listeners}
          {...attributes}
          className="flex items-center gap-1.5 cursor-grab active:cursor-grabbing text-slate-400 group-hover:text-indigo-600 transition-colors shrink-0"
          title="Tahan dan geser (drag) ke kotak jadwal"
        >
          <GripVertical className="w-4 h-4 shrink-0" />
          <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-lg border border-indigo-200/80 whitespace-nowrap">
            {item.nim}
          </span>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap shrink-0">
          {item.thesisType && (
            <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200 whitespace-nowrap">
              {item.thesisType}
            </span>
          )}
          {item.seminarScore && (
            <span
              className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/90 px-2 py-0.5 rounded-full flex items-center gap-1 whitespace-nowrap"
              title="Nilai Seminar"
            >
              <Award className="w-3 h-3 text-emerald-600 shrink-0" />
              <span>Nilai: {item.seminarScore}</span>
            </span>
          )}
        </div>
      </div>

      {/* Student Name Box */}
      <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 mb-2">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1 mb-0.5">
          <GraduationCap className="w-3.5 h-3.5 text-slate-400" />
          <span>Mahasiswa:</span>
        </div>
        <h3 className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors uppercase leading-snug break-words">
          {item.studentName}
        </h3>
      </div>

      {/* Thesis Title */}
      <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed flex items-start gap-1 mb-2.5">
        <BookOpen className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
        <span className="italic">"{item.thesisTitle}"</span>
      </p>

      {/* Examiners list (Full names & role origins) */}
      <div className="pt-2 border-t border-slate-100 space-y-1.5">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 flex items-center justify-between">
          <span>Susunan Penguji:</span>
        </div>

        {/* P1: Reviewer */}
        <div className="text-xs text-slate-700 flex items-start gap-2 bg-slate-50/70 p-1.5 rounded-lg border border-slate-100">
          <span className="w-5 h-5 rounded-md bg-indigo-100 text-indigo-800 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5 font-mono">
            P1
          </span>
          <div className="min-w-0 flex-1">
            <span className="font-bold text-slate-900 leading-tight block break-words">
              {p1?.name || item.reviewerName || 'Belum Ditentukan'}
            </span>
            <span className="text-[11px] text-indigo-600 font-medium">Ketua Penguji (Reviewer)</span>
          </div>
        </div>

        {/* P2: Pembimbing */}
        <div className="text-xs text-slate-700 flex items-start gap-2 bg-slate-50/70 p-1.5 rounded-lg border border-slate-100">
          <span className="w-5 h-5 rounded-md bg-sky-100 text-sky-800 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5 font-mono">
            P2
          </span>
          <div className="min-w-0 flex-1">
            <span className="font-bold text-slate-900 leading-tight block break-words">
              {p2?.name || item.advisorName || 'Belum Ditentukan'}
            </span>
            <span className="text-[11px] text-sky-600 font-medium">Penguji 2 (Pembimbing)</span>
          </div>
        </div>

        {/* P3: Ditentukan saat Penjadwalan */}
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
      </div>

      {/* Quick Actions */}
      <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2">
        <span className="text-xs text-slate-400 italic">
          Tarik ke sel kalender
        </span>
        <button
          onClick={() => onManualAssign(item)}
          className="text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200/70 px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 shadow-2xs"
        >
          <Calendar className="w-3.5 h-3.5" />
          Pilih Slot
        </button>
      </div>
    </div>
  );
};
