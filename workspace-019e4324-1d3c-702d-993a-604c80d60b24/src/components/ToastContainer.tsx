import { useToast } from '../context/ToastContext';
import { X, Info, CheckCircle, AlertTriangle, AlertCircle } from 'lucide-react';

const iconMap = {
  info: <Info className="w-5 h-5 text-blue-400" />,
  success: <CheckCircle className="w-5 h-5 text-green-400" />,
  warning: <AlertTriangle className="w-5 h-5 text-yellow-400" />,
  error: <AlertCircle className="w-5 h-5 text-red-400" />,
};

const borderMap = {
  info: 'border-blue-500/30',
  success: 'border-green-500/30',
  warning: 'border-yellow-500/30',
  error: 'border-red-500/30',
};

export default function ToastContainer() {
  const { toasts, removeToast } = useToast();

  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-3 w-80">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`bg-dark-card border ${borderMap[toast.type]} rounded-lg shadow-xl p-4 flex items-start gap-3 animate-slide-in`}
        >
          <div className="mt-0.5 shrink-0">{iconMap[toast.type]}</div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold text-white">{toast.title}</div>
            <div className="text-xs text-gray-400 mt-1">{toast.message}</div>
          </div>
          <button
            onClick={() => removeToast(toast.id)}
            className="shrink-0 text-gray-500 hover:text-gray-200 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
