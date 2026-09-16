import { HydrationBoundary,dehydrate, QueryClient } from '@tanstack/react-query'
import React from 'react'
import { getDoctors } from './_actions'
import DoctorsList from '@/components/module/consultation/DoctorList'

const ConsultationPage= async()=> {
  const queryClient = new QueryClient()
  await queryClient.query({
    queryKey: ['doctors'],
    queryFn: getDoctors
  })
  

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>

      <DoctorsList />
   </HydrationBoundary>
   
  )  
}
export default ConsultationPage

