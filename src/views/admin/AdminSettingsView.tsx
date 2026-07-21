/**
 * View Admin Settings (`AdminSettingsView`):
 * Giao diện Quản lý Cấu hình Hệ thống dành riêng cho Admin.
 * Tương ứng với các endpoint cấu hình ở backend FastAPI `/api/v1/settings`:
 * - Lấy cấu hình hệ thống hiện tại (GET /settings)
 * - Cập nhật thông số cấu hình hệ thống (PUT /settings)
 * Các trường dữ liệu: app_name, api_version, detection_threshold, max_cameras, retention_days.
 */

import { useState, useEffect } from 'react';
import { Settings, Save, RefreshCw, CheckCircle2, AlertTriangle, Sliders, Database, Camera, Layers } from 'lucide-react';
import { settingsApi, SettingsDto } from '../../lib/api';

export function AdminSettingsView() {
  // Cấu hình lưu trữ trong state
  const [settingsData, setSettingsData] = useState<SettingsDto>({
    appName: 'Traffic Monitoring System',
    apiVersion: '1.0.0',
    detectionThreshold: 0.5,
    maxCameras: 100,
    retentionDays: 90
  });

  // Trạng thái các input form
  const [appName, setAppName] = useState<string>('Traffic Monitoring System');
  const [detectionThreshold, setDetectionThreshold] = useState<number>(0.5);
  const [maxCameras, setMaxCameras] = useState<number>(100);
  const [retentionDays, setRetentionDays] = useState<number>(90);

  // Trạng thái tải & phản hồi
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  /**
   * Gọi API lấy dữ liệu cấu hình hệ thống từ Backend (GET /api/v1/settings)
   */
  const fetchSettings = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await settingsApi.get();
      setIsOnline(res.isOnline);
      if (res.data) {
        setSettingsData(res.data);
        setAppName(res.data.appName || 'Traffic Monitoring System');
        setDetectionThreshold(res.data.detectionThreshold !== undefined ? res.data.detectionThreshold : 0.5);
        setMaxCameras(res.data.maxCameras !== undefined ? res.data.maxCameras : 100);
        setRetentionDays(res.data.retentionDays !== undefined ? res.data.retentionDays : 90);
      }
    } catch (err: any) {
      setError(err.message || 'Không thể tải cấu hình từ hệ thống.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  /**
   * Hiển thị thông báo Toast thành công
   */
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  /**
   * Xử lý Submit Form Cập nhật cấu hình hệ thống qua API (PUT /api/v1/settings)
   */
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);
    try {
      const res = await settingsApi.update({
        appName,
        detectionThreshold: Number(detectionThreshold),
        maxCameras: Number(maxCameras),
        retentionDays: Number(retentionDays)
      });
      setIsOnline(res.isOnline);
      if (res.data) {
        setSettingsData(res.data);
      }
      showToast('Lưu cấu hình hệ thống thành công!');
    } catch (err: any) {
      setError(err.message || 'Lưu cấu hình thất bại.');
    } finally {
      setIsSaving(false);
    }
  };

  /**
   * Khôi phục các giá trị thiết lập ban đầu
   */
  const handleReset = () => {
    setAppName(settingsData.appName);
    setDetectionThreshold(settingsData.detectionThreshold);
    setMaxCameras(settingsData.maxCameras);
    setRetentionDays(settingsData.retentionDays);
    showToast('Đã khôi phục các giá trị thiết lập ban đầu.');
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-surface-container-highest/95 backdrop-blur-md border border-emerald-500/40 text-emerald-400 px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-toast-enter">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <span className="text-sm font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-card border border-outline-variant/30 rounded-3xl p-6 shadow-xl">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-secondary/10 border border-secondary/30 flex items-center justify-center text-secondary">
            <Settings className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-on-surface tracking-tight">Cấu hình Hệ thống (API /settings)</h1>
            <p className="text-xs text-on-surface-variant mt-0.5">Quản lý tham số ứng dụng & thuật toán nhận diện AI</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchSettings}
            disabled={isLoading}
            className="px-3.5 py-2.5 rounded-xl bg-surface-container-high border border-outline-variant/40 hover:bg-surface-container-highest text-on-surface text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            Tải lại
          </button>
          <div className={`px-3 py-1.5 rounded-xl text-xs font-semibold border flex items-center gap-1.5 ${
            isOnline ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
          }`}>
            <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-400' : 'bg-amber-400'}`} />
            {isOnline ? 'FastAPI Connected' : 'Offline Mode'}
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-error/10 border border-error/30 text-error rounded-2xl text-xs font-semibold flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Form Cấu Hình Hệ Thống */}
      <form onSubmit={handleSaveSettings} className="space-y-6">
        {/* Phần 1: Cấu hình Ứng dụng chung */}
        <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-3xl p-6 shadow-xl space-y-5">
          <div className="flex items-center gap-3 pb-4 border-b border-outline-variant/20">
            <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-on-surface">Cấu hình Ứng dụng chung</h3>
              <p className="text-xs text-on-surface-variant">Thông tin hiển thị tên hệ thống & thông số máy chủ</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-on-surface">Tên Ứng Dụng (app_name)</label>
              <input
                type="text"
                value={appName}
                onChange={(e) => setAppName(e.target.value)}
                placeholder="AIDA Traffic Monitoring..."
                className="w-full bg-surface border border-outline-variant/40 rounded-xl px-4 py-2.5 text-xs text-on-surface focus:outline-none focus:border-primary transition-all"
                required
              />
              <span className="text-[10px] text-on-surface-variant block">Tên hệ thống hiển thị ở thanh tiêu đề và Header.</span>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-on-surface">Phiên bản API (api_version)</label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={settingsData.apiVersion}
                  disabled
                  className="w-full bg-surface-container-high border border-outline-variant/30 rounded-xl px-4 py-2.5 text-xs text-on-surface-variant font-mono font-bold opacity-75 cursor-not-allowed"
                />
                <span className="px-2.5 py-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-mono font-bold shrink-0">
                  Read Only
                </span>
              </div>
              <span className="text-[10px] text-on-surface-variant block">Phiên bản Backend FastAPI hiện tại.</span>
            </div>
          </div>
        </div>

        {/* Phần 2: Cấu hình Ngưỡng nhận diện AI (YOLO) */}
        <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-3xl p-6 shadow-xl space-y-5">
          <div className="flex items-center gap-3 pb-4 border-b border-outline-variant/20">
            <div className="w-9 h-9 rounded-xl bg-secondary/10 border border-secondary/20 flex items-center justify-center text-secondary">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-on-surface">Ngưỡng Nhận Diện AI (YOLO Threshold)</h3>
              <p className="text-xs text-on-surface-variant">Độ tin cậy tối thiểu để phát hiện phương tiện & vi phạm</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-on-surface">
                Ngưỡng tin cậy YOLO (detection_threshold): <span className="text-secondary font-mono font-bold text-sm ml-2">{(detectionThreshold * 100).toFixed(0)}%</span> ({detectionThreshold})
              </label>
              <span className="text-[11px] text-on-surface-variant font-mono">Phạm vi: 0.1 - 0.99</span>
            </div>

            <div className="flex items-center gap-4">
              <input
                type="range"
                min="0.1"
                max="0.99"
                step="0.01"
                value={detectionThreshold}
                onChange={(e) => setDetectionThreshold(parseFloat(e.target.value))}
                className="flex-1 accent-secondary h-2 bg-surface-container-high rounded-lg cursor-pointer"
              />
              <input
                type="number"
                min="0.1"
                max="0.99"
                step="0.01"
                value={detectionThreshold}
                onChange={(e) => setDetectionThreshold(Math.max(0.1, Math.min(0.99, parseFloat(e.target.value) || 0.5)))}
                className="w-20 bg-surface border border-outline-variant/40 rounded-xl px-3 py-2 text-xs font-mono text-center text-on-surface focus:outline-none focus:border-secondary transition-all"
              />
            </div>

            <div className="p-3 bg-secondary/10 border border-secondary/20 rounded-xl text-xs text-on-surface-variant leading-relaxed">
              💡 <strong>Lưu ý:</strong> Ngưỡng cao hơn (ví dụ 0.75+) giúp giảm cảnh báo sai nhưng có thể bỏ sót vi phạm nhỏ. Ngưỡng thấp hơn (0.3 - 0.5) phát hiện nhạy hơn.
            </div>
          </div>
        </div>

        {/* Phần 3: Hạ tầng Camera & Thời gian lưu trữ */}
        <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-3xl p-6 shadow-xl space-y-5">
          <div className="flex items-center gap-3 pb-4 border-b border-outline-variant/20">
            <div className="w-9 h-9 rounded-xl bg-tertiary/10 border border-tertiary/20 flex items-center justify-center text-tertiary">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-on-surface">Hạ tầng Camera & Lưu trữ</h3>
              <p className="text-xs text-on-surface-variant">Giới hạn camera và thời gian lưu giữ dữ liệu vi phạm</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-on-surface flex items-center gap-1.5">
                <Camera className="w-3.5 h-3.5 text-tertiary" /> Số Camera tối đa (max_cameras)
              </label>
              <input
                type="number"
                min="1"
                max="1000"
                value={maxCameras}
                onChange={(e) => setMaxCameras(parseInt(e.target.value) || 100)}
                className="w-full bg-surface border border-outline-variant/40 rounded-xl px-4 py-2.5 text-xs text-on-surface font-mono focus:outline-none focus:border-tertiary transition-all"
                required
              />
              <span className="text-[10px] text-on-surface-variant block">Số lượng camera RTSP được phép kết nối đồng thời.</span>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-on-surface flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-emerald-400" /> Thời gian lưu trữ (retention_days)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="1"
                  max="3650"
                  value={retentionDays}
                  onChange={(e) => setRetentionDays(parseInt(e.target.value) || 90)}
                  className="w-full bg-surface border border-outline-variant/40 rounded-xl px-4 py-2.5 text-xs text-on-surface font-mono focus:outline-none focus:border-emerald-400 transition-all"
                  required
                />
                <span className="text-xs font-semibold text-on-surface-variant shrink-0">Ngày</span>
              </div>
              <span className="text-[10px] text-on-surface-variant block">Dữ liệu vi phạm cũ hơn thời gian này sẽ được lưu trữ nén.</span>
            </div>
          </div>
        </div>

        {/* Thao tác Nút Hành động */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={handleReset}
            className="px-5 py-3 rounded-xl bg-surface-container-high border border-outline-variant/40 hover:bg-surface-container-highest text-xs text-on-surface font-semibold transition-all cursor-pointer"
          >
            Khôi phục ban đầu
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className="px-6 py-3 rounded-xl bg-secondary hover:bg-secondary/90 text-on-secondary text-xs font-semibold flex items-center gap-2 transition-all shadow-lg cursor-pointer disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" /> Đang lưu cấu hình...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" /> Lưu Cấu Hình Hệ Thống
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
