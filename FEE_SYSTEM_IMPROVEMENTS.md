# Fee System - Optional Improvements

Dokumen ini berisi rekomendasi peningkatan **opsional** untuk fee system. Implementasi saat ini sudah sangat baik dan akurat, improvements ini hanya untuk menambah informasi kepada user.

---

## 1. Dynamic Fee Rate Display (Creator Mode)

### Konsep
Tampilkan expected creator fee rate berdasarkan current market cap token.

### Implementasi

**File baru:** `src/lib/fees/fee-calculator.ts`

```typescript
/**
 * Calculate expected creator fee rate based on market cap.
 * Based on official Pump.fun fee structure (PumpSwap graduated tokens).
 * 
 * Source: https://intercom.help/pumpfun-web/en/articles/11002413
 */

export interface FeeRateInfo {
  marketCapSol: number;
  totalFeePercent: number;
  protocolFeePercent: number;
  creatorFeePercent: number;
  lpFeePercent: number;
  range: string;
}

const FEE_TIERS = [
  { min: 0, max: 420, total: 1.25, protocol: 0.93, creator: 0.30, lp: 0.02 },
  { min: 420, max: 1470, total: 1.20, protocol: 0.05, creator: 0.95, lp: 0.20 },
  { min: 1470, max: 2460, total: 1.15, protocol: 0.05, creator: 0.90, lp: 0.20 },
  { min: 2460, max: 3440, total: 1.10, protocol: 0.05, creator: 0.85, lp: 0.20 },
  { min: 3440, max: 4920, total: 1.05, protocol: 0.05, creator: 0.80, lp: 0.20 },
  { min: 4920, max: 6890, total: 1.00, protocol: 0.05, creator: 0.75, lp: 0.20 },
  { min: 6890, max: 9850, total: 0.95, protocol: 0.05, creator: 0.70, lp: 0.20 },
  { min: 9850, max: 13800, total: 0.90, protocol: 0.05, creator: 0.65, lp: 0.20 },
  { min: 13800, max: 19700, total: 0.85, protocol: 0.05, creator: 0.60, lp: 0.20 },
  { min: 19700, max: 27600, total: 0.80, protocol: 0.05, creator: 0.55, lp: 0.20 },
  { min: 27600, max: 39400, total: 0.75, protocol: 0.05, creator: 0.50, lp: 0.20 },
  { min: 39400, max: 55300, total: 0.70, protocol: 0.05, creator: 0.45, lp: 0.20 },
  { min: 55300, max: 69100, total: 0.65, protocol: 0.05, creator: 0.40, lp: 0.20 },
  { min: 69100, max: 78800, total: 0.60, protocol: 0.05, creator: 0.35, lp: 0.20 },
  { min: 78800, max: 88500, total: 0.55, protocol: 0.05, creator: 0.30, lp: 0.20 },
  { min: 88500, max: 98240, total: 0.50, protocol: 0.05, creator: 0.25, lp: 0.20 },
  { min: 98240, max: Infinity, total: 0.30, protocol: 0.05, creator: 0.05, lp: 0.20 },
];

export function calculateFeeRate(marketCapSol: number): FeeRateInfo {
  const tier = FEE_TIERS.find(t => marketCapSol >= t.min && marketCapSol < t.max) ?? FEE_TIERS[FEE_TIERS.length - 1];
  
  return {
    marketCapSol,
    totalFeePercent: tier.total,
    protocolFeePercent: tier.protocol,
    creatorFeePercent: tier.creator,
    lpFeePercent: tier.lp,
    range: tier.max === Infinity 
      ? `${tier.min.toLocaleString()}+ SOL`
      : `${tier.min.toLocaleString()}–${tier.max.toLocaleString()} SOL`,
  };
}

/**
 * Get fee rate for bonding curve (before graduation).
 * Fixed rate: 1.25% total (0.95% protocol, 0.30% creator)
 */
export function getBondingCurveFeeRate(): FeeRateInfo {
  return {
    marketCapSol: 0,
    totalFeePercent: 1.25,
    protocolFeePercent: 0.95,
    creatorFeePercent: 0.30,
    lpFeePercent: 0,
    range: "Bonding Curve",
  };
}
```

### UI Update

**File:** `src/components/dashboard/FeeClaimTab.tsx`

Tambahkan info card untuk display fee rate:

```typescript
// Import
import { calculateFeeRate, getBondingCurveFeeRate } from "@/lib/fees/fee-calculator";

// Di dalam component, setelah fetch data
const marketCapSol = tokenPriceUsd && tokenSupply 
  ? (tokenPriceUsd * tokenSupply) / solPrice 
  : 0;

const feeRateInfo = marketCapSol > 0 
  ? calculateFeeRate(marketCapSol) 
  : getBondingCurveFeeRate();

// Tambahkan card di UI (setelah mode banner)
{isCreator && (
  <Card className="bg-card border-border/50">
    <CardHeader className="pb-2">
      <CardTitle className="text-sm font-medium text-muted-foreground">
        Current Fee Structure
      </CardTitle>
    </CardHeader>
    <CardContent>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div>
          <p className="text-muted-foreground mb-1">Market Cap Range</p>
          <p className="font-mono font-semibold text-white">{feeRateInfo.range}</p>
        </div>
        <div>
          <p className="text-muted-foreground mb-1">Creator Fee</p>
          <p className="font-mono font-semibold text-[#14d4e8]">
            {feeRateInfo.creatorFeePercent.toFixed(2)}%
          </p>
        </div>
        <div>
          <p className="text-muted-foreground mb-1">Protocol Fee</p>
          <p className="font-mono font-semibold text-muted-foreground">
            {feeRateInfo.protocolFeePercent.toFixed(2)}%
          </p>
        </div>
        <div>
          <p className="text-muted-foreground mb-1">Total Fee</p>
          <p className="font-mono font-semibold text-white">
            {feeRateInfo.totalFeePercent.toFixed(2)}%
          </p>
        </div>
      </div>
      <p className="text-[10px] text-muted-foreground/60 mt-2">
        Fee rates scale dynamically based on market cap. Higher market cap = lower creator fee.
      </p>
    </CardContent>
  </Card>
)}
```

---

## 2. Mayhem Mode Enhanced Display

### Konsep
Tampilkan informasi lebih detail tentang Mayhem mode dan warning bahwa creator fees tidak applicable.

### Implementasi

**File:** `src/lib/fees/modes/types.ts`

Update `FEE_MODE_INFO` untuk Mayhem:

```typescript
mayhem: {
  mode: "mayhem",
  label: "Mayhem",
  color: "#ef4444",
  description: "AI agent traded this token for 24 hours after launch with 1B additional tokens (2B total supply). Mayhem fees go to protocol, not creator. Unsold agent tokens were burned after 24h.",
  features: [
    "2B total supply (1B extra for AI agent)",
    "AI random walk trading for 24 hours",
    "No creator fee claims (fees to Mayhem recipients)",
    "Unsold agent tokens burned after period",
  ],
},
```

**File:** `src/components/dashboard/FeeClaimTab.tsx`

Update `ModeBanner` untuk show features:

```typescript
function ModeBanner({ modeInfo }: { modeInfo: FeeModeInfo }) {
  const Icon = MODE_ICONS[modeInfo.mode] ?? Coins;
  return (
    <Card className="bg-card border-border/50 overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border/40" style={{ backgroundColor: `${modeInfo.color}08` }}>
        <Icon className="h-3.5 w-3.5" style={{ color: modeInfo.color }} />
        <span className="text-xs font-semibold tracking-wide" style={{ color: `${modeInfo.color}e0` }}>{modeInfo.label} Mode</span>
        <Badge variant="outline" className={`ml-auto ${TEXT_MICRO} py-0`} style={{ borderColor: `${modeInfo.color}30`, color: modeInfo.color }}>active</Badge>
      </div>
      <CardContent className="py-3 px-4">
        <p className="text-xs text-muted-foreground leading-relaxed mb-2">{modeInfo.description}</p>
        {modeInfo.features && modeInfo.features.length > 0 && (
          <ul className="text-[10px] text-muted-foreground/70 space-y-0.5 ml-4 list-disc">
            {modeInfo.features.map((feature, i) => (
              <li key={i}>{feature}</li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
```

---

## 3. Documentation Links in UI

### Konsep
Tambahkan link ke official Pump.fun documentation untuk setiap mode.

### Implementasi

**File:** `src/lib/fees/modes/types.ts`

Tambahkan field `docsUrl`:

```typescript
export interface FeeModeInfo {
  mode: FeeMode;
  label: string;
  color: string;
  description: string;
  features?: string[];
  docsUrl?: string; // NEW
}

export const FEE_MODE_INFO: Record<FeeMode, FeeModeInfo> = {
  creator: {
    mode: "creator",
    label: "Creator",
    color: "#f59e0b",
    description: "Standard creator fee model. Fees accumulate in creator vault and can be claimed anytime.",
    docsUrl: "https://intercom.help/pumpfun-web/en/articles/11002413-transaction-fees-on-pump-fun",
  },
  cashback: {
    mode: "cashback",
    label: "Cashback",
    color: "#00ff94",
    description: "100% of creator fees are redirected to traders as cashback. This decision was made at launch and cannot be changed.",
    docsUrl: "https://pump.fun/docs/cashback-coins", // hypothetical
  },
  mayhem: {
    mode: "mayhem",
    label: "Mayhem",
    color: "#ef4444",
    description: "AI agent traded this token for 24 hours after launch with 1B additional tokens (2B total supply). Mayhem fees go to protocol, not creator.",
    docsUrl: "https://pump.fun/docs/mayhem-mode",
  },
  agent: {
    mode: "agent",
    label: "Agent",
    color: "#a78bfa",
    description: "Tokenized agent with automated buyback and burn. A percentage of agent revenue is used to buy back and burn tokens.",
    docsUrl: "https://pump.fun/docs/tokenized-agent-disclaimer",
  },
};
```

**File:** `src/components/dashboard/FeeClaimTab.tsx`

Tambahkan link button di `ModeBanner`:

```typescript
import { ExternalLink } from "lucide-react";

function ModeBanner({ modeInfo }: { modeInfo: FeeModeInfo }) {
  const Icon = MODE_ICONS[modeInfo.mode] ?? Coins;
  return (
    <Card className="bg-card border-border/50 overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border/40" style={{ backgroundColor: `${modeInfo.color}08` }}>
        <Icon className="h-3.5 w-3.5" style={{ color: modeInfo.color }} />
        <span className="text-xs font-semibold tracking-wide" style={{ color: `${modeInfo.color}e0` }}>{modeInfo.label} Mode</span>
        <Badge variant="outline" className={`ml-auto ${TEXT_MICRO} py-0`} style={{ borderColor: `${modeInfo.color}30`, color: modeInfo.color }}>active</Badge>
        {modeInfo.docsUrl && (
          <a 
            href={modeInfo.docsUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            className="ml-2 text-muted-foreground hover:text-white transition-colors"
          >
            <ExternalLink className="h-3 w-3" />
          </a>
        )}
      </div>
      <CardContent className="py-3 px-4">
        <p className="text-xs text-muted-foreground leading-relaxed">{modeInfo.description}</p>
      </CardContent>
    </Card>
  );
}
```

---

## 4. Inline Code Comments with Doc References

### Konsep
Tambahkan comments di code yang reference official documentation untuk maintainability.

### Implementasi

**File:** `src/lib/fees/modes/index.ts`

```typescript
/**
 * Fee mode detection registry.
 *
 * Reads the bonding curve account and agent PDA to determine which
 * fee mode a token uses. The result includes both the mode enum and
 * the full FeeModeInfo descriptor for direct use in API/UI.
 *
 * Official Documentation:
 * - Creator Mode: https://intercom.help/pumpfun-web/en/articles/11002413
 * - Cashback Mode: https://pump.fun/docs/cashback-coins
 * - Mayhem Mode: https://pump.fun/docs/mayhem-mode
 * - Agent Mode: https://pump.fun/docs/tokenized-agent-disclaimer
 *
 * Bonding Curve Layout (pump-fun/pump-public-docs):
 *   Byte 48  → complete        (bool)
 *   Byte 49  → creator         (Pubkey, 32 bytes)
 *   Byte 81  → is_mayhem_mode  (bool)
 *   Byte 82  → cashback_enabled(bool)
 */
```

**File:** `src/lib/fees/modes/agent.ts`

```typescript
/**
 * Agent mode — read tokenAgentPayments PDA and per-currency stats.
 *
 * Official Documentation:
 * - https://pump.fun/docs/tokenized-agent-disclaimer
 * - SDK: @pump-fun/agent-payments-sdk v3.0.2
 *
 * On-chain account layout (from IDL):
 * ...
 */
```

---

## 5. Error Handling & Fallbacks

### Konsep
Improve error messages dan fallback behavior saat RPC calls fail.

### Implementasi

**File:** `src/lib/fees/modes/agent.ts`

```typescript
export async function getAgentStats(mint: string): Promise<AgentStats | null> {
  try {
    // ... existing code ...
  } catch (err) {
    // Enhanced error logging
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error(`[agent] Failed to read agent stats for ${mint}:`, {
      error: errorMsg,
      mint: mint.slice(0, 8),
      timestamp: new Date().toISOString(),
    });
    
    // Return null instead of throwing to allow graceful degradation
    return null;
  }
}
```

**File:** `src/components/dashboard/FeeClaimTab.tsx`

```typescript
// Show error state jika mode detection failed tapi data lain berhasil
{!modeInfo && fees.length > 0 && (
  <Card className="bg-yellow-500/10 border-yellow-500/30">
    <CardContent className="py-3 px-4">
      <p className="text-xs text-yellow-200">
        ⚠️ Unable to detect fee mode. Displaying available fee claim data.
      </p>
    </CardContent>
  </Card>
)}
```

---

## Priority & Effort Estimate

| Improvement | Priority | Effort | Impact |
|------------|----------|--------|--------|
| 1. Dynamic Fee Rate Display | Low | Medium | Medium |
| 2. Mayhem Mode Enhanced Display | Low | Low | Low |
| 3. Documentation Links | Low | Low | Medium |
| 4. Inline Code Comments | Medium | Low | High (maintainability) |
| 5. Error Handling | Medium | Low | Medium |

**Rekomendasi:**
- Mulai dengan #4 (Inline Code Comments) - effort rendah, impact tinggi untuk maintainability
- Lanjut dengan #3 (Documentation Links) - mudah dan helpful untuk users
- #1, #2, #5 bisa dilakukan jika ada waktu extra

---

## Catatan Penting

**Semua improvements ini bersifat OPSIONAL.**

Implementasi saat ini sudah sangat baik dan tidak ada bug. Improvements ini hanya menambah polish dan user experience, bukan fix untuk masalah yang ada.

Jika waktu terbatas, lebih baik fokus ke fitur baru atau area lain yang lebih critical.

---

**Dibuat:** 11 April 2026  
**Status:** Optional Enhancements
