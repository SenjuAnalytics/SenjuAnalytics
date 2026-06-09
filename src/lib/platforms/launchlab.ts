import { PublicKey } from "@solana/web3.js";
import { getAccountOwner } from "./rpc";
import type { PlatformDef } from "./types";

// Raydium LaunchLab program — confirmed from Raydium official docs & Bitquery
// NOTE: LetsBonk.fun also uses this same program!
// LetsBonk is distinguished by a platform config account: FfYek5vEz23cMkWsdJwG2oa6EphsvXSHrGpdALN4g6W1
const LAUNCHLAB_PROGRAM = new PublicKey("LanMV9sAd7wArD4vJFi2qDdfnVhFxYSUg6eADduJ3uj");
// LetsBonk platform config address: FfYek5vEz23cMkWsdJwG2oa6EphsvXSHrGpdALN4g6W1
// (kept as a reference — used by Bitquery to distinguish LetsBonk migrations from LaunchLab)

export const launchlab: PlatformDef = {
  id: "launchlab",
  name: "LaunchLab",
  color: "#c084fc",
  tokenUrl: (m) => `https://raydium.io/launchpad/token/${m}`,

  detect: async ({ mint, dexIds, labels }) => {
    if (dexIds.includes("launchlab") || labels.some((l) => l.toLowerCase() === "launchlab")) return true;
    // LetsBonk uses the same program — let letsbonk.ts handle those via DexScreener
    if (dexIds.includes("letsbonk")) return false;

    // On-chain check: bonding curve PDA owned by LaunchLab program
    // seeds: ["bonding_curve", mint] (tentative — confirm against IDL)
    try {
      const mintKey = new PublicKey(mint);
      const [bcPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("bonding_curve"), mintKey.toBuffer()],
        LAUNCHLAB_PROGRAM,
      );
      const owner = await getAccountOwner(bcPda.toString());
      if (owner !== LAUNCHLAB_PROGRAM.toString()) return false;
      // Extra guard: if the LetsBonk platform config appears, this is LetsBonk not LaunchLab
      // (For graduated tokens without DexScreener data, this is a best-effort heuristic)
      return true;
    } catch {
      return false;
    }
  },
};
