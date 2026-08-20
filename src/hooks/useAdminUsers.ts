import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useCreateAdminLog } from "./useAdminLogs";

export interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  is_banned: boolean;
  payment_verified: boolean;
  payout_method: string | null;
  payout_email: string | null;
  solana_wallet_address: string | null;
  created_at: string;
}

export interface CampaignParticipant {
  creator_id: string;
  full_name: string | null;
  avatar_url: string | null;
  email: string;
  is_banned: boolean;
  payment_verified: boolean;
  payout_method: string | null;
  total_views: number;
  total_earnings: number;
  submission_count: number;
  approved_count: number;
  rejected_count: number;
  pending_count: number;
  payout_status: "eligible" | "pending" | "paid" | "not_eligible";
}

export function useCampaignParticipants(campaignId: string) {
  const { role } = useAuth();

  return useQuery({
    queryKey: ["campaign_participants", campaignId],
    queryFn: async () => {
      // Get submissions with creator profiles
      const { data: submissions, error: subError } = await supabase
        .from("submissions")
        .select(`
          creator_id,
          views,
          earnings,
          status,
          creator_profile:profiles!submissions_creator_id_fkey(
            id, email, full_name, avatar_url, is_banned, payment_verified, payout_method
          )
        `)
        .eq("campaign_id", campaignId);

      if (subError) throw subError;

      // Get pending payouts for these users
      const creatorIds = [...new Set(submissions?.map(s => s.creator_id) || [])];
      
      const { data: payouts, error: payError } = await supabase
        .from("payouts")
        .select("user_id, status")
        .in("user_id", creatorIds);

      if (payError) throw payError;

      // Build participant map
      const participantMap = new Map<string, CampaignParticipant>();

      submissions?.forEach((sub: any) => {
        const profile = sub.creator_profile;
        const existing = participantMap.get(sub.creator_id);
        const isApproved = sub.status === "approved" || sub.status === "paid";
        const isRejected = sub.status === "rejected";
        const isPending = sub.status === "pending";

        if (existing) {
          if (isApproved) {
            existing.total_views += Number(sub.views) || 0;
            existing.total_earnings += Number(sub.earnings) || 0;
            existing.approved_count += 1;
          } else if (isRejected) {
            existing.rejected_count += 1;
          } else if (isPending) {
            existing.pending_count += 1;
          }
          existing.submission_count += 1;
        } else {
          participantMap.set(sub.creator_id, {
            creator_id: sub.creator_id,
            full_name: profile?.full_name || null,
            avatar_url: profile?.avatar_url || null,
            email: profile?.email || "",
            is_banned: profile?.is_banned || false,
            payment_verified: profile?.payment_verified || false,
            payout_method: profile?.payout_method || null,
            total_views: isApproved ? Number(sub.views) || 0 : 0,
            total_earnings: isApproved ? Number(sub.earnings) || 0 : 0,
            submission_count: 1,
            approved_count: isApproved ? 1 : 0,
            rejected_count: isRejected ? 1 : 0,
            pending_count: isPending ? 1 : 0,
            payout_status: "not_eligible",
          });
        }
      });

      // Determine payout status
      participantMap.forEach((participant, creatorId) => {
        const userPayouts = payouts?.filter(p => p.user_id === creatorId) || [];
        const hasPending = userPayouts.some(p => p.status === "pending" || p.status === "approved");
        const hasPaid = userPayouts.some(p => p.status === "paid");

        if (hasPending) {
          participant.payout_status = "pending";
        } else if (hasPaid && participant.total_earnings > 0) {
          participant.payout_status = "paid";
        } else if (participant.total_earnings > 0) {
          participant.payout_status = "eligible";
        }
      });

      return Array.from(participantMap.values()).sort((a, b) => b.total_views - a.total_views);
    },
    enabled: role === "admin" && !!campaignId,
  });
}

export function useUserProfile(userId: string) {
  const { role } = useAuth();

  return useQuery({
    queryKey: ["user_profile", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (error) throw error;
      return data as UserProfile;
    },
    enabled: role === "admin" && !!userId,
  });
}

export function useUserSubmissions(userId: string, campaignId?: string) {
  const { role } = useAuth();

  return useQuery({
    queryKey: ["user_submissions", userId, campaignId],
    queryFn: async () => {
      let query = supabase
        .from("submissions")
        .select(`
          *,
          campaign:campaigns(id, name, rate_value, rate_unit, min_views, min_payout_views)
        `)
        .eq("creator_id", userId)
        .order("created_at", { ascending: false });

      if (campaignId) {
        query = query.eq("campaign_id", campaignId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data;
    },
    enabled: role === "admin" && !!userId,
  });
}

export function useUpdateUserStatus() {
  const queryClient = useQueryClient();
  const createLog = useCreateAdminLog();

  return useMutation({
    mutationFn: async ({ userId, updates, action }: {
      userId: string;
      updates: { is_banned?: boolean; payment_verified?: boolean };
      action: string;
    }) => {
      const { error } = await supabase
        .from("profiles")
        .update(updates)
        .eq("id", userId);

      if (error) throw error;

      // Log the action
      await createLog.mutateAsync({
        action,
        target_type: "user",
        target_id: userId,
        details: updates,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user_profile"] });
      queryClient.invalidateQueries({ queryKey: ["campaign_participants"] });
    },
  });
}
