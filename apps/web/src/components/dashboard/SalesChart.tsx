import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, BarChart3 } from 'lucide-react';

interface SalesChartProps {
    data: { name: string; value: number }[];
}

export function SalesChart({ data }: SalesChartProps) {
    if (!data || data.length === 0) {
        return (
            <div className="bg-white rounded-3xl shadow-sm p-12 border border-gray-200 flex flex-col items-center justify-center min-h-[400px]">
                <BarChart3 className="w-12 h-12 text-gray-200 mb-4" />
                <p className="text-gray-400 font-medium">Aucune donnée de performance disponible</p>
            </div>
        );
    }

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-card p-4 border border-app rounded-2xl shadow-xl">
                    <p className="text-[10px] font-black text-muted uppercase tracking-widest mb-1">{label}</p>
                    <p className="text-xl font-black text-app tracking-tight">
                        {Number(payload[0].value).toLocaleString('fr-TN', { minimumFractionDigits: 3 })}
                        <span className="text-[10px] text-muted ml-1">TND</span>
                    </p>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="bg-card rounded-3xl p-8 border border-app flex flex-col transition-all hover:shadow-md">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <TrendingUp className="w-3.5 h-3.5 text-blue-600" />
                        <p className="text-[10px] font-black text-muted uppercase tracking-widest leading-none">Analyse de Performance</p>
                    </div>
                    <h2 className="text-2xl font-black text-app tracking-tight leading-none uppercase">
                        Flux <span className="text-blue-600">Mensuel</span>
                    </h2>
                </div>
                <div className="flex items-center gap-2">
                    <span className="px-3 py-1 bg-blue-600/10 text-blue-600 text-[10px] font-black rounded-lg uppercase tracking-widest border border-blue-600/20">
                        Live Metrics
                    </span>
                </div>
            </div>

            <div className="h-[350px] w-full mt-4">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <defs>
                            <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#2563eb" stopOpacity={0.2} />
                                <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--app-border)" opacity={0.5} />
                        <XAxis
                            dataKey="name"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: 'var(--app-text-muted)', fontSize: 10, fontWeight: 900 }}
                            dy={10}
                        />
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: 'var(--app-text-muted)', fontSize: 10, fontWeight: 900 }}
                            tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                            width={35}
                        />
                        <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#2563eb', strokeWidth: 2, strokeDasharray: '5 5' }} />
                        <Area
                            type="monotone"
                            dataKey="value"
                            stroke="#2563eb"
                            strokeWidth={4}
                            fillOpacity={1}
                            fill="url(#colorValue)"
                            animationDuration={2000}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>

            <div className="mt-8 pt-6 border-t border-app flex items-center justify-between">
                <div className="flex items-center gap-8">
                    <div>
                        <p className="text-[10px] font-black text-muted uppercase tracking-widest mb-1">Moyenne</p>
                        <div className="flex items-baseline gap-1">
                            <span className="text-lg font-black text-app">
                                {(data.reduce((acc, curr) => acc + curr.value, 0) / data.length / 1000).toFixed(1)}k
                            </span>
                            <span className="text-[9px] font-black text-muted uppercase tracking-widest">TND</span>
                        </div>
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-muted uppercase tracking-widest mb-1">Tendance</p>
                        <p className="text-lg font-black text-emerald-600 tracking-tighter transition-all hover:scale-110">+12.4%</p>
                    </div>
                </div>
                <div className="flex -space-x-3">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="w-9 h-9 rounded-full border-2 border-app bg-app flex items-center justify-center text-[10px] font-black text-muted shadow-sm uppercase">
                            {String.fromCharCode(64 + i)}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
