import { useState, useEffect } from 'react';
import { Shield, User, Bell, Database, Users, Settings, Plus, Trash2, Edit2, Check, X, ShieldAlert } from 'lucide-react';
import { cn } from '../lib/utils';
import { userApi, settingsApi, authApi, UserDto, SettingsDto } from '../lib/api';

type TabType = 'profile' | 'users' | 'system' | 'security' | 'notifications';

export function SettingsView() {
  const [activeTab, setActiveTab] = useState<TabType>('profile');
  const [currentUser, setCurrentUser] = useState<UserDto | null>(null);
  const [isOnline, setIsOnline] = useState(true);

  // User Management State
  const [usersList, setUsersList] = useState<UserDto[]>([]);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [userForm, setUserForm] = useState({
    id: '',
    username: '',
    email: '',
    password: '',
    fullName: '',
    role: 'operator',
    isActive: true
  });

  // System Settings State
  const [systemSettings, setSystemSettings] = useState<SettingsDto>({
    appName: 'Traffic Monitoring System',
    apiVersion: '1.0.0',
    detectionThreshold: 0.5,
    maxCameras: 100,
    retentionDays: 90
  });

  const [notificationMsg, setNotificationMsg] = useState<string | null>(null);

  const fetchUsers = async () => {
    try {
      const res = await userApi.list();
      setUsersList(res.data || []);
      setIsOnline(res.isOnline);
    } catch (err) {
      console.error('Fetch users error:', err);
    }
  };

  const fetchSettings = async () => {
    try {
      const res = await settingsApi.get();
      if (res.data) {
        setSystemSettings(res.data);
      }
      setIsOnline(res.isOnline);
    } catch (err) {
      console.error('Fetch settings error:', err);
    }
  };

  useEffect(() => {
    const user = authApi.getCurrentUser();
    setCurrentUser(user);

    fetchUsers();
    fetchSettings();
  }, []);

  const isAdmin = currentUser?.role === 'admin';

  const showNotification = (msg: string) => {
    setNotificationMsg(msg);
    setTimeout(() => setNotificationMsg(null), 3500);
  };

  // User Form Actions
  const handleUserFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (userForm.id) {
        await userApi.update(userForm.id, {
          email: userForm.email,
          fullName: userForm.fullName,
          role: userForm.role,
          isActive: userForm.isActive
        });
        showNotification('Cập nhật người dùng thành công!');
      } else {
        await userApi.create({
          username: userForm.username,
          email: userForm.email,
          password: userForm.password,
          fullName: userForm.fullName,
          role: userForm.role
        });
        showNotification('Thêm người dùng thành công!');
      }
      await fetchUsers();
      setIsUserModalOpen(false);
    } catch (err: any) {
      alert('Lỗi: ' + (err.message || 'Thao tác không thành công.'));
    }
  };

  const handleEditUser = (user: UserDto) => {
    setUserForm({
      id: user.id,
      username: user.username,
      email: user.email,
      password: '', // Password is not edited here
      fullName: user.fullName || '',
      role: user.role || 'operator',
      isActive: user.isActive
    });
    setIsUserModalOpen(true);
  };

  const handleDeleteUser = async (id: string) => {
    if (currentUser && currentUser.id === id) {
      alert('Bạn không thể xóa tài khoản chính mình!');
      return;
    }
    if (window.confirm('Bạn có chắc chắn muốn xóa tài khoản này không?')) {
      try {
        await userApi.delete(id);
        showNotification('Xóa người dùng thành công!');
        await fetchUsers();
      } catch (err: any) {
        alert('Lỗi xóa người dùng: ' + (err.message || 'Xóa thất bại'));
      }
    }
  };

  const handleToggleUserStatus = async (user: UserDto) => {
    if (currentUser && currentUser.id === user.id) {
      alert('Bạn không thể khóa tài khoản chính mình!');
      return;
    }
    try {
      await userApi.update(user.id, {
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        isActive: !user.isActive
      });
      showNotification(`Đã ${!user.isActive ? 'mở khóa' : 'khóa'} tài khoản thành công!`);
      await fetchUsers();
    } catch (err: any) {
      alert('Lỗi thay đổi trạng thái: ' + (err.message || 'Cập nhật thất bại'));
    }
  };

  // System Settings Action
  const handleSettingsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await settingsApi.update({
        appName: systemSettings.appName,
        detectionThreshold: systemSettings.detectionThreshold,
        maxCameras: systemSettings.maxCameras,
        retentionDays: systemSettings.retentionDays
      });
      if (res.data) {
        setSystemSettings(res.data);
      }
      showNotification('Đã lưu cấu hình hệ thống thành công!');
    } catch (err: any) {
      alert('Lỗi lưu cấu hình: ' + (err.message || 'Lưu thất bại'));
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-on-surface">Cài đặt hệ thống</h1>
          <p className="text-on-surface-variant mt-1 text-sm">
            Quản lý tài khoản, phân quyền, cấu hình hệ thống và an ninh bảo mật.
            <span className="text-secondary font-semibold font-mono ml-2">
              [{isOnline ? 'ONLINE (FastAPI)' : 'OFFLINE MODE'}]
            </span>
          </p>
        </div>
        
        {notificationMsg && (
          <div className="bg-secondary/10 border border-secondary/30 text-secondary px-4 py-2 rounded-lg text-xs font-semibold animate-fade-in flex items-center gap-1.5 shadow-md">
            <Check className="w-4 h-4" />
            {notificationMsg}
          </div>
        )}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="col-span-1 space-y-1">
              <SettingsTab 
                icon={<User className="w-4 h-4" />} 
                label="Hồ sơ cá nhân" 
                active={activeTab === 'profile'} 
                onClick={() => setActiveTab('profile')} 
              />
              
              {isAdmin && (
                <>
                  <SettingsTab 
                    icon={<Users className="w-4 h-4" />} 
                    label="Quản lý Tài khoản" 
                    active={activeTab === 'users'} 
                    onClick={() => setActiveTab('users')} 
                  />
                  <SettingsTab 
                    icon={<Settings className="w-4 h-4" />} 
                    label="Cấu hình Hệ thống" 
                    active={activeTab === 'system'} 
                    onClick={() => setActiveTab('system')} 
                  />
                </>
              )}

              <SettingsTab 
                icon={<Shield className="w-4 h-4" />} 
                label="Bảo mật & 2FA" 
                active={activeTab === 'security'} 
                onClick={() => setActiveTab('security')} 
              />
              <SettingsTab 
                icon={<Bell className="w-4 h-4" />} 
                label="Thông báo" 
                active={activeTab === 'notifications'} 
                onClick={() => setActiveTab('notifications')} 
              />
          </div>
          
          <div className="col-span-1 md:col-span-3 bg-surface-container-lowest rounded-xl border border-outline-variant/30 p-6 shadow-sm min-h-[450px]">
              
              {/* Tab 1: Profile */}
              {activeTab === 'profile' && (
                <div className="space-y-6 animate-fade-in">
                    <h3 className="text-lg font-semibold text-on-surface mb-6">Thông tin cá nhân</h3>
                    
                    <div className="flex items-center gap-6">
                        <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-2xl border border-primary/30">
                            {(currentUser?.fullName || currentUser?.username || 'A').charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <button className="bg-surface-container hover:bg-surface-container-high text-on-surface px-4 py-2 rounded-lg text-sm font-medium transition-colors border border-outline-variant/30 cursor-pointer">
                                Thay đổi ảnh đại diện
                            </button>
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-on-surface">Họ và tên</label>
                            <input 
                              type="text" 
                              defaultValue={currentUser?.fullName || ''} 
                              placeholder="Họ và tên..."
                              className="w-full bg-surface border border-outline-variant/50 rounded-lg px-3 py-2 text-sm text-on-surface focus:outline-none focus:border-primary transition-colors" 
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-on-surface">Tên đăng nhập (Username)</label>
                            <input 
                              type="text" 
                              value={currentUser?.username || ''} 
                              disabled 
                              className="w-full bg-surface-container border border-outline-variant/30 rounded-lg px-3 py-2 text-sm text-on-surface-variant opacity-70 cursor-not-allowed" 
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-on-surface">Email liên hệ</label>
                            <input 
                              type="email" 
                              defaultValue={currentUser?.email || ''} 
                              className="w-full bg-surface border border-outline-variant/50 rounded-lg px-3 py-2 text-sm text-on-surface focus:outline-none focus:border-primary transition-colors" 
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-on-surface">Vai trò phân quyền</label>
                            <input 
                              type="text" 
                              value={currentUser?.role === 'admin' ? 'Super Admin' : 'Operator (Điều hành viên)'} 
                              disabled 
                              className="w-full bg-surface-container border border-outline-variant/30 rounded-lg px-3 py-2 text-sm text-on-surface-variant opacity-70 cursor-not-allowed font-semibold" 
                            />
                        </div>
                    </div>
                    
                    <div className="pt-6 border-t border-outline-variant/30 flex justify-end gap-3">
                        <button className="px-4 py-2 text-sm font-medium text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer">Hủy</button>
                        <button className="bg-primary text-on-primary px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-fixed-dim transition-colors cursor-pointer">Lưu thay đổi</button>
                    </div>
                </div>
              )}

              {/* Tab 2: User Management (Admin Only) */}
              {activeTab === 'users' && isAdmin && (
                <div className="space-y-6 animate-fade-in">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold text-on-surface">Danh sách nhân sự & Điều hành viên</h3>
                    <button 
                      onClick={() => {
                        setUserForm({ id: '', username: '', email: '', password: '', fullName: '', role: 'operator', isActive: true });
                        setIsUserModalOpen(true);
                      }}
                      className="bg-primary text-on-primary px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-primary-fixed-dim transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-4 h-4" /> Thêm thành viên
                    </button>
                  </div>

                  <div className="border border-outline-variant/30 rounded-xl overflow-hidden bg-surface-container-lowest">
                    <table className="w-full border-collapse text-left text-sm text-on-surface">
                      <thead className="bg-surface border-b border-outline-variant/30">
                        <tr>
                          <th className="p-4 font-semibold">Họ và tên / Username</th>
                          <th className="p-4 font-semibold">Email</th>
                          <th className="p-4 font-semibold">Vai trò</th>
                          <th className="p-4 font-semibold">Trạng thái</th>
                          <th className="p-4 font-semibold text-right">Thao tác</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-outline-variant/20">
                        {usersList.map((user) => (
                          <tr key={user.id} className="hover:bg-surface transition-colors">
                            <td className="p-4">
                              <div className="font-semibold">{user.fullName || 'Chưa đặt tên'}</div>
                              <div className="text-xs text-on-surface-variant font-mono">@{user.username}</div>
                            </td>
                            <td className="p-4 text-on-surface-variant text-xs">{user.email}</td>
                            <td className="p-4">
                              <span className={cn(
                                "px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase font-mono",
                                user.role === 'admin' ? "bg-primary/20 text-primary border border-primary/20" : "bg-secondary/20 text-secondary border border-secondary/20"
                              )}>
                                {user.role}
                              </span>
                            </td>
                            <td className="p-4">
                              <span className={cn(
                                "inline-flex items-center gap-1 text-xs font-semibold",
                                user.isActive ? "text-secondary" : "text-error"
                              )}>
                                <span className={cn("w-1.5 h-1.5 rounded-full", user.isActive ? "bg-secondary" : "bg-error")}></span>
                                {user.isActive ? 'Hoạt động' : 'Bị khóa'}
                              </span>
                            </td>
                            <td className="p-4 text-right">
                              <div className="flex justify-end gap-2">
                                <button 
                                  onClick={() => handleToggleUserStatus(user)}
                                  className={cn(
                                    "px-2 py-1 text-xs rounded border cursor-pointer font-medium",
                                    user.isActive ? "border-error/30 text-error hover:bg-error/10" : "border-secondary/30 text-secondary hover:bg-secondary/10"
                                  )}
                                  title={user.isActive ? 'Khóa tài khoản' : 'Kích hoạt tài khoản'}
                                >
                                  {user.isActive ? 'Khóa' : 'Kích hoạt'}
                                </button>
                                <button 
                                  onClick={() => handleEditUser(user)}
                                  className="p-1 border border-outline-variant/30 text-on-surface hover:text-primary hover:bg-primary/10 rounded cursor-pointer"
                                  title="Chỉnh sửa"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button 
                                  onClick={() => handleDeleteUser(user.id)}
                                  className="p-1 border border-outline-variant/30 text-on-surface hover:text-error hover:bg-error/10 rounded cursor-pointer"
                                  title="Xóa tài khoản"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Tab 3: System Settings (Admin Only) */}
              {activeTab === 'system' && isAdmin && (
                <form onSubmit={handleSettingsSubmit} className="space-y-6 animate-fade-in">
                  <h3 className="text-lg font-semibold text-on-surface mb-6">Cấu hình Hệ thống & Bộ phân tích AI</h3>
                  
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-on-surface">Tên Hệ thống ứng dụng (app_name)</label>
                      <input 
                        type="text" 
                        value={systemSettings.appName}
                        onChange={(e) => setSystemSettings({ ...systemSettings, appName: e.target.value })}
                        className="w-full bg-surface border border-outline-variant/50 rounded-lg px-3 py-2 text-sm text-on-surface focus:outline-none focus:border-primary transition-colors" 
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium text-on-surface">Phiên bản Hệ thống (Version)</label>
                        <input 
                          type="text" 
                          value={systemSettings.apiVersion}
                          disabled
                          className="w-full bg-surface-container border border-outline-variant/30 rounded-lg px-3 py-2 text-sm text-on-surface-variant opacity-70 cursor-not-allowed" 
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium text-on-surface">Giới hạn số Camera tối đa</label>
                        <input 
                          type="number" 
                          value={systemSettings.maxCameras}
                          onChange={(e) => setSystemSettings({ ...systemSettings, maxCameras: parseInt(e.target.value) || 100 })}
                          className="w-full bg-surface border border-outline-variant/50 rounded-lg px-3 py-2 text-sm text-on-surface focus:outline-none focus:border-primary transition-colors" 
                          min={1}
                        />
                      </div>
                    </div>

                    <div className="space-y-3 bg-surface p-4 rounded-xl border border-outline-variant/20">
                      <div className="flex justify-between items-center">
                        <label className="text-sm font-medium text-on-surface flex items-center gap-1.5">
                          Ngưỡng tin cậy nhận diện YOLO (`detection_threshold`)
                        </label>
                        <span className="font-mono text-primary font-bold bg-primary/10 px-2 py-0.5 rounded text-xs">
                          {systemSettings.detectionThreshold.toFixed(2)}
                        </span>
                      </div>
                      <input 
                        type="range" 
                        min="0.1" 
                        max="0.99" 
                        step="0.01"
                        value={systemSettings.detectionThreshold}
                        onChange={(e) => setSystemSettings({ ...systemSettings, detectionThreshold: parseFloat(e.target.value) || 0.5 })}
                        className="w-full h-1 bg-surface-container-high rounded-lg appearance-none cursor-pointer accent-primary"
                      />
                      <p className="text-[10px] text-on-surface-variant">
                        * Mức độ tự tin tối thiểu (0.1 - 0.99) của mô hình AI để ghi nhận phương tiện hoặc lỗi vi phạm.
                      </p>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-on-surface">Số ngày lưu trữ hình ảnh chứng cứ (Retention Days)</label>
                      <input 
                        type="number" 
                        value={systemSettings.retentionDays}
                        onChange={(e) => setSystemSettings({ ...systemSettings, retentionDays: parseInt(e.target.value) || 90 })}
                        className="w-full bg-surface border border-outline-variant/50 rounded-lg px-3 py-2 text-sm text-on-surface focus:outline-none focus:border-primary transition-colors" 
                        min={1}
                      />
                      <span className="text-[10px] text-on-surface-variant block mt-1">
                        * Sau thời gian này, các hình ảnh vi phạm giao thông cũ sẽ tự động bị dọn dẹp khỏi ổ đĩa server.
                      </span>
                    </div>
                  </div>

                  <div className="pt-6 border-t border-outline-variant/30 flex justify-end gap-3">
                    <button 
                      type="button" 
                      onClick={fetchSettings}
                      className="px-4 py-2 text-sm font-medium text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer"
                    >
                      Hoàn tác
                    </button>
                    <button 
                      type="submit"
                      className="bg-primary text-on-primary px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-fixed-dim transition-colors flex items-center gap-1 shadow-md cursor-pointer"
                    >
                      <Check className="w-4 h-4" /> Lưu cấu hình AI
                    </button>
                  </div>
                </form>
              )}

              {/* Tab 4: Security (Mock) */}
              {activeTab === 'security' && (
                <div className="space-y-6 animate-fade-in">
                  <h3 className="text-lg font-semibold text-on-surface mb-6">Bảo mật & Xác thực hai lớp (2FA)</h3>
                  
                  <div className="space-y-4">
                    <div className="p-4 bg-surface rounded-xl border border-outline-variant/20 flex items-start gap-4">
                      <ShieldAlert className="w-5 h-5 text-secondary shrink-0 mt-0.5" />
                      <div>
                        <div className="text-sm font-bold text-on-surface">Xác thực OTP Authenticator đang hoạt động</div>
                        <p className="text-xs text-on-surface-variant mt-1">
                          Mỗi lần đăng nhập bạn sẽ phải nhập mã 6 số được sinh ngẫu nhiên từ ứng dụng bảo mật của bạn.
                        </p>
                      </div>
                    </div>

                    <div className="border-t border-outline-variant/30 pt-6 space-y-4">
                      <h4 className="text-sm font-semibold text-on-surface">Thay đổi mật khẩu tài khoản</h4>
                      <p className="text-xs text-on-surface-variant">Sử dụng tính năng đổi mật khẩu kết nối trực tiếp với backend (/auth/change-password).</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 5: Notifications (Mock) */}
              {activeTab === 'notifications' && (
                <div className="space-y-6 animate-fade-in">
                  <h3 className="text-lg font-semibold text-on-surface mb-6">Thông báo & Cảnh báo âm thanh</h3>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-surface rounded-xl border border-outline-variant/20">
                      <div>
                        <div className="text-sm font-bold text-on-surface">Âm thanh khi có vi phạm mới</div>
                        <p className="text-xs text-on-surface-variant">Phát tiếng động bíp nhẹ khi phát hiện vi phạm cần phê duyệt.</p>
                      </div>
                      <input type="checkbox" defaultChecked className="w-4 h-4 rounded text-primary border-outline-variant accent-primary cursor-pointer" />
                    </div>

                    <div className="flex items-center justify-between p-3 bg-surface rounded-xl border border-outline-variant/20">
                      <div>
                        <div className="text-sm font-bold text-on-surface">Thông báo khẩn cấp qua Email</div>
                        <p className="text-xs text-on-surface-variant">Gửi mail báo cáo hàng ngày vào lúc 23:59 cho Quản trị viên.</p>
                      </div>
                      <input type="checkbox" defaultChecked className="w-4 h-4 rounded text-primary border-outline-variant accent-primary cursor-pointer" />
                    </div>
                  </div>
                </div>
              )}
          </div>
      </div>

      {/* User Create / Edit Modal */}
      {isUserModalOpen && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={handleUserFormSubmit} className="w-full max-w-md bg-surface-container border border-outline-variant/30 rounded-xl shadow-2xl overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-outline-variant/30 flex justify-between items-center bg-surface">
              <h3 className="text-base font-bold text-on-surface flex items-center gap-2">
                {userForm.id ? <Edit2 className="w-5 h-5 text-primary" /> : <Plus className="w-5 h-5 text-primary" />}
                {userForm.id ? 'Cập nhật thông tin tài khoản' : 'Tạo tài khoản Điều phối mới'}
              </h3>
              <button 
                type="button"
                onClick={() => setIsUserModalOpen(false)}
                className="p-1 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 flex-1 overflow-y-auto">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-on-surface">Họ và tên *</label>
                <input 
                  type="text" 
                  value={userForm.fullName}
                  onChange={(e) => setUserForm({ ...userForm, fullName: e.target.value })}
                  placeholder="Ví dụ: Nguyễn Văn A" 
                  className="w-full bg-surface border border-outline-variant/50 rounded-lg px-3 py-2 text-sm text-on-surface focus:outline-none focus:border-primary transition-colors" 
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-on-surface">Tên đăng nhập (Username) *</label>
                <input 
                  type="text" 
                  value={userForm.username}
                  onChange={(e) => setUserForm({ ...userForm, username: e.target.value })}
                  placeholder="Ví dụ: operator_a" 
                  disabled={!!userForm.id}
                  className={cn(
                    "w-full bg-surface border border-outline-variant/50 rounded-lg px-3 py-2 text-sm text-on-surface focus:outline-none focus:border-primary transition-colors",
                    userForm.id && "bg-surface-container opacity-70 cursor-not-allowed"
                  )}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-on-surface">Địa chỉ Email *</label>
                <input 
                  type="email" 
                  value={userForm.email}
                  onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                  placeholder="Ví dụ: a.nguyen@traffic.local" 
                  className="w-full bg-surface border border-outline-variant/50 rounded-lg px-3 py-2 text-sm text-on-surface focus:outline-none focus:border-primary transition-colors" 
                  required
                />
              </div>

              {!userForm.id && (
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-on-surface">Mật khẩu ban đầu *</label>
                  <input 
                    type="password" 
                    value={userForm.password}
                    onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                    placeholder="Nhập mật khẩu..." 
                    className="w-full bg-surface border border-outline-variant/50 rounded-lg px-3 py-2 text-sm text-on-surface focus:outline-none focus:border-primary transition-colors" 
                    required
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-on-surface">Vai trò phân quyền</label>
                  <select 
                    value={userForm.role}
                    onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}
                    className="w-full bg-surface border border-outline-variant/50 rounded-lg px-3 py-2 text-sm text-on-surface focus:outline-none focus:border-primary transition-colors"
                  >
                    <option value="operator">Operator (Điều hành)</option>
                    <option value="admin">Admin (Quản trị)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-on-surface">Trạng thái kích hoạt</label>
                  <select 
                    value={userForm.isActive ? 'active' : 'inactive'}
                    onChange={(e) => setUserForm({ ...userForm, isActive: e.target.value === 'active' })}
                    className="w-full bg-surface border border-outline-variant/50 rounded-lg px-3 py-2 text-sm text-on-surface focus:outline-none focus:border-primary transition-colors"
                  >
                    <option value="active">Cho phép hoạt động</option>
                    <option value="inactive">Khóa tài khoản</option>
                  </select>
                </div>
              </div>

            </div>

            <div className="px-6 py-4 border-t border-outline-variant/30 flex justify-end gap-3 bg-surface">
              <button 
                type="button"
                onClick={() => setIsUserModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors rounded-lg cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button 
                type="submit"
                className="bg-primary text-on-primary px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-fixed-dim transition-colors flex items-center gap-1 shadow-md cursor-pointer"
              >
                {userForm.id ? 'Lưu cập nhật' : 'Tạo mới'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

interface SettingsTabProps {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onClick: () => void;
}

function SettingsTab({ icon, label, active, onClick }: SettingsTabProps) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm transition-colors text-left cursor-pointer",
        active ? "bg-primary/10 text-primary font-semibold border-l-2 border-primary" : "text-on-surface-variant hover:bg-surface-container hover:text-on-surface"
      )}
    >
      {icon}
      {label}
    </button>
  );
}
