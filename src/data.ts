import { Violation, KPI, CameraFeed } from './types';

export const mockCameras: CameraFeed[] = [];

export const mockViolations: Violation[] = [];

export const timelineData = [
  { time: '00:00', value: 0 },
  { time: '04:00', value: 0 },
  { time: '08:00', value: 0 },
  { time: '12:00', value: 0 },
  { time: '16:00', value: 0 },
  { time: '20:00', value: 0 },
  { time: '23:59', value: 0 },
];

export const chartConfigData = [
  { name: '95-100%', value: 0, fill: 'var(--color-primary)' },
  { name: '90-95%', value: 0, fill: 'var(--color-secondary)' },
  { name: '<90%', value: 0, fill: 'var(--color-error)' },
];
