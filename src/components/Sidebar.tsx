import { Home, Camera, Car, AlertTriangle, Settings, BarChart2, HelpCircle, X } from 'lucide-react';
import { cn } from '../lib/utils';
import { AppView } from '../types';

interface SidebarProps {
  currentView: AppView;
  onViewChange: (view: AppView) => void;
  isHelpOpen: boolean;
  onToggleHelp: () => void;
}

export function Sidebar({ currentView, onViewChange, isHelpOpen, onToggleHelp }: SidebarProps) {
  return (
    <>
      <aside className="w-64 bg-surface-container-low border-r border-outline-variant/30 flex flex-col h-screen fixed left-0 top-0 z-30">
        <div className="h-16 flex items-center px-6 border-b border-outline-variant/30">
          <div className="flex items-center gap-2 text-primary">
            <Camera className="w-6 h-6" />
            <span className="font-bold text-lg text-on-surface">AIDA Vision</span>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto py-4">
          <nav className="space-y-1 px-3">
            <NavItem icon={<Home className="w-5 h-5" />} label="Tổng quan" active={currentView === 'dashboard'} onClick={() => onViewChange('dashboard')} />
            <NavItem icon={<AlertTriangle className="w-5 h-5" />} label="Quản lý vi phạm" badge="12" active={currentView === 'violations'} onClick={() => onViewChange('violations')} />
            <NavItem icon={<Car className="w-5 h-5" />} label="Tra cứu phương tiện" active={currentView === 'search'} onClick={() => onViewChange('search')} />
            <NavItem icon={<Camera className="w-5 h-5" />} label="Hệ thống Camera" active={currentView === 'cameras'} onClick={() => onViewChange('cameras')} />
            <NavItem icon={<BarChart2 className="w-5 h-5" />} label="Phân tích & Thống kê" active={currentView === 'analytics'} onClick={() => onViewChange('analytics')} />
          </nav>
        </div>

        <div className="p-4 border-t border-outline-variant/30 space-y-1">
          <NavItem icon={<HelpCircle className="w-5 h-5" />} label="Trợ giúp (Alt+H)" active={isHelpOpen} onClick={onToggleHelp} />
          <NavItem icon={<Settings className="w-5 h-5" />} label="Cài đặt hệ thống" active={currentView === 'settings'} onClick={() => onViewChange('settings')} />
        </div>
      </aside>

      {/* Sliding Quick-Help Drawer */}
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

          <div className="space-y-2">
            <h4 className="text-xs font-bold text-primary uppercase tracking-widest font-mono">Quy trình duyệt lỗi AI</h4>
            <div className="text-xs text-on-surface-variant space-y-1.5 leading-relaxed">
              <p>1. Quan sát ảnh phóng to biển kiểm soát phương tiện ở khung chi tiết.</p>
              <p>2. Đối chiếu biển số văn bản do OCR dịch có trùng khớp với ảnh chụp thực tế.</p>
              <p>3. Click <strong>Xác nhận</strong> (nếu đúng) hoặc <strong>Từ chối</strong> (nếu nhận diện lỗi).</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function NavItem({ icon, label, active, badge, onClick }: { icon: React.ReactNode, label: string, active?: boolean, badge?: string, onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors group cursor-pointer",
        active 
          ? "bg-primary/10 text-primary font-medium" 
          : "text-on-surface-variant hover:bg-surface-container hover:text-on-surface"
      )}
    >
      <div className="flex items-center gap-3">
        {icon}
        <span>{label}</span>
      </div>
      {badge && (
        <span className="bg-error text-on-error px-2 py-0.5 rounded-full text-xs font-medium">
          {badge}
        </span>
      )}
    </button>
  );
}
