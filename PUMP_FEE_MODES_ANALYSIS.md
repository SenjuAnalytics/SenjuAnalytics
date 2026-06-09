# Pump.fun Fee Modes - Analisis & Verifikasi Implementasi

## Ringkasan Eksekutif

Dokumen ini berisi hasil riset mendalam terhadap dokumentasi resmi Pump.fun tentang semua fee mode yang tersedia, dan membandingkannya dengan implementasi yang ada di proyek Senju.

**Sumber Dokumentasi:**
- [Pump.fun Official Fee Documentation](https://intercom.help/pumpfun-web/en/articles/11002413-transaction-fees-on-pump-fun)
- [Pump.fun GitHub - pump-public-docs](https://github.com/pump-fun/pump-public-docs)
- [Mayhem Mode Documentation](https://pump.fun/docs/mayhem-mode)
- [Tokenized Agent Disclaimer](https://pump.fun/docs/tokenized-agent-disclaimer)

---

## 1. Creator Mode (Default)

### Dokumentasi Resmi

**Fee Structure - Bonding Curve (Before Graduation):**
- Total Fee: **1.25%**
  - Protocol: 0.95%
  - Creator: **0.30%**

**Fee Structure - PumpSwap (After Graduation):**
Fee bervariasi berdasarkan market cap (dalam SOL):

| Market Cap Range | Total Fee | Protocol | Creator | LP |
|-----------------|-----------|----------|---------|-----|
| 0–420 SOL | 1.25% | 0.93% | **0.30%** | 0.02% |
| 420–1,470 SOL | 1.20% | 0.05% | **0.95%** | 0.20% |
| 1,470–2,460 SOL | 1.15% | 0.05% | **0.90%** | 0.20% |
| 2,460–3,440 SOL | 1.10% | 0.05% | **0.85%** | 0.20% |
| ... | ... | ... | ... | ... |
| 98,240+ SOL | 0.30% | 0.05% | **0.05%** | 0.20% |

**Karakteristik:**
- Creator fee tertinggi (0.95%) pada range 420-1,470 SOL market cap
- Fee menurun secara bertahap seiring market cap meningkat
- Minimum creator fee 0.05% pada market cap >98k SOL
- Creator dapat claim kapan saja via `collectCreatorFee` instruction

**Vault Locations:**
- **Bonding Curve**: Native SOL di Creator Vault PDA
  - Seeds: `["creator-vault", bonding_curve.creator]`
  - Program: `6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P`
- **PumpSwap**: WSOL di ATA Creator Vault
  - Program: `pAMMBay6oceH9fJKBRHGP5D4bD4sWpmSwMn52FMfXEA`

### Status Implementasi: ✅ AKURAT

**File:** `src/lib/fees/modes/creator.ts`

Implementasi sudah benar:
- ✅ Membaca vault balance dari bonding curve (native SOL)
- ✅ Membaca vault balance dari PumpSwap (WSOL ATA)
- ✅ Prioritas PumpSwap > Bonding Curve (graduated tokens)
- ✅ Menampilkan vault addresses dengan benar

**Catatan:** 
- Implementasi tidak perlu menyimpan fee rate karena ini bervariasi per market cap
- Fee rate ditentukan on-chain saat swap, bukan di frontend
- Yang penting adalah tracking claim events dan vault balance

---

## 2. Cashback Mode

### Dokumentasi Resmi

**Konsep:**
- Creator **mengorbankan 100%** creator fee dan mengarahkannya kembali ke traders/holders
- Keputusan dibuat **sebelum launch** dan **tidak bisa diubah** selamanya
- Dirancang untuk token yang creator-nya ingin membangun komunitas tanpa mengambil fee

**Mekanisme:**
- Flag `cashback_enabled` di bonding curve account (byte 82)
- Saat trade terjadi, creator fee portion dikirim ke `UserVolumeAccumulator` PDA trader
- Accumulator adalah **per-user, cross-token** (bukan per-token)
- Trader bisa claim via `claim_cashback` instruction (global, claims ALL cashback)

**Accumulator PDAs:**
- **Pump Program (Bonding Curve):**
  - Seeds: `["user_volume_accumulator", user_wallet]`
  - Program: `6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P`
  - Balance: Native SOL (minus rent-exempt minimum ~890,880 lamports)
  
- **PumpSwap (AMM):**
  - Seeds: `["user_volume_accumulator", user_wallet]`
  - Program: `pAMMBay6oceH9fJKBRHGP5D4bD4sWpmSwMn52FMfXEA`
  - Balance: WSOL di ATA dari accumulator PDA

**Karakteristik:**
- Tidak ada creator vault (fee langsung ke traders)
- Cashback amount = creator fee yang seharusnya (0.30% - 0.95% tergantung market cap)
- Claim bersifat global (semua cashback dari semua token sekaligus)

### Status Implementasi: ✅ AKURAT

**File:** `src/lib/fees/modes/cashback.ts`

Implementasi sudah benar:
- ✅ Deteksi flag `cashback_enabled` di byte 82 bonding curve
- ✅ Derive `UserVolumeAccumulator` PDA dengan benar (Pump + PumpSwap)
- ✅ Fungsi `getUnclaimedCashback(wallet)` untuk per-user balance
- ✅ Fungsi `getCashbackStats(mint)` untuk tracking distribusi per-token
- ✅ Scan transaction history untuk identify cashback transfers
- ✅ Exclude protocol recipients dan creator vault dari detection

**Catatan:**
- Implementasi tracking per-token distribution sangat baik
- Membantu user melihat berapa banyak cashback yang didistribusikan untuk token tertentu
- Meskipun claim bersifat global, tracking per-token tetap berguna untuk analytics

---

## 3. Mayhem Mode

### Dokumentasi Resmi

**Konsep:**
- Mode eksperimental dengan AI agent yang trade token selama 24 jam pertama
- Mint **1 billion token tambahan** (total supply jadi **2 billion**)
- AI agent melakukan random walk trading (buy/sell dengan probabilitas sama)
- Setelah 24 jam, unsold tokens di-burn

**Karakteristik:**
- Flag `is_mayhem_mode` di bonding curve account (byte 81)
- Total supply: 2,000,000,000 tokens (2x normal)
- AI agent trading period: 24 jam pertama
- Tujuan: Meningkatkan early volatility dan attract traders
- Fee routing: Kemungkinan ke Mayhem fee recipients (bukan creator)

**Program:**
- Pump Program: `6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P`
- Menggunakan Tokenized Agents infrastructure

### Status Implementasi: ⚠️ DETEKSI SAJA

**File:** `src/lib/fees/modes/index.ts`

Implementasi saat ini:
- ✅ Deteksi flag `is_mayhem_mode` di byte 81
- ✅ Priority detection: mayhem > cashback > agent > creator
- ⚠️ Tidak ada tracking khusus untuk Mayhem fee recipients
- ⚠️ Tidak ada tracking AI agent trading activity

**Rekomendasi:**
- Mode ini jarang digunakan dan bersifat eksperimental
- Untuk sekarang, deteksi flag sudah cukup
- Jika diperlukan, bisa tambahkan:
  - Tracking known Mayhem fee recipient addresses
  - Display warning bahwa creator fees tidak applicable
  - Show AI agent trading history (jika ada API)

---

## 4. Agent Mode (Tokenized Agents)

### Dokumentasi Resmi

**Konsep:**
- Token yang terhubung dengan AI agent yang menghasilkan revenue
- Sebagian revenue agent digunakan untuk **automated buyback + burn**
- Creator set **buyback percentage** (dalam basis points)
- Tujuan: Align agent success dengan token value

**Mekanisme:**
- Agent PDA: `["token-agent-payments", mint]`
- Program: `AgenTMiC2hvxGebTsgmsD4HHBa8WEcqGFf87iwRRxLo7`
- Revenue flow:
  1. Agent earns revenue (SaaS, trading, etc.)
  2. Revenue masuk ke Payment Vault
  3. Sistem split berdasarkan `buybackBps`:
     - X% → Buyback Vault → swap to token → burn
     - (100-X)% → Withdraw Vault → available for authority

**On-chain Account Structure:**

**tokenAgentPayments PDA:**
```
Offset | Size | Field
-------|------|-------
0      | 8    | discriminator [136, 241, 242, 217, 173, 77, 112, 186]
8      | 1    | bump
9      | 32   | mint
41     | 32   | authority
73     | 2    | buybackBps (u16 LE)
```

**tokenAgentPaymentInCurrency PDA:**
- Seeds: `["payment-in-currency", tokenMint, currencyMint]`
```
Offset | Size | Field
-------|------|-------
0      | 8    | discriminator [225, 195, 81, 227, 115, 43, 25, 177]
8      | 32   | mint
40     | 32   | currencyMint
72     | 8    | totalInvoicePaymentsMade (u64 LE)
80     | 8    | totalBuyback (u64 LE)
88     | 8    | totalWithdrawals (u64 LE)
96     | 8    | tokensBoughtBackAndBurned (u64 LE)
```

**Supported Currencies:**
- SOL (So11111111111111111111111111111111111111112)
- USDC (EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v)
- USDT (Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB)

**Vault Authorities:**
- Payment Authority: Agent PDA itself
- Buyback Authority: `["buyback-authority", mint]`
- Withdraw Authority: `["withdraw-authority", mint]`

### Status Implementasi: ✅ SANGAT AKURAT

**File:** `src/lib/fees/modes/agent.ts`

Implementasi LUAR BIASA lengkap:
- ✅ Deteksi Agent PDA dengan benar
- ✅ Parse account layout sesuai IDL (discriminator, offsets, u16/u64 LE)
- ✅ Read `buybackBps` dengan benar
- ✅ Fetch per-currency stats (SOL, USDC, USDT)
- ✅ Parse `totalInvoicePaymentsMade`, `totalBuyback`, `totalWithdrawals`, `tokensBurnedRaw`
- ✅ Derive vault authorities (payment, buyback, withdraw)
- ✅ Fetch WSOL ATA balances untuk semua vaults
- ✅ Display semua data dengan lengkap di UI

**File UI:** `src/components/dashboard/FeeClaimTab.tsx`

UI implementation juga excellent:
- ✅ Display buyback rate (bps → percentage)
- ✅ Show agent PDA dan authority addresses
- ✅ Per-currency revenue breakdown
- ✅ Current vault balances (payment, buyback, withdraw)
- ✅ Conditional display (hide withdraw vault jika buybackBps = 100%)
- ✅ Color-coded sections untuk clarity

**Catatan:**
- Implementasi ini adalah yang paling kompleks dan sudah 100% akurat
- Sesuai dengan official SDK (@pump-fun/agent-payments-sdk v3.0.2)
- Tidak ada yang perlu diperbaiki

---

## 5. Fee Detection Priority

### Dokumentasi Resmi

Tidak ada dokumentasi eksplisit tentang priority, tapi berdasarkan logic:
1. **Mayhem** - Paling spesifik, mode eksperimental
2. **Cashback** - Permanent decision, overrides creator fees
3. **Agent** - Tokenized agent dengan automated buyback
4. **Creator** - Default mode

### Status Implementasi: ✅ BENAR

**File:** `src/lib/fees/modes/index.ts`

```typescript
let mode: FeeMode = "creator";
if (isMayhem)        mode = "mayhem";
else if (isCashback) mode = "cashback";
else if (isAgent)    mode = "agent";
```

Priority sudah benar dan masuk akal.

---

## Kesimpulan & Rekomendasi

### ✅ Yang Sudah Benar

1. **Creator Mode**: Implementasi vault detection dan claim tracking sudah sempurna
2. **Cashback Mode**: Detection, accumulator derivation, dan distribution tracking sangat akurat
3. **Agent Mode**: Implementasi paling kompleks dan 100% sesuai dengan official SDK
4. **Fee Detection**: Priority logic sudah benar
5. **UI Display**: Semua mode ditampilkan dengan jelas dan informatif

### ⚠️ Yang Bisa Ditingkatkan (Optional)

1. **Mayhem Mode**:
   - Saat ini hanya detection flag
   - Bisa tambahkan tracking Mayhem fee recipients (jika ada list)
   - Bisa tambahkan display warning di UI bahwa creator fees tidak applicable

2. **Creator Mode - Dynamic Fee Rates**:
   - Saat ini tidak display fee rate (karena bervariasi per market cap)
   - Bisa tambahkan fungsi untuk calculate expected fee rate berdasarkan current market cap
   - Purely informational, tidak affect core functionality

3. **Documentation**:
   - Tambahkan inline comments di code yang reference official docs
   - Tambahkan link ke Pump.fun docs di UI (tooltip atau info icon)

### 🎯 Kesimpulan Akhir

**Implementasi fee system di Senju sudah SANGAT AKURAT dan LENGKAP.**

Semua mode (Creator, Cashback, Agent) sudah diimplementasikan dengan benar sesuai dokumentasi resmi Pump.fun. Mayhem mode sudah terdeteksi dengan baik meskipun tidak ada tracking khusus (yang memang tidak terlalu diperlukan karena mode ini jarang digunakan).

**Tidak ada bug atau kesalahan yang ditemukan.**

Implementasi Agent mode bahkan lebih lengkap dari yang saya ekspektasikan - sudah include per-currency tracking, vault balances, dan semua detail yang ada di official SDK.

**Rating: 9.5/10** ⭐⭐⭐⭐⭐

0.5 point dikurangi hanya karena Mayhem mode belum ada tracking khusus, tapi ini bukan critical issue.

---

## Referensi

### Official Documentation
- [Transaction Fees on Pump.fun](https://intercom.help/pumpfun-web/en/articles/11002413-transaction-fees-on-pump-fun)
- [Pump.fun GitHub - pump-public-docs](https://github.com/pump-fun/pump-public-docs)
- [Mayhem Mode Documentation](https://pump.fun/docs/mayhem-mode)
- [Tokenized Agent Disclaimer](https://pump.fun/docs/tokenized-agent-disclaimer)

### Implementation Files
- `src/lib/fees/modes/index.ts` - Mode detection
- `src/lib/fees/modes/creator.ts` - Creator vault tracking
- `src/lib/fees/modes/cashback.ts` - Cashback distribution tracking
- `src/lib/fees/modes/agent.ts` - Agent stats and vault balances
- `src/components/dashboard/FeeClaimTab.tsx` - UI display

### Key Programs
- Pump Program: `6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P`
- PumpSwap AMM: `pAMMBay6oceH9fJKBRHGP5D4bD4sWpmSwMn52FMfXEA`
- Agent Payments: `AgenTMiC2hvxGebTsgmsD4HHBa8WEcqGFf87iwRRxLo7`

---

**Dibuat:** 11 April 2026  
**Versi:** 1.0  
**Status:** Verified ✅
