import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const sessionCookie = request.cookies.get("fuze_session");
  const isDashboardRoute = request.nextUrl.pathname.startsWith("/dashboard");
  const isAuthRoute =
    request.nextUrl.pathname.startsWith("/login") ||
    request.nextUrl.pathname.startsWith("/register");
  const isRevoked = request.nextUrl.searchParams.get("revoked") === "true";

  // If user arrived at an auth page with revoked=true, force clear the cookie and stay on login
  if (isAuthRoute && isRevoked) {
    const response = NextResponse.next();
    response.cookies.delete("fuze_session");
    return response;
  }

  // If visiting dashboard without session cookie -> Instant redirect to /login
  if (isDashboardRoute && !sessionCookie) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  // If already authenticated and visiting /login or /register -> Instant redirect to /dashboard
  if (isAuthRoute && sessionCookie && !isRevoked) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/login", "/register"],
};
