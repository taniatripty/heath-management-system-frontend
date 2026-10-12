"use client"

import { useCallback, useMemo, useState } from "react"
import type { PaginationState } from "@tanstack/react-table"
import type {
  DataTableFilterState,
} from "@/components/shared/table/data-table.types"

interface SingleQueryFilter {
  id: string
  type: "single"
  queryKey: string
}

interface MultiQueryFilter {
  id: string
  type: "multi"
  queryKey: string
}

interface RangeQueryFilter {
  id: string
  type: "range"
  minQueryKey: string
  maxQueryKey: string
}

export type DataTableQueryFilter =
  | SingleQueryFilter
  | MultiQueryFilter
  | RangeQueryFilter

interface DataTableQueryParamNames {
  page: string
  pageSize: string
  search: string
}

const DEFAULT_QUERY_PARAM_NAMES: DataTableQueryParamNames = {
  page: "page",
  pageSize: "limit",
  search: "searchTerm",
}

const getFilterQueryKeys = (filter: DataTableQueryFilter) =>
  filter.type === "range"
    ? [filter.minQueryKey, filter.maxQueryKey]
    : [filter.queryKey]

export const useDataTableQueryState = (
  initialQueryString: string,
  queryFilters: readonly DataTableQueryFilter[],
  queryParamNames: DataTableQueryParamNames = DEFAULT_QUERY_PARAM_NAMES,
) => {
  const [queryString, setQueryString] = useState(initialQueryString)

  const searchTerm = useMemo(
    () => new URLSearchParams(queryString).get(queryParamNames.search) ?? "",
    [queryParamNames.search, queryString],
  )

  const filterState = useMemo<DataTableFilterState>(() => {
    const params = new URLSearchParams(queryString)
    const state: DataTableFilterState = {}

    for (const filter of queryFilters) {
      if (filter.type === "single") {
        const value = params.get(filter.queryKey)
        if (value) {
          state[filter.id] = value
        }
        continue
      }

      if (filter.type === "multi") {
        const values = params.getAll(filter.queryKey)
        if (values.length) {
          state[filter.id] = values
        }
        continue
      }

      const minimum = params.get(filter.minQueryKey)
      const maximum = params.get(filter.maxQueryKey)
      if (minimum || maximum) {
        state[filter.id] = {
          ...(minimum ? { min: minimum } : {}),
          ...(maximum ? { max: maximum } : {}),
        }
      }
    }

    return state
  }, [queryFilters, queryString])

  const onPaginationChange = useCallback(
    ({ pageIndex, pageSize }: PaginationState) => {
      setQueryString((currentQueryString) => {
        const params = new URLSearchParams(currentQueryString)
        params.set(queryParamNames.page, String(pageIndex + 1))
        params.set(queryParamNames.pageSize, String(pageSize))
        return params.toString()
      })
    },
    [queryParamNames.page, queryParamNames.pageSize],
  )

  const onSearchChange = useCallback(
    (value: string) => {
      const normalizedValue = value.trim()

      setQueryString((currentQueryString) => {
        const params = new URLSearchParams(currentQueryString)
        const currentSearchTerm = params.get(queryParamNames.search) ?? ""

        if (
          currentSearchTerm === normalizedValue &&
          params.get(queryParamNames.page) === "1"
        ) {
          return currentQueryString
        }

        if (normalizedValue) {
          params.set(queryParamNames.search, normalizedValue)
        } else {
          params.delete(queryParamNames.search)
        }

        params.set(queryParamNames.page, "1")
        return params.toString()
      })
    },
    [queryParamNames.page, queryParamNames.search],
  )

  const onFilterChange = useCallback(
    (filters: DataTableFilterState) => {
      setQueryString((currentQueryString) => {
        const params = new URLSearchParams(currentQueryString)
        for (const filter of queryFilters) {
          for (const key of getFilterQueryKeys(filter)) {
            params.delete(key)
          }
        }

        for (const filter of queryFilters) {
          const value = filters[filter.id]
          if (filter.type === "single") {
            if (typeof value === "string" && value) {
              params.set(filter.queryKey, value)
            }
            continue
          }

          if (filter.type === "multi") {
            if (Array.isArray(value)) {
              for (const item of value) {
                params.append(filter.queryKey, item)
              }
            }
            continue
          }

          if (value && !Array.isArray(value) && typeof value === "object") {
            if (value.min) {
              params.set(filter.minQueryKey, value.min)
            }
            if (value.max) {
              params.set(filter.maxQueryKey, value.max)
            }
          }
        }

        params.set(queryParamNames.page, "1")
        return params.toString()
      })
    },
    [queryFilters, queryParamNames.page],
  )

  return {
    queryString,
    searchTerm,
    filterState,
    onPaginationChange,
    onSearchChange,
    onFilterChange,
  }
}
