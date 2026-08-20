"use client";

import { useEffect, useState } from "react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { WhopEmbedTokenCapture } from "@/components/campaigns/WhopEmbedTokenCapture";
import Launch from "@/views/Launch";

export function ExperienceLaunchClient() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <ProtectedRoute
      allowedRoles={["admin", "brand"]}
      alsoAllowWhopTeamAdmin
    >
      <WhopEmbedTokenCapture />
      <Launch mode="embedded" />
    </ProtectedRoute>
  );
}
