"use server"

import { httpClient } from "@/lib/axios/httpClient"

import type { ApiErrorResponse, ApiResponse } from "@/types/api.types"
import type {
    ICreateDoctorPayload,
    IDoctor,
    IDoctorDetails,
    ISpecialty,
    IUpdateDoctorPayload,
} from "@/types/doctor.types"
import axios from "axios"

// export const getDoctors = async (): Promise<ApiResponse<IDoctor[]>> => {
//   const response = await httpClient.get<IDoctor[]>("/getdoctor")

//   if (!response.success) {
//     throw new Error(response.message || "An error occurred while fetching doctors.")
//   }

//   return response
// }

export const getDoctors = async (
    queryString = "",
): Promise<ApiResponse<IDoctor[]>> => {
    try {
        const endpoint = queryString ? `/getdoctor?${queryString}` : "/getdoctor";
        const doctors = await httpClient.get<IDoctor[]>(endpoint);

        if (Array.isArray(doctors)) {
            return {
                success: true,
                message: "",
                data: doctors,
            };
        }

        if (!doctors.success) {
            throw new Error(doctors.message || "Unable to load doctors.");
        }

        return doctors;
    } catch (error) {
        if (axios.isAxiosError<ApiErrorResponse>(error)) {
            throw new Error(error.response?.data?.message || error.message);
        }

        throw error;
    }
}

export const getAllDoctors = async (): Promise<ApiResponse<IDoctor[]>> => {
    const firstPage = await getDoctors("page=1&limit=100");
    const totalPages = Math.max(1, firstPage.meta?.totalPages ?? 1);

    if (totalPages === 1) {
        return firstPage;
    }

    const remainingPages = await Promise.all(
        Array.from({ length: totalPages - 1 }, (_, index) =>
            getDoctors(`page=${index + 2}&limit=100`),
        ),
    );

    return {
        ...firstPage,
        data: [firstPage, ...remainingPages].flatMap((page) => page.data),
    };
}

export const getDoctorById = async (id: string | number): Promise<ApiResponse<IDoctorDetails>> => {
    try {
        const response = await httpClient.get<IDoctorDetails>(
            `/getdoctor/${encodeURIComponent(String(id))}`,
        )

        if (!response.success) {
            throw new Error(response.message || "Unable to load doctor details.")
        }

        return response
    } catch (error) {
        if (axios.isAxiosError<ApiErrorResponse>(error)) {
            throw new Error(error.response?.data?.message || error.message)
        }

        throw error
    }
}

export const getSpecialties = async (): Promise<ApiResponse<ISpecialty[]>> => {
    try {
        const response = await httpClient.get<ISpecialty[]>("/specialities")

        if (!response.success) {
            throw new Error(response.message || "Unable to load specialties.")
        }

        return response
    } catch (error) {
        if (axios.isAxiosError<ApiErrorResponse>(error)) {
            throw new Error(error.response?.data?.message || error.message)
        }

        throw error
    }
}

export const createDoctor = async (
    payload: ICreateDoctorPayload,
): Promise<ApiResponse<IDoctor>> => {
    try {
        const response = await httpClient.post<IDoctor>("/manage/createdoctors", payload)

        if (!response.success) {
            throw new Error(response.message || "Unable to create doctor.")
        }

        return response
    } catch (error) {
        if (axios.isAxiosError<ApiErrorResponse>(error)) {
            throw new Error(error.response?.data?.message || error.message)
        }

        throw error
    }
}

export const updateDoctor = async ({
    id,
    payload,
}: {
    id: string
    payload: IUpdateDoctorPayload
}): Promise<ApiResponse<IDoctor>> => {
    try {
        const response = await httpClient.patch<IDoctor>(`/getdoctor/${encodeURIComponent(id)}`, payload)

        if (!response.success) {
            throw new Error(response.message || "Unable to update doctor.")
        }

        return response
    } catch (error) {
        if (axios.isAxiosError<ApiErrorResponse>(error)) {
            throw new Error(error.response?.data?.message || error.message)
        }

        throw error
    }
}

export const deleteDoctor = async (id: string | number): Promise<ApiResponse<{ message: string }>> => {
    try {
        const response = await httpClient.delete<{ message: string }>(
            `/getdoctor/${encodeURIComponent(String(id))}`,
        )

        if (!response.success) {
            throw new Error(response.message || "Unable to delete doctor.")
        }

        return response
    } catch (error) {
        if (axios.isAxiosError<ApiErrorResponse>(error)) {
            throw new Error(error.response?.data?.message || error.message)
        }

        throw error
    }
}