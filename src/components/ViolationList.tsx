import { useState, useEffect } from 'react';
import { cn } from '../lib/utils';
import { ChevronRight, Filter, X, Check, ShieldAlert, AlertTriangle } from 'lucide-react';
import { violationApi } from '../lib/api';

export function ViolationList() {
  const [violations, setViolations] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'VERIFIED' | 'REJECTED'>('ALL');
  const [page, setPage] = useState(1);
  const [isOnline, setIsOnline] = useState(true);

  // Selected Violation for Reviewing Modal
  const [selectedViolation, setSelectedViolation] = useState<any | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchViolations = async () => {
    try {
      setLoading(true);
      const isConfirmed = statusFilter === 'VERIFIED' ? true : statusFilter === 'REJECTED' ? false : undefined;
      // We pass the filter params
      const res = await violationApi.list({
        page,
        pageSize: 10,
        isConfirmed: statusFilter === 'ALL' ? undefined : (statusFilter === 'VERIFIED')
      });
      
      // If we filtered 'REJECTED' in offline mode, list() handles it, but backend might not directly have an is_confirmed=False if it's pending/null.
      // So we do a client-side filter fallback as well
      let data = res.data;
      if (statusFilter === 'REJECTED') {
        data = data.filter((v: any) => v.status === 'REJECTED');
      } else if (statusFilter === 'PENDING') {
        data = data.filter((v: any) => v.status === 'PENDING');
      }
      
      setViolations(data);
      setTotal(res.total || data.length);
      setIsOnline(res.isOnline);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchViolations();
  }, [statusFilter, page]);

  const handleReviewSubmit = async (isConfirmed: boolean) => {
    if (!selectedViolation) return;
    try {
      setIsSubmitting(true);
      await violationApi.confirm(selectedViolation.id, isConfirmed, reviewNotes);
      setSelectedViolation(null);
      setReviewNotes('');
      await fetchViolations();
    } catch (err: any) {
      alert('Lỗi phê duyệt vi phạm: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/30 shadow-sm overflow-hidden flex flex-col h-full">
      <div className="p-5 border-b border-outline-variant/30 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-on-surface">Danh sách xe vi phạm</h3>
          <span className="text-xs text-on-surface-variant font-mono">
            [{isOnline ? 'ONLINE' : 'OFFLINE MODE'}]
          </span>
        </div>
        
        {/* Status Filters */}
        <div className="flex items-center gap-2 bg-surface p-1 rounded-lg border border-outline-variant/30">
          <FilterButton active={statusFilter === 'ALL'} label="Tất cả" onClick={() => { setStatusFilter('ALL'); setPage(1); }} />
          <FilterButton active={statusFilter === 'PENDING'} label="Chờ duyệt" onClick={() => { setStatusFilter('PENDING'); setPage(1); }} />
          <FilterButton active={statusFilter === 'VERIFIED'} label="Đã duyệt" onClick={() => { setStatusFilter('VERIFIED'); setPage(1); }} />
          <FilterButton active={statusFilter === 'REJECTED'} label="Từ chối" onClick={() => { setStatusFilter('REJECTED'); setPage(1); }} />
        </div>
      </div>
      
      <div className="overflow-x-auto flex-1">
        {loading ? (
          <div className="flex justify-center items-center h-48 text-on-surface-variant">
            Đang tải dữ liệu...
          </div>
        ) : violations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-on-surface-variant text-center space-y-2">
            <ShieldAlert className="w-10 h-10 text-outline-variant" />
            <div>Không tìm thấy vi phạm nào phù hợp với bộ lọc hiện tại.</div>
          </div>
        ) : (
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-surface-container uppercase text-xs font-semibold text-on-surface-variant">
              <tr>
                <th className="px-5 py-3">Mã vi phạm</th>
                <th className="px-5 py-3">Hình ảnh</th>
                <th className="px-5 py-3">Biển số xe</th>
                <th className="px-5 py-3">Lỗi vi phạm</th>
                <th className="px-5 py-3">Địa điểm & Thời gian</th>
                <th className="px-5 py-3">Độ tin cậy AI</th>
                <th className="px-5 py-3">Trạng thái</th>
                <th className="px-5 py-3 text-right">Xem & Xử lý</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/30">
              {violations.map((violation) => (
                <tr 
                  key={violation.id} 
                  onClick={() => setSelectedViolation(violation)}
                  className="hover:bg-surface-container-low/40 transition-all duration-150 group cursor-pointer"
                >
                  <td className="px-5 py-4 font-mono text-primary group-hover:text-primary-fixed-dim transition-colors text-xs">
                    {violation.id}
                  </td>
                  <td className="px-5 py-4">
                    <div className="w-16 h-10 rounded overflow-hidden bg-surface-container border border-outline-variant/30">
                      <img src={violation.image} alt="Evidence" className="w-full h-full object-cover" />
                    </div>
                  </td>
                  <td className="px-5 py-4 font-mono font-bold text-on-surface uppercase tracking-wider text-sm">
                    {violation.plate}
                  </td>
                  <td className="px-5 py-4 text-on-surface text-xs font-medium">{violation.type}</td>
                  <td className="px-5 py-4">
                    <div className="text-on-surface text-xs">{violation.location}</div>
                    <div className="text-[10px] text-on-surface-variant mt-0.5 font-mono">{violation.timestamp}</div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-full bg-surface-container-high rounded-full h-1.5 max-w-[60px]">
                        <div 
                          className="bg-secondary h-1.5 rounded-full shadow-[0_0_4px_rgba(76,215,246,0.6)]" 
                          style={{ width: `${violation.confidence * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-[11px] font-mono text-on-surface-variant font-bold">
                        {(violation.confidence * 100).toFixed(0)}%
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <span className={cn(
                      "px-2.5 py-1 rounded-full text-[10px] font-bold inline-flex items-center gap-1.5 tracking-wider font-mono",
                      violation.status === 'VERIFIED' ? "bg-secondary/10 text-secondary border border-secondary/20" :
                      violation.status === 'PENDING' ? "bg-tertiary/10 text-tertiary border border-tertiary/20" :
                      "bg-error/10 text-error border border-error/20"
                    )}>
                      <span className={cn(
                        "w-1.5 h-1.5 rounded-full",
                        violation.status === 'VERIFIED' ? "bg-secondary" :
                        violation.status === 'PENDING' ? "bg-tertiary" :
                        "bg-error"
                      )}></span>
                      {violation.status === 'VERIFIED' ? 'ĐÃ XÁC NHẬN' : violation.status === 'PENDING' ? 'CHỜ DUYỆT' : 'BỊ TỪ CHỐI'}
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
        )}
      </div>

      {/* Pagination */}
      {total > 10 && (
        <div className="p-4 border-t border-outline-variant/30 flex justify-between items-center bg-surface-container-lowest">
          <button 
            disabled={page === 1}
            onClick={() => setPage(p => Math.max(1, p - 1))}
            className="px-3 py-1 bg-surface border border-outline-variant/50 text-xs font-semibold rounded disabled:opacity-50 cursor-pointer"
          >
            Trang trước
          </button>
          <span className="text-xs text-on-surface-variant">Trang {page} / {Math.ceil(total / 10)}</span>
          <button 
            disabled={page >= Math.ceil(total / 10)}
            onClick={() => setPage(p => p + 1)}
            className="px-3 py-1 bg-surface border border-outline-variant/50 text-xs font-semibold rounded disabled:opacity-50 cursor-pointer"
          >
            Trang sau
          </button>
        </div>
      )}

      {/* Review Violations Modal */}
      {selectedViolation && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-3xl bg-surface-container border border-outline-variant/30 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-outline-variant/30 flex justify-between items-center bg-surface">
              <h3 className="text-base font-bold text-on-surface flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-tertiary" />
                Đối chiếu & Xử lý Hồ sơ Vi phạm [{selectedViolation.id}]
              </h3>
              <button 
                onClick={() => setSelectedViolation(null)}
                className="p-1 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6 flex-1 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
              
              {/* Left Side - Image Evidence */}
              <div className="space-y-3">
                <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Hình ảnh chứng cứ từ AI</label>
                <div className="aspect-[4/3] rounded-xl overflow-hidden border border-outline-variant/50 bg-[#030c17] relative shadow-inner">
                  <img src={selectedViolation.image} alt="Evidence Details" className="w-full h-full object-contain" />
                </div>
              </div>

              {/* Right Side - Violation details & form */}
              <div className="space-y-4">
                <div className="bg-surface p-4 rounded-xl border border-outline-variant/30 space-y-3">
                  <h4 className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Thông tin phương tiện</h4>
                  
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-on-surface-variant block">Biển kiểm soát:</span>
                      <span className="font-mono font-bold text-on-surface text-base uppercase tracking-wider">
                        {selectedViolation.plate}
                      </span>
                    </div>
                    <div>
                      <span className="text-on-surface-variant block">Độ tin cậy AI:</span>
                      <span className="font-mono font-bold text-secondary text-sm">
                        {(selectedViolation.confidence * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>

                  <div className="border-t border-outline-variant/30 pt-3 text-xs space-y-2">
                    <div>
                      <span className="text-on-surface-variant block">Hành vi phát hiện:</span>
                      <span className="font-semibold text-on-surface text-xs">{selectedViolation.type}</span>
                    </div>
                    <div>
                      <span className="text-on-surface-variant block">Vị trí ghi nhận:</span>
                      <span className="text-on-surface text-xs">{selectedViolation.location}</span>
                    </div>
                    <div>
                      <span className="text-on-surface-variant block">Thời gian:</span>
                      <span className="font-mono text-on-surface-variant text-[11px]">{selectedViolation.timestamp}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Ý kiến xử lý / Ghi chú (Notes)</label>
                  <textarea 
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    placeholder="Nhập ghi chú xử lý vi phạm..."
                    className="w-full h-24 bg-surface border border-outline-variant/50 rounded-lg px-3 py-2 text-sm text-on-surface focus:outline-none focus:border-primary transition-colors"
                  />
                </div>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-outline-variant/30 flex justify-between items-center bg-surface">
              <span className={cn(
                "px-2.5 py-1 rounded text-[11px] font-bold tracking-wider font-mono uppercase",
                selectedViolation.status === 'VERIFIED' ? "bg-secondary/20 text-secondary" :
                selectedViolation.status === 'PENDING' ? "bg-tertiary/20 text-tertiary" : "bg-error/20 text-error"
              )}>
                Trạng thái: {selectedViolation.status}
              </span>
              
              <div className="flex gap-2">
                <button 
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => handleReviewSubmit(false)}
                  className="px-4 py-2 text-sm font-semibold border border-error/50 hover:bg-error/10 text-error rounded-lg cursor-pointer transition-colors disabled:opacity-50"
                >
                  Từ chối (Reject)
                </button>
                <button 
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => handleReviewSubmit(true)}
                  className="bg-secondary text-[#002a30] px-4 py-2 rounded-lg text-sm font-semibold hover:bg-secondary/80 transition-colors shadow-md cursor-pointer disabled:opacity-50"
                >
                  Phê duyệt (Verify)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function FilterButton({ label, active, onClick }: { label: string, active: boolean, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "px-3 py-1 rounded text-xs font-semibold cursor-pointer transition-colors",
        active ? "bg-primary text-on-primary shadow-sm" : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container"
      )}
    >
      {label}
    </button>
  );
}
