import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, LogOut } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error caught by ErrorBoundary:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  private handleClearAndLogout = () => {
    try {
      localStorage.removeItem('sim_sidang_auth_user_v2');
      sessionStorage.clear();
    } catch (e) {
      console.error(e);
    }
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
          <div className="w-full max-w-lg bg-white rounded-3xl p-8 border border-slate-200/90 shadow-xl text-center">
            <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-5 shadow-xs">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              Terjadi Kesalahan Tampilan
            </h2>
            <p className="text-sm text-slate-500 mt-2">
              Aplikasi mengalami kendala saat merender komponen. Anda dapat memuat ulang halaman atau mengatur ulang sesi.
            </p>

            {this.state.error && (
              <div className="mt-4 p-3 rounded-xl bg-slate-100 text-left overflow-auto max-h-36 text-xs font-mono text-rose-700 border border-slate-200">
                <p className="font-bold">{this.state.error.toString()}</p>
              </div>
            )}

            <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={this.handleReset}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/20 transition-all"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Muat Ulang Halaman</span>
              </button>

              <button
                onClick={this.handleClearAndLogout}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-white hover:bg-rose-50 text-slate-700 hover:text-rose-600 border border-slate-200 text-xs font-bold transition-all"
              >
                <LogOut className="w-4 h-4" />
                <span>Reset Sesi & Logout</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

