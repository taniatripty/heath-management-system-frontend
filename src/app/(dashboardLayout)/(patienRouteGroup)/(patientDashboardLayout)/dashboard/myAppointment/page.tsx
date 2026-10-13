"use client"

import { useState } from "react"
import Link from "next/link"
import { useQuery } from "@tanstack/react-query"
import { CalendarDays, Clock3, CreditCard } from "lucide-react"
import { toast } from "sonner"
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
  getMyAppointments,
  initiateAppointmentPayment,
} from "@/services/appointment.services"

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

export default function MyAppointmentPage() {
  const [payingAppointmentId, setPayingAppointmentId] = useState<string | null>(
    null,
  )
  const appointmentsQuery = useQuery({
    queryKey: ["appointments", "mine"],
    queryFn: getMyAppointments,
  })
  const appointments = appointmentsQuery.data?.data ?? []

  const payForAppointment = async (appointmentId: string) => {
    if (!appointmentId) {
      toast.error("This appointment is missing its ID. Refresh and try again.")
      return
    }

    setPayingAppointmentId(appointmentId)
    try {
      const response = await initiateAppointmentPayment(appointmentId)
      if (!response.success) {
        throw new Error(response.message)
      }

      const paymentData = response.data
      const paymentUrl =
        paymentData?.paymentUrl ||
        paymentData?.checkoutUrl ||
        paymentData?.url ||
        paymentData?.payment?.paymentUrl ||
        paymentData?.payment?.checkoutUrl ||
        paymentData?.payment?.url ||
        paymentData?.data?.paymentUrl ||
        paymentData?.data?.checkoutUrl ||
        paymentData?.data?.url
      if (!paymentUrl) {
        throw new Error(
          "Payment could not be started because the server did not return a checkout URL.",
        )
      }
      window.location.assign(paymentUrl)
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to start payment.",
      )
    } finally {
      setPayingAppointmentId(null)
    }
  }

  return (
    <main className="mx-auto w-full max-w-5xl space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Badge variant="outline">Patient dashboard</Badge>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">
            My appointments
          </h1>
          <p className="mt-1 text-muted-foreground">
            View your bookings and complete any outstanding payments.
          </p>
        </div>
        <Button nativeButton={false} render={<Link href="/consultations" />}>
          Book an appointment
        </Button>
      </header>

      {appointmentsQuery.isPending ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 4 }, (_, index) => (
            <div
              key={index}
              className="h-48 animate-pulse rounded-xl bg-muted"
              role="status"
              aria-label="Loading appointments"
            />
          ))}
        </div>
      ) : appointmentsQuery.isError ? (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="font-medium">Unable to load your appointments.</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {appointmentsQuery.error.message}
            </p>
            <Button
              className="mt-4"
              variant="outline"
              onClick={() => void appointmentsQuery.refetch()}
            >
              Try again
            </Button>
          </CardContent>
        </Card>
      ) : appointments.length ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {appointments.map((appointment) => {
            const isPaid =
              appointment.paymentStatus?.toUpperCase() === "PAID" ||
              appointment.payment?.status?.toUpperCase() === "PAID"

            return (
              <Card key={appointment.id}>
                <CardHeader className="flex-row items-start justify-between gap-3">
                  <div>
                    <CardTitle>{appointment.doctor?.name || "Doctor"}</CardTitle>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {appointment.doctor?.appointmentFee != null
                        ? `৳${Number(appointment.doctor.appointmentFee).toLocaleString()}`
                        : "Appointment"}
                    </p>
                  </div>
                  <Badge variant={isPaid ? "secondary" : "outline"}>
                    {isPaid ? "Paid" : appointment.paymentStatus || "Payment due"}
                  </Badge>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <p className="flex items-center gap-2">
                    <CalendarDays
                      aria-hidden="true"
                      className="size-4 text-primary"
                    />
                    {formatDateTime(appointment.schedule?.startDateTime)}
                  </p>
                  {appointment.schedule?.endDateTime && (
                    <p className="flex items-center gap-2 text-muted-foreground">
                      <Clock3 aria-hidden="true" className="size-4" />
                      Ends {formatDateTime(appointment.schedule.endDateTime)}
                    </p>
                  )}
                  {appointment.status && (
                    <p className="text-muted-foreground">
                      Appointment status: {appointment.status}
                    </p>
                  )}
                </CardContent>
                {!isPaid && (
                  <CardFooter>
                    <Button
                      className="w-full"
                      onClick={() => void payForAppointment(appointment.id)}
                      disabled={payingAppointmentId !== null}
                    >
                      <CreditCard aria-hidden="true" />
                      {payingAppointmentId === appointment.id
                        ? "Starting payment…"
                        : "Pay now"}
                    </Button>
                  </CardFooter>
                )}
              </Card>
            )
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="p-10 text-center">
            <p className="font-medium">You have no appointments yet.</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Browse available doctors and choose a schedule to book.
            </p>
            <Button
              className="mt-4"
              nativeButton={false}
              render={<Link href="/consultations" />}
            >
              Find a doctor
            </Button>
          </CardContent>
        </Card>
      )}
    </main>
  )
}
