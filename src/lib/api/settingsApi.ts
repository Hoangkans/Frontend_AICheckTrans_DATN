/**
 * Module System Settings API (`settingsApi`):
 * Xử lý đọc và cập nhật các tham số cấu hình hệ thống tương ứng với backend `/api/v1/settings`:
 * - GET /settings: Lấy cấu hình hệ thống (Tên ứng dụng, Ngưỡng YOLO, Giới hạn camera, Retention days)
 * - PUT /settings: Admin thay đổi cấu hình hệ thống
 * - GET/PUT /settings/notifications: Quản lý cài đặt âm thanh thông báo & mail báo cáo
 * - GET/PUT /settings/security: Quản lý cài đặt bảo mật 2FA
 */

import { request, checkBackendHealth } from './client';

export interface SettingsDto {
  appName: string;
  apiVersion: string;
  detectionThreshold: number;
  maxCameras: number;
  retentionDays: number;
  notificationSoundEnabled?: boolean;
  emailAlertsEnabled?: boolean;
  dailyReportTime?: string;
  twoFactorEnabled?: boolean;
}

export interface UpdateSettingsParams {
  appName?: string;
  detectionThreshold?: number;
  maxCameras?: number;
  retentionDays?: number;
}

export interface NotificationSettingsDto {
  soundEnabled: boolean;
  emailAlertsEnabled: boolean;
  dailyReportTime: string;
}

export interface UpdateNotificationSettingsParams {
  soundEnabled?: boolean;
  emailAlertsEnabled?: boolean;
  dailyReportTime?: string;
}

export interface SecuritySettingsDto {
  twoFactorEnabled: boolean;
}

export interface UpdateSecuritySettingsParams {
  twoFactorEnabled?: boolean;
}

export const settingsApi = {
  /**
   * Lấy thông tin cấu hình toàn hệ thống (GET /api/v1/settings)
   */
  get: async () => {
    const isOnline = await checkBackendHealth();
    if (isOnline) {
      try {
        const response = await request('/settings');
        const data: SettingsDto = {
          appName: response.appName || response.app_name || 'Traffic Monitoring System',
          apiVersion: response.apiVersion || response.api_version || '1.0.0',
          detectionThreshold: response.detectionThreshold !== undefined ? response.detectionThreshold : response.detection_threshold ?? 0.5,
          maxCameras: response.maxCameras !== undefined ? response.maxCameras : response.max_cameras ?? 100,
          retentionDays: response.retentionDays !== undefined ? response.retentionDays : response.retention_days ?? 90,
          notificationSoundEnabled: response.notificationSoundEnabled ?? response.notification_sound_enabled ?? true,
          emailAlertsEnabled: response.emailAlertsEnabled ?? response.email_alerts_enabled ?? false,
          dailyReportTime: response.dailyReportTime || response.daily_report_time || '23:59',
          twoFactorEnabled: response.twoFactorEnabled ?? response.two_factor_enabled ?? false,
        };
        return { isOnline: true, data };
      } catch (e) {
        console.error('Không thể kết nối lấy settings từ backend:', e);
      }
    }

    // Chế độ dự phòng Offline
    const localSettings = JSON.parse(localStorage.getItem('local_settings') || '{}');
    const data: SettingsDto = {
      appName: localSettings.appName || 'Traffic Monitoring System',
      apiVersion: localSettings.apiVersion || '1.0.0',
      detectionThreshold: localSettings.detectionThreshold ?? 0.5,
      maxCameras: localSettings.maxCameras ?? 100,
      retentionDays: localSettings.retentionDays ?? 90,
      notificationSoundEnabled: localSettings.notificationSoundEnabled ?? true,
      emailAlertsEnabled: localSettings.emailAlertsEnabled ?? false,
      dailyReportTime: localSettings.dailyReportTime || '23:59',
      twoFactorEnabled: localSettings.twoFactorEnabled ?? false,
    };
    return { isOnline: false, data };
  },

  /**
   * Admin cập nhật cấu hình hệ thống (PUT /api/v1/settings)
   */
  update: async (params: UpdateSettingsParams) => {
    const isOnline = await checkBackendHealth();
    if (isOnline) {
      const response = await request('/settings', {
        method: 'PUT',
        body: JSON.stringify({
          appName: params.appName,
          detectionThreshold: params.detectionThreshold,
          maxCameras: params.maxCameras,
          retentionDays: params.retentionDays,
        }),
      });
      const data: SettingsDto = {
        appName: response.appName || response.app_name || 'Traffic Monitoring System',
        apiVersion: response.apiVersion || response.api_version || '1.0.0',
        detectionThreshold: response.detectionThreshold !== undefined ? response.detectionThreshold : response.detection_threshold ?? 0.5,
        maxCameras: response.maxCameras !== undefined ? response.maxCameras : response.max_cameras ?? 100,
        retentionDays: response.retentionDays !== undefined ? response.retentionDays : response.retention_days ?? 90,
        notificationSoundEnabled: response.notificationSoundEnabled ?? response.notification_sound_enabled ?? true,
        emailAlertsEnabled: response.emailAlertsEnabled ?? response.email_alerts_enabled ?? false,
        dailyReportTime: response.dailyReportTime || response.daily_report_time || '23:59',
        twoFactorEnabled: response.twoFactorEnabled ?? response.two_factor_enabled ?? false,
      };
      return { isOnline: true, data };
    } else {
      const localSettings = JSON.parse(localStorage.getItem('local_settings') || '{}');
      const updated = { ...localSettings, ...params };
      localStorage.setItem('local_settings', JSON.stringify(updated));
      const data: SettingsDto = {
        appName: updated.appName || 'Traffic Monitoring System',
        apiVersion: updated.apiVersion || '1.0.0',
        detectionThreshold: updated.detectionThreshold ?? 0.5,
        maxCameras: updated.maxCameras ?? 100,
        retentionDays: updated.retentionDays ?? 90,
        notificationSoundEnabled: updated.notificationSoundEnabled ?? true,
        emailAlertsEnabled: updated.emailAlertsEnabled ?? false,
        dailyReportTime: updated.dailyReportTime || '23:59',
        twoFactorEnabled: updated.twoFactorEnabled ?? false,
      };
      return { isOnline: false, data };
    }
  },

  /**
   * Lấy cài đặt thông báo (GET /api/v1/settings/notifications)
   */
  getNotificationSettings: async () => {
    const isOnline = await checkBackendHealth();
    if (isOnline) {
      try {
        const response = await request('/settings/notifications');
        const data: NotificationSettingsDto = {
          soundEnabled: response.soundEnabled ?? response.notification_sound_enabled ?? true,
          emailAlertsEnabled: response.emailAlertsEnabled ?? response.email_alerts_enabled ?? false,
          dailyReportTime: response.dailyReportTime || response.daily_report_time || '23:59',
        };
        return { isOnline: true, data };
      } catch (e) {
        console.error('Không thể lấy notification settings:', e);
      }
    }
    const local = JSON.parse(localStorage.getItem('local_settings') || '{}');
    return {
      isOnline: false,
      data: {
        soundEnabled: local.notificationSoundEnabled ?? true,
        emailAlertsEnabled: local.emailAlertsEnabled ?? false,
        dailyReportTime: local.dailyReportTime || '23:59',
      } as NotificationSettingsDto,
    };
  },

  /**
   * Cập nhật cài đặt thông báo (PUT /api/v1/settings/notifications)
   */
  updateNotificationSettings: async (params: UpdateNotificationSettingsParams) => {
    const isOnline = await checkBackendHealth();
    if (isOnline) {
      const response = await request('/settings/notifications', {
        method: 'PUT',
        body: JSON.stringify({
          soundEnabled: params.soundEnabled,
          email_alerts_enabled: params.emailAlertsEnabled,
          daily_report_time: params.dailyReportTime,
        }),
      });
      const data: NotificationSettingsDto = {
        soundEnabled: response.soundEnabled ?? response.notification_sound_enabled ?? true,
        emailAlertsEnabled: response.emailAlertsEnabled ?? response.email_alerts_enabled ?? false,
        dailyReportTime: response.dailyReportTime || response.daily_report_time || '23:59',
      };
      return { isOnline: true, data };
    } else {
      const local = JSON.parse(localStorage.getItem('local_settings') || '{}');
      const updated = {
        ...local,
        notificationSoundEnabled: params.soundEnabled ?? local.notificationSoundEnabled,
        emailAlertsEnabled: params.emailAlertsEnabled ?? local.emailAlertsEnabled,
        dailyReportTime: params.dailyReportTime ?? local.dailyReportTime,
      };
      localStorage.setItem('local_settings', JSON.stringify(updated));
      return {
        isOnline: false,
        data: {
          soundEnabled: updated.notificationSoundEnabled,
          emailAlertsEnabled: updated.emailAlertsEnabled,
          dailyReportTime: updated.dailyReportTime,
        } as NotificationSettingsDto,
      };
    }
  },

  /**
   * Lấy cài đặt bảo mật 2FA (GET /api/v1/settings/security)
   */
  getSecuritySettings: async () => {
    const isOnline = await checkBackendHealth();
    if (isOnline) {
      try {
        const response = await request('/settings/security');
        const data: SecuritySettingsDto = {
          twoFactorEnabled: response.twoFactorEnabled ?? response.two_factor_enabled ?? false,
        };
        return { isOnline: true, data };
      } catch (e) {
        console.error('Không thể lấy security settings:', e);
      }
    }
    const local = JSON.parse(localStorage.getItem('local_settings') || '{}');
    return {
      isOnline: false,
      data: {
        twoFactorEnabled: local.twoFactorEnabled ?? false,
      } as SecuritySettingsDto,
    };
  },

  /**
   * Cập nhật cài đặt bảo mật (PUT /api/v1/settings/security)
   */
  updateSecuritySettings: async (params: UpdateSecuritySettingsParams) => {
    const isOnline = await checkBackendHealth();
    if (isOnline) {
      const response = await request('/settings/security', {
        method: 'PUT',
        body: JSON.stringify({
          two_factor_enabled: params.twoFactorEnabled,
        }),
      });
      const data: SecuritySettingsDto = {
        twoFactorEnabled: response.twoFactorEnabled ?? response.two_factor_enabled ?? false,
      };
      return { isOnline: true, data };
    } else {
      const local = JSON.parse(localStorage.getItem('local_settings') || '{}');
      const updated = {
        ...local,
        twoFactorEnabled: params.twoFactorEnabled ?? local.twoFactorEnabled,
      };
      localStorage.setItem('local_settings', JSON.stringify(updated));
      return {
        isOnline: false,
        data: {
          twoFactorEnabled: updated.twoFactorEnabled,
        } as SecuritySettingsDto,
      };
    }
  },
};
