"use client";

import { ProtectedRoute } from "@/components/ProtectedRoute";
import AdminBrands from "@/views/AdminBrands";

export default function AdminBrandsPage() {
  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <AdminBrands />
    </ProtectedRoute>
  );
}
