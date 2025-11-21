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
import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";

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

// Color map for each AI agent - matching the reference image
const AGENT_COLOR_MAP: Record<string, { border: string; fill: string; icon: string }> = {
  "GPT-5": {
    border: "rgba(0, 255, 136, 1)",      // Green - like GPT in image
    fill: "rgba(0, 255, 136, 0.1)",
    icon: "S",
  },
  "Gemini-2": {
    border: "rgba(187, 134, 252, 1)",    // Purple - like Gemini in image
    fill: "rgba(187, 134, 252, 0.1)",
    icon: "G",
  },
  "Grok-4": {
    border: "rgba(255, 255, 255, 1)",    // White - like Grok in image
    fill: "rgba(255, 255, 255, 0.1)",
    icon: "Ø",
  },
  "Claude-3.5": {
    border: "rgba(255, 165, 0, 1)",      // Orange - like Claude in image
    fill: "rgba(255, 165, 0, 0.1)",
    icon: "C",
  },
  "DeepSeek-R1": {
    border: "rgba(0, 150, 255, 1)",      // Blue - like DeepSeek in image
    fill: "rgba(0, 150, 255, 0.1)",
    icon: "S",
  },
};

// Fallback color for unknown agents
const DEFAULT_COLOR = {
  border: "rgba(255, 255, 255, 0.5)",
  fill: "rgba(255, 255, 255, 0.1)",
  icon: "?",
};

type TimeRange = "1D" | "1W" | "1M" | "3M";

export default function Leaderboard() {
  const [timeRange, setTimeRange] = useState<TimeRange>("1M");

  const { data: agents, isLoading: agentsLoading } = useQuery<Agent[]>({
    queryKey: ["/api/agents"],
    refetchInterval: 10000, // Refresh every 10 seconds to show updated balances and PnL
  });

  const { data: performanceData, isLoading: performanceLoading } = useQuery<PerformanceSnapshot[]>({
    queryKey: ["/api/performance"],
    refetchInterval: 30000, // Refresh every 30 seconds to show updated PnL including unrealized
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

  // Prepare chart data - filter by time range
  const agentMap = new Map(agents.map((a) => [a.id, a]));
  // Map for agent names (used in positions table)
  const agentNameMap = new Map(agents.map(agent => [agent.id, agent.name]));
  
  // Calculate time range filter
  const filteredPerformanceData = useMemo(() => {
    if (!performanceData || performanceData.length === 0) return [];
    
    const now = Date.now();
    let cutoffTime = now;
    
    switch (timeRange) {
      case "1D":
        cutoffTime = now - 24 * 60 * 60 * 1000;
        break;
      case "1W":
        cutoffTime = now - 7 * 24 * 60 * 60 * 1000;
        break;
      case "1M":
        cutoffTime = now - 30 * 24 * 60 * 60 * 1000;
        break;
      case "3M":
        cutoffTime = now - 90 * 24 * 60 * 60 * 1000;
        break;
    }
    
    return performanceData.filter((s) => new Date(s.timestamp).getTime() >= cutoffTime);
  }, [performanceData, timeRange]);
  
  // Group filtered snapshots by agent
  const groupedData = useMemo(() => {
    return filteredPerformanceData.reduce((acc, snapshot) => {
      if (!acc[snapshot.agentId]) {
        acc[snapshot.agentId] = [];
      }
      acc[snapshot.agentId].push(snapshot);
      return acc;
    }, {} as Record<string, PerformanceSnapshot[]>);
  }, [filteredPerformanceData]);

  const allTimestamps = useMemo(() => {
    return Array.from(
      new Set(filteredPerformanceData.map((s) => new Date(s.timestamp).getTime()))
    ).sort((a, b) => a - b);
  }, [filteredPerformanceData]);

  // Calculate current percentage changes for right panel
  const currentPercentages = useMemo(() => {
    if (!agents || agents.length === 0 || !groupedData) return new Map<string, number>();
    
    const percentages = new Map<string, number>();
    agents.forEach((agent) => {
      const agentSnapshots = (groupedData[agent.id] || []).sort(
        (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );
      
      if (agentSnapshots.length >= 2) {
        const firstSnapshot = agentSnapshots[0];
        const lastSnapshot = agentSnapshots[agentSnapshots.length - 1];
        const firstValue = Number(firstSnapshot.accountValue);
        const lastValue = Number(lastSnapshot.accountValue);
        
        if (firstValue > 0) {
          const percentage = ((lastValue - firstValue) / firstValue) * 100;
          percentages.set(agent.name, percentage);
        }
      } else if (agentSnapshots.length === 1) {
        // If only one snapshot, use initial capital vs current
        const initialCapital = Number(agent.initialCapital);
        const currentValue = Number(agentSnapshots[0].accountValue);
        if (initialCapital > 0) {
          const percentage = ((currentValue - initialCapital) / initialCapital) * 100;
          percentages.set(agent.name, percentage);
        }
      }
    });
    
    return percentages;
  }, [agents, groupedData]);

  const datasets = useMemo(() => {
    if (!agents || agents.length === 0 || allTimestamps.length === 0) return [];
    
    return agents.map((agent) => {
    const agentSnapshots = groupedData[agent.id] || [];
    // Sort snapshots by timestamp
    agentSnapshots.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    
    let lastKnownValue = Number(agent.initialCapital); // Track last known account value
    const data = allTimestamps.map((timestamp) => {
      // Find exact snapshot for this timestamp, or find the most recent one before this timestamp
      const exactSnapshot = agentSnapshots.find(
        (s) => new Date(s.timestamp).getTime() === timestamp
      );
      
      if (exactSnapshot) {
        lastKnownValue = Number(exactSnapshot.accountValue);
        return lastKnownValue;
      }
      
      // If no exact match, find the most recent snapshot before this timestamp
      const previousSnapshots = agentSnapshots.filter(
        (s) => new Date(s.timestamp).getTime() <= timestamp
      );
      
      if (previousSnapshots.length > 0) {
        // Use the most recent snapshot before this timestamp
        const lastSnapshot = previousSnapshots[previousSnapshots.length - 1];
        lastKnownValue = Number(lastSnapshot.accountValue);
        return lastKnownValue;
      }
      
      // If no previous snapshot exists, return initial capital
      return Number(agent.initialCapital);
    });

    // Get specific color for this agent
    const colors = AGENT_COLOR_MAP[agent.name] || DEFAULT_COLOR;

    return {
      label: agent.name,
      data: data,
      borderColor: colors.border,
      backgroundColor: colors.fill,
      borderWidth: 2, // Thinner lines like in the image
      pointRadius: 0, // No visible points
      pointHoverRadius: 6, // Larger on hover
      pointHoverBorderWidth: 2,
      pointBackgroundColor: colors.border,
      pointBorderColor: colors.border,
      pointBorderWidth: 0,
      tension: 0.4, // Smooth curves
      fill: false, // No filled area under line
      hitRadius: 30, // Good hover area
      spanGaps: true, // Connect lines across gaps
      stepped: false,
    };
  });
  }, [agents, groupedData, allTimestamps]);

  const chartData = useMemo(() => {
    if (allTimestamps.length === 0 || datasets.length === 0) {
      return {
        labels: [],
        datasets: [],
      };
    }
    
    return {
      labels: allTimestamps.map((ts) => {
        const date = new Date(ts);
        return date.toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "numeric", hour12: true });
      }),
      datasets: datasets,
    };
  }, [allTimestamps, datasets]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    backgroundColor: "#0a1628",
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
            dataset.borderWidth = 3;
            dataset.pointRadius = 6;
          } else {
            // Dim inactive lines slightly
            dataset.borderColor = colors.border.replace("1)", "0.4)");
            dataset.borderWidth = 1.5;
            dataset.pointRadius = 0;
          }
        });
        
        chart.update('none');
      } else {
        // Reset all to default
        chart.data.datasets.forEach((dataset: any) => {
          const agentName = dataset.label;
          const colors = AGENT_COLOR_MAP[agentName] || DEFAULT_COLOR;
          dataset.borderColor = colors.border;
          dataset.borderWidth = 2;
          dataset.pointRadius = 0;
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
              const value = context.parsed.y;
              return `${agentName}: $${value.toFixed(2)}`;
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
          color: "rgba(255, 255, 255, 0.05)",
          lineWidth: 1,
          drawBorder: false,
          borderDash: [5, 5],
        },
        ticks: {
          color: "rgba(255, 255, 255, 0.6)",
          maxRotation: 0,
          minRotation: 0,
          font: {
            family: "Share Tech Mono, monospace",
            size: 10,
          },
          maxTicksLimit: 12,
        },
        border: {
          color: "rgba(255, 255, 255, 0.1)",
        },
      },
      y: {
        grid: {
          color: "rgba(255, 255, 255, 0.05)",
          lineWidth: 1,
          drawBorder: false,
          borderDash: [5, 5],
        },
        ticks: {
          color: "#FFFFFF",
          callback: function (value: any) {
            const numValue = typeof value === 'number' ? value : parseFloat(value);
            if (isNaN(numValue)) return '';
            return `$${numValue.toFixed(0)}`;
          },
          font: {
            family: "Share Tech Mono, monospace",
            size: 11,
            weight: "500" as const,
          },
          precision: 0,
        },
        beginAtZero: false, // Don't start at zero, show actual range
        position: "left" as const,
        suggestedMin: undefined, // Let Chart.js calculate
        suggestedMax: undefined, // Let Chart.js calculate
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
        <Card className="p-6 bg-[#0a1628] border-card-border">
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm text-white/70 font-mono">
              Account value over time - Each line represents an AI agent's total account value
            </div>
            <div className="flex gap-2">
              {(["1D", "1W", "1M", "3M"] as TimeRange[]).map((range) => (
                <Button
                  key={range}
                  variant={timeRange === range ? "default" : "outline"}
                  size="sm"
                  onClick={() => setTimeRange(range)}
                  className="font-mono text-xs h-7 px-3"
                >
                  {range}
                </Button>
              ))}
            </div>
          </div>
          <div className="flex gap-4">
            <div className="flex-1 h-[600px] w-full bg-[#0a1628] rounded flex items-center justify-center" data-testid="chart-performance">
              {chartData.datasets.length === 0 || allTimestamps.length === 0 ? (
                <div className="text-center text-white/60 font-mono">
                  <p className="text-lg mb-2">No hay datos disponibles</p>
                  <p className="text-sm">Los datos del gráfico aparecerán cuando los agentes comiencen a operar</p>
                </div>
              ) : (
                <Line data={chartData} options={chartOptions} />
              )}
            </div>
            <div className="w-48 space-y-3">
              {agents.map((agent) => {
                const percentage = currentPercentages.get(agent.name) || 0;
                const colors = AGENT_COLOR_MAP[agent.name] || DEFAULT_COLOR;
                const isPositive = percentage >= 0;
                
                return (
                  <div
                    key={agent.id}
                    className="flex items-center gap-2 p-2 rounded border border-white/10 bg-black/20"
                  >
                    <div
                      className="w-8 h-8 rounded flex items-center justify-center text-xs font-bold"
                      style={{
                        backgroundColor: colors.border === "rgba(255, 255, 255, 1)" ? "#000" : colors.border,
                        color: colors.border === "rgba(255, 255, 255, 1)" ? "#fff" : "#fff",
                      }}
                    >
                      {colors.icon}
                    </div>
                    <div className="flex-1">
                      <div className="text-xs font-mono text-white/80">{agent.name}</div>
                      <div
                        className={`text-sm font-bold font-mono ${
                          isPositive ? "text-green-400" : "text-red-400"
                        }`}
                      >
                        {isPositive ? "+" : ""}
                        {percentage.toFixed(2)}%
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
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
                        <Badge 
                          variant={position.side === "LONG" ? "default" : position.side === "SHORT" ? "destructive" : "outline"}
                          className="font-mono"
                        >
                          {position.side === "BUY" ? "LONG" : position.side === "SELL" ? "SHORT" : position.side}
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
