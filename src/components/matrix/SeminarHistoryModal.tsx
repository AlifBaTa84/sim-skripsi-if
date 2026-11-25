import React from 'react';
import { ScheduleItem } from '../../types';
import { 
  X, 
  History, 
  GraduationCap, 
  Award, 
  Calendar, 
  Clock, 
  UserCheck, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  FileText,
  RotateCcw
} from 'lucide-react';
import { formatIndonesianDate } from '../../utils/formatters';

interface SeminarHistoryModalProps {
  item: ScheduleItem | null;
  isOpen: boolean;
  onClose: () => void;
}

export const SeminarHistoryModal: React.FC<SeminarHistoryModalProps> = ({
  item,
  isOpen,
  onClose,
}) => {
  if (!isOpen || !item) return null;

  const history = item.seminarHistory || [];
  const currentAttempt = item.attemptNumber || 1;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 bg-gradient-to-r from-emerald-50/60 to-teal-50/40 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-500/20">
              <History className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">
                  Riwayat Pelaksanaan Seminar
                </h3>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                  Pelaksanaan ke-{currentAttempt}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Konsep Same-Schedule: Riwayat seluruh percobaan seminar tersimpan kronologis
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Student Summary Card */}
        <div className="px-6 py-4 bg-slate-50/70 border-b border-slate-100">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-emerald-700 bg-emerald-100/80 px-2.5 py-0.5 rounded-md border border-emerald-200">
                  {item.nim}
                </span>
                <h4 className="text-sm font-bold text-slate-900 uppercase">
                  {item.studentName}
                </h4>
              </div>
              <p className="text-xs text-slate-600 italic line-clamp-2">
                "{item.thesisTitle}"
              </p>
            </div>
            <div className="text-right shrink-0">
              <span className="text-[11px] font-semibold text-slate-500 block">Dosen Pembimbing:</span>
              <span className="text-xs font-bold text-slate-800 block">
                {item.advisorName || '-'}
              </span>
            </div>
          </div>
        </div>

        {/* Content Body / Timeline */}
        <div className="p-6 overflow-y-auto space-y-4">
          <div className="flex items-center justify-between">
            <h5 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-emerald-600" />
              <span>Daftar Pelaksanaan ({history.length + (item.status === 'scheduled' || item.seminarResult ? 1 : 0)} Total)</span>
            </h5>
            <span className="text-[11px] text-slate-400 italic">
              Data historis tidak dapat ditimpa atau dihapus
            </span>
          </div>

          {/* Current execution (if scheduled or evaluated) */}
          {(item.status === 'scheduled' || item.seminarResult) && (
            <div className={`p-4 rounded-2xl border transition-all ${
              item.seminarResult === 'lulus'
                ? 'bg-emerald-50/50 border-emerald-200 shadow-xs'
                : item.seminarResult === 'belum_lulus'
                ? 'bg-rose-50/50 border-rose-200 shadow-xs'
                : 'bg-indigo-50/40 border-indigo-200 shadow-xs'
            }`}>
              <div className="flex items-center justify-between gap-2 mb-2 pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-slate-900 text-white font-mono">
                    Pelaksanaan Ke-{currentAttempt} (Terkini)
                  </span>
                  <span className="text-xs text-slate-500">
                    TA {item.academicYear}
                  </span>
                </div>
                {item.seminarResult === 'lulus' ? (
                  <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    LULUS SEMINAR
                  </span>
                ) : item.seminarResult === 'belum_lulus' ? (
                  <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-300">
                    <XCircle className="w-3.5 h-3.5 text-rose-600" />
                    BELUM LULUS
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800 border border-indigo-200">
                    <Clock className="w-3.5 h-3.5 text-indigo-600" />
                    TERJADWAL / MENUNGGU NILAI
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs mb-3">
                <div className="flex items-center gap-2 text-slate-700">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  <span>Tanggal: <strong>{item.date ? formatIndonesianDate(item.date) : 'Belum Ditentukan'}</strong></span>
                </div>
                <div className="flex items-center gap-2 text-slate-700">
                  <UserCheck className="w-4 h-4 text-slate-400" />
                  <span>Dosen Reviewer: <strong>{item.reviewerName || 'Belum Dipilih'}</strong></span>
                </div>
              </div>

              {item.seminarScore !== undefined && (
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/80 border border-slate-200/80 mb-2">
                  <div className="flex items-center gap-2">
                    <Award className="w-4 h-4 text-emerald-600" />
                    <span className="text-xs font-semibold text-slate-700">Nilai Akhir:</span>
                  </div>
                  <span className="text-sm font-extrabold text-slate-900 font-mono">
                    {item.seminarScore}
                  </span>
                </div>
              )}

              {item.notes && (
                <div className="p-2.5 rounded-xl bg-white/80 border border-slate-200/80 text-xs text-slate-600">
                  <span className="font-semibold text-slate-700 block mb-0.5">Catatan & Masukan Reviewer:</span>
                  <p className="italic">{item.notes}</p>
                </div>
              )}
            </div>
          )}

          {/* Historical attempts list */}
          {history.length > 0 ? (
            <div className="space-y-3 pt-2">
              <span className="text-xs font-bold text-slate-600 uppercase tracking-wider block">
                Riwayat Pelaksanaan Sebelumnya:
              </span>
              {history.map((h, idx) => (
                <div
                  key={h.id || idx}
                  className="p-4 rounded-2xl border border-slate-200 bg-slate-50/60 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center justify-between gap-2 mb-2 pb-2 border-b border-slate-200/70">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-slate-200 text-slate-800 font-mono">
                        Pelaksanaan Ke-{h.attemptNumber}
                      </span>
                      <span className="text-xs text-slate-500">
                        TA {h.academicYear}
                      </span>
                    </div>
                    {h.result === 'lulus' ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        Lulus
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-200">
                        <XCircle className="w-3 h-3 text-rose-600" />
                        Belum Lulus
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600 mb-2">
                    <div>
                      <span>Tanggal: </span>
                      <span className="font-semibold text-slate-800">{formatIndonesianDate(h.date)}</span>
                    </div>
                    <div>
                      <span>Reviewer: </span>
                      <span className="font-semibold text-slate-800">{h.reviewerName || '-'}</span>
                    </div>
                  </div>

                  {h.score !== undefined && (
                    <div className="flex items-center justify-between text-xs py-1 px-2 rounded-lg bg-white border border-slate-100 mb-1.5">
                      <span className="text-slate-500">Nilai:</span>
                      <span className="font-bold text-slate-900 font-mono">{h.score}</span>
                    </div>
                  )}

                  {h.feedback && (
                    <p className="text-xs text-slate-600 italic bg-white p-2 rounded-lg border border-slate-100">
                      "{h.feedback}"
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : !item.status && !item.seminarResult ? (
            <div className="py-8 text-center text-slate-400">
              <AlertCircle className="w-8 h-8 mx-auto mb-2 text-slate-300" />
              <p className="text-xs font-semibold text-slate-600">Belum Ada Riwayat Pelaksanaan</p>
              <p className="text-[11px] text-slate-400 mt-1">Mahasiswa baru terdaftar dan belum melaksanakan seminar.</p>
            </div>
          ) : null}

          {/* Business rule explanation info box */}
          <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-200 text-xs text-blue-900 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <span className="font-bold">Ketentuan Kelulusan Seminar:</span>
              <p className="text-[11px] text-blue-800 leading-relaxed">
                Hanya mahasiswa yang memiliki status sah <strong>Lulus Seminar</strong> yang memenuhi syarat pendaftaran dan penjadwalan Sidang Skripsi. Hasil lulus berlaku lintas periode akademik.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-bold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-xl transition-colors shadow-2xs"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
