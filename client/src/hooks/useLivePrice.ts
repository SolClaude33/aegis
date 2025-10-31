import { useState, useEffect, useRef } from 'react';
import { createBinanceWebSocket } from '@/lib/cryptoApi';

export function useLivePrice() {
  const [livePrice, setLivePrice] = useState<number | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    // Try WebSocket connection for real-time price updates
    try {
      wsRef.current = createBinanceWebSocket((price) => {
        setLivePrice(price);
      });
    } catch (error) {
      console.log('WebSocket not available, using API polling instead');
    }

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  return livePrice;
}