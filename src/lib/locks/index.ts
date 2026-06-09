/**
 * Token lock detection — aggregates locks from all supported programs.
 *
 * Architecture:
 *   src/lib/locks/
 *     index.ts          ← this file (aggregator)
 *     streamflow.ts     ← Streamflow on-chain detection
 *     (future: fluxbeam.ts, unloc.ts, etc.)
 *
 * Each detector reads escrow/lock accounts directly on-chain via
 * getProgramAccounts, which is far more reliable than scanning
 * transaction history.
 */

import type { TokenLock } from "@/types/token";
import { getStreamflowLocks } from "./streamflow";

/** Fetch all token locks across all supported programs. */
export async function getAllLocks(mint: string): Promise<TokenLock[]> {
  const results = await Promise.allSettled([
    getStreamflowLocks(mint),
    // Future: getFluxbeamLocks(mint), getUnlocLocks(mint), etc.
  ]);

  const locks: TokenLock[] = [];
  for (const r of results) {
    if (r.status === "fulfilled") {
      locks.push(...r.value);
    }
  }

  // Sort: active locks first, then by amount descending
  locks.sort((a, b) => {
    if (a.isUnlocked !== b.isUnlocked) return a.isUnlocked ? 1 : -1;
    return b.amount - a.amount;
  });

  return locks;
}
