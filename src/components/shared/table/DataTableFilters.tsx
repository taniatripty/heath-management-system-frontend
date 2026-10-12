"use client"

import { useEffect, useId, useState } from "react"
import type { ReactNode } from "react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ChevronDown, Search, X } from "lucide-react"
import type {
  DataTableFilter,
  DataTableFilterRange,
  DataTableFilterState,
  DataTableFilterValue,
} from "@/components/shared/table/data-table.types"
import type { RowData } from "@tanstack/react-table"

interface DataTableFiltersProps<TData extends RowData> {
  filters: DataTableFilter<TData>[]
  state: DataTableFilterState
  onChange: (state: DataTableFilterState) => void
  searchTerm: string
  onSearchChange?: (searchTerm: string) => void
  toolbarAction?: ReactNode
}

interface DataTableRangeFilterProps {
  label: string
  value: DataTableFilterRange
  onApply: (value: DataTableFilterRange | undefined) => void
}

const DataTableRangeFilter = ({ label, value, onApply }: DataTableRangeFilterProps) => {
  const [minimum, setMinimum] = useState(value.min ?? "")
  const [maximum, setMaximum] = useState(value.max ?? "")
  const hasRangeError =
    minimum !== "" && maximum !== "" && Number(minimum) > Number(maximum)
  const hasChanges =
    minimum !== (value.min ?? "") || maximum !== (value.max ?? "")

  const applyRange = () => {
    if (hasRangeError) {
      return
    }

    onApply(
      minimum || maximum
        ? {
            ...(minimum ? { min: minimum } : {}),
            ...(maximum ? { max: maximum } : {}),
          }
        : undefined,
    )
  }

  return (
    <div className="flex w-full flex-col gap-1">
      <div className="flex w-full items-end gap-2">
        <label className="flex min-w-0 flex-1 flex-col gap-1 text-xs text-muted-foreground">
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
          className="shrink-0"
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
  )
}

interface DataTableSearchProps {
  searchTerm: string
  onSearchChange: (searchTerm: string) => void
}

const DataTableSearch = ({ searchTerm, onSearchChange }: DataTableSearchProps) => {
  const [searchValue, setSearchValue] = useState(searchTerm)
  const searchInputId = useId()

  useEffect(() => {
    if (searchValue.trim() === searchTerm) {
      return
    }

    const timeout = setTimeout(() => onSearchChange(searchValue), 1200)
    return () => clearTimeout(timeout)
  }, [onSearchChange, searchTerm, searchValue])

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
  )
}

const getRangeValue = (value: DataTableFilterValue | undefined): DataTableFilterRange =>
  value && !Array.isArray(value) && typeof value === "object" ? value : {}

const getSelectedValues = (value: DataTableFilterValue | undefined): string[] =>
  Array.isArray(value) ? value : []

const DataTableFilters = <TData extends RowData>({
  filters,
  state,
  onChange,
  searchTerm,
  onSearchChange,
  toolbarAction,
}: DataTableFiltersProps<TData>) => {
  const setFilterValue = (filterId: string, value: DataTableFilterValue | undefined) => {
    const nextState = { ...state }
    const isEmptyRange =
      value !== undefined &&
      !Array.isArray(value) &&
      typeof value === "object" &&
      value.min === undefined &&
      value.max === undefined

    if (value === undefined || (Array.isArray(value) && value.length === 0) || isEmptyRange) {
      delete nextState[filterId]
    } else {
      nextState[filterId] = value
    }
    onChange(nextState)
  }

  const activeSelections = filters.flatMap((filter) => {
    const selected = state[filter.id]
    if (filter.type === "range") {
      const range = getRangeValue(selected)
      const selections: { value: string; label: string }[] = []
      if (range.min) {
        selections.push({ value: `min:${range.min}`, label: `Min: ${range.min}` })
      }
      if (range.max) {
        selections.push({ value: `max:${range.max}`, label: `Max: ${range.max}` })
      }
      return selections.map((selection) => ({ filter, ...selection }))
    }

    const values = filter.type === "multi"
      ? getSelectedValues(selected)
      : typeof selected === "string" && selected
        ? [selected]
        : []

    return values.map((value) => ({
      filter,
      value,
      label: filter.options.find((option) => option.value === value)?.label ?? value,
    }))
  })

  const removeSelection = (
    filter: DataTableFilter<TData>,
    value: string,
  ) => {
    if (filter.type === "range") {
      const range = getRangeValue(state[filter.id])
      const bound = value.startsWith("min:") ? "min" : "max"
      const nextRange = { ...range, [bound]: undefined }
      setFilterValue(
        filter.id,
        nextRange.min || nextRange.max ? nextRange : undefined,
      )
      return
    }

    if (filter.type === "multi") {
      const selectedValues = getSelectedValues(state[filter.id])
      setFilterValue(
        filter.id,
        selectedValues.filter((selectedValue) => selectedValue !== value),
      )
      return
    }

    setFilterValue(filter.id, undefined)
  }

  return (
    <div className="mb-4 space-y-3">
      <div className="grid grid-cols-1 gap-3 rounded-lg border bg-card p-3 sm:grid-cols-2 sm:p-4 xl:grid-cols-[minmax(14rem,2fr)_minmax(9rem,1fr)_minmax(10rem,1fr)_minmax(10rem,1fr)_auto] xl:items-end">
        {onSearchChange && (
          <div className="flex min-w-0 flex-col gap-1.5">
            <span className="text-sm font-medium">Search</span>
            <DataTableSearch
              key={searchTerm}
              searchTerm={searchTerm}
              onSearchChange={onSearchChange}
            />
          </div>
        )}
        {filters.map((filter) => {
          const selectedValue = state[filter.id]

          return (
            <div key={filter.id} className="min-w-0">
              {filter.type === "single" ? (
                <fieldset className="flex min-w-0 flex-col gap-1.5">
                  <legend className="text-sm font-medium">{filter.label}</legend>
                  <Select
                    value={typeof selectedValue === "string" ? selectedValue : null}
                    onValueChange={(value) => {
                      if (typeof value === "string") {
                        setFilterValue(filter.id, value || undefined)
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
                </fieldset>
              ) : filter.type === "multi" ? (
                <MultiSelectFilter
                  filter={filter}
                  selectedValues={getSelectedValues(selectedValue)}
                  onChange={(values) => setFilterValue(filter.id, values)}
                />
              ) : (
                <RangeSelectFilter
                  filter={filter}
                  range={getRangeValue(selectedValue)}
                  onApply={(range) => setFilterValue(filter.id, range)}
                />
              )}
            </div>
          )
        })}
        {toolbarAction && (
          <div className="flex min-w-0 items-end sm:col-span-2 xl:col-span-1">
            {toolbarAction}
          </div>
        )}
        {activeSelections.length > 0 && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="shrink-0 sm:col-span-2 xl:col-span-5 xl:justify-self-end"
            onClick={() => onChange({})}
          >
            Clear all filters
          </Button>
        )}
      </div>
      {activeSelections.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          {activeSelections.map(({ filter, value, label }) => (
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
                onClick={() => removeSelection(filter, value)}
              >
                <X aria-hidden="true" />
              </Button>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

interface MultiSelectFilterProps<TData extends RowData> {
  filter: DataTableFilter<TData>
  selectedValues: string[]
  onChange: (values: string[]) => void
}

const MultiSelectFilter = <TData extends RowData>({
  filter,
  selectedValues,
  onChange,
}: MultiSelectFilterProps<TData>) => (
  <Popover>
    <PopoverTrigger
      render={
        <Button type="button" variant="outline" className="w-full justify-between" />
      }
    >
      <span className="truncate">
        {filter.label}
        {selectedValues.length > 0 ? ` (${selectedValues.length})` : ""}
      </span>
      <ChevronDown aria-hidden="true" className="size-4 shrink-0" />
    </PopoverTrigger>
    <PopoverContent
      align="start"
      className="max-h-72 max-w-[calc(100vw-2rem)] overflow-y-auto sm:w-72"
    >
      <p className="font-medium">{filter.label}</p>
      {filter.options.length > 0 ? (
        <div className="flex flex-col gap-2">
          {filter.options.map((option) => (
            <label
              key={option.value}
              className="flex cursor-pointer items-center gap-2 text-sm"
            >
              <Checkbox
                checked={selectedValues.includes(option.value)}
                onCheckedChange={(isChecked) =>
                  onChange(
                    isChecked
                      ? [...selectedValues, option.value]
                      : selectedValues.filter((value) => value !== option.value),
                  )
                }
              />
              {option.label}
            </label>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">No options available.</p>
      )}
    </PopoverContent>
  </Popover>
)

interface RangeSelectFilterProps<TData extends RowData> {
  filter: DataTableFilter<TData>
  range: DataTableFilterRange
  onApply: (range: DataTableFilterRange | undefined) => void
}

const RangeSelectFilter = <TData extends RowData>({
  filter,
  range,
  onApply,
}: RangeSelectFilterProps<TData>) => (
  <Popover>
    <PopoverTrigger
      render={
        <Button type="button" variant="outline" className="w-full justify-between" />
      }
    >
      <span className="truncate">
        {filter.label}
        {range.min || range.max ? " (active)" : ""}
      </span>
      <ChevronDown aria-hidden="true" className="size-4 shrink-0" />
    </PopoverTrigger>
    <PopoverContent align="start" className="max-w-[calc(100vw-2rem)] sm:w-80">
      <p className="font-medium">{filter.label}</p>
      <DataTableRangeFilter
        key={`${filter.id}-${range.min ?? ""}-${range.max ?? ""}`}
        label={filter.label}
        value={range}
        onApply={onApply}
      />
    </PopoverContent>
  </Popover>
)

export default DataTableFilters
