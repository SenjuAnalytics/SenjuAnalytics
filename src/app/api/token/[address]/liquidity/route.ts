import { getLiquidityPools, getTokenInfo } from "@/lib/api";
import { getPumpSwapPool, getBondingCurvePool } from "@/lib/platforms/pumpfun";
import { getSolPriceUsd } from "@/lib/platforms/rpc";
import { logError } from "@/lib/error-logger";
import type { NextRequest } from "next/server";

export async function GET(_req: NextRequest, ctx: { params: Promise<{ address: string }> }) {
  const { address } = await ctx.params;

  try {
    const pools = await getLiquidityPools(address);

    // Fallback: if DexScreener returned nothing, check on-chain sources
    if (pools.length === 0) {
      const [solPrice, tokenInfo] = await Promise.all([
        getSolPriceUsd(),
        getTokenInfo(address),
      ]);

      if (solPrice > 0) {
        const sym = tokenInfo?.symbol ?? "???";
        const dec = tokenInfo?.decimals ?? 6;

        // Try PumpSwap pool first (graduated token)
        const swapPool = await getPumpSwapPool(address, solPrice, dec, sym);
        if (swapPool) {
          pools.push(swapPool);
        } else {
          // Try bonding curve (non-graduated token)
          const bcPool = await getBondingCurvePool(address, solPrice, sym);
          if (bcPool) pools.push(bcPool);
        }
      }
    }

    return Response.json({ pools });
  } catch (error) {
    logError("Failed to fetch liquidity", error, { address });
    return Response.json(
      { error: error instanceof Error ? error.message : "Failed to fetch liquidity" },
      { status: 500 }
    );
  }
}
