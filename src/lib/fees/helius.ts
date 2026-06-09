/**
 * Shared Helius utilities for efficient transaction fetching.
 *
 * Key improvement over the old approach:
 *   Old: Helius enhanced transactions API → 100/page, slow, capped at ~2000 txns
 *   New: getSignaturesForAddress RPC → 1000/page, fast, then batch-parse only relevant txns
 *
 * The "intersection" strategy:
 *   1. Fetch ALL signatures for both creator wallet and fee vault
 *   2. Intersect → only transactions involving BOTH are fee claims
 *   3. Batch-parse only those (typically <500 txns) via Helius enhanced API
 *
 * This gives complete historical coverage regardless of creator wallet activity.
 */

const HELIUS_KEY = process.env.HELIUS_API_KEY ?? "";
const HELIUS_RPC = `https://mainnet.helius-rpc.com/?api-key=${HELIUS_KEY}`;
const HELIUS_V0  = "https://api.helius.xyz/v0";

/**
 * Fetch transaction signatures for an address using Solana RPC.
 * Returns all signatures (no limit). Only returns successful (non-errored) transaction signatures.
 */
export async function getAllSignatures(
  address: string,
): Promise<string[]> {
  const sigs: string[] = [];
  let before: string | undefined;

  for (;;) {
    try {
      const params: Record<string, unknown> = { limit: 1000 };
      if (before) params.before = before;

      const res = await fetch(HELIUS_RPC, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: "sigs",
          method: "getSignaturesForAddress",
          params: [address, params],
        }),
        signal: AbortSignal.timeout(10_000),
      });
      if (!res.ok) break;

      const data = await res.json();
      const arr = data.result as {
        signature: string;
        err: unknown;
      }[];
      if (!arr?.length) break;

      for (const s of arr) {
        if (!s.err) sigs.push(s.signature);
      }

      if (arr.length < 1000) break;
      before = arr[arr.length - 1].signature;
    } catch {
      break;
    }
  }

  return sigs;
}

/**
 * Batch-parse transaction signatures using Helius enhanced transactions API.
 * Sends up to 100 signatures per request with limited concurrency.
 */
export async function batchParseTransactions(
  signatures: string[],
  concurrency = 3,
): Promise<Record<string, unknown>[]> {
  const BATCH_SIZE = 100;
  const all: Record<string, unknown>[] = [];
  const batches: string[][] = [];

  for (let i = 0; i < signatures.length; i += BATCH_SIZE) {
    batches.push(signatures.slice(i, i + BATCH_SIZE));
  }

  for (let i = 0; i < batches.length; i += concurrency) {
    const chunk = batches.slice(i, i + concurrency);
    const results = await Promise.allSettled(
      chunk.map(async (batch) => {
        const res = await fetch(
          `${HELIUS_V0}/transactions?api-key=${HELIUS_KEY}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ transactions: batch }),
            signal: AbortSignal.timeout(15_000),
          },
        );
        if (!res.ok) return [];
        return (await res.json()) as Record<string, unknown>[];
      }),
    );

    for (const r of results) {
      if (r.status === "fulfilled" && Array.isArray(r.value)) {
        all.push(...r.value);
      }
    }
  }

  return all;
}

/**
 * Return signatures that appear in BOTH arrays.
 * Used to find fee-claim transactions: only txns involving both the
 * creator wallet AND the fee vault are actual claims.
 */
export function intersectSignatures(a: string[], b: string[]): string[] {
  const setB = new Set(b);
  return a.filter((s) => setB.has(s));
}
