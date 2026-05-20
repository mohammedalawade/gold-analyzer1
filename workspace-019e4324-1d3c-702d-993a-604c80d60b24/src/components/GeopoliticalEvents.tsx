import { trpc } from '../lib/trpc';
import { Globe } from 'lucide-react';

export default function GeopoliticalEvents() {
  const { data: events } = trpc.gold.getGeopoliticalEvents.useQuery(undefined, {
    refetchInterval: 5 * 60 * 1000,
  });

  return (
    <div className="bg-dark-card border border-dark-border rounded-xl p-6 shadow-lg">
      <h2 className="text-gold-400 font-semibold mb-4 flex items-center gap-2">
        <Globe className="w-5 h-5" />
        Geopolitical & Market Events
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {events?.map((ev) => (
          <div
            key={ev.id}
            className="bg-dark-bg/60 border border-dark-border rounded-lg p-4"
          >
            <div className="flex items-start justify-between">
              <h3 className="text-white font-medium text-sm">{ev.title}</h3>
              {ev.impactScore !== null && (
                <span
                  className={`text-xs px-2 py-0.5 rounded font-semibold ${
                    (ev.impactScore ?? 0) >= 5
                      ? 'bg-red-500/20 text-red-400'
                      : (ev.impactScore ?? 0) >= 3
                      ? 'bg-orange-500/20 text-orange-400'
                      : 'bg-gray-500/20 text-gray-400'
                  }`}
                >
                  Impact {ev.impactScore}
                </span>
              )}
            </div>
            <p className="text-gray-400 text-sm mt-1">{ev.description}</p>
            <p className="text-gray-600 text-xs mt-2">
              {ev.createdAt ? new Date(ev.createdAt).toLocaleString() : ''}
            </p>
          </div>
        ))}
        {(!events || events.length === 0) && (
          <p className="text-sm text-gray-500">No events recorded.</p>
        )}
      </div>
    </div>
  );
}
