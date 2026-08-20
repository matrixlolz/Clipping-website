import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { mysqlApi as mysqlClient } from "@/integrations/mysql/api";
import { useAuth } from "./useAuth";

type PlatformType = "tiktok" | "instagram" | "youtube";

export interface SocialAccount {
  id: string;
  userId: string; // camelCase from backend
  platform: PlatformType;
  username: string;
  profileUrl: string | null; // camelCase from backend
  verificationCode: string; // camelCase from backend
  verified: boolean;
  verifiedAt: string | null; // camelCase from backend
  createdAt: string; // camelCase from backend
  updatedAt: string; // camelCase from backend
}

export function useMySocialAccounts() {
  const { user, session } = useAuth();

  return useQuery({
    queryKey: ["social-accounts", user?.id],
    queryFn: async () => {
      if (!user || !session) throw new Error("Not authenticated");
      
      const accounts = await mysqlClient.socialAccounts.getMine();
      return accounts as SocialAccount[];
    },
    enabled: !!user && !!session,
  });
}

export function useAllSocialAccounts() {
  const { session } = useAuth();

  return useQuery({
    queryKey: ["all-social-accounts"],
    queryFn: async () => {
      if (!session) throw new Error("Not authenticated");
      
      // Get all social accounts
      const accounts = await mysqlClient.socialAccounts.getAll() as SocialAccount[];

      if (accounts.length === 0) return [];

      // Get unique user IDs
      const userIds = [...new Set(accounts.map(a => a.userId))];
      
      // Get profiles for those users
      const profiles = await Promise.all(
        userIds.map(id => mysqlClient.profiles.getById(id))
      );

      // Combine the data
      const profileMap = new Map(profiles.map((p: any) => [p.id, p]));
      
      return accounts.map(account => ({
        ...account,
        profile: profileMap.get(account.userId) || { full_name: null, email: "" }
      })) as (SocialAccount & { profile: { full_name: string | null; email: string } })[];
    },
    enabled: !!session,
  });
}

export function useCreateSocialAccount() {
  const queryClient = useQueryClient();
  const { user, session } = useAuth();

  return useMutation({
    mutationFn: async (data: {
      platform: PlatformType;
      username: string;
      profile_url?: string;
    }) => {
      if (!user || !session) throw new Error("Not authenticated");

      const newAccount = await mysqlClient.socialAccounts.create({
        userId: user.id,
        platform: data.platform,
        username: data.username,
        profileUrl: data.profile_url || null,
      });

      return newAccount as SocialAccount;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["social-accounts"] });
      queryClient.invalidateQueries({ queryKey: ["all-social-accounts"] });
    },
  });
}

export function useDeleteSocialAccount() {
  const queryClient = useQueryClient();
  const { session } = useAuth();

  return useMutation({
    mutationFn: async (id: string) => {
      if (!session) throw new Error("Not authenticated");
      await mysqlClient.socialAccounts.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["social-accounts"] });
      queryClient.invalidateQueries({ queryKey: ["all-social-accounts"] });
    },
  });
}

export function useVerifySocialAccount() {
  const queryClient = useQueryClient();
  const { session } = useAuth();

  return useMutation({
    mutationFn: async ({ id, platform, username, verification_code }: {
      id: string;
      platform: PlatformType;
      username: string;
      verification_code: string;
    }) => {
      if (!session) throw new Error("Not authenticated");

      // Call backend API endpoint which handles verification
      // Backend will call Supabase Edge Functions (which call Python services)
      // This way frontend doesn't need Supabase credentials
      const result = await mysqlClient.apiCall(`/social-accounts/${id}/verify`, {
        method: 'POST',
        body: JSON.stringify({
          platform,
          username,
          verification_code,
        }),
      }) as { success: boolean; verified: boolean; account: SocialAccount; message?: string; error?: string };

      if (!result.success || !result.verified) {
        throw new Error(result.error || result.message || 'Verification failed');
      }

      return result.account;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["social-accounts"] });
      queryClient.invalidateQueries({ queryKey: ["all-social-accounts"] });
    },
  });
}
