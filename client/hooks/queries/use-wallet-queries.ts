// digital wallet and ledger statement query hooks using tanstack query
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type { Wallet, LedgerTransaction } from '@/types';

export const WALLET_KEYS = {
  me: ['wallets', 'me'] as const,
  all: ['wallets', 'all'] as const,
};

export function useMyWalletQuery(enabled = true) {
  return useQuery({
    queryKey: WALLET_KEYS.me,
    queryFn: async (): Promise<{ wallet: Wallet; transactions: LedgerTransaction[] }> => {
      const data = await apiClient.get<any, { wallet: Wallet; transactions: LedgerTransaction[] }>(
        '/wallets/me'
      );
      return data;
    },
    enabled,
    refetchInterval: 10000,
  });
}

export function useAllWalletsQuery(enabled = true) {
  return useQuery({
    queryKey: WALLET_KEYS.all,
    queryFn: async (): Promise<Wallet[]> => {
      const data = await apiClient.get<any, Wallet[]>('/wallets/admin/all');
      return data;
    },
    enabled,
  });
}
