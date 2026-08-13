/**
 * Module Violation API (`violationApi`):
 * Xử lý truy vấn danh sách, tìm kiếm, xem chi tiết và duyệt xử lý các vi phạm giao thông tương ứng với `/api/v1/violations`
 */

import { request, checkBackendHealth } from './client';

export interface ListViolationsParams {
  page?: number;
  pageSize?: number;
  cameraId?: string;
  isConfirmed?: boolean;
  status?: 'pending' | 'verified' | 'rejected' | string;
  violationType?: string;
  fromDate?: string;
  toDate?: string;
}

function mapStatusToUi(rawStatus: string | undefined, isConfirmed: boolean | undefined): string {
  if (rawStatus) {
    const s = rawStatus.toLowerCase();
    if (s === 'verified') return 'VERIFIED';
    if (s === 'rejected') return 'REJECTED';
    if (s === 'pending') return 'PENDING';
  }
  if (isConfirmed === true) return 'VERIFIED';
  if (isConfirmed === false) return 'REJECTED';
  return 'PENDING';
}

function mapUiStatusToBackend(uiStatus: string): 'pending' | 'verified' | 'rejected' {
  const s = uiStatus.toLowerCase();
  if (s === 'verified' || s === 'confirmed') return 'verified';
  if (s === 'rejected') return 'rejected';
  return 'pending';
}

export const violationApi = {
  /**
   * Lấy danh sách vi phạm (GET /api/v1/violations)
   */
  list: async (params: ListViolationsParams = {}) => {
    const isOnline = await checkBackendHealth();
    if (isOnline) {
      try {
        const { page = 1, pageSize = 10, cameraId, isConfirmed, status, violationType, fromDate, toDate } = params;
        const query = new URLSearchParams({
          page: String(page),
          pageSize: String(pageSize),
        });
        if (cameraId) query.append('cameraId', cameraId);
        if (isConfirmed !== undefined) query.append('isConfirmed', String(isConfirmed));
        if (status) query.append('status', status.toLowerCase());
        if (violationType) query.append('violationType', violationType);
        if (fromDate) query.append('from', fromDate);
        if (toDate) query.append('to', toDate);

        const response = await request(`/violations?${query.toString()}`);

        const mapped = response.data.map((v: any) => ({
          id: v.id,
          detectionId: v.detectionId || v.detection_id,
          cameraId: v.cameraId || v.camera_id,
          image: v.evidenceUrl || 'https://images.unsplash.com/photo-1544621035-1f9e2b144b20?auto=format&fit=crop&q=80&w=800',
          plate: v.licensePlate || v.license_plate,
          type: v.violationType || v.violation_type,
          vehicleType: v.vehicleType || v.vehicle_type,
          location: v.location || 'Hanoi Highway',
          timestamp: v.createdAt || v.created_at || v.occurredAt || v.timestamp,
          confidence: v.confidence || 0.9,
          status: mapStatusToUi(v.status, v.isConfirmed),
          rawStatus: v.status || (v.isConfirmed ? 'verified' : 'pending'),
          isConfirmed: v.isConfirmed ?? (v.status === 'verified'),
          confirmedBy: v.confirmedBy || v.confirmed_by,
          notes: v.notes,
        }));
        return { isOnline: true, data: mapped, total: response.total };
      } catch (e) {
        console.error('Failed to fetch violations, using fallback.', e);
      }
    }

    let localViolations = JSON.parse(localStorage.getItem('local_violations') || '[]');
    if (params.status) {
      const targetUi = mapStatusToUi(params.status, undefined);
      localViolations = localViolations.filter((v: any) => v.status === targetUi);
    } else if (params.isConfirmed !== undefined) {
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

  /**
   * Lấy thông tin chi tiết một vi phạm (GET /api/v1/violations/{id})
   */
  getById: async (id: string) => {
    const isOnline = await checkBackendHealth();
    if (isOnline && !id.startsWith('VP-LOCAL-')) {
      try {
        const response = await request(`/violations/${id}`);
        const mapped = {
          id: response.id,
          detectionId: response.detectionId || response.detection_id,
          cameraId: response.cameraId || response.camera_id,
          image: response.evidenceUrl || 'https://images.unsplash.com/photo-1544621035-1f9e2b144b20?auto=format&fit=crop&q=80&w=800',
          plate: response.licensePlate || response.license_plate,
          type: response.violationType || response.violation_type,
          vehicleType: response.vehicleType || response.vehicle_type,
          location: response.location || 'Hanoi Highway',
          timestamp: response.createdAt || response.created_at,
          confidence: response.confidence || 0.9,
          status: mapStatusToUi(response.status, response.isConfirmed),
          rawStatus: response.status,
          isConfirmed: response.isConfirmed,
          confirmedBy: response.confirmedBy,
          notes: response.notes,
        };
        return { isOnline: true, data: mapped };
      } catch (e) {
        console.error(`Failed to fetch violation ${id}:`, e);
      }
    }

    const localViolations = JSON.parse(localStorage.getItem('local_violations') || '[]');
    const found = localViolations.find((v: any) => v.id === id);
    return { isOnline: false, data: found || null };
  },

  /**
   * Duyệt / Xác nhận bản ghi vi phạm (PATCH /api/v1/violations/{id})
   */
  confirm: async (id: string, isConfirmed: boolean, notes: string = '', status?: 'pending' | 'verified' | 'rejected' | string) => {
    const isOnline = await checkBackendHealth();
    const reviewStatus = status ? status.toLowerCase() : (isConfirmed ? 'verified' : 'rejected');

    if (isOnline && !id.startsWith('VP-LOCAL-')) {
      const response = await request(`/violations/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          is_confirmed: isConfirmed,
          notes,
          status: reviewStatus,
        }),
      });
      return { isOnline: true, data: response };
    } else {
      const localViolations = JSON.parse(localStorage.getItem('local_violations') || '[]');
      const updated = localViolations.map((v: any) => {
        if (v.id === id) {
          return {
            ...v,
            status: isConfirmed ? 'VERIFIED' : 'REJECTED',
            notes,
          };
        }
        return v;
      });
      localStorage.setItem('local_violations', JSON.stringify(updated));
      return { isOnline: false };
    }
  },

  /**
   * Tra cứu vi phạm theo Biển số xe (GET /api/v1/violations/search)
   */
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
          timestamp: v.occurredAt || v.timestamp || v.createdAt,
          confidence: v.confidence || 0.9,
          status: mapStatusToUi(v.status, v.isConfirmed),
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
  },
};
