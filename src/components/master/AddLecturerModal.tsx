import React, { useState, useRef } from 'react';
import { 
  X, 
  UserPlus, 
  Save, 
  AlertCircle, 
  Mail, 
  User, 
  BookOpen, 
  Hash, 
  Camera, 
  Upload, 
  Trash2,
  Tag
} from 'lucide-react';
import { useSchedule } from '../../context/ScheduleContext';

interface AddLecturerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AddLecturerModal: React.FC<AddLecturerModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { addLecturer, lecturers } = useSchedule();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [nidn, setNidn] = useState('');
  const [department, setDepartment] = useState('Teknik Informatika');
  const [email, setEmail] = useState('');
  const [photoUrl, setPhotoUrl] = useState<string | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  // Handle Photo File Upload
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('File yang diunggah harus berformat gambar (JPG, PNG, atau WebP).');
      return;
    }

    if (file.size > 3 * 1024 * 1024) {
      setError('Ukuran file foto maksimal adalah 3MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setPhotoUrl(result);
      setError(null);
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    setPhotoUrl(undefined);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const resetForm = () => {
    setCode('');
    setName('');
    setNidn('');
    setDepartment('Teknik Informatika');
    setEmail('');
    setPhotoUrl(undefined);
    setError(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedCode = code.trim().toUpperCase();
    const trimmedName = name.trim();
    const trimmedNidn = nidn.trim();
    const trimmedEmail = email.trim();
    const trimmedDept = department.trim();

    // 1. Validasi Kode Dosen
    if (!trimmedCode) {
      setError('Kode dosen (inisial) wajib diisi.');
      return;
    }
    if (trimmedCode.length < 2 || trimmedCode.length > 5) {
      setError('Kode dosen harus terdiri dari 2 hingga 5 karakter huruf.');
      return;
    }
    const duplicateCode = lecturers.find(l => l.code.toUpperCase() === trimmedCode);
    if (duplicateCode) {
      setError(`Kode dosen "${trimmedCode}" telah digunakan oleh ${duplicateCode.name}. Gunakan kode lain.`);
      return;
    }

    // 2. Validasi NIDN
    if (!trimmedNidn) {
      setError('Nomor Induk Dosen Nasional (NIDN) wajib diisi.');
      return;
    }
    if (!/^\d+$/.test(trimmedNidn)) {
      setError('NIDN hanya boleh terdiri dari karakter angka.');
      return;
    }
    const duplicateNidn = lecturers.find(l => l.nidn === trimmedNidn);
    if (duplicateNidn) {
      setError(`NIDN "${trimmedNidn}" telah terdaftar atas nama ${duplicateNidn.name}.`);
      return;
    }

    // 3. Validasi Nama Lengkap
    if (!trimmedName || trimmedName.length < 3) {
      setError('Nama lengkap beserta gelar akademik wajib diisi minimal 3 karakter.');
      return;
    }

    // 4. Validasi Program Studi
    if (!trimmedDept) {
      setError('Program studi / departemen wajib dipilih.');
      return;
    }

    // 5. Validasi Email
    if (!trimmedEmail) {
      setError('Email institusi wajib diisi.');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      setError('Format email tidak valid. Gunakan format email yang benar (contoh: dosen@email.ac.id).');
      return;
    }
    const duplicateEmail = lecturers.find(l => l.email.toLowerCase() === trimmedEmail.toLowerCase());
    if (duplicateEmail) {
      setError(`Email "${trimmedEmail}" telah digunakan oleh ${duplicateEmail.name}.`);
      return;
    }

    // Simpan Dosen Baru
    addLecturer({
      code: trimmedCode,
      nidn: trimmedNidn,
      name: trimmedName,
      department: trimmedDept,
      email: trimmedEmail,
      photoUrl: photoUrl || undefined,
    });

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
                Tambah Dosen Penguji Baru
              </h3>
              <p className="text-xs text-indigo-700 font-medium mt-0.5">
                Pendaftaran Dosen Pembimbing &amp; Reviewer Sidang
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
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {/* ── Foto Profil Upload Section ── */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
            <label className="text-xs font-bold text-slate-800 block mb-2.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Camera className="w-3.5 h-3.5 text-indigo-600" />
                <span>Foto Profil Dosen (Opsional)</span>
              </span>
            </label>

            <div className="flex items-center gap-4">
              {/* Photo Preview / Fallback */}
              <div className="relative shrink-0">
                {photoUrl ? (
                  <img
                    src={photoUrl}
                    alt={name || 'Preview'}
                    className="w-16 h-16 rounded-2xl object-cover shadow-sm border-2 border-indigo-200"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-2xl bg-indigo-100 text-indigo-700 font-bold text-lg flex items-center justify-center border border-indigo-200/60 font-mono">
                    {code.trim() ? code.trim().slice(0, 3).toUpperCase() : 'FOTO'}
                  </div>
                )}
              </div>

              {/* Upload Controls */}
              <div className="space-y-1.5 flex-1 min-w-0">
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/png,image/jpeg,image/webp"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />

                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center gap-1.5 h-8 px-3 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all shadow-xs"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>{photoUrl ? 'Ganti Foto' : 'Unggah Foto'}</span>
                  </button>

                  {photoUrl && (
                    <button
                      type="button"
                      onClick={handleRemovePhoto}
                      className="inline-flex items-center gap-1.5 h-8 px-2.5 text-xs font-semibold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Hapus</span>
                    </button>
                  )}
                </div>

                <p className="text-[11px] text-slate-500 leading-tight">
                  Format didukung: JPG, PNG, WebP (Maks. 3MB).
                </p>
              </div>
            </div>
          </div>

          {/* Grid 2 Kolom: Kode Dosen & NIDN */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* 1. Kode Dosen */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-indigo-600" />
                <span>Kode Dosen (Inisial) *</span>
              </label>
              <input
                type="text"
                required
                maxLength={5}
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="Contoh: BR / DW"
                className="w-full h-10 px-3.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-mono font-bold uppercase transition-all"
              />
            </div>

            {/* 2. NIDN */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Hash className="w-3.5 h-3.5 text-indigo-600" />
                <span>NIDN *</span>
              </label>
              <input
                type="text"
                required
                value={nidn}
                onChange={(e) => setNidn(e.target.value)}
                placeholder="Contoh: 0418057901"
                className="w-full h-10 px-3.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-mono transition-all"
              />
            </div>
          </div>

          {/* 3. Nama Lengkap & Gelar */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-indigo-600" />
              <span>Nama Lengkap &amp; Gelar Akademik *</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Contoh: Dr. Budi Rahardjo, S.Kom., M.T."
              className="w-full h-10 px-3.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium text-slate-900"
            />
          </div>

          {/* 4. Program Studi */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
              <span>Program Studi / Departemen *</span>
            </label>
            <select
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="w-full h-10 px-3.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800 transition-all"
            >
              <option value="Teknik Informatika">Teknik Informatika</option>
              <option value="Sistem Informasi">Sistem Informasi</option>
              <option value="Sistem Komputer">Sistem Komputer</option>
              <option value="Manajemen Informatika">Manajemen Informatika</option>
            </select>
          </div>

          {/* 5. Email Institusi */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-indigo-600" />
              <span>Email Institusi / Akun Login *</span>
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Contoh: budi.rahardjo@email.ac.id"
              className="w-full h-10 px-3.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-mono"
            />
          </div>

          {/* Buttons Footer */}
          <div className="pt-3 flex items-center justify-end gap-2.5 border-t border-slate-100">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl transition-all"
            >
              Batal
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-all active:scale-[0.99]"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Tambah Dosen</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
