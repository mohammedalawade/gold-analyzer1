import { trpc } from '../lib/trpc';
import { TrendingUp, TrendingDown, Activity, Scale, Wifi, WifiOff } from 'lucide-react';

export default function PriceCard() {
  const { data: stats } = trpc.gold.getStats.useQuery(undefined, {
    refetchInterval: 5 * 60 * 1000,
  });
  const { data: status } = trpc.gold.getStatus.useQuery();

  const isUp = (stats?.change ?? 0) >= 0;
  const isLive = status?.livePriceAvailable;

  return (
    <div className="bg-dark-card border border-dark-border rounded-xl p-6 shadow-lg">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-gold-400 font-semibold flex items-center gap-2">
          <Activity className="w-5 h-5" />
          Gold Spot Price
        </h2>
        <div className="flex items-center gap-2">
          {isLive ? (
            <span className="flex items-center gap-1 text-[11px] text-green-400 bg-green-500/10 border border-green-500/20 px-2 py-0.5 rounded-full">
              <Wifi className="w-3 h-3" /> Live API
            </span>
          ) : (
            <span className="flex items-center gap-1 text-[11px] text-yellow-400 bg-yellow-500/10 border border-yellow-500/20 px-2 py-0.5 rounded-full">
              <WifiOff className="w-3 h-3" /> Simulation
            </span>
          )}
          <span className="text-xs text-gray-500 bg-dark-border px-2 py-1 rounded">
            USD/troy oz
          </span>
        </div>
      </div>

      {!isLive && (
        <div className="mb-3 text-[11px] text-yellow-400/80 bg-yellow-500/5 border border-yellow-500/10 rounded-lg px-2.5 py-1.5">
          ⚠️ No real-time API key configured. Add <code className="text-yellow-300">COMMODITY_API_KEY</code> to <code className="text-yellow-300">.env</code> for live prices.
          <a
            href="https://commoditypriceapi.com/gold-price"
            target="_blank"
            rel="noopener noreferrer"
            className="underline ml-1 hover:text-yellow-300"
          >
            Get free key →
          </a>
        </div>
      )}

      <div className="mt-1">
        <div className="text-4xl font-bold text-white tracking-tight">
          ${stats?.latestOzUsd?.toFixed(2) ?? stats?.latest?.toFixed(2) ?? '—'}
        </div>
        <div className="text-[10px] text-gray-500 mb-1">
          Source: {stats?.latestSource ?? '—'}
        </div>
        <div
          className={`flex items-center gap-2 mt-1 text-sm font-medium ${
            isUp ? 'text-green-400' : 'text-red-400'
          }`}
        >
          {isUp ? (
            <TrendingUp className="w-4 h-4" />
          ) : (
            <TrendingDown className="w-4 h-4" />
          )}
          <span>
            {stats
              ? `${isUp ? '+' : ''}${stats.change.toFixed(2)} (${stats.changePct.toFixed(2)}%)`
              : '—'}
          </span>
        </div>
      </div>

      {/* Multi-unit grid */}
      <div className="mt-4 grid grid-cols-2 gap-2">
        <div className="bg-dark-bg/60 rounded-lg p-2.5 border border-dark-border/40">
          <div className="flex items-center gap-1.5 text-gray-500 text-[11px] mb-0.5">
            <Scale className="w-3 h-3" />
            Gram (USD)
          </div>
          <div className="text-white font-semibold text-sm">
            ${stats?.latestGramUsd?.toFixed(2) ?? '—'}
          </div>
        </div>
        <div className="bg-dark-bg/60 rounded-lg p-2.5 border border-dark-border/40">
          <div className="flex items-center gap-1.5 text-gray-500 text-[11px] mb-0.5">
            <Scale className="w-3 h-3" />
            Gram (AED)
          </div>
          <div className="text-white font-semibold text-sm">
            {stats?.latestGramAed?.toFixed(0) ?? '—'} AED
          </div>
        </div>
        <div className="bg-dark-bg/60 rounded-lg p-2.5 border border-dark-border/40">
          <div className="flex items-center gap-1.5 text-gray-500 text-[11px] mb-0.5">
            <Scale className="w-3 h-3" />
            Gram (EGP)
          </div>
          <div className="text-white font-semibold text-sm">
            {stats?.latestGramEgp?.toFixed(0) ?? '—'} EGP
          </div>
        </div>
        <div className="bg-dark-bg/60 rounded-lg p-2.5 border border-dark-border/40">
          <div className="flex items-center gap-1.5 text-gray-500 text-[11px] mb-0.5">
            <Scale className="w-3 h-3" />
            Gram (SAR)
          </div>
          <div className="text-white font-semibold text-sm">
            {stats?.latestGramSar?.toFixed(0) ?? '—'} SAR
          </div>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2 text-xs text-gray-400">
        <div className="bg-dark-bg/60 rounded-lg p-2 text-center">
          <div className="text-gray-500">Low</div>
          <div className="text-white font-semibold">
            ${stats?.min.toFixed(2) ?? '—'}
          </div>
        </div>
        <div className="bg-dark-bg/60 rounded-lg p-2 text-center">
          <div className="text-gray-500">High</div>
          <div className="text-white font-semibold">
            ${stats?.max.toFixed(2) ?? '—'}
          </div>
        </div>
        <div className="bg-dark-bg/60 rounded-lg p-2 text-center">
          <div className="text-gray-500">Avg</div>
          <div className="text-white font-semibold">
            ${stats?.avg.toFixed(2) ?? '—'}
          </div>
        </div>
      </div>
    </div>
  );
}
