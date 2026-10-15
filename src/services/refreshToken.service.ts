export interface RefreshedAuthTokens {
  accessToken: string;
  refreshToken?: string;
  sessionToken?: string;
}

const BASE_API_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

if (!BASE_API_URL) {
  throw new Error("NEXT_PUBLIC_API_BASE_URL is not defined");
}

export async function requestRefreshedTokens(
  refreshToken: string,
): Promise<RefreshedAuthTokens> {
  if (!refreshToken) {
    throw new Error("A refresh token is required");
  }

  const response = await fetch(`${BASE_API_URL}/auth/refresh-token`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      Cookie: `refreshToken=${refreshToken}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Token refresh failed: ${response.status} ${response.statusText}`);
  }

  const payload: unknown = await response.json();
  if (!payload || typeof payload !== "object") {
    throw new Error("Token refresh returned an invalid response");
  }

  const root = payload as Record<string, unknown>;
  const data =
    root.data && typeof root.data === "object"
      ? (root.data as Record<string, unknown>)
      : root;

  if (typeof data.accessToken !== "string" || !data.accessToken) {
    throw new Error("Token refresh response did not include an access token");
  }

  return {
    accessToken: data.accessToken,
    ...(typeof data.refreshToken === "string"
      ? { refreshToken: data.refreshToken }
      : {}),
    ...(typeof data.token === "string" ? { sessionToken: data.token } : {}),
  };
}
