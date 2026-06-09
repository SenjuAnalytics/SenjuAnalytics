import type { PlatformDef } from "./types";

export const letsbonk: PlatformDef = {
  id: "letsbonk",
  name: "LetsBonk",
  color: "#facc15",
  tokenUrl: (m) => `https://letsbonk.fun/token/${m}`,

  detect: ({ dexIds, labels }) =>
    dexIds.includes("letsbonk") ||
    labels.some((l) => ["letsbonk", "bonk"].includes(l.toLowerCase())),
};
