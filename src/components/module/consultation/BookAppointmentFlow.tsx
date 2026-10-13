"use client"

import Link from "next/link"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import { ArrowLeft, CalendarDays, Clock3, CreditCard, Wallet } from "lucide-react"
import { toast } from "sonner"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  bookAppointmentWithPayLater,
  createAppointment,
} from "@/services/appointment.services"
import { getDoctorById } from "@/services/doctor.services"
import type { IAppointmentPayload } from "@/types/appointment.types"

const formatDateTime = (value: string | Date) =>
  new Intl.DateTimeFormat(undefined, {
    dateStyle: "full",
    timeStyle: "short",
  }).format(new Date(value))

const BookAppointmentFlow = ({
  doctorId,
  scheduleId,
}: {
  doctorId: string
  scheduleId: string
}) => {
  const router = useRouter()
  const [paymentPending, setPaymentPending] = useState(false)
  const [payLaterPending, setPayLaterPending] = useState(false)
  const doctorQuery = useQuery({
    queryKey: ["doctor", doctorId],
    queryFn: () => getDoctorById(doctorId),
    enabled: Boolean(doctorId),
  })
  const doctor = doctorQuery.data?.data
  const doctorSchedule = doctor?.doctorSchedule?.find(
    (item) =>
      (item.schedule?.id ?? item.scheduleId) === scheduleId &&
      !item.isBooked &&
      !item.schedule?.isBooked &&
      (item.schedule?.appointment?.length ?? 0) === 0,
  )
  const schedule = doctorSchedule?.schedule
  const startTime = schedule?.startDateTime
    ? new Date(schedule.startDateTime).getTime()
    : NaN
  const isAvailable =
    Boolean(schedule) && Number.isFinite(startTime)
  const payload: IAppointmentPayload = { doctorId, scheduleId }

  const handlePayment = async () => {
    if (startTime < Date.now()) {
      toast.error("This schedule has already passed. Please choose another.")
      router.push(`/consultations/doctor/${encodeURIComponent(doctorId)}`)
      return
    }

    setPaymentPending(true)
    try {
      const response = await createAppointment(payload)
      const paymentUrl = response.data?.paymentUrl
      if (!paymentUrl) {
        throw new Error(
          "The appointment was created, but the server did not return a Stripe checkout URL.",
        )
      }

      window.location.assign(paymentUrl)
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to start payment.",
      )
    } finally {
      setPaymentPending(false)
    }
  }

  const handlePayLater = async () => {
    if (startTime < Date.now()) {
      toast.error("This schedule has already passed. Please choose another.")
      router.push(`/consultations/doctor/${encodeURIComponent(doctorId)}`)
      return
    }

    setPayLaterPending(true)
    try {
      await bookAppointmentWithPayLater(payload)
      toast.success("Appointment booked. You can pay from your appointments.")
      router.push("/dashboard/myAppointment")
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to book this appointment.",
      )
    } finally {
      setPayLaterPending(false)
    }
  }

  if (!doctorId || !scheduleId) {
    return (
      <main className="mx-auto w-full max-w-3xl">
        <Card>
          <CardHeader>
            <CardTitle>Appointment details are missing</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Choose a doctor and an available schedule before continuing.
            </p>
          </CardContent>
          <CardFooter>
            <Button nativeButton={false} render={<Link href="/consultations" />}>
              Browse doctors
            </Button>
          </CardFooter>
        </Card>
      </main>
    )
  }

  if (doctorQuery.isPending) {
    return (
      <main className="mx-auto w-full max-w-3xl">
        <div
          className="h-80 animate-pulse rounded-xl bg-muted"
          role="status"
          aria-label="Loading appointment details"
        />
      </main>
    )
  }

  if (doctorQuery.isError || !doctor) {
    return (
      <main className="mx-auto w-full max-w-3xl">
        <Card>
          <CardHeader>
            <CardTitle>Unable to load appointment details</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-destructive">
              {doctorQuery.error?.message || "Doctor not found."}
            </p>
          </CardContent>
          <CardFooter>
            <Button variant="outline" onClick={() => void doctorQuery.refetch()}>
              Try again
            </Button>
          </CardFooter>
        </Card>
      </main>
    )
  }

  if (!isAvailable || !schedule) {
    return (
      <main className="mx-auto w-full max-w-3xl">
        <Card>
          <CardHeader>
            <CardTitle>That schedule is no longer available</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Please choose another appointment time.
            </p>
          </CardContent>
          <CardFooter>
            <Button nativeButton={false} render={<Link href="/consultations" />}>
              Browse available schedules
            </Button>
          </CardFooter>
        </Card>
      </main>
    )
  }

  const initials = doctor.name
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase())
    .join("")
    .slice(0, 2)

  return (
    <main className="mx-auto w-full max-w-3xl space-y-6">
      <Button
        variant="ghost"
        nativeButton={false}
        render={<Link href={`/consultations/doctor/${doctor.id}`} />}
      >
        <ArrowLeft aria-hidden="true" />
        Back to doctor
      </Button>

      <header className="space-y-2">
        <Badge variant="outline">Appointment booking</Badge>
        <h1 className="text-3xl font-bold tracking-tight">
          Review your appointment
        </h1>
        <p className="text-muted-foreground">
          Confirm the schedule and choose how you would like to pay.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Appointment details</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-5 sm:grid-cols-[auto_1fr]">
          <Avatar className="size-16">
            <AvatarImage src={doctor.profilePhoto || undefined} alt={doctor.name} />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <div className="space-y-2">
            <h2 className="font-semibold">{doctor.name}</h2>
            <p className="text-sm text-muted-foreground">
              {doctor.designation || "Doctor"}
            </p>
            <p className="flex items-center gap-2 text-sm">
              <CalendarDays aria-hidden="true" className="size-4 text-primary" />
              {formatDateTime(schedule.startDateTime!)}
            </p>
            {schedule.endDateTime && (
              <p className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock3 aria-hidden="true" className="size-4" />
                Ends {formatDateTime(schedule.endDateTime)}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Payment options</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between gap-4 rounded-lg bg-muted/50 p-4">
            <span className="text-sm text-muted-foreground">Appointment fee</span>
            <span className="text-xl font-bold">
              {doctor.appointmentFee != null
                ? `৳${Number(doctor.appointmentFee).toLocaleString()}`
                : "Fee not listed"}
            </span>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <Button
              className="h-auto min-h-16 justify-start whitespace-normal p-4 text-left"
              onClick={handlePayment}
              disabled={paymentPending || payLaterPending}
            >
              <CreditCard aria-hidden="true" />
              <span>
                <span className="block">Pay now</span>
                <span className="block text-xs font-normal opacity-80">
                  Continue to secure online payment
                </span>
              </span>
              {paymentPending && (
                <span className="sr-only">Starting payment…</span>
              )}
            </Button>
            <Button
              className="h-auto min-h-16 justify-start whitespace-normal p-4 text-left"
              variant="outline"
              onClick={handlePayLater}
              disabled={payLaterPending || paymentPending}
            >
              <Wallet aria-hidden="true" />
              <span>
                <span className="block">Pay later</span>
                <span className="block text-xs font-normal text-muted-foreground">
                  Book now and pay from your appointments
                </span>
              </span>
              {payLaterPending && (
                <span className="sr-only">Booking appointment…</span>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </main>
  )
}

export default BookAppointmentFlow
