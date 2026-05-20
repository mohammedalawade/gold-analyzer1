import { trpc } from '../lib/trpc';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';

export default function PriceChart() {
  const { data: history } = trpc.gold.getPriceHistory.useQuery(
    { limit: 100 },
    { refetchInterval: 5 * 60 * 1000 }
  );

  const chartData =
    history?.map((p) => ({
      time: p.createdAt
        ? new Date(p.createdAt).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })
        : '',
      price: p.priceUsd,
    })) ?? [];

  return (
    <div className="bg-dark-card border border-dark-border rounded-xl p-6 shadow-lg h-96">
      <h2 className="text-gold-400 font-semibold mb-4">
        Price History (5-min intervals)
      </h2>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={chartData}
          margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
        >
          <defs>
            <linearGradient id="colorGold" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#d4af37" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#d4af37" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#2a2a3c" />
          <XAxis dataKey="time" stroke="#6b7280" tick={{ fontSize: 12 }} />
          <YAxis
            domain={['auto', 'auto']}
            stroke="#6b7280"
            tick={{ fontSize: 12 }}
            tickFormatter={(v) => `$${v}`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#13131f',
              borderColor: '#2a2a3c',
              color: '#f3f4f6',
            }}
            formatter={(value: number) => [`$${value.toFixed(2)}`, 'Price']}
          />
          <Area
            type="monotone"
            dataKey="price"
            stroke="#d4af37"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorGold)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
