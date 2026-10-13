"use server"

import axios from "axios"
import { httpClient } from "@/lib/axios/httpClient"
import type { ApiErrorResponse, ApiResponse } from "@/types/api.types"
import type {
  IDoctorSchedule,
  ISchedule,
} from "@/types/schedule.types"

const getDoctorSchedulePage = async (
  page: number,
): Promise<ApiResponse<IDoctorSchedule[]>> => {
  try {
    const response = await httpClient.get<IDoctorSchedule[]>(
      `/doctorSchedule/my?page=${page}&limit=100`,
    )
    if (!response.success) {
      throw new Error(response.message || "Unable to load your schedules.")
    }

    return response
  } catch (error) {
    if (axios.isAxiosError<ApiErrorResponse>(error)) {
      throw new Error(error.response?.data?.message || error.message)
    }

    throw error
  }
}

const getSchedulePage = async (page: number): Promise<ApiResponse<ISchedule[]>> => {
  try {
    const response = await httpClient.get<ISchedule[]>(
      `/schedule?page=${page}&limit=100`,
    )
    if (!response.success) {
      throw new Error(response.message || "Unable to load available schedules.")
    }

    return response
  } catch (error) {
    if (axios.isAxiosError<ApiErrorResponse>(error)) {
      throw new Error(error.response?.data?.message || error.message)
    }

    throw error
  }
}

export const getMyDoctorSchedules = async (): Promise<IDoctorSchedule[]> => {
  const firstPage = await getDoctorSchedulePage(1)
  const totalPages = Math.max(1, firstPage.meta?.totalPages ?? 1)

  if (totalPages === 1) {
    return firstPage.data
  }

  const remainingPages = await Promise.all(
    Array.from({ length: totalPages - 1 }, (_, index) =>
      getDoctorSchedulePage(index + 2),
    ),
  )

  return [firstPage, ...remainingPages].flatMap((page) => page.data)
}

export const getSchedulesToBook = async (): Promise<ISchedule[]> => {
  const firstPage = await getSchedulePage(1)
  const totalPages = Math.max(1, firstPage.meta?.totalPages ?? 1)

  if (totalPages === 1) {
    return firstPage.data
  }

  const remainingPages = await Promise.all(
    Array.from({ length: totalPages - 1 }, (_, index) =>
      getSchedulePage(index + 2),
    ),
  )

  return [firstPage, ...remainingPages].flatMap((page) => page.data)
}

export const bookDoctorSchedules = async (
  scheduleIds: string[],
): Promise<ApiResponse<IDoctorSchedule[]>> => {
  try {
    const response = await httpClient.post<IDoctorSchedule[]>(
      "/doctorSchedule/create",
      { scheduleIds },
    )
    if (!response.success) {
      throw new Error(response.message || "Unable to book the selected schedules.")
    }

    return response
  } catch (error) {
    if (axios.isAxiosError<ApiErrorResponse>(error)) {
      throw new Error(error.response?.data?.message || error.message)
    }

    throw error
  }
}

export const updateMyDoctorSchedules = async (
  scheduleIds: Array<{ id: string; shouldDelete: boolean }>,
): Promise<ApiResponse<{ count: number }>> => {
  try {
    const response = await httpClient.patch<{ count: number }>(
      "/doctorSchedule/update",
      { scheduleIds },
    )
    if (!response.success) {
      throw new Error(response.message || "Unable to update your schedules.")
    }

    return response
  } catch (error) {
    if (axios.isAxiosError<ApiErrorResponse>(error)) {
      throw new Error(error.response?.data?.message || error.message)
    }

    throw error
  }
}

export const deleteMyDoctorSchedule = async (
  scheduleId: string,
): Promise<ApiResponse<boolean>> => {
  try {
    const response = await httpClient.delete<boolean>(
      `/doctorSchedule/${encodeURIComponent(scheduleId)}`,
    )
    if (!response.success) {
      throw new Error(response.message || "Unable to remove your schedule.")
    }

    return response
  } catch (error) {
    if (axios.isAxiosError<ApiErrorResponse>(error)) {
      throw new Error(error.response?.data?.message || error.message)
    }

    throw error
  }
}
