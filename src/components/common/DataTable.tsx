/**
 * Reusable data table component
 * Provides consistent table styling and loading states
 */

import { Skeleton } from "@/components/ui/skeleton";
import { UI } from "@/lib/constants";

interface Column<T> {
  header: string;
  accessor: (item: T) => React.ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  isLoading?: boolean;
  emptyState?: React.ReactNode;
  getRowKey: (item: T, index: number) => string;
  onRowClick?: (item: T) => void;
}

export function DataTable<T>({
  columns,
  data,
  isLoading,
  emptyState,
  getRowKey,
  onRowClick,
}: DataTableProps<T>) {
  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: UI.SKELETON_ITEMS }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  if (data.length === 0 && emptyState) {
    return <>{emptyState}</>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-border/50">
            {columns.map((column, index) => (
              <th
                key={index}
                className={`pb-2 pr-4 text-left font-medium text-muted-foreground first:pl-0 ${column.className || ""}`}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((item, index) => (
            <tr
              key={getRowKey(item, index)}
              className={`border-b border-border/30 transition-colors ${
                onRowClick ? "cursor-pointer hover:bg-muted/20" : "hover:bg-muted/10"
              }`}
              onClick={() => onRowClick?.(item)}
            >
              {columns.map((column, colIndex) => (
                <td
                  key={colIndex}
                  className={`py-3 pr-4 first:pl-0 ${column.className || ""}`}
                >
                  {column.accessor(item)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * Simplified table for basic use cases
 */
interface SimpleTableProps {
  headers: string[];
  rows: React.ReactNode[][];
  isLoading?: boolean;
  emptyMessage?: string;
}

export function SimpleTable({
  headers,
  rows,
  isLoading,
  emptyMessage = "No data available",
}: SimpleTableProps) {
  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: UI.SKELETON_ITEMS }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="py-8 text-center text-sm text-muted-foreground">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-border/50">
            {headers.map((header, index) => (
              <th
                key={index}
                className="pb-2 pr-4 text-left font-medium text-muted-foreground first:pl-0"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr
              key={rowIndex}
              className="border-b border-border/30 hover:bg-muted/10 transition-colors"
            >
              {row.map((cell, cellIndex) => (
                <td key={cellIndex} className="py-3 pr-4 first:pl-0">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
