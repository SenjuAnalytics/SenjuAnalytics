/**
 * Maps DexScreener dexId values to local icon paths in /public/platforms/.
 * Falls back to `/platforms/${dexId}.png` for unmapped dexIds.
 */
const DEX_ICON_MAP: Record<string, string> = {
  pump:      "/platforms/pumpfun.png",
  pumpfun:   "/platforms/pumpfun.png",
  pumpswap:  "/platforms/pumpswap.png",
  raydium:   "/platforms/raydium.png",
  meteora:   "/platforms/meteoradbc.png",
  fluxbeam:  "/platforms/fluxbeam.png",
  letsbonk:  "/platforms/letsbonk.png",
  moonshot:  "/platforms/moonshot.png",
  virtuals:  "/platforms/virtuals.png",
  bags:      "/platforms/bags.png",
  believe:   "/platforms/believe.png",
  boop:      "/platforms/boop.png",
  moonit:    "/platforms/moonit.png",
  heaven:    "/platforms/heaven.png",
  launchlab: "/platforms/launchlab.png",
};

export function getDexIconPath(dexId: string): string {
  return DEX_ICON_MAP[dexId.toLowerCase()] ?? `/platforms/${dexId}.png`;
}
