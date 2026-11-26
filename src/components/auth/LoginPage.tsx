import React, { useState, useEffect } from 'react';
import { useAuth, getActiveDemoAccounts, DemoAccount } from '../../context/AuthContext';
import { generateCaptchaText } from '../../utils/authValidator';
import { CaptchaCanvas } from './CaptchaCanvas';
import {
  CalendarDays,
  Lock,
  Mail,
  ShieldCheck,
  Eye,
  EyeOff,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ArrowRight,
  UserCheck,
  Sparkles,
  Info,
  GraduationCap,
  KeyRound,
  ShieldAlert,
} from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [captchaInput, setCaptchaInput] = useState('');
  const [expectedCaptcha, setExpectedCaptcha] = useState(() => generateCaptchaText(5));
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [demoAccounts, setDemoAccounts] = useState<DemoAccount[]>(() => getActiveDemoAccounts());

  useEffect(() => {
    setDemoAccounts(getActiveDemoAccounts());
  }, []);

  // Generate new captcha
  const handleRefreshCaptcha = () => {
    setExpectedCaptcha(generateCaptchaText(5));
    setCaptchaInput('');
  };

  // Password rules evaluation for live visual feedback
  const hasMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasSymbol = /[^A-Za-z0-9]/.test(password);
  const isPasswordPolicyFulfilled = hasMinLength && hasUppercase && hasLowercase && hasSymbol;

  // Handle Demo Account 1-Click Fill
  const handleSelectDemo = (account: DemoAccount) => {
    if (account.isAvailable === false) {
      setErrorMessage(
        account.unavailableReason ||
          'Akun demo mahasiswa tidak tersedia karena data mahasiswa belum diimpor atau telah dihapus. Silakan login sebagai Admin untuk mengelola data.'
      );
      return;
    }
    setEmail(account.email);
    setPassword(account.password);
    setErrorMessage(null);
  };

  // Submit Handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsLoading(true);

    setTimeout(() => {
      const result = login(email, password, captchaInput, expectedCaptcha);
      setIsLoading(false);

      if (!result.success) {
        setErrorMessage(result.error || 'Login gagal.');
        // Refresh captcha on failed attempt for security
        handleRefreshCaptcha();
      }
    }, 300);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-indigo-50/40 to-slate-200/60 flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-5xl bg-white rounded-3xl shadow-2xl border border-slate-200/90 overflow-hidden grid grid-cols-1 lg:grid-cols-12 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Left Side: Brand & System Features (4 cols) */}
        <div className="lg:col-span-5 bg-gradient-to-br from-indigo-900 via-indigo-950 to-slate-950 p-8 sm:p-10 text-white flex flex-col justify-between relative overflow-hidden">
          {/* Subtle glow circle decoration */}
          <div className="absolute -top-24 -left-24 w-72 h-72 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />

          {/* Top Brand Header */}
          <div className="relative z-10">
            <div className="flex items-center gap-3.5 mb-6">
              <div className="w-14 h-14 rounded-2xl bg-white p-1.5 shadow-xl shadow-indigo-950/40 flex items-center justify-center shrink-0 border border-white/20">
                <img
                  src="/logo-unikom.png"
                  alt="Logo UNIKOM"
                  className="w-full h-full object-contain"
                />
              </div>
              <div>
                <span className="text-[11px] font-semibold tracking-wider uppercase text-amber-400 bg-amber-400/10 px-2.5 py-0.5 rounded-full border border-amber-400/20">
                  TEKNIK INFORMATIKA UNIKOM
                </span>
                <h1 className="text-xl font-bold tracking-tight leading-none text-white mt-1">
                  SIM SKRIPSI
                </h1>
                <p className="text-xs text-indigo-200/90 mt-1 font-medium">
                  Sistem Informasi Manajemen Skripsi IF UNIKOM
                </p>
              </div>
            </div>

            <div className="space-y-4 my-8">
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-300 mt-0.5 shrink-0">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                      Role-Based Access Control (RBAC)
                    </h4>
                    <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
                      Dukungan multi-peran: seorang dosen dapat berperan ganda sebagai <strong>Panitia Sidang (Admin)</strong> sekaligus <strong>Dosen Penguji</strong> dengan email yang sama.
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-300 mt-0.5 shrink-0">
                    <KeyRound className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                      Kebijakan Keamanan Berlapis
                    </h4>
                    <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
                      Verifikasi password ketat (minimal 8 karakter kombinasi huruf besar, kecil, dan simbol) serta Captcha anti-bot.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Security Pill */}
          <div className="relative z-10 pt-6 border-t border-white/10 text-[11px] text-slate-400 flex items-center justify-between">
            <span>© 2025 Sistem Informasi Manajemen Skripsi IF UNIKOM</span>
            <span className="flex items-center gap-1 text-emerald-400 font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Sistem Aman
            </span>
          </div>
        </div>

        {/* Right Side: Login Form (7 cols) */}
        <div className="lg:col-span-7 p-8 sm:p-10 flex flex-col justify-between space-y-6">
          
          <div>
            {/* Title */}
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
                  Masuk ke Akun Anda
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Gunakan alamat email dan password terdaftar untuk mengakses portal sidang
                </p>
              </div>
              <img
                src="/logo-unikom.png"
                alt="Logo UNIKOM"
                className="w-12 h-12 object-contain shrink-0 lg:hidden"
              />
            </div>

            {/* Error Banner */}
            {errorMessage && (
              <div className="mb-5 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5 animate-in fade-in duration-150">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div className="leading-relaxed">
                  <span className="font-bold">Gagal Masuk: </span>
                  {errorMessage}
                </div>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Field 1: Email */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Alamat Email Pengguna
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    placeholder="nama@email.ac.id"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
                  />
                </div>
              </div>

              {/* Field 2: Password */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                    Kata Sandi (Password)
                  </label>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="Minimal 8 karakter (huruf besar, kecil & simbol)"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-11 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                    title={showPassword ? 'Sembunyikan password' : 'Lihat password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Password Policy Live Feedback Indicator */}
                {password && (
                  <div className="mt-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5 animate-in fade-in duration-150">
                    <p className="text-[10.5px] font-bold text-slate-500 uppercase tracking-wider">
                      Standar Kebijakan Password:
                    </p>
                    <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                      <div className={`flex items-center gap-1.5 font-medium ${hasMinLength ? 'text-emerald-700' : 'text-slate-400'}`}>
                        {hasMinLength ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> : <XCircle className="w-3.5 h-3.5 shrink-0" />}
                        <span>Min. 8 Karakter</span>
                      </div>
                      <div className={`flex items-center gap-1.5 font-medium ${hasUppercase ? 'text-emerald-700' : 'text-slate-400'}`}>
                        {hasUppercase ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> : <XCircle className="w-3.5 h-3.5 shrink-0" />}
                        <span>Huruf Besar (A-Z)</span>
                      </div>
                      <div className={`flex items-center gap-1.5 font-medium ${hasLowercase ? 'text-emerald-700' : 'text-slate-400'}`}>
                        {hasLowercase ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> : <XCircle className="w-3.5 h-3.5 shrink-0" />}
                        <span>Huruf Kecil (a-z)</span>
                      </div>
                      <div className={`flex items-center gap-1.5 font-medium ${hasSymbol ? 'text-emerald-700' : 'text-slate-400'}`}>
                        {hasSymbol ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> : <XCircle className="w-3.5 h-3.5 shrink-0" />}
                        <span>Simbol (!@#$...)</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Field 3: Captcha Verification */}
              <div className="pt-1">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Verifikasi Keamanan (Captcha) *
                </label>
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  {/* Canvas Gambar Captcha */}
                  <CaptchaCanvas
                    captchaText={expectedCaptcha}
                    onRefresh={handleRefreshCaptcha}
                    width={150}
                    height={44}
                  />

                  {/* Input Teks Captcha */}
                  <div className="flex-1">
                    <input
                      type="text"
                      required
                      autoComplete="off"
                      placeholder="Ketik kode di samping..."
                      value={captchaInput}
                      onChange={(e) => setCaptchaInput(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold tracking-wider text-slate-900 placeholder:font-normal placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                    />
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 py-3 px-4 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-600/25 transition-all hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span>{isLoading ? 'Memverifikasi...' : 'Masuk ke Sistem'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

            </form>
          </div>

          {/* Quick Fill Demo Accounts */}
          <div className="pt-4 border-t border-slate-100">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 mb-2.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Akun Demo Cepat (1-Klik untuk Isi Kredensial):</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {demoAccounts.map((acc) => {
                const isAvail = acc.isAvailable !== false;
                return (
                  <button
                    key={acc.label + acc.email}
                    type="button"
                    onClick={() => handleSelectDemo(acc)}
                    title={!isAvail ? acc.unavailableReason : undefined}
                    className={`text-left p-2.5 rounded-xl border transition-all group ${
                      isAvail
                        ? 'border-slate-200/80 bg-slate-50/70 hover:bg-indigo-50/60 hover:border-indigo-200 cursor-pointer'
                        : 'border-slate-200 border-dashed bg-slate-100/50 hover:bg-slate-100 cursor-pointer opacity-75'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className={`text-xs font-bold truncate ${isAvail ? 'text-slate-800 group-hover:text-indigo-700' : 'text-slate-500'}`}>
                        {acc.label}
                      </span>
                      <span className={`text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded border ${
                        !isAvail
                          ? 'bg-slate-100 text-slate-500 border-slate-300'
                          : acc.roles.includes('admin') && acc.roles.includes('dosen')
                          ? 'bg-purple-50 text-purple-700 border-purple-200'
                          : acc.roles.includes('admin')
                          ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                          : acc.roles.includes('dosen')
                          ? 'bg-blue-50 text-blue-700 border-blue-200'
                          : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      }`}>
                        {acc.roleBadge}
                      </span>
                    </div>
                    <p className={`text-[10px] font-mono truncate ${isAvail ? 'text-slate-400' : 'text-slate-400 italic'}`}>
                      {acc.email}
                    </p>
                  </button>
                );
              })}
            </div>

            {/* Info Akun yang Baru Ditambahkan */}
            <div className="mt-3 p-3 bg-indigo-50/60 border border-indigo-100 rounded-xl text-xs text-indigo-950 flex items-start gap-2.5">
              <Info className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="font-bold text-indigo-900 block">Panduan Login Data Baru:</span>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  • <strong>Dosen Baru:</strong> Email sesuai Master Dosen, Password: <code className="font-mono bg-white px-1 py-0.5 rounded border border-indigo-200 text-indigo-700">Dosen#2025</code><br />
                  • <strong>Mahasiswa Baru:</strong> Masukkan NIM atau <code className="font-mono text-slate-700">NIM@mahasiswa.ac.id</code>, Password: <code className="font-mono bg-white px-1 py-0.5 rounded border border-indigo-200 text-indigo-700">Mhs#NIM</code> (misal: <code className="font-mono text-slate-700">Mhs#10120288</code>)
                </p>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};

