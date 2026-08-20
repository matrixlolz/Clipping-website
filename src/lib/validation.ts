import { z } from "zod";
import { parseCampaignImageUrls } from "@/lib/campaign-images";

/**
 * Campaign creation validation schema
 * Enforces proper input validation to prevent malicious data
 */
export const campaignSchema = z.object({
  name: z
    .string()
    .min(1, "Campaign name is required")
    .max(200, "Campaign name must be less than 200 characters")
    .trim(),
  description: z
    .string()
    .max(2000, "Description must be less than 2000 characters")
    .optional()
    .transform(val => val?.trim() || undefined),
  requirements: z
    .string()
    .max(2000, "Requirements must be less than 2000 characters")
    .optional()
    .transform(val => val?.trim() || undefined),
  niche: z
    .string()
    .max(100, "Category must be less than 100 characters")
    .optional()
    .transform(val => val?.trim() || undefined),
  platforms: z
    .array(z.enum(["tiktok", "instagram", "youtube", "twitter"]))
    .min(1, "At least one platform is required"),
  rate_value: z
    .number()
    .positive("Rate must be greater than 0")
    .min(0.01, "Rate must be at least $0.01")
    .max(10000, "Rate cannot exceed $10,000"),
  rate_unit: z
    .number()
    .int("Rate unit must be a whole number")
    .positive("Rate unit must be greater than 0")
    .min(1000, "Rate unit must be at least 1,000 views")
    .max(100000000, "Rate unit cannot exceed 100,000,000 views"),
  min_views: z
    .number()
    .int("Minimum views must be a whole number")
    .positive("Minimum views must be greater than 0")
    .min(1, "Minimum views must be at least 1")
    .max(100000000, "Minimum views cannot exceed 100,000,000")
    .optional()
    .default(1000),
  max_earnings_per_post: z
    .number()
    .positive("Max earnings must be greater than 0")
    .max(1000000, "Max earnings cannot exceed $1,000,000")
    .optional(),
  total_budget: z
    .number()
    .positive("Budget must be greater than 0")
    .min(1, "Budget must be at least $1")
    .max(100000000, "Budget cannot exceed $100,000,000"),
  image_url: z
    .string()
    .optional()
    .refine(
      (val) => {
        if (val === undefined || val === "") return true;
        const urls = parseCampaignImageUrls(val);
        return (
          urls.length > 0 &&
          urls.every((u) => {
            try {
              return Boolean(new URL(u));
            } catch {
              return false;
            }
          })
        );
      },
      { message: "Invalid image URL(s)" }
    ),
});

export type CampaignInput = z.infer<typeof campaignSchema>;

// Output type with required fields for database insertion
export interface ValidatedCampaignData {
  name: string;
  description?: string;
  requirements?: string;
  niche?: string;
  platforms: ("tiktok" | "instagram" | "youtube" | "twitter")[];
  rate_value: number;
  rate_unit: number;
  min_views: number;
  max_earnings_per_post?: number;
  total_budget: number;
  image_url?: string;
}

/**
 * Validate and sanitize campaign input
 */
export function validateCampaignInput(input: {
  name: string;
  description?: string;
  requirements?: string;
  platforms: ("tiktok" | "instagram" | "youtube" | "twitter")[];
  niche?: string;
  rate_value: number;
  rate_unit: number;
  min_views?: number;
  max_earnings_per_post?: number;
  total_budget: number;
  image_url?: string;
}): { success: true; data: ValidatedCampaignData } | { success: false; error: string } {
  const result = campaignSchema.safeParse(input);
  
  if (!result.success) {
    // Return the first validation error message
    const firstError = result.error.errors[0];
    return { success: false, error: firstError.message };
  }
  
  // Cast to the proper output type
  return { 
    success: true, 
    data: result.data as ValidatedCampaignData 
  };
}
