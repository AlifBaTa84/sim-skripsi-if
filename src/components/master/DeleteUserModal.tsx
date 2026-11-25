import React, { useState } from 'react';
import { AlertTriangle, Trash2, X, ShieldAlert } from 'lucide-react';
import { PenggunaRecord } from '../../db/types';

interface DeleteUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (userId: string) => Promise<void> | void;
  user: PenggunaRecord | null;
  currentUserId?: string;
  currentUserEmail?: string;
}

export const DeleteUserModal: React.FC<DeleteUserModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  user,
  currentUserId,
  currentUserEmail,
}) => {
  const [isDeleting, setIsDeleting] = useState(false);

  if (!isOpen || !user) return null;

  const isCurrentSelf =
    (currentUserId && user.id === currentUserId) ||
    (currentUserEmail && user.email.toLowerCase() === currentUserEmail.toLowerCase());

  const isPrimaryAdmin = user.email.toLowerCase() === 'admin@simsidang.ac.id';
  const isProtected = isCurrentSelf || isPrimaryAdmin;

  const handleDelete = async () => {
    if (isProtected) return;
    setIsDeleting(true);
    try {
      await onConfirm(user.id);
      onClose();
    } catch (err) {
      console.error('Gagal menghapus pengguna:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-100 transform transition-all">
        {/* Header */}
        <div className="p-6 bg-rose-50 border-b border-rose-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center text-rose-600">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800">Hapus Akun Pengguna</h3>
              <p className="text-xs text-rose-600 font-medium">Tindakan ini tidak dapat dibatalkan</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors p-1.5 rounded-lg hover:bg-rose-100/50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {isProtected ? (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-sm text-amber-800">
                <span className="font-semibold block mb-0.5">Penghapusan Dilindungi</span>
                {isCurrentSelf
                  ? 'Anda tidak dapat menghapus akun yang sedang Anda gunakan saat ini.'
                  : 'Akun Super Administrator Utama dilindungi dari penghapusan demi keamanan sistem.'}
              </div>
            </div>
          ) : (
            <>
              <p className="text-sm text-slate-600">
                Apakah Anda yakin ingin menghapus akun pengguna berikut dari basis data kredensial sistem?
              </p>

              <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400 font-medium">Nama Pengguna</span>
                  <span className="text-sm font-bold text-slate-800">{user.nama}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400 font-medium">Email / Kredensial</span>
                  <span className="text-xs font-mono text-slate-700 bg-white px-2 py-0.5 rounded border border-slate-200">
                    {user.email}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400 font-medium">Peran Utama</span>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-200">
                    {user.role_utama}
                  </span>
                </div>
              </div>

              <p className="text-xs text-slate-500 italic">
                * Menghapus akun ini akan mencabut akses login pengguna ke portal SIM Sidang.
              </p>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-200/60 rounded-xl transition-all"
          >
            {isProtected ? 'Tutup' : 'Batal'}
          </button>
          {!isProtected && (
            <button
              type="button"
              onClick={handleDelete}
              disabled={isDeleting}
              className="px-5 py-2 text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 active:bg-rose-800 rounded-xl shadow-md shadow-rose-600/20 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {isDeleting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Menghapus...</span>
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4" />
                  <span>Ya, Hapus Pengguna</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
