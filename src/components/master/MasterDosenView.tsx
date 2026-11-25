import React, { useState } from 'react';
import { useSchedule } from '../../context/ScheduleContext';
import { useAuth } from '../../context/AuthContext';
import { 
  Users, 
  Search, 
  Filter, 
  Mail, 
  BookOpen, 
  Award, 
  Calendar, 
  CheckCircle2, 
  Clock,
  Sparkles,
  KeyRound,
  Pencil,
  Trash2,
  Plus,
  ExternalLink,
  Eye
} from 'lucide-react';
import { Lecturer } from '../../types';
import { AdminResetPasswordModal, ResetTargetUser } from '../admin/AdminResetPasswordModal';
import { EditLecturerModal } from './EditLecturerModal';
import { DeleteLecturerModal } from './DeleteLecturerModal';
import { AddLecturerModal } from './AddLecturerModal';
import { LecturerExamDetailModal } from './LecturerExamDetailModal';

export const MasterDosenView: React.FC = () => {
  const { lecturers, schedules } = useSchedule();
  const { isMainAdmin } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDept, setFilterDept] = useState('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingLecturer, setEditingLecturer] = useState<Lecturer | null>(null);
  const [deletingLecturer, setDeletingLecturer] = useState<Lecturer | null>(null);
  const [selectedDetailLecturer, setSelectedDetailLecturer] = useState<Lecturer | null>(null);
  const [resetTarget, setResetTarget] = useState<ResetTargetUser | null>(null);

  // Compute stats per lecturer (termasuk status scheduled dan completed)
  const lecturerStats = lecturers.map(lec => {
    const isAssigned = (s: any) => s.status === 'scheduled' || s.status === 'completed';
    const assignedAsP1 = schedules.filter(s => isAssigned(s) && s.examiner1Id === lec.id).length;
    const assignedAsP2 = schedules.filter(s => isAssigned(s) && s.examiner2Id === lec.id).length;
    const assignedAsP3 = schedules.filter(s => isAssigned(s) && s.examiner3Id === lec.id).length;
    const totalAssigned = assignedAsP1 + assignedAsP2 + assignedAsP3;

    return {
      ...lec,
      assignedAsP1,
      assignedAsP2,
      assignedAsP3,
      totalAssigned,
    };
  });

  const departments = Array.from(new Set(lecturers.map(l => l.department)));

  const filteredLecturers = lecturerStats.filter(lec => {
    if (filterDept !== 'all' && lec.department !== filterDept) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      const matchName = lec.name.toLowerCase().includes(q);
      const matchNidn = lec.nidn.includes(q);
      const matchCode = lec.code.toLowerCase().includes(q);
      return matchName || matchNidn || matchCode;
    }
    return true;
  });

  const totalAssignedSessions = schedules.filter(s => s.status === 'scheduled').length;
  const avgWorkload = (lecturerStats.reduce((acc, curr) => acc + curr.totalAssigned, 0) / (lecturers.length || 1)).toFixed(1);

  return (
    <div className="space-y-6">
      {/* Main page content - hidden when modal is printed */}
      <div className="space-y-6 print:hidden">
        {/* Top Header Card */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
              Data Master
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mt-1.5">
            Data Master Dosen Penguji Sidang
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Daftar lengkap dosen pembimbing dan reviewer beserta statistik beban menguji sidang skripsi
          </p>
        </div>

        <div className="flex items-center gap-4 shrink-0">
          <div className="text-right">
            <span className="text-xs text-slate-400 font-medium block">Total Dosen</span>
            <span className="text-2xl font-bold text-indigo-700 font-mono">{lecturers.length} Orang</span>
          </div>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 h-10 px-4 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-xl shadow-xs transition-colors shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Dosen</span>
          </button>
        </div>
      </div>

      {/* KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-500">Total Dosen Terdaftar</span>
            <Users className="w-5 h-5 text-indigo-500" />
          </div>
          <p className="text-3xl font-bold text-slate-900 font-mono">{lecturers.length}</p>
          <span className="text-xs font-medium text-slate-400 mt-1 inline-block">Teknik Informatika & Sistem Informasi</span>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-500">Rata-rata Beban Sidang</span>
            <Award className="w-5 h-5 text-emerald-500" />
          </div>
          <p className="text-3xl font-bold text-emerald-700 font-mono">{avgWorkload}</p>
          <span className="text-xs font-medium text-slate-400 mt-1 inline-block">Sidang per Dosen Penguji</span>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-500">Total Alokasi Pengujian</span>
            <Clock className="w-5 h-5 text-sky-500" />
          </div>
          <p className="text-3xl font-bold text-sky-700 font-mono">{totalAssignedSessions * 3}</p>
          <span className="text-xs font-medium text-slate-400 mt-1 inline-block">Slot Tugas (P1, P2, P3)</span>
        </div>
      </div>

      {/* Material DataGrid Container */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        
        {/* Toolbar: Search & Filter */}
        <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari nama dosen, NIDN, atau kode..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-10 text-sm pl-9 pr-3.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-xs"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400 shrink-0" />
            <select
              value={filterDept}
              onChange={(e) => setFilterDept(e.target.value)}
              className="h-10 text-sm font-semibold bg-white border border-slate-200 rounded-xl px-3 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 shadow-xs"
            >
              <option value="all">Semua Program Studi</option>
              {departments.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
        </div>

        {/* DataGrid Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                <th className="px-4 py-3 text-center w-12 text-[11px] uppercase tracking-wider">No</th>
                <th className="px-4 py-3 min-w-[260px] text-[11px] uppercase tracking-wider">Nama Lengkap &amp; NIDN</th>
                <th className="px-4 py-3 min-w-[200px] text-[11px] uppercase tracking-wider">Program Studi &amp; Email</th>
                <th className="px-4 py-3 min-w-[220px] text-[11px] uppercase tracking-wider">Beban Menguji Sidang</th>
                <th className="px-4 py-3 text-center w-32 text-[11px] uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-right min-w-[270px] text-[11px] uppercase tracking-wider">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLecturers.length > 0 ? (
                filteredLecturers.map((lec, idx) => (
                  <tr key={lec.id} className="hover:bg-indigo-50/20 transition-colors">
                    <td className="px-4 py-3 text-center font-semibold text-slate-400 text-sm">
                      {idx + 1}
                    </td>

                    {/* Lecturer Profile */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => setSelectedDetailLecturer(lec)}
                          className="focus:outline-none focus:ring-2 focus:ring-indigo-500/30 rounded-xl transition-transform hover:scale-105 shrink-0 cursor-pointer"
                          title="Klik untuk melihat detail penugasan ujian dosen ini"
                        >
                          {lec.photoUrl ? (
                            <img
                              src={lec.photoUrl}
                              alt={lec.name}
                              className="w-9 h-9 rounded-xl object-cover shrink-0 shadow-xs border border-slate-200"
                            />
                          ) : (
                            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-sm font-mono">
                              {lec.code}
                            </div>
                          )}
                        </button>
                        <div className="min-w-0">
                          <button
                            type="button"
                            onClick={() => setSelectedDetailLecturer(lec)}
                            className="group flex items-center gap-1.5 text-left font-bold text-slate-900 hover:text-indigo-600 transition-colors text-sm leading-snug cursor-pointer"
                            title="Klik untuk melihat detail penugasan ujian dosen ini"
                          >
                            <span className="group-hover:underline underline-offset-2 decoration-indigo-300">
                              {lec.name}
                            </span>
                            <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-600 transition-colors shrink-0" />
                          </button>
                          <span className="font-mono text-xs text-slate-500 font-medium">
                            NIDN: {lec.nidn}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Department & Email */}
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-800 text-sm">{lec.department}</div>
                      <div className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                        <Mail className="w-3.5 h-3.5 text-slate-400" />
                        <span>{lec.email}</span>
                      </div>
                    </td>

                    {/* Workload breakdown */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-mono font-bold text-xs px-2.5 py-1 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200">
                          {lec.totalAssigned} Total
                        </span>
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-800" title="Ketua Penguji (P1)">
                          P1: {lec.assignedAsP1}
                        </span>
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-sky-100 text-sky-800" title="Penguji 2 (P2)">
                          P2: {lec.assignedAsP2}
                        </span>
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-teal-100 text-teal-800" title="Penguji 3 (P3)">
                          P3: {lec.assignedAsP3}
                        </span>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        Aktif
                      </span>
                    </td>

                    {/* Actions (Detail, Edit, Hapus, Reset Sandi) */}
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* 0. Detail Penugasan Ujian */}
                        <button
                          type="button"
                          onClick={() => setSelectedDetailLecturer(lec)}
                          className="inline-flex items-center gap-1.5 h-8 px-2.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 hover:text-indigo-700 border border-slate-200 rounded-lg transition-colors shadow-2xs"
                          title="Lihat Detail Penugasan Ujian Dosen Ini"
                        >
                          <Eye className="w-3.5 h-3.5 text-indigo-600" />
                          <span>Detail</span>
                        </button>

                        {/* 1. Edit */}
                        <button
                          onClick={() => setEditingLecturer(lec)}
                          className="inline-flex items-center gap-1.5 h-8 px-2.5 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg transition-colors shadow-2xs"
                          title="Edit NIDN, Nama, Program Studi, dan Email Dosen"
                        >
                          <Pencil className="w-3.5 h-3.5 text-indigo-600" />
                          <span>Edit</span>
                        </button>

                        {/* 2. Hapus */}
                        <button
                          onClick={() => setDeletingLecturer(lec)}
                          className="inline-flex items-center gap-1.5 h-8 px-2.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors shadow-2xs"
                          title="Hapus Dosen dari Master Data"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                          <span>Hapus</span>
                        </button>

                        {/* 3. Reset Sandi */}
                        <button
                          onClick={() => setResetTarget({
                            name: lec.name,
                            email: lec.email,
                            roleType: 'dosen',
                          })}
                          className="inline-flex items-center gap-1.5 h-8 px-2.5 text-xs font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg transition-colors shadow-2xs"
                          title="Reset Password Akun Dosen"
                        >
                          <KeyRound className="w-3.5 h-3.5 text-amber-600" />
                          <span>Reset Sandi</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="p-10 text-center text-slate-400 text-sm">
                    Tidak ada data dosen sesuai filter pencarian.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

      </div>
    </div>

      {/* Add Lecturer Modal */}
      <AddLecturerModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
      />

      {/* Edit Lecturer Modal */}
      {editingLecturer && (
        <EditLecturerModal
          isOpen={!!editingLecturer}
          onClose={() => setEditingLecturer(null)}
          lecturer={editingLecturer}
        />
      )}

      {/* Delete Lecturer Modal */}
      {deletingLecturer && (
        <DeleteLecturerModal
          isOpen={!!deletingLecturer}
          onClose={() => setDeletingLecturer(null)}
          lecturer={deletingLecturer}
        />
      )}

      {/* Admin Reset Password Modal */}
      {resetTarget && (
        <AdminResetPasswordModal
          isOpen={!!resetTarget}
          onClose={() => setResetTarget(null)}
          targetUser={resetTarget}
        />
      )}

      {/* Lecturer Exam Detail Modal */}
      {selectedDetailLecturer && (
        <LecturerExamDetailModal
          isOpen={!!selectedDetailLecturer}
          onClose={() => setSelectedDetailLecturer(null)}
          lecturer={selectedDetailLecturer}
        />
      )}
    </div>
  );
};

