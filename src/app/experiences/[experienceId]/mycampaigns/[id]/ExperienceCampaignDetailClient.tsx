"use client";

import { useEffect, useState } from "react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import CampaignDetail from "@/views/CampaignDetail";
import { useAuth } from "@/hooks/useAuth";

export function ExperienceCampaignDetailClient() {
  const [mounted, setMounted] = useState(false);
  const { role, isLoading } = useAuth();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || isLoading) return null;

  const layoutVariant = role === "creator" ? "customer" : "app";

  return (
    <ProtectedRoute>
      <CampaignDetail layoutVariant={layoutVariant} />
    </ProtectedRoute>
  );
}
