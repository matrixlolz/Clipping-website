"use client";

import { ProtectedRoute } from "@/components/ProtectedRoute";
import Earnings from "@/views/Earnings";

export default function EarningsPage() {
  return (
    <ProtectedRoute>
      <Earnings />
    </ProtectedRoute>
  );
}
