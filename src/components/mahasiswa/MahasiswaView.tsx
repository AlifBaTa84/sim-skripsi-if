import React, { useState } from 'react';
import { useSchedule } from '../../context/ScheduleContext';
import { 
  GraduationCap, 
  Calendar, 
  Clock, 
  MapPin, 
  Printer, 
  CheckCircle2, 
  AlertCircle, 
  BookOpen, 
  Users, 
  FileCheck, 
  ShieldCheck,
  Lock
} from 'lucide-react';
import { formatIndonesianDate } from '../../utils/formatters';
import { PrintDraftLabelModal } from './PrintDraftLabelModal';

export const MahasiswaView: React.FC = () => {
  const { 
    currentStudentNim, 
    schedules, 
    lecturers, 
    rooms, 
    timeSlots 
  } = useSchedule();

  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  // Ambil semua agenda milik mahasiswa berdasarkan NIM aktif
  const studentItems = currentStudentNim
    ? schedules.filter(s => s.nim === currentStudentNim)
    : schedules.length > 0
    ? [schedules[0]]
    : [];

  const seminarItem = studentItems.find(s => s.activityType === 'seminar');
  const sidangItem = studentItems.find(s => !s.activityType || s.activityType === 'sidang');
  const studentProfile = sidangItem || seminarItem;

  if (!studentProfile) {
    return (
      <div className="bg-white rounded-2xl p-8 text-center text-slate-500 border border-slate-200 shadow-xs max-w-xl mx-auto my-12">
        <GraduationCap className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <h3 className="text-base font-bold text-slate-800">Data Jadwal Belum Tersedia</h3>
        <p className="text-xs text-slate-400 mt-1">Belum ada data seminar maupun pengajuan sidang skripsi yang ditemukan.</p>
      </div>
    );
  }

  const lecturerMap = new Map(lecturers.map(l => [l.id, l]));
  const roomMap = new Map(rooms.map(r => [r.id, r]));
  const slotMap = new Map(timeSlots.map(t => [t.id, t]));

  // Data Seminar
  const semRoom = seminarItem?.roomId ? roomMap.get(seminarItem.roomId) : undefined;
  const semSlot = seminarItem?.timeSlotId ? slotMap.get(seminarItem.timeSlotId) : undefined;
  const semReviewer = seminarItem ? lecturerMap.get(seminarItem.examiner1Id) : undefined;
  const semAdvisor = seminarItem ? lecturerMap.get(seminarItem.examiner2Id) : undefined;
  const isSeminarScheduled = seminarItem?.status === 'scheduled';
  const isSeminarCompleted = seminarItem?.status === 'completed' || seminarItem?.seminarResult === 'lulus';

  // Data Sidang
  const sidRoom = sidangItem?.roomId ? roomMap.get(sidangItem.roomId) : undefined;
  const sidSlot = sidangItem?.timeSlotId ? slotMap.get(sidangItem.timeSlotId) : undefined;
  const p1 = sidangItem ? lecturerMap.get(sidangItem.examiner1Id) : undefined;
  const p2 = sidangItem ? lecturerMap.get(sidangItem.examiner2Id) : undefined;
  const p3 = sidangItem ? lecturerMap.get(sidangItem.examiner3Id) : undefined;
  const isSidangScheduled = sidangItem?.status === 'scheduled';
  const isSidangCompleted = sidangItem?.status === 'completed';

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      
      {/* Top Banner: Student Identity Card */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-5">
        
        {/* Student Bio */}
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-white p-1.5 border border-slate-200/80 shadow-md shadow-indigo-500/10 flex items-center justify-center shrink-0">
            <img
              src="/logo-unikom.png"
              alt="Logo UNIKOM"
              className="w-full h-full object-contain"
            />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-sm font-bold text-indigo-700 bg-indigo-50 px-3 py-0.5 rounded-full border border-indigo-200">
                NIM: {studentProfile.nim}
              </span>
              {studentProfile.thesisType && (
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                  {studentProfile.thesisType}
                </span>
              )}
              {(seminarItem?.seminarScore || sidangItem?.seminarScore) && (
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Nilai Seminar: {sidangItem?.seminarScore ?? seminarItem?.seminarScore}
                </span>
              )}
              {seminarItem && (
                <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${
                  isSeminarCompleted
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : isSeminarScheduled
                    ? 'bg-teal-50 text-teal-700 border-teal-200'
                    : 'bg-amber-50 text-amber-700 border-amber-200'
                }`}>
                  {isSeminarCompleted
                    ? '✓ Seminar Lulus'
                    : isSeminarScheduled
                    ? '✓ Seminar Terjadwal'
                    : 'Seminar: Antrean'}
                </span>
              )}
              {sidangItem && (
                <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${
                  isSidangCompleted
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : isSidangScheduled
                    ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                    : 'bg-amber-50 text-amber-700 border-amber-200'
                }`}>
                  {isSidangCompleted
                    ? '✓ Sidang Selesai'
                    : isSidangScheduled
                    ? '✓ Sidang Terjadwal'
                    : 'Sidang: Antrean'}
                </span>
              )}
            </div>

            <h2 className="text-xl font-bold text-slate-900 mt-1.5 uppercase">
              {studentProfile.studentName}
            </h2>
            <p className="text-sm text-slate-500 mt-0.5">
              {studentProfile.studyProgram} • Tahun Akademik {studentProfile.academicYear}
            </p>
          </div>
        </div>

        {/* Print Button (hanya untuk jadwal sidang yang terjadwal / selesai) */}
        <div className="flex items-center shrink-0">
          {sidangItem && (isSidangScheduled || isSidangCompleted) && (
            <button
              onClick={() => setIsPrintModalOpen(true)}
              className="flex items-center gap-2 h-10 px-5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md shadow-indigo-600/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak Label Draft Sidang</span>
            </button>
          )}
        </div>

      </div>

      {/* ═══════════════════════════════════════════════════════════════════════
          BAGIAN 1: INFORMASI SEMINAR PROPOSAL / KEMAJUAN
      ═══════════════════════════════════════════════════════════════════════ */}
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-2 px-1">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Informasi Jadwal Seminar Proposal / Kemajuan</h3>
              <p className="text-xs text-slate-500">Tahap prasyarat wajib sebelum mengikuti Sidang Skripsi</p>
            </div>
          </div>
        </div>

        {seminarItem ? (
          isSeminarScheduled ? (
            <div className="space-y-5">
              {/* Spotlight Card Seminar */}
              <div className="bg-gradient-to-br from-emerald-900 via-emerald-800 to-slate-900 rounded-2xl p-6 md:p-7 text-white shadow-lg relative overflow-hidden">
                <div className="absolute right-0 top-0 w-96 h-96 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />

                <div className="relative z-10">
                  <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <div className="w-7 h-7 rounded-lg bg-white p-0.5 flex items-center justify-center shrink-0 shadow-xs">
                        <img src="/logo-unikom.png" alt="UNIKOM" className="w-full h-full object-contain" />
                      </div>
                      <span className="text-xs uppercase font-bold tracking-wider px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-200 border border-emerald-400/30 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Jadwal Resmi Pelaksanaan Seminar
                      </span>
                      {seminarItem.attemptNumber && seminarItem.attemptNumber > 1 && (
                        <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-200 border border-amber-400/30">
                          Pelaksanaan Ke-{seminarItem.attemptNumber}
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-emerald-200 font-medium">
                      Program Studi Teknik Informatika UNIKOM
                    </span>
                  </div>

                  {/* Grid Key Info Seminar */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2 pb-6 border-b border-emerald-700/60">
                    <div className="flex items-start gap-3.5">
                      <div className="w-11 h-11 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center shrink-0">
                        <Calendar className="w-5 h-5 text-emerald-200" />
                      </div>
                      <div>
                        <span className="text-xs text-emerald-200 block font-medium">Hari & Tanggal Seminar</span>
                        <h3 className="text-lg font-bold text-white mt-0.5">
                          {formatIndonesianDate(seminarItem.date)}
                        </h3>
                        <span className="text-xs text-emerald-200 font-mono mt-0.5 block">
                          {formatIndonesianDate(seminarItem.date, true)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-start gap-3.5">
                      <div className="w-11 h-11 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center shrink-0">
                        <Clock className="w-5 h-5 text-emerald-200" />
                      </div>
                      <div>
                        <span className="text-xs text-emerald-200 block font-medium">Slot Waktu Seminar</span>
                        <h3 className="text-lg font-bold text-white mt-0.5 font-mono">
                          {semSlot?.label || '-'} WIB
                        </h3>
                        <span className="text-xs text-emerald-200 mt-0.5 block">
                          Presentasi Proposal &amp; Review
                        </span>
                      </div>
                    </div>

                    <div className="flex items-start gap-3.5">
                      <div className="w-11 h-11 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center shrink-0">
                        <MapPin className="w-5 h-5 text-emerald-200" />
                      </div>
                      <div>
                        <span className="text-xs text-emerald-200 block font-medium">Ruangan Seminar</span>
                        <h3 className="text-lg font-bold text-white mt-0.5">
                          Ruang {semRoom?.name || '-'}
                        </h3>
                        <span className="text-xs text-emerald-200 mt-0.5 block">
                          {semRoom ? `${semRoom.building}, ${semRoom.floor}` : '-'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Thesis Title Box */}
                  <div className="mt-6">
                    <span className="text-[11px] uppercase font-bold text-emerald-300 tracking-wider">
                      Judul Proposal / Seminar:
                    </span>
                    <p className="text-sm font-medium text-white leading-relaxed mt-1">
                      &ldquo;{seminarItem.thesisTitle}&rdquo;
                    </p>
                  </div>
                </div>
              </div>

              {/* Tim Dosen Seminar (2 Dosen: Reviewer & Pembimbing) */}
              <div className="bg-white rounded-2xl p-5 border border-emerald-200/80 shadow-sm">
                <div className="mb-4">
                  <h4 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Users className="w-4 h-4 text-emerald-600" />
                    <span>Tim Dosen Seminar Proposal / Kemajuan</span>
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Seminar dihadiri oleh Dosen Reviewer dan Dosen Pembimbing
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/40">
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 inline-block mb-2">
                      Dosen Reviewer Seminar
                    </span>
                    <h4 className="text-sm font-bold text-slate-900 leading-snug">
                      {semReviewer?.name || seminarItem.reviewerName || 'Belum Ditentukan'}
                    </h4>
                    <p className="text-xs text-slate-500 font-mono mt-1">
                      NIDN: {semReviewer?.nidn || '-'}
                    </p>
                    <p className="text-xs text-slate-600 mt-0.5">
                      {semReviewer?.department || '-'}
                    </p>
                  </div>

                  <div className="p-4 rounded-xl border border-sky-200 bg-sky-50/40">
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-sky-100 text-sky-800 border border-sky-200 inline-block mb-2">
                      Dosen Pembimbing
                    </span>
                    <h4 className="text-sm font-bold text-slate-900 leading-snug">
                      {semAdvisor?.name || seminarItem.advisorName || '-'}
                    </h4>
                    <p className="text-xs text-slate-500 font-mono mt-1">
                      NIDN: {semAdvisor?.nidn || '-'}
                    </p>
                    <p className="text-xs text-slate-600 mt-0.5">
                      {semAdvisor?.department || '-'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : isSeminarCompleted ? (
            <div className="bg-emerald-50/80 rounded-2xl p-5 border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-emerald-900">Seminar Proposal / Kemajuan Telah Lulus</h4>
                  <p className="text-xs text-emerald-800 mt-0.5">
                    Reviewer: <strong>{semReviewer?.name || seminarItem.reviewerName || '-'}</strong> • Pembimbing:{' '}
                    <strong>{semAdvisor?.name || seminarItem.advisorName || '-'}</strong>
                  </p>
                </div>
              </div>
              {seminarItem.seminarScore !== undefined && seminarItem.seminarScore !== '' && (
                <span className="text-xs font-bold font-mono text-emerald-800 bg-white px-3 py-1.5 rounded-xl border border-emerald-200 self-start sm:self-auto">
                  Nilai Seminar: {seminarItem.seminarScore}
                </span>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-2xl p-6 border border-emerald-200/80 shadow-sm text-center space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-base font-bold text-slate-900">
                  Jadwal Seminar Sedang Disusun oleh Panitia
                </h4>
                <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 leading-relaxed">
                  Pendaftaran seminar Anda telah masuk antrean penjadwalan. Panitia sedang menetapkan Dosen Reviewer, slot waktu, dan ruangan seminar.
                </p>
              </div>
              <div className="max-w-lg mx-auto p-4 rounded-xl bg-emerald-50/40 border border-emerald-200/70 text-left text-xs space-y-1.5">
                <div className="font-bold text-emerald-900">Detail Pendaftaran Seminar:</div>
                <div className="text-slate-700">• Judul: &ldquo;{seminarItem.thesisTitle}&rdquo;</div>
                <div className="text-slate-700">• Dosen Pembimbing: {semAdvisor?.name || seminarItem.advisorName || '-'}</div>
                <div className="text-slate-700">
                  • Dosen Reviewer: {semReviewer?.name || seminarItem.reviewerName || 'Menunggu Penetapan Panitia'}
                </div>
                {seminarItem.attemptNumber && seminarItem.attemptNumber > 1 && (
                  <div className="text-amber-700 font-semibold">
                    • Status: Penjadwalan Ulang Seminar (Percobaan ke-{seminarItem.attemptNumber})
                  </div>
                )}
              </div>
            </div>
          )
        ) : (
          /* Jika hanya ada sidangItem (sudah lulus seminar sebelumnya & langsung masuk data sidang) */
          <div className="bg-emerald-50/80 rounded-2xl p-5 border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-emerald-900">Prasyarat Seminar Proposal / Kemajuan Terpenuhi (Lulus)</h4>
                <p className="text-xs text-emerald-800 mt-0.5">
                  Dosen Reviewer: <strong>{p1?.name || sidangItem?.reviewerName || '-'}</strong> • Dosen Pembimbing:{' '}
                  <strong>{p2?.name || sidangItem?.advisorName || '-'}</strong>
                </p>
              </div>
            </div>
            {sidangItem?.seminarScore !== undefined && sidangItem?.seminarScore !== '' && (
              <span className="text-xs font-bold font-mono text-emerald-800 bg-white px-3 py-1.5 rounded-xl border border-emerald-200 self-start sm:self-auto">
                Nilai Seminar: {sidangItem.seminarScore}
              </span>
            )}
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════
          BAGIAN 2: INFORMASI SIDANG SKRIPSI
      ═══════════════════════════════════════════════════════════════════════ */}
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-2 px-1">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
              <GraduationCap className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Informasi Jadwal Sidang Skripsi</h3>
              <p className="text-xs text-slate-500">Pelaksanaan Sidang Skripsi bersama Majelis 3 Dosen Penguji</p>
            </div>
          </div>
        </div>

        {sidangItem ? (
          isSidangScheduled || isSidangCompleted ? (
            <div className="space-y-6">
              {/* Main Schedule Spotlight Card Sidang */}
              <div className="bg-gradient-to-br from-indigo-900 via-indigo-800 to-slate-900 rounded-2xl p-6 md:p-7 text-white shadow-lg relative overflow-hidden">
                <div className="absolute right-0 top-0 w-96 h-96 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />

                <div className="relative z-10">
                  <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-white p-0.5 flex items-center justify-center shrink-0 shadow-xs">
                        <img src="/logo-unikom.png" alt="UNIKOM" className="w-full h-full object-contain" />
                      </div>
                      <span className="text-xs uppercase font-bold tracking-wider px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        {isSidangCompleted ? 'Sidang Skripsi Selesai' : 'Jadwal Resmi Pelaksanaan Sidang'}
                      </span>
                    </div>

                    <span className="text-xs text-indigo-200 font-medium">
                      Program Studi Teknik Informatika UNIKOM
                    </span>
                  </div>

                  {/* Grid of Key Info */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2 pb-6 border-b border-indigo-700/60">
                    <div className="flex items-start gap-3.5">
                      <div className="w-11 h-11 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center shrink-0">
                        <Calendar className="w-5 h-5 text-indigo-200" />
                      </div>
                      <div>
                        <span className="text-xs text-indigo-200 block font-medium">Hari &amp; Tanggal</span>
                        <h3 className="text-lg font-bold text-white mt-0.5">
                          {formatIndonesianDate(sidangItem.date)}
                        </h3>
                        <span className="text-xs text-indigo-200 font-mono mt-0.5 block">
                          {formatIndonesianDate(sidangItem.date, true)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-start gap-3.5">
                      <div className="w-11 h-11 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center shrink-0">
                        <Clock className="w-5 h-5 text-indigo-200" />
                      </div>
                      <div>
                        <span className="text-xs text-indigo-200 block font-medium">Slot Waktu Sidang</span>
                        <h3 className="text-lg font-bold text-white mt-0.5 font-mono">
                          {sidSlot?.label || '-'} WIB
                        </h3>
                        <span className="text-xs text-indigo-200 mt-0.5 block">
                          Durasi 75 Menit (Presentasi &amp; Tanya Jawab)
                        </span>
                      </div>
                    </div>

                    <div className="flex items-start gap-3.5">
                      <div className="w-11 h-11 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center shrink-0">
                        <MapPin className="w-5 h-5 text-indigo-200" />
                      </div>
                      <div>
                        <span className="text-xs text-indigo-200 block font-medium">Ruangan Sidang</span>
                        <h3 className="text-lg font-bold text-white mt-0.5">
                          Ruang {sidRoom?.name || '-'}
                        </h3>
                        <span className="text-xs text-indigo-200 mt-0.5 block">
                          {sidRoom ? `${sidRoom.building}, ${sidRoom.floor}` : '-'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Thesis Title Box */}
                  <div className="mt-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1 max-w-2xl">
                      <span className="text-[11px] uppercase font-bold text-indigo-300 tracking-wider">
                        Judul Skripsi / Tugas Akhir:
                      </span>
                      <p className="text-sm font-medium text-white leading-relaxed">
                        &ldquo;{sidangItem.thesisTitle}&rdquo;
                      </p>
                    </div>

                    <button
                      onClick={() => setIsPrintModalOpen(true)}
                      className="shrink-0 flex items-center gap-2 h-10 px-5 rounded-xl bg-white text-indigo-900 font-semibold text-sm hover:bg-indigo-50 shadow-md transition-colors"
                    >
                      <Printer className="w-4 h-4 text-indigo-600" />
                      <span>Cetak Label Draft Sidang</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* 3 Examiners Breakdown */}
              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                      <Users className="w-4 h-4 text-indigo-600" />
                      <span>Susunan 3 Dosen Penguji Sidang</span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Wajib menyerahkan 3 eksemplar draft bertanda label
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Penguji 1 */}
                  <div className="p-4 rounded-xl border border-indigo-200 bg-indigo-50/40">
                    <div className="flex items-center justify-between gap-1 mb-2">
                      <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 border border-indigo-200 inline-block">
                        Penguji 1 (Ketua Penguji)
                      </span>
                      <span className="text-[10px] font-bold text-indigo-600 bg-white px-1.5 py-0.5 rounded border border-indigo-200">
                        Dosen Reviewer
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-slate-900 leading-snug">
                      {p1?.name || sidangItem.reviewerName || '-'}
                    </h4>
                    <p className="text-xs text-slate-500 font-mono mt-1">
                      NIDN: {p1?.nidn || '-'}
                    </p>
                    <p className="text-xs text-slate-600 mt-0.5">
                      {p1?.department}
                    </p>
                  </div>

                  {/* Penguji 2 */}
                  <div className="p-4 rounded-xl border border-sky-200 bg-sky-50/40">
                    <div className="flex items-center justify-between gap-1 mb-2">
                      <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-sky-100 text-sky-800 border border-sky-200 inline-block">
                        Penguji 2 (Anggota Penguji)
                      </span>
                      <span className="text-[10px] font-bold text-sky-600 bg-white px-1.5 py-0.5 rounded border border-sky-200">
                        Dosen Pembimbing
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-slate-900 leading-snug">
                      {p2?.name || sidangItem.advisorName || '-'}
                    </h4>
                    <p className="text-xs text-slate-500 font-mono mt-1">
                      NIDN: {p2?.nidn || '-'}
                    </p>
                    <p className="text-xs text-slate-600 mt-0.5">
                      {p2?.department}
                    </p>
                  </div>

                  {/* Penguji 3 */}
                  <div className="p-4 rounded-xl border border-teal-200 bg-teal-50/40">
                    <div className="flex items-center justify-between gap-1 mb-2">
                      <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 border border-teal-200 inline-block">
                        Penguji 3 (Anggota Penguji)
                      </span>
                      <span className="text-[10px] font-bold text-teal-600 bg-white px-1.5 py-0.5 rounded border border-teal-200">
                        Bebas Bentrok
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-slate-900 leading-snug">
                      {p3?.name || 'Belum Ditentukan'}
                    </h4>
                    <p className="text-xs text-slate-500 font-mono mt-1">
                      NIDN: {p3?.nidn || '-'}
                    </p>
                    <p className="text-xs text-slate-600 mt-0.5">
                      {p3?.department}
                    </p>
                  </div>
                </div>
              </div>

              {/* Checklist & Instructions */}
              <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <FileCheck className="w-4 h-4 text-emerald-600" />
                  Petunjuk Pelaksanaan Sidang Bagi Mahasiswa:
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-sm text-slate-600">
                  <div className="flex items-start gap-2.5">
                    <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center shrink-0 text-xs">
                      1
                    </span>
                    <span className="leading-relaxed">
                      Cetak 3 lembar label draft sidang menggunakan tombol di atas, lalu tempelkan pada sampul draft skripsi masing-masing penguji.
                    </span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center shrink-0 text-xs">
                      2
                    </span>
                    <span className="leading-relaxed">
                      Serahkan draft skripsi ke Dosen Penguji 1, 2, dan 3 paling lambat H-3 sebelum tanggal sidang berlangsung.
                    </span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center shrink-0 text-xs">
                      3
                    </span>
                    <span className="leading-relaxed">
                      Hadir di ruangan sidang minimal 30 menit sebelum slot waktu dimulai dengan pakaian sipil lengkap (PSL) / almamater resmi.
                    </span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center shrink-0 text-xs">
                      4
                    </span>
                    <span className="leading-relaxed">
                      Siapkan file presentasi (maksimal 15 slide), file demo sistem, dan perlengkapan proyektor HDMI.
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Unassigned Sidang State */
            <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm text-center space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
                <AlertCircle className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  Jadwal Sidang Sedang Disusun oleh Panitia
                </h3>
                <p className="text-sm text-slate-500 max-w-md mx-auto mt-1 leading-relaxed">
                  Pengajuan sidang Anda telah terdaftar. Panitia sedang menyusun matriks slot waktu dan ruangan agar bebas dari bentrok jadwal.
                </p>
              </div>

              <div className="max-w-md mx-auto p-4 rounded-xl bg-slate-50 border border-slate-200 text-left text-sm space-y-2">
                <div className="font-bold text-slate-800">Status Pengajuan Sidang:</div>
                <div className="text-slate-600">• Judul: &ldquo;{sidangItem.thesisTitle}&rdquo;</div>
                <div className="text-slate-600">• Penguji 1 (Ketua): {p1?.name || sidangItem.reviewerName || '-'}</div>
                <div className="text-slate-600">• Penguji 2 (Pembimbing): {p2?.name || sidangItem.advisorName || '-'}</div>
                <div className="text-slate-600">• Penguji 3: {p3?.name || 'Belum Ditentukan'}</div>
              </div>

              <p className="text-xs text-slate-400">
                * Silakan cek kembali secara berkala atau hubungi bagian tata usaha program studi.
              </p>
            </div>
          )
        ) : (
          /* Belum Lulus Seminar -> Sidang Belum Terbuka */
          <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200/80 flex items-start gap-4">
            <div className="w-11 h-11 rounded-xl bg-slate-200/80 text-slate-600 flex items-center justify-center shrink-0">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900">Pengajuan Sidang Skripsi Belum Dibuka</h4>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                Sesuai aturan akademik Program Studi Teknik Informatika, Anda wajib menyelesaikan dan dinyatakan <strong>Lulus Seminar Proposal/Kemajuan</strong> terlebih dahulu sebelum dijadwalkan untuk Sidang Skripsi.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Printable Label Modal (Hanya untuk Sidang) */}
      {sidangItem && (
        <PrintDraftLabelModal
          item={sidangItem}
          lecturers={lecturers}
          rooms={rooms}
          timeSlots={timeSlots}
          isOpen={isPrintModalOpen}
          onClose={() => setIsPrintModalOpen(false)}
        />
      )}

    </div>
  );
};
