import { useEffect, useState } from 'react';
import { Activity, AlertTriangle, CheckCircle, Video } from 'lucide-react';
import { statsApi } from '../lib/api';
import { cn } from '../lib/utils';

export function KpiCards() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await statsApi.overview();
        setStats(res.data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const totalCams = stats?.totalCameras ?? 0;
  const onlineCams = stats?.onlineCameras ?? 0;
  const offlineCams = stats?.offlineCameras ?? 0;
  const totalVehicles = stats?.totalVehiclesDaily ?? 0;

  const kpis = [
    { 
      label: "Lưu lượng xe (24h)", 
      value: loading ? "..." : totalVehicles.toLocaleString(), 
      trend: "+12.5%", 
      trendUp: true, 
      icon: Activity, 
      color: "text-secondary", 
      bg: "bg-secondary/10" 
    },
    { 
      label: "Tổng số camera", 
      value: loading ? "..." : totalCams.toString(), 
      trend: "Hoạt động", 
      trendUp: true, 
      icon: Video, 
      color: "text-primary", 
      bg: "bg-primary/10" 
    },
    { 
      label: "Camera Online", 
      value: loading ? "..." : onlineCams.toString(), 
      trend: `${totalCams > 0 ? ((onlineCams/totalCams)*100).toFixed(0) : 0}%`, 
      trendUp: true, 
      icon: CheckCircle, 
      color: "text-secondary", 
      bg: "bg-secondary/10" 
    },
    { 
      label: "Camera Offline", 
      value: loading ? "..." : offlineCams.toString(), 
      trend: "Cần kiểm tra", 
      trendUp: false, 
      icon: AlertTriangle, 
      color: "text-error", 
      bg: "bg-error/10" 
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {kpis.map((kpi, i) => {
        const Icon = kpi.icon;
        return (
          <div key={i} className="bg-surface-container-lowest hover:bg-surface-container-low p-5 rounded-xl border border-outline-variant/30 hover:border-outline flex items-center justify-between shadow-sm hover:shadow-md transition-all duration-200 cursor-default">
            <div>
              <p className="text-sm text-on-surface-variant font-medium mb-1">{kpi.label}</p>
              <h3 className="text-2xl font-bold text-on-surface mb-2">{kpi.value}</h3>
              <div className="flex items-center gap-1.5">
                <span className={cn(
                  "text-xs font-semibold px-1.5 py-0.5 rounded",
                  kpi.trendUp ? "bg-secondary/15 text-secondary" : "bg-error/15 text-error"
                )}>
                  {kpi.trend}
                </span>
                <span className="text-[10px] text-on-surface-variant font-medium">hệ thống</span>
              </div>
            </div>
            <div className={cn("w-12 h-12 rounded-full flex items-center justify-center", kpi.bg)}>
              <Icon className={cn("w-6 h-6", kpi.color)} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
