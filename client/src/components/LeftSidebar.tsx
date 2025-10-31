import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, TrendingUp, Zap, Settings, User, BarChart3, Lock } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getMarketPrices } from "@/lib/cryptoApi";
import { useTradingSymbol } from "@/contexts/TradingSymbolContext";
import cryptoMeme1 from "@assets/generated_images/Crypto_meme_placeholder_b0373b09.png";
import cryptoMeme2 from "@assets/generated_images/Ethereum_meme_placeholder_dd48646c.png";

export default function LeftSidebar() {
  const [activeNav, setActiveNav] = useState('trading');
  const [currentMeme, setCurrentMeme] = useState(0);
  const { selectedSymbol, setSelectedSymbol } = useTradingSymbol();
  
  const memes = [cryptoMeme1, cryptoMeme2];

  const navItems = [
    { id: 'trading', label: 'TRADING', icon: TrendingUp, available: true },
    { id: 'portfolio', label: 'PORTFOLIO', icon: BarChart3, available: false },
    { id: 'analytics', label: 'ANALYTICS', icon: Activity, available: false },
    { id: 'profile', label: 'PROFILE', icon: User, available: false },
    { id: 'settings', label: 'SETTINGS', icon: Settings, available: false },
  ];

  // Fetch real-time market prices
  const { data: marketTickers, isLoading: isLoadingPrices } = useQuery({
    queryKey: ['market-prices'],
    queryFn: getMarketPrices,
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  const handleNavClick = (navId: string, available: boolean) => {
    if (!available) return;
    setActiveNav(navId);
    console.log(`Navigation clicked: ${navId}`);
  };

  const rotateMeme = () => {
    setCurrentMeme((prev) => (prev + 1) % memes.length);
    console.log('Meme rotated');
  };

  return (
    <aside className="w-full h-full bg-sidebar cyber-border p-4 space-y-4 cyber-scrollbar overflow-y-auto">
      {/* Navigation Panel */}
      <Card className="p-4 cyber-border">
        <h2 className="text-lg font-cyber cyber-glow mb-4">NAVIGATION</h2>
        <div className="space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeNav === item.id;
            return (
              <Button
                key={item.id}
                variant={isActive ? "default" : "ghost"}
                className={`w-full justify-start font-mono text-xs ${isActive ? 'cyber-glow' : ''} ${!item.available ? 'opacity-40 cursor-not-allowed' : ''}`}
                onClick={() => handleNavClick(item.id, item.available)}
                disabled={!item.available}
                data-testid={`nav-${item.id}`}
              >
                <Icon className="w-4 h-4 mr-2" />
                {item.label}
                {!item.available && <Lock className="w-3 h-3 ml-auto" />}
              </Button>
            );
          })}
        </div>
      </Card>

      {/* Status Indicators */}
      <Card className="p-4 cyber-border">
        <h2 className="text-lg font-cyber cyber-glow mb-4">STATUS</h2>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-mono">CONNECTION</span>
            <Badge className="pulse-glow bg-cyber-success">ONLINE</Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-mono">TRADING</span>
            <Badge className="pulse-glow bg-cyber-success">ACTIVE</Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-mono">ALERTS</span>
            <Badge className="pulse-glow bg-cyber-gold">3 NEW</Badge>
          </div>
        </div>
      </Card>

      {/* Live Market Ticker */}
      <Card className="p-4 cyber-border">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-cyber cyber-glow">LIVE MARKET</h2>
          <Badge className="text-xs pulse-glow" data-testid="badge-live-market">LIVE</Badge>
        </div>
        <div className="space-y-2 text-xs font-mono">
          {isLoadingPrices ? (
            <div className="text-center text-muted-foreground">Loading...</div>
          ) : (
            (marketTickers || []).map((ticker, index) => (
              <div 
                key={index} 
                className={`flex justify-between items-center p-2 rounded cursor-pointer transition-all hover-elevate active-elevate-2 ${selectedSymbol === ticker.symbol ? 'bg-primary/20 cyber-border' : 'bg-card/50'}`}
                onClick={() => setSelectedSymbol(ticker.symbol)}
                data-testid={`ticker-${ticker.symbol.replace('/', '-')}`}
              >
                <span className="text-foreground font-semibold">{ticker.symbol}</span>
                <div className="text-right">
                  <div className="text-foreground" data-testid={`price-${ticker.symbol.replace('/', '-')}`}>
                    ${ticker.price.toLocaleString('en-US', { 
                      minimumFractionDigits: ticker.price < 1 ? 4 : 2,
                      maximumFractionDigits: ticker.price < 1 ? 4 : 2
                    })}
                  </div>
                  <div className={ticker.change >= 0 ? 'text-cyber-success' : 'text-cyber-danger'} data-testid={`change-${ticker.symbol.replace('/', '-')}`}>
                    {ticker.change >= 0 ? '+' : ''}{ticker.change.toFixed(2)}%
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>

      {/* Meme Corner */}
      <Card className="p-4 cyber-border">
        <h2 className="text-lg font-cyber cyber-glow mb-4">MEME CORNER</h2>
        <div className="text-center">
          <img 
            src={memes[currentMeme]} 
            alt="Crypto Meme" 
            className="w-full aspect-square object-cover rounded cyber-border cursor-pointer"
            onClick={rotateMeme}
            data-testid="meme-image"
          />
          <Button 
            size="sm" 
            variant="outline" 
            className="mt-2 w-full font-mono text-xs"
            onClick={rotateMeme}
            data-testid="button-rotate-meme"
          >
            <Zap className="w-3 h-3 mr-1" />
            ROTATE
          </Button>
        </div>
      </Card>
    </aside>
  );
}