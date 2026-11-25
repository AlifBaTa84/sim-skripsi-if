import React, { useState } from 'react';
import { 
  X, 
  UserPlus, 
  Mail, 
  User, 
  Lock, 
  Eye, 
  EyeOff, 
  Shield, 
  AlertCircle, 
  CheckCircle2, 
  GraduationCap, 
  Award,
  Check
} from 'lucide-react';
import { PenggunaRecord } from '../../db/types';
import { Lecturer, UserRole } from '../../types';
import { validatePassword } from '../../utils/authValidator';

interface AddUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newUser: PenggunaRecord, rawPassword?: string) => void;
  existingEmails: string[];
  lecturers: Lecturer[];
}

export const AddUserModal: React.FC<AddUserModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  existingEmails,
  lecturers,
}) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [roleUtama, setRoleUtama] = useState<UserRole>('admin');
  const [isAlsoAdmin, setIsAlsoAdmin] = useState(false); // Multi-role for lecturer
  const [studentNim, setStudentNim] = useState('');
  const [selectedLecturerId, setSelectedLecturerId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  // Live password validation
  const pwdCheck = validatePassword(password);

  const resetForm = () => {
    setName('');
    setEmail('');
    setRoleUtama('admin');
    setIsAlsoAdmin(false);
    setStudentNim('');
    setSelectedLecturerId('');
    setPassword('');
    setShowPassword(false);
    setIsActive(true);
    setError(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  // If lecturer selected from dropdown, autofill name & email
  const handleSelectLecturer = (lecId: string) => {
    setSelectedLecturerId(lecId);
    const lec = lecturers.find((l) => l.id === lecId);
    if (lec) {
      if (!name) setName(lec.name);
      if (!email) setEmail(lec.email);
    }
  };

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
      setError('Format email tidak valid. Gunakan format yang benar (contoh: user@institusi.ac.id).');
      return;
    }
    if (existingEmails.some((e) => e.toLowerCase() === trimmedEmail)) {
      setError(`Email "${trimmedEmail}" sudah terdaftar pada akun lain. Gunakan email berbeda.`);
      return;
    }

    // 3. Role-specific validation
    if (roleUtama === 'mahasiswa' && !trimmedNim) {
      setError('Nomor Induk Mahasiswa (NIM) wajib diisi untuk role Mahasiswa.');
      return;
    }

    // 4. Password validation
    if (!pwdCheck.isValid) {
      setError(`Kebijakan Keamanan Password: ${pwdCheck.errors.join(', ')}.`);
      return;
    }

    // Build roles array
    const roles: UserRole[] = [roleUtama];
    if (roleUtama === 'dosen' && isAlsoAdmin) {
      roles.push('admin');
    }

    const now = new Date().toISOString();
    const newUser: PenggunaRecord = {
      id: `usr-${Date.now()}`,
      email: trimmedEmail,
      nama: trimmedName,
      roles,
      role_utama: roleUtama,
      password_hash: password,
      password_required: true,
      lecturer_id: roleUtama === 'dosen' ? selectedLecturerId || undefined : undefined,
      student_nim: roleUtama === 'mahasiswa' ? trimmedNim : undefined,
      is_active: isActive,
      created_at: now,
      updated_at: now,
    };

    onSuccess(newUser, password);
    handleClose();
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
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 leading-tight">
                Tambah Akun Pengguna Baru
              </h3>
              <p className="text-xs text-indigo-700 font-medium mt-0.5">
                Pendaftaran Kredensial &amp; Hak Akses Peran Sistem
              </p>
            </div>
          </div>
          
          <button
            onClick={handleClose}
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
                { key: 'admin', label: 'Administrator', icon: Shield, desc: 'Akses Penuh' },
                { key: 'dosen', label: 'Dosen Penguji', icon: Award, desc: 'Penguji/Pembimbing' },
                { key: 'mahasiswa', label: 'Mahasiswa', icon: GraduationCap, desc: 'Peserta Sidang' },
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
                    <div className="text-[10px] text-slate-400 mt-0.5">{r.desc}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* If Dosen: option to toggle multi-role Admin or link to existing lecturer */}
          {roleUtama === 'dosen' && (
            <div className="p-3.5 rounded-2xl bg-sky-50/60 border border-sky-100 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-sky-950">Multi-Peran: Panitia Sidang (Admin)</div>
                  <div className="text-[11px] text-sky-700">Izinkan dosen ini beralih peran ke Administrator Panitia</div>
                </div>
                <input
                  type="checkbox"
                  id="multi-role-admin"
                  checked={isAlsoAdmin}
                  onChange={(e) => setIsAlsoAdmin(e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600 border-slate-300 focus:ring-indigo-500 cursor-pointer"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-sky-900 block mb-1">
                  Tautkan ke Master Data Dosen (Opsional)
                </label>
                <select
                  value={selectedLecturerId}
                  onChange={(e) => handleSelectLecturer(e.target.value)}
                  className="w-full text-xs bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                >
                  <option value="">-- Pilih Dosen Terdaftar --</option>
                  {lecturers.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name} ({l.code} - NIDN: {l.nidn})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* If Mahasiswa: input student NIM */}
          {roleUtama === 'mahasiswa' && (
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">
                NIM Mahasiswa <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                placeholder="Contoh: 10120262"
                value={studentNim}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '');
                  setStudentNim(val);
                  if (!email || email.includes('@mahasiswa.ac.id')) {
                    setEmail(val ? `${val}@mahasiswa.ac.id` : '');
                  }
                }}
                className="w-full h-10 px-3.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-mono"
              />
            </div>
          )}

          {/* Nama Lengkap */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 block">
              Nama Lengkap Pengguna <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Contoh: Dian Dharmayanti, S.T., M.Kom."
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full h-10 pl-9 pr-3.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Email Login */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 block">
              Alamat Email (Username Login) <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="email"
                placeholder="user@institusi.ac.id"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-10 pl-9 pr-3.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-mono"
              />
            </div>
          </div>

          {/* Kata Sandi Awal */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 block">
              Kata Sandi Awal (Password) <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Minimal 8 karakter (A-Z, a-z, simbol)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full h-10 pl-9 pr-10 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-mono"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {/* Password Validation Indicators */}
            {password && (
              <div className="grid grid-cols-2 gap-1.5 pt-1 text-[10.5px]">
                <div className={`flex items-center gap-1.5 ${pwdCheck.hasMinLength ? 'text-emerald-700' : 'text-slate-400'}`}>
                  <Check className={`w-3.5 h-3.5 ${pwdCheck.hasMinLength ? 'text-emerald-600' : 'text-slate-300'}`} />
                  <span>Min. 8 karakter</span>
                </div>
                <div className={`flex items-center gap-1.5 ${pwdCheck.hasUppercase ? 'text-emerald-700' : 'text-slate-400'}`}>
                  <Check className={`w-3.5 h-3.5 ${pwdCheck.hasUppercase ? 'text-emerald-600' : 'text-slate-300'}`} />
                  <span>Huruf besar (A-Z)</span>
                </div>
                <div className={`flex items-center gap-1.5 ${pwdCheck.hasLowercase ? 'text-emerald-700' : 'text-slate-400'}`}>
                  <Check className={`w-3.5 h-3.5 ${pwdCheck.hasLowercase ? 'text-emerald-600' : 'text-slate-300'}`} />
                  <span>Huruf kecil (a-z)</span>
                </div>
                <div className={`flex items-center gap-1.5 ${pwdCheck.hasSymbol ? 'text-emerald-700' : 'text-slate-400'}`}>
                  <Check className={`w-3.5 h-3.5 ${pwdCheck.hasSymbol ? 'text-emerald-600' : 'text-slate-300'}`} />
                  <span>Simbol (!@#$...)</span>
                </div>
              </div>
            )}
          </div>

          {/* Status Akun Toggle */}
          <div className="pt-2 flex items-center justify-between border-t border-slate-100">
            <div>
              <span className="text-xs font-bold text-slate-800 block">Status Akun Aktif</span>
              <span className="text-[11px] text-slate-400">Pengguna dapat langsung login jika akun aktif</span>
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
              onClick={handleClose}
              className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-xl transition-all shadow-md shadow-indigo-600/20"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Simpan Pengguna</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
