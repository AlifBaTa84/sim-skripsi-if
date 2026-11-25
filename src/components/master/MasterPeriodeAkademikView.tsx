import React, { useState, useMemo } from 'react';
import { useSchedule } from '../../context/ScheduleContext';
import { AcademicPeriod } from '../../types';
import {
  CalendarDays,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  AlertTriangle,
  X,
  Layers,
  Calendar,
  Lock,
  PlayCircle,
  Eye,
  Edit3,
  Trash2,
  Check,
  Archive,
  GraduationCap,
  Sparkles,
  Info
} from 'lucide-react';
import { formatIndonesianDate } from '../../utils/formatters';

export const MasterPeriodeAkademikView: React.FC = () => {
  const {
    academicPeriods,
    activePeriod,
    schedules,
    addAcademicPeriod,
    updateAcademicPeriod,
    activateAcademicPeriod,
    closeAcademicPeriod,
    deleteAcademicPeriod,
    addToast
  } = useSchedule();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'persiapan' | 'berjalan' | 'selesai'>('ALL');

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingPeriod, setEditingPeriod] = useState<AcademicPeriod | null>(null);
  const [activatingPeriod, setActivatingPeriod] = useState<AcademicPeriod | null>(null);
  const [closingPeriod, setClosingPeriod] = useState<AcademicPeriod | null>(null);
  const [detailPeriod, setDetailPeriod] = useState<AcademicPeriod | null>(null);
  const [deleteConfirmPeriod, setDeleteConfirmPeriod] = useState<AcademicPeriod | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    academicYear: '',
    semester: 'Ganjil' as 'Ganjil' | 'Genap',
    startDate: '',
    endDate: '',
    status: 'persiapan' as 'persiapan' | 'berjalan' | 'selesai'
  });

  // Calculate schedule statistics per academic period
  const periodScheduleStats = useMemo(() => {
    const stats: Record<string, { total: number; scheduled: number; unassigned: number; completed: number }> = {};
    academicPeriods.forEach(p => {
      stats[p.id] = { total: 0, scheduled: 0, unassigned: 0, completed: 0 };
    });

    schedules.forEach(s => {
      const periodId = s.academicPeriodId || (activePeriod?.id || '');
      if (stats[periodId]) {
        stats[periodId].total += 1;
        if (s.status === 'scheduled') stats[periodId].scheduled += 1;
        else if (s.status === 'unassigned') stats[periodId].unassigned += 1;
        else if (s.status === 'completed') stats[periodId].completed += 1;
      }
    });

    return stats;
  }, [academicPeriods, schedules, activePeriod]);

  // Filtered academic periods
  const filteredPeriods = useMemo(() => {
    return academicPeriods.filter(period => {
      const matchesSearch =
        period.academicYear.toLowerCase().includes(searchQuery.toLowerCase()) ||
        period.semester.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = statusFilter === 'ALL' || period.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [academicPeriods, searchQuery, statusFilter]);

  // Open Add Modal
  const openAddModal = () => {
    setFormData({
      academicYear: '2026/2027',
      semester: 'Ganjil',
      startDate: '',
      endDate: '',
      status: 'persiapan'
    });
    setIsAddModalOpen(true);
  };

  // Open Edit Modal
  const openEditModal = (period: AcademicPeriod) => {
    setEditingPeriod(period);
    setFormData({
      academicYear: period.academicYear,
      semester: period.semester,
      startDate: period.startDate || '',
      endDate: period.endDate || '',
      status: period.status
    });
  };

  // Handle Form Submit (Add or Edit)
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (editingPeriod) {
      const res = updateAcademicPeriod(editingPeriod.id, {
        academicYear: formData.academicYear.trim(),
        semester: formData.semester,
        startDate: formData.startDate || undefined,
        endDate: formData.endDate || undefined,
      });

      if (res.success) {
        setEditingPeriod(null);
      } else {
        addToast('error', 'Gagal Memperbarui Periode', res.error || 'Terjadi kesalahan validasi.');
      }
    } else {
      const res = addAcademicPeriod({
        academicYear: formData.academicYear.trim(),
        semester: formData.semester,
        startDate: formData.startDate || undefined,
        endDate: formData.endDate || undefined,
        isActive: false,
        status: formData.status
      });

      if (res.success) {
        setIsAddModalOpen(false);
      } else {
        addToast('error', 'Gagal Menambahkan Periode', res.error || 'Terjadi kesalahan validasi.');
      }
    }
  };

  // Check unfinished schedules in current active period before activating another
  const unfinishedInCurrentActive = useMemo(() => {
    if (!activePeriod) return 0;
    return schedules.filter(s => s.academicPeriodId === activePeriod.id && s.status !== 'completed').length;
  }, [activePeriod, schedules]);

  // Trigger Activation flow
  const handleConfirmActivation = () => {
    if (!activatingPeriod) return;
    const res = activateAcademicPeriod(activatingPeriod.id, true);
    if (res.success) {
      setActivatingPeriod(null);
    } else {
      addToast('error', 'Gagal Mengaktifkan Periode', res.error || 'Terjadi kendala aktivasi.');
    }
  };

  // Trigger Close flow
  const handleConfirmClose = () => {
    if (!closingPeriod) return;
    const res = closeAcademicPeriod(closingPeriod.id);
    if (res.success) {
      setClosingPeriod(null);
    } else {
      addToast('error', 'Gagal Menutup Periode', res.error || 'Terjadi kendala menutup periode.');
    }
  };

  // Trigger Delete flow
  const handleConfirmDelete = () => {
    if (!deleteConfirmPeriod) return;
    const res = deleteAcademicPeriod(deleteConfirmPeriod.id);
    if (res.success) {
      setDeleteConfirmPeriod(null);
    } else {
      addToast('error', 'Gagal Menghapus Periode', res.error || 'Terjadi kendala menghapus periode.');
    }
  };

  return (
    <div className="space-y-6">
      {/* ── Top Header Card ── */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
              Pengaturan Sistem & Data Master
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mt-1.5 flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-indigo-600" />
            <span>Pengaturan Tahun Akademik & Semester</span>
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Pengendali terpusat periode akademik aktif, siklus penjadwalan sidang skripsi, dan arsip riwayat semester IF UNIKOM.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="flex items-center justify-center gap-2 h-10 px-4 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-colors shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Periode Baru</span>
        </button>
      </div>

      {/* ── 4 KPI Stats Bar ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Periode Aktif */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div className="min-w-0">
            <span className="text-xs font-semibold text-slate-500 block uppercase tracking-wider">
              Periode Aktif Saat Ini
            </span>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-lg font-bold text-slate-900 truncate">
                {activePeriod ? `${activePeriod.academicYear} ${activePeriod.semester}` : 'Belum Ada Aktif'}
              </span>
            </div>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-medium text-emerald-600 capitalize">
                Status: {activePeriod?.status || 'Nonaktif'}
              </span>
            </div>
          </div>
          <div className="h-12 w-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
            <PlayCircle className="w-6 h-6" />
          </div>
        </div>

        {/* Card 2: Total Periode */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 block uppercase tracking-wider">
              Total Periode Terdaftar
            </span>
            <span className="text-2xl font-bold text-slate-900 mt-1 block">
              {academicPeriods.length}
            </span>
            <span className="text-xs text-slate-400 mt-0.5 block">
              Siklus akademik terdata
            </span>
          </div>
          <div className="h-12 w-12 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
            <CalendarDays className="w-6 h-6" />
          </div>
        </div>

        {/* Card 3: Berjalan & Persiapan */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 block uppercase tracking-wider">
              Berjalan & Persiapan
            </span>
            <span className="text-2xl font-bold text-blue-600 mt-1 block">
              {academicPeriods.filter(p => p.status === 'berjalan' || p.status === 'persiapan').length}
            </span>
            <span className="text-xs text-slate-400 mt-0.5 block">
              Periode siap & aktif
            </span>
          </div>
          <div className="h-12 w-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        {/* Card 4: Selesai / Arsip */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 block uppercase tracking-wider">
              Selesai & Arsip
            </span>
            <span className="text-2xl font-bold text-slate-700 mt-1 block">
              {academicPeriods.filter(p => p.status === 'selesai').length}
            </span>
            <span className="text-xs text-slate-400 mt-0.5 block">
              Riwayat sidang lampau
            </span>
          </div>
          <div className="h-12 w-12 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 shrink-0">
            <Archive className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* ── Filter & Search Section ── */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari tahun akademik (cth: 2026/2027) atau semester..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
          <span className="text-xs font-semibold text-slate-500 shrink-0 mr-1">Status:</span>
          {(['ALL', 'berjalan', 'persiapan', 'selesai'] as const).map(st => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors ${
                statusFilter === st
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80'
              }`}
            >
              {st === 'ALL' ? 'Semua' : st}
            </button>
          ))}
        </div>
      </div>

      {/* ── Table Section ── */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th className="py-3 px-4 w-12 text-center">No</th>
                <th className="py-3 px-4">Tahun Akademik</th>
                <th className="py-3 px-4">Semester</th>
                <th className="py-3 px-4">Rentang Waktu</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-center">Periode Aktif</th>
                <th className="py-3 px-4 text-center">Total Sidang</th>
                <th className="py-3 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filteredPeriods.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <CalendarDays className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                    <p className="font-medium text-slate-600">Tidak ada periode akademik ditemukan</p>
                    <p className="text-xs text-slate-400 mt-0.5">Silakan sesuaikan filter pencarian atau tambahkan periode baru</p>
                  </td>
                </tr>
              ) : (
                filteredPeriods.map((period, index) => {
                  const stats = periodScheduleStats[period.id] || { total: 0, scheduled: 0, unassigned: 0, completed: 0 };
                  const isCurrentActive = period.isActive;

                  return (
                    <tr
                      key={period.id}
                      className={`hover:bg-slate-50/70 transition-colors ${
                        isCurrentActive ? 'bg-indigo-50/30' : ''
                      }`}
                    >
                      <td className="py-3.5 px-4 text-center text-xs font-mono text-slate-400">
                        {index + 1}
                      </td>

                      <td className="py-3.5 px-4 font-semibold text-slate-900">
                        <div className="flex items-center gap-2">
                          <span>{period.academicYear}</span>
                          {isCurrentActive && (
                            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                              Aktif
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-semibold ${
                          period.semester === 'Ganjil'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                        }`}>
                          {period.semester}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-xs text-slate-600">
                        {period.startDate && period.endDate ? (
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>
                              {formatIndonesianDate(period.startDate)} - {formatIndonesianDate(period.endDate)}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">Belum diatur</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${
                          period.status === 'berjalan'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : period.status === 'persiapan'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : 'bg-slate-100 text-slate-600 border border-slate-200'
                        }`}>
                          {period.status === 'berjalan' && <PlayCircle className="w-3 h-3 text-emerald-600" />}
                          {period.status === 'persiapan' && <Clock className="w-3 h-3 text-blue-600" />}
                          {period.status === 'selesai' && <Archive className="w-3 h-3 text-slate-500" />}
                          <span>{period.status}</span>
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        {isCurrentActive ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500 text-white shadow-2xs">
                            <Check className="w-3 h-3" />
                            <span>Ya</span>
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400 font-medium">Tidak</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => setDetailPeriod(period)}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200/80 text-xs font-semibold text-slate-700 transition-colors"
                          title="Klik untuk melihat rincian sidang"
                        >
                          <GraduationCap className="w-3.5 h-3.5 text-indigo-600" />
                          <span>{stats.total} Mahasiswa</span>
                        </button>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Button Detail */}
                          <button
                            onClick={() => setDetailPeriod(period)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                            title="Lihat Detail Statistik Periode"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* Button Edit (Hanya jika belum berjalan / persiapan) */}
                          {period.status === 'persiapan' ? (
                            <button
                              onClick={() => openEditModal(period)}
                              className="p-1.5 rounded-lg text-indigo-600 hover:bg-indigo-50 transition-colors"
                              title="Ubah Informasi Periode Persiapan"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                          ) : (
                            <button
                              onClick={() => openEditModal(period)}
                              className="p-1.5 rounded-lg text-slate-300 hover:text-slate-500 hover:bg-slate-100 transition-colors"
                              title="Lihat/Edit Tanggal Periode"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                          )}

                          {/* Button Aktifkan (Jika belum aktif) */}
                          {!isCurrentActive ? (
                            <button
                              onClick={() => setActivatingPeriod(period)}
                              className="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-600 text-indigo-700 hover:text-white text-xs font-semibold transition-colors flex items-center gap-1"
                              title="Aktifkan Sebagai Periode Utama"
                            >
                              <PlayCircle className="w-3.5 h-3.5" />
                              <span>Aktifkan</span>
                            </button>
                          ) : (
                            <span className="px-2 py-1 text-[11px] font-semibold text-emerald-600 flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Sedang Aktif</span>
                            </span>
                          )}

                          {/* Button Tutup (Jika belum selesai) */}
                          {period.status !== 'selesai' && (
                            <button
                              onClick={() => setClosingPeriod(period)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-amber-700 hover:bg-amber-50 transition-colors"
                              title="Tutup Periode Akademik (Arsip)"
                            >
                              <Archive className="w-4 h-4" />
                            </button>
                          )}

                          {/* Button Hapus (Hanya jika belum ada sidang dan tidak aktif) */}
                          {!isCurrentActive && stats.total === 0 && (
                            <button
                              onClick={() => setDeleteConfirmPeriod(period)}
                              className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 transition-colors"
                              title="Hapus Periode Kosong"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Modal Tambah Periode Baru ── */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="h-9 w-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <CalendarDays className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Tambah Periode Akademik</h3>
                  <p className="text-xs text-slate-500">Daftarkan tahun akademik dan semester baru</p>
                </div>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="h-8 w-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-4 pt-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Tahun Akademik <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: 2026/2027"
                    value={formData.academicYear}
                    onChange={e => setFormData({ ...formData, academicYear: e.target.value })}
                    className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                  <span className="text-[11px] text-slate-400 mt-1 block">Format: YYYY/YYYY</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Semester <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formData.semester}
                    onChange={e => setFormData({ ...formData, semester: e.target.value as 'Ganjil' | 'Genap' })}
                    className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  >
                    <option value="Ganjil">Ganjil</option>
                    <option value="Genap">Genap</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Tanggal Mulai Pelaksanaan
                  </label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Tanggal Selesai Pelaksanaan
                  </label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={e => setFormData({ ...formData, endDate: e.target.value })}
                    className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Status Awal
                </label>
                <select
                  value={formData.status}
                  onChange={e => setFormData({ ...formData, status: e.target.value as any })}
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                >
                  <option value="persiapan">Persiapan (Default)</option>
                  <option value="berjalan">Berjalan</option>
                </select>
                <span className="text-[11px] text-slate-400 mt-1 block">
                  * Periode baru dibuat dalam status non-aktif hingga diaktifkan melalui alur konfirmasi aktivasi.
                </span>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-colors"
                >
                  Simpan Periode
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal Edit Periode ── */}
      {editingPeriod && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="h-9 w-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Ubah Periode Akademik</h3>
                  <p className="text-xs text-slate-500">
                    Status saat ini: <span className="font-semibold capitalize text-indigo-600">{editingPeriod.status}</span>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setEditingPeriod(null)}
                className="h-8 w-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-4 pt-4">
              {editingPeriod.status !== 'persiapan' && (
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-800 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Informasi Kunci: </span>
                    Periode ini telah berstatus <span className="capitalize font-semibold">{editingPeriod.status}</span>. Tahun akademik dan semester terkunci untuk menjaga konsistensi database pengajuan sidang. Anda hanya dapat menyesuaikan rentang tanggal pelaksanaan.
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Tahun Akademik
                  </label>
                  <input
                    type="text"
                    disabled={editingPeriod.status !== 'persiapan'}
                    required
                    value={formData.academicYear}
                    onChange={e => setFormData({ ...formData, academicYear: e.target.value })}
                    className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Semester
                  </label>
                  <select
                    disabled={editingPeriod.status !== 'persiapan'}
                    value={formData.semester}
                    onChange={e => setFormData({ ...formData, semester: e.target.value as 'Ganjil' | 'Genap' })}
                    className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    <option value="Ganjil">Ganjil</option>
                    <option value="Genap">Genap</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Tanggal Mulai Pelaksanaan
                  </label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Tanggal Selesai Pelaksanaan
                  </label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={e => setFormData({ ...formData, endDate: e.target.value })}
                    className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingPeriod(null)}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-colors"
                >
                  Perbarui Periode
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal Konfirmasi Aktivasi Periode ── */}
      {activatingPeriod && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
                <PlayCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">Konfirmasi Aktivasi Periode</h3>
                <p className="text-xs text-slate-500">
                  Aktifkan {activatingPeriod.academicYear} {activatingPeriod.semester} sebagai Active Academic Period
                </p>
              </div>
            </div>

            <div className="space-y-3 my-4 text-sm text-slate-600">
              <p>
                Anda akan mengaktifkan periode akademik:
              </p>
              <div className="p-3 bg-indigo-50/70 rounded-xl border border-indigo-200/80">
                <div className="font-bold text-indigo-950 text-base">
                  Tahun Akademik: {activatingPeriod.academicYear} | Semester: {activatingPeriod.semester}
                </div>
                <div className="text-xs text-indigo-700 mt-1">
                  Status otomatis diubah menjadi: <span className="font-semibold uppercase">Berjalan</span>
                </div>
              </div>

              {/* Unfinished schedules warning if any */}
              {activePeriod && activePeriod.id !== activatingPeriod.id && unfinishedInCurrentActive > 0 && (
                <div className="p-3.5 bg-amber-50 rounded-xl border border-amber-300 text-amber-900 text-xs space-y-1.5">
                  <div className="flex items-center gap-1.5 font-bold text-amber-800">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>Peringatan Sidang Belum Selesai Pada Periode Aktif Lama</span>
                  </div>
                  <p>
                    Terdapat <span className="font-bold underline text-rose-700">{unfinishedInCurrentActive} mahasiswa sidang</span> pada periode sebelumnya ({activePeriod.academicYear} {activePeriod.semester}) yang belum berstatus Selesai.
                  </p>
                  <p className="text-[11px] text-amber-700">
                    Sistem akan menonaktifkan periode lama tanpa memindahkan atau menghapus data sidang tersebut. Riwayat lama tetap dapat dilihat melalui arsip laporan.
                  </p>
                </div>
              )}

              <p className="text-xs text-slate-500">
                Pengaktifan periode baru akan secara transaksional memperbarui acuan Papan Jadwal, Impor Data Sidang, dan Dashboard SIM SKRIPSI.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setActivatingPeriod(null)}
                className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmActivation}
                className="px-5 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-colors"
              >
                Konfirmasi & Aktifkan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal Konfirmasi Tutup Periode (Selesai) ── */}
      {closingPeriod && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                <Archive className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">Tutup Periode Akademik</h3>
                <p className="text-xs text-slate-500">Arsipkan periode {closingPeriod.academicYear} {closingPeriod.semester}</p>
              </div>
            </div>

            <p className="text-sm text-slate-600 mb-4">
              Apakah Anda yakin ingin menutup periode akademik ini? Status periode akan diubah menjadi <span className="font-bold text-slate-900">Selesai (Arsip)</span>.
            </p>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 space-y-1 mb-4">
              <p>• Penjadwalan baru dan drag-and-drop slot akan dinonaktifkan untuk periode ini.</p>
              <p>• Seluruh data sidang tetap tersimpan permanen dan dapat diakses untuk keperluan rekapitulasi serta laporan resmi.</p>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setClosingPeriod(null)}
                className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmClose}
                className="px-5 py-2 text-sm font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-xl shadow-xs transition-colors"
              >
                Tutup Periode
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal Detail Statistik Periode ── */}
      {detailPeriod && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="h-9 w-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <CalendarDays className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">
                    Rincian Periode {detailPeriod.academicYear} ({detailPeriod.semester})
                  </h3>
                  <p className="text-xs text-slate-500">Statistik pelaksanaan sidang skripsi mahasiswa</p>
                </div>
              </div>
              <button
                onClick={() => setDetailPeriod(null)}
                className="h-8 w-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 pt-4">
              {/* Summary Cards */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[11px] font-semibold text-slate-400 block uppercase">Status Periode</span>
                  <span className="text-sm font-bold text-slate-800 capitalize mt-0.5 block">
                    {detailPeriod.status} {detailPeriod.isActive ? '(Sedang Aktif)' : ''}
                  </span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[11px] font-semibold text-slate-400 block uppercase">Rentang Pelaksanaan</span>
                  <span className="text-xs font-semibold text-slate-700 mt-0.5 block">
                    {detailPeriod.startDate && detailPeriod.endDate
                      ? `${formatIndonesianDate(detailPeriod.startDate)} - ${formatIndonesianDate(detailPeriod.endDate)}`
                      : 'Belum ditentukan'}
                  </span>
                </div>
              </div>

              {/* Progress Bar of Submissions */}
              {(() => {
                const stats = periodScheduleStats[detailPeriod.id] || { total: 0, scheduled: 0, unassigned: 0, completed: 0 };
                return (
                  <div className="p-4 bg-slate-50/70 rounded-xl border border-slate-200 space-y-3">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                      <span>Rincian Status Sidang Mahasiswa</span>
                      <span className="text-indigo-600">{stats.total} Total Peserta</span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                        <span className="text-[11px] text-emerald-600 font-semibold block">Selesai</span>
                        <span className="text-base font-bold text-slate-800">{stats.completed}</span>
                      </div>
                      <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                        <span className="text-[11px] text-blue-600 font-semibold block">Terjadwal</span>
                        <span className="text-base font-bold text-slate-800">{stats.scheduled}</span>
                      </div>
                      <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                        <span className="text-[11px] text-amber-600 font-semibold block">Antrean</span>
                        <span className="text-base font-bold text-slate-800">{stats.unassigned}</span>
                      </div>
                    </div>
                  </div>
                );
              })()}

              <div className="text-xs text-slate-400 space-y-1">
                <div>ID Periode: <span className="font-mono text-slate-600">{detailPeriod.id}</span></div>
                {detailPeriod.createdAt && (
                  <div>Dibuat: <span className="font-mono text-slate-600">{new Date(detailPeriod.createdAt).toLocaleString('id-ID')}</span></div>
                )}
                {detailPeriod.updatedAt && (
                  <div>Terakhir Diperbarui: <span className="font-mono text-slate-600">{new Date(detailPeriod.updatedAt).toLocaleString('id-ID')}</span></div>
                )}
              </div>

              <div className="flex justify-end pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setDetailPeriod(null)}
                  className="px-5 py-2 text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal Konfirmasi Hapus Periode Kosong ── */}
      {deleteConfirmPeriod && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">Hapus Periode Akademik</h3>
                <p className="text-xs text-slate-500">Konfirmasi penghapusan data periode kosong</p>
              </div>
            </div>

            <p className="text-sm text-slate-600 mb-4">
              Apakah Anda yakin ingin menghapus periode <span className="font-bold text-slate-900">{deleteConfirmPeriod.academicYear} {deleteConfirmPeriod.semester}</span>? Tindakan ini tidak dapat dibatalkan.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDeleteConfirmPeriod(null)}
                className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-5 py-2 text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs transition-colors"
              >
                Hapus Periode
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
