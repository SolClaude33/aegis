import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Leaderboard from "@/pages/Leaderboard";
import AgentDetail from "@/pages/AgentDetail";
import NotFound from "@/pages/not-found";
import ActivityFeed from "@/components/ActivityFeed";
import MatrixRain from "@/components/MatrixRain";
import { useEffect } from "react";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Leaderboard} />
      <Route path="/agent/:id" component={AgentDetail} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="cyberpunk-app min-h-screen relative">
          <MatrixRain />
          
          <div className="scanlines" />
          
          <div className="flex flex-col lg:flex-row min-h-screen relative z-10">
            <main className="flex-1 lg:w-2/3">
              <Router />
            </main>
            
            <aside className="lg:w-1/3 lg:max-w-xl border-l border-border bg-background/95 backdrop-blur">
              <div className="sticky top-0 h-screen overflow-hidden p-6">
                <ActivityFeed />
              </div>
            </aside>
          </div>
          
          <Toaster />
        </div>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
