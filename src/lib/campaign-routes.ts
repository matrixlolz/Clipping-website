/** Campaign list: standalone app vs Whop experience embed. */
export function getCampaignsListHref(experienceId: string | undefined | null): string {
  return experienceId ? `/experiences/${experienceId}/mycampaigns` : "/campaigns";
}

/** Launch / new campaign flow: use experience path in Whop embed so company id is available. */
export function getLaunchHref(experienceId: string | undefined | null): string {
  return experienceId ? `/experiences/${experienceId}/launch` : "/launch";
}

/** Campaign detail URL, kept under the experience path when embedded. */
export function getCampaignDetailHref(
  campaignId: string,
  experienceId: string | undefined | null,
): string {
  return experienceId
    ? `/experiences/${experienceId}/mycampaigns/${campaignId}`
    : `/campaigns/${campaignId}`;
}
