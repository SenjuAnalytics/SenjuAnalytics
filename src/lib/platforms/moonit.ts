import type { PlatformDef } from "./types";

export const moonit: PlatformDef = {
  id: "moonit",
  name: "Moonit",
  color: "#818cf8",
  tokenUrl: (m) => `https://moonit.fun/token/${m}`,

  detect: ({ dexIds, labels }) =>
    dexIds.includes("moonit") ||
    labels.some((l) => l.toLowerCase() === "moonit"),
};
