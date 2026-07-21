import { Search, Bell, Menu, LogOut, Shield } from 'lucide-react';
import { authApi } from '../lib/api';

interface HeaderProps {
  onLogout?: () => void;
  onToggleSidebar?: () => void;
}

export function Header({ onLogout, onToggleSidebar }: HeaderProps) {
  const user = authApi.getCurrentUser();
  const displayName = user?.fullName || user?.username || 'Quản trị viên';
  const roleLabel = user?.role === 'admin' ? 'System Administrator' : 'Traffic Operator';
  const initial = (user?.username || 'A').charAt(0).toUpperCase();

  return (
    <header className="h-16 bg-surface border-b border-outline-variant/30 flex items-center justify-between px-6 sticky top-0 z-10 w-full">
      <div className="flex flex-1 items-center gap-4">
        <button onClick={onToggleSidebar} className="md:hidden p-2 -ml-2 text-on-surface-variant hover:text-on-surface rounded-lg hover:bg-surface-container">
          <Menu className="w-5 h-5" />
        </button>
        <div className="relative w-full max-w-md hidden md:block">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant" />
          <input 
            type="text" 
            placeholder="Tra cứu biển số, địa điểm, camera ID..." 
            className="w-full bg-surface-container-low border border-outline-variant/50 rounded-xl pl-10 pr-4 py-2 text-xs text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all placeholder:text-on-surface-variant"
          />
        </div>
      </div>
      
      <div className="flex items-center gap-4">
        <button className="relative p-2 text-on-surface-variant hover:text-on-surface rounded-full hover:bg-surface-container transition-colors cursor-pointer">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-2 w-2 h-2 bg-error rounded-full outline outline-2 outline-surface animate-pulse" />
        </button>

        <div className="flex items-center gap-3 pl-4 border-l border-outline-variant/30">
          <div className="text-right hidden md:block">
            <div className="text-xs font-bold text-on-surface flex items-center gap-1 justify-end">
              {displayName}
              {user?.role === 'admin' && (
                <Shield className="w-3 h-3 text-purple-400 inline" />
              )}
            </div>
            <div className="text-[10px] text-on-surface-variant font-mono">{roleLabel}</div>
          </div>

          <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm ${
            user?.role === 'admin' 
              ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' 
              : 'bg-primary/20 text-primary border border-primary/30'
          }`}>
            {initial}
          </div>

          <button
            onClick={onLogout}
            className="p-2 rounded-xl text-on-surface-variant hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
            title="Đăng xuất"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
