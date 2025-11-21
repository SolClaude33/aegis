import { useState, useEffect, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Play, Pause, Square, Lock, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function TradingControl() {
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

  // Define makeRequest before useQuery so it can be used in queryFn
  const makeRequest = useCallback(async (endpoint: string, method: string = "GET", body?: any) => {
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
        toast({
          title: "No autorizado",
          description: "API key inválida. Verifica tu clave.",
          variant: "destructive",
        });
        setIsAuthenticated(false);
        return null;
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Error en la solicitud");
      }

      return await response.json();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Error al realizar la solicitud",
        variant: "destructive",
      });
      return null;
    }
  }, [apiKey, toast]);

  // Fetch trading status
  const { data: status, isLoading: statusLoading } = useQuery<{
    isRunning: boolean;
    isPaused: boolean;
    isTrading: boolean;
  }>({
    queryKey: ["/api/trading/status", apiKey], // Include apiKey in query key so it refetches when key changes
    enabled: isAuthenticated && apiKey.length > 0,
    queryFn: async () => {
      const result = await makeRequest("/api/trading/status", "GET");
      return result as { isRunning: boolean; isPaused: boolean; isTrading: boolean } | null;
    },
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
        description: "Por favor ingresa una API key",
        variant: "destructive",
      });
      return;
    }
    localStorage.setItem("trading_api_key", apiKey);
    setIsAuthenticated(true);
    toast({
      title: "API Key guardada",
      description: "La API key ha sido guardada localmente",
    });
    queryClient.invalidateQueries({ queryKey: ["/api/trading/status"] });
  };

  const removeApiKey = () => {
    localStorage.removeItem("trading_api_key");
    setApiKey("");
    setIsAuthenticated(false);
    toast({
      title: "API Key eliminada",
      description: "La API key ha sido eliminada",
    });
  };

  const handleResume = async () => {
    const result = await makeRequest("/api/trading/resume", "POST");
    if (result) {
      toast({
        title: "Trading reanudado",
        description: "Las IAs comenzarán a tradear inmediatamente",
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
          ? "Trading pausado y posiciones cerradas"
          : "Trading pausado",
        description: result.message || "El trading ha sido pausado",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/trading/status"] });
    }
  };

  const handleClosePositions = async () => {
    const result = await makeRequest("/api/trading/close-all-positions", "POST");
    if (result) {
      toast({
        title: "Posiciones cerradas",
        description: `Se cerraron ${result.closed} posiciones`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/trading/status"] });
    }
  };

  return (
    <Card className="p-6 bg-card border-card-border">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-primary font-cyber flex items-center gap-2">
            <Lock className="w-5 h-5" />
            Control de Trading
          </h2>
          {status && (
            <Badge
              variant={status.isTrading ? "default" : "secondary"}
              className={status.isTrading ? "bg-cyber-success" : ""}
            >
              {status.isTrading ? "ACTIVO" : "PAUSADO"}
            </Badge>
          )}
        </div>

        {!isAuthenticated ? (
          <div className="space-y-3">
            <div className="space-y-2">
              <label className="text-sm font-mono text-white/70">
                API Key (desde Railway)
              </label>
              <div className="flex gap-2">
                <Input
                  type="password"
                  placeholder="Ingresa tu TRADING_CONTROL_API_KEY"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") saveApiKey();
                  }}
                  className="font-mono"
                />
                <Button onClick={saveApiKey} variant="default">
                  Guardar
                </Button>
              </div>
            </div>
            <div className="text-xs text-white/60 font-mono p-3 bg-white/5 rounded border border-white/10">
              <AlertCircle className="w-4 h-4 inline mr-2" />
              La API key se guarda solo en tu navegador. No se envía al servidor excepto en las
              solicitudes de control.
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Status Display */}
            {statusLoading ? (
              <div className="text-sm font-mono text-white/70">
                Cargando estado...
              </div>
            ) : status ? (
              <div className="grid grid-cols-3 gap-2 text-xs font-mono">
                <div className="p-2 bg-white/5 rounded">
                  <div className="text-white/50">Estado</div>
                  <div className="text-primary">
                    {status.isRunning ? "Iniciado" : "Detenido"}
                  </div>
                </div>
                <div className="p-2 bg-white/5 rounded">
                  <div className="text-white/50">Trading</div>
                  <div className={status.isPaused ? "text-destructive" : "text-cyber-success"}>
                    {status.isPaused ? "Pausado" : "Activo"}
                  </div>
                </div>
                <div className="p-2 bg-white/5 rounded">
                  <div className="text-white/50">Estado</div>
                  <div className={status.isTrading ? "text-cyber-success" : "text-white/70"}>
                    {status.isTrading ? "Tradando" : "Inactivo"}
                  </div>
                </div>
              </div>
            ) : null}

            {/* Control Buttons */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {status?.isPaused ? (
                <Button
                  onClick={handleResume}
                  className="bg-cyber-success hover:bg-cyber-success/80 text-black font-cyber"
                  disabled={statusLoading}
                >
                  <Play className="w-4 h-4 mr-2" />
                  Reanudar Trading
                </Button>
              ) : (
                <Button
                  onClick={() => handlePause(false)}
                  className="bg-cyber-warning hover:bg-cyber-warning/80 text-black font-cyber"
                  disabled={statusLoading}
                >
                  <Pause className="w-4 h-4 mr-2" />
                  Pausar Trading
                </Button>
              )}

              <Button
                onClick={() => handlePause(true)}
                className="bg-cyber-danger hover:bg-cyber-danger/80 text-white font-cyber"
                disabled={statusLoading || status?.isPaused}
              >
                <Square className="w-4 h-4 mr-2" />
                Pausar y Cerrar Posiciones
              </Button>

              <Button
                onClick={handleClosePositions}
                variant="outline"
                className="font-cyber"
                disabled={statusLoading || status?.isPaused}
              >
                <Square className="w-4 h-4 mr-2" />
                Solo Cerrar Posiciones
              </Button>

              <Button
                onClick={removeApiKey}
                variant="ghost"
                className="font-mono text-xs text-white/50 hover:text-white"
              >
                Eliminar API Key
              </Button>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}

