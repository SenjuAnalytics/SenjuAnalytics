# Panduan Migrasi Solana Web3.js v2

## Status Saat Ini (April 2026)

Proyek Senju saat ini menggunakan **dual setup**:
- **@solana/web3.js v1.98.4** - Untuk kode production yang ada
- **@solana/web3.js v2.x packages** - Untuk pengembangan fitur baru

## Paket v2 yang Terinstal

```json
"@solana/addresses": "^2.0.0",    // Untuk bekerja dengan alamat/pubkey
"@solana/codecs": "^2.0.0",       // Encoding/decoding data
"@solana/keys": "^2.0.0",         // Key generation & management
"@solana/rpc": "^2.0.0",          // RPC client untuk Solana
"@solana/rpc-types": "^2.0.0"     // Type definitions untuk RPC
```

## Perbedaan Utama v1 vs v2

### v1 (Current - OOP Style)
```typescript
import { PublicKey, Connection } from "@solana/web3.js";

const pubkey = new PublicKey("11111111111111111111111111111111");
const connection = new Connection("https://api.mainnet-beta.solana.com");
```

### v2 (New - Functional Style)
```typescript
import { address } from "@solana/addresses";
import { createSolanaRpc } from "@solana/rpc";

const addr = address("11111111111111111111111111111111");
const rpc = createSolanaRpc("https://api.mainnet-beta.solana.com");
```

## Contoh Migrasi Bertahap

### 1. PublicKey → Address

**v1 (11 file saat ini menggunakan ini):**
```typescript
import { PublicKey } from "@solana/web3.js";

const BONDING_CURVE_PROGRAM = new PublicKey("6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P");
const [bcPda] = PublicKey.findProgramAddressSync(
  [Buffer.from("bonding-curve"), mintKey.toBuffer()],
  BONDING_CURVE_PROGRAM
);
```

**v2 (untuk fitur baru):**
```typescript
import { address } from "@solana/addresses";
import { getProgramDerivedAddress } from "@solana/addresses";

const BONDING_CURVE_PROGRAM = address("6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P");
const [bcPda] = await getProgramDerivedAddress({
  programAddress: BONDING_CURVE_PROGRAM,
  seeds: [new TextEncoder().encode("bonding-curve"), mintKey]
});
```

### 2. Connection → RPC Client

**v1:**
```typescript
import { Connection } from "@solana/web3.js";

const connection = new Connection(process.env.NEXT_PUBLIC_RPC_URL!);
const accountInfo = await connection.getAccountInfo(pubkey);
```

**v2:**
```typescript
import { createSolanaRpc } from "@solana/rpc";

const rpc = createSolanaRpc(process.env.NEXT_PUBLIC_RPC_URL!);
const accountInfo = await rpc.getAccountInfo(addr).send();
```

### 3. Data Encoding/Decoding

**v2 (lebih type-safe):**
```typescript
import { getU64Codec, getStructCodec } from "@solana/codecs";

const bondingCurveCodec = getStructCodec([
  ["discriminator", getU64Codec()],
  ["virtualTokenReserves", getU64Codec()],
  ["virtualSolReserves", getU64Codec()],
  // ... dst
]);

const decoded = bondingCurveCodec.decode(accountData);
```

## Strategi Migrasi

### Fase 1: Dual Mode (Sekarang - Q2 2026)
- ✅ Pertahankan semua kode v1 yang ada
- ✅ Gunakan v2 untuk fitur baru
- ✅ Tim belajar API v2 secara bertahap

### Fase 2: Migrasi Bertahap (Q3-Q4 2026)
- Migrasikan file per file dimulai dari yang paling sederhana
- Prioritas: `src/lib/platforms/*.ts` (11 file dengan PublicKey)
- Testing menyeluruh setiap migrasi

### Fase 3: Full v2 (2027)
- Hapus dependency @solana/web3.js v1
- Codebase 100% menggunakan v2

## File yang Perlu Dimigrasi

Saat ini ada **11 file** yang menggunakan `PublicKey` dari v1:

```
src/lib/platforms/pumpfun.ts
src/lib/platforms/raydium.ts
src/lib/platforms/moonshot.ts
src/lib/platforms/virtuals.ts
src/lib/platforms/bags.ts
src/lib/platforms/believe.ts
src/lib/platforms/boop.ts
src/lib/platforms/fluxbeam.ts
src/lib/platforms/heaven.ts
src/lib/platforms/launchlab.ts
src/lib/platforms/letsbonk.ts
```

## Keuntungan v2

1. **Tree-shakeable** - Bundle size lebih kecil
2. **Type-safe** - TypeScript support lebih baik
3. **Modular** - Import hanya yang dibutuhkan
4. **Modern** - Functional programming style
5. **Performance** - Optimasi lebih baik

## Resources

- [Solana Web3.js v2 Docs](https://github.com/solana-labs/solana-web3.js/tree/master/packages)
- [Migration Guide](https://github.com/solana-labs/solana-web3.js/blob/master/MIGRATION.md)
- [v2 Examples](https://github.com/solana-labs/solana-web3.js/tree/master/examples)

## Catatan Penting

⚠️ **JANGAN** menggunakan `@solana/web3-compat` - masih experimental (v0.0.21)
✅ **GUNAKAN** paket v2 native untuk fitur baru
✅ **PERTAHANKAN** v1 untuk kode existing sampai siap migrasi
