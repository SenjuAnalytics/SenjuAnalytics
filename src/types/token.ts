export interface LaunchPlatform {
  id: string;
  name: string;
  color: string;
  tokenUrl: string;
  /** Local icon path served from public/platforms/{id}.png */
  iconPath: string;
  /** Trading phase: "Bonding Curve" | "PumpSwap" | "Raydium" */
  mode?: string;
  /** Icon for the trading phase/mode (e.g. pumpswap.png when mode is "PumpSwap") */
  modeIconPath?: string;
  /** Creation mode: "Cashback" | "Mayhem" | "Agent" — shown as a separate badge */
  creationMode?: string;
}

export interface TokenInfo {
  address: string;
  name: string;
  symbol: string;
  decimals: number;
  supply: number;
  logoURI?: string;
  description?: string;
  price?: number;
  priceChange24h?: number;
  volume24h?: number;
  marketCap?: number;
  fdv?: number;
  holders?: number;
  bondingCurveProgress?: number;
  bondingCurveRealSol?: number;
  launchPlatform?: LaunchPlatform;
  /** raw metadata URI — used for platform detection, stripped before UI display */
  _jsonUri?: string;
}

export interface TokenPair {
  chainId?: string;
  pairAddress: string;
  dexId: string;
  url: string;
  labels?: string[];
  baseToken: { address: string; name: string; symbol: string };
  quoteToken: { address: string; name: string; symbol: string };
  priceNative: string;
  priceUsd?: string;
  txns: {
    h24: { buys: number; sells: number };
    h6: { buys: number; sells: number };
    h1: { buys: number; sells: number };
  };
  volume: { h24: number; h6: number; h1: number };
  priceChange: { h24: number; h6: number; h1: number };
  liquidity?: { usd: number; base: number; quote: number };
  fdv?: number;
  marketCap?: number;
  pairCreatedAt?: number;
}

export interface TokenTransaction {
  signature: string;
  timestamp: number;
  type: "BURN" | "TRANSFER" | "SWAP" | "ADD_LIQUIDITY" | "REMOVE_LIQUIDITY" | "LOCK" | "UNLOCK" | "FEE_CLAIM" | "OTHER";
  amount?: number;
  from?: string;
  to?: string;
  programId?: string;
  description?: string;
  fee?: number;
  nativeTransfers?: Array<{ fromUserAccount: string; toUserAccount: string; amount: number }>;
  tokenTransfers?: Array<{
    fromUserAccount: string;
    toUserAccount: string;
    fromTokenAccount: string;
    toTokenAccount: string;
    tokenAmount: number;
    mint: string;
  }>;
}

export interface TokenLock {
  id: string;
  programName: string;
  programId: string;
  /** Current locked amount (deposited − withdrawn) in smallest unit */
  amount: number;
  /** Total originally deposited in smallest unit */
  amountDeposited?: number;
  unlockDate?: number;
  startTime?: number;
  /** Creator / sender of the lock */
  owner: string;
  /** Recipient who will receive tokens when unlocked */
  recipient?: string;
  isUnlocked: boolean;
  vestingSchedule?: { cliff?: number; duration?: number; periods?: number };
  /** On-chain escrow / lock account address */
  lockAddress?: string;
  /** Transaction signature (may not be available for on-chain reads) */
  txSignature?: string;
  createdAt: number;
}

export interface LiquidityPool {
  pairAddress: string;
  dex: string;
  tokenA: { symbol: string; address: string; amount: number };
  tokenB: { symbol: string; address: string; amount: number };
  liquidityUsd: number;
  volume24h: number;
  fees24h: number;
  apr: number;
  createdAt?: number;
}

export interface BurnRecord {
  signature: string;
  amount: number;
  timestamp: number;
  burnedBy: string;
  type: "BURN" | "BUYBACK";
  usdValue?: number;
}

export interface FeeClaimRecord {
  signature: string;
  /** Amount in smallest unit (lamports for SOL/wSOL) */
  amount: number;
  /** Convenience: amount / 1e9 for SOL-denominated fees */
  amountSol?: number;
  timestamp: number;
  /** Wallet that triggered the claim transaction */
  claimedBy: string;
  /** Fee vault account where fees accumulated before claim */
  vaultAddress: string;
  /** Associated liquidity pool */
  poolAddress: string;
  /** Fee source: "pumpswap" | "raydium" | "meteora" */
  source: string;
  usdValue?: number;
}
