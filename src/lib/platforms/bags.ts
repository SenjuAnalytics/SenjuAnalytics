import type { PlatformDef } from "./types";

export const bags: PlatformDef = {
  id: "bags",
  name: "Bags",
  color: "#e879f9",
  tokenUrl: (m) => `https://bags.fm/token/${m}`,

  detect: ({ dexIds, labels }) =>
    dexIds.includes("bags") ||
    labels.some((l) => l.toLowerCase() === "bags"),
};
