import React, { useState, useMemo } from 'react';
import { useSchedule } from '../../context/ScheduleContext';
import { 
  Users, 
  Search, 
  Filter, 
  GraduationCap, 
  BookOpen, 
  Calendar, 
  Clock, 
  MapPin, 
  Printer, 
  CheckCircle2, 
  ShieldCheck, 
  ChevronRight, 
  Layers, 
  Award,
  ArrowUpDown,
  Building2,
  Mail,
  Phone,
  UserCheck
} from 'lucide-react';
import { formatIndonesianDate } from '../../utils/formatters';
import { Lecturer, ScheduleItem } from '../../types';

export const MasterDetailDosenView: React.FC = () => {
  const { lecturers, schedules, rooms, timeSlots } = useSchedule();

  const [selectedLecturerId, setSelectedLecturerId] = useState<string>(
    lecturers[0]?.id || ''
  );
  const [lecturerSearch, setLecturerSearch] = useState('');
  const [studentSearch, setStudentSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'p1' | 'p2' | 'p3'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'scheduled' | 'completed'>('all');
  const [departmentFilter, setDepartmentFilter] = useState('all');

  const roomMap = useMemo(() => new Map(rooms.map(r => [r.id, r.name])), [rooms]);
  const timeSlotMap = useMemo(() => new Map(timeSlots.map(t => [t.id, t.label])), [timeSlots]);
  const lecturerMap = useMemo(() => new Map(lecturers.map(l => [l.id, l])), [lecturers]);

  // Compute workload statistics per lecturer
  const lecturerWorkloads = useMemo(() => {
    return lecturers.map(lec => {
      // Relevant schedules where this lecturer is examiner 1, 2, or 3
      const allAssigned = schedules.filter(
        s => (s.status === 'scheduled' || s.status === 'completed') &&
             (s.examiner1Id === lec.id || s.examiner2Id === lec.id || s.examiner3Id === lec.id)
      );

      const countP1 = allAssigned.filter(s => s.examiner1Id === lec.id).length;
      const countP2 = allAssigned.filter(s => s.examiner2Id === lec.id).length;
      const countP3 = allAssigned.filter(s => s.examiner3Id === lec.id).length;
      const completedCount = allAssigned.filter(s => s.status === 'completed').length;
      const scheduledCount = allAssigned.filter(s => s.status === 'scheduled').length;

      return {
        lecturer: lec,
        total: allAssigned.length,
        countP1,
        countP2,
        countP3,
        completedCount,
        scheduledCount,
        schedules: allAssigned,
      };
    });
  }, [lecturers, schedules]);

  const departments = useMemo(() => {
    return Array.from(new Set(lecturers.map(l => l.department)));
  }, [lecturers]);

  // Filtered master list (left pane)
  const filteredLecturerList = useMemo(() => {
    return lecturerWorkloads.filter(item => {
      if (departmentFilter !== 'all' && item.lecturer.department !== departmentFilter) return false;
      if (lecturerSearch.trim()) {
        const q = lecturerSearch.toLowerCase();
        const matchName = item.lecturer.name.toLowerCase().includes(q);
        const matchCode = item.lecturer.code.toLowerCase().includes(q);
        const matchNidn = item.lecturer.nidn.includes(q);
        return matchName || matchCode || matchNidn;
      }
      return true;
    });
  }, [lecturerWorkloads, departmentFilter, lecturerSearch]);

  // Active selected lecturer item
  const activeLecturerItem = useMemo(() => {
    return (
      lecturerWorkloads.find(item => item.lecturer.id === selectedLecturerId) ||
      lecturerWorkloads[0] ||
      null
    );
  }, [lecturerWorkloads, selectedLecturerId]);

  // Filtered detail students examined by active lecturer (right pane)
  const filteredStudents = useMemo(() => {
    if (!activeLecturerItem) return [];

    return activeLecturerItem.schedules.filter(item => {
      const lecId = activeLecturerItem.lecturer.id;

      // Role filter (P1, P2, P3)
      if (roleFilter === 'p1' && item.examiner1Id !== lecId) return false;
      if (roleFilter === 'p2' && item.examiner2Id !== lecId) return false;
      if (roleFilter === 'p3' && item.examiner3Id !== lecId) return false;

      // Status filter
      if (statusFilter !== 'all' && item.status !== statusFilter) return false;

      // Student search term
      if (studentSearch.trim()) {
        const q = studentSearch.toLowerCase();
        const matchName = (item.studentName || '').toLowerCase().includes(q);
        const matchNim = (item.nim || '').includes(q);
        const matchTitle = (item.thesisTitle || '').toLowerCase().includes(q);
        return matchName || matchNim || matchTitle;
      }

      return true;
    });
  }, [activeLecturerItem, roleFilter, statusFilter, studentSearch]);

  // Global KPI summary metrics
  const totalExaminedSessions = useMemo(() => {
    return schedules.filter(s => s.status === 'scheduled' || s.status === 'completed').length;
  }, [schedules]);

  const avgPerLecturer = useMemo(() => {
    if (lecturers.length === 0) return '0';
    const totalAssignments = lecturerWorkloads.reduce((acc, curr) => acc + curr.total, 0);
    return (totalAssignments / lecturers.length).toFixed(1);
  }, [lecturerWorkloads, lecturers.length]);

  return (
    <div className="space-y-6 print:space-y-4">
      
      {/* ── Top Header Card ── */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
              Master-Detail Khusus Admin
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mt-1.5 flex items-center gap-2">
            <span>Detail Mahasiswa Ujian per Dosen Penguji</span>
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Inspeksi menyeluruh seluruh mahasiswa yang diuji oleh setiap dosen (Ketua Penguji, Pembimbing, dan Penguji 3)
          </p>
        </div>

        {/* Global Summary Stats */}
        <div className="flex items-center gap-3 shrink-0 flex-wrap">
          <div className="bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-right">
            <span className="text-[11px] text-slate-400 font-semibold block uppercase tracking-wider">Total Dosen</span>
            <span className="text-base font-bold text-slate-900 font-mono">{lecturers.length} Orang</span>
          </div>
          <div className="bg-indigo-50 border border-indigo-100 rounded-xl px-3.5 py-2 text-right">
            <span className="text-[11px] text-indigo-500 font-semibold block uppercase tracking-wider">Sidang Aktif</span>
            <span className="text-base font-bold text-indigo-700 font-mono">{totalExaminedSessions} Sesi</span>
          </div>
          <div className="bg-emerald-50 border border-emerald-100 rounded-xl px-3.5 py-2 text-right">
            <span className="text-[11px] text-emerald-600 font-semibold block uppercase tracking-wider">Rata-rata Beban</span>
            <span className="text-base font-bold text-emerald-700 font-mono">{avgPerLecturer} / Dosen</span>
          </div>
        </div>
      </div>

      {/* ── Master-Detail 2-Column Split View ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start print:block">
        
        {/* ═════════════════════════════════════════════════════════════════════
            MASTER COLUMN (LEFT): LIST OF LECTURERS (lg:col-span-4)
           ═════════════════════════════════════════════════════════════════════ */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden flex flex-col print:hidden">
          
          {/* Master Search & Filter Header */}
          <div className="p-4 border-b border-slate-100 bg-slate-50/70 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-indigo-600" />
                <span>Pilih Dosen Penguji ({filteredLecturerList.length})</span>
              </span>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Cari nama, kode, atau NIDN..."
                value={lecturerSearch}
                onChange={(e) => setLecturerSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              />
            </div>

            {/* Department Filter */}
            {departments.length > 1 && (
              <div className="flex items-center gap-1.5">
                <Filter className="w-3 h-3 text-slate-400 shrink-0" />
                <select
                  value={departmentFilter}
                  onChange={(e) => setDepartmentFilter(e.target.value)}
                  className="w-full text-xs bg-white border border-slate-200 rounded-lg px-2 py-1 text-slate-700 focus:outline-hidden"
                >
                  <option value="all">Semua Program Studi</option>
                  {departments.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Master List of Lecturers */}
          <div className="divide-y divide-slate-100 max-h-[680px] overflow-y-auto">
            {filteredLecturerList.length > 0 ? (
              filteredLecturerList.map(item => {
                const isSelected = activeLecturerItem?.lecturer.id === item.lecturer.id;

                return (
                  <div
                    key={item.lecturer.id}
                    onClick={() => setSelectedLecturerId(item.lecturer.id)}
                    className={`p-3.5 cursor-pointer transition-all duration-150 flex items-center justify-between gap-3 ${
                      isSelected
                        ? 'bg-indigo-50/90 border-l-4 border-indigo-600 pl-3 shadow-2xs'
                        : 'hover:bg-slate-50/80 bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Avatar with Photo or Code */}
                      {item.lecturer.photoUrl ? (
                        <img
                          src={item.lecturer.photoUrl}
                          alt={item.lecturer.name}
                          className="w-9 h-9 rounded-xl object-cover shrink-0 shadow-2xs border border-slate-200"
                        />
                      ) : (
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 font-mono transition-colors ${
                          isSelected
                            ? 'bg-indigo-600 text-white shadow-xs'
                            : 'bg-slate-100 text-slate-700'
                        }`}>
                          {item.lecturer.code}
                        </div>
                      )}

                      <div className="min-w-0">
                        <h4 className={`text-xs font-bold leading-snug truncate ${
                          isSelected ? 'text-indigo-950 font-extrabold' : 'text-slate-900'
                        }`}>
                          {item.lecturer.name}
                        </h4>
                        <p className="text-[11px] text-slate-400 truncate mt-0.5">
                          NIDN: {item.lecturer.nidn} • {item.lecturer.department}
                        </p>

                        {/* Breakdown Pills: P1, P2, P3 */}
                        <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                          <span className="text-[9.5px] font-bold px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200/60" title="Sebagai Ketua Penguji (P1)">
                            P1: {item.countP1}
                          </span>
                          <span className="text-[9.5px] font-bold px-1.5 py-0.5 rounded bg-sky-50 text-sky-700 border border-sky-200/60" title="Sebagai Pembimbing (P2)">
                            P2: {item.countP2}
                          </span>
                          <span className="text-[9.5px] font-bold px-1.5 py-0.5 rounded bg-teal-50 text-teal-700 border border-teal-200/60" title="Sebagai Penguji 3 (P3)">
                            P3: {item.countP3}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Right Badge: Total Count & Arrow */}
                    <div className="flex items-center gap-2 shrink-0">
                      <div className="text-right">
                        <span className={`text-xs font-extrabold font-mono block ${
                          isSelected ? 'text-indigo-700' : 'text-slate-700'
                        }`}>
                          {item.total} Mhs
                        </span>
                        {item.completedCount > 0 && (
                          <span className="text-[9.5px] text-emerald-600 font-semibold block">
                            {item.completedCount} Selesai
                          </span>
                        )}
                      </div>
                      <ChevronRight className={`w-4 h-4 transition-transform ${
                        isSelected ? 'text-indigo-600 translate-x-0.5' : 'text-slate-300'
                      }`} />
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-8 text-center text-xs text-slate-400">
                Tidak ada dosen yang cocok dengan pencarian.
              </div>
            )}
          </div>

        </div>

        {/* ═════════════════════════════════════════════════════════════════════
            DETAIL COLUMN (RIGHT): STUDENTS EXAMINED BY SELECTED LECTURER (lg:col-span-8)
           ═════════════════════════════════════════════════════════════════════ */}
        <div id="printable-dosen-detail" className="lg:col-span-8 space-y-5 print:w-full print:block print:space-y-4">
          
          {activeLecturerItem ? (
            <>
              {/* ── Official Institutional Kop Surat (Print Only) ── */}
              <div className="hidden print:block mb-5 pb-4 border-b-2 border-slate-900">
                <div className="flex items-center justify-between gap-4">
                  <img
                    src="/logo-unikom.png"
                    alt="Logo UNIKOM"
                    className="w-16 h-16 object-contain shrink-0"
                  />
                  <div className="text-center flex-1">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                      UNIVERSITAS KOMPUTER INDONESIA (UNIKOM)
                    </h3>
                    <h4 className="text-xs font-bold uppercase tracking-wide text-slate-800">
                      FAKULTAS TEKNIK DAN ILMU KOMPUTER &bull; PROGRAM STUDI TEKNIK INFORMATIKA
                    </h4>
                    <h1 className="text-base font-bold uppercase tracking-wide text-slate-900 leading-tight mt-1">
                      REKAPITULASI DETAIL PENUGASAN DOSEN PENGUJI SIDANG SKRIPSI
                    </h1>
                    <p className="text-xs text-slate-600 mt-0.5">
                      Semester Genap Tahun Akademik 2024/2025
                    </p>
                  </div>
                  <div className="w-16 shrink-0" />
                </div>
              </div>

              {/* ── 1. Selected Lecturer Profile Card ── */}
              <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs print:border print:border-slate-300 print:shadow-none print:p-4 print:rounded-xl print:break-inside-avoid print:mb-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 print:border-slate-200">
                  <div className="flex items-center gap-3.5">
                    {activeLecturerItem.lecturer.photoUrl ? (
                      <img
                        src={activeLecturerItem.lecturer.photoUrl}
                        alt={activeLecturerItem.lecturer.name}
                        className="w-14 h-14 rounded-2xl object-cover shrink-0 shadow-md border-2 border-indigo-200 print:border print:border-slate-400"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-700 to-indigo-500 text-white font-bold text-sm flex items-center justify-center shadow-md shadow-indigo-500/20 shrink-0 font-mono print:bg-slate-100 print:text-black print:border print:border-slate-300 print:shadow-none">
                        {activeLecturerItem.lecturer.code}
                      </div>
                    )}
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 print:bg-slate-100 print:text-black print:border-slate-300">
                          Profil Dosen Penguji
                        </span>
                        <span className="text-xs text-slate-400 print:text-slate-700">
                          Kode Dosen: <strong className="text-slate-900 print:text-black">{activeLecturerItem.lecturer.code}</strong>
                        </span>
                      </div>
                      <h3 className="text-lg font-bold text-slate-900 print:text-black mt-1">
                        {activeLecturerItem.lecturer.name}
                      </h3>
                      <p className="text-xs text-slate-500 print:text-slate-700 mt-0.5 flex items-center gap-2 flex-wrap">
                        <span>NIDN: <strong className="text-slate-800 print:text-black">{activeLecturerItem.lecturer.nidn}</strong></span>
                        <span>•</span>
                        <span>{activeLecturerItem.lecturer.department}</span>
                        {activeLecturerItem.lecturer.email && (
                          <>
                            <span>•</span>
                            <span className="text-slate-400 print:text-slate-600 font-mono">{activeLecturerItem.lecturer.email}</span>
                          </>
                        )}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => window.print()}
                    className="self-start sm:self-auto flex items-center gap-1.5 h-9 px-3.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl transition-colors shadow-2xs print:hidden shrink-0"
                    title="Cetak detail profil dan daftar mahasiswa yang diuji dosen ini"
                  >
                    <Printer className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Cetak Detail</span>
                  </button>
                </div>

                {/* KPI Metrics Row for this Lecturer */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 print:grid-cols-4 print:gap-2 print:mt-3 print:break-inside-avoid">
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 print:bg-slate-50 print:border-slate-300">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 print:text-slate-600 block mb-1">
                      Total Menguji
                    </span>
                    <p className="text-2xl font-bold text-slate-900 print:text-black font-mono">
                      {activeLecturerItem.total}
                    </p>
                    <span className="text-xs text-slate-500 print:text-slate-600 font-medium">Mahasiswa</span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-indigo-50/70 border border-indigo-100 print:bg-slate-50 print:border-slate-300">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-indigo-700 print:text-slate-800 block mb-1">
                      Ketua Penguji (P1)
                    </span>
                    <p className="text-2xl font-bold text-indigo-700 print:text-black font-mono">
                      {activeLecturerItem.countP1}
                    </p>
                    <span className="text-xs text-indigo-600 print:text-slate-600 font-medium">Dosen Reviewer</span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-sky-50/70 border border-sky-100 print:bg-slate-50 print:border-slate-300">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-sky-700 print:text-slate-800 block mb-1">
                      Penguji 2 (P2)
                    </span>
                    <p className="text-2xl font-bold text-sky-700 print:text-black font-mono">
                      {activeLecturerItem.countP2}
                    </p>
                    <span className="text-xs text-sky-600 print:text-slate-600 font-medium">Dosen Pembimbing</span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-teal-50/70 border border-teal-100 print:bg-slate-50 print:border-slate-300">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-teal-700 print:text-slate-800 block mb-1">
                      Penguji 3 (P3)
                    </span>
                    <p className="text-2xl font-bold text-teal-700 print:text-black font-mono">
                      {activeLecturerItem.countP3}
                    </p>
                    <span className="text-xs text-teal-600 print:text-slate-600 font-medium">Alokasi Proporsional</span>
                  </div>
                </div>
              </div>

              {/* ── 2. Examined Students Table Section ── */}
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden print:border print:border-slate-300 print:shadow-none print:rounded-none print:overflow-visible">
                
                {/* Search & Role Filter Tabs Bar (Screen Only) */}
                <div className="p-4 border-b border-slate-100 bg-slate-50/60 space-y-3 print:hidden">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    {/* Role Filter Tabs */}
                    <div className="flex items-center gap-1.5 p-1 bg-slate-200/60 rounded-xl overflow-x-auto text-xs">
                      <button
                        onClick={() => setRoleFilter('all')}
                        className={`px-3 py-1 rounded-lg font-bold transition-all ${
                          roleFilter === 'all'
                            ? 'bg-white text-slate-900 shadow-2xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        Semua Peran ({activeLecturerItem.total})
                      </button>
                      <button
                        onClick={() => setRoleFilter('p1')}
                        className={`px-3 py-1 rounded-lg font-bold transition-all ${
                          roleFilter === 'p1'
                            ? 'bg-indigo-600 text-white shadow-2xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        P1 ({activeLecturerItem.countP1})
                      </button>
                      <button
                        onClick={() => setRoleFilter('p2')}
                        className={`px-3 py-1 rounded-lg font-bold transition-all ${
                          roleFilter === 'p2'
                            ? 'bg-sky-600 text-white shadow-2xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        P2 ({activeLecturerItem.countP2})
                      </button>
                      <button
                        onClick={() => setRoleFilter('p3')}
                        className={`px-3 py-1 rounded-lg font-bold transition-all ${
                          roleFilter === 'p3'
                            ? 'bg-teal-600 text-white shadow-2xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        P3 ({activeLecturerItem.countP3})
                      </button>
                    </div>

                    {/* Status Filter Dropdown */}
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[11px] text-slate-500 font-semibold">Status:</span>
                      <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value as any)}
                        className="text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-slate-700 focus:outline-hidden"
                      >
                        <option value="all">Semua Status</option>
                        <option value="scheduled">Terjadwal</option>
                        <option value="completed">Sidang Selesai</option>
                      </select>
                    </div>
                  </div>

                  {/* Student Search Box */}
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      placeholder="Cari nama mahasiswa, NIM, atau judul skripsi..."
                      value={studentSearch}
                      onChange={(e) => setStudentSearch(e.target.value)}
                      className="w-full pl-9 pr-3.5 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                    />
                  </div>
                </div>

                {/* Print-only Table Caption & Filter Info */}
                <div className="hidden print:block px-4 py-2.5 bg-slate-50 border-b border-slate-300 text-xs">
                  <div className="flex justify-between items-center text-slate-800">
                    <span className="font-bold">
                      Tabel Data Mahasiswa yang Diuji:
                      {roleFilter !== 'all' || statusFilter !== 'all' || studentSearch.trim() ? (
                        <span className="font-normal ml-1 text-slate-600">
                          (Filter: {roleFilter !== 'all' ? `Peran ${roleFilter.toUpperCase()}` : ''}
                          {statusFilter !== 'all' ? ` • Status ${statusFilter === 'completed' ? 'Sidang Selesai' : 'Terjadwal'}` : ''}
                          {studentSearch.trim() ? ` • Kata Kunci: "${studentSearch}"` : ''})
                        </span>
                      ) : (
                        <span className="font-normal ml-1 text-slate-600">(Semua Mahasiswa)</span>
                      )}
                    </span>
                    <span className="font-bold font-mono">
                      Total: {filteredStudents.length} Mahasiswa
                    </span>
                  </div>
                </div>

                {/* Students Table */}
                <div className="overflow-x-auto print:overflow-visible">
                  <table className="w-full text-left text-xs print:text-[10px] border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px] print:bg-slate-100 print:border-b-2 print:border-slate-400 print:text-black">
                        <th className="p-3 text-center w-10 print:border print:border-slate-300 print:p-2">No</th>
                        <th className="p-3 min-w-[200px] print:border print:border-slate-300 print:p-2">Mahasiswa &amp; NIM</th>
                        <th className="p-3 min-w-[240px] print:border print:border-slate-300 print:p-2">Judul Skripsi</th>
                        <th className="p-3 min-w-[140px] text-center print:border print:border-slate-300 print:p-2">Peran Dosen</th>
                        <th className="p-3 min-w-[170px] print:border print:border-slate-300 print:p-2">Jadwal Sidang</th>
                        <th className="p-3 text-center w-28 print:border print:border-slate-300 print:p-2">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 print:divide-slate-300">
                      {filteredStudents.length > 0 ? (
                        filteredStudents.map((item, idx) => {
                          const lecId = activeLecturerItem.lecturer.id;
                          const isP1 = item.examiner1Id === lecId;
                          const isP2 = item.examiner2Id === lecId;
                          const isP3 = item.examiner3Id === lecId;

                          const roomName = roomMap.get(item.roomId || '') || 'Ruangan';
                          const slotLabel = timeSlotMap.get(item.timeSlotId || '') || 'Waktu';

                          return (
                            <tr key={item.id} className="hover:bg-slate-50/60 transition-colors print:break-inside-avoid print:border-b print:border-slate-300">
                              <td className="p-3 text-center font-semibold text-slate-400 print:text-black print:border print:border-slate-300 print:p-2">
                                {idx + 1}
                              </td>

                              {/* Student Bio */}
                              <td className="p-3 print:border print:border-slate-300 print:p-2">
                                <div className="font-bold text-slate-900 uppercase print:text-black">
                                  {item.studentName}
                                </div>
                                <div className="font-mono text-indigo-700 font-semibold mt-0.5 print:text-black">
                                  NIM: {item.nim}
                                </div>
                                <div className="text-[10px] text-slate-400 mt-0.5 print:text-slate-600">
                                  {item.studyProgram}
                                </div>
                              </td>

                              {/* Thesis Title */}
                              <td className="p-3 print:border print:border-slate-300 print:p-2">
                                <p className="line-clamp-2 print:line-clamp-none text-slate-700 print:text-black font-medium leading-relaxed italic">
                                  &ldquo;{item.thesisTitle}&rdquo;
                                </p>
                                <span className="inline-block mt-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 print:border-slate-300 print:text-black">
                                  {item.thesisType || 'Skripsi'}
                                </span>
                              </td>

                              {/* Role of this Lecturer */}
                              <td className="p-3 text-center print:border print:border-slate-300 print:p-2">
                                {isP1 && (
                                  <span className="inline-flex items-center gap-1 text-[10.5px] font-bold px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 shadow-2xs print:bg-slate-100 print:text-black print:border-slate-400">
                                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 print:hidden" />
                                    Ketua Penguji (P1)
                                  </span>
                                )}
                                {isP2 && (
                                  <span className="inline-flex items-center gap-1 text-[10.5px] font-bold px-2.5 py-1 rounded-full bg-sky-50 text-sky-700 border border-sky-200 shadow-2xs print:bg-slate-100 print:text-black print:border-slate-400">
                                    <span className="w-1.5 h-1.5 rounded-full bg-sky-600 print:hidden" />
                                    Penguji 2 / Pembimbing
                                  </span>
                                )}
                                {isP3 && (
                                  <span className="inline-flex items-center gap-1 text-[10.5px] font-bold px-2.5 py-1 rounded-full bg-teal-50 text-teal-700 border border-teal-200 shadow-2xs print:bg-slate-100 print:text-black print:border-slate-400">
                                    <span className="w-1.5 h-1.5 rounded-full bg-teal-600 print:hidden" />
                                    Penguji 3 (Anggota)
                                  </span>
                                )}
                              </td>

                              {/* Schedule Session */}
                              <td className="p-3 space-y-1 print:border print:border-slate-300 print:p-2 print:text-black">
                                <div className="font-medium text-slate-800 print:text-black flex items-center gap-1">
                                  <Calendar className="w-3.5 h-3.5 text-indigo-600 shrink-0 print:hidden" />
                                  <span>{formatIndonesianDate(item.date)}</span>
                                </div>
                                <div className="text-slate-600 print:text-black flex items-center gap-1 font-mono text-[11px]">
                                  <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0 print:hidden" />
                                  <span>{slotLabel} WIB</span>
                                </div>
                                <div className="text-indigo-700 print:text-black font-semibold flex items-center gap-1">
                                  <MapPin className="w-3.5 h-3.5 text-indigo-500 shrink-0 print:hidden" />
                                  <span>Ruang {roomName}</span>
                                </div>
                              </td>

                              {/* Status */}
                              <td className="p-3 text-center print:border print:border-slate-300 print:p-2">
                                {item.status === 'completed' ? (
                                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full whitespace-nowrap shadow-2xs print:bg-slate-100 print:text-black print:border-slate-300">
                                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 print:hidden" />
                                    <span>Sidang Selesai</span>
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200/80 px-2.5 py-1 rounded-full whitespace-nowrap shadow-2xs print:bg-slate-100 print:text-black print:border-slate-300">
                                    <Clock className="w-3 h-3 text-indigo-500 print:hidden" />
                                    <span>Terjadwal</span>
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan={6} className="p-12 text-center text-slate-400 print:border print:border-slate-300">
                            <GraduationCap className="w-10 h-10 text-slate-300 mx-auto mb-2 print:hidden" />
                            <p className="font-bold text-sm text-slate-600 print:text-black">
                              Tidak Ada Mahasiswa Sesuai Filter
                            </p>
                            <p className="text-xs text-slate-400 print:text-slate-600 mt-1 max-w-sm mx-auto">
                              Dosen ini belum memiliki mahasiswa yang diuji pada kriteria filter peran atau pencarian yang dipilih.
                            </p>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* ── Official Signatures (Print Only) ── */}
                <div className="hidden print:block p-6 border-t border-slate-300 text-xs text-black print:break-inside-avoid">
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-[10px] text-slate-600">
                        Dokumen resmi dicetak melalui SIM Skripsi IF UNIKOM
                      </p>
                      <p className="text-[10px] text-slate-600 font-mono mt-0.5">
                        Waktu Cetak: {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </p>
                    </div>

                    <div className="flex gap-12 text-center">
                      <div className="min-w-[180px]">
                        <p className="text-[11px]">Dosen Penguji Terkait,</p>
                        <div className="h-16" />
                        <p className="font-bold underline text-[11px]">{activeLecturerItem.lecturer.name}</p>
                        <p className="text-[10px] text-slate-700 font-mono">NIDN: {activeLecturerItem.lecturer.nidn}</p>
                      </div>

                      <div className="min-w-[180px]">
                        <p className="text-[11px]">Bandung, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                        <p className="font-bold text-[11px] mt-0.5">Ketua Panitia Sidang Skripsi,</p>
                        <div className="h-14" />
                        <p className="font-bold underline text-[11px]">Dian Dharmayanti, S.T., M.Kom.</p>
                        <p className="text-[10px] text-slate-700 font-mono">NIP. 4127.70.025</p>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </>
          ) : (
            <div className="bg-white rounded-2xl p-16 text-center border border-slate-200/80 text-slate-400 print:hidden">
              <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-base font-bold text-slate-700">Pilih Dosen Penguji</p>
              <p className="text-xs text-slate-400 mt-1">
                Silakan pilih salah satu dosen dari panel daftar di sebelah kiri untuk melihat rincian mahasiswa yang diuji.
              </p>
            </div>
          )}

        </div>

      </div>

    </div>
  );
};
