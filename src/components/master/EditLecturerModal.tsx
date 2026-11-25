import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  GraduationCap, 
  Save, 
  AlertCircle, 
  Mail, 
  User, 
  BookOpen, 
  Hash, 
  Camera, 
  Upload, 
  Trash2,
  Image as ImageIcon
} from 'lucide-react';
import { Lecturer } from '../../types';
import { useSchedule } from '../../context/ScheduleContext';

interface EditLecturerModalProps {
  isOpen: boolean;
  onClose: () => void;
  lecturer: Lecturer | null;
}

export const EditLecturerModal: React.FC<EditLecturerModalProps> = ({
  isOpen,
  onClose,
  lecturer,
}) => {
  const { updateLecturer, lecturers } = useSchedule();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState('');
  const [nidn, setNidn] = useState('');
  const [department, setDepartment] = useState('Teknik Informatika');
  const [email, setEmail] = useState('');
  const [photoUrl, setPhotoUrl] = useState<string | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (lecturer) {
      setName(lecturer.name || '');
      setNidn(lecturer.nidn || '');
      setDepartment(lecturer.department || 'Teknik Informatika');
      setEmail(lecturer.email || '');
      setPhotoUrl(lecturer.photoUrl);
      setError(null);
    }
  }, [lecturer]);

  if (!isOpen || !lecturer) return null;

  // Handle Photo File Upload
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('File yang diunggah harus berformat gambar (JPG, PNG, atau WebP).');
      return;
    }

    // Limit size to 3MB
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    const trimmedName = name.trim();
    const trimmedNidn = nidn.trim();
    const trimmedEmail = email.trim();
    const trimmedDept = department.trim();

    if (!trimmedNidn) {
      setError('Nomor Induk Dosen Nasional (NIDN) wajib diisi.');
      return;
    }
    if (!/^\d+$/.test(trimmedNidn)) {
      setError('NIDN hanya boleh terdiri dari karakter angka.');
      return;
    }
    // Check NIDN uniqueness among other lecturers
    const duplicateNidn = lecturers.find(l => l.id !== lecturer.id && l.nidn === trimmedNidn);
    if (duplicateNidn) {
      setError(`NIDN "${trimmedNidn}" telah terdaftar atas nama ${duplicateNidn.name}.`);
      return;
    }

    if (!trimmedName || trimmedName.length < 3) {
      setError('Nama lengkap beserta gelar akademik wajib diisi minimal 3 karakter.');
      return;
    }

    if (!trimmedDept) {
      setError('Program studi / departemen wajib dipilih.');
      return;
    }

    if (!trimmedEmail) {
      setError('Email institusi wajib diisi.');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      setError('Format email tidak valid. Gunakan format email yang benar (contoh: dosen@email.ac.id).');
      return;
    }

    // Execute update
    updateLecturer(lecturer.id, {
      nidn: trimmedNidn,
      name: trimmedName,
      department: trimmedDept,
      email: trimmedEmail,
      photoUrl: photoUrl || undefined,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200/90 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-500/20">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 leading-tight">
                Edit Data Dosen Penguji
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Perbarui Foto, NIDN, Nama, Program Studi, dan Email Dosen
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
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {/* ── Foto Profil Upload Section ── */}
          <div className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100/80">
            <label className="text-xs font-bold text-slate-800 block mb-2.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Camera className="w-3.5 h-3.5 text-indigo-600" />
                <span>Foto Profil Dosen</span>
              </span>
              <span className="text-[11px] text-indigo-600 font-semibold">
                Kode: {lecturer.code}
              </span>
            </label>

            <div className="flex items-center gap-4">
              {/* Photo / Badge Preview */}
              <div className="relative shrink-0">
                {photoUrl ? (
                  <img
                    src={photoUrl}
                    alt={name || lecturer.name}
                    className="w-16 h-16 rounded-2xl object-cover shadow-sm border-2 border-indigo-200"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-700 to-indigo-500 text-white font-bold text-lg flex items-center justify-center shadow-md shadow-indigo-500/20 font-mono">
                    {lecturer.code}
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
                      title="Hapus foto profil dan kembali ke badge inisial"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Hapus Foto</span>
                    </button>
                  )}
                </div>

                <p className="text-[11px] text-slate-500 leading-tight">
                  Format didukung: JPG, PNG, WebP (Maks. 3MB). Foto akan otomatis menggantikan badge di seluruh sistem.
                </p>
              </div>
            </div>
          </div>

          {/* 1. NIDN */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Hash className="w-3.5 h-3.5 text-indigo-600" />
              <span>Nomor Induk Dosen Nasional (NIDN) *</span>
            </label>
            <input
              type="text"
              required
              value={nidn}
              onChange={(e) => setNidn(e.target.value)}
              placeholder="Contoh: 0427048501"
              className="w-full h-10 px-3.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-mono transition-all"
            />
          </div>

          {/* 2. Nama Lengkap & Gelar */}
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
              placeholder="Contoh: Dian Dharmayanti, S.T., M.Kom."
              className="w-full h-10 px-3.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium text-slate-900"
            />
          </div>

          {/* 3. Program Studi */}
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

          {/* 4. Email Institusi */}
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
              placeholder="Contoh: dian.dharmayanti@email.ac.id"
              className="w-full h-10 px-3.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-mono"
            />
          </div>

          {/* Buttons Footer */}
          <div className="pt-3 flex items-center justify-end gap-2.5 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl transition-all"
            >
              Batal
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-all active:scale-[0.99]"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Simpan Perubahan</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
