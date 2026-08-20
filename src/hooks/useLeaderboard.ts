import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface LeaderboardEntry {
  creator_id: string;
  full_name: string | null;
  avatar_url: string | null;
  total_views: number;
  total_earnings: number;
  submission_count: number;
  rank: number;
}

export function useCampaignLeaderboard(campaignId: string) {
  return useQuery({
    queryKey: ["leaderboard", campaignId],
    queryFn: async () => {
      // Get all approved/paid submissions for this campaign grouped by creator
      const { data, error } = await supabase
        .from("submissions")
        .select(`
          creator_id,
          views,
          earnings,
          creator_profile:profiles!submissions_creator_id_fkey(full_name, avatar_url)
        `)
        .eq("campaign_id", campaignId)
        .in("status", ["approved", "paid"]);

      if (error) throw error;

      // Group by creator and calculate totals
      const creatorMap = new Map<string, {
        creator_id: string;
        full_name: string | null;
        avatar_url: string | null;
        total_views: number;
        total_earnings: number;
        submission_count: number;
      }>();

      data?.forEach((submission: any) => {
        const existing = creatorMap.get(submission.creator_id);
        if (existing) {
          existing.total_views += Number(submission.views) || 0;
          existing.total_earnings += Number(submission.earnings) || 0;
          existing.submission_count += 1;
        } else {
          creatorMap.set(submission.creator_id, {
            creator_id: submission.creator_id,
            full_name: submission.creator_profile?.full_name || null,
            avatar_url: submission.creator_profile?.avatar_url || null,
            total_views: Number(submission.views) || 0,
            total_earnings: Number(submission.earnings) || 0,
            submission_count: 1,
          });
        }
      });

      // Convert to array and sort by views (descending)
      const leaderboard = Array.from(creatorMap.values())
        .sort((a, b) => b.total_views - a.total_views)
        .map((entry, index) => ({
          ...entry,
          rank: index + 1,
        }));

      return leaderboard as LeaderboardEntry[];
    },
    enabled: !!campaignId,
  });
}
