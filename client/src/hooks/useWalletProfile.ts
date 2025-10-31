import { useQuery } from '@tanstack/react-query';

export interface WalletProfile {
  id: number;
  walletAddress: string;
  username: string;
  createdAt: string;
}

export function useWalletProfile(walletAddress: string | null) {
  const { data: profile, isLoading, error, refetch } = useQuery<WalletProfile | null>({
    queryKey: ['/api/wallet/profile', walletAddress],
    enabled: !!walletAddress,
    retry: false,
    queryFn: async () => {
      if (!walletAddress) return null;
      
      const res = await fetch(`/api/wallet/profile/${walletAddress}`);
      
      if (res.status === 404) {
        return null;
      }
      
      if (!res.ok) {
        throw new Error(`${res.status}: ${res.statusText}`);
      }
      
      return await res.json();
    },
  });

  return {
    profile,
    isLoading,
    error,
    hasProfile: !!profile,
    needsProfile: !isLoading && !error && !profile && !!walletAddress,
    refetch,
  };
}
