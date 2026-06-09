/**
 * Fee mode type definitions.
 *
 * Pump.fun tokens can have different fee distribution modes,
 * determined at creation and immutable thereafter:
 *
 *   - "creator"  (Default): Fees accumulate in creator vault.
 *                            Creator claims via collectCreatorFee.
 *   - "cashback":           Creator fee redirected to each trader's
 *                            UserVolumeAccumulator PDA. Traders claim
 *                            individually via claim_cashback.
 *   - "mayhem":             Fees routed to Mayhem fee recipients
 *                            (separate program: MAyhSmz...).
 *   - "agent":              Token has a tokenized agent payments PDA
 *                            (AgenTMiC...). Creator fee still flows
 *                            normally, but agent buyback may apply.
 *
 * Source: pump-fun/pump-public-docs
 */

export type FeeMode = "creator" | "cashback" | "mayhem" | "agent";

export interface FeeModeInfo {
  /** Detected fee mode */
  mode: FeeMode;
  /** Human-readable label */
  label: string;
  /** Short explanation for UI */
  description: string;
  /** Accent color for UI */
  color: string;
  /** Icon name hint (lucide) */
  icon: string;
  /** Whether creator vault actively receives fees */
  creatorVaultActive: boolean;
  /** Whether traders can claim cashback */
  traderCashback: boolean;
}

/** Per-mode descriptors — used by UI and API responses. */
export const FEE_MODE_INFO: Record<FeeMode, FeeModeInfo> = {
  creator: {
    mode: "creator",
    label: "Creator Fee",
    description: "Trading fees accumulate in the creator vault. The creator can claim at any time.",
    color: "#f59e0b",
    icon: "Coins",
    creatorVaultActive: true,
    traderCashback: false,
  },
  cashback: {
    mode: "cashback",
    label: "Cashback",
    description:
      "Creator fees are redirected to traders proportional to their swap volume. " +
      "Each trader claims their own cashback via the Pump.fun app. " +
      "Some fees may still reach the creator vault from clients that don't include cashback accounts.",
    color: "#00ff94",
    icon: "Gift",
    creatorVaultActive: false, // vault may still get residual, but not the primary path
    traderCashback: true,
  },
  mayhem: {
    mode: "mayhem",
    label: "Mayhem",
    description:
      "Fees are routed to Mayhem fee recipients managed by the Mayhem program. " +
      "The creator vault is not used for protocol fees in this mode.",
    color: "#ef4444",
    icon: "Flame",
    creatorVaultActive: false,
    traderCashback: false,
  },
  agent: {
    mode: "agent",
    label: "Agent",
    description:
      "This token has an on-chain AI agent via the Agent Payments program. " +
      "Creator fees flow normally, but agent buyback mechanics may apply.",
    color: "#a78bfa",
    icon: "Bot",
    creatorVaultActive: true,
    traderCashback: false,
  },
};

/**
 * Cashback-specific statistics (returned only for cashback mode).
 *
 * These track cashback DISTRIBUTIONS that happen during buy/sell trades
 * on the bonding curve or PumpSwap pool. The creator fee portion is
 * redirected to traders' UserVolumeAccumulator PDAs instead of the
 * creator vault.
 *
 * Note: claim_cashback is global per user (not per token), so we can
 * only track distributions per token, not individual claims.
 */
export interface CashbackStats {
  /** Number of unique accumulator addresses that received cashback from this token */
  uniqueRecipients: number;
  /** Total SOL distributed as cashback via trades on this token */
  totalDistributedSol: number;
  /** Number of trade transactions that included cashback distributions */
  totalDistributions: number;
  /** Individual distribution records (cashback sent during trades) */
  distributions: CashbackDistributionRecord[];
}

/** A single cashback distribution event within a trade transaction. */
export interface CashbackDistributionRecord {
  signature: string;
  timestamp: number;
  /** UserVolumeAccumulator address that received the cashback */
  accumulator: string;
  /** Amount in SOL */
  amountSol: number;
  /** Source: "pump" (bonding curve) or "pumpswap" */
  source: "pump" | "pumpswap";
}

/**
 * Agent-specific statistics (returned only for agent mode).
 *
 * Source: @pump-fun/agent-payments-sdk v3.0.2 IDL
 *   - tokenAgentPayments PDA: ["token-agent-payments", mint]
 *   - tokenAgentPaymentInCurrency PDA: ["payment-in-currency", tokenMint, currencyMint]
 *   - Program: AgenTMiC2hvxGebTsgmsD4HHBa8WEcqGFf87iwRRxLo7
 *
 * Note: creator fees from trading still flow to the creator vault
 * independently of agent buyback. The agent uses EXTERNAL revenue
 * (deposited to the Agent Deposit Address) for buyback + burn.
 */
export interface AgentStats {
  /** tokenAgentPayments PDA address */
  agentPda: string;
  /** Authority that controls the agent settings (withdraw, update bps) */
  authority: string;
  /** Buyback percentage in basis points (0–10000). 10000 = 100% */
  buybackBps: number;
  /** Per-currency payment stats (SOL, USDC, etc.) */
  currencies: AgentCurrencyStats[];
  /** Current vault balances (SOL, in lamports). Shows pending amounts. */
  vaultBalances?: AgentVaultBalances;
}

/** Current SOL balances in the 3 agent vaults (lamports). */
export interface AgentVaultBalances {
  /** SOL waiting to be distributed (paymentVault ATA) */
  paymentVault: number;
  /** SOL waiting to be swapped for buyback (buybackVault ATA) */
  buybackVault: number;
  /** SOL waiting to be withdrawn by authority (withdrawVault ATA) */
  withdrawVault: number;
  /** Vault addresses for display */
  paymentVaultAddress: string;
  buybackVaultAddress: string;
  withdrawVaultAddress: string;
}

/** Per-currency stats from tokenAgentPaymentInCurrency PDA. */
export interface AgentCurrencyStats {
  /** Currency mint address (e.g. WSOL, USDC) */
  currencyMint: string;
  /** Human-readable currency label */
  currencyLabel: string;
  /** Total payments received via acceptPayment (smallest unit) */
  totalInvoicePayments: number;
  /** Total amount sent to buyback vault (smallest unit) */
  totalBuyback: number;
  /** Total amount withdrawn by creator (smallest unit) */
  totalWithdrawals: number;
  /** Total tokens bought back and burned */
  tokensBurnedRaw: number;
}

/** Full fee mode detection result returned by the mode detector. */
export interface FeeModeResult {
  mode: FeeMode;
  info: FeeModeInfo;
}
