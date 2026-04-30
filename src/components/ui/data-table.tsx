import React from "react";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/*  Column Definition                                                  */
/* ------------------------------------------------------------------ */

export type DataTableColumn<T> = {
    /** Column header label */
    header: string;
    /** Key on the data object to display (simple text rendering) */
    accessorKey?: keyof T & string;
    /** Custom cell renderer — takes the full row object */
    cell?: (row: T, index: number) => React.ReactNode;
    /** Extra className applied to both th and td */
    className?: string;
    /** Hide this column below the `md` breakpoint */
    hideOnMobile?: boolean;
    /** Text alignment — defaults to "left" */
    align?: "left" | "center" | "right";
    /** Label shown in mobile card view (defaults to header) */
    mobileLabel?: string;
    /** Width class, e.g. "w-28" */
    width?: string;
};

/* ------------------------------------------------------------------ */
/*  Component Props                                                    */
/* ------------------------------------------------------------------ */

export type DataTableProps<T> = {
    /** Column definitions */
    columns: DataTableColumn<T>[];
    /** Array of data rows */
    data: T[];
    /** Unique key extractor for each row */
    rowKey: (row: T, index: number) => string;
    /** Message shown when data is empty */
    emptyMessage?: string;
    /** Icon rendered above empty message */
    emptyIcon?: React.ReactNode;
    /** Add stagger fade-in animation to each row */
    animateRows?: boolean;
    /** Stagger delay per row in ms (default 25) */
    animateDelay?: number;
    /** Render an action column at the end of each row (desktop only — mobile shows it at bottom of card) */
    rowAction?: (row: T, index: number) => React.ReactNode;
    /** Extra className on the outermost wrapper */
    className?: string;
    /** Extra className on the table element */
    tableClassName?: string;
    /** Max height for the scrollable area, e.g. "calc(100vh - 18rem)" */
    maxHeight?: string;
    /** Pagination footer */
    pagination?: React.ReactNode;
    /** Header right-side content (e.g. export button) */
    headerAction?: React.ReactNode;
};

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function alignClass(align?: "left" | "center" | "right") {
    if (align === "center") return "text-center";
    if (align === "right") return "text-right";
    return "text-left";
}

function renderCellContent<T>(column: DataTableColumn<T>, row: T, index: number): React.ReactNode {
    if (column.cell) {
        return column.cell(row, index);
    }
    if (column.accessorKey) {
        const value = (row as Record<string, unknown>)[column.accessorKey];
        if (value === null || value === undefined) return "—";
        return String(value);
    }
    return null;
}

/* ------------------------------------------------------------------ */
/*  DataTable                                                          */
/* ------------------------------------------------------------------ */

export function DataTable<T>({
    columns,
    data,
    rowKey,
    emptyMessage = "No data found.",
    emptyIcon,
    animateRows = true,
    animateDelay = 25,
    rowAction,
    className,
    tableClassName,
    maxHeight,
    pagination,
    headerAction,
}: DataTableProps<T>) {
    const hasActions = Boolean(rowAction) || Boolean(headerAction);

    /* ---- Empty state ---- */
    if (data.length === 0) {
        return (
            <div className={cn("overflow-hidden rounded-xl border border-border/70 bg-card shadow-sm", className)}>
                <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
                    {emptyIcon && <div className="text-muted-foreground">{emptyIcon}</div>}
                    <p className="text-sm text-muted-foreground">{emptyMessage}</p>
                </div>
            </div>
        );
    }

    return (
        <div className={cn("overflow-hidden rounded-xl border border-border/70 bg-card shadow-sm", className)}>
            {/* ─── Desktop Table ─── */}
            <div className="hidden md:block">
                <div
                    className="overflow-auto"
                    style={maxHeight ? { maxHeight } : undefined}
                >
                    <table className={cn("w-full divide-y divide-border-subtle", tableClassName)}>
                        <thead className="bg-surface-subtle/40 sticky top-0 z-10">
                            <tr>
                                {columns.map((col, i) => (
                                    <th
                                        key={i}
                                        className={cn(
                                            "px-5 py-3 text-xs font-semibold uppercase tracking-wider text-text-muted",
                                            alignClass(col.align),
                                            col.width,
                                            col.hideOnMobile && "hidden md:table-cell",
                                            col.className,
                                        )}
                                    >
                                        {col.header}
                                    </th>
                                ))}
                                {hasActions && (
                                    <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-text-muted">
                                        {headerAction ?? ""}
                                    </th>
                                )}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border-subtle bg-surface-main">
                            {data.map((row, index) => (
                                <tr
                                    key={rowKey(row, index)}
                                    className={cn(
                                        "group transition-colors hover:bg-surface-subtle/50",
                                        animateRows && "table-row-enter",
                                    )}
                                    style={animateRows ? { animationDelay: `${index * animateDelay}ms` } : undefined}
                                >
                                    {columns.map((col, colIndex) => (
                                        <td
                                            key={colIndex}
                                            className={cn(
                                                "px-5 py-4 text-sm",
                                                alignClass(col.align),
                                                col.hideOnMobile && "hidden md:table-cell",
                                                col.className,
                                            )}
                                        >
                                            {renderCellContent(col, row, index)}
                                        </td>
                                    ))}
                                    {hasActions && (
                                        <td className="px-5 py-4 text-right align-top whitespace-nowrap">
                                            {rowAction?.(row, index)}
                                        </td>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* ─── Mobile Card Layout ─── */}
            <div className="block md:hidden divide-y divide-border-subtle">
                {data.map((row, index) => (
                    <div
                        key={rowKey(row, index)}
                        className={cn(
                            "space-y-2.5 px-4 py-4 transition-colors",
                            animateRows && "table-row-enter",
                        )}
                        style={animateRows ? { animationDelay: `${index * animateDelay}ms` } : undefined}
                    >
                        {columns.map((col, colIndex) => {
                            const content = renderCellContent(col, row, index);
                            if (content === null || content === "—") return null;

                            return (
                                <div key={colIndex} className="flex items-start justify-between gap-3">
                                    <span className="shrink-0 text-xs font-medium uppercase tracking-wider text-text-muted pt-0.5">
                                        {col.mobileLabel ?? col.header}
                                    </span>
                                    <div className={cn("text-sm text-foreground text-right", col.className)}>
                                        {content}
                                    </div>
                                </div>
                            );
                        })}
                        {rowAction && (
                            <div className="flex justify-end pt-1">
                                {rowAction(row, index)}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* ─── Pagination Footer ─── */}
            {pagination && (
                <div className="flex items-center justify-between border-t border-border-subtle bg-surface-subtle/20 px-5 py-3.5">
                    {pagination}
                </div>
            )}
        </div>
    );
}
