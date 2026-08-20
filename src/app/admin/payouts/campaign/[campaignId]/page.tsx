"use client";

import { ProtectedRoute } from "@/components/ProtectedRoute";
import AdminCampaignPayouts from "@/views/AdminCampaignPayouts";

export default function AdminPayoutsCampaignPage() {
  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <AdminCampaignPayouts />
    </ProtectedRoute>
  );
}
