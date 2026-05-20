import { useState, useEffect, useRef } from 'react';
import { trpc } from '../lib/trpc';
import { useToast } from '../context/ToastContext';
import { Bell, Check, CheckCheck, X, TrendingUp, TrendingDown, AlertTriangle, Globe } from 'lucide-react';

const typeIcons: Record<string, React.ReactNode> = {
  recommendation_change: <TrendingUp className="w-4 h-4 text-gold-400" />,
  sentiment_shift: <TrendingDown className="w-4 h-4 text-yellow-400" />,
  price_spike: <AlertTriangle className="w-4 h-4 text-red-400" />,
  geopolitical_event: <Globe className="w-4 h-4 text-blue-400" />,
};

const typeStyles: Record<string, string> = {
  recommendation_change: 'bg-gold-500/10 border-gold-500/20',
  sentiment_shift: 'bg-yellow-500/10 border-yellow-500/20',
  price_spike: 'bg-red-500/10 border-red-500/20',
  geopolitical_event: 'bg-blue-500/10 border-blue-500/20',
};

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { addToast } = useToast();
  const lastNotifiedIds = useRef<Set<number>>(new Set());

  const { data: unreadCount, refetch: refetchUnread } = trpc.gold.getUnreadCount.useQuery(
    undefined,
    { refetchInterval: 30000 }
  );

  const { data: notifications, refetch: refetchNotifications } = trpc.gold.getNotifications.useQuery(
    { limit: 15 },
    { refetchInterval: 30000 }
  );

  const markAsRead = trpc.gold.markAsRead.useMutation({
    onSuccess: () => {
      refetchUnread();
      refetchNotifications();
    },
  });

  const markAllAsRead = trpc.gold.markAllAsRead.useMutation({
    onSuccess: () => {
      refetchUnread();
      refetchNotifications();
    },
  });

  // Show toasts for new unread notifications
  useEffect(() => {
    if (!notifications) return;
    const unread = notifications.filter((n) => !n.read);
    for (const n of unread) {
      if (!lastNotifiedIds.current.has(n.id)) {
        lastNotifiedIds.current.add(n.id);
        let toastType: 'info' | 'success' | 'warning' | 'error' = 'info';
        if (n.type === 'price_spike') toastType = 'warning';
        if (n.type === 'recommendation_change') toastType = 'success';
        addToast({
          title: n.title,
          message: n.message,
          type: toastType,
        });
      }
    }
  }, [notifications, addToast]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative p-2 rounded-lg hover:bg-dark-border/60 transition-colors"
      >
        <Bell className="w-5 h-5 text-gray-300" />
        {(unreadCount ?? 0) > 0 && (
          <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
            {unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-96 bg-dark-card border border-dark-border rounded-xl shadow-2xl z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-dark-border">
            <h3 className="text-sm font-semibold text-white">Notifications</h3>
            <div className="flex items-center gap-2">
              {(unreadCount ?? 0) > 0 && (
                <button
                  onClick={() => markAllAsRead.mutate()}
                  className="text-xs text-gold-400 hover:text-gold-300 flex items-center gap-1 transition-colors"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  Mark all read
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                className="text-gray-500 hover:text-gray-300"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="max-h-[28rem] overflow-y-auto">
            {notifications && notifications.length > 0 ? (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className={`px-4 py-3 border-b border-dark-border/50 flex items-start gap-3 transition-colors hover:bg-dark-bg/40 ${
                    n.read ? 'opacity-60' : ''
                  }`}
                >
                  <div className={`mt-0.5 p-1.5 rounded-md border ${typeStyles[n.type] ?? 'bg-gray-500/10 border-gray-500/20'}`}>
                    {typeIcons[n.type] ?? <Bell className="w-4 h-4 text-gray-400" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-white truncate">
                      {n.title}
                    </div>
                    <div className="text-xs text-gray-400 mt-0.5 line-clamp-2">
                      {n.message}
                    </div>
                    <div className="flex items-center justify-between mt-1.5">
                      <span className="text-[10px] text-gray-600">
                        {n.createdAt
                          ? new Date(n.createdAt).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : ''}
                      </span>
                      {!n.read && (
                        <button
                          onClick={() => markAsRead.mutate({ id: n.id })}
                          className="text-[10px] text-gold-400 hover:text-gold-300 flex items-center gap-1 transition-colors"
                        >
                          <Check className="w-3 h-3" />
                          Mark read
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="px-4 py-8 text-center text-sm text-gray-500">
                No notifications yet.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
