import DoctorTable from '@/components/module/Admin/DoctorManagement/DoctorTable'
import { getDoctors } from '@/services/doctor.services'
import { dehydrate,  HydrationBoundary, QueryClient } from '@tanstack/react-query'
import React from 'react'
import { Doc } from 'zod/v4/core'

export default async function DoctorManagementPage() {
  const queryClient = new QueryClient()
  await queryClient.query({
    queryKey: ['doctors'],
    queryFn: getDoctors,
    staleTime: 1000 * 60 * 60, // Cache the data for 1 hour
    gcTime: 1000 * 60 * 60, // Garbage collect the data after 1 hour

  })
  return (
   
    <HydrationBoundary state={dehydrate(queryClient)}>
    <DoctorTable />
    </HydrationBoundary>
  )
}
