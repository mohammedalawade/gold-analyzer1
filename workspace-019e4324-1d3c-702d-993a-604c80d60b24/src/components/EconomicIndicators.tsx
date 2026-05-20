import { trpc } from '../lib/trpc';
import { BarChart3 } from 'lucide-react';

export default function EconomicIndicators() {
  const { data: indicators } = trpc.gold.getEconomicIndicators.useQuery(
    undefined,
    { refetchInterval: 5 * 60 * 1000 }
  );

  return (
    <div className="bg-dark-card border border-dark-border rounded-xl p-6 shadow-lg">
      <h2 className="text-gold-400 font-semibold mb-4 flex items-center gap-2">
        <BarChart3 className="w-5 h-5" />
        Macro Indicators
      </h2>
      <div className="space-y-3">
        {indicators?.map((ind) => (
          <div key={ind.id} className="flex items-center justify-between">
            <span className="text-sm text-gray-300">{ind.name}</span>
            <span className="text-sm font-semibold text-white">
              {ind.value.toFixed(2)}{' '}
              <span className="text-gray-500 text-xs">{ind.unit}</span>
            </span>
          </div>
        ))}
        {(!indicators || indicators.length === 0) && (
          <p className="text-sm text-gray-500">No data yet.</p>
        )}
      </div>
    </div>
  );
}
