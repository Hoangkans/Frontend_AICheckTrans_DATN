import { Shield, User, Bell, Database } from 'lucide-react';
import { cn } from '../lib/utils';

export function SettingsView() {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-on-surface">Cài đặt hệ thống</h1>
        <p className="text-on-surface-variant mt-1 text-sm">Quản lý tài khoản, phân quyền và cấu hình an ninh bảo mật.</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="col-span-1 space-y-1">
              <SettingsTab icon={<User className="w-4 h-4" />} label="Hồ sơ cá nhân" active />
              <SettingsTab icon={<Shield className="w-4 h-4" />} label="Bảo mật & 2FA" />
              <SettingsTab icon={<Database className="w-4 h-4" />} label="Quản lý Server AI" />
              <SettingsTab icon={<Bell className="w-4 h-4" />} label="Thông báo" />
          </div>
          
          <div className="col-span-1 md:col-span-3 bg-surface-container-lowest rounded-xl border border-outline-variant/30 p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-on-surface mb-6">Thông tin cá nhân</h3>
              
              <div className="space-y-6">
                  <div className="flex items-center gap-6">
                      <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-2xl">
                          A
                      </div>
                      <div>
                          <button className="bg-surface-container hover:bg-surface-container-high text-on-surface px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                              Thay đổi ảnh đại diện
                          </button>
                      </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                          <label className="text-sm font-medium text-on-surface">Họ và tên</label>
                          <input type="text" defaultValue="Quản trị viên" className="w-full bg-surface-container border border-outline-variant/50 rounded-lg px-3 py-2 text-sm text-on-surface focus:outline-none focus:border-primary transition-colors" />
                      </div>
                      <div className="space-y-1.5">
                          <label className="text-sm font-medium text-on-surface">Mã định danh (Operator ID)</label>
                          <input type="text" defaultValue="OP-00123" disabled className="w-full bg-surface-container-low border border-outline-variant/30 rounded-lg px-3 py-2 text-sm text-on-surface-variant opacity-70" />
                      </div>
                      <div className="space-y-1.5">
                          <label className="text-sm font-medium text-on-surface">Email liên hệ</label>
                          <input type="email" defaultValue="admin@aidavision.gov.vn" className="w-full bg-surface-container border border-outline-variant/50 rounded-lg px-3 py-2 text-sm text-on-surface focus:outline-none focus:border-primary transition-colors" />
                      </div>
                      <div className="space-y-1.5">
                          <label className="text-sm font-medium text-on-surface">Vai trò</label>
                          <input type="text" defaultValue="Super Admin" disabled className="w-full bg-surface-container-low border border-outline-variant/30 rounded-lg px-3 py-2 text-sm text-on-surface-variant opacity-70" />
                      </div>
                  </div>
                  
                  <div className="pt-6 border-t border-outline-variant/30 flex justify-end gap-3">
                      <button className="px-4 py-2 text-sm font-medium text-on-surface-variant hover:text-on-surface transition-colors">Hủy</button>
                      <button className="bg-primary text-on-primary px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-fixed-dim transition-colors">Lưu thay đổi</button>
                  </div>
              </div>
          </div>
      </div>
    </div>
  );
}

function SettingsTab({ icon, label, active }: { icon: React.ReactNode, label: string, active?: boolean }) {
    return (
        <button className={cn(
            "w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm transition-colors text-left",
            active ? "bg-primary/10 text-primary font-medium" : "text-on-surface-variant hover:bg-surface-container hover:text-on-surface"
        )}>
            {icon}
            {label}
        </button>
    )
}
