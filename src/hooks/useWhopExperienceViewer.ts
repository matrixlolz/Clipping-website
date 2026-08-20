"use client";

import { useContext, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { WhopBusinessLayoutContext } from "@/components/providers/WhopBusinessProvider";
import type { WhopViewer } from "@/types/whop-viewer";

const STORAGE_KEY = "whop_dev_user_token";

/**
 * Whop profile for the iframe user, tied to the current experience id from layout context.
 * Prefers server-resolved viewer; otherwise calls `/api/whop/me` (header + dev query token).
 */
export function useWhopExperienceViewer(): {
  viewer: WhopViewer | null;
  /** True until the first client/server resolution attempt for this experience has finished. */
  viewerResolved: boolean;
  experienceId: string | null;
} {
  const ctx = useContext(WhopBusinessLayoutContext);
  const pathname = usePathname();
  const experienceId = ctx?.experienceId ?? null;
  const serverViewer = ctx?.whopViewer ?? null;

  const [clientViewer, setClientViewer] = useState<WhopViewer | null>(null);
  const [fetchDone, setFetchDone] = useState(() => {
    if (!experienceId) return true;
    if (serverViewer) return true;
    return false;
  });

  useEffect(() => {
    if (!experienceId) {
      setClientViewer(null);
      setFetchDone(true);
      return;
    }

    if (serverViewer) {
      setClientViewer(null);
      setFetchDone(true);
      return;
    }

    let cancelled = false;
    setFetchDone(false);

    (async () => {
      try {
        const fromUrl =
          typeof window !== "undefined"
            ? new URLSearchParams(window.location.search).get("whop-dev-user-token")
            : null;
        if (typeof window !== "undefined" && fromUrl) {
          sessionStorage.setItem(STORAGE_KEY, fromUrl);
        }

        const stored =
          typeof window !== "undefined" ? sessionStorage.getItem(STORAGE_KEY) : null;
        const devToken = fromUrl || stored;

        const qs = new URLSearchParams();
        qs.set("experienceId", experienceId);
        if (devToken && process.env.NODE_ENV !== "production") {
          qs.set("whop-dev-user-token", devToken);
        }

        const headers: Record<string, string> = {};
        if (devToken) {
          headers["x-whop-user-token"] = devToken;
        }

        const res = await fetch(`/api/whop/me?${qs.toString()}`, {
          headers,
          credentials: "include",
        });
        const data = (await res.json()) as { user: WhopViewer | null };
        if (!cancelled) {
          setClientViewer(data.user ?? null);
        }
      } catch {
        if (!cancelled) {
          setClientViewer(null);
        }
      } finally {
        if (!cancelled) {
          setFetchDone(true);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [experienceId, serverViewer, pathname]);

  const viewer = serverViewer ?? clientViewer;

  return {
    viewer,
    viewerResolved: fetchDone,
    experienceId,
  };
}
