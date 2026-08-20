"use client";

import { ProtectedRoute } from "@/components/ProtectedRoute";
import AdminSocialAccounts from "@/views/AdminSocialAccounts";

export default function AdminSocialAccountsPage() {
  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <AdminSocialAccounts />
    </ProtectedRoute>
  );
}
