"use client"

import Link from "next/link"
import { useQuery } from "@tanstack/react-query"
import {
  ArrowRight,
  BriefcaseMedical,
  CalendarCheck2,
  Clock3,
  ShieldCheck,
  Star,
  Stethoscope,
} from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card"
import BookAppointmentDialog from "@/components/module/consultation/BookAppointmentDialog"
import { getAllDoctors } from "@/services/doctor.services"
import type { IDoctor } from "@/types/doctor.types"

const getInitials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase())
    .join("")
    .slice(0, 2)

const DoctorCard = ({ doctor }: { doctor: IDoctor }) => {
  const specialties =
    doctor.specialties?.flatMap(({ speciatily }) =>
      speciatily?.title?.trim() ? [speciatily.title.trim()] : [],
    ) ?? []

  return (
    <Card className="group h-full border-0 bg-white shadow-sm ring-1 ring-slate-200/80 transition duration-200 hover:-translate-y-1 hover:shadow-xl hover:shadow-teal-950/5 dark:bg-card dark:ring-border">
      <CardHeader className="gap-4 px-5 pt-5 sm:px-6">
        <div className="flex items-start gap-4">
          <Avatar className="size-16 shrink-0 rounded-2xl ring-4 ring-teal-50 dark:ring-teal-950/40">
            <AvatarImage src={doctor.profilePhoto || undefined} alt={doctor.name} />
            <AvatarFallback className="rounded-2xl bg-teal-100 text-lg font-semibold text-teal-800 dark:bg-teal-950 dark:text-teal-200">
              {getInitials(doctor.name)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1 pt-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="truncate text-lg font-semibold tracking-tight">
                {doctor.name}
              </h2>
              {doctor.user?.status === "ACTIVE" && (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
                  <span className="size-1.5 rounded-full bg-emerald-500" />
                  Available
                </span>
              )}
            </div>
            <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
              {doctor.designation || "Doctor"}
            </p>
            {doctor.currentWorkingPlace && (
              <p className="mt-1 truncate text-xs text-muted-foreground">
                {doctor.currentWorkingPlace}
              </p>
            )}
          </div>
        </div>
        <div className="flex min-h-7 flex-wrap gap-1.5">
          {specialties.length ? (
            specialties.slice(0, 3).map((specialty) => (
              <Badge
                key={specialty}
                variant="secondary"
                className="rounded-full bg-teal-50 px-2.5 text-teal-800 dark:bg-teal-950/50 dark:text-teal-200"
              >
                {specialty}
              </Badge>
            ))
          ) : (
            <Badge variant="outline" className="rounded-full">
              General practice
            </Badge>
          )}
          {specialties.length > 3 && (
            <Badge variant="outline" className="rounded-full">
              +{specialties.length - 3}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="grid grid-cols-3 gap-2 px-5 py-5 sm:px-6">
        <div className="min-w-0 rounded-xl bg-slate-50 p-3 dark:bg-muted/50">
          <p className="text-[11px] text-muted-foreground">Experience</p>
          <p className="mt-1 flex items-center gap-1.5 text-sm font-semibold">
            <BriefcaseMedical aria-hidden="true" className="size-3.5 shrink-0 text-teal-700 dark:text-teal-300" />
            <span className="truncate">
              {doctor.experience != null ? `${doctor.experience} yrs` : "—"}
            </span>
          </p>
        </div>
        <div className="min-w-0 rounded-xl bg-slate-50 p-3 dark:bg-muted/50">
          <p className="text-[11px] text-muted-foreground">Rating</p>
          <p className="mt-1 flex items-center gap-1.5 text-sm font-semibold">
            <Star aria-hidden="true" className="size-3.5 shrink-0 fill-amber-400 text-amber-400" />
            <span>{Number(doctor.averageRating || 0).toFixed(1)}</span>
          </p>
        </div>
        <div className="min-w-0 rounded-xl bg-slate-50 p-3 dark:bg-muted/50">
          <p className="text-[11px] text-muted-foreground">Fee</p>
          <p className="mt-1 truncate text-sm font-semibold">
            {doctor.appointmentFee != null
              ? `৳${Number(doctor.appointmentFee).toLocaleString()}`
              : "Contact"}
          </p>
        </div>
      </CardContent>
      <CardFooter className="mt-auto flex-col gap-2.5 border-slate-100 bg-transparent px-5 py-4 sm:flex-row sm:px-6 dark:border-border">
        <Button
          className="h-10 w-full flex-1 rounded-xl bg-teal-700 text-white hover:bg-teal-800 dark:bg-teal-700 dark:text-white dark:hover:bg-teal-600"
          nativeButton={false}
          render={<Link href={`/consultations/doctor/${doctor.id}`} />}
        >
          View details
          <ArrowRight aria-hidden="true" className="transition-transform group-hover:translate-x-0.5" />
        </Button>
        <BookAppointmentDialog
          doctorId={doctor.id}
          doctorName={doctor.name}
          buttonClassName="h-10 w-full flex-1 rounded-xl border border-slate-200 bg-white text-slate-800 hover:bg-slate-50 dark:border-border dark:bg-card dark:text-foreground dark:hover:bg-muted"
        />
      </CardFooter>
    </Card>
  )
}

const DoctorList = () => {
  const doctorsQuery = useQuery({
    queryKey: ["doctors", "all"],
    queryFn: getAllDoctors,
  })
  const doctors = doctorsQuery.data?.data ?? []

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
      <header className="relative mb-10 overflow-hidden rounded-3xl bg-gradient-to-br from-teal-950 via-teal-900 to-emerald-800 px-6 py-8 text-white shadow-xl shadow-teal-950/10 sm:px-10 sm:py-11 lg:px-12">
        <div aria-hidden="true" className="pointer-events-none absolute -right-16 -top-24 size-80 rounded-full border-[40px] border-white/5" />
        <div aria-hidden="true" className="pointer-events-none absolute -bottom-36 right-1/4 size-72 rounded-full bg-emerald-400/10 blur-3xl" />
        <div className="relative grid gap-8 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
          <div className="max-w-2xl">
            <Badge className="mb-5 gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-white hover:bg-white/10">
              <Stethoscope aria-hidden="true" className="size-3.5" />
              Care that fits your life
            </Badge>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
              Find your doctor.
              <span className="mt-1 block text-teal-200">Feel better sooner.</span>
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-6 text-teal-50/80 sm:text-base">
              Meet trusted specialists, compare experience and fees, then book
              a time that works for you.
            </p>
            <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-sm text-teal-50/90">
              <span className="inline-flex items-center gap-2">
                <ShieldCheck aria-hidden="true" className="size-4 text-teal-200" />
                Trusted professionals
              </span>
              <span className="inline-flex items-center gap-2">
                <Clock3 aria-hidden="true" className="size-4 text-teal-200" />
                Easy appointment booking
              </span>
            </div>
          </div>
          <div className="flex items-center gap-4 rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-sm md:min-w-56 md:flex-col md:items-start md:p-5">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-white/15">
              <CalendarCheck2 aria-hidden="true" className="size-6 text-teal-100" />
            </div>
            <div>
              <p className="text-2xl font-bold tabular-nums">{doctors.length}</p>
              <p className="text-sm text-teal-50/75">
                {doctors.length === 1 ? "doctor to explore" : "doctors to explore"}
              </p>
            </div>
          </div>
        </div>
      </header>

      <section aria-labelledby="doctor-list-heading">
        <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-medium text-teal-700 dark:text-teal-300">
              CONSULTATIONS
            </p>
            <h2 id="doctor-list-heading" className="mt-1 text-2xl font-bold tracking-tight">
              Meet our doctors
            </h2>
          </div>
          <p className="text-sm text-muted-foreground">
            Choose a specialist and book your visit
          </p>
        </div>

      {doctorsQuery.isPending ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }, (_, index) => (
            <div
              key={index}
              className="h-72 animate-pulse rounded-2xl bg-muted"
              role="status"
              aria-label="Loading doctors"
            />
          ))}
        </div>
      ) : doctorsQuery.isError ? (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-8 text-center">
          <p className="font-medium">Unable to load doctors.</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Please try again.
          </p>
          <Button
            className="mt-4"
            variant="outline"
            onClick={() => void doctorsQuery.refetch()}
          >
            Try again
          </Button>
        </div>
      ) : doctors.length ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {doctors.map((doctor) => (
            <DoctorCard key={doctor.id} doctor={doctor} />
          ))}
        </div>
      ) : (
        <p className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/70 p-10 text-center text-muted-foreground dark:bg-muted/30">
          No doctors are available right now.
        </p>
      )}
      </section>
    </main>
  )
}

export default DoctorList
