"use server";

import { setTokenInCookie } from "@/lib/tokenUtils";
import { cookies } from "next/headers";
import { requestRefreshedTokens } from "./refreshToken.service";

const BASE_API_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

if (!BASE_API_URL) {
  throw new Error("NEXT_PUBLIC_API_BASE_URL is not defined");
}

const buildCookieHeader = (
  ...cookiesToUse: Array<[string, string | undefined]>
) =>
  cookiesToUse
    .map(([name, value]) => (value ? `${name}=${value}` : null))
    .filter((cookie): cookie is string => Boolean(cookie))
    .join("; ");

export const getNewTokenWithRefreshToken = async (
  refreshToken: string,
): Promise<boolean> => {
  if (!refreshToken) {
    return false;
  }

  try {
    const tokens = await requestRefreshedTokens(refreshToken);
    await setTokenInCookie("accessToken", tokens.accessToken);

    if (tokens.refreshToken) {
      await setTokenInCookie("refreshToken", tokens.refreshToken);
    }

    if (tokens.sessionToken) {
      await setTokenInCookie(
        "better-auth.session_token",
        tokens.sessionToken,
        24 * 60 * 60,
      );
    }

    return true;
  } catch (error) {
    console.error("Failed to get a new refresh token:", error);
    return false;
  }
};

export async function getUserInfo(
  accessTokenOverride?: string,
  sessionTokenOverride?: string,
) {
  try {
    const cookieStore = await cookies();
    const accessToken =
      accessTokenOverride ?? cookieStore.get("accessToken")?.value;
    const sessionToken =
      sessionTokenOverride ?? cookieStore.get("better-auth.session_token")?.value;

    if (!accessToken) {
      return null;
    }

    const cookieHeader = buildCookieHeader(
      ["accessToken", accessToken],
      ["better-auth.session_token", sessionToken],
    );

    const res = await fetch(`${BASE_API_URL}/auth/me`, {
      method: "GET",
      cache: "no-store",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...(cookieHeader ? { Cookie: cookieHeader } : {}),
      },
    });

    if (!res.ok) {
      console.error("Failed to fetch user info:", res.status, res.statusText);
      return null;
    }

    const payload = await res.json();
    return payload?.data ?? payload;
  } catch (error) {
    console.error("Error fetching user info:", error);
    return null;
  }
}
