import { DashboardCharts } from '../components/DashboardCharts';
import { Calendar } from 'lucide-react';

export function AnalyticsView() {
  return (
    <>
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-on-surface">Phân tích & Thống kê</h1>
          <p className="text-on-surface-variant mt-1 text-sm">Báo cáo chi tiết về xu hướng vi phạm và mật độ giao thông.</p>
        </div>
        <button className="flex items-center gap-2 border border-outline-variant/50 text-on-surface px-4 py-2 rounded-lg text-sm font-medium hover:bg-surface-container transition-colors">
            <Calendar className="w-4 h-4" />
            7 ngày qua
        </button>
      </div>
      
      <div className="space-y-6">
          <DashboardCharts />
          {/* We can add another chart or stat box here for padding */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/30 p-5 shadow-sm">
                  <h3 className="text-lg font-semibold text-on-surface mb-4">Điểm nóng vi phạm</h3>
                  <div className="space-y-4">
                      {['Ngã tư Kim Mã - Lùi xe', 'QL1A - Quá tốc độ', 'Lê Lợi - Đỗ xe sai quy định'].map((hotspot, i) => (
                          <div key={i} className="flex items-center justify-between">
                              <span className="text-sm text-on-surface">{hotspot}</span>
                              <div className="flex items-center gap-3 w-1/2">
                                  <div className="flex-1 bg-surface-container-high rounded-full h-2">
                                      <div className="bg-error h-2 rounded-full" style={{ width: `${100 - i * 20}%` }}></div>
                                  </div>
                                  <span className="text-xs font-mono text-on-surface-variant">{120 - i * 35}</span>
                              </div>
                          </div>
                      ))}
                  </div>
              </div>
              <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/30 p-5 shadow-sm">
                  <h3 className="text-lg font-semibold text-on-surface mb-4">Tỉ lệ giải quyết vi phạm</h3>
                  <div className="flex items-center justify-between h-32">
                      <div className="text-center">
                          <div className="text-3xl font-bold text-primary mb-1">85%</div>
                          <div className="text-xs text-on-surface-variant">Đã xử phạt</div>
                      </div>
                      <div className="text-center">
                          <div className="text-3xl font-bold text-secondary mb-1">10%</div>
                          <div className="text-xs text-on-surface-variant">Chờ xử lý</div>
                      </div>
                      <div className="text-center">
                          <div className="text-3xl font-bold text-error mb-1">5%</div>
                          <div className="text-xs text-on-surface-variant">Khiếu nại</div>
                      </div>
                  </div>
              </div>
          </div>
      </div>
    </>
  );
}
