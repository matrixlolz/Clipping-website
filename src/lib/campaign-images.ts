/** Max thumbnails users can attach on launch (matches preview fan stack). */
export const MAX_CAMPAIGN_THUMBNAILS = 5;

/**
 * Parse `campaigns.image_url`: legacy single URL, or JSON array of URLs.
 */
export function parseCampaignImageUrls(raw: string | null | undefined): string[] {
  if (!raw || !String(raw).trim()) return [];
  const t = String(raw).trim();
  if (t.startsWith("[")) {
    try {
      const parsed = JSON.parse(t) as unknown;
      if (Array.isArray(parsed)) {
        return parsed.filter((x): x is string => typeof x === "string" && x.length > 0);
      }
    } catch {
      /* treat as plain URL */
    }
  }
  return [t];
}

export function primaryCampaignImageUrl(raw: string | null | undefined): string | undefined {
  const urls = parseCampaignImageUrls(raw);
  return urls[0];
}

/** Persist thumbnails as JSON array string (single column). */
export function serializeCampaignImageUrls(urls: (string | null | undefined)[]): string | undefined {
  const clean = urls.map((u) => (typeof u === "string" ? u.trim() : "")).filter(Boolean);
  if (clean.length === 0) return undefined;
  return JSON.stringify(clean);
}
