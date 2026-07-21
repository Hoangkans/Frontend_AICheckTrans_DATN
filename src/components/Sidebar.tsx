/**
 * Component Sidebar Navigation (Thanh điều hướng bên hông):
 * Hiển thị danh mục điều hướng chính và kiểm soát Phân quyền (RBAC).
 * - Người dùng thông thường (role: 'operator'): Chỉ nhìn thấy các mục vận hành giám sát.
 * - Quản trị viên (role: 'admin'): Hiển thị thêm khu vực "Quản trị viên (Admin)" gồm Admin Control, Quản lý Người dùng, Cấu hình.
 */

import { Home, Camera, Car, AlertTriangle, Settings, BarChart2, HelpCircle, X, ShieldCheck, Users, Sliders } from 'lucide-react';
import { cn } from '../lib/utils';
import { AppView } from '../types';
import { authApi } from '../lib/api';

interface SidebarProps {
  currentView: AppView;
  onViewChange: (view: AppView) => void;
  isHelpOpen: boolean;
  onToggleHelp: () => void;
}

export function Sidebar({ currentView, onViewChange, isHelpOpen, onToggleHelp }: SidebarProps) {
  // Lấy thông tin người dùng hiện tại để kiểm tra quyền Admin
  const currentUser = authApi.getCurrentUser();
  const isAdmin = currentUser?.role === 'admin';

  return (
    <>
      <aside className="w-64 bg-surface-container-low border-r border-outline-variant/30 flex flex-col h-screen fixed left-0 top-0 z-30">
        {/* Logo Hệ thống & Admin Badge */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-outline-variant/30">
          <div className="flex items-center gap-2.5 text-primary">
            <Camera className="w-6 h-6" />
            <span className="font-bold text-lg text-on-surface tracking-tight">AIDA Vision</span>
          </div>
          {isAdmin && (
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-400 border border-purple-500/40 animate-purple-glow">
              Admin Mode
            </span>
          )}
        </div>
        
        <div className="flex-1 overflow-y-auto py-4 space-y-4">
          {/* 1. Danh mục Vận hành Giám sát - CHỈ HIỂN THỊ DÀNH CHO OPERATOR (NGƯỜI DÙNG THƯỜNG) */}
          {!isAdmin && (
            <div>
              <div className="px-5 mb-1.5 text-[10px] font-bold uppercase tracking-wider text-on-surface-variant font-mono">
                Vận hành giám sát
              </div>
              <nav className="space-y-0.5 px-3">
                <NavItem icon={<Home className="w-4 h-4" />} label="Tổng quan" active={currentView === 'dashboard'} onClick={() => onViewChange('dashboard')} />
                <NavItem icon={<AlertTriangle className="w-4 h-4" />} label="Quản lý vi phạm" badge="12" active={currentView === 'violations'} onClick={() => onViewChange('violations')} />
                <NavItem icon={<Car className="w-4 h-4" />} label="Tra cứu phương tiện" active={currentView === 'search'} onClick={() => onViewChange('search')} />
                <NavItem icon={<Camera className="w-4 h-4" />} label="Hệ thống Camera" active={currentView === 'cameras'} onClick={() => onViewChange('cameras')} />
                <NavItem icon={<BarChart2 className="w-4 h-4" />} label="Phân tích & Thống kê" active={currentView === 'analytics'} onClick={() => onViewChange('analytics')} />
              </nav>
            </div>
          )}

          {/* 2. Danh mục Quản trị viên - CHỈ HIỂN THỊ DÀNH CHO ADMIN (QUẢN TRỊ VIÊN) */}
          {isAdmin && (
            <div>
              <div className="px-5 mb-1.5 flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-purple-400 font-mono">
                <span>Quản trị viên (Admin)</span>
                <ShieldCheck className="w-3 h-3 text-purple-400" />
              </div>
              <nav className="space-y-0.5 px-3">
                <NavItem 
                  icon={<ShieldCheck className="w-4 h-4 text-purple-400" />} 
                  label="Admin Control" 
                  active={currentView === 'admin-dashboard'} 
                  onClick={() => onViewChange('admin-dashboard')} 
                />
                <NavItem 
                  icon={<Users className="w-4 h-4 text-indigo-400" />} 
                  label="Quản lý Người dùng" 
                  active={currentView === 'admin-users'} 
                  onClick={() => onViewChange('admin-users')} 
                />
                <NavItem 
                  icon={<Sliders className="w-4 h-4 text-amber-400" />} 
                  label="Cấu hình / Settings" 
                  active={currentView === 'admin-settings'} 
                  onClick={() => onViewChange('admin-settings')} 
                />
              </nav>
            </div>
          )}
        </div>

        {/* Cài đặt chung & Phím tắt trợ giúp */}
        <div className="p-4 border-t border-outline-variant/30 space-y-1">
          <NavItem icon={<HelpCircle className="w-4 h-4" />} label="Trợ giúp (Alt+H)" active={isHelpOpen} onClick={onToggleHelp} />
          <NavItem icon={<Settings className="w-4 h-4" />} label="Cài đặt hệ thống" active={currentView === 'settings'} onClick={() => onViewChange('settings')} />
        </div>
      </aside>

      {/* Drawer Trợ giúp Nhanh (Alt+H) */}
      <div 
        className={cn(
          "fixed inset-y-0 w-80 bg-surface-container border-r border-outline-variant/30 z-20 transition-all duration-300 ease-in-out flex flex-col shadow-2xl",
          isHelpOpen ? "left-64 opacity-100" : "-left-80 opacity-0 pointer-events-none"
        )}
      >
        <div className="h-16 flex items-center justify-between px-6 border-b border-outline-variant/30 bg-surface">
          <span className="font-bold text-on-surface text-sm tracking-wider uppercase">Hướng dẫn vận hành</span>
          <button 
            onClick={onToggleHelp} 
            className="p-1 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-primary uppercase tracking-widest font-mono">Quy định xử phạt</h4>
            <div className="text-xs text-on-surface-variant space-y-1.5 leading-relaxed">
              <p>• <strong>Vượt đèn đỏ (Red Light)</strong>: Phạt 4.000.000đ - 6.000.000đ. Giữ GPLX 1 - 3 tháng.</p>
              <p>• <strong>Quá tốc độ (Speeding)</strong>: &gt;10-20km/h phạt 3.000.000đ - 5.000.000đ.</p>
              <p>• <strong>Không đội mũ (No Helmet)</strong>: Phạt 400.000đ - 600.000đ.</p>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="text-xs font-bold text-primary uppercase tracking-widest font-mono">Phím tắt nhanh (Hotkeys)</h4>
            <div className="text-xs text-on-surface-variant space-y-2">
              <div className="flex justify-between"><span className="font-mono bg-surface-container-high px-1 py-0.5 rounded border border-outline-variant/50">Alt + 1</span><span>Tổng quan</span></div>
              <div className="flex justify-between"><span className="font-mono bg-surface-container-high px-1 py-0.5 rounded border border-outline-variant/50">Alt + 2</span><span>Quản lý vi phạm</span></div>
              <div className="flex justify-between"><span className="font-mono bg-surface-container-high px-1 py-0.5 rounded border border-outline-variant/50">Alt + 3</span><span>Tra cứu</span></div>
              <div className="flex justify-between"><span className="font-mono bg-surface-container-high px-1 py-0.5 rounded border border-outline-variant/50">Alt + 4</span><span>Hệ thống Camera</span></div>
              <div className="flex justify-between"><span className="font-mono bg-surface-container-high px-1 py-0.5 rounded border border-outline-variant/50">Alt + 5</span><span>Thống kê</span></div>
              <div className="flex justify-between"><span className="font-mono bg-surface-container-high px-1 py-0.5 rounded border border-outline-variant/50">Alt + H</span><span>Đóng/Mở Trợ giúp</span></div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

/**
 * Component hiển thị từng mục trong menu Sidebar
 */
function NavItem({ icon, label, active, badge, onClick }: { icon: React.ReactNode, label: string, active?: boolean, badge?: string, onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-all duration-200 group cursor-pointer text-xs font-medium relative overflow-hidden",
        active 
          ? "bg-primary/10 text-primary font-bold shadow-sm nav-active-glow" 
          : "text-on-surface-variant hover:bg-surface-container hover:text-on-surface hover:translate-x-1"
      )}
    >
      <div className="flex items-center gap-3">
        <span className="group-hover:scale-110 transition-transform duration-200">{icon}</span>
        <span>{label}</span>
      </div>
      {badge && (
        <span className="bg-error text-on-error px-2 py-0.5 rounded-full text-[10px] font-bold shadow-sm animate-pulse">
          {badge}
        </span>
      )}
    </button>
  );
}
