import { ViolationList } from '../components/ViolationList';
import { Calendar, MapPin } from 'lucide-react';

export function ViolationsView() {
  return (
    <>
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-on-surface">Quản lý Vi phạm</h1>
          <p className="text-on-surface-variant mt-1 text-sm">Xem và xử lý các lỗi vi phạm được phát hiện.</p>
        </div>
        <div className="flex gap-2">
            <button className="flex items-center gap-2 border border-outline-variant/50 text-on-surface px-4 py-2 rounded-lg text-sm font-medium hover:bg-surface-container transition-colors">
                <Calendar className="w-4 h-4" />
                Hôm nay
            </button>
            <button className="flex items-center gap-2 border border-outline-variant/50 text-on-surface px-4 py-2 rounded-lg text-sm font-medium hover:bg-surface-container transition-colors">
                <MapPin className="w-4 h-4" />
                Tất cả địa điểm
            </button>
        </div>
      </div>
      
      <div className="flex-1 flex flex-col min-h-[400px]">
          <ViolationList />
      </div>
    </>
  );
}
