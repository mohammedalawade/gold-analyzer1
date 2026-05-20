import { trpc } from '../lib/trpc';
import { BrainCircuit } from 'lucide-react';

export default function SentimentAnalysis() {
  const { data: sentiment } = trpc.gold.getSentiment.useQuery(undefined, {
    refetchInterval: 5 * 60 * 1000,
  });

  const { data: history } = trpc.gold.getPriceHistory.useQuery(
    { limit: 20 },
    { refetchInterval: 5 * 60 * 1000 }
  );

  const priceChange =
    history && history.length > 1
      ? history[history.length - 1].priceUsd -
        history[history.length - 2].priceUsd
      : 0;

  return (
    <div className="bg-dark-card border border-dark-border rounded-xl p-6 shadow-lg">
      <h2 className="text-gold-400 font-semibold mb-4 flex items-center gap-2">
        <BrainCircuit className="w-5 h-5" />
        Sentiment Analysis
      </h2>
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-400">Latest Index</span>
          <span className="text-lg font-bold text-white">
            {sentiment?.fearGreedIndex ?? '—'}/100
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-400">Label</span>
          <span className="text-sm font-medium text-gold-300">
            {sentiment?.sentimentLabel ?? '—'}
          </span>
        </div>
        <div className="w-full h-px bg-dark-border" />
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-400">Recent Price Delta</span>
          <span
            className={`text-sm font-semibold ${
              priceChange >= 0 ? 'text-green-400' : 'text-red-400'
            }`}
          >
            {priceChange >= 0 ? '+' : ''}
            {priceChange.toFixed(2)}
          </span>
        </div>
        <p className="text-xs text-gray-500 leading-relaxed">
          The Fear & Greed index is derived from price momentum versus a
          short-term average. Extreme readings may signal contrarian
          opportunities in gold.
        </p>
      </div>
    </div>
  );
}
