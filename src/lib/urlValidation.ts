/**
 * URL validation for social media platforms
 */

export type SocialPlatform = "tiktok" | "instagram" | "youtube" | "twitter";

const PLATFORM_PATTERNS: Record<SocialPlatform, RegExp[]> = {
  tiktok: [
    /^https?:\/\/(www\.)?tiktok\.com\/@[\w.-]+\/video\/\d+/i,
    /^https?:\/\/(www\.)?tiktok\.com\/t\/[\w]+/i,
    /^https?:\/\/vm\.tiktok\.com\/[\w]+/i,
    /^https?:\/\/vt\.tiktok\.com\/[\w]+/i,
  ],
  instagram: [
    /^https?:\/\/(www\.)?instagram\.com\/(p|reel|reels)\/[\w-]+/i,
    /^https?:\/\/instagr\.am\/(p|reel)\/[\w-]+/i,
  ],
  youtube: [
    /^https?:\/\/(www\.)?youtube\.com\/watch\?v=[\w-]+/i,
    /^https?:\/\/(www\.)?youtube\.com\/shorts\/[\w-]+/i,
    /^https?:\/\/youtu\.be\/[\w-]+/i,
  ],
  twitter: [
    /^https?:\/\/(www\.)?x\.com\/[^/]+\/status\/\d+/i,
    /^https?:\/\/(www\.)?twitter\.com\/[^/]+\/status\/\d+/i,
  ],
};

/**
 * Validate if a URL belongs to the specified platform
 */
export function isValidSocialUrl(url: string, platform: SocialPlatform): boolean {
  const patterns = PLATFORM_PATTERNS[platform];
  return patterns.some(pattern => pattern.test(url.trim()));
}

/**
 * Validate URL and return error message if invalid
 */
export function validateClipUrl(url: string, platform: SocialPlatform): string | null {
  if (!url.trim()) {
    return "URL is required";
  }

  // Basic URL check
  try {
    new URL(url.trim());
  } catch {
    return "Please enter a valid URL";
  }

  if (!isValidSocialUrl(url, platform)) {
    const platformExamples: Record<SocialPlatform, string> = {
      tiktok: "https://tiktok.com/@username/video/123... or https://vm.tiktok.com/...",
      instagram: "https://instagram.com/reel/... or https://instagram.com/p/...",
      youtube: "https://youtube.com/shorts/... or https://youtu.be/...",
      twitter: "https://x.com/username/status/123... or https://twitter.com/username/status/123...",
    };
    return `Invalid ${platform} URL. Example: ${platformExamples[platform]}`;
  }

  return null;
}

/**
 * Extract video ID from TikTok URL (for API calls)
 */
export function extractTikTokVideoId(url: string): string | null {
  // Match full video URL format
  const fullMatch = url.match(/tiktok\.com\/@[\w.-]+\/video\/(\d+)/i);
  if (fullMatch) return fullMatch[1];

  // For short URLs, we can't extract the ID directly
  // The API will need to resolve the redirect
  return null;
}
