import "server-only";

import { whopsdk } from "@/lib/whop-sdk";
import { EXPERIENCE_ID_PATTERN } from "@/lib/whop-experience-server";

/** Mirrors Whop `AccessLevel` — kept as strings for serializing to the client provider. */
export type WhopAccessLevel = "no_access" | "admin" | "customer";

/**
 * Whop access for the iframe user on this experience (and company fallback).
 * Used to allow the admin dashboard when Apex app auth is missing but the user is a Whop team admin.
 */
export async function getWhopAccessLevelForExperience(
  incomingHeaders: Headers,
  experienceId: string,
  companyId: string | null
): Promise<WhopAccessLevel | null> {
  if (!experienceId || !EXPERIENCE_ID_PATTERN.test(experienceId)) {
    return null;
  }

  const payload = await whopsdk.verifyUserToken(incomingHeaders, { dontThrow: true });
  if (!payload?.userId) {
    return null;
  }

  const userId = payload.userId;

  const check = async (resourceId: string): Promise<WhopAccessLevel | null> => {
    try {
      const res = await whopsdk.users.checkAccess(resourceId, { id: userId });
      return res.access_level as WhopAccessLevel;
    } catch {
      return null;
    }
  };

  const onExperience = await check(experienceId);
  if (onExperience === "admin") {
    return "admin";
  }

  if (companyId) {
    const onCompany = await check(companyId);
    if (onCompany === "admin") {
      return "admin";
    }
    return onCompany ?? onExperience;
  }

  return onExperience;
}
