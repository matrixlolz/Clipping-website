import type { NextRequest } from "next/server";

/**
 * Resolve app user id from Apex JWT (same token as `apex_auth_token`).
 * Tries backend verification first, then payload decode (matches client fallback).
 */
export async function resolveApexUserIdFromRequest(req: NextRequest): Promise<string | null> {
  const auth = req.headers.get("authorization");
  const token = auth?.replace(/^Bearer\s+/i, "").trim();
  if (!token) return null;

  const apiBase = process.env.NEXT_PUBLIC_API_URL?.trim();
  if (apiBase) {
    try {
      const res = await fetch(`${apiBase}/auth/user`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        cache: "no-store",
      });
      if (res.ok) {
        const data = (await res.json()) as { user?: { id?: string } };
        const id = data.user?.id;
        if (id) return id;
      }
    } catch {
      /* fall through to decode */
    }
  }

  return decodeJwtUserId(token);
}

function decodeJwtUserId(token: string): string | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    let base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const pad = base64.length % 4;
    if (pad) base64 += "=".repeat(4 - pad);
    const json = Buffer.from(base64, "base64").toString("utf8");
    const payload = JSON.parse(json) as { userId?: string; sub?: string };
    return payload.userId ?? payload.sub ?? null;
  } catch {
    return null;
  }
}
