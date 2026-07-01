import { mockViolations } from '../data';
import { cn } from '../lib/utils';
import { ChevronRight, Filter } from 'lucide-react';

export function ViolationList() {
  return (
    <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/30 shadow-sm overflow-hidden flex flex-col h-full">
      <div className="p-5 border-b border-outline-variant/30 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-on-surface">Vi phạm gần đây</h3>
        <button className="flex items-center gap-2 text-sm text-on-surface-variant hover:text-on-surface px-3 py-1.5 rounded-lg border border-outline-variant/50 hover:bg-surface-container transition-colors">
          <Filter className="w-4 h-4" />
          Bộ lọc
        </button>
      </div>
      
      <div className="overflow-x-auto flex-1">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-surface-container uppercase text-xs font-medium text-on-surface-variant">
            <tr>
              <th className="px-5 py-3">Mã vi phạm</th>
              <th className="px-5 py-3">Hình ảnh</th>
              <th className="px-5 py-3">Biển số</th>
              <th className="px-5 py-3">Loại vi phạm</th>
              <th className="px-5 py-3">Địa điểm & Thời gian</th>
              <th className="px-5 py-3">Độ tin cậy AI</th>
              <th className="px-5 py-3">Trạng thái</th>
              <th className="px-5 py-3 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/30">
            {mockViolations.map((violation) => (
              <tr key={violation.id} className="hover:bg-surface-container-low/40 transition-all duration-150 group cursor-pointer">
                <td className="px-5 py-4 font-mono text-primary group-hover:text-primary-fixed-dim transition-colors">{violation.id}</td>
                <td className="px-5 py-4">
                  <div className="w-16 h-10 rounded overflow-hidden bg-surface-container border border-outline-variant/30">
                    <img src={violation.image} alt="Violation" className="w-full h-full object-cover" />
                  </div>
                </td>
                <td className="px-5 py-4 font-mono font-medium text-on-surface uppercase">{violation.plate}</td>
                <td className="px-5 py-4 text-on-surface">{violation.type}</td>
                <td className="px-5 py-4">
                  <div className="text-on-surface">{violation.location}</div>
                  <div className="text-xs text-on-surface-variant mt-0.5">{violation.timestamp}</div>
                </td>
                <td className="px-5 py-4">
                  <div className="flex items-center gap-2">
                    <div className="w-full bg-surface-container-high rounded-full h-1.5 max-w-[60px]">
                      <div 
                        className="bg-secondary h-1.5 rounded-full" 
                        style={{ width: `${violation.confidence * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-xs font-medium text-on-surface-variant">
                      {(violation.confidence * 100).toFixed(0)}%
                    </span>
                  </div>
                </td>
                <td className="px-5 py-4">
                  <span className={cn(
                    "px-2.5 py-1 rounded-full text-xs font-medium inline-flex items-center gap-1.5",
                    violation.status === 'VERIFIED' ? "bg-secondary/10 text-secondary" :
                    violation.status === 'PENDING' ? "bg-tertiary/10 text-tertiary" :
                    "bg-error/10 text-error"
                  )}>
                    <span className={cn(
                      "w-1.5 h-1.5 rounded-full",
                      violation.status === 'VERIFIED' ? "bg-secondary" :
                      violation.status === 'PENDING' ? "bg-tertiary" :
                      "bg-error"
                    )}></span>
                    {violation.status === 'VERIFIED' ? 'ĐÃ XÁC NHẬN' : violation.status === 'PENDING' ? 'CHỜ DUYỆT' : 'TỪ CHỐI'}
                  </span>
                </td>
                <td className="px-5 py-4 text-right">
                  <button className="p-1.5 text-on-surface-variant hover:text-primary hover:bg-primary/10 rounded-lg transition-colors cursor-pointer">
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="p-4 border-t border-outline-variant/30 flex justify-center bg-surface-container-lowest cursor-pointer hover:bg-surface-container-low transition-all duration-200">
        <span className="text-sm font-medium text-primary">Xem tất cả vi phạm</span>
      </div>
    </div>
  );
}
