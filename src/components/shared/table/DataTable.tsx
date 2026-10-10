"use client";

import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { type ColumnDef, createPaginatedRowModel, createSortedRowModel, type PaginationState, type RowData, type SortingState, type TableFeatures, rowPaginationFeature, rowSortingFeature, tableFeatures, useTable } from "@tanstack/react-table";
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, ArrowUpDown, MoreHorizontal, Search, X } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import type { Pagination } from "@/types/api.types";

const rowFeatures = tableFeatures({
    rowSortingFeature,
    rowPaginationFeature,
    sortedRowModel: createSortedRowModel(),
    paginatedRowModel: createPaginatedRowModel(),
});

const pageSizes = [1, 2, 10, 20, 30, 50];

interface DataTableSearchProps {
    searchTerm: string;
    onSearchChange: (searchTerm: string) => void;
}

const DataTableSearch = ({ searchTerm, onSearchChange }: DataTableSearchProps) => {
    const [searchValue, setSearchValue] = useState(searchTerm);
    const searchInputId = useId();

    useEffect(() => {
      if (searchValue.trim() === searchTerm) {
        return;
      }

      const timeout = setTimeout(() => onSearchChange(searchValue), 700);
      return () => clearTimeout(timeout);
    }, [onSearchChange, searchTerm, searchValue]);

    return (
      <div className="relative mb-4 max-w-sm">
        <label htmlFor={searchInputId} className="sr-only">
          Search table
        </label>
        <Search
          aria-hidden="true"
          className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          id={searchInputId}
          type="text"
          value={searchValue}
          onChange={(event) => setSearchValue(event.target.value)}
          placeholder="Search..."
          className="pr-9 pl-9"
        />
        {searchValue && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute right-0 top-0 h-8 w-8"
            onClick={() => setSearchValue("")}
            aria-label="Clear search"
          >
            <X aria-hidden="true" className="h-4 w-4" />
          </Button>
        )}
      </div>
    );
};

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
    pagination?: Pagination;
    onPaginationChange?: (pagination: PaginationState) => void;
    searchTerm?: string;
    onSearchChange?: (searchTerm: string) => void;
     sorting ?: {
      state : SortingState;
      onSortingChange : (state : SortingState) => void;
    };
}


const DataTable = <TData extends RowData>({ data, columns, actions, emptyMessage, isLoading, pagination, onPaginationChange, searchTerm = "", onSearchChange, sorting} : DataTableProps<TData>) => {
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
      initialState: {
        pagination: {
          pageIndex: 0,
          pageSize: 10,
        },
      },
      manualPagination: !!pagination,
      pageCount: pagination?.totalPages,
      manualSorting: !!sorting,
      state : {
        sorting: sortingState,
        ...(pagination && {
          pagination: {
            pageIndex: Math.max(pagination.page - 1, 0),
            pageSize: pagination.limit,
          },
        }),
      },
      onPaginationChange: onPaginationChange
        ? (updater) => {
            const currentPagination: PaginationState = pagination
              ? {
                  pageIndex: Math.max(pagination.page - 1, 0),
                  pageSize: pagination.limit,
                }
              : { pageIndex: 0, pageSize: 10 };
            onPaginationChange(
              typeof updater === "function" ? updater(currentPagination) : updater,
            );
          }
        : undefined,
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
    const pageCount = pagination?.totalPages ?? table.getPageCount();
    const displayPageCount = Math.max(pageCount, 1);
    const currentPage = pagination?.page ?? (pageCount > 0 ? table.state.pagination.pageIndex + 1 : 1);
    const currentPageSize = pagination?.limit ?? table.state.pagination.pageSize;
    const pageWindowStart = Math.max(
      1,
      Math.min(currentPage - 2, displayPageCount - 4),
    );
    const visiblePages = Array.from(
      { length: Math.min(5, displayPageCount) },
      (_, index) => pageWindowStart + index,
    );

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

        {onSearchChange && (
          <DataTableSearch
            key={searchTerm}
            searchTerm={searchTerm}
            onSearchChange={onSearchChange}
          />
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

        <div className="flex flex-wrap items-center justify-between gap-3 pt-4">
          <div className="flex items-center gap-2">
            <span id="rows-per-page-label" className="text-sm text-muted-foreground">
              Rows per page
            </span>
            <Select
              value={String(currentPageSize)}
              onValueChange={(value) => {
                if (typeof value === "string") {
                  if (pagination) {
                    onPaginationChange?.({
                      pageIndex: 0,
                      pageSize: Number(value),
                    });
                  } else {
                    table.setPageSize(Number(value));
                  }
                }
              }}
            >
              <SelectTrigger aria-labelledby="rows-per-page-label" className="w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {pageSizes.map((pageSize) => (
                  <SelectItem key={pageSize} value={String(pageSize)}>
                    {pageSize}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-end gap-3">
            <span className="text-sm text-muted-foreground" aria-live="polite">
              Page {currentPage} of {displayPageCount}
            </span>
            <span className="text-sm text-muted-foreground">
              Total pages: {pageCount} · Total items: {pagination?.total ?? data.length}
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={isLoading || !table.getCanPreviousPage()}
              aria-label="Go to previous page"
            >
              <ArrowLeft aria-hidden="true" />
              Previous
            </Button>
            {pageWindowStart > 1 && (
              <>
                <Button
                  type="button"
                  variant={currentPage === 1 ? "default" : "outline"}
                  size="sm"
                  onClick={() => table.setPageIndex(0)}
                  disabled={isLoading}
                  aria-label="Go to page 1"
                  aria-current={currentPage === 1 ? "page" : undefined}
                >
                  1
                </Button>
                {pageWindowStart > 2 && (
                  <span className="text-sm text-muted-foreground" aria-hidden="true">
                    …
                  </span>
                )}
              </>
            )}
            {visiblePages.map((page) => (
              <Button
                key={page}
                type="button"
                variant={currentPage === page ? "default" : "outline"}
                size="sm"
                onClick={() => table.setPageIndex(page - 1)}
                disabled={isLoading}
                aria-label={`Go to page ${page}`}
                aria-current={currentPage === page ? "page" : undefined}
              >
                {page}
              </Button>
            ))}
            {visiblePages[visiblePages.length - 1] < displayPageCount && (
              <>
                {visiblePages[visiblePages.length - 1] < displayPageCount - 1 && (
                  <span className="text-sm text-muted-foreground" aria-hidden="true">
                    …
                  </span>
                )}
                <Button
                  type="button"
                  variant={currentPage === displayPageCount ? "default" : "outline"}
                  size="sm"
                  onClick={() => table.setPageIndex(displayPageCount - 1)}
                  disabled={isLoading}
                  aria-label={`Go to page ${displayPageCount}`}
                  aria-current={currentPage === displayPageCount ? "page" : undefined}
                >
                  {displayPageCount}
                </Button>
              </>
            )}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={isLoading || !table.getCanNextPage()}
              aria-label="Go to next page"
            >
              Next
              <ArrowRight aria-hidden="true" />
            </Button>
          </div>
        </div>
      </div>
    );
}

export default DataTable