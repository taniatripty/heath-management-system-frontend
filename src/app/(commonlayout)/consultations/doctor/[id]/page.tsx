import DoctorProfile from "@/components/module/consultation/DoctorProfile"

const DoctorByIdPage = async ({
  params,
}: {
  params: Promise<{ id: string }>
}) => {
  const { id } = await params

  return <DoctorProfile doctorId={id} />
}

export default DoctorByIdPage
