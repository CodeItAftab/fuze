import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const sessionCookie = request.cookies.get("fuze_session");
  const host =
    request.headers.get("x-forwarded-host") ||
    request.headers.get("host") ||
    "";
  const hostname = host.split(":")[0].toLowerCase();
  const isDashboardSubdomain =
    hostname.startsWith("dashboard.") || hostname.startsWith("drive.");

  const { pathname } = request.nextUrl;
  const isRootPath = pathname === "/";
  const isDashboardRoute = pathname.startsWith("/dashboard");
  const isAuthRoute =
    pathname.startsWith("/login") || pathname.startsWith("/register");
  const isRevoked = request.nextUrl.searchParams.get("revoked") === "true";

  // 1. Force clear cookie if explicitly arriving with revoked=true
  if (isAuthRoute && isRevoked) {
    const response = NextResponse.next();
    response.cookies.delete("fuze_session");
    return response;
  }

  // 2. Subdomain routing: if accessing dashboard subdomain root (dashboard.fuzedrive.tech/)
  if (isDashboardSubdomain && isRootPath) {
    if (sessionCookie) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    } else {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", "/dashboard");
      return NextResponse.redirect(loginUrl);
    }
  }

  // 3. If visiting /dashboard without session cookie -> Instant redirect to /login
  if (isDashboardRoute && !sessionCookie) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 4. If already authenticated and visiting /login or /register -> Instant redirect to /dashboard
  if (isAuthRoute && sessionCookie && !isRevoked) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/dashboard/:path*", "/login", "/register"],
};
