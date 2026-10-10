"use client"

import { useState } from "react"
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

  const handlePaginationChange = ({ pageIndex, pageSize }: PaginationState) => {
    const params = new URLSearchParams(queryString)
    params.set("page", String(pageIndex + 1))
    params.set("limit", String(pageSize))
    setQueryString(params.toString())
  }

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
