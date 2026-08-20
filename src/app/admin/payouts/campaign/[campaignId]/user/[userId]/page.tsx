"use client";

import { ProtectedRoute } from "@/components/ProtectedRoute";
import AdminUserDetail from "@/views/AdminUserDetail";

export default function AdminUserDetailPage() {
  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <AdminUserDetail />
    </ProtectedRoute>
  );
}
