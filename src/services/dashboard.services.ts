"use server";

import { httpClient } from "@/lib/axios/httpClient";
import type { ApiResponse } from "@/types/api.types";
import type { IAdminDashboardData } from "@/types/dashboard.types";


export async function getDashboardData(): Promise<ApiResponse<IAdminDashboardData>> {
    const response = await httpClient.get<IAdminDashboardData>("/stats")

    if (!response.success) {
      throw new Error(response.message || "An error occurred while fetching dashboard data.")
    }

    return response;
}