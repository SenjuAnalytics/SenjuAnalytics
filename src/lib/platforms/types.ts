import type { LaunchPlatform } from "@/types/token";

export interface DetectContext {
  mint: string;
  dexIds: string[];
  labels: string[];
}

export interface PlatformDef {
  id: string;
  name: string;
  color: string;
  tokenUrl: (mint: string) => string;
  detect: (ctx: DetectContext) => boolean | Promise<boolean>;
  /** Returns trading phase: "Bonding Curve" | "PumpSwap" | "Raydium" */
  getMode?: (ctx: DetectContext) => string | null | Promise<string | null>;
  /** Returns creation mode: "Cashback" | "Mayhem" | "Agent" | null */
  getCreationMode?: (ctx: DetectContext) => string | null | Promise<string | null>;
  /** Per-mode icon overrides — e.g. { PumpSwap: "/platforms/pumpswap.png" } */
  modeIcons?: Record<string, string>;
}

export function toLaunchPlatform(
  def: PlatformDef,
  mint: string,
  mode?: string | null,
  creationMode?: string | null,
): LaunchPlatform {
  const modeIconPath = mode ? def.modeIcons?.[mode] : undefined;
  return {
    id: def.id,
    name: def.name,
    color: def.color,
    iconPath: `/platforms/${def.id}.png`,
    tokenUrl: def.tokenUrl(mint),
    ...(mode         ? { mode }         : {}),
    ...(modeIconPath ? { modeIconPath }  : {}),
    ...(creationMode ? { creationMode }  : {}),
  };
}
