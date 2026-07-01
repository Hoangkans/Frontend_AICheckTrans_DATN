import { useState, useEffect, useRef } from 'react';
import { VideoOff, Maximize, LayoutGrid, Download, Settings2, Activity, PlaySquare, ZoomIn, Upload, X, FileVideo, Play } from 'lucide-react';
import { mockCameras } from '../data';
import { cn } from '../lib/utils';
import { CameraFeed } from '../types';

export function CamerasView() {
  const [cameras, setCameras] = useState<CameraFeed[]>(mockCameras);
  const [alerts, setAlerts] = useState<any[]>([
    { id: '1', type: 'Speeding', value: '85mph', camera: 'CAM-N-014', time: '14:00:48 UTC', color: 'text-error', borderColor: 'border-error/30' },
    { id: '2', type: 'Wrong Way', camera: 'CAM-S-105', time: '14:01:12 UTC', color: 'text-tertiary', borderColor: 'border-tertiary/30' },
    { id: '3', type: 'Speeding', value: '72mph', camera: 'CAM-E-022', time: '13:58:05 UTC', color: 'text-error', borderColor: 'border-error/30' }
  ]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedVideoUrl, setSelectedVideoUrl] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisLogs, setAnalysisLogs] = useState<string[]>([]);

  const analysisIntervalRef = useRef<NodeJS.Timeout | null>(null);

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

  const startAnalysis = () => {
    if (!selectedFile) return;
    setIsAnalyzing(true);
    setUploadProgress(0);
    setAnalysisLogs(['[INFO] Khởi tạo luồng xử lý video...']);

    let progress = 0;
    analysisIntervalRef.current = setInterval(() => {
      progress += 5;
      if (progress > 100) {
        progress = 100;
      }
      setUploadProgress(progress);

      if (progress === 15) {
        setAnalysisLogs(prev => [...prev, '[SYSTEM] Đang tải lên tệp tin: ' + selectedFile.name]);
      } else if (progress === 35) {
        setAnalysisLogs(prev => [...prev, '[AI] Khởi chạy mô hình nhận dạng vật thể YOLOv8...']);
      } else if (progress === 55) {
        setAnalysisLogs(prev => [...prev, '[AI] Đang dò tìm phương tiện và phân tích hành vi...']);
      } else if (progress === 75) {
        setAnalysisLogs(prev => [...prev, '[AI] Nhận diện biển kiểm soát bằng bộ OCR...']);
      } else if (progress === 90) {
        setAnalysisLogs(prev => [...prev, '[WARNING] Phát hiện hành vi vượt đèn đỏ tại luồng tải lên!']);
      } else if (progress === 100) {
        if (analysisIntervalRef.current) {
          clearInterval(analysisIntervalRef.current);
          analysisIntervalRef.current = null;
        }
        setAnalysisLogs(prev => [...prev, '[SUCCESS] Phân tích hoàn tất! Đã xuất dữ liệu vi phạm.']);
        
        setTimeout(() => {
          const newCamId = 'CAM-UPLOAD-' + Math.floor(Math.random() * 1000);
          const newCam: CameraFeed = {
            id: newCamId,
            name: 'ANALYSIS-' + selectedFile.name.substring(0, 8).toUpperCase(),
            status: 'LIVE',
            resolution: '1080p',
            fps: 30,
            image: 'https://images.unsplash.com/photo-1506012787146-f92b2d7d6d96?auto=format&fit=crop&q=80&w=800',
            videoUrl: selectedVideoUrl || undefined,
            currentAlert: {
              type: 'RED_LIGHT',
              box: { x: 35, y: 40, w: 30, h: 40 }
            }
          };

          setCameras(prev => [newCam, ...prev]);

          const newAlert = {
            id: String(Date.now()),
            type: 'Red Light',
            camera: newCam.name,
            time: new Date().toLocaleTimeString() + ' ICT',
            color: 'text-error',
            borderColor: 'border-error/30'
          };
          setAlerts(prev => [newAlert, ...prev]);

          setIsModalOpen(false);
          setIsAnalyzing(false);
          setSelectedFile(null);
          setUploadProgress(0);
        }, 1500);
      }
    }, 150);
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-8rem)]">
      {/* Main Live Feeds Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-surface-container-lowest border border-outline-variant/30 rounded-xl overflow-hidden shadow-sm">
        
        {/* Header */}
        <div className="h-16 border-b border-outline-variant/30 px-6 flex items-center justify-between shrink-0 bg-surface">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-bold text-on-surface">Live Feeds</h2>
            <span className="px-2 py-1 bg-surface-container-high text-on-surface-variant text-xs font-mono rounded border border-outline-variant/30 font-medium tracking-wider">
              ZONE ALPHA
            </span>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setIsModalOpen(true)}
                className="bg-primary text-on-primary px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-primary-fixed-dim transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
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
                <span>142 Online</span>
              </div>
              <div className="flex items-center gap-2 text-error">
                <span className="w-2 h-2 rounded-full bg-error"></span>
                <span>3 Offline</span>
              </div>
            </div>
          </div>
        </div>

        {/* Camera Grid */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-[#030c17]">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 h-full auto-rows-[minmax(300px,1fr)] max-h-[800px]">
            {cameras.map(cam => (
              <CameraCard key={cam.id} feed={cam} />
            ))}
          </div>
        </div>
        
        {/* Footer */}
        <div className="h-12 border-t border-outline-variant/30 px-6 flex items-center justify-between shrink-0 bg-surface">
            <div className="flex items-center gap-2 text-xs font-medium text-secondary">
                <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
                System Optimal
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
          <p className="text-sm text-on-surface-variant mt-1">Violation Stream</p>
          
          <div className="flex gap-2 mt-4 overflow-x-auto pb-1 no-scrollbar">
              <button className="shrink-0 px-3 py-1.5 bg-error text-on-error rounded-full text-xs font-medium flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5" /> Speeding
              </button>
              <button className="shrink-0 px-3 py-1.5 bg-surface-container border border-outline-variant/30 text-on-surface-variant rounded-full text-xs font-medium hover:text-on-surface transition-colors">
                  Red Light
              </button>
              <button className="shrink-0 px-3 py-1.5 bg-surface-container border border-outline-variant/30 text-on-surface-variant rounded-full text-xs font-medium hover:text-on-surface transition-colors">
                  No Helmet
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
                />
            ))}
        </div>
        
        <div className="p-3 border-t border-outline-variant/30 bg-surface shrink-0">
            <button 
                onClick={() => setAlerts([])}
                className="w-full py-2 bg-surface-container hover:bg-surface-container-high rounded-lg text-sm font-medium text-on-surface transition-colors cursor-pointer"
            >
                Clear All
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
                        className="text-xs font-semibold text-error hover:underline"
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
    </div>
  );
}

function CameraCard({ feed }: { feed: CameraFeed }) {
    if (feed.status === 'OFFLINE') {
        return (
            <div className="relative border border-outline-variant/20 rounded-lg overflow-hidden bg-surface-container-lowest flex flex-col items-center justify-center p-6 h-full min-h-[300px]">
                <div className="absolute top-3 left-3 bg-surface-container-highest/80 backdrop-blur-sm px-2 py-0.5 rounded text-xs font-mono text-on-surface">
                    {feed.name}
                </div>
                <VideoOff className="w-10 h-10 text-outline-variant mb-4" strokeWidth={1} />
                <div className="text-outline text-sm font-medium tracking-widest">SIGNAL LOST</div>
                <div className="text-outline-variant text-xs mt-2 animate-pulse">Reconnecting...</div>
            </div>
        )
    }

    if (feed.status === 'CALIBRATING') {
         return (
            <div className="relative border border-outline-variant/20 rounded-lg overflow-hidden bg-surface-container flex flex-col items-center justify-center p-6 h-full min-h-[300px]">
                <div className="absolute top-3 left-3 bg-surface-container-highest/80 backdrop-blur-sm px-2 py-0.5 rounded text-xs font-mono text-on-surface">
                    {feed.name}
                </div>
                <PlaySquare className="w-10 h-10 text-secondary mb-4 opacity-50" strokeWidth={1} />
                <div className="text-secondary text-sm font-medium tracking-widest animate-pulse">CALIBRATING</div>
            </div>
        )
    }

    return (
        <div className="relative border border-outline-variant/30 rounded-lg overflow-hidden group h-full min-h-[300px] shadow-sm">
            {feed.videoUrl ? (
                <video src={feed.videoUrl} autoPlay loop muted playsInline className="absolute inset-0 w-full h-full object-cover opacity-80" />
            ) : (
                <img src={feed.image} alt={feed.name} className="absolute inset-0 w-full h-full object-cover opacity-80" />
            )}
            
            {/* Overlay Gradient (Top) */}
            <div className="absolute top-0 inset-x-0 h-20 bg-gradient-to-b from-[#030c17]/90 to-transparent pointer-events-none"></div>
            
            {/* Header */}
            <div className="absolute top-3 inset-x-3 flex justify-between items-start">
                 <div>
                    <div className="bg-surface-container-highest/80 backdrop-blur-sm px-2 py-0.5 rounded text-xs font-mono text-on-surface mb-1 flex items-center gap-1.5 shadow-sm border border-outline-variant/20">
                        {feed.name}
                    </div>
                    {feed.resolution && (
                         <div className="text-[10px] font-mono text-on-surface-variant font-medium drop-shadow-md">
                            {feed.resolution} • {feed.fps}fps
                        </div>
                    )}
                 </div>
                 
                 <div className="flex items-center gap-1.5 bg-error/10 backdrop-blur text-error px-2 py-0.5 rounded border border-error/20">
                     <span className="w-1.5 h-1.5 rounded-full bg-error animate-pulse"></span>
                     <span className="text-[10px] font-bold object-none">LIVE</span>
                 </div>
            </div>

            {/* Bounding Box / Alert Simulation */}
            {feed.currentAlert && (
                <div 
                    className="absolute border border-error/50 bg-error/10 flex flex-col items-center justify-center pointer-events-none transition-all duration-1000"
                    style={{ 
                        left: `${feed.currentAlert.box.x}%`, 
                        top: `${feed.currentAlert.box.y}%`,
                        width: `${feed.currentAlert.box.w}%`,
                        height: `${feed.currentAlert.box.h}%`
                    }}
                >
                    <div className="bg-error/90 text-on-error shrink-0 mt-auto translate-y-full px-1.5 py-0.5 text-[10px] font-bold tracking-widest backdrop-blur-sm border border-error/50 whitespace-nowrap">
                        {feed.currentAlert.type} {feed.currentAlert.speed && ` ${feed.currentAlert.speed}`}
                    </div>
                </div>
            )}

            {/* Overlay Gradient (Bottom) */}
            <div className="absolute bottom-0 inset-x-0 h-20 bg-gradient-to-t from-[#030c17]/90 to-transparent pointer-events-none"></div>

            {/* Bottom Timestamp */}
            <div className="absolute bottom-3 left-3 text-[10px] font-mono text-on-surface-variant">
                14:00:45:12 UTC
            </div>
            
            {/* Hover actions */}
            <div className="absolute right-3 bottom-3 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                 <button className="p-1.5 bg-surface/80 hover:bg-surface backdrop-blur rounded text-on-surface transition-colors border border-outline-variant/30">
                     <ZoomIn className="w-3.5 h-3.5" />
                 </button>
            </div>
        </div>
    )
}

function AlertItem({ type, value, camera, time, color = "text-error", borderColor = "border-error/30" }: { type: string, value?: string, camera: string, time: string, color?: string, borderColor?: string }) {
    return (
        <div className={cn("p-3 rounded-lg border bg-surface-container relative overflow-hidden group cursor-pointer transition-colors hover:bg-surface-container-high", borderColor)}>
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
