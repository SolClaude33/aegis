import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, TrendingDown, ArrowUp, ArrowDown } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getRealTimePrice, getFearGreedIndex } from "@/lib/cryptoApi";
import { useLivePrice } from "@/hooks/useLivePrice";
import { useTradingSymbol } from "@/contexts/TradingSymbolContext";
import SolanaCandlestickChart from "./SolanaCandlestickChart";

export default function MainContent() {
  const { selectedSymbol } = useTradingSymbol();
  const [news] = useState([
    { id: 1, text: "Solana ecosystem showing strong growth...", time: "12:34", type: "bullish" },
    { id: 2, text: "SOL breaks key resistance level at $160...", time: "12:31", type: "bullish" },
    { id: 3, text: "New DeFi protocols launching on Solana...", time: "12:28", type: "neutral" },
  ]);
  const [newsIndex, setNewsIndex] = useState(0);

  // Real-time price from WebSocket (only for SOL/USD)
  const livePrice = useLivePrice();

  // Fetch real-time price data for 24h stats
  const { data: priceData, isLoading } = useQuery({
    queryKey: ['real-time-price', selectedSymbol],
    queryFn: () => getRealTimePrice(selectedSymbol),
    refetchInterval: 3000, // Refresh every 3 seconds
  });

  // Fetch Fear & Greed Index
  const { data: fearGreedData } = useQuery({
    queryKey: ['fear-greed-index'],
    queryFn: getFearGreedIndex,
    refetchInterval: 300000, // Refresh every 5 minutes
  });

  // Auto-scroll news
  useEffect(() => {
    const newsInterval = setInterval(() => {
      setNewsIndex(prev => (prev + 1) % news.length);
    }, 4000);

    return () => clearInterval(newsInterval);
  }, [news.length]);

  const handleBuy = () => {
    console.log('Buy order triggered');
    // Add particle effect or visual feedback
  };

  const handleSell = () => {
    console.log('Sell order triggered');
    // Add particle effect or visual feedback
  };

  return (
    <main className="flex-1 p-6 space-y-6 cyber-scrollbar overflow-y-auto">
      {/* Trading Chart Section */}
      <Card className="p-6 cyber-border">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-cyber cyber-glow">TRADING CHART</h2>
          <Badge className="pulse-glow">LIVE</Badge>
        </div>
        
        {/* Real Solana Candlestick Chart */}
        <SolanaCandlestickChart />

        {/* Price Display - LIVE */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card className="p-4 text-center cyber-border relative">
            <Badge className="absolute top-2 right-2 text-xs pulse-glow" data-testid="badge-live-price">LIVE</Badge>
            <div className="text-3xl font-cyber cyber-glow" data-testid="text-live-price">
              ${selectedSymbol === 'SOL/USD' && livePrice ? livePrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : 
                (priceData?.current_price ? priceData.current_price.toLocaleString('en-US', { minimumFractionDigits: 2 }) : '...')}
            </div>
            <div className="text-sm font-mono text-muted-foreground">
              {selectedSymbol}
            </div>
          </Card>
          <Card className="p-4 text-center cyber-border">
            <div className={`text-2xl font-cyber ${(priceData?.price_change_percentage_24h || 0) >= 0 ? 'text-cyber-success' : 'text-cyber-danger'}`} data-testid="text-24h-change">
              {isLoading ? '...' : `${(priceData?.price_change_percentage_24h || 0) >= 0 ? '+' : ''}${(priceData?.price_change_percentage_24h || -0.89).toFixed(2)}%`}
            </div>
            <div className="text-sm font-mono text-muted-foreground">24h Change</div>
          </Card>
          <Card className="p-4 text-center cyber-border">
            <div className="text-2xl font-cyber text-cyber-gold" data-testid="text-volume">
              ${isLoading ? '...' : (priceData?.total_volume ? (priceData.total_volume / 1000000000).toFixed(1) + 'B' : '2.1B')}
            </div>
            <div className="text-sm font-mono text-muted-foreground">Volume</div>
          </Card>
        </div>

        {/* Trading Buttons */}
        <div className="flex gap-4 justify-center">
          <Button 
            size="lg" 
            className="bg-cyber-success hover:bg-cyber-success/80 text-black font-cyber px-8 cyber-button"
            onClick={handleBuy}
            data-testid="button-buy"
          >
            <ArrowUp className="w-5 h-5 mr-2" />
            BUY
          </Button>
          <Button 
            size="lg" 
            className="bg-cyber-danger hover:bg-cyber-danger/80 text-white font-cyber px-8 cyber-button"
            onClick={handleSell}
            data-testid="button-sell"
          >
            <ArrowDown className="w-5 h-5 mr-2" />
            SELL
          </Button>
        </div>
      </Card>

      {/* Market Sentiment - Fear & Greed Index */}
      <Card className="p-6 cyber-border">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-cyber cyber-glow">MARKET SENTIMENT</h2>
          <Badge className="text-xs" data-testid="badge-sentiment-source">Fear & Greed Index</Badge>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex-1">
            <div className="flex justify-between mb-2">
              <span className="text-sm font-mono text-cyber-danger">FEAR</span>
              <span className="text-sm font-mono text-cyber-success">GREED</span>
            </div>
            <Progress value={fearGreedData?.value || 50} className="h-3" />
          </div>
          <div className="text-right">
            <div className="text-2xl font-cyber cyber-glow" data-testid="text-sentiment-value">
              {fearGreedData?.value || '...'}
            </div>
            <div className="text-xs font-mono text-muted-foreground" data-testid="text-sentiment-classification">
              {fearGreedData?.classification || 'Loading...'}
            </div>
          </div>
        </div>
      </Card>

      {/* Latest Updates */}
      <Card className="p-6 cyber-border">
        <h2 className="text-xl font-cyber cyber-glow mb-4">LATEST UPDATES</h2>
        <div className="bg-card/30 cyber-border rounded p-4">
          <div className="typewriter text-sm font-mono" key={newsIndex}>
            [{news[newsIndex].time}] {news[newsIndex].text}
          </div>
        </div>
      </Card>
    </main>
  );
}