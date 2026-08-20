import "server-only";

import { whopsdk } from "@/lib/whop-sdk";

/** Matches Whop experience IDs used in URLs. */
export const EXPERIENCE_ID_PATTERN = /^exp_[A-Za-z0-9_-]+$/;

/**
 * Whop experience retrieve (no React cache). Safe for Route Handlers and any server code.
 */
export async function fetchWhopExperienceById(experienceId: string) {
  if (!experienceId || !EXPERIENCE_ID_PATTERN.test(experienceId)) {
    return null;
  }
  try {
    return await whopsdk.experiences.retrieve(experienceId);
  } catch {
    return null;
  }
}

export async function getWhopCompanyTitleForExperience(
  experienceId: string
): Promise<string | null> {
  const experience = await fetchWhopExperienceById(experienceId);
  return experience?.company?.title ?? null;
}
