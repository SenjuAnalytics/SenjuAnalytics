import { PublicKey } from "@solana/web3.js";
import { getAccountOwner, getAccountData, getTokenBalance, getSolPriceUsd, getAccountCreationTime } from "./rpc";
import type { PlatformDef } from "./types";

const BONDING_CURVE_PROGRAM = new PublicKey("6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P");
// Mayhem AI agent program: MAyhSmzXzV1pTf7LsNkrNwkWKTo4ougAJ1PPg47MD4e
// (NOT the bonding curve program — Mayhem tokens still use 6EF8... for the BC)
// Detection: read byte 81 of the standard BC account (is_mayhem_mode bool)
const AMM_PROGRAM           = new PublicKey("pAMMBay6oceH9fJKBRHGP5D4bD4sWpmSwMn52FMfXEA");
const WSOL                  = new PublicKey("So11111111111111111111111111111111111111112");
// Tokenized Agent payments program — @pump-fun/agent-payments-sdk v3.0.3
// Detection: check if `tokenAgentPayments` PDA exists — seeds: ["token-agent-payments", mint]
const AGENT_PROGRAM         = new PublicKey("AgenTMiC2hvxGebTsgmsD4HHBa8WEcqGFf87iwRRxLo7");

export const pumpfun: PlatformDef = {
  id: "pumpfun",
  name: "Pump.fun",
  color: "#00ff94",
  tokenUrl: (m) => `https://pump.fun/coin/${m}`,
  modeIcons: {
    PumpSwap: "/platforms/pumpswap.png",
    Raydium:  "/platforms/raydium.png",
  },

  detect: async ({ mint, dexIds, labels }) => {
    if (dexIds.includes("pump") || labels.some((l) => l.toLowerCase() === "pump")) return true;

    try {
      const mintKey = new PublicKey(mint);
      const [bcPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("bonding-curve"), mintKey.toBuffer()],
        BONDING_CURVE_PROGRAM,
      );
      const [poolPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("pool"), mintKey.toBuffer(), WSOL.toBuffer()],
        AMM_PROGRAM,
      );
      const [bcOwner, poolOwner] = await Promise.all([
        getAccountOwner(bcPda.toString()),
        getAccountOwner(poolPda.toString()),
      ]);
      return bcOwner === BONDING_CURVE_PROGRAM.toString() || poolOwner === AMM_PROGRAM.toString();
    } catch {
      return false;
    }
  },
};

/**
 * Parse the Pump.fun bonding curve account to extract creation mode flags.
 *
 * Confirmed account layout (pump-fun/pump-public-docs):
 *   0- 7  discriminator (8 bytes)
 *   8-47  reserves + supply (5 × u64 LE)
 *  48     complete        (bool)
 *  49-80  creator         (Pubkey, 32 bytes)
 *  81     is_mayhem_mode  (bool) — added Nov 2025
 *  82     cashback_enabled(bool) — added Feb 2026
 *
 * Returns { isMayhem, isCashback } or null if the account cannot be parsed.
 */
async function parseBondingCurve(
  bcPda: string,
): Promise<{ isMayhem: boolean; isCashback: boolean; isComplete: boolean } | null> {
  const data = await getAccountData(bcPda);
  if (!data || data.length < 82) return null;
  return {
    isComplete: data[48] === 1,
    isMayhem:   data[81] === 1,
    isCashback: data.length > 82 ? data[82] === 1 : false,
  };
}

/**
 * Shared helper — fetches bonding curve data + PumpSwap pool ownership in one round-trip pair.
 *
 * Canonical PumpSwap pool PDA:
 *   seeds: ["pool", pool_authority, base_mint, quote_mint, index(u16 LE)]
 *   pool_authority = findPDA(["pool-authority", base_mint], BONDING_CURVE_PROGRAM)
 *   index = 0 for all pump-migrated canonical pools
 */
async function fetchPumpOnChain(mint: string) {
  const mintKey = new PublicKey(mint);
  const [bcPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("bonding-curve"), mintKey.toBuffer()],
    BONDING_CURVE_PROGRAM,
  );
  const [poolAuthority] = PublicKey.findProgramAddressSync(
    [Buffer.from("pool-authority"), mintKey.toBuffer()],
    BONDING_CURVE_PROGRAM,
  );
  const indexBuf = Buffer.alloc(2);
  indexBuf.writeUInt16LE(0, 0);
  const [poolPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("pool"), poolAuthority.toBuffer(), mintKey.toBuffer(), WSOL.toBuffer(), indexBuf],
    AMM_PROGRAM,
  );
  return Promise.all([
    parseBondingCurve(bcPda.toString()),
    getAccountOwner(poolPda.toString()),
  ]);
}

/** Returns trading phase: "Bonding Curve" | "PumpSwap" | "Raydium" | null */
async function getPumpfunPhase(ctx: import("./types").DetectContext): Promise<string | null> {
  const { mint, dexIds, labels } = ctx;

  if (dexIds.includes("raydium") && labels.some((l) => l.toLowerCase() === "pump")) return "Raydium";

  try {
    const [bcData, poolOwner] = await fetchPumpOnChain(mint);
    if (poolOwner === AMM_PROGRAM.toString()) return "PumpSwap";
    if (bcData && !bcData.isComplete) return "Bonding Curve";
    if (bcData?.isComplete) return "PumpSwap";
  } catch { /* ignore */ }

  if (dexIds.includes("pumpswap")) return "PumpSwap";
  if (dexIds.includes("pump") || labels.some((l) => l.toLowerCase() === "pump")) return "Bonding Curve";
  return null;
}

/**
 * Returns creation mode: "Mayhem" | "Cashback" | "Agent" | "Default".
 */
async function getPumpfunCreationMode(ctx: import("./types").DetectContext): Promise<string | null> {
  try {
    const mintKey = new PublicKey(ctx.mint);
    const [agentPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("token-agent-payments"), mintKey.toBuffer()],
      AGENT_PROGRAM,
    );

    const [[bcData], agentOwner] = await Promise.all([
      fetchPumpOnChain(ctx.mint),
      getAccountOwner(agentPda.toString()),
    ]);

    if (bcData?.isMayhem)                          return "Mayhem";
    if (bcData?.isCashback)                        return "Cashback";
    if (agentOwner === AGENT_PROGRAM.toString())   return "Agent";
    return "Default";
  } catch { /* ignore */ }
  return "Default";
}

pumpfun.getMode         = getPumpfunPhase;
pumpfun.getCreationMode = getPumpfunCreationMode;

/**
 * Bonding-curve account layout:
 *   0- 7  discriminator
 *   8-15  virtual_token_reserves (u64 LE)
 *  16-23  virtual_sol_reserves   (u64 LE)
 *  24-31  real_token_reserves    (u64 LE)
 *  32-39  real_sol_reserves      (u64 LE)
 *  40-47  token_total_supply     (u64 LE)
 *  48     complete               (bool)
 *
 * GlobalConfig PDA: 4wTV1YmiEkRvAtNtsSGPtUrqRYQMe5SKy2uB4Jjaxnjf
 *   89-96: initial_real_token_reserves (u64 LE)
 */
const GLOBAL_CONFIG = "4wTV1YmiEkRvAtNtsSGPtUrqRYQMe5SKy2uB4Jjaxnjf";

/**
 * Derive PumpSwap canonical pool PDA and read token/SOL reserves.
 * Pool layout: 139-170 = pool_base_token_account, 171-202 = pool_quote_token_account
 */
async function readPumpSwapPoolReserves(
  mint: string,
  decimals: number,
): Promise<{
  poolPda: string;
  tokenAmount: number;
  solAmount: number;
  baseBalance: number;
  quoteBalance: number;
} | null> {
  try {
    const mintKey = new PublicKey(mint);
    const [pumpPoolAuthority] = PublicKey.findProgramAddressSync(
      [Buffer.from("pool-authority"), mintKey.toBuffer()],
      BONDING_CURVE_PROGRAM,
    );
    const indexBuf = Buffer.alloc(2);
    indexBuf.writeUInt16LE(0, 0);
    const [poolPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("pool"), indexBuf, pumpPoolAuthority.toBuffer(), mintKey.toBuffer(), WSOL.toBuffer()],
      AMM_PROGRAM,
    );

    const poolData = await getAccountData(poolPda.toString());
    if (!poolData || poolData.length < 203) return null;

    const baseTokenAccount  = new PublicKey(poolData.slice(139, 171)).toString();
    const quoteTokenAccount = new PublicKey(poolData.slice(171, 203)).toString();

    const [baseBalance, quoteBalance] = await Promise.all([
      getTokenBalance(baseTokenAccount),
      getTokenBalance(quoteTokenAccount),
    ]);

    if (baseBalance === 0 || quoteBalance === 0) return null;

    return {
      poolPda: poolPda.toString(),
      tokenAmount: baseBalance / Math.pow(10, decimals),
      solAmount: quoteBalance / 1e9,
      baseBalance,
      quoteBalance,
    };
  } catch {
    return null;
  }
}

export async function getPumpSwapPrice(
  mint: string,
  solPriceUsd: number,
  decimals = 6,
): Promise<{ price: number; marketCap?: number } | null> {
  const reserves = await readPumpSwapPoolReserves(mint, decimals);
  if (!reserves) return null;
  const priceInSol = reserves.solAmount / reserves.tokenAmount;
  const priceUsd   = priceInSol * solPriceUsd;
  return priceUsd > 0 ? { price: priceUsd } : null;
}

export async function getPumpSwapPool(
  mint: string,
  solPriceUsd: number,
  decimals = 6,
  symbol = "???",
): Promise<{
  pairAddress: string;
  dex: string;
  tokenA: { symbol: string; address: string; amount: number };
  tokenB: { symbol: string; address: string; amount: number };
  liquidityUsd: number;
  volume24h: number;
  fees24h: number;
  apr: number;
  createdAt?: number;
} | null> {
  const reserves = await readPumpSwapPoolReserves(mint, decimals);
  if (!reserves) return null;
  const liquidityUsd = reserves.solAmount * solPriceUsd * 2;
  const createdAt = await getAccountCreationTime(reserves.poolPda);
  return {
    pairAddress: reserves.poolPda,
    dex: "pumpswap",
    tokenA: { symbol, address: mint, amount: reserves.tokenAmount },
    tokenB: { symbol: "SOL", address: WSOL.toString(), amount: reserves.solAmount },
    liquidityUsd,
    volume24h: 0,
    fees24h: 0,
    apr: 0,
    createdAt: createdAt ? createdAt * 1000 : undefined,
  };
}

export async function getBondingCurvePool(
  mint: string,
  solPriceUsd: number,
  symbol = "???",
): Promise<{
  pairAddress: string;
  dex: string;
  tokenA: { symbol: string; address: string; amount: number };
  tokenB: { symbol: string; address: string; amount: number };
  liquidityUsd: number;
  volume24h: number;
  fees24h: number;
  apr: number;
  createdAt?: number;
} | null> {
  try {
    const mintKey = new PublicKey(mint);
    const [bcPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("bonding-curve"), mintKey.toBuffer()],
      BONDING_CURVE_PROGRAM,
    );
    const raw = await getAccountData(bcPda.toString());
    if (!raw || raw.length < 49) return null;
    if (raw[48] === 1) return null;

    const virtualTokenRes = Number(raw.readBigUInt64LE(8));
    // virtualSolRes is part of the account layout (read for completeness / future use)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const virtualSolRes   = Number(raw.readBigUInt64LE(16));
    const realSolRes      = Number(raw.readBigUInt64LE(32));
    if (virtualTokenRes === 0) return null;

    const tokenAmount  = virtualTokenRes / 1e6;
    const solAmount    = realSolRes / 1e9;
    const liquidityUsd = solAmount * solPriceUsd * 2;
    const createdAt    = await getAccountCreationTime(bcPda.toString());

    return {
      pairAddress: bcPda.toString(),
      dex: "pumpfun",
      tokenA: { symbol, address: mint, amount: tokenAmount },
      tokenB: { symbol: "SOL", address: WSOL.toString(), amount: solAmount },
      liquidityUsd,
      volume24h: 0,
      fees24h: 0,
      apr: 0,
      createdAt: createdAt ? createdAt * 1000 : undefined,
    };
  } catch {
    return null;
  }
}

export async function getBondingCurveInfo(
  mint: string,
  solPriceUsd?: number,
): Promise<{
  price?: number;
  marketCap?: number;
  progress?: number;
  realSolCollected?: number;
} | null> {
  try {
    const mintKey = new PublicKey(mint);
    const [bcPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("bonding-curve"), mintKey.toBuffer()],
      BONDING_CURVE_PROGRAM,
    );
    const [raw, globalRaw, fetchedSolPrice] = await Promise.all([
      getAccountData(bcPda.toString()),
      getAccountData(GLOBAL_CONFIG),
      solPriceUsd !== undefined ? Promise.resolve(solPriceUsd) : getSolPriceUsd(),
    ]);

    if (!raw || raw.length < 49) return null;
    if (raw[48] === 1) return null;

    const virtualTokenRes = Number(raw.readBigUInt64LE(8));
    const virtualSolRes   = Number(raw.readBigUInt64LE(16));
    const realTokenRes    = Number(raw.readBigUInt64LE(24));
    const realSolRes      = Number(raw.readBigUInt64LE(32));
    const totalSupplyRaw  = Number(raw.readBigUInt64LE(40));
    if (virtualTokenRes === 0) return null;

    const solPriceUsdFinal = fetchedSolPrice as number;
    const priceInSol = (virtualSolRes / 1e9) / (virtualTokenRes / 1e6);
    const priceUsd   = priceInSol * solPriceUsdFinal;
    const marketCap  = priceUsd * (totalSupplyRaw / 1e6);

    let progress: number | undefined;
    if (globalRaw && globalRaw.length >= 97) {
      const initialRealTokenRes = Number(globalRaw.readBigUInt64LE(89));
      if (initialRealTokenRes > 0) {
        const tokensSold = initialRealTokenRes - realTokenRes;
        progress = Math.round(Math.min((tokensSold / initialRealTokenRes) * 100, 100) * 10) / 10;
      }
    }

    return {
      price:            priceUsd > 0  ? priceUsd  : undefined,
      marketCap:        marketCap > 0 ? marketCap : undefined,
      progress,
      realSolCollected: realSolRes / 1e9,
    };
  } catch {
    return null;
  }
}
