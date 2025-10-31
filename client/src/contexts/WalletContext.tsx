import { createContext, useState, useEffect, useRef, ReactNode } from 'react';
import { PublicKey } from '@solana/web3.js';

export interface WalletContextType {
  walletAddress: string | null;
  publicKey: PublicKey | null;
  connected: boolean;
  connecting: boolean;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  isWalletInstalled: boolean;
}

export const WalletContext = createContext<WalletContextType | undefined>(undefined);

interface WalletProviderProps {
  children: ReactNode;
}

const WALLET_AUTOCONNECT_KEY = 'wallet-autoconnect';

export function WalletProvider({ children }: WalletProviderProps) {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [publicKey, setPublicKey] = useState<PublicKey | null>(null);
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [isWalletInstalled, setIsWalletInstalled] = useState(false);
  const listenersAttachedRef = useRef(false);

  useEffect(() => {
    let retryCount = 0;
    const maxRetries = 10;
    let retryInterval: number;

    const handleConnect = (publicKey: any) => {
      const pubKey = new PublicKey(publicKey.toString());
      setPublicKey(pubKey);
      setWalletAddress(pubKey.toString());
      setConnected(true);
      setConnecting(false);
    };

    const handleDisconnect = () => {
      setPublicKey(null);
      setWalletAddress(null);
      setConnected(false);
      localStorage.removeItem(WALLET_AUTOCONNECT_KEY);
    };

    const handleAccountChanged = (publicKey: any) => {
      if (publicKey) {
        const pubKey = new PublicKey(publicKey.toString());
        setPublicKey(pubKey);
        setWalletAddress(pubKey.toString());
      } else {
        setPublicKey(null);
        setWalletAddress(null);
        setConnected(false);
      }
    };

    const checkWallet = async () => {
      if ('solana' in window) {
        const solanaWindow = window as any;
        const provider = solanaWindow.solana;
        
        if (provider?.isPhantom || provider?.isSolflare) {
          setIsWalletInstalled(true);
          clearInterval(retryInterval);
          
          if (!listenersAttachedRef.current) {
            provider.on('connect', handleConnect);
            provider.on('disconnect', handleDisconnect);
            provider.on('accountChanged', handleAccountChanged);
            listenersAttachedRef.current = true;
          }
          
          const shouldAutoConnect = localStorage.getItem(WALLET_AUTOCONNECT_KEY) === 'true';
          
          if (shouldAutoConnect) {
            try {
              const response = await provider.connect({ onlyIfTrusted: true });
              if (response.publicKey) {
                const pubKey = new PublicKey(response.publicKey.toString());
                setPublicKey(pubKey);
                setWalletAddress(pubKey.toString());
                setConnected(true);
              }
            } catch (error) {
              console.log('Auto-connect skipped or rejected');
            }
          }
        } else {
          retryCount++;
          if (retryCount >= maxRetries) {
            clearInterval(retryInterval);
          }
        }
      } else {
        retryCount++;
        if (retryCount >= maxRetries) {
          clearInterval(retryInterval);
        }
      }
    };

    checkWallet();
    retryInterval = window.setInterval(checkWallet, 100);

    return () => {
      clearInterval(retryInterval);
      const solanaWindow = window as any;
      const provider = solanaWindow?.solana;
      if (provider && listenersAttachedRef.current) {
        provider.off?.('connect', handleConnect);
        provider.off?.('disconnect', handleDisconnect);
        provider.off?.('accountChanged', handleAccountChanged);
      }
    };
  }, []);

  const connect = async () => {
    if (!isWalletInstalled) {
      window.open('https://phantom.app/', '_blank');
      return;
    }

    try {
      setConnecting(true);
      const solanaWindow = window as any;
      const provider = solanaWindow.solana;
      
      const response = await provider.connect();
      const pubKey = new PublicKey(response.publicKey.toString());
      
      setPublicKey(pubKey);
      setWalletAddress(pubKey.toString());
      setConnected(true);
      
      localStorage.setItem(WALLET_AUTOCONNECT_KEY, 'true');
    } catch (error) {
      console.error('Error connecting wallet:', error);
    } finally {
      setConnecting(false);
    }
  };

  const disconnect = async () => {
    try {
      const solanaWindow = window as any;
      const provider = solanaWindow.solana;
      
      await provider.disconnect();
      setPublicKey(null);
      setWalletAddress(null);
      setConnected(false);
      
      localStorage.removeItem(WALLET_AUTOCONNECT_KEY);
    } catch (error) {
      console.error('Error disconnecting wallet:', error);
    }
  };

  return (
    <WalletContext.Provider
      value={{
        walletAddress,
        publicKey,
        connected,
        connecting,
        connect,
        disconnect,
        isWalletInstalled,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}
