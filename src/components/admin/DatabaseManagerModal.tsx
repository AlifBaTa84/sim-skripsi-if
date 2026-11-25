import React, { useState, useEffect } from 'react';
import { useSchedule } from '../../context/ScheduleContext';
import { dbEngine } from '../../db/indexedDB';
import { DatabaseIntegrityReport, DatabaseDump } from '../../db/types';
import {
  X,
  Database,
  CheckCircle2,
  AlertTriangle,
  Download,
  RotateCcw,
  ShieldCheck,
  Server,
  FileCode,
  FileSpreadsheet,
  Check,
  Layers,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';

interface DatabaseManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DatabaseManagerModal: React.FC<DatabaseManagerModalProps> = ({ isOpen, onClose }) => {
  const { addToast, resetData } = useSchedule();
  const [report, setReport] = useState<DatabaseIntegrityReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'integrity' | 'export' | 'schema'>('integrity');
  const [copiedSql, setCopiedSql] = useState(false);

  // Load integrity audit report
  const runAudit = async () => {
    setLoading(true);
    try {
      const res = await dbEngine.runIntegrityAudit();
      setReport(res);
    } catch (e) {
      console.error('Audit failed', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      runAudit();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Handle Export JSON Dump
  const handleExportJson = async () => {
    try {
      const dump = await dbEngine.exportDatabaseDump();
      const blob = new Blob([JSON.stringify(dump, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `sim_sidang_database_backup_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      addToast('success', 'Backup Berhasil', 'Database dump JSON berhasil diunduh.');
    } catch {
      addToast('error', 'Gagal Ekspor', 'Terjadi kesalahan saat mengekspor database.');
    }
  };

  // Handle Export SQL Insert Dump
  const handleExportSql = async () => {
    try {
      const dump = await dbEngine.exportDatabaseDump();
      let sql = `-- ====================================================================\n`;
      sql += `-- BACKUP DATA RELASIONAL SISTEM INFORMASI MANAJEMEN SKRIPSI IF UNIKOM\n`;
      sql += `-- Tanggal Ekspor: ${dump.exported_at}\n`;
      sql += `-- ====================================================================\n\n`;

      // 1. Dosen
      sql += `-- 1. DATA DOSEN\n`;
      dump.dosen.forEach((d) => {
        sql += `INSERT INTO dosen (id, nidn, nama, kode, program_studi, email) VALUES ('${d.id}', '${d.nidn}', '${d.nama.replace(/'/g, "''")}', '${d.kode}', '${d.program_studi}', '${d.email}') ON CONFLICT (id) DO NOTHING;\n`;
      });
      sql += `\n`;

      // 2. Ruangan
      sql += `-- 2. DATA RUANGAN\n`;
      dump.ruangan.forEach((r) => {
        sql += `INSERT INTO ruangan (id, nama, gedung, lantai, kapasitas) VALUES ('${r.id}', '${r.nama}', '${r.gedung}', '${r.lantai}', ${r.kapasitas}) ON CONFLICT (id) DO NOTHING;\n`;
      });
      sql += `\n`;

      // 3. Slot Waktu
      sql += `-- 3. DATA SLOT WAKTU\n`;
      dump.slot_waktu.forEach((s) => {
        sql += `INSERT INTO slot_waktu (id, jam_mulai, jam_selesai, label, urutan) VALUES ('${s.id}', '${s.jam_mulai}', '${s.jam_selesai}', '${s.label}', ${s.urutan}) ON CONFLICT (id) DO NOTHING;\n`;
      });
      sql += `\n`;

      // 4. Mahasiswa
      sql += `-- 4. DATA MAHASISWA\n`;
      dump.mahasiswa.forEach((m) => {
        sql += `INSERT INTO mahasiswa (nim, nama, program_studi, tahun_akademik) VALUES ('${m.nim}', '${m.nama.replace(/'/g, "''")}', '${m.program_studi}', '${m.tahun_akademik}') ON CONFLICT (nim) DO NOTHING;\n`;
      });
      sql += `\n`;

      // 5. Pengajuan Sidang
      sql += `-- 5. DATA PENGAJUAN SIDANG\n`;
      dump.pengajuan_sidang.forEach((p) => {
        const p3Val = p.dosen_penguji3_id ? `'${p.dosen_penguji3_id}'` : 'NULL';
        const nilVal = p.nilai_seminar !== undefined ? p.nilai_seminar : 'NULL';
        sql += `INSERT INTO pengajuan_sidang (id, mahasiswa_nim, judul_skripsi, jenis, dosen_reviewer_id, dosen_pembimbing_id, dosen_penguji3_id, nilai_seminar, status) VALUES ('${p.id}', '${p.mahasiswa_nim}', '${p.judul_skripsi.replace(/'/g, "''")}', '${p.jenis}', '${p.dosen_reviewer_id}', '${p.dosen_pembimbing_id}', ${p3Val}, ${nilVal}, '${p.status}') ON CONFLICT (id) DO NOTHING;\n`;
      });
      sql += `\n`;

      // 6. Jadwal Sidang
      sql += `-- 6. DATA JADWAL SIDANG\n`;
      dump.jadwal_sidang.forEach((j) => {
        sql += `INSERT INTO jadwal_sidang (id, pengajuan_id, tanggal, slot_waktu_id, ruangan_id, status) VALUES ('${j.id}', '${j.pengajuan_id}', '${j.tanggal}', '${j.slot_waktu_id}', '${j.ruangan_id}', '${j.status}') ON CONFLICT (id) DO NOTHING;\n`;
      });

      const blob = new Blob([sql], { type: 'text/sql' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `sim_sidang_database_backup_${new Date().toISOString().split('T')[0]}.sql`;
      a.click();
      URL.revokeObjectURL(url);
      addToast('success', 'SQL Dump Berhasil', 'File SQL relasional berhasil diunduh.');
    } catch {
      addToast('error', 'Gagal Ekspor SQL', 'Terjadi kesalahan saat mengekspor database SQL.');
    }
  };

  // Handle Reset to Default Seed Data
  const handleReset = async () => {
    if (!window.confirm('Apakah Anda yakin ingin mereset seluruh database ke data awal standar? Tindakan ini akan mengembalikan data ruangan, slot, dosen, dan mahasiswa ke kondisi seed.')) {
      return;
    }
    try {
      await dbEngine.resetToSeedData();
      resetData();
      await runAudit();
      addToast('success', 'Database Direset', 'Seluruh data basis data telah dikembalikan ke kondisi awal (seed).');
    } catch {
      addToast('error', 'Gagal Reset', 'Terjadi kesalahan saat mereset database.');
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-3xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 bg-gradient-to-r from-slate-900 to-indigo-950 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 text-indigo-300">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold tracking-tight">
                  Manajemen Database
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 uppercase">
                  3NF Active
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Penyimpanan persisten terstruktur dengan penegakan integritas Foreign Key & Anti-Bentrok
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="h-9 w-9 rounded-full flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="px-6 pt-3 border-b border-slate-100 bg-slate-50/60 flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('integrity')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs font-bold transition-all border-b-2 ${
                activeTab === 'integrity'
                  ? 'border-indigo-600 text-indigo-700 bg-white shadow-2xs'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Integritas & Audit Data</span>
            </button>

            <button
              onClick={() => setActiveTab('export')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs font-bold transition-all border-b-2 ${
                activeTab === 'export'
                  ? 'border-indigo-600 text-indigo-700 bg-white shadow-2xs'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              <Download className="w-4 h-4" />
              <span>Cadangkan / Ekspor (SQL & JSON)</span>
            </button>

            <button
              onClick={() => setActiveTab('schema')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs font-bold transition-all border-b-2 ${
                activeTab === 'schema'
                  ? 'border-indigo-600 text-indigo-700 bg-white shadow-2xs'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              <FileCode className="w-4 h-4" />
              <span>Skema PostgreSQL / Supabase</span>
            </button>
          </div>

          <button
            onClick={runAudit}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Audit Ulang</span>
          </button>
        </div>

        {/* Tab Contents */}
        <div className="p-6 flex-1 overflow-y-auto space-y-6">

          {/* TAB 1: INTEGRITY AUDIT */}
          {activeTab === 'integrity' && (
            <div className="space-y-6">
              {/* Overall Status Banner */}
              <div className={`p-4 rounded-2xl border flex items-start gap-4 ${
                report?.isValid
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : 'bg-rose-50 border-rose-200 text-rose-900'
              }`}>
                <div className={`p-2.5 rounded-xl ${report?.isValid ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                  {report?.isValid ? <CheckCircle2 className="w-6 h-6" /> : <AlertTriangle className="w-6 h-6" />}
                </div>
                <div>
                  <h4 className="text-sm font-extrabold">
                    {report?.isValid
                      ? 'Integritas Basis Data 100% Valid & Bebas Anomali'
                      : 'Terdeteksi Anomali Integritas Data'}
                  </h4>
                  <p className="text-xs text-slate-600 mt-1">
                    {report?.isValid
                      ? 'Seluruh relasi foreign key, batasan unik (unique constraints), dan aturan anti-bentrok ruangan/dosen terpenuhi dengan sempurna.'
                      : 'Terdapat relasi yang terputus atau bentrok data yang perlu diselesaikan.'}
                  </p>
                </div>
              </div>

              {/* Table Records Grid */}
              <div>
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 mb-3">
                  Ringkasan Relasi Tabel Basis Data
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                  {[
                    { label: 'Tabel Dosen', count: report?.totalRecords.dosen || 0, desc: 'Dosen Master', icon: '👤' },
                    { label: 'Tabel Mahasiswa', count: report?.totalRecords.mahasiswa || 0, desc: 'Peserta Sidang', icon: '🎓' },
                    { label: 'Tabel Ruangan', count: report?.totalRecords.ruangan || 0, desc: 'Ruang Ujian', icon: '🏢' },
                    { label: 'Tabel Slot Waktu', count: report?.totalRecords.slot_waktu || 0, desc: 'Sesi Sidang', icon: '⏱️' },
                    { label: 'Pengajuan Sidang', count: report?.totalRecords.pengajuan_sidang || 0, desc: 'Draft & P1/P2/P3', icon: '📋' },
                    { label: 'Jadwal Sidang', count: report?.totalRecords.jadwal_sidang || 0, desc: 'Terjadwal Matriks', icon: '📅' },
                  ].map((table) => (
                    <div key={table.label} className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80">
                      <div className="flex items-center justify-between">
                        <span className="text-base">{table.icon}</span>
                        <span className="text-lg font-bold text-slate-900 font-mono">{table.count}</span>
                      </div>
                      <p className="text-xs font-bold text-slate-800 mt-2 truncate">{table.label}</p>
                      <p className="text-[10px] text-slate-400 truncate">{table.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Constraints Checklist */}
              <div className="p-5 bg-white rounded-2xl border border-slate-200/80 space-y-3">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
                  Batasan Integritas yang Ditegakkan (Enforced Constraints)
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200/60">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                    <div>
                      <strong className="text-slate-800 block">Anti-Bentrok Ruangan (Unique Key)</strong>
                      <span className="text-slate-500 text-[11px]">
                        <code>UNIQUE(tanggal, slot_waktu_id, ruangan_id)</code> mencegah 2 sidang di ruangan & jam yang sama.
                      </span>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200/60">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                    <div>
                      <strong className="text-slate-800 block">Aturan Penguji Berbeda (Check Constraint)</strong>
                      <span className="text-slate-500 text-[11px]">
                        Reviewer (P1), Pembimbing (P2), dan Penguji 3 wajib 3 orang dosen yang berbeda.
                      </span>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200/60">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                    <div>
                      <strong className="text-slate-800 block">Integritas Referensial (Foreign Keys)</strong>
                      <span className="text-slate-500 text-[11px]">
                        Mencegah record yatim (orphaned records). Mahasiswa dan Dosen harus terdaftar di master.
                      </span>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200/60">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                    <div>
                      <strong className="text-slate-800 block">Anti-Bentrok Dosen (Trigger Validasi)</strong>
                      <span className="text-slate-500 text-[11px]">
                        Dosen tidak dapat ditugaskan menguji pada dua ruangan berbeda di jam yang bersamaan.
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Danger Zone: Reset Database */}
              <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between">
                <div>
                  <h5 className="text-xs font-bold text-slate-800">Kembalikan ke Data Awal (Seed)</h5>
                  <p className="text-[11px] text-slate-500">Mereset basis data ke data mock standar yang terverifikasi.</p>
                </div>
                <button
                  onClick={handleReset}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset Database ke Seed</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: EXPORT & BACKUP */}
          {activeTab === 'export' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Export SQL */}
                <div className="p-5 bg-gradient-to-br from-indigo-50/70 to-white rounded-2xl border border-indigo-200 flex flex-col justify-between space-y-4">
                  <div>
                    <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center mb-3">
                      <FileCode className="w-5 h-5" />
                    </div>
                    <h4 className="text-sm font-extrabold text-slate-900">
                      Ekspor SQL Dump (.sql)
                    </h4>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                      Menghasilkan berkas kueri SQL relasional lengkap (<code>INSERT INTO dosen, mahasiswa, ruangan, slot_waktu, pengajuan_sidang, jadwal_sidang</code>) siap diimpor ke PostgreSQL, Supabase, MySQL, atau SQLite.
                    </p>
                  </div>
                  <button
                    onClick={handleExportSql}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-500/20 transition-all"
                  >
                    <Download className="w-4 h-4" />
                    <span>Unduh Berkas SQL Dump (.sql)</span>
                  </button>
                </div>

                {/* Export JSON */}
                <div className="p-5 bg-gradient-to-br from-emerald-50/70 to-white rounded-2xl border border-emerald-200 flex flex-col justify-between space-y-4">
                  <div>
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-3">
                      <Database className="w-5 h-5" />
                    </div>
                    <h4 className="text-sm font-extrabold text-slate-900">
                      Ekspor Dokumen JSON (.json)
                    </h4>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                      Menghasilkan berkas dump data terstruktur JSON yang mencakup seluruh relasi entitas untuk kebutuhan integrasi API, migrasi data, atau pemulihan cadangan.
                    </p>
                  </div>
                  <button
                    onClick={handleExportJson}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-500/20 transition-all"
                  >
                    <Download className="w-4 h-4" />
                    <span>Unduh Backup JSON (.json)</span>
                  </button>
                </div>

              </div>

              {/* Info Box */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-600 leading-relaxed space-y-1">
                <p className="font-bold text-slate-800">💡 Cara Menggunakan Berkas Backup SQL:</p>
                <p>1. Buka <strong>SQL Editor</strong> di dashboard Supabase atau jalankan terminal <code>psql</code>.</p>
                <p>2. Pastikan skema tabel sudah dibuat dengan menjalankan skrip <code>database/schema.sql</code>.</p>
                <p>3. Jalankan berkas backup SQL hasil unduhan untuk memulihkan seluruh data dan penempatan jadwal.</p>
              </div>
            </div>
          )}

          {/* TAB 3: SCHEMA PREVIEW */}
          {activeTab === 'schema' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-extrabold text-slate-900">
                    Skema Relasional DDL (PostgreSQL / Supabase)
                  </h4>
                  <p className="text-xs text-slate-500">
                    Tersedia di berkas proyek: <code>database/schema.sql</code> & <code>database/seed.sql</code>
                  </p>
                </div>

                <button
                  onClick={() => {
                    navigator.clipboard.writeText(`psql -h <host> -U <user> -d <dbname> -f database/schema.sql`);
                    setCopiedSql(true);
                    setTimeout(() => setCopiedSql(false), 2000);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-lg hover:bg-indigo-100 transition-colors"
                >
                  {copiedSql ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Layers className="w-3.5 h-3.5" />}
                  <span>{copiedSql ? 'Tersalin!' : 'Salin Perintah psql'}</span>
                </button>
              </div>

              <div className="bg-slate-900 text-slate-200 p-4 rounded-2xl text-xs font-mono overflow-x-auto max-h-[350px] leading-relaxed">
                <pre>{`-- 6 TABEL UTAMA RELASIONAL
1. dosen             (id PK, nidn UQ, nama, kode UQ, program_studi, email UQ)
2. mahasiswa         (nim PK, nama, program_studi, tahun_akademik, email)
3. ruangan           (id PK, nama UQ, gedung, lantai, kapasitas > 0)
4. slot_waktu        (id PK, jam_mulai, jam_selesai > jam_mulai, label UQ)
5. pengajuan_sidang  (id PK, mahasiswa_nim FK UQ, judul_skripsi, jenis,
                      dosen_reviewer_id FK, dosen_pembimbing_id FK, dosen_penguji3_id FK,
                      CHECK p1 <> p2, CHECK p1 <> p3, CHECK p2 <> p3)
6. jadwal_sidang     (id PK, pengajuan_id FK UQ, tanggal, slot_waktu_id FK, ruangan_id FK,
                      CONSTRAINT uq_jadwal_tanggal_slot_ruangan UNIQUE (tanggal, slot_waktu_id, ruangan_id))

-- TRIGGER VALIDASI BENTROK OTOMATIS
CREATE TRIGGER trg_cek_bentrok_sebelum_simpan
    BEFORE INSERT OR UPDATE ON jadwal_sidang
    FOR EACH ROW EXECUTE FUNCTION trg_validasi_bentrok_jadwal();`}</pre>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Server className="w-4 h-4 text-indigo-600" />
            <span>Penyimpanan Relasional Aktif: IndexedDB + PostgreSQL Compatible Schema</span>
          </div>

          <button
            onClick={onClose}
            className="h-10 px-5 text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-colors shadow-sm"
          >
            Tutup
          </button>
        </div>

      </div>
    </div>
  );
};

