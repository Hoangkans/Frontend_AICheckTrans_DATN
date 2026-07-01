import { Violation, KPI, CameraFeed } from './types';

export const mockCameras: CameraFeed[] = [
  {
    id: 'CAM-N-014',
    name: 'CAM-N-014',
    status: 'LIVE',
    resolution: '720p',
    fps: 30,
    image: 'https://images.unsplash.com/photo-1544621035-1f9e2b144b20?auto=format&fit=crop&q=80&w=800',
    currentAlert: {
      type: 'SPEEDING',
      speed: '85mph',
      box: { x: 40, y: 50, w: 20, h: 30 }
    }
  },
  {
    id: 'CAM-E-022',
    name: 'CAM-E-022',
    status: 'LIVE',
    resolution: '1080p',
    fps: 60,
    image: 'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?auto=format&fit=crop&q=80&w=800',
    currentAlert: {
      type: 'TRUCK_ONL',
      box: { x: 50, y: 60, w: 30, h: 20 }
    }
  },
  {
    id: 'CAM-W-088',
    name: 'CAM-W-088',
    status: 'OFFLINE'
  },
  {
    id: 'CAM-S-105',
    name: 'CAM-S-105',
    status: 'LIVE',
    image: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&q=80&w=800',
    currentAlert: {
      type: 'WRONG_WAY',
      box: { x: 60, y: 30, w: 15, h: 25 }
    }
  },
  {
    id: 'CAM-C-050',
    name: 'CAM-C-050',
    status: 'LIVE',
    image: 'https://images.unsplash.com/photo-1473210319455-8d59d18b2611?auto=format&fit=crop&q=80&w=800'
  },
  {
    id: 'CAM-N-015',
    name: 'CAM-N-015',
    status: 'CALIBRATING'
  }
];

export const mockViolations: Violation[] = [
  {
    id: "VP-99201",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBs5lYz5LauWArH9kw1AoFCaOh8e2xiVmR-HqYqQRUTGPpmK1PrekgHvpD6ertCIgBiuXBUWR_rAkNoPbVZ3cbz-8XVKhU5xaUTxTrqkz7t1Nw47ipW-34rIjy_KtIQwm4xWmatUTYP9dlR5xfyo_N5F8Mgzvhl3ZwWZKlw4v8GyLsaMdqPR8fKOHrgift2hEaEj_3_fBY-TnaS-_tiCd3Enw1r5HYfDrDQV-3OuzqKqd7xTvBSmCK94QHcPF9beu4lK_yz9rWasNY",
    plate: "30F-123.45",
    type: "Chạy quá tốc độ (82/60 km/h)",
    location: "Cam NT-04 • QL1A",
    timestamp: "2023-11-20 08:15:32",
    confidence: 0.98,
    status: 'PENDING'
  },
  {
    id: "VP-99200",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuCJ-J4HlBvhgWuzV2jVDFTaI-F7fTDjppk2eRpeWHTsh8A0G1IMCXs7gxMkDsS4X7agiZphLyNAmLKtUImTnGKBS8-j3LeLnQckBGUDpf1Avms1ow_rPLYSl2Fv83VbH8ZOjjgho-nBuM3kqbqV1afw7BrYA9T1LZhyygyw3qlph7fvBlgkf9R4lPRgnjunPDTxbtI-Zk96bPJ4U9KN2r_dK9lWKRXwHZI4rUy8dObAyrpSoRKzOl-oEbYuX2xMjio6OWPcKetv4TY",
    plate: "29H-882.11",
    type: "Vượt đèn đỏ",
    location: "Cam HN-12 • Ngã tư Kim Mã",
    timestamp: "2023-11-20 08:12:05",
    confidence: 0.95,
    status: 'PENDING'
  },
  {
    id: "VP-99199",
    image: "https://images.unsplash.com/photo-1510696956976-db928ddb3726?auto=format&fit=crop&q=80&w=800",
    plate: "51G-555.22",
    type: "Đỗ xe sai quy định",
    location: "Cam SG-01 • Lê Lợi",
    timestamp: "2023-11-20 08:05:10",
    confidence: 0.89,
    status: 'VERIFIED'
  },
  {
    id: "VP-99198",
    image: "https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?auto=format&fit=crop&q=80&w=800",
    plate: "60C-212.90",
    type: "Xe quá tải trọng",
    location: "Cam DN-08 • Tuyến N2",
    timestamp: "2023-11-20 07:55:00",
    confidence: 0.99,
    status: 'REJECTED'
  },
  {
    id: "VP-99197",
    image: "https://images.unsplash.com/photo-1541334860000-1c3905e468da?auto=format&fit=crop&q=80&w=800",
    plate: "15A-334.50",
    type: "Không đội mũ bảo hiểm",
    location: "Cam HP-03 • Lạch Tray",
    timestamp: "2023-11-20 07:42:15",
    confidence: 0.91,
    status: 'VERIFIED'
  }
];

export const timelineData = [
  { time: '00:00', value: 120 },
  { time: '04:00', value: 45 },
  { time: '08:00', value: 390 },
  { time: '12:00', value: 210 },
  { time: '16:00', value: 450 },
  { time: '20:00', value: 180 },
  { time: '23:59', value: 90 },
];

export const chartConfigData = [
  { name: '95-100%', value: 85, fill: 'var(--color-primary)' },
  { name: '90-95%', value: 10, fill: 'var(--color-secondary)' },
  { name: '<90%', value: 5, fill: 'var(--color-error)' },
];
