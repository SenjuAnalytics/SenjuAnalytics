/**
 * Custom hooks for token data fetching
 * Centralizes all API calls with consistent error handling and caching
 */

import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import type { 
  TokenInfo, 
  TokenPair, 
  TokenLock, 
  BurnRecord, 
  FeeClaimRecord, 
  LiquidityPool 
} from "@/types/token";
import { logError } from "@/lib/error-logger";

// ── Query Keys ────────────────────────────────────────────────

export const queryKeys = {
  token: (address: string) => ["token", address] as const,
  fees: (address: string) => ["fees", address] as const,
  liquidity: (address: string) => ["liquidity", address] as const,
  locks: (address: string) => ["locks", address] as const,
  burns: (address: string) => ["burns", address] as const,
  solPrice: () => ["sol-price"] as const,
} as const;

// ── Response Types ────────────────────────────────────────────

interface TokenResponse {
  token: TokenInfo;
  pairs: TokenPair[];
}

interface FeesResponse {
  fees: FeeClaimRecord[];
  unclaimedSol?: number;
  vaultInfo?: {
    vaultAta: string;
    coinCreator: string;
    poolPda: string;
  } | null;
  feeMode?: "creator" | "cashback" | "mayhem" | "agent";
  modeInfo?: {
    mode: string;
    label: string;
    description: string;
    color: string;
  } | null;
  agentStats?: unknown;
}

interface LiquidityResponse {
  pools: LiquidityPool[];
}

interface LocksResponse {
  locks: TokenLock[];
}

interface BurnsResponse {
  burns: BurnRecord[];
}

// ── Hooks ─────────────────────────────────────────────────────

/**
 * Fetch token info and trading pairs
 */
export function useTokenInfo(address: string): UseQueryResult<TokenResponse> {
  return useQuery({
    queryKey: queryKeys.token(address),
    queryFn: async () => {
      try {
        const res = await fetch(`/api/token/${address}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        return res.json() as Promise<TokenResponse>;
      } catch (error) {
        logError("Failed to fetch token info", error, { address });
        throw error;
      }
    },
    staleTime: 30_000, // 30 seconds
    retry: 2,
  });
}

/**
 * Fetch fee claim records
 */
export function useFeeClaims(address: string): UseQueryResult<FeesResponse> {
  return useQuery({
    queryKey: queryKeys.fees(address),
    queryFn: async () => {
      try {
        const res = await fetch(`/api/token/${address}/fees`);
        if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        return res.json() as Promise<FeesResponse>;
      } catch (error) {
        logError("Failed to fetch fee claims", error, { address });
        throw error;
      }
    },
    staleTime: 30_000,
    retry: 2,
  });
}

/**
 * Fetch liquidity pools
 */
export function useLiquidityPools(address: string): UseQueryResult<LiquidityResponse> {
  return useQuery({
    queryKey: queryKeys.liquidity(address),
    queryFn: async () => {
      try {
        const res = await fetch(`/api/token/${address}/liquidity`);
        if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        return res.json() as Promise<LiquidityResponse>;
      } catch (error) {
        logError("Failed to fetch liquidity pools", error, { address });
        throw error;
      }
    },
    staleTime: 30_000,
    retry: 2,
  });
}

/**
 * Fetch token locks
 */
export function useTokenLocks(address: string): UseQueryResult<LocksResponse> {
  return useQuery({
    queryKey: queryKeys.locks(address),
    queryFn: async () => {
      try {
        const res = await fetch(`/api/token/${address}/locks`);
        if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        return res.json() as Promise<LocksResponse>;
      } catch (error) {
        logError("Failed to fetch token locks", error, { address });
        throw error;
      }
    },
    staleTime: 60_000, // 1 minute (locks change less frequently)
    retry: 2,
  });
}

/**
 * Fetch burn records
 */
export function useBurnRecords(address: string): UseQueryResult<BurnsResponse> {
  return useQuery({
    queryKey: queryKeys.burns(address),
    queryFn: async () => {
      try {
        const res = await fetch(`/api/token/${address}/burns`);
        if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        return res.json() as Promise<BurnsResponse>;
      } catch (error) {
        logError("Failed to fetch burn records", error, { address });
        throw error;
      }
    },
    staleTime: 30_000,
    retry: 2,
  });
}

/**
 * Fetch SOL price in USD
 */
export function useSolPrice(): UseQueryResult<number> {
  return useQuery({
    queryKey: queryKeys.solPrice(),
    queryFn: async () => {
      try {
        const res = await fetch("https://api.binance.com/api/v3/ticker/price?symbol=SOLUSDT");
        if (!res.ok) return 0;
        const data = await res.json();
        return Number(data?.price) || 0;
      } catch (error) {
        logError("Failed to fetch SOL price", error);
        return 0; // Fallback to 0 instead of throwing
      }
    },
    staleTime: 60_000, // 1 minute
    retry: 1,
  });
}

/**
 * Combined hook for token page (fetches token + pairs together)
 */
export function useTokenPage(address: string) {
  const tokenQuery = useTokenInfo(address);
  
  return {
    ...tokenQuery,
    token: tokenQuery.data?.token,
    pairs: tokenQuery.data?.pairs || [],
  };
}
