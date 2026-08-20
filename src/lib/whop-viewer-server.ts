import "server-only";

import { whopsdk } from "@/lib/whop-sdk";
import { EXPERIENCE_ID_PATTERN } from "@/lib/whop-experience-server";
import type { WhopViewer } from "@/types/whop-viewer";

export type { WhopViewer } from "@/types/whop-viewer";

/**
 * Resolve the current Whop iframe user for this experience id:
 * verify `x-whop-user-token`, then load Whop profile (name, username, avatar).
 *
 * We intentionally do not gate on `users.checkAccess` here — that call often fails
 * unless extra dashboard permissions are enabled, which would hide the viewer in the UI.
 */
export async function getWhopViewerForExperience(
  incomingHeaders: Headers,
  experienceId: string
): Promise<WhopViewer | null> {
  if (!experienceId || !EXPERIENCE_ID_PATTERN.test(experienceId)) {
    return null;
  }

  const payload = await whopsdk.verifyUserToken(incomingHeaders, { dontThrow: true });
  if (!payload?.userId) {
    return null;
  }

  try {
    const user = await whopsdk.users.retrieve(payload.userId);
    return {
      id: user.id,
      name: user.name,
      username: user.username,
      profilePictureUrl: user.profile_picture?.url ?? null,
    };
  } catch {
    return null;
  }
}
