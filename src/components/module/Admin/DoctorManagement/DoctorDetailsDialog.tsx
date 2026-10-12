"use client"

import { useQuery } from "@tanstack/react-query"
import { Dialog } from "@base-ui/react/dialog"
import type { ReactNode } from "react"
import {
  BadgeCheck,
  BriefcaseMedical,
  CalendarDays,
  ClipboardList,
  Clock3,
  MessageSquareText,
  Star,
  X,
  type LucideIcon,
} from "lucide-react"
import { getDoctorById } from "@/services/doctor.services"
import type { IDoctorDetails } from "@/types/doctor.types"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

interface DoctorDetailsDialogProps {
  doctorId: number | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

const formatDate = (value?: string | Date) => {
  if (!value) {
    return "Not provided"
  }

  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleString()
}

const getInitials = (name: string) =>
  name
    .split(" ")
    .map((part) => part.charAt(0).toUpperCase())
    .join("")
    .slice(0, 2)

const Detail = ({
  label,
  value,
}: {
  label: string
  value?: string | number | null
}) => (
  <div className="min-w-0 space-y-1">
    <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
    <dd className="break-words text-sm font-medium">{value ?? "Not provided"}</dd>
  </div>
)

const Section = ({
  title,
  icon: Icon,
  count,
  children,
}: {
  title: string
  icon: LucideIcon
  count?: number
  children: ReactNode
}) => (
  <section className="overflow-hidden rounded-xl border bg-card">
    <div className="flex items-center justify-between border-b px-5 py-3.5">
      <h3 className="flex items-center gap-2 text-sm font-semibold">
        <Icon aria-hidden="true" className="size-4 text-primary" />
        {title}
      </h3>
      {count !== undefined && (
        <Badge variant="secondary" className="tabular-nums">
          {count}
        </Badge>
      )}
    </div>
    <div className="p-5">{children}</div>
  </section>
)

const EmptyState = ({ children }: { children: ReactNode }) => (
  <p className="rounded-lg border border-dashed px-4 py-5 text-center text-sm text-muted-foreground">
    {children}
  </p>
)

const DoctorDetails = ({ doctor }: { doctor: IDoctorDetails }) => {
  const specialties =
    doctor.specialties?.flatMap(({ speciatily }) =>
      speciatily?.title ? [speciatily.title] : [],
    ) ?? []

  return (
    <div className="space-y-5">
      <section className="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-primary/10 via-primary/5 to-background p-5 sm:p-6">
        <div
          aria-hidden="true"
          className="absolute -right-12 -top-20 size-56 rounded-full bg-primary/5 blur-2xl"
        />
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center">
          <Avatar className="size-20 ring-4 ring-background shadow-md">
            <AvatarImage src={doctor.profilePhoto || undefined} alt={doctor.name} />
            <AvatarFallback className="text-xl font-semibold">
              {getInitials(doctor.name)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">
                {doctor.name}
              </h2>
              <Badge
                variant={doctor.user?.status === "ACTIVE" ? "default" : "secondary"}
                className="capitalize"
              >
                {doctor.user?.status?.toLowerCase() ?? "Status unavailable"}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              {doctor.designation || "Doctor"}
              {doctor.currentWorkingPlace ? ` · ${doctor.currentWorkingPlace}` : ""}
            </p>
            <div className="flex flex-wrap gap-2">
              {specialties.length ? (
                specialties.map((specialty) => (
                  <Badge key={specialty} variant="outline" className="bg-background/70">
                    {specialty}
                  </Badge>
                ))
              ) : (
                <span className="text-xs text-muted-foreground">No specialties listed</span>
              )}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:min-w-40 sm:grid-cols-1">
            <div className="rounded-lg border bg-background/75 px-3 py-2">
              <p className="text-xs text-muted-foreground">Appointment fee</p>
              <p className="font-semibold">
                {doctor.appointmentFee != null
                  ? `$${doctor.appointmentFee.toFixed(2)}`
                  : "Not set"}
              </p>
            </div>
            <div className="rounded-lg border bg-background/75 px-3 py-2">
              <p className="text-xs text-muted-foreground">Rating</p>
              <p className="flex items-center gap-1 font-semibold">
                <Star aria-hidden="true" className="size-3.5 fill-amber-400 text-amber-400" />
                {doctor.averageRating?.toFixed(1) ?? "0.0"}
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-5 lg:grid-cols-2">
        <Section title="Contact & personal" icon={BadgeCheck}>
          <dl className="grid gap-x-5 gap-y-4 sm:grid-cols-2">
            <Detail label="Email" value={doctor.email} />
            <Detail label="Phone" value={doctor.contactNumber} />
            <Detail label="Gender" value={doctor.gender} />
            <Detail label="Address" value={doctor.address} />
          </dl>
        </Section>

        <Section title="Professional profile" icon={BriefcaseMedical}>
          <dl className="grid gap-x-5 gap-y-4 sm:grid-cols-2">
            <Detail label="Qualification" value={doctor.qualification} />
            <Detail label="Experience" value={doctor.experience != null ? `${doctor.experience} years` : undefined} />
            <Detail label="Registration no." value={doctor.registrationNumber} />
            <Detail label="Workplace" value={doctor.currentWorkingPlace} />
            <Detail label="Joined" value={formatDate(doctor.createdAt)} />
          </dl>
        </Section>
      </div>

      <Section
        title="Schedules"
        icon={CalendarDays}
        count={doctor.doctorSchedule?.length ?? 0}
      >
        {doctor.doctorSchedule?.length ? (
          <ul className="grid gap-3 sm:grid-cols-2">
            {doctor.doctorSchedule.map((entry, index) => (
              <li
                className="flex items-start gap-3 rounded-lg border bg-muted/20 p-3"
                key={entry.id ?? index}
              >
                <span className="rounded-md bg-primary/10 p-2 text-primary">
                  <Clock3 aria-hidden="true" className="size-4" />
                </span>
                <div className="min-w-0 space-y-1 text-sm">
                  <p className="font-medium">{formatDate(entry.schedule?.startDate)}</p>
                  <p className="text-muted-foreground">
                    {entry.schedule?.startTime
                      ? formatDate(entry.schedule.startTime)
                      : "Time not provided"}
                    {entry.schedule?.endTime
                      ? ` – ${formatDate(entry.schedule.endTime)}`
                      : ""}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState>No schedules found.</EmptyState>
        )}
      </Section>

      <Section
        title="Appointments"
        icon={ClipboardList}
        count={doctor.appointment?.length ?? 0}
      >
        {doctor.appointment?.length ? (
          <ul className="space-y-3">
            {doctor.appointment.map((appointment, index) => (
              <li
                className="rounded-lg border bg-muted/20 p-4"
                key={appointment.id ?? index}
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="space-y-1">
                    <p className="font-medium">
                      {appointment.patient?.name ?? appointment.patient?.email ?? "Patient"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {appointment.schedule?.startDate
                        ? formatDate(appointment.schedule.startDate)
                        : formatDate(appointment.createdAt)}
                      {appointment.schedule?.startTime
                        ? ` · ${formatDate(appointment.schedule.startTime)}`
                        : ""}
                    </p>
                  </div>
                  {appointment.status && (
                    <Badge variant="outline" className="capitalize">
                      {appointment.status.toLowerCase()}
                    </Badge>
                  )}
                </div>
                {(appointment.pescription?.title ||
                  appointment.pescription?.description) && (
                  <p className="mt-3 border-t pt-3 text-sm text-muted-foreground">
                    Prescription:{" "}
                    {appointment.pescription.title ??
                      appointment.pescription.description}
                  </p>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState>No appointments found.</EmptyState>
        )}
      </Section>

      <Section
        title="Patient reviews"
        icon={MessageSquareText}
        count={doctor.reviews?.length ?? 0}
      >
        {doctor.reviews?.length ? (
          <ul className="space-y-3">
            {doctor.reviews.map((review, index) => (
              <li
                className="rounded-lg border bg-muted/20 p-4"
                key={review.id ?? index}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="flex items-center gap-1.5 text-sm font-semibold">
                    <Star aria-hidden="true" className="size-4 fill-amber-400 text-amber-400" />
                    {review.rating != null ? `${review.rating} / 5` : "Review"}
                  </p>
                  {review.createdAt && (
                    <p className="text-xs text-muted-foreground">
                      {formatDate(review.createdAt)}
                    </p>
                  )}
                </div>
                {review.comment && (
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {review.comment}
                  </p>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState>No reviews found.</EmptyState>
        )}
      </Section>
    </div>
  )
}

const DoctorDetailsDialog = ({
  doctorId,
  open,
  onOpenChange,
}: DoctorDetailsDialogProps) => {
  const doctorQuery = useQuery({
    queryKey: ["doctor", doctorId],
    queryFn: () => {
      if (doctorId === null) {
        throw new Error("A doctor must be selected to load details.")
      }

      return getDoctorById(doctorId)
    },
    enabled: open && doctorId !== null,
  })

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm data-open:animate-in data-open:fade-in-0" />
        <Dialog.Popup className="fixed left-1/2 top-1/2 z-50 flex max-h-[92vh] w-[calc(100%-1.5rem)] max-w-5xl -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-2xl border bg-background shadow-2xl outline-none sm:w-[calc(100%-3rem)]">
          <header className="flex shrink-0 items-center justify-between border-b px-5 py-4 sm:px-6">
            <div>
              <Dialog.Title className="text-lg font-semibold tracking-tight">
                Doctor profile
              </Dialog.Title>
              <Dialog.Description className="text-sm text-muted-foreground">
                Profile, availability and patient activity
              </Dialog.Description>
            </div>
            <Dialog.Close
              render={
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label="Close doctor details"
                >
                  <X />
                </Button>
              }
            />
          </header>
          <div className="min-h-0 overflow-y-auto bg-muted/10 p-4 sm:p-6">
            {doctorQuery.isPending && (
              <div className="space-y-5" role="status" aria-label="Loading doctor details">
                <div className="h-36 animate-pulse rounded-2xl bg-muted" />
                <div className="grid gap-5 lg:grid-cols-2">
                  <div className="h-40 animate-pulse rounded-xl bg-muted" />
                  <div className="h-40 animate-pulse rounded-xl bg-muted" />
                </div>
              </div>
            )}
            {doctorQuery.isError && (
              <div
                role="alert"
                className="rounded-xl border border-destructive/30 bg-destructive/5 p-5 text-sm text-destructive"
              >
                {doctorQuery.error instanceof Error
                  ? doctorQuery.error.message
                  : "Unable to load doctor details."}
              </div>
            )}
            {doctorQuery.data && <DoctorDetails doctor={doctorQuery.data.data} />}
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

export default DoctorDetailsDialog
