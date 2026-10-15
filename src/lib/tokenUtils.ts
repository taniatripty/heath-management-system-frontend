import jwt, { JwtPayload } from "jsonwebtoken";
import { setCookie } from "./cookieUtils";



 const getTokenRemainingTime = (token: string): number => {
  if (!token) return 0;

  try {
    const payload = jwt.decode(token) as JwtPayload;

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
  const maxAgeInSeconds = getTokenMaxAgeInSeconds(
    token,
    fallbackMaxAgeInSeconds,
  );
  await setCookie(name, token, maxAgeInSeconds);
};

export function getTokenMaxAgeInSeconds(
  token: string,
  fallbackMaxAgeInSeconds = 60 * 60 * 24,
): number {
  return getTokenRemainingTime(token) || fallbackMaxAgeInSeconds;
}

export async function isTokenExpiringSoon(
  token: string,
  thresholdInSeconds = 300,
): Promise<boolean> {
  const remainingSeconds = getTokenRemainingTime(token);
  return remainingSeconds <= thresholdInSeconds;
}
