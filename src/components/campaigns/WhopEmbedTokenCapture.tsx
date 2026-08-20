"use client";

import { Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { WHOP_EMBED_TOKEN_STORAGE_KEY } from "@/lib/whop-embed-token";

function WhopEmbedTokenCaptureInner() {
  const searchParams = useSearchParams();
  useEffect(() => {
    const t = searchParams.get("whop-dev-user-token");
    if (t) {
      sessionStorage.setItem(WHOP_EMBED_TOKEN_STORAGE_KEY, t);
    }
  }, [searchParams]);
  return null;
}

/** Copies Whop dev token from the URL into sessionStorage so API calls can send `x-whop-user-token`. */
export function WhopEmbedTokenCapture() {
  return (
    <Suspense fallback={null}>
      <WhopEmbedTokenCaptureInner />
    </Suspense>
  );
}
