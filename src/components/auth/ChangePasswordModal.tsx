import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSchedule } from '../../context/ScheduleContext';
import {
  X,
  KeyRound,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ShieldCheck,
  Check,
} from 'lucide-react';

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({ isOpen, onClose }) => {
  const { currentUser, updatePassword } = useAuth();
  const { addToast } = useSchedule();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  // Real-time live rule checking
  const hasMinLength = newPassword.length >= 8;
  const hasUppercase = /[A-Z]/.test(newPassword);
  const hasLowercase = /[a-z]/.test(newPassword);
  const hasSymbol = /[^A-Za-z0-9]/.test(newPassword);
  const isAllRulesPassed = hasMinLength && hasUppercase && hasLowercase && hasSymbol;
  const isMatching = confirmPassword.length > 0 && newPassword === confirmPassword;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!currentPassword) {
      setErrorMessage('Password saat ini wajib diisi.');
      return;
    }

    if (!isAllRulesPassed) {
      setErrorMessage('Password baru belum memenuhi semua kebijakan keamanan.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage('Konfirmasi password tidak cocok dengan password baru.');
      return;
    }

    setIsSubmitting(true);

    setTimeout(() => {
      const result = updatePassword(currentPassword, newPassword);
      setIsSubmitting(false);

      if (result.success) {
        setSuccessMessage('Password berhasil diperbarui!');
        addToast('success', 'Password Diperbarui', 'Kata sandi akun Anda berhasil diganti.');
        setTimeout(() => {
          // Reset & close
          setCurrentPassword('');
          setNewPassword('');
          setConfirmPassword('');
          setSuccessMessage(null);
          onClose();
        }, 1200);
      } else {
        setErrorMessage(result.error || 'Gagal mengubah password.');
      }
    }, 250);
  };

  const handleClose = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setErrorMessage(null);
    setSuccessMessage(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-lg w-full border border-slate-200/90 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-700 border border-indigo-200/60 flex items-center justify-center shrink-0">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
                Kelola &amp; Ubah Password Akun
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Perbarui kata sandi untuk mengamankan akses akun Anda
              </p>
            </div>
          </div>

          <button
            onClick={handleClose}
            className="w-9 h-9 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* User Badge Info */}
        <div className="px-6 py-3 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-xs">
          <div className="min-w-0">
            <span className="text-slate-400 font-medium">Akun Pengguna:</span>
            <span className="font-semibold text-slate-800 ml-1.5 truncate">
              {currentUser?.name}
            </span>
          </div>
          <span className="text-[11px] font-mono text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-md shrink-0">
            {currentUser?.email}
          </span>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          {/* Error Banner */}
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Success Banner */}
          {successMessage && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span className="font-semibold">{successMessage}</span>
            </div>
          )}

          {/* 1. Current Password */}
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">
              Password Saat Ini <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type={showCurrentPassword ? 'text' : 'password'}
                required
                placeholder="Masukkan kata sandi lama Anda..."
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full h-9 text-sm pl-9 pr-10 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
              >
                {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* 2. New Password */}
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">
              Password Baru <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <KeyRound className="w-4 h-4" />
              </div>
              <input
                type={showNewPassword ? 'text' : 'password'}
                required
                placeholder="Kombinasi huruf besar, kecil, simbol & angka..."
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full h-9 text-sm pl-9 pr-10 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
              >
                {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {/* Live Security Policy Requirements Checklist */}
            <div className="mt-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1.5">
              <div className="flex items-center justify-between text-slate-500 font-semibold mb-1">
                <span>Kebijakan Keamanan Password Baru:</span>
                <span className={isAllRulesPassed ? 'text-emerald-600 font-bold' : 'text-slate-400'}>
                  {isAllRulesPassed ? '✓ Memenuhi Syarat' : 'Belum Lengkap'}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                <div className={`flex items-center gap-1.5 ${hasMinLength ? 'text-emerald-700 font-medium' : 'text-slate-400'}`}>
                  {hasMinLength ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <span className="w-3.5 h-3.5 rounded-full border border-slate-300 inline-block shrink-0" />}
                  <span>Minimal 8 karakter</span>
                </div>
                <div className={`flex items-center gap-1.5 ${hasUppercase ? 'text-emerald-700 font-medium' : 'text-slate-400'}`}>
                  {hasUppercase ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <span className="w-3.5 h-3.5 rounded-full border border-slate-300 inline-block shrink-0" />}
                  <span>Huruf Besar (A-Z)</span>
                </div>
                <div className={`flex items-center gap-1.5 ${hasLowercase ? 'text-emerald-700 font-medium' : 'text-slate-400'}`}>
                  {hasLowercase ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <span className="w-3.5 h-3.5 rounded-full border border-slate-300 inline-block shrink-0" />}
                  <span>Huruf Kecil (a-z)</span>
                </div>
                <div className={`flex items-center gap-1.5 ${hasSymbol ? 'text-emerald-700 font-medium' : 'text-slate-400'}`}>
                  {hasSymbol ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <span className="w-3.5 h-3.5 rounded-full border border-slate-300 inline-block shrink-0" />}
                  <span>Simbol / Karakter Khusus</span>
                </div>
              </div>
            </div>
          </div>

          {/* 3. Confirm Password */}
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">
              Ulangi Password Baru <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                required
                placeholder="Ketik ulang password baru Anda..."
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={`w-full h-9 text-sm pl-9 pr-10 bg-slate-50 border rounded-xl focus:bg-white focus:outline-none focus:ring-2 ${
                  confirmPassword.length > 0 && !isMatching
                    ? 'border-rose-300 focus:ring-rose-500/20 focus:border-rose-500'
                    : 'border-slate-200 focus:ring-indigo-500/20 focus:border-indigo-500'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {confirmPassword.length > 0 && (
              <p className={`text-[11px] mt-1 flex items-center gap-1 font-medium ${isMatching ? 'text-emerald-600' : 'text-rose-600'}`}>
                {isMatching ? (
                  <>
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Konfirmasi password cocok</span>
                  </>
                ) : (
                  <>
                    <XCircle className="w-3 h-3" />
                    <span>Konfirmasi password belum cocok</span>
                  </>
                )}
              </p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="pt-4 border-t border-slate-200/80 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="h-10 px-4 text-sm font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-xl transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !isAllRulesPassed || !isMatching}
              className="m3-btn-primary"
            >
              <KeyRound className="w-4 h-4" />
              <span>{isSubmitting ? 'Menyimpan...' : 'Simpan Password Baru'}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};

