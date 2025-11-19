import { createContext, useContext, useState, ReactNode } from 'react';

interface TradingSymbolContextType {
  selectedSymbol: string;
  setSelectedSymbol: (symbol: string) => void;
}

const TradingSymbolContext = createContext<TradingSymbolContextType | undefined>(undefined);

export function TradingSymbolProvider({ children }: { children: ReactNode }) {
  const [selectedSymbol, setSelectedSymbol] = useState<string>('BTC/USD');

  return (
    <TradingSymbolContext.Provider value={{ selectedSymbol, setSelectedSymbol }}>
      {children}
    </TradingSymbolContext.Provider>
  );
}

export function useTradingSymbol() {
  const context = useContext(TradingSymbolContext);
  if (context === undefined) {
    throw new Error('useTradingSymbol must be used within a TradingSymbolProvider');
  }
  return context;
}
