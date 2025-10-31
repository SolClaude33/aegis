import { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';

// Using backend proxy to bypass CORS restrictions
const SOLANA_RPC_ENDPOINT = '/api/solana-rpc-proxy';
const LAMPORTS_PER_SOL = 1_000_000_000;

interface PriceData {
  current_price: number;
  price_change_24h: number;
  price_change_percentage_24h: number;
}

interface WalletBalanceData {
  sol: number;
  usd: number;
  isLoading: boolean;
  error: Error | null;
  priceError: boolean;
}

export function useWalletBalance(walletAddress: string | null): WalletBalanceData {
  const [sol, setSol] = useState<number>(0);
  const [error, setError] = useState<Error | null>(null);
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);

  const { data: priceData, isLoading: isPriceLoading, error: priceError } = useQuery<PriceData>({
    queryKey: ['/api/crypto/price'],
    refetchInterval: 10000,
  });

  useEffect(() => {
    if (!walletAddress) {
      setSol(0);
      setError(null);
      return;
    }

    let isMounted = true;

    const fetchBalance = async () => {
      try {
        setIsLoadingBalance(true);
        setError(null);
        
        const response = await fetch(SOLANA_RPC_ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0',
            id: 1,
            method: 'getBalance',
            params: [walletAddress],
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.error) {
          throw new Error(data.error.message || 'Failed to fetch balance');
        }

        const balance = data.result?.value || 0;
        const solBalance = balance / LAMPORTS_PER_SOL;
        
        if (isMounted) {
          setSol(solBalance);
        }
      } catch (err) {
        console.error('[useWalletBalance] Error fetching balance:', err);
        if (isMounted) {
          setError(err as Error);
          setSol(0);
        }
      } finally {
        if (isMounted) {
          setIsLoadingBalance(false);
        }
      }
    };

    fetchBalance();

    const intervalId = window.setInterval(fetchBalance, 30000);

    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, [walletAddress]);

  const usd = useMemo(() => {
    const solPrice = priceData?.current_price;
    if (!solPrice || priceError) return 0;
    return sol * solPrice;
  }, [sol, priceData, priceError]);

  return {
    sol,
    usd,
    isLoading: isLoadingBalance || isPriceLoading,
    error,
    priceError: !!priceError,
  };
}
