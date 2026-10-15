import { NextRequest, NextResponse } from "next/server";
import {
  getDefaultDashboardRoute,
  getRouteOwner,
  isAuthRoute,
  UserRole,
} from "./lib/authUtils";
import { jwtutils } from "./lib/jwtUtils";
import {
  getTokenMaxAgeInSeconds,
  isTokenExpiringSoon,
} from "./lib/tokenUtils";
import { getUserInfo } from "./services/auth.services";
import {
  RefreshedAuthTokens,
  requestRefreshedTokens,
} from "./services/refreshToken.service";

async function refreshTokenMiddleware(
  refreshToken: string,
): Promise<RefreshedAuthTokens | null> {
  try {
    return await requestRefreshedTokens(refreshToken);
  } catch (error) {
    console.error("Error refreshing token in middleware:", error);
    return null;
  }
}

export async function proxy(request: NextRequest) {
  try {
    const { pathname } = request.nextUrl;
    let accessToken = request.cookies.get("accessToken")?.value;
    let refreshToken = request.cookies.get("refreshToken")?.value;
    let refreshedTokens: RefreshedAuthTokens | null = null;
    const requestHeaders = new Headers(request.headers);

    const withRefreshedCookies = (response: NextResponse) => {
      const tokens = refreshedTokens;
      if (!tokens) {
        return response;
      }

      const cookieOptions = {
        httpOnly: true,
        secure: true,
        sameSite: "strict" as const,
        path: "/",
      };

      response.cookies.set("accessToken", tokens.accessToken, {
        ...cookieOptions,
        maxAge: getTokenMaxAgeInSeconds(tokens.accessToken),
      });

      if (tokens.refreshToken) {
        response.cookies.set("refreshToken", tokens.refreshToken, {
          ...cookieOptions,
          maxAge: getTokenMaxAgeInSeconds(tokens.refreshToken),
        });
      }

      if (tokens.sessionToken) {
        response.cookies.set(
          "better-auth.session_token",
          tokens.sessionToken,
          {
            ...cookieOptions,
            maxAge: getTokenMaxAgeInSeconds(tokens.sessionToken),
          },
        );
      }

      return response;
    };

    const nextResponse = () =>
      withRefreshedCookies(
        NextResponse.next({
          request: {
            headers: requestHeaders,
          },
        }),
      );

    const redirectResponse = (url: URL) =>
      withRefreshedCookies(NextResponse.redirect(url));

    const initialTokenIsValid =
      accessToken &&
      jwtutils.verifyToken(
        accessToken,
        process.env.JWT_ACCESS_SECRET as string,
      ).success;

    if (
      refreshToken &&
      (!accessToken ||
        !initialTokenIsValid ||
        (await isTokenExpiringSoon(accessToken)))
    ) {
      refreshedTokens = await refreshTokenMiddleware(refreshToken);

      if (refreshedTokens) {
        accessToken = refreshedTokens.accessToken;
        refreshToken = refreshedTokens.refreshToken ?? refreshToken;
        requestHeaders.set("x-token-refreshed", "1");

        const requestCookies = new Map<string, string>();
        for (const { name, value } of request.cookies.getAll()) {
          if (
            name !== "accessToken" &&
            name !== "refreshToken" &&
            name !== "better-auth.session_token"
          ) {
            requestCookies.set(name, value);
          }
        }
        requestCookies.set("accessToken", accessToken);
        requestCookies.set("refreshToken", refreshToken);
        const sessionToken =
          refreshedTokens.sessionToken ??
          request.cookies.get("better-auth.session_token")?.value;
        if (sessionToken) {
          requestCookies.set(
            "better-auth.session_token",
            sessionToken,
          );
        }
        requestHeaders.set(
          "cookie",
          Array.from(requestCookies, ([name, value]) => `${name}=${value}`).join(
            "; ",
          ),
        );
      }
    }

    const decodedAccessToken =
      accessToken &&
      jwtutils.verifyToken(accessToken, process.env.JWT_ACCESS_SECRET as string)
        .data;

    const isValidAccessToken =
      accessToken &&
      jwtutils.verifyToken(accessToken, process.env.JWT_ACCESS_SECRET as string)
        .success;

    let userRole: UserRole | null = null;

    if (decodedAccessToken) {
      userRole = decodedAccessToken.role as UserRole;
    }

    const routerOwner = getRouteOwner(pathname);
    userRole = userRole === "SUPER_ADMIN" ? "ADMIN" : userRole;
    const isAuth = isAuthRoute(pathname);

    if (isAuth && isValidAccessToken) {
      return redirectResponse(
        new URL(getDefaultDashboardRoute(userRole as UserRole), request.url),
      );
    }

    if (pathname === "/restPass") {
      const email = request.nextUrl.searchParams.get("email");

      if (accessToken && email) {
        const userInfo = await getUserInfo(
          accessToken,
          refreshedTokens?.sessionToken,
        );

        if (userInfo.needPasswordChange) {
          return nextResponse();
        }

        return redirectResponse(
          new URL(getDefaultDashboardRoute(userRole as UserRole), request.url),
        );
      }

      if (email) {
        return nextResponse();
      }

      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return redirectResponse(loginUrl);
    }

    if (routerOwner === null) {
      return nextResponse();
    }

    if (!accessToken || !isValidAccessToken) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return redirectResponse(loginUrl);
    }

    if (accessToken) {
      const userInfo = await getUserInfo(
        accessToken,
        refreshedTokens?.sessionToken,
      );

      if (userInfo) {
        if (userInfo.emailVerified === false) {
          if (pathname !== "/verifyEmail") {
            const verifyEmailUrl = new URL("/verifyEmail", request.url);
            verifyEmailUrl.searchParams.set("email", userInfo.email);
            return redirectResponse(verifyEmailUrl);
          }

          return nextResponse();
        }

        if (userInfo.emailVerified && pathname === "/verifyEmail") {
          return redirectResponse(
            new URL(getDefaultDashboardRoute(userRole as UserRole), request.url),
          );
        }

        if (userInfo.needPasswordChange) {
          if (pathname !== "/restPass") {
            const resetPasswordUrl = new URL("/restPass", request.url);
            resetPasswordUrl.searchParams.set("email", userInfo.email);
            return redirectResponse(resetPasswordUrl);
          }

          return nextResponse();
        }

        if (!userInfo.needPasswordChange && pathname === "/restPass") {
          return redirectResponse(
            new URL(getDefaultDashboardRoute(userRole as UserRole), request.url),
          );
        }
      }
    }

    if (routerOwner === "COMMON") {
      return nextResponse();
    }

    if (
      routerOwner === "ADMIN" ||
      routerOwner === "DOCTOR" ||
      routerOwner === "PATIENT"
    ) {
      if (routerOwner !== userRole) {
        return redirectResponse(
          new URL(getDefaultDashboardRoute(userRole as UserRole), request.url),
        );
      }
    }

    return nextResponse();
  } catch (error) {
    console.error("Error in proxy middleware:", error);
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt (metadata files)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.well-known).*)",
  ],
};
