import { SessionNotActive } from "@/components/SessionNotActive";
import { CustomerDashboardClient } from "./CustomerDashboardClient";
import { EXPERIENCE_ID_PATTERN } from "@/lib/whop-experience-server";
import { getCachedWhopExperience } from "@/lib/whop-experience-cache";

interface Props {
  params: { experienceId: string };
}

export default async function ExperienceHomePage({ params }: Props) {
  const { experienceId } = params;

  if (!experienceId || !EXPERIENCE_ID_PATTERN.test(experienceId)) {
    return <SessionNotActive />;
  }

  const experience = await getCachedWhopExperience(experienceId);
  if (!experience) {
    return <SessionNotActive />;
  }

  return <CustomerDashboardClient />;
}
