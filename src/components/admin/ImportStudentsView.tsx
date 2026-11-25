import React, { useState, useRef } from 'react';
import { useSchedule } from '../../context/ScheduleContext';
import { ImportedStudentRow } from '../../types';
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
  ArrowRight
} from 'lucide-react';

interface ImportStudentsViewProps {
  onSuccessNavigate?: () => void;
}

export const ImportStudentsView: React.FC<ImportStudentsViewProps> = ({ onSuccessNavigate }) => {
  const { lecturers, importStudentsFromData, addToast, activePeriod } = useSchedule();
  
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

      // Seluruh data pendaftaran mahasiswa diimpor untuk kegiatan Seminar (sumber data tunggal)
      const processed = processImportRows(rawJson, lecturers, 'seminar');
      setParsedRows(processed);
      addToast('success', 'File Terbaca', `${processed.length} data mahasiswa seminar berhasil dimuat.`);
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
    const demoData = [
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
    ];

    const processed = processImportRows(demoData, lecturers, 'seminar');
    setParsedRows(processed);
    setIsProcessing(false);
    addToast(
      'info', 
      'Demo Data Dimuat', 
      '4 data pendaftaran seminar berhasil dimuat. Dosen Reviewer akan ditentukan di Papan Jadwal dan kelulusan seminar otomatis menerbitkan kartu Sidang.'
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

  return (
    <div className="space-y-5">
      {/* ── Top Header Card ── */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              Sumber Data Tunggal
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mt-1.5 flex items-center gap-2">
            <span>Impor Data Mahasiswa Pendaftaran Seminar (XLSX / CSV)</span>
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Pintu masuk utama data mahasiswa SIM SKRIPSI. Pengajuan sidang skripsi akan diterbitkan otomatis saat seminar lulus.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          <button
            onClick={() => downloadSampleTemplate('xlsx', 'seminar')}
            className="flex items-center gap-1.5 h-10 px-3.5 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition-colors shadow-2xs"
          >
            <Download className="w-3.5 h-3.5 text-emerald-600" />
            <span>Template XLSX</span>
          </button>
          <button
            onClick={() => downloadSampleTemplate('csv', 'seminar')}
            className="flex items-center gap-1.5 h-10 px-3.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition-colors shadow-2xs"
          >
            <Download className="w-3.5 h-3.5 text-slate-600" />
            <span>Template CSV</span>
          </button>
          <button
            onClick={handleLoadDemoData}
            disabled={!canImport}
            className="flex items-center gap-1.5 h-10 px-4 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition-colors shadow-2xs disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Muat Data Demo</span>
          </button>
        </div>
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

      {/* ── Business Pipeline Architecture Banner ── */}
      <div className="bg-gradient-to-r from-emerald-50/90 to-teal-50/60 border border-emerald-200 rounded-2xl p-4 text-xs text-emerald-950 shadow-xs">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
            <Info className="w-4 h-4" />
          </div>
          <div className="space-y-1 leading-relaxed">
            <span className="font-bold text-sm text-emerald-900 block">
              Konsep Sumber Data Tunggal (Seminar ➔ Sidang Otomatis):
            </span>
            <p className="text-emerald-900">
              1. <strong>Impor Mahasiswa Seminar</strong>: Administrator mengimpor data pendaftar Seminar (NIM, Nama, Judul, Jenis, Pembimbing). Akun pengguna mahasiswa otomatis diterbitkan.
            </p>
            <p className="text-emerald-900">
              2. <strong>Penjadwalan Seminar</strong>: Dosen Reviewer dipilih langsung oleh Administrator pada Papan Jadwal.
            </p>
            <p className="text-emerald-900">
              3. <strong>Pencatatan Hasil &amp; Auto-Provision Sidang</strong>: Ketika mahasiswa dinyatakan <strong>Lulus Seminar</strong>, sistem secara otomatis membuat pengajuan sidang di database dan kartu sidang <strong>langsung aktif di antrean Sidang</strong> dengan Ketua Penguji terkunci dari Reviewer Seminar dan Pembimbing terkunci dari Seminar.
            </p>
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
                ? 'border-emerald-300 hover:border-emerald-500 bg-emerald-50/20 hover:bg-emerald-50/50 cursor-pointer' 
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
            <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-3 shadow-sm">
              <Upload className="w-7 h-7" />
            </div>
            <h4 className="text-base font-bold text-slate-800">
              Pilih Berkas XLSX / CSV atau Tarik File ke Sini
            </h4>
            <p className="text-xs text-slate-500 mt-1">
              Kolom wajib: <strong>NIM</strong>, <strong>Nama</strong>, <strong>Judul</strong>, <strong>Jenis</strong>, <strong>Dosen Pembimbing</strong>
            </p>
            <p className="text-[11px] text-emerald-700 font-semibold mt-2">
              (Dosen Reviewer tidak perlu ada di file — ditentukan langsung di Papan Jadwal)
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
                className="flex items-center gap-2 h-9 px-4 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-colors disabled:opacity-50"
              >
                <Check className="w-4 h-4" />
                <span>Simpan &amp; Masukkan ke Antrean Seminar ({validCount})</span>
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
                    <th className="p-3 min-w-[260px] uppercase tracking-wider text-[11px]">Judul Penelitian</th>
                    <th className="p-3 min-w-[180px] uppercase tracking-wider text-[11px]">Dosen Pembimbing</th>
                    <th className="p-3 text-center w-28 uppercase tracking-wider text-[11px]">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {parsedRows.map((row, idx) => {
                    const advisorLec = lecturers.find(l => l.id === row.matchedAdvisorId);

                    return (
                      <tr key={idx} className={row.isValid ? 'hover:bg-slate-50' : 'bg-rose-50/50'}>
                        <td className="p-3 text-center font-bold text-slate-500">
                          {idx + 1}
                        </td>

                        <td className="p-3">
                          <div className="font-mono text-[11px] font-bold text-emerald-700">
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
                          <div className="font-semibold text-slate-900">
                            {advisorLec ? advisorLec.name : row.dosenPembimbing}
                          </div>
                        </td>

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
