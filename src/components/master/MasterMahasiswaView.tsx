import React, { useState } from 'react';
import { useSchedule } from '../../context/ScheduleContext';
import { useAuth } from '../../context/AuthContext';
import { ScheduleItem, Lecturer } from '../../types';
import { 
  GraduationCap, 
  Search, 
  Filter, 
  Upload, 
  CheckCircle2, 
  Clock, 
  Calendar, 
  Award, 
  RotateCcw, 
  Sparkles,
  BookOpen,
  KeyRound,
  Lock,
  ShieldCheck,
  UserPlus,
  Trash2
} from 'lucide-react';
import { formatIndonesianDate } from '../../utils/formatters';
import { AdminResetPasswordModal, ResetTargetUser } from '../admin/AdminResetPasswordModal';
import { DeleteStudentModal } from './DeleteStudentModal';

interface MasterMahasiswaViewProps {
  onOpenImportModal: () => void;
  onManualAssign: (item: ScheduleItem) => void;
  onAssignExaminer3: (item: ScheduleItem) => void;
}

export const MasterMahasiswaView: React.FC<MasterMahasiswaViewProps> = ({
  onOpenImportModal,
  onManualAssign,
  onAssignExaminer3,
}) => {
  const { 
    schedules, 
    lecturers, 
    rooms, 
    timeSlots, 
    unassignSchedule, 
    completeSchedule,
    deleteStudent,
    deleteStudentsBulk
  } = useSchedule();
  const { isMainAdmin } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'scheduled' | 'unassigned'>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'Skripsi' | 'Tugas Akhir'>('all');
  const [resetTarget, setResetTarget] = useState<ResetTargetUser | null>(null);
  const [deletingStudent, setDeletingStudent] = useState<ScheduleItem | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isBulkDeleteConfirmOpen, setIsBulkDeleteConfirmOpen] = useState(false);

  const lecturerMap = new Map<string, Lecturer>(lecturers.map(l => [l.id, l]));
  const roomMap = new Map(rooms.map(r => [r.id, r.name]));
  const timeSlotMap = new Map(timeSlots.map(t => [t.id, t.label]));

  const scheduledCount = schedules.filter(s => s.status === 'scheduled').length;
  const unassignedCount = schedules.filter(s => s.status === 'unassigned').length;
  const missingP3Count = schedules.filter(s => !s.examiner3Id || s.examiner3Id === '').length;

  const filteredSchedules = schedules
    .filter(item => {
      if (statusFilter !== 'all' && item.status !== statusFilter) return false;
      if (typeFilter !== 'all' && (item.thesisType || 'Skripsi') !== typeFilter) return false;
      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        const matchName = item.studentName.toLowerCase().includes(q);
        const matchNim = item.nim.includes(q);
        const matchTitle = item.thesisTitle.toLowerCase().includes(q);
        const matchP1 = (lecturerMap.get(item.examiner1Id)?.name || '').toLowerCase().includes(q);
        const matchP2 = (lecturerMap.get(item.examiner2Id)?.name || '').toLowerCase().includes(q);
        return matchName || matchNim || matchTitle || matchP1 || matchP2;
      }
      return true;
    })
    .sort((a, b) => a.nim.localeCompare(b.nim, undefined, { numeric: true }));

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(filteredSchedules.map(s => s.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleToggleSelectOne = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  return (
    <div className="space-y-6">
      
      {/* Top Header Card */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
              Data Master
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mt-1.5">
            Data Master Pengajuan Sidang Mahasiswa
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Daftar lengkap mahasiswa, judul skripsi, nilai seminar, dan status alokasi penguji 1, 2, & 3
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={onOpenImportModal}
            className="flex items-center gap-2 h-10 px-4 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 rounded-xl shadow-xs transition-colors"
          >
            <Upload className="w-4 h-4" />
            <span>Impor Data Mahasiswa (.XLSX)</span>
          </button>
        </div>
      </div>


      {/* KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-500">Total Pengajuan</span>
            <GraduationCap className="w-5 h-5 text-indigo-500" />
          </div>
          <p className="text-3xl font-bold text-slate-900 font-mono">{schedules.length}</p>
          <span className="text-xs font-medium text-slate-400 mt-1 inline-block">Mahasiswa Terdaftar</span>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-500">Sudah Terjadwal</span>
            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
          </div>
          <p className="text-3xl font-bold text-emerald-700 font-mono">{scheduledCount}</p>
          <span className="text-xs font-medium text-slate-400 mt-1 inline-block">Memiliki Ruang & Jam</span>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-500">Dalam Antrean</span>
            <Clock className="w-5 h-5 text-amber-500" />
          </div>
          <p className="text-3xl font-bold text-amber-700 font-mono">{unassignedCount}</p>
          <span className="text-xs font-medium text-slate-400 mt-1 inline-block">Menunggu Penjadwalan</span>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-500">Perlu Penguji 3</span>
            <UserPlus className="w-5 h-5 text-teal-500" />
          </div>
          <p className="text-3xl font-bold text-teal-700 font-mono">{missingP3Count}</p>
          <span className="text-xs font-medium text-slate-400 mt-1 inline-block">Belum Dipilih Admin</span>
        </div>
      </div>

      {/* Material DataGrid Container */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        
        {/* Toolbar: Search & Filters */}
        <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari NIM, nama, judul, atau dosen..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-10 text-sm pl-9 pr-3.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-xs"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400 shrink-0" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="h-10 text-sm font-semibold bg-white border border-slate-200 rounded-xl px-3 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 shadow-xs"
            >
              <option value="all">Semua Status</option>
              <option value="scheduled">Terjadwal</option>
              <option value="unassigned">Antrean</option>
            </select>

            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as any)}
              className="h-10 text-sm font-semibold bg-white border border-slate-200 rounded-xl px-3 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 shadow-xs"
            >
              <option value="all">Semua Jenis</option>
              <option value="Skripsi">Skripsi</option>
              <option value="Tugas Akhir">Tugas Akhir</option>
            </select>
          </div>
        </div>

        {/* Bulk Action Banner */}
        {selectedIds.length > 0 && (
          <div className="bg-rose-50 border border-rose-200 text-rose-900 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in duration-200 shadow-xs">
            <div className="flex items-center gap-3">
              <span className="w-8 h-8 rounded-xl bg-rose-600 text-white font-bold text-xs flex items-center justify-center font-mono">
                {selectedIds.length}
              </span>
              <div>
                <h4 className="font-bold text-sm text-rose-950">
                  {selectedIds.length} Mahasiswa Ditandai
                </h4>
                <p className="text-xs text-rose-700">
                  Pilih tindakan massal untuk data mahasiswa yang dipilih.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setSelectedIds([])}
                className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors shadow-2xs"
              >
                Batalkan Pilihan
              </button>
              <button
                type="button"
                onClick={() => setIsBulkDeleteConfirmOpen(true)}
                className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 active:bg-rose-800 rounded-xl transition-colors shadow-xs flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Hapus {selectedIds.length} Data Mahasiswa</span>
              </button>
            </div>
          </div>
        )}

        {/* DataGrid Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                <th className="px-3 py-3 text-center w-10">
                  <input
                    type="checkbox"
                    checked={filteredSchedules.length > 0 && selectedIds.length === filteredSchedules.length}
                    onChange={handleSelectAll}
                    className="w-4 h-4 rounded text-indigo-600 border-slate-300 focus:ring-indigo-500 cursor-pointer"
                    title="Pilih Semua"
                  />
                </th>
                <th className="px-3 py-3 text-center w-12 text-[11px] uppercase tracking-wider">No</th>
                <th className="px-4 py-3 min-w-[220px] text-[11px] uppercase tracking-wider">Mahasiswa & NIM</th>
                <th className="px-4 py-3 min-w-[260px] text-[11px] uppercase tracking-wider">Judul & Jenis</th>
                <th className="px-4 py-3 text-center w-24 text-[11px] uppercase tracking-wider">Nilai Sem</th>
                <th className="px-4 py-3 min-w-[260px] text-[11px] uppercase tracking-wider">Tim Penguji (P1, P2, P3)</th>
                <th className="px-4 py-3 min-w-[160px] text-[11px] uppercase tracking-wider">Status & Lokasi</th>
                <th className="px-4 py-3 text-right min-w-[160px] text-[11px] uppercase tracking-wider">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredSchedules.length > 0 ? (
                filteredSchedules.map((item, idx) => {
                  const p1 = lecturerMap.get(item.examiner1Id);
                  const p2 = lecturerMap.get(item.examiner2Id);
                  const p3 = lecturerMap.get(item.examiner3Id);
                  const isScheduled = item.status === 'scheduled';
                  const isCompleted = item.status === 'completed';
                  const isSelected = selectedIds.includes(item.id);

                  return (
                    <tr key={item.id} className={`hover:bg-indigo-50/20 transition-colors ${isSelected ? 'bg-indigo-50/40' : ''}`}>
                      <td className="px-3 py-3 text-center align-top">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelectOne(item.id)}
                          className="w-4 h-4 rounded text-indigo-600 border-slate-300 focus:ring-indigo-500 cursor-pointer mt-1"
                        />
                      </td>
                      <td className="px-3 py-3 text-center font-semibold text-slate-400 align-top text-sm">
                        {idx + 1}
                      </td>

                      {/* Student Info */}
                      <td className="px-4 py-3 align-top">
                        <div className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200/60 inline-block mb-1.5">
                          {item.nim}
                        </div>
                        <h4 className="font-bold text-slate-900 text-sm uppercase leading-snug break-words">
                          {item.studentName}
                        </h4>
                        <span className="text-xs text-slate-500 mt-0.5 block">
                          {item.studyProgram}
                        </span>
                      </td>

                      {/* Thesis Title & Type */}
                      <td className="px-4 py-3 align-top">
                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 inline-block mb-1.5">
                          {item.thesisType || 'Skripsi'}
                        </span>
                        <p className="text-sm text-slate-600 leading-snug break-words italic">
                          "{item.thesisTitle}"
                        </p>
                      </td>

                      {/* Seminar Score */}
                      <td className="px-4 py-3 align-top text-center">
                        <span className="font-mono font-bold text-sm bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-1 rounded-lg inline-block">
                          {item.seminarScore || '-'}
                        </span>
                      </td>

                      {/* Examiners List */}
                      <td className="px-4 py-3 align-top space-y-1.5">
                        <div className="flex items-start gap-1.5">
                          <span className="px-1.5 py-0.5 rounded-md bg-indigo-100 text-indigo-800 font-bold text-[10px] shrink-0 mt-0.5">P1</span>
                          <span className="text-sm font-medium text-slate-800 break-words leading-tight">
                            {p1?.name || item.reviewerName || '-'} <span className="text-[11px] font-normal text-indigo-500">(Reviewer)</span>
                          </span>
                        </div>

                        <div className="flex items-start gap-1.5">
                          <span className="px-1.5 py-0.5 rounded-md bg-sky-100 text-sky-800 font-bold text-[10px] shrink-0 mt-0.5">P2</span>
                          <span className="text-sm font-medium text-slate-800 break-words leading-tight">
                            {p2?.name || item.advisorName || '-'} <span className="text-[11px] font-normal text-sky-500">(Pembimbing)</span>
                          </span>
                        </div>

                        <div className="flex items-start gap-1.5">
                          <span className="px-1.5 py-0.5 rounded-md bg-teal-100 text-teal-800 font-bold text-[10px] shrink-0 mt-0.5">P3</span>
                          {isCompleted ? (
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-sm font-medium text-slate-800 break-words leading-tight">{p3?.name || '-'}</span>
                              <span
                                className="text-[10px] font-bold text-slate-500 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded shadow-2xs inline-flex items-center gap-1"
                                title="Sidang telah dinyatakan selesai. Data Penguji 3 tersimpan permanen dan terkunci di database."
                              >
                                <Lock className="w-2.5 h-2.5 text-slate-400" />
                                <span>Terkunci</span>
                              </span>
                            </div>
                          ) : p3 ? (
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-sm font-medium text-slate-800 break-words leading-tight">{p3.name}</span>
                              <button
                                onClick={() => onAssignExaminer3(item)}
                                className="text-[10px] font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-2 py-0.5 rounded transition-colors inline-flex items-center gap-1 shadow-2xs"
                                title="Ganti Penguji 3 jika yang bersangkutan berhalangan hadir saat sidang"
                              >
                                <RotateCcw className="w-2.5 h-2.5" />
                                <span>Ganti</span>
                              </button>
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400 italic">
                              Ditentukan saat Penjadwalan
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Status & Location */}
                      <td className="px-4 py-3 align-top">
                        {isCompleted ? (
                          <div className="space-y-1.5">
                            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 bg-emerald-100 border border-emerald-300 px-2.5 py-1 rounded-full">
                              <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
                              Selesai
                            </span>
                            <div className="text-sm font-semibold text-slate-800">
                              Ruang {roomMap.get(item.roomId || '')}
                            </div>
                            <div className="text-xs font-mono text-slate-500">
                              {timeSlotMap.get(item.timeSlotId || '')}
                            </div>
                          </div>
                        ) : isScheduled ? (
                          <div className="space-y-1.5">
                            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Terjadwal
                            </span>
                            <div className="text-sm font-semibold text-slate-800">
                              Ruang {roomMap.get(item.roomId || '')}
                            </div>
                            <div className="text-xs font-mono text-slate-500">
                              {timeSlotMap.get(item.timeSlotId || '')}
                            </div>
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full">
                            <Clock className="w-3.5 h-3.5" />
                            Antrean
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3 align-top text-right">
                        <div className="flex flex-col items-end gap-1.5">
                          {isCompleted ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg shadow-2xs">
                              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Sidang Selesai</span>
                            </span>
                          ) : isScheduled ? (
                            <div className="flex items-center gap-1 flex-wrap justify-end">
                              <button
                                onClick={() => completeSchedule(item.id)}
                                className="text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200/80 px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1 shadow-2xs active:scale-[0.98]"
                                title="Tandai sidang ini selesai (Data Penguji 3 akan terkunci permanen di database)"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />
                                <span>Selesaikan</span>
                              </button>
                              <button
                                onClick={() => unassignSchedule(item.id)}
                                className="text-xs font-semibold text-rose-600 hover:text-rose-800 hover:bg-rose-50 px-3 py-1 rounded-lg transition-colors border border-rose-200"
                                title="Kembalikan ke antrean"
                              >
                                Batalkan
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => onManualAssign(item)}
                              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 px-3 py-1.5 rounded-lg transition-colors border border-indigo-200"
                            >
                              Pilih Slot
                            </button>
                          )}

                          <div className="flex items-center gap-1 flex-wrap justify-end mt-0.5">
                            <button
                              onClick={() => setDeletingStudent(item)}
                              className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-700 hover:text-rose-800 hover:bg-rose-50 px-2.5 py-1 rounded-lg transition-colors border border-rose-200 shadow-2xs"
                              title="Hapus Data Mahasiswa Ini"
                            >
                              <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                              <span>Hapus</span>
                            </button>

                            {isMainAdmin && (
                              <button
                                onClick={() => setResetTarget({
                                  name: item.studentName,
                                  email: `${item.nim}@mahasiswa.ac.id`,
                                  nim: item.nim,
                                  roleType: 'mahasiswa',
                                })}
                                className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 hover:text-amber-800 hover:bg-amber-50 px-2.5 py-1 rounded-lg transition-colors border border-amber-200 shadow-2xs"
                                title="Reset Password Akun Mahasiswa"
                              >
                                <KeyRound className="w-3.5 h-3.5 text-amber-600" />
                                <span>Reset Sandi</span>
                              </button>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="p-10 text-center text-slate-400 text-sm">
                    Tidak ada data pengajuan sidang sesuai filter pencarian.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

      </div>

      {/* Delete Student Modal (Single) */}
      {deletingStudent && (
        <DeleteStudentModal
          isOpen={!!deletingStudent}
          onClose={() => setDeletingStudent(null)}
          student={deletingStudent}
        />
      )}

      {/* Bulk Delete Confirmation Modal */}
      {isBulkDeleteConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-600 text-white flex items-center justify-center shadow-md shadow-rose-500/20">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Hapus {selectedIds.length} Data Mahasiswa?
                </h3>
                <p className="text-xs text-rose-600 font-medium">
                  Tindakan ini tidak dapat dibatalkan
                </p>
              </div>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Anda akan menghapus <strong>{selectedIds.length}</strong> pengajuan sidang mahasiswa terpilih beserta jadwal aktif mereka di matriks. Seluruh data terkait akan dihapus dari sistem.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsBulkDeleteConfirmOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  deleteStudentsBulk(selectedIds);
                  setSelectedIds([]);
                  setIsBulkDeleteConfirmOpen(false);
                }}
                className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 active:bg-rose-800 rounded-xl transition-colors flex items-center gap-1.5 shadow-md shadow-rose-600/20"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Ya, Hapus Semua Terpilih</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Admin Reset Password Modal */}
      {resetTarget && (
        <AdminResetPasswordModal
          isOpen={!!resetTarget}
          onClose={() => setResetTarget(null)}
          targetUser={resetTarget}
        />
      )}
    </div>
  );
};

