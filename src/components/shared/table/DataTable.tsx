"use client";

import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { type ColumnDef, createPaginatedRowModel, createSortedRowModel, type PaginationState, type RowData, type SortingState, type TableFeatures, rowPaginationFeature, rowSortingFeature, tableFeatures, useTable } from "@tanstack/react-table";
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, ArrowUpDown, MoreHorizontal } from "lucide-react";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import type { Pagination } from "@/types/api.types";
import DataTableFilters from "@/components/shared/table/DataTableFilters";
import type {
  DataTableFilter,
  DataTableFilterState,
} from "@/components/shared/table/data-table.types";

export type {
  DataTableFilter,
  DataTableFilterOption,
  DataTableFilterRange,
  DataTableFilterState,
  DataTableFilterValue,
} from "@/components/shared/table/data-table.types";

const rowFeatures = tableFeatures({
    rowSortingFeature,
    rowPaginationFeature,
    sortedRowModel: createSortedRowModel(),
    paginatedRowModel: createPaginatedRowModel(),
});

const pageSizes = [1, 2, 10, 20, 30, 50];
const EMPTY_FILTERS: never[] = [];

interface DataTableActions<TData> {
    onView ?: (data : TData) => void;
    onEdit ?: (data : TData) => void;
    onDelete ?: (data : TData) => void;
}

interface DataTableProps<TData extends RowData> {
    data : TData[];
    columns : ColumnDef<TableFeatures, TData, unknown>[];
    toolbarAction?: ReactNode;
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
     filters?: DataTableFilter<TData>[];
     filtering?: {
       state: DataTableFilterState;
       onFilterChange: (state: DataTableFilterState) => void;
       debounceMs?: number;
     };
}


const DataTable = <TData extends RowData>({ data, columns, actions, toolbarAction, emptyMessage, isLoading, pagination, onPaginationChange, searchTerm = "", onSearchChange, sorting, filters = EMPTY_FILTERS, filtering} : DataTableProps<TData>) => {
     const [localSorting, setLocalSorting] = useState<SortingState>([]);
     const [localFilters, setLocalFilters] = useState<DataTableFilterState>({});
     const [draftFilterState, setDraftFilterState] = useState<DataTableFilterState>({});
     const [hasDraftFilterState, setHasDraftFilterState] = useState(false);
     const [isSorting, setIsSorting] = useState(false);
     const sortingFrame = useRef<number | null>(null);
     const sortingTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
     const sortingState = sorting?.state ?? localSorting;
     const filterState = filtering
       ? hasDraftFilterState
         ? draftFilterState
         : filtering.state
       : localFilters;

     const updateFilterState = (nextFilterState: DataTableFilterState) => {
       if (filtering) {
         setDraftFilterState(nextFilterState);
         setHasDraftFilterState(
           JSON.stringify(nextFilterState) !== JSON.stringify(filtering.state),
         );
         return;
       }

       setLocalFilters(nextFilterState);
       if (pagination && onPaginationChange) {
         onPaginationChange({
           pageIndex: 0,
           pageSize: pagination.limit,
         });
       }
     };

     const filteredData = useMemo(() => {
       if (filtering || !filters.length) {
         return data;
       }

       return data.filter((row) =>
           filters.every((filter) => {
             const selected = filterState[filter.id];
             const rowValue = filter.getValue(row);
             if (filter.type === "range") {
               if (typeof rowValue !== "number") {
                 return false;
               }
               const range = selected && !Array.isArray(selected) && typeof selected === "object"
                 ? selected
                 : {};
               const minimum = range.min === undefined ? undefined : Number(range.min);
               const maximum = range.max === undefined ? undefined : Number(range.max);
               return (
                 (minimum === undefined || rowValue >= minimum) &&
                 (maximum === undefined || rowValue <= maximum)
               );
             }

             if (filter.type === "single") {
               if (typeof selected !== "string" || !selected) {
                 return true;
               }
               return Array.isArray(rowValue)
                 ? rowValue.includes(selected)
                 : rowValue === selected;
             }

             if (!Array.isArray(selected) || selected.length === 0) {
               return true;
             }
             const rowValues = Array.isArray(rowValue) ? rowValue : [rowValue];
             return selected.some((value) => rowValues.includes(value));
           }),
         );
     }, [data, filterState, filtering, filters]);

    useEffect(() => () => {
      if (sortingFrame.current !== null) {
        cancelAnimationFrame(sortingFrame.current);
      }
      if (sortingTimeout.current !== null) {
        clearTimeout(sortingTimeout.current);
      }
    }, []);

    useEffect(() => {
      if (
        !filtering ||
        !hasDraftFilterState ||
        JSON.stringify(draftFilterState) === JSON.stringify(filtering.state)
      ) {
        return;
      }

      const timeout = setTimeout(
        () => {
          filtering.onFilterChange(draftFilterState);
          setHasDraftFilterState(false);
        },
        filtering.debounceMs ?? 1000,
      );
      return () => clearTimeout(timeout);
    }, [
      draftFilterState,
      hasDraftFilterState,
      filtering?.state,
      filtering?.onFilterChange,
      filtering?.debounceMs,
    ]);

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
                            {[
                              { label: "View", onSelect: actions.onView },
                              { label: "Edit", onSelect: actions.onEdit },
                              { label: "Delete", onSelect: actions.onDelete },
                            ].map(({ label, onSelect }) =>
                              onSelect ? (
                                <DropdownMenuItem
                                  key={label}
                                  onClick={() => onSelect(rowData)}
                                >
                                  {label}
                                </DropdownMenuItem>
                              ) : null,
                            )}
                        </DropdownMenuContent>
                    </DropdownMenu>
                )
            }
        }
    ] : columns;

    const table = useTable({
      features: rowFeatures,
      data: filteredData,
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
    const renderPageButton = (page: number) => (
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

        {(onSearchChange || filters.length > 0 || toolbarAction) && (
          <DataTableFilters
            filters={filters}
            state={filterState}
            onChange={updateFilterState}
            searchTerm={searchTerm}
            onSearchChange={onSearchChange}
            toolbarAction={toolbarAction}
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
                {renderPageButton(1)}
                {pageWindowStart > 2 && (
                  <span className="text-sm text-muted-foreground" aria-hidden="true">
                    …
                  </span>
                )}
              </>
            )}
            {visiblePages.map(renderPageButton)}
            {visiblePages[visiblePages.length - 1] < displayPageCount && (
              <>
                {visiblePages[visiblePages.length - 1] < displayPageCount - 1 && (
                  <span className="text-sm text-muted-foreground" aria-hidden="true">
                    …
                  </span>
                )}
                {renderPageButton(displayPageCount)}
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