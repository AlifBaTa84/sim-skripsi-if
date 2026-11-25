import React, { useState, useEffect } from 'react';
import { ScheduleItem } from '../../types';
import { useSchedule } from '../../context/ScheduleContext';
import { 
  X, 
  Award, 
  CheckCircle2, 
  XCircle, 
  GraduationCap, 
  RotateCcw,
  BookOpen,
  FileText,
  AlertCircle
} from 'lucide-react';

interface RecordSeminarResultModalProps {
  item: ScheduleItem | null;
  isOpen: boolean;
  onClose: () => void;
}

export const RecordSeminarResultModal: React.FC<RecordSeminarResultModalProps> = ({
  item,
  isOpen,
  onClose,
}) => {
  const { recordSeminarResult, lecturers } = useSchedule();
  const [result, setResult] = useState<'lulus' | 'belum_lulus'>('lulus');
  const [score, setScore] = useState<string>('85.0');
  const [feedback, setFeedback] = useState<string>('');

  useEffect(() => {
    if (item) {
      setResult(item.seminarResult === 'belum_lulus' ? 'belum_lulus' : 'lulus');
      setScore(item.seminarScore !== undefined ? String(item.seminarScore) : '85.0');
      setFeedback(item.notes || '');
    }
  }, [item?.id, isOpen]);

  if (!isOpen || !item) return null;

  const reviewer = lecturers.find(l => l.id === item.examiner1Id);
  const advisor = lecturers.find(l => l.id === item.examiner2Id);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numScore = parseFloat(score);
    if (isNaN(numScore) || numScore < 0 || numScore > 100) {
      alert('Nilai harus berupa angka antara 0 hingga 100.');
      return;
    }

    recordSeminarResult(item.id, result, numScore, feedback);
    onClose();
  };

  const isLulus = result === 'lulus';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-emerald-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">
                  Pencatatan Hasil Seminar Proposal
                </h3>
                <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-300 uppercase tracking-wider">
                  Pelaksanaan ke-{item.attemptNumber || 1}
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-0.5">
                Evaluasi hasil pelaksanaan seminar untuk menentukan kelayakan maju ke Sidang Skripsi.
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
          
          {/* Student Info Box */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <GraduationCap className="w-3.5 h-3.5 text-slate-400" />
                Mahasiswa Peserta:
              </span>
              <span className="font-mono font-bold text-slate-700">{item.nim}</span>
            </div>
            <p className="text-sm font-bold text-slate-900 uppercase">{item.studentName}</p>
            <p className="text-xs text-slate-600 italic line-clamp-2">"{item.thesisTitle}"</p>

            <div className="pt-2 border-t border-slate-200/60 grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Dosen Reviewer</span>
                <span className="font-bold text-slate-800">{reviewer?.name || item.reviewerName || '-'}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Dosen Pembimbing</span>
                <span className="font-bold text-slate-800">{advisor?.name || item.advisorName || '-'}</span>
              </div>
            </div>
          </div>

          {/* Result Selection Toggle */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Status Kelulusan Seminar <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setResult('lulus')}
                className={`p-3.5 rounded-xl border text-left transition-all flex items-center gap-3 ${
                  isLulus
                    ? 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-500/20 text-emerald-950 font-bold'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                  isLulus ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-400'
                }`}>
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <span className="block text-sm">LULUS</span>
                  <span className="text-[11px] text-slate-500 font-normal">Memenuhi syarat Sidang</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setResult('belum_lulus')}
                className={`p-3.5 rounded-xl border text-left transition-all flex items-center gap-3 ${
                  !isLulus
                    ? 'bg-rose-50 border-rose-500 ring-2 ring-rose-500/20 text-rose-950 font-bold'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                  !isLulus ? 'bg-rose-600 text-white' : 'bg-slate-100 text-slate-400'
                }`}>
                  <XCircle className="w-5 h-5" />
                </div>
                <div>
                  <span className="block text-sm">BELUM LULUS</span>
                  <span className="text-[11px] text-slate-500 font-normal">Wajib dijadwalkan ulang</span>
                </div>
              </button>
            </div>
          </div>

          {/* Dynamic Explanatory Banner based on Result */}
          {isLulus ? (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-start gap-2.5 text-xs text-emerald-800">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Konsekuensi Akademik: </span>
                Mahasiswa resmi dinyatakan memenuhi syarat wajib. Dosen Reviewer ({reviewer?.name || 'Reviewer'}) akan otomatis terkunci sebagai Ketua Penguji (P1) dan Pembimbing ({advisor?.name || 'Pembimbing'}) sebagai Penguji 2 (P2) pada Sidang Skripsi.
              </div>
            </div>
          ) : (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2.5 text-xs text-amber-800">
              <RotateCcw className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Aturan Penjadwalan Ulang (same_schedule): </span>
                Nilai dan catatan percobaan ke-{item.attemptNumber || 1} ini akan disimpan permanen sebagai riwayat historis. Sistem tidak membuat pendaftaran baru; mahasiswa dapat dijadwalkan ulang untuk percobaan berikutnya.
              </div>
            </div>
          )}

          {/* Score Input */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Nilai Seminar (0 - 100) <span className="text-rose-500">*</span>
            </label>
            <input
              type="number"
              step="0.1"
              min="0"
              max="100"
              required
              value={score}
              onChange={(e) => setScore(e.target.value)}
              placeholder="Contoh: 85.5"
              className="w-full h-10 px-3.5 text-sm font-bold bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 shadow-2xs font-mono"
            />
          </div>

          {/* Notes / Revision Feedback */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center justify-between">
              <span>Catatan Evaluasi / Catatan Revisi</span>
              <span className="text-[10px] text-slate-400 font-normal">Opsional</span>
            </label>
            <textarea
              rows={3}
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder={
                isLulus
                  ? 'Catatan revisi sebelum sidang skripsi dilaksanakan...'
                  : 'Poin-poin perbaikan yang wajib dipenuhi sebelum seminar ulang...'
              }
              className="w-full p-3 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 shadow-2xs leading-relaxed"
            />
          </div>

          {/* Footer Action Buttons */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              className={`px-5 py-2 text-xs font-bold text-white rounded-xl transition-all shadow-xs flex items-center gap-1.5 ${
                isLulus
                  ? 'bg-emerald-600 hover:bg-emerald-700'
                  : 'bg-rose-600 hover:bg-rose-700'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Simpan Hasil Seminar</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
