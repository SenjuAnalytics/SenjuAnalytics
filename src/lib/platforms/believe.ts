import type { PlatformDef } from "./types";

export const believe: PlatformDef = {
  id: "believe",
  name: "Believe",
  color: "#a78bfa",
  tokenUrl: (m) => `https://believe.app/token/${m}`,

  detect: ({ dexIds, labels }) =>
    dexIds.includes("believe") ||
    labels.some((l) => l.toLowerCase() === "believe"),
};
