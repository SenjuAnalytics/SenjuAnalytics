/**
 * Agent mode — read tokenAgentPayments PDA and per-currency stats.
 *
 * On-chain account layout (from @pump-fun/agent-payments-sdk v3.0.2 IDL):
 *
 *   tokenAgentPayments  (seeds: ["token-agent-payments", mint])
 *     8  bytes  discriminator  [136, 241, 242, 217, 173, 77, 112, 186]
 *     1  byte   bump           (u8)
 *     32 bytes  mint           (Pubkey)
 *     32 bytes  authority      (Pubkey)
 *     2  bytes  buybackBps     (u16 LE)
 *     ─────────────────────────
 *     Total: 75 bytes minimum
 *
 *   tokenAgentPaymentInCurrency  (seeds: ["payment-in-currency", tokenMint, currencyMint])
 *     8  bytes  discriminator  [225, 195, 81, 227, 115, 43, 25, 177]
 *     32 bytes  mint           (Pubkey)
 *     32 bytes  currencyMint   (Pubkey)
 *     8  bytes  totalInvoicePaymentsMade  (u64 LE)
 *     8  bytes  totalBuyback             (u64 LE)
 *     8  bytes  totalWithdrawals         (u64 LE)
 *     8  bytes  tokensBoughtBackAndBurned (u64 LE)
 *     ─────────────────────────
 *     Total: 104 bytes minimum
 *
 * Program: AgenTMiC2hvxGebTsgmsD4HHBa8WEcqGFf87iwRRxLo7
 */

import { PublicKey } from "@solana/web3.js";
import { getAccountData, getTokenBalance } from "@/lib/platforms/rpc";
import type { AgentStats, AgentCurrencyStats, AgentVaultBalances } from "./types";

const WSOL = new PublicKey("So11111111111111111111111111111111111111112");
const ATA_PROGRAM = new PublicKey("ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL");
const TOKEN_PROG = new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA");

const AGENT_PROGRAM = new PublicKey("AgenTMiC2hvxGebTsgmsD4HHBa8WEcqGFf87iwRRxLo7");

/** Known supported currencies and their labels/decimals. */
const KNOWN_CURRENCIES: { mint: string; label: string; decimals: number }[] = [
  { mint: "So11111111111111111111111111111111111111112",  label: "SOL",  decimals: 9 },
  { mint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v", label: "USDC", decimals: 6 },
  { mint: "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB", label: "USDT", decimals: 6 },
];

// ── Discriminators (from IDL) ───────────────────────────────

const TAP_DISCRIMINATOR = Buffer.from([136, 241, 242, 217, 173, 77, 112, 186]);
const PIC_DISCRIMINATOR = Buffer.from([225, 195, 81, 227, 115, 43, 25, 177]);

// ── Account layout offsets ──────────────────────────────────
// (some offsets are for documentation / future use and intentionally unused)

// tokenAgentPayments: disc(8) + bump(1) + mint(32) + authority(32) + buybackBps(2)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const TAP_BUMP_OFF      = 8;
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const TAP_MINT_OFF      = 9;
const TAP_AUTHORITY_OFF = 41;
const TAP_BPS_OFF       = 73;
const TAP_MIN_LEN       = 75;

// tokenAgentPaymentInCurrency: disc(8) + mint(32) + currencyMint(32) + 4×u64
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const PIC_MINT_OFF      = 8;
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const PIC_CURRENCY_OFF  = 40;
const PIC_INVOICES_OFF  = 72;
const PIC_BUYBACK_OFF   = 80;
const PIC_WITHDRAW_OFF  = 88;
const PIC_BURNED_OFF    = 96;
const PIC_MIN_LEN       = 104;

// ── Helpers ─────────────────────────────────────────────────

function readPubkey(buf: Buffer, offset: number): string {
  return new PublicKey(buf.subarray(offset, offset + 32)).toString();
}

function readU16LE(buf: Buffer, offset: number): number {
  return buf[offset] | (buf[offset + 1] << 8);
}

function readU64LE(buf: Buffer, offset: number): number {
  // Read as BigInt then convert — safe for values under Number.MAX_SAFE_INTEGER
  const lo = buf.readUInt32LE(offset);
  const hi = buf.readUInt32LE(offset + 4);
  return hi * 0x100000000 + lo;
}

// ── Main function ───────────────────────────────────────────

/**
 * Fetch agent stats for a Pump.fun token in agent mode.
 * Returns null if the token-agent-payments PDA doesn't exist or can't be decoded.
 */
export async function getAgentStats(mint: string): Promise<AgentStats | null> {
  try {
    const mintKey = new PublicKey(mint);

    // Derive tokenAgentPayments PDA
    const [agentPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("token-agent-payments"), mintKey.toBuffer()],
      AGENT_PROGRAM,
    );

    // Read the main agent account
    const tapData = await getAccountData(agentPda.toString());
    if (!tapData || tapData.length < TAP_MIN_LEN) return null;

    // Validate discriminator
    if (!tapData.subarray(0, 8).equals(TAP_DISCRIMINATOR)) return null;

    const authority  = readPubkey(tapData, TAP_AUTHORITY_OFF);
    const buybackBps = readU16LE(tapData, TAP_BPS_OFF);

    // Derive and fetch per-currency payment stats in parallel
    const currencyPdas = KNOWN_CURRENCIES.map(({ mint: cMint }) => {
      const cMintKey = new PublicKey(cMint);
      const [pda] = PublicKey.findProgramAddressSync(
        [Buffer.from("payment-in-currency"), mintKey.toBuffer(), cMintKey.toBuffer()],
        AGENT_PROGRAM,
      );
      return pda.toString();
    });

    const picResults = await Promise.all(
      currencyPdas.map((addr) => getAccountData(addr)),
    );

    const currencies: AgentCurrencyStats[] = [];
    for (let i = 0; i < KNOWN_CURRENCIES.length; i++) {
      const picData = picResults[i];
      if (!picData || picData.length < PIC_MIN_LEN) continue;

      // Validate discriminator
      if (!picData.subarray(0, 8).equals(PIC_DISCRIMINATOR)) continue;

      const totalInvoicePayments = readU64LE(picData, PIC_INVOICES_OFF);
      const totalBuyback         = readU64LE(picData, PIC_BUYBACK_OFF);
      const totalWithdrawals     = readU64LE(picData, PIC_WITHDRAW_OFF);
      const tokensBurnedRaw      = readU64LE(picData, PIC_BURNED_OFF);

      // Only include currencies that have activity
      if (totalInvoicePayments > 0 || totalBuyback > 0 || totalWithdrawals > 0) {
        currencies.push({
          currencyMint: KNOWN_CURRENCIES[i].mint,
          currencyLabel: KNOWN_CURRENCIES[i].label,
          totalInvoicePayments,
          totalBuyback,
          totalWithdrawals,
          tokensBurnedRaw,
        });
      }
    }

    // Fetch SOL vault balances (WSOL ATAs for each authority)
    let vaultBalances: AgentVaultBalances | undefined;
    try {
      const [buybackAuth] = PublicKey.findProgramAddressSync(
        [Buffer.from("buyback-authority"), mintKey.toBuffer()],
        AGENT_PROGRAM,
      );
      const [withdrawAuth] = PublicKey.findProgramAddressSync(
        [Buffer.from("withdraw-authority"), mintKey.toBuffer()],
        AGENT_PROGRAM,
      );

      // Derive WSOL ATAs for each authority
      const deriveAta = (owner: PublicKey) =>
        PublicKey.findProgramAddressSync(
          [owner.toBuffer(), TOKEN_PROG.toBuffer(), WSOL.toBuffer()],
          ATA_PROGRAM,
        )[0];

      const paymentAta  = deriveAta(agentPda);
      const buybackAta  = deriveAta(buybackAuth);
      const withdrawAta = deriveAta(withdrawAuth);

      const [payBal, buyBal, wdBal] = await Promise.all([
        getTokenBalance(paymentAta.toString()),
        getTokenBalance(buybackAta.toString()),
        getTokenBalance(withdrawAta.toString()),
      ]);

      vaultBalances = {
        paymentVault: payBal,
        buybackVault: buyBal,
        withdrawVault: wdBal,
        paymentVaultAddress: paymentAta.toString(),
        buybackVaultAddress: buybackAta.toString(),
        withdrawVaultAddress: withdrawAta.toString(),
      };
    } catch {
      // Non-critical — vault balances are optional
    }

    return {
      agentPda: agentPda.toString(),
      authority,
      buybackBps,
      currencies,
      vaultBalances,
    };
  } catch (err) {
    console.error(`[agent] error reading agent stats for ${mint}:`, err);
    return null;
  }
}
