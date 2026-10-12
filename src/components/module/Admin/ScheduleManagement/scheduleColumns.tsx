import type { ColumnDef, TableFeatures } from "@tanstack/react-table"
import { differenceInMinutes } from "date-fns"
import DateCell from "@/components/shared/cell/DateCell"
import { Badge } from "@/components/ui/badge"
import type { ISchedule } from "@/types/schedule.types"

const formatDuration = (schedule: ISchedule) => {
  const minutes = differenceInMinutes(
    new Date(schedule.endDateTime),
    new Date(schedule.startDateTime),
  )

  if (!Number.isFinite(minutes) || minutes < 0) {
    return "—"
  }

  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60
  if (hours === 0) {
    return `${remainingMinutes} min`
  }
  if (remainingMinutes === 0) {
    return `${hours} hr`
  }
  return `${hours} hr ${remainingMinutes} min`
}

export const scheduleColumns: ColumnDef<TableFeatures, ISchedule>[] = [
  {
    id: "startDateTime",
    accessorKey: "startDateTime",
    header: "Start date & time",
    cell: ({ row }) => (
      <DateCell
        date={row.original.startDateTime}
        formatString="MMM dd, yyyy · h:mm a"
      />
    ),
  },
  {
    id: "endDateTime",
    accessorKey: "endDateTime",
    header: "End date & time",
    cell: ({ row }) => (
      <DateCell
        date={row.original.endDateTime}
        formatString="MMM dd, yyyy · h:mm a"
      />
    ),
  },
  {
    id: "duration",
    accessorFn: (schedule) => differenceInMinutes(
      new Date(schedule.endDateTime),
      new Date(schedule.startDateTime),
    ),
    header: "Duration",
    cell: ({ row }) => (
      <span className="text-sm font-medium">{formatDuration(row.original)}</span>
    ),
  },
  {
    id: "booked",
    accessorFn: (schedule) =>
      schedule.isBooked ?? (schedule.appointment?.length ?? 0) > 0,
    header: "Booked",
    cell: ({ row }) => {
      const booked =
        row.original.isBooked ?? (row.original.appointment?.length ?? 0) > 0

      return (
        <Badge variant={booked ? "default" : "secondary"}>
          {booked ? "Booked" : "Available"}
        </Badge>
      )
    },
  },
  {
    id: "appointment",
    accessorFn: (schedule) => schedule.appointment?.length ?? 0,
    header: "Appointments",
    cell: ({ row }) => {
      const appointments = row.original.appointment ?? []

      if (appointments.length === 0) {
        return <span className="text-sm text-muted-foreground">No appointments</span>
      }

      return (
        <div className="flex min-w-36 flex-col gap-1">
          {appointments.map((appointment, index) => (
            <div
              key={appointment.id ?? `${appointment.patient?.email ?? "appointment"}-${index}`}
              className="flex flex-wrap items-center gap-1.5"
            >
              <span className="text-sm">
                {appointment.patient?.name ??
                  appointment.patient?.email ??
                  `Appointment ${index + 1}`}
              </span>
              {appointment.status && (
                <Badge variant="outline">{appointment.status}</Badge>
              )}
            </div>
          ))}
        </div>
      )
    },
  },
]
