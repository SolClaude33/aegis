import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown } from "lucide-react";

interface CryptoPrice {
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  marketCap?: number;
}

const TRACKED_SYMBOLS = [
  { symbol: "BTC", name: "Bitcoin" },
  { symbol: "ETH", name: "Ethereum" },
  { symbol: "BNB", name: "BNB Chain" },
];

interface PriceTrackerProps {
  layout?: "horizontal" | "vertical";
}

export default function PriceTracker({ layout = "vertical" }: PriceTrackerProps) {
  const { data: prices, isLoading } = useQuery<CryptoPrice[]>({
    queryKey: ["/api/crypto/prices"],
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  const priceMap = new Map(prices?.map((p) => [p.symbol, p]) || []);

  if (layout === "horizontal") {
    return (
      <div className="flex items-center gap-4 overflow-x-auto py-2" data-testid="price-tracker-horizontal">
        {TRACKED_SYMBOLS.map((crypto) => {
          const priceData = priceMap.get(crypto.symbol);
          const price = priceData?.price || 0;
          const change = priceData?.change24h || 0;
          const isPositive = change >= 0;

          return (
            <div
              key={crypto.symbol}
              className="flex items-center gap-3 px-4 py-2 rounded-md bg-card/50 border border-border/50 hover-elevate active-elevate-2 cursor-pointer transition-all duration-300 whitespace-nowrap"
              data-testid={`price-item-${crypto.symbol}`}
            >
              <div className="flex flex-col">
                <span className="text-sm font-bold text-foreground font-cyber" data-testid={`text-symbol-${crypto.symbol}`}>
                  {crypto.symbol}
                </span>
                <span className="text-xs text-white/80 font-mono" data-testid={`text-price-${crypto.symbol}`}>
                  ${isLoading ? "..." : price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <Badge
                variant={isPositive ? "default" : "destructive"}
                className="flex items-center gap-1"
                data-testid={`badge-change-${crypto.symbol}`}
              >
                {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                <span className="font-mono text-xs">
                  {isLoading ? "..." : `${isPositive ? "+" : ""}${change.toFixed(2)}%`}
                </span>
              </Badge>
            </div>
          );
        })}
      </div>
    );
  }

  if (isLoading) {
    return (
      <Card className="p-6 border-card-border" data-testid="card-price-tracker-loading">
        <h2 className="text-xl font-bold text-primary cyber-glow mb-4 font-cyber flex items-center gap-2">
          Market Prices
        </h2>
        <div className="space-y-3">
          {TRACKED_SYMBOLS.map((crypto) => (
            <div key={crypto.symbol} className="flex items-center justify-between p-3 rounded-md bg-card/50 border border-border animate-pulse">
              <div className="h-4 bg-muted rounded w-20"></div>
              <div className="h-4 bg-muted rounded w-24"></div>
            </div>
          ))}
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 border-card-border" data-testid="card-price-tracker">
      <h2 className="text-xl font-bold text-primary cyber-glow mb-4 font-cyber flex items-center gap-2">
        <span className="text-primary">$</span> Market Prices
      </h2>
      <div className="space-y-3">
        {TRACKED_SYMBOLS.map((crypto) => {
          const priceData = priceMap.get(crypto.symbol);
          const price = priceData?.price || 0;
          const change = priceData?.change24h || 0;
          const isPositive = change >= 0;

          return (
            <div
              key={crypto.symbol}
              className="flex items-center justify-between p-3 rounded-md hover-elevate active-elevate-2 cursor-pointer transition-all duration-300 bg-card/30 border border-border/50"
              data-testid={`price-item-${crypto.symbol}`}
            >
              <div className="flex items-center gap-3">
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-foreground font-cyber" data-testid={`text-symbol-${crypto.symbol}`}>
                    {crypto.symbol}
                  </span>
                  <span className="text-xs text-white/80 font-mono" data-testid={`text-name-${crypto.symbol}`}>
                    {crypto.name}
                  </span>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1">
                <span className="text-sm font-bold text-foreground font-mono" data-testid={`text-price-${crypto.symbol}`}>
                  ${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                <Badge
                  variant={isPositive ? "default" : "destructive"}
                  className="flex items-center gap-1"
                  data-testid={`badge-change-${crypto.symbol}`}
                >
                  {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  <span className="font-mono text-xs">
                    {isPositive ? "+" : ""}{change.toFixed(2)}%
                  </span>
                </Badge>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
