import React, { useState, useEffect } from 'react';
import { 
  X, 
  Pencil, 
  Mail, 
  User, 
  Shield, 
  AlertCircle, 
  GraduationCap, 
  Award,
  Check
} from 'lucide-react';
import { PenggunaRecord } from '../../db/types';
import { UserRole } from '../../types';

interface EditUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updatedUser: PenggunaRecord) => void;
  user: PenggunaRecord | null;
  existingEmails: string[];
}

export const EditUserModal: React.FC<EditUserModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  user,
  existingEmails,
}) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [roleUtama, setRoleUtama] = useState<UserRole>('admin');
  const [isAlsoAdmin, setIsAlsoAdmin] = useState(false);
  const [studentNim, setStudentNim] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setName(user.nama || '');
      setEmail(user.email || '');
      setRoleUtama(user.role_utama || (user.roles[0] || 'admin'));
      setIsAlsoAdmin(user.roles.includes('admin') && user.roles.includes('dosen'));
      setStudentNim(user.student_nim || '');
      setIsActive(user.is_active !== false);
      setError(null);
    }
  }, [user]);

  if (!isOpen || !user) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedName = name.trim();
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedNim = studentNim.trim();

    // 1. Validation Name
    if (!trimmedName || trimmedName.length < 3) {
      setError('Nama lengkap pengguna wajib diisi minimal 3 karakter.');
      return;
    }

    // 2. Validation Email
    if (!trimmedEmail) {
      setError('Email login pengguna wajib diisi.');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      setError('Format email tidak valid.');
      return;
    }

    // Check email conflict with other users
    const isDuplicate = existingEmails.some(
      (e) => e.toLowerCase() === trimmedEmail && e.toLowerCase() !== user.email.toLowerCase()
    );
    if (isDuplicate) {
      setError(`Email "${trimmedEmail}" sudah digunakan oleh akun lain.`);
      return;
    }

    // 3. Mahasiswa NIM validation
    if (roleUtama === 'mahasiswa' && !trimmedNim) {
      setError('NIM mahasiswa wajib diisi untuk peran Mahasiswa.');
      return;
    }

    // Build roles array
    const roles: UserRole[] = [roleUtama];
    if (roleUtama === 'dosen' && isAlsoAdmin) {
      roles.push('admin');
    }

    const updated: PenggunaRecord = {
      ...user,
      nama: trimmedName,
      email: trimmedEmail,
      roles,
      role_utama: roleUtama,
      student_nim: roleUtama === 'mahasiswa' ? trimmedNim : user.student_nim,
      is_active: isActive,
      updated_at: new Date().toISOString(),
    };

    onSuccess(updated);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200/90 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-indigo-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-500/20">
              <Pencil className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 leading-tight">
                Edit Data Pengguna
              </h3>
              <p className="text-xs text-indigo-700 font-medium mt-0.5">
                Perbarui Identitas, Email &amp; Hak Akses Akun
              </p>
            </div>
          </div>
          
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-xs text-rose-800 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Role Selection */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 block">
              Peran Utama (Primary Role) <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { key: 'admin', label: 'Administrator', icon: Shield },
                { key: 'dosen', label: 'Dosen Penguji', icon: Award },
                { key: 'mahasiswa', label: 'Mahasiswa', icon: GraduationCap },
              ].map((r) => {
                const Icon = r.icon;
                const isSelected = roleUtama === r.key;
                return (
                  <button
                    key={r.key}
                    type="button"
                    onClick={() => setRoleUtama(r.key as UserRole)}
                    className={`p-3 rounded-2xl border text-left transition-all ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50/70 text-indigo-950 ring-2 ring-indigo-500/20'
                        : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
                    }`}
                  >
                    <Icon className={`w-4 h-4 mb-1.5 ${isSelected ? 'text-indigo-600' : 'text-slate-400'}`} />
                    <div className="font-bold text-xs">{r.label}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Multi-role for Dosen */}
          {roleUtama === 'dosen' && (
            <div className="p-3.5 rounded-2xl bg-sky-50/60 border border-sky-100 flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-sky-950">Multi-Peran: Panitia Sidang (Admin)</div>
                <div className="text-[11px] text-sky-700">Izinkan beralih peran antara Dosen dan Administrator</div>
              </div>
              <input
                type="checkbox"
                checked={isAlsoAdmin}
                onChange={(e) => setIsAlsoAdmin(e.target.checked)}
                className="w-4 h-4 rounded text-indigo-600 border-slate-300 focus:ring-indigo-500 cursor-pointer"
              />
            </div>
          )}

          {/* Student NIM if Mahasiswa */}
          {roleUtama === 'mahasiswa' && (
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">
                NIM Mahasiswa <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={studentNim}
                onChange={(e) => setStudentNim(e.target.value.replace(/\D/g, ''))}
                className="w-full h-10 px-3.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-mono"
              />
            </div>
          )}

          {/* Nama Lengkap */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 block">
              Nama Lengkap <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full h-10 pl-9 pr-3.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
          </div>

          {/* Email */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 block">
              Alamat Email (Username Login) <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-10 pl-9 pr-3.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-mono"
              />
            </div>
          </div>

          {/* Status Akun Toggle */}
          <div className="pt-2 flex items-center justify-between border-t border-slate-100">
            <div>
              <span className="text-xs font-bold text-slate-800 block">Status Akun Aktif</span>
              <span className="text-[11px] text-slate-400">Pengguna dapat login bila akun berstatus aktif</span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-10 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
            </label>
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-xl transition-all shadow-md shadow-indigo-600/20"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Simpan Perubahan</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
