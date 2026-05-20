import { trpc } from '../lib/trpc';
import { Gauge } from 'lucide-react';

export default function FearGreedGauge() {
  const { data: sentiment } = trpc.gold.getSentiment.useQuery(undefined, {
    refetchInterval: 5 * 60 * 1000,
  });

  const value = sentiment?.fearGreedIndex ?? 50;
  const label = sentiment?.sentimentLabel ?? 'Neutral';

  const getColor = (v: number) => {
    if (v < 25) return '#ef4444';
    if (v < 45) return '#f97316';
    if (v < 55) return '#eab308';
    if (v < 75) return '#84cc16';
    return '#22c55e';
  };

  const color = getColor(value);
  const radius = 70;
  const stroke = 10;
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (value / 100) * circumference;

  return (
    <div className="bg-dark-card border border-dark-border rounded-xl p-6 shadow-lg flex flex-col items-center">
      <h2 className="text-gold-400 font-semibold mb-4 flex items-center gap-2 self-start">
        <Gauge className="w-5 h-5" />
        Fear & Greed
      </h2>
      <div className="relative w-48 h-48">
        <svg height={radius * 2} width={radius * 2} className="rotate-[-90deg]">
          <circle
            stroke="#2a2a3c"
            strokeWidth={stroke}
            fill="transparent"
            r={normalizedRadius}
            cx={radius}
            cy={radius}
          />
          <circle
            stroke={color}
            strokeWidth={stroke}
            strokeDasharray={`${circumference} ${circumference}`}
            style={{
              strokeDashoffset,
              transition: 'stroke-dashoffset 0.5s ease',
            }}
            strokeLinecap="round"
            fill="transparent"
            r={normalizedRadius}
            cx={radius}
            cy={radius}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold text-white">{value}</span>
          <span
            className="text-sm font-medium px-2 py-0.5 rounded mt-1"
            style={{ color, backgroundColor: color + '22' }}
          >
            {label}
          </span>
        </div>
      </div>
      <p className="text-xs text-gray-500 mt-3 text-center">
        0 = Extreme Fear · 100 = Extreme Greed
      </p>
    </div>
  );
}
