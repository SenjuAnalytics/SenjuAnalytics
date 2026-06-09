import { PublicKey } from "@solana/web3.js";
import { getAccountOwner } from "./rpc";
import type { PlatformDef } from "./types";

// Boop.fun bonding curve program — confirmed from Bitquery on-chain data
const BOOP_PROGRAM = new PublicKey("boop8hVGQGqehUK2iVEMEnMrL5RbjywRzHKBmBE7ry4");

export const boop: PlatformDef = {
  id: "boop",
  name: "Boop",
  color: "#fb7185",
  tokenUrl: (m) => `https://boop.fun/token/${m}`,

  detect: async ({ mint, dexIds, labels }) => {
    if (dexIds.includes("boop") || labels.some((l) => l.toLowerCase() === "boop")) return true;

    // On-chain check — any account owned by the Boop program tied to this mint
    // seeds: ["pool", mint] (tentative — update if IDL confirms different seeds)
    try {
      const mintKey = new PublicKey(mint);
      const [poolPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("pool"), mintKey.toBuffer()],
        BOOP_PROGRAM,
      );
      const owner = await getAccountOwner(poolPda.toString());
      return owner === BOOP_PROGRAM.toString();
    } catch {
      return false;
    }
  },
};
