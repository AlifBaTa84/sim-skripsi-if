import React, { useState, useMemo } from 'react';
import { useSchedule } from '../../context/ScheduleContext';
import { TimeSlot } from '../../types';
import { 
  Clock, 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  AlertTriangle,
  X,
  Timer,
  CheckCircle2,
  CalendarCheck
} from 'lucide-react';

export const MasterSlotWaktuView: React.FC = () => {
  const { timeSlots, schedules, addTimeSlot, updateTimeSlot, deleteTimeSlot, addToast } = useSchedule();
  
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSlot, setEditingSlot] = useState<TimeSlot | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    startTime: '08:00',
    endTime: '09:15',
    label: ''
  });

  // Calculate usage stats per slot
  const slotUsageStats = useMemo(() => {
    const stats: Record<string, number> = {};
    schedules.forEach(s => {
      if (s.timeSlotId) {
        stats[s.timeSlotId] = (stats[s.timeSlotId] || 0) + 1;
      }
    });
    return stats;
  }, [schedules]);

  // Duration calculator in minutes
  const calculateDuration = (start: string, end: string) => {
    try {
      const [sh, sm] = start.split(':').map(Number);
      const [eh, em] = end.split(':').map(Number);
      const diff = (eh * 60 + em) - (sh * 60 + sm);
      return diff > 0 ? diff : 75;
    } catch {
      return 75;
    }
  };

  // Filtered slots sorted chronologically
  const sortedAndFilteredSlots = useMemo(() => {
    return timeSlots
      .filter(slot => 
        slot.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        slot.startTime.includes(searchQuery) ||
        slot.endTime.includes(searchQuery)
      )
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  }, [timeSlots, searchQuery]);

  const openCreateModal = () => {
    setEditingSlot(null);
    setFormData({
      startTime: '14:30',
      endTime: '15:45',
      label: '14.30 - 15.45'
    });
    setIsModalOpen(true);
  };

  const openEditModal = (slot: TimeSlot) => {
    setEditingSlot(slot);
    setFormData({
      startTime: slot.startTime,
      endTime: slot.endTime,
      label: slot.label
    });
    setIsModalOpen(true);
  };

  const handleTimeChange = (type: 'start' | 'end', val: string) => {
    const nextStart = type === 'start' ? val : formData.startTime;
    const nextEnd = type === 'end' ? val : formData.endTime;
    const autoLabel = `${nextStart.replace(':', '.')} - ${nextEnd.replace(':', '.')}`;
    
    setFormData({
      startTime: nextStart,
      endTime: nextEnd,
      label: autoLabel
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.startTime || !formData.endTime) {
      addToast('warning', 'Validasi Gagal', 'Jam mulai dan jam selesai wajib diisi');
      return;
    }

    if (formData.startTime >= formData.endTime) {
      addToast('error', 'Waktu Tidak Valid', 'Jam mulai harus lebih awal daripada jam selesai');
      return;
    }

    const finalLabel = formData.label.trim() || `${formData.startTime.replace(':', '.')} - ${formData.endTime.replace(':', '.')}`;

    if (editingSlot) {
      updateTimeSlot(editingSlot.id, {
        startTime: formData.startTime,
        endTime: formData.endTime,
        label: finalLabel
      });
      addToast('success', 'Berhasil Diperbarui', `Slot waktu ${finalLabel} berhasil diperbarui`);
    } else {
      addTimeSlot({
        startTime: formData.startTime,
        endTime: formData.endTime,
        label: finalLabel
      });
      addToast('success', 'Berhasil Ditambahkan', `Slot waktu ${finalLabel} berhasil ditambahkan`);
    }

    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    const usageCount = slotUsageStats[id] || 0;
    if (usageCount > 0) {
      addToast(
        'error', 
        'Slot Waktu Tidak Dapat Dihapus', 
        `Terdapat ${usageCount} sidang yang telah dijadwalkan pada slot waktu ini. Pindahkan jadwal terlebih dahulu.`
      );
      setDeleteConfirmId(null);
      return;
    }

    deleteTimeSlot(id);
    addToast('info', 'Slot Waktu Dihapus', 'Data slot waktu telah dihapus dari sistem');
    setDeleteConfirmId(null);
  };

  return (
    <div className="space-y-6">
      {/* Header & Page Title */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
              Data Master
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mt-1.5">
            Master Data Slot Waktu
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Kelola jam sesi sidang skripsi, durasi pengujian, dan alokasi waktu matriks
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 h-10 px-4 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Slot Waktu Baru</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-500">Total Slot Waktu</span>
            <Clock className="w-5 h-5 text-indigo-500" />
          </div>
          <p className="text-3xl font-bold text-slate-900 font-mono">{timeSlots.length}</p>
          <span className="text-xs font-medium text-slate-400 mt-1 inline-block">Sesi Sidang Tersedia</span>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-500">Standar Durasi</span>
            <Timer className="w-5 h-5 text-indigo-500" />
          </div>
          <p className="text-3xl font-bold text-indigo-700 font-mono">75</p>
          <span className="text-xs font-medium text-slate-400 mt-1 inline-block">Menit per Sesi Sidang</span>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-500">Slot Aktif</span>
            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
          </div>
          <p className="text-3xl font-bold text-emerald-700 font-mono">
            {Object.keys(slotUsageStats).length}
          </p>
          <span className="text-xs font-medium text-slate-400 mt-1 inline-block">Digunakan Penjadwalan</span>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-500">Total Sidang Terisi</span>
            <CalendarCheck className="w-5 h-5 text-sky-500" />
          </div>
          <p className="text-3xl font-bold text-sky-700 font-mono">
            {schedules.filter(s => s.timeSlotId).length}
          </p>
          <span className="text-xs font-medium text-slate-400 mt-1 inline-block">Sesi Mahasiswa Terjadwal</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari slot waktu (misal: 09.15, 13.00)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-9 text-sm pl-9 pr-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-sm"
            />
          </div>
        </div>

        {/* Material DataGrid */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                <th className="px-4 py-3 text-[11px] uppercase tracking-wider">Label Slot Sesi</th>
                <th className="px-4 py-3 text-[11px] uppercase tracking-wider">Jam Mulai</th>
                <th className="px-4 py-3 text-[11px] uppercase tracking-wider">Jam Selesai</th>
                <th className="px-4 py-3 text-[11px] uppercase tracking-wider">Durasi Ujian</th>
                <th className="px-4 py-3 text-[11px] uppercase tracking-wider">Sidang Terjadwal</th>
                <th className="px-4 py-3 text-right text-[11px] uppercase tracking-wider">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sortedAndFilteredSlots.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-slate-400 text-sm">
                    <Clock className="w-10 h-10 mx-auto mb-2 text-slate-300 stroke-[1.5]" />
                    <p className="font-semibold text-slate-600">Tidak ada slot waktu ditemukan</p>
                    <p className="text-xs text-slate-400 mt-1">Gunakan tombol "Tambah Slot Waktu Baru" untuk menambahkan slot jadwal</p>
                  </td>
                </tr>
              ) : (
                sortedAndFilteredSlots.map((slot, index) => {
                  const usageCount = slotUsageStats[slot.id] || 0;
                  const duration = calculateDuration(slot.startTime, slot.endTime);
                  return (
                    <tr key={slot.id} className="hover:bg-indigo-50/20 transition-colors">
                      <td className="px-4 py-3 font-semibold text-slate-900">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-700 font-bold flex items-center justify-center text-xs tracking-wider border border-indigo-200">
                            S{index + 1}
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 text-sm">{slot.label}</span>
                            <span className="block text-xs text-slate-400 font-normal">Sesi Sidang ke-{index + 1}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-200">
                          {slot.startTime} WIB
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-50 text-rose-700 text-xs font-semibold border border-rose-200">
                          {slot.endTime} WIB
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1.5 text-slate-700 text-xs font-semibold">
                          <Timer className="w-3.5 h-3.5 text-indigo-500" />
                          {duration} Menit
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                          usageCount > 0 
                            ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' 
                            : 'bg-slate-100 text-slate-500'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${usageCount > 0 ? 'bg-indigo-500' : 'bg-slate-400'}`}></span>
                          {usageCount} Mahasiswa
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openEditModal(slot)}
                            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                            title="Edit Slot Waktu"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteConfirmId(slot.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Hapus Slot Waktu"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
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

      {/* Modal Tambah / Edit Slot Waktu */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-200/90 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-slate-50/50">
              <h3 className="font-bold text-slate-900 text-base sm:text-lg">
                {editingSlot ? 'Edit Slot Waktu' : 'Tambah Slot Waktu Baru'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-9 h-9 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">
                    Jam Mulai *
                  </label>
                  <input
                    type="time"
                    required
                    value={formData.startTime}
                    onChange={(e) => handleTimeChange('start', e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">
                    Jam Selesai *
                  </label>
                  <input
                    type="time"
                    required
                    value={formData.endTime}
                    onChange={(e) => handleTimeChange('end', e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">
                  Format Label Tampilan
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: 09.15 - 10.30"
                  value={formData.label}
                  onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600"
                />
                <p className="text-[11px] text-slate-400 mt-1">Label ini akan ditampilkan pada baris Y-Axis matriks penjadwalan.</p>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-200/80">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="h-10 px-4 text-sm font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-xl transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center justify-center h-10 px-5 text-sm font-semibold bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white rounded-xl shadow-xs transition-all"
                >
                  {editingSlot ? 'Simpan Perubahan' : 'Tambahkan Slot'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-200/90 p-6 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="text-center">
              <h3 className="text-lg font-bold text-slate-900">Hapus Slot Waktu?</h3>
              <p className="text-sm text-slate-500 mt-1">
                Apakah Anda yakin ingin menghapus slot waktu ini? Jika ada jadwal yang terisi pada slot ini, penghapusan akan ditolak demi keamanan data.
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="h-10 px-4 text-sm font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-xl transition-colors"
              >
                Batal
              </button>
              <button
                onClick={() => handleDelete(deleteConfirmId)}
                className="inline-flex items-center justify-center h-10 px-5 text-sm font-semibold bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white rounded-xl shadow-xs transition-all"
              >
                Ya, Hapus Slot
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

