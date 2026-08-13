import { request, checkBackendHealth } from './client';
import { mockCameras } from '../../data';

export const cameraApi = {
  /**
   * Lấy danh sách tất cả Camera (GET /api/v1/cameras)
   */
  list: async () => {
    const isOnline = await checkBackendHealth();
    if (isOnline) {
      try {
        const response = await request('/cameras?pageSize=100');
        const mapped = response.data.map((c: any) => ({
          id: c.id,
          name: c.name,
          rtspUrl: c.rtspUrl,
          videoUrl: c.rtspUrl,
          latitude: c.latitude,
          longitude: c.longitude,
          address: c.address,
          intersection: c.intersection,
          direction: c.direction,
          status: c.status === 'active' ? 'LIVE' : c.status === 'maintenance' ? 'CALIBRATING' : 'OFFLINE',
          resolution: c.config?.resolution || '1080p',
          fps: c.config?.fps || 30,
          image: c.config?.image || 'https://images.unsplash.com/photo-1544621035-1f9e2b144b20?auto=format&fit=crop&q=80&w=800',
          currentAlert: c.config?.currentAlert
        }));
        return { isOnline: true, data: mapped };
      } catch (e) {
        console.error('Không thể tải danh sách camera từ backend, sử dụng dữ liệu dự phòng.', e);
      }
    }

    const localStored = localStorage.getItem('local_cameras');
    const localData = localStored ? JSON.parse(localStored) : mockCameras;
    if (!localStored) {
      localStorage.setItem('local_cameras', JSON.stringify(mockCameras));
    }
    return { isOnline: false, data: localData };
  },

  /**
   * Lấy thông tin chi tiết 1 camera (GET /api/v1/cameras/{id})
   */
  get: async (id: string) => {
    const isOnline = await checkBackendHealth();
    if (isOnline && !id.startsWith('CAM-LOCAL-')) {
      try {
        const c = await request(`/cameras/${id}`);
        const mapped = {
          id: c.id,
          name: c.name,
          rtspUrl: c.rtspUrl,
          videoUrl: c.rtspUrl,
          latitude: c.latitude,
          longitude: c.longitude,
          address: c.address,
          intersection: c.intersection,
          direction: c.direction,
          status: c.status === 'active' ? 'LIVE' : c.status === 'maintenance' ? 'CALIBRATING' : 'OFFLINE',
          resolution: c.config?.resolution || '1080p',
          fps: c.config?.fps || 30,
          image: c.config?.image || 'https://images.unsplash.com/photo-1544621035-1f9e2b144b20?auto=format&fit=crop&q=80&w=800',
          currentAlert: c.config?.currentAlert
        };
        return { isOnline: true, data: mapped };
      } catch (e) {
        console.error(`Lỗi khi đọc chi tiết camera ${id}:`, e);
      }
    }

    const localCams = JSON.parse(localStorage.getItem('local_cameras') || JSON.stringify(mockCameras));
    const found = localCams.find((item: any) => item.id === id);
    return { isOnline: false, data: found || null };
  },

  /**
   * Tạo camera mới (POST /api/v1/cameras)
   */
  create: async (cameraData: any) => {
    const isOnline = await checkBackendHealth();
    if (isOnline) {
      const body = {
        name: cameraData.name,
        rtspUrl: cameraData.rtspUrl,
        latitude: cameraData.latitude || 21.0285,
        longitude: cameraData.longitude || 105.8542,
        address: cameraData.address || 'Hà Nội, Việt Nam',
        intersection: cameraData.intersection || 'Ngã tư Kim Mã',
        direction: cameraData.direction || 'north',
        status: cameraData.status === 'LIVE' ? 'active' : cameraData.status === 'CALIBRATING' ? 'maintenance' : 'inactive',
        config: {
          resolution: cameraData.resolution || '1080p',
          fps: cameraData.fps || 30,
          image: cameraData.image || 'https://images.unsplash.com/photo-1506012787146-f92b2d7d6d96?auto=format&fit=crop&q=80&w=800'
        },
        vehicleTypes: ['car', 'motorcycle', 'truck']
      };
      const response = await request('/cameras', {
        method: 'POST',
        body: JSON.stringify(body)
      });
      return { isOnline: true, data: response };
    } else {
      const localCams = JSON.parse(localStorage.getItem('local_cameras') || JSON.stringify(mockCameras));
      const newCam = {
        id: `CAM-LOCAL-${Math.floor(Math.random() * 1000)}`,
        name: cameraData.name,
        rtspUrl: cameraData.rtspUrl || 'rtsp://192.168.1.100',
        videoUrl: cameraData.rtspUrl || 'rtsp://192.168.1.100',
        status: cameraData.status || 'LIVE',
        resolution: cameraData.resolution || '1080p',
        fps: cameraData.fps || 30,
        image: cameraData.image || 'https://images.unsplash.com/photo-1506012787146-f92b2d7d6d96?auto=format&fit=crop&q=80&w=800'
      };
      localCams.push(newCam);
      localStorage.setItem('local_cameras', JSON.stringify(localCams));
      return { isOnline: false, data: newCam };
    }
  },

  /**
   * Cập nhật thông tin camera (PUT /api/v1/cameras/{id})
   */
  update: async (id: string, cameraData: any) => {
    const isOnline = await checkBackendHealth();
    if (isOnline && !id.startsWith('CAM-LOCAL-')) {
      const body = {
        name: cameraData.name,
        rtspUrl: cameraData.rtspUrl,
        status: cameraData.status === 'LIVE' ? 'active' : cameraData.status === 'CALIBRATING' ? 'maintenance' : 'inactive',
        config: {
          resolution: cameraData.resolution || '1080p',
          fps: cameraData.fps || 30,
          image: cameraData.image
        }
      };
      const response = await request(`/cameras/${id}`, {
        method: 'PUT',
        body: JSON.stringify(body)
      });
      return { isOnline: true, data: response };
    } else {
      const localCams = JSON.parse(localStorage.getItem('local_cameras') || JSON.stringify(mockCameras));
      const updatedCams = localCams.map((c: any) => {
        if (c.id === id) {
          return {
            ...c,
            name: cameraData.name,
            rtspUrl: cameraData.rtspUrl,
            videoUrl: cameraData.rtspUrl,
            status: cameraData.status,
            resolution: cameraData.resolution,
            fps: cameraData.fps,
            image: cameraData.image || c.image
          };
        }
        return c;
      });
      localStorage.setItem('local_cameras', JSON.stringify(updatedCams));
      return { isOnline: false, data: cameraData };
    }
  },

  /**
   * Xóa camera (DELETE /api/v1/cameras/{id})
   */
  delete: async (id: string) => {
    const isOnline = await checkBackendHealth();
    if (isOnline && !id.startsWith('CAM-LOCAL-')) {
      await request(`/cameras/${id}`, {
        method: 'DELETE'
      });
      return { isOnline: true };
    } else {
      const localCams = JSON.parse(localStorage.getItem('local_cameras') || JSON.stringify(mockCameras));
      const filtered = localCams.filter((c: any) => c.id !== id);
      localStorage.setItem('local_cameras', JSON.stringify(filtered));
      return { isOnline: false };
    }
  }
};
