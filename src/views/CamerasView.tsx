import { useState, useEffect, useRef } from 'react';
import { 
  VideoOff, Maximize, LayoutGrid, Download, Settings2, Activity, PlaySquare, 
  ZoomIn, Upload, X, FileVideo, Play, Plus, Trash2, Edit2, Bell, ShieldAlert, 
  CheckCircle2, Car, FileText, Send, Crosshair, Info, Layers, AlertTriangle,
  Search, ChevronLeft, ChevronRight, ChevronsUpDown, RotateCcw, History, Clock, Pause
} from 'lucide-react';
import { cn } from '../lib/utils';
import { CameraFeed, DetectedVehicle } from '../types';
import { cameraApi, detectionApi } from '../lib/api';

export function CamerasView() {
  const [cameras, setCameras] = useState<CameraFeed[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAddEditOpen, setIsAddEditOpen] = useState(false);
  const [selectedInspectionCam, setSelectedInspectionCam] = useState<CameraFeed | null>(null);
  const [selectedVehicleTarget, setSelectedVehicleTarget] = useState<DetectedVehicle | null>(null);
  
  // Notification Toast State
  const [activeNotification, setActiveNotification] = useState<{ id: string; message: string; type: 'info' | 'warning' | 'error' } | null>(null);

  const [isOnline, setIsOnline] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  // Form State
  const [cameraForm, setCameraForm] = useState({
    id: '',
    name: '',
    rtspUrl: '',
    status: 'LIVE' as 'LIVE' | 'OFFLINE' | 'CALIBRATING',
    resolution: '1080p',
    fps: 30,
    image: ''
  });

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedVideoUrl, setSelectedVideoUrl] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisLogs, setAnalysisLogs] = useState<string[]>([]);

  const analysisIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const showNotification = (message: string, type: 'info' | 'warning' | 'error' = 'info') => {
    const id = String(Date.now());
    setActiveNotification({ id, message, type });
    setTimeout(() => {
      setActiveNotification(prev => (prev?.id === id ? null : prev));
    }, 4500);
  };

  const fetchCams = async () => {
    try {
      setIsLoading(true);
      const res = await cameraApi.list();
      setCameras(res.data);
      setIsOnline(res.isOnline);
    } catch (err) {
      console.error('Error fetching cameras:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCams();
  }, []);

  useEffect(() => {
    let activeUrl = selectedVideoUrl;
    return () => {
      if (activeUrl) {
        URL.revokeObjectURL(activeUrl);
      }
    };
  }, [selectedVideoUrl]);

  useEffect(() => {
    return () => {
      if (analysisIntervalRef.current) {
        clearInterval(analysisIntervalRef.current);
      }
    };
  }, []);

  const handleAddEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (cameraForm.id) {
        await cameraApi.update(cameraForm.id, cameraForm);
        showNotification(`Đã cập nhật cấu hình cho camera ${cameraForm.name}`, 'info');
      } else {
        await cameraApi.create(cameraForm);
        showNotification(`Đã đăng ký camera mới ${cameraForm.name}`, 'info');
      }
      await fetchCams();
      setIsAddEditOpen(false);
    } catch (err: any) {
      alert('Lỗi xử lý camera: ' + err.message);
    }
  };

  const handleEditClick = (cam: CameraFeed) => {
    setCameraForm({
      id: cam.id,
      name: cam.name,
      rtspUrl: cam.videoUrl || '',
      status: cam.status,
      resolution: cam.resolution || '1080p',
      fps: cam.fps || 30,
      image: cam.image || ''
    });
    setIsAddEditOpen(true);
  };

  const handleDeleteClick = async (id: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa camera này?')) {
      try {
        await cameraApi.delete(id);
        await fetchCams();
        showNotification('Đã xóa camera thành công khỏi hệ thống.', 'warning');
      } catch (err: any) {
        alert('Lỗi khi xóa camera: ' + err.message);
      }
    }
  };

  const openInspection = (cam: CameraFeed, vehicle?: DetectedVehicle) => {
    setSelectedInspectionCam(cam);
    const target = vehicle || (cam.detectedVehicles && cam.detectedVehicles.length > 0 ? cam.detectedVehicles[0] : null);
    setSelectedVehicleTarget(target);
    if (target) {
      showNotification(
        `Đã mở cửa sổ theo dõi phương tiện [${target.licensePlate || target.id}] trên ${cam.name}`,
        target.isViolation ? 'error' : 'info'
      );
    }
  };

  const startAnalysis = async () => {
    if (!selectedFile) return;
    setIsAnalyzing(true);
    setUploadProgress(0);
    setAnalysisLogs(['[INFO] Khởi tạo luồng xử lý video...']);

    const targetCamId = cameras.length > 0 && !cameras[0].id.startsWith('CAM-LOCAL-') 
      ? cameras[0].id 
      : '00000000-0000-0000-0000-000000000001';

    try {
      setUploadProgress(20);
      setAnalysisLogs(prev => [...prev, `[SYSTEM] Đang tải file video lên Backend API (/api/v1/detections/detect)...`]);

      setUploadProgress(45);
      setAnalysisLogs(prev => [...prev, `[AI] Đang chạy mô hình Detection.pt & License_Plate.pt...`]);

      const res = await detectionApi.detect(targetCamId, selectedFile);

      setUploadProgress(90);
      const count = res.data?.count ?? 0;
      const vCount = res.data?.violations_count ?? 0;
      setAnalysisLogs(prev => [
        ...prev,
        `[SUCCESS] Backend xử lý video thành công! Tìm thấy ${count} đối tượng và ${vCount} vi phạm.`,
      ]);

      if (vCount > 0) {
        setAnalysisLogs(prev => [...prev, `[WARNING] Đã tự động ghi nhận ${vCount} bản ghi vi phạm vào PostgreSQL!`]);
      }

      setUploadProgress(100);

      setTimeout(() => {
        const newCamId = 'CAM-UPLOAD-' + Math.floor(Math.random() * 1000);
        
        const rawDetections = res.data?.detections || [];
        const uploadedVehicles: DetectedVehicle[] = rawDetections.map((d: any, idx: number) => {
          const typeMap: Record<string, string> = {
            car: 'Ô tô',
            truck: 'Xe tải',
            bus: 'Xe khách',
            motorcycle: 'Xe máy',
            bicycle: 'Xe đạp',
            person: 'Người đi bộ',
            traffic_light: 'Đèn giao thông',
            traffic_sign: 'Biển báo'
          };
          const bbox = d.bbox || {};
          const x1 = Number(bbox.x1 ?? 0);
          const y1 = Number(bbox.y1 ?? 0);
          const x2 = Number(bbox.x2 ?? 0);
          const y2 = Number(bbox.y2 ?? 0);

          let fw = Number(d.metadata?.frame_width || d.metadata?.width || 0);
          let fh = Number(d.metadata?.frame_height || d.metadata?.height || 0);

          let xPct = 0;
          let yPct = 0;
          let wPct = 0;
          let hPct = 0;

          if (x1 <= 1 && x2 <= 1 && x2 > 0) {
            // Normalized 0..1 coordinates
            xPct = x1 * 100;
            yPct = y1 * 100;
            wPct = Math.max(3, (x2 - x1) * 100);
            hPct = Math.max(3, (y2 - y1) * 100);
          } else {
            // Pixel coordinates
            if (!fw || fw < x2) fw = Math.max(x2, 1920);
            if (!fh || fh < y2) fh = Math.max(y2, 1080);
            wPct = Math.min(90, Math.max(4, ((x2 - x1) / fw) * 100));
            hPct = Math.min(90, Math.max(4, ((y2 - y1) / fh) * 100));
            xPct = Math.min(100 - wPct, Math.max(0, (x1 / fw) * 100));
            yPct = Math.min(100 - hPct, Math.max(0, (y1 / fh) * 100));
          }

          const plateStr = d.license_plate || d.metadata?.license_plate;
          const rawViolType = d.violation_type || d.metadata?.violation_type || (vCount > 0 && idx === 0 ? 'SPEEDING' : undefined);
          const isViol = Boolean(rawViolType || d.is_violation || d.metadata?.is_violation);

          return {
            id: d.id || `V-UP-${idx + 101}`,
            type: typeMap[d.vehicle_type] || d.vehicle_type || 'Phương tiện',
            licensePlate: plateStr || undefined,
            isViolation: isViol,
            violationType: isViol ? (rawViolType || 'SPEEDING') : undefined,
            speed: d.metadata?.speed_kmh ? `${d.metadata.speed_kmh} km/h` : undefined,
            speedLimit: d.metadata?.speed_limit ? `${d.metadata.speed_limit} km/h` : undefined,
            confidence: d.confidence || 0.95,
            box: { x: xPct, y: yPct, w: wPct, h: hPct },
            timestamp: new Date().toLocaleTimeString() + ' ICT',
            snapshotUrl: selectedVideoUrl || undefined
          };
        });

        const newCam: CameraFeed = {
          id: newCamId,
          name: 'VIDEO-' + selectedFile.name.substring(0, 10).toUpperCase(),
          status: 'LIVE',
          resolution: '1080p',
          fps: 30,
          image: selectedVideoUrl || undefined,
          videoUrl: selectedVideoUrl || undefined,
          detectedVehicles: uploadedVehicles
        };

        setCameras(prev => [newCam, ...prev]);

        if (vCount > 0) {
          const newAlert = {
            id: String(Date.now()),
            type: 'Quá tốc độ',
            camera: newCam.name,
            time: new Date().toLocaleTimeString() + ' ICT',
            color: 'text-error',
            borderColor: 'border-error/30'
          };
          setAlerts(prev => [newAlert, ...prev]);
        }

        setIsModalOpen(false);
        setIsAnalyzing(false);
        setSelectedFile(null);
        setUploadProgress(0);

        openInspection(newCam, uploadedVehicles[0]);
      }, 1000);
    } catch (err: any) {
      console.error('Lỗi khi phân tích video:', err);
      setAnalysisLogs(prev => [...prev, `[ERROR] Phân tích video thất bại: ${err.message || err}`]);
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-8rem)] relative">
      
      {/* Floating Notification Toast */}
      {activeNotification && (
        <div className={cn(
          "fixed top-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl border backdrop-blur-md transition-all duration-300 animate-in slide-in-from-top-4 max-w-md",
          activeNotification.type === 'error' ? "bg-error/95 text-on-error border-error/50" :
          activeNotification.type === 'warning' ? "bg-amber-500/95 text-slate-950 border-amber-400" :
          "bg-surface-container-highest/95 text-on-surface border-outline-variant/40"
        )}>
          {activeNotification.type === 'error' ? <ShieldAlert className="w-5 h-5 shrink-0 animate-bounce" /> :
           activeNotification.type === 'warning' ? <AlertTriangle className="w-5 h-5 shrink-0" /> :
           <Bell className="w-5 h-5 shrink-0 text-primary" />}
          <div className="text-xs font-semibold leading-relaxed flex-1">
            {activeNotification.message}
          </div>
          <button 
            onClick={() => setActiveNotification(null)}
            className="p-1 hover:opacity-75 transition-opacity"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Live Feeds Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-surface-container-lowest border border-outline-variant/30 rounded-xl overflow-hidden shadow-sm">
        
        {/* Header */}
        <div className="h-16 border-b border-outline-variant/30 px-6 flex items-center justify-between shrink-0 bg-surface">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-bold text-on-surface">Live Feeds</h2>
            <span className="px-2 py-1 bg-surface-container-high text-on-surface-variant text-xs font-mono rounded border border-outline-variant/30 font-medium tracking-wider">
              {isOnline ? 'ONLINE (BACKEND)' : 'OFFLINE MODE'}
            </span>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <button 
                onClick={() => {
                  setCameraForm({ id: '', name: '', rtspUrl: '', status: 'LIVE', resolution: '1080p', fps: 30, image: '' });
                  setIsAddEditOpen(true);
                }}
                className="bg-primary text-on-primary px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-primary-fixed-dim transition-all flex items-center gap-1 shadow-sm cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Thêm Camera
              </button>
              
              <button 
                onClick={() => setIsModalOpen(true)}
                className="bg-surface-container border border-outline-variant/30 text-on-surface px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-surface-container-high transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5" />
                Tải lên Video
              </button>
            </div>
            
            <div className="flex items-center gap-2 bg-surface-container p-1 rounded-lg border border-outline-variant/30">
               <button className="p-1.5 rounded bg-surface-container-high shadow-sm text-on-surface"><LayoutGrid className="w-4 h-4" /></button>
               <button className="p-1.5 rounded text-on-surface-variant hover:text-on-surface transition-colors"><Maximize className="w-4 h-4" /></button>
            </div>
            
            <div className="hidden sm:flex items-center gap-4 text-sm font-medium">
              <div className="flex items-center gap-2 text-secondary">
                <span className="w-2 h-2 rounded-full bg-secondary shadow-[0_0_8px_rgba(76,215,246,0.6)]"></span>
                <span>{cameras.filter(c => c.status === 'LIVE').length} Live</span>
              </div>
              <div className="flex items-center gap-2 text-error">
                <span className="w-2 h-2 rounded-full bg-error"></span>
                <span>{cameras.filter(c => c.status === 'OFFLINE').length} Offline</span>
              </div>
            </div>
          </div>
        </div>

        {/* Camera Grid */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-[#030c17]">
          {isLoading ? (
            <div className="flex items-center justify-center h-full text-on-surface-variant font-mono">
              Đang tải danh sách camera giám sát...
            </div>
          ) : cameras.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-on-surface-variant text-center space-y-4">
              <VideoOff className="w-12 h-12 text-outline-variant" />
              <div>Chưa có camera nào được cấu hình. Hãy bấm nút "Thêm Camera" ở góc trên để tạo mới.</div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 h-full auto-rows-[minmax(300px,1fr)]">
              {cameras.map(cam => (
                <CameraCard 
                  key={cam.id} 
                  feed={cam} 
                  onEdit={handleEditClick}
                  onDelete={handleDeleteClick}
                  onOpenInspection={(targetCam, targetVehicle) => openInspection(targetCam, targetVehicle)}
                />
              ))}
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="h-12 border-t border-outline-variant/30 px-6 flex items-center justify-between shrink-0 bg-surface">
            <div className="flex items-center gap-2 text-xs font-medium text-secondary">
                <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
                Mô hình AI YOLOv8 Đang Giám sát Luồng Trực tiếp
            </div>
            <div className="flex items-center gap-3">
                <button className="text-on-surface-variant hover:text-on-surface transition-colors"><Settings2 className="w-4 h-4" /></button>
                <button className="text-on-surface-variant hover:text-on-surface transition-colors"><Download className="w-4 h-4" /></button>
            </div>
        </div>
      </div>

      {/* Sidebar - Real-time Alerts */}
      <div className="w-full lg:w-80 flex flex-col bg-surface-container-lowest border border-outline-variant/30 rounded-xl overflow-hidden shadow-sm shrink-0">
        <div className="p-5 border-b border-outline-variant/30 bg-surface shrink-0">
          <h2 className="text-lg font-bold text-on-surface">Real-time Alerts</h2>
          <p className="text-sm text-on-surface-variant mt-1">Luồng phát hiện vi phạm AI</p>
          
          <div className="flex gap-2 mt-4 overflow-x-auto pb-1 no-scrollbar">
              <button className="shrink-0 px-3 py-1.5 bg-error text-on-error rounded-full text-xs font-medium flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5" /> Speeding
              </button>
              <button className="shrink-0 px-3 py-1.5 bg-surface-container border border-outline-variant/30 text-on-surface-variant rounded-full text-xs font-medium hover:text-on-surface transition-colors">
                  Red Light
              </button>
              <button className="shrink-0 px-3 py-1.5 bg-surface-container border border-outline-variant/30 text-on-surface-variant rounded-full text-xs font-medium hover:text-on-surface transition-colors">
                  Wrong Way
              </button>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {alerts.map(alert => (
                <AlertItem 
                    key={alert.id}
                    type={alert.type}
                    value={alert.value}
                    camera={alert.camera}
                    time={alert.time}
                    color={alert.color}
                    borderColor={alert.borderColor}
                    onClick={() => {
                      const matchedCam = cameras.find(c => c.name === alert.camera || c.id === alert.camera);
                      if (matchedCam) {
                        openInspection(matchedCam);
                      }
                    }}
                />
            ))}
        </div>
        
        <div className="p-3 border-t border-outline-variant/30 bg-surface shrink-0">
            <button 
                onClick={() => setAlerts([])}
                className="w-full py-2 bg-surface-container hover:bg-surface-container-high rounded-lg text-sm font-medium text-on-surface transition-colors cursor-pointer"
            >
                Clear All Alerts
            </button>
        </div>
      </div>

      {/* Upload & Analysis Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-surface-container border border-outline-variant/30 rounded-xl shadow-2xl overflow-hidden flex flex-col">
            
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-outline-variant/30 flex justify-between items-center bg-surface">
              <h3 className="text-base font-bold text-on-surface flex items-center gap-2">
                <Upload className="w-5 h-5 text-primary" />
                Tải lên Video Phân tích Vi phạm AI
              </h3>
              <button 
                disabled={isAnalyzing}
                onClick={() => {
                  setIsModalOpen(false);
                  setSelectedFile(null);
                  setSelectedVideoUrl(null);
                  setUploadProgress(0);
                  setAnalysisLogs([]);
                  if (analysisIntervalRef.current) {
                    clearInterval(analysisIntervalRef.current);
                    analysisIntervalRef.current = null;
                  }
                  setIsAnalyzing(false);
                }}
                className="p-1 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors disabled:opacity-50 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6 flex-1 overflow-y-auto">
              {!selectedFile ? (
                <label className="border-2 border-dashed border-outline-variant/50 hover:border-primary/50 rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-colors group bg-surface-container-lowest">
                  <input 
                    type="file" 
                    accept="video/*" 
                    className="hidden" 
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setSelectedFile(file);
                        setSelectedVideoUrl(URL.createObjectURL(file));
                      }
                    }} 
                  />
                  <FileVideo className="w-12 h-12 text-on-surface-variant group-hover:text-primary transition-colors mb-4" strokeWidth={1} />
                  <span className="text-sm font-semibold text-on-surface">Kéo thả hoặc nhấn để chọn video</span>
                  <span className="text-xs text-on-surface-variant mt-2">Hỗ trợ các định dạng MP4, WebM, AVI (Tối đa 50MB)</span>
                </label>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-surface-container-low rounded-lg border border-outline-variant/30">
                    <div className="flex items-center gap-3 min-w-0">
                      <FileVideo className="w-8 h-8 text-primary shrink-0" />
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-on-surface truncate">{selectedFile.name}</div>
                        <div className="text-xs text-on-surface-variant">{(selectedFile.size / (1024 * 1024)).toFixed(2)} MB</div>
                      </div>
                    </div>
                    {!isAnalyzing && (
                      <button 
                        onClick={() => {
                          setSelectedFile(null);
                          setSelectedVideoUrl(null);
                        }}
                        className="text-xs font-semibold text-error hover:underline cursor-pointer"
                      >
                        Thay đổi
                      </button>
                    )}
                  </div>

                  {isAnalyzing && (
                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-on-surface-variant font-medium">Tiến trình phân tích AI</span>
                        <span className="font-mono text-primary font-bold">{uploadProgress}%</span>
                      </div>
                      <div className="w-full bg-surface-container-high rounded-full h-2 overflow-hidden border border-outline-variant/30 shadow-inner">
                        <div 
                          className="bg-primary h-2 rounded-full transition-all duration-150 shadow-[0_0_8px_rgba(180,197,255,0.8)]"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {(isAnalyzing || analysisLogs.length > 0) && (
                    <div className="space-y-2">
                      <div className="text-xs font-medium text-on-surface-variant">Console Logs Phân tích</div>
                      <div className="bg-surface-container-lowest p-3 rounded-lg border border-outline-variant/30 font-mono text-[11px] text-secondary space-y-1.5 h-40 overflow-y-auto shadow-inner">
                        {analysisLogs.map((log, index) => (
                          <div key={index} className="flex gap-2">
                            <span className="text-outline-variant select-none">&gt;</span>
                            <span className={log.includes('[SUCCESS]') ? 'text-secondary font-bold' : log.includes('[WARNING]') ? 'text-error font-bold' : 'text-on-surface'}>{log}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-outline-variant/30 flex justify-end gap-3 bg-surface">
              <button 
                disabled={isAnalyzing}
                onClick={() => {
                  setIsModalOpen(false);
                  setSelectedFile(null);
                  setSelectedVideoUrl(null);
                  setUploadProgress(0);
                  setAnalysisLogs([]);
                  if (analysisIntervalRef.current) {
                    clearInterval(analysisIntervalRef.current);
                    analysisIntervalRef.current = null;
                  }
                  setIsAnalyzing(false);
                }}
                className="px-4 py-2 text-sm font-medium text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors rounded-lg disabled:opacity-50 cursor-pointer"
              >
                Hủy bỏ
              </button>
              {selectedFile && !isAnalyzing && (
                <button 
                  onClick={startAnalysis}
                  className="bg-primary text-on-primary px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-fixed-dim transition-colors flex items-center gap-1.5 shadow-md cursor-pointer"
                >
                  <Play className="w-4 h-4" />
                  Bắt đầu Phân tích AI
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Camera Modal */}
      {isAddEditOpen && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={handleAddEditSubmit} className="w-full max-w-lg bg-surface-container border border-outline-variant/30 rounded-xl shadow-2xl overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-outline-variant/30 flex justify-between items-center bg-surface">
              <h3 className="text-base font-bold text-on-surface flex items-center gap-2">
                {cameraForm.id ? <Edit2 className="w-5 h-5 text-primary" /> : <Plus className="w-5 h-5 text-primary" />}
                {cameraForm.id ? 'Chỉnh sửa cấu hình Camera' : 'Đăng ký Camera giám sát mới'}
              </h3>
              <button 
                type="button"
                onClick={() => setIsAddEditOpen(false)}
                className="p-1 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 flex-1 overflow-y-auto">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-on-surface">Tên camera *</label>
                <input 
                  type="text" 
                  value={cameraForm.name}
                  onChange={(e) => setCameraForm({ ...cameraForm, name: e.target.value })}
                  placeholder="Ví dụ: CAM-N-016" 
                  className="w-full bg-surface border border-outline-variant/50 rounded-lg px-3 py-2 text-sm text-on-surface focus:outline-none focus:border-primary transition-colors" 
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-on-surface">Cổng luồng RTSP / Video Stream URL *</label>
                <input 
                  type="text" 
                  value={cameraForm.rtspUrl}
                  onChange={(e) => setCameraForm({ ...cameraForm, rtspUrl: e.target.value })}
                  placeholder="Ví dụ: rtsp://192.168.1.105:554/stream1" 
                  className="w-full bg-surface border border-outline-variant/50 rounded-lg px-3 py-2 text-sm text-on-surface focus:outline-none focus:border-primary transition-colors" 
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-on-surface">Độ phân giải</label>
                  <select 
                    value={cameraForm.resolution}
                    onChange={(e) => setCameraForm({ ...cameraForm, resolution: e.target.value })}
                    className="w-full bg-surface border border-outline-variant/50 rounded-lg px-3 py-2 text-sm text-on-surface focus:outline-none focus:border-primary transition-colors"
                  >
                    <option value="720p">720p</option>
                    <option value="1080p">1080p</option>
                    <option value="2K">2K</option>
                    <option value="4K">4K</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-on-surface">Số khung hình (FPS)</label>
                  <input 
                    type="number" 
                    value={cameraForm.fps}
                    onChange={(e) => setCameraForm({ ...cameraForm, fps: parseInt(e.target.value) || 30 })}
                    className="w-full bg-surface border border-outline-variant/50 rounded-lg px-3 py-2 text-sm text-on-surface focus:outline-none focus:border-primary transition-colors" 
                    min={1} max={120}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-on-surface">Trạng thái luồng</label>
                  <select 
                    value={cameraForm.status}
                    onChange={(e) => setCameraForm({ ...cameraForm, status: e.target.value as any })}
                    className="w-full bg-surface border border-outline-variant/50 rounded-lg px-3 py-2 text-sm text-on-surface focus:outline-none focus:border-primary transition-colors"
                  >
                    <option value="LIVE">LIVE (Đang hoạt động)</option>
                    <option value="CALIBRATING">CALIBRATING (Đang hiệu chuẩn)</option>
                    <option value="OFFLINE">OFFLINE (Mất kết nối)</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-on-surface">URL ảnh nền đại diện (Tùy chọn)</label>
                  <input 
                    type="text" 
                    value={cameraForm.image}
                    onChange={(e) => setCameraForm({ ...cameraForm, image: e.target.value })}
                    placeholder="Nhập URL ảnh chụp camera..." 
                    className="w-full bg-surface border border-outline-variant/50 rounded-lg px-3 py-2 text-sm text-on-surface focus:outline-none focus:border-primary transition-colors" 
                  />
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-outline-variant/30 flex justify-end gap-3 bg-surface">
              <button 
                type="button"
                onClick={() => setIsAddEditOpen(false)}
                className="px-4 py-2 text-sm font-medium text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors rounded-lg cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button 
                type="submit"
                className="bg-primary text-on-primary px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-fixed-dim transition-colors flex items-center gap-1 shadow-md cursor-pointer"
              >
                {cameraForm.id ? 'Cập nhật cấu hình' : 'Đăng ký ngay'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Direct Interactive Camera Inspection & Violation Result Modal */}
      {selectedInspectionCam && (
        <CameraInspectionModal 
          camera={selectedInspectionCam}
          initialVehicleTarget={selectedVehicleTarget}
          onClose={() => {
            setSelectedInspectionCam(null);
            setSelectedVehicleTarget(null);
          }}
          onNotify={showNotification}
        />
      )}
    </div>
  );
}

interface CameraCardProps {
  feed: CameraFeed;
  onEdit: (feed: CameraFeed) => void;
  onDelete: (id: string) => void;
  onOpenInspection: (feed: CameraFeed, vehicle?: DetectedVehicle) => void;
}

function CameraCard({ feed, onEdit, onDelete, onOpenInspection }: CameraCardProps) {
    if (feed.status === 'OFFLINE') {
        return (
            <div className="relative border border-outline-variant/20 rounded-lg overflow-hidden bg-surface-container-lowest flex flex-col items-center justify-center p-6 h-full min-h-[300px] group shadow-sm">
                <div className="absolute top-3 left-3 bg-surface-container-highest/80 backdrop-blur-sm px-2 py-0.5 rounded text-xs font-mono text-on-surface">
                    {feed.name}
                </div>
                <VideoOff className="w-10 h-10 text-outline-variant mb-4" strokeWidth={1} />
                <div className="text-outline text-sm font-medium tracking-widest">SIGNAL LOST</div>
                <div className="text-outline-variant text-xs mt-2 animate-pulse">Reconnecting...</div>

                <div className="absolute right-3 bottom-3 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2 z-10">
                    <button 
                        onClick={(e) => { e.stopPropagation(); onEdit(feed); }}
                        className="p-1.5 bg-surface/80 hover:bg-primary/20 hover:text-primary backdrop-blur rounded text-on-surface transition-colors border border-outline-variant/30 cursor-pointer"
                        title="Chỉnh sửa"
                    >
                        <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button 
                        onClick={(e) => { e.stopPropagation(); onDelete(feed.id); }}
                        className="p-1.5 bg-surface/80 hover:bg-error/20 hover:text-error backdrop-blur rounded text-on-surface transition-colors border border-outline-variant/30 cursor-pointer"
                        title="Xóa"
                    >
                        <Trash2 className="w-3.5 h-3.5" />
                    </button>
                </div>
            </div>
        )
    }

    if (feed.status === 'CALIBRATING') {
         return (
            <div className="relative border border-outline-variant/20 rounded-lg overflow-hidden bg-surface-container flex flex-col items-center justify-center p-6 h-full min-h-[300px] group shadow-sm">
                <div className="absolute top-3 left-3 bg-surface-container-highest/80 backdrop-blur-sm px-2 py-0.5 rounded text-xs font-mono text-on-surface">
                    {feed.name}
                </div>
                <PlaySquare className="w-10 h-10 text-secondary mb-4 opacity-50" strokeWidth={1} />
                <div className="text-secondary text-sm font-medium tracking-widest animate-pulse">CALIBRATING</div>

                <div className="absolute right-3 bottom-3 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2 z-10">
                    <button 
                        onClick={(e) => { e.stopPropagation(); onEdit(feed); }}
                        className="p-1.5 bg-surface/80 hover:bg-primary/20 hover:text-primary backdrop-blur rounded text-on-surface transition-colors border border-outline-variant/30 cursor-pointer"
                        title="Chỉnh sửa"
                    >
                        <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button 
                        onClick={(e) => { e.stopPropagation(); onDelete(feed.id); }}
                        className="p-1.5 bg-surface/80 hover:bg-error/20 hover:text-error backdrop-blur rounded text-on-surface transition-colors border border-outline-variant/30 cursor-pointer"
                        title="Xóa"
                    >
                        <Trash2 className="w-3.5 h-3.5" />
                    </button>
                </div>
            </div>
        )
    }

    // Default fallback vehicle detection boxes if none provided
    const vehicles: DetectedVehicle[] = feed.detectedVehicles && feed.detectedVehicles.length > 0 
      ? feed.detectedVehicles 
      : feed.currentAlert ? [
          {
            id: 'V-DEFAULT-1',
            type: 'Phương tiện vi phạm',
            isViolation: true,
            violationType: feed.currentAlert.type as any || 'SPEEDING',
            speed: feed.currentAlert.speed || '82 km/h',
            speedLimit: '60 km/h',
            confidence: 0.96,
            box: feed.currentAlert.box,
            licensePlate: '30F-123.45',
            timestamp: '14:00:45 ICT'
          }
        ] : [];

    return (
        <div 
          onClick={() => onOpenInspection(feed)}
          className="relative border border-outline-variant/30 rounded-lg overflow-hidden group h-full min-h-[300px] shadow-sm cursor-pointer hover:border-primary/50 transition-all"
        >
            {feed.videoUrl ? (
                <video src={feed.videoUrl} autoPlay loop muted playsInline className="absolute inset-0 w-full h-full object-cover opacity-80" />
            ) : (
                <img src={feed.image} alt={feed.name} className="absolute inset-0 w-full h-full object-cover opacity-80" />
            )}
            
            {/* Overlay Gradient (Top) */}
            <div className="absolute top-0 inset-x-0 h-20 bg-gradient-to-b from-[#030c17]/90 to-transparent pointer-events-none"></div>
            
            {/* Header */}
            <div className="absolute top-3 inset-x-3 flex justify-between items-start pointer-events-none">
                 <div>
                    <div className="bg-surface-container-highest/90 backdrop-blur-sm px-2.5 py-1 rounded text-xs font-mono text-on-surface mb-1 flex items-center gap-1.5 shadow-sm border border-outline-variant/20 font-bold">
                        {feed.name}
                    </div>
                    {feed.resolution && (
                         <div className="text-[10px] font-mono text-on-surface-variant font-medium drop-shadow-md">
                            {feed.resolution} • {feed.fps}fps
                        </div>
                    )}
                 </div>
                 
                 <div className="flex items-center gap-1.5 bg-error/20 backdrop-blur text-error px-2 py-0.5 rounded border border-error/30">
                     <span className="w-1.5 h-1.5 rounded-full bg-error animate-pulse"></span>
                     <span className="text-[10px] font-bold">LIVE</span>
                  </div>
            </div>

            {/* Precise Target Vehicle Bounding Boxes */}
            {vehicles.map((v) => (
              <div 
                key={v.id}
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenInspection(feed, v);
                }}
                className={cn(
                  "absolute transition-all duration-300 rounded border-2 cursor-pointer flex flex-col justify-between group/box",
                  v.isViolation 
                    ? "border-red-500 bg-red-500/15 shadow-[0_0_15px_rgba(239,68,68,0.5)] animate-pulse hover:bg-red-500/25" 
                    : "border-emerald-400/80 bg-emerald-400/10 hover:border-emerald-300 hover:bg-emerald-400/20"
                )}
                style={{ 
                  left: `${v.box.x}%`, 
                  top: `${v.box.y}%`,
                  width: `${v.box.w}%`,
                  height: `${v.box.h}%`
                }}
              >
                {/* Top Label Tag */}
                <div className="absolute top-0 left-0 -translate-y-full px-1.5 py-0.5 text-[9px] font-mono font-bold tracking-tight rounded-t flex items-center gap-1 whitespace-nowrap shadow-md"
                  style={{
                    backgroundColor: v.isViolation ? 'rgba(239, 68, 68, 0.95)' : 'rgba(16, 185, 129, 0.95)',
                    color: '#ffffff'
                  }}
                >
                  <Crosshair className="w-2.5 h-2.5" />
                  <span>{v.isViolation ? `[VI PHẠM] ${v.licensePlate || v.type}` : `${v.type} ${v.speed || ''}`}</span>
                </div>

                {/* Bottom Detail Pill */}
                {v.isViolation && (
                  <div className="absolute bottom-0 inset-x-0 translate-y-full bg-red-950/90 text-red-200 px-1 py-0.5 text-[8px] font-mono text-center truncate border border-red-500/40">
                    {v.violationType} {v.speed && `(${v.speed})`}
                  </div>
                )}
              </div>
            ))}

            {/* Overlay Gradient (Bottom) */}
            <div className="absolute bottom-0 inset-x-0 h-20 bg-gradient-to-t from-[#030c17]/90 to-transparent pointer-events-none"></div>

            {/* Bottom Timestamp & Instructions */}
            <div className="absolute bottom-3 left-3 text-[10px] font-mono text-on-surface-variant flex items-center gap-2">
                <span>14:00:45:12 UTC</span>
                <span className="text-[9px] bg-primary/20 text-primary-fixed border border-primary/30 px-1.5 py-0.5 rounded font-sans">
                  Nhấn vào video để xem kết quả
                </span>
            </div>
            
            {/* Hover actions */}
            <div className="absolute right-3 bottom-3 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2 z-10">
                 <button 
                     onClick={(e) => { e.stopPropagation(); onEdit(feed); }}
                     className="p-1.5 bg-surface/80 hover:bg-primary/20 hover:text-primary backdrop-blur rounded text-on-surface transition-colors border border-outline-variant/30 cursor-pointer"
                     title="Chỉnh sửa"
                 >
                     <Edit2 className="w-3.5 h-3.5" />
                 </button>
                 <button 
                     onClick={(e) => { e.stopPropagation(); onDelete(feed.id); }}
                     className="p-1.5 bg-surface/80 hover:bg-error/20 hover:text-error backdrop-blur rounded text-on-surface transition-colors border border-outline-variant/30 cursor-pointer"
                     title="Xóa"
                 >
                     <Trash2 className="w-3.5 h-3.5" />
                 </button>
                 <button 
                     onClick={(e) => { e.stopPropagation(); onOpenInspection(feed); }}
                     className="p-1.5 bg-primary text-on-primary backdrop-blur rounded transition-colors shadow-sm cursor-pointer flex items-center gap-1 text-xs font-semibold px-2"
                     title="Phóng to & Kiểm tra kết quả"
                 >
                     <ZoomIn className="w-3.5 h-3.5" />
                     Phân tích
                 </button>
            </div>
        </div>
    )
}

function AlertItem({ type, value, camera, time, color = "text-error", borderColor = "border-error/30", onClick }: { type: string, value?: string, camera: string, time: string, color?: string, borderColor?: string, onClick?: () => void }) {
    return (
        <div 
            onClick={onClick}
            className={cn("p-3 rounded-lg border bg-surface-container relative overflow-hidden group cursor-pointer transition-colors hover:bg-surface-container-high", borderColor)}
        >
            <div className="flex justify-between items-start mb-1.5">
                <div className={cn("font-bold text-sm tracking-wide flex items-center gap-1.5", color)}>
                     <Activity className="w-3.5 h-3.5" />
                     {type} {value && <span className={cn("text-xs px-1.5 py-0.5 rounded-sm ml-1", color.replace('text-', 'bg-').concat('/20'), color)}>{value}</span>}
                </div>
                <button className="p-1 text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest rounded border border-outline-variant/30 bg-surface-container-lowest">
                    <ZoomIn className="w-3 h-3" />
                </button>
            </div>
            <div className="space-y-1">
                <div className="text-xs text-on-surface font-mono font-medium">{camera}</div>
                <div className="text-[10px] text-on-surface-variant font-mono">{time}</div>
            </div>
        </div>
    );
}

/**
 * CameraInspectionModal: Cửa sổ theo dõi video & Hiển thị kết quả vi phạm trực tiếp ngay tại luồng camera
 */
interface CameraInspectionModalProps {
  camera: CameraFeed;
  initialVehicleTarget?: DetectedVehicle | null;
  onClose: () => void;
  onNotify: (msg: string, type?: 'info' | 'warning' | 'error') => void;
}

function CameraInspectionModal({ camera, initialVehicleTarget, onClose, onNotify }: CameraInspectionModalProps) {
  const vehicles = camera.detectedVehicles || [];

  const [activeVehicle, setActiveVehicle] = useState<DetectedVehicle | null>(
    initialVehicleTarget || (vehicles.length > 0 ? vehicles[0] : null)
  );
  const [vehicleSearch, setVehicleSearch] = useState('');
  const [imgError, setImgError] = useState(false);
  const [snapshotError, setSnapshotError] = useState(false);
  const [drawerTab, setDrawerTab] = useState<'active' | 'history'>('active');

  // Tracking Simulation State: Bounding Box motion across video timeline
  const [isTrackingPaused, setIsTrackingPaused] = useState(false);
  const [trackingPositions, setTrackingPositions] = useState<Record<string, { x: number; y: number; isExited: boolean; exitTime?: string }>>({});
  const [exitedHistory, setExitedHistory] = useState<Array<DetectedVehicle & { exitTime: string }>>([]);

  // Initialize tracking positions on mount or vehicle list change
  useEffect(() => {
    const initialPos: Record<string, { x: number; y: number; isExited: boolean; exitTime?: string }> = {};
    vehicles.forEach((v) => {
      initialPos[v.id] = {
        x: v.box.x,
        y: v.box.y,
        isExited: false
      };
    });
    setTrackingPositions(initialPos);
    setExitedHistory([]);
  }, [vehicles]);

  // Motion Tracking Loop: Smoothly translate bounding boxes down the road
  useEffect(() => {
    if (isTrackingPaused) return;

    const interval = setInterval(() => {
      setTrackingPositions((prev) => {
        const next = { ...prev };
        let newlyExited: Array<DetectedVehicle & { exitTime: string }> = [];

        vehicles.forEach((v, idx) => {
          const cur = next[v.id];
          if (!cur || cur.isExited) return;

          // Move box along traffic trajectory
          const speedY = 1.0 + (idx % 3) * 0.3;
          const speedX = 0.4 + (idx % 2) * 0.2;

          const newY = cur.y + speedY;
          const newX = cur.x + speedX;

          // Check if vehicle has exited the video bounds (bottom/right)
          if (newY >= 82 || newX >= 88) {
            const timeStr = new Date().toLocaleTimeString() + ' ICT';
            next[v.id] = { ...cur, x: newX, y: newY, isExited: true, exitTime: timeStr };
            newlyExited.push({ ...v, exitTime: timeStr });
          } else {
            next[v.id] = { ...cur, x: newX, y: newY };
          }
        });

        if (newlyExited.length > 0) {
          setExitedHistory((prevHist) => {
            const existingIds = new Set(prevHist.map(h => h.id));
            const toAdd = newlyExited.filter(e => !existingIds.has(e.id));
            return [...toAdd, ...prevHist];
          });

          newlyExited.forEach(ex => {
            onNotify(
              `[AI TRACKING] Xe [${ex.licensePlate || ex.id}] đã di chuyển khỏi video -> Đã lưu vào Lịch sử giám sát!`,
              ex.isViolation ? 'error' : 'info'
            );
          });
        }

        return next;
      });
    }, 250);

    return () => clearInterval(interval);
  }, [vehicles, isTrackingPaused, onNotify]);

  const handleResetTracking = () => {
    const resetPos: Record<string, { x: number; y: number; isExited: boolean; exitTime?: string }> = {};
    vehicles.forEach((v) => {
      resetPos[v.id] = {
        x: v.box.x,
        y: v.box.y,
        isExited: false
      };
    });
    setTrackingPositions(resetPos);
    setIsTrackingPaused(false);
    onNotify('Đã phát lại và tái khởi tạo luồng bám theo phương tiện trên video', 'info');
  };

  const filteredVehicles = vehicles.filter(v => {
    if (!vehicleSearch.trim()) return true;
    const q = vehicleSearch.toLowerCase();
    return (
      (v.licensePlate && v.licensePlate.toLowerCase().includes(q)) ||
      v.type.toLowerCase().includes(q) ||
      v.id.toLowerCase().includes(q) ||
      (v.violationType && v.violationType.toLowerCase().includes(q))
    );
  });

  const handleActionRecord = () => {
    onNotify(`Đã lập biên bản vi phạm cho xe ${activeVehicle.licensePlate || activeVehicle.id}! Bản ghi VP-${Math.floor(Math.random()*90000+10000)} đã được ghi vào cơ sở dữ liệu.`, 'error');
  };

  const handleActionSendNotice = () => {
    onNotify(`Đã tạo lệnh gửi thông báo phạt nguội tới chủ sở hữu phương tiện ${activeVehicle.licensePlate || activeVehicle.id}.`, 'warning');
  };

  return (
    <div className="fixed inset-0 bg-background/90 backdrop-blur-md z-50 flex items-center justify-center p-4 md:p-6 animate-in fade-in duration-200">
      <div className="w-full max-w-6xl bg-surface-container-lowest border border-outline-variant/40 rounded-2xl shadow-2xl overflow-hidden flex flex-col h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-outline-variant/30 bg-surface flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 border border-primary/30 rounded-lg text-primary">
              <Crosshair className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-on-surface">{camera.name}</h2>
                <span className="px-2 py-0.5 text-[10px] font-mono bg-error/20 text-error border border-error/30 rounded font-bold">
                  LIVE VIDEO ANALYTICS
                </span>
              </div>
              <p className="text-xs text-on-surface-variant font-mono">
                {camera.resolution || '1080p'} • {camera.fps || 30} FPS • Theo dõi trực tiếp vi phạm YOLOv8
              </p>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="p-2 rounded-xl text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Modal Main Workspace: Left Video Feed + Right Violation Results Drawer */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          
          {/* Left Column: Interactive Video Player with Canvas Bounding Boxes */}
          <div className="flex-1 bg-[#020914] relative flex flex-col items-center justify-center p-4 min-h-[350px]">
            <div className="relative w-full h-full max-h-[70vh] flex items-center justify-center overflow-hidden rounded-xl border border-outline-variant/20 bg-black p-1">
              <div className="relative flex items-center justify-center max-h-[68vh] max-w-full overflow-hidden rounded-lg">
                {camera.videoUrl ? (
                  <video src={camera.videoUrl} autoPlay loop muted playsInline className="max-h-[68vh] max-w-full object-contain block rounded-lg" />
                ) : !imgError && camera.image ? (
                  <img 
                    src={camera.image} 
                    alt={camera.name} 
                    onError={() => setImgError(true)}
                    className="max-h-[68vh] max-w-full object-contain block rounded-lg opacity-90" 
                  />
                ) : (
                  <div className="w-[640px] h-[360px] max-w-full max-h-[68vh] bg-surface-container flex flex-col items-center justify-center rounded-lg text-on-surface-variant p-6 space-y-2 border border-outline-variant/30">
                    <VideoOff className="w-12 h-12 text-outline-variant" />
                    <span className="text-xs font-mono">{camera.name} — Khung hình giám sát AI</span>
                  </div>
                )}

                {/* Interactive SVG / Html Overlay of Vehicle Target Boxes */}
                <div className="absolute inset-0 pointer-events-auto overflow-hidden">
                {vehicles.map((v, idx) => {
                  const pos = trackingPositions[v.id];
                  // If vehicle has exited video bounds, do NOT draw active box on canvas
                  if (pos?.isExited) return null;

                  const currentX = pos?.x ?? v.box.x;
                  const currentY = pos?.y ?? v.box.y;
                  const isSelected = activeVehicle?.id === v.id;
                  const isNearRight = currentX > 55 || (currentX + v.box.w) > 70;

                  return (
                    <div
                      key={v.id}
                      onClick={() => {
                        setActiveVehicle(v);
                        setDrawerTab('active');
                        onNotify(`Đã chọn đối tượng theo dõi [${v.licensePlate || v.id}]`, v.isViolation ? 'error' : 'info');
                      }}
                      className={cn(
                        "absolute border-2 transition-all duration-300 ease-linear cursor-pointer rounded flex flex-col justify-between group",
                        v.isViolation 
                          ? isSelected
                            ? "border-red-500 bg-red-500/25 ring-4 ring-red-500/40 shadow-[0_0_25px_rgba(239,68,68,0.8)]"
                            : "border-red-400 bg-red-500/10 hover:bg-red-500/20 shadow-[0_0_12px_rgba(239,68,68,0.4)]"
                          : isSelected
                            ? "border-emerald-400 bg-emerald-400/30 ring-4 ring-emerald-400/40 shadow-[0_0_20px_rgba(52,211,153,0.6)]"
                            : "border-emerald-500/70 bg-emerald-500/10 hover:bg-emerald-500/20"
                      )}
                      style={{
                        left: `${currentX}%`,
                        top: `${currentY}%`,
                        width: `${v.box.w}%`,
                        height: `${v.box.h}%`
                      }}
                    >
                      {/* Bounding Box Header Badge */}
                      <div 
                        className={cn(
                          "absolute -top-7 px-2 py-0.5 text-[10px] font-mono font-bold rounded-t flex items-center gap-1 shadow-md whitespace-nowrap z-20 max-w-[200px] truncate",
                          isNearRight ? "right-0" : "left-0"
                        )}
                        style={{
                          backgroundColor: v.isViolation ? '#ef4444' : '#10b981',
                          color: '#ffffff'
                        }}
                      >
                        <Crosshair className="w-3 h-3 shrink-0" />
                        <span className="truncate">{v.isViolation ? `VI PHẠM: ${v.licensePlate || v.type}` : `${v.type} (${v.licensePlate || 'Chờ quét'})`}</span>
                      </div>

                      {/* Corner Target Crosshairs */}
                      <div className="w-2 h-2 border-t-2 border-l-2 border-white absolute top-0 left-0"></div>
                      <div className="w-2 h-2 border-t-2 border-r-2 border-white absolute top-0 right-0"></div>
                      <div className="w-2 h-2 border-b-2 border-l-2 border-white absolute bottom-0 left-0"></div>
                      <div className="w-2 h-2 border-b-2 border-r-2 border-white absolute bottom-0 right-0"></div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Video Bottom HUD Status & Tracking Playback Controls */}
            <div className="absolute bottom-3 inset-x-3 flex justify-between items-center pointer-events-auto text-xs font-mono text-white/90 bg-black/75 backdrop-blur-md px-3.5 py-2 rounded-xl border border-white/10 shadow-lg">
                <div className="flex items-center gap-2">
                  <span className={cn("w-2.5 h-2.5 rounded-full", isTrackingPaused ? "bg-amber-400" : "bg-emerald-400 animate-ping")}></span>
                  <span className="font-bold tracking-wide">
                    {isTrackingPaused ? 'PAUSED: TẠM DỪNG' : 'TRACKING MODE: BÁM THEO CHUYỂN ĐỘNG'}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsTrackingPaused(!isTrackingPaused)}
                    className="px-2.5 py-1 bg-white/10 hover:bg-white/20 rounded-md text-xs font-sans flex items-center gap-1 transition-colors border border-white/15 cursor-pointer"
                    title={isTrackingPaused ? "Tiếp tục bám theo" : "Tạm dừng bám theo"}
                  >
                    {isTrackingPaused ? <Play className="w-3.5 h-3.5 text-emerald-400" /> : <Pause className="w-3.5 h-3.5 text-amber-400" />}
                    <span>{isTrackingPaused ? 'Tiếp tục' : 'Tạm dừng'}</span>
                  </button>

                  <button
                    onClick={handleResetTracking}
                    className="px-2.5 py-1 bg-primary/20 hover:bg-primary/30 text-primary-fixed rounded-md text-xs font-sans flex items-center gap-1 transition-colors border border-primary/30 cursor-pointer"
                    title="Phát lại chuyển động các xe"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Phát lại</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Vehicle Option Dropdown Selector Toolbar */}
            <div className="w-full mt-3 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-surface-container-low p-2.5 rounded-xl border border-outline-variant/30">
              <div className="flex flex-1 items-center gap-2 min-w-0">
                <span className="text-xs font-semibold text-on-surface-variant shrink-0 flex items-center gap-1.5">
                  <Car className="w-4 h-4 text-primary" />
                  <span>Phương tiện nhận diện ({vehicles.length}):</span>
                </span>

                {/* Dropdown Select Option Menu */}
                <div className="relative flex-1 min-w-[180px]">
                  <select
                    value={activeVehicle?.id}
                    onChange={(e) => {
                      const found = vehicles.find(v => v.id === e.target.value);
                      if (found) {
                        setActiveVehicle(found);
                        setDrawerTab('active');
                        onNotify(`Đã chọn phương tiện [${found.licensePlate || found.id}]`, found.isViolation ? 'error' : 'info');
                      }
                    }}
                    className="w-full bg-surface border border-outline-variant/50 rounded-lg px-3 py-1.5 pr-8 text-xs font-mono font-bold text-on-surface focus:outline-none focus:border-primary appearance-none cursor-pointer shadow-sm truncate"
                  >
                    {filteredVehicles.map((v, idx) => {
                      const label = v.licensePlate || (v.id.length > 12 ? `${v.type} #${idx + 1}` : v.id);
                      const isExited = trackingPositions[v.id]?.isExited;
                      const statusStr = isExited 
                        ? '🏁 [ĐÃ RỜI KHUNG HÌNH]' 
                        : v.isViolation ? `⚠️ [VI PHẠM ${v.violationType || ''}]` : '✓ Bình thường';
                      return (
                        <option key={v.id} value={v.id} className="bg-surface text-on-surface py-1">
                          {label} — {v.type} ({statusStr})
                        </option>
                      );
                    })}
                  </select>
                  <ChevronsUpDown className="w-4 h-4 absolute right-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none" />
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 justify-between sm:justify-end">
                {/* Search Input Filter for Multiple Vehicles */}
                {vehicles.length > 2 && (
                  <div className="relative w-36 sm:w-44">
                    <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none" />
                    <input
                      type="text"
                      placeholder="Tìm biển số / loại xe..."
                      value={vehicleSearch}
                      onChange={(e) => setVehicleSearch(e.target.value)}
                      className="w-full bg-surface border border-outline-variant/40 rounded-lg pl-8 pr-6 py-1 text-[11px] text-on-surface focus:outline-none focus:border-primary transition-colors font-mono"
                    />
                    {vehicleSearch && (
                      <button 
                        onClick={() => setVehicleSearch('')}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface text-xs"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                )}

                {/* Quick Prev / Next Stepper Controls */}
                <div className="flex items-center gap-1 bg-surface p-1 rounded-lg border border-outline-variant/30 shrink-0">
                  <button
                    onClick={() => {
                      const currentIdx = vehicles.findIndex(v => v.id === activeVehicle?.id);
                      const prevIdx = (currentIdx - 1 + vehicles.length) % vehicles.length;
                      setActiveVehicle(vehicles[prevIdx]);
                      setDrawerTab('active');
                    }}
                    className="p-1 hover:bg-surface-container-high rounded text-on-surface transition-colors cursor-pointer"
                    title="Phương tiện trước đó"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-[11px] font-mono font-semibold px-2 text-on-surface-variant">
                    {vehicles.findIndex(v => v.id === activeVehicle?.id) + 1} / {vehicles.length}
                  </span>
                  <button
                    onClick={() => {
                      const currentIdx = vehicles.findIndex(v => v.id === activeVehicle?.id);
                      const nextIdx = (currentIdx + 1) % vehicles.length;
                      setActiveVehicle(vehicles[nextIdx]);
                      setDrawerTab('active');
                    }}
                    className="p-1 hover:bg-surface-container-high rounded text-on-surface transition-colors cursor-pointer"
                    title="Phương tiện tiếp theo"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Violation Results Drawer & Exited Vehicles History Log */}
          <div className="w-full lg:w-[420px] bg-surface-container-low border-t lg:border-t-0 lg:border-l border-outline-variant/30 flex flex-col p-6 overflow-y-auto space-y-6 shrink-0">
            
            {/* Drawer Mode Tabs */}
            <div className="flex items-center gap-2 border-b border-outline-variant/30 pb-3">
              <button
                onClick={() => setDrawerTab('active')}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer border",
                  drawerTab === 'active' 
                    ? "bg-primary text-on-primary border-primary shadow-sm" 
                    : "bg-surface-container border-outline-variant/30 text-on-surface hover:bg-surface-container-high"
                )}
              >
                <ShieldAlert className="w-4 h-4" />
                <span>Kết quả Trực tiếp</span>
              </button>

              <button
                onClick={() => setDrawerTab('history')}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer border relative",
                  drawerTab === 'history' 
                    ? "bg-primary text-on-primary border-primary shadow-sm" 
                    : "bg-surface-container border-outline-variant/30 text-on-surface hover:bg-surface-container-high"
                )}
              >
                <History className="w-4 h-4" />
                <span>Lịch sử đã rời đi</span>
                {exitedHistory.length > 0 && (
                  <span className="px-1.5 py-0.2 bg-red-500 text-white rounded-full text-[10px] font-bold animate-pulse">
                    {exitedHistory.length}
                  </span>
                )}
              </button>
            </div>

            {drawerTab === 'history' ? (
              /* Exited Vehicles History Log View */
              <div className="space-y-4 animate-in fade-in duration-150">
                <div className="flex justify-between items-center">
                  <h4 className="text-sm font-bold text-on-surface flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-primary" />
                    Nhật ký xe đã rời khỏi video ({exitedHistory.length})
                  </h4>
                  <button
                    onClick={handleResetTracking}
                    className="text-[11px] text-primary hover:underline font-mono cursor-pointer"
                  >
                    Phát lại video
                  </button>
                </div>

                {exitedHistory.length === 0 ? (
                  <div className="p-8 text-center bg-surface-container rounded-xl border border-outline-variant/30 space-y-2">
                    <History className="w-10 h-10 mx-auto text-outline-variant" />
                    <div className="text-xs text-on-surface-variant font-medium">Chưa có phương tiện nào di chuyển khỏi video.</div>
                    <div className="text-[11px] text-outline-variant">Khi các ô box bám theo xe ra khỏi viền màn hình, AI sẽ tự động ghi vết vào danh sách này.</div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {exitedHistory.map((ex) => (
                      <div
                        key={ex.id}
                        onClick={() => {
                          setActiveVehicle(ex);
                          setDrawerTab('active');
                        }}
                        className="p-3.5 bg-surface rounded-xl border border-outline-variant/40 hover:border-primary/50 transition-all cursor-pointer space-y-2 shadow-sm"
                      >
                        <div className="flex justify-between items-center">
                          <span className="font-mono font-bold text-sm text-on-surface">
                            {ex.licensePlate || ex.id}
                          </span>
                          <span className={cn(
                            "px-2 py-0.5 text-[10px] font-bold rounded border",
                            ex.isViolation ? "bg-error/20 text-error border-error/30" : "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                          )}>
                            {ex.isViolation ? (ex.violationType || 'VI PHẠM') : 'BÌNH THƯỜNG'}
                          </span>
                        </div>

                        <div className="flex justify-between items-center text-xs text-on-surface-variant font-mono">
                          <span>Loại: {ex.type}</span>
                          <span>{ex.speed}</span>
                        </div>

                        <div className="flex justify-between items-center text-[11px] text-outline-variant font-mono border-t border-outline-variant/20 pt-2">
                          <span className="flex items-center gap-1 text-emerald-400">
                            <CheckCircle2 className="w-3 h-3" /> Đã lưu lịch sử
                          </span>
                          <span>{ex.exitTime}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : !activeVehicle ? (
              <div className="p-8 text-center bg-surface-container rounded-xl border border-outline-variant/30 space-y-2 my-auto">
                <Car className="w-10 h-10 mx-auto text-outline-variant" />
                <div className="text-sm font-semibold text-on-surface">Chưa phát hiện phương tiện</div>
                <div className="text-xs text-on-surface-variant">Không có đối tượng phương tiện nào được phát hiện trên luồng camera này.</div>
              </div>
            ) : (
              /* Active Target Inspection Results View */
              <div className="space-y-6 animate-in fade-in duration-150">
                {/* License Plate Display Banner */}
                <div className="bg-surface border-2 border-outline-variant rounded-xl p-4 flex flex-col items-center justify-center text-center shadow-inner relative overflow-hidden">
                  <div className="text-[10px] uppercase font-bold text-on-surface-variant tracking-widest mb-1">
                    Biển Kiểm Soát Phát Hiện
                  </div>
                  <div className="bg-amber-300 text-slate-950 px-6 py-2 rounded-lg border-2 border-slate-900 font-mono text-2xl font-black tracking-widest shadow-md">
                    {activeVehicle.licensePlate || 'CHỜ TRÍCH XUẤT'}
                  </div>
                  <div className="text-xs text-on-surface-variant font-mono mt-2 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Độ tin cậy OCR nhận diện: {(activeVehicle.confidence * 100).toFixed(1)}%</span>
                  </div>
                </div>

            {/* Violation Details Specs */}
            <div className="space-y-3 bg-surface-container rounded-xl p-4 border border-outline-variant/30">
              <div className="flex justify-between items-center text-sm border-b border-outline-variant/20 pb-2">
                <span className="text-on-surface-variant">Loại phương tiện:</span>
                <span className="font-bold text-on-surface">{activeVehicle.type}</span>
              </div>

              <div className="flex justify-between items-center text-sm border-b border-outline-variant/20 pb-2">
                <span className="text-on-surface-variant">Trạng thái vi phạm:</span>
                {activeVehicle.isViolation ? (
                  <span className="px-2 py-0.5 bg-error/20 text-error border border-error/30 rounded font-bold text-xs">
                    {activeVehicle.violationType || 'QUÁ TỐC ĐỘ'}
                  </span>
                ) : (
                  <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded font-bold text-xs">
                    BÌNH THƯỜNG
                  </span>
                )}
              </div>

              {activeVehicle.speed && (
                <div className="flex justify-between items-center text-sm border-b border-outline-variant/20 pb-2">
                  <span className="text-on-surface-variant">Tốc độ đo được:</span>
                  <span className={cn("font-mono font-bold text-base", activeVehicle.isViolation ? "text-error" : "text-emerald-400")}>
                    {activeVehicle.speed} {activeVehicle.speedLimit && <span className="text-xs text-on-surface-variant font-normal">(/ {activeVehicle.speedLimit})</span>}
                  </span>
                </div>
              )}

              <div className="flex justify-between items-center text-sm border-b border-outline-variant/20 pb-2">
                <span className="text-on-surface-variant">Thời điểm phát hiện:</span>
                <span className="font-mono text-xs text-on-surface">{activeVehicle.timestamp || '14:00:48 ICT'}</span>
              </div>

              <div className="flex justify-between items-center text-sm">
                <span className="text-on-surface-variant">Vị trí camera:</span>
                <span className="font-medium text-xs text-on-surface">{camera.name} (Tuyến QL1A)</span>
              </div>
            </div>

            {/* Snapshot Preview Crop */}
            <div className="space-y-2">
              <div className="text-xs font-semibold text-on-surface flex items-center justify-between">
                <span>Ảnh trích xuất vi phạm:</span>
                <span className="text-[10px] text-primary font-mono cursor-pointer hover:underline">Phóng to ảnh gốc</span>
              </div>
              <div className="relative aspect-video rounded-xl overflow-hidden border border-outline-variant/40 bg-black flex items-center justify-center">
                {!snapshotError && (activeVehicle.snapshotUrl || camera.image) ? (
                  <img 
                    src={activeVehicle.snapshotUrl || camera.image} 
                    alt="Snapshot" 
                    onError={() => setSnapshotError(true)}
                    className="w-full h-full object-cover" 
                  />
                ) : (
                  <div className="w-full h-full bg-surface-container flex flex-col items-center justify-center text-xs font-mono text-on-surface-variant p-4 text-center">
                    <Car className="w-8 h-8 text-outline-variant mb-1" />
                    <span>SNAPSHOT CROP #{activeVehicle.licensePlate || activeVehicle.id}</span>
                  </div>
                )}
                <div className="absolute inset-0 border-2 border-red-500/80 m-4 pointer-events-none flex items-start p-1">
                  <span className="bg-red-600 text-white text-[9px] font-mono px-1 font-bold">SNAPSHOT CROP</span>
                </div>
              </div>
            </div>

            {/* Actions Toolbar */}
            <div className="pt-2 space-y-2.5">
              <button 
                onClick={handleActionRecord}
                className="w-full bg-error hover:bg-error-container text-on-error py-2.5 rounded-xl font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <FileText className="w-4 h-4" />
                Lập biên bản vi phạm
              </button>

              <button 
                onClick={handleActionSendNotice}
                className="w-full bg-surface-container-high hover:bg-surface-container-highest text-on-surface border border-outline-variant/40 py-2 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Send className="w-4 h-4 text-primary" />
                Gửi thông báo phạt nguội
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  </div>
</div>
  );
}
