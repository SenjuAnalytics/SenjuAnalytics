/**
 * Reusable chart tooltip components
 * Consistent styling across all charts
 */

import { formatUsd, formatNumber } from "@/lib/formatters";

interface BaseTooltipProps {
  active?: boolean;
  payload?: Array<{ value: number; name?: string; color?: string }>;
  label?: string;
}

/**
 * Generic tooltip for any chart
 */
export function ChartTooltip({ 
  active, 
  payload, 
  label,
  formatter = (value) => String(value),
  labelFormatter = (label) => label,
  valueColor = "#14d4e8"
}: BaseTooltipProps & {
  formatter?: (value: number) => string;
  labelFormatter?: (label: string) => string;
  valueColor?: string;
}) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-lg border border-border/50 bg-card px-3 py-2 text-xs shadow-xl">
      {label && (
        <p className="text-muted-foreground mb-1">{labelFormatter(label)}</p>
      )}
      {payload.map((entry, index) => (
        <p 
          key={index} 
          className="font-medium" 
          style={{ color: entry.color || valueColor }}
        >
          {entry.name && <span className="text-muted-foreground">{entry.name}: </span>}
          {formatter(entry.value)}
        </p>
      ))}
    </div>
  );
}

/**
 * Price chart tooltip (USD formatting)
 */
export function PriceTooltip({ active, payload }: BaseTooltipProps) {
  return (
    <ChartTooltip
      active={active}
      payload={payload}
      formatter={formatUsd}
      valueColor="#14d4e8"
    />
  );
}

/**
 * Fee chart tooltip (USD formatting)
 */
export function FeeTooltip({ active, payload, label }: BaseTooltipProps) {
  return (
    <ChartTooltip
      active={active}
      payload={payload}
      label={label}
      formatter={formatUsd}
      valueColor="#14d4e8"
    />
  );
}

/**
 * Burn chart tooltip (number formatting)
 */
export function BurnTooltip({ active, payload, label }: BaseTooltipProps) {
  return (
    <ChartTooltip
      active={active}
      payload={payload}
      label={label}
      formatter={(value) => `${formatNumber(value)} burned`}
      valueColor="#FF6B6B"
    />
  );
}

/**
 * Volume chart tooltip (USD formatting)
 */
export function VolumeTooltip({ active, payload, label }: BaseTooltipProps) {
  return (
    <ChartTooltip
      active={active}
      payload={payload}
      label={label}
      formatter={formatUsd}
      valueColor="#14F195"
    />
  );
}
