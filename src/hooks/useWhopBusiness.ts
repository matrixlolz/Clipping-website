"use client";

import { useContext, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { WhopBusinessLayoutContext } from "@/components/providers/WhopBusinessProvider";

interface WhopBusinessState {
  name: string | null;
  loading: boolean;
}

// Extract exp_xxx from paths like /experiences/exp_xxx/...
function extractExperienceId(pathname: string): string | null {
  const match = pathname.match(/\/experiences\/(exp_[A-Za-z0-9_-]+)/);
  return match ? match[1] : null;
}

export function useWhopBusiness(): WhopBusinessState {
  const layout = useContext(WhopBusinessLayoutContext);
  const pathname = usePathname();
  const pathExpId = extractExperienceId(pathname);
  const fromLayout =
    layout != null && pathExpId != null && pathExpId === layout.experienceId;

  const [clientState, setClientState] = useState<WhopBusinessState>({
    name: null,
    loading: true,
  });

  useEffect(() => {
    if (fromLayout) {
      return;
    }

    const experienceId = pathExpId;
    if (!experienceId) {
      setClientState({ name: null, loading: false });
      return;
    }

    let cancelled = false;

    async function fetchBusinessName() {
      try {
        const res = await fetch(
          `/api/whop/company?experienceId=${encodeURIComponent(experienceId)}`
        );
        const data = await res.json();
        if (!cancelled) {
          setClientState({ name: data.name ?? null, loading: false });
        }
      } catch {
        if (!cancelled) {
          setClientState({ name: null, loading: false });
        }
      }
    }

    fetchBusinessName();
    return () => {
      cancelled = true;
    };
  }, [fromLayout, pathExpId, pathname]);

  if (fromLayout) {
    return { name: layout.companyName, loading: false };
  }

  return clientState;
}
