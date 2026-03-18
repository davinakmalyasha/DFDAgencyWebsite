'use client';

import { TableRow, TableCell } from "@/components/ui/table";

interface TableSkeletonProps {
    columns: number;
    rows?: number;
}

export function TableSkeleton({ columns, rows = 5 }: TableSkeletonProps) {
    return (
        <>
            {Array.from({ length: rows }).map((_, rowIndex) => (
                <TableRow key={rowIndex} className="border-b-2 border-foreground/10">
                    {Array.from({ length: columns }).map((_, colIndex) => (
                        <TableCell key={colIndex} className="py-4">
                            <div className="h-6 bg-zinc-100 rounded animate-pulse w-full" />
                        </TableCell>
                    ))}
                </TableRow>
            ))}
        </>
    );
}
