/**
 * Module Thống Kê & Báo Cáo API (`statsApi`):
 * Xử lý truy vấn dữ liệu báo cáo, tổng quan dashboard và chỉ số lưu lượng tương ứng với `/api/v1/stats`
 */

import { request, checkBackendHealth } from './client';

export interface DashboardOverviewData {
  totalVehiclesDaily: number;
  totalDetections: number;
  totalViolations: number;
  pendingViolations: number;
  confirmedViolations: number;
  motorcycleCount: number;
  carCount: number;
  truckCount: number;
  busCount: number;
  onlineCameras: number;
  offlineCameras: number;
  totalCameras: number;
}

export interface StatsQueryParams {
  cameraId?: string;
  vehicleType?: string;
  violationType?: string;
  status?: string;
  from?: string;
  to?: string;
}

export interface VehicleTypeStat {
  vehicleType: string;
  count: number;
  percentage: number;
}

export interface ViolationTypeStat {
  violationType: string;
  count: number;
  percentage: number;
}

export interface ViolationStatusStat {
  status: string;
  count: number;
  percentage: number;
}

export interface ViolationHotspot {
  cameraId: string;
  cameraName: string;
  location?: string;
  violationCount: number;
  latestViolationAt?: string;
}

export interface CameraLiveMetrics {
  cameraId: string;
  cameraName?: string;
  status?: string;
  isOnline: boolean;
  liveTrafficRate: number;
  recentDetectionsCount: number;
  recentViolationsCount: number;
  lastSeenAt?: string;
  latestVehicleType?: string;
  latestConfidence: number;
}

function buildQueryString(params: Record<string, any>): string {
  const query = new URLSearchParams();
  for (const key in params) {
    if (params[key] !== undefined && params[key] !== null) {
      query.append(key, String(params[key]));
    }
  }
  const qStr = query.toString();
  return qStr ? `?${qStr}` : '';
}

export const statsApi = {
  /**
   * Lấy dữ liệu tổng quan cho Dashboard (GET /api/v1/stats/overview)
   */
  overview: async () => {
    const isOnline = await checkBackendHealth();
    if (isOnline) {
      try {
        const response = await request('/stats/overview');
        const data: DashboardOverviewData = {
          totalVehiclesDaily: response.totalVehiclesDaily ?? response.total_vehicles_daily ?? 0,
          totalDetections: response.totalDetections ?? response.total_detections ?? 0,
          totalViolations: response.totalViolations ?? response.total_violations ?? 0,
          pendingViolations: response.pendingViolations ?? response.pending_violations ?? 0,
          confirmedViolations: response.confirmedViolations ?? response.confirmed_violations ?? 0,
          motorcycleCount: response.motorcycleCount ?? response.motorcycle_count ?? 0,
          carCount: response.carCount ?? response.car_count ?? 0,
          truckCount: response.truckCount ?? response.truck_count ?? 0,
          busCount: response.busCount ?? response.bus_count ?? 0,
          onlineCameras: response.onlineCameras ?? response.online_cameras ?? 0,
          offlineCameras: response.offlineCameras ?? response.offline_cameras ?? 0,
          totalCameras: response.totalCameras ?? response.total_cameras ?? 0,
        };
        return { isOnline: true, data };
      } catch (e) {
        console.error('Failed to fetch stats overview, using fallback.', e);
      }
    }

    const localCams = JSON.parse(localStorage.getItem('local_cameras') || '[]');
    const localViolations = JSON.parse(localStorage.getItem('local_violations') || '[]');
    return {
      isOnline: false,
      data: {
        totalVehiclesDaily: 1420 + localViolations.length * 15,
        totalDetections: 3500 + localViolations.length * 20,
        totalViolations: localViolations.length,
        pendingViolations: localViolations.filter((v: any) => v.status === 'PENDING').length,
        confirmedViolations: localViolations.filter((v: any) => v.status === 'VERIFIED').length,
        motorcycleCount: 850,
        carCount: 420,
        truckCount: 110,
        busCount: 40,
        onlineCameras: localCams.filter((c: any) => c.status === 'LIVE').length,
        offlineCameras: localCams.filter((c: any) => c.status === 'OFFLINE').length,
        totalCameras: localCams.length,
      } as DashboardOverviewData,
    };
  },

  /**
   * Lấy thống kê lưu lượng xe theo chuỗi thời gian (GET /api/v1/stats/traffic)
   */
  traffic: async (params: { cameraId?: string; from?: string; to?: string } = {}) => {
    const isOnline = await checkBackendHealth();
    if (isOnline) {
      try {
        const queryStr = buildQueryString(params);
        const response = await request(`/stats/traffic${queryStr}`);
        const mapped = response.map((s: any) => ({
          timestamp: s.timestamp || s.hour,
          time: new Date(s.timestamp || s.hour).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          value: s.totalVehicles ?? s.total_vehicles ?? 0,
          carCount: s.carCount ?? s.car_count ?? 0,
          truckCount: s.truckCount ?? s.truck_count ?? 0,
          busCount: s.busCount ?? s.bus_count ?? 0,
          motorcycleCount: s.motorcycleCount ?? s.motorcycle_count ?? 0,
          violationCount: s.violationCount ?? s.violation_count ?? 0,
        }));
        return { isOnline: true, data: mapped };
      } catch (e) {
        console.error('Failed to fetch traffic stats, using fallback.', e);
      }
    }

    return {
      isOnline: false,
      data: [
        { time: '06:00', value: 120, carCount: 40, motorcycleCount: 70, violationCount: 2 },
        { time: '08:00', value: 450, carCount: 150, motorcycleCount: 270, violationCount: 8 },
        { time: '10:00', value: 300, carCount: 100, motorcycleCount: 180, violationCount: 5 },
        { time: '12:00', value: 250, carCount: 80, motorcycleCount: 150, violationCount: 3 },
        { time: '14:00', value: 280, carCount: 90, motorcycleCount: 170, violationCount: 4 },
        { time: '16:00', value: 520, carCount: 180, motorcycleCount: 310, violationCount: 9 },
        { time: '18:00', value: 610, carCount: 210, motorcycleCount: 370, violationCount: 12 },
        { time: '20:00', value: 340, carCount: 110, motorcycleCount: 210, violationCount: 6 },
      ],
    };
  },

  /**
   * Thống kê phương tiện theo loại (GET /api/v1/stats/vehicles-by-type)
   */
  vehiclesByType: async (params: StatsQueryParams = {}) => {
    const isOnline = await checkBackendHealth();
    if (isOnline) {
      try {
        const queryStr = buildQueryString(params);
        const response = await request(`/stats/vehicles-by-type${queryStr}`);
        const mapped: VehicleTypeStat[] = response.map((item: any) => ({
          vehicleType: item.vehicleType || item.vehicle_type,
          count: item.count,
          percentage: item.percentage,
        }));
        return { isOnline: true, data: mapped };
      } catch (e) {
        console.error('Lỗi khi lấy thống kê phương tiện theo loại:', e);
      }
    }
    return { isOnline: false, data: [] as VehicleTypeStat[] };
  },

  /**
   * Thống kê vi phạm theo hành vi (GET /api/v1/stats/violations)
   */
  violations: async (params: StatsQueryParams = {}) => {
    const isOnline = await checkBackendHealth();
    if (isOnline) {
      try {
        const queryStr = buildQueryString(params);
        const response = await request(`/stats/violations${queryStr}`);
        const mapped: ViolationTypeStat[] = response.map((item: any) => ({
          violationType: item.violationType || item.violation_type,
          count: item.count,
          percentage: item.percentage,
        }));
        return { isOnline: true, data: mapped };
      } catch (e) {
        console.error('Lỗi khi lấy thống kê vi phạm theo hành vi:', e);
      }
    }
    return { isOnline: false, data: [] as ViolationTypeStat[] };
  },

  /**
   * Thống kê vi phạm theo trạng thái duyệt (GET /api/v1/stats/violation-status)
   */
  violationStatus: async (params: StatsQueryParams = {}) => {
    const isOnline = await checkBackendHealth();
    if (isOnline) {
      try {
        const queryStr = buildQueryString(params);
        const response = await request(`/stats/violation-status${queryStr}`);
        const mapped: ViolationStatusStat[] = response.map((item: any) => ({
          status: item.status,
          count: item.count,
          percentage: item.percentage,
        }));
        return { isOnline: true, data: mapped };
      } catch (e) {
        console.error('Lỗi khi lấy thống kê vi phạm theo trạng thái:', e);
      }
    }
    return { isOnline: false, data: [] as ViolationStatusStat[] };
  },

  /**
   * Thống kê điểm nóng vi phạm (GET /api/v1/stats/hotspots)
   */
  hotspots: async (limit: number = 10, params: StatsQueryParams = {}) => {
    const isOnline = await checkBackendHealth();
    if (isOnline) {
      try {
        const queryStr = buildQueryString({ limit, ...params });
        const response = await request(`/stats/hotspots${queryStr}`);
        const mapped: ViolationHotspot[] = response.map((item: any) => ({
          cameraId: item.cameraId || item.camera_id,
          cameraName: item.cameraName || item.camera_name,
          location: item.location,
          violationCount: item.violationCount ?? item.violation_count ?? 0,
          latestViolationAt: item.latestViolationAt || item.latest_violation_at,
        }));
        return { isOnline: true, data: mapped };
      } catch (e) {
        console.error('Lỗi khi lấy danh sách điểm nóng vi phạm:', e);
      }
    }
    return { isOnline: false, data: [] as ViolationHotspot[] };
  },

  /**
   * Lấy số liệu giám sát live theo từng camera (GET /api/v1/stats/camera/{cameraId}/live-metrics)
   */
  cameraLiveMetrics: async (cameraId: string) => {
    const isOnline = await checkBackendHealth();
    if (isOnline) {
      try {
        const response = await request(`/stats/camera/${cameraId}/live-metrics`);
        const data: CameraLiveMetrics = {
          cameraId: response.cameraId || response.camera_id,
          cameraName: response.cameraName || response.camera_name,
          status: response.status,
          isOnline: response.isOnline ?? response.is_online ?? false,
          liveTrafficRate: response.liveTrafficRate ?? response.live_traffic_rate ?? 0,
          recentDetectionsCount: response.recentDetectionsCount ?? response.recent_detections_count ?? 0,
          recentViolationsCount: response.recentViolationsCount ?? response.recent_violations_count ?? 0,
          lastSeenAt: response.lastSeenAt || response.last_seen_at,
          latestVehicleType: response.latestVehicleType || response.latest_vehicle_type,
          latestConfidence: response.latestConfidence ?? response.latest_confidence ?? 0,
        };
        return { isOnline: true, data };
      } catch (e) {
        console.error(`Lỗi khi lấy live metrics camera ${cameraId}:`, e);
      }
    }
    return { isOnline: false, data: null };
  },
};
