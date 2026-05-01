"use client";

import React, { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";

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
    /** Hide this column below the `md` breakpoint (desktop table only — mobile cards show ALL columns) */
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
    /** Render an action column at the end of each row */
    rowAction?: (row: T, index: number) => React.ReactNode;
    /** Extra className on the outermost wrapper */
    className?: string;
    /** Extra className on the table element */
    tableClassName?: string;
    /** Max height for the scrollable area, e.g. "calc(100vh - 18rem)" */
    maxHeight?: string;
    /** Header right-side content (e.g. export button) */
    headerAction?: React.ReactNode;
    /** Rows per page.  0 = no pagination (show all). Default 10. */
    pageSize?: number;
    /** If true, pagination is controlled externally and this component shows all data */
    disablePagination?: boolean;
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
    headerAction,
    pageSize = 10,
    disablePagination = false,
}: DataTableProps<T>) {
    const hasActions = Boolean(rowAction) || Boolean(headerAction);
    const [currentPage, setCurrentPage] = useState(1);

    // Pagination logic
    const shouldPaginate = !disablePagination && pageSize > 0 && data.length > pageSize;
    const totalPages = shouldPaginate ? Math.ceil(data.length / pageSize) : 1;

    const paginatedData = useMemo(() => {
        if (!shouldPaginate) return data;
        const start = (currentPage - 1) * pageSize;
        return data.slice(start, start + pageSize);
    }, [data, currentPage, pageSize, shouldPaginate]);

    const goToPage = (page: number) => {
        setCurrentPage(Math.max(1, Math.min(page, totalPages)));
    };

    // Reset page when data changes
    const dataLength = data.length;
    React.useEffect(() => {
        setCurrentPage(1);
    }, [dataLength]);

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

    const startIndex = shouldPaginate ? (currentPage - 1) * pageSize : 0;
    const endIndex = shouldPaginate ? Math.min(startIndex + pageSize, data.length) : data.length;

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
                            {paginatedData.map((row, index) => (
                                <tr
                                    key={rowKey(row, startIndex + index)}
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
                                                col.className,
                                            )}
                                        >
                                            {renderCellContent(col, row, startIndex + index)}
                                        </td>
                                    ))}
                                    {hasActions && (
                                        <td className="px-5 py-4 text-right align-top whitespace-nowrap">
                                            {rowAction?.(row, startIndex + index)}
                                        </td>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* ─── Mobile Card Layout ─── */}
            <div className="block md:hidden">
                {paginatedData.map((row, index) => {
                    // Pick the first non-hideOnMobile column as the "hero" field
                    const heroCol = columns.find((c) => !c.hideOnMobile) ?? columns[0];
                    const restCols = columns.filter((c) => c !== heroCol);

                    return (
                        <div
                            key={rowKey(row, startIndex + index)}
                            className={cn(
                                "border-b border-border-subtle px-4 py-4 transition-colors last:border-b-0",
                                animateRows && "table-row-enter",
                            )}
                            style={animateRows ? { animationDelay: `${index * animateDelay}ms` } : undefined}
                        >
                            {/* Hero row: primary data + optional action */}
                            <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0 flex-1">
                                    {renderCellContent(heroCol, row, startIndex + index)}
                                </div>
                                {rowAction && (
                                    <div className="shrink-0">
                                        {rowAction(row, startIndex + index)}
                                    </div>
                                )}
                            </div>

                            {/* Detail rows */}
                            <div className="mt-3 space-y-2">
                                {restCols.map((col, colIndex) => {
                                    const content = renderCellContent(col, row, startIndex + index);
                                    if (content === null || content === "—") return null;

                                    return (
                                        <div key={colIndex} className="flex items-center justify-between gap-3">
                                            <span className="shrink-0 text-[11px] font-medium uppercase tracking-wider text-text-muted">
                                                {col.mobileLabel ?? col.header}
                                            </span>
                                            <div className="text-sm text-foreground text-right min-w-0">
                                                {content}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* ─── Pagination Footer ─── */}
            {(shouldPaginate || data.length > 0) && (
                <div className="flex flex-col gap-3 border-t border-border-subtle bg-surface-subtle/20 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                    <p className="text-xs text-text-muted">
                        Showing <span className="font-medium text-foreground">{startIndex + 1}</span> to{" "}
                        <span className="font-medium text-foreground">{endIndex}</span> of{" "}
                        <span className="font-medium text-foreground">{data.length}</span> entries
                    </p>

                    {shouldPaginate && (
                        <div className="flex items-center gap-1">
                            <PaginationButton
                                onClick={() => goToPage(1)}
                                disabled={currentPage === 1}
                                aria-label="First page"
                            >
                                <ChevronsLeft className="h-3.5 w-3.5" />
                            </PaginationButton>
                            <PaginationButton
                                onClick={() => goToPage(currentPage - 1)}
                                disabled={currentPage === 1}
                                aria-label="Previous page"
                            >
                                <ChevronLeft className="h-3.5 w-3.5" />
                            </PaginationButton>

                            {/* Page numbers */}
                            {generatePageNumbers(currentPage, totalPages).map((page, i) =>
                                page === "..." ? (
                                    <span key={`ellipsis-${i}`} className="px-1 text-xs text-text-muted">
                                        …
                                    </span>
                                ) : (
                                    <PaginationButton
                                        key={page}
                                        onClick={() => goToPage(page as number)}
                                        active={currentPage === page}
                                    >
                                        {page}
                                    </PaginationButton>
                                ),
                            )}

                            <PaginationButton
                                onClick={() => goToPage(currentPage + 1)}
                                disabled={currentPage === totalPages}
                                aria-label="Next page"
                            >
                                <ChevronRight className="h-3.5 w-3.5" />
                            </PaginationButton>
                            <PaginationButton
                                onClick={() => goToPage(totalPages)}
                                disabled={currentPage === totalPages}
                                aria-label="Last page"
                            >
                                <ChevronsRight className="h-3.5 w-3.5" />
                            </PaginationButton>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

/* ------------------------------------------------------------------ */
/*  Pagination helpers                                                 */
/* ------------------------------------------------------------------ */

function PaginationButton({
    children,
    active,
    disabled,
    onClick,
    ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { active?: boolean }) {
    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            className={cn(
                "inline-flex h-8 min-w-8 items-center justify-center rounded-lg px-2 text-xs font-medium transition-all",
                active
                    ? "bg-brand text-white shadow-sm"
                    : "border border-transparent text-text-muted hover:bg-surface-subtle hover:text-foreground",
                disabled && "pointer-events-none opacity-40",
            )}
            {...props}
        >
            {children}
        </button>
    );
}

function generatePageNumbers(current: number, total: number): (number | "...")[] {
    if (total <= 7) {
        return Array.from({ length: total }, (_, i) => i + 1);
    }

    const pages: (number | "...")[] = [1];

    if (current > 3) pages.push("...");

    const start = Math.max(2, current - 1);
    const end = Math.min(total - 1, current + 1);

    for (let i = start; i <= end; i++) {
        pages.push(i);
    }

    if (current < total - 2) pages.push("...");

    pages.push(total);

    return pages;
}
