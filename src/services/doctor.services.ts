import type { ApiResponse } from "@/types/api.types"
import type { IDoctor } from "@/types/doctor.types"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL

export const getDoctors = async (): Promise<ApiResponse<IDoctor[]>> => {
  if (!API_BASE_URL) {
    throw new Error("NEXT_PUBLIC_API_BASE_URL is not defined")
  }

  const response = await fetch(
    `${API_BASE_URL.replace(/\/$/, "")}/getdoctor`,
    {
      method: "GET",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
    },
  )
  const result = (await response.json()) as ApiResponse<IDoctor[]>

  if (!response.ok) {
    throw new Error(
      result.message || `Failed to fetch doctors (${response.status})`,
    )
  }

  return result
}