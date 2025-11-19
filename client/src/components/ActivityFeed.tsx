import { useQuery } from "@tanstack/react-query";
import type { ActivityEvent, Agent } from "@shared/schema";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Scroll, ExternalLink } from "lucide-react";
import { useEffect, useRef } from "react";
import AgentAvatar from "@/components/AgentAvatar";

export default function ActivityFeed() {
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data: events } = useQuery<ActivityEvent[]>({
    queryKey: ["/api/activity"],
    queryFn: async () => {
      const response = await fetch("/api/activity?limit=50");
      if (!response.ok) throw new Error("Failed to fetch activity");
      return response.json();
    },
    refetchInterval: 5000,
  });

  const { data: agents } = useQuery<Agent[]>({
    queryKey: ["/api/agents"],
  });

  const agentMap = new Map(agents?.map((a) => [a.id, a]) || []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, [events]);

  return (
    <Card className="p-6 bg-card border-card-border h-full flex flex-col">
      <h2 className="text-2xl font-bold text-primary mb-4 font-cyber flex items-center gap-2">
        <Scroll className="w-6 h-6" />
        Activity Feed
      </h2>
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto cyber-scrollbar space-y-2 font-mono text-sm"
        data-testid="feed-activity"
      >
        {events && events.length > 0 ? (
          events.map((event) => {
            const agent = agentMap.get(event.agentId);
            const timestamp = new Date(event.timestamp).toLocaleTimeString();

            return (
              <div
                key={event.id}
                className="p-3 bg-muted/30 rounded border border-border hover-elevate transition-all"
                data-testid={`activity-${event.id}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span data-testid={`activity-time-${event.id}`}>{timestamp}</span>
                      {agent && (
                        <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/30">
                          {agent.name}
                        </Badge>
                      )}
                      <Badge variant="outline" className="text-xs" data-testid={`activity-type-${event.id}`}>
                        {event.eventType.replace(/_/g, " ")}
                      </Badge>
                    </div>
                    <p className="text-foreground leading-relaxed" data-testid={`activity-message-${event.id}`}>
                      {event.message}
                    </p>
                    {event.txHash && (
                      <a
                        href={`https://bscscan.com/tx/${event.txHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-primary hover:underline text-xs"
                        data-testid={`activity-tx-${event.id}`}
                      >
                        <span>TX: {event.txHash.slice(0, 10)}...{event.txHash.slice(-8)}</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                  {agent && (
                    <AgentAvatar iconName={agent.avatar} name={agent.name} size="sm" data-testid={`activity-avatar-${event.id}`} />
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <p>No activity yet...</p>
          </div>
        )}
      </div>
    </Card>
  );
}
