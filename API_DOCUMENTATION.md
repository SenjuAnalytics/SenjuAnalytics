# 📚 Senju API Documentation

This document describes the internal API routes used by the Senju dashboard.

---

## 🔗 Base URL

```
http://localhost:3000/api  (development)
https://your-domain.com/api (production)
```

---

## 📍 Endpoints

### 1. Get Token Information

Fetch comprehensive token data including metadata, price, market cap, and bonding curve info.

**Endpoint:** `GET /api/token/[address]`

**Parameters:**
- `address` (path) — Solana token mint address (32+ characters)

**Response:**
```typescript
{
  token: {
    address: string;
    name: string;
    symbol: string;
    decimals: number;
    supply: number;
    logoURI?: string;
    description?: string;
    price?: number;
    priceChange24h?: number;
    volume24h?: number;
    marketCap?: number;
    fdv?: number;
    holders?: number;
    bondingCurveProgress?: number;
    bondingCurveRealSol?: number;
    launchPlatform?: {
      id: string;
      name: string;
      color: string;
      tokenUrl: string;
      iconPath: string;
      mode?: string;
      modeIconPath?: string;
      creationMode?: string;
    };
  };
  pairs: Array<{
    pairAddress: string;
    dexId: string;
    baseToken: { address: string; name: string; symbol: string };
    quoteToken: { address: string; name: string; symbol: string };
    priceUsd?: string;
    volume: { h24: number; h6: number; h1: number };
    liquidity?: { usd: number; base: number; quote: number };
    priceChange: { h24: number; h6: number; h1: number };
    txns: { h24: { buys: number; sells: number } };
  }>;
}
```

**Example:**
```bash
curl http://localhost:3000/api/token/DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263
```

**Data Sources:**
- Helius RPC (token metadata, supply)
- Helius DAS API (name, symbol, logo)
- Jupiter API (price)
- DexScreener API (pairs, volume)
- On-chain (bonding curve data)

---

### 2. Get Fee Claims

Fetch creator fee claim records from supported DEXs.

**Endpoint:** `GET /api/token/[address]/fees`

**Parameters:**
- `address` (path) — Token mint address

**Response:**
```typescript
{
  fees: Array<{
    signature: string;
    amount: number;        // Raw amount in lamports
    amountSol?: number;    // Converted to SOL
    timestamp: number;
    claimedBy: string;     // Wallet address
    vaultAddress: string;  // Fee vault account
    poolAddress: string;   // Associated pool
    source: string;        // "pumpswap" | "raydium" | "pumpfun"
    usdValue?: number;
  }>;
  unclaimedSol?: number;
  vaultInfo?: {
    vaultAta: string;
    coinCreator: string;
    poolPda: string;
  } | null;
  feeMode?: "creator" | "cashback" | "mayhem" | "agent";
  modeInfo?: {
    mode: string;
    label: string;
    description: string;
    color: string;
  } | null;
  agentStats?: {
    agentPda: string;
    authority: string;
    buybackBps: number;
    currencies: Array<{
      currencyMint: string;
      currencyLabel: string;
      totalBuyback: number;
      totalWithdrawals: number;
      tokensBurnedRaw: number;
    }>;
    vaultBalances?: {
      paymentVault: number;
      paymentVaultAddress: string;
      buybackVault: number;
      buybackVaultAddress: string;
      withdrawVault: number;
      withdrawVaultAddress: string;
    };
  } | null;
}
```

**Example:**
```bash
curl http://localhost:3000/api/token/DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263/fees
```

**Supported Sources:**
- **PumpSwap** — Creator fees from graduated Pump.fun tokens
- **Pump.fun** — Bonding curve fees
- **Raydium** — CLMM & AMM pool fees

**Fee Modes:**
- **Creator** — Standard creator fee model
- **Cashback** — Fees redistributed to traders
- **Mayhem** — Fees routed to Mayhem recipients
- **Agent** — AI agent revenue with buyback mechanism

---

### 3. Get Liquidity Pools

Fetch all liquidity pools for a token across multiple DEXs.

**Endpoint:** `GET /api/token/[address]/liquidity`

**Parameters:**
- `address` (path) — Token mint address

**Response:**
```typescript
{
  pools: Array<{
    pairAddress: string;
    dex: string;
    tokenA: { symbol: string; address: string; amount: number };
    tokenB: { symbol: string; address: string; amount: number };
    liquidityUsd: number;
    volume24h: number;
    fees24h: number;
    apr: number;
    createdAt?: number;
  }>;
}
```

**Example:**
```bash
curl http://localhost:3000/api/token/DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263/liquidity
```

**Data Sources:**
- DexScreener API (primary)
- On-chain PumpSwap pool (fallback)
- On-chain bonding curve (fallback)

**Supported DEXs:**
- Raydium, Orca, Meteora, PumpSwap, Jupiter, Phoenix, Lifinity, Aldrin, Saber, Serum

---

### 4. Get Token Locks

Fetch token lock records from supported lock programs.

**Endpoint:** `GET /api/token/[address]/locks`

**Parameters:**
- `address` (path) — Token mint address

**Response:**
```typescript
{
  locks: Array<{
    id: string;
    programName: string;
    programId: string;
    amount: number;           // Current locked amount
    amountDeposited?: number; // Original deposit
    unlockDate?: number;
    startTime?: number;
    owner: string;
    recipient?: string;
    isUnlocked: boolean;
    vestingSchedule?: {
      cliff?: number;
      duration?: number;
      periods?: number;
    };
    lockAddress?: string;
    txSignature?: string;
    createdAt: number;
  }>;
}
```

**Example:**
```bash
curl http://localhost:3000/api/token/DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263/locks
```

**Supported Programs:**
- **Streamflow** — On-chain detection via `getProgramAccounts`
- **Unloc** — Coming soon
- **Fluxbeam** — Coming soon
- **Token Lock** — Coming soon

**Detection Method:**
- Direct on-chain reading (no transaction scanning)
- Filters by token mint
- Decodes escrow account data
- Calculates current locked amount

---

### 5. Get Burn Records

Fetch burn and buyback transaction history.

**Endpoint:** `GET /api/token/[address]/burns`

**Parameters:**
- `address` (path) — Token mint address

**Response:**
```typescript
{
  burns: Array<{
    signature: string;
    amount: number;
    timestamp: number;
    burnedBy: string;
    type: "BURN" | "BUYBACK";
    usdValue?: number;
  }>;
}
```

**Example:**
```bash
curl http://localhost:3000/api/token/DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263/burns
```

**Detection:**
- Scans transaction history via Helius API
- Identifies transfers to burn address (`1nc1nerator...`)
- Identifies transfers to null address (`11111111...`)
- Classifies as BURN or BUYBACK based on context

---

## 🔐 Authentication

Currently, all endpoints are **public** and do not require authentication.

**Rate Limiting:**
- No explicit rate limits on API routes
- Underlying data sources (Helius, DexScreener) have their own limits
- Recommended: Implement caching for production

---

## ⚠️ Error Handling

All endpoints return errors in this format:

```typescript
{
  error: string; // Error message
}
```

**HTTP Status Codes:**
- `200` — Success
- `400` — Bad request (invalid address)
- `404` — Token not found
- `500` — Internal server error

**Example Error:**
```json
{
  "error": "Failed to fetch token info"
}
```

---

## 🚀 Performance

### Caching Strategy (Planned)

```typescript
// API route with caching
export const revalidate = 60; // Cache for 60 seconds

// Or use Next.js cache
import { unstable_cache } from 'next/cache';
```

### Optimization Tips

1. **Parallel Requests**
   - Token info, pairs, and price fetched in parallel
   - Fee claims and vault data fetched concurrently

2. **Fallback Sources**
   - Jupiter price → DexScreener → On-chain
   - DexScreener pools → On-chain pools

3. **Error Resilience**
   - Failed sources return empty arrays
   - Partial data still displayed to user

---

## 🧪 Testing

### Manual Testing

```bash
# Test token info
curl http://localhost:3000/api/token/DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263

# Test fees
curl http://localhost:3000/api/token/DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263/fees

# Test liquidity
curl http://localhost:3000/api/token/DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263/liquidity

# Test locks
curl http://localhost:3000/api/token/DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263/locks

# Test burns
curl http://localhost:3000/api/token/DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263/burns
```

### Test Tokens

| Token | Address | Features |
|-------|---------|----------|
| BONK | `DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263` | High volume, multiple DEXs |
| JUP | `JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN` | Jupiter token |
| RAY | `4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R` | Raydium token |
| WIF | `EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm` | Pump.fun graduate |

---

## 📝 Notes

### Data Freshness

- **Token Info:** Real-time (no cache)
- **Pairs:** ~1 minute delay (DexScreener)
- **Fees:** Real-time (on-chain)
- **Locks:** Real-time (on-chain)
- **Burns:** ~1 minute delay (Helius indexing)

### Known Limitations

1. **Transaction History**
   - Limited to last 100 transactions
   - Older burns may not appear

2. **Lock Detection**
   - Only Streamflow fully implemented
   - Other programs coming soon

3. **Fee Claims**
   - Only detects claims, not accruals
   - Unclaimed balance may be approximate

---

## 🔄 Changelog

### v1.0.0 (Current)
- Initial API implementation
- Token info, fees, liquidity, locks, burns
- Multi-platform support
- Fee mode detection

### Planned Features
- API rate limiting
- Response caching
- Webhook support
- Historical data endpoints

---

## 📞 Support

For API issues or questions:
- Open an issue on GitHub
- Check existing documentation
- Review example responses above

---

**Last Updated:** April 2026
