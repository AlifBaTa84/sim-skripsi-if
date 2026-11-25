import React, { useState, useCallback } from 'react';
import { useSchedule } from '../../context/ScheduleContext';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';

interface AppLayoutProps {
  currentNav: string;
  onSelectNav: (nav: string) => void;
  onOpenImportModal: () => void;
  onOpenExportModal: () => void;
  onOpenAuditModal: () => void;
  onOpenDatabaseModal?: () => void;
  onOpenChangePasswordModal?: () => void;
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({
  currentNav,
  onSelectNav,
  onOpenImportModal,
  onOpenExportModal,
  onOpenAuditModal,
  onOpenDatabaseModal,
  onOpenChangePasswordModal,
  children,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const handleToggleCollapse = useCallback(() => {
    setIsCollapsed(prev => !prev);
  }, []);

  const handleOpenMobile = useCallback(() => {
    setIsMobileOpen(true);
  }, []);

  const handleCloseMobile = useCallback(() => {
    setIsMobileOpen(false);
  }, []);

  // Calculate left offset for the main content based on sidebar state
  const mainMarginLeft = isCollapsed ? 'lg:ml-20' : 'lg:ml-64';

  return (
    <div className="min-h-screen bg-slate-50 print:bg-white">
      {/* Sidebar */}
      <Sidebar
        currentNav={currentNav}
        onSelectNav={onSelectNav}
        isCollapsed={isCollapsed}
        onToggleCollapse={handleToggleCollapse}
        isMobileOpen={isMobileOpen}
        onCloseMobile={handleCloseMobile}
        onOpenImportModal={onOpenImportModal}
        onOpenExportModal={onOpenExportModal}
        onOpenAuditModal={onOpenAuditModal}
        onOpenDatabaseModal={onOpenDatabaseModal}
        onOpenChangePasswordModal={onOpenChangePasswordModal}
      />

      {/* Main Content Area — shifts right on desktop to accommodate sidebar */}
      <div className={`flex flex-col min-h-screen transition-all duration-300 ease-in-out ${mainMarginLeft} print:ml-0`}>
        {/* Topbar */}
        <Topbar
          currentNav={currentNav}
          onOpenMobileSidebar={handleOpenMobile}
          onOpenAuditModal={onOpenAuditModal}
          onOpenExportModal={onOpenExportModal}
          onOpenImportModal={onOpenImportModal}
          onOpenDatabaseModal={onOpenDatabaseModal}
          onOpenChangePasswordModal={onOpenChangePasswordModal}
        />

        {/* Page Content */}
        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6 overflow-auto print:p-0 print:overflow-visible">
          {children}
        </main>

        {/* Footer */}
        <footer className="bg-white border-t border-slate-200/80 py-4 text-center text-xs text-slate-400 print:hidden shrink-0">
          <div className="max-w-full px-4 flex flex-col sm:flex-row items-center justify-center sm:justify-between gap-1.5">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-700">Sistem Informasi Manajemen Skripsi IF UNIKOM</span>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-slate-400">
              <span>Drag & Drop Matrix Board</span>
              <span className="text-slate-300">•</span>
              <span>Real-time Conflict Detection</span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

