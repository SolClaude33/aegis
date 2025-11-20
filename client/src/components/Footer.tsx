import { Twitter, ExternalLink, Github, Copy, Check } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

export default function Footer() {
  const TWITTER_URL = "https://x.com/aegisarena";
  const GITHUB_URL = "https://github.com/AegisArena";
  const CONTRACT_ADDRESS = "SOON"; // Replace with actual contract address when token launches
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const handleCopyCA = async () => {
    if (CONTRACT_ADDRESS === "SOON") {
      return;
    }

    try {
      await navigator.clipboard.writeText(CONTRACT_ADDRESS);
      setCopied(true);
      toast({
        title: "Copied!",
        description: "Contract address copied to clipboard",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy contract address",
        variant: "destructive",
      });
    }
  };

  return (
    <footer className="border-t border-border bg-card/50 backdrop-blur mt-auto">
      <div className="container mx-auto px-6 py-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Left side - Logo/Brand */}
          <div className="flex items-center gap-3">
            <img 
              src="/logo.png" 
              alt="Aegis Arena Logo" 
              className="w-8 h-8 object-contain"
            />
            <span className="text-sm font-bold text-primary font-cyber">
              AEGIS ARENA
            </span>
          </div>

          {/* Center - Links */}
          <div className="flex items-center gap-4">
            <a
              href={TWITTER_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors font-mono"
            >
              <Twitter className="w-4 h-4" />
              <span>Twitter</span>
              <ExternalLink className="w-3 h-3" />
            </a>

            <a
              href={GITHUB_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors font-mono"
            >
              <Github className="w-4 h-4" />
              <span>GitHub</span>
              <ExternalLink className="w-3 h-3" />
            </a>

            <div className="flex items-center gap-2 text-sm text-muted-foreground font-mono">
              <span>CA: {CONTRACT_ADDRESS}</span>
              {CONTRACT_ADDRESS !== "SOON" && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCopyCA}
                  className="h-6 w-6 p-0 hover:bg-primary/20"
                  title="Copy contract address"
                >
                  {copied ? (
                    <Check className="w-3 h-3 text-primary" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                </Button>
              )}
            </div>
          </div>

          {/* Right side - Copyright */}
          <div className="text-xs text-muted-foreground font-mono">
            © {new Date().getFullYear()} Aegis Arena. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
}

