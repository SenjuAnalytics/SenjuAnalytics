"use client";

import Image from "next/image";
import { Droplets, TrendingUp, BarChart2, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AddressDisplay } from "@/components/common/AddressDisplay";
import { StatCard } from "@/components/common/StatCard";
import { EmptyState } from "@/components/common/EmptyState";
import { DataTable } from "@/components/common/DataTable";
import { useLiquidityPools } from "@/hooks/useTokenData";
import { getDexIconPath } from "@/lib/dex-icons";
import { formatUsd, formatNumber, formatRelativeTime } from "@/lib/formatters";
import { aggregateTotal } from "@/lib/token-utils";
import { TEXT_MICRO } from "@/lib/text";

interface LiquidityTabProps {
  address: string;
}

export function LiquidityTab({ address }: LiquidityTabProps) {
  const { data, isPending } = useLiquidityPools(address);
  const pools = data?.pools || [];
  
  const totalLiquidity = aggregateTotal(pools, (p) => p.liquidityUsd);
  const totalSolLiquidity = aggregateTotal(pools, (p) => p.tokenB?.amount || 0);
  const totalVolume24h = aggregateTotal(pools, (p) => p.volume24h);
  const totalFees24h = aggregateTotal(pools, (p) => p.fees24h);

  const columns = [
    {
      header: "DEX",
      accessor: (pool: typeof pools[0]) => (
        <Badge variant="outline" className={`${TEXT_MICRO} capitalize font-medium inline-flex items-center gap-1`}>
          <Image
            src={getDexIconPath(pool.dex)}
            alt={pool.dex}
            width={12}
            height={12}
            className="shrink-0 rounded-full object-cover"
          />
          {pool.dex}
        </Badge>
      ),
    },
    {
      header: "Pair",
      accessor: (pool: typeof pools[0]) => (
        <span className="font-mono font-medium text-white">
          {pool.tokenA.symbol}/{pool.tokenB.symbol}
        </span>
      ),
    },
    {
      header: "Liquidity",
      accessor: (pool: typeof pools[0]) => (
        <div>
          <div className="text-white font-medium">{formatNumber(pool.tokenB.amount)} SOL</div>
          <div className={`text-muted-foreground ${TEXT_MICRO} mt-0.5`}>{formatUsd(pool.liquidityUsd)}</div>
        </div>
      ),
    },
    {
      header: "24h Volume",
      accessor: (pool: typeof pools[0]) => <span className="text-white">{formatUsd(pool.volume24h)}</span>,
    },
    {
      header: "24h Fees",
      accessor: (pool: typeof pools[0]) => <span className="text-[#14d4e8]">{formatUsd(pool.fees24h)}</span>,
    },
    {
      header: "APR",
      accessor: (pool: typeof pools[0]) => (
        <span className={`font-medium ${pool.apr > 0 ? "text-[#14d4e8]" : "text-muted-foreground"}`}>
          {pool.apr > 0 ? `${pool.apr.toFixed(1)}%` : "—"}
        </span>
      ),
    },
    {
      header: "Pool Address",
      accessor: (pool: typeof pools[0]) => <AddressDisplay address={pool.pairAddress} type="account" />,
    },
    {
      header: "Created",
      accessor: (pool: typeof pools[0]) => (
        <span className="text-muted-foreground">{pool.createdAt ? formatRelativeTime(pool.createdAt) : "—"}</span>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          title="Total Liquidity"
          value={`${formatNumber(totalSolLiquidity)} SOL`}
          subValue={formatUsd(totalLiquidity)}
          icon={Droplets}
          isLoading={isPending}
          accentColor="#14d4e8"
        />
        <StatCard
          title="24h Volume"
          value={formatUsd(totalVolume24h)}
          icon={BarChart2}
          isLoading={isPending}
          accentColor="#14d4e8"
        />
        <StatCard
          title="24h Fees"
          value={formatUsd(totalFees24h)}
          icon={TrendingUp}
          isLoading={isPending}
          accentColor="#14d4e8"
        />
        <StatCard
          title="Active Pools"
          value={String(pools.length)}
          icon={Clock}
          isLoading={isPending}
          accentColor="#14d4e8"
        />
      </div>

      <Card className="bg-card border-border/50">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <Droplets className="h-4 w-4 text-[#14d4e8]" />
            <CardTitle className="text-sm font-medium">Liquidity Pools</CardTitle>
            <Badge variant="secondary" className={`ml-auto ${TEXT_MICRO}`}>
              {pools.length} pools
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={pools}
            isLoading={isPending}
            emptyState={
              <EmptyState
                icon={Droplets}
                title="No liquidity pools found"
                description="Liquidity pools from supported DEXs will appear here when detected"
                iconColor="#14d4e8"
              />
            }
            getRowKey={(pool) => pool.pairAddress}
          />
        </CardContent>
      </Card>
    </div>
  );
}
