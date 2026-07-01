import { Search, Car, MapPin } from 'lucide-react';
import { mockViolations } from '../data';

export function SearchView() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 max-w-2xl mx-auto text-center mt-8">
        <h1 className="text-3xl font-bold text-on-surface">Tra cứu phương tiện</h1>
        <p className="text-on-surface-variant text-sm">Nhập biển số xe hoặc mã định danh để xem lịch sử di chuyển và vi phạm.</p>
        
        <div className="relative mt-4">
          <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant" />
          <input 
            type="text" 
            placeholder="VD: 30F-123.45" 
            className="w-full bg-surface-container-low border border-primary/50 rounded-xl pl-12 pr-4 py-4 text-base text-on-surface focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-on-surface-variant shadow-sm uppercase font-mono"
            defaultValue="30F-123.45"
          />
          <button className="absolute right-2 top-1/2 -translate-y-1/2 bg-primary text-on-primary px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-fixed-dim transition-colors">
            Tìm kiếm
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
          <div className="col-span-1 md:col-span-1 bg-surface-container-lowest rounded-xl border border-outline-variant/30 p-5 shadow-sm space-y-4">
            <h3 className="font-semibold text-on-surface flex items-center gap-2">
                <Car className="w-5 h-5 text-primary" />
                Thông tin phương tiện
            </h3>
            <div className="aspect-video bg-surface-container rounded-lg overflow-hidden border border-outline-variant/30">
                <img src={mockViolations[0].image} alt="Vehicle" className="w-full h-full object-cover" />
            </div>
            <div className="space-y-3 pt-2">
                <div className="flex justify-between items-center text-sm">
                    <span className="text-on-surface-variant">Biển kiểm soát</span>
                    <span className="font-mono font-bold text-on-surface text-base uppercase">30F-123.45</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                    <span className="text-on-surface-variant">Loại xe</span>
                    <span className="text-on-surface font-medium">Ô tô con (5 chỗ)</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                    <span className="text-on-surface-variant">Trạng thái</span>
                    <span className="text-error font-medium flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-error"></span>Có vi phạm</span>
                </div>
            </div>
          </div>

          <div className="col-span-1 md:col-span-2 bg-surface-container-lowest rounded-xl border border-outline-variant/30 p-5 shadow-sm">
            <h3 className="font-semibold text-on-surface mb-6">Lịch sử di chuyển (24h qua)</h3>
            <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-outline-variant/30 before:to-transparent">
                {mockViolations.slice(0, 3).map((v, i) => (
                    <div key={i} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                        <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-surface-container-lowest bg-primary/20 text-primary shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                            {i === 0 ? <AlertTriangleIcon /> : <MapPin className="w-4 h-4" />}
                        </div>
                        <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] py-2 px-4">
                            <div className="flex items-center justify-between mb-1">
                                <span className={`text-sm font-semibold ${i === 0 ? 'text-error' : 'text-on-surface'}`}>{i === 0 ? v.type : 'Nhận diện điểm kiểm soát'}</span>
                                <time className="text-xs text-on-surface-variant font-mono">{v.timestamp.split(' ')[1]}</time>
                            </div>
                            <div className="text-sm text-on-surface-variant mt-1">{v.location}</div>
                        </div>
                    </div>
                ))}
            </div>
          </div>
      </div>
    </div>
  );
}

function AlertTriangleIcon() {
    return <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
}
