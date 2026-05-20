import PriceCard from '../components/PriceCard';
import PriceChart from '../components/PriceChart';
import FearGreedGauge from '../components/FearGreedGauge';
import EconomicIndicators from '../components/EconomicIndicators';
import TradingRecommendation from '../components/TradingRecommendation';
import GeopoliticalEvents from '../components/GeopoliticalEvents';
import SentimentAnalysis from '../components/SentimentAnalysis';

export default function Home() {
  return (
    <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <PriceCard />
        <FearGreedGauge />
        <TradingRecommendation />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <PriceChart />
        </div>
        <div className="space-y-6">
          <SentimentAnalysis />
          <EconomicIndicators />
        </div>
      </div>

      <GeopoliticalEvents />
    </main>
  );
}
