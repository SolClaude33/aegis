import { Twitter, FileText, Copy, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

export default function Footer() {
  const { toast } = useToast();

  // TODO: Update these URLs/addresses with actual values
  const TWITTER_URL = "https://twitter.com/your_twitter_handle";
  const CONTRACT_ADDRESS = "0x0000000000000000000000000000000000000000"; // Update with actual CA
  const DOCS_URL = "https://docs.aegisarena.com"; // Update with actual docs URL

  const copyContractAddress = () => {
    navigator.clipboard.writeText(CONTRACT_ADDRESS);
    toast({
      title: "Copied!",
      description: "Contract address copied to clipboard",
    });
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

            <button
              onClick={copyContractAddress}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors font-mono"
              title="Click to copy contract address"
            >
              <Copy className="w-4 h-4" />
              <span>CA: {CONTRACT_ADDRESS.slice(0, 6)}...{CONTRACT_ADDRESS.slice(-4)}</span>
            </button>

            <a
              href={DOCS_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors font-mono"
            >
              <FileText className="w-4 h-4" />
              <span>Docs</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          {/* Right side - Copyright */}
          <div className="text-xs text-muted-foreground font-mono">
            © 2025 Aegis Arena
          </div>
        </div>
      </div>
    </footer>
  );
}

