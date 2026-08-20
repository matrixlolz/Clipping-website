/** UUID v4 pattern (lowercase hex with dashes), e.g. 655fcb51-164e-448b-b077-032b04a2f686 */
export const CAMPAIGN_ID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isCampaignIdFormat(id: string): boolean {
  return CAMPAIGN_ID_REGEX.test(id.trim());
}
