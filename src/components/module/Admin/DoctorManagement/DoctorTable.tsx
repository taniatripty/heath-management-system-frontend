"use client"

import { useCallback, useMemo, useState } from "react"
import { deleteDoctor, getDoctors } from "@/services/doctor.services"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import type { IDoctor } from "@/types/doctor.types"
import type { PaginationState } from "@tanstack/react-table"
import DataTable, {
  type DataTableFilter,
  type DataTableFilterRange,
  type DataTableFilterState,
} from "@/components/shared/table/DataTable"
import { doctorColumns } from "./doctorsColumn"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { toast } from "sonner"
import CreateDoctorDialog from "./CreateDoctorDialog"
import UpdateDoctorDialog from "./UpdateDoctorDialog"
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

const DoctorTable = ({ initialQueryString }: { initialQueryString: string }) => {
  const queryClient = useQueryClient()
  const [queryString, setQueryString] = useState(initialQueryString)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [selectedDoctor, setSelectedDoctor] = useState<IDoctor | null>(null)
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

  const filterState = useMemo<DataTableFilterState>(() => {
    const params = new URLSearchParams(queryString)
    const gender = params.get("gender")
    const specialties = params.getAll("specialties.speciatily.title")
    const minimumFee = params.get("appointmentFee[gte]")
    const maximumFee = params.get("appointmentFee[lte]")
    const appointmentFee: DataTableFilterRange = {
      ...(minimumFee ? { min: minimumFee } : {}),
      ...(maximumFee ? { max: maximumFee } : {}),
    }

    return {
      ...(gender ? { gender } : {}),
      ...(specialties.length ? { specialties } : {}),
      ...(minimumFee || maximumFee ? { appointmentFee } : {}),
    }
  }, [queryString])

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

  const handleFilterChange = useCallback((filters: DataTableFilterState) => {
    setQueryString((currentQueryString) => {
      const params = new URLSearchParams(currentQueryString)
      params.delete("gender")
      params.delete("specialties.speciatily.title")
      params.delete("appointmentFee[gte]")
      params.delete("appointmentFee[lte]")

      const gender = filters.gender
      if (typeof gender === "string") {
        params.set("gender", gender)
      }

      const specialties = filters.specialties
      if (Array.isArray(specialties)) {
        for (const specialty of specialties) {
          params.append("specialties.speciatily.title", specialty)
        }
      }

      const appointmentFee = filters.appointmentFee
      if (appointmentFee && !Array.isArray(appointmentFee) && typeof appointmentFee === "object") {
        if (appointmentFee.min) {
          params.set("appointmentFee[gte]", appointmentFee.min)
        }
        if (appointmentFee.max) {
          params.set("appointmentFee[lte]", appointmentFee.max)
        }
      }

      params.set("page", "1")
      return params.toString()
    })
  }, [])

  const handleView = (doctor: IDoctor) => {
    console.log("View doctor", doctor)
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
        onPaginationChange={handlePaginationChange}
        searchTerm={new URLSearchParams(queryString).get("searchTerm") ?? ""}
        onSearchChange={handleSearchChange}
        filters={doctorFilters}
        filtering={{
          state: filterState,
          onFilterChange: handleFilterChange,
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
