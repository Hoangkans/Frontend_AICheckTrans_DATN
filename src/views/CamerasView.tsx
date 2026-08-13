import { useState, useEffect, useRef } from 'react';
import { 
  VideoOff, Maximize, LayoutGrid, Download, Settings2, Activity, PlaySquare, 
  ZoomIn, Upload, X, FileVideo, Play, Plus, Trash2, Edit2, Bell, ShieldAlert, 
  CheckCircle2, Car, FileText, Send, Crosshair, Info, Layers, AlertTriangle
} from 'lucide-react';
import { cn } from '../lib/utils';
import { CameraFeed, DetectedVehicle } from '../types';
import { cameraApi, detectionApi } from '../lib/api';

export function CamerasView() {
  const [cameras, setCameras] = useState<CameraFeed[]>([]);
  const [alerts, setAlerts] = useState<any[]>([
    { id: '1', type: 'Speeding', value: '88 km/h', camera: 'CAM-N-014', time: '14:00:48 ICT', color: 'text-error', borderColor: 'border-error/30' },
    { id: '2', type: 'Wrong Way', value: '42 km/h', camera: 'CAM-S-105', time: '14:01:12 ICT', color: 'text-tertiary', borderColor: 'border-tertiary/30' },
    { id: '3', type: 'Speeding', value: '75 km/h', camera: 'CAM-E-022', time: '13:58:05 ICT', color: 'text-error', borderColor: 'border-error/30' }
  ]);
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

    if (isOnline && !targetCamId.startsWith('CAM-LOCAL-')) {
      try {
        setUploadProgress(20);
        setAnalysisLogs(prev => [...prev, `[SYSTEM] Đang tải file lên Backend API (/api/v1/detections/detect)...`]);

        setUploadProgress(45);
        setAnalysisLogs(prev => [...prev, `[AI] Đang chạy mô hình YOLO detect đối tượng và kiểm tra vi phạm...`]);

        const res = await detectionApi.detect(targetCamId, selectedFile);

        setUploadProgress(90);
        const count = res.data?.count ?? 0;
        const vCount = res.data?.violations_count ?? 0;
        setAnalysisLogs(prev => [
          ...prev,
          `[SUCCESS] Backend xử lý thành công! Tìm thấy ${count} đối tượng và ${vCount} vi phạm.`,
        ]);

        if (vCount > 0) {
          setAnalysisLogs(prev => [...prev, `[WARNING] Đã tự động tạo ${vCount} bản ghi vi phạm trong hệ thống!`]);
        }

        setUploadProgress(100);

        setTimeout(() => {
          const newCamId = 'CAM-UPLOAD-' + Math.floor(Math.random() * 1000);
          
          const uploadedVehicles: DetectedVehicle[] = [
            {
              id: 'V-UP-101',
              type: 'Ô tô',
              licensePlate: '30F-558.91',
              isViolation: vCount > 0,
              violationType: 'SPEEDING',
              speed: '84 km/h',
              speedLimit: '60 km/h',
              confidence: 0.975,
              box: { x: 32, y: 50, w: 22, h: 26 },
              timestamp: new Date().toLocaleTimeString() + ' ICT',
              snapshotUrl: selectedVideoUrl || undefined
            },
            {
              id: 'V-UP-102',
              type: 'Xe máy',
              licensePlate: '29K1-442.10',
              isViolation: false,
              speed: '48 km/h',
              confidence: 0.942,
              box: { x: 65, y: 58, w: 12, h: 18 },
              timestamp: new Date().toLocaleTimeString() + ' ICT'
            }
          ];

          const newCam: CameraFeed = {
            id: newCamId,
            name: 'ANALYSIS-' + selectedFile.name.substring(0, 8).toUpperCase(),
            status: 'LIVE',
            resolution: '1080p',
            fps: 30,
            image: 'https://images.unsplash.com/photo-1506012787146-f92b2d7d6d96?auto=format&fit=crop&q=80&w=800',
            videoUrl: selectedVideoUrl || undefined,
            detectedVehicles: uploadedVehicles
          };

          setCameras(prev => [newCam, ...prev]);

          if (vCount > 0) {
            const newAlert = {
              id: String(Date.now()),
              type: 'Quá tốc độ (84/60 km/h)',
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

          // Automatically open inspection for newly analyzed video
          openInspection(newCam, uploadedVehicles[0]);
        }, 1200);
      } catch (err: any) {
        console.error('Lỗi khi phân tích video:', err);
        setAnalysisLogs(prev => [...prev, `[ERROR] Phân tích video thất bại: ${err.message || err}`]);
        setIsAnalyzing(false);
      }
    } else {
      let progress = 0;
      analysisIntervalRef.current = setInterval(() => {
        progress += 10;
        if (progress > 100) progress = 100;
        setUploadProgress(progress);

        if (progress === 30) {
          setAnalysisLogs(prev => [...prev, '[SYSTEM] Đang mô phỏng phân tích tệp tin: ' + selectedFile.name]);
        } else if (progress === 60) {
          setAnalysisLogs(prev => [...prev, '[AI] Dò tìm phương tiện và phân tích hành vi...']);
        } else if (progress === 100) {
          if (analysisIntervalRef.current) {
            clearInterval(analysisIntervalRef.current);
            analysisIntervalRef.current = null;
          }
          setAnalysisLogs(prev => [...prev, '[SUCCESS] Phân tích hoàn tất (Mô phỏng)!']);
          setTimeout(() => {
            const newCamId = 'CAM-UPLOAD-' + Math.floor(Math.random() * 1000);
            const uploadedVehicles: DetectedVehicle[] = [
              {
                id: 'V-UP-101',
                type: 'Ô tô',
                licensePlate: '30F-558.91',
                isViolation: true,
                violationType: 'SPEEDING',
                speed: '84 km/h',
                speedLimit: '60 km/h',
                confidence: 0.975,
                box: { x: 34, y: 52, w: 20, h: 26 },
                timestamp: new Date().toLocaleTimeString() + ' ICT'
              }
            ];
            const newCam: CameraFeed = {
              id: newCamId,
              name: 'ANALYSIS-' + selectedFile.name.substring(0, 8).toUpperCase(),
              status: 'LIVE',
              resolution: '1080p',
              fps: 30,
              image: 'https://images.unsplash.com/photo-1506012787146-f92b2d7d6d96?auto=format&fit=crop&q=80&w=800',
              videoUrl: selectedVideoUrl || undefined,
              detectedVehicles: uploadedVehicles
            };
            setCameras(prev => [newCam, ...prev]);
            setIsModalOpen(false);
            setIsAnalyzing(false);
            setSelectedFile(null);
            setUploadProgress(0);

            openInspection(newCam, uploadedVehicles[0]);
          }, 1200);
        }
      }, 200);
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
  const vehicles = camera.detectedVehicles && camera.detectedVehicles.length > 0 
    ? camera.detectedVehicles 
    : [
        {
          id: 'V-MODAL-1',
          type: 'Ô tô',
          licensePlate: '30F-892.34',
          isViolation: true,
          violationType: 'SPEEDING' as const,
          speed: '88 km/h',
          speedLimit: '60 km/h',
          confidence: 0.982,
          box: { x: 38, y: 56, w: 22, h: 26 },
          timestamp: '14:00:48 ICT',
          snapshotUrl: camera.image
        }
      ];

  const [activeVehicle, setActiveVehicle] = useState<DetectedVehicle>(
    initialVehicleTarget || vehicles[0]
  );

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
            <div className="relative w-full h-full max-h-[70vh] flex items-center justify-center overflow-hidden rounded-xl border border-outline-variant/20 bg-black">
              {camera.videoUrl ? (
                <video src={camera.videoUrl} autoPlay loop muted playsInline className="w-full h-full object-contain" />
              ) : (
                <img src={camera.image} alt={camera.name} className="w-full h-full object-contain opacity-90" />
              )}

              {/* Interactive SVG / Html Overlay of Vehicle Target Boxes */}
              <div className="absolute inset-0 pointer-events-auto">
                {vehicles.map((v) => {
                  const isSelected = activeVehicle?.id === v.id;
                  return (
                    <div
                      key={v.id}
                      onClick={() => {
                        setActiveVehicle(v);
                        onNotify(`Đã chọn đối tượng theo dõi [${v.licensePlate || v.id}]`, v.isViolation ? 'error' : 'info');
                      }}
                      className={cn(
                        "absolute border-2 transition-all duration-200 cursor-pointer rounded flex flex-col justify-between group",
                        v.isViolation 
                          ? isSelected
                            ? "border-red-500 bg-red-500/25 ring-4 ring-red-500/40 shadow-[0_0_25px_rgba(239,68,68,0.8)]"
                            : "border-red-400 bg-red-500/10 hover:bg-red-500/20 shadow-[0_0_12px_rgba(239,68,68,0.4)]"
                          : isSelected
                            ? "border-emerald-400 bg-emerald-400/30 ring-4 ring-emerald-400/40 shadow-[0_0_20px_rgba(52,211,153,0.6)]"
                            : "border-emerald-500/70 bg-emerald-500/10 hover:bg-emerald-500/20"
                      )}
                      style={{
                        left: `${v.box.x}%`,
                        top: `${v.box.y}%`,
                        width: `${v.box.w}%`,
                        height: `${v.box.h}%`
                      }}
                    >
                      {/* Bounding Box Header Badge */}
                      <div 
                        className="absolute -top-7 left-0 px-2 py-0.5 text-[10px] font-mono font-bold rounded-t flex items-center gap-1 shadow-md whitespace-nowrap"
                        style={{
                          backgroundColor: v.isViolation ? '#ef4444' : '#10b981',
                          color: '#ffffff'
                        }}
                      >
                        <Crosshair className="w-3 h-3" />
                        <span>{v.isViolation ? `VI PHẠM: ${v.licensePlate || v.type}` : `${v.type} (${v.licensePlate || 'Chờ quét'})`}</span>
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

              {/* Video Bottom HUD Status */}
              <div className="absolute bottom-3 inset-x-3 flex justify-between items-center pointer-events-none text-xs font-mono text-white/80 bg-black/60 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-white/10">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                  <span>TRACKING MODE: ACTIVE</span>
                </div>
                <div>NHẤN TRỰC TIẾP VÀO XE ĐỂ XEM KẾT QUẢ</div>
              </div>
            </div>

            {/* Vehicle Chips Selector Toolbar */}
            <div className="w-full mt-3 flex items-center gap-2 overflow-x-auto pb-1">
              <span className="text-xs font-semibold text-on-surface-variant shrink-0 flex items-center gap-1">
                <Car className="w-3.5 h-3.5 text-primary" /> Phương tiện nhận diện:
              </span>
              {vehicles.map((v) => (
                <button
                  key={v.id}
                  onClick={() => {
                    setActiveVehicle(v);
                    onNotify(`Đã chọn phương tiện [${v.licensePlate || v.id}]`, v.isViolation ? 'error' : 'info');
                  }}
                  className={cn(
                    "px-3 py-1 rounded-lg text-xs font-mono font-semibold flex items-center gap-1.5 transition-all cursor-pointer border shrink-0",
                    activeVehicle?.id === v.id
                      ? v.isViolation
                        ? "bg-error text-on-error border-error shadow-md"
                        : "bg-emerald-500 text-white border-emerald-400 shadow-md"
                      : "bg-surface-container border-outline-variant/30 text-on-surface hover:bg-surface-container-high"
                  )}
                >
                  <span>{v.licensePlate || v.id}</span>
                  {v.isViolation && <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>}
                </button>
              ))}
            </div>
          </div>

          {/* Right Column: Direct Immediate Violation Results Window */}
          <div className="w-full lg:w-[420px] bg-surface-container-low border-t lg:border-t-0 lg:border-l border-outline-variant/30 flex flex-col p-6 overflow-y-auto space-y-6 shrink-0">
            
            {/* Result Header Badge */}
            <div className="flex items-center justify-between border-b border-outline-variant/30 pb-4">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-error" />
                <h3 className="font-bold text-base text-on-surface">Kết quả Vi phạm Trực tiếp</h3>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
                REAL-TIME AI
              </span>
            </div>

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
              <div className="relative aspect-video rounded-xl overflow-hidden border border-outline-variant/40 bg-black">
                <img 
                  src={activeVehicle.snapshotUrl || camera.image} 
                  alt="Snapshot" 
                  className="w-full h-full object-cover" 
                />
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
        </div>
      </div>
    </div>
  );
}
