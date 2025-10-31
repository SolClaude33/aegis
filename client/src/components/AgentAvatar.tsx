import {
  Eye,
  Brain,
  Target,
  Zap,
  Cpu,
  Sparkles,
  Bot,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface AgentAvatarProps extends React.ComponentPropsWithoutRef<typeof Avatar> {
  iconName?: string | null;
  name: string;
  size?: "sm" | "md" | "lg" | "xl";
}

const iconMap: Record<string, any> = {
  eye: Eye,
  brain: Brain,
  target: Target,
  zap: Zap,
  cpu: Cpu,
  sparkles: Sparkles,
};

const sizeMap = {
  sm: "h-8 w-8",
  md: "h-12 w-12",
  lg: "h-16 w-16",
  xl: "h-24 w-24",
};

const iconSizeMap = {
  sm: "h-4 w-4",
  md: "h-6 w-6",
  lg: "h-8 w-8",
  xl: "h-12 w-12",
};

export default function AgentAvatar({
  iconName,
  name,
  className,
  size = "md",
  ...props
}: AgentAvatarProps) {
  const IconComponent = iconName && iconMap[iconName] ? iconMap[iconName] : Bot;

  return (
    <Avatar className={cn(sizeMap[size], className)} {...props}>
      <AvatarFallback className="bg-primary/10 border border-primary/30">
        <IconComponent className={cn(iconSizeMap[size], "text-primary")} />
      </AvatarFallback>
    </Avatar>
  );
}
