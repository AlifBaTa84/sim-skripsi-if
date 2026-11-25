import React, { useState } from 'react';
import { useSchedule } from '../../context/ScheduleContext';
import { X, Printer, Download, Filter, FileSpreadsheet, Building2, Calendar } from 'lucide-react';
import { formatIndonesianDate, exportToCSV } from '../../utils/formatters';
import { CalendarDatePicker } from '../shared/CalendarDatePicker';

interface ExportReportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ExportReportModal: React.FC<ExportReportModalProps> = ({ isOpen, onClose }) => {
  const { schedules, lecturers, rooms, timeSlots, selectedDate, scheduledDates, matrixCardCountsByDate } = useSchedule();
  const [filterDate, setFilterDate] = useState<string>('all');

  if (!isOpen) return null;

  const lecturerMap = new Map(lecturers.map(l => [l.id, l.name]));
  const roomMap = new Map(rooms.map(r => [r.id, r.name]));
  const timeSlotMap = new Map(timeSlots.map(t => [t.id, t.label]));

  const scheduledList = schedules.filter(s => {
    if (s.status !== 'scheduled') return false;
    if (filterDate !== 'all' && s.date !== filterDate) return false;
    return true;
  });

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    const headers = [
      'No',
      'Tanggal Sidang',
      'Slot Waktu',
      'Ruangan',
      'NIM',
      'Nama Mahasiswa',
      'Program Studi',
      'Judul Skripsi',
      'Penguji 1 (Ketua)',
      'Penguji 2 (Anggota)',
      'Penguji 3 (Anggota)',
      'Status'
    ];

    const rows = scheduledList.map((item, index) => [
      index + 1,
      formatIndonesianDate(item.date),
      timeSlotMap.get(item.timeSlotId || '') || '-',
      roomMap.get(item.roomId || '') || '-',
      item.nim,
      item.studentName,
      item.studyProgram,
      item.thesisTitle,
      lecturerMap.get(item.examiner1Id) || '-',
      lecturerMap.get(item.examiner2Id) || '-',
      lecturerMap.get(item.examiner3Id) || '-',
      'Terjadwal'
    ]);

    exportToCSV(`Rekapitulasi_Sidang_Skripsi_${filterDate}`, [headers, ...rows]);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-5xl w-full border border-slate-200/90 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        
        {/* Header - Hidden when printing */}
        <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between shrink-0 print:hidden">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white p-1 border border-slate-200/80 shadow-2xs flex items-center justify-center shrink-0">
              <img
                src="/logo-unikom.png"
                alt="Logo UNIKOM"
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
                Rekapitulasi Jadwal Sidang Skripsi IF UNIKOM
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Ekspor data dan cetak laporan rekapitulasi resmi universitas
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-2 h-10 px-4 text-sm font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl shadow-2xs transition-colors"
            >
              <Download className="w-4 h-4 text-indigo-600" />
              Unduh CSV
            </button>
            <button
              onClick={handlePrint}
              className="m3-btn-primary"
            >
              <Printer className="w-4 h-4" />
              Cetak Laporan
            </button>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors ml-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Filter bar - Hidden when printing */}
        <div className="px-6 py-3 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between text-xs shrink-0 print:hidden">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-600 flex items-center gap-1">
              Filter Tanggal:
            </span>
            <CalendarDatePicker
              value={filterDate}
              onChange={(newDate) => setFilterDate(newDate)}
              highlightedDates={scheduledDates}
              dateCounts={matrixCardCountsByDate}
              allowAll={true}
              allLabel="Semua Tanggal Pelaksanaan"
            />
          </div>

          <span className="text-slate-500 font-medium">
            Total {scheduledList.length} Sidang Terjadwal
          </span>
        </div>

        {/* Printable Document Area */}
        <div className="p-6 overflow-y-auto flex-1 print:p-0 print:m-0 print:overflow-visible">
          {/* Institutional Print Header */}
          <div className="flex items-center justify-between pb-4 mb-4 border-b-2 border-slate-900 gap-4">
            <img
              src="/logo-unikom.png"
              alt="Logo UNIKOM"
              className="w-16 h-16 object-contain shrink-0"
            />
            <div className="text-center flex-1">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                UNIVERSITAS KOMPUTER INDONESIA (UNIKOM)
              </h2>
              <h1 className="text-base font-bold uppercase tracking-wide text-slate-900 leading-tight">
                PANITIA PELAKSANA SIDANG SKRIPSI PROGRAM STUDI TEKNIK INFORMATIKA
              </h1>
              <p className="text-xs text-slate-600 mt-0.5">
                Jadwal Rekapitulasi Sidang Skripsi Gelombang Semester Genap 2024/2025
              </p>
              {filterDate !== 'all' && (
                <p className="text-xs font-semibold text-indigo-700 mt-1 print:text-black">
                  Hari/Tanggal: {formatIndonesianDate(filterDate, true)}
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
                  <th className="p-2.5 border-r border-slate-200 text-center w-12">No</th>
                  <th className="p-2.5 border-r border-slate-200 min-w-[140px]">Waktu & Ruang</th>
                  <th className="p-2.5 border-r border-slate-200 min-w-[220px]">Mahasiswa yang Diuji</th>
                  <th className="p-2.5 border-r border-slate-200 min-w-[240px]">Judul Skripsi</th>
                  <th className="p-2.5 min-w-[280px]">Tim Dosen Penguji</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {scheduledList.length > 0 ? (
                  scheduledList.map((item, idx) => (
                    <tr key={item.id} className="hover:bg-slate-50/50">
                      <td className="p-2.5 border-r border-slate-200 text-center font-semibold text-slate-500 align-top text-sm">
                        {idx + 1}
                      </td>
                      <td className="p-2.5 border-r border-slate-200 align-top space-y-1">
                        <div className="font-bold text-slate-900 font-mono text-sm">
                          {timeSlotMap.get(item.timeSlotId || '')}
                        </div>
                        <div className="text-xs font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded inline-block border border-indigo-200/50">
                          {roomMap.get(item.roomId || '')}
                        </div>
                        <div className="text-xs text-slate-500">
                          {formatIndonesianDate(item.date)}
                        </div>
                      </td>
                      <td className="p-2.5 border-r border-slate-200 align-top">
                        <div className="font-bold text-slate-900 uppercase text-sm break-words">
                          {item.studentName}
                        </div>
                        <div className="font-mono text-indigo-700 font-semibold text-xs mt-0.5">
                          NIM: {item.nim}
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          {item.studyProgram}
                        </div>
                      </td>
                      <td className="p-2.5 border-r border-slate-200 align-top">
                        <p className="text-slate-800 leading-snug break-words text-sm italic">
                          "{item.thesisTitle}"
                        </p>
                      </td>
                      <td className="p-2.5 align-top space-y-1.5 text-xs">
                        <div className="flex items-start gap-1.5 bg-slate-50 p-1.5 rounded-lg border border-slate-200/70">
                          <span className="px-1.5 py-0.5 bg-indigo-100 text-indigo-800 font-bold text-[9.5px] rounded shrink-0 mt-0.5">
                            P1
                          </span>
                          <span className="font-medium text-slate-900 break-words leading-tight text-sm">
                            {lecturerMap.get(item.examiner1Id)}
                          </span>
                        </div>
                        <div className="flex items-start gap-1.5 bg-slate-50 p-1.5 rounded-lg border border-slate-200/70">
                          <span className="px-1.5 py-0.5 bg-sky-100 text-sky-800 font-bold text-[9.5px] rounded shrink-0 mt-0.5">
                            P2
                          </span>
                          <span className="font-medium text-slate-900 break-words leading-tight text-sm">
                            {lecturerMap.get(item.examiner2Id)}
                          </span>
                        </div>
                        <div className="flex items-start gap-1.5 bg-slate-50 p-1.5 rounded-lg border border-slate-200/70">
                          <span className="px-1.5 py-0.5 bg-teal-100 text-teal-800 font-bold text-[9.5px] rounded shrink-0 mt-0.5">
                            P3
                          </span>
                          <span className="font-medium text-slate-900 break-words leading-tight text-sm">
                            {lecturerMap.get(item.examiner3Id)}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-slate-400 text-sm">
                      Belum ada jadwal sidang pada filter tanggal ini.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Institutional Signature Footer */}
          <div className="mt-8 pt-4 flex justify-between text-xs text-slate-700 print:flex">
            <div>
              <p>Mengetahui,</p>
              <p className="font-bold mt-1">Dekan Fakultas Ilmu Komputer</p>
              <div className="h-16" />
              <p className="font-bold underline">Prof. Dr. Ir. H. Sudirman, M.T.</p>
              <p className="text-[11px] text-slate-500">NIP. 196805121994031001</p>
            </div>
            <div className="text-right">
              <p>Bandung, {formatIndonesianDate(new Date().toISOString().split('T')[0])}</p>
              <p className="font-bold mt-1">Ketua Panitia Sidang Skripsi</p>
              <div className="h-16" />
              <p className="font-bold underline">Andri Heryandi, S.T., M.T.</p>
              <p className="text-[11px] text-slate-500">NIP. 197805202005011002</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

