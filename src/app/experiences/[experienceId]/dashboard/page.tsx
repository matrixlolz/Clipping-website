import { SessionNotActive } from "@/components/SessionNotActive";
import { DashboardClient } from "./DashboardClient";
import { EXPERIENCE_ID_PATTERN } from "@/lib/whop-experience-server";
import { getCachedWhopExperience } from "@/lib/whop-experience-cache";

interface Props {
  params: { experienceId: string };
}

export default async function ExperienceDashboardPage({ params }: Props) {
  const { experienceId } = params;

  if (!experienceId || !EXPERIENCE_ID_PATTERN.test(experienceId)) {
    return <SessionNotActive />;
  }

  // Same cached retrieve as `experiences/[experienceId]/layout` — one Whop call per request.
  const experience = await getCachedWhopExperience(experienceId);
  if (!experience) {
    return <SessionNotActive />;
  }

  return <DashboardClient />;
}
