import React, { useState, useRef } from 'react';
import { useSchedule } from '../../context/ScheduleContext';
import { ImportedStudentRow, ActivityType } from '../../types';
import { 
  parseImportFile, 
  processImportRows, 
  downloadSampleTemplate 
} from '../../utils/importer';
import { 
  X, 
  Upload, 
  FileSpreadsheet, 
  Download, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles, 
  Info,
  CalendarDays,
  BookOpen,
  GraduationCap
} from 'lucide-react';

interface ImportStudentsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ImportStudentsModal: React.FC<ImportStudentsModalProps> = ({ isOpen, onClose }) => {
  const { lecturers, importStudentsFromData, addToast, activePeriod } = useSchedule();
  
  const [activityType, setActivityType] = useState<ActivityType>('seminar');
  const [file, setFile] = useState<File | null>(null);
  const [parsedRows, setParsedRows] = useState<ImportedStudentRow[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const canImport = activePeriod && activePeriod.status === 'berjalan';
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

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
      'Data Contoh Dimuat', 
      activityType === 'seminar'
        ? '4 data pendaftaran seminar siap diimpor. Reviewer akan dipilih administrator pada Papan Jadwal.'
        : '4 data sidang siap diimpor ke antrean.'
    );
  };

  const handleConfirmImport = () => {
    if (!canImport) {
      addToast('error', 'Impor Ditolak', 'Tidak ada periode akademik aktif yang berstatus Berjalan.');
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

    onClose();
    setFile(null);
    setParsedRows([]);
  };

  const validCount = parsedRows.filter(r => r.isValid).length;
  const isSeminar = activityType === 'seminar';

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-5xl w-full border border-slate-200/90 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        
        {/* Top Header */}
        <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
              isSeminar ? 'bg-emerald-50 text-emerald-600' : 'bg-indigo-50 text-indigo-600'
            }`}>
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
                Impor Data {isSeminar ? 'Pendaftaran Seminar' : 'Pengajuan Sidang'} (XLSX / CSV)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {isSeminar 
                  ? 'Impor peserta Seminar Proposal (Reviewer ditentukan admin pada Papan Jadwal)'
                  : 'Otomatisasi pemetaan Dosen Reviewer (Ketua) & Pembimbing (Penguji 2)'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Activity Selector Tabs */}
        <div className="px-6 py-3 bg-slate-100/70 border-b border-slate-200 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-600">Pilih Kategori Impor:</span>
            <div className="inline-flex rounded-xl p-1 bg-white border border-slate-200 shadow-2xs">
              <button
                type="button"
                onClick={() => {
                  setActivityType('seminar');
                  setParsedRows([]);
                  setFile(null);
                }}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
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
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
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

          <div className="flex items-center gap-2">
            <button
              onClick={() => downloadSampleTemplate('xlsx', activityType)}
              className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 shadow-2xs"
            >
              <Download className="w-3 h-3 text-emerald-600" />
              Template XLSX
            </button>
            <button
              onClick={() => downloadSampleTemplate('csv', activityType)}
              className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 shadow-2xs"
            >
              <Download className="w-3 h-3 text-emerald-600" />
              Template CSV
            </button>
          </div>
        </div>

        {/* Business Rule Information Banner */}
        <div className={`px-6 py-2.5 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shrink-0 ${
          isSeminar ? 'bg-emerald-50/70 border-emerald-100 text-emerald-900' : 'bg-indigo-50/70 border-indigo-100 text-indigo-900'
        }`}>
          <div className="flex items-center gap-2">
            <Info className={`w-4 h-4 shrink-0 ${isSeminar ? 'text-emerald-600' : 'text-indigo-600'}`} />
            <div>
              <span className="font-bold">Ketentuan {isSeminar ? 'Seminar Proposal' : 'Sidang Skripsi'}: </span>
              {isSeminar ? (
                <span>
                  Data impor hanya mewajibkan <strong>Dosen Pembimbing</strong>. Dosen Reviewer <strong>wajib dipilih Administrator</strong> di Papan Jadwal saat penentuan slot (Aturan 2.4).
                </span>
              ) : (
                <span>
                  <strong>Dosen Reviewer</strong> (Seminar Lulus) ➔ Ketua Penguji (P1) | 
                  <strong> Dosen Pembimbing</strong> ➔ Penguji 2 (P2) | 
                  <strong> Penguji 3</strong> ➔ Dipilih bebas bentrok.
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Main Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5">
          
          {/* Active Period Status Banner */}
          {canImport ? (
            <div className="p-3.5 bg-emerald-50/80 border border-emerald-200/90 rounded-2xl flex items-center gap-3 text-xs">
              <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                <CalendarDays className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-emerald-950 text-sm">
                    Periode Akademik: {activePeriod?.academicYear} ({activePeriod?.semester})
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500 text-white">
                    Aktif
                  </span>
                </div>
                <p className="text-emerald-700 text-[11px] mt-0.5">
                  Mahasiswa yang diimpor akan otomatis dimasukkan ke periode aktif ini.
                </p>
              </div>
            </div>
          ) : (
            <div className="p-3.5 bg-rose-50 border border-rose-300 rounded-2xl flex items-start gap-3 text-xs text-rose-900">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block text-sm">
                  Impor Ditolak: {!activePeriod ? 'Tidak Ada Periode Aktif' : `Periode ${activePeriod.academicYear} ${activePeriod.semester} Berstatus "${activePeriod.status}"`}
                </span>
                <span className="text-[11px] text-rose-700 block mt-0.5">
                  {!activePeriod 
                    ? 'Sistem memerlukan satu periode akademik aktif untuk menautkan data pengajuan kegiatan.'
                    : 'Impor hanya dapat dilakukan pada periode yang berstatus "Berjalan".'}
                </span>
              </div>
            </div>
          )}

          {/* Upload Area / Dropzone */}
          {parsedRows.length === 0 ? (
            <div className="space-y-4">
              <div
                onClick={() => {
                  if (canImport) fileInputRef.current?.click();
                }}
                className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-200 ${
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
                    const f = e.target.files?.[0];
                    if (f) handleFileUpload(f);
                  }}
                />

                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-xs ${
                  isSeminar ? 'bg-emerald-100 text-emerald-600' : 'bg-indigo-100 text-indigo-600'
                }`}>
                  <Upload className="w-7 h-7" />
                </div>
                <h4 className="text-sm font-bold text-slate-900">
                  Klik untuk Memilih File atau Tarik File ke Sini
                </h4>
                <p className="text-xs text-slate-500 mt-1">
                  Mendukung file Excel (<strong>.xlsx</strong>, <strong>.xls</strong>) atau <strong>.csv</strong>
                </p>

                <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs text-slate-600 shadow-2xs">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                  <span>
                    Format Kolom: NIM, Nama, Judul, Jenis, Dosen Pembimbing
                    {!isSeminar && ', Dosen Reviewer, Nilai Seminar'}
                  </span>
                </div>
              </div>

              {/* 1-Click Simulation Button */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-200">
                <div>
                  <h5 className="text-xs font-bold text-slate-800">
                    Tidak memiliki file Excel saat ini?
                  </h5>
                  <p className="text-[11px] text-slate-500">
                    Gunakan 4 data contoh {isSeminar ? 'pendaftaran seminar' : 'sidang skripsi'} untuk langsung menguji sistem penjadwalan.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleLoadDemoData}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-white font-bold text-xs shadow-xs transition-colors shrink-0 ${
                    isSeminar ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-indigo-600 hover:bg-indigo-700'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Isi Data Contoh (1-Klik)</span>
                </button>
              </div>
            </div>
          ) : (
            /* Preview of Parsed Rows */
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-800">
                    Preview Data Hasil Bacaan ({isSeminar ? 'Seminar' : 'Sidang'}):
                  </span>
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                    {validCount} Data Valid
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => {
                      setParsedRows([]);
                      setFile(null);
                    }}
                    className="text-xs font-semibold text-rose-600 hover:underline"
                  >
                    Ganti File
                  </button>
                </div>
              </div>

              {/* Preview Table */}
              <div className="border border-slate-200 rounded-xl overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-slate-100 text-slate-800 font-bold border-b border-slate-200">
                      <th className="p-2.5 text-center w-10">No</th>
                      <th className="p-2.5 min-w-[200px]">NIM & Nama Mahasiswa</th>
                      <th className="p-2.5 min-w-[220px]">Judul & Jenis</th>
                      <th className="p-2.5 min-w-[190px]">
                        {isSeminar ? 'Dosen Reviewer (Ditentukan Admin)' : 'Ketua Penguji (Reviewer)'}
                      </th>
                      <th className="p-2.5 min-w-[190px]">Dosen Pembimbing</th>
                      {!isSeminar && (
                        <th className="p-2.5 min-w-[200px]">Penguji 3 (Pilihan Admin)</th>
                      )}
                      {!isSeminar && (
                        <th className="p-2.5 text-center min-w-[80px]">Nilai Sem</th>
                      )}
                      <th className="p-2.5 text-center w-20">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {parsedRows.map((row, idx) => {
                      const advisorLec = lecturers.find(l => l.id === row.matchedAdvisorId);
                      const reviewerLec = lecturers.find(l => l.id === row.matchedReviewerId);

                      return (
                        <tr key={idx} className={row.isValid ? 'hover:bg-slate-50' : 'bg-rose-50/50'}>
                          <td className="p-2.5 text-center font-bold text-slate-500">
                            {idx + 1}
                          </td>

                          {/* Student */}
                          <td className="p-2.5">
                            <div className={`font-mono text-[11px] font-bold ${
                              isSeminar ? 'text-emerald-700' : 'text-indigo-700'
                            }`}>
                              {row.nim}
                            </div>
                            <div className="font-bold text-slate-900 uppercase">
                              {row.nama}
                            </div>
                          </td>

                          {/* Thesis & Type */}
                          <td className="p-2.5">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 inline-block mb-1">
                              {row.jenis}
                            </span>
                            <p className="text-slate-700 line-clamp-2 leading-snug">
                              {row.judul}
                            </p>
                          </td>

                          {/* Dosen Reviewer */}
                          <td className="p-2.5">
                            {isSeminar ? (
                              <div className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-800 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-200">
                                <span>Dipilih di Papan Jadwal</span>
                              </div>
                            ) : (
                              <>
                                <div className="flex items-center gap-1 text-[10px] uppercase font-bold text-indigo-700 mb-0.5">
                                  <span className="w-4 h-4 rounded bg-indigo-100 flex items-center justify-center text-[9px]">P1</span>
                                  <span>Reviewer:</span>
                                </div>
                                <div className="font-bold text-slate-900">
                                  {reviewerLec ? reviewerLec.name : row.dosenReviewer}
                                </div>
                              </>
                            )}
                          </td>

                          {/* Dosen Pembimbing */}
                          <td className="p-2.5">
                            <div className="flex items-center gap-1 text-[10px] uppercase font-bold text-sky-700 mb-0.5">
                              <span className="w-4 h-4 rounded bg-sky-100 flex items-center justify-center text-[9px]">
                                {isSeminar ? 'Pem' : 'P2'}
                              </span>
                              <span>Pembimbing:</span>
                            </div>
                            <div className="font-bold text-slate-900">
                              {advisorLec ? advisorLec.name : row.dosenPembimbing}
                            </div>
                          </td>

                          {/* Penguji 3 (Only Sidang) */}
                          {!isSeminar && (
                            <td className="p-2.5">
                              <div className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 italic bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
                                Ditentukan saat Penjadwalan
                              </div>
                            </td>
                          )}

                          {/* Nilai Seminar (Only Sidang) */}
                          {!isSeminar && (
                            <td className="p-2.5 text-center">
                              <span className="font-mono font-bold text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-200">
                                {row.nilaiSeminar}
                              </span>
                            </td>
                          )}

                          {/* Status */}
                          <td className="p-2.5 text-center">
                            {row.isValid ? (
                              <span className="inline-flex items-center text-emerald-600 font-bold" title="Data valid untuk diimpor">
                                <CheckCircle2 className="w-4 h-4" />
                              </span>
                            ) : (
                              <span className="inline-flex items-center text-rose-600 font-bold" title={row.validationErrors.join(', ')}>
                                <AlertCircle className="w-4 h-4" />
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
          )}

        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-200/80 bg-slate-50/80 flex items-center justify-between shrink-0">
          <div className="text-xs text-slate-500">
            {parsedRows.length > 0 && (
              <span>Siap mengimpor {validCount} data {isSeminar ? 'seminar' : 'sidang'} ke antrean penjadwalan</span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="h-10 px-4 text-sm font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-xl transition-colors"
            >
              Batal
            </button>
            <button
              onClick={handleConfirmImport}
              disabled={validCount === 0}
              className={`h-10 px-5 text-sm font-bold text-white rounded-xl shadow-xs transition-colors flex items-center gap-2 ${
                validCount === 0 
                  ? 'bg-slate-300 cursor-not-allowed' 
                  : isSeminar 
                  ? 'bg-emerald-600 hover:bg-emerald-700' 
                  : 'bg-indigo-600 hover:bg-indigo-700'
              }`}
            >
              <Upload className="w-4 h-4" />
              <span>Impor {validCount} Data ke Antrean</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
