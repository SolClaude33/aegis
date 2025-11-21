import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, TrendingUp, TrendingDown, Clock, CheckCircle2, XCircle, Loader2 } from "lucide-react";

interface AsterdexOrder {
  id: string;
  agentId: string;
  asterdexOrderId: string | null;
  symbol: string;
  side: string; // BUY or SELL (for AsterDex)
  type: string;
  quantity: string;
  price: string | null;
  status: string;
  filledQuantity: string | null;
  avgFilledPrice: string | null;
  action: string | null; // OPEN or CLOSE (from LLM decision)
  direction: string | null; // LONG or SHORT (for OPEN actions)
  createdAt: string;
}

interface LiveTradingPanelProps {
  agentId?: string;
  limit?: number;
}

export default function LiveTradingPanel({ agentId, limit = 10 }: LiveTradingPanelProps) {
  const { data: orders, isLoading } = useQuery<AsterdexOrder[]>({
    queryKey: agentId ? ["/api/asterdex/orders", agentId] : ["/api/asterdex/orders"],
    refetchInterval: 5000, // Refetch every 5 seconds for live updates
  });

  const displayOrders = orders?.slice(0, limit) || [];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "FILLED":
        return "default";
      case "PENDING":
      case "PARTIALLY_FILLED":
        return "secondary";
      case "CANCELED":
        return "outline";
      case "REJECTED":
        return "destructive";
      default:
        return "outline";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "FILLED":
        return <CheckCircle2 className="w-3 h-3" />;
      case "PENDING":
      case "PARTIALLY_FILLED":
        return <Loader2 className="w-3 h-3 animate-spin" />;
      case "CANCELED":
        return <Clock className="w-3 h-3" />;
      case "REJECTED":
        return <XCircle className="w-3 h-3" />;
      default:
        return <Activity className="w-3 h-3" />;
    }
  };

  if (isLoading) {
    return (
      <Card className="p-6 border-card-border" data-testid="card-live-trading-loading">
        <div className="flex items-center gap-2 mb-4">
          <Activity className="w-5 h-5 text-primary animate-pulse" />
          <h3 className="text-lg font-bold text-primary cyber-glow font-cyber">
            Live Trading Orders
          </h3>
          <Badge variant="default" className="ml-auto">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-2"></span>
            LIVE
          </Badge>
        </div>
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center justify-between p-3 rounded-md bg-card/50 border border-border animate-pulse">
              <div className="h-4 bg-muted rounded w-32"></div>
              <div className="h-4 bg-muted rounded w-24"></div>
            </div>
          ))}
        </div>
      </Card>
    );
  }

  if (!orders || orders.length === 0) {
    return (
      <Card className="p-6 border-card-border" data-testid="card-live-trading-empty">
        <div className="flex items-center gap-2 mb-4">
          <Activity className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-bold text-primary cyber-glow font-cyber">
            Live Trading Orders
          </h3>
          <Badge variant="default" className="ml-auto">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-2"></span>
            LIVE
          </Badge>
        </div>
        <div className="text-center py-8 text-white/60">
          <Activity className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-mono">Waiting for trading signals...</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 border-card-border" data-testid="card-live-trading">
      <div className="flex items-center gap-2 mb-4">
        <Activity className="w-5 h-5 text-primary" />
        <h3 className="text-lg font-bold text-primary cyber-glow font-cyber">
          Live Trading Orders
        </h3>
        <Badge variant="default" className="ml-auto">
          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-2"></span>
          LIVE
        </Badge>
      </div>
      <div className="space-y-2 max-h-[400px] overflow-y-auto">
        {displayOrders.map((order) => (
          <div
            key={order.id}
            className="flex items-center justify-between p-3 rounded-md bg-card/30 border border-border/50 hover-elevate active-elevate-2 transition-all duration-300"
            data-testid={`order-${order.id}`}
          >
            <div className="flex items-center gap-3">
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  {order.action ? (
                    // Show OPEN/CLOSE with LONG/SHORT if available
                    <>
                      <Badge
                        variant={order.action === "OPEN" ? "default" : "secondary"}
                        className="flex items-center gap-1"
                      >
                        {order.action === "OPEN" ? (
                          <TrendingUp className="w-3 h-3" />
                        ) : (
                          <TrendingDown className="w-3 h-3" />
                        )}
                        <span className="font-mono text-xs">{order.action}</span>
                      </Badge>
                      {order.direction && (
                        <Badge
                          variant="outline"
                          className="flex items-center gap-1"
                        >
                          <span className="font-mono text-xs">{order.direction}</span>
                        </Badge>
                      )}
                    </>
                  ) : (
                    // Fallback to BUY/SELL if action is not available (backward compatibility)
                    <Badge
                      variant={order.side === "BUY" ? "default" : "destructive"}
                      className="flex items-center gap-1"
                    >
                      {order.side === "BUY" ? (
                        <TrendingUp className="w-3 h-3" />
                      ) : (
                        <TrendingDown className="w-3 h-3" />
                      )}
                      <span className="font-mono text-xs">{order.side}</span>
                    </Badge>
                  )}
                  <span className="text-sm font-bold text-foreground font-cyber">
                    {order.symbol}
                  </span>
                </div>
                <span className="text-xs text-white/60 font-mono mt-1">
                  {order.type} • {parseFloat(order.quantity).toFixed(6)} units
                  {order.price && ` @ $${parseFloat(order.price).toFixed(2)}`}
                </span>
              </div>
            </div>
            <div className="flex flex-col items-end gap-1">
              <Badge
                variant={getStatusColor(order.status)}
                className="flex items-center gap-1"
                data-testid={`badge-status-${order.id}`}
              >
                {getStatusIcon(order.status)}
                <span className="font-mono text-xs">{order.status}</span>
              </Badge>
              <span className="text-xs text-white/40 font-mono">
                {new Date(order.createdAt).toLocaleTimeString()}
              </span>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
