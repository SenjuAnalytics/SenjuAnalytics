import type { LaunchPlatform } from "@/types/token";
import type { DetectContext, PlatformDef } from "./types";
import { toLaunchPlatform } from "./types";

import { pumpfun }     from "./pumpfun";
import { moonshot }    from "./moonshot";
import { meteoradbc }  from "./meteoradbc";
import { launchlab }   from "./launchlab";
import { bags }        from "./bags";
import { believe }     from "./believe";
import { boop }        from "./boop";
import { letsbonk }    from "./letsbonk";
import { virtuals }    from "./virtuals";
import { moonit }      from "./moonit";
import { heaven }      from "./heaven";
import { fluxbeam }    from "./fluxbeam";
import { raydium }     from "./raydium";

export type { PlatformDef, DetectContext };
export { toLaunchPlatform };

/**
 * Ordered list of all supported launch platforms.
 * Platforms with on-chain pool checks (pumpfun, moonshot) are listed first
 * to take priority over DexScreener-only platforms.
 */
export const PLATFORMS: PlatformDef[] = [
  pumpfun,       // on-chain PDA check
  moonshot,      // on-chain PDA check + DexScreener
  meteoradbc,    // on-chain PDA check + DexScreener label "DBC"
  launchlab,
  bags,
  believe,
  boop,
  letsbonk,
  virtuals,
  moonit,
  heaven,
  fluxbeam,
  raydium,  // lowest priority — direct Raydium listings only
];

/**
 * Detect the launch platform for a given token.
 * All platform detectors run in parallel — no sequential latency.
 * Returns the first platform whose detect() resolves to true, or null if none found.
 */
export async function detectLaunchPlatform(
  ctx: DetectContext,
): Promise<LaunchPlatform | null> {
  const results = await Promise.allSettled(PLATFORMS.map((p) => p.detect(ctx)));

  for (let i = 0; i < PLATFORMS.length; i++) {
    const r = results[i];
    if (r.status === "fulfilled" && r.value === true) {
      const def = PLATFORMS[i];
      const [mode, creationMode] = await Promise.all([
        def.getMode        ? Promise.resolve(def.getMode(ctx)).catch(() => null)        : Promise.resolve(null),
        def.getCreationMode ? Promise.resolve(def.getCreationMode(ctx)).catch(() => null) : Promise.resolve(null),
      ]);
      return toLaunchPlatform(def, ctx.mint, mode, creationMode);
    }
  }
  return null;
}

/**
 * Registry map for quick lookup by platform id (e.g. for badge rendering).
 */
export const PLATFORM_REGISTRY: Record<string, PlatformDef> = Object.fromEntries(
  PLATFORMS.map((p) => [p.id, p]),
);
