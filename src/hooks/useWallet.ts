import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { mapErrorToUserMessage, logError } from "@/lib/errorMapping";

export interface Wallet {
  id: string;
  user_id: string;
  pending_balance: number;
  paid_balance: number;
  locked_earnings: number;
  created_at: string;
  updated_at: string;
}

export interface Payout {
  id: string;
  user_id: string;
  amount: number;
  payout_method: string;
  payout_email: string;
  status: "pending" | "approved" | "paid" | "rejected";
  admin_notes: string | null;
  processed_at: string | null;
  created_at: string;
}

export function useWallet() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["wallet", user?.id],
    queryFn: async () => {
      if (!user) return null;

      const { data, error } = await supabase
        .from("wallets")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;
      return data as Wallet | null;
    },
    enabled: !!user,
  });
}

export function usePayouts() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["payouts", user?.id],
    queryFn: async () => {
      if (!user) return [];

      // Explicitly exclude admin_notes for security
      const { data, error } = await supabase
        .from("payouts")
        .select("id, user_id, amount, payout_method, payout_email, status, processed_at, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Omit<Payout, 'admin_notes'>[];
    },
    enabled: !!user,
  });
}

export function useAllPayouts() {
  const { role } = useAuth();
  
  return useQuery({
    queryKey: ["payouts", "all"],
    queryFn: async () => {
      // Client-side role check before API call
      if (role !== "admin") {
        throw new Error("Unauthorized");
      }

      const { data, error } = await supabase
        .from("payouts")
        .select(`
          *,
          user_profile:profiles!payouts_user_id_fkey(full_name, email)
        `)
        .order("created_at", { ascending: false });

      if (error) {
        logError("useAllPayouts", error);
        throw new Error(mapErrorToUserMessage(error));
      }
      return data;
    },
    enabled: role === "admin",
  });
}

export function useRequestPayout() {
  const queryClient = useQueryClient();
  const { user, profile } = useAuth();

  return useMutation({
    mutationFn: async (amount: number) => {
      if (!user || !profile) throw new Error("Not authenticated");

      // Call the edge function to handle payout with locking
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/request-payout`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
          },
          body: JSON.stringify({
            user_id: user.id,
            amount,
            payout_method: profile.payout_method || "paypal",
            payout_email: profile.payout_method === "usdc_solana" 
              ? profile.solana_wallet_address 
              : (profile.payout_email || profile.email),
          }),
        }
      );

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "Failed to request payout");
      }

      return data.payout;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payouts"] });
      queryClient.invalidateQueries({ queryKey: ["wallet"] });
    },
  });
}

export function useUpdatePayout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Payout> & { id: string }) => {
      const { data, error } = await supabase
        .from("payouts")
        .update({
          ...updates,
          processed_at: updates.status === "paid" ? new Date().toISOString() : null,
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payouts"] });
    },
  });
}
