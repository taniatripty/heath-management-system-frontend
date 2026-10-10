"use client"

import { useCallback, useState } from "react"
import { getDoctors } from "@/services/doctor.services"
import { useQuery } from "@tanstack/react-query"
import type { IDoctor } from "@/types/doctor.types"
import type { PaginationState } from "@tanstack/react-table"
import DataTable from "@/components/shared/table/DataTable"
import { doctorColumns } from "./doctorsColumn"

const DoctorTable = ({ initialQueryString }: { initialQueryString: string }) => {
  const [queryString, setQueryString] = useState(initialQueryString)
  const doctorsQuery = useQuery({
    queryKey: ["doctors", queryString],
    queryFn: () => getDoctors(queryString),
  })

  const handlePaginationChange = useCallback(({ pageIndex, pageSize }: PaginationState) => {
    setQueryString((currentQueryString) => {
      const params = new URLSearchParams(currentQueryString)
      params.set("page", String(pageIndex + 1))
      params.set("limit", String(pageSize))
      return params.toString()
    })
  }, [])

  const handleSearchChange = useCallback((searchTerm: string) => {
    const normalizedSearchTerm = searchTerm.trim()

    setQueryString((currentQueryString) => {
      const params = new URLSearchParams(currentQueryString)
      const currentSearchTerm = params.get("searchTerm") ?? ""

      if (currentSearchTerm === normalizedSearchTerm && params.get("page") === "1") {
        return currentQueryString
      }

      if (normalizedSearchTerm) {
        params.set("searchTerm", normalizedSearchTerm)
      } else {
        params.delete("searchTerm")
      }

      params.set("page", "1")
      return params.toString()
    })
  }, [])

  const handleView = (doctor: IDoctor) => {
    console.log("View doctor", doctor)
  }

  const handleEdit = (doctor: IDoctor) => {
    console.log("Edit doctor", doctor)
  }

  const handleDelete = (doctor: IDoctor) => {
    console.log("Delete doctor", doctor)
  }

  return (
    <DataTable
      data={doctorsQuery.data?.data ?? []}
      columns={doctorColumns}
      isLoading={doctorsQuery.isFetching}
      pagination={doctorsQuery.data?.meta}
      onPaginationChange={handlePaginationChange}
      searchTerm={new URLSearchParams(queryString).get("searchTerm") ?? ""}
      onSearchChange={handleSearchChange}
      emptyMessage={
        doctorsQuery.isError
          ? "Unable to load doctors. Please try again."
          : "No doctors found."
      }
      actions={{
        onView: handleView,
        onEdit: handleEdit,
        onDelete: handleDelete,
      }}
    />
  )
}

export default DoctorTable
