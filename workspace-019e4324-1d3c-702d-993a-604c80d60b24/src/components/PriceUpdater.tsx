import { useState } from 'react';
import { trpc } from '../lib/trpc';
import { useToast } from '../context/ToastContext';
import { RefreshCw, CheckCircle } from 'lucide-react';

export default function PriceUpdater() {
  const [value, setValue] = useState('');
  const [open, setOpen] = useState(false);
  const utils = trpc.useUtils();
  const { addToast } = useToast();

  const updatePrice = trpc.gold.updatePrice.useMutation({
    onSuccess: (data) => {
      addToast({
        title: 'Price Updated!',
        message: `New price $${data.priceUsd} saved. Sentiment: ${data.sentimentLabel} → ${data.recommendation}`,
        type: 'success',
      });
      // Invalidate all gold queries
      utils.gold.getLatestPrice.invalidate();
      utils.gold.getStats.invalidate();
      utils.gold.getPriceHistory.invalidate();
      utils.gold.getSentiment.invalidate();
      utils.gold.getRecommendations.invalidate();
      setValue('');
      setOpen(false);
    },
    onError: (err) => {
      addToast({
        title: 'Update Failed',
        message: err.message,
        type: 'error',
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseFloat(value);
    if (!num || num < 100 || num > 20000) {
      addToast({
        title: 'Invalid Price',
        message: 'Enter a realistic USD price (100 - 20,000)',
        type: 'warning',
      });
      return;
    }
    updatePrice.mutate({ priceUsd: num, source: 'manual' });
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 text-xs font-medium text-gold-400 hover:text-gold-300 transition-colors bg-gold-500/10 hover:bg-gold-500/15 border border-gold-500/20 px-3 py-1.5 rounded-lg"
      >
        <RefreshCw className="w-3.5 h-3.5" />
        Update Price
      </button>

      {open && (
        <div className="absolute right-0 top-9 w-72 bg-dark-card border border-dark-border rounded-xl shadow-2xl z-50 p-4">
          <h3 className="text-sm font-semibold text-white mb-1">
            Manual Price Entry
          </h3>
          <p className="text-[11px] text-gray-500 mb-3">
            Enter today's real gold price in USD per troy ounce.
          </p>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="text-[11px] text-gray-400 block mb-1">
                Price (USD / troy oz)
              </label>
              <input
                type="number"
                step="0.01"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="e.g. 4470"
                className="w-full bg-dark-bg border border-dark-border rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-gold-500/50 focus:ring-1 focus:ring-gold-500/20"
                autoFocus
              />
            </div>
            <div className="flex items-center gap-2">
              <button
                type="submit"
                disabled={updatePrice.isPending}
                className="flex-1 bg-gold-500/15 hover:bg-gold-500/25 text-gold-400 border border-gold-500/30 text-xs font-medium py-2 rounded-lg flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
              >
                {updatePrice.isPending ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <CheckCircle className="w-3.5 h-3.5" />
                )}
                {updatePrice.isPending ? 'Saving...' : 'Save Price'}
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="px-3 py-2 text-xs text-gray-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
