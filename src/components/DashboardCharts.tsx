import { useEffect, useState } from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { statsApi } from '../lib/api';

export function DashboardCharts() {
  const [timeline, setTimeline] = useState<any[]>([]);
  const [pieData, setPieData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Fetch traffic timeline
        const trafficRes = await statsApi.traffic();
        setTimeline(trafficRes.data);

        // Fetch overview for vehicle distribution pie chart
        const overviewRes = await statsApi.overview();
        const o = overviewRes.data;
        
        const mappedPie = [
          { name: 'Ô tô con', value: o.carCount ?? 420, fill: 'var(--color-primary)' },
          { name: 'Xe máy', value: o.motorcycleCount ?? 850, fill: 'var(--color-secondary)' },
          { name: 'Xe tải', value: o.truckCount ?? 110, fill: 'var(--color-tertiary)' },
          { name: 'Xe khách/Bus', value: o.busCount ?? 40, fill: 'var(--color-error)' }
        ];
        setPieData(mappedPie);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      {/* Area Chart: Traffic Timeline */}
      <div className="lg:col-span-2 bg-surface-container-lowest rounded-xl border border-outline-variant/30 p-5 shadow-sm">
        <h3 className="text-lg font-semibold text-on-surface mb-4">Lưu lượng xe theo thời gian</h3>
        <div className="h-72">
          {loading ? (
            <div className="w-full h-full flex items-center justify-center text-xs text-on-surface-variant font-mono">
              Đang tải biểu đồ lưu lượng...
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timeline} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="time" stroke="var(--color-outline-variant)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--color-outline-variant)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}`} />
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-outline-variant)" vertical={false} opacity={0.3} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'var(--color-surface-container)', 
                    borderColor: 'var(--color-outline-variant)', 
                    color: 'var(--color-on-surface)',
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
                    fontSize: '12px',
                    borderWidth: '1px'
                  }}
                  itemStyle={{ color: 'var(--color-primary)', fontWeight: 'bold' }}
                />
                <Area type="monotone" dataKey="value" stroke="var(--color-primary)" strokeWidth={2} fillOpacity={1} fill="url(#colorValue)" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Pie Chart: Vehicle Distribution */}
      <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/30 p-5 shadow-sm">
        <h3 className="text-lg font-semibold text-on-surface mb-4">Phân bổ loại phương tiện</h3>
        <div className="h-72 flex justify-center items-center">
          {loading ? (
            <div className="w-full h-full flex items-center justify-center text-xs text-on-surface-variant font-mono">
              Đang tải phân bổ...
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'var(--color-surface-container)', 
                    borderColor: 'var(--color-outline-variant)', 
                    color: 'var(--color-on-surface)',
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
                    fontSize: '12px',
                    borderWidth: '1px'
                  }}
                />
                <Legend verticalAlign="bottom" height={36} iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

    </div>
  );
}
