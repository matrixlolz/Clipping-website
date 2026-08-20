import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { mapErrorToUserMessage, logError } from "@/lib/errorMapping";

export function useCreatorStats() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["stats", "creator", user?.id],
    queryFn: async () => {
      if (!user) return null;

      // Get submissions
      const { data: submissions, error: submissionsError } = await supabase
        .from("submissions")
        .select("views, earnings, status")
        .eq("creator_id", user.id);

      if (submissionsError) {
        logError("useCreatorStats:submissions", submissionsError);
        throw new Error(mapErrorToUserMessage(submissionsError));
      }

      // Get wallet
      const { data: wallet, error: walletError } = await supabase
        .from("wallets")
        .select("pending_balance, paid_balance")
        .eq("user_id", user.id)
        .maybeSingle();

      if (walletError) {
        logError("useCreatorStats:wallet", walletError);
        throw new Error(mapErrorToUserMessage(walletError));
      }

      const totalViews = submissions?.reduce((sum, s) => sum + (s.views || 0), 0) || 0;
      const totalEarnings = submissions?.reduce((sum, s) => sum + Number(s.earnings || 0), 0) || 0;
      const approvedClips = submissions?.filter(s => s.status === "approved" || s.status === "paid").length || 0;
      const pendingClips = submissions?.filter(s => s.status === "pending").length || 0;

      return {
        totalViews,
        totalEarnings,
        approvedClips,
        pendingClips,
        totalClips: submissions?.length || 0,
        pendingBalance: wallet?.pending_balance || 0,
        paidBalance: wallet?.paid_balance || 0,
      };
    },
    enabled: !!user,
  });
}

export function useBrandStats() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["stats", "brand", user?.id],
    queryFn: async () => {
      if (!user) return null;

      // Get campaigns
      const { data: campaigns, error: campaignsError } = await supabase
        .from("campaigns")
        .select("id, total_budget, spent_budget, status")
        .eq("created_by", user.id);

      if (campaignsError) {
        logError("useBrandStats:campaigns", campaignsError);
        throw new Error(mapErrorToUserMessage(campaignsError));
      }

      const campaignIds = campaigns?.map(c => c.id) || [];

      // Get submissions for these campaigns (skip if no campaigns)
      let submissions: { views: number; status: string }[] = [];
      if (campaignIds.length > 0) {
        const { data: submissionsData, error: submissionsError } = await supabase
          .from("submissions")
          .select("views, status")
          .in("campaign_id", campaignIds);

        if (submissionsError) {
          logError("useBrandStats:submissions", submissionsError);
          throw new Error(mapErrorToUserMessage(submissionsError));
        }
        submissions = submissionsData || [];
      }

      const activeCampaigns = campaigns?.filter(c => c.status === "active").length || 0;
      const totalBudget = campaigns?.reduce((sum, c) => sum + Number(c.total_budget || 0), 0) || 0;
      const spentBudget = campaigns?.reduce((sum, c) => sum + Number(c.spent_budget || 0), 0) || 0;
      const totalViews = submissions?.reduce((sum, s) => sum + (s.views || 0), 0) || 0;
      const totalSubmissions = submissions?.length || 0;

      return {
        totalCampaigns: campaigns?.length || 0,
        activeCampaigns,
        totalBudget,
        spentBudget,
        totalViews,
        totalSubmissions,
      };
    },
    enabled: !!user,
  });
}

export function useAdminStats() {
  const { role } = useAuth();
  
  return useQuery({
    queryKey: ["stats", "admin"],
    queryFn: async () => {
      // Server-side role check is done via RLS, but we also check client-side
      // to provide better UX and avoid unnecessary API calls
      if (role !== "admin") {
        throw new Error("Unauthorized");
      }

      // Get all campaigns
      const { data: campaigns, error: campaignsError } = await supabase
        .from("campaigns")
        .select("total_budget, spent_budget, status");

      if (campaignsError) {
        logError("useAdminStats:campaigns", campaignsError);
        throw new Error(mapErrorToUserMessage(campaignsError));
      }

      // Get all submissions
      const { data: submissions, error: submissionsError } = await supabase
        .from("submissions")
        .select("views, earnings, status");

      if (submissionsError) {
        logError("useAdminStats:submissions", submissionsError);
        throw new Error(mapErrorToUserMessage(submissionsError));
      }

      // Get pending payouts
      const { data: payouts, error: payoutsError } = await supabase
        .from("payouts")
        .select("amount, status")
        .eq("status", "pending");

      if (payoutsError) {
        logError("useAdminStats:payouts", payoutsError);
        throw new Error(mapErrorToUserMessage(payoutsError));
      }

      const activeCampaigns = campaigns?.filter(c => c.status === "active").length || 0;
      const totalPlatformSpend = campaigns?.reduce((sum, c) => sum + Number(c.spent_budget || 0), 0) || 0;
      const totalViews = submissions?.reduce((sum, s) => sum + (s.views || 0), 0) || 0;
      const pendingPayouts = payouts?.reduce((sum, p) => sum + Number(p.amount || 0), 0) || 0;
      const pendingSubmissions = submissions?.filter(s => s.status === "pending").length || 0;

      return {
        totalCampaigns: campaigns?.length || 0,
        activeCampaigns,
        totalPlatformSpend,
        totalViews,
        pendingPayouts,
        pendingPayoutsCount: payouts?.length || 0,
        pendingSubmissions,
        totalSubmissions: submissions?.length || 0,
      };
    },
    enabled: role === "admin",
  });
}
