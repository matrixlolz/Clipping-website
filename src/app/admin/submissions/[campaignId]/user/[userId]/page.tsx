"use client";

import { ProtectedRoute } from "@/components/ProtectedRoute";
import AdminUserSubmissions from "@/views/AdminUserSubmissions";

export default function AdminUserSubmissionsPage() {
  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <AdminUserSubmissions />
    </ProtectedRoute>
  );
}
