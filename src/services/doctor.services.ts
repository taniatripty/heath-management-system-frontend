"use server"

import { httpClient } from "@/lib/axios/httpClient"
import type { ApiResponse } from "@/types/api.types"
import type { IDoctor } from "@/types/doctor.types"

export const getDoctors = async (): Promise<ApiResponse<IDoctor[]>> => {
  const response = await httpClient.get<IDoctor[]>("/getdoctor")

  if (!response.success) {
    throw new Error(response.message || "An error occurred while fetching doctors.")
  }

  return response
}