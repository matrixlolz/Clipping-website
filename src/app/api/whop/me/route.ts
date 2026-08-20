import { NextRequest, NextResponse } from "next/server";
import { getWhopViewerForExperience } from "@/lib/whop-viewer-server";

/**
 * Client-side fetches may not forward `x-whop-user-token`. In development, Whop often
 * puts the JWT in `?whop-dev-user-token=` — mirror it onto the header the SDK expects.
 */
function headersWithWhopToken(req: NextRequest): Headers {
  const headers = new Headers(req.headers);
  if (!headers.get("x-whop-user-token")) {
    const dev = req.nextUrl.searchParams.get("whop-dev-user-token");
    if (dev && process.env.NODE_ENV !== "production") {
      headers.set("x-whop-user-token", dev);
    }
  }
  return headers;
}

export async function GET(req: NextRequest) {
  const experienceId = req.nextUrl.searchParams.get("experienceId") || "";
  try {
    const user = await getWhopViewerForExperience(headersWithWhopToken(req), experienceId);
    return NextResponse.json({ user });
  } catch (error) {
    console.error("Whop /me:", error);
    return NextResponse.json({ user: null });
  }
}
