import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSchedule } from '../../context/ScheduleContext';
import {
  X,
  KeyRound,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Eye,
  EyeOff,
  User,
  GraduationCap,
  Sparkles,
  Lock,
} from 'lucide-react';

export interface ResetTargetUser {
  name: string;
  email: string;
  nim?: string;
  roleType: 'admin' | 'dosen' | 'mahasiswa';
}

interface AdminResetPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetUser: ResetTargetUser | null;
}

export const AdminResetPasswordModal: React.FC<AdminResetPasswordModalProps> = ({
  isOpen,
  onClose,
  targetUser,
}) => {
  const { isMainAdmin, resetUserPassword } = useAuth();
  const { addToast } = useSchedule();

  const [resetMode, setResetMode] = useState<'default' | 'custom'>('default');
  const [customPassword, setCustomPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<{ password: string; name: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!isOpen || !targetUser) return null;

  // Expected default password preview
  const defaultPasswordPreview =
    targetUser.roleType === 'mahasiswa'
      ? `Mhs#${targetUser.nim || '2025'}`
      : targetUser.roleType === 'admin'
      ? 'Admin#2025'
      : 'Dosen#2025';

  // Live rule checking for custom password
  const hasMinLength = customPassword.length >= 8;
  const hasUppercase = /[A-Z]/.test(customPassword);
  const hasLowercase = /[a-z]/.test(customPassword);
  const hasSymbol = /[^A-Za-z0-9]/.test(customPassword);
  const isCustomValid = hasMinLength && hasUppercase && hasLowercase && hasSymbol;

  const handleExecuteReset = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!isMainAdmin) {
      setErrorMessage('Akses Ditolak: Hanya Administrator Utama yang memiliki otoritas untuk mereset kata sandi.');
      return;
    }

    if (resetMode === 'custom' && !isCustomValid) {
      setErrorMessage('Password kustom baru belum memenuhi semua standar kebijakan keamanan.');
      return;
    }

    setIsSubmitting(true);

    setTimeout(() => {
      const identifier = targetUser.nim || targetUser.email;
      const result = resetUserPassword(
        identifier,
        resetMode === 'custom' ? customPassword.trim() : undefined
      );

      setIsSubmitting(false);

      if (result.success && result.resetPassword) {
        setSuccessData({
          password: result.resetPassword,
          name: result.targetName || targetUser.name,
        });
        addToast(
          'success',
          'Password Direset',
          `Kata sandi untuk ${targetUser.name} berhasil di-reset.`
        );
      } else {
        setErrorMessage(result.error || 'Gagal mereset kata sandi pengguna.');
      }
    }, 250);
  };

  const handleCopyPassword = () => {
    if (successData?.password) {
      navigator.clipboard.writeText(successData.password);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleClose = () => {
    setResetMode('default');
    setCustomPassword('');
    setShowPassword(false);
    setErrorMessage(null);
    setSuccessData(null);
    setCopied(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-lg w-full border border-slate-200/90 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-700 border border-amber-200/60 flex items-center justify-center shrink-0">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
                  Reset Password Pengguna
                </h3>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                  Otoritas Admin Utama
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Pulihkan akses akun untuk dosen atau mahasiswa
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

        {/* Target User Info Card */}
        <div className="p-5 bg-slate-50 border-b border-slate-200/80">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                targetUser.roleType === 'dosen'
                  ? 'bg-blue-100 text-blue-700 border border-blue-200'
                  : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
              }`}>
                {targetUser.roleType === 'dosen' ? <User className="w-5 h-5" /> : <GraduationCap className="w-5 h-5" />}
              </div>
              <div className="min-w-0">
                <h4 className="text-sm font-bold text-slate-900 truncate">
                  {targetUser.name}
                </h4>
                <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500">
                  {targetUser.nim && (
                    <span className="font-mono font-semibold text-indigo-700 bg-indigo-50 px-1.5 py-0.2 rounded border border-indigo-200/60">
                      NIM: {targetUser.nim}
                    </span>
                  )}
                  <span className="truncate font-mono">{targetUser.email}</span>
                </div>
              </div>
            </div>

            <span className={`text-[11px] font-semibold uppercase px-2.5 py-1 rounded-full border shrink-0 ${
              targetUser.roleType === 'dosen'
                ? 'bg-blue-50 text-blue-700 border-blue-200'
                : 'bg-emerald-50 text-emerald-700 border-emerald-200'
            }`}>
              {targetUser.roleType === 'dosen' ? 'Dosen Penguji' : 'Mahasiswa'}
            </span>
          </div>
        </div>

        {/* Content Body */}
        {successData ? (
          /* Success Screen */
          <div className="p-6 space-y-4">
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-center space-y-2">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h4 className="text-base font-bold text-emerald-900">
                Password Berhasil Direset!
              </h4>
              <p className="text-xs text-emerald-700 max-w-sm mx-auto">
                Password akun <strong>{successData.name}</strong> telah diperbarui. Silakan berikan kredensial baru berikut kepada pengguna:
              </p>

              {/* Password Result Box */}
              <div className="mt-3 p-3 bg-white border border-emerald-300 rounded-xl flex items-center justify-between gap-3 shadow-xs">
                <div className="text-left min-w-0">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Password Baru:</span>
                  <span className="font-mono text-base font-bold text-slate-900 tracking-wider">
                    {successData.password}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleCopyPassword}
                  className="flex items-center gap-1.5 h-9 px-3.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors shrink-0 shadow-xs"
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  <span>{copied ? 'Tersalin' : 'Salin Password'}</span>
                </button>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={handleClose}
                className="h-10 px-5 text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-colors shadow-sm"
              >
                Selesai &amp; Tutup
              </button>
            </div>
          </div>
        ) : (
          /* Form Reset */
          <form onSubmit={handleExecuteReset} className="p-6 space-y-4">
            {errorMessage && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Selection: Default vs Custom */}
            <div className="space-y-2.5">
              <label className="block text-xs font-semibold uppercase text-slate-500">
                Pilih Opsi Password Reset:
              </label>

              {/* Option 1: Standard Default Password */}
              <label
                onClick={() => setResetMode('default')}
                className={`p-3.5 rounded-xl border cursor-pointer flex items-start gap-3 transition-all ${
                  resetMode === 'default'
                    ? 'bg-indigo-50/70 border-indigo-400 ring-2 ring-indigo-500/20'
                    : 'bg-white border-slate-200 hover:bg-slate-50'
                }`}
              >
                <input
                  type="radio"
                  name="resetMode"
                  checked={resetMode === 'default'}
                  onChange={() => setResetMode('default')}
                  className="mt-0.5 text-indigo-600 focus:ring-indigo-500"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-slate-900">
                      Reset ke Password Standar Sistem (Rekomendasi)
                    </span>
                    <span className="text-[10px] font-bold text-indigo-700 bg-indigo-100 border border-indigo-200 px-2 py-0.5 rounded-md font-mono">
                      {defaultPasswordPreview}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Format resmi otomatis: <code className="font-mono text-slate-700">{targetUser.roleType === 'mahasiswa' ? 'Mhs#<NIM>' : 'Dosen#2025'}</code> yang memenuhi seluruh kebijakan keamanan.
                  </p>
                </div>
              </label>

              {/* Option 2: Custom Password */}
              <label
                onClick={() => setResetMode('custom')}
                className={`p-3.5 rounded-xl border cursor-pointer flex items-start gap-3 transition-all ${
                  resetMode === 'custom'
                    ? 'bg-indigo-50/70 border-indigo-400 ring-2 ring-indigo-500/20'
                    : 'bg-white border-slate-200 hover:bg-slate-50'
                }`}
              >
                <input
                  type="radio"
                  name="resetMode"
                  checked={resetMode === 'custom'}
                  onChange={() => setResetMode('custom')}
                  className="mt-0.5 text-indigo-600 focus:ring-indigo-500"
                />
                <div className="flex-1 min-w-0">
                  <span className="text-xs font-bold text-slate-900 block">
                    Tentukan Password Baru Khusus
                  </span>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Ketik manual kata sandi baru untuk pengguna ini sesuai kebijakan keamanan sistem.
                  </p>
                </div>
              </label>
            </div>

            {/* Custom Password Input (only if custom is selected) */}
            {resetMode === 'custom' && (
              <div className="pt-2 space-y-2 animate-in fade-in duration-150">
                <label className="block text-xs font-semibold uppercase text-slate-500">
                  Password Baru Khusus *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="Masukkan kata sandi baru..."
                    value={customPassword}
                    onChange={(e) => setCustomPassword(e.target.value)}
                    className="w-full h-9 text-sm pl-9 pr-10 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Validation checklist */}
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 grid grid-cols-2 gap-1 text-[11px]">
                  <div className={`flex items-center gap-1.5 ${hasMinLength ? 'text-emerald-700 font-medium' : 'text-slate-400'}`}>
                    <span className={`w-3 h-3 rounded-full flex items-center justify-center text-[9px] font-bold ${hasMinLength ? 'bg-emerald-500 text-white' : 'border border-slate-300'}`}>✓</span>
                    <span>Min 8 karakter</span>
                  </div>
                  <div className={`flex items-center gap-1.5 ${hasUppercase ? 'text-emerald-700 font-medium' : 'text-slate-400'}`}>
                    <span className={`w-3 h-3 rounded-full flex items-center justify-center text-[9px] font-bold ${hasUppercase ? 'bg-emerald-500 text-white' : 'border border-slate-300'}`}>✓</span>
                    <span>Huruf Besar (A-Z)</span>
                  </div>
                  <div className={`flex items-center gap-1.5 ${hasLowercase ? 'text-emerald-700 font-medium' : 'text-slate-400'}`}>
                    <span className={`w-3 h-3 rounded-full flex items-center justify-center text-[9px] font-bold ${hasLowercase ? 'bg-emerald-500 text-white' : 'border border-slate-300'}`}>✓</span>
                    <span>Huruf Kecil (a-z)</span>
                  </div>
                  <div className={`flex items-center gap-1.5 ${hasSymbol ? 'text-emerald-700 font-medium' : 'text-slate-400'}`}>
                    <span className={`w-3 h-3 rounded-full flex items-center justify-center text-[9px] font-bold ${hasSymbol ? 'bg-emerald-500 text-white' : 'border border-slate-300'}`}>✓</span>
                    <span>Simbol karakter</span>
                  </div>
                </div>
              </div>
            )}

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
                disabled={isSubmitting || (resetMode === 'custom' && !isCustomValid)}
                className="inline-flex items-center justify-center gap-2 h-10 px-5 text-sm font-semibold text-white bg-amber-600 hover:bg-amber-700 active:bg-amber-800 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl shadow-xs transition-colors"
              >
                <KeyRound className="w-4 h-4" />
                <span>{isSubmitting ? 'Memproses Reset...' : 'Reset Password Sekarang'}</span>
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
};

