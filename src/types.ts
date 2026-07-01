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

export type AppView = 'auth' | 'recovery' | 'reset-password' | 'dashboard' | 'cameras' | 'search' | 'violations' | 'analytics' | 'settings';

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
}

