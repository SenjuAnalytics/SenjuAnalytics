# Pump.fun Agent Mode - Deep Dive Documentation

## Executive Summary

Dokumentasi lengkap tentang Agent Mode (Tokenized Agents) di Pump.fun berdasarkan riset mendalam dari berbagai sumber resmi.

**Sumber Utama:**
- [Tokenized Agent Disclaimer (Official)](https://pump.fun/docs/tokenized-agent-disclaimer)
- [The Defiant - Automated Buyback Tool](https://thedefiant.io/news/defi/pumpfun-launches-automated-buyback-tool-for-ai-agent-tokens)
- Multiple news sources & community documentation

---

## 1. Konsep Dasar

### Apa itu Agent Mode?

**Agent Mode (Tokenized Agents)** adalah fitur yang memungkinkan creator menghubungkan token dengan AI agent yang menghasilkan revenue, dengan automated buyback & burn mechanism.

**Tujuan:**
- Align agent success dengan token value
- Automated deflationary mechanism (supply reduction)
- Community-driven value creation

**Karakteristik Utama:**
- ✅ Automated buyback setiap jam (hourly basis)
- ✅ Configurable buyback percentage (basis points)
- ✅ Multi-currency support (SOL, USDC, USDT, USD1)
- ✅ Automatic token burning setelah buyback
- ✅ Revenue split: buyback vs withdraw

---

## 2. Mekanisme Teknis

### 2.1 Revenue Flow

```
Agent Revenue (SaaS, trading, services, etc.)
    ↓
Agent Deposit Address (unique per token)
    ↓
Payment Vault (WSOL ATA)
    ↓
Automatic Distribution (hourly)
    ↓
    ├─→ Buyback Vault (X% based on buybackBps)
    │       ↓
    │   Swap to Token → Burn
    │
    └─→ Withdraw Vault ((100-X)% if buybackBps < 100%)
            ↓
        Claimable by Authority
```

### 2.2 On-Chain Accounts

**Program ID:**
```
AgenTMiC2hvxGebTsgmsD4HHBa8WEcqGFf87iwRRxLo7
```

**Account Structure:**

#### tokenAgentPayments PDA
- **Seeds:** `["token-agent-payments", mint]`
- **Layout:**
  ```
  Offset | Size | Field
  -------|------|-------
  0      | 8    | discriminator [136, 241, 242, 217, 173, 77, 112, 186]
  8      | 1    | bump (u8)
  9      | 32   | mint (Pubkey)
  41     | 32   | authority (Pubkey)
  73     | 2    | buybackBps (u16 LE)
  -------|------|-------
  Total: 75 bytes minimum
  ```

#### tokenAgentPaymentInCurrency PDA
- **Seeds:** `["payment-in-currency", tokenMint, currencyMint]`
- **Layout:**
  ```
  Offset | Size | Field
  -------|------|-------
  0      | 8    | discriminator [225, 195, 81, 227, 115, 43, 25, 177]
  8      | 32   | mint (Pubkey)
  40     | 32   | currencyMint (Pubkey)
  72     | 8    | totalInvoicePaymentsMade (u64 LE)
  80     | 8    | totalBuyback (u64 LE)
  88     | 8    | totalWithdrawals (u64 LE)
  96     | 8    | tokensBoughtBackAndBurned (u64 LE)
  -------|------|-------
  Total: 104 bytes minimum
  ```

### 2.3 Vault Authorities

**Payment Authority:**
- PDA: Agent PDA itself
- Purpose: Receives incoming revenue

**Buyback Authority:**
- Seeds: `["buyback-authority", mint]`
- Purpose: Holds funds allocated for buyback
- WSOL ATA: Derived from this authority

**Withdraw Authority:**
- Seeds: `["withdraw-authority", mint]`
- Purpose: Holds funds available for creator withdrawal
- WSOL ATA: Derived from this authority

### 2.4 Supported Currencies

| Currency | Mint Address | Decimals |
|----------|--------------|----------|
| SOL (WSOL) | `So11111111111111111111111111111111111111112` | 9 |
| USDC | `EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v` | 6 |
| USDT | `Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB` | 6 |
| USD1 | (TBD) | 6 |

**Note:** Dokumentasi menyebutkan USD1, tapi implementasi saat ini fokus pada SOL, USDC, USDT.

---

## 3. Buyback Mechanism

### 3.1 Timing & Frequency

**Official Documentation:**
> "Token buy backs occur on an hourly basis."

- Buyback dijalankan setiap jam oleh Tokenized Agent Authority
- Centrally controlled oleh Pump Platform
- Automatic & predictable schedule

### 3.2 Buyback Percentage

**buybackBps (Basis Points):**
- Range: 0 - 10,000 (0% - 100%)
- Configurable saat token creation
- **Dapat diubah kapan saja** oleh creator (mutable)
- Common values:
  - 10,000 bps = 100% (all revenue → buyback)
  - 5,000 bps = 50% (split 50/50)
  - 3,000 bps = 30% (30% buyback, 70% withdraw)

**Formula:**
```
Buyback Amount = Total Revenue × (buybackBps / 10,000)
Withdraw Amount = Total Revenue × ((10,000 - buybackBps) / 10,000)
```

### 3.3 Minimum Threshold

**From The Defiant:**
> "Only revenue denominated in SOL and USDC is eligible, and a minimum threshold of $10 in accumulated revenue is required before a buyback is triggered."

- Minimum: **$10 USD equivalent**
- Prevents gas-inefficient micro-buybacks
- Accumulates until threshold met

### 3.4 Conversion Process

**For Non-SOL Currencies (USDC, USDT):**
1. Agent Receipt Asset deposited to Agent Deposit Address
2. Tokenized Agent Authority converts to SOL via routing
3. SOL used to buy Agent Token
4. Agent Token immediately burned

**Routing:**
- Automatic conversion handled by Tokenized Agent Authority
- Likely uses Jupiter or similar aggregator
- Optimized for best execution

---

## 4. Revenue Sources

### 4.1 Agent Deposit Address

**Unique per Token:**
- Each Agent Token has unique deposit address
- Anyone can deposit Agent Receipt Assets (SOL, USDC, USDT, USD1)
- Deposits are **non-refundable and final**

**Use Cases:**
- SaaS subscription payments
- AI agent service fees
- Trading bot profits
- Digital content sales
- Physical goods payments
- Community contributions

### 4.2 Payment Processing

**Important Disclaimers:**
- ❌ Pump Platform is NOT a payment processor
- ❌ Pump Platform does NOT guarantee delivery of goods/services
- ❌ Pump Platform is NOT an escrow service
- ❌ No refunds or dispute resolution
- ⚠️ All deposits are at depositor's risk

**Responsibility:**
- Creator is responsible for delivering promised goods/services
- Creator must ensure compliance with local laws
- Creator must handle customer support

---

## 5. Fee Structure & Economics

### 5.1 Creator Fees (PumpSwap/Raydium)

**Agent Mode tokens STILL receive creator fees** dari trading:
- PumpSwap: 0.05% - 0.95% (based on market cap)
- Raydium: Standard LP fee share
- These fees are SEPARATE from agent revenue

**Vault Locations:**
- PumpSwap Creator Vault: WSOL ATA
- Raydium LP Position: Claimable via standard mechanism

### 5.2 Agent Revenue vs Creator Fees

**Two Separate Revenue Streams:**

1. **Creator Fees** (dari trading):
   - Source: Swap fees on DEX
   - Vault: PumpSwap/Raydium creator vault
   - Claim: Manual via `collectCreatorFee`
   - Tracked by: Existing fee system

2. **Agent Revenue** (dari agent activity):
   - Source: Agent services, products, contributions
   - Vault: Agent Payment/Buyback/Withdraw vaults
   - Distribution: Automatic hourly
   - Tracked by: Agent payments system

**Implementasi Senju:**
- ✅ Sudah track creator fees dengan benar
- ✅ Sudah track agent stats (buyback, withdrawals, burns)
- ⚠️ Perlu clarify di UI bahwa ini dua sistem terpisah

---

## 6. Risks & Disclaimers

### 6.1 Economic Risks

**From Official Documentation:**

1. **Lack of Economic Value**
   - Buyback ≠ guaranteed value increase
   - Tokens don't have intrinsic value
   - Agent revenue ≠ token value

2. **No Expectation of Profit**
   - Not an investment product
   - Not equity or ownership
   - No governance rights
   - No profit/dividend entitlement

3. **Market Manipulation**
   - Fixed hourly buyback = predictable
   - Possible wash trading or collusion
   - Front-running opportunities

4. **Buyback Not Guaranteed**
   - May occur irregularly
   - May cease entirely
   - Past buybacks ≠ future buybacks
   - Not dividends or profit distribution

### 6.2 Technical Risks

1. **Security Risks**
   - Smart contract vulnerabilities
   - Potential exploits or malfunctions
   - User bears all risk

2. **Execution Risk**
   - Price slippage during buyback
   - Network congestion
   - Failed transactions

3. **Autonomous Agent Risk**
   - AI behavior unpredictable
   - May generate inaccurate outputs
   - May fail to complete tasks
   - No guarantee of revenue generation

### 6.3 Regulatory Risks

1. **Securities Laws**
   - Creator must determine if token is security
   - Compliance is creator's responsibility
   - Agent Tokens not intended as securities

2. **Payment Processing**
   - May be subject to payment regulations
   - KYC/AML requirements vary by jurisdiction
   - Creator must ensure compliance

3. **Regulatory Uncertainty**
   - Evolving regulatory landscape
   - Features may be discontinued for regulatory reasons

---

## 7. Comparison: Agent Mode vs Creator Mode

| Aspect | Creator Mode | Agent Mode |
|--------|--------------|------------|
| **Revenue Source** | Trading fees only | Trading fees + Agent revenue |
| **Fee Accumulation** | Manual claim | Automatic hourly distribution |
| **Buyback** | Manual (if desired) | Automated hourly |
| **Burn** | Manual (if desired) | Automatic after buyback |
| **Vault Count** | 1 (creator vault) | 3 (payment, buyback, withdraw) |
| **Currencies** | SOL/WSOL only | SOL, USDC, USDT, USD1 |
| **Configurability** | Fixed at launch | Buyback % mutable |
| **Complexity** | Simple | Complex |
| **Use Case** | Standard tokens | AI agents, services, products |

---

## 8. Implementation Analysis

### 8.1 Current Senju Implementation

**File:** `src/lib/fees/modes/agent.ts`

**✅ What's Correct:**

1. **Account Reading:**
   - ✅ Correct PDA derivation
   - ✅ Correct discriminator validation
   - ✅ Correct offset reading (buybackBps at 73)
   - ✅ Correct u16/u64 LE parsing

2. **Per-Currency Stats:**
   - ✅ Reads SOL, USDC, USDT
   - ✅ Correct PDA derivation per currency
   - ✅ Correct field parsing (totalInvoicePaymentsMade, totalBuyback, totalWithdrawals, tokensBurnedRaw)

3. **Vault Balances:**
   - ✅ Derives buyback authority correctly
   - ✅ Derives withdraw authority correctly
   - ✅ Reads WSOL ATA balances
   - ✅ Handles missing vaults gracefully

4. **UI Display:**
   - ✅ Shows buyback percentage
   - ✅ Shows agent PDA & authority
   - ✅ Shows per-currency breakdown
   - ✅ Shows current vault balances
   - ✅ Conditional display (hides withdraw if 100% buyback)

### 8.2 Potential Enhancements

**1. Add USD1 Support (Future-Proofing):**
```typescript
const KNOWN_CURRENCIES: { mint: string; label: string; decimals: number }[] = [
  { mint: "So11111111111111111111111111111111111111112",  label: "SOL",  decimals: 9 },
  { mint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v", label: "USDC", decimals: 6 },
  { mint: "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB", label: "USDT", decimals: 6 },
  // { mint: "USD1_MINT_ADDRESS_TBD", label: "USD1", decimals: 6 }, // Future
];
```

**2. Display Buyback Schedule Info:**
```typescript
// In UI component
<div className="text-xs text-muted-foreground">
  <Clock className="h-3 w-3 inline mr-1" />
  Buybacks occur automatically every hour
</div>
```

**3. Show Minimum Threshold Warning:**
```typescript
// If vault balance < $10 equivalent
{vaultBalanceSol * solPrice < 10 && (
  <Badge variant="outline" className="text-yellow-500">
    Below $10 minimum threshold
  </Badge>
)}
```

**4. Clarify Two Revenue Streams:**
```typescript
// Add info card explaining creator fees vs agent revenue
<Card>
  <CardHeader>
    <CardTitle>Revenue Streams</CardTitle>
  </CardHeader>
  <CardContent>
    <div className="space-y-2 text-xs">
      <div>
        <strong>Creator Fees:</strong> From trading on PumpSwap/Raydium
        <br />
        <span className="text-muted-foreground">
          Tracked in "Fee Claims" section above
        </span>
      </div>
      <div>
        <strong>Agent Revenue:</strong> From agent services/products
        <br />
        <span className="text-muted-foreground">
          Automatically distributed hourly for buyback & burn
        </span>
      </div>
    </div>
  </CardContent>
</Card>
```

**5. Add Agent Deposit Address Display:**
```typescript
// Derive and show the unique deposit address
// This would require additional PDA derivation logic
// Seeds likely: ["agent-deposit", mint] or similar
```

### 8.3 Missing Information

**Questions for Further Research:**

1. **Agent Deposit Address Derivation:**
   - What are the exact PDA seeds?
   - Is it per-currency or unified?
   - How to display to users?

2. **Buyback Transaction History:**
   - How to track individual buyback events?
   - Are they identifiable on-chain?
   - Instruction discriminator?

3. **Burn Transaction Tracking:**
   - How to verify tokens were actually burned?
   - Burn instruction signature?
   - Total burned vs claimed burned?

4. **Authority Change Mechanism:**
   - How does creator update buybackBps?
   - Instruction name?
   - Can authority be transferred?

---

## 9. Key Takeaways

### For Developers

1. **Two Separate Systems:**
   - Creator fees (trading) ≠ Agent revenue (services)
   - Different vaults, different mechanisms
   - Both should be tracked independently

2. **Hourly Buyback:**
   - Predictable schedule
   - Centrally controlled by Pump
   - Not triggered by user actions

3. **Multi-Currency:**
   - SOL, USDC, USDT supported now
   - USD1 mentioned but not yet active
   - Automatic conversion to SOL for buyback

4. **Mutable Configuration:**
   - buybackBps can be changed anytime
   - Authority can adjust revenue split
   - No lock-in like Cashback mode

### For Users

1. **Not an Investment:**
   - Buyback ≠ guaranteed returns
   - No profit expectation
   - High risk, experimental feature

2. **Agent Performance Matters:**
   - No revenue = no buyback
   - Agent may fail or underperform
   - Community contributions possible

3. **Transparency:**
   - All stats on-chain
   - Verifiable buyback amounts
   - Verifiable burn amounts

4. **Deposits Non-Refundable:**
   - No escrow, no refunds
   - Trust in creator required
   - Verify legitimacy before depositing

---

## 10. Recommendations for Senju

### Priority: HIGH

1. **✅ Current Implementation is Excellent**
   - No bugs found
   - Accurate data reading
   - Comprehensive UI display

2. **⚠️ Add Clarification in UI**
   - Explain two revenue streams (creator fees vs agent revenue)
   - Show that buybacks are hourly & automatic
   - Display minimum $10 threshold info

3. **📝 Documentation**
   - Add inline comments referencing official docs
   - Document PDA derivation logic
   - Add JSDoc for exported functions

### Priority: MEDIUM

4. **🔮 Future Enhancements**
   - Add USD1 support when available
   - Track individual buyback transactions
   - Display agent deposit address
   - Show buyback history timeline

5. **🎨 UI Polish**
   - Add tooltips with explanations
   - Link to official documentation
   - Show buyback schedule countdown (next buyback in X minutes)

### Priority: LOW

6. **📊 Analytics**
   - Calculate effective burn rate
   - Show projected supply reduction
   - Compare buyback efficiency across tokens

---

## 11. References

### Official Documentation
- [Tokenized Agent Disclaimer](https://pump.fun/docs/tokenized-agent-disclaimer)
- [Pump.fun GitHub - pump-public-docs](https://github.com/pump-fun/pump-public-docs)

### News & Analysis
- [The Defiant - Automated Buyback Tool](https://thedefiant.io/news/defi/pumpfun-launches-automated-buyback-tool-for-ai-agent-tokens)
- [AInvest - Automated Buybacks Analysis](https://www.ainvest.com/news/pump-fun-introduces-automated-buybacks-align-ai-agent-success-token-2603/)

### Implementation Files
- `src/lib/fees/modes/agent.ts` - Agent stats reading
- `src/lib/fees/modes/index.ts` - Mode detection
- `src/components/dashboard/FeeClaimTab.tsx` - UI display

### Key Programs
- Agent Payments: `AgenTMiC2hvxGebTsgmsD4HHBa8WEcqGFf87iwRRxLo7`
- Pump Program: `6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P`
- PumpSwap AMM: `pAMMBay6oceH9fJKBRHGP5D4bD4sWpmSwMn52FMfXEA`

---

**Dibuat:** 11 April 2026  
**Versi:** 1.0  
**Status:** Comprehensive Research Complete ✅
