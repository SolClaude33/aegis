import { useState, useEffect } from "react";

export default function CyberHeader() {
  const [glitch, setGlitch] = useState(false);

  useEffect(() => {
    const glitchInterval = setInterval(() => {
      setGlitch(true);
      setTimeout(() => setGlitch(false), 500);
    }, 5000);

    return () => clearInterval(glitchInterval);
  }, []);

  return (
    <header className="bg-card cyber-border p-4 relative">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="text-2xl font-cyber cyber-glow">
            ╔═══════════════════════════════════════════════════════╗
          </div>
        </div>
        <div className="text-center flex-1">
          <h1 className={`text-4xl font-cyber cyber-glow ${glitch ? 'glitch' : ''}`}>
            Welcome to my Cyber realm
          </h1>
          <div className="text-sm text-muted-foreground mt-1">
            [NSDEX TERMINAL v2.3.7 - STATUS: ONLINE]
          </div>
        </div>
        <div className="text-2xl font-cyber cyber-glow">
          ╚═══════════════════════════════════════════════════════╝
        </div>
      </div>
    </header>
  );
}