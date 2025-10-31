import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

interface ChartDataPoint {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
}

interface PriceData {
  current_price: number;
}

interface TokenHolding {
  mint: string;
  symbol: string;
  balance: number;
  usdValue: number;
}

interface PnLData {
  currentValue: number;
  value24hAgo: number;
  pnlAmount: number;
  pnlPercentage: number;
  isLoading: boolean;
  error: Error | null;
}

const SOL_MINT = 'So11111111111111111111111111111111111111112';

export function usePnLCalculator(holdings: TokenHolding[]): PnLData {
  const { data: chartData, isLoading: chartLoading, error: chartError } = useQuery<ChartDataPoint[]>({
    queryKey: ['/api/crypto/chart'],
    refetchInterval: 60000,
  });

  const { data: currentPrice, isLoading: priceLoading } = useQuery<PriceData>({
    queryKey: ['/api/crypto/price'],
    refetchInterval: 10000,
  });

  const pnlData = useMemo(() => {
    if (!chartData || chartData.length === 0 || !currentPrice) {
      return {
        currentValue: 0,
        value24hAgo: 0,
        pnlAmount: 0,
        pnlPercentage: 0,
      };
    }

    const now = Date.now();
    const oneDayAgo = now - 24 * 60 * 60 * 1000;

    let closestDataPoint = chartData[0];
    let minTimeDiff = Math.abs(chartData[0].timestamp - oneDayAgo);

    for (const point of chartData) {
      const timeDiff = Math.abs(point.timestamp - oneDayAgo);
      if (timeDiff < minTimeDiff) {
        minTimeDiff = timeDiff;
        closestDataPoint = point;
      }
    }

    const price24hAgo = closestDataPoint.close;
    const currentPriceValue = currentPrice.current_price;

    const solHolding = holdings.find(h => h.mint === SOL_MINT);
    const solBalance = solHolding?.balance || 0;

    const currentValue = holdings.reduce((sum, h) => sum + h.usdValue, 0);
    
    const otherTokensValue = currentValue - (solBalance * currentPriceValue);
    const value24hAgo = (solBalance * price24hAgo) + otherTokensValue;

    const pnlAmount = currentValue - value24hAgo;
    const pnlPercentage = value24hAgo > 0 ? (pnlAmount / value24hAgo) * 100 : 0;

    return {
      currentValue,
      value24hAgo,
      pnlAmount,
      pnlPercentage,
    };
  }, [chartData, currentPrice, holdings]);

  return {
    ...pnlData,
    isLoading: chartLoading || priceLoading,
    error: chartError as Error | null,
  };
}
