"use client"

import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Dialog } from "@base-ui/react/dialog"
import { format } from "date-fns"
import { Plus, X } from "lucide-react"
import { toast } from "sonner"
import DataTable from "@/components/shared/table/DataTable"
import {
  useDataTableQueryState,
} from "@/components/shared/table/useDataTableQueryState"
import { Button } from "@/components/ui/button"
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
import {
  deleteSchedule,
  getSchedules,
} from "@/services/schedule.services"
import type { ISchedule } from "@/types/schedule.types"
import { scheduleColumns } from "./scheduleColumns"
import ScheduleFormDialog from "./ScheduleFormDialog"

const ScheduleTable = ({
  initialQueryString,
}: {
  initialQueryString: string
}) => {
  const queryClient = useQueryClient()
  const {
    queryString,
    searchTerm,
    onPaginationChange,
    onSearchChange,
  } = useDataTableQueryState(initialQueryString, [])
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [scheduleToEdit, setScheduleToEdit] = useState<ISchedule | null>(null)
  const [scheduleToView, setScheduleToView] = useState<ISchedule | null>(null)
  const [scheduleToDelete, setScheduleToDelete] = useState<ISchedule | null>(null)
  const schedulesQuery = useQuery({
    queryKey: ["schedules", queryString],
    queryFn: () => getSchedules(queryString),
  })
  const deleteScheduleMutation = useMutation({
    mutationFn: deleteSchedule,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["schedules"] })
      setScheduleToDelete(null)
      toast.success("Schedule deleted successfully.")
    },
    onError: (error) => {
      const message =
        error instanceof Error ? error.message : "Unable to delete schedule."
      toast.error(message)
    },
  })

  const handleView = (schedule: ISchedule) => setScheduleToView(schedule)
  const handleEdit = (schedule: ISchedule) => setScheduleToEdit(schedule)
  const handleDelete = (schedule: ISchedule) => setScheduleToDelete(schedule)
  const formatScheduleDate = (value: string | Date) => {
    const date = new Date(value)
    return Number.isNaN(date.getTime()) ? String(value) : format(date, "PPpp")
  }

  return (
    <>
      <DataTable
        data={schedulesQuery.data?.data ?? []}
        columns={scheduleColumns}
        toolbarAction={
          <Button
            type="button"
            className="w-full"
            onClick={() => setIsCreateDialogOpen(true)}
          >
            <Plus aria-hidden="true" />
            Create schedules
          </Button>
        }
        isLoading={schedulesQuery.isFetching}
        pagination={schedulesQuery.data?.meta}
        onPaginationChange={onPaginationChange}
        searchTerm={searchTerm}
        onSearchChange={onSearchChange}
        emptyMessage={
          schedulesQuery.isError
            ? "Unable to load schedules. Please try again."
            : "No schedules found."
        }
        actions={{
          onView: handleView,
          onEdit: handleEdit,
          onDelete: handleDelete,
        }}
      />

      <ScheduleFormDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
      />
      <ScheduleFormDialog
        key={scheduleToEdit?.id ?? "edit-schedule"}
        open={Boolean(scheduleToEdit)}
        schedule={scheduleToEdit}
        onOpenChange={(open) => {
          if (!open) {
            setScheduleToEdit(null)
          }
        }}
      />

      <Dialog.Root
        open={Boolean(scheduleToView)}
        onOpenChange={(open) => {
          if (!open) {
            setScheduleToView(null)
          }
        }}
      >
        <Dialog.Portal>
          <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/50 backdrop-blur-[2px]" />
          <Dialog.Popup className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl border bg-background shadow-xl">
            <div className="flex items-start justify-between border-b px-6 py-4">
              <div>
                <Dialog.Title className="text-lg font-semibold">
                  Schedule details
                </Dialog.Title>
                <Dialog.Description className="mt-1 text-sm text-muted-foreground">
                  View the selected schedule time.
                </Dialog.Description>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Close schedule details"
                onClick={() => setScheduleToView(null)}
              >
                <X aria-hidden="true" />
              </Button>
            </div>
            {scheduleToView && (
              <dl className="grid gap-4 px-6 py-5">
                <div>
                  <dt className="text-sm text-muted-foreground">Starts</dt>
                  <dd className="font-medium">
                    {formatScheduleDate(scheduleToView.startDateTime)}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground">Ends</dt>
                  <dd className="font-medium">
                    {formatScheduleDate(scheduleToView.endDateTime)}
                  </dd>
                </div>
              </dl>
            )}
          </Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>

      <AlertDialog
        open={Boolean(scheduleToDelete)}
        onOpenChange={(open) => {
          if (!open && !deleteScheduleMutation.isPending) {
            setScheduleToDelete(null)
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete schedule?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently deletes the selected schedule and cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteScheduleMutation.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteScheduleMutation.isPending}
              onClick={() => {
                if (scheduleToDelete) {
                  deleteScheduleMutation.mutate(scheduleToDelete.id)
                }
              }}
            >
              {deleteScheduleMutation.isPending ? "Deleting..." : "Delete schedule"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

export default ScheduleTable