import React, { useState, useEffect } from 'react';
import { ScheduleItem, Lecturer } from '../../types';
import { useSchedule } from '../../context/ScheduleContext';
import { 
  X, 
  UserCheck, 
  CheckCircle2, 
  Search, 
  GraduationCap, 
  Users,
  AlertCircle
} from 'lucide-react';

interface AssignSeminarReviewerModalProps {
  item: ScheduleItem | null;
  isOpen: boolean;
  onClose: () => void;
  onAssigned?: (reviewerId: string) => void;
}

export const AssignSeminarReviewerModal: React.FC<AssignSeminarReviewerModalProps> = ({
  item,
  isOpen,
  onClose,
  onAssigned,
}) => {
  const { lecturers, assignSeminarReviewer } = useSchedule();
  const [selectedReviewerId, setSelectedReviewerId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => {
    if (item) {
      setSelectedReviewerId(item.examiner1Id || '');
    }
    setSearchQuery('');
  }, [item?.id, isOpen]);

  if (!isOpen || !item) return null;

  const advisor = lecturers.find(l => l.id === item.examiner2Id);

  // Eligible reviewers must not be the advisor (Aturan 2.4)
  const eligibleLecturers = lecturers.filter(l => l.id !== item.examiner2Id);

  const filteredLecturers = eligibleLecturers.filter(l => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      l.name.toLowerCase().includes(q) ||
      l.code.toLowerCase().includes(q) ||
      (l.nidn && l.nidn.includes(q)) ||
      l.department.toLowerCase().includes(q)
    );
  });

  const handleSave = () => {
    if (!selectedReviewerId) return;
    assignSeminarReviewer(item.id, selectedReviewerId);
    if (onAssigned) {
      onAssigned(selectedReviewerId);
    }
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-emerald-50/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">
                  Tentukan Dosen Reviewer Seminar
                </h3>
                <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-300 uppercase tracking-wider">
                  Seminar
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-0.5">
                Sesuai Aturan 2.4, reviewer seminar dipilih oleh administrator pada Papan Jadwal.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4 overflow-y-auto">
          
          {/* Student & Advisor Info Box */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <GraduationCap className="w-3.5 h-3.5 text-slate-400" />
                Mahasiswa Peserta:
              </span>
              <span className="font-mono font-bold text-slate-700">{item.nim}</span>
            </div>
            <p className="text-sm font-bold text-slate-900 uppercase">{item.studentName}</p>
            <p className="text-xs text-slate-600 italic line-clamp-2">"{item.thesisTitle}"</p>

            <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-xs">
              <span className="text-slate-500">Dosen Pembimbing (Terkunci):</span>
              <span className="font-bold text-slate-800">{advisor?.name || item.advisorName || '-'}</span>
            </div>
          </div>

          {/* Rule Alert */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2.5 text-xs text-amber-800">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Ketentuan Reviewer Seminar: </span>
              Dosen Reviewer bertindak sebagai penguji tunggal seminar proposal dan akan otomatis menjadi Ketua Penguji (P1) saat mahasiswa ini kelak lulus dan mengikuti Sidang Skripsi.
            </div>
          </div>

          {/* Lecturer Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari nama dosen, kode, atau NIDN..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-10 text-xs pl-9 pr-3.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 shadow-2xs"
            />
          </div>

          {/* Candidate Lecturers List */}
          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
            <div className="text-xs font-semibold text-slate-600 uppercase tracking-wider flex items-center gap-1.5 mb-1">
              <Users className="w-3.5 h-3.5 text-slate-400" />
              <span>Daftar Dosen Tersedia ({filteredLecturers.length})</span>
            </div>

            {filteredLecturers.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-500 border border-dashed rounded-xl">
                Tidak ada dosen yang cocok dengan pencarian.
              </div>
            ) : (
              filteredLecturers.map((lec) => {
                const isSelected = selectedReviewerId === lec.id;
                return (
                  <div
                    key={lec.id}
                    onClick={() => setSelectedReviewerId(lec.id)}
                    className={`p-3 rounded-xl border text-xs cursor-pointer transition-all flex items-center justify-between gap-3 ${
                      isSelected
                        ? 'bg-emerald-50/90 border-emerald-500 ring-2 ring-emerald-500/20'
                        : 'bg-white border-slate-200 hover:border-emerald-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className="min-w-0 flex items-center gap-2.5">
                      <span className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 font-bold font-mono text-xs flex items-center justify-center shrink-0">
                        {lec.code}
                      </span>
                      <div className="min-w-0">
                        <h4 className="font-bold text-slate-900 truncate">{lec.name}</h4>
                        <p className="text-[11px] text-slate-500 truncate">
                          NIDN: {lec.nidn || '-'} · {lec.department}
                        </p>
                      </div>
                    </div>

                    <div className="shrink-0 flex items-center">
                      {isSelected ? (
                        <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center">
                          <CheckCircle2 className="w-4 h-4" />
                        </div>
                      ) : (
                        <div className="w-5 h-5 rounded-full border border-slate-300" />
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2.5 shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200/60 rounded-xl transition-colors"
          >
            Batal
          </button>
          <button
            onClick={handleSave}
            disabled={!selectedReviewerId}
            className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-all shadow-xs flex items-center gap-1.5"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Simpan Reviewer</span>
          </button>
        </div>

      </div>
    </div>
  );
};
