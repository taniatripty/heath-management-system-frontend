"use client"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { getDoctors } from "@/services/doctor.services"
import { useQuery } from "@tanstack/react-query"
import {
  createColumnHelper,
  tableFeatures,
  useTable,
} from "@tanstack/react-table"
import type { IDoctor } from "@/types/doctor.types"

const doctorFeatures = tableFeatures({})
const doctorColumnHelper = createColumnHelper<typeof doctorFeatures, IDoctor>()
const doctorColumns = doctorColumnHelper.columns([
  doctorColumnHelper.accessor("name", { header: "Name" }),
  doctorColumnHelper.accessor("experience", { header: "Experience" }),
])
const emptyDoctors: IDoctor[] = []

const DoctorTable = () => {
  const doctorsQuery = useQuery({
    queryKey: ["doctors"],
    queryFn: getDoctors,
  })

  const table = useTable({
    features: doctorFeatures,
    data: doctorsQuery.data?.data ?? emptyDoctors,
    columns: doctorColumns,
  })

  const rows = table.getRowModel().rows

  return (
    <Table>
      <TableHeader>
        {table.getHeaderGroups().map((headerGroup) => (
          <TableRow key={headerGroup.id}>
            {headerGroup.headers.map((header) => (
              <TableHead key={header.id}>
                {header.isPlaceholder ? null : (
                  <table.FlexRender header={header} />
                )}
              </TableHead>
            ))}
          </TableRow>
        ))}
      </TableHeader>
      <TableBody>
        {doctorsQuery.isPending ? (
          <TableRow>
            <TableCell colSpan={doctorColumns.length} className="text-center">
              Loading doctors...
            </TableCell>
          </TableRow>
        ) : doctorsQuery.isError ? (
          <TableRow>
            <TableCell
              colSpan={doctorColumns.length}
              className="text-center text-destructive"
            >
              {doctorsQuery.error instanceof Error
                ? doctorsQuery.error.message
                : "Unable to load doctors."}
            </TableCell>
          </TableRow>
        ) : rows.length === 0 ? (
          <TableRow>
            <TableCell colSpan={doctorColumns.length} className="text-center">
              No doctors found.
            </TableCell>
          </TableRow>
        ) : (
          rows.map((row) => (
            <TableRow key={row.id}>
              {row.getAllCells().map((cell) => (
                <TableCell key={cell.id}>
                  <table.FlexRender cell={cell} />
                </TableCell>
              ))}
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  )
}

export default DoctorTable
