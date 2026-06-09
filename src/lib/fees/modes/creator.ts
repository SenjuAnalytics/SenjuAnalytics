/**
 * Creator fee mode — vault balance and info aggregation.
 *
 * In creator mode (the default), trading fees accumulate in:
 *   - Bonding Curve creator vault (native SOL)  — while on bonding curve
 *   - PumpSwap creator vault ATA (WSOL)         — after graduation
 *
 * The creator can claim at any time via collectCreatorFee / collectCoinCreatorFee.
 *
 * This module re-exports the vault functions from the fee sources so that
 * the fee API route has a single, mode-aware entry point.
 */

import { getVaultBalance as getPumpswapBalance, getVaultInfo as getPumpswapInfo } from "../sources/pumpswap";
import { getBcVaultBalance, getBcVaultInfo } from "../sources/pumpfun";

export interface CreatorVaultData {
  /** Unclaimed SOL (whichever vault is active) */
  unclaimedSol: number;
  /** Vault address info for display */
  vaultInfo: { vaultAta: string; coinCreator: string; poolPda: string } | null;
  /** Which vault source is active */
  vaultSource: "pumpswap" | "pumpfun" | null;
}

/**
 * Get creator vault data — tries PumpSwap first (graduated), falls back to bonding curve.
 */
export async function getCreatorVaultData(mint: string): Promise<CreatorVaultData> {
  const [pumpswapBal, pumpswapInfo, bcBal, bcInfo] = await Promise.all([
    getPumpswapBalance(mint),
    getPumpswapInfo(mint),
    getBcVaultBalance(mint),
    getBcVaultInfo(mint),
  ]);

  // PumpSwap vault takes priority (graduated token)
  if (pumpswapBal > 0 || pumpswapInfo) {
    return {
      unclaimedSol: pumpswapBal > 0 ? pumpswapBal : bcBal,
      vaultInfo: pumpswapInfo ?? bcInfo,
      vaultSource: "pumpswap",
    };
  }

  return {
    unclaimedSol: bcBal,
    vaultInfo: bcInfo,
    vaultSource: bcInfo ? "pumpfun" : null,
  };
}
