# Cyberpunk Crypto Trading Dashboard

## Overview

This is a full-stack cyberpunk-themed cryptocurrency trading dashboard built with React, Express, and TypeScript. It offers real-time cryptocurrency data visualization with a dark, neon-accented interface, inspired by retro-futuristic terminal aesthetics. Key features include live price data, candlestick charts, market sentiment, and Solana wallet integration for personalized portfolio tracking and user profiles. The project aims to provide an immersive command center experience for crypto trading.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend

- **Framework**: React 18 with TypeScript
- **State Management**: TanStack Query for server state
- **UI**: shadcn/ui components, Tailwind CSS with a custom cyberpunk theme
- **Design**: Dark gradients, neon accents, custom CSS effects (scanlines, CRT glow, matrix rain), and cyberpunk typography (Orbitron, Share Tech Mono, Roboto Mono).
- **Layout**: Responsive CSS Grid with header, left/right sidebars, and main content.

### Backend

- **Framework**: Express.js with TypeScript
- **Module System**: ES Modules
- **API**: Minimal REST API with `/api` prefix, utilizing middleware for JSON parsing and logging.
- **Storage**: In-memory `MemStorage` for user data, designed for easy extension to database-backed solutions.

### Data Storage

- **Database**: Drizzle ORM configured for PostgreSQL (via Neon serverless PostgreSQL).
- **Schema**: Agents table with individual AsterDex API credentials (apiKeyRef, apiSecretRef fields), trading strategies, positions, orders, and performance snapshots. Zod schemas for validation.
- **Migration**: Drizzle Kit for database migration management.

### AI Trading Agents

- **Architecture**: Each of 6 AI agents (DeepSeek, GPT-5, Claude-3.5, Grok-4, Llama-3.1, Gemini-2) has:
    - **Individual AsterDex wallet**: Separate API keys stored as Replit secrets
    - **Unique trading strategy**: Momentum, swing, conservative, aggressive, trend-following, mean-reversion
    - **Independent capital tracking**: Starts with 1 BNB (~$1100 USD equivalent)
    - **Risk management**: 5% max loss per trade, 30% max position size per asset
- **Trading Engine** (`server/trading-engine.ts`):
    - Creates individual AsterDexClient per agent using their credentials
    - Executes automated trading cycles every 2 minutes
    - Tracks positions from filled orders in asterdex_orders table
    - Enforces risk limits using live market pricing
- **Required Secrets** (must be added in Replit):
    - `AGENT_DEEPSEEK_API_KEY` / `AGENT_DEEPSEEK_API_SECRET`
    - `AGENT_GPT5_API_KEY` / `AGENT_GPT5_API_SECRET`
    - `AGENT_CLAUDE35_API_KEY` / `AGENT_CLAUDE35_API_SECRET`
    - `AGENT_GROK4_API_KEY` / `AGENT_GROK4_API_SECRET`
    - `AGENT_LLAMA31_API_KEY` / `AGENT_LLAMA31_API_SECRET`
    - `AGENT_GEMINI2_API_KEY` / `AGENT_GEMINI2_API_SECRET`

### Solana Wallet Integration

- **Backend Proxies**:
    - `/api/solana-rpc-proxy`: Bypasses CORS for Solana RPC calls (e.g., `getBalance`, `getTokenAccountsByOwner`).
    - `/api/jupiter-price-proxy`: Bypasses CORS for Jupiter Price API calls to fetch token prices.
- **Wallet Profiles API**: REST API for creating, fetching, updating, and deleting user profiles associated with Solana wallet addresses, including username management and uniqueness validation.
- **Frontend Wallet Infrastructure**:
    - `WalletContext`: Manages Solana wallet connection state (Phantom, Solflare), auto-reconnect, and event handling.
    - **Hooks**: `useWallet`, `useWalletBalance`, `usePortfolioAnalyzer` (top 3 token holdings, Jupiter Price API integration), `usePnLCalculator` (24h profit/loss), `useWalletProfile`.
- **Features**: Wallet connection, real-time blockchain data (SOL balance, token holdings), portfolio analysis, 24h PnL calculation, and user profiles with custom usernames.

### Trading Symbol Selection

- **Context**: `TradingSymbolContext` manages the globally selected trading symbol.
- **Backend Data Sourcing** (Multi-tiered):
    - **Tier 1 - CryptoCompare API**: Primary for major cryptocurrencies (BTC, ETH, SOL) with real-time prices and candlestick data (histominute endpoint with 5-minute aggregation).
    - **Tier 2 - Birdeye API**: Primary for Solana-native tokens (PUMP, wrapped SOL) with real-time on-chain data. Requires `BIRDEYE_API_KEY` environment variable.
    - **Tier 3 - CoinGecko API**: Final fallback for all symbols when other sources fail or are unavailable.
    - Proxy endpoints (`/api/crypto/price`, `/api/crypto/chart`) handle dynamic symbol requests with automatic multi-tier fallback strategy.
- **Geographic Constraints**: Replit servers face blocking from some APIs (Binance 451 errors, Dexscreener Cloudflare). Current configuration bypasses these restrictions.
- **Frontend**: Dynamic fetching and display of price/chart data based on selected symbol in `LeftSidebar`, `SolanaCandlestickChart`, and `MainContent`.
- **Supported Cryptocurrencies**: 
    - **Full support**: BTC, ETH, SOL, PUMP (via Birdeye for accurate real-time prices)
    - **Limited support**: ASTER (CoinGecko fallback, subject to rate limits)

## External Dependencies

- **Cryptocurrency Data APIs**:
    - **CryptoCompare API**: Primary data source for real-time prices, 24h stats, and historical candlestick data (OHLC).
    - **Birdeye API**: Solana-specific data source for on-chain token prices with real-time accuracy. Free tier: 30,000 compute units/month (~15,000+ price queries).
    - **CoinGecko API**: Final fallback data source for cryptocurrencies not available on CryptoCompare or Birdeye.
    - **Fear & Greed Index API** (alternative.me): Market sentiment data.
- **Charting Libraries**:
    - Chart.js v4: Core charting.
    - chartjs-chart-financial: Candlestick/OHLC charts.
    - chartjs-adapter-date-fns & date-fns: Date handling for charts.
- **UI Component Libraries**:
    - Radix UI: Accessible, unstyled component primitives.
    - lucide-react: Icon library.
    - class-variance-authority, tailwind-merge, clsx: Styling utilities.
- **Database**: Neon serverless PostgreSQL (via @neondatabase/serverless).
- **ORM**: Drizzle ORM.
- **Development Tools**: Vite, tsx, esbuild, Replit integration plugins.