"use client";

import {
  Lock, Unlock, Shield, Clock, Timer,
  CalendarClock, PlayCircle, Repeat, Wallet, ArrowRight, KeyRound,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AddressDisplay } from "@/components/common/AddressDisplay";
import { StatCard } from "@/components/common/StatCard";
import { EmptyState } from "@/components/common/EmptyState";
import { useTokenLocks, useSolPrice } from "@/hooks/useTokenData";
import {
  fromRawAmount,
  aggregateTotal,
  filterActiveLocks,
  calculateTotalLocked,
  calculatePercentageRemaining,
} from "@/lib/token-utils";
import {
  formatNumber, formatFullDate, formatTimeDistance,
  formatRelativeTime, formatUsd,
} from "@/lib/formatters";
import type { TokenLock } from "@/types/token";
import { TEXT_MICRO } from "@/lib/text";

interface LockTabProps {
  address: string;
  tokenDecimals?: number;
  tokenSupply?: number;
  tokenPriceUsd?: number;
  tokenSymbol?: string;
}

interface Valuation {
  tokenSupply?: number;
  tokenPriceUsd?: number;
  solPriceUsd: number;
  tokenSymbol?: string;
}

export function LockTab({ address, tokenDecimals = 9, tokenSupply, tokenPriceUsd, tokenSymbol }: LockTabProps) {
  const { data, isPending } = useTokenLocks(address);
  const { data: solPriceData } = useSolPrice();
  const solPrice = solPriceData ?? 0;

  const valuation = { tokenSupply, tokenPriceUsd, solPriceUsd: solPrice, tokenSymbol };

  const locks = data?.locks || [];
  const activeLocks = filterActiveLocks(locks);
  const totalLocked = calculateTotalLocked(activeLocks, tokenDecimals);
  const totalUnlocked = aggregateTotal(
    locks.filter((l) => l.isUnlocked),
    (l) => fromRawAmount(l.amountDeposited ?? l.amount, tokenDecimals)
  );
  const totalDeposited = aggregateTotal(
    locks,
    (l) => fromRawAmount(l.amountDeposited ?? l.amount, tokenDecimals)
  );

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <StatCard title="Currently Locked" value={formatNumber(totalLocked)} icon={Lock} isLoading={isPending} accentColor="#14d4e8" />
        <StatCard title="Total Deposited" value={formatNumber(totalDeposited)} icon={Shield} isLoading={isPending} accentColor="#14F195" />
        <StatCard title="Active Locks" value={String(activeLocks.length)} icon={Timer} isLoading={isPending} accentColor="#f59e0b" />
        <StatCard title="Unlocked" value={formatNumber(totalUnlocked)} icon={Unlock} isLoading={isPending} accentColor="#6b7280" />
        <StatCard title="Total Locks" value={String(locks.length)} icon={Clock} isLoading={isPending} accentColor="#14F195" />
      </div>

      {/* Lock list */}
      <Card className="bg-card border-border/50">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <Lock className="h-4 w-4 text-[#14d4e8]" />
            <CardTitle className="text-sm font-medium">Lock Records</CardTitle>
            <Badge variant="secondary" className={`ml-auto ${TEXT_MICRO}`}>
              {locks.length} record{locks.length !== 1 ? "s" : ""}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {isPending ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-[180px] w-full rounded-xl bg-muted/20 animate-pulse" />
              ))}
            </div>
          ) : locks.length === 0 ? (
            <EmptyState
              icon={Lock}
              title="No Lock Records Found"
              description="On-chain locks from supported programs (Streamflow) will automatically appear here when detected."
              iconColor="#14d4e8"
            />
          ) : (
            <div className="space-y-3">
              {locks.map((lock) => (
                <LockCard key={lock.id} lock={lock} decimals={tokenDecimals} valuation={valuation} symbol={tokenSymbol} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info footer */}
      <Card className="bg-card border-border/50">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Shield className="h-4 w-4 text-[#14d4e8] shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-medium text-white mb-1">Supported Lock Programs</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Senju detects on-chain locks from: Streamflow.
                More programs (Fluxbeam, Unloc, etc.) will be added in future updates.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ── Lock Card ────────────────────────────────────────────────

function LockCard({ lock, decimals, valuation, symbol }: { lock: TokenLock; decimals: number; valuation: Valuation; symbol?: string }) {
  const currentAmt = fromRawAmount(lock.amount, decimals);
  const depositedAmt = fromRawAmount(lock.amountDeposited ?? lock.amount, decimals);
  const pctRemaining = calculatePercentageRemaining(currentAmt, depositedAmt);
  const isVesting = !!(lock.vestingSchedule && lock.vestingSchedule.duration);
  const hasPartial = !!(lock.amountDeposited && lock.amountDeposited !== lock.amount);

  const pctOfSupply = valuation.tokenSupply && valuation.tokenSupply > 0
    ? (currentAmt / valuation.tokenSupply) * 100
    : undefined;
  const usdValue = valuation.tokenPriceUsd && valuation.tokenPriceUsd > 0
    ? currentAmt * valuation.tokenPriceUsd
    : undefined;
  const solValue = usdValue && valuation.solPriceUsd > 0
    ? usdValue / valuation.solPriceUsd
    : undefined;

  return (
    <div className="rounded-xl border border-border/40 bg-card overflow-hidden">
      {/* ── Top bar: badges + time ── */}
      <div className="flex items-center flex-wrap gap-1.5 px-4 py-2.5 bg-muted/5 border-b border-border/20">
        <ProgramBadge name={lock.programName} />
        <StatusBadge unlocked={lock.isUnlocked} />
        {isVesting && (
          <Badge variant="outline" className={`${TEXT_MICRO} gap-1 border-[#f59e0b]/30 text-[#f59e0b]`}>
            <Repeat className="h-3 w-3" /> Vesting
          </Badge>
        )}
        <span className={`${TEXT_MICRO} text-muted-foreground/60 ml-auto tabular-nums`}>
          Created {formatRelativeTime(lock.createdAt)}
        </span>
      </div>

      {/* ── Amount + progress ── */}
      <div className="px-4 pt-3.5 pb-3">
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5">
            <span className="text-lg font-mono font-bold text-white tracking-tight">{formatNumber(currentAmt)}</span>
            {symbol && <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{symbol}</span>}
          </span>
          {hasPartial && (
            <span className="text-xs text-muted-foreground font-mono">
              / {formatNumber(depositedAmt)}
            </span>
          )}
          {hasPartial && (
            <span
              className="text-xs font-mono font-semibold ml-auto"
              style={{ color: lock.isUnlocked ? "#6b7280" : "#14F195" }}
            >
              {pctRemaining.toFixed(1)}% remaining
            </span>
          )}
        </div>

        {/* Valuation row: % supply · SOL · USD */}
        {(pctOfSupply !== undefined || usdValue !== undefined) && (
          <div className="flex items-center gap-3 mt-1.5">
            {pctOfSupply !== undefined && (
              <span className="text-xs font-semibold text-[#14d4e8]">
                {pctOfSupply < 0.01 ? "<0.01" : pctOfSupply.toFixed(2)}% of supply
              </span>
            )}
            {solValue !== undefined && (
              <span className="text-xs text-muted-foreground font-mono">
                ≈ {formatNumber(solValue)} SOL
              </span>
            )}
            {usdValue !== undefined && (
              <span className="text-xs text-muted-foreground font-mono">
                ≈ {formatUsd(usdValue)}
              </span>
            )}
          </div>
        )}

        {lock.amountDeposited && lock.amountDeposited > 0 && (
          <div className="w-full h-1.5 rounded-full bg-muted/30 mt-2.5">
            <div
              className="h-full rounded-full"
              style={{
                width: `${Math.min(pctRemaining, 100)}%`,
                background: lock.isUnlocked
                  ? "linear-gradient(90deg, #6b7280 0%, #4b5563 100%)"
                  : "linear-gradient(90deg, #14F195 0%, #14d4e8 100%)",
              }}
            />
          </div>
        )}
      </div>

      {/* ── Schedule section ── */}
      {(lock.unlockDate || lock.createdAt) && (
        <div className="mx-4 mb-2 rounded-lg bg-muted/8 border border-border/15">
          <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-border/15">
            <DateRow
              icon={PlayCircle}
              label="Lock Created"
              timestamp={lock.createdAt}
              iconColor="#14d4e8"
            />
            {lock.unlockDate && (
              <DateRow
                icon={CalendarClock}
                label={lock.isUnlocked ? "Unlocked On" : "Unlocks On"}
                timestamp={lock.unlockDate}
                countdown={!lock.isUnlocked}
                iconColor={lock.isUnlocked ? "#6b7280" : "#14F195"}
                muted={lock.isUnlocked}
              />
            )}
          </div>
        </div>
      )}

      {/* ── Vesting info ── */}
      {isVesting && lock.vestingSchedule && (
        <div className="mx-4 mb-2 rounded-lg bg-muted/8 border border-border/15 px-3.5 py-2.5 space-y-1.5">
          <div className="flex items-center gap-2">
            <Repeat className="h-3.5 w-3.5 text-[#f59e0b] shrink-0" />
            <span className="text-xs text-muted-foreground">Vesting Schedule</span>
            <span className="text-xs text-white font-medium ml-auto">
              {lock.vestingSchedule.periods} period{(lock.vestingSchedule.periods ?? 0) !== 1 ? "s" : ""}
              {lock.vestingSchedule.cliff ? " · includes cliff" : ""}
            </span>
          </div>
          {lock.startTime && lock.startTime !== lock.createdAt && lock.startTime !== lock.unlockDate && (
            <div className="flex items-center gap-2 pl-5.5">
              <span className="text-xs text-muted-foreground">Vesting starts:</span>
              <span className="text-xs text-white font-medium">{formatFullDate(lock.startTime)}</span>
            </div>
          )}
        </div>
      )}

      {/* ── Addresses ── */}
      <div className="mx-4 mb-3 rounded-lg bg-muted/8 border border-border/15">
        <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-border/15">
          <AddressRow icon={Wallet} label="Sender" address={lock.owner} />
          {lock.recipient && (
            <AddressRow icon={ArrowRight} label="Recipient" address={lock.recipient} />
          )}
          {lock.lockAddress && (
            <AddressRow icon={KeyRound} label="Escrow" address={lock.lockAddress} />
          )}
        </div>
      </div>
    </div>
  );
}

// ── Sub-components ──────────────────────────────────────────

function ProgramBadge({ name }: { name: string }) {
  return (
    <Badge
      variant="outline"
      className={`${TEXT_MICRO} font-semibold px-2 gap-1`}
      style={{ borderColor: "#14d4e8/30", color: "#14d4e8" }}
    >
      <Lock className="h-3 w-3" />
      {name}
    </Badge>
  );
}

function StatusBadge({ unlocked }: { unlocked: boolean }) {
  if (unlocked) {
    return (
      <Badge variant="secondary" className={`${TEXT_MICRO} gap-1 bg-muted/50 text-muted-foreground`}>
        <Unlock className="h-3 w-3" /> Unlocked
      </Badge>
    );
  }
  return (
    <Badge
      variant="outline"
      className={`${TEXT_MICRO} gap-1`}
      style={{ borderColor: "#14F195/30", color: "#14F195" }}
    >
      <Shield className="h-3 w-3" /> Active
    </Badge>
  );
}

function DateRow({ icon: Icon, label, timestamp, countdown, iconColor, muted }: {
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  label: string;
  timestamp: number;
  countdown?: boolean;
  iconColor?: string;
  muted?: boolean;
}) {
  return (
    <div className="flex items-start gap-2.5 px-3.5 py-2.5">
      <Icon className="h-4 w-4 shrink-0 mt-0.5" style={{ color: iconColor }} />
      <div className="min-w-0">
        <span className={`${TEXT_MICRO} text-muted-foreground/60 block`}>{label}</span>
        <span className={`text-xs font-medium ${muted ? "text-muted-foreground" : "text-white"} block mt-0.5`}>
          {formatFullDate(timestamp)}
        </span>
        {countdown && (
          <span className="text-xs text-[#14F195]/80 block mt-0.5">
            {formatTimeDistance(timestamp)}
          </span>
        )}
      </div>
    </div>
  );
}

function AddressRow({ icon: Icon, label, address }: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  address: string;
}) {
  return (
    <div className="flex items-center gap-2.5 px-3.5 py-2.5">
      <Icon className="h-3.5 w-3.5 text-muted-foreground/40 shrink-0" />
      <div className="min-w-0">
        <span className={`${TEXT_MICRO} text-muted-foreground/50 block`}>{label}</span>
        <AddressDisplay address={address} />
      </div>
    </div>
  );
}
