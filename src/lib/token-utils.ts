/**
 * Token calculation utilities
 * Centralizes common token-related calculations
 */

import { TOKEN_STANDARDS, TIME } from "./constants";

/**
 * Convert raw token amount to human-readable format
 */
export function fromRawAmount(rawAmount: number, decimals: number = TOKEN_STANDARDS.DEFAULT_DECIMALS): number {
  return rawAmount / Math.pow(10, decimals);
}

/**
 * Convert human-readable amount to raw token amount
 */
export function toRawAmount(amount: number, decimals: number = TOKEN_STANDARDS.DEFAULT_DECIMALS): number {
  return amount * Math.pow(10, decimals);
}

/**
 * Calculate percentage of supply
 */
export function calculateSupplyPercentage(amount: number, totalSupply: number): number {
  if (totalSupply === 0) return 0;
  return (amount / totalSupply) * 100;
}

/**
 * Calculate USD value from token amount and price
 */
export function calculateUsdValue(tokenAmount: number, priceUsd: number): number {
  return tokenAmount * priceUsd;
}

/**
 * Calculate SOL value from USD value
 */
export function calculateSolValue(usdValue: number, solPriceUsd: number): number {
  if (solPriceUsd === 0) return 0;
  return usdValue / solPriceUsd;
}

/**
 * Group data by day for charts
 */
export function groupByDay<T extends { timestamp: number }>(
  items: T[],
  getValue: (item: T) => number
): Record<string, number> {
  return items.reduce<Record<string, number>>((acc, item) => {
    const ms = item.timestamp > TIME.TIMESTAMP_THRESHOLD 
      ? item.timestamp 
      : item.timestamp * TIME.SECOND;
    
    const day = new Date(ms).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
    
    acc[day] = (acc[day] || 0) + getValue(item);
    return acc;
  }, {});
}

/**
 * Convert grouped data to chart format
 */
export function toChartData(
  groupedData: Record<string, number>,
  limit?: number
): Array<{ date: string; value: number }> {
  const entries = Object.entries(groupedData);
  const sliced = limit ? entries.slice(-limit) : entries;
  
  return sliced.map(([date, value]) => ({ date, value }));
}

/**
 * Aggregate totals from array of items
 */
export function aggregateTotal<T>(
  items: T[],
  getValue: (item: T) => number
): number {
  return items.reduce((sum, item) => sum + getValue(item), 0);
}

/**
 * Calculate percentage remaining (for locks, vesting, etc.)
 */
export function calculatePercentageRemaining(
  current: number,
  original: number
): number {
  if (original === 0) return 0;
  return (current / original) * 100;
}

/**
 * Check if timestamp is in the past
 */
export function isPast(timestamp: number): boolean {
  const ms = timestamp > TIME.TIMESTAMP_THRESHOLD 
    ? timestamp 
    : timestamp * TIME.SECOND;
  return ms < Date.now();
}

/**
 * Check if timestamp is in the future
 */
export function isFuture(timestamp: number): boolean {
  return !isPast(timestamp);
}

/**
 * Normalize timestamp to milliseconds
 */
export function normalizeTimestamp(timestamp: number): number {
  return timestamp > TIME.TIMESTAMP_THRESHOLD 
    ? timestamp 
    : timestamp * TIME.SECOND;
}

/**
 * Sort items by timestamp (newest first)
 */
export function sortByTimestamp<T extends { timestamp: number }>(
  items: T[],
  order: "asc" | "desc" = "desc"
): T[] {
  return [...items].sort((a, b) => {
    const diff = a.timestamp - b.timestamp;
    return order === "desc" ? -diff : diff;
  });
}

/**
 * Filter active locks (not unlocked)
 */
export function filterActiveLocks<T extends { isUnlocked: boolean }>(
  locks: T[]
): T[] {
  return locks.filter(lock => !lock.isUnlocked);
}

/**
 * Calculate total locked amount
 */
export function calculateTotalLocked<T extends { amount: number; isUnlocked: boolean }>(
  locks: T[],
  decimals: number = TOKEN_STANDARDS.DEFAULT_DECIMALS
): number {
  return filterActiveLocks(locks).reduce(
    (sum, lock) => sum + fromRawAmount(lock.amount, decimals),
    0
  );
}
