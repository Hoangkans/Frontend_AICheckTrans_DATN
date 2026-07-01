import { Search, Bell, Menu } from 'lucide-react';
import { AppView } from '../types';

interface HeaderProps {
    onLogout?: () => void;
    onToggleSidebar?: () => void;
}

export function Header({ onLogout, onToggleSidebar }: HeaderProps) {
  return (
    <header className="h-16 bg-surface border-b border-outline-variant/30 flex items-center justify-between px-6 sticky top-0 z-10 w-full">
      <div className="flex flex-1 items-center gap-4">
        <button onClick={onToggleSidebar} className="md:hidden p-2 -ml-2 text-on-surface-variant hover:text-on-surface rounded-lg hover:bg-surface-container">
            <Menu className="w-5 h-5" />
        </button>
        <div className="relative w-full max-w-md hidden md:block">
          <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
          <input 
            type="text" 
            placeholder="Tra cứu biển số, địa điểm, ID..." 
            className="w-full bg-surface-container-low border border-outline-variant/50 rounded-lg pl-10 pr-4 py-2 text-sm text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all placeholder:text-on-surface-variant"
          />
        </div>
      </div>
      
      <div className="flex items-center gap-4">
        <button className="relative p-2 text-on-surface-variant hover:text-on-surface rounded-full hover:bg-surface-container transition-colors hover-bell-ring cursor-pointer">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-2 w-2 h-2 bg-error rounded-full outline outline-2 outline-surface"></span>
        </button>
        <div className="flex items-center gap-3 pl-4 border-l border-outline-variant/30 cursor-pointer group" onClick={onLogout}>
          <div className="text-right hidden md:block">
            <div className="text-sm font-medium text-on-surface group-hover:text-primary transition-colors">Quản trị viên</div>
            <div className="text-xs text-on-surface-variant">Điều hành giao thông</div>
          </div>
          <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold group-hover:bg-primary/30 transition-colors">
            A
          </div>
        </div>
      </div>
    </header>
  );
}
