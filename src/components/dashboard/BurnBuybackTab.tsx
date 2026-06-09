"use client";

import { Flame, TrendingDown, Hash, Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AddressDisplay } from "@/components/common/AddressDisplay";
import { StatCard } from "@/components/common/StatCard";
import { EmptyState } from "@/components/common/EmptyState";
import { DataTable } from "@/components/common/DataTable";
import { BurnTooltip } from "@/components/charts/ChartTooltip";
import { useBurnRecords } from "@/hooks/useTokenData";
import { fromRawAmount, aggregateTotal, groupByDay, toChartData } from "@/lib/token-utils";
import { formatNumber, formatUsd, formatRelativeTime, formatTimestamp } from "@/lib/formatters";
import { TEXT_MICRO } from "@/lib/text";
import { API_LIMITS } from "@/lib/constants";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

interface BurnBuybackTabProps {
  address: string;
  tokenDecimals?: number;
  tokenSymbol?: string;
}

export function BurnBuybackTab({ address, tokenDecimals = 9, tokenSymbol = "TOKEN" }: BurnBuybackTabProps) {
  const { data, isPending } = useBurnRecords(address);
  const burns = data?.burns || [];

  const totalBurned = aggregateTotal(burns, (b) => fromRawAmount(b.amount, tokenDecimals));
  const totalUsdBurned = aggregateTotal(burns, (b) => b.usdValue || 0);

  const burnsByDay = groupByDay(burns, (b) => fromRawAmount(b.amount, tokenDecimals));
  const chartData = toChartData(burnsByDay, API_LIMITS.FEE_HISTORY_DAYS).map(
    ({ date, value }) => ({ date, amount: value })
  );

  const columns = [
    {
      header: "Type",
      accessor: (burn: typeof burns[0]) => (
        <Badge
          variant="outline"
          className={`${TEXT_MICRO} font-medium`}
          style={{
            borderColor: burn.type === "BURN" ? "#FF6B6B40" : "#14d4e840",
            color: burn.type === "BURN" ? "#FF6B6B" : "#14d4e8",
          }}
        >
          {burn.type === "BURN" ? "🔥 Burn" : "🔄 Buyback"}
        </Badge>
      ),
    },
    {
      header: "Amount",
      accessor: (burn: typeof burns[0]) => (
        <span className="font-mono font-medium text-white">
          {formatNumber(fromRawAmount(burn.amount, tokenDecimals))}
          <span className="text-muted-foreground ml-1">{tokenSymbol}</span>
        </span>
      ),
    },
    {
      header: "Burned By",
      accessor: (burn: typeof burns[0]) => <AddressDisplay address={burn.burnedBy} />,
    },
    {
      header: "USD Value",
      accessor: (burn: typeof burns[0]) => (
        <span className="text-[#14F195]">{burn.usdValue ? formatUsd(burn.usdValue) : "—"}</span>
      ),
    },
    {
      header: "Date",
      accessor: (burn: typeof burns[0]) => (
        <div>
          <div className="text-white">{formatRelativeTime(burn.timestamp)}</div>
          <div className={`text-muted-foreground ${TEXT_MICRO}`}>{formatTimestamp(burn.timestamp)}</div>
        </div>
      ),
    },
    {
      header: "TX",
      accessor: (burn: typeof burns[0]) => <AddressDisplay address={burn.signature} type="tx" />,
    },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          title="Total Burned"
          value={formatNumber(totalBurned)}
          subValue={tokenSymbol}
          icon={Flame}
          isLoading={isPending}
          accentColor="#FF6B6B"
        />
        <StatCard
          title="USD Value Burned"
          value={totalUsdBurned > 0 ? formatUsd(totalUsdBurned) : "—"}
          icon={TrendingDown}
          isLoading={isPending}
          accentColor="#FF6B6B"
        />
        <StatCard
          title="Burn Events"
          value={String(burns.length)}
          icon={Hash}
          isLoading={isPending}
          accentColor="#14d4e8"
        />
        <StatCard
          title="Last Burn"
          value={burns[0] ? formatRelativeTime(burns[0].timestamp) : "—"}
          icon={Calendar}
          isLoading={isPending}
          accentColor="#14d4e8"
        />
      </div>

      {chartData.length > 0 && (
        <Card className="bg-card border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Burn History (last {API_LIMITS.FEE_HISTORY_DAYS} days)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="[&_*]:!outline-none">
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#666" }} tickLine={false} axisLine={false} />
                  <YAxis
                    tick={{ fontSize: 10, fill: "#666" }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => formatNumber(v)}
                    width={60}
                  />
                  <Tooltip content={<BurnTooltip />} />
                  <Bar dataKey="amount" fill="#FF6B6B" radius={[3, 3, 0, 0]} opacity={0.85} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="bg-card border-border/50">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <Flame className="h-4 w-4 text-[#FF6B6B]" />
            <CardTitle className="text-sm font-medium">Burn & Buyback Transactions</CardTitle>
            <Badge variant="secondary" className={`ml-auto ${TEXT_MICRO}`}>
              {burns.length} events
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={burns}
            isLoading={isPending}
            emptyState={
              <EmptyState
                icon={Flame}
                title="No burn or buyback transactions found"
                description="Burns are detected when tokens are sent to the incinerator address or null address"
                iconColor="#FF6B6B"
              />
            }
            getRowKey={(burn) => burn.signature}
          />
        </CardContent>
      </Card>
    </div>
  );
}
