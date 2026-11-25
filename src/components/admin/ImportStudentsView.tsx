import React, { useState, useRef } from 'react';
import { useSchedule } from '../../context/ScheduleContext';
import { ImportedStudentRow, ActivityType } from '../../types';
import { 
  parseImportFile, 
  processImportRows, 
  downloadSampleTemplate 
} from '../../utils/importer';
import { 
  Upload, 
  FileSpreadsheet, 
  Download, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles, 
  Info, 
  RotateCcw,
  Check,
  CalendarDays,
  BookOpen,
  GraduationCap
} from 'lucide-react';

interface ImportStudentsViewProps {
  onSuccessNavigate?: () => void;
}

export const ImportStudentsView: React.FC<ImportStudentsViewProps> = ({ onSuccessNavigate }) => {
  const { lecturers, importStudentsFromData, addToast, activePeriod } = useSchedule();
  
  const [activityType, setActivityType] = useState<ActivityType>('seminar');
  const [file, setFile] = useState<File | null>(null);
  const [parsedRows, setParsedRows] = useState<ImportedStudentRow[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const canImport = activePeriod && activePeriod.status === 'berjalan';
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (uploadedFile: File) => {
    if (!canImport) {
      addToast('error', 'Impor Ditolak', 'Tidak terdapat periode akademik aktif berstatus Berjalan.');
      return;
    }

    setIsProcessing(true);
    setFile(uploadedFile);

    try {
      const rawJson = await parseImportFile(uploadedFile);
      if (!rawJson || rawJson.length === 0) {
        addToast('error', 'File Kosong', 'File yang diunggah tidak memiliki baris data.');
        setIsProcessing(false);
        return;
      }

      const processed = processImportRows(rawJson, lecturers, activityType);
      setParsedRows(processed);
      addToast('success', 'File Terbaca', `${processed.length} data ${activityType === 'seminar' ? 'Seminar' : 'Sidang'} berhasil dimuat.`);
    } catch (err: any) {
      console.error(err);
      addToast('error', 'Gagal Membaca File', 'Pastikan format file xlsx/csv sesuai dengan template.');
    } finally {
      setIsProcessing(false);
    }
  };

  // 1-Click Demo Data Loader
  const handleLoadDemoData = () => {
    if (!canImport) {
      addToast('error', 'Impor Ditolak', 'Tidak terdapat periode akademik aktif berstatus Berjalan.');
      return;
    }

    setIsProcessing(true);
    const demoData = activityType === 'seminar'
      ? [
          {
            'NIM': '10120301',
            'Nama': 'FARHAN KURNIAWAN',
            'Judul': 'Sistem Rekomendasi Pemilihan Dosen Pembimbing Menggunakan Algoritma Content-Based Filtering',
            'Jenis': 'Seminar Proposal',
            'Dosen Pembimbing': 'Andri Heryandi, S.T., M.T.'
          },
          {
            'NIM': '10120305',
            'Nama': 'TIARA ANGGRAENI',
            'Judul': 'Penerapan Algoritma YOLOv8 untuk Deteksi Rambu Lalu Lintas Secara Real-Time pada Kendaraan Otonom',
            'Jenis': 'Seminar Proposal',
            'Dosen Pembimbing': 'Chrismikha Hardyanto, M.Kom.'
          },
          {
            'NIM': '10120310',
            'Nama': 'RIZKY RAMADHAN',
            'Judul': 'Pengembangan Aplikasi Pemantau Kualitas Udara IoT Berbasis ESP32 dan Dashboard Web',
            'Jenis': 'Seminar Proposal',
            'Dosen Pembimbing': 'Sopian Alviana, M.Kom.'
          },
          {
            'NIM': '10120315',
            'Nama': 'AULIA CITRA LESTARI',
            'Judul': 'Klasifikasi Tingkat Kematangan Buah Kopi Menggunakan Support Vector Machine Berbasis Fitur Warna HSV',
            'Jenis': 'Seminar Proposal',
            'Dosen Pembimbing': 'Dr. Marliana Budhiningtias, M.Si.'
          }
        ]
      : [
          {
            'NIM': '10120301',
            'Nama': 'FARHAN KURNIAWAN',
            'Judul': 'Sistem Rekomendasi Pemilihan Dosen Pembimbing Menggunakan Algoritma Content-Based Filtering',
            'Jenis': 'Skripsi',
            'Dosen Pembimbing': 'Andri Heryandi, S.T., M.T.',
            'Dosen Reviewer': 'Dian Dharmayanti, S.T., M.Kom.',
            'Nilai Seminar': 86.5
          },
          {
            'NIM': '10120305',
            'Nama': 'TIARA ANGGRAENI',
            'Judul': 'Penerapan Algoritma YOLOv8 untuk Deteksi Rambu Lalu Lintas Secara Real-Time pada Kendaraan Otonom',
            'Jenis': 'Skripsi',
            'Dosen Pembimbing': 'Chrismikha Hardyanto, M.Kom.',
            'Dosen Reviewer': 'Iskandar Ikbal, M.Kom.',
            'Nilai Seminar': 88.0
          },
          {
            'NIM': '10120310',
            'Nama': 'RIZKY RAMADHAN',
            'Judul': 'Pengembangan Aplikasi Pemantau Kualitas Udara IoT Berbasis ESP32 dan Dashboard Web',
            'Jenis': 'Tugas Akhir',
            'Dosen Pembimbing': 'Sopian Alviana, M.Kom.',
            'Dosen Reviewer': 'Angga Setiyadi, M.Kom., CITPM',
            'Nilai Seminar': 84.5
          },
          {
            'NIM': '10120315',
            'Nama': 'AULIA CITRA LESTARI',
            'Judul': 'Klasifikasi Tingkat Kematangan Buah Kopi Menggunakan Support Vector Machine Berbasis Fitur Warna HSV',
            'Jenis': 'Skripsi',
            'Dosen Pembimbing': 'Dr. Marliana Budhiningtias, M.Si.',
            'Dosen Reviewer': 'Taufiq Nurhadi, S.Kom., M.T.',
            'Nilai Seminar': 89.0
          }
        ];

    const processed = processImportRows(demoData, lecturers, activityType);
    setParsedRows(processed);
    setIsProcessing(false);
    addToast(
      'info', 
      'Demo Data Dimuat', 
      activityType === 'seminar'
        ? '4 data pendaftaran seminar berhasil dimuat untuk diuji. Reviewer akan dipilih di Papan Jadwal.'
        : '4 data simulasi sidang berhasil dimuat untuk diuji.'
    );
  };

  const handleConfirmImport = () => {
    if (!canImport) {
      addToast('error', 'Impor Ditolak', 'Tidak ada periode akademik aktif yang berstatus berjalan.');
      return;
    }

    const validRows = parsedRows.filter(r => r.isValid);
    if (validRows.length === 0) {
      addToast('error', 'Tidak Ada Data Valid', 'Semua baris memiliki kesalahan validasi.');
      return;
    }

    const res = importStudentsFromData(validRows);
    if (res.error) {
      return;
    }

    setFile(null);
    setParsedRows([]);
    if (onSuccessNavigate && res.successCount > 0) {
      onSuccessNavigate();
    }
  };

  const validCount = parsedRows.filter(r => r.isValid).length;
  const isSeminar = activityType === 'seminar';

  return (
    <div className="space-y-5">
      {/* ── Top Header Card (Dashboard Integrated) ── */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className={`text-[11px] font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
              isSeminar 
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                : 'bg-indigo-50 text-indigo-700 border-indigo-200'
            }`}>
              Impor Data {isSeminar ? 'Seminar' : 'Sidang'}
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mt-1.5 flex items-center gap-2">
            <span>Impor Data Mahasiswa ({isSeminar ? 'Pendaftaran Seminar' : 'Pengajuan Sidang'})</span>
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Unggah file berkas untuk dimasukkan otomatis ke dalam antrean penjadwalan terpadu
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          <button
            onClick={() => downloadSampleTemplate('xlsx', activityType)}
            className="flex items-center gap-1.5 h-10 px-3.5 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition-colors shadow-2xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Template XLSX</span>
          </button>
          <button
            onClick={() => downloadSampleTemplate('csv', activityType)}
            className="flex items-center gap-1.5 h-10 px-3.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition-colors shadow-2xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Template CSV</span>
          </button>
          <button
            onClick={handleLoadDemoData}
            disabled={!canImport}
            className={`flex items-center gap-1.5 h-10 px-4 text-xs font-semibold border rounded-xl transition-colors shadow-2xs disabled:opacity-50 disabled:cursor-not-allowed ${
              isSeminar
                ? 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border-emerald-200'
                : 'text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border-indigo-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Muat Data Demo</span>
          </button>
        </div>
      </div>

      {/* ── Activity Selector Tabs ── */}
      <div className="bg-white rounded-2xl p-3 border border-slate-200/80 shadow-xs flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-600">Pilih Kategori:</span>
          <div className="inline-flex rounded-xl p-1 bg-slate-100 border border-slate-200">
            <button
              type="button"
              onClick={() => {
                setActivityType('seminar');
                setParsedRows([]);
                setFile(null);
              }}
              className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
                isSeminar
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-emerald-700'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Pendaftaran Seminar</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActivityType('sidang');
                setParsedRows([]);
                setFile(null);
              }}
              className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
                !isSeminar
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-indigo-700'
              }`}
            >
              <GraduationCap className="w-3.5 h-3.5" />
              <span>Pengajuan Sidang</span>
            </button>
          </div>
        </div>

        <span className="text-xs text-slate-500 hidden sm:inline">
          {isSeminar 
            ? 'Reviewer ditentukan oleh Administrator pada Papan Jadwal' 
            : 'Mahasiswa wajib Lulus Seminar untuk dijadwalkan sidang'}
        </span>
      </div>

      {/* ── Active Academic Period Information & Guard Banner ── */}
      {canImport ? (
        <div className="bg-emerald-50/70 border border-emerald-200/90 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
              <CalendarDays className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-emerald-950 text-sm">
                  Periode Akademik Sasaran Impor: Tahun {activePeriod?.academicYear} ({activePeriod?.semester})
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500 text-white">
                  Aktif &amp; Berjalan
                </span>
              </div>
              <p className="text-emerald-800 text-[11px] mt-0.5">
                Seluruh data pendaftar otomatis dikaitkan dengan ID Periode <span className="font-mono font-semibold">{activePeriod?.id}</span>.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-rose-50 border border-rose-300 rounded-2xl p-4 flex items-start gap-3 text-xs text-rose-900 shadow-xs">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="font-bold text-sm text-rose-950">
              Impor Dinonaktifkan: {!activePeriod ? 'Tidak Ada Periode Akademik Aktif' : `Periode ${activePeriod.academicYear} ${activePeriod.semester} Berstatus "${activePeriod.status}"`}
            </div>
            <p className="text-rose-800 leading-relaxed">
              {!activePeriod
                ? 'Sistem SIM SKRIPSI mewajibkan adanya satu periode akademik aktif sebagai jangkar pencatatan. Silakan masuk ke menu Data Master > Periode Akademik untuk mengaktifkan periode.'
                : 'Impor berkas baru hanya dapat dilakukan pada periode yang berstatus "Berjalan".'}
            </p>
          </div>
        </div>
      )}

      {/* ── Business Rule Notice ── */}
      <div className={`border rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs ${
        isSeminar ? 'bg-emerald-50/70 border-emerald-100 text-emerald-900' : 'bg-indigo-50/70 border-indigo-100 text-indigo-900'
      }`}>
        <div className="flex items-center gap-2.5">
          <Info className={`w-5 h-5 shrink-0 ${isSeminar ? 'text-emerald-600' : 'text-indigo-600'}`} />
          <div className="leading-relaxed">
            <span className="font-bold">Ketentuan {isSeminar ? 'Seminar Proposal' : 'Sidang Skripsi'}: </span>
            {isSeminar ? (
              <span>
                Data impor hanya mewajibkan <strong>Dosen Pembimbing</strong>. Dosen Reviewer <strong>wajib dipilih Administrator</strong> di Papan Jadwal saat penentuan slot (Aturan 2.4).
              </span>
            ) : (
              <span>
                <strong>Dosen Reviewer</strong> (Seminar Lulus) ➔ Ketua Penguji (P1) | 
                <strong> Dosen Pembimbing</strong> ➔ Penguji 2 (P2) | 
                <strong> Penguji 3</strong> ➔ Ditentukan proporsional saat penjadwalan pada matriks.
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── Upload Area Card ── */}
      {parsedRows.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-8">
          <div
            onClick={() => {
              if (canImport) fileInputRef.current?.click();
            }}
            className={`border-2 border-dashed rounded-2xl p-10 text-center transition-all duration-200 ${
              canImport 
                ? isSeminar
                  ? 'border-emerald-300 hover:border-emerald-500 bg-emerald-50/30 hover:bg-emerald-50/60 cursor-pointer'
                  : 'border-indigo-300 hover:border-indigo-500 bg-indigo-50/30 hover:bg-indigo-50/60 cursor-pointer' 
                : 'border-slate-300 bg-slate-50 opacity-60 cursor-not-allowed'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleFileUpload(e.target.files[0]);
                }
              }}
            />
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-sm ${
              isSeminar ? 'bg-emerald-100 text-emerald-600' : 'bg-indigo-100 text-indigo-600'
            }`}>
              <Upload className="w-7 h-7" />
            </div>
            <h4 className="text-base font-bold text-slate-800">
              Pilih Berkas XLSX / CSV atau Tarik File ke Sini
            </h4>
            <p className="text-xs text-slate-500 mt-1">
              Kolom: NIM, Nama, Judul, Jenis, Dosen Pembimbing
              {!isSeminar && ', Dosen Reviewer, Nilai Seminar'}
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Summary Metric Header */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold text-slate-500">File Terbaca:</span>
              <span className="text-xs font-bold text-slate-800 font-mono bg-slate-100 px-2.5 py-1 rounded-lg">
                {file?.name || 'Data Simulasi Demo'}
              </span>
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
                {validCount} Data Valid
              </span>
              {parsedRows.length - validCount > 0 && (
                <span className="text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 px-3 py-1 rounded-full">
                  {parsedRows.length - validCount} Perlu Perbaikan
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setParsedRows([]);
                  setFile(null);
                }}
                className="flex items-center gap-1.5 h-9 px-3.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-300 rounded-xl transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Unggah Ulang</span>
              </button>
              <button
                onClick={handleConfirmImport}
                disabled={validCount === 0}
                className={`flex items-center gap-2 h-9 px-4 text-xs font-bold text-white rounded-xl shadow-xs transition-colors disabled:opacity-50 ${
                  isSeminar ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-indigo-600 hover:bg-indigo-700'
                }`}
              >
                <Check className="w-4 h-4" />
                <span>Simpan &amp; Masukkan ke Antrean ({validCount})</span>
              </button>
            </div>
          </div>

          {/* Table Preview Card */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                    <th className="p-3 text-center w-12 uppercase tracking-wider text-[11px]">No</th>
                    <th className="p-3 min-w-[200px] uppercase tracking-wider text-[11px]">Mahasiswa &amp; NIM</th>
                    <th className="p-3 min-w-[260px] uppercase tracking-wider text-[11px]">Judul</th>
                    <th className="p-3 min-w-[180px] uppercase tracking-wider text-[11px]">
                      {isSeminar ? 'Dosen Reviewer (Admin)' : 'Ketua Penguji (Reviewer)'}
                    </th>
                    <th className="p-3 min-w-[180px] uppercase tracking-wider text-[11px]">Dosen Pembimbing</th>
                    {!isSeminar && (
                      <th className="p-3 min-w-[200px] uppercase tracking-wider text-[11px]">Penguji 3 (Anggota)</th>
                    )}
                    <th className="p-3 text-center w-28 uppercase tracking-wider text-[11px]">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {parsedRows.map((row, idx) => {
                    const advisorLec = lecturers.find(l => l.id === row.matchedAdvisorId);
                    const reviewerLec = lecturers.find(l => l.id === row.matchedReviewerId);

                    return (
                      <tr key={idx} className={row.isValid ? 'hover:bg-slate-50' : 'bg-rose-50/50'}>
                        <td className="p-3 text-center font-bold text-slate-500">
                          {idx + 1}
                        </td>

                        <td className="p-3">
                          <div className={`font-mono text-[11px] font-bold ${
                            isSeminar ? 'text-emerald-700' : 'text-indigo-700'
                          }`}>
                            {row.nim}
                          </div>
                          <div className="font-bold text-slate-900 uppercase">
                            {row.nama}
                          </div>
                        </td>

                        <td className="p-3">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 inline-block mb-1">
                            {row.jenis}
                          </span>
                          <p className="text-slate-700 line-clamp-2 leading-relaxed">
                            {row.judul}
                          </p>
                        </td>

                        <td className="p-3">
                          {isSeminar ? (
                            <span className="text-emerald-700 font-semibold italic text-[11px]">
                              Dipilih di Papan Jadwal
                            </span>
                          ) : (
                            <div className="font-semibold text-slate-900">
                              {reviewerLec ? reviewerLec.name : row.dosenReviewer}
                            </div>
                          )}
                        </td>

                        <td className="p-3">
                          <div className="font-semibold text-slate-900">
                            {advisorLec ? advisorLec.name : row.dosenPembimbing}
                          </div>
                        </td>

                        {!isSeminar && (
                          <td className="p-3">
                            <span className="text-slate-400 italic text-[11px]">
                              Ditentukan saat Penjadwalan
                            </span>
                          </td>
                        )}

                        <td className="p-3 text-center">
                          {row.isValid ? (
                            <span className="inline-flex items-center gap-1 text-emerald-700 font-bold bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Valid</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-rose-700 font-bold bg-rose-50 px-2.5 py-1 rounded-full border border-rose-200" title={row.validationErrors.join(', ')}>
                              <AlertCircle className="w-3.5 h-3.5" />
                              <span>Error</span>
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
