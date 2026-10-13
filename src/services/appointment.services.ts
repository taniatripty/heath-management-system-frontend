"use server"

import axios from "axios"
import { httpClient } from "@/lib/axios/httpClient"
import type { ApiErrorResponse, ApiResponse } from "@/types/api.types"
import type {
  IAppointment,
  IAppointmentPayload,
  IAppointmentResult,
  IInitiatePaymentResult,
  IPaymentLink,
} from "@/types/appointment.types"

const getError = (error: unknown): Error => {
  if (axios.isAxiosError<ApiErrorResponse>(error)) {
    return new Error(error.response?.data?.message || error.message)
  }

  return error instanceof Error ? error : new Error("An unexpected error occurred.")
}

export const createAppointment = async (
  payload: IAppointmentPayload,
): Promise<ApiResponse<IAppointmentResult>> => {
  try {
    const response = await httpClient.post<IAppointmentResult>(
      "/bookappointment/create",
      payload,
    )
    if (!response.success) {
      throw new Error(response.message || "Unable to book this appointment.")
    }

    return response
  } catch (error) {
    throw getError(error)
  }
}

export const bookAppointmentWithPayLater = async (
  payload: IAppointmentPayload,
): Promise<ApiResponse<IAppointmentResult>> => {
  try {
    const response = await httpClient.post<IAppointmentResult>(
      "/bookappointment/bookwithpaylatter",
      payload,
    )
    if (!response.success) {
      throw new Error(response.message || "Unable to book this appointment.")
    }

    return response
  } catch (error) {
    throw getError(error)
  }
}

export const initiateAppointmentPayment = async (
  appointmentId: string,
): Promise<IInitiatePaymentResult> => {
  try {
    const response = await httpClient.post<IPaymentLink>(
      `/bookappointment/initiatePayment/${encodeURIComponent(appointmentId)}`,
      {},
    )
    if (!response.success) {
      return {
        success: false,
        message: response.message || "Unable to start payment.",
      }
    }

    return { success: true, data: response.data }
  } catch (error) {
    const message = getError(error).message
    console.error("Unable to initiate appointment payment:", message)
    return { success: false, message }
  }
}

export const getMyAppointments = async (): Promise<ApiResponse<IAppointment[]>> => {
  try {
    const response = await httpClient.get<IAppointment[]>("/bookappointment")
    if (!response.success) {
      throw new Error(response.message || "Unable to load your appointments.")
    }

    return response
  } catch (error) {
    throw getError(error)
  }
}
