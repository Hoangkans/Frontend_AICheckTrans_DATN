/**
 * Module Detection API (`detectionApi`):
 * Xử lý các tác vụ nhận diện phương tiện & vi phạm bằng YOLO tương ứng với backend `/api/v1/detections`:
 * - GET /detections: Lấy danh sách nhận diện (phân trang, lọc theo camera, loại xe, thời gian, độ tin cậy)
 * - GET /detections/{id}: Lấy chi tiết 1 bản ghi nhận diện
 * - POST /detections/detect: Upload file ảnh/video để chạy YOLO trực tiếp
 * - POST /detections/jobs: Upload file để chạy nhận diện ngầm qua Background Job
 * - GET /detections/jobs: Danh sách các background jobs nhận diện
 * - GET /detections/jobs/{job_id}: Trạng thái & kết quả của 1 job
 */

import { request, checkBackendHealth } from './client';

export interface BoundingBoxDto {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export interface DetectionDto {
  id: string;
  cameraId: string;
  frameId: number;
  vehicleType: string;
  confidence: number;
  bbox: BoundingBoxDto;
  metadata: Record<string, any>;
  detectedAt: string;
}

export interface ListDetectionsParams {
  page?: number;
  pageSize?: number;
  cameraId?: string;
  vehicleType?: string;
  from?: string;
  to?: string;
  minConfidence?: number;
}

export interface DetectionJobDto {
  id: string;
  cameraId: string;
  status: 'queued' | 'running' | 'completed' | 'failed';
  progress: number;
  result?: {
    success: boolean;
    count: number;
    violations_count: number;
    detections: Array<{
      id: string;
      vehicle_type: string;
      confidence: number;
      bbox: BoundingBoxDto;
      metadata: Record<string, any>;
    }>;
  };
  error?: string;
  createdAt: string;
  updatedAt: string;
}

export const detectionApi = {
  /**
   * Lấy danh sách các lượt nhận diện phương tiện (GET /api/v1/detections)
   */
  list: async (params: ListDetectionsParams = {}) => {
    const isOnline = await checkBackendHealth();
    if (isOnline) {
      try {
        const { page = 1, pageSize = 10, cameraId, vehicleType, from, to, minConfidence } = params;
        const query = new URLSearchParams({
          page: String(page),
          pageSize: String(pageSize),
        });
        if (cameraId) query.append('cameraId', cameraId);
        if (vehicleType) query.append('vehicleType', vehicleType);
        if (from) query.append('from', from);
        if (to) query.append('to', to);
        if (minConfidence !== undefined) query.append('minConfidence', String(minConfidence));

        const response = await request(`/detections?${query.toString()}`);
        return {
          isOnline: true,
          data: response.data as DetectionDto[],
          total: response.total,
          page: response.page,
          pageSize: response.pageSize,
        };
      } catch (e) {
        console.error('Lỗi khi lấy danh sách detections từ backend:', e);
      }
    }

    return {
      isOnline: false,
      data: [],
      total: 0,
      page: params.page || 1,
      pageSize: params.pageSize || 10,
    };
  },

  /**
   * Lấy chi tiết một nhận diện theo ID (GET /api/v1/detections/{id})
   */
  getById: async (id: string) => {
    const isOnline = await checkBackendHealth();
    if (isOnline) {
      const response = await request(`/detections/${id}`);
      return { isOnline: true, data: response as DetectionDto };
    }
    return { isOnline: false, data: null };
  },

  /**
   * Upload file ảnh/video để phát hiện phương tiện trực tiếp (POST /api/v1/detections/detect)
   */
  detect: async (cameraId: string, file: File) => {
    const isOnline = await checkBackendHealth();
    if (isOnline) {
      const formData = new FormData();
      formData.append('file', file);

      const response = await request(`/detections/detect?camera_id=${encodeURIComponent(cameraId)}`, {
        method: 'POST',
        body: formData,
      });
      return { isOnline: true, data: response };
    }
    throw new Error('Máy chủ API đang offline. Không thể thực hiện nhận diện trực tiếp.');
  },

  /**
   * Tạo background job xử lý file nhận diện (POST /api/v1/detections/jobs)
   */
  createJob: async (cameraId: string, file: File) => {
    const isOnline = await checkBackendHealth();
    if (isOnline) {
      const formData = new FormData();
      formData.append('file', file);

      const response = await request(`/detections/jobs?camera_id=${encodeURIComponent(cameraId)}`, {
        method: 'POST',
        body: formData,
      });
      return { isOnline: true, data: response as DetectionJobDto };
    }
    throw new Error('Máy chủ API đang offline. Không thể tạo job nhận diện.');
  },

  /**
   * Lấy danh sách tất cả các background detection jobs (GET /api/v1/detections/jobs)
   */
  getJobs: async () => {
    const isOnline = await checkBackendHealth();
    if (isOnline) {
      try {
        const response = await request('/detections/jobs');
        return { isOnline: true, data: response.data as DetectionJobDto[], total: response.total };
      } catch (e) {
        console.error('Lỗi khi lấy danh sách detection jobs:', e);
      }
    }
    return { isOnline: false, data: [], total: 0 };
  },

  /**
   * Kiểm tra trạng thái của một job nhận diện (GET /api/v1/detections/jobs/{job_id})
   */
  getJobById: async (jobId: string) => {
    const isOnline = await checkBackendHealth();
    if (isOnline) {
      const response = await request(`/detections/jobs/${jobId}`);
      return { isOnline: true, data: response as DetectionJobDto };
    }
    return { isOnline: false, data: null };
  },
};
