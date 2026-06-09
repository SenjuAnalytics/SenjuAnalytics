import type { FeeClaimRecord } from "@/types/token";

export interface FeeSource {
  id: string;
  name: string;
  getFeeClaims: (mint: string) => Promise<FeeClaimRecord[]>;
}
