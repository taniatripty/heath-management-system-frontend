"use client"

import { getDoctors } from "@/services/doctor.services"
import { useQuery } from "@tanstack/react-query"
import type { IDoctor } from "@/types/doctor.types"
import DataTable from "@/components/shared/table/DataTable"
import { doctorColumns } from "./doctorsColumn"

const DoctorTable = ({ initialQueryString }: { initialQueryString: string }) => {
  const doctorsQuery = useQuery({
    queryKey: ["doctors", initialQueryString],
    queryFn: () => getDoctors(initialQueryString),
  })

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
      isLoading={doctorsQuery.isPending}
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
