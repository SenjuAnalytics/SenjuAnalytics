import type { TokenInfo, TokenPair, TokenTransaction, TokenLock, BurnRecord, FeeClaimRecord, LiquidityPool } from "@/types/token";
import { SOLANA_ADDRESSES, TOKEN_STANDARDS, API_LIMITS, LOCK_PROGRAM_NAMES, FEE_RATES } from "@/lib/constants";

const HELIUS_API_KEY = process.env.HELIUS_API_KEY || "";
const HELIUS_RPC_URL = `https://mainnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}`;
const HELIUS_API_URL = `https://api.helius.xyz/v0`;

// ─── Timeout helper ───────────────────────────────────────────────────────────
// Beberapa API calls tidak punya timeout → untuk token lama yg jarang di-index,
// response bisa hang bertahun-tahun. Vercel serverless timeout-nya 10-30 detik,
// sehingga route return 500 dan frontend tampilkan data kosong.
const RPC_TIMEOUT      = 5_000;  // Helius RPC (getAccountInfo, getAsset, dll)
const EXTERNAL_TIMEOUT = 6_000;  // DexScreener, Jupiter

async function heliusRpc(method: string, params: unknown[]) {
  const res = await fetch(HELIUS_RPC_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: "senju", method, params }),
    signal: AbortSignal.timeout(RPC_TIMEOUT), // ← FIX: tambah timeout
  });
  if (!res.ok) throw new Error(`Helius RPC error: ${res.status}`);
  const data = await res.json();
  if (data.error) throw new Error(data.error.message);
  return data.result;
}

export async function getTokenInfo(mint: string): Promise<TokenInfo> {
  // FIX: DAS getAsset dimasukkan ke dalam Promise.allSettled supaya berjalan
  // PARALEL dengan RPC calls lain (bukan sequential setelah). Sebelumnya,
  // DAS dipanggil SETELAH allSettled selesai → total time = rpc_time + das_time.
  // Sekarang: total time = max(rpc_time, das_time). Hemat 2-4 detik per request.
  // Semua fetch juga diberi timeout agar tidak hang untuk token lama.
  const [accountInfo, largestAccounts, jupPrice, dasResult] = await Promise.allSettled([
    heliusRpc("getAccountInfo", [mint, { encoding: "jsonParsed" }]),
    heliusRpc("getTokenLargestAccounts", [mint]),
    fetch(`https://api.jup.ag/price/v2?ids=${mint}`, {
      signal: AbortSignal.timeout(EXTERNAL_TIMEOUT), // ← FIX
    }).then((r) => r.json()),
    // DAS getAsset kini paralel + ada timeout
    fetch(HELIUS_RPC_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: "senju-das",
        method: "getAsset",
        params: { id: mint },
      }),
      signal: AbortSignal.timeout(RPC_TIMEOUT), // ← FIX
    }).then((r) => r.json()),
  ]);

  const info: TokenInfo = {
    address: mint,
    name: "Unknown Token",
    symbol: "???",
    decimals: 9,
    supply: 0,
  };

  if (accountInfo.status === "fulfilled" && accountInfo.value?.value?.data?.parsed) {
    const parsed = accountInfo.value.value.data.parsed.info;
    info.decimals = parsed.decimals ?? TOKEN_STANDARDS.DEFAULT_DECIMALS;
    info.supply = Number(parsed.supply) / Math.pow(10, parsed.decimals ?? TOKEN_STANDARDS.DEFAULT_DECIMALS);
  }

  if (largestAccounts.status === "fulfilled" && largestAccounts.value?.value) {
    info.holders = largestAccounts.value.value.length;
  }

  if (jupPrice.status === "fulfilled" && jupPrice.value?.data?.[mint]) {
    const priceData = jupPrice.value.data[mint];
    info.price = priceData.price;
    if (info.price && info.supply) {
      info.marketCap = info.price * info.supply;
    }
  }

  // FIX: Proses DAS result dari Promise.allSettled (bukan try-catch terpisah)
  if (dasResult.status === "fulfilled" && dasResult.value?.result) {
    const asset = dasResult.value.result;
    info.name        = asset.content?.metadata?.name || asset.content?.json_uri || info.name;
    info.symbol      = asset.content?.metadata?.symbol || info.symbol;
    info.logoURI     = asset.content?.links?.image || asset.content?.files?.[0]?.uri;
    info.description = asset.content?.metadata?.description;
    info._jsonUri    = asset.content?.json_uri || "";
  }

  return info;
}

export async function getTokenPairs(mint: string): Promise<TokenPair[]> {
  try {
    const res = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${mint}`, {
      signal: AbortSignal.timeout(EXTERNAL_TIMEOUT), // ← FIX: tambah timeout
    });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.pairs || []).filter((p: TokenPair) => !p.chainId || p.chainId === "solana");
  } catch {
    return [];
  }
}

export async function getTokenTransactions(mint: string, limit: number = API_LIMITS.DEFAULT_TX_LIMIT): Promise<TokenTransaction[]> {
  try {
    const url = `${HELIUS_API_URL}/addresses/${mint}/transactions?api-key=${HELIUS_API_KEY}&limit=${limit}`;
    const res = await fetch(url);
    if (!res.ok) return [];
    const rawTxns = await res.json();

    return rawTxns.map((tx: Record<string, unknown>) => {
      const tokenTransfers = (tx.tokenTransfers as TokenTransaction["tokenTransfers"]) || [];
      const nativeTransfers = (tx.nativeTransfers as TokenTransaction["nativeTransfers"]) || [];

      let type: TokenTransaction["type"] = "OTHER";
      const desc = ((tx.description as string) || "").toLowerCase();

      if (tx.type === "BURN" || tokenTransfers.some((t) => t.toUserAccount === SOLANA_ADDRESSES.BURN || t.toUserAccount === SOLANA_ADDRESSES.NULL)) {
        type = "BURN";
      } else if (tx.type === "SWAP" || desc.includes("swap")) {
        type = "SWAP";
      } else if (desc.includes("add liquidity") || tx.type === "ADD_LIQUIDITY") {
        type = "ADD_LIQUIDITY";
      } else if (desc.includes("remove liquidity") || tx.type === "REMOVE_LIQUIDITY") {
        type = "REMOVE_LIQUIDITY";
      } else if (Object.keys(LOCK_PROGRAM_NAMES).some((p) => desc.includes(p))) {
        type = "LOCK";
      } else if (tx.type === "TRANSFER" || desc.includes("transfer")) {
        type = "TRANSFER";
      }

      const burnTransfer = tokenTransfers.find(
        (t) => t.toUserAccount === SOLANA_ADDRESSES.BURN || t.toUserAccount === SOLANA_ADDRESSES.NULL
      );

      return {
        signature: tx.signature as string,
        timestamp: tx.timestamp as number,
        type,
        amount: burnTransfer?.tokenAmount ?? tokenTransfers[0]?.tokenAmount,
        from: tokenTransfers[0]?.fromUserAccount,
        to: tokenTransfers[0]?.toUserAccount,
        description: tx.description as string,
        fee: tx.fee as number,
        tokenTransfers,
        nativeTransfers,
      } as TokenTransaction;
    });
  } catch {
    return [];
  }
}

export async function getTokenLocks(mint: string): Promise<TokenLock[]> {
  const { getAllLocks } = await import("@/lib/locks");
  return getAllLocks(mint);
}

export async function getBurnRecords(mint: string): Promise<BurnRecord[]> {
  try {
    const txns = await getTokenTransactions(mint, API_LIMITS.MAX_TX_LIMIT);
    const burns = txns.filter((tx) => tx.type === "BURN");

    return burns.map((tx) => ({
      signature: tx.signature,
      amount: tx.amount || 0,
      timestamp: tx.timestamp,
      burnedBy: tx.from || "Unknown",
      type: "BURN" as const,
    }));
  } catch {
    return [];
  }
}

export async function getFeeClaimRecords(mint: string): Promise<FeeClaimRecord[]> {
  const { getAllFeeClaims } = await import("@/lib/fees");
  return getAllFeeClaims(mint);
}

export async function getLiquidityPools(mint: string): Promise<LiquidityPool[]> {
  const pairs = await getTokenPairs(mint);
  return pairs.map((pair) => ({
    pairAddress: pair.pairAddress,
    dex: pair.dexId,
    tokenA: {
      symbol: pair.baseToken.symbol,
      address: pair.baseToken.address,
      amount: pair.liquidity?.base || 0,
    },
    tokenB: {
      symbol: pair.quoteToken.symbol,
      address: pair.quoteToken.address,
      amount: pair.liquidity?.quote || 0,
    },
    liquidityUsd: pair.liquidity?.usd || 0,
    volume24h: pair.volume?.h24 || 0,
    fees24h: (pair.volume?.h24 || 0) * FEE_RATES.STANDARD_DEX_FEE,
    apr: pair.liquidity?.usd ? ((pair.volume?.h24 || 0) * FEE_RATES.STANDARD_DEX_FEE * FEE_RATES.DAYS_PER_YEAR * 100) / pair.liquidity.usd : 0,
    createdAt: pair.pairCreatedAt,
  }));
}
