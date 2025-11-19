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
import { TrendingUp, TrendingDown, Activity, Target, Trophy } from "lucide-react";
import AgentAvatar from "@/components/AgentAvatar";
import PriceTracker from "@/components/PriceTracker";
import LiveTradingPanel from "@/components/LiveTradingPanel";

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

const AGENT_COLORS = [
  "rgba(0, 255, 255, 1)",      // Bright Cyan
  "rgba(0, 255, 136, 1)",      // Bright Green
  "rgba(255, 223, 0, 1)",      // Bright Gold
  "rgba(255, 68, 136, 1)",     // Bright Pink
  "rgba(187, 134, 252, 1)",    // Bright Purple
  "rgba(255, 160, 64, 1)",     // Bright Orange
];

export default function Leaderboard() {
  const { data: agents, isLoading: agentsLoading } = useQuery<Agent[]>({
    queryKey: ["/api/agents"],
    refetchInterval: 10000, // Refresh every 10 seconds to show updated balances and PnL
  });

  const { data: performanceData, isLoading: performanceLoading } = useQuery<PerformanceSnapshot[]>({
    queryKey: ["/api/performance"],
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

  // Prepare chart data
  const agentMap = new Map(agents.map((a) => [a.id, a]));
  
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

  const datasets = agents.map((agent, index) => {
    const agentSnapshots = groupedData[agent.id] || [];
    const data = allTimestamps.map((timestamp) => {
      const snapshot = agentSnapshots.find(
        (s) => new Date(s.timestamp).getTime() === timestamp
      );
      // Show PnL (starts at 0) instead of accountValue
      return snapshot ? Number(snapshot.totalPnL) : null;
    });

    return {
      label: agent.name,
      data: data,
      borderColor: AGENT_COLORS[index % AGENT_COLORS.length],
      backgroundColor: AGENT_COLORS[index % AGENT_COLORS.length].replace("1)", "0.15)"),
      borderWidth: 4,
      pointRadius: 5,
      pointHoverRadius: 8,
      pointHoverBorderWidth: 3,
      pointBackgroundColor: AGENT_COLORS[index % AGENT_COLORS.length],
      pointBorderColor: "#FFFFFF",
      pointBorderWidth: 2,
      tension: 0.3,
      fill: true,
      hitRadius: 40,
      spanGaps: false,
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
        top: 20,
        right: 20,
        bottom: 10,
        left: 10,
      },
    },
    interaction: {
      mode: "nearest" as const,
      intersect: true,
      axis: "xy" as const,
    },
    onHover: (event: any, activeElements: any, chart: any) => {
      if (activeElements && activeElements.length > 0) {
        const activeDatasetIndex = activeElements[0].datasetIndex;
        
        chart.data.datasets.forEach((dataset: any, index: number) => {
          const originalColor = AGENT_COLORS[index % AGENT_COLORS.length];
          if (index === activeDatasetIndex) {
            dataset.borderColor = originalColor;
            dataset.backgroundColor = originalColor.replace("1)", "0.25)");
            dataset.borderWidth = 5;
            dataset.pointRadius = 0; // No visible points even on hover
          } else {
            dataset.borderColor = originalColor.replace("1)", "0.3)");
            dataset.backgroundColor = originalColor.replace("1)", "0.05)");
            dataset.borderWidth = 2;
            dataset.pointRadius = 0; // No visible points
          }
        });
        
        chart.update('none');
      } else {
        chart.data.datasets.forEach((dataset: any, index: number) => {
          const originalColor = AGENT_COLORS[index % AGENT_COLORS.length];
          dataset.borderColor = originalColor;
          dataset.backgroundColor = originalColor.replace("1)", "0.15)");
          dataset.borderWidth = 4;
          dataset.pointRadius = 0; // No visible points
        });
        chart.update('none');
      }
    },
    plugins: {
      legend: {
        display: true,
        position: "top" as const,
        labels: {
          color: "rgb(255, 255, 255)",
          usePointStyle: true,
          padding: 15,
          boxWidth: 12,
          boxHeight: 12,
          font: {
            family: "Share Tech Mono, monospace",
            size: 13,
            weight: "bold" as const,
          },
        },
      },
      tooltip: {
        backgroundColor: "rgba(0, 0, 0, 0.95)",
        titleColor: "#FFFFFF",
        bodyColor: "#FFFFFF",
        borderColor: "rgba(0, 255, 255, 0.8)",
        borderWidth: 2,
        padding: 16,
        displayColors: true,
        titleFont: {
          size: 14,
          weight: "bold" as const,
          family: "Share Tech Mono, monospace",
        },
        bodyFont: {
          size: 13,
          weight: "bold" as const,
          family: "Share Tech Mono, monospace",
        },
        boxPadding: 8,
        usePointStyle: true,
        callbacks: {
          label: function (context: any) {
            let label = context.dataset.label || "";
            if (label) {
              label += ": ";
            }
            if (context.parsed.y !== null) {
              const pnl = context.parsed.y;
              const sign = pnl >= 0 ? "+" : "";
              label += `${sign}$${pnl.toFixed(2)}`;
            } else {
              label += "No data";
            }
            return label;
          },
        },
      },
    },
    scales: {
      x: {
        grid: {
          color: "rgba(255, 255, 255, 0.15)",
          lineWidth: 1,
        },
        ticks: {
          color: "#FFFFFF",
          maxRotation: 45,
          minRotation: 45,
          font: {
            family: "Share Tech Mono, monospace",
            size: 11,
            weight: "normal" as const,
          },
          maxTicksLimit: 12, // Limit number of time labels for better readability
        },
      },
      y: {
        grid: {
          color: "rgba(255, 255, 255, 0.15)",
          lineWidth: 1,
        },
        ticks: {
          color: "#FFFFFF",
          callback: function (value: any) {
            return "$" + value.toLocaleString();
          },
          font: {
            family: "Share Tech Mono, monospace",
            size: 12,
            weight: "bold" as const,
          },
          stepSize: 5, // Show ticks every $5 for better granularity
        },
        beginAtZero: false, // Don't force start at 0, allow better zoom
        suggestedMin: undefined, // Auto-calculate min based on data
        suggestedMax: undefined, // Auto-calculate max based on data
      },
    },
  };

  return (
    <div className="min-h-screen bg-background p-6 space-y-8 cyber-scrollbar overflow-y-auto">
      <div className="space-y-2">
        <h1 className="text-4xl font-bold text-primary cyber-glow font-cyber" data-testid="text-title">
          AEGIS ARENA
        </h1>
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
          <div className="h-[700px] w-full" data-testid="chart-performance">
            <Line data={chartData} options={chartOptions} />
          </div>
        </Card>
      </div>

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
              Each agent starts with <span className="text-primary font-bold">$20</span> in initial capital
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
