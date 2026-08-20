"use client";

import { useState, useEffect, useContext } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { WhopBusinessLayoutContext } from "@/components/providers/WhopBusinessProvider";
import Dashboard from "@/views/Dashboard";

export function DashboardClient() {
  const [mounted, setMounted] = useState(false);
  const params = useParams();
  const router = useRouter();
  const experienceId = params.experienceId as string;
  const { role, isLoading } = useAuth();
  const whopCtx = useContext(WhopBusinessLayoutContext);

  useEffect(() => {
    setMounted(true);
  }, []);

  const whopTeamAdmin = whopCtx?.whopExperienceAccessLevel === "admin";
  const apexAdmin = role === "admin";
  const canUseAdminDashboard = apexAdmin || whopTeamAdmin;

  useEffect(() => {
    if (!mounted || isLoading || !experienceId) return;
    if (canUseAdminDashboard) return;
    // Customers (Whop customer / non-admin) and non-admin Apex roles → member home
    router.replace(`/experiences/${experienceId}/home`);
  }, [mounted, isLoading, experienceId, canUseAdminDashboard, router]);

  if (!mounted || isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!canUseAdminDashboard) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
          <p className="text-muted-foreground">Redirecting...</p>
        </div>
      </div>
    );
  }

  return (
    <ProtectedRoute>
      <Dashboard />
    </ProtectedRoute>
  );
}
