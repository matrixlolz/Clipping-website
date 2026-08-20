/** Campaign content types (launch form + stored on campaign metadata / `campaign_type` field in UI). */
export const CAMPAIGN_TYPES = ["UGC", "Clipping", "Both"] as const;
export type CampaignTypeId = (typeof CAMPAIGN_TYPES)[number];

/** Category slug stored in `campaigns.niche` (string). */
export const CAMPAIGN_CATEGORIES = [
  { value: "music", label: "Music" },
  { value: "personal-brand", label: "Personal Brand" },
  { value: "technology", label: "Technology" },
  { value: "product", label: "Product" },
  { value: "entertainment", label: "Entertainment" },
  { value: "logo", label: "Logo" },
  { value: "slideshow", label: "Slideshow" },
  { value: "other", label: "Other" },
] as const;

export type CampaignCategorySlug = (typeof CAMPAIGN_CATEGORIES)[number]["value"];

export function getCategoryLabel(slug: string): string {
  const row = CAMPAIGN_CATEGORIES.find((c) => c.value === slug);
  return row?.label ?? slug;
}
