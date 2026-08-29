import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import { BarChart3, TrendingUp, Calendar, Zap } from 'lucide-react';
import type { ReachHistoryItem } from '../utils/storage';

interface ReachChartProps {
  history: ReachHistoryItem[];
  dailyUsedToday: number;
}

export const ReachChart: React.FC<ReachChartProps> = ({ history, dailyUsedToday }) => {
  // Generate 7-day chronological data array
  const last7DaysData = React.useMemo(() => {
    const days: { dateStr: string; label: string; count: number; boosts: number }[] = [];
    const now = new Date();

    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;

      const dayNames = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
      const label = i === 0 ? 'Hari Ini' : `${dayNames[d.getDay()]} (${day}/${month})`;

      // Calculate total boosts in this day from history
      let boosts = 0;
      history.forEach((h) => {
        const itemDate = new Date(h.timestamp);
        const itemDateStr = `${itemDate.getFullYear()}-${String(itemDate.getMonth() + 1).padStart(2, '0')}-${String(itemDate.getDate()).padStart(2, '0')}`;
        if (itemDateStr === dateStr && h.status === 'success') {
          boosts += 1;
        }
      });

      // If today and history might be empty or partial, sync with dailyUsedToday
      if (i === 0 && dailyUsedToday > boosts) {
        boosts = dailyUsedToday;
      }

      days.push({
        dateStr,
        label,
        count: boosts,
        boosts,
      });
    }

    return days;
  }, [history, dailyUsedToday]);

  const total7DaysBoosts = last7DaysData.reduce((acc, d) => acc + d.boosts, 0);
  const avgBoosts = (total7DaysBoosts / 7).toFixed(1);

  return (
    <div 
      id="reach-activity-chart-card"
      className="liquid-glass rounded-3xl p-5 sm:p-6 border border-white/10 shadow-xl relative overflow-hidden space-y-4"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
            <BarChart3 className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-extrabold text-white flex items-center gap-2">
              <span>Grafik Aktivitas Boost (7 Hari Terakhir)</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Live Stats
              </span>
            </h3>
            <span className="text-[11px] text-slate-400">
              Visualisasi riwayat eksekusi boost per hari
            </span>
          </div>
        </div>

        {/* Quick summary stats pill */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-800/70 border border-slate-700/60 text-xs">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-slate-400">Total:</span>
            <span className="font-extrabold text-white font-mono">{total7DaysBoosts}x</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-800/70 border border-slate-700/60 text-xs">
            <Zap className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-slate-400">Rata-rata:</span>
            <span className="font-extrabold text-cyan-300 font-mono">{avgBoosts}/hari</span>
          </div>
        </div>
      </div>

      {/* Chart Canvas Area */}
      <div className="w-full h-48 sm:h-56 pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={last7DaysData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
            <defs>
              <linearGradient id="boostAreaGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10B981" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#06B6D4" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
            <XAxis 
              dataKey="label" 
              stroke="#64748b" 
              fontSize={11} 
              tickLine={false}
              axisLine={{ stroke: '#334155' }}
            />
            <YAxis 
              stroke="#64748b" 
              fontSize={11} 
              tickLine={false}
              axisLine={{ stroke: '#334155' }}
              allowDecimals={false}
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="liquid-glass rounded-xl p-2.5 border border-emerald-500/40 bg-slate-900/95 shadow-2xl text-xs space-y-1">
                      <div className="flex items-center gap-1 text-slate-400 font-bold text-[10px]">
                        <Calendar className="w-3 h-3 text-emerald-400" />
                        <span>{label}</span>
                      </div>
                      <div className="text-sm font-black text-emerald-400 font-mono">
                        {payload[0].value}x Tindakan Boost
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Area
              type="monotone"
              dataKey="boosts"
              stroke="#10B981"
              strokeWidth={3}
              fillOpacity={1}
              fill="url(#boostAreaGradient)"
              activeDot={{ r: 6, stroke: '#10B981', strokeWidth: 2, fill: '#ffffff' }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
