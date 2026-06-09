/**
 * Reusable empty state component
 * Used across all dashboard tabs when no data is available
 */

import type { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  iconColor?: string;
}

export function EmptyState({ 
  icon: Icon, 
  title, 
  description,
  iconColor = "#666"
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div 
        className="h-12 w-12 rounded-full flex items-center justify-center mb-4"
        style={{ backgroundColor: `${iconColor}15` }}
      >
        <Icon className="h-6 w-6" style={{ color: `${iconColor}60` }} />
      </div>
      <p className="text-sm font-medium text-muted-foreground mb-1">{title}</p>
      <p className="text-xs text-muted-foreground/60 max-w-md leading-relaxed">
        {description}
      </p>
    </div>
  );
}

/**
 * Compact empty state for inline use (e.g., inside tables)
 */
export function EmptyStateInline({ 
  icon: Icon, 
  message,
  iconColor = "#666"
}: { 
  icon: LucideIcon; 
  message: string;
  iconColor?: string;
}) {
  return (
    <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
      <Icon className="h-4 w-4" style={{ color: iconColor }} />
      <span>{message}</span>
    </div>
  );
}
