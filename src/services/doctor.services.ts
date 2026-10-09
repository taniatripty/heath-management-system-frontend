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

export const getDoctors = async (queryString: string) => {
    try {
        const endpoint = queryString ? `/getdoctor?${queryString}` : "/getdoctor";
        const doctors = await httpClient.get<IDoctor[]>(endpoint);

        // The API may return the list directly instead of wrapping it in { data }.
        if (Array.isArray(doctors)) {
            return {
                success: true,
                message: "",
                data: doctors,
            };
        }

        return doctors;
    } catch (error) {
        console.log("Error fetching doctors:", error);
        throw error;
    }
}