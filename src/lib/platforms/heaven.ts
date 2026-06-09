import type { PlatformDef } from "./types";

export const heaven: PlatformDef = {
  id: "heaven",
  name: "Heaven",
  color: "#c4b5fd",
  tokenUrl: (m) => `https://heaven.xyz/token/${m}`,

  detect: ({ dexIds, labels }) =>
    dexIds.includes("heaven") ||
    labels.some((l) => l.toLowerCase() === "heaven"),
};
