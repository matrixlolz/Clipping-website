"use client";

import { ProtectedRoute } from "@/components/ProtectedRoute";
import Launch from "@/views/Launch";

export default function LaunchPage() {
  return (
    <ProtectedRoute allowedRoles={["admin", "brand"]} alsoAllowWhopTeamAdmin>
      <Launch />
    </ProtectedRoute>
  );
}
