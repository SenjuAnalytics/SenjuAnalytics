/**
 * Centralized text size classes.
 *
 * Change sizes here → ALL components update automatically.
 * Never hardcode pixel-based text sizes (text-[10px], text-[11px], etc.)
 * in component files — always import from this file.
 *
 * Hierarchy (small → large):
 *   micro  → 12px  — badges, status pills, kbd shortcuts, sub-timestamps
 *   detail → 13px  — descriptions, labels, table sub-text
 *
 * Standard Tailwind sizes (no need to centralize):
 *   text-xs  = 12px   text-sm  = 14px   text-base = 16px
 */

/** Smallest UI text — badge counts, status indicators, keyboard hints */
export const TEXT_MICRO = "text-xs"; // 12px

/** Detail / secondary text — descriptions, sub-labels, timestamps */
export const TEXT_DETAIL = "text-[13px]";
