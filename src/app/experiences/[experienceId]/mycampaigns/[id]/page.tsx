import { SessionNotActive } from "@/components/SessionNotActive";
import { EXPERIENCE_ID_PATTERN } from "@/lib/whop-experience-server";
import { getCachedWhopExperience } from "@/lib/whop-experience-cache";
import { ExperienceCampaignDetailClient } from "./ExperienceCampaignDetailClient";

interface Props {
  params: { experienceId: string; id: string };
}

export default async function ExperienceCampaignDetailPage({ params }: Props) {
  const { experienceId } = params;

  if (!experienceId || !EXPERIENCE_ID_PATTERN.test(experienceId)) {
    return <SessionNotActive />;
  }

  const experience = await getCachedWhopExperience(experienceId);
  if (!experience) {
    return <SessionNotActive />;
  }

  return <ExperienceCampaignDetailClient />;
}
