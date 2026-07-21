/**
 * View Admin Users (`AdminUsersView`):
 * Giao diện Quản lý Người dùng dành riêng cho Admin.
 * Dựa trên toàn bộ các endpoint người dùng có sẵn ở backend FastAPI `/api/v1/users`:
 * - Lấy danh sách tài khoản phân trang (GET /users?page=...&pageSize=...)
 * - Tạo người dùng mới với vai trò Admin / Operator (POST /users)
 * - Cập nhật email, họ tên, vai trò và khóa/mở khóa tài khoản (PUT /users/{id})
 * - Xóa người dùng khỏi hệ thống (DELETE /users/{id})
 */

import { useState, useEffect } from 'react';
import { Users, UserPlus, Search, Shield, User, CheckCircle2, XCircle, Trash2, Edit3, RefreshCw, AlertTriangle, X, Eye, EyeOff } from 'lucide-react';
import { userApi, UserDto } from '../../lib/api';
import { authApi } from '../../lib/api';

export function AdminUsersView() {
  // Trạng thái danh sách người dùng & phân trang
  const [users, setUsers] = useState<UserDto[]>([]);
  const [totalUsers, setTotalUsers] = useState<number>(0);
  const [page, setPage] = useState<number>(1);
  const pageSize = 10;

  // Lọc và Tìm kiếm
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Trạng thái bật/tắt các Modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [selectedUser, setSelectedUser] = useState<UserDto | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
  const [userToDelete, setUserToDelete] = useState<UserDto | null>(null);

  // Các trường Form - Tạo người dùng mới
  const [newUsername, setNewUsername] = useState<string>('');
  const [newEmail, setNewEmail] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [newFullName, setNewFullName] = useState<string>('');
  const [newRole, setNewRole] = useState<'admin' | 'operator'>('operator');

  // Trạng thái hiển thị/ẩn mật khẩu khởi tạo
  const [showNewPassword, setShowNewPassword] = useState<boolean>(false);

  // Các trường Form - Cập nhật người dùng
  const [editEmail, setEditEmail] = useState<string>('');
  const [editFullName, setEditFullName] = useState<string>('');
  const [editRole, setEditRole] = useState<'admin' | 'operator'>('operator');
  const [editIsActive, setEditIsActive] = useState<boolean>(true);

  // Thông tin Admin hiện tại đang đăng nhập
  const currentUser = authApi.getCurrentUser();

  /**
   * Gọi API lấy danh sách người dùng từ Backend (GET /api/v1/users)
   */
  const fetchUsers = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await userApi.list(page, pageSize);
      setUsers(res.data || []);
      setTotalUsers(res.total || res.data.length);
    } catch (err: any) {
      setError(err.message || 'Không thể tải danh sách người dùng.');
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  }, [page]);

  /**
   * Hiển thị thông báo Toast phản hồi nhanh
   */
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  /**
   * Xử lý Submit Form Tạo người dùng mới (POST /api/v1/users)
   */
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await userApi.create({
        username: newUsername,
        email: newEmail,
        password: newPassword,
        fullName: newFullName,
        role: newRole
      });
      showToast('Tạo người dùng mới thành công!');
      setIsCreateModalOpen(false);
      // Reset form
      setNewUsername('');
      setNewEmail('');
      setNewPassword('');
      setNewFullName('');
      setNewRole('operator');
      fetchUsers();
    } catch (err: any) {
      setError(err.message || 'Tạo người dùng thất bại.');
    }
  };

  /**
   * Mở Modal Cập nhật thông tin cho User được chọn
   */
  const openEditModal = (user: UserDto) => {
    setSelectedUser(user);
    setEditEmail(user.email);
    setEditFullName(user.fullName || '');
    setEditRole((user.role === 'admin' ? 'admin' : 'operator'));
    setEditIsActive(user.isActive);
    setIsEditModalOpen(true);
  };

  /**
   * Xử lý Submit Form Cập nhật người dùng (PUT /api/v1/users/{id})
   */
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    setError(null);
    try {
      await userApi.update(selectedUser.id, {
        email: editEmail,
        fullName: editFullName,
        role: editRole,
        isActive: editIsActive
      });
      showToast('Cập nhật người dùng thành công!');
      setIsEditModalOpen(false);
      fetchUsers();
    } catch (err: any) {
      setError(err.message || 'Cập nhật người dùng thất bại.');
    }
  };

  /**
   * Mở Modal xác nhận xóa tài khoản (chống xóa chính mình)
   */
  const openDeleteModal = (user: UserDto) => {
    if (currentUser && currentUser.id === user.id) {
      showToast('⚠️ Không thể tự xóa tài khoản của chính mình.');
      return;
    }
    setUserToDelete(user);
    setIsDeleteModalOpen(true);
  };

  /**
   * Xác nhận xóa tài khoản qua API (DELETE /api/v1/users/{id})
   */
  const handleDeleteConfirm = async () => {
    if (!userToDelete) return;
    try {
      await userApi.delete(userToDelete.id);
      showToast('Xóa người dùng thành công!');
      setIsDeleteModalOpen(false);
      setUserToDelete(null);
      fetchUsers();
    } catch (err: any) {
      setError(err.message || 'Xóa người dùng thất bại.');
    }
  };

  // Lọc danh sách hiển thị theo từ khóa tìm kiếm & Vai trò
  const filteredUsers = users.filter(u => {
    const matchesSearch = 
      u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.fullName && u.fullName.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;

    return matchesSearch && matchesRole;
  });

  const totalPages = Math.ceil(totalUsers / pageSize) || 1;

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-surface-container-highest/95 backdrop-blur-md border border-emerald-500/40 text-emerald-400 px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-toast-enter">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <span className="text-sm font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-surface-container-lowest border border-outline-variant/30 rounded-3xl p-6 shadow-xl">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/30 flex items-center justify-center text-primary">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-on-surface tracking-tight">Quản lý Người dùng</h1>
            <p className="text-xs text-on-surface-variant mt-0.5">Danh sách & Phân quyền tài khoản hệ thống (API /users)</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchUsers}
            disabled={isLoading}
            className="px-3.5 py-2.5 rounded-xl bg-surface-container-high border border-outline-variant/40 hover:bg-surface-container-highest text-on-surface text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            Tải lại
          </button>

          <button
            onClick={() => { setError(null); setIsCreateModalOpen(true); }}
            className="px-4 py-2.5 rounded-xl bg-primary hover:bg-primary-fixed-dim text-on-primary text-xs font-semibold flex items-center gap-2 transition-all shadow-md cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            Tạo người dùng mới
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-error/10 border border-error/30 text-error rounded-2xl text-xs font-semibold flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Thanh Tìm kiếm & Bộ Lọc Vai Trò */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-surface-container-lowest border border-outline-variant/30 rounded-2xl p-4 shadow-md">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm theo username, email, hoặc họ tên..."
            className="w-full bg-surface border border-outline-variant/40 rounded-xl pl-10 pr-4 py-2 text-xs text-on-surface focus:outline-none focus:border-primary transition-all"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <label className="text-xs text-on-surface-variant font-medium shrink-0">Lọc Vai Trò:</label>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="bg-surface border border-outline-variant/40 rounded-xl px-3 py-2 text-xs text-on-surface focus:outline-none focus:border-primary transition-all cursor-pointer"
          >
            <option value="all">Tất cả vai trò</option>
            <option value="admin">Admin</option>
            <option value="operator">Operator</option>
          </select>
        </div>
      </div>

      {/* Bảng Dữ Liệu Người Dùng */}
      <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-3xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-surface-container-high/60 border-b border-outline-variant/30 text-on-surface-variant font-semibold uppercase tracking-wider">
                <th className="py-3.5 px-4">Người dùng</th>
                <th className="py-3.5 px-4">Họ và tên</th>
                <th className="py-3.5 px-4">Email</th>
                <th className="py-3.5 px-4">Vai trò</th>
                <th className="py-3.5 px-4">Trạng thái</th>
                <th className="py-3.5 px-4">Ngày tạo</th>
                <th className="py-3.5 px-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/20">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-on-surface-variant">
                    <div className="flex justify-center items-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin text-primary" />
                      <span>Đang tải danh sách người dùng...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-on-surface-variant">
                    Không tìm thấy người dùng nào phù hợp.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="table-row-hover">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                          user.role === 'admin' 
                            ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' 
                            : 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                        }`}>
                          {user.username.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-bold text-on-surface flex items-center gap-1.5">
                            {user.username}
                            {currentUser && currentUser.id === user.id && (
                              <span className="text-[10px] bg-primary/20 text-primary border border-primary/30 px-1.5 py-0.2 rounded font-mono">Tôi</span>
                            )}
                          </div>
                          <div className="text-[10px] text-on-surface-variant font-mono">{user.id.substring(0, 8)}...</div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-medium text-on-surface">
                      {user.fullName || <span className="text-on-surface-variant italic">—</span>}
                    </td>

                    <td className="py-3.5 px-4 text-on-surface-variant font-mono">
                      {user.email}
                    </td>

                    <td className="py-3.5 px-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold border ${
                        user.role === 'admin'
                          ? 'bg-purple-500/10 text-purple-400 border-purple-500/30'
                          : 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30'
                      }`}>
                        {user.role === 'admin' ? <Shield className="w-3 h-3" /> : <User className="w-3 h-3" />}
                        {user.role.toUpperCase()}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold border ${
                        user.isActive
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                          : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                      }`}>
                        {user.isActive ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                        {user.isActive ? 'Hoạt động' : 'Bị khóa'}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-on-surface-variant text-[11px] font-mono">
                      {new Date(user.createdAt).toLocaleDateString('vi-VN')}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openEditModal(user)}
                          className="p-1.5 rounded-lg bg-surface-container-high border border-outline-variant/30 hover:bg-primary/10 hover:text-primary transition-all text-on-surface-variant cursor-pointer"
                          title="Sửa người dùng"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => openDeleteModal(user)}
                          disabled={currentUser && currentUser.id === user.id}
                          className="p-1.5 rounded-lg bg-surface-container-high border border-outline-variant/30 hover:bg-rose-500/10 hover:text-rose-400 transition-all text-on-surface-variant cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                          title="Xóa người dùng"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Thanh Điều hướng Phân trang */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-outline-variant/20 bg-surface-container-high/30">
          <div className="text-xs text-on-surface-variant font-mono">
            Hiển thị <span className="font-bold text-on-surface">{filteredUsers.length}</span> / <span className="font-bold text-on-surface">{totalUsers}</span> tài khoản
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="px-3 py-1.5 rounded-lg bg-surface-container-high border border-outline-variant/40 hover:bg-surface-container-highest text-xs text-on-surface disabled:opacity-40 transition-all cursor-pointer"
            >
              Trang trước
            </button>
            <span className="text-xs font-mono px-2 text-on-surface">
              Trang {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="px-3 py-1.5 rounded-lg bg-surface-container-high border border-outline-variant/40 hover:bg-surface-container-highest text-xs text-on-surface disabled:opacity-40 transition-all cursor-pointer"
            >
              Trang sau
            </button>
          </div>
        </div>
      </div>

      {/* Modal: Tạo Người dùng Mới */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-card border border-outline-variant/30 rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-5 animate-modal-enter">
            <div className="flex items-center justify-between pb-3 border-b border-outline-variant/20">
              <div className="flex items-center gap-2.5 text-primary">
                <UserPlus className="w-5 h-5" />
                <h3 className="text-lg font-bold text-on-surface">Tạo Người Dùng Mới</h3>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-on-surface-variant hover:text-on-surface p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-on-surface">Tên đăng nhập (Username) *</label>
                <input
                  type="text"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  placeholder="admin_vp..."
                  className="w-full bg-surface border border-outline-variant/40 rounded-xl px-3.5 py-2.5 text-xs text-on-surface focus:outline-none focus:border-primary transition-all"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-on-surface">Địa chỉ Email *</label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="user@traffic.local"
                  className="w-full bg-surface border border-outline-variant/40 rounded-xl px-3.5 py-2.5 text-xs text-on-surface focus:outline-none focus:border-primary transition-all"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-on-surface">Mật khẩu khởi tạo *</label>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="•••••••• (tối thiểu 6 ký tự)"
                    className="w-full bg-surface border border-outline-variant/40 rounded-xl pl-3.5 pr-10 py-2.5 text-xs text-on-surface focus:outline-none focus:border-primary transition-all"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface p-1 transition-colors cursor-pointer"
                    title={showNewPassword ? 'Ẩn mật khẩu' : 'Hiển thị mật khẩu'}
                  >
                    {showNewPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-on-surface">Họ và tên</label>
                <input
                  type="text"
                  value={newFullName}
                  onChange={(e) => setNewFullName(e.target.value)}
                  placeholder="Nguyễn Văn A"
                  className="w-full bg-surface border border-outline-variant/40 rounded-xl px-3.5 py-2.5 text-xs text-on-surface focus:outline-none focus:border-primary transition-all"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-on-surface">Phân quyền (Role) *</label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as 'admin' | 'operator')}
                  className="w-full bg-surface border border-outline-variant/40 rounded-xl px-3.5 py-2.5 text-xs text-on-surface focus:outline-none focus:border-primary transition-all cursor-pointer"
                >
                  <option value="operator">Operator (Người vận hành)</option>
                  <option value="admin">Admin (Quản trị hệ thống)</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-outline-variant/20">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-surface-container-high border border-outline-variant/40 hover:bg-surface-container-highest text-xs text-on-surface font-semibold transition-all cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-primary hover:bg-primary-fixed-dim text-on-primary text-xs font-semibold transition-all shadow-md cursor-pointer"
                >
                  Tạo Tài Khoản
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Cập Nhật Người Dùng */}
      {isEditModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-card border border-outline-variant/30 rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-5 animate-modal-enter">
            <div className="flex items-center justify-between pb-3 border-b border-outline-variant/20">
              <div className="flex items-center gap-2.5 text-secondary">
                <Edit3 className="w-5 h-5" />
                <h3 className="text-lg font-bold text-on-surface">Cập Nhật Người Dùng</h3>
              </div>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="text-on-surface-variant hover:text-on-surface p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-on-surface">Tên đăng nhập (Username)</label>
                <input
                  type="text"
                  value={selectedUser.username}
                  disabled
                  className="w-full bg-surface-container-high border border-outline-variant/30 rounded-xl px-3.5 py-2.5 text-xs text-on-surface-variant font-semibold cursor-not-allowed opacity-75"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-on-surface">Địa chỉ Email</label>
                <input
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="w-full bg-surface border border-outline-variant/40 rounded-xl px-3.5 py-2.5 text-xs text-on-surface focus:outline-none focus:border-primary transition-all"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-on-surface">Họ và tên</label>
                <input
                  type="text"
                  value={editFullName}
                  onChange={(e) => setEditFullName(e.target.value)}
                  className="w-full bg-surface border border-outline-variant/40 rounded-xl px-3.5 py-2.5 text-xs text-on-surface focus:outline-none focus:border-primary transition-all"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-on-surface">Phân quyền (Role)</label>
                <select
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value as 'admin' | 'operator')}
                  className="w-full bg-surface border border-outline-variant/40 rounded-xl px-3.5 py-2.5 text-xs text-on-surface focus:outline-none focus:border-primary transition-all cursor-pointer"
                >
                  <option value="operator">Operator (Người vận hành)</option>
                  <option value="admin">Admin (Quản trị hệ thống)</option>
                </select>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-surface-container-high/50 border border-outline-variant/30">
                <span className="text-xs font-medium text-on-surface">Trạng thái tài khoản (Active)</span>
                <button
                  type="button"
                  onClick={() => setEditIsActive(!editIsActive)}
                  className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer border ${
                    editIsActive
                      ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                      : 'bg-rose-500/20 text-rose-400 border-rose-500/40'
                  }`}
                >
                  {editIsActive ? 'Đang Hoạt Động' : 'Bị Khóa'}
                </button>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-outline-variant/20">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-surface-container-high border border-outline-variant/40 hover:bg-surface-container-highest text-xs text-on-surface font-semibold transition-all cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-secondary hover:bg-secondary/90 text-on-secondary text-xs font-semibold transition-all shadow-md cursor-pointer"
                >
                  Lưu Thay Đổi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Xác Nhận Xóa */}
      {isDeleteModalOpen && userToDelete && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-card border border-rose-500/30 rounded-3xl p-6 w-full max-w-sm shadow-2xl space-y-4 animate-modal-enter">
            <div className="flex justify-center">
              <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
                <Trash2 className="w-7 h-7" />
              </div>
            </div>

            <div className="text-center">
              <h3 className="text-lg font-bold text-on-surface">Xác nhận xóa tài khoản</h3>
              <p className="text-xs text-on-surface-variant mt-1">
                Bạn có chắc chắn muốn xóa tài khoản <span className="font-bold text-on-surface font-mono">{userToDelete.username}</span>? Hành động này không thể hoàn tác.
              </p>
            </div>

            <div className="flex gap-3 pt-3">
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="flex-1 py-2.5 rounded-xl bg-surface-container-high border border-outline-variant/40 hover:bg-surface-container-highest text-xs text-on-surface font-semibold transition-all cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="flex-1 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-semibold transition-all shadow-md cursor-pointer"
              >
                Xác nhận xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
