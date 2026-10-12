import DoctorScheduleTable from "@/components/module/Doctor/DoctorSchedule/DoctorScheduleTable"

export default function MySchedulePage() {
  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">My schedule</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Review your schedule for today and tomorrow, including which time slots
          have been booked.
        </p>
      </div>
      <DoctorScheduleTable />
    </section>
  )
}
