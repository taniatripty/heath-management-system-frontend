"use client"

/* eslint-disable @typescript-eslint/no-explicit-any */


import { getDoctors } from "@/app/(commonlayout)/consultations/_actions"
import { useQuery } from "@tanstack/react-query"
const DoctorList=()=>{
    const {data}=useQuery({
        queryKey:['doctors'],
        queryFn:()=>getDoctors()
    })
    console.log(data)
    return(
        <div>
            {data?.data?.map((doctor:any)=>(
                <div key={doctor.id}>
                    <h2>{doctor.name}</h2>
                   
                </div>
            ))}
        </div>
    )

}
export default DoctorList