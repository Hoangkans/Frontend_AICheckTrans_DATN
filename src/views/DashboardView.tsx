import { KpiCards } from '../components/KpiCards';
import { DashboardCharts } from '../components/DashboardCharts';
import { ViolationList } from '../components/ViolationList';

export function DashboardView() {
  return (
    <>
      <div className="flex justify-between items-end">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-on-surface">Tổng quan Hệ thống</h1>
            <div className="flex items-center gap-1.5 bg-secondary/15 text-secondary px-2 py-0.5 rounded-full border border-secondary/20 text-[10px] font-bold animate-pulse shadow-[0_0_8px_rgba(76,215,246,0.2)]">
              <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
              LIVE
            </div>
          </div>
          <p className="text-on-surface-variant mt-1 text-sm">Giám sát vi phạm giao thông và hiệu suất AI theo thời gian thực.</p>
        </div>
        <button className="bg-primary text-on-primary px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-fixed-dim hover:shadow-md transition-all cursor-pointer shadow-sm">
          Xuất Báo Cáo
        </button>
      </div>
      
      <KpiCards />
      <DashboardCharts />
      <ViolationList />
    </>
  );
}
