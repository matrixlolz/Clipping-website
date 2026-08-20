import { headers } from "next/headers";
import { WhopBusinessProvider } from "@/components/providers/WhopBusinessProvider";
import { EXPERIENCE_ID_PATTERN } from "@/lib/whop-experience-server";
import { getCachedWhopExperience } from "@/lib/whop-experience-cache";
import { getWhopViewerForExperience } from "@/lib/whop-viewer-server";
import { getWhopAccessLevelForExperience } from "@/lib/whop-access-server";

export default async function ExperienceLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { experienceId: string };
}) {
  const { experienceId } = params;
  const headerList = await headers();

  let companyName: string | null = null;
  let whopCompanyId: string | null = null;
  let whopExperienceAccessLevel: "no_access" | "admin" | "customer" | null = null;
  let whopViewer = null;

  if (experienceId && EXPERIENCE_ID_PATTERN.test(experienceId)) {
    const experience = await getCachedWhopExperience(experienceId);
    companyName = experience?.company?.title ?? null;
    whopCompanyId = experience?.company?.id ?? null;
    whopViewer = await getWhopViewerForExperience(headerList, experienceId);
    whopExperienceAccessLevel = await getWhopAccessLevelForExperience(
      headerList,
      experienceId,
      whopCompanyId
    );
  }

  return (
    <WhopBusinessProvider
      experienceId={experienceId}
      companyName={companyName}
      whopCompanyId={whopCompanyId}
      whopExperienceAccessLevel={whopExperienceAccessLevel}
      whopViewer={whopViewer}
    >
      {children}
    </WhopBusinessProvider>
  );
}
