import BookAppointmentFlow from "@/components/module/consultation/BookAppointmentFlow"

const BookAppointmentPage = async ({
  searchParams,
}: {
  searchParams: Promise<{ doctorId?: string; scheduleId?: string }>
}) => {
  const { doctorId = "", scheduleId = "" } = await searchParams

  return (
    <BookAppointmentFlow doctorId={doctorId} scheduleId={scheduleId} />
  )
}

export default BookAppointmentPage
