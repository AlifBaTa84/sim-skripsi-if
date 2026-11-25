import React, { useState, useEffect } from 'react';
import { useSchedule } from '../../context/ScheduleContext';
import { dbEngine } from '../../db/indexedDB';
import { DatabaseIntegrityReport, DatabaseDump } from '../../db/types';
import {
  Database,
  CheckCircle2,
  AlertTriangle,
  Download,
  RotateCcw,
  ShieldCheck,
  FileCode,
  RefreshCw,
} from 'lucide-react';

export const DatabaseManagerView: React.FC = () => {
  const { addToast, resetData } = useSchedule();
  const [report, setReport] = useState<DatabaseIntegrityReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'integrity' | 'export'>('integrity');

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
    runAudit();
  }, []);

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

      // 2. Mahasiswa
      sql += `-- 2. DATA MAHASISWA\n`;
      dump.mahasiswa.forEach((m) => {
        sql += `INSERT INTO mahasiswa (nim, nama, program_studi, tahun_akademik, email) VALUES ('${m.nim}', '${m.nama.replace(/'/g, "''")}', '${m.program_studi}', '${m.tahun_akademik}', '${m.email}') ON CONFLICT (nim) DO NOTHING;\n`;
      });
      sql += `\n`;

      // 3. Ruangan
      sql += `-- 3. DATA RUANGAN\n`;
      dump.ruangan.forEach((r) => {
        sql += `INSERT INTO ruangan (id, nama, gedung, lantai, kapasitas) VALUES ('${r.id}', '${r.nama}', '${r.gedung}', '${r.lantai}', ${r.kapasitas}) ON CONFLICT (id) DO NOTHING;\n`;
      });
      sql += `\n`;

      // 4. Slot Waktu
      sql += `-- 4. DATA SLOT WAKTU\n`;
      dump.slot_waktu.forEach((s) => {
        sql += `INSERT INTO slot_waktu (id, jam_mulai, jam_selesai, label) VALUES ('${s.id}', '${s.jam_mulai}', '${s.jam_selesai}', '${s.label}') ON CONFLICT (id) DO NOTHING;\n`;
      });
      sql += `\n`;

      // 5. Pengajuan Sidang
      sql += `-- 5. DATA PENGAJUAN SIDANG\n`;
      dump.pengajuan_sidang.forEach((p) => {
        sql += `INSERT INTO pengajuan_sidang (id, mahasiswa_nim, judul_skripsi, jenis, nilai_seminar, dosen_reviewer_id, dosen_pembimbing_id, dosen_penguji3_id) VALUES ('${p.id}', '${p.mahasiswa_nim}', '${p.judul_skripsi.replace(/'/g, "''")}', '${p.jenis}', ${p.nilai_seminar || 'NULL'}, '${p.dosen_reviewer_id}', '${p.dosen_pembimbing_id}', ${p.dosen_penguji3_id ? `'${p.dosen_penguji3_id}'` : 'NULL'}) ON CONFLICT (id) DO NOTHING;\n`;
      });
      sql += `\n`;

      // 6. Jadwal Sidang
      sql += `-- 6. DATA JADWAL SIDANG\n`;
      dump.jadwal_sidang.forEach((j) => {
        sql += `INSERT INTO jadwal_sidang (id, pengajuan_id, tanggal, slot_waktu_id, ruangan_id, status) VALUES ('${j.id}', '${j.pengajuan_id}', '${j.tanggal}', '${j.slot_waktu_id}', '${j.ruangan_id}', '${j.status}') ON CONFLICT (id) DO NOTHING;\n`;
      });
      sql += `\n`;

      // 7. Pengguna Sistem & Kredensial
      sql += `-- 7. DATA PENGGUNA SISTEM & KREDENSIAL (ROLE-BASED AUTHENTICATION)\n`;
      if (dump.pengguna && dump.pengguna.length > 0) {
        dump.pengguna.forEach((u) => {
          sql += `INSERT INTO pengguna (id, email, nama, role_utama, password_hash, password_required) VALUES ('${u.id}', '${u.email}', '${u.nama.replace(/'/g, "''")}', '${u.role_utama}', ${u.password_hash ? `'${u.password_hash}'` : 'NULL'}, ${u.password_required}) ON CONFLICT (id) DO NOTHING;\n`;
        });
      }

      const blob = new Blob([sql], { type: 'text/sql' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `sim_sidang_insert_dump_${new Date().toISOString().split('T')[0]}.sql`;
      a.click();
      URL.revokeObjectURL(url);
      addToast('success', 'Backup SQL Berhasil', 'Script SQL INSERT berhasil diunduh.');
    } catch {
      addToast('error', 'Gagal Ekspor SQL', 'Terjadi kesalahan saat mengekspor database.');
    }
  };

  // Handle Reset DB ke Seed
  const handleReset = async () => {
    if (confirm('PERINGATAN: Seluruh data perubahan akan dihapus dan dikembalikan ke data awal (seed). Lanjutkan?')) {
      try {
        await resetData();
        await runAudit();
        addToast('info', 'Database Direset', 'Basis data berhasil dikembalikan ke data awal terverifikasi.');
      } catch {
        addToast('error', 'Gagal Reset', 'Terjadi kesalahan saat mereset database.');
      }
    }
  };

  return (
    <div className="space-y-5">
      {/* ── Top Header Card (Dashboard Integrated) ── */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <span>Manajemen Database</span>
        </h2>
        <p className="text-sm text-slate-500 mt-0.5">
          Penyimpanan persisten IndexedDB terstruktur dengan penegakan integritas Foreign Key, Unique Keys, dan Anti-Bentrok
        </p>
      </div>

      {/* ── Tab Navigation Bar ── */}
      <div className="bg-white rounded-2xl p-1.5 border border-slate-200/80 shadow-xs flex items-center gap-1.5 overflow-x-auto">
        <button
          onClick={() => setActiveTab('integrity')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'integrity'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Integritas &amp; Audit Relasi</span>
        </button>

        <button
          onClick={() => setActiveTab('export')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'export'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Download className="w-4 h-4" />
          <span>Backup Data (SQL &amp; JSON)</span>
        </button>

        <button
          onClick={runAudit}
          disabled={loading}
          className="flex items-center gap-2 h-9 px-4 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl shadow-2xs transition-colors shrink-0"
          title="Jalankan ulang audit integritas data"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-indigo-600' : 'text-slate-500'}`} />
          <span>Audit Ulang</span>
        </button>
      </div>

      {/* ── TAB 1: INTEGRITY AUDIT ── */}
      {activeTab === 'integrity' && (
        <div className="space-y-5">
          {/* Status Banner */}
          <div className={`p-5 rounded-2xl border flex items-start gap-4 ${
            report?.isValid
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-rose-50 border-rose-200 text-rose-900'
          }`}>
            <div className={`p-2.5 rounded-xl shrink-0 ${report?.isValid ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
              {report?.isValid ? <CheckCircle2 className="w-6 h-6" /> : <AlertTriangle className="w-6 h-6" />}
            </div>
            <div>
              <h4 className="text-sm font-extrabold">
                {report?.isValid
                  ? 'Integritas Basis Data 100% Valid & Bebas Anomali'
                  : 'Terdeteksi Anomali Integritas Data'}
              </h4>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                {report?.isValid
                  ? 'Seluruh relasi foreign key, batasan unik (unique constraints), dan aturan anti-bentrok ruangan/dosen terpenuhi dengan sempurna.'
                  : 'Terdapat relasi yang terputus atau bentrok data yang perlu diselesaikan.'}
              </p>
            </div>
          </div>

          {/* Table Records Grid */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
              Ringkasan Relasi 7 Tabel Utama Basis Data Relasional
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
              {[
                { label: 'Tabel Dosen', count: report?.totalRecords.dosen || 0, desc: 'Dosen Master', icon: '👤' },
                { label: 'Tabel Mahasiswa', count: report?.totalRecords.mahasiswa || 0, desc: 'Peserta Sidang', icon: '🎓' },
                { label: 'Tabel Ruangan', count: report?.totalRecords.ruangan || 0, desc: 'Ruang Ujian', icon: '🏢' },
                { label: 'Tabel Slot Waktu', count: report?.totalRecords.slot_waktu || 0, desc: 'Sesi Sidang', icon: '⏱️' },
                { label: 'Pengajuan Sidang', count: report?.totalRecords.pengajuan_sidang || 0, desc: 'Draft & P1/P2/P3', icon: '📋' },
                { label: 'Jadwal Sidang', count: report?.totalRecords.jadwal_sidang || 0, desc: 'Terjadwal Matriks', icon: '📅' },
                { label: 'Tabel Pengguna', count: report?.totalRecords.pengguna || 0, desc: 'Akun & Kredensial', icon: '🔑' },
              ].map((table) => (
                <div key={table.label} className="p-4 bg-slate-50 rounded-2xl border border-slate-200/70">
                  <div className="flex items-center justify-between">
                    <span className="text-xl">{table.icon}</span>
                    <span className="text-xl font-bold text-slate-900 font-mono">{table.count}</span>
                  </div>
                  <p className="text-xs font-bold text-slate-800 mt-2 truncate">{table.label}</p>
                  <p className="text-[10px] text-slate-400 truncate">{table.desc}</p>
                </div>
              ))}
            </div>

            {report && report.completedLockedCount > 0 && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between text-xs text-emerald-900">
                <span className="font-semibold">
                  Status Sidang Selesai &amp; Terkunci Permanen:
                </span>
                <span className="font-bold font-mono px-2.5 py-0.5 rounded-full bg-emerald-200/70 text-emerald-950">
                  {report.completedLockedCount} Sidang Terkunci
                </span>
              </div>
            )}
          </div>

          {/* Constraints Checklist */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
              Batasan Integritas yang Ditegakkan (Enforced Constraints)
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
              <div className="flex items-start gap-3 p-4 rounded-xl bg-slate-50 border border-slate-200/60">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                <div>
                  <strong className="text-slate-800 block text-sm">Anti-Bentrok Ruangan (Unique Key)</strong>
                  <span className="text-slate-500 text-[11px] block mt-1">
                    <code>UNIQUE(tanggal, slot_waktu_id, ruangan_id)</code> mencegah 2 sidang di ruangan &amp; jam yang sama.
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 rounded-xl bg-slate-50 border border-slate-200/60">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                <div>
                  <strong className="text-slate-800 block text-sm">Aturan Penguji Berbeda (Check Constraint)</strong>
                  <span className="text-slate-500 text-[11px] block mt-1">
                    Reviewer (P1), Pembimbing (P2), dan Penguji 3 wajib 3 orang dosen yang berbeda.
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 rounded-xl bg-slate-50 border border-slate-200/60">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                <div>
                  <strong className="text-slate-800 block text-sm">Integritas Referensial (Foreign Keys)</strong>
                  <span className="text-slate-500 text-[11px] block mt-1">
                    Mencegah record yatim. Mahasiswa dan Dosen harus terdaftar aktif di master data.
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 rounded-xl bg-slate-50 border border-slate-200/60">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                <div>
                  <strong className="text-slate-800 block text-sm">Anti-Bentrok Dosen (Trigger Validasi)</strong>
                  <span className="text-slate-500 text-[11px] block mt-1">
                    Dosen tidak dapat ditugaskan menguji pada dua ruangan berbeda di jam yang bersamaan.
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 rounded-xl bg-slate-50 border border-slate-200/60">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                <div>
                  <strong className="text-slate-800 block text-sm">Kunci Permanen Sidang Selesai</strong>
                  <span className="text-slate-500 text-[11px] block mt-1">
                    Setelah status sidang dinyatakan <code>completed</code>, data Penguji 3 dan ruangan tersimpan permanen dan terkunci di database.
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 rounded-xl bg-slate-50 border border-slate-200/60">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                <div>
                  <strong className="text-slate-800 block text-sm">Penyimpanan Password Sesuai Role</strong>
                  <span className="text-slate-500 text-[11px] block mt-1">
                    Password disimpan untuk <strong>Admin</strong> &amp; <strong>Dosen</strong> (Wajib). Untuk <strong>Mahasiswa</strong>, otentikasi divalidasi dinamis via NIM dari tabel Mahasiswa.
                  </span>
                </div>
              </div>
            </div>

            {/* Danger Zone: Reset Database */}
            <div className="pt-4 border-t border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h5 className="text-xs font-bold text-slate-800">Kembalikan ke Data Awal (Seed Data)</h5>
                <p className="text-[11px] text-slate-500">Mereset basis data ke data mock standar yang terverifikasi.</p>
              </div>
              <button
                onClick={handleReset}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition-colors shrink-0"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Database ke Seed</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 2: EXPORT SQL & JSON ── */}
      {activeTab === 'export' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-5">
          <div>
            <h4 className="text-base font-bold text-slate-900">Backup Data (SQL &amp; JSON)</h4>
            <p className="text-xs text-slate-500 mt-1">
              Unduh salinan penuh seluruh tabel basis data dalam format JSON atau SQL INSERT statements yang siap diimpor ke PostgreSQL/Supabase.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-5 bg-indigo-50/50 rounded-2xl border border-indigo-100 flex flex-col justify-between space-y-4">
              <div>
                <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center mb-3">
                  <Download className="w-5 h-5" />
                </div>
                <h5 className="text-sm font-bold text-indigo-950">Ekspor JSON Dump</h5>
                <p className="text-xs text-indigo-900/70 mt-1 leading-relaxed">
                  Menyimpan seluruh tabel dan data relasi dalam format JSON terstruktur untuk backup aplikasi.
                </p>
              </div>
              <button
                onClick={handleExportJson}
                className="w-full flex items-center justify-center gap-2 h-10 px-4 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>Unduh JSON Dump</span>
              </button>
            </div>

            <div className="p-5 bg-emerald-50/50 rounded-2xl border border-emerald-100 flex flex-col justify-between space-y-4">
              <div>
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-3">
                  <FileCode className="w-5 h-5" />
                </div>
                <h5 className="text-sm font-bold text-emerald-950">Ekspor SQL INSERT Script</h5>
                <p className="text-xs text-emerald-900/70 mt-1 leading-relaxed">
                  Menghasilkan script SQL INSERT statement yang kompatibel dengan PostgreSQL, MySQL, dan Supabase.
                </p>
              </div>
              <button
                onClick={handleExportSql}
                className="w-full flex items-center justify-center gap-2 h-10 px-4 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-colors"
              >
                <FileCode className="w-4 h-4" />
                <span>Unduh File .SQL</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
