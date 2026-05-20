import { ToastProvider } from './context/ToastContext';
import ToastContainer from './components/ToastContainer';
import NotificationBell from './components/NotificationBell';
import PriceUpdater from './components/PriceUpdater';
import Home from './pages/Home';

export default function App() {
  return (
    <ToastProvider>
      <div className="min-h-screen bg-dark-bg text-gray-100">
        <nav className="border-b border-dark-border bg-dark-card/80 backdrop-blur-sm sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg gold-gradient flex items-center justify-center shadow-lg shadow-gold-500/10">
                <span className="text-dark-bg font-bold text-sm">Au</span>
              </div>
              <div>
                <h1 className="text-lg font-bold gold-text-gradient leading-tight">
                  Gold Psychology Analyzer
                </h1>
                <p className="text-[10px] text-gray-500 leading-none">
                  Real-time sentiment &amp; cycle intelligence
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <PriceUpdater />
              <NotificationBell />
            </div>
          </div>
        </nav>
        <Home />
      </div>
      <ToastContainer />
    </ToastProvider>
  );
}
