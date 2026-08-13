export interface Violation {
  id: string;
  image: string;
  plate: string;
  type: string;
  location: string;
  timestamp: string;
  confidence: number;
  status: 'PENDING' | 'VERIFIED' | 'REJECTED';
}

export interface KPI {
  label: string;
  value: string;
  trend?: string;
  trendUp?: boolean;
  icon?: any;
  color?: string;
  bg?: string;
}

export interface ViewConfig {
  layout: 'grid' | 'list';
}

export type AppView = 'auth' | 'recovery' | 'reset-password' | 'dashboard' | 'cameras' | 'search' | 'violations' | 'analytics' | 'settings' | 'admin-dashboard' | 'admin-users' | 'admin-settings';

export interface DetectedVehicle {
  id: string;
  type: string;
  licensePlate?: string;
  isViolation: boolean;
  violationType?: 'SPEEDING' | 'RED_LIGHT' | 'WRONG_WAY' | 'NO_HELMET' | 'PARKING';
  speed?: string;
  speedLimit?: string;
  confidence: number;
  box: { x: number; y: number; w: number; h: number };
  timestamp?: string;
  snapshotUrl?: string;
}

export interface CameraFeed {
  id: string;
  name: string;
  status: 'LIVE' | 'OFFLINE' | 'CALIBRATING';
  resolution?: string;
  image?: string;
  videoUrl?: string;
  fps?: number;
  currentAlert?: {
    type: string;
    speed?: string;
    box: { x: number; y: number; w: number; h: number };
  };
  detectedVehicles?: DetectedVehicle[];
}


