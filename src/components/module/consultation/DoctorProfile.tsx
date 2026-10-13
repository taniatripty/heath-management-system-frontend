"use client"

import Link from "next/link"
import { useQuery } from "@tanstack/react-query"
import {
  ArrowLeft,
  BriefcaseMedical,
  CalendarDays,
  Clock3,
  GraduationCap,
  Mail,
  MapPin,
  Phone,
  Star,
} from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { getDoctorById } from "@/services/doctor.services"
import type { IDoctorDetails } from "@/types/doctor.types"

const getInitials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase())
    .join("")
    .slice(0, 2)

const formatDateTime = (value?: string | Date) => {
  if (!value) {
    return "Time not provided"
  }

  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? "Time not provided"
    : new Intl.DateTimeFormat(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(date)
}

const DoctorProfileContent = ({ doctor }: { doctor: IDoctorDetails }) => {
  const specialties =
    doctor.specialties?.flatMap(({ speciatily }) =>
      speciatily?.title?.trim() ? [speciatily.title.trim()] : [],
    ) ?? []
  const upcomingSlots =
    doctor.doctorSchedule
      ?.flatMap(({ isBooked, schedule }) => {
        const startValue = schedule?.startDateTime
        const start = startValue ? new Date(startValue) : null
        if (
          !schedule ||
          !start ||
          Number.isNaN(start.getTime()) ||
          start < new Date() ||
          isBooked
        ) {
          return []
        }

        return [schedule]
      })
      .sort(
        (first, second) =>
          new Date(first.startDateTime!).getTime() -
          new Date(second.startDateTime!).getTime(),
      ) ?? []

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <Button
        className="mb-6"
        variant="ghost"
        nativeButton={false}
        render={<Link href="/consultations" />}
      >
        <ArrowLeft aria-hidden="true" />
        All doctors
      </Button>

      <section className="relative mb-6 overflow-hidden rounded-2xl border bg-gradient-to-br from-primary/10 via-primary/5 to-background p-6 sm:p-8">
        <div
          aria-hidden="true"
          className="absolute -right-10 -top-16 size-64 rounded-full bg-primary/5 blur-3xl"
        />
        <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center">
          <Avatar className="size-28 ring-4 ring-background shadow-lg">
            <AvatarImage src={doctor.profilePhoto || undefined} alt={doctor.name} />
            <AvatarFallback className="text-2xl font-semibold">
              {getInitials(doctor.name)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1 space-y-3">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                  {doctor.name}
                </h1>
                {doctor.user?.status === "ACTIVE" && (
                  <Badge variant="secondary">Available</Badge>
                )}
              </div>
              <p className="mt-1 text-muted-foreground">
                {doctor.designation || "Doctor"}
                {doctor.currentWorkingPlace
                  ? ` · ${doctor.currentWorkingPlace}`
                  : ""}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {specialties.length ? (
                specialties.map((specialty) => (
                  <Badge key={specialty} variant="outline">
                    {specialty}
                  </Badge>
                ))
              ) : (
                <Badge variant="outline">General practice</Badge>
              )}
            </div>
            <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <Star
                  aria-hidden="true"
                  className="size-4 fill-amber-400 text-amber-400"
                />
                {Number(doctor.averageRating || 0).toFixed(1)} rating
                <span>({doctor.reviews?.length ?? 0} reviews)</span>
              </span>
              {doctor.experience != null && (
                <span className="inline-flex items-center gap-1.5">
                  <BriefcaseMedical aria-hidden="true" className="size-4" />
                  {doctor.experience} years experience
                </span>
              )}
            </div>
          </div>
          <div className="rounded-xl border bg-background/80 p-4 sm:min-w-48">
            <p className="text-sm text-muted-foreground">Appointment fee</p>
            <p className="mt-1 text-2xl font-bold">
              {doctor.appointmentFee != null
                ? `৳${Number(doctor.appointmentFee).toLocaleString()}`
                : "Contact for fee"}
            </p>
          </div>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GraduationCap aria-hidden="true" className="size-5 text-primary" />
              Professional details
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-xs text-muted-foreground">Qualification</p>
              <p className="mt-1 font-medium">{doctor.qualification || "Not provided"}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Registration number</p>
              <p className="mt-1 font-medium">
                {doctor.registrationNumber || "Not provided"}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Designation</p>
              <p className="mt-1 font-medium">{doctor.designation || "Not provided"}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Current workplace</p>
              <p className="mt-1 font-medium">
                {doctor.currentWorkingPlace || "Not provided"}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Gender</p>
              <p className="mt-1 font-medium">{doctor.gender || "Not provided"}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin aria-hidden="true" className="size-5 text-primary" />
              Contact information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="flex items-start gap-3 text-sm">
              <Mail aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-primary" />
              {doctor.email ? (
                <a className="break-all hover:underline" href={`mailto:${doctor.email}`}>
                  {doctor.email}
                </a>
              ) : (
                <span className="text-muted-foreground">Email not provided</span>
              )}
            </p>
            <p className="flex items-start gap-3 text-sm">
              <Phone aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-primary" />
              {doctor.contactNumber ? (
                <a className="hover:underline" href={`tel:${doctor.contactNumber}`}>
                  {doctor.contactNumber}
                </a>
              ) : (
                <span className="text-muted-foreground">Phone not provided</span>
              )}
            </p>
            <p className="flex items-start gap-3 text-sm">
              <MapPin aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-primary" />
              <span>{doctor.address || "Address not provided"}</span>
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarDays aria-hidden="true" className="size-5 text-primary" />
            Upcoming available schedules
            <Badge variant="secondary">{upcomingSlots.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {upcomingSlots.length ? (
            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {upcomingSlots.map((slot, index) => (
                <li
                  key={slot.id ?? `${slot.startDateTime}-${index}`}
                  className="rounded-lg border bg-muted/20 p-4"
                >
                  <p className="flex items-center gap-2 text-sm font-medium">
                    <CalendarDays aria-hidden="true" className="size-4 text-primary" />
                    {formatDateTime(slot.startDateTime)}
                  </p>
                  <p className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock3 aria-hidden="true" className="size-4" />
                    Ends {formatDateTime(slot.endDateTime)}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
              No upcoming available schedules at the moment.
            </p>
          )}
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star aria-hidden="true" className="size-5 fill-amber-400 text-amber-400" />
            Patient reviews
            <Badge variant="secondary">{doctor.reviews?.length ?? 0}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {doctor.reviews?.length ? (
            <ul className="grid gap-3 sm:grid-cols-2">
              {doctor.reviews.map((review, index) => {
                const rating = review.ratting ?? review.rating
                return (
                  <li
                    key={review.id ?? index}
                    className="rounded-lg border bg-muted/20 p-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="flex items-center gap-1.5 text-sm font-semibold">
                        <Star
                          aria-hidden="true"
                          className="size-4 fill-amber-400 text-amber-400"
                        />
                        {rating != null ? `${rating} / 5` : "Patient review"}
                      </p>
                      {review.createdAt && (
                        <time className="text-xs text-muted-foreground">
                          {formatDateTime(review.createdAt)}
                        </time>
                      )}
                    </div>
                    {review.comment && (
                      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                        {review.comment}
                      </p>
                    )}
                  </li>
                )
              })}
            </ul>
          ) : (
            <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
              No patient reviews yet.
            </p>
          )}
        </CardContent>
      </Card>
    </main>
  )
}

const DoctorProfile = ({ doctorId }: { doctorId: string }) => {
  const doctorQuery = useQuery({
    queryKey: ["doctor", doctorId],
    queryFn: () => getDoctorById(doctorId),
  })

  if (doctorQuery.isPending) {
    return (
      <main className="mx-auto min-h-96 w-full max-w-6xl animate-pulse px-4 py-8 sm:px-6">
        <div className="h-64 rounded-2xl bg-muted" />
        <div className="mt-6 grid gap-6 sm:grid-cols-2">
          <div className="h-48 rounded-xl bg-muted" />
          <div className="h-48 rounded-xl bg-muted" />
        </div>
      </main>
    )
  }

  if (doctorQuery.isError || !doctorQuery.data?.data) {
    return (
      <main className="mx-auto w-full max-w-3xl px-4 py-16 text-center">
        <h1 className="text-2xl font-bold">Doctor profile unavailable</h1>
        <p className="mt-2 text-muted-foreground">
          {doctorQuery.error instanceof Error
            ? doctorQuery.error.message
            : "We could not find this doctor."}
        </p>
        <div className="mt-5 flex justify-center gap-2">
          <Button variant="outline" onClick={() => void doctorQuery.refetch()}>
            Try again
          </Button>
          <Button
            nativeButton={false}
            render={<Link href="/consultations" />}
          >
            Browse doctors
          </Button>
        </div>
      </main>
    )
  }

  return <DoctorProfileContent doctor={doctorQuery.data.data} />
}

export default DoctorProfile
