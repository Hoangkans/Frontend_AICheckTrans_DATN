import { Activity, AlertTriangle, CheckCircle, TrendingUp } from 'lucide-react';
import { KPI } from '../types';
import { cn } from '../lib/utils';

export function KpiCards() {
  const kpis: KPI[] = [
    { label: "Tổng số vi phạm hôm nay", value: "1,248", trend: "+12.5%", trendUp: true, icon: AlertTriangle, color: "text-error", bg: "bg-error/10" },
    { label: "Vi phạm đã xác nhận", value: "986", trend: "+8.2%", trendUp: true, icon: CheckCircle, color: "text-primary", bg: "bg-primary/10" },
    { label: "Tỉ lệ chính xác AI", value: "98.5%", trend: "+0.3%", trendUp: true, icon: Activity, color: "text-secondary", bg: "bg-secondary/10" },
    { label: "Ước tính doanh thu", value: "450M ₫", trend: "-2.4%", trendUp: false, icon: TrendingUp, color: "text-tertiary", bg: "bg-tertiary/10" },
  ] as any[];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {kpis.map((kpi, i) => {
        const Icon = kpi.icon as any;
        return (
          <div key={i} className="bg-surface-container-lowest hover:bg-surface-container-low p-5 rounded-xl border border-outline-variant/30 hover:border-outline flex items-center justify-between shadow-sm hover:shadow-md transition-all duration-200 cursor-default">
            <div>
              <p className="text-sm text-on-surface-variant font-medium mb-1">{kpi.label}</p>
              <h3 className="text-2xl font-bold text-on-surface mb-2">{kpi.value}</h3>
              <div className="flex items-center gap-1.5">
                <span className={cn(
                  "text-xs font-medium px-1.5 py-0.5 rounded",
                  kpi.trendUp ? "bg-secondary/10 text-secondary" : "bg-error/10 text-error"
                )}>
                  {kpi.trend}
                </span>
                <span className="text-xs text-on-surface-variant">so với hôm qua</span>
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
