import { getFeeClaimRecords } from "@/lib/api";
import { detectFeeMode, getCreatorVaultData, getAgentStats } from "@/lib/fees";
import { getSolPriceUsd } from "@/lib/platforms/rpc";
import { logError } from "@/lib/error-logger";
import type { NextRequest } from "next/server";

export async function GET(_req: NextRequest, ctx: { params: Promise<{ address: string }> }) {
  const { address } = await ctx.params;

  try {
    // Phase 1: mode detection + creator fee claims + vault data + SOL price
    const [fees, modeResult, vaultData, solPrice] = await Promise.all([
      getFeeClaimRecords(address),
      detectFeeMode(address),
      getCreatorVaultData(address),
      getSolPriceUsd(),
    ]);

    const feeMode = modeResult?.mode ?? "creator";
    const modeInfo = modeResult?.info ?? null;

    // Enrich fee claims with USD value
    if (solPrice > 0) {
      for (const fee of fees) {
        if (!fee.usdValue) {
          const sol = fee.amountSol ?? fee.amount / 1e9;
          fee.usdValue = sol * solPrice;
        }
      }
    }

    // Phase 2: agent stats (only for agent mode)
    let agentStats = null;
    if (feeMode === "agent") {
      agentStats = await getAgentStats(address);
    }

    return Response.json({
      fees,
      unclaimedSol: vaultData.unclaimedSol,
      vaultInfo: vaultData.vaultInfo,
      feeMode,
      modeInfo,
      agentStats,
    });
  } catch (error) {
    logError("Failed to fetch fee records", error, { address });
    console.error(`[fees] error for ${address}:`, error);
    return Response.json(
      { error: error instanceof Error ? error.message : "Failed to fetch fee records" },
      { status: 500 }
    );
  }
}
