import { PublicKey } from "@solana/web3.js";
import { getAccountOwner } from "./rpc";
import type { PlatformDef } from "./types";

const MOONSHOT_PROGRAM = new PublicKey("MoonCVVNZFSYkqNXP6bxHLPL6QQJiMagDL3qcqUQTrG");

export const moonshot: PlatformDef = {
  id: "moonshot",
  name: "Moonshot",
  color: "#f97316",
  tokenUrl: (m) => `https://moonshot.money/token/${m}`,

  detect: async ({ mint, dexIds, labels }) => {
    // DexScreener signal (active bonding curve tokens)
    if (dexIds.includes("moonshot") || labels.some((l) => l.toLowerCase() === "moonshot")) return true;

    // Moonit is a rebrand of Moonshot and shares the SAME program (MoonCVVN...).
    // DexScreener correctly returns dexId "moonit" for Moonit tokens.
    // Skip PDA check when DexScreener already identified it as a different platform.
    if (dexIds.includes("moonit")) return false;

    // On-chain curve pool check — seeds: ["curve", mint] → program: MoonC...
    // Works for graduated Moonshot tokens that no longer appear on DexScreener as "moonshot".
    try {
      const mintKey = new PublicKey(mint);
      const [curvePda] = PublicKey.findProgramAddressSync(
        [Buffer.from("curve"), mintKey.toBuffer()],
        MOONSHOT_PROGRAM,
      );
      const owner = await getAccountOwner(curvePda.toString());
      return owner === MOONSHOT_PROGRAM.toString();
    } catch {
      return false;
    }
  },
};
