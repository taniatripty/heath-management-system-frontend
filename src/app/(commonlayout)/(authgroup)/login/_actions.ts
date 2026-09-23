/* eslint-disable @typescript-eslint/no-explicit-any */

"use server" 
import { httpClient } from "@/lib/axios/httpClient";

import { LoginResponse } from "@/types/auth.types";
import { ILogInpayload, loginZodSchema } from "@/zod/auth.validation";
import { setTokenInCookie } from "@/lib/tokenUtils";
import { redirect } from "next/navigation";
import { ApiErrorResponse } from "@/types/api.types";
import { getDefaultDashboardRoute, isvalidatedredirectforRole, UserRole } from "@/lib/authUtils";


export const logInactions= async (payload : ILogInpayload, redirectPath?: string ) : Promise<LoginResponse | ApiErrorResponse> =>{
    const parsedPayload = loginZodSchema.safeParse(payload);

    if(!parsedPayload.success){
        const firstError = parsedPayload.error.issues[0].message || "Invalid input";
        return {
            success: false,
            message: firstError,
        }
    }
    try {

        const response = await httpClient.post<LoginResponse>("/auth/login", parsedPayload.data);
        console.log(response.data);

        const { accessToken, refreshToken, token, user} = response.data;
        const {emailVerified,role,needPasswordChange,email}=user
        await setTokenInCookie("accessToken", accessToken);
        await setTokenInCookie("refreshToken", refreshToken);
        await setTokenInCookie("better-auth.session_token", token, 24 * 60 * 60); // 1 day in seconds

        if(!emailVerified){
            redirect("/verifyEmail")

        }
        if(needPasswordChange){
            redirect(`/resetPass?email=${email}`)
        }
        else{
             const targetpath=redirectPath && isvalidatedredirectforRole(redirectPath ,role as UserRole)? redirectPath :getDefaultDashboardRoute(role as UserRole)
             console.log(targetpath, "t")
             redirect(targetpath)
        }

       
        
    } catch (error : any) {
    if(error && typeof error === "object" && "digest" in error && typeof error.digest === "string" && error.digest.startsWith("NEXT_REDIRECT")){
        throw error;
    }
        return {
            success: false,
            message: `Login failed: ${error.message}`,
        }
    }
}