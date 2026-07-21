import { request, checkBackendHealth } from './client';

export const statsApi = {
  overview: async () => {
    const isOnline = await checkBackendHealth();
    if (isOnline) {
      try {
        const response = await request('/stats/overview');
        return { isOnline: true, data: response };
      } catch (e) {
        console.error('Failed to fetch stats overview, using fallback.', e);
      }
    }
    
    const localCams = JSON.parse(localStorage.getItem('local_cameras') || '[]');
    const localViolations = JSON.parse(localStorage.getItem('local_violations') || '[]');
    return {
      isOnline: false,
      data: {
        totalCameras: localCams.length,
        onlineCameras: localCams.filter((c: any) => c.status === 'LIVE').length,
        offlineCameras: localCams.filter((c: any) => c.status === 'OFFLINE').length,
        totalVehiclesDaily: 1420 + localViolations.length * 15,
        motorcycleCount: 850,
        carCount: 420,
        truckCount: 110,
        busCount: 40
      }
    };
  },

  traffic: async () => {
    const isOnline = await checkBackendHealth();
    if (isOnline) {
      try {
        const response = await request('/stats/traffic');
        const mapped = response.map((s: any) => ({
          time: new Date(s.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          value: s.totalVehicles
        }));
        return { isOnline: true, data: mapped };
      } catch (e) {
        console.error('Failed to fetch traffic stats, using fallback.', e);
      }
    }
    
    return {
      isOnline: false,
      data: [
        { time: '06:00', value: 120 },
        { time: '08:00', value: 450 },
        { time: '10:00', value: 300 },
        { time: '12:00', value: 250 },
        { time: '14:00', value: 280 },
        { time: '16:00', value: 520 },
        { time: '18:00', value: 610 },
        { time: '20:00', value: 340 }
      ]
    };
  }
};
