"use client"

import { useMemo, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import type { ColumnDef, TableFeatures } from "@tanstack/react-table"
import { format } from "date-fns"
import { CalendarPlus, X } from "lucide-react"
import { Dialog } from "@base-ui/react/dialog"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import DataTable from "@/components/shared/table/DataTable"
import DateCell from "@/components/shared/cell/DateCell"
import {
  bookDoctorSchedules,
  deleteMyDoctorSchedule,
  getMyDoctorSchedules,
  getSchedulesToBook,
  updateMyDoctorSchedules,
} from "@/services/doctorSchedule.services"
import type { IDoctorSchedule, ISchedule } from "@/types/schedule.types"
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

type ScheduleView = "all" | "booked" | "available"
type DoctorScheduleWithSlot = IDoctorSchedule & { schedule: ISchedule }

const hasSchedule = (
  doctorSchedule: IDoctorSchedule,
): doctorSchedule is DoctorScheduleWithSlot => doctorSchedule.schedule !== null

const isFutureSchedule = (startDateTime: string | Date, now: Date) => {
  const start = new Date(startDateTime)

  return !Number.isNaN(start.getTime()) && start >= now
}

const columns: ColumnDef<TableFeatures, DoctorScheduleWithSlot>[] = [
  {
    id: "startDateTime",
    accessorFn: (doctorSchedule) => doctorSchedule.schedule?.startDateTime,
    header: "Starts",
    cell: ({ row }) => (
      <DateCell
        date={row.original.schedule.startDateTime}
        formatString="MMM dd, yyyy · h:mm a"
      />
    ),
  },
  {
    id: "endDateTime",
    accessorFn: (doctorSchedule) => doctorSchedule.schedule?.endDateTime,
    header: "Ends",
    cell: ({ row }) => (
      <DateCell
        date={row.original.schedule.endDateTime}
        formatString="MMM dd, yyyy · h:mm a"
      />
    ),
  },
  {
    id: "isBooked",
    accessorKey: "isBooked",
    header: "isBooked",
    cell: ({ row }) => (
      <Badge variant={row.original.isBooked ? "default" : "secondary"}>
        {String(row.original.isBooked)}
      </Badge>
    ),
  },
]

const DoctorScheduleTable = () => {
  const queryClient = useQueryClient()
  const [view, setView] = useState<ScheduleView>("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [isBookDialogOpen, setIsBookDialogOpen] = useState(false)
  const [selectedScheduleIds, setSelectedScheduleIds] = useState<string[]>([])
  const [scheduleToView, setScheduleToView] =
    useState<DoctorScheduleWithSlot | null>(null)
  const [scheduleToEdit, setScheduleToEdit] =
    useState<DoctorScheduleWithSlot | null>(null)
  const [replacementScheduleId, setReplacementScheduleId] = useState("")
  const [scheduleToDelete, setScheduleToDelete] =
    useState<DoctorScheduleWithSlot | null>(null)
  const schedulesQuery = useQuery({
    queryKey: ["my-doctor-schedules"],
    queryFn: getMyDoctorSchedules,
  })
  const bookableSchedulesQuery = useQuery({
    queryKey: ["schedules-to-book"],
    queryFn: getSchedulesToBook,
    enabled: isBookDialogOpen || Boolean(scheduleToEdit),
  })
  const bookSchedulesMutation = useMutation({
    mutationFn: bookDoctorSchedules,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["my-doctor-schedules"] }),
        queryClient.invalidateQueries({ queryKey: ["schedules-to-book"] }),
      ])
      setSelectedScheduleIds([])
      setIsBookDialogOpen(false)
      toast.success("Schedules booked successfully.")
    },
    onError: (error) => {
      toast.error(
        error instanceof Error
          ? error.message
          : "Unable to book the selected schedules.",
      )
    },
  })
  const updateScheduleMutation = useMutation({
    mutationFn: updateMyDoctorSchedules,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["my-doctor-schedules"] }),
        queryClient.invalidateQueries({ queryKey: ["schedules-to-book"] }),
      ])
      setScheduleToEdit(null)
      setReplacementScheduleId("")
      toast.success("Your schedule was updated.")
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Unable to update your schedule.",
      )
    },
  })
  const deleteScheduleMutation = useMutation({
    mutationFn: deleteMyDoctorSchedule,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["my-doctor-schedules"] }),
        queryClient.invalidateQueries({ queryKey: ["schedules-to-book"] }),
      ])
      setScheduleToDelete(null)
      toast.success("Your schedule was removed.")
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Unable to remove your schedule.",
      )
    },
  })

  const schedules = useMemo(() => {
    return (schedulesQuery.data ?? [])
      .filter(hasSchedule)
      .sort(
        (first, second) =>
          new Date(first.schedule.startDateTime).getTime() -
          new Date(second.schedule.startDateTime).getTime(),
      )
  }, [schedulesQuery.data])

  const bookableSchedules = useMemo(() => {
    const now = new Date()
    const myScheduleIds = new Set(
      (schedulesQuery.data ?? []).map(({ scheduleId }) => scheduleId),
    )

    return (bookableSchedulesQuery.data ?? [])
      .filter((schedule) => {
        const hasAppointment = (schedule.appointment?.length ?? 0) > 0
        const isAvailable = schedule.isBooked !== true && !hasAppointment

        return (
          isFutureSchedule(schedule.startDateTime, now) &&
          isAvailable &&
          !myScheduleIds.has(schedule.id)
        )
      })
      .sort(
        (first, second) =>
          new Date(first.startDateTime).getTime() -
          new Date(second.startDateTime).getTime(),
      )
  }, [bookableSchedulesQuery.data, schedulesQuery.data])

  const visibleSchedules = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase()

    return schedules.filter((doctorSchedule) => {
      const matchesView =
        view === "all" ||
        (view === "booked" && doctorSchedule.isBooked) ||
        (view === "available" && !doctorSchedule.isBooked)
      const startsAt = new Date(doctorSchedule.schedule.startDateTime)
      const endsAt = new Date(doctorSchedule.schedule.endDateTime)
      const matchesSearch =
        !normalizedSearch ||
        format(startsAt, "PPpp").toLowerCase().includes(normalizedSearch) ||
        format(endsAt, "PPpp").toLowerCase().includes(normalizedSearch) ||
        (doctorSchedule.isBooked ? "booked" : "available").includes(
          normalizedSearch,
        )

      return matchesView && matchesSearch
    })
  }, [schedules, searchTerm, view])

  const toolbarAction = (
    <div
      className="flex flex-nowrap items-center gap-1"
      role="group"
      aria-label="Filter schedules"
    >
      {(
        [
          ["all", "All", schedules.length],
          [
            "booked",
            "Booked",
            schedules.filter((item) => item.isBooked).length,
          ],
          [
            "available",
            "Available",
            schedules.filter((item) => !item.isBooked).length,
          ],
        ] as const
      ).map(([scheduleView, label, count]) => (
        <Button
          key={scheduleView}
          type="button"
          size="xs"
          className="shrink-0 px-1.5"
          variant={view === scheduleView ? "default" : "outline"}
          aria-pressed={view === scheduleView}
          aria-label={`${label}: ${count} schedules`}
          title={`${label} (${count})`}
          onClick={() => setView(scheduleView)}
        >
          {label} <span className="tabular-nums">{count}</span>
        </Button>
      ))}
    </div>
  )

  const toggleScheduleSelection = (scheduleId: string, checked: boolean) => {
    setSelectedScheduleIds((current) =>
      checked
        ? current.includes(scheduleId)
          ? current
          : [...current, scheduleId]
        : current.filter((id) => id !== scheduleId),
    )
  }

  const handleBookSelected = () => {
    const now = new Date()
    const myScheduleIds = new Set(
      (schedulesQuery.data ?? []).map(({ scheduleId }) => scheduleId),
    )
    const eligibleScheduleIds = new Set(
      (bookableSchedulesQuery.data ?? [])
        .filter(
          (schedule) =>
            isFutureSchedule(schedule.startDateTime, now) &&
            schedule.isBooked !== true &&
            (schedule.appointment?.length ?? 0) === 0 &&
            !myScheduleIds.has(schedule.id),
        )
        .map(({ id }) => id),
    )
    const stillEligibleIds = selectedScheduleIds.filter((id) =>
      eligibleScheduleIds.has(id),
    )

    if (stillEligibleIds.length !== selectedScheduleIds.length) {
      setSelectedScheduleIds(stillEligibleIds)
      toast.error(
        "One or more selected schedules have passed or are no longer available.",
      )
      return
    }

    bookSchedulesMutation.mutate(stillEligibleIds)
  }

  const handleEditSchedule = () => {
    if (!scheduleToEdit || !replacementScheduleId) {
      return
    }
    if (scheduleToEdit.isBooked) {
      toast.error("A schedule with an appointment cannot be changed.")
      return
    }

    const replacementIsAvailable = bookableSchedules.some(
      ({ id }) => id === replacementScheduleId,
    )
    if (!replacementIsAvailable) {
      toast.error("The replacement schedule is no longer available.")
      return
    }

    updateScheduleMutation.mutate([
      { id: scheduleToEdit.scheduleId, shouldDelete: true },
      { id: replacementScheduleId, shouldDelete: false },
    ])
  }

  return (
    <>
      <div className="mb-4 flex justify-end">
        <Button type="button" onClick={() => setIsBookDialogOpen(true)}>
          <CalendarPlus aria-hidden="true" />
          Book schedule
        </Button>
      </div>
      <DataTable
        data={visibleSchedules}
        columns={columns}
        toolbarAction={toolbarAction}
        isLoading={schedulesQuery.isFetching}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        actions={{
          onView: setScheduleToView,
          onEdit: (schedule) => {
            if (schedule.isBooked) {
              toast.error("A schedule with an appointment cannot be changed.")
              return
            }
            setReplacementScheduleId("")
            setScheduleToEdit(schedule)
          },
          onDelete: (schedule) => {
            if (schedule.isBooked) {
              toast.error("A schedule with an appointment cannot be removed.")
              return
            }
            setScheduleToDelete(schedule)
          },
        }}
        emptyMessage={
          schedulesQuery.isError
            ? "Unable to load your schedules. Please try again."
            : view === "booked"
              ? "You have no booked schedules."
              : view === "available"
                ? "You have no available schedules."
                : "You have no schedules."
        }
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
                  Details for your assigned schedule.
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
                    {format(new Date(scheduleToView.schedule.startDateTime), "PPpp")}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground">Ends</dt>
                  <dd className="font-medium">
                    {format(new Date(scheduleToView.schedule.endDateTime), "PPpp")}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground">Status</dt>
                  <dd className="font-medium">
                    {scheduleToView.isBooked ? "Booked" : "Available"}
                  </dd>
                </div>
              </dl>
            )}
          </Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>

      <Dialog.Root
        open={Boolean(scheduleToEdit)}
        onOpenChange={(open) => {
          if (!open && !updateScheduleMutation.isPending) {
            setScheduleToEdit(null)
            setReplacementScheduleId("")
          }
        }}
      >
        <Dialog.Portal>
          <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/50 backdrop-blur-[2px]" />
          <Dialog.Popup className="fixed left-1/2 top-1/2 z-50 flex max-h-[85vh] w-[calc(100%-2rem)] max-w-2xl -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-xl border bg-background shadow-xl">
            <div className="border-b px-6 py-4">
              <Dialog.Title className="text-lg font-semibold">
                Replace assigned schedule
              </Dialog.Title>
              <Dialog.Description className="mt-1 text-sm text-muted-foreground">
                Choose an upcoming available slot to replace this schedule.
              </Dialog.Description>
            </div>
            <div className="min-h-0 overflow-y-auto px-6 py-4">
              {bookableSchedulesQuery.isPending ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  Loading available schedules...
                </p>
              ) : bookableSchedulesQuery.isError ? (
                <p className="py-8 text-center text-sm text-destructive" role="alert">
                  Unable to load available schedules. Please try again.
                </p>
              ) : bookableSchedules.length ? (
                <ul className="divide-y rounded-lg border">
                  {bookableSchedules.map((schedule) => (
                    <li key={schedule.id} className="flex items-center gap-3 px-4 py-3">
                      <input
                        type="radio"
                        name="replacementSchedule"
                        value={schedule.id}
                        checked={replacementScheduleId === schedule.id}
                        disabled={updateScheduleMutation.isPending}
                        aria-label={`Replace with schedule starting ${format(new Date(schedule.startDateTime), "PPpp")}`}
                        onChange={() => setReplacementScheduleId(schedule.id)}
                      />
                      <div className="grid gap-1 sm:grid-cols-2 sm:gap-6">
                        <div>
                          <p className="text-xs text-muted-foreground">Starts</p>
                          <p className="text-sm font-medium">
                            {format(new Date(schedule.startDateTime), "PPpp")}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Ends</p>
                          <p className="text-sm font-medium">
                            {format(new Date(schedule.endDateTime), "PPpp")}
                          </p>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  No upcoming schedules are available to replace this slot.
                </p>
              )}
            </div>
            <div className="flex justify-end gap-2 border-t px-6 py-4">
              <Button
                type="button"
                variant="outline"
                disabled={updateScheduleMutation.isPending}
                onClick={() => {
                  setScheduleToEdit(null)
                  setReplacementScheduleId("")
                }}
              >
                Cancel
              </Button>
              <Button
                type="button"
                disabled={!replacementScheduleId || updateScheduleMutation.isPending}
                onClick={handleEditSchedule}
              >
                {updateScheduleMutation.isPending ? "Updating..." : "Replace schedule"}
              </Button>
            </div>
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
            <AlertDialogTitle>Remove schedule?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the schedule from your doctor schedule. This does
              not delete the shared schedule itself.
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
                  deleteScheduleMutation.mutate(scheduleToDelete.scheduleId)
                }
              }}
            >
              {deleteScheduleMutation.isPending ? "Removing..." : "Remove schedule"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog.Root
        open={isBookDialogOpen}
        onOpenChange={(open) => {
          if (!bookSchedulesMutation.isPending) {
            setIsBookDialogOpen(open)
            if (!open) {
              setSelectedScheduleIds([])
            }
          }
        }}
      >
        <Dialog.Portal>
          <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/50 backdrop-blur-[2px]" />
          <Dialog.Popup className="fixed left-1/2 top-1/2 z-50 flex max-h-[85vh] w-[calc(100%-2rem)] max-w-2xl -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-xl border bg-background shadow-xl">
            <div className="flex items-start justify-between border-b px-6 py-4">
              <div>
                <Dialog.Title className="text-lg font-semibold">
                  Book available schedules
                </Dialog.Title>
                <Dialog.Description className="mt-1 text-sm text-muted-foreground">
                  Choose any upcoming available time slot. Past and already
                  booked schedules are not shown.
                </Dialog.Description>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Close book schedules dialog"
                disabled={bookSchedulesMutation.isPending}
                onClick={() => setIsBookDialogOpen(false)}
              >
                <X aria-hidden="true" />
              </Button>
            </div>

            <div className="min-h-0 overflow-y-auto px-6 py-4">
              {bookableSchedulesQuery.isPending ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  Loading available schedules...
                </p>
              ) : bookableSchedulesQuery.isError ? (
                <p className="py-8 text-center text-sm text-destructive" role="alert">
                  Unable to load available schedules. Please try again.
                </p>
              ) : bookableSchedules.length ? (
                <ul className="divide-y rounded-lg border">
                  {bookableSchedules.map((schedule) => (
                    <li
                      key={schedule.id}
                      className="flex items-center gap-3 px-4 py-3"
                    >
                      <Checkbox
                        checked={selectedScheduleIds.includes(schedule.id)}
                        disabled={bookSchedulesMutation.isPending}
                        aria-label={`Select schedule starting ${format(new Date(schedule.startDateTime), "PPpp")}`}
                        onCheckedChange={(checked) =>
                          toggleScheduleSelection(schedule.id, checked === true)
                        }
                      />
                      <div className="grid gap-1 sm:grid-cols-2 sm:gap-6">
                        <div>
                          <p className="text-xs text-muted-foreground">Starts</p>
                          <p className="text-sm font-medium">
                            {format(new Date(schedule.startDateTime), "PPpp")}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Ends</p>
                          <p className="text-sm font-medium">
                            {format(new Date(schedule.endDateTime), "PPpp")}
                          </p>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  No upcoming schedules are available to book.
                </p>
              )}
            </div>

            <div className="flex items-center justify-between gap-3 border-t px-6 py-4">
              <p className="text-sm text-muted-foreground" aria-live="polite">
                {selectedScheduleIds.length} selected
              </p>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  disabled={bookSchedulesMutation.isPending}
                  onClick={() => setIsBookDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  disabled={
                    selectedScheduleIds.length === 0 ||
                    bookSchedulesMutation.isPending
                  }
                  onClick={handleBookSelected}
                >
                  {bookSchedulesMutation.isPending
                    ? "Booking..."
                    : "Book selected"}
                </Button>
              </div>
            </div>
          </Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  )
}

export default DoctorScheduleTable