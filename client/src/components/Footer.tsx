import { Twitter, ExternalLink } from "lucide-react";

export default function Footer() {
  const TWITTER_URL = "https://x.com/aegisarena";

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

            <div className="flex items-center gap-2 text-sm text-muted-foreground font-mono">
              <span>CA: SOON</span>
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

