import React, { useState } from 'react';
import { useSchedule } from '../../context/ScheduleContext';
import { 
  UserCheck, 
  Calendar, 
  Clock, 
  MapPin, 
  Filter, 
  Printer, 
  CheckCircle2, 
  Search,
  Award,
  GraduationCap,
  Users,
  BookOpen,
  CalendarDays,
  Building2,
  ShieldCheck,
  AlertTriangle,
  X
} from 'lucide-react';
import { formatIndonesianDate } from '../../utils/formatters';
import { CalendarDatePicker } from '../shared/CalendarDatePicker';
import { ScheduleItem } from '../../types';

export interface DosenViewProps {
  viewMode?: 'personal' | 'master';
}

export const DosenView: React.FC<DosenViewProps> = ({ viewMode = 'personal' }) => {
  const { 
    currentLecturerId, 
    lecturers, 
    schedules, 
    rooms, 
    timeSlots,
    completeSchedule,
    scheduledDates,
    matrixCardCountsByDate
  } = useSchedule();

  const [filterDate, setFilterDate] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [completingItem, setCompletingItem] = useState<ScheduleItem | null>(null);

  const currentLecturer = lecturers.find(l => l.id === currentLecturerId) || lecturers[0] || {
    id: '',
    name: 'Dosen Penguji',
    code: 'DSN',
    nidn: '-',
    department: 'Teknik Informatika',
    email: '-',
    phone: '-'
  };

  const lecturerMap = new Map(lecturers.map(l => [l.id, l]));
  const roomMap = new Map(rooms.map(r => [r.id, r.name]));
  const timeSlotMap = new Map(timeSlots.map(t => [t.id, t.label]));

  // ─── 1. Per-Dosen Personal Data ──────────────────────────────────────────
  const allPersonalSchedules = schedules.filter(s => {
    if (s.status !== 'scheduled' && s.status !== 'completed') return false;
    if (!currentLecturer.id) return false;
    return (
      s.examiner1Id === currentLecturer.id ||
      s.examiner2Id === currentLecturer.id ||
      s.examiner3Id === currentLecturer.id
    );
  });

  const personalScheduledDates = Array.from(new Set(allPersonalSchedules.map(s => s.date))).sort();
  const personalCountsByDate = allPersonalSchedules.reduce((acc, s) => {
    acc[s.date] = (acc[s.date] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const personalSchedules = allPersonalSchedules.filter(s => {
    if (filterDate !== 'all' && s.date !== filterDate) return false;
    return true;
  });

  const personalSeminarSchedules = personalSchedules.filter(s => s.activityType === 'seminar');
  const personalSidangSchedules = personalSchedules.filter(s => !s.activityType || s.activityType === 'sidang');

  const allPersonalSeminarCount = allPersonalSchedules.filter(s => s.activityType === 'seminar').length;
  const allPersonalSidangCount = allPersonalSchedules.filter(s => !s.activityType || s.activityType === 'sidang').length;

  // KPI Statistics for current lecturer
  const countAsP1 = currentLecturer.id ? schedules.filter(s => (s.status === 'scheduled' || s.status === 'completed') && s.examiner1Id === currentLecturer.id).length : 0;
  const countAsP2 = currentLecturer.id ? schedules.filter(s => (s.status === 'scheduled' || s.status === 'completed') && s.examiner2Id === currentLecturer.id).length : 0;
  const countAsP3 = currentLecturer.id ? schedules.filter(s => (s.status === 'scheduled' || s.status === 'completed') && s.examiner3Id === currentLecturer.id).length : 0;
  const totalAssigned = countAsP1 + countAsP2 + countAsP3;

  // ─── 2. Master Schedule Data ─────────────────────────────────────────────
  const scheduledSessions = schedules.filter(s => s.status === 'scheduled' || s.status === 'completed');
  const usedRoomIds = new Set(scheduledSessions.map(s => s.roomId).filter(Boolean));
  const activeLecturerIds = new Set(
    scheduledSessions.flatMap(s => [s.examiner1Id, s.examiner2Id, s.examiner3Id]).filter(Boolean)
  );

  const masterSchedules = scheduledSessions.filter(s => {
    if (filterDate !== 'all' && s.date !== filterDate) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      const matchName = (s.studentName || '').toLowerCase().includes(q);
      const matchNim = (s.nim || '').includes(q);
      const matchTitle = (s.thesisTitle || '').toLowerCase().includes(q);
      const matchExaminer = 
        (lecturerMap.get(s.examiner1Id)?.name || '').toLowerCase().includes(q) ||
        (lecturerMap.get(s.examiner2Id)?.name || '').toLowerCase().includes(q) ||
        (lecturerMap.get(s.examiner3Id)?.name || '').toLowerCase().includes(q);
      return matchName || matchNim || matchTitle || matchExaminer;
    }
    return true;
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // MODE 1: JADWAL TUGAS PERSONAL
  // ═══════════════════════════════════════════════════════════════════════════
  if (viewMode === 'personal') {
    return (
      <div className="space-y-6">
        
        {/* ── A. Personal View Header (Profile Card) ── */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-5">
          
          {/* Profile Info */}
          <div className="flex items-center gap-4">
            {currentLecturer.photoUrl ? (
              <img
                src={currentLecturer.photoUrl}
                alt={currentLecturer.name}
                className="w-14 h-14 rounded-2xl object-cover shrink-0 shadow-md border-2 border-indigo-200"
              />
            ) : (
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-700 to-indigo-500 text-white font-bold text-base flex items-center justify-center shadow-md shadow-indigo-500/20 shrink-0 font-mono">
                {currentLecturer.code}
              </div>
            )}
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200/60 uppercase tracking-wider flex items-center gap-1.5">
                  <img src="/logo-unikom.png" alt="UNIKOM" className="w-3.5 h-3.5 object-contain" />
                  <span>Dosen Penguji Sidang IF UNIKOM</span>
                </span>
              </div>
              <h2 className="text-xl font-bold text-slate-900 mt-1">
                {currentLecturer.name}
              </h2>
              <p className="text-sm text-slate-500">
                NIDN: {currentLecturer.nidn} • {currentLecturer.department} • {currentLecturer.email}
              </p>
            </div>
          </div>

          {/* Print Button */}
          <div className="flex items-center">
            <button
              onClick={() => window.print()}
              className="self-end sm:self-auto flex items-center gap-2 h-10 px-4 text-sm font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl shadow-2xs transition-colors"
            >
              <Printer className="w-4 h-4 text-indigo-600" />
              <span>Cetak Jadwal Personal</span>
            </button>
          </div>

        </div>

        {/* ── B. KPI Cards (4 cards) ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-medium text-slate-500">Total Tugas Personal</span>
              <Award className="w-5 h-5 text-indigo-600" />
            </div>
            <p className="text-3xl font-bold text-slate-900 font-mono">{totalAssigned}</p>
            <span className="text-xs font-medium text-slate-500 mt-0.5 inline-block">
              {allPersonalSeminarCount} Seminar • {allPersonalSidangCount} Sidang
            </span>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-medium text-slate-500">Ketua / Reviewer</span>
              <span className="w-5 h-5 rounded-full bg-indigo-500 flex items-center justify-center" />
            </div>
            <p className="text-3xl font-bold text-indigo-700 font-mono">{countAsP1}</p>
            <span className="text-xs font-medium text-slate-500 mt-0.5 inline-block">Ketua Penguji / Reviewer</span>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-medium text-slate-500">Penguji 2 / Pembimbing</span>
              <span className="w-5 h-5 rounded-full bg-sky-500 flex items-center justify-center" />
            </div>
            <p className="text-3xl font-bold text-sky-700 font-mono">{countAsP2}</p>
            <span className="text-xs font-medium text-slate-500 mt-0.5 inline-block">Pembimbing / Penguji 2</span>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-medium text-slate-500">Sebagai Penguji 3</span>
              <span className="w-5 h-5 rounded-full bg-teal-500 flex items-center justify-center" />
            </div>
            <p className="text-3xl font-bold text-teal-700 font-mono">{countAsP3}</p>
            <span className="text-xs font-medium text-slate-500 mt-0.5 inline-block">Anggota Penguji Sidang</span>
          </div>
        </div>

        {/* ── Filter Bar Jadwal Tugas Personal ── */}
        <div className="bg-white rounded-2xl px-6 py-4 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">
              Filter Jadwal Tugas Personal
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Menampilkan {personalSeminarSchedules.length} jadwal seminar dan {personalSidangSchedules.length} jadwal sidang untuk {currentLecturer.name}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <CalendarDatePicker
              value={filterDate}
              onChange={(newDate) => setFilterDate(newDate)}
              highlightedDates={personalScheduledDates}
              dateCounts={personalCountsByDate}
              allowAll={true}
              allLabel="Semua Tanggal Pelaksanaan"
              align="right"
            />
          </div>
        </div>

        {/* ── SECTION 1: Daftar Jadwal Tugas Seminar ── */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="px-6 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-emerald-50/50 rounded-t-2xl">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                <BookOpen className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-900">
                  Daftar Jadwal Tugas Seminar
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Tugas sebagai Dosen Reviewer atau Dosen Pembimbing pada Seminar Proposal/Kemajuan
                </p>
              </div>
            </div>
            <span className="text-xs font-bold text-emerald-700 bg-emerald-100/80 border border-emerald-200 px-3 py-1 rounded-full self-start sm:self-auto whitespace-nowrap">
              {personalSeminarSchedules.length} Jadwal Seminar
            </span>
          </div>

          <div className="p-6">
            {personalSeminarSchedules.length > 0 ? (
              <div
                className={
                  personalSeminarSchedules.length > 4
                    ? 'max-h-[960px] overflow-y-auto pr-2 scroll-smooth print:max-h-none print:overflow-visible print:pr-0'
                    : ''
                }
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {personalSeminarSchedules.map(item => {
                  const isCurrentReviewer = item.examiner1Id === currentLecturer.id;
                  const isCurrentAdvisor = item.examiner2Id === currentLecturer.id;

                  const roleTag = isCurrentReviewer
                    ? { title: 'DOSEN REVIEWER SEMINAR', bg: 'bg-emerald-600 text-white' }
                    : { title: 'DOSEN PEMBIMBING SEMINAR', bg: 'bg-sky-600 text-white' };

                  const reviewer = lecturerMap.get(item.examiner1Id);
                  const advisor = lecturerMap.get(item.examiner2Id);
                  const isSeminarDone = item.status === 'completed' || item.seminarResult === 'lulus';

                  return (
                    <div
                      key={item.id}
                      className="p-5 rounded-2xl border-2 border-emerald-200/80 bg-white hover:border-emerald-400 hover:shadow-md transition-all duration-200 flex flex-col justify-between"
                    >
                      <div>
                        {/* Top Header: Role badge & time */}
                        <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-lg ${roleTag.bg}`}>
                              {roleTag.title}
                            </span>
                            {item.attemptNumber && item.attemptNumber > 1 && (
                              <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 border border-amber-200">
                                Ke-{item.attemptNumber}
                              </span>
                            )}
                          </div>
                          <span className="text-sm font-bold text-emerald-800 bg-emerald-50 border border-emerald-200/70 px-2.5 py-0.5 rounded-md font-mono">
                            {timeSlotMap.get(item.timeSlotId || '')} WIB
                          </span>
                        </div>

                        {/* Date & Room Details */}
                        <div className="flex flex-wrap items-center gap-3 mb-3 pb-3 border-b border-slate-100">
                          <div className="flex items-center gap-1.5 text-sm text-slate-600 font-medium">
                            <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                            <span>{formatIndonesianDate(item.date)}</span>
                          </div>
                          <span className="text-slate-300">•</span>
                          <div className="flex items-center gap-1.5 text-sm text-slate-600 font-medium">
                            <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Ruang {roomMap.get(item.roomId || '')}</span>
                          </div>
                        </div>

                        {/* Student Bio */}
                        <div className="p-3 rounded-xl bg-emerald-50/40 border border-emerald-200/70 mb-3">
                          <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                            Mahasiswa Peserta Seminar:
                          </div>
                          <div className="text-sm font-bold uppercase text-slate-900 mt-0.5">
                            {item.studentName}
                          </div>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <span className="text-xs font-mono font-semibold text-emerald-800 bg-emerald-100/80 px-1.5 py-0.5 rounded">
                              NIM: {item.nim}
                            </span>
                            <span className="text-xs text-slate-500">•</span>
                            <span className="text-xs text-slate-500">{item.studyProgram}</span>
                          </div>
                        </div>

                        {/* Thesis Title */}
                        <div className="mb-4">
                          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                            Judul Proposal / Seminar:
                          </div>
                          <p className="text-sm text-slate-700 leading-relaxed italic">
                            &ldquo;{item.thesisTitle}&rdquo;
                          </p>
                        </div>
                      </div>

                      {/* Seminar Team: Reviewer & Pembimbing (Tanpa P3) */}
                      <div className="pt-4 mt-4 border-t border-slate-100 space-y-1.5">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                          Tim Dosen Seminar:
                        </div>

                        {/* Reviewer */}
                        <div className={`p-1.5 rounded-lg flex items-start gap-2 ${
                          isCurrentReviewer ? 'bg-emerald-50/90 border border-emerald-200 text-emerald-950 font-bold' : 'text-slate-700'
                        }`}>
                          <span className="px-1.5 h-5 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5 font-mono">
                            REV
                          </span>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-semibold text-slate-900 leading-tight break-words">
                              {reviewer?.name || item.reviewerName || '-'}{' '}
                              {isCurrentReviewer && <span className="text-emerald-600 font-bold ml-1">(Anda)</span>}
                            </div>
                            <div className="text-xs text-slate-500">Dosen Reviewer</div>
                          </div>
                        </div>

                        {/* Pembimbing */}
                        <div className={`p-1.5 rounded-lg flex items-start gap-2 ${
                          isCurrentAdvisor ? 'bg-sky-50/80 border border-sky-200 text-sky-950 font-bold' : 'text-slate-700'
                        }`}>
                          <span className="px-1.5 h-5 rounded bg-sky-100 text-sky-800 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5 font-mono">
                            PBB
                          </span>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-semibold text-slate-900 leading-tight break-words">
                              {advisor?.name || item.advisorName || '-'}{' '}
                              {isCurrentAdvisor && <span className="text-sky-600 font-bold ml-1">(Anda)</span>}
                            </div>
                            <div className="text-xs text-slate-500">Dosen Pembimbing</div>
                          </div>
                        </div>
                      </div>

                      {/* Seminar Status */}
                      <div className="pt-3.5 mt-3 border-t border-slate-100 flex items-center justify-between gap-3">
                        {isSeminarDone ? (
                          <div className="w-full flex items-center justify-between bg-emerald-50/80 border border-emerald-200/80 rounded-xl px-3 py-2">
                            <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-800">
                              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                              <span>Seminar Selesai (Lulus)</span>
                            </span>
                            {item.seminarScore !== undefined && item.seminarScore !== '' && (
                              <span className="text-xs font-bold font-mono text-emerald-700 bg-white px-2 py-0.5 rounded-md border border-emerald-200">
                                Nilai: {item.seminarScore}
                              </span>
                            )}
                          </div>
                        ) : (
                          <div className="w-full flex items-center justify-between text-xs text-slate-500 px-1">
                            <span className="flex items-center gap-1.5 text-emerald-700 font-medium text-[11px]">
                              <Clock className="w-3.5 h-3.5 text-emerald-500" />
                              <span>Status: Seminar Terjadwal</span>
                            </span>
                            <span className="text-[11px] text-slate-400 italic">
                              Penilaian dicatat oleh Admin / Panitia
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <BookOpen className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <p className="text-sm font-bold text-slate-700">Tidak Ada Jadwal Tugas Seminar</p>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                  Dosen ini belum memiliki agenda seminar yang dijadwalkan pada rentang filter tanggal yang dipilih.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* ── SECTION 2: Daftar Jadwal Tugas Sidang Skripsi ── */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs">
          
          {/* ── C. Section Header ── */}
          <div className="px-6 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-indigo-50/40 rounded-t-2xl">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
                <GraduationCap className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-900">
                  Daftar Jadwal Tugas Sidang Skripsi
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Tugas sebagai Ketua Penguji (P1), Penguji 2 / Pembimbing (P2), atau Penguji 3 (P3)
                </p>
              </div>
            </div>

            <span className="text-xs font-bold text-indigo-700 bg-indigo-100/80 border border-indigo-200 px-3 py-1 rounded-full self-start sm:self-auto whitespace-nowrap">
              {personalSidangSchedules.length} Jadwal Sidang
            </span>
          </div>

          {/* ── D. Personal Sidang Schedule Cards ── */}
          <div className="p-6">
            {personalSidangSchedules.length > 0 ? (
              <div
                className={
                  personalSidangSchedules.length > 4
                    ? 'max-h-[1060px] overflow-y-auto pr-2 scroll-smooth print:max-h-none print:overflow-visible print:pr-0'
                    : ''
                }
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {personalSidangSchedules.map(item => {
                  const isCurrentP1 = item.examiner1Id === currentLecturer.id;
                  const isCurrentP2 = item.examiner2Id === currentLecturer.id;
                  const isCurrentP3 = item.examiner3Id === currentLecturer.id;

                  const roleTag = 
                    isCurrentP1 ? { title: 'PENGUJI 1 (KETUA PENGUJI)', bg: 'bg-indigo-600 text-white' } :
                    isCurrentP2 ? { title: 'PENGUJI 2 (ANGGOTA PENGUJI)', bg: 'bg-sky-600 text-white' } :
                    { title: 'PENGUJI 3 (ANGGOTA PENGUJI)', bg: 'bg-teal-600 text-white' };

                  const p1 = lecturerMap.get(item.examiner1Id);
                  const p2 = lecturerMap.get(item.examiner2Id);
                  const p3 = lecturerMap.get(item.examiner3Id);

                  return (
                    <div
                      key={item.id}
                      className="p-5 rounded-2xl border-2 border-slate-200 bg-white hover:border-indigo-400 hover:shadow-md transition-all duration-200 flex flex-col justify-between"
                    >
                      <div>
                        {/* Top Header: Role badge & time */}
                        <div className="flex items-center justify-between gap-2 mb-3">
                          {/* Role badge — pertahankan */}
                          <span className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-lg ${roleTag.bg}`}>
                            {roleTag.title}
                          </span>
                          <span className="text-sm font-bold text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded-md font-mono">
                            {timeSlotMap.get(item.timeSlotId || '')} WIB
                          </span>
                        </div>

                        {/* Date & Room Details */}
                        <div className="flex flex-wrap items-center gap-3 mb-3 pb-3 border-b border-slate-100">
                          <div className="flex items-center gap-1.5 text-sm text-slate-600 font-medium">
                            <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                            <span>{formatIndonesianDate(item.date)}</span>
                          </div>
                          <span className="text-slate-300">•</span>
                          <div className="flex items-center gap-1.5 text-sm text-slate-600 font-medium">
                            <MapPin className="w-3.5 h-3.5 text-indigo-600" />
                            <span>Ruang {roomMap.get(item.roomId || '')}</span>
                          </div>
                        </div>

                        {/* Student Bio */}
                        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 mb-3">
                          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                            Mahasiswa Peserta Sidang:
                          </div>
                          <div className="text-sm font-bold uppercase text-slate-900 mt-0.5">
                            {item.studentName}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs font-mono font-semibold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded">
                              NIM: {item.nim}
                            </span>
                            <span className="text-xs text-slate-500">•</span>
                            <span className="text-xs text-slate-500">{item.studyProgram}</span>
                          </div>
                        </div>

                        {/* Thesis Title */}
                        <div className="mb-4">
                          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                            Judul Skripsi:
                          </div>
                          <p className="text-sm text-slate-700 leading-relaxed italic">
                            &ldquo;{item.thesisTitle}&rdquo;
                          </p>
                        </div>
                      </div>

                      {/* Examiners Team */}
                      <div className="pt-4 mt-4 border-t border-slate-100 space-y-1.5">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                          Susunan Dewan Penguji:
                        </div>

                        {/* P1 */}
                        <div className={`p-1.5 rounded-lg flex items-start gap-2 ${
                          isCurrentP1 ? 'bg-indigo-50/80 border border-indigo-200 text-indigo-950 font-bold' : 'text-slate-700'
                        }`}>
                          <span className="w-5 h-5 rounded bg-indigo-100 text-indigo-800 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5 font-mono">
                            P1
                          </span>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-semibold text-slate-900 leading-tight break-words">
                              {p1?.name || '-'} {isCurrentP1 && <span className="text-indigo-600 font-bold ml-1">(Anda)</span>}
                            </div>
                            <div className="text-xs text-slate-500">Ketua Penguji</div>
                          </div>
                        </div>

                        {/* P2 */}
                        <div className={`p-1.5 rounded-lg flex items-start gap-2 ${
                          isCurrentP2 ? 'bg-sky-50/80 border border-sky-200 text-sky-950 font-bold' : 'text-slate-700'
                        }`}>
                          <span className="w-5 h-5 rounded bg-sky-100 text-sky-800 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5 font-mono">
                            P2
                          </span>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-semibold text-slate-900 leading-tight break-words">
                              {p2?.name || '-'} {isCurrentP2 && <span className="text-sky-600 font-bold ml-1">(Anda)</span>}
                            </div>
                            <div className="text-xs text-slate-500">Anggota Penguji</div>
                          </div>
                        </div>

                        {/* P3 */}
                        <div className={`p-1.5 rounded-lg flex items-start gap-2 ${
                          isCurrentP3 ? 'bg-teal-50/80 border border-teal-200 text-teal-950 font-bold' : 'text-slate-700'
                        }`}>
                          <span className="w-5 h-5 rounded bg-teal-100 text-teal-800 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5 font-mono">
                            P3
                          </span>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-semibold text-slate-900 leading-tight break-words">
                              {p3?.name || '-'} {isCurrentP3 && <span className="text-teal-600 font-bold ml-1">(Anda)</span>}
                            </div>
                            <div className="text-xs text-slate-500">Anggota Penguji</div>
                          </div>
                        </div>
                      </div>

                      {/* Action & Status Section */}
                      <div className="pt-3.5 mt-3 border-t border-slate-100 flex items-center justify-between gap-3">
                        {item.status === 'completed' ? (
                          <div className="w-full flex items-center justify-between bg-emerald-50/80 border border-emerald-200/80 rounded-xl px-3 py-2">
                            <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-800">
                              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                              <span>Sidang Selesai</span>
                            </span>
                          </div>
                        ) : isCurrentP1 ? (
                          <div className="w-full flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 bg-indigo-50/50 border border-indigo-100 rounded-xl p-2.5">
                            <div className="text-[11px] text-indigo-900 leading-tight">
                              <span className="font-bold">Wewenang Ketua Penguji:</span> Selesaikan sidang setelah sesi berlangsung
                            </div>
                            <button
                              onClick={() => setCompletingItem(item)}
                              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-lg shadow-xs transition-colors shrink-0"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Nyatakan Sidang Selesai</span>
                            </button>
                          </div>
                        ) : (
                          <div className="w-full flex items-center justify-between text-xs text-slate-500 px-1">
                            <span className="flex items-center gap-1.5 text-slate-600 font-medium text-[11px]">
                              <Clock className="w-3.5 h-3.5 text-slate-400" />
                              <span>Status: Terjadwal</span>
                            </span>
                            <span className="text-[11px] text-slate-400 italic">
                              Penyelesaian oleh Ketua Penguji (P1)
                            </span>
                          </div>
                        )}
                      </div>

                    </div>
                  );
                })}
                </div>
              </div>
            ) : (
              <div className="text-center py-16">
                <CheckCircle2 className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                <p className="text-sm font-bold text-slate-700">Tidak Ada Jadwal Tugas Pengujian</p>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                  Dosen ini belum memiliki agenda sidang yang dijadwalkan pada rentang filter tanggal yang dipilih.
                </p>
              </div>
            )}
          </div>

        </div>

        {/* ── Modal Konfirmasi Selesaikan Sidang (Dosen Ketua Penguji) ── */}
        {completingItem && (
          <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-3xl max-w-md w-full border border-slate-200 shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95 my-auto">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center ring-4 ring-indigo-50">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <button
                  onClick={() => setCompletingItem(null)}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                  Wewenang Dosen Ketua Penguji
                </span>
                <h3 className="text-lg font-bold text-slate-900 mt-1.5">
                  Konfirmasi Sidang Selesai
                </h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Sebagai <strong>Ketua Penguji (P1)</strong>, Anda menyatakan bahwa pelaksanaan sidang skripsi untuk mahasiswa ini telah selesai dilaksanakan.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-1.5">
                <div className="font-bold text-slate-900 uppercase">{completingItem.studentName}</div>
                <div className="font-mono text-indigo-700 font-semibold">NIM: {completingItem.nim}</div>
                <div className="text-slate-600 line-clamp-2 italic">"{completingItem.thesisTitle}"</div>
              </div>

              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-800 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span className="leading-relaxed">
                  <strong>Perhatian:</strong> Setelah dinyatakan selesai, data Penguji 3 dan ruangan sidang akan <strong>terkunci permanen</strong> di database dan tidak dapat diubah kembali.
                </span>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  onClick={() => setCompletingItem(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors"
                >
                  Batal
                </button>
                <button
                  onClick={() => {
                    completeSchedule(completingItem.id);
                    setCompletingItem(null);
                  }}
                  className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Ya, Selesaikan Sidang</span>
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // MODE 2: JADWAL LENGKAP SIDANG
  // ═══════════════════════════════════════════════════════════════════════════
  return (
    <div className="space-y-6">
      
      {/* Master View Header */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-5">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-indigo-700 to-indigo-500 text-white flex items-center justify-center shadow-md shadow-indigo-500/20 shrink-0">
            <CalendarDays className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200/60 uppercase tracking-wider flex items-center gap-1.5">
                <img src="/logo-unikom.png" alt="UNIKOM" className="w-3.5 h-3.5 object-contain" />
                <span>Portal Informasi Dosen IF UNIKOM</span>
              </span>
              <span className="text-xs text-slate-400 font-medium">
                Gelombang Semester Genap
              </span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 mt-1">
              Jadwal Lengkap Sidang Skripsi
            </h2>
            <p className="text-sm text-slate-500">
              Agenda komprehensif seluruh pelaksanaan sidang skripsi, pembagian ruangan, dan dewan penguji.
            </p>
          </div>
        </div>

        <button
          onClick={() => window.print()}
          className="self-end sm:self-auto flex items-center gap-2 h-10 px-4 text-sm font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl shadow-2xs transition-colors shrink-0"
        >
          <Printer className="w-4 h-4 text-indigo-600" />
          <span>Cetak Jadwal Lengkap</span>
        </button>
      </div>

      {/* ── B. KPI Stats Cards for Master Schedule ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium text-slate-500">Total Sidang Terjadwal</span>
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          </div>
          <p className="text-3xl font-bold text-slate-900 font-mono">{scheduledSessions.length}</p>
          <span className="text-xs font-medium text-slate-500 mt-0.5 inline-block">Sesi Sidang</span>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium text-slate-500">Mahasiswa Terjadwal</span>
            <GraduationCap className="w-5 h-5 text-indigo-600" />
          </div>
          <p className="text-3xl font-bold text-indigo-700 font-mono">{scheduledSessions.length}</p>
          <span className="text-xs font-medium text-slate-500 mt-0.5 inline-block">Peserta Sidang</span>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium text-slate-500">Dosen Terlibat</span>
            <Users className="w-5 h-5 text-sky-600" />
          </div>
          <p className="text-3xl font-bold text-sky-700 font-mono">{activeLecturerIds.size}</p>
          <span className="text-xs font-medium text-slate-500 mt-0.5 inline-block">Dosen Penguji Aktif</span>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium text-slate-500">Ruangan Digunakan</span>
            <Building2 className="w-5 h-5 text-teal-600" />
          </div>
          <p className="text-3xl font-bold text-teal-700 font-mono">{usedRoomIds.size}</p>
          <span className="text-xs font-medium text-slate-500 mt-0.5 inline-block">Ruangan Sidang</span>
        </div>
      </div>

      {/* ── E. Master Schedule Table Section ── */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs">
        
        {/* Filter and Search Bar */}
        <div className="px-6 py-4 border-b border-slate-100 flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-slate-50/50 rounded-t-2xl">
          
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari nama mahasiswa, NIM, judul skripsi, atau nama dosen..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-10 text-sm pl-9 pr-3.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-xs"
            />
          </div>

          {/* Date Filter via Calendar Picker & Counter */}
          <div className="flex items-center gap-3">
            <CalendarDatePicker
              value={filterDate}
              onChange={(newDate) => setFilterDate(newDate)}
              highlightedDates={scheduledDates}
              dateCounts={matrixCardCountsByDate}
              allowAll={true}
              allLabel="Semua Tanggal Pelaksanaan"
              align="right"
            />

            <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-200/60 whitespace-nowrap">
              {masterSchedules.length} Jadwal
            </span>
          </div>

        </div>

        {/* Master Table */}
        <div className="p-5">
          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold text-[11px] uppercase tracking-wider">
                  <th className="px-4 py-3 text-center w-12 shrink-0">No</th>
                  <th className="px-4 py-3 min-w-[170px]">Waktu &amp; Ruangan</th>
                  <th className="px-4 py-3 min-w-[260px]">Mahasiswa yang Diuji</th>
                  <th className="px-4 py-3 min-w-[260px]">Judul Skripsi</th>
                  <th className="px-4 py-3 min-w-[280px]">Tim 3 Dosen Penguji</th>
                  <th className="px-4 py-3 min-w-[130px] text-center">Status Sidang</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {masterSchedules.length > 0 ? (
                  masterSchedules.map((item, idx) => {
                    const p1 = lecturerMap.get(item.examiner1Id);
                    const p2 = lecturerMap.get(item.examiner2Id);
                    const p3 = lecturerMap.get(item.examiner3Id);

                    const isCurrentLecturerInvolved = 
                      currentLecturer.id && (
                        item.examiner1Id === currentLecturer.id ||
                        item.examiner2Id === currentLecturer.id ||
                        item.examiner3Id === currentLecturer.id
                      );

                    return (
                      <tr 
                        key={item.id} 
                        className={`transition-colors ${
                          isCurrentLecturerInvolved 
                            ? 'bg-indigo-50/40 hover:bg-indigo-50/70' 
                            : 'hover:bg-slate-50/80'
                        }`}
                      >
                        <td className="px-4 py-3 text-center text-sm font-semibold text-slate-400 align-top">
                          {idx + 1}
                        </td>

                        {/* Time & Room */}
                        <td className="px-4 py-3 align-top space-y-1">
                          <div className="text-sm font-bold text-slate-900 font-mono">
                            {timeSlotMap.get(item.timeSlotId || '')} WIB
                          </div>
                          <div className="text-xs font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md inline-block border border-indigo-200/50">
                            Ruang {roomMap.get(item.roomId || '')}
                          </div>
                          <div className="text-xs text-slate-500">
                            {formatIndonesianDate(item.date)}
                          </div>
                          {isCurrentLecturerInvolved && (
                            <span className="inline-block mt-1 text-[11px] font-semibold text-indigo-700 bg-indigo-100/90 px-2 py-0.5 rounded-md border border-indigo-200">
                              ★ Jadwal Anda
                            </span>
                          )}
                        </td>

                        {/* Student Info Box */}
                        <td className="px-4 py-3 align-top">
                          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
                            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">
                              Mahasiswa:
                            </div>
                            <div className="text-sm font-bold text-slate-900 uppercase leading-snug break-words">
                              {item.studentName}
                            </div>
                            <div className="font-mono text-indigo-700 font-semibold text-xs mt-1">
                              NIM: {item.nim}
                            </div>
                            <div className="text-xs text-slate-500 mt-0.5">
                              {item.studyProgram}
                            </div>
                          </div>
                        </td>

                        {/* Thesis Title */}
                        <td className="px-4 py-3 align-top">
                          <p className="text-sm text-slate-700 leading-relaxed italic break-words">
                            &ldquo;{item.thesisTitle}&rdquo;
                          </p>
                        </td>

                        {/* 3 Examiners */}
                        <td className="px-4 py-3 align-top space-y-1.5">
                          {/* P1 */}
                          <div className={`p-1.5 rounded-lg border flex items-start gap-2 ${
                            item.examiner1Id === currentLecturer.id
                              ? 'bg-indigo-50 border-indigo-200 font-semibold text-indigo-900'
                              : 'bg-white border-slate-200 text-slate-800'
                          }`}>
                            {p1?.photoUrl ? (
                              <img
                                src={p1.photoUrl}
                                alt={p1.name}
                                className="w-5 h-5 rounded-full object-cover shrink-0 border border-slate-200 mt-0.5"
                              />
                            ) : (
                              <span className="px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-800 font-bold text-[9.5px] shrink-0 mt-0.5 font-mono">
                                P1
                              </span>
                            )}
                            <div className="min-w-0 flex-1">
                              <span className="text-sm font-medium text-slate-900 block leading-tight break-words">
                                {p1?.name || '-'} {item.examiner1Id === currentLecturer.id && <span className="text-indigo-600 font-bold ml-1">(Anda)</span>}
                              </span>
                              <span className="text-xs text-slate-500">Ketua Penguji</span>
                            </div>
                          </div>

                          {/* P2 */}
                          <div className={`p-1.5 rounded-lg border flex items-start gap-2 ${
                            item.examiner2Id === currentLecturer.id
                              ? 'bg-sky-50 border-sky-200 font-semibold text-sky-900'
                              : 'bg-white border-slate-200 text-slate-800'
                          }`}>
                            {p2?.photoUrl ? (
                              <img
                                src={p2.photoUrl}
                                alt={p2.name}
                                className="w-5 h-5 rounded-full object-cover shrink-0 border border-slate-200 mt-0.5"
                              />
                            ) : (
                              <span className="px-1.5 py-0.5 rounded bg-sky-100 text-sky-800 font-bold text-[9.5px] shrink-0 mt-0.5 font-mono">
                                P2
                              </span>
                            )}
                            <div className="min-w-0 flex-1">
                              <span className="text-sm font-medium text-slate-900 block leading-tight break-words">
                                {p2?.name || '-'} {item.examiner2Id === currentLecturer.id && <span className="text-sky-600 font-bold ml-1">(Anda)</span>}
                              </span>
                              <span className="text-xs text-slate-500">Anggota Penguji</span>
                            </div>
                          </div>

                          {/* P3 */}
                          <div className={`p-1.5 rounded-lg border flex items-start gap-2 ${
                            item.examiner3Id === currentLecturer.id
                              ? 'bg-teal-50 border-teal-200 font-semibold text-teal-900'
                              : 'bg-white border-slate-200 text-slate-800'
                          }`}>
                            {p3?.photoUrl ? (
                              <img
                                src={p3.photoUrl}
                                alt={p3.name}
                                className="w-5 h-5 rounded-full object-cover shrink-0 border border-slate-200 mt-0.5"
                              />
                            ) : (
                              <span className="px-1.5 py-0.5 rounded bg-teal-100 text-teal-800 font-bold text-[9.5px] shrink-0 mt-0.5 font-mono">
                                P3
                              </span>
                            )}
                            <div className="min-w-0 flex-1">
                              <span className="text-sm font-medium text-slate-900 block leading-tight break-words">
                                {p3?.name || '-'} {item.examiner3Id === currentLecturer.id && <span className="text-teal-600 font-bold ml-1">(Anda)</span>}
                              </span>
                              <span className="text-xs text-slate-500">Anggota Penguji</span>
                            </div>
                          </div>
                        </td>

                        {/* Status Sidang */}
                        <td className="px-4 py-3 align-top text-center">
                          {item.status === 'completed' ? (
                            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full whitespace-nowrap shadow-2xs">
                              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                              <span>Selesai</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200/80 px-3 py-1 rounded-full whitespace-nowrap shadow-2xs">
                              <Clock className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                              <span>Terjadwal</span>
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={6} className="p-10 text-center text-sm text-slate-400">
                      Tidak ada data jadwal sesuai filter pencarian.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

    </div>
  );
};
