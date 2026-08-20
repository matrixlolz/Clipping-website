"use client";

import { ProtectedRoute } from "@/components/ProtectedRoute";
import Campaigns from "@/views/Campaigns";

export default function CampaignsPage() {
  return (
    <ProtectedRoute>
      <Campaigns />
    </ProtectedRoute>
  );
}
