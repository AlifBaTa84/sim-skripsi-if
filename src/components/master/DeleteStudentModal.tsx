import React from 'react';
import { X, Trash2, AlertTriangle, GraduationCap, BookOpen, User, Calendar, Award } from 'lucide-react';
import { ScheduleItem } from '../../types';
import { useSchedule } from '../../context/ScheduleContext';
import { formatIndonesianDate } from '../../utils/formatters';

interface DeleteStudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: ScheduleItem | null;
}

export const DeleteStudentModal: React.FC<DeleteStudentModalProps> = ({
  isOpen,
  onClose,
  student,
}) => {
  const { deleteStudent, rooms, timeSlots, lecturers } = useSchedule();

  if (!isOpen || !student) return null;

  const room = rooms.find(r => r.id === student.roomId);
  const slot = timeSlots.find(s => s.id === student.timeSlotId);
  const p1 = lecturers.find(l => l.id === student.examiner1Id);
  const p2 = lecturers.find(l => l.id === student.examiner2Id);

  const handleDelete = () => {
    deleteStudent(student.id);
    onClose();
  };

  const isScheduled = student.status === 'scheduled';
  const isCompleted = student.status === 'completed';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200/90 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-rose-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-600 text-white flex items-center justify-center shadow-md shadow-rose-500/20">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 leading-tight">
                Hapus Data Mahasiswa
              </h3>
              <p className="text-xs text-rose-600 font-medium mt-0.5">
                Konfirmasi Penghapusan Pengajuan Sidang
              </p>
            </div>
          </div>
          
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          
          {/* Student Identity Card */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 rounded-lg">
                  {student.nim}
                </span>
                <span className="text-[11px] font-bold text-slate-600 bg-slate-200/70 px-2.5 py-0.5 rounded-full">
                  {student.thesisType || 'Skripsi'}
                </span>
              </div>
              {student.seminarScore && (
                <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Award className="w-3 h-3 text-emerald-600" />
                  <span>Nilai: {student.seminarScore}</span>
                </span>
              )}
            </div>

            <div>
              <h4 className="font-bold text-slate-900 text-base leading-snug">
                {student.studentName}
              </h4>
              <p className="text-xs text-slate-500 mt-0.5">
                {student.studyProgram || 'Teknik Informatika'} &bull; {student.academicYear || '2024/2025'}
              </p>
            </div>

            <div className="pt-2 border-t border-slate-200/70 text-xs text-slate-600">
              <div className="flex items-start gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                <span className="italic leading-relaxed">"{student.thesisTitle}"</span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-200/70 grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
              <div>
                <span className="text-slate-400 block font-medium">Ketua Penguji (Reviewer):</span>
                <span className="font-semibold text-slate-800">{p1?.name || student.reviewerName || '-'}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Penguji 2 (Pembimbing):</span>
                <span className="font-semibold text-slate-800">{p2?.name || student.advisorName || '-'}</span>
              </div>
            </div>
          </div>

          {/* Status & Impact Warning */}
          {isCompleted ? (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-xs space-y-2">
              <div className="flex items-center gap-2 font-bold text-rose-800">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>Sidang Ini Telah Dinyatakan Selesai</span>
              </div>
              <p className="text-slate-600 leading-relaxed">
                Sidang mahasiswa ini telah terlaksana dan terkunci di sistem. Menghapus data ini akan menghilangkan seluruh histori pengajuan sidang mahasiswa yang bersangkutan dari database.
              </p>
            </div>
          ) : isScheduled ? (
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-2">
              <div className="flex items-center gap-2 font-bold text-amber-800">
                <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
                <span>Mahasiswa Telah Memiliki Jadwal Sidang Aktif</span>
              </div>
              <p className="text-slate-600 leading-relaxed">
                Jadwal: <strong>{formatIndonesianDate(student.date)}</strong> &bull; Ruangan <strong>{room?.name || '-'}</strong> &bull; Jam <strong>{slot?.label || '-'}</strong>.
              </p>
              <p className="text-amber-800 font-medium leading-relaxed bg-amber-100/70 p-2 rounded-xl">
                Menghapus data mahasiswa ini akan sekaligus membatalkan alokasi sidang di matriks jadwal dan membebaskan slot ruangan tersebut untuk mahasiswa lain.
              </p>
            </div>
          ) : (
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-600 text-xs">
              <p className="leading-relaxed">
                Mahasiswa ini berada dalam antrean <strong>Belum Terjadwal</strong>. Data mahasiswa dan pengajuan sidang akan dihapus permanen dari sistem.
              </p>
            </div>
          )}

        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-slate-50/70 border-t border-slate-100 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="h-10 px-4 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors shadow-2xs"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleDelete}
            className="h-10 px-5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 active:bg-rose-800 rounded-xl transition-colors shadow-md shadow-rose-600/20 flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            <span>Ya, Hapus Data Mahasiswa</span>
          </button>
        </div>
      </div>
    </div>
  );
};
