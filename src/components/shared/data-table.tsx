"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

interface Column<TData> {
    header: string;
    accessorKey?: keyof TData | string;
    cell?: (item: TData) => React.ReactNode;
    className?: string;
}

interface DataTableProps<TData> {
    columns: Column<TData>[];
    data: TData[];
    searchKey?: keyof TData;
    searchPlaceholder?: string;
    filters?: React.ReactNode;
    pageSize?: number;
    className?: string;
    onRowClick?: (item: TData) => void;
    /** Optional renderer for mobile row cards. */
    mobileRow?: (item: TData) => React.ReactNode;
    /** Enable server-side pagination controls. */
    manualPagination?: boolean;
    currentPage?: number;
    totalPages?: number;
    totalCount?: number;
    onPageChange?: (page: number) => void;
}

export function DataTable<TData>({
    columns,
    data,
    searchKey,
    searchPlaceholder = "Search...",
    filters,
    pageSize = 10,
    className,
    onRowClick,
    mobileRow,
    manualPagination = false,
    currentPage: controlledCurrentPage,
    totalPages: controlledTotalPages,
    totalCount,
    onPageChange,
}: DataTableProps<TData>) {
    const [searchQuery, setSearchQuery] = React.useState("");
    const [currentPage, setCurrentPage] = React.useState(1);

    const filteredData = React.useMemo(() => {
        if (manualPagination) return data;
        if (!searchQuery || !searchKey) return data;
        return data.filter((item) => {
            const value = item[searchKey];
            if (typeof value === "string") {
                return value.toLowerCase().includes(searchQuery.toLowerCase());
            }
            return false;
        });
    }, [data, searchQuery, searchKey]);

    const resolvedCurrentPage = manualPagination
        ? Math.max(1, controlledCurrentPage ?? 1)
        : currentPage;
    const computedTotalPages = Math.max(1, Math.ceil(filteredData.length / pageSize));
    const resolvedTotalPages = manualPagination
        ? Math.max(1, controlledTotalPages ?? 1)
        : computedTotalPages;
    const startIndex = (resolvedCurrentPage - 1) * pageSize;
    const paginatedData = manualPagination
        ? data
        : filteredData.slice(startIndex, startIndex + pageSize);

    const canNextPage = resolvedCurrentPage < resolvedTotalPages;
    const canPreviousPage = resolvedCurrentPage > 1;

    const handlePageChange = (nextPage: number) => {
        if (manualPagination) {
            onPageChange?.(nextPage);
            return;
        }

        setCurrentPage(nextPage);
    };

    React.useEffect(() => setCurrentPage(1), [searchQuery]);

    return (
        <div className={cn("min-w-0 space-y-4", className)}>
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex flex-1 flex-wrap items-center gap-3">
                    {searchKey && (
                        <div className="relative w-full max-w-sm">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                placeholder={searchPlaceholder}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="rounded-full pl-9"
                            />
                        </div>
                    )}
                    {filters}
                </div>
            </div>

            {/* Desktop table */}
            <div className={cn(
                "min-w-0 overflow-x-auto rounded-xl",
                !className?.includes("border-none") && !className?.includes("border-0") && "border border-border/50 bg-card/50 shadow-sm"
            )}>
                <div className="hidden md:block">
                    <Table className="divide-y divide-border">
                        <TableHeader className={cn(
                            "border-b border-border/50",
                            !className?.includes("border-none") && !className?.includes("border-0") && "bg-muted/20"
                        )}>
                            <TableRow>
                                {columns.map((column, index) => (
                                    <TableHead key={index} className={cn("px-6 py-4 text-left text-[10px] font-bold uppercase tracking-widest text-muted-foreground", column.className)}>
                                        {column.header}
                                    </TableHead>
                                ))}
                            </TableRow>
                        </TableHeader>
                        <TableBody className="divide-y divide-border">
                            {paginatedData.length > 0 ? (
                                paginatedData.map((row, rowIndex) => (
                                    <TableRow key={rowIndex} className={cn("group transition-colors hover:bg-muted/20", onRowClick && "cursor-pointer")} onClick={() => onRowClick?.(row)}>
                                        {columns.map((column, colIndex) => (
                                            <TableCell key={colIndex} className={cn("px-6 py-5 align-top whitespace-normal", column.className)}>
                                                {column.cell ? column.cell(row) : (column.accessorKey ? String((row as any)[column.accessorKey as string] ?? "") : "")}
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={columns.length} className="h-24 text-center">
                                        No results found.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>

            <div className="flex items-center justify-between px-6 py-6 border-t border-border/50">
                <div className="text-sm font-medium text-muted-foreground tracking-tight">
                    Page <span className="text-foreground">{resolvedCurrentPage}</span> of <span className="text-foreground">{resolvedTotalPages}</span>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(Math.max(1, resolvedCurrentPage - 1))}
                        disabled={!canPreviousPage}
                        className="rounded-full h-8 px-4"
                    >
                        <ChevronLeft className="mr-1 h-4 w-4" />
                        Previous
                    </Button>
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(Math.min(resolvedTotalPages, resolvedCurrentPage + 1))}
                        disabled={!canNextPage}
                        className="rounded-full h-8 px-4"
                    >
                        Next
                        <ChevronRight className="ml-1 h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* Mobile stacked card list */}
            <div className="md:hidden">
                {paginatedData.length > 0 ? (
                    <div className="grid gap-4">
                        {paginatedData.map((row, idx) => (
                            <div key={idx} className="rounded-xl border border-border bg-card p-5 space-y-4">
                                {mobileRow ? (
                                    mobileRow(row)
                                ) : (
                                    <div className="space-y-3">
                                        {columns.map((col, i) => (
                                            <div key={i}>
                                                <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground leading-none mb-1.5">{col.header}</div>
                                                <div className="text-sm font-medium text-foreground">{col.cell ? col.cell(row) : (col.accessorKey ? String((row as any)[col.accessorKey as string] ?? "") : "")}</div>
                                                {i < columns.length - 1 && <div className="mt-3 pt-3 border-t border-border/50" />}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="rounded-xl border border-border border-dashed bg-card p-8 text-center">
                        <Search className="mx-auto h-8 w-8 text-muted-foreground/30 mb-2" />
                        <p className="text-sm font-medium text-muted-foreground">No results found.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
