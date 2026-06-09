import type { PlatformDef } from "./types";

export const virtuals: PlatformDef = {
  id: "virtuals",
  name: "Virtuals",
  color: "#34d399",
  tokenUrl: (m) => `https://app.virtuals.io/token/${m}`,

  detect: ({ dexIds, labels }) =>
    dexIds.includes("virtuals") ||
    labels.some((l) => l.toLowerCase() === "virtuals"),
};
