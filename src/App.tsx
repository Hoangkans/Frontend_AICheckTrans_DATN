import { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { AppView } from './types';
import { authApi } from './lib/api';

// Views
import { DashboardView } from './views/DashboardView';
import { ViolationsView } from './views/ViolationsView';
import { SearchView } from './views/SearchView';
import { AnalyticsView } from './views/AnalyticsView';
import { SettingsView } from './views/SettingsView';
import { AuthScreens } from './views/AuthScreens';
import { CamerasView } from './views/CamerasView';

// Admin Views
import { AdminDashboardView } from './views/admin/AdminDashboardView';
import { AdminUsersView } from './views/admin/AdminUsersView';
import { AdminSettingsView } from './views/admin/AdminSettingsView';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem('user') !== null;
  });
  const [currentView, setCurrentView] = useState<AppView>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [showShortcutTip, setShowShortcutTip] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey) {
        let view: AppView | null = null;
        switch (e.key) {
          case '1':
            view = 'dashboard';
            break;
          case '2':
            view = 'violations';
            break;
          case '3':
            view = 'search';
            break;
          case '4':
            view = 'cameras';
            break;
          case '5':
            view = 'analytics';
            break;
          case '6':
            view = 'settings';
            break;
          case 'h':
          case 'H':
            e.preventDefault();
            setIsHelpOpen(prev => !prev);
            break;
        }

        if (view) {
          e.preventDefault();
          setCurrentView(view);
          setSidebarOpen(false);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isAuthenticated]);

  const currentUser = authApi.getCurrentUser();
  const isAdmin = currentUser?.role === 'admin';

  // Tự động chuyển view mặc định dựa trên Vai trò khi mở ứng dụng
  useEffect(() => {
    if (!isAuthenticated) return;
    if (isAdmin && !currentView.startsWith('admin-')) {
      setCurrentView('admin-dashboard');
    } else if (!isAdmin && currentView.startsWith('admin-')) {
      setCurrentView('dashboard');
    }
  }, [isAuthenticated, isAdmin]);

  if (!isAuthenticated) {
    return <AuthScreens onAuthenticated={() => setIsAuthenticated(true)} />;
  }

  const renderView = () => {
    // Route protection: Non-admin users cannot access admin pages
    if (currentView.startsWith('admin-') && !isAdmin) {
      return <DashboardView />;
    }

    // Admin users accessing default route will render AdminDashboardView
    if (isAdmin && !currentView.startsWith('admin-')) {
      return (
        <AdminDashboardView 
          onNavigateToUsers={() => setCurrentView('admin-users')} 
          onNavigateToSettings={() => setCurrentView('admin-settings')} 
        />
      );
    }

    switch (currentView) {
      case 'dashboard': 
        return <DashboardView />;
      case 'cameras': 
        return <CamerasView />;
      case 'violations': 
        return <ViolationsView />;
      case 'search': 
        return <SearchView />;
      case 'analytics': 
        return <AnalyticsView />;
      case 'settings': 
        return <SettingsView />;
      case 'admin-dashboard':
        return (
          <AdminDashboardView 
            onNavigateToUsers={() => setCurrentView('admin-users')} 
            onNavigateToSettings={() => setCurrentView('admin-settings')} 
          />
        );
      case 'admin-users':
        return <AdminUsersView />;
      case 'admin-settings':
        return <AdminSettingsView />;
      default: 
        return isAdmin ? (
          <AdminDashboardView 
            onNavigateToUsers={() => setCurrentView('admin-users')} 
            onNavigateToSettings={() => setCurrentView('admin-settings')} 
          />
        ) : <DashboardView />;
    }
  };

  return (
    <div className="flex h-screen bg-background overflow-hidden relative">
      {/* Sidebar - Mobile drawer or Desktop sticky */}
      <div className={`fixed inset-y-0 left-0 transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0 z-30 transition duration-200 ease-in-out md:w-64`}>
        <Sidebar 
          currentView={currentView} 
          onViewChange={(view) => {
            setCurrentView(view);
            setSidebarOpen(false);
          }} 
          isHelpOpen={isHelpOpen}
          onToggleHelp={() => setIsHelpOpen(!isHelpOpen)}
        />
      </div>

      {/* Backdrop for mobile */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-20 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full overflow-hidden w-full relative">
        <Header 
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          onLogout={async () => {
            await authApi.logout();
            setIsAuthenticated(false);
          }}
        />
        <main className="flex-1 overflow-y-auto w-full p-4 md:p-6 lg:p-8">
          <div key={currentView} className="max-w-[1400px] mx-auto space-y-6 pb-20 animate-page-enter">
            {renderView()}
          </div>
        </main>

        {/* Global Shortcut Cheat-sheet Tip Banner */}
        {showShortcutTip && (
          <div className="absolute bottom-4 right-4 bg-surface-container border border-outline-variant/30 px-3 py-2 rounded-xl shadow-lg flex items-center gap-3 z-40 animate-pulse">
            <div className="text-xs text-on-surface-variant">
              💡 Phím tắt nhanh: <span className="font-mono bg-surface-container-high px-1 py-0.5 rounded border border-outline-variant/50">Alt + 1-6</span> đổi tab | <span className="font-mono bg-surface-container-high px-1 py-0.5 rounded border border-outline-variant/50">Alt + H</span> Trợ giúp
            </div>
            <button 
              onClick={() => setShowShortcutTip(false)}
              className="text-on-surface-variant hover:text-on-surface text-xs font-bold leading-none p-0.5 cursor-pointer"
            >
              ×
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
