"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Campaigns from "@/views/Campaigns";
import { useAuth } from "@/hooks/useAuth";

export function ExperienceMyCampaignsClient() {
  const [mounted, setMounted] = useState(false);
  const params = useParams();
  const experienceId = params.experienceId as string;
  const { role, isLoading } = useAuth();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || isLoading) return null;

  const layoutVariant = role === "creator" ? "customer" : "app";

  return (
    <ProtectedRoute>
      <Campaigns experienceId={experienceId} layoutVariant={layoutVariant} />
    </ProtectedRoute>
  );
}
