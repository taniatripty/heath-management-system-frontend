"use client"
import { getDoctors } from '@/services/doctor.services'
import { useQuery } from '@tanstack/react-query'
import React from 'react'

export default function DoctorTable() {
    const {data:doctorDataResponse}=useQuery({
        queryKey: ['doctors'],
        queryFn: getDoctors,})

        const {data:doctors}=doctorDataResponse! || []
  return (
    <div>DoctorTable</div>
  )
}
