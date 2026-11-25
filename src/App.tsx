import React, { useState, useEffect } from 'react';
import { ScheduleProvider, useSchedule } from './context/ScheduleContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LoginPage } from './components/auth/LoginPage';
import { AppLayout } from './components/layout/AppLayout';
import { ToastContainer } from './components/shared/ToastContainer';
import { ErrorBoundary } from './components/shared/ErrorBoundary';

// Matrix Board (Admin)
import { InteractiveMatrixBoard } from './components/matrix/InteractiveMatrixBoard';

// Master Data Views (Admin)
import { MasterDosenView } from './components/master/MasterDosenView';
import { MasterDetailDosenView } from './components/admin/MasterDetailDosenView';
import { MasterMahasiswaView } from './components/master/MasterMahasiswaView';
import { MasterRuanganView } from './components/master/MasterRuanganView';
import { MasterSlotWaktuView } from './components/master/MasterSlotWaktuView';
import { MasterPenggunaView } from './components/master/MasterPenggunaView';
import { MasterPeriodeAkademikView } from './components/master/MasterPeriodeAkademikView';

// Role Views
import { DosenView } from './components/dosen/DosenView';
import { MahasiswaView } from './components/mahasiswa/MahasiswaView';

// Integrated Admin Views (Dashboard Cards)
import { RekapitulasiView } from './components/admin/RekapitulasiView';
import { ImportStudentsView } from './components/admin/ImportStudentsView';
import { AuditConflictsView } from './components/admin/AuditConflictsView';
import { DatabaseManagerView } from './components/admin/DatabaseManagerView';

// Admin Modals
import { ManualAssignModal } from './components/admin/ManualAssignModal';
import { AuditConflictsModal } from './components/admin/AuditConflictsModal';
import { ExportReportModal } from './components/admin/ExportReportModal';
import { ImportStudentsModal } from './components/admin/ImportStudentsModal';
import { AssignExaminer3Modal } from './components/admin/AssignExaminer3Modal';
import { DatabaseManagerModal } from './components/admin/DatabaseManagerModal';
import { ChangePasswordModal } from './components/auth/ChangePasswordModal';

import { ScheduleItem } from './types';

// ─── Authenticated Dashboard View ──────────────────────────────────────────
const AuthenticatedDashboard: React.FC = () => {
  const { role, setRole } = useSchedule();

  // ── Navigation State ──────────────────────────────────────────────────────
  const [currentNav, setCurrentNav] = useState<string>(() => {
    if (role === 'dosen') return 'dosen-personal';
    if (role === 'mahasiswa') return 'mahasiswa-jadwal';
    return 'schedule';
  });

  // Role-based route guard & automatic redirect when active role changes
  useEffect(() => {
    if (role === 'admin') {
      const adminNavs = [
        'schedule', 
        'impor', 
        'rekapitulasi', 
        'audit', 
        'database', 
        'master-dosen', 
        'master-dosen-detail',
        'master-mahasiswa', 
        'master-ruangan', 
        'master-waktu',
        'master-periode',
        'master-pengguna'
      ];
      if (!adminNavs.includes(currentNav)) {
        setCurrentNav('schedule');
      }
    } else if (role === 'dosen') {
      const dosenNavs = ['dosen-personal', 'dosen-master'];
      if (!dosenNavs.includes(currentNav)) {
        setCurrentNav('dosen-personal');
      }
    } else if (role === 'mahasiswa') {
      const mhsNavs = ['mahasiswa-jadwal', 'mahasiswa-label'];
      if (!mhsNavs.includes(currentNav)) {
        setCurrentNav('mahasiswa-jadwal');
      }
    }
  }, [role, currentNav]);

  // ── Modal States ──────────────────────────────────────────────────────────
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isDatabaseModalOpen, setIsDatabaseModalOpen] = useState(false);
  const [isChangePasswordModalOpen, setIsChangePasswordModalOpen] = useState(false);
  const [manualAssignItem, setManualAssignItem] = useState<ScheduleItem | null>(null);
  const [assignExaminer3Item, setAssignExaminer3Item] = useState<ScheduleItem | null>(null);

  // ── Navigation Handler (also auto-switches role when needed) ───────────────
  const handleSelectNav = (nav: string) => {
    setCurrentNav(nav);

    // Auto-switch role if navigating to a role-specific section
    if (['schedule', 'impor', 'rekapitulasi', 'audit', 'database', 'master-dosen', 'master-dosen-detail', 'master-mahasiswa', 'master-ruangan', 'master-waktu', 'master-periode', 'master-pengguna'].includes(nav)) {
      setRole('admin');
    } else if (['dosen-personal', 'dosen-master'].includes(nav)) {
      setRole('dosen');
    } else if (['mahasiswa-jadwal', 'mahasiswa-label'].includes(nav)) {
      setRole('mahasiswa');
    }
  };

  // ── Render Current View ────────────────────────────────────────────────────
  const renderView = () => {
    switch (currentNav) {
      // ─ Admin Views (Dashboard Integrated) ──────────────────────────────────
      case 'schedule':
        return (
          <InteractiveMatrixBoard
            onOpenImportModal={() => handleSelectNav('impor')}
            onManualAssign={(item) => setManualAssignItem(item)}
            onAssignExaminer3={(item) => setAssignExaminer3Item(item)}
          />
        );

      case 'impor':
        return (
          <ImportStudentsView
            onSuccessNavigate={() => handleSelectNav('schedule')}
          />
        );

      case 'rekapitulasi':
        return <RekapitulasiView />;

      case 'audit':
        return <AuditConflictsView />;

      case 'database':
        return <DatabaseManagerView />;

      // ─ Data Master Views ──────────────────────────────────────────────────
      case 'master-dosen':
        return <MasterDosenView />;

      case 'master-dosen-detail':
        return <MasterDetailDosenView />;

      case 'master-mahasiswa':
        return (
          <MasterMahasiswaView
            onOpenImportModal={() => handleSelectNav('impor')}
            onManualAssign={(item) => setManualAssignItem(item)}
            onAssignExaminer3={(item) => setAssignExaminer3Item(item)}
          />
        );

      case 'master-ruangan':
        return <MasterRuanganView />;

      case 'master-waktu':
        return <MasterSlotWaktuView />;

      case 'master-periode':
        return <MasterPeriodeAkademikView />;

      case 'master-pengguna':
        return <MasterPenggunaView />;

      // ─ Dosen Views ────────────────────────────────────────────────────────
      case 'dosen-personal':
        return <DosenView viewMode="personal" />;

      case 'dosen-master':
        return <DosenView viewMode="master" />;

      // ─ Mahasiswa Views ────────────────────────────────────────────────────
      case 'mahasiswa-jadwal':
      case 'mahasiswa-label':
        return <MahasiswaView />;

      // ─ Fallback ───────────────────────────────────────────────────────────
      default:
        return (
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-slate-400">
            <p className="text-lg font-bold text-slate-600">Halaman tidak ditemukan</p>
            <button
              onClick={() => handleSelectNav('schedule')}
              className="mt-4 px-5 py-2 text-sm font-semibold bg-indigo-600 text-white rounded-xl"
            >
              Kembali ke Beranda
            </button>
          </div>
        );
    }
  };

  return (
    <AppLayout
      currentNav={currentNav}
      onSelectNav={handleSelectNav}
      onOpenImportModal={() => handleSelectNav('impor')}
      onOpenExportModal={() => handleSelectNav('rekapitulasi')}
      onOpenAuditModal={() => setIsAuditModalOpen(true)}
      onOpenDatabaseModal={() => handleSelectNav('database')}
      onOpenChangePasswordModal={() => setIsChangePasswordModalOpen(true)}
    >
      {/* Page Content rendered by routing */}
      {renderView()}

      {/* ── Global Modals ─────────────────────────────────────────────────── */}
      <ImportStudentsModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
      />

      <ManualAssignModal
        item={manualAssignItem}
        isOpen={!!manualAssignItem}
        onClose={() => setManualAssignItem(null)}
      />

      <AssignExaminer3Modal
        item={assignExaminer3Item}
        isOpen={!!assignExaminer3Item}
        onClose={() => setAssignExaminer3Item(null)}
      />

      <AuditConflictsModal
        isOpen={isAuditModalOpen}
        onClose={() => setIsAuditModalOpen(false)}
      />

      <ExportReportModal
        isOpen={isExportModalOpen}
        onClose={() => {
          setIsExportModalOpen(false);
          // If navigated here from sidebar, go back to schedule after close
          if (currentNav === 'rekapitulasi') setCurrentNav('schedule');
        }}
      />

      <DatabaseManagerModal
        isOpen={isDatabaseModalOpen}
        onClose={() => setIsDatabaseModalOpen(false)}
      />

      <ChangePasswordModal
        isOpen={isChangePasswordModalOpen}
        onClose={() => setIsChangePasswordModalOpen(false)}
      />

      {/* Real-time Toast Notifications */}
      <ToastContainer />
    </AppLayout>
  );
};

// ─── Main Content (Routes between Login & Authenticated App) ─────────────────
const MainContent: React.FC = () => {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return (
    <ScheduleProvider>
      <ErrorBoundary>
        <AuthenticatedDashboard />
      </ErrorBoundary>
    </ScheduleProvider>
  );
};

// ─── App Root ─────────────────────────────────────────────────────────────────
export function App() {
  return (
    <AuthProvider>
      <MainContent />
    </AuthProvider>
  );
}

export default App;
