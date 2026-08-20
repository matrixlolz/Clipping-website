import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface AdminLog {
  id: string;
  admin_id: string;
  action: string;
  target_type: string;
  target_id: string;
  details: Record<string, unknown> | null;
  created_at: string;
}

export function useAdminLogs(targetType?: string, targetId?: string) {
  const { role } = useAuth();

  return useQuery({
    queryKey: ["admin_logs", targetType, targetId],
    queryFn: async () => {
      let query = supabase
        .from("admin_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);

      if (targetType) {
        query = query.eq("target_type", targetType);
      }
      if (targetId) {
        query = query.eq("target_id", targetId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as AdminLog[];
    },
    enabled: role === "admin",
  });
}

export function useCreateAdminLog() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (log: {
      action: string;
      target_type: string;
      target_id: string;
      details?: Record<string, unknown>;
    }) => {
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase.from("admin_logs").insert([{
        admin_id: user.id,
        action: log.action,
        target_type: log.target_type,
        target_id: log.target_id,
        details: log.details as any,
      }]);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin_logs"] });
    },
  });
}
