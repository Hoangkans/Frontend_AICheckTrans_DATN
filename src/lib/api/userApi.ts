/**
 * Module User Management API (`userApi`):
 * Xử lý các thao tác Quản lý Người dùng của Admin tương ứng với backend `/api/v1/users`:
 * - GET /users: Lấy danh sách tài khoản (có phân trang)
 * - GET /users/{id}: Lấy chi tiết thông tin 1 người dùng
 * - POST /users: Admin tạo tài khoản người dùng mới (chỉ định vai trò Admin/Operator)
 * - PUT /users/{id}: Admin cập nhật thông tin & khóa/kích hoạt tài khoản
 * - DELETE /users/{id}: Admin xóa tài khoản khỏi hệ thống
 */

import { request, checkBackendHealth } from './client';

/**
 * Interface DTO phản hồi thông tin người dùng
 */
export interface UserDto {
  id: string;
  username: string;
  email: string;
  fullName?: string;
  role: 'admin' | 'operator' | string;
  isActive: boolean;
  isEmailVerified?: boolean;
  emailVerifiedAt?: string | null;
  createdAt: string;
  updatedAt?: string | null;
}

/**
 * Interface tham số tạo người dùng mới bởi Admin
 */
export interface CreateUserParams {
  username: string;
  email: string;
  password: string;
  fullName?: string;
  role?: string;
}

/**
 * Interface tham số cập nhật thông tin người dùng bởi Admin
 */
export interface UpdateUserParams {
  email?: string;
  fullName?: string;
  role?: string;
  isActive?: boolean;
}

export const userApi = {
  /**
   * Lấy danh sách tất cả người dùng có phân trang (GET /api/v1/users?page=1&pageSize=10)
   * @param page Số trang hiện tại (bắt đầu từ 1)
   * @param pageSize Số lượng dòng trên mỗi trang
   */
  list: async (page = 1, pageSize = 10) => {
    const isOnline = await checkBackendHealth();
    if (isOnline) {
      try {
        const response = await request(`/users?page=${page}&pageSize=${pageSize}`);
        const mappedData: UserDto[] = response.data.map((u: any) => ({
          id: u.id,
          username: u.username,
          email: u.email,
          fullName: u.fullName || u.full_name || '',
          role: u.role,
          isActive: u.isActive !== undefined ? u.isActive : u.is_active,
          isEmailVerified: u.isEmailVerified !== undefined ? u.isEmailVerified : u.is_email_verified,
          emailVerifiedAt: u.emailVerifiedAt || u.email_verified_at,
          createdAt: u.createdAt || u.created_at,
          updatedAt: u.updatedAt || u.updated_at
        }));
        return {
          isOnline: true,
          data: mappedData,
          total: response.total || mappedData.length,
          page: response.page || page,
          pageSize: response.pageSize || pageSize
        };
      } catch (e) {
        console.error('Không thể lấy danh sách người dùng từ Backend:', e);
      }
    }

    // Chế độ dự phòng Offline khi không kết nối được backend
    const localUsers: UserDto[] = JSON.parse(localStorage.getItem('local_users') || '[]');
    const startIndex = (page - 1) * pageSize;
    const paginated = localUsers.slice(startIndex, startIndex + pageSize);
    return {
      isOnline: false,
      data: paginated,
      total: localUsers.length,
      page,
      pageSize
    };
  },

  /**
   * Lấy chi tiết thông tin 1 người dùng theo UUID (GET /api/v1/users/{id})
   * @param id ID người dùng (UUID)
   */
  getById: async (id: string) => {
    const isOnline = await checkBackendHealth();
    if (isOnline && !id.startsWith('USER-LOCAL-')) {
      const user = await request(`/users/${id}`);
      return {
        isOnline: true,
        data: {
          id: user.id,
          username: user.username,
          email: user.email,
          fullName: user.fullName || user.full_name || '',
          role: user.role,
          isActive: user.isActive !== undefined ? user.isActive : user.is_active,
          isEmailVerified: user.isEmailVerified !== undefined ? user.isEmailVerified : user.is_email_verified,
          emailVerifiedAt: user.emailVerifiedAt || user.email_verified_at,
          createdAt: user.createdAt || user.created_at,
          updatedAt: user.updatedAt || user.updated_at
        } as UserDto
      };
    } else {
      const localUsers: UserDto[] = JSON.parse(localStorage.getItem('local_users') || '[]');
      const user = localUsers.find(u => u.id === id);
      if (!user) throw new Error('Không tìm thấy người dùng.');
      return { isOnline: false, data: user };
    }
  },

  /**
   * Admin tạo tài khoản người dùng mới (POST /api/v1/users)
   * @param params Dữ liệu khởi tạo tài khoản mới (Username, Email, Password, FullName, Role)
   */
  create: async (params: CreateUserParams) => {
    const isOnline = await checkBackendHealth();
    if (isOnline) {
      const user = await request('/users', {
        method: 'POST',
        body: JSON.stringify({
          username: params.username,
          email: params.email,
          password: params.password,
          fullName: params.fullName,
          role: params.role || 'operator'
        })
      });
      return {
        isOnline: true,
        data: {
          id: user.id,
          username: user.username,
          email: user.email,
          fullName: user.fullName || user.full_name || '',
          role: user.role,
          isActive: user.isActive !== undefined ? user.isActive : user.is_active,
          createdAt: user.createdAt || user.created_at
        } as UserDto
      };
    } else {
      const localUsers: UserDto[] = JSON.parse(localStorage.getItem('local_users') || '[]');
      const existing = localUsers.find(u => u.username === params.username || u.email === params.email);
      if (existing) {
        throw new Error('Tên đăng nhập hoặc Email đã tồn tại.');
      }
      const newUser: UserDto = {
        id: `USER-LOCAL-${Math.floor(Math.random() * 1000)}`,
        username: params.username,
        email: params.email,
        fullName: params.fullName || params.username,
        role: params.role || 'operator',
        isActive: true,
        isEmailVerified: true,
        createdAt: new Date().toISOString()
      };
      localUsers.push(newUser);
      localStorage.setItem('local_users', JSON.stringify(localUsers));
      return { isOnline: false, data: newUser };
    }
  },

  /**
   * Admin cập nhật thông tin người dùng hoặc đổi trạng thái (PUT /api/v1/users/{id})
   * @param id ID người dùng
   * @param params Dữ liệu cần thay đổi (Email, FullName, Role, IsActive)
   */
  update: async (id: string, params: UpdateUserParams) => {
    const isOnline = await checkBackendHealth();
    if (isOnline && !id.startsWith('USER-LOCAL-')) {
      const user = await request(`/users/${id}`, {
        method: 'PUT',
        body: JSON.stringify({
          email: params.email,
          fullName: params.fullName,
          role: params.role,
          isActive: params.isActive
        })
      });
      return {
        isOnline: true,
        data: {
          id: user.id,
          username: user.username,
          email: user.email,
          fullName: user.fullName || user.full_name || '',
          role: user.role,
          isActive: user.isActive !== undefined ? user.isActive : user.is_active,
          createdAt: user.createdAt || user.created_at
        } as UserDto
      };
    } else {
      const localUsers: UserDto[] = JSON.parse(localStorage.getItem('local_users') || '[]');
      const updatedUsers = localUsers.map(u => {
        if (u.id === id) {
          return {
            ...u,
            email: params.email !== undefined ? params.email : u.email,
            fullName: params.fullName !== undefined ? params.fullName : u.fullName,
            role: params.role !== undefined ? params.role : u.role,
            isActive: params.isActive !== undefined ? params.isActive : u.isActive,
            updatedAt: new Date().toISOString()
          };
        }
        return u;
      });
      localStorage.setItem('local_users', JSON.stringify(updatedUsers));
      const targetUser = updatedUsers.find(u => u.id === id);
      return { isOnline: false, data: targetUser };
    }
  },

  /**
   * Admin xóa tài khoản người dùng khỏi hệ thống (DELETE /api/v1/users/{id})
   * @param id ID người dùng cần xóa
   */
  delete: async (id: string) => {
    const isOnline = await checkBackendHealth();
    if (isOnline && !id.startsWith('USER-LOCAL-')) {
      await request(`/users/${id}`, {
        method: 'DELETE'
      });
      return { isOnline: true };
    } else {
      const localUsers: UserDto[] = JSON.parse(localStorage.getItem('local_users') || '[]');
      const filtered = localUsers.filter(u => u.id !== id);
      localStorage.setItem('local_users', JSON.stringify(filtered));
      return { isOnline: false };
    }
  }
};
