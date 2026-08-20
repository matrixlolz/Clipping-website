"use client";

import { useState, useEffect } from "react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import CustomerDashboard from "@/views/customer/CustomerDashboard";

export function CustomerDashboardClient() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <ProtectedRoute>
      <CustomerDashboard />
    </ProtectedRoute>
  );
}
