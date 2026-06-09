import type { FeeClaimRecord } from "@/types/token";
import type { FeeSource } from "./types";
import { pumpswapFeeSource } from "./sources/pumpswap";
import { pumpfunFeeSource } from "./sources/pumpfun";
import { raydiumFeeSource } from "./sources/raydium";

// ── Mode system re-exports ───────────────────────────────────
export { detectFeeMode, FEE_MODE_INFO } from "./modes";
export type { FeeMode, FeeModeResult, FeeModeInfo } from "./modes";
export { getCreatorVaultData } from "./modes/creator";
export type { CreatorVaultData } from "./modes/creator";
export { getCashbackStats, getUnclaimedCashback } from "./modes/cashback";
export type { CashbackStats, CashbackDistributionRecord } from "./modes/types";
export { getAgentStats } from "./modes/agent";
export type { AgentStats, AgentCurrencyStats } from "./modes/types";

/**
 * Registry of all fee sources (per-DEX claim detectors).
 * Add new sources here to extend fee detection — no other files need to change.
 */
const SOURCES: FeeSource[] = [
  pumpswapFeeSource,
  pumpfunFeeSource,
  raydiumFeeSource,
];

/**
 * Fetch fee claim records from all registered sources in parallel.
 * Results are merged and sorted newest-first.
 * A failed source is silently skipped.
 */
export async function getAllFeeClaims(mint: string): Promise<FeeClaimRecord[]> {
  const results = await Promise.allSettled(
    SOURCES.map((s) => s.getFeeClaims(mint)),
  );

  const all = results
    .filter((r): r is PromiseFulfilledResult<FeeClaimRecord[]> => r.status === "fulfilled")
    .flatMap((r) => r.value)
    .sort((a, b) => b.timestamp - a.timestamp);

  // Deduplicate by signature (multiple sources may detect the same tx)
  const seen = new Set<string>();
  return all.filter((r) => {
    if (seen.has(r.signature)) return false;
    seen.add(r.signature);
    return true;
  });
}

export { SOURCES };
export type { FeeSource };
