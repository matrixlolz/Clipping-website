import { generateUUID } from "@/integrations/mysql/client";

export type PlatformType = "tiktok" | "instagram" | "youtube" | "twitter";
export type CampaignStatus = "active" | "pending" | "paused" | "completed" | "private";

export type CreateCampaignInput = {
  campaignId?: string;
  /** Optional explicit owner id (Whop viewer id in embedded launch). */
  created_by?: string;
  name: string;
  description?: string;
  requirements?: string;
  platforms: PlatformType[];
  niche?: string;
  rate_value: number;
  rate_unit: number;
  min_views?: number;
  min_payout_views?: number;
  max_earnings_per_post?: number;
  total_budget: number;
  duration_days?: number;
  required_hashtags?: string[];
  required_links?: string[];
  image_url?: string;
  whop_company_id?: string | null;
  initialStatus?: CampaignStatus;
};

/** Builds the campaigns row for insert (MySQL / API). */
export function buildCampaignInsertRow(
  campaign: CreateCampaignInput,
  createdBy: string,
): Record<string, unknown> {
  let end_date: string | undefined;
  if (campaign.duration_days) {
    const endDateObj = new Date();
    endDateObj.setDate(endDateObj.getDate() + campaign.duration_days);
    end_date = endDateObj.toISOString();
  }

  const campaignId = campaign.campaignId ?? generateUUID();
  const initialStatus = campaign.initialStatus ?? "active";

  return {
    id: campaignId,
    created_by: createdBy,
    whop_company_id: campaign.whop_company_id ?? null,
    name: campaign.name,
    description: campaign.description || null,
    requirements: campaign.requirements || null,
    platforms: JSON.stringify(campaign.platforms),
    niche: campaign.niche || null,
    rate_value: campaign.rate_value,
    rate_unit: campaign.rate_unit,
    min_views: campaign.min_views || 1000,
    min_payout_views: campaign.min_payout_views || null,
    max_earnings_per_post: campaign.max_earnings_per_post || null,
    total_budget: campaign.total_budget,
    duration_days: campaign.duration_days || null,
    end_date: end_date || null,
    required_hashtags: campaign.required_hashtags ? JSON.stringify(campaign.required_hashtags) : null,
    required_links: campaign.required_links ? JSON.stringify(campaign.required_links) : null,
    image_url: campaign.image_url || null,
    status: initialStatus,
  };
}
