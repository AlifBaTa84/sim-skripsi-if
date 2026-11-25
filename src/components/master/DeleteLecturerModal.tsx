import React from 'react';
import { X, Trash2, AlertTriangle, UserX, Award, ShieldAlert } from 'lucide-react';
import { Lecturer, ScheduleItem } from '../../types';
import { useSchedule } from '../../context/ScheduleContext';

interface DeleteLecturerModalProps {
  isOpen: boolean;
  onClose: () => void;
  lecturer: Lecturer | null;
}

export const DeleteLecturerModal: React.FC<DeleteLecturerModalProps> = ({
  isOpen,
  onClose,
  lecturer,
}) => {
  const { deleteLecturer, schedules } = useSchedule();

  if (!isOpen || !lecturer) return null;

  // Compute active assigned sessions
  const assignedSchedules = schedules.filter(
    s => s.examiner1Id === lecturer.id || s.examiner2Id === lecturer.id || s.examiner3Id === lecturer.id
  );
  const countP1 = assignedSchedules.filter(s => s.examiner1Id === lecturer.id).length;
  const countP2 = assignedSchedules.filter(s => s.examiner2Id === lecturer.id).length;
  const countP3 = assignedSchedules.filter(s => s.examiner3Id === lecturer.id).length;
  const totalAssigned = assignedSchedules.length;

  const handleDelete = () => {
    deleteLecturer(lecturer.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200/90 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-rose-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-600 text-white flex items-center justify-center shadow-md shadow-rose-500/20">
              <UserX className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 leading-tight">
                Hapus Data Dosen
              </h3>
              <p className="text-xs text-rose-600 font-medium mt-0.5">
                Konfirmasi Penghapusan Dosen Penguji
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
        <div className="p-6 space-y-4">
          
          {/* Lecturer Identity Card */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-slate-800 text-white font-bold text-sm flex items-center justify-center shrink-0 font-mono">
              {lecturer.code}
            </div>
            <div className="min-w-0">
              <h4 className="font-bold text-slate-900 text-sm leading-snug truncate">
                {lecturer.name}
              </h4>
              <p className="text-xs text-slate-500 truncate mt-0.5">
                NIDN: {lecturer.nidn} &bull; {lecturer.department}
              </p>
              <p className="text-[11px] text-slate-400 font-mono truncate">
                {lecturer.email}
              </p>
            </div>
          </div>

          {/* Impact Warning */}
          {totalAssigned > 0 ? (
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-2">
              <div className="flex items-center gap-2 font-bold text-amber-800">
                <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
                <span>Dosen Sedang Ditugaskan pada {totalAssigned} Sidang</span>
              </div>
              <p className="text-slate-600 leading-relaxed">
                Rincian beban: <strong>{countP1}</strong> Ketua Penguji (P1), <strong>{countP2}</strong> Pembimbing (P2), dan <strong>{countP3}</strong> Penguji 3 (P3).
              </p>
              <p className="text-amber-800 font-medium leading-relaxed bg-amber-100/70 p-2 rounded-xl">
                Menghapus dosen ini akan mengosongkan peran penguji pada sidang terkait dan mengembalikan jadwal tersebut ke antrean (unassigned) agar dapat dialokasikan penguji baru.
              </p>
            </div>
          ) : (
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-600 text-xs flex items-center gap-2.5">
              <ShieldAlert className="w-4 h-4 text-slate-400 shrink-0" />
              <span>Dosen ini tidak memiliki penugasan sidang aktif. Penghapusan dapat dilakukan secara aman.</span>
            </div>
          )}

          <p className="text-xs text-slate-500 text-center">
            Apakah Anda yakin ingin menghapus data dosen ini dari Master Data? Tindakan ini tidak dapat dibatalkan.
          </p>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl transition-all"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleDelete}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs transition-all active:scale-[0.99]"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Ya, Hapus Dosen</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
