import { useState, useEffect } from 'react';
import { Search, Car, MapPin, AlertTriangle, HelpCircle } from 'lucide-react';
import { violationApi } from '../lib/api';

export function SearchView() {
  const [plateInput, setPlateInput] = useState('30F-123.45');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async () => {
    if (!plateInput.trim()) return;
    try {
      setLoading(true);
      setHasSearched(true);
      const res = await violationApi.search(plateInput.trim());
      setResults(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Perform initial search
  useEffect(() => {
    handleSearch();
  }, []);

  const hasViolations = results.length > 0;
  const latestRecord = results[0];

  return (
    <div className="space-y-6">
      
      {/* Search Bar area */}
      <div className="flex flex-col gap-4 max-w-2xl mx-auto text-center mt-8">
        <h1 className="text-3xl font-bold text-on-surface">Tra cứu phương tiện</h1>
        <p className="text-on-surface-variant text-sm">Nhập biển số xe (ví dụ: 30F-123.45 hoặc 29H-882.11) để truy lục lịch sử vi phạm giao thông.</p>
        
        <div className="relative mt-4">
          <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant" />
          <input 
            type="text" 
            placeholder="VD: 30F-123.45" 
            value={plateInput}
            onChange={(e) => setPlateInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="w-full bg-surface-container-low border border-outline-variant rounded-xl pl-12 pr-28 py-4 text-base text-on-surface focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-on-surface-variant shadow-sm uppercase font-mono tracking-wider"
          />
          <button 
            onClick={handleSearch}
            disabled={loading}
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-primary text-on-primary px-5 py-2 rounded-lg text-sm font-semibold hover:bg-primary-fixed-dim transition-colors shadow cursor-pointer disabled:opacity-50"
          >
            {loading ? 'Đang tìm...' : 'Tìm kiếm'}
          </button>
        </div>
      </div>

      {/* Results grid */}
      {loading ? (
        <div className="text-center py-12 text-on-surface-variant font-mono text-sm">
          Đang truy lục cơ sở dữ liệu quốc gia...
        </div>
      ) : hasSearched && results.length === 0 ? (
        <div className="max-w-md mx-auto text-center py-12 space-y-3 bg-surface-container-lowest p-6 rounded-xl border border-outline-variant/30">
          <HelpCircle className="w-12 h-12 mx-auto text-on-surface-variant" />
          <h3 className="font-bold text-on-surface text-base">Không tìm thấy bản ghi</h3>
          <p className="text-xs text-on-surface-variant">Phương tiện mang biển số "{plateInput.toUpperCase()}" chưa có lịch sử vi phạm giao thông nào được lưu trữ trên hệ thống AIDA.</p>
        </div>
      ) : hasSearched ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12 animate-fade-in">
          
          {/* Left panel - Vehicle details */}
          <div className="col-span-1 md:col-span-1 bg-surface-container-lowest rounded-xl border border-outline-variant/30 p-5 shadow-sm space-y-4">
            <h3 className="font-semibold text-on-surface flex items-center gap-2">
              <Car className="w-5 h-5 text-primary" />
              Thông tin phương tiện
            </h3>
            <div className="aspect-video bg-surface-container rounded-lg overflow-hidden border border-outline-variant/30 relative">
              <img 
                src={latestRecord?.image || 'https://images.unsplash.com/photo-1544621035-1f9e2b144b20?auto=format&fit=crop&q=80&w=800'} 
                alt="Vehicle" 
                className="w-full h-full object-cover" 
              />
            </div>
            <div className="space-y-3 pt-2">
              <div className="flex justify-between items-center text-sm">
                <span className="text-on-surface-variant">Biển kiểm soát</span>
                <span className="font-mono font-bold text-on-surface text-base uppercase tracking-wide">
                  {latestRecord?.plate || plateInput.toUpperCase()}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-on-surface-variant">Loại phương tiện</span>
                <span className="text-on-surface font-semibold">
                  {latestRecord?.type?.includes('tốc độ') || latestRecord?.type?.includes('đỏ') ? 'Ô tô con / Xe du lịch' : 'Phương tiện giao thông'}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-on-surface-variant">Tình trạng hồ sơ</span>
                {hasViolations ? (
                  <span className="text-error font-semibold flex items-center gap-1.5 animate-pulse">
                    <span className="w-2 h-2 rounded-full bg-error"></span>
                    Có vi phạm
                  </span>
                ) : (
                  <span className="text-secondary font-semibold flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-secondary"></span>
                    Trong sạch
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Right panel - History Timeline */}
          <div className="col-span-1 md:col-span-2 bg-surface-container-lowest rounded-xl border border-outline-variant/30 p-5 shadow-sm flex flex-col">
            <h3 className="font-semibold text-on-surface mb-6">Lịch sử ghi nhận vi phạm ({results.length})</h3>
            
            <div className="space-y-6 relative flex-1 before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-outline-variant/30 before:to-transparent">
              {results.map((v, i) => (
                <div key={v.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group">
                  
                  {/* Timeline icon */}
                  <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-surface-container-lowest bg-error/15 text-error shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  
                  {/* Timeline content card */}
                  <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-surface p-4 rounded-xl border border-outline-variant/20 hover:border-outline-variant/50 transition-all">
                    <div className="flex items-center justify-between mb-1 gap-2 flex-wrap">
                      <span className="text-xs font-bold text-error uppercase font-mono tracking-wider">{v.type}</span>
                      <time className="text-[10px] text-on-surface-variant font-mono">{v.timestamp}</time>
                    </div>
                    <div className="text-xs text-on-surface mt-1.5 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-primary" />
                      {v.location}
                    </div>
                    <div className="mt-2 text-[10px] text-on-surface-variant flex justify-between">
                      <span>Mã lưu trữ: <strong className="font-mono text-primary">{v.id}</strong></span>
                      <span>Độ chính xác: <strong className="font-mono text-secondary">{(v.confidence * 100).toFixed(0)}%</strong></span>
                    </div>
                  </div>

                </div>
              ))}
            </div>

          </div>

        </div>
      ) : null}

    </div>
  );
}
