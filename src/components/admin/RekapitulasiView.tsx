import React, { useState, useMemo } from 'react';
import { useSchedule } from '../../context/ScheduleContext';
import { 
  Printer, 
  Download, 
  FileSpreadsheet, 
  Building2, 
  Calendar, 
  FileText,
  CalendarDays,
  BarChart3,
  Layers,
  CheckCircle2,
  Clock,
  Archive,
  ChevronDown,
  ChevronUp,
  Users,
  ListFilter
} from 'lucide-react';
import { formatIndonesianDate, exportToCSV } from '../../utils/formatters';
import { CalendarDatePicker } from '../shared/CalendarDatePicker';

export const RekapitulasiView: React.FC = () => {
  const { 
    schedules, 
    lecturers, 
    rooms, 
    timeSlots, 
    scheduledDates, 
    matrixCardCountsByDate,
    academicPeriods,
    activePeriod
  } = useSchedule();

  // Filters
  const [selectedPeriodFilter, setSelectedPeriodFilter] = useState<string>('all');
  const [selectedYearFilter, setSelectedYearFilter] = useState<string>('all');
  const [selectedSemesterFilter, setSelectedSemesterFilter] = useState<string>('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('all');
  const [filterDate, setFilterDate] = useState<string>('all');
  const [showComparison, setShowComparison] = useState<boolean>(true);

  const lecturerMap = new Map(lecturers.map(l => [l.id, l.name]));
  const lecturerObjMap = new Map(lecturers.map(l => [l.id, l]));
  const roomMap = new Map(rooms.map(r => [r.id, r.name]));
  const timeSlotMap = new Map(timeSlots.map(t => [t.id, t.label]));
  const periodMap = new Map(academicPeriods.map(p => [p.id, p]));

  // Unique academic years from periods
  const academicYears = useMemo(() => {
    return Array.from(new Set(academicPeriods.map(p => p.academicYear))).sort().reverse();
  }, [academicPeriods]);

  // Comparison Statistics across all periods
  const periodComparisonStats = useMemo(() => {
    return academicPeriods.map(p => {
      const items = schedules.filter(s => s.academicPeriodId === p.id || (!s.academicPeriodId && p.isActive));
      const scheduled = items.filter(s => s.status === 'scheduled').length;
      const completed = items.filter(s => s.status === 'completed').length;
      const unassigned = items.filter(s => s.status === 'unassigned').length;

      return {
        period: p,
        total: items.length,
        scheduled,
        completed,
        unassigned,
      };
    });
  }, [academicPeriods, schedules]);

  // Filtered schedules for report
  const filteredReportList = useMemo(() => {
    return schedules.filter(item => {
      // 1. Filter Period
      if (selectedPeriodFilter === 'active') {
        const itemPeriodId = item.academicPeriodId || (activePeriod?.id || '');
        if (activePeriod && itemPeriodId !== activePeriod.id) return false;
      } else if (selectedPeriodFilter !== 'all') {
        const itemPeriodId = item.academicPeriodId || (activePeriod?.id || '');
        if (itemPeriodId !== selectedPeriodFilter) return false;
      }

      // 2. Filter Year
      if (selectedYearFilter !== 'all') {
        const p = item.academicPeriodId ? periodMap.get(item.academicPeriodId) : activePeriod;
        if (p && p.academicYear !== selectedYearFilter) return false;
      }

      // 3. Filter Semester
      if (selectedSemesterFilter !== 'all') {
        const p = item.academicPeriodId ? periodMap.get(item.academicPeriodId) : activePeriod;
        if (p && p.semester !== selectedSemesterFilter) return false;
      }

      // 4. Filter Status
      if (selectedStatusFilter !== 'all' && item.status !== selectedStatusFilter) {
        return false;
      }

      // 5. Filter Date
      if (filterDate !== 'all' && item.date !== filterDate) {
        return false;
      }

      return true;
    });
  }, [
    schedules, 
    selectedPeriodFilter, 
    selectedYearFilter, 
    selectedSemesterFilter, 
    selectedStatusFilter, 
    filterDate, 
    activePeriod, 
    periodMap
  ]);

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    const headers = [
      'No',
      'Tahun Akademik',
      'Semester',
      'Tanggal Sidang',
      'Slot Waktu',
      'Ruangan',
      'NIM',
      'Nama Mahasiswa',
      'Program Studi',
      'Judul Skripsi',
      'Jenis',
      'Penguji 1 (Ketua)',
      'Penguji 2 (Pembimbing)',
      'Penguji 3 (Anggota)',
      'Nilai Seminar',
      'Status Sidang'
    ];

    const rows = filteredReportList.map((item, index) => {
      const p = item.academicPeriodId ? periodMap.get(item.academicPeriodId) : activePeriod;
      const statusLabel = 
        item.status === 'completed' ? 'Selesai' :
        item.status === 'scheduled' ? 'Terjadwal' : 'Antrean';

      return [
        index + 1,
        p ? p.academicYear : '2025/2026',
        p ? p.semester : 'Genap',
        item.date ? formatIndonesianDate(item.date) : '-',
        timeSlotMap.get(item.timeSlotId || '') || '-',
        roomMap.get(item.roomId || '') || '-',
        item.nim,
        item.studentName,
        item.studyProgram,
        item.thesisTitle,
        item.thesisType || 'Skripsi',
        lecturerMap.get(item.examiner1Id) || item.reviewerName || '-',
        lecturerMap.get(item.examiner2Id) || item.advisorName || '-',
        lecturerMap.get(item.examiner3Id) || '-',
        item.seminarScore || '-',
        statusLabel
      ];
    });

    const periodLabel = selectedPeriodFilter === 'active' 
      ? `TA_${activePeriod?.academicYear.replace('/', '-')}_${activePeriod?.semester}`
      : selectedPeriodFilter === 'all'
      ? 'Semua_Periode'
      : `Periode_${selectedPeriodFilter}`;

    exportToCSV(`Rekapitulasi_Sidang_Skripsi_${periodLabel}`, [headers, ...rows]);
  };

  return (
    <div className="space-y-6">
      {/* ── Top Header Card (Dashboard Integrated) ── */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
              Laporan &amp; Rekapitulasi Terpusat
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mt-1.5 flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-indigo-600" />
            <span>Rekapitulasi Jadwal Sidang Skripsi IF UNIKOM</span>
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Laporan terpadu pelaksanaan sidang skripsi, integrasi periode akademik, dan perbandingan antarperiode.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 h-10 px-4 text-sm font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl shadow-2xs transition-colors"
          >
            <Download className="w-4 h-4 text-indigo-600" />
            <span>Unduh CSV</span>
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 h-10 px-5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-colors"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak Laporan</span>
          </button>
        </div>
      </div>

      {/* ── Filter Bar (Dashboard Integrated) ── */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-4 print:hidden">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-600" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700">Filter Rekapitulasi</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">Hasil:</span>
            <span className="text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-3 py-1 rounded-full font-mono">
              {filteredReportList.length} Data Sidang
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Filter Periode Akademik */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Periode Akademik:</label>
            <select
              value={selectedPeriodFilter}
              onChange={e => setSelectedPeriodFilter(e.target.value)}
              className="w-full h-9 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium"
            >
              <option value="active">
                Periode Aktif {activePeriod ? `(${activePeriod.academicYear} ${activePeriod.semester})` : ''}
              </option>
              <option value="all">Semua Periode Akademik</option>
              {academicPeriods.map(p => (
                <option key={p.id} value={p.id}>
                  TA {p.academicYear} {p.semester} ({p.status}){p.isActive ? ' ★' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Filter Tahun Akademik */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Tahun Akademik:</label>
            <select
              value={selectedYearFilter}
              onChange={e => setSelectedYearFilter(e.target.value)}
              className="w-full h-9 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium"
            >
              <option value="all">Semua Tahun</option>
              {academicYears.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>

          {/* Filter Semester */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Semester:</label>
            <select
              value={selectedSemesterFilter}
              onChange={e => setSelectedSemesterFilter(e.target.value)}
              className="w-full h-9 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium"
            >
              <option value="all">Semua Semester</option>
              <option value="Ganjil">Ganjil</option>
              <option value="Genap">Genap</option>
            </select>
          </div>

          {/* ── Filter Status Sidang */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Status Sidang:</label>
            <select
              value={selectedStatusFilter}
              onChange={e => setSelectedStatusFilter(e.target.value)}
              className="w-full h-9 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium"
            >
              <option value="all">Semua Status</option>
              <option value="completed">✅ Selesai Sidang</option>
              <option value="scheduled">📅 Terjadwal</option>
              <option value="unassigned">🕐 Antrean (Belum Terjadwal)</option>
            </select>
          </div>

          {/* Filter Tanggal */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Tanggal Sidang:</label>
            <CalendarDatePicker
              value={filterDate}
              onChange={setFilterDate}
              highlightedDates={scheduledDates}
              dateCounts={matrixCardCountsByDate}
              allowAll={true}
              allLabel="Semua Tanggal"
            />
          </div>
        </div>
      </div>

      {/* ── Summary Stats Cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 print:hidden">
        {/* Total */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500">Total Ditampilkan</p>
            <p className="text-xl font-bold text-slate-900">{filteredReportList.length}</p>
          </div>
        </div>
        {/* Selesai */}
        <button
          onClick={() => setSelectedStatusFilter(selectedStatusFilter === 'completed' ? 'all' : 'completed')}
          className={`rounded-2xl p-4 border shadow-xs flex items-center gap-3 text-left transition-all ${
            selectedStatusFilter === 'completed'
              ? 'bg-emerald-50 border-emerald-300 ring-2 ring-emerald-200'
              : 'bg-white border-slate-200/80 hover:bg-emerald-50/60 hover:border-emerald-200'
          }`}
        >
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-semibold text-emerald-700">Selesai Sidang</p>
            <p className="text-xl font-bold text-emerald-800">
              {schedules.filter(s => s.status === 'completed').length}
            </p>
          </div>
        </button>
        {/* Terjadwal */}
        <button
          onClick={() => setSelectedStatusFilter(selectedStatusFilter === 'scheduled' ? 'all' : 'scheduled')}
          className={`rounded-2xl p-4 border shadow-xs flex items-center gap-3 text-left transition-all ${
            selectedStatusFilter === 'scheduled'
              ? 'bg-blue-50 border-blue-300 ring-2 ring-blue-200'
              : 'bg-white border-slate-200/80 hover:bg-blue-50/60 hover:border-blue-200'
          }`}
        >
          <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-semibold text-blue-700">Terjadwal</p>
            <p className="text-xl font-bold text-blue-800">
              {schedules.filter(s => s.status === 'scheduled').length}
            </p>
          </div>
        </button>
        {/* Antrean */}
        <button
          onClick={() => setSelectedStatusFilter(selectedStatusFilter === 'unassigned' ? 'all' : 'unassigned')}
          className={`rounded-2xl p-4 border shadow-xs flex items-center gap-3 text-left transition-all ${
            selectedStatusFilter === 'unassigned'
              ? 'bg-amber-50 border-amber-300 ring-2 ring-amber-200'
              : 'bg-white border-slate-200/80 hover:bg-amber-50/60 hover:border-amber-200'
          }`}
        >
          <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-semibold text-amber-700">Antrean</p>
            <p className="text-xl font-bold text-amber-800">
              {schedules.filter(s => s.status === 'unassigned').length}
            </p>
          </div>
        </button>
      </div>

      {/* ── Perbandingan Jumlah Peserta Sidang Antarperiode ── */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden print:hidden">
        <div 
          onClick={() => setShowComparison(!showComparison)}
          className="p-4 bg-slate-50/80 hover:bg-slate-100/80 flex items-center justify-between cursor-pointer transition-colors"
        >
          <div className="flex items-center gap-2.5">
            <BarChart3 className="w-4 h-4 text-indigo-600" />
            <h3 className="text-sm font-bold text-slate-900">
              Perbandingan Jumlah Peserta Sidang Antarperiode
            </h3>
            <span className="text-xs text-slate-500">
              ({periodComparisonStats.length} periode tercatat)
            </span>
          </div>

          <button className="text-slate-400 hover:text-slate-600">
            {showComparison ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>

        {showComparison && (
          <div className="p-4 overflow-x-auto border-t border-slate-200">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 uppercase tracking-wider text-[11px]">
                  <th className="p-2.5">Tahun Akademik</th>
                  <th className="p-2.5">Semester</th>
                  <th className="p-2.5 text-center">Status Periode</th>
                  <th className="p-2.5 text-center">Periode Aktif</th>
                  <th className="p-2.5 text-center font-bold text-slate-900">Total Pengajuan</th>
                  <th className="p-2.5 text-center text-emerald-700">Sidang Selesai</th>
                  <th className="p-2.5 text-center text-blue-700">Terjadwal</th>
                  <th className="p-2.5 text-center text-amber-700">Antrean</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {periodComparisonStats.map(({ period, total, scheduled, completed, unassigned }) => (
                  <tr key={period.id} className={period.isActive ? 'bg-indigo-50/40 font-semibold' : 'hover:bg-slate-50/50'}>
                    <td className="p-2.5 font-bold text-slate-900">{period.academicYear}</td>
                    <td className="p-2.5">{period.semester}</td>
                    <td className="p-2.5 text-center capitalize">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        period.status === 'berjalan' ? 'bg-emerald-100 text-emerald-800' :
                        period.status === 'persiapan' ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-700'
                      }`}>
                        {period.status}
                      </span>
                    </td>
                    <td className="p-2.5 text-center">
                      {period.isActive ? (
                        <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          Aktif
                        </span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                    <td className="p-2.5 text-center font-bold text-slate-900">{total}</td>
                    <td className="p-2.5 text-center text-emerald-700 font-semibold">{completed}</td>
                    <td className="p-2.5 text-center text-blue-700 font-semibold">{scheduled}</td>
                    <td className="p-2.5 text-center text-amber-700 font-semibold">{unassigned}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Printable & Viewable Report Card ── */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 md:p-8 overflow-hidden print:border-none print:shadow-none print:p-0">
        {/* Institutional Print Header */}
        <div className="flex items-center justify-between pb-4 mb-6 border-b-2 border-slate-900 gap-4">
          <img
            src="/logo-unikom.png"
            alt="Logo UNIKOM"
            className="w-16 h-16 object-contain shrink-0"
          />
          <div className="text-center flex-1">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              UNIVERSITAS KOMPUTER INDONESIA (UNIKOM)
            </h2>
            <h1 className="text-base font-bold uppercase tracking-wide text-slate-900 leading-tight mt-0.5">
              PANITIA PELAKSANA SIDANG SKRIPSI PROGRAM STUDI TEKNIK INFORMATIKA
            </h1>
            <p className="text-xs text-slate-600 mt-1 font-medium">
              Laporan Rekapitulasi Pelaksanaan Sidang Skripsi
              {selectedPeriodFilter === 'active' && activePeriod
                ? ` — Periode Aktif TA ${activePeriod.academicYear} (${activePeriod.semester})`
                : selectedPeriodFilter !== 'all' && periodMap.get(selectedPeriodFilter)
                ? ` — TA ${periodMap.get(selectedPeriodFilter)?.academicYear} (${periodMap.get(selectedPeriodFilter)?.semester})`
                : ' — Seluruh Periode Akademik'}
            </p>
            {filterDate !== 'all' && (
              <p className="text-xs font-bold text-indigo-700 mt-1 print:text-black">
                Hari/Tanggal Sidang: {formatIndonesianDate(filterDate, true)}
              </p>
            )}
          </div>
          <div className="w-16 shrink-0 hidden sm:block print:block" />
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border border-slate-200">
            <thead>
              <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 text-[11px] uppercase tracking-wider">
                <th className="p-2.5 border-r border-slate-200 text-center w-10">No</th>
                <th className="p-2.5 border-r border-slate-200 min-w-[120px]">Periode</th>
                <th className="p-2.5 border-r border-slate-200 min-w-[140px]">Waktu &amp; Ruang</th>
                <th className="p-2.5 border-r border-slate-200 min-w-[200px]">Mahasiswa</th>
                <th className="p-2.5 border-r border-slate-200 min-w-[240px]">Judul Skripsi</th>
                <th className="p-2.5 border-r border-slate-200 min-w-[260px]">Majelis 3 Penguji</th>
                <th className="p-2.5 text-center min-w-[100px]">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredReportList.length > 0 ? (
                filteredReportList.map((item, idx) => {
                  const p = item.academicPeriodId ? periodMap.get(item.academicPeriodId) : activePeriod;
                  const p1 = lecturerObjMap.get(item.examiner1Id);
                  const p2 = lecturerObjMap.get(item.examiner2Id);
                  const p3 = lecturerObjMap.get(item.examiner3Id);

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/50">
                      <td className="p-2.5 border-r border-slate-200 text-center font-semibold text-slate-500 align-top text-xs">
                        {idx + 1}
                      </td>

                      <td className="p-2.5 border-r border-slate-200 align-top text-xs">
                        <div className="font-bold text-slate-900">{p ? p.academicYear : '2025/2026'}</div>
                        <div className="text-[11px] text-indigo-700 font-semibold">{p ? p.semester : 'Genap'}</div>
                      </td>

                      <td className="p-2.5 border-r border-slate-200 align-top space-y-1 text-xs">
                        {item.date ? (
                          <>
                            <div className="font-bold text-slate-900 flex items-center gap-1">
                              <Calendar className="w-3 h-3 text-indigo-600 print:hidden" />
                              <span>{formatIndonesianDate(item.date)}</span>
                            </div>
                            <div className="font-mono text-[11px] font-semibold text-indigo-700 print:text-black">
                              {timeSlotMap.get(item.timeSlotId || '') || '-'} WIB
                            </div>
                            <div className="text-[11px] font-bold text-slate-600 flex items-center gap-1">
                              <Building2 className="w-3 h-3 text-slate-400 print:hidden" />
                              <span>Ruang {roomMap.get(item.roomId || '') || '-'}</span>
                            </div>
                          </>
                        ) : (
                          <span className="text-amber-700 italic font-semibold">Belum Dijadwalkan</span>
                        )}
                      </td>

                      <td className="p-2.5 border-r border-slate-200 align-top text-xs">
                        <div className="font-bold text-slate-900 leading-tight uppercase">{item.studentName}</div>
                        <div className="font-mono text-[11px] text-slate-500 mt-0.5">NIM: {item.nim}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">{item.studyProgram}</div>
                      </td>

                      <td className="p-2.5 border-r border-slate-200 align-top text-xs">
                        <p className="text-slate-700 leading-relaxed font-medium">"{item.thesisTitle}"</p>
                        <div className="mt-1 flex items-center gap-1.5">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-slate-700 print:border-black">
                            {item.thesisType || 'Skripsi'}
                          </span>
                          {item.seminarScore && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 print:border-black print:text-black">
                              Nilai: {item.seminarScore}
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="p-2.5 border-r border-slate-200 align-top space-y-1 text-xs">
                        <div>
                          <span className="text-[10px] uppercase font-bold text-indigo-700 block print:text-black">
                            1. Ketua (Reviewer):
                          </span>
                          <span className="font-semibold text-slate-900">{p1 ? p1.name : item.reviewerName || '-'}</span>
                        </div>
                        <div>
                          <span className="text-[10px] uppercase font-bold text-sky-700 block print:text-black">
                            2. Penguji 2 (Pembimbing):
                          </span>
                          <span className="font-semibold text-slate-900">{p2 ? p2.name : item.advisorName || '-'}</span>
                        </div>
                        <div>
                          <span className="text-[10px] uppercase font-bold text-teal-700 block print:text-black">
                            3. Penguji 3:
                          </span>
                          <span className="font-semibold text-slate-900">{p3 ? p3.name : 'Belum Ditentukan'}</span>
                        </div>
                      </td>

                      <td className="p-2.5 align-top text-center text-xs">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold capitalize ${
                          item.status === 'completed'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : item.status === 'scheduled'
                            ? 'bg-blue-100 text-blue-800 border border-blue-300'
                            : 'bg-amber-100 text-amber-800 border border-amber-300'
                        }`}>
                          {item.status === 'completed' ? 'Selesai' : item.status === 'scheduled' ? 'Terjadwal' : 'Antrean'}
                        </span>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">
                    Tidak ada jadwal sidang ditemukan untuk kriteria filter yang dipilih.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Signatures */}
        <div className="mt-8 pt-6 flex justify-between items-end text-xs text-slate-800">
          <div>
            <p className="text-[11px] text-slate-500">
              Dokumen dicetak secara resmi melalui SIM Skripsi IF UNIKOM
            </p>
            <p className="text-[11px] text-slate-400 font-mono mt-0.5">
              Dicetak pada: {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>

          <div className="text-center min-w-[200px]">
            <p>Bandung, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
            <p className="font-bold mt-1">Ketua Panitia Sidang Skripsi</p>
            <div className="h-16" />
            <p className="font-bold underline">Dian Dharmayanti, S.T., M.Kom.</p>
            <p className="text-[11px] text-slate-500">NIP. 4127.70.025</p>
          </div>
        </div>
      </div>
    </div>
  );
};
