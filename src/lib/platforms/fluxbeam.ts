import type { PlatformDef } from "./types";

export const fluxbeam: PlatformDef = {
  id: "fluxbeam",
  name: "Fluxbeam",
  color: "#60a5fa",
  tokenUrl: (m) => `https://fluxbeam.io/tokens/${m}`,

  detect: ({ dexIds, labels }) =>
    dexIds.includes("fluxbeam") ||
    labels.some((l) => l.toLowerCase() === "fluxbeam"),
};
