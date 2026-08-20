"use client";

import { ProtectedRoute } from "@/components/ProtectedRoute";
import BrandApplication from "@/views/BrandApplication";

export default function BrandApplicationPage() {
  return (
    <ProtectedRoute>
      <BrandApplication />
    </ProtectedRoute>
  );
}
