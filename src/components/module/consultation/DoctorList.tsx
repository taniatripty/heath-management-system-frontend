"use client"

import Link from "next/link"
import { useQuery } from "@tanstack/react-query"
import { ArrowRight, BriefcaseMedical, Star } from "lucide-react"
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
    <Card className="h-full transition-shadow hover:shadow-lg">
      <CardHeader className="items-center text-center">
        <Avatar className="size-24 ring-4 ring-primary/10">
          <AvatarImage src={doctor.profilePhoto || undefined} alt={doctor.name} />
          <AvatarFallback className="text-xl font-semibold">
            {getInitials(doctor.name)}
          </AvatarFallback>
        </Avatar>
        <div className="space-y-1">
          <h2 className="text-lg font-semibold">{doctor.name}</h2>
          <p className="text-sm text-muted-foreground">
            {doctor.designation || "Doctor"}
          </p>
        </div>
        <div className="flex flex-wrap justify-center gap-1.5">
          {specialties.length ? (
            specialties.map((specialty) => (
              <Badge key={specialty} variant="secondary">
                {specialty}
              </Badge>
            ))
          ) : (
            <Badge variant="outline">General practice</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-lg bg-muted/50 p-3">
          <p className="text-xs text-muted-foreground">Experience</p>
          <p className="mt-1 flex items-center gap-1.5 font-medium">
            <BriefcaseMedical aria-hidden="true" className="size-4 text-primary" />
            {doctor.experience != null ? `${doctor.experience} years` : "Not listed"}
          </p>
        </div>
        <div className="rounded-lg bg-muted/50 p-3">
          <p className="text-xs text-muted-foreground">Rating</p>
          <p className="mt-1 flex items-center gap-1.5 font-medium">
            <Star
              aria-hidden="true"
              className="size-4 fill-amber-400 text-amber-400"
            />
            {Number(doctor.averageRating || 0).toFixed(1)}
          </p>
        </div>
        <div className="col-span-2 rounded-lg bg-muted/50 p-3">
          <p className="text-xs text-muted-foreground">Appointment fee</p>
          <p className="mt-1 font-medium">
            {doctor.appointmentFee != null
              ? `৳${Number(doctor.appointmentFee).toLocaleString()}`
              : "Contact for fee"}
          </p>
        </div>
      </CardContent>
      <CardFooter className="flex-col gap-2">
        <Button
          className="w-full"
          nativeButton={false}
          render={<Link href={`/consultations/doctor/${doctor.id}`} />}
        >
          View details
          <ArrowRight aria-hidden="true" />
        </Button>
        <BookAppointmentDialog doctorId={doctor.id} doctorName={doctor.name} />
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
    <main className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <header className="mb-8 space-y-3 text-center">
        <Badge variant="outline">Our medical team</Badge>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Find the right doctor for you
        </h1>
        <p className="mx-auto max-w-2xl text-muted-foreground">
          Explore our doctors, review their expertise, and find a time that works
          for you.
        </p>
      </header>

      {doctorsQuery.isPending ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }, (_, index) => (
            <div
              key={index}
              className="h-80 animate-pulse rounded-xl bg-muted"
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
        <p className="rounded-xl border border-dashed p-10 text-center text-muted-foreground">
          No doctors are available right now.
        </p>
      )}
    </main>
  )
}

export default DoctorList
