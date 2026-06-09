import type { PlatformDef } from "./types";

// NOTE: dbcij3LWUppWqq96dh6gJWwBifmcGfLSB5D4DuSMaqN (Meteora DBC program) is SHARED
// by Bags, Moonit, Boop.fun, and other platforms — PDA checks cannot distinguish
// Meteora DBC native tokens from those built on top of DBC. Use DexScreener only.

export const meteoradbc: PlatformDef = {
  id: "meteoradbc",
  name: "Meteora DBC",
  color: "#38bdf8",
  tokenUrl: (m) => `https://app.meteora.ag/dbc/${m}`,

  detect: ({ dexIds, labels }) => {
    // DexScreener is the only reliable signal — the DBC program is shared infrastructure
    // used by Bags, Moonit, Boop.fun, and others, making on-chain PDA checks ambiguous.
    if (labels.some((l) => l.toUpperCase() === "DBC")) return true;
    return dexIds.includes("meteoradbc") || dexIds.includes("meteora-dbc");
  },
};
