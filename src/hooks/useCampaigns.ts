import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { mysqlApi as mysqlClient } from "@/integrations/mysql/api";
import type { CreateCampaignInput } from "@/lib/campaign-create-payload";
import { WHOP_EMBED_TOKEN_STORAGE_KEY } from "@/lib/whop-embed-token";

export type CampaignStatus = "active" | "pending" | "paused" | "completed" | "private";
export type PlatformType = "tiktok" | "instagram" | "youtube" | "twitter";

export interface Campaign {
  id: string;
  created_by: string;
  name: string;
  description: string | null;
  requirements: string | null;
  platforms: PlatformType[];
  niche: string | null;
  rate_value: number;
  rate_unit: number;
  min_views: number;
  min_payout_views: number | null;
  max_earnings_per_post: number | null;
  total_budget: number;
  spent_budget: number;
  status: CampaignStatus;
  image_url: string | null;
  duration_days: number | null;
  end_date: string | null;
  required_hashtags: string[] | null;
  required_links: string[] | null;
  created_at: string;
  updated_at: string;
  whop_company_id?: string | null;
  creator_profile?: {
    full_name: string | null;
    avatar_url: string | null;
  };
}

function normalizeCampaignStatus(value: unknown): CampaignStatus {
  if (
    value === "active" ||
    value === "pending" ||
    value === "paused" ||
    value === "completed" ||
    value === "private"
  ) {
    return value;
  }
  // Legacy/minimal schemas often omit status; treat as pending for brand review.
  return "pending";
}

function parseMaybeJsonArray<T = unknown>(value: unknown, fallback: T[] = []): T[] {
  if (Array.isArray(value)) return value as T[];
  if (typeof value !== "string") return fallback;
  const t = value.trim();
  if (!t) return fallback;
  try {
    const parsed = JSON.parse(t) as unknown;
    return Array.isArray(parsed) ? (parsed as T[]) : fallback;
  } catch {
    return fallback;
  }
}

export function useCampaigns(filters?: {
  status?: CampaignStatus | "all";
  niche?: string;
  search?: string;
  /** When set (Whop embed), only campaigns for this company are returned. */
  whopCompanyId?: string;
}) {
  const normalizeCampaign = (row: any): Campaign => ({
    ...row,
    platforms: parseMaybeJsonArray<PlatformType>(row.platforms, []),
    required_hashtags: parseMaybeJsonArray<string>(row.required_hashtags, []),
    required_links: parseMaybeJsonArray<string>(row.required_links, []),
    status: normalizeCampaignStatus(row.status),
    creator_profile: row.creator_profile || null,
  });

  return useQuery({
    queryKey: ["campaigns", filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.status && filters.status !== "all") params.set("status", filters.status);
      if (filters?.niche && filters.niche !== "all") params.set("niche", filters.niche);
      if (filters?.search) params.set("search", filters.search);
      if (filters?.whopCompanyId) params.set("whopCompanyId", filters.whopCompanyId);
      const url = params.toString() ? `/api/campaigns?${params.toString()}` : "/api/campaigns";
      const res = await fetch(url);
      const rows = (await res.json().catch(() => [])) as unknown;
      if (!res.ok) {
        const msg = (rows as { error?: string })?.error || `HTTP ${res.status}`;
        throw new Error(msg);
      }
      const list = Array.isArray(rows) ? rows : [];
      return list.map((row: any) => normalizeCampaign(row));
    },
    staleTime: 30_000,
    gcTime: 5 * 60_000,
    retry: 1,
  });
}

export function useCampaign(id: string) {
  return useQuery({
    queryKey: ["campaign", id],
    queryFn: async () => {
      const res = await fetch(`/api/campaigns/${id}`);
      const row = (await res.json().catch(() => null)) as any;
      if (!res.ok || !row) throw new Error(row?.error || "Campaign not found");
      return {
        ...row,
        platforms: parseMaybeJsonArray<PlatformType>(row.platforms, []),
        required_hashtags: parseMaybeJsonArray<string>(row.required_hashtags, []),
        required_links: parseMaybeJsonArray<string>(row.required_links, []),
        status: normalizeCampaignStatus(row.status),
        creator_profile: row.creator_profile || null,
      } as Campaign;
    },
    enabled: !!id,
  });
}

export function useCreateCampaign() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (campaign: CreateCampaignInput) => {
      const apexToken =
        typeof window !== "undefined"
          ? localStorage.getItem("apex_auth_token") || localStorage.getItem("access_token")
          : null;
      const whopTok =
        typeof window !== "undefined" ? sessionStorage.getItem(WHOP_EMBED_TOKEN_STORAGE_KEY) : null;

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (apexToken) {
        headers.Authorization = `Bearer ${apexToken}`;
      }
      if (whopTok) {
        headers["x-whop-user-token"] = whopTok;
      }

      const res = await fetch("/api/campaigns", {
        method: "POST",
        headers,
        body: JSON.stringify(campaign),
      });

      const payload = (await res.json().catch(() => ({}))) as {
        error?: string;
        message?: string;
        platforms?: string;
        id?: string;
      };

      if (!res.ok) {
        throw new Error(payload.error || payload.message || `HTTP ${res.status}`);
      }

      const campaignId = campaign.campaignId ?? payload.id;
      if (!campaignId) {
        return payload as unknown as Campaign;
      }

      try {
        const resGet = await fetch(`/api/campaigns/${campaignId}`);
        const newCampaign = await resGet.json();
        if (!resGet.ok) throw new Error((newCampaign as any)?.error || "Campaign not found");
        const row = newCampaign as any;
        const normalized = {
          ...row,
          platforms: parseMaybeJsonArray<PlatformType>(row.platforms, campaign.platforms ?? []),
          required_hashtags: parseMaybeJsonArray<string>(row.required_hashtags, campaign.required_hashtags ?? []),
          required_links: parseMaybeJsonArray<string>(row.required_links, campaign.required_links ?? []),
          image_url: (row.image_url as string | null) ?? campaign.image_url ?? null,
          status: (row.status as CampaignStatus | undefined) ?? campaign.initialStatus ?? "active",
        } as Campaign;
        return normalized;
      } catch {
        return {
          id: campaignId,
          created_by: "",
          name: campaign.name,
          description: campaign.description ?? null,
          requirements: campaign.requirements ?? null,
          platforms: campaign.platforms,
          niche: campaign.niche ?? null,
          rate_value: campaign.rate_value,
          rate_unit: campaign.rate_unit,
          min_views: campaign.min_views ?? 0,
          min_payout_views: campaign.min_payout_views ?? null,
          max_earnings_per_post: campaign.max_earnings_per_post ?? null,
          total_budget: campaign.total_budget,
          spent_budget: 0,
          status: campaign.initialStatus ?? "active",
          image_url: campaign.image_url ?? null,
          duration_days: campaign.duration_days ?? null,
          end_date: null,
          required_hashtags: campaign.required_hashtags ?? [],
          required_links: campaign.required_links ?? [],
          created_at: "",
          updated_at: "",
          whop_company_id: campaign.whop_company_id ?? null,
          ...(payload as Record<string, unknown>),
        } as Campaign;
      }
    },
    onSuccess: (created) => {
      queryClient.setQueriesData<Campaign[] | undefined>({ queryKey: ["campaigns"] }, (old) => {
        if (!old || !Array.isArray(old)) return old;
        if (old.some((c) => c.id === created.id)) return old;
        return [created, ...old];
      });
      queryClient.invalidateQueries({ queryKey: ["campaigns"] });
    },
  });
}

export function useUpdateCampaign() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: { 
      id: string; 
      name?: string;
      description?: string;
      requirements?: string;
      platforms?: PlatformType[];
      niche?: string;
      rate_value?: number;
      rate_unit?: number;
      min_views?: number;
      min_payout_views?: number;
      max_earnings_per_post?: number;
      total_budget?: number;
      spent_budget?: number;
      status?: CampaignStatus;
      duration_days?: number;
      end_date?: string;
      required_hashtags?: string[];
      required_links?: string[];
      image_url?: string;
    }) => {
      // Build update query dynamically
      const updateFields: string[] = [];
      const updateValues: any[] = [];

      if (updates.name !== undefined) {
        updateFields.push('name = ?');
        updateValues.push(updates.name);
      }
      if (updates.description !== undefined) {
        updateFields.push('description = ?');
        updateValues.push(updates.description);
      }
      if (updates.requirements !== undefined) {
        updateFields.push('requirements = ?');
        updateValues.push(updates.requirements);
      }
      if (updates.platforms !== undefined) {
        updateFields.push('platforms = ?');
        updateValues.push(JSON.stringify(updates.platforms));
      }
      if (updates.niche !== undefined) {
        updateFields.push('niche = ?');
        updateValues.push(updates.niche);
      }
      if (updates.rate_value !== undefined) {
        updateFields.push('rate_value = ?');
        updateValues.push(updates.rate_value);
      }
      if (updates.rate_unit !== undefined) {
        updateFields.push('rate_unit = ?');
        updateValues.push(updates.rate_unit);
      }
      if (updates.min_views !== undefined) {
        updateFields.push('min_views = ?');
        updateValues.push(updates.min_views);
      }
      if (updates.min_payout_views !== undefined) {
        updateFields.push('min_payout_views = ?');
        updateValues.push(updates.min_payout_views);
      }
      if (updates.max_earnings_per_post !== undefined) {
        updateFields.push('max_earnings_per_post = ?');
        updateValues.push(updates.max_earnings_per_post);
      }
      if (updates.total_budget !== undefined) {
        updateFields.push('total_budget = ?');
        updateValues.push(updates.total_budget);
      }
      if (updates.spent_budget !== undefined) {
        updateFields.push('spent_budget = ?');
        updateValues.push(updates.spent_budget);
      }
      if (updates.status !== undefined) {
        updateFields.push('status = ?');
        updateValues.push(updates.status);
      }
      if (updates.duration_days !== undefined) {
        updateFields.push('duration_days = ?');
        updateValues.push(updates.duration_days);
      }
      if (updates.end_date !== undefined) {
        updateFields.push('end_date = ?');
        updateValues.push(updates.end_date);
      }
      if (updates.required_hashtags !== undefined) {
        updateFields.push('required_hashtags = ?');
        updateValues.push(updates.required_hashtags ? JSON.stringify(updates.required_hashtags) : null);
      }
      if (updates.required_links !== undefined) {
        updateFields.push('required_links = ?');
        updateValues.push(updates.required_links ? JSON.stringify(updates.required_links) : null);
      }
      if (updates.image_url !== undefined) {
        updateFields.push('image_url = ?');
        updateValues.push(updates.image_url);
      }

      if (updateFields.length === 0) {
        throw new Error('No fields to update');
      }

      // Build update object
      const updateData: Record<string, any> = {};
      if (updates.name !== undefined) updateData.name = updates.name;
      if (updates.description !== undefined) updateData.description = updates.description;
      if (updates.requirements !== undefined) updateData.requirements = updates.requirements;
      if (updates.platforms !== undefined) updateData.platforms = JSON.stringify(updates.platforms);
      if (updates.niche !== undefined) updateData.niche = updates.niche;
      if (updates.rate_value !== undefined) updateData.rate_value = updates.rate_value;
      if (updates.rate_unit !== undefined) updateData.rate_unit = updates.rate_unit;
      if (updates.min_views !== undefined) updateData.min_views = updates.min_views;
      if (updates.min_payout_views !== undefined) updateData.min_payout_views = updates.min_payout_views;
      if (updates.max_earnings_per_post !== undefined) updateData.max_earnings_per_post = updates.max_earnings_per_post;
      if (updates.total_budget !== undefined) updateData.total_budget = updates.total_budget;
      if (updates.spent_budget !== undefined) updateData.spent_budget = updates.spent_budget;
      if (updates.status !== undefined) updateData.status = updates.status;
      if (updates.duration_days !== undefined) updateData.duration_days = updates.duration_days;
      if (updates.end_date !== undefined) updateData.end_date = updates.end_date;
      if (updates.required_hashtags !== undefined) updateData.required_hashtags = updates.required_hashtags ? JSON.stringify(updates.required_hashtags) : null;
      if (updates.required_links !== undefined) updateData.required_links = updates.required_links ? JSON.stringify(updates.required_links) : null;
      if (updates.image_url !== undefined) updateData.image_url = updates.image_url;

      if (Object.keys(updateData).length === 0) {
        throw new Error('No fields to update');
      }

      await mysqlClient.update('campaigns', id, updateData);

      const updated = await mysqlClient.get('campaigns', id);

      const row = updated as any;
      return {
        ...row,
        platforms: JSON.parse(row.platforms || '[]'),
        required_hashtags: row.required_hashtags ? JSON.parse(row.required_hashtags) : null,
        required_links: row.required_links ? JSON.parse(row.required_links) : null,
      } as Campaign;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["campaigns"] });
      queryClient.invalidateQueries({ queryKey: ["campaign", data.id] });
    },
  });
}
