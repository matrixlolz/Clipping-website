"use client";

import { Instagram, Youtube } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PlatformType } from "@/hooks/useCampaigns";

/** TikTok mark (no official Lucide brand icon). */
function TikTokBrand({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden
      className={cn("shrink-0", className)}
      fill="currentColor"
    >
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
    </svg>
  );
}

/** X (Twitter) mark — Lucide only ships the legacy bird; this matches current X branding. */
function XBrand({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden
      className={cn("shrink-0", className)}
      fill="currentColor"
    >
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

const SIZE_FORM = "h-5 w-5";
const SIZE_PREVIEW = "h-3.5 w-3.5";

export function platformBrandIcon(platform: PlatformType, variant: "form" | "preview" = "form") {
  const s = variant === "form" ? SIZE_FORM : SIZE_PREVIEW;
  switch (platform) {
    case "tiktok":
      return <TikTokBrand className={s} />;
    case "instagram":
      return <Instagram className={s} strokeWidth={1.75} />;
    case "youtube":
      return <Youtube className={s} />;
    case "twitter":
      return <XBrand className={s} />;
    default:
      return null;
  }
}
