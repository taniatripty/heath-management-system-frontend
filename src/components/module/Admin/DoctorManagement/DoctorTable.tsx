"use client"

import { getDoctors } from "@/services/doctor.services"
import { useQuery } from "@tanstack/react-query"
import { createColumnHelper, tableFeatures } from "@tanstack/react-table"
import type { IDoctor } from "@/types/doctor.types"
import DataTable from "@/components/shared/table/DataTable"

const doctorFeatures = tableFeatures({})
const doctorColumnHelper = createColumnHelper<typeof doctorFeatures, IDoctor>()

const doctorColumns = doctorColumnHelper.columns([
  doctorColumnHelper.accessor("name", { header: "Name" }),
  doctorColumnHelper.accessor("email", { header: "Email" }),
  doctorColumnHelper.accessor("experience", { header: "Experience" }),
  doctorColumnHelper.accessor("qualification", { header: "Qualification" }),
])

const DoctorTable = () => {
  const doctorsQuery = useQuery({
    queryKey: ["doctors"],
    queryFn: getDoctors,
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
      emptyMessage="No doctors found."
      actions={{
        onView: handleView,
        onEdit: handleEdit,
        onDelete: handleDelete,
      }}
    />
  )
}

export default DoctorTable
