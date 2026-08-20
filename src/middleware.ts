import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Whop dev embed passes the user JWT in `?whop-dev-user-token=`. The SDK only reads
 * `x-whop-user-token`, so mirror it for the current request (non-production only).
 * Production iframe traffic should already send `x-whop-user-token`.
 */
export function middleware(request: NextRequest) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.next();
  }

  const devTok = request.nextUrl.searchParams.get("whop-dev-user-token");
  if (!devTok || request.headers.get("x-whop-user-token")) {
    return NextResponse.next();
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-whop-user-token", devTok);
  return NextResponse.next({
    request: { headers: requestHeaders },
  });
}

export const config = {
  matcher: ["/experiences/:path*"],
};
