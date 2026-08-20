"use client";

import { ProtectedRoute } from "@/components/ProtectedRoute";
import AdminCampaignPayouts from "@/views/AdminCampaignPayouts";

export default function AdminPayoutsPage() {
  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <AdminCampaignPayouts />
    </ProtectedRoute>
  );
}
