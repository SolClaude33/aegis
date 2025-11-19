import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Play, Pause, Square, Lock, AlertCircle, Activity } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function ControlPanel() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [apiKey, setApiKey] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Load API key from localStorage on mount
  useEffect(() => {
    const savedKey = localStorage.getItem("trading_api_key");
    if (savedKey) {
      setApiKey(savedKey);
      setIsAuthenticated(true);
    }
  }, []);

  // Fetch trading status
  const { data: status, isLoading: statusLoading } = useQuery<{
    isRunning: boolean;
    isPaused: boolean;
    isTrading: boolean;
  }>({
    queryKey: ["/api/trading/status"],
    enabled: isAuthenticated && apiKey.length > 0,
    refetchInterval: 5000, // Refetch every 5 seconds
    retry: false,
    onError: () => {
      setIsAuthenticated(false);
    },
  });

  const saveApiKey = () => {
    if (apiKey.trim().length === 0) {
      toast({
        title: "Error",
        description: "Please enter an API key",
        variant: "destructive",
      });
      return;
    }
    localStorage.setItem("trading_api_key", apiKey);
    setIsAuthenticated(true);
    toast({
      title: "API Key saved",
      description: "API key has been saved locally",
    });
    queryClient.invalidateQueries({ queryKey: ["/api/trading/status"] });
  };

  const removeApiKey = () => {
    localStorage.removeItem("trading_api_key");
    setApiKey("");
    setIsAuthenticated(false);
    toast({
      title: "API Key removed",
      description: "API key has been removed",
    });
  };

  const makeRequest = async (endpoint: string, method: string = "GET", body?: any) => {
    try {
      const response = await fetch(endpoint, {
        method,
        headers: {
          "Content-Type": "application/json",
          "X-Trading-API-Key": apiKey,
        },
        body: body ? JSON.stringify(body) : undefined,
      });

      if (response.status === 401) {
        const errorData = await response.json().catch(() => ({}));
        toast({
          title: "Unauthorized",
          description: errorData.error || "Invalid API key. Please verify your TRADING_CONTROL_API_KEY from Railway.",
          variant: "destructive",
        });
        setIsAuthenticated(false);
        return null;
      }

      // Check if response is HTML (404 page) instead of JSON
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error(`Expected JSON but got ${contentType || "HTML"}. Is the route registered?`);
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Request failed with status ${response.status}`);
      }

      return await response.json();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Error making request",
        variant: "destructive",
      });
      return null;
    }
  };

  const handleResume = async () => {
    const result = await makeRequest("/api/trading/resume", "POST");
    if (result) {
      toast({
        title: "Trading resumed",
        description: "IAs will start trading immediately",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/trading/status"] });
    }
  };

  const handlePause = async (closePositions: boolean = false) => {
    const result = await makeRequest(
      "/api/trading/pause",
      "POST",
      { closePositions }
    );
    if (result) {
      toast({
        title: closePositions
          ? "Trading paused and positions closed"
          : "Trading paused",
        description: result.message || "Trading has been paused",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/trading/status"] });
    }
  };

  const handleClosePositions = async () => {
    const result = await makeRequest("/api/trading/close-all-positions", "POST");
    if (result) {
      toast({
        title: "Positions closed",
        description: `Closed ${result.closed} positions`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/trading/status"] });
    }
  };

  return (
    <div className="min-h-screen bg-background p-8 flex items-center justify-center">
      <div className="max-w-2xl w-full space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-3">
            <Lock className="w-8 h-8 text-primary" />
            <h1 className="text-4xl font-bold text-primary cyber-glow font-cyber">
              Trading Control Panel
            </h1>
          </div>
          <p className="text-white/60 font-mono text-sm">
            Private trading control interface
          </p>
        </div>

        <Card className="p-8 bg-card border-card-border">
          <div className="space-y-6">
            {!isAuthenticated ? (
              <div className="space-y-4">
                <div className="space-y-3">
                  <div>
                    <h3 className="text-lg font-bold text-primary font-cyber mb-2">
                      Step 1: Enter Your API Key
                    </h3>
                    <p className="text-sm text-white/70 font-mono mb-4">
                      Get your API key from Railway → Your Project → Variables → TRADING_CONTROL_API_KEY
                    </p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-mono text-white/70">
                      API Key (from Railway)
                    </label>
                    <div className="flex gap-2">
                      <Input
                        type="password"
                        placeholder="Paste your TRADING_CONTROL_API_KEY here"
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") saveApiKey();
                        }}
                        className="font-mono"
                      />
                      <Button onClick={saveApiKey} variant="default" size="lg">
                        Save & Connect
                      </Button>
                    </div>
                  </div>
                </div>
                <div className="text-xs text-white/60 font-mono p-4 bg-white/5 rounded border border-white/10">
                  <AlertCircle className="w-4 h-4 inline mr-2" />
                  API key is stored only in your browser. It's not sent to the server except in
                  control requests.
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Status Display */}
                {statusLoading ? (
                  <div className="text-center text-sm font-mono text-white/70 py-4">
                    Loading status...
                  </div>
                ) : status ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between pb-4 border-b border-border">
                      <h2 className="text-xl font-bold text-primary font-cyber flex items-center gap-2">
                        <Activity className="w-5 h-5" />
                        System Status
                      </h2>
                      <Badge
                        variant={status.isTrading ? "default" : "secondary"}
                        className={status.isTrading ? "bg-cyber-success" : ""}
                      >
                        {status.isTrading ? "ACTIVE" : "PAUSED"}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-3 gap-4 text-sm font-mono">
                      <div className="p-4 bg-white/5 rounded border border-white/10">
                        <div className="text-white/50 mb-1">Engine</div>
                        <div className="text-primary text-lg font-bold">
                          {status.isRunning ? "Running" : "Stopped"}
                        </div>
                      </div>
                      <div className="p-4 bg-white/5 rounded border border-white/10">
                        <div className="text-white/50 mb-1">Trading</div>
                        <div
                          className={`text-lg font-bold ${
                            status.isPaused ? "text-destructive" : "text-cyber-success"
                          }`}
                        >
                          {status.isPaused ? "Paused" : "Active"}
                        </div>
                      </div>
                      <div className="p-4 bg-white/5 rounded border border-white/10">
                        <div className="text-white/50 mb-1">Status</div>
                        <div
                          className={`text-lg font-bold ${
                            status.isTrading
                              ? "text-cyber-success"
                              : "text-white/70"
                          }`}
                        >
                          {status.isTrading ? "Trading" : "Idle"}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : null}

                {/* Control Buttons */}
                <div className="space-y-3 pt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {status?.isPaused ? (
                      <Button
                        onClick={handleResume}
                        className="bg-cyber-success hover:bg-cyber-success/80 text-black font-cyber h-12 text-lg"
                        disabled={statusLoading}
                      >
                        <Play className="w-5 h-5 mr-2" />
                        Resume Trading
                      </Button>
                    ) : (
                      <Button
                        onClick={() => handlePause(false)}
                        className="bg-cyber-warning hover:bg-cyber-warning/80 text-black font-cyber h-12 text-lg"
                        disabled={statusLoading}
                      >
                        <Pause className="w-5 h-5 mr-2" />
                        Pause Trading
                      </Button>
                    )}

                    <Button
                      onClick={() => handlePause(true)}
                      className="bg-cyber-danger hover:bg-cyber-danger/80 text-white font-cyber h-12 text-lg"
                      disabled={statusLoading || status?.isPaused}
                    >
                      <Square className="w-5 h-5 mr-2" />
                      Pause & Close Positions
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <Button
                      onClick={handleClosePositions}
                      variant="outline"
                      className="font-cyber h-12 text-lg"
                      disabled={statusLoading || status?.isPaused}
                    >
                      <Square className="w-5 h-5 mr-2" />
                      Close All Positions
                    </Button>

                    <Button
                      onClick={removeApiKey}
                      variant="ghost"
                      className="font-mono text-sm text-white/50 hover:text-white h-12"
                    >
                      Remove API Key
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </Card>

        <div className="text-center text-xs text-white/40 font-mono">
          AEGIS Trading Control Panel - Private Access Only
        </div>
      </div>
    </div>
  );
}

