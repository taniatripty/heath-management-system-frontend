"use server"

import { httpClient } from "@/lib/axios/httpClient";
import { ApiErrorResponse } from "@/types/api.types";
import { LoginResponse } from "@/types/auth.types";
import { ILogInpayload,loginZodSchema } from "@/zod/auth.validation";
export const logInactions = async (
  payLoad: ILogInpayload,
): Promise<LoginResponse | ApiErrorResponse> => {
  const parsepaylod = loginZodSchema.safeParse(payLoad);
  if (!parsepaylod.success) {
    const firstError = parsepaylod.error.issues[0].message || "Invalid input";
    return {
      success: false,
      message: firstError,
      error: firstError,
    };
  }
  try {
    const response = await httpClient.post<LoginResponse>(
      "/auth/login",
      parsepaylod.data,
    );
    const{ accessToken,refreshToken ,token,user}=response.data
    return response.data;
  } catch (error) {
    return {
      success: false,
      message: "Login failed",
      error: "Login failed",
    };
  }
};
