"use client";

import { ProtectedRoute } from "@/components/ProtectedRoute";
import AdminSubmissions from "@/views/AdminSubmissions";

export default function AdminSubmissionsPage() {
  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <AdminSubmissions />
    </ProtectedRoute>
  );
}
