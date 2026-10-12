"use server"

import axios from "axios"
import { httpClient } from "@/lib/axios/httpClient"
import type { ApiErrorResponse, ApiResponse } from "@/types/api.types"
import type { ISchedule, ISchedulePayload } from "@/types/schedule.types"

export const getSchedules = async (
  queryString: string,
): Promise<ApiResponse<ISchedule[]>> => {
  try {
    const endpoint = queryString ? `/schedule?${queryString}` : "/schedule"
    return await httpClient.get<ISchedule[]>(endpoint)
  } catch (error) {
    if (axios.isAxiosError<ApiErrorResponse>(error)) {
      throw new Error(error.response?.data?.message || error.message)
    }

    throw error
  }
}

export const createSchedule = async (
  payload: ISchedulePayload,
): Promise<ApiResponse<ISchedule[]>> => {
  try {
    const response = await httpClient.post<ISchedule[]>("/schedule/create", payload)
    if (!response.success) {
      throw new Error(response.message || "Unable to create schedule.")
    }

    return response
  } catch (error) {
    if (axios.isAxiosError<ApiErrorResponse>(error)) {
      throw new Error(error.response?.data?.message || error.message)
    }

    throw error
  }
}

export const updateSchedule = async ({
  id,
  payload,
}: {
  id: string
  payload: ISchedulePayload
}): Promise<ApiResponse<ISchedule>> => {
  try {
    const response = await httpClient.patch<ISchedule>(
      `/schedule/${encodeURIComponent(id)}`,
      payload,
    )
    if (!response.success) {
      throw new Error(response.message || "Unable to update schedule.")
    }

    return response
  } catch (error) {
    if (axios.isAxiosError<ApiErrorResponse>(error)) {
      throw new Error(error.response?.data?.message || error.message)
    }

    throw error
  }
}

export const deleteSchedule = async (
  id: string,
): Promise<ApiResponse<boolean>> => {
  try {
    const response = await httpClient.delete<boolean>(
      `/schedule/${encodeURIComponent(id)}`,
    )
    if (!response.success) {
      throw new Error(response.message || "Unable to delete schedule.")
    }

    return response
  } catch (error) {
    if (axios.isAxiosError<ApiErrorResponse>(error)) {
      throw new Error(error.response?.data?.message || error.message)
    }

    throw error
  }
}
