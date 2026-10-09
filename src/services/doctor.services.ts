"use server"

import { httpClient } from "@/lib/axios/httpClient"

import type { IDoctor } from "@/types/doctor.types"

// export const getDoctors = async (): Promise<ApiResponse<IDoctor[]>> => {
//   const response = await httpClient.get<IDoctor[]>("/getdoctor")

//   if (!response.success) {
//     throw new Error(response.message || "An error occurred while fetching doctors.")
//   }

//   return response
// }

export const getDoctors = async (queryString = "") => {
    try {
        const endpoint = queryString ? `/getdoctor?${queryString}` : "/getdoctor";
        const doctors = await httpClient.get<IDoctor[]>(endpoint);
        return doctors;
    } catch (error) {
        console.log("Error fetching doctors:", error);
        throw error;
    }
}