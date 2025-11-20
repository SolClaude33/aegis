import { useQuery } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import { Line } from "react-chartjs-2";
import type { Agent, PerformanceSnapshot, Trade, Position } from "@shared/schema";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Activity,
  FileText,
  Target,
  ExternalLink,
} from "lucide-react";
import AgentAvatar from "@/components/AgentAvatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function AgentDetail() {
  const [, params] = useRoute("/agent/:id");
  const agentId = params?.id;

  const { data: agent, isLoading: agentLoading } = useQuery<Agent>({
    queryKey: ["/api/agents", agentId],
    enabled: !!agentId,
  });

  const { data: performance, isLoading: performanceLoading } = useQuery<PerformanceSnapshot[]>({
    queryKey: ["/api/performance", agentId],
    enabled: !!agentId,
  });

  const { data: orders, isLoading: tradesLoading } = useQuery<any[]>({
    queryKey: ["/api/asterdex/orders", agentId],
    queryFn: async () => {
      const response = await fetch(`/api/asterdex/orders/${agentId}`);
      if (!response.ok) throw new Error("Failed to fetch orders");
      return response.json();
    },
    enabled: !!agentId,
  });

  const { data: positions, isLoading: positionsLoading } = useQuery<Position[]>({
    queryKey: ["/api/positions/agent", agentId],
    enabled: !!agentId,
  });

  if (agentLoading || performanceLoading || tradesLoading || positionsLoading) {
    return (
      <div className="min-h-screen bg-background p-6 space-y-6">
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!agent) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">Agent not found</p>
        <Link href="/">
          <Button variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Leaderboard
          </Button>
        </Link>
      </div>
    );
  }

  const pnl = Number(agent.totalPnL);
  const pnlPercentage = Number(agent.totalPnLPercentage);
  const isPositive = pnl >= 0;

  const chartData = {
    labels: (performance || []).map((s) => new Date(s.timestamp).toLocaleTimeString()),
    datasets: [
      {
        label: "Account Value",
        data: (performance || []).map((s) => Number(s.accountValue)),
        borderColor: "rgba(0, 212, 255, 1)",
        backgroundColor: "rgba(0, 212, 255, 0.1)",
        borderWidth: 2,
        pointRadius: 0,
        pointHoverRadius: 4,
        tension: 0.4,
        fill: true,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: "hsl(var(--card))",
        titleColor: "hsl(var(--card-foreground))",
        bodyColor: "hsl(var(--card-foreground))",
        borderColor: "hsl(var(--border))",
        borderWidth: 1,
        padding: 12,
        callbacks: {
          label: function (context: any) {
            return "$" + context.parsed.y.toLocaleString();
          },
        },
      },
    },
    scales: {
      x: {
        grid: {
          color: "hsl(var(--border) / 0.3)",
        },
        ticks: {
          color: "hsl(var(--muted-foreground))",
          maxRotation: 45,
          minRotation: 45,
          font: {
            family: "var(--font-mono)",
            size: 10,
          },
        },
      },
      y: {
        grid: {
          color: "hsl(var(--border) / 0.3)",
        },
        ticks: {
          color: "hsl(var(--muted-foreground))",
          callback: function (value: any) {
            return "$" + value.toLocaleString();
          },
          font: {
            family: "var(--font-mono)",
            size: 10,
          },
        },
      },
    },
  };

  return (
    <div className="min-h-screen bg-background p-6 space-y-8 cyber-scrollbar overflow-y-auto">
      <div className="flex items-center gap-4">
        <Link href="/">
          <Button variant="outline" size="icon" data-testid="button-back">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div className="flex items-center gap-4">
          <AgentAvatar iconName={agent.avatar} name={agent.name} size="xl" data-testid="avatar-agent" />
          <div>
            <h1 className="text-3xl font-bold text-primary cyber-glow font-cyber" data-testid="text-agent-name">
              {agent.name}
            </h1>
            <p className="text-muted-foreground font-mono" data-testid="text-agent-model">
              {agent.model}
            </p>
          </div>
        </div>
      </div>

      {agent.description && (
        <Card className="p-4 bg-card border-card-border">
          <p className="text-foreground font-mono" data-testid="text-agent-description">
            {agent.description}
          </p>
        </Card>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 bg-card border-card-border">
          <p className="text-sm text-muted-foreground font-mono mb-2">Current Capital</p>
          <p className="text-2xl font-bold text-primary font-mono" data-testid="text-current-capital">
            ${Number(agent.currentCapital).toLocaleString()}
          </p>
        </Card>
        <Card className="p-4 bg-card border-card-border">
          <p className="text-sm text-muted-foreground font-mono mb-2">Total PnL</p>
          <div className="flex items-center gap-2">
            {isPositive ? (
              <TrendingUp className="w-5 h-5 text-success" />
            ) : (
              <TrendingDown className="w-5 h-5 text-destructive" />
            )}
            <p
              className={`text-2xl font-bold font-mono ${
                isPositive ? "text-success" : "text-destructive"
              }`}
              data-testid="text-total-pnl"
            >
              {isPositive ? "+" : ""}${pnl.toLocaleString()}
            </p>
          </div>
          <p className={`text-sm font-mono ${isPositive ? "text-success" : "text-destructive"}`}>
            {isPositive ? "+" : ""}{pnlPercentage.toFixed(2)}%
          </p>
        </Card>
        <Card className="p-4 bg-card border-card-border">
          <p className="text-sm text-muted-foreground font-mono mb-2">Sharpe Ratio</p>
          <p className="text-2xl font-bold text-primary font-mono" data-testid="text-sharpe-ratio">
            {Number(agent.sharpeRatio).toFixed(2)}
          </p>
        </Card>
        <Card className="p-4 bg-card border-card-border">
          <p className="text-sm text-muted-foreground font-mono mb-2">Win Rate</p>
          <p className="text-2xl font-bold text-primary font-mono" data-testid="text-win-rate">
            {Number(agent.winRate).toFixed(1)}%
          </p>
        </Card>
      </div>

      <Card className="p-6 bg-card border-card-border">
        <h2 className="text-2xl font-bold text-primary mb-4 font-cyber flex items-center gap-2">
          <Activity className="w-6 h-6" />
          Performance History
        </h2>
        <div className="h-96" data-testid="chart-agent-performance">
          <Line data={chartData} options={chartOptions} />
        </div>
      </Card>

      {positions && positions.length > 0 && (
        <Card className="p-6 bg-card border-card-border">
          <h2 className="text-2xl font-bold text-primary mb-4 font-cyber flex items-center gap-2">
            <Target className="w-6 h-6" />
            Open Positions ({positions.length})
          </h2>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-mono">Asset</TableHead>
                  <TableHead className="font-mono">Side</TableHead>
                  <TableHead className="font-mono">Size</TableHead>
                  <TableHead className="font-mono">Entry Price</TableHead>
                  <TableHead className="font-mono">Current Price</TableHead>
                  <TableHead className="font-mono">Leverage</TableHead>
                  <TableHead className="font-mono">Unrealized PnL</TableHead>
                  <TableHead className="font-mono">Tx Hash</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {positions.map((position) => {
                  const positionPnL = Number(position.unrealizedPnL);
                  const positionIsPositive = positionPnL >= 0;
                  
                  return (
                    <TableRow key={position.id}>
                      <TableCell className="font-mono font-bold" data-testid={`text-position-asset-${position.id}`}>
                        {position.asset}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={position.side === "LONG" ? "default" : "destructive"}
                          data-testid={`badge-position-side-${position.id}`}
                        >
                          {position.side}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono" data-testid={`text-position-size-${position.id}`}>
                        {Number(position.size).toFixed(4)}
                      </TableCell>
                      <TableCell className="font-mono" data-testid={`text-position-entry-${position.id}`}>
                        ${Number(position.entryPrice).toLocaleString()}
                      </TableCell>
                      <TableCell className="font-mono" data-testid={`text-position-current-${position.id}`}>
                        ${Number(position.currentPrice).toLocaleString()}
                      </TableCell>
                      <TableCell className="font-mono" data-testid={`text-position-leverage-${position.id}`}>
                        {position.leverage}x
                      </TableCell>
                      <TableCell
                        className={`font-mono font-bold ${
                          positionIsPositive ? "text-success" : "text-destructive"
                        }`}
                        data-testid={`text-position-pnl-${position.id}`}
                      >
                        {positionIsPositive ? "+" : ""}${positionPnL.toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <a
                          href={`https://bscscan.com/tx/${position.openTxHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-primary hover:underline"
                          data-testid={`link-position-tx-${position.id}`}
                        >
                          <span className="font-mono text-xs">
                            {position.openTxHash.slice(0, 6)}...{position.openTxHash.slice(-4)}
                          </span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}

      <Card className="p-6 bg-card border-card-border">
        <h2 className="text-2xl font-bold text-primary mb-4 font-cyber flex items-center gap-2">
          <FileText className="w-6 h-6" />
          Trade History ({orders?.length || 0})
        </h2>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="font-mono">Symbol</TableHead>
                <TableHead className="font-mono">Side</TableHead>
                <TableHead className="font-mono">Type</TableHead>
                <TableHead className="font-mono">Quantity</TableHead>
                <TableHead className="font-mono">Avg Price</TableHead>
                <TableHead className="font-mono">Filled Qty</TableHead>
                <TableHead className="font-mono">Status</TableHead>
                <TableHead className="font-mono">Strategy</TableHead>
                <TableHead className="font-mono">Created At</TableHead>
                <TableHead className="font-mono">Tx Hash</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders && orders.length > 0 ? (
                orders.slice(0, 100).map((order: any) => {
                  const isBuy = order.side === "BUY";
                  const isFilled = order.status === "FILLED";
                  
                  return (
                    <TableRow key={order.id}>
                      <TableCell className="font-mono font-bold" data-testid={`text-order-symbol-${order.id}`}>
                        {order.symbol}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={isBuy ? "default" : "destructive"}
                          data-testid={`badge-order-side-${order.id}`}
                        >
                          {order.side}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono" data-testid={`text-order-type-${order.id}`}>
                        {order.type}
                      </TableCell>
                      <TableCell className="font-mono" data-testid={`text-order-quantity-${order.id}`}>
                        {Number(order.quantity).toFixed(6)}
                      </TableCell>
                      <TableCell className="font-mono" data-testid={`text-order-price-${order.id}`}>
                        {order.avgFilledPrice ? `$${Number(order.avgFilledPrice).toLocaleString()}` : "-"}
                      </TableCell>
                      <TableCell className="font-mono" data-testid={`text-order-filled-${order.id}`}>
                        {Number(order.filledQuantity || 0).toFixed(6)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={isFilled ? "default" : order.status === "REJECTED" ? "destructive" : "outline"}
                          data-testid={`badge-order-status-${order.id}`}
                        >
                          {order.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground" data-testid={`text-order-strategy-${order.id}`}>
                        {order.strategy || "-"}
                      </TableCell>
                      <TableCell className="font-mono text-muted-foreground text-xs" data-testid={`text-order-created-${order.id}`}>
                        {new Date(order.createdAt).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        {order.txHash ? (
                          <a
                            href={`https://bscscan.com/tx/${order.txHash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-primary hover:underline"
                            data-testid={`link-order-tx-${order.id}`}
                          >
                            <span className="font-mono text-xs">
                              {order.txHash.slice(0, 6)}...{order.txHash.slice(-4)}
                            </span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        ) : (
                          <span className="font-mono text-xs text-muted-foreground">-</span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={10} className="text-center text-muted-foreground">
                    No trades yet
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
