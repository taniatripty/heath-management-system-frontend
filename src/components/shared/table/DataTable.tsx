"use client";

import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { type ColumnDef, createSortedRowModel, type RowData, type SortingState, type TableFeatures, rowSortingFeature, tableFeatures, useTable } from "@tanstack/react-table";
import { ArrowDown, ArrowUp, ArrowUpDown, MoreHorizontal } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const rowFeatures = tableFeatures({
    rowSortingFeature,
    sortedRowModel: createSortedRowModel(),
});

interface DataTableActions<TData> {
    onView ?: (data : TData) => void;
    onEdit ?: (data : TData) => void;
    onDelete ?: (data : TData) => void;
}

interface DataTableProps<TData extends RowData> {
    data : TData[];
    columns : ColumnDef<TableFeatures, TData, unknown>[];
    actions ?: DataTableActions<TData>;
    emptyMessage ?: string;
    isLoading ?: boolean;
     sorting ?: {
      state : SortingState;
      onSortingChange : (state : SortingState) => void;
    };
}


const DataTable = <TData extends RowData>({ data, columns, actions, emptyMessage, isLoading , sorting} : DataTableProps<TData>) => {
    const [localSorting, setLocalSorting] = useState<SortingState>([]);
    const [isSorting, setIsSorting] = useState(false);
    const sortingFrame = useRef<number | null>(null);
    const sortingTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
    const sortingState = sorting?.state ?? localSorting;

    useEffect(() => () => {
      if (sortingFrame.current !== null) {
        cancelAnimationFrame(sortingFrame.current);
      }
      if (sortingTimeout.current !== null) {
        clearTimeout(sortingTimeout.current);
      }
    }, []);

    const tableColumns: ColumnDef<TableFeatures, TData, unknown>[] = actions ? [...columns,
        {
            id : "actions",
            header: "Actions",
            enableSorting: false,
            cell: ({ row }) => {
                const rowData = row.original as TData;

                return (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant={"ghost"} className="h-8 w-8 p-0">
                                <span className="sr-only">Open Menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>

                        <DropdownMenuContent align="end">
                            {
                                actions.onView && (
                                    <DropdownMenuItem onClick={() => actions.onView?.(rowData)}>
                                        View
                                    </DropdownMenuItem>
                                )
                            }

                            {
                                actions.onEdit && (
                                    <DropdownMenuItem onClick={() => actions.onEdit?.(rowData)}>
                                        Edit
                                    </DropdownMenuItem>
                                )
                            }

                            {
                                actions.onDelete && (
                                    <DropdownMenuItem onClick={() => actions.onDelete?.(rowData)}>
                                        Delete
                                    </DropdownMenuItem>
                                )
                            }

                        </DropdownMenuContent>
                    </DropdownMenu>
                )
            }
        }
    ] : columns;

    const table = useTable({
      features: rowFeatures,
      data,
      columns: tableColumns,
        manualSorting: !!sorting,
      state : {
        sorting: sortingState,
      },
      onSortingChange:
        (updater) => {
          const nextSortingState =
            typeof updater === "function" ? updater(sortingState) : updater;

          setIsSorting(true);
          if (sortingFrame.current !== null) {
            cancelAnimationFrame(sortingFrame.current);
          }
          if (sortingTimeout.current !== null) {
            clearTimeout(sortingTimeout.current);
          }
          sortingFrame.current = requestAnimationFrame(() => {
            sortingTimeout.current = setTimeout(() => {
              setIsSorting(false);
              sortingTimeout.current = null;
            }, 700);

            if (sorting) {
              sorting.onSortingChange(nextSortingState);
            } else {
              setLocalSorting(nextSortingState);
            }
            sortingFrame.current = null;
          });
        },
    });

    const { getHeaderGroups, getRowModel } = table;

    return (
      <div className="relative">
        {(isLoading || isSorting) && (
          <div
            className="absolute inset-0 bg-background/50 backdrop-blur-sm z-10 flex items-center justify-center"
            role="status"
            aria-live="polite"
          >
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              <span className="text-sm text-muted-foreground">
                {isLoading ? "Loading..." : "Sorting..."}
              </span>
            </div>
          </div>
        )}

        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              {getHeaderGroups().map((hg) => (
                <TableRow key={hg.id}>
                  {hg.headers.map((header) => (
                    <TableHead
                      key={header.id}
                      aria-sort={
                        header.column.getIsSorted() === "asc"
                          ? "ascending"
                          : header.column.getIsSorted() === "desc"
                            ? "descending"
                            : "none"
                      }
                    >
                      {header.isPlaceholder ? null : header.column.getCanSort() ? (
                        <Button
                          type="button"
                          variant={"ghost"}
                          className="h-auto cursor-pointer p-0 font-semibold hover:bg-transparent hover:text-inherit focus-visible:ring-0"
                          onClick={header.column.getToggleSortingHandler()}
                        >
                          <table.FlexRender header={header} />
                          {header.column.getIsSorted() === "asc" ? (
                            <ArrowUp aria-hidden="true" className="ml-1 h-4 w-4" />
                          ) : header.column.getIsSorted() === "desc" ? (
                            <ArrowDown aria-hidden="true" className="ml-1 h-4 w-4" />
                          ) : (
                            <ArrowUpDown aria-hidden="true" className="ml-1 h-4 w-4 opacity-50" />
                          )}
                        </Button>
                      ) : (
                        <table.FlexRender header={header} />
                      )}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {getRowModel().rows.length ? (
                getRowModel().rows.map((row) => (
                  <TableRow key={row.id}>
                    {row.getAllCells().map((cell) => (
                      <TableCell key={cell.id}>
                        <table.FlexRender cell={cell} />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={tableColumns.length} className="h-24 text-center">
                    {emptyMessage || "No data available."}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    );
}

export default DataTable