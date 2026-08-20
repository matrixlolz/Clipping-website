"use client";

import React, { useContext } from "react";
import { useAuth } from "@/hooks/useAuth";
import { WhopBusinessLayoutContext } from "@/components/providers/WhopBusinessProvider";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: Array<"creator" | "brand" | "admin">;
  /**
   * Treat Whop `users.checkAccess` admin on the current experience/company as satisfying
   * brand/admin-only routes (for users without a matching Apex role).
   */
  alsoAllowWhopTeamAdmin?: boolean;
}

export function ProtectedRoute({
  children,
  allowedRoles,
  alsoAllowWhopTeamAdmin,
}: ProtectedRouteProps) {
  const { user, role, isLoading } = useAuth();
  const whopLayout = useContext(WhopBusinessLayoutContext);
  const whopTeamAdmin = whopLayout?.whopExperienceAccessLevel === "admin";

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <>{children}</>;
  }

  // For role-gated routes: wait for role to be loaded, then check access
  if (user && allowedRoles) {
    // If role hasn't loaded yet but user is authenticated, show loading
    if (!role) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
            <p className="text-muted-foreground">Verifying access...</p>
          </div>
        </div>
      );
    }
    const allowedByRole = allowedRoles.includes(role);
    const allowedByWhop =
      alsoAllowWhopTeamAdmin &&
      whopTeamAdmin &&
      (allowedRoles.includes("admin") || allowedRoles.includes("brand"));

    if (!allowedByRole && !allowedByWhop) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center">
          <p className="text-muted-foreground">You do not have access to this page.</p>
        </div>
      );
    }
  }

  return <>{children}</>;
}
