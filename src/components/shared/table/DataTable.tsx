"use client";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { type ColumnDef, createPaginatedRowModel, createSortedRowModel, type PaginationState, type RowData, type SortingState, type TableFeatures, rowPaginationFeature, rowSortingFeature, tableFeatures, useTable } from "@tanstack/react-table";
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, ArrowUpDown, MoreHorizontal, Search, X } from "lucide-react";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import type { Pagination } from "@/types/api.types";

export interface DataTableFilterOption {
    label: string;
    value: string;
}

export interface DataTableFilter<TData extends RowData> {
    id: string;
    label: string;
    type: "single" | "multi" | "range";
    options: DataTableFilterOption[];
    getValue: (row: TData) => string | number | readonly string[] | null | undefined;
}

export interface DataTableFilterRange {
    min?: string;
    max?: string;
}

export type DataTableFilterValue = string | string[] | DataTableFilterRange;
export type DataTableFilterState = Record<string, DataTableFilterValue>;

interface DataTableRangeFilterProps {
    label: string;
    value: DataTableFilterRange;
    onApply: (value: DataTableFilterRange | undefined) => void;
}

const DataTableRangeFilter = ({ label, value, onApply }: DataTableRangeFilterProps) => {
    const [minimum, setMinimum] = useState(value.min ?? "");
    const [maximum, setMaximum] = useState(value.max ?? "");
    const hasRangeError =
        minimum !== "" &&
        maximum !== "" &&
        Number(minimum) > Number(maximum);
    const hasChanges = minimum !== (value.min ?? "") || maximum !== (value.max ?? "");

    const applyRange = () => {
      if (hasRangeError) {
        return;
      }

      onApply(
        minimum || maximum
          ? {
              ...(minimum ? { min: minimum } : {}),
              ...(maximum ? { max: maximum } : {}),
            }
          : undefined,
      );
    };

    return (
      <div className="flex w-full flex-col gap-2">
        <div className="flex w-full flex-wrap items-end gap-2">
          <label className="flex min-w-0 flex-[1_1_7rem] flex-col gap-1 text-xs text-muted-foreground">
            Minimum
            <Input
              type="number"
              min="0"
              value={minimum}
              onChange={(event) => setMinimum(event.target.value)}
              aria-label={`Minimum ${label}`}
            />
          </label>
          <label className="flex min-w-0 flex-[1_1_7rem] flex-col gap-1 text-xs text-muted-foreground">
            Maximum
            <Input
              type="number"
              min="0"
              value={maximum}
              onChange={(event) => setMaximum(event.target.value)}
              aria-label={`Maximum ${label}`}
            />
          </label>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="w-full sm:w-auto"
            disabled={!hasChanges || hasRangeError}
            onClick={applyRange}
          >
            Apply
          </Button>
        </div>
        {hasRangeError && (
          <p className="text-xs text-destructive" role="alert">
            Minimum must not exceed maximum.
          </p>
        )}
      </div>
    );
};

const rowFeatures = tableFeatures({
    rowSortingFeature,
    rowPaginationFeature,
    sortedRowModel: createSortedRowModel(),
    paginatedRowModel: createPaginatedRowModel(),
});

const pageSizes = [1, 2, 10, 20, 30, 50];
const EMPTY_FILTERS: never[] = [];

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

      const timeout = setTimeout(() => onSearchChange(searchValue), 1200);
      return () => clearTimeout(timeout);
    }, [onSearchChange, searchTerm, searchValue]);

    return (
      <div className="relative w-full max-w-sm">
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
     filters?: DataTableFilter<TData>[];
     filtering?: {
       state: DataTableFilterState;
       onFilterChange: (state: DataTableFilterState) => void;
       debounceMs?: number;
     };
}


const DataTable = <TData extends RowData>({ data, columns, actions, emptyMessage, isLoading, pagination, onPaginationChange, searchTerm = "", onSearchChange, sorting, filters = EMPTY_FILTERS, filtering} : DataTableProps<TData>) => {
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

     const activeFilters = filters;
     const activeFilterSelections = activeFilters.flatMap((filter) => {
       const selected = filterState[filter.id];
        const values = filter.type === "range"
          ? selected && !Array.isArray(selected) && typeof selected === "object"
            ? ([
                selected.min && { value: `min:${selected.min}`, label: `Min: ${selected.min}` },
                selected.max && { value: `max:${selected.max}`, label: `Max: ${selected.max}` },
              ].filter(Boolean) as { value: string; label: string }[])
            : []
          : Array.isArray(selected)
            ? selected.map((value) => ({ value, label: filter.options.find((option) => option.value === value)?.label ?? value }))
            : typeof selected === "string" && selected
              ? [{ value: selected, label: filter.options.find((option) => option.value === selected)?.label ?? selected }]
              : [];

        return values.map(({ value, label }) => ({ filter, value, label }));
     });

      const setFilterValue = (filterId: string, value: DataTableFilterValue | undefined) => {
       const nextFilterState = { ...filterState };
        if (
          value === undefined ||
          (Array.isArray(value) && value.length === 0) ||
          (typeof value === "object" &&
            !Array.isArray(value) &&
            value.min === undefined &&
            value.max === undefined)
        ) {
          delete nextFilterState[filterId];
        } else {
          nextFilterState[filterId] = value;
       }
       updateFilterState(nextFilterState);
     };

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

        {(onSearchChange || activeFilters.length > 0) && (
          <div className="mb-4 space-y-3">
            <div className="flex flex-wrap items-end gap-x-4 gap-y-3 rounded-lg border bg-card p-4">
              {onSearchChange && (
                <div className="flex min-w-56 flex-[1_1_15rem] flex-col gap-1.5">
                  <span className="text-sm font-medium">Search</span>
                  <DataTableSearch
                    key={searchTerm}
                    searchTerm={searchTerm}
                    onSearchChange={onSearchChange}
                  />
                </div>
              )}
              {activeFilters.map((filter) => (
                <fieldset
                  key={filter.id}
                  className={`flex min-w-0 flex-col gap-1.5 ${
                    filter.type === "range"
                      ? "flex-[1.5_1_20rem] rounded-lg border bg-muted/30 p-3 sm:p-4"
                      : filter.type === "multi"
                        ? "flex-[1.2_1_14rem]"
                        : "flex-[0.8_1_10rem]"
                  }`}
                >
                  <legend className="text-sm font-medium">{filter.label}</legend>
                  {filter.type === "range" ? (
                    (() => {
                      const range = filterState[filter.id] &&
                        !Array.isArray(filterState[filter.id]) &&
                        typeof filterState[filter.id] === "object"
                        ? filterState[filter.id] as DataTableFilterRange
                        : {};
                      return (
                        <DataTableRangeFilter
                          key={`${filter.id}-${range.min ?? ""}-${range.max ?? ""}`}
                          label={filter.label}
                          value={range}
                          onApply={(nextRange) => setFilterValue(filter.id, nextRange)}
                        />
                      );
                    })()
                  ) : filter.type === "single" ? (
                    <Select
                      value={
                        typeof filterState[filter.id] === "string"
                          ? filterState[filter.id] as string
                          : null
                      }
                      onValueChange={(value) => {
                        if (typeof value === "string") {
                          setFilterValue(
                            filter.id,
                            value || undefined,
                          );
                        }
                      }}
                    >
                      <SelectTrigger aria-label={`Select ${filter.label}`} className="w-full">
                        <SelectValue placeholder="All" />
                      </SelectTrigger>
                      <SelectContent>
                        {filter.options.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <div className="flex flex-wrap gap-x-3 gap-y-2">
                      {filter.options.map((option) => {
                        const selectedValues = Array.isArray(filterState[filter.id])
                          ? filterState[filter.id] as string[]
                          : [];
                        const checked = selectedValues.includes(option.value);

                        return (
                          <label
                            key={option.value}
                            className="flex cursor-pointer items-center gap-2 text-sm"
                          >
                            <Checkbox
                              checked={checked}
                              onCheckedChange={(isChecked) => {
                                const nextValues = isChecked
                                  ? [...selectedValues, option.value]
                                  : selectedValues.filter((value) => value !== option.value);
                                setFilterValue(filter.id, nextValues);
                              }}
                            />
                            {option.label}
                          </label>
                        );
                      })}
                    </div>
                  )}
                </fieldset>
              ))}
              {activeFilterSelections.length > 0 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="shrink-0"
                  onClick={() => updateFilterState({})}
                >
                  Clear all filters
                </Button>
              )}
            </div>
            {activeFilterSelections.length > 0 && (
              <div className="flex flex-wrap items-center gap-2">
                {activeFilterSelections.map(({ filter, value, label }) => (
                  <span
                    key={`${filter.id}-${value}`}
                    className="inline-flex h-8 items-center gap-1 rounded-lg border bg-muted px-2 text-sm"
                  >
                    <span>{filter.label}: {label}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-xs"
                      className="h-5 w-5"
                      aria-label={`Remove ${label} ${filter.label} filter`}
                      onClick={() => {
                        if (filter.type === "range") {
                          const range = filterState[filter.id] &&
                            !Array.isArray(filterState[filter.id]) &&
                            typeof filterState[filter.id] === "object"
                            ? filterState[filter.id] as DataTableFilterRange
                            : {};
                          const bound = value.startsWith("min:") ? "min" : "max";
                          const nextRange = { ...range, [bound]: undefined };
                          setFilterValue(
                            filter.id,
                            nextRange.min || nextRange.max ? nextRange : undefined,
                          );
                        } else if (filter.type === "multi") {
                          const selectedValues = Array.isArray(filterState[filter.id])
                            ? filterState[filter.id] as string[]
                            : [];
                          setFilterValue(
                            filter.id,
                            selectedValues.filter((selectedValue) => selectedValue !== value),
                          );
                        } else {
                          setFilterValue(filter.id, undefined);
                        }
                      }}
                    >
                      <X aria-hidden="true" />
                    </Button>
                  </span>
                ))}
              </div>
            )}
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