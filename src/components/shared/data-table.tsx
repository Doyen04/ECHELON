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

interface DataTableProps<TData, TValue> {
    columns: {
        header: string;
        accessorKey?: keyof TData | string;
        cell?: (item: TData) => React.ReactNode;
        className?: string;
    }[];
    data: TData[];
    searchKey?: keyof TData;
    searchPlaceholder?: string;
    filters?: React.ReactNode;
    pageSize?: number;
    className?: string;
    onRowClick?: (item: TData) => void;
    hideCount?: boolean;
}

export function DataTable<TData, TValue>({
    columns,
    data,
    searchKey,
    searchPlaceholder = "Search...",
    filters,
    pageSize = 10,
    className,
    onRowClick,
    hideCount = false,
}: DataTableProps<TData, TValue>) {
    const [searchQuery, setSearchQuery] = React.useState("");
    const [currentPage, setCurrentPage] = React.useState(1);

    // Filter data based on search query
    const filteredData = React.useMemo(() => {
        if (!searchQuery || !searchKey) return data;

        return data.filter((item) => {
            const value = item[searchKey];
            if (typeof value === "string") {
                return value.toLowerCase().includes(searchQuery.toLowerCase());
            }
            return false;
        });
    }, [data, searchQuery, searchKey]);

    // Pagination logic
    const totalPages = Math.ceil(filteredData.length / pageSize);
    const startIndex = (currentPage - 1) * pageSize;
    const paginatedData = filteredData.slice(startIndex, startIndex + pageSize);

    const canNextPage = currentPage < totalPages;
    const canPreviousPage = currentPage > 1;

    React.useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery]);

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
                {!hideCount && (
                    <div className="text-sm text-muted-foreground">
                        Showing <span className="font-medium text-foreground">{filteredData.length}</span> results
                    </div>
                )}
            </div>

            <div className="min-w-0 overflow-hidden rounded-xl border border-border/70 bg-card">
                <Table>
                    <TableHeader className="bg-muted/30">
                        <TableRow>
                            {columns.map((column, index) => (
                                <TableHead key={index} className={cn("text-xs font-bold uppercase tracking-wider", column.className)}>
                                    {column.header}
                                </TableHead>
                            ))}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {paginatedData.length > 0 ? (
                            paginatedData.map((row, rowIndex) => (
                                <TableRow
                                    key={rowIndex}
                                    className={cn(onRowClick && "cursor-pointer")}
                                    onClick={() => onRowClick?.(row)}
                                >
                                    {columns.map((column, colIndex) => (
                                        <TableCell key={colIndex} className={column.className}>
                                            {column.cell ? column.cell(row) : (column.accessorKey ? String(row[column.accessorKey as keyof TData] ?? "") : "")}
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

            <div className="flex items-center justify-between px-2 py-4">
                <div className="text-sm text-muted-foreground">
                    Page {currentPage} of {Math.max(1, totalPages)}
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        disabled={!canPreviousPage}
                        className="rounded-full h-8 px-4"
                    >
                        <ChevronLeft className="mr-1 h-4 w-4" />
                        Previous
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                        disabled={!canNextPage}
                        className="rounded-full h-8 px-4"
                    >
                        Next
                        <ChevronRight className="ml-1 h-4 w-4" />
                    </Button>
                </div>
            </div>
        </div>
    );
}
