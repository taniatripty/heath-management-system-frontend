"use server";

import jwt, { JwtPayload } from "jsonwebtoken";
import { setCookie } from "./cookieUtils";

const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET;

 const getTokenRemainingTime = (token: string): number => {
  if (!token) return 0;

  try {
    const payload = JWT_ACCESS_SECRET
      ? (jwt.verify(token, JWT_ACCESS_SECRET) as JwtPayload)
      : (jwt.decode(token) as JwtPayload | null);

    if (
      !payload ||
      typeof payload !== "object" ||
      typeof payload.exp !== "number"
    ) {
      return 0;
    }

    const remainingSeconds = payload.exp - Math.floor(Date.now() / 1000);
    return remainingSeconds > 0 ? remainingSeconds : 0;
  } catch (error) {
    console.error("Error decoding token:", error);
    return 0;
  }
};

export const setTokenInCookie = async (
  name: string,
  token: string,
  fallbackMaxAgeInSeconds = 60 * 60 * 24,
) => {
  const maxAgeInSeconds =
    getTokenRemainingTime(token) || fallbackMaxAgeInSeconds;
  await setCookie(name, token, maxAgeInSeconds);
};

export async function isTokenExpiringSoon(token:string, thresoldInSecond=300):Promise<boolean>{
  const remainingSeconds=getTokenRemainingTime(token)
  return remainingSeconds>0 && remainingSeconds <=thresoldInSecond

}
