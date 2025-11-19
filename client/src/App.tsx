import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Leaderboard from "@/pages/Leaderboard";
import AgentDetail from "@/pages/AgentDetail";
import ControlPanel from "@/pages/ControlPanel";
import NotFound from "@/pages/not-found";
import ActivityFeed from "@/components/ActivityFeed";
import MatrixRain from "@/components/MatrixRain";
import { useEffect } from "react";

function Router() {
  const [location] = useLocation();
  const isControlPanel = location === "/controlpanel";

  return (
    <Switch>
      <Route path="/controlpanel" component={ControlPanel} />
      <Route path="/" component={Leaderboard} />
      <Route path="/agent/:id" component={AgentDetail} />
      <Route component={NotFound} />
    </Switch>
  );
}

function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const isControlPanel = location === "/controlpanel";

  if (isControlPanel) {
    // Full screen layout for control panel (no sidebar)
    return <>{children}</>;
  }

  // Regular layout with sidebar
  return (
    <div className="flex flex-col lg:flex-row min-h-screen relative z-10">
      <main className="flex-1 lg:w-2/3">
        {children}
      </main>
      
      <aside className="lg:w-1/3 lg:max-w-xl border-l border-border bg-background/95 backdrop-blur">
        <div className="sticky top-0 h-screen overflow-hidden p-6">
          <ActivityFeed />
        </div>
      </aside>
    </div>
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
          
          <Layout>
            <Router />
          </Layout>
          
          <Toaster />
        </div>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
