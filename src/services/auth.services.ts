"use server";

import { setTokenInCookie } from "@/lib/tokenUtils";

// import { httpClient } from "@/lib/axios/httpClient";
// import { getCookie } from "@/lib/cookieUtils";
// import { setTokenInCookie } from "@/lib/tokenUtils";
// import { ApiErrorResponse } from "@/types/api.types";

// export interface RefreshTokenResponse {
//   accessToken: string;
//   refreshToken?: string;
// }

// export const refreshToken = async (): Promise<
//   RefreshTokenResponse | ApiErrorResponse
// > => {
//   const storedRefreshToken = await getCookie("refreshToken");

//   if (!storedRefreshToken) {
//     return {
//       success: false,
//       message: "Refresh token is not available",
//     };
//   }

//   try {
//     const response = await httpClient.post<RefreshTokenResponse>(
//       "/auth/refresh-token",
//       { refreshToken: storedRefreshToken },
//     );
//     const nextRefreshToken = response.data.refreshToken ?? storedRefreshToken;

//     await setTokenInCookie("accessToken", response.data.accessToken);
//     await setTokenInCookie("refreshToken", nextRefreshToken);

//     return {
//       ...response.data,
//       refreshToken: nextRefreshToken,
//     };
//   } catch (error: unknown) {
//     return {
//       success: false,
//       message: error instanceof Error ? error.message : "Token refresh failed",
//     };
//   }
// };

const BASE_API_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

if (!BASE_API_URL) {
  throw new Error("NEXT_PUBLIC_API_BASE_URL is not defined");
}

export const getNewTokenWithRefreshToken = async (
  refreshToken: string,
): Promise<boolean> => {
  try {
    const res = await fetch(`${BASE_API_URL}/auth/refresh-token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        cookie: `refreshToken=${refreshToken}`,
      },
    });
    if (!res.ok) {
      return false;
    }
    const { data } = await res.json();
    const { accessToken, refreshToken: newRefreshToken, token } = data;
    if (accessToken) {
      await setTokenInCookie("accessToken", accessToken);
    }

    if (newRefreshToken) {
      await setTokenInCookie("refreshToken", newRefreshToken);
    }

    if (token) {
      await setTokenInCookie("better-auth.session_token", token, 24 * 60 * 60); // 1 day in seconds
    }

    return true;
  } catch (error) {
    console.log("fail to get new refresh token", error);
    return false;
  }
  
};
