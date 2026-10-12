"use client"

import { useMemo, useState } from "react"
import { deleteDoctor, getDoctors } from "@/services/doctor.services"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import type { IDoctor } from "@/types/doctor.types"
import DataTable from "@/components/shared/table/DataTable"
import type { DataTableFilter } from "@/components/shared/table/data-table.types"
import {
  useDataTableQueryState,
  type DataTableQueryFilter,
} from "@/components/shared/table/useDataTableQueryState"
import { doctorColumns } from "./doctorsColumn"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { toast } from "sonner"
import CreateDoctorDialog from "./CreateDoctorDialog"
import UpdateDoctorDialog from "./UpdateDoctorDialog"
import DoctorDetailsDialog from "./DoctorDetailsDialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

const doctorQueryFilters: DataTableQueryFilter[] = [
  { id: "gender", type: "single", queryKey: "gender" },
  {
    id: "specialties",
    type: "multi",
    queryKey: "specialties.speciatily.title",
  },
  {
    id: "appointmentFee",
    type: "range",
    minQueryKey: "appointmentFee[gte]",
    maxQueryKey: "appointmentFee[lte]",
  },
]

const DoctorTable = ({ initialQueryString }: { initialQueryString: string }) => {
  const queryClient = useQueryClient()
  const {
    queryString,
    searchTerm,
    filterState,
    onPaginationChange,
    onSearchChange,
    onFilterChange,
  } = useDataTableQueryState(initialQueryString, doctorQueryFilters)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [selectedDoctor, setSelectedDoctor] = useState<IDoctor | null>(null)
  const [doctorToView, setDoctorToView] = useState<IDoctor | null>(null)
  const [doctorToDelete, setDoctorToDelete] = useState<IDoctor | null>(null)
  const doctorsQuery = useQuery({
    queryKey: ["doctors", queryString],
    queryFn: () => getDoctors(queryString),
  })
  const deleteDoctorMutation = useMutation({
    mutationFn: deleteDoctor,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["doctors"] })
      setDoctorToDelete(null)
      toast.success("Doctor deleted successfully.")
    },
    onError: (error) => {
      const message =
        error instanceof Error ? error.message : "Unable to delete doctor."
      toast.error(message)
    },
  })
  const doctorFilters = useMemo<DataTableFilter<IDoctor>[]>(() => {
    const specialties = new Map<string, string>()
    for (const doctor of doctorsQuery.data?.data ?? []) {
      for (const { speciatily } of doctor.specialties ?? []) {
        if (speciatily?.title) {
          specialties.set(speciatily.title, speciatily.title)
        }
      }
    }

    return [
      {
        id: "gender",
        label: "Gender",
        type: "single",
        options: [
          { label: "Male", value: "MALE" },
          { label: "Female", value: "FEMALE" },
          { label: "Other", value: "OTHER" },
        ],
        getValue: (doctor) => doctor.gender,
      },
      {
        id: "specialties",
        label: "Specialties",
        type: "multi",
        options: Array.from(specialties.values()).sort().map((title) => ({
          label: title,
          value: title,
        })),
        getValue: (doctor) =>
          doctor.specialties?.flatMap(({ speciatily }) =>
            speciatily?.title ? [speciatily.title] : [],
          ) ?? [],
      },
      {
        id: "appointmentFee",
        label: "Appointment fee",
        type: "range",
        options: [],
        getValue: (doctor) => doctor.appointmentFee,
      },
    ]
  }, [doctorsQuery.data?.data])

  const handleView = (doctor: IDoctor) => {
    setDoctorToView(doctor)
  }

  const handleEdit = (doctor: IDoctor) => {
    setSelectedDoctor(doctor)
  }

  const handleDelete = (doctor: IDoctor) => {
    setDoctorToDelete(doctor)
  }

  return (
    <>
      <DataTable
        data={doctorsQuery.data?.data ?? []}
        columns={doctorColumns}
        toolbarAction={
          <Button
            type="button"
            className="w-full"
            onClick={() => setIsCreateDialogOpen(true)}
          >
            <Plus aria-hidden="true" />
            Create doctor
          </Button>
        }
        isLoading={doctorsQuery.isFetching}
        pagination={doctorsQuery.data?.meta}
        onPaginationChange={onPaginationChange}
        searchTerm={searchTerm}
        onSearchChange={onSearchChange}
        filters={doctorFilters}
        filtering={{
          state: filterState,
          onFilterChange,
        }}
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
      <CreateDoctorDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
      />
      {selectedDoctor && (
        <UpdateDoctorDialog
          key={selectedDoctor.id}
          doctor={selectedDoctor}
          open={Boolean(selectedDoctor)}
          onOpenChange={(open) => {
            if (!open) {
              setSelectedDoctor(null)
            }
          }}
        />
      )}
      <DoctorDetailsDialog
        doctorId={doctorToView?.id ?? null}
        open={Boolean(doctorToView)}
        onOpenChange={(open) => {
          if (!open) {
            setDoctorToView(null)
          }
        }}
      />
      <AlertDialog
        open={Boolean(doctorToDelete)}
        onOpenChange={(open) => {
          if (!open && !deleteDoctorMutation.isPending) {
            setDoctorToDelete(null)
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete doctor?</AlertDialogTitle>
            <AlertDialogDescription>
              This will deactivate {doctorToDelete?.name ?? "this doctor"} and
              revoke their active sessions. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteDoctorMutation.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteDoctorMutation.isPending}
              onClick={() => {
                if (doctorToDelete) {
                  deleteDoctorMutation.mutate(doctorToDelete.id)
                }
              }}
            >
              {deleteDoctorMutation.isPending ? "Deleting..." : "Delete doctor"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

export default DoctorTable
