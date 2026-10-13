
"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Dialog } from "@base-ui/react/dialog"
import { useQuery } from "@tanstack/react-query"
import { CalendarDays, Clock3 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { getDoctorById } from "@/services/doctor.services"
import type { IDoctorDetails } from "@/types/doctor.types"

type DoctorSchedule = NonNullable<IDoctorDetails["doctorSchedule"]>[number]

const formatDateTime = (value: string | Date) =>
  new Intl.DateTimeFormat(undefined, {
    dateStyle: "full",
    timeStyle: "short",
  }).format(new Date(value))

const BookAppointmentDialog = ({
  doctorId,
  doctorName,
  schedules,
}: {
  doctorId: string | number
  doctorName: string
  schedules?: DoctorSchedule[]
}) => {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [selectedScheduleId, setSelectedScheduleId] = useState("")
  const [currentTime, setCurrentTime] = useState<number | null>(null)
  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen)
    setCurrentTime(nextOpen ? Date.now() : null)
    if (!nextOpen) {
      setSelectedScheduleId("")
    }
  }

  const doctorQuery = useQuery({
    queryKey: ["doctor", String(doctorId)],
    queryFn: () => getDoctorById(doctorId),
    enabled: open && schedules === undefined,
  })
  const sourceSchedules =
    schedules ?? doctorQuery.data?.data.doctorSchedule ?? []
  const availableSchedules = sourceSchedules
    .flatMap((doctorSchedule) => {
      const schedule = doctorSchedule.schedule
      const scheduleId = schedule?.id ?? doctorSchedule.scheduleId
      const startDateTime = schedule?.startDateTime
      const startTime = startDateTime ? new Date(startDateTime).getTime() : NaN

      if (
        !schedule ||
        !scheduleId ||
        !startDateTime ||
        !Number.isFinite(startTime) ||
        currentTime === null ||
        startTime < currentTime ||
        doctorSchedule.isBooked ||
        schedule.isBooked ||
        (schedule.appointment?.length ?? 0) > 0
      ) {
        return []
      }

      return [{ id: scheduleId, startDateTime, endDateTime: schedule.endDateTime }]
    })
    .sort(
      (first, second) =>
        new Date(first.startDateTime).getTime() -
        new Date(second.startDateTime).getTime(),
    )

  const selectedSchedule = availableSchedules.find(
    (schedule) => schedule.id === selectedScheduleId,
  ) ?? availableSchedules[0]

  const continueToBooking = () => {
    if (!selectedSchedule) {
      return
    }

    setOpen(false)
    router.push(
      `/dashboard/book-appointment?doctorId=${encodeURIComponent(String(doctorId))}&scheduleId=${encodeURIComponent(selectedSchedule.id)}`,
    )
  }

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <Button type="button" onClick={() => handleOpenChange(true)}>
        Book appointment
      </Button>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" />
        <Dialog.Popup className="fixed top-1/2 left-1/2 z-50 max-h-[85vh] w-[calc(100%-2rem)] max-w-xl -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-xl border bg-background p-6 shadow-xl">
          <Dialog.Title className="text-xl font-semibold">
            Book an appointment with {doctorName}
          </Dialog.Title>
          <Dialog.Description className="mt-1 text-sm text-muted-foreground">
            Choose an available appointment time today or later.
          </Dialog.Description>

          {doctorQuery.isError ? (
            <div className="mt-5 rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm">
              <p>{doctorQuery.error.message}</p>
              <Button
                className="mt-3"
                variant="outline"
                onClick={() => void doctorQuery.refetch()}
              >
                Try again
              </Button>
            </div>
          ) : doctorQuery.isPending && schedules === undefined ? (
            <p className="mt-6 text-sm text-muted-foreground" role="status">
              Loading available schedules…
            </p>
          ) : currentTime === null ? (
            <p className="mt-6 text-sm text-muted-foreground" role="status">
              Checking available schedules…
            </p>
          ) : availableSchedules.length ? (
            <fieldset className="mt-5 space-y-2">
              <legend className="sr-only">Available appointment schedules</legend>
              {availableSchedules.map((schedule) => (
                <label
                  key={schedule.id}
                  className="flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition-colors hover:bg-muted/50 has-checked:border-primary has-checked:bg-primary/5"
                >
                  <input
                    type="radio"
                    name="appointment-schedule"
                    value={schedule.id}
                    checked={selectedSchedule.id === schedule.id}
                    onChange={() => setSelectedScheduleId(schedule.id)}
                    className="mt-1 accent-primary"
                  />
                  <span className="min-w-0">
                    <span className="flex items-center gap-2 text-sm font-medium">
                      <CalendarDays
                        aria-hidden="true"
                        className="size-4 shrink-0 text-primary"
                      />
                      {formatDateTime(schedule.startDateTime)}
                    </span>
                    {schedule.endDateTime && (
                      <span className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock3 aria-hidden="true" className="size-4 shrink-0" />
                        Ends {formatDateTime(schedule.endDateTime)}
                      </span>
                    )}
                  </span>
                </label>
              ))}
            </fieldset>
          ) : (
            <p className="mt-6 rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
              No available schedules today or later. Please check back soon.
            </p>
          )}

          <div className="mt-6 flex justify-end gap-2">
            <Dialog.Close
              render={<Button type="button" variant="outline" />}
            >
              Cancel
            </Dialog.Close>
            <Button
              type="button"
              onClick={continueToBooking}
              disabled={!selectedSchedule || doctorQuery.isError}
            >
              Continue
            </Button>
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

export default BookAppointmentDialog
