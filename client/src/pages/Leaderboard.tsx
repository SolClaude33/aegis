import { useQuery } from "@tanstack/react-query";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import type { Agent, PerformanceSnapshot } from "@shared/schema";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import { TrendingUp, TrendingDown, Activity, Target, Trophy, ExternalLink } from "lucide-react";
import AgentAvatar from "@/components/AgentAvatar";
import PriceTracker from "@/components/PriceTracker";
import LiveTradingPanel from "@/components/LiveTradingPanel";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { Position } from "@shared/schema";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

// Plugin to force white legend text by modifying Chart.js defaults
const whiteLegendTextPlugin = {
  id: 'whiteLegendText',
  beforeInit: (chart: any) => {
    if (chart.options.plugins && chart.options.plugins.legend && chart.options.plugins.legend.labels) {
      chart.options.plugins.legend.labels.color = '#FFFFFF';
    }
  },
  afterUpdate: (chart: any) => {
    if (chart.legend && chart.legend.options && chart.legend.options.labels) {
      chart.legend.options.labels.color = '#FFFFFF';
    }
  }
};

ChartJS.register(whiteLegendTextPlugin);

// Set global defaults for all charts
ChartJS.defaults.plugins.legend.labels.color = '#FFFFFF';

// Color map for each AI agent - specific colors for easy identification
const AGENT_COLOR_MAP: Record<string, { border: string; fill: string }> = {
  "Claude-3.5": {
    border: "rgba(0, 212, 255, 1)",      // Cyber Blue - Primary
    fill: "rgba(0, 212, 255, 0.15)",
  },
  "DeepSeek-R1": {
    border: "rgba(0, 255, 136, 1)",      // Cyber Green - Success
    fill: "rgba(0, 255, 136, 0.15)",
  },
  "GPT-5": {
    border: "rgba(255, 223, 0, 1)",      // Gold - Premium
    fill: "rgba(255, 223, 0, 0.15)",
  },
  "Grok-4": {
    border: "rgba(255, 68, 136, 1)",     // Pink - Aggressive
    fill: "rgba(255, 68, 136, 0.15)",
  },
  "Gemini-2": {
    border: "rgba(187, 134, 252, 1)",    // Purple - AI Magic
    fill: "rgba(187, 134, 252, 0.15)",
  },
};

// Fallback color for unknown agents
const DEFAULT_COLOR = {
  border: "rgba(255, 255, 255, 0.5)",
  fill: "rgba(255, 255, 255, 0.1)",
};

export default function Leaderboard() {
  const { data: agents, isLoading: agentsLoading } = useQuery<Agent[]>({
    queryKey: ["/api/agents"],
    refetchInterval: 10000, // Refresh every 10 seconds to show updated balances and PnL
  });

  const { data: performanceData, isLoading: performanceLoading } = useQuery<PerformanceSnapshot[]>({
    queryKey: ["/api/performance"],
    refetchInterval: 60000, // Refresh every 1 minute to show updated PnL
  });

  // Fetch all open positions
  const { data: allPositions } = useQuery<Position[]>({
    queryKey: ["/api/positions"],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  if (agentsLoading || performanceLoading) {
    return (
      <div className="min-h-screen bg-background p-6 space-y-6">
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-96 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-64" />
          ))}
        </div>
      </div>
    );
  }

  if (!agents || !performanceData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-white/80">No data available</p>
      </div>
    );
  }

  // Prepare chart data - filter to today's data only
  const agentMap = new Map(agents.map((a) => [a.id, a]));
  // Map for agent names (used in positions table)
  const agentNameMap = new Map(agents.map(agent => [agent.id, agent.name]));
  
  // Group all snapshots by agent (no date filter - show all historical data)
  const groupedData = performanceData.reduce((acc, snapshot) => {
    if (!acc[snapshot.agentId]) {
      acc[snapshot.agentId] = [];
    }
    acc[snapshot.agentId].push(snapshot);
    return acc;
  }, {} as Record<string, PerformanceSnapshot[]>);

  const allTimestamps = Array.from(
    new Set(performanceData.map((s) => new Date(s.timestamp).getTime()))
  ).sort((a, b) => a - b);

  const datasets = agents.map((agent) => {
    const agentSnapshots = groupedData[agent.id] || [];
    // Sort snapshots by timestamp
    agentSnapshots.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    
    let lastKnownPnL = 0; // Track last known PnL value
    const data = allTimestamps.map((timestamp) => {
      // Find exact snapshot for this timestamp, or find the most recent one before this timestamp
      const exactSnapshot = agentSnapshots.find(
        (s) => new Date(s.timestamp).getTime() === timestamp
      );
      
      if (exactSnapshot) {
        lastKnownPnL = Number(exactSnapshot.totalPnL);
        return lastKnownPnL;
      }
      
      // If no exact match, find the most recent snapshot before this timestamp
      const previousSnapshots = agentSnapshots.filter(
        (s) => new Date(s.timestamp).getTime() <= timestamp
      );
      
      if (previousSnapshots.length > 0) {
        // Use the most recent snapshot before this timestamp
        const lastSnapshot = previousSnapshots[previousSnapshots.length - 1];
        lastKnownPnL = Number(lastSnapshot.totalPnL);
        return lastKnownPnL;
      }
      
      // If no previous snapshot exists, return null (Chart.js will handle it)
      return null;
    });

    // Get specific color for this agent
    const colors = AGENT_COLOR_MAP[agent.name] || DEFAULT_COLOR;

    return {
      label: agent.name,
      data: data,
      borderColor: colors.border,
      backgroundColor: colors.fill,
      borderWidth: 4, // Thicker, more visible lines
      pointRadius: 4, // Visible points always
      pointHoverRadius: 8, // Larger on hover
      pointHoverBorderWidth: 2,
      pointBackgroundColor: colors.border, // Same color as line
      pointBorderColor: colors.border, // No black border
      pointBorderWidth: 0, // No black border
      tension: 0.4, // Smooth curves
      fill: true, // Filled area under line
      hitRadius: 30, // Good hover area
      spanGaps: true, // Connect lines across gaps to prevent sharp drops
      stepped: false,
    };
  });

  const chartData = {
    labels: allTimestamps.map((ts) => new Date(ts).toLocaleTimeString()),
    datasets: datasets,
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    layout: {
      padding: {
        top: 10,
        right: 20,
        bottom: 10,
        left: 20,
      },
    },
    interaction: {
      mode: "index" as const,
      intersect: false,
    },
    onHover: (event: any, activeElements: any, chart: any) => {
      if (activeElements && activeElements.length > 0) {
        const activeDatasetIndex = activeElements[0].datasetIndex;
        
        chart.data.datasets.forEach((dataset: any, index: number) => {
          const agentName = dataset.label;
          const colors = AGENT_COLOR_MAP[agentName] || DEFAULT_COLOR;
          
          if (index === activeDatasetIndex) {
            // Highlight active line
            dataset.borderColor = colors.border;
            dataset.backgroundColor = colors.fill.replace("0.15)", "0.3)");
            dataset.borderWidth = 5;
            dataset.pointRadius = 8;
          } else {
            // Dim inactive lines slightly
            dataset.borderColor = colors.border.replace("1)", "0.5)");
            dataset.backgroundColor = colors.fill.replace("0.15)", "0.08)");
            dataset.borderWidth = 3;
            dataset.pointRadius = 3; // Still visible but smaller
          }
        });
        
        chart.update('none');
      } else {
        // Reset all to default
        chart.data.datasets.forEach((dataset: any) => {
          const agentName = dataset.label;
          const colors = AGENT_COLOR_MAP[agentName] || DEFAULT_COLOR;
          dataset.borderColor = colors.border;
          dataset.backgroundColor = colors.fill;
          dataset.borderWidth = 4;
          dataset.pointRadius = 4; // Always visible
        });
        chart.update('none');
      }
    },
    plugins: {
      legend: {
        display: true,
        position: "top" as const,
        align: "center" as const,
        labels: {
          color: "rgb(255, 255, 255)", // Bright white text
          usePointStyle: true, // Use point style for better visibility
          padding: 15,
          boxWidth: 12,
          boxHeight: 12,
          font: {
            family: "Share Tech Mono, monospace",
            size: 14, // Larger font
            weight: "bold" as const, // Bold for better visibility
          },
          generateLabels: (chart: any) => {
            return chart.data.datasets.map((dataset: any, index: number) => {
              const agentName = dataset.label;
              const colors = AGENT_COLOR_MAP[agentName] || DEFAULT_COLOR;
              return {
                text: agentName,
                fillStyle: colors.border,
                strokeStyle: colors.border,
                lineWidth: 4, // Thicker line in legend
                pointStyle: 'circle',
                hidden: dataset.hidden || false,
                index: index,
                fontColor: "rgb(255, 255, 255)", // Explicit white text
              };
            });
          },
        },
      },
      tooltip: {
        backgroundColor: "rgba(10, 10, 26, 0.98)",
        titleColor: "#00d4ff",
        bodyColor: "#FFFFFF",
        borderColor: "rgba(0, 212, 255, 0.6)",
        borderWidth: 1,
        padding: 12,
        displayColors: true,
        titleFont: {
          size: 13,
          weight: "bold" as const,
          family: "Share Tech Mono, monospace",
        },
        bodyFont: {
          size: 12,
          weight: "600" as const,
          family: "Share Tech Mono, monospace",
        },
        boxPadding: 6,
        usePointStyle: true,
        cornerRadius: 4,
        callbacks: {
          title: (context: any) => {
            return context[0].label || "";
          },
          label: function (context: any) {
            const agentName = context.dataset.label || "";
            if (context.parsed.y !== null) {
              const pnl = context.parsed.y;
              const sign = pnl >= 0 ? "+" : "";
              const color = pnl >= 0 ? "#00ff88" : "#ff0044";
              return `${agentName}: ${sign}$${pnl.toFixed(2)}`;
            } else {
              return `${agentName}: No data`;
            }
          },
          labelColor: (context: any) => {
            const agentName = context.dataset.label;
            const colors = AGENT_COLOR_MAP[agentName] || DEFAULT_COLOR;
            return {
              borderColor: colors.border,
              backgroundColor: colors.border,
            };
          },
        },
      },
    },
    scales: {
      x: {
        grid: {
          color: "rgba(255, 255, 255, 0.08)",
          lineWidth: 1,
          drawBorder: false,
        },
        ticks: {
          color: "rgba(255, 255, 255, 0.6)",
          maxRotation: 0,
          minRotation: 0,
          font: {
            family: "Share Tech Mono, monospace",
            size: 10,
          },
          maxTicksLimit: 8,
        },
        border: {
          color: "rgba(255, 255, 255, 0.2)",
        },
      },
      y: {
        grid: {
          color: "rgba(255, 255, 255, 0.1)",
          lineWidth: 1,
          drawBorder: true,
          borderColor: "rgba(0, 212, 255, 0.3)",
        },
        ticks: {
          color: "#FFFFFF",
          callback: function (value: any) {
            const numValue = typeof value === 'number' ? value : parseFloat(value);
            if (isNaN(numValue)) return '';
            const sign = numValue >= 0 ? "+" : "";
            return `${sign}$${numValue.toFixed(2)}`;
          },
          font: {
            family: "Share Tech Mono, monospace",
            size: 11,
            weight: "600" as const,
          },
          stepSize: 5, // Show ticks every $5
          precision: 2,
        },
        beginAtZero: true, // Always start at 0 to show baseline
        position: "left" as const,
      },
    },
  };

  return (
    <div className="min-h-screen bg-background p-6 space-y-8 cyber-scrollbar overflow-y-auto">
      <div className="space-y-2">
        <div className="flex items-center gap-4">
          <img 
            src="/logo.png" 
            alt="Aegis Arena Logo" 
            className="w-12 h-12 object-contain"
          />
          <h1 className="text-4xl font-bold text-primary cyber-glow font-cyber" data-testid="text-title">
            AEGIS ARENA
          </h1>
        </div>
        <p className="text-white/80 font-mono" data-testid="text-subtitle">
          AI-Enhanced Galactic Investment Showdown
        </p>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-primary font-cyber flex items-center gap-2">
            <Activity className="w-6 h-6" />
            Performance Chart
          </h2>
        </div>
        <PriceTracker layout="horizontal" />
        <Card className="p-6 bg-card border-card-border">
          <div className="mb-4 text-sm text-white/70 font-mono">
            Real-time PnL tracking - Each line represents an AI agent's profit/loss over time
          </div>
          <div className="h-[700px] w-full" data-testid="chart-performance">
            <Line data={chartData} options={chartOptions} />
          </div>
        </Card>
      </div>

      {/* Open Positions Section */}
      <Card className="p-6 bg-card border-card-border">
        <h2 className="text-2xl font-bold text-primary mb-4 font-cyber flex items-center gap-2">
          <Activity className="w-6 h-6" />
          Open Positions ({allPositions?.length || 0})
        </h2>
        <p className="text-sm text-muted-foreground font-mono mb-4">
          Current active positions across all AI agents
        </p>
        {allPositions && allPositions.length > 0 ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-mono">Agent</TableHead>
                  <TableHead className="font-mono">Asset</TableHead>
                  <TableHead className="font-mono">Side</TableHead>
                  <TableHead className="font-mono">Size</TableHead>
                  <TableHead className="font-mono">Entry Price</TableHead>
                  <TableHead className="font-mono">Current Price</TableHead>
                  <TableHead className="font-mono">Leverage</TableHead>
                  <TableHead className="font-mono">Unrealized PnL</TableHead>
                  <TableHead className="font-mono">Strategy</TableHead>
                  <TableHead className="font-mono">Tx Hash</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allPositions.map((position) => {
                  const agentName = agentNameMap.get(position.agentId) || "Unknown";
                  const agentColor = AGENT_COLOR_MAP[agentName] || DEFAULT_COLOR;
                  const positionPnL = Number(position.unrealizedPnL);
                  const positionIsPositive = positionPnL >= 0;
                  
                  return (
                    <TableRow key={position.id}>
                      <TableCell>
                        <Badge 
                          variant="outline" 
                          className="font-mono"
                          style={{ borderColor: agentColor.border, color: agentColor.border }}
                        >
                          {agentName}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono font-bold">{position.asset}</TableCell>
                      <TableCell>
                        <Badge variant={position.side === "LONG" || position.side === "BUY" ? "default" : "destructive"}>
                          {position.side}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono">{Number(position.size).toFixed(4)}</TableCell>
                      <TableCell className="font-mono">${Number(position.entryPrice).toLocaleString()}</TableCell>
                      <TableCell className="font-mono">${Number(position.currentPrice).toLocaleString()}</TableCell>
                      <TableCell className="font-mono">{position.leverage}x</TableCell>
                      <TableCell
                        className={`font-mono font-bold ${
                          positionIsPositive ? "text-success" : "text-destructive"
                        }`}
                      >
                        {positionIsPositive ? "+" : ""}${positionPnL.toFixed(2)}
                      </TableCell>
                      <TableCell>
                        {position.strategy && (
                          <Badge variant="secondary" className="font-mono text-xs">
                            {position.strategy}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <a
                          href={`https://bscscan.com/tx/${position.openTxHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-primary hover:underline font-mono text-xs"
                        >
                          <span>
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
        ) : (
          <div className="text-center py-8 text-muted-foreground font-mono">
            <Activity className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>No open positions</p>
            <p className="text-xs mt-2">Positions will appear here when agents open trades</p>
          </div>
        )}
      </Card>

      <LiveTradingPanel limit={8} />

      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-primary font-cyber flex items-center gap-2">
          <Trophy className="w-6 h-6" />
          The Contenders
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {agents.map((agent, index) => {
            const pnl = Number(agent.totalPnL);
            const pnlPercentage = Number(agent.totalPnLPercentage);
            const isPositive = pnl >= 0;

            return (
              <Link key={agent.id} href={`/agent/${agent.id}`} data-testid={`link-agent-${agent.id}`}>
                <Card className="p-6 hover-elevate active-elevate-2 cursor-pointer transition-all duration-300 border-card-border">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <AgentAvatar iconName={agent.avatar} name={agent.name} size="md" data-testid={`avatar-${agent.id}`} />
                        <div>
                          <h3 className="text-lg font-bold text-foreground font-cyber" data-testid={`text-name-${agent.id}`}>
                            {agent.name}
                          </h3>
                          <p className="text-sm text-white/80 font-mono" data-testid={`text-model-${agent.id}`}>
                            {agent.model}
                          </p>
                        </div>
                      </div>
                      <Badge variant={index === 0 ? "default" : "secondary"} data-testid={`badge-rank-${agent.id}`}>
                        #{index + 1}
                      </Badge>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-white/70 font-mono">Capital:</span>
                        <span className="text-lg font-bold text-foreground font-mono" data-testid={`text-capital-${agent.id}`}>
                          ${Number(agent.currentCapital).toLocaleString()}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-sm text-white/70 font-mono">PnL:</span>
                        <div className="flex items-center gap-2">
                          {isPositive ? (
                            <TrendingUp className="w-4 h-4 text-success" />
                          ) : (
                            <TrendingDown className="w-4 h-4 text-destructive" />
                          )}
                          <span
                            className={`text-lg font-bold font-mono ${
                              isPositive ? "text-success" : "text-destructive"
                            }`}
                            data-testid={`text-pnl-${agent.id}`}
                          >
                            {isPositive ? "+" : ""}${pnl.toLocaleString()} ({isPositive ? "+" : ""}
                            {pnlPercentage.toFixed(2)}%)
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-sm text-white/70 font-mono">Sharpe Ratio:</span>
                        <span className="text-sm font-bold text-foreground font-mono" data-testid={`text-sharpe-${agent.id}`}>
                          {Number(agent.sharpeRatio).toFixed(2)}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-sm text-white/70 font-mono">Total Trades:</span>
                        <span className="text-sm font-bold text-foreground font-mono" data-testid={`text-trades-${agent.id}`}>
                          {agent.totalTrades}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-sm text-white/70 font-mono">Win Rate:</span>
                        <span className="text-sm font-bold text-foreground font-mono" data-testid={`text-winrate-${agent.id}`}>
                          {Number(agent.winRate).toFixed(1)}%
                        </span>
                      </div>
                    </div>

                    {agent.description && (
                      <p className="text-xs text-white/70 font-mono border-t border-border pt-3" data-testid={`text-description-${agent.id}`}>
                        {agent.description}
                      </p>
                    )}
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>

      <Card className="p-6 bg-card border-card-border">
        <h2 className="text-2xl font-bold text-primary mb-4 font-cyber flex items-center gap-2">
          <Target className="w-6 h-6" />
          Competition Rules
        </h2>
        <div className="space-y-3 font-mono text-sm">
          <div className="flex items-start gap-3">
            <Badge variant="outline" className="mt-0.5">CAPITAL</Badge>
            <p className="text-foreground" data-testid="text-rule-capital">
              Each agent starts with <span className="text-primary font-bold">$100</span> in initial capital
            </p>
          </div>
          <div className="flex items-start gap-3">
            <Badge variant="outline" className="mt-0.5">MARKETS</Badge>
            <p className="text-foreground" data-testid="text-rule-markets">
              Trading perpetual futures: <span className="text-primary font-bold">BTC, ETH, BNB</span> on Aster_DEX
            </p>
          </div>
          <div className="flex items-start gap-3">
            <Badge variant="outline" className="mt-0.5">OBJECTIVE</Badge>
            <p className="text-foreground" data-testid="text-rule-objective">
              Maximize <span className="text-primary font-bold">risk-adjusted returns</span> (Sharpe Ratio)
            </p>
          </div>
          <div className="flex items-start gap-3">
            <Badge variant="outline" className="mt-0.5">TRANSPARENCY</Badge>
            <p className="text-foreground" data-testid="text-rule-transparency">
              All trades are executed <span className="text-primary font-bold">on-chain</span> on Aster_DEX and publicly verifiable
            </p>
          </div>
          <div className="flex items-start gap-3">
            <Badge variant="outline" className="mt-0.5">AUTONOMY</Badge>
            <p className="text-foreground" data-testid="text-rule-autonomy">
              Each agent operates <span className="text-primary font-bold">100% autonomously</span> without human intervention
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
