/**
 * Module Model Training API (`trainingApi`):
 * Xử lý quản lý và khởi chạy huấn luyện mô hình YOLO tương ứng với backend `/api/v1/training`:
 * - GET /training/config/default: Lấy cấu hình huấn luyện mặc định (yolo26s.pt, dataset.yaml, batch:8, epochs:200...)
 * - GET /training/status: Lấy trạng thái & tiến độ huấn luyện thời gian thực
 * - POST /training/train: Khởi động quá trình huấn luyện YOLO
 * - POST /training/stop: Dừng quá trình huấn luyện
 */

import { request, checkBackendHealth } from './client';

export interface YOLOTrainParams {
  modelWeights?: string;
  data?: string;
  imgsz?: number;
  rect?: boolean;
  batch?: number;
  epochs?: number;
  project?: string;
  name?: string;
  save?: boolean;
  device?: string;
  workers?: number;
}

export interface TrainingStatusDto {
  status: 'idle' | 'running' | 'completed' | 'failed' | 'stopped';
  progress: number;
  currentEpoch: number;
  totalEpochs: number;
  message: string;
  config?: Record<string, any>;
  startedAt?: string;
  finishedAt?: string;
  error?: string;
  taskId?: string;
}

export interface TrainingResponseDto {
  message: string;
  status: string;
  taskId?: string;
}

export const DEFAULT_YOLO_CONFIG: YOLOTrainParams = {
  modelWeights: 'yolo26s.pt',
  data: '/content/dataset/dataset.yaml',
  imgsz: 640,
  rect: true,
  batch: 8,
  epochs: 200,
  project: '/content/drive/MyDrive/Benchmark',
  name: 'YOLO26_Hybird_Dataset',
  save: true,
  workers: 4,
};

export const trainingApi = {
  /**
   * Lấy cấu hình huấn luyện YOLO mặc định (GET /api/v1/training/config/default)
   */
  getDefaultConfig: async () => {
    const isOnline = await checkBackendHealth();
    if (isOnline) {
      try {
        const response = await request('/training/config/default');
        const data: YOLOTrainParams = {
          modelWeights: response.modelWeights || response.model_weights || DEFAULT_YOLO_CONFIG.modelWeights,
          data: response.data || DEFAULT_YOLO_CONFIG.data,
          imgsz: response.imgsz ?? DEFAULT_YOLO_CONFIG.imgsz,
          rect: response.rect ?? DEFAULT_YOLO_CONFIG.rect,
          batch: response.batch ?? DEFAULT_YOLO_CONFIG.batch,
          epochs: response.epochs ?? DEFAULT_YOLO_CONFIG.epochs,
          project: response.project || DEFAULT_YOLO_CONFIG.project,
          name: response.name || DEFAULT_YOLO_CONFIG.name,
          save: response.save ?? DEFAULT_YOLO_CONFIG.save,
          device: response.device,
          workers: response.workers ?? DEFAULT_YOLO_CONFIG.workers,
        };
        return { isOnline: true, data };
      } catch (e) {
        console.error('Không thể lấy cấu hình huấn luyện mặc định từ backend:', e);
      }
    }

    return { isOnline: false, data: DEFAULT_YOLO_CONFIG };
  },

  /**
   * Lấy trạng thái & tiến độ huấn luyện thời gian thực (GET /api/v1/training/status)
   */
  getStatus: async () => {
    const isOnline = await checkBackendHealth();
    if (isOnline) {
      try {
        const response = await request('/training/status');
        const data: TrainingStatusDto = {
          status: response.status || 'idle',
          progress: response.progress ?? 0,
          currentEpoch: response.currentEpoch ?? response.current_epoch ?? 0,
          totalEpochs: response.totalEpochs ?? response.total_epochs ?? 0,
          message: response.message || 'Không có tiến trình huấn luyện nào.',
          config: response.config,
          startedAt: response.startedAt || response.started_at,
          finishedAt: response.finishedAt || response.finished_at,
          error: response.error,
          taskId: response.taskId || response.task_id,
        };
        return { isOnline: true, data };
      } catch (e) {
        console.error('Không thể kết nối lấy trạng thái huấn luyện từ backend:', e);
      }
    }

    // Chế độ dự phòng Offline
    const localStatus: TrainingStatusDto = JSON.parse(
      localStorage.getItem('local_training_status') ||
        JSON.stringify({
          status: 'idle',
          progress: 0,
          currentEpoch: 0,
          totalEpochs: 200,
          message: 'Hệ thống đang ở chế độ Offline (Dự phòng).',
          config: DEFAULT_YOLO_CONFIG,
        })
    );

    return { isOnline: false, data: localStatus };
  },

  /**
   * Bắt đầu huấn luyện YOLO (POST /api/v1/training/train)
   */
  startTraining: async (params: YOLOTrainParams = DEFAULT_YOLO_CONFIG) => {
    const isOnline = await checkBackendHealth();
    const payload = {
      model_weights: params.modelWeights || DEFAULT_YOLO_CONFIG.modelWeights,
      data: params.data || DEFAULT_YOLO_CONFIG.data,
      imgsz: params.imgsz ?? DEFAULT_YOLO_CONFIG.imgsz,
      rect: params.rect ?? DEFAULT_YOLO_CONFIG.rect,
      batch: params.batch ?? DEFAULT_YOLO_CONFIG.batch,
      epochs: params.epochs ?? DEFAULT_YOLO_CONFIG.epochs,
      project: params.project || DEFAULT_YOLO_CONFIG.project,
      name: params.name || DEFAULT_YOLO_CONFIG.name,
      save: params.save ?? DEFAULT_YOLO_CONFIG.save,
      device: params.device,
      workers: params.workers ?? DEFAULT_YOLO_CONFIG.workers,
    };

    if (isOnline) {
      const response = await request('/training/train', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      const data: TrainingResponseDto = {
        message: response.message || 'Tiến trình huấn luyện YOLO đã được khởi chạy.',
        status: response.status || 'running',
        taskId: response.taskId || response.task_id,
      };
      return { isOnline: true, data };
    } else {
      const mockStatus: TrainingStatusDto = {
        status: 'running',
        progress: 5.0,
        currentEpoch: 10,
        totalEpochs: payload.epochs,
        message: `[Offline Demo] Đang huấn luyện YOLO với mô hình ${payload.model_weights}`,
        config: payload,
        startedAt: new Date().toISOString(),
        taskId: `offline-task-${Date.now()}`,
      };
      localStorage.setItem('local_training_status', JSON.stringify(mockStatus));

      return {
        isOnline: false,
        data: {
          message: '[Offline] Tiến trình huấn luyện đã được khởi tạo (Mô phỏng).',
          status: 'running',
          taskId: mockStatus.taskId,
        } as TrainingResponseDto,
      };
    }
  },

  /**
   * Dừng huấn luyện YOLO (POST /api/v1/training/stop)
   */
  stopTraining: async () => {
    const isOnline = await checkBackendHealth();
    if (isOnline) {
      const response = await request('/training/stop', {
        method: 'POST',
      });
      const data: TrainingResponseDto = {
        message: response.message || 'Đã gửi lệnh dừng tiến trình huấn luyện.',
        status: response.status || 'stopping',
      };
      return { isOnline: true, data };
    } else {
      const local = JSON.parse(localStorage.getItem('local_training_status') || '{}');
      const updated: TrainingStatusDto = {
        ...local,
        status: 'stopped',
        message: '[Offline] Tiến trình huấn luyện đã được dừng bởi người dùng.',
        finishedAt: new Date().toISOString(),
      };
      localStorage.setItem('local_training_status', JSON.stringify(updated));

      return {
        isOnline: false,
        data: {
          message: '[Offline] Tiến trình huấn luyện đã được dừng.',
          status: 'stopped',
        } as TrainingResponseDto,
      };
    }
  },
};
