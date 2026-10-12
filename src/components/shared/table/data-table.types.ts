import type { RowData } from "@tanstack/react-table"

export interface DataTableFilterOption {
  label: string
  value: string
}

export interface DataTableFilter<TData extends RowData> {
  id: string
  label: string
  type: "single" | "multi" | "range"
  options: DataTableFilterOption[]
  getValue: (row: TData) => string | number | readonly string[] | null | undefined
}

export interface DataTableFilterRange {
  min?: string
  max?: string
}

export type DataTableFilterValue = string | string[] | DataTableFilterRange
export type DataTableFilterState = Record<string, DataTableFilterValue>
