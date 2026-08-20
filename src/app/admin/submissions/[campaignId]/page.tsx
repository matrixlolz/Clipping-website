"use client";

import { ProtectedRoute } from "@/components/ProtectedRoute";
import AdminCampaignSubmissions from "@/views/AdminCampaignSubmissions";

export default function AdminCampaignSubmissionsPage() {
  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <AdminCampaignSubmissions />
    </ProtectedRoute>
  );
}
