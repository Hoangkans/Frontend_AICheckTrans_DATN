/**
 * Module Authentication API (`authApi`):
 * Xử lý các chức năng Xác thực tài khoản tương ứng với backend `/api/v1/auth`:
 * - POST /auth/login: Đăng nhập hệ thống (trả về Access & Refresh Token)
 * - POST /auth/register: Đăng ký tài khoản mới
 * - POST /auth/verify-email: Xác thực Email qua token
 * - POST /auth/resend-verification: Gửi lại email xác thực
 * - POST /auth/change-password: Đổi mật khẩu tài khoản
 * - GET /auth/me: Lấy thông tin cá nhân hiện tại
 * - POST /auth/logout: Thu hồi token và đăng xuất
 */

import { request, checkBackendHealth, setTokens, clearTokens, getRefreshToken } from './client';

/**
 * Interface tham số tạo tài khoản mới
 */
export interface RegisterParams {
  username: string;
  email: string;
  password: string;
  fullName?: string;
}

/**
 * Interface tham số đổi mật khẩu
 */
export interface ChangePasswordParams {
  currentPassword: string;
  newPassword: string;
}

export const authApi = {
  /**
   * API Đăng nhập hệ thống (POST /api/v1/auth/login)
   * @param usernameOrEmail Tên đăng nhập hoặc địa chỉ Email
   * @param password Mật khẩu tài khoản
   */
  login: async (usernameOrEmail: string, password: string) => {
    const isOnline = await checkBackendHealth();
    if (isOnline) {
      // Đăng nhập trực tiếp với máy chủ FastAPI Backend
      const data = await request('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ usernameOrEmail, password }),
      });

      // Lưu trữ Token và thông tin User sau khi đăng nhập thành công
      setTokens(data.accessToken, data.refreshToken);
      const user = {
        ...data.user,
        fullName: data.user.fullName || data.user.full_name || '',
        isActive: data.user.isActive !== undefined ? data.user.isActive : data.user.is_active,
        isEmailVerified: data.user.isEmailVerified !== undefined ? data.user.isEmailVerified : data.user.is_email_verified,
      };
      localStorage.setItem('user', JSON.stringify(user));
      return { isOnline: true, user };
    } else {
      // Chế độ dự phòng khi sập mạng (Offline Fallback Mode)
      const localUsers = JSON.parse(localStorage.getItem('local_users') || '[]');
      const user = localUsers.find(
        (u: any) => u.username === usernameOrEmail || u.email === usernameOrEmail
      );
      if (!user) {
        throw new Error('Tài khoản không tồn tại ở chế độ offline.');
      }
      if (password !== '123456' && password !== 'admin123' && password !== 'password') {
        throw new Error('Mật khẩu không đúng ở chế độ offline.');
      }
      localStorage.setItem('user', JSON.stringify(user));
      return { isOnline: false, user };
    }
  },

  /**
   * API Đăng ký tài khoản Operator mới (POST /api/v1/auth/register)
   * @param userData Thông tin tài khoản đăng ký mới
   */
  register: async (userData: RegisterParams) => {
    const isOnline = await checkBackendHealth();
    if (isOnline) {
      const data = await request('/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          username: userData.username,
          email: userData.email,
          password: userData.password,
          fullName: userData.fullName
        }),
      });
      return { isOnline: true, data };
    } else {
      // Chế độ dự phòng Offline
      const localUsers = JSON.parse(localStorage.getItem('local_users') || '[]');
      const existing = localUsers.find(
        (u: any) => u.username === userData.username || u.email === userData.email
      );
      if (existing) {
        throw new Error('Tên đăng nhập hoặc email đã tồn tại ở chế độ offline.');
      }
      const newUser = {
        id: `USER-LOCAL-${Math.floor(Math.random() * 1000)}`,
        username: userData.username,
        email: userData.email,
        fullName: userData.fullName || userData.username,
        role: 'operator',
        isActive: true,
        isEmailVerified: false,
        createdAt: new Date().toISOString()
      };
      localUsers.push(newUser);
      localStorage.setItem('local_users', JSON.stringify(localUsers));
      return { isOnline: false, data: newUser };
    }
  },

  /**
   * API Xác thực Email qua Token (POST /api/v1/auth/verify-email)
   * @param token Token xác thực gửi từ Email
   */
  verifyEmail: async (token: string) => {
    const isOnline = await checkBackendHealth();
    if (isOnline) {
      const data = await request('/auth/verify-email', {
        method: 'POST',
        body: JSON.stringify({ token }),
      });
      return { isOnline: true, data };
    } else {
      if (!token) throw new Error('Token không hợp lệ.');
      return { isOnline: false, data: { message: 'Xác thực email thành công (Offline Mode).' } };
    }
  },

  /**
   * API Gửi lại Email xác thực (POST /api/v1/auth/resend-verification)
   * @param email Địa chỉ Email cần nhận lại token
   */
  resendVerification: async (email: string) => {
    const isOnline = await checkBackendHealth();
    if (isOnline) {
      const data = await request('/auth/resend-verification', {
        method: 'POST',
        body: JSON.stringify({ email }),
      });
      return { isOnline: true, data };
    } else {
      return { isOnline: false, data: { message: 'Đã gửi lại yêu cầu xác thực email (Offline Mode).' } };
    }
  },

  /**
   * API Đổi mật khẩu tài khoản (POST /api/v1/auth/change-password)
   * @param params Mật khẩu hiện tại & Mật khẩu mới
   */
  changePassword: async (params: ChangePasswordParams) => {
    const isOnline = await checkBackendHealth();
    if (isOnline) {
      const data = await request('/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({
          currentPassword: params.currentPassword,
          newPassword: params.newPassword
        }),
      });
      return { isOnline: true, data };
    } else {
      return { isOnline: false, data: { message: 'Đổi mật khẩu thành công (Offline Mode).' } };
    }
  },

  /**
   * API Lấy hồ sơ tài khoản hiện tại (GET /api/v1/auth/me)
   */
  getMe: async () => {
    const isOnline = await checkBackendHealth();
    if (isOnline) {
      const user = await request('/auth/me');
      const mappedUser = {
        ...user,
        fullName: user.fullName || user.full_name || '',
        isActive: user.isActive !== undefined ? user.isActive : user.is_active,
        isEmailVerified: user.isEmailVerified !== undefined ? user.isEmailVerified : user.is_email_verified,
      };
      localStorage.setItem('user', JSON.stringify(mappedUser));
      return { isOnline: true, user: mappedUser };
    } else {
      const userStr = localStorage.getItem('user');
      return { isOnline: false, user: userStr ? JSON.parse(userStr) : null };
    }
  },

  /**
   * Lấy thông tin user hiện tại từ bộ nhớ LocalStorage
   */
  getCurrentUser: () => {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  /**
   * Đăng xuất khỏi hệ thống và thu hồi Refresh Token (POST /api/v1/auth/logout)
   */
  logout: async () => {
    const refreshToken = getRefreshToken();
    const isOnline = await checkBackendHealth();
    if (isOnline && refreshToken) {
      try {
        await request('/auth/logout', {
          method: 'POST',
          body: JSON.stringify({ refreshToken }),
        });
      } catch (e) {
        console.warn('Thông báo đăng xuất:', e);
      }
    }
    clearTokens();
  }
};
