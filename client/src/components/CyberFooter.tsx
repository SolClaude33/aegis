import { Badge } from "@/components/ui/badge";
import { Activity, Wifi, Zap, Shield } from "lucide-react";

export default function CyberFooter() {
  return (
    <footer className="bg-card cyber-border p-3">
      <div className="flex items-center justify-between text-xs font-mono">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-1">
            <Wifi className="w-3 h-3 text-cyber-success" />
            <span>CONNECTED</span>
          </div>
          <div className="flex items-center space-x-1">
            <Activity className="w-3 h-3 text-cyber-blue animate-pulse" />
            <span>LIVE DATA</span>
          </div>
          <div className="flex items-center space-x-1">
            <Shield className="w-3 h-3 text-cyber-gold" />
            <span>SECURE</span>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <Badge variant="outline" className="text-xs">
            <Zap className="w-3 h-3 mr-1" />
            LATENCY: 12ms
          </Badge>
          <div className="text-muted-foreground">
            NSDEX v2.3.7 | © 2024 CyberTrade Systems
          </div>
        </div>
      </div>
    </footer>
  );
}