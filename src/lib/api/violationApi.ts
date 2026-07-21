import { request, checkBackendHealth } from './client';

export const violationApi = {
  list: async (params: { page?: number; pageSize?: number; isConfirmed?: boolean; violationType?: string } = {}) => {
    const isOnline = await checkBackendHealth();
    if (isOnline) {
      try {
        const { page = 1, pageSize = 10, isConfirmed, violationType } = params;
        let queryParams = `?page=${page}&pageSize=${pageSize}`;
        if (isConfirmed !== undefined) queryParams += `&isConfirmed=${isConfirmed}`;
        if (violationType) queryParams += `&violationType=${encodeURIComponent(violationType)}`;
        
        const response = await request(`/violations${queryParams}`);
        
        const mapped = response.data.map((v: any) => ({
          id: v.id,
          image: v.evidenceUrl || 'https://images.unsplash.com/photo-1544621035-1f9e2b144b20?auto=format&fit=crop&q=80&w=800',
          plate: v.licensePlate,
          type: v.violationType,
          location: v.location || 'Hanoi Highway',
          timestamp: v.occurredAt || v.timestamp,
          confidence: v.confidence || 0.9,
          status: v.isConfirmed === true ? 'VERIFIED' : v.isConfirmed === false ? 'REJECTED' : 'PENDING'
        }));
        return { isOnline: true, data: mapped, total: response.total };
      } catch (e) {
        console.error('Failed to fetch violations, using fallback.', e);
      }
    }
    
    let localViolations = JSON.parse(localStorage.getItem('local_violations') || '[]');
    if (params.isConfirmed !== undefined) {
      const targetStatus = params.isConfirmed ? 'VERIFIED' : 'PENDING';
      localViolations = localViolations.filter((v: any) => v.status === targetStatus);
    }
    if (params.violationType) {
      localViolations = localViolations.filter((v: any) => v.type.toLowerCase().includes(params.violationType!.toLowerCase()));
    }
    
    const page = params.page || 1;
    const pageSize = params.pageSize || 10;
    const paginated = localViolations.slice((page - 1) * pageSize, page * pageSize);
    
    return { isOnline: false, data: paginated, total: localViolations.length };
  },

  confirm: async (id: string, isConfirmed: boolean, notes: string = '') => {
    const isOnline = await checkBackendHealth();
    if (isOnline && !id.startsWith('VP-LOCAL-')) {
      const response = await request(`/violations/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ isConfirmed, notes })
      });
      return { isOnline: true, data: response };
    } else {
      const localViolations = JSON.parse(localStorage.getItem('local_violations') || '[]');
      const updated = localViolations.map((v: any) => {
        if (v.id === id) {
          return {
            ...v,
            status: isConfirmed ? 'VERIFIED' : 'REJECTED'
          };
        }
        return v;
      });
      localStorage.setItem('local_violations', JSON.stringify(updated));
      return { isOnline: false };
    }
  },

  search: async (licensePlate: string) => {
    const isOnline = await checkBackendHealth();
    if (isOnline) {
      try {
        const response = await request(`/violations/search?q=${encodeURIComponent(licensePlate)}`);
        const mapped = response.map((v: any) => ({
          id: v.id,
          image: v.evidenceUrl || 'https://images.unsplash.com/photo-1544621035-1f9e2b144b20?auto=format&fit=crop&q=80&w=800',
          plate: v.licensePlate,
          type: v.violationType,
          location: v.location || 'Hanoi Highway',
          timestamp: v.occurredAt || v.timestamp,
          confidence: v.confidence || 0.9,
          status: v.isConfirmed === true ? 'VERIFIED' : v.isConfirmed === false ? 'REJECTED' : 'PENDING'
        }));
        return { isOnline: true, data: mapped };
      } catch (e) {
        console.error('Failed to search plate, using fallback.', e);
      }
    }
    
    const localViolations = JSON.parse(localStorage.getItem('local_violations') || '[]');
    const filtered = localViolations.filter((v: any) => 
      v.plate.toLowerCase().replace('-', '').includes(licensePlate.toLowerCase().replace('-', ''))
    );
    return { isOnline: false, data: filtered };
  }
};
