"use client";

import { ProtectedRoute } from "@/components/ProtectedRoute";
import CampaignDetail from "@/views/CampaignDetail";

export default function CampaignDetailPage() {
  return (
    <ProtectedRoute>
      <CampaignDetail />
    </ProtectedRoute>
  );
}
