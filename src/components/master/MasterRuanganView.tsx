import React, { useState, useMemo } from 'react';
import { useSchedule } from '../../context/ScheduleContext';
import { Room } from '../../types';
import { 
  Building2, 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  Users, 
  CheckCircle2, 
  AlertTriangle,
  X,
  Layers,
  DoorOpen,
  Calendar
} from 'lucide-react';

export const MasterRuanganView: React.FC = () => {
  const { rooms, schedules, addRoom, updateRoom, deleteRoom, addToast } = useSchedule();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [buildingFilter, setBuildingFilter] = useState('ALL');
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    building: '',
    floor: '',
    capacity: 10
  });

  // Calculate usage stats
  const roomUsageStats = useMemo(() => {
    const stats: Record<string, number> = {};
    schedules.forEach(s => {
      if (s.roomId) {
        stats[s.roomId] = (stats[s.roomId] || 0) + 1;
      }
    });
    return stats;
  }, [schedules]);

  // Unique buildings
  const buildings = useMemo(() => {
    return Array.from(new Set(rooms.map(r => r.building))).filter(Boolean);
  }, [rooms]);

  // Filtered rooms
  const filteredRooms = useMemo(() => {
    return rooms.filter(room => {
      const matchesSearch = 
        room.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        room.building.toLowerCase().includes(searchQuery.toLowerCase()) ||
        room.floor.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesBuilding = buildingFilter === 'ALL' || room.building === buildingFilter;

      return matchesSearch && matchesBuilding;
    });
  }, [rooms, searchQuery, buildingFilter]);

  const openCreateModal = () => {
    setEditingRoom(null);
    setFormData({
      name: '',
      building: buildings[0] || 'Gedung Utama',
      floor: 'Lantai 4',
      capacity: 12
    });
    setIsModalOpen(true);
  };

  const openEditModal = (room: Room) => {
    setEditingRoom(room);
    setFormData({
      name: room.name,
      building: room.building,
      floor: room.floor,
      capacity: room.capacity
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      addToast('warning', 'Validasi Gagal', 'Nama ruangan wajib diisi');
      return;
    }

    if (editingRoom) {
      updateRoom(editingRoom.id, {
        name: formData.name.trim().toUpperCase(),
        building: formData.building.trim(),
        floor: formData.floor.trim(),
        capacity: Number(formData.capacity) || 10
      });
      addToast('success', 'Berhasil Diperbarui', `Ruangan ${formData.name} berhasil diperbarui`);
    } else {
      addRoom({
        name: formData.name.trim().toUpperCase(),
        building: formData.building.trim(),
        floor: formData.floor.trim(),
        capacity: Number(formData.capacity) || 10
      });
      addToast('success', 'Berhasil Ditambahkan', `Ruangan ${formData.name} berhasil ditambahkan`);
    }

    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    const usageCount = roomUsageStats[id] || 0;
    if (usageCount > 0) {
      addToast(
        'error', 
        'Ruangan Tidak Dapat Dihapus', 
        `Terdapat ${usageCount} sidang yang telah dijadwalkan pada ruangan ini. Batalkan jadwal terlebih dahulu.`
      );
      setDeleteConfirmId(null);
      return;
    }

    deleteRoom(id);
    addToast('info', 'Ruangan Dihapus', 'Data ruangan telah dihapus dari sistem');
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
            Master Data Ruangan Sidang
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Kelola daftar lokasi, gedung, dan kapasitas ruangan sidang skripsi
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 h-10 px-4 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Ruangan Baru</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-500">Total Ruangan</span>
            <DoorOpen className="w-5 h-5 text-indigo-500" />
          </div>
          <p className="text-3xl font-bold text-slate-900 font-mono">{rooms.length}</p>
          <span className="text-xs font-medium text-slate-400 mt-1 inline-block">Ruangan Terdaftar</span>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-500">Ruangan Aktif</span>
            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
          </div>
          <p className="text-3xl font-bold text-emerald-700 font-mono">
            {Object.keys(roomUsageStats).length}
          </p>
          <span className="text-xs font-medium text-slate-400 mt-1 inline-block">Digunakan Jadwal Sidang</span>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-500">Jumlah Gedung</span>
            <Layers className="w-5 h-5 text-amber-500" />
          </div>
          <p className="text-3xl font-bold text-amber-700 font-mono">{buildings.length}</p>
          <span className="text-xs font-medium text-slate-400 mt-1 inline-block">Lokasi Gedung Perkuliahan</span>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-500">Total Sidang Terjadwal</span>
            <Calendar className="w-5 h-5 text-sky-500" />
          </div>
          <p className="text-3xl font-bold text-sky-700 font-mono">
            {schedules.filter(s => s.roomId).length}
          </p>
          <span className="text-xs font-medium text-slate-400 mt-1 inline-block">Sesi Sidang Dialokasikan</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari kode/nama ruangan, gedung, lantai..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-9 text-sm pl-9 pr-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-sm"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-slate-500 whitespace-nowrap">Filter Gedung:</span>
            <select
              value={buildingFilter}
              onChange={(e) => setBuildingFilter(e.target.value)}
              className="h-9 text-sm font-medium bg-white border border-slate-200 rounded-xl px-3 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="ALL">Semua Gedung ({rooms.length})</option>
              {buildings.map(b => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Material DataGrid */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                <th className="px-4 py-3 text-[11px] uppercase tracking-wider">Kode / Nama Ruangan</th>
                <th className="px-4 py-3 text-[11px] uppercase tracking-wider">Lokasi & Gedung</th>
                <th className="px-4 py-3 text-[11px] uppercase tracking-wider">Lantai</th>
                <th className="px-4 py-3 text-[11px] uppercase tracking-wider">Kapasitas</th>
                <th className="px-4 py-3 text-[11px] uppercase tracking-wider">Sesi Terjadwal</th>
                <th className="px-4 py-3 text-right text-[11px] uppercase tracking-wider">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRooms.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-slate-400 text-sm">
                    <DoorOpen className="w-10 h-10 mx-auto mb-2 text-slate-300 stroke-[1.5]" />
                    <p className="font-semibold text-slate-600">Tidak ada ruangan yang cocok</p>
                    <p className="text-xs text-slate-400 mt-1">Coba sesuaikan kata kunci pencarian atau filter gedung</p>
                  </td>
                </tr>
              ) : (
                filteredRooms.map((room) => {
                  const usageCount = roomUsageStats[room.id] || 0;
                  return (
                    <tr key={room.id} className="hover:bg-indigo-50/20 transition-colors">
                      <td className="px-4 py-3 font-semibold text-slate-900">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-700 font-bold flex items-center justify-center text-xs tracking-wider border border-indigo-200">
                            {room.name.slice(0, 3)}
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 text-sm">{room.name}</span>
                            <span className="block text-xs text-slate-400 font-normal">Ruangan Sidang</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-medium">
                          <Building2 className="w-3.5 h-3.5 text-slate-400" />
                          {room.building}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-slate-600 font-medium text-sm">{room.floor}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1.5 text-slate-600 text-xs font-semibold">
                          <Users className="w-3.5 h-3.5 text-slate-400" />
                          {room.capacity} Peserta
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                          usageCount > 0 
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                            : 'bg-slate-100 text-slate-500'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${usageCount > 0 ? 'bg-emerald-500' : 'bg-slate-400'}`}></span>
                          {usageCount} Jadwal Sesi
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openEditModal(room)}
                            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                            title="Edit Ruangan"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteConfirmId(room.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Hapus Ruangan"
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

      {/* Modal Tambah / Edit Ruangan */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-200/90 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-slate-50/50">
              <h3 className="font-bold text-slate-900 text-base sm:text-lg">
                {editingRoom ? 'Edit Data Ruangan' : 'Tambah Ruangan Baru'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-9 h-9 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">
                  Nama / Kode Ruangan *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: R6028, LAB 6, R4417"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 uppercase"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">
                  Gedung
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Gedung 6, Rektorat Baru"
                  value={formData.building}
                  onChange={(e) => setFormData({ ...formData, building: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">
                    Lantai
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Lantai 4"
                    value={formData.floor}
                    onChange={(e) => setFormData({ ...formData, floor: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">
                    Kapasitas (Orang)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={formData.capacity}
                    onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) || 10 })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                  />
                </div>
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
                  className="m3-btn-primary"
                >
                  {editingRoom ? 'Simpan Perubahan' : 'Tambahkan Ruangan'}
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
              <h3 className="text-lg font-bold text-slate-900">Hapus Ruangan Sidang?</h3>
              <p className="text-sm text-slate-500 mt-1">
                Apakah Anda yakin ingin menghapus ruangan ini? Tindakan ini tidak dapat dibatalkan jika ruangan tidak memiliki jadwal aktif.
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
                Ya, Hapus Ruangan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

