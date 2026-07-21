/**
 * View Admin Dashboard (`AdminDashboardView`):
 * Giao diện màn hình chính tổng quan dành riêng cho Quản trị viên (Admin).
 * Hiển thị các chỉ số hệ thống, thông tin người dùng, ngưỡng phát hiện YOLO và các nút điều hướng nhanh.
 */

import { useState, useEffect } from 'react';
import { Users, Settings, ShieldCheck, Camera, Server, ArrowRight, Zap, RefreshCw } from 'lucide-react';
import { userApi, settingsApi, statsApi } from '../../lib/api';

interface AdminDashboardViewProps {
  onNavigateToUsers: () => void;
  onNavigateToSettings: () => void;
}

export function AdminDashboardView({ onNavigateToUsers, onNavigateToSettings }: AdminDashboardViewProps) {
  // Quản lý trạng thái số lượng tài khoản
  const [totalUsers, setTotalUsers] = useState<number>(0);
  const [adminCount, setAdminCount] = useState<number>(0);
  const [operatorCount, setOperatorCount] = useState<number>(0);
  
  // Trạng thái cấu hình hệ thống & thống kê
  const [appConfig, setAppConfig] = useState<any>(null);
  const [systemStats, setSystemStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isOnline, setIsOnline] = useState<boolean>(true);

  /**
   * Tải toàn bộ dữ liệu thống kê từ các API của Backend (`/users`, `/settings`, `/stats/overview`)
   */
  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      const [usersRes, settingsRes, statsRes] = await Promise.all([
        userApi.list(1, 100),
        settingsApi.get(),
        statsApi.overview()
      ]);

      setIsOnline(usersRes.isOnline && settingsRes.isOnline);
      setAppConfig(settingsRes.data);
      setSystemStats(statsRes.data);

      if (usersRes.data) {
        setTotalUsers(usersRes.total || usersRes.data.length);
        setAdminCount(usersRes.data.filter((u: any) => u.role === 'admin').length);
        setOperatorCount(usersRes.data.filter((u: any) => u.role === 'operator').length);
      }
    } catch (error) {
      console.error('Lỗi tải dữ liệu Admin Dashboard:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  return (
    <div className="space-y-6">
      {/* 1. Header Banner giới thiệu Admin Control Center */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-surface-container-high via-surface-container to-surface-container-lowest border border-outline-variant/30 p-6 md:p-8 shadow-xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold uppercase tracking-wider mb-3">
              <ShieldCheck className="w-3.5 h-3.5" /> Quản trị viên hệ thống
            </div>
            <h1 className="text-3xl font-extrabold text-on-surface tracking-tight">
              Admin Control Center
            </h1>
            <p className="text-on-surface-variant text-sm mt-1 max-w-2xl">
              Trung tâm điều hành và quản trị hệ thống {appConfig?.appName || 'AIDA Vision'}. Kiểm soát người dùng, giám sát camera và cấu hình máy chủ.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={fetchDashboardData}
              disabled={isLoading}
              className="px-4 py-2.5 rounded-xl bg-surface-container-high border border-outline-variant/40 hover:bg-surface-container-highest text-on-surface text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              Làm mới
            </button>
            <div className={`px-3.5 py-2 rounded-xl text-xs font-semibold border flex items-center gap-2 ${
              isOnline 
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' 
                : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
            }`}>
              <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-400 animate-ping' : 'bg-amber-400'}`} />
              {isOnline ? 'Backend Online (FastAPI)' : 'Offline Mode'}
            </div>
          </div>
        </div>
      </div>

      {/* 2. Các thẻ Thống kê KPI nhanh */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Thẻ 1: Tổng số Người dùng */}
        <div 
          onClick={onNavigateToUsers}
          className="group glass-card hover-card-lift rounded-2xl p-5 hover:border-primary/50 cursor-pointer relative overflow-hidden"
        >
          <div className="flex items-center justify-between">
            <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
              <Users className="w-6 h-6" />
            </div>
            <ArrowRight className="w-4 h-4 text-on-surface-variant opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
          </div>
          <div className="mt-4">
            <div className="text-2xl font-bold text-on-surface">{isLoading ? '...' : totalUsers}</div>
            <div className="text-xs text-on-surface-variant font-medium mt-0.5">Tổng số Người dùng</div>
            <div className="flex items-center gap-2 text-[11px] text-on-surface-variant mt-2 font-mono">
              <span className="text-indigo-400 font-semibold">{adminCount} Admin</span> • 
              <span className="text-cyan-400 font-semibold">{operatorCount} Operator</span>
            </div>
          </div>
        </div>

        {/* Thẻ 2: Trạng thái Ngưỡng YOLO & Lưu trữ */}
        <div 
          onClick={onNavigateToSettings}
          className="group glass-card hover-card-lift rounded-2xl p-5 hover:border-secondary/50 cursor-pointer relative overflow-hidden"
        >
          <div className="flex items-center justify-between">
            <div className="w-12 h-12 rounded-xl bg-secondary/10 border border-secondary/20 flex items-center justify-center text-secondary group-hover:scale-110 transition-transform">
              <Settings className="w-6 h-6" />
            </div>
            <ArrowRight className="w-4 h-4 text-on-surface-variant opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
          </div>
          <div className="mt-4">
            <div className="text-2xl font-bold text-on-surface">{isLoading ? '...' : `${(appConfig?.detectionThreshold * 100 || 50)}%`}</div>
            <div className="text-xs text-on-surface-variant font-medium mt-0.5">Ngưỡng Nhận diện YOLO</div>
            <div className="text-[11px] text-on-surface-variant mt-2 font-mono">
              Lưu trữ: <span className="text-secondary font-semibold">{appConfig?.retentionDays || 90} ngày</span>
            </div>
          </div>
        </div>

        {/* Thẻ 3: Hạ tầng Camera giám sát */}
        <div className="glass-card hover-card-lift rounded-2xl p-5 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div className="w-12 h-12 rounded-xl bg-tertiary/10 border border-tertiary/20 flex items-center justify-center text-tertiary">
              <Camera className="w-6 h-6" />
            </div>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-tertiary/10 text-tertiary border border-tertiary/20 font-bold">
              Max {appConfig?.maxCameras || 100}
            </span>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-bold text-on-surface">{isLoading ? '...' : (systemStats?.totalCameras || 0)}</div>
            <div className="text-xs text-on-surface-variant font-medium mt-0.5">Camera Đang Hoạt Động</div>
            <div className="flex items-center gap-2 text-[11px] text-on-surface-variant mt-2 font-mono">
              <span className="text-emerald-400 font-semibold">{systemStats?.onlineCameras || 0} Live</span> • 
              <span className="text-amber-400 font-semibold">{systemStats?.offlineCameras || 0} Offline</span>
            </div>
          </div>
        </div>

        {/* Thẻ 4: Thông tin máy chủ FastAPI Backend */}
        <div className="glass-card hover-card-lift rounded-2xl p-5 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
              <Server className="w-6 h-6" />
            </div>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-bold">
              v{appConfig?.apiVersion || '1.0.0'}
            </span>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-bold text-on-surface">FastAPI v1</div>
            <div className="text-xs text-on-surface-variant font-medium mt-0.5">Phiên bản Backend Core</div>
            <div className="text-[11px] text-emerald-400 mt-2 font-mono flex items-center gap-1">
              <Zap className="w-3 h-3" /> RESTful + WebSockets Active
            </div>
          </div>
        </div>
      </div>

      {/* 3. Các panel điều hướng nhanh dành cho Admin */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Panel Quản lý Người dùng */}
        <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-3xl p-6 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-center text-primary">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-on-surface">Quản lý Người dùng & Phân quyền</h3>
                  <p className="text-xs text-on-surface-variant">Thêm, sửa, xóa, phân quyền Admin/Operator</p>
                </div>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-primary/10 text-primary border border-primary/20">
                CRUD API
              </span>
            </div>

            <p className="text-xs text-on-surface-variant leading-relaxed mb-6">
              Truy cập trang quản trị tài khoản người dùng để cấp quyền truy cập hệ thống giám sát, kích hoạt/vô hiệu hóa tài khoản hoặc tạo người dùng mới.
            </p>

            <div className="space-y-2.5 mb-6">
              <div className="flex items-center justify-between p-3 rounded-xl bg-surface-container-high/50 border border-outline-variant/20 text-xs">
                <span className="text-on-surface font-medium">Danh sách Người dùng (Paginated)</span>
                <span className="font-mono text-primary font-bold">GET /api/v1/users</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-surface-container-high/50 border border-outline-variant/20 text-xs">
                <span className="text-on-surface font-medium">Tạo Người dùng Mới (Admin Only)</span>
                <span className="font-mono text-emerald-400 font-bold">POST /api/v1/users</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-surface-container-high/50 border border-outline-variant/20 text-xs">
                <span className="text-on-surface font-medium">Cập nhật & Khóa Tài khoản</span>
                <span className="font-mono text-amber-400 font-bold">PUT /api/v1/users/&#123;id&#125;</span>
              </div>
            </div>
          </div>

          <button
            onClick={onNavigateToUsers}
            className="w-full bg-primary hover:bg-primary-fixed-dim text-on-primary py-3 rounded-xl font-medium transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
          >
            Mở Trang Quản Lý Người Dùng <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Panel Cấu hình Hệ thống */}
        <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-3xl p-6 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-secondary/10 border border-secondary/30 flex items-center justify-center text-secondary">
                  <Settings className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-on-surface">Cấu hình Hệ thống & AI</h3>
                  <p className="text-xs text-on-surface-variant">Tên ứng dụng, ngưỡng YOLO, giới hạn camera</p>
                </div>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-secondary/10 text-secondary border border-secondary/20">
                System API
              </span>
            </div>

            <p className="text-xs text-on-surface-variant leading-relaxed mb-6">
              Điều chỉnh các tham số toàn hệ thống bao gồm ngưỡng độ tin cậy của thuật toán phát hiện vi phạm YOLO, số lượng camera kết nối tối đa và thời gian lưu trữ dữ liệu.
            </p>

            <div className="space-y-2.5 mb-6">
              <div className="flex items-center justify-between p-3 rounded-xl bg-surface-container-high/50 border border-outline-variant/20 text-xs">
                <span className="text-on-surface font-medium">Tên Ứng dụng (App Name)</span>
                <span className="font-semibold text-on-surface">{appConfig?.appName || 'AIDA Vision'}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-surface-container-high/50 border border-outline-variant/20 text-xs">
                <span className="text-on-surface font-medium">Ngưỡng phát hiện (Threshold)</span>
                <span className="font-semibold text-secondary">{appConfig?.detectionThreshold || 0.5}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-surface-container-high/50 border border-outline-variant/20 text-xs">
                <span className="text-on-surface font-medium">Cập nhật Cấu hình</span>
                <span className="font-mono text-amber-400 font-bold">PUT /api/v1/settings</span>
              </div>
            </div>
          </div>

          <button
            onClick={onNavigateToSettings}
            className="w-full bg-secondary hover:bg-secondary/90 text-on-secondary py-3 rounded-xl font-medium transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
          >
            Mở Trang Cấu Hình Hệ Thống <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
