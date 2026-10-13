import { HydrationBoundary, dehydrate, QueryClient } from "@tanstack/react-query"
import DoctorList from "@/components/module/consultation/DoctorList"
import { getAllDoctors } from "@/services/doctor.services"

const ConsultationPage = async () => {
  const queryClient = new QueryClient()
  await queryClient.query({
    queryKey: ["doctors", "all"],
    queryFn: getAllDoctors,
  })

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <DoctorList />
    </HydrationBoundary>
  )
}

export default ConsultationPage
