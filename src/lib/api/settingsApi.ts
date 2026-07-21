/**
 * Module System Settings API (`settingsApi`):
 * Xử lý đọc và cập nhật các tham số cấu hình hệ thống tương ứng với backend `/api/v1/settings`:
 * - GET /settings: Lấy cấu hình hệ thống (Tên ứng dụng, Ngưỡng YOLO, Giới hạn camera, Retention days)
 * - PUT /settings: Admin thay đổi cấu hình hệ thống
 */

import { request, checkBackendHealth } from './client';

/**
 * Interface DTO phản hồi thông tin cấu hình hệ thống
 */
export interface SettingsDto {
  appName: string;
  apiVersion: string;
  detectionThreshold: number;
  maxCameras: number;
  retentionDays: number;
}

/**
 * Interface tham số cập nhật cấu hình hệ thống
 */
export interface UpdateSettingsParams {
  appName?: string;
  detectionThreshold?: number;
  maxCameras?: number;
  retentionDays?: number;
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
          detectionThreshold: response.detectionThreshold !== undefined ? response.detectionThreshold : response.detection_threshold || 0.5,
          maxCameras: response.maxCameras !== undefined ? response.maxCameras : response.max_cameras || 100,
          retentionDays: response.retentionDays !== undefined ? response.retentionDays : response.retention_days || 90
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
      detectionThreshold: localSettings.detectionThreshold || 0.5,
      maxCameras: localSettings.maxCameras || 100,
      retentionDays: localSettings.retentionDays || 90
    };
    return { isOnline: false, data };
  },

  /**
   * Admin cập nhật cấu hình hệ thống (PUT /api/v1/settings)
   * @param params Các tham số cấu hình cần lưu thay đổi
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
          retentionDays: params.retentionDays
        })
      });
      const data: SettingsDto = {
        appName: response.appName || response.app_name || 'Traffic Monitoring System',
        apiVersion: response.apiVersion || response.api_version || '1.0.0',
        detectionThreshold: response.detectionThreshold !== undefined ? response.detectionThreshold : response.detection_threshold || 0.5,
        maxCameras: response.maxCameras !== undefined ? response.maxCameras : response.max_cameras || 100,
        retentionDays: response.retentionDays !== undefined ? response.retentionDays : response.retention_days || 90
      };
      return { isOnline: true, data };
    } else {
      const localSettings = JSON.parse(localStorage.getItem('local_settings') || '{}');
      const updated = { ...localSettings, ...params };
      localStorage.setItem('local_settings', JSON.stringify(updated));
      const data: SettingsDto = {
        appName: updated.appName || 'Traffic Monitoring System',
        apiVersion: updated.apiVersion || '1.0.0',
        detectionThreshold: updated.detectionThreshold || 0.5,
        maxCameras: updated.maxCameras || 100,
        retentionDays: updated.retentionDays || 90
      };
      return { isOnline: false, data };
    }
  }
};
