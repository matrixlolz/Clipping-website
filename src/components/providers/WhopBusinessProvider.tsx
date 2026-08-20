"use client";

import { createContext, useMemo, type ReactNode } from "react";
import type { WhopViewer } from "@/types/whop-viewer";

export type WhopBusinessLayoutValue = {
  experienceId: string;
  companyName: string | null;
  /** Whop company id (`biz_…`) for this experience; used to scope campaigns. */
  whopCompanyId: string | null;
  /**
   * Whop access level for this user on the experience/company (`users.checkAccess`).
   * When `"admin"`, the user may use the embedded admin dashboard without Apex app role.
   */
  whopExperienceAccessLevel: "no_access" | "admin" | "customer" | null;
  /** Resolved on the server from `x-whop-user-token` + experience id when available. */
  whopViewer: WhopViewer | null;
};

export const WhopBusinessLayoutContext = createContext<WhopBusinessLayoutValue | null>(null);

export function WhopBusinessProvider({
  experienceId,
  companyName,
  whopCompanyId,
  whopExperienceAccessLevel,
  whopViewer,
  children,
}: {
  experienceId: string;
  companyName: string | null;
  whopCompanyId: string | null;
  whopExperienceAccessLevel: "no_access" | "admin" | "customer" | null;
  whopViewer: WhopViewer | null;
  children: ReactNode;
}) {
  const value = useMemo(
    () => ({
      experienceId,
      companyName,
      whopCompanyId,
      whopExperienceAccessLevel,
      whopViewer,
    }),
    [experienceId, companyName, whopCompanyId, whopExperienceAccessLevel, whopViewer]
  );
  return (
    <WhopBusinessLayoutContext.Provider value={value}>
      {children}
    </WhopBusinessLayoutContext.Provider>
  );
}
