import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { ScheduleItem, Lecturer, Room } from '../../types';
import { 
  GripVertical, 
  X, 
  CheckCircle, 
  GraduationCap, 
  Users, 
  RotateCcw, 
  Lock, 
  ShieldCheck,
  Award,
  FileText,
  History,
  CheckCircle2,
  XCircle,
  BookOpen
} from 'lucide-react';
import { useSchedule } from '../../context/ScheduleContext';

interface ScheduledCardProps {
  item: ScheduleItem;
  lecturers: Lecturer[];
  room?: Room;
  onAssignExaminer3?: (item: ScheduleItem) => void;
  onRecordSeminarResult?: (item: ScheduleItem) => void;
  onViewSeminarHistory?: (item: ScheduleItem) => void;
}

export const ScheduledCard: React.FC<ScheduledCardProps> = ({ 
  item, 
  lecturers, 
  room, 
  onAssignExaminer3,
  onRecordSeminarResult,
  onViewSeminarHistory
}) => {
  const { unassignSchedule, completeSchedule } = useSchedule();
  const isCompleted = item.status === 'completed';
  const isSeminar = item.activityType === 'seminar';

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `scheduled-${item.id}`,
    data: { item, source: 'grid' },
    disabled: isCompleted, // Kegiatan selesai tidak dapat digeser
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

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group relative bg-white rounded-2xl p-3.5 border text-left transition-all duration-200 select-none ${
        isDragging
          ? 'opacity-40 border-dashed border-indigo-500 shadow-none'
          : isCompleted
          ? 'border-emerald-200/90 bg-emerald-50/20 shadow-xs'
          : isSeminar
          ? 'border-emerald-200/90 shadow-xs hover:shadow-md hover:border-emerald-400'
          : 'border-slate-200/90 shadow-xs hover:shadow-md hover:border-indigo-300'
      }`}
    >
      {/* Top Header: Status, Activity Badge & Actions */}
      <div className="flex items-center justify-between gap-1 mb-2">
        <div
          {...listeners}
          {...attributes}
          className={`flex items-center gap-1.5 transition-colors ${
            isCompleted
              ? 'text-slate-400 cursor-default'
              : isSeminar
              ? 'cursor-grab active:cursor-grabbing text-slate-400 group-hover:text-emerald-600'
              : 'cursor-grab active:cursor-grabbing text-slate-400 group-hover:text-indigo-600'
          }`}
          title={isCompleted ? 'Kegiatan selesai - Data terkunci permanen' : 'Tahan dan geser (drag) untuk memindahkan jadwal'}
        >
          {!isCompleted && <GripVertical className="w-4 h-4" />}
          
          {/* Activity Badge: Seminar vs Sidang */}
          {isSeminar ? (
            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 uppercase tracking-wider flex items-center gap-1">
              <BookOpen className="w-3 h-3 text-emerald-700" />
              Seminar
            </span>
          ) : (
            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 border border-indigo-200 uppercase tracking-wider flex items-center gap-1">
              <GraduationCap className="w-3 h-3 text-indigo-700" />
              Sidang
            </span>
          )}

          {/* Status Label */}
          {isCompleted ? (
            <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 uppercase tracking-wider flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-emerald-700" />
              Selesai
            </span>
          ) : (
            <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200 uppercase tracking-wider">
              Terjadwal
            </span>
          )}
        </div>

        {isCompleted ? (
          <span
            className="p-1 text-slate-400"
            title="Kegiatan telah dinyatakan selesai. Data jadwal tersimpan permanen dan tidak dapat dibatalkan."
          >
            <Lock className="w-3.5 h-3.5 text-slate-400" />
          </span>
        ) : (
          <button
            onClick={(e) => {
              e.stopPropagation();
              unassignSchedule(item.id);
            }}
            className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
            title="Kembalikan ke antrean"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Prominent Student Name & NIM Box */}
      <div className={`p-2.5 rounded-xl border mb-2.5 ${
        isCompleted
          ? 'bg-emerald-50/70 border-emerald-100'
          : isSeminar
          ? 'bg-emerald-50/50 border-emerald-100'
          : 'bg-indigo-50/70 border-indigo-100/90'
      }`}>
        <div className={`flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider mb-1 ${
          isCompleted ? 'text-emerald-800' : isSeminar ? 'text-emerald-700' : 'text-indigo-700'
        }`}>
          <div className="flex items-center gap-1.5">
            <GraduationCap className={`w-3.5 h-3.5 shrink-0 ${isCompleted ? 'text-emerald-700' : isSeminar ? 'text-emerald-600' : 'text-indigo-600'}`} />
            <span>Mahasiswa:</span>
          </div>
          {item.attemptNumber && item.attemptNumber > 1 && (
            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 border border-amber-300">
              Ke-{item.attemptNumber}
            </span>
          )}
        </div>
        <h4 className="text-sm font-bold text-slate-900 uppercase leading-snug break-words">
          {item.studentName}
        </h4>
        <div className={`font-mono text-xs font-semibold mt-1 flex items-center justify-between ${
          isCompleted ? 'text-emerald-900' : isSeminar ? 'text-emerald-800' : 'text-indigo-800'
        }`}>
          <span>NIM: {item.nim}</span>
          {isSeminar && item.seminarResult === 'lulus' && (
            <span className="text-[10px] font-bold text-emerald-700 bg-white/80 px-1.5 py-0.5 rounded border border-emerald-200">
              Lulus
            </span>
          )}
        </div>
      </div>

      {/* Thesis Title */}
      <div className="mb-2.5">
        <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed italic">
          "{item.thesisTitle}"
        </p>
      </div>

      {/* Examiners List */}
      <div className="pt-2 border-t border-slate-100 space-y-1.5">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 flex items-center justify-between mb-1">
          <div className="flex items-center gap-1">
            <Users className="w-3.5 h-3.5 text-slate-400" />
            <span>{isSeminar ? 'Dosen Seminar (2 Dosen):' : 'Dosen Penguji (3 Dosen):'}</span>
          </div>
        </div>

        {/* Examiner 1: Reviewer (Seminar) / Ketua Penguji (Sidang) */}
        <div className="text-xs text-slate-800 flex items-start gap-2 bg-slate-50/80 p-1.5 rounded-lg border border-slate-100">
          <span className={`w-5 h-5 rounded-md font-bold text-xs flex items-center justify-center shrink-0 mt-0.5 font-mono ${
            isSeminar ? 'bg-emerald-100 text-emerald-800' : 'bg-indigo-100 text-indigo-800'
          }`}>
            {isSeminar ? 'Rev' : 'P1'}
          </span>
          <div className="min-w-0 flex-1">
            <span className="font-bold text-slate-900 block leading-tight break-words">
              {p1?.name || item.reviewerName || 'Belum Dipilih'}
            </span>
            <span className={`text-[11px] font-medium ${isSeminar ? 'text-emerald-700' : 'text-slate-500'}`}>
              {isSeminar ? 'Dosen Reviewer (Ditentukan Admin)' : 'Ketua Penguji (Reviewer Seminar)'}
            </span>
          </div>
        </div>

        {/* Examiner 2: Pembimbing (Seminar & Sidang) */}
        <div className="text-xs text-slate-800 flex items-start gap-2 bg-slate-50/80 p-1.5 rounded-lg border border-slate-100">
          <span className="w-5 h-5 rounded-md bg-sky-100 text-sky-800 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5 font-mono">
            {isSeminar ? 'Pem' : 'P2'}
          </span>
          <div className="min-w-0 flex-1">
            <span className="font-bold text-slate-900 block leading-tight break-words">
              {p2?.name || item.advisorName || '-'}
            </span>
            <span className="text-[11px] text-slate-500 font-medium">Dosen Pembimbing</span>
          </div>
        </div>

        {/* Examiner 3: Hanya untuk Sidang Skripsi (Seminar tidak ada P3) */}
        {!isSeminar && (
          <div className="text-xs text-slate-800 flex items-start gap-2 bg-slate-50/80 p-1.5 rounded-lg border border-slate-100 group/p3">
            <span className="w-5 h-5 rounded-md bg-teal-100 text-teal-800 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5 font-mono">
              P3
            </span>
            <div className="min-w-0 flex-1">
              <span className="font-bold text-slate-900 block leading-tight break-words">
                {p3?.name || '-'}
              </span>
              <span className="text-[11px] text-slate-500 font-medium">Penguji 3</span>
            </div>

            {/* Penguji 3 Action / Lock */}
            {isCompleted ? (
              <span
                className="px-2 py-0.5 text-[10px] font-bold text-slate-500 bg-slate-100 border border-slate-200 rounded shrink-0 flex items-center gap-1 shadow-2xs mt-0.5"
                title="Sidang dinyatakan selesai. Data Penguji 3 tersimpan permanen dan terkunci di database."
              >
                <Lock className="w-2.5 h-2.5 text-slate-400" />
                <span>Terkunci</span>
              </span>
            ) : (
              onAssignExaminer3 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onAssignExaminer3(item);
                  }}
                  className="px-2 py-0.5 text-[10px] font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded transition-colors shrink-0 flex items-center gap-1 shadow-2xs mt-0.5"
                  title="Ganti Penguji 3 jika yang bersangkutan berhalangan hadir saat sidang"
                >
                  <RotateCcw className="w-2.5 h-2.5" />
                  <span>Ganti</span>
                </button>
              )
            )}
          </div>
        )}
      </div>

      {/* Footer Pill & Activity Specific Actions */}
      <div className="mt-2.5 pt-2 flex items-center justify-between text-[11px] text-slate-400 border-t border-dashed border-slate-100 gap-2">
        {isCompleted ? (
          <span className="flex items-center gap-1 text-emerald-700 font-bold text-[11px] bg-emerald-50 border border-emerald-200/80 px-2.5 py-0.5 rounded-md">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            {isSeminar ? 'Seminar Selesai' : 'Sidang Selesai'}
          </span>
        ) : isSeminar ? (
          <div className="flex items-center gap-1.5 flex-wrap">
            {onRecordSeminarResult && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onRecordSeminarResult(item);
                }}
                className="px-2.5 py-1 text-[10px] font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors flex items-center gap-1 shadow-2xs"
                title="Catat hasil evaluasi dan kelulusan seminar mahasiswa ini"
              >
                <Award className="w-3 h-3 text-emerald-600" />
                <span>Catat Hasil</span>
              </button>
            )}
            {onViewSeminarHistory && (item.seminarHistory?.length || 0) > 0 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onViewSeminarHistory(item);
                }}
                className="p-1 text-slate-500 hover:text-emerald-700 hover:bg-slate-100 rounded-lg transition-colors"
                title="Lihat riwayat pelaksanaan seminar"
              >
                <History className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        ) : (
          <button
            onClick={(e) => {
              e.stopPropagation();
              completeSchedule(item.id);
            }}
            className="px-2 py-1 text-[10px] font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 active:bg-indigo-200/70 border border-indigo-200/90 rounded-lg transition-colors flex items-center gap-1 shadow-2xs"
            title="Tandai sidang ini selesai dilaksanakan (Data Penguji 3 dan jadwal akan terkunci permanen di database)"
          >
            <CheckCircle className="w-3 h-3 text-indigo-600" />
            <span>Selesaikan Sidang</span>
          </button>
        )}

        <span className="text-[10px] uppercase tracking-wider font-extrabold text-slate-600 truncate">
          {room?.name}
        </span>
      </div>
    </div>
  );
};
