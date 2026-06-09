import { getTokenPairs } from "@/lib/api";
import type { NextRequest } from "next/server";

const HELIUS_RPC = `https://mainnet.helius-rpc.com/?api-key=${process.env.HELIUS_API_KEY ?? ""}`;

async function heliusPost(method: string, params: unknown[]) {
  const res = await fetch(HELIUS_RPC, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: "dbg", method, params }),
    signal: AbortSignal.timeout(5000),
  });
  if (!res.ok) return null;
  const d = await res.json();
  return d?.result ?? null;
}

export async function GET(_req: NextRequest, ctx: { params: Promise<{ address: string }> }) {
  const { address } = await ctx.params;

  const [pairs, asset, sigResult] = await Promise.allSettled([
    getTokenPairs(address),
    heliusPost("getAsset", [{ id: address }]),
    heliusPost("getSignaturesForAddress", [address, { limit: 5 }]),
  ]);

  const pairList = pairs.status === "fulfilled" ? pairs.value : [];
  const assetData = asset.status === "fulfilled" ? asset.value : null;
  const sigs: Array<{ signature: string }> = sigResult.status === "fulfilled" ? (sigResult.value ?? []) : [];

  // Fetch oldest available transaction to find launch program
  let oldestTxPrograms: string[] = [];
  if (sigs.length > 0) {
    const oldestSig = sigs[sigs.length - 1].signature;
    const tx = await heliusPost("getTransaction", [oldestSig, { encoding: "jsonParsed", maxSupportedTransactionVersion: 0 }]);
    if (tx) {
      oldestTxPrograms = (tx.transaction?.message?.accountKeys ?? []).map(
        (k: { pubkey: string } | string) => (typeof k === "string" ? k : k.pubkey),
      );
    }
  }

  return Response.json({
    address,
    // DexScreener signals
    dexscreener: {
      pairCount: pairList.length,
      pairs: pairList.map((p) => ({
        dexId: p.dexId,
        labels: p.labels ?? [],
        liquidity: p.liquidity?.usd ?? 0,
      })),
    },
    // On-chain signals from Helius DAS
    onchain: {
      updateAuthority: assetData?.authorities?.[0]?.address ?? null,
      allAuthorities: (assetData?.authorities ?? []).map((a: { address: string }) => a.address),
      creators: (assetData?.creators ?? []).map((c: { address: string; verified: boolean }) => ({
        address: c.address,
        verified: c.verified,
      })),
      jsonUri: assetData?.content?.json_uri ?? null,
      // Programs involved in the oldest available transaction
      oldestTxPrograms,
    },
  });
}
