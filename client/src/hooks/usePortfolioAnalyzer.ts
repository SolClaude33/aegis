import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';

// Using backend proxy to bypass CORS restrictions
const SOLANA_RPC_ENDPOINT = '/api/solana-rpc-proxy';
const TOKEN_PROGRAM_ID = 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA';
const TOKEN_2022_PROGRAM_ID = 'TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb';
const SOL_MINT = 'So11111111111111111111111111111111111111112';
const LAMPORTS_PER_SOL = 1_000_000_000;

interface TokenHolding {
  mint: string;
  symbol: string;
  balance: number;
  decimals: number;
  usdValue: number;
}

interface PortfolioAnalysis {
  topHoldings: TokenHolding[];
  isLoading: boolean;
  error: Error | null;
}

interface PriceData {
  current_price: number;
}

export function usePortfolioAnalyzer(walletAddress: string | null): PortfolioAnalysis {
  const [topHoldings, setTopHoldings] = useState<TokenHolding[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const { data: solPrice } = useQuery<PriceData>({
    queryKey: ['/api/crypto/price'],
    refetchInterval: 10000,
  });

  useEffect(() => {
    if (!walletAddress) {
      setTopHoldings([]);
      setError(null);
      return;
    }

    let isMounted = true;
    let abortController = new AbortController();

    const fetchPortfolio = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const [solBalanceRes, spl1Res, spl2Res] = await Promise.all([
          fetch(SOLANA_RPC_ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              jsonrpc: '2.0',
              id: 1,
              method: 'getBalance',
              params: [walletAddress],
            }),
            signal: abortController.signal,
          }),
          fetch(SOLANA_RPC_ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              jsonrpc: '2.0',
              id: 2,
              method: 'getTokenAccountsByOwner',
              params: [
                walletAddress,
                { programId: TOKEN_PROGRAM_ID },
                { encoding: 'jsonParsed' }
              ],
            }),
            signal: abortController.signal,
          }),
          fetch(SOLANA_RPC_ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              jsonrpc: '2.0',
              id: 3,
              method: 'getTokenAccountsByOwner',
              params: [
                walletAddress,
                { programId: TOKEN_2022_PROGRAM_ID },
                { encoding: 'jsonParsed' }
              ],
            }),
            signal: abortController.signal,
          }),
        ]);

        const [solBalanceData, spl1Data, spl2Data] = await Promise.all([
          solBalanceRes.json(),
          spl1Res.json(),
          spl2Res.json(),
        ]);

        const balancesByMint = new Map<string, { balance: number; decimals: number }>();

        const solBalance = (solBalanceData.result?.value || 0) / LAMPORTS_PER_SOL;
        
        if (solBalance > 0) {
          balancesByMint.set(SOL_MINT, { balance: solBalance, decimals: 9 });
        }

        const allAccounts = [
          ...(spl1Data.result?.value || []),
          ...(spl2Data.result?.value || []),
        ];

        for (const account of allAccounts) {
          const parsedInfo = account.account?.data?.parsed?.info;
          if (!parsedInfo) continue;

          const tokenAmount = parsedInfo.tokenAmount;
          const mint = parsedInfo.mint;
          const balance = tokenAmount.uiAmount || 0;
          const decimals = tokenAmount.decimals || 0;

          if (balance > 0 && decimals > 0) {
            const existing = balancesByMint.get(mint);
            if (existing) {
              existing.balance += balance;
            } else {
              balancesByMint.set(mint, { balance, decimals });
            }
          }
        }

        const mints = Array.from(balancesByMint.keys());
        const priceMap = new Map<string, number>();

        if (mints.length > 0) {
          try {
            const priceRes = await fetch(
              `/api/jupiter-price-proxy?ids=${mints.join(',')}`,
              { signal: abortController.signal }
            );
            
            if (priceRes.ok) {
              const priceData = await priceRes.json();
              if (priceData.data) {
                for (const [mint, info] of Object.entries(priceData.data) as [string, any][]) {
                  priceMap.set(mint, info.price || 0);
                }
              }
            }
          } catch (priceErr) {
            // Silent failure - prices will be 0 for tokens without pricing
          }
        }

        if (solPrice?.current_price) {
          priceMap.set(SOL_MINT, solPrice.current_price);
        }

        const holdings: TokenHolding[] = Array.from(balancesByMint.entries()).map(([mint, { balance, decimals }]) => {
          const price = priceMap.get(mint) || 0;
          const usdValue = balance * price;

          return {
            mint,
            symbol: mint === SOL_MINT ? 'SOL' : mint.slice(0, 4) + '...' + mint.slice(-4),
            balance,
            decimals,
            usdValue,
          };
        });

        holdings.sort((a, b) => b.usdValue - a.usdValue);
        const top3 = holdings.slice(0, 3);

        if (isMounted) {
          setTopHoldings(top3);
        }
      } catch (err: any) {
        if (err.name === 'AbortError') return;
        if (isMounted) {
          setError(err as Error);
          setTopHoldings([]);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchPortfolio();

    const intervalId = window.setInterval(() => {
      abortController.abort();
      abortController = new AbortController();
      fetchPortfolio();
    }, 60000);

    return () => {
      isMounted = false;
      clearInterval(intervalId);
      abortController.abort();
    };
  }, [walletAddress, solPrice]);

  return {
    topHoldings,
    isLoading,
    error,
  };
}
