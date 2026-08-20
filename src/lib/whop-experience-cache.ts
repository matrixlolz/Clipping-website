import "server-only";

import { cache } from "react";
import { fetchWhopExperienceById } from "@/lib/whop-experience-server";

/**
 * Deduped Whop retrieve per React server request (layout + child pages only).
 * Do not import this from API routes — use `fetchWhopExperienceById` there instead.
 */
export const getCachedWhopExperience = cache(fetchWhopExperienceById);
