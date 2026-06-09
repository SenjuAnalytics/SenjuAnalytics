import type { PlatformDef } from "./types";

// Raydium pool type labels — indicate trading venue, not launch origin
const RAYDIUM_POOL_LABELS = new Set(["clmm", "cpmm", "amm"]);

export const raydium: PlatformDef = {
  id: "raydium",
  name: "Raydium",
  color: "#c084fc",
  tokenUrl: (m) => `https://raydium.io/swap/?outputMint=${m}`,

  detect: ({ dexIds, labels }) => {
    if (!dexIds.includes("raydium")) return false;
    // Only claim Raydium as launch platform when no other launch-specific labels exist.
    // Graduated tokens from pump.fun carry the "pump" label — those are handled by pumpfun.ts first.
    // If only generic pool type labels (CLMM, CPMM, AMM) are present, this is a direct Raydium listing.
    const nonPoolLabels = labels.filter((l) => !RAYDIUM_POOL_LABELS.has(l.toLowerCase()));
    return nonPoolLabels.length === 0;
  },
};
