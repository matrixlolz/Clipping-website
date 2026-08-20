"use client";

import { ProtectedRoute } from "@/components/ProtectedRoute";
import SocialAccounts from "@/views/SocialAccounts";

export default function SocialAccountsPage() {
  return (
    <ProtectedRoute>
      <SocialAccounts />
    </ProtectedRoute>
  );
}
