import { trpc } from '../lib/trpc';
import {
  Lightbulb,
  ShieldAlert,
  ArrowUpCircle,
  ArrowDownCircle,
  MinusCircle,
} from 'lucide-react';

export default function TradingRecommendation() {
  const { data: recs } = trpc.gold.getRecommendations.useQuery(undefined, {
    refetchInterval: 5 * 60 * 1000,
  });

  const latest = recs?.[0];

  const actionConfig: Record<
    string,
    { icon: React.ReactNode; color: string; bg: string }
  > = {
    BUY: {
      icon: <ArrowUpCircle className="w-6 h-6" />,
      color: 'text-green-400',
      bg: 'bg-green-400/10',
    },
    SELL: {
      icon: <ArrowDownCircle className="w-6 h-6" />,
      color: 'text-red-400',
      bg: 'bg-red-400/10',
    },
    HOLD: {
      icon: <MinusCircle className="w-6 h-6" />,
      color: 'text-yellow-400',
      bg: 'bg-yellow-400/10',
    },
  };

  const cfg = latest
    ? actionConfig[latest.action] ?? actionConfig.HOLD
    : actionConfig.HOLD;

  return (
    <div className="bg-dark-card border border-dark-border rounded-xl p-6 shadow-lg">
      <h2 className="text-gold-400 font-semibold mb-4 flex items-center gap-2">
        <Lightbulb className="w-5 h-5" />
        Smart Signal
      </h2>
      {latest ? (
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-lg ${cfg.bg} ${cfg.color}`}>
              {cfg.icon}
            </div>
            <div>
              <div className="text-2xl font-bold text-white">
                {latest.action}
              </div>
              <div className="text-xs text-gray-400">
                Confidence: {latest.confidence}%
              </div>
            </div>
          </div>
          <p className="text-sm text-gray-300 leading-relaxed bg-dark-bg/50 rounded-lg p-3 border border-dark-border">
            {latest.reasoning}
          </p>
        </div>
      ) : (
        <div className="flex items-center gap-2 text-gray-500 text-sm">
          <ShieldAlert className="w-4 h-4" />
          Waiting for data...
        </div>
      )}
    </div>
  );
}
