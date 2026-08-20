"use client";

import { useState, useRef, useContext, useEffect, useMemo, type ReactNode } from "react";
import { v4 as uuidv4 } from "uuid";
import Image from "next/image";
import { AppLayout } from "@/components/app/AppLayout";
import {
  Banknote,
  CircleDollarSign,
  Info,
  ArrowRight,
  ArrowLeft,
  Upload,
  Wallet,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useParams, useRouter } from "next/navigation";
import { getCampaignsListHref } from "@/lib/campaign-routes";
import {
  useCreateCampaign,
  type CampaignStatus,
  type PlatformType,
} from "@/hooks/useCampaigns";
import { mapErrorToUserMessage, logError } from "@/lib/errorMapping";
import { useAuth } from "@/hooks/useAuth";
import { WhopBusinessLayoutContext } from "@/components/providers/WhopBusinessProvider";
import { LaunchGlassPreview } from "@/components/campaigns/LaunchGlassPreview";
import {
  LaunchContentRequirementsStep,
  PRESET_REQUIREMENT_LABELS,
  linkTypeLabel,
  type ContentLinkRow,
} from "@/components/campaigns/LaunchContentRequirementsStep";
import {
  LaunchCampaignSettingsStep,
  type ApplicationQuestionRow,
} from "@/components/campaigns/LaunchCampaignSettingsStep";
import { CAMPAIGN_CATEGORIES, CAMPAIGN_TYPES } from "@/lib/campaign-taxonomy";
import { MAX_CAMPAIGN_THUMBNAILS, serializeCampaignImageUrls } from "@/lib/campaign-images";
import { cn } from "@/lib/utils";
import { platformBrandIcon } from "@/components/campaigns/PlatformBrandIcons";
import { LaunchFundCampaignStep } from "@/components/campaigns/LaunchFundCampaignStep";

type RewardMode = "global" | "per_platform";
type PlatformRewardInputs = Record<
  PlatformType,
  { ratePerThousand: string; minPayoutAmount: string; maxPayout: string }
>;

/** Converts minimum payout ($) + rate ($/1k views) → view threshold for API `min_payout_views`. */
function dollarsToMinPayoutViews(dollars: number, ratePerThousand: number): number {
  if (!Number.isFinite(dollars) || !Number.isFinite(ratePerThousand) || ratePerThousand <= 0) {
    return 0;
  }
  return Math.max(0, Math.round((dollars / ratePerThousand) * 1000));
}

/** Helper line like "~ 1.2k views" from dollar amount at current rate. */
function approxViewsHintFromDollars(dollars: number, ratePerThousand: number): string {
  const v = dollarsToMinPayoutViews(dollars, ratePerThousand);
  if (v <= 0) return "~ — views";
  if (v >= 1000) {
    const k = v / 1000;
    const s = Number.isInteger(k) ? String(k) : k.toFixed(1).replace(/\.0$/, "");
    return `~ ${s}k views`;
  }
  return `~ ${v.toLocaleString()} views`;
}

/** Split user input on commas and/or whitespace into non-empty tokens. */
function parseCommaSpaceList(raw: string): string[] {
  const t = raw.trim();
  if (!t) return [];
  return t
    .split(/[\s,]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

const PLATFORM_OPTIONS: { id: PlatformType; label: string }[] = [
  { id: "tiktok", label: "TikTok" },
  { id: "instagram", label: "Instagram" },
  { id: "youtube", label: "YouTube" },
  { id: "twitter", label: "X" },
];
const DRAFT_TTL_MS = 10 * 60 * 1000;
/** Hidden default when budget field is not shown in the form. */
const DEFAULT_TOTAL_BUDGET = 500;

export type LaunchMode = "page" | "embedded";

export interface LaunchProps {
  /** `embedded` = inside a dialog (no full-page layout). */
  mode?: LaunchMode;
  /** Called after successful create when embedded, and to dismiss the dialog. */
  onClose?: () => void;
}

const Launch = ({ mode = "page", onClose }: LaunchProps) => {
  const params = useParams();
  const experienceId = params.experienceId as string | undefined;
  const whopLayout = useContext(WhopBusinessLayoutContext);
  const whopCompanyId =
    experienceId && whopLayout?.experienceId === experienceId
      ? whopLayout.whopCompanyId
      : null;
  const [step, setStep] = useState(1);
  const [thumbnailUrls, setThumbnailUrls] = useState<(string | null)[]>(() =>
    Array.from({ length: MAX_CAMPAIGN_THUMBNAILS }, () => null),
  );
  const [uploadingSlot, setUploadingSlot] = useState<number | null>(null);
  const [isDraftExpired, setIsDraftExpired] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pendingSlotRef = useRef(0);
  /** Stable UUID for this launch session — matches DB `campaigns.id` after successful create. */
  const draftCampaignIdRef = useRef<string | null>(null);
  if (draftCampaignIdRef.current === null) {
    draftCampaignIdRef.current =
      typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
        ? crypto.randomUUID()
        : uuidv4();
  }
  const draftCampaignId = draftCampaignIdRef.current;
  const campaignCreatedRef = useRef(false);
  const { user, profile } = useAuth();
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    campaign_type: "UGC",
    requirements: "",
    niche: "",
    platforms: [] as PlatformType[],
    rate_value: "",
    rate_unit: "1000",
    min_views: "0",
    /** Minimum payout in dollars (converted to `min_payout_views` on submit). */
    min_payout_amount: "1",
    max_earnings_per_post: "10",
    total_budget: String(DEFAULT_TOTAL_BUDGET),
    duration_days: "30",
    required_hashtags: "",
    required_bio_mentions: "",
    required_caption_mentions: "",
    /** URL for the "Specific sound/music" preset (e.g. TikTok music page). */
    required_music_url: "",
  });
  const [rewardMode, setRewardMode] = useState<RewardMode>("global");
  const [platformRewards, setPlatformRewards] = useState<PlatformRewardInputs>({
    tiktok: { ratePerThousand: "1", minPayoutAmount: "1", maxPayout: "10" },
    instagram: { ratePerThousand: "1", minPayoutAmount: "1", maxPayout: "10" },
    youtube: { ratePerThousand: "1", minPayoutAmount: "1", maxPayout: "10" },
    twitter: { ratePerThousand: "1", minPayoutAmount: "1", maxPayout: "10" },
  });
  const [activeRewardPlatform, setActiveRewardPlatform] = useState<PlatformType>("youtube");
  const [contentRequirementDraft, setContentRequirementDraft] = useState("");
  const [customContentRequirements, setCustomContentRequirements] = useState<string[]>([]);
  const [contentLinks, setContentLinks] = useState<ContentLinkRow[]>([]);
  const [linkDraft, setLinkDraft] = useState({
    linkType: "google_drive",
    label: "",
    url: "",
  });
  const [selectedRequirementPresets, setSelectedRequirementPresets] = useState<Set<string>>(
    () => new Set(),
  );
  const [requireApplication, setRequireApplication] = useState(false);
  const [applicationQuestions, setApplicationQuestions] = useState<ApplicationQuestionRow[]>([]);
  const [showOnDiscover, setShowOnDiscover] = useState(true);
  const [whopProductId, setWhopProductId] = useState("");
  const [whopProducts, setWhopProducts] = useState<{ id: string; title: string }[]>([]);
  const { toast } = useToast();
  const router = useRouter();
  const createCampaign = useCreateCampaign();
  const platformIconMap = useMemo(() => {
    const ids: PlatformType[] = ["tiktok", "instagram", "youtube", "twitter"];
    return ids.reduce<Record<string, ReactNode>>((acc, id) => {
      acc[id] = platformBrandIcon(id, "preview");
      return acc;
    }, {});
  }, []);

  const authorDisplayName =
    profile?.full_name?.trim() ||
    profile?.email?.split("@")[0] ||
    user?.email?.split("@")[0] ||
    "You";

  const filledThumbnailUrls = thumbnailUrls.filter((u): u is string => Boolean(u));
  const hasAtLeastOneThumbnail = filledThumbnailUrls.length > 0;

  const addCustomContentRequirement = () => {
    const t = contentRequirementDraft.trim();
    if (!t) return;
    setCustomContentRequirements((prev) => [...prev, t]);
    setContentRequirementDraft("");
  };

  const addContentLinkRow = () => {
    const url = linkDraft.url.trim();
    if (!url) {
      toast({ title: "URL required", description: "Paste a link before adding.", variant: "destructive" });
      return;
    }
    setContentLinks((prev) => [
      ...prev,
      {
        id: uuidv4(),
        linkType: linkDraft.linkType,
        label: linkDraft.label.trim(),
        url: url.trim(),
      },
    ]);
    setLinkDraft((d) => ({ ...d, label: "", url: "" }));
  };

  const toggleRequirementPreset = (id: string) => {
    setSelectedRequirementPresets((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  useEffect(() => {
    if (!selectedRequirementPresets.has("specific_sound")) {
      setFormData((fd) =>
        fd.required_music_url ? { ...fd, required_music_url: "" } : fd,
      );
    }
  }, [selectedRequirementPresets]);

  useEffect(() => {
    if (!requireApplication) {
      setApplicationQuestions([]);
    }
  }, [requireApplication]);

  useEffect(() => {
    if (!whopCompanyId) {
      setWhopProducts([]);
      return;
    }
    let cancelled = false;
    void fetch(`/api/whop/products?companyId=${encodeURIComponent(whopCompanyId)}`)
      .then((r) => r.json())
      .then((d: { products?: { id: string; title: string }[] }) => {
        if (!cancelled) setWhopProducts(Array.isArray(d.products) ? d.products : []);
      })
      .catch(() => {
        if (!cancelled) setWhopProducts([]);
      });
    return () => {
      cancelled = true;
    };
  }, [whopCompanyId]);

  const hasAtLeastOneContentRequirement = useMemo(() => {
    if (customContentRequirements.length > 0) return true;
    if (contentLinks.length > 0) return true;
    if (parseCommaSpaceList(formData.required_hashtags).length > 0) return true;
    if (parseCommaSpaceList(formData.required_bio_mentions).length > 0) return true;
    if (parseCommaSpaceList(formData.required_caption_mentions).length > 0) return true;
    if (selectedRequirementPresets.has("face_camera")) return true;
    if (selectedRequirementPresets.has("specific_sound") && formData.required_music_url.trim()) {
      return true;
    }
    return false;
  }, [
    customContentRequirements,
    contentLinks,
    formData.required_hashtags,
    formData.required_bio_mentions,
    formData.required_caption_mentions,
    formData.required_music_url,
    selectedRequirementPresets,
  ]);

  /** Product required when listing on Discover (Whop company context). */
  const whopProductRequired = Boolean(whopCompanyId && showOnDiscover);

  const editContentLink = (row: ContentLinkRow) => {
    setLinkDraft({ linkType: row.linkType, label: row.label, url: row.url });
    setContentLinks((prev) => prev.filter((l) => l.id !== row.id));
  };

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      if (campaignCreatedRef.current) return;
      const id = draftCampaignIdRef.current;
      setIsDraftExpired(true);
      setThumbnailUrls(Array.from({ length: MAX_CAMPAIGN_THUMBNAILS }, () => null));
      if (!id) return;
      void fetch(`/api/campaign-draft/${id}`, { method: "DELETE", keepalive: true }).catch(
        () => {},
      );
      toast({
        title: "Draft expired",
        description: "This draft was inactive for 10 minutes and was removed.",
        variant: "destructive",
      });
    }, DRAFT_TTL_MS);

    return () => {
      window.clearTimeout(timeoutId);
      if (campaignCreatedRef.current) return;
      const id = draftCampaignIdRef.current;
      if (!id) return;
      void fetch(`/api/campaign-draft/${id}`, { method: "DELETE", keepalive: true }).catch(
        () => {},
      );
    };
  }, [toast]);

  /** Step 1 embedded — same brand outline as rest of app (primary ring). */
  const step1Shell =
    mode === "embedded"
      ? "rounded-2xl border border-primary/25 bg-card/80 p-5 shadow-[inset_0_1px_0_hsl(var(--primary)/0.12),0_20px_60px_rgba(0,0,0,0.45)] backdrop-blur-xl sm:p-6"
      : "space-y-6 p-6 rounded-2xl bg-card border border-border";

  const step1Label = mode === "embedded" ? "text-xs font-medium text-primary/90" : undefined;
  const step1Input =
    mode === "embedded"
      ? "h-11 border-primary/35 bg-background/50 text-foreground placeholder:text-muted-foreground focus-visible:border-primary/60 focus-visible:ring-primary/25"
      : "h-12 bg-secondary border-border";
  const step1Textarea =
    mode === "embedded"
      ? "min-h-[120px] border-primary/35 bg-background/50 text-foreground placeholder:text-muted-foreground focus-visible:border-primary/60 focus-visible:ring-primary/25 resize-none"
      : "min-h-[120px] bg-secondary border-border resize-none";
  const step1SelectTrigger =
    mode === "embedded"
      ? "h-11 border-primary/35 bg-background/50 text-foreground focus:ring-primary/25 data-[placeholder]:text-muted-foreground"
      : "";

  const handleInputChange = (field: string, value: string | PlatformType[]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const togglePlatform = (platform: PlatformType) => {
    const current = formData.platforms;
    if (current.includes(platform)) {
      const next = current.filter(p => p !== platform);
      handleInputChange("platforms", next);
      if (activeRewardPlatform === platform && next.length > 0) {
        setActiveRewardPlatform(next[0]!);
      }
    } else {
      handleInputChange("platforms", [...current, platform]);
      if (!current.length) setActiveRewardPlatform(platform);
    }
  };
  const updatePlatformReward = (
    platform: PlatformType,
    field: keyof PlatformRewardInputs[PlatformType],
    value: string,
  ) => {
    setPlatformRewards((prev) => ({
      ...prev,
      [platform]: { ...prev[platform], [field]: value },
    }));
  };
  const areRewardsValid = (): boolean => {
    if (rewardMode === "global") {
      const rate = parseFloat(formData.rate_value || "0");
      const minPay = parseFloat(formData.min_payout_amount || "0");
      const maxPay = parseFloat(formData.max_earnings_per_post || "0");
      return rate > 0 && minPay > 0 && maxPay > 0;
    }
    return (
      formData.platforms.length > 0 &&
      formData.platforms.every((p) => {
        const r = platformRewards[p];
        return (
          parseFloat(r.ratePerThousand || "0") > 0 &&
          parseFloat(r.minPayoutAmount || "0") > 0 &&
          parseFloat(r.maxPayout || "0") > 0
        );
      })
    );
  };

  const openThumbnailUpload = (slot: number) => {
    pendingSlotRef.current = slot;
    fileInputRef.current?.click();
  };

  const clearThumbnail = (slot: number) => {
    setThumbnailUrls((prev) => {
      const next = [...prev];
      next[slot] = null;
      return next;
    });
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    event.target.value = "";
    if (files.length === 0) return;
    if (isDraftExpired) {
      toast({
        title: "Draft expired",
        description: "Start a new campaign draft to upload thumbnails.",
        variant: "destructive",
      });
      return;
    }

    const token = typeof window !== "undefined" ? localStorage.getItem("apex_auth_token") : null;

    const availableSlots = thumbnailUrls
      .map((u, i) => (u ? -1 : i))
      .filter((i) => i >= 0);
    if (availableSlots.length === 0) {
      toast({ title: "All slots filled", description: "Remove one thumbnail to upload another." });
      return;
    }

    const selectedSlots: number[] = [];
    const preferredSlot = pendingSlotRef.current;
    if (availableSlots.includes(preferredSlot)) selectedSlots.push(preferredSlot);
    for (const s of availableSlots) {
      if (selectedSlots.length >= Math.min(files.length, availableSlots.length)) break;
      if (!selectedSlots.includes(s)) selectedSlots.push(s);
    }
    const uploadCount = Math.min(files.length, selectedSlots.length);

    let uploaded = 0;
    for (let idx = 0; idx < uploadCount; idx++) {
      const file = files[idx]!;
      const slot = selectedSlots[idx]!;
      if (!file.type.startsWith("image/")) {
        toast({ title: "Invalid file", description: `${file.name} is not an image.`, variant: "destructive" });
        continue;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast({ title: "File too large", description: `${file.name} exceeds 5MB.`, variant: "destructive" });
        continue;
      }

      setUploadingSlot(slot);
      try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("slot", String(slot));
        formData.append("campaignId", draftCampaignId);

        const res = await fetch("/api/campaign-thumbnail", {
          method: "POST",
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
          body: formData,
        });

        const payload = (await res.json().catch(() => ({}))) as { url?: string; error?: string; hint?: string };
        if (!res.ok) {
          const msg = payload.error || "Upload failed";
          const hint = payload.hint ? ` ${payload.hint}` : "";
          throw new Error(`${msg}${hint}`);
        }
        if (!payload.url) throw new Error("Upload succeeded but no URL returned");

        const finalUrl = `${payload.url}${payload.url.includes("?") ? "&" : "?"}v=${Date.now()}`;
        setThumbnailUrls((prev) => {
          const next = [...prev];
          next[slot] = finalUrl;
          return next;
        });
        uploaded += 1;
      } catch (error: unknown) {
        logError("Launch:handleImageUpload", error);
        toast({ title: "Upload failed", description: mapErrorToUserMessage(error), variant: "destructive" });
      } finally {
        setUploadingSlot(null);
      }
    }

    if (uploaded > 0) {
      toast({
        title: uploaded === 1 ? "Thumbnail uploaded" : "Thumbnails uploaded",
        description:
          uploadCount < files.length
            ? `Uploaded ${uploaded}. Extra files were skipped (max ${MAX_CAMPAIGN_THUMBNAILS} slots).`
            : undefined,
      });
    }
  };

  const finalizeCampaign = async (initialStatus: Extract<CampaignStatus, "pending" | "active">) => {
    if (isDraftExpired) {
      toast({
        title: "Draft expired",
        description: "Please start a new campaign.",
        variant: "destructive",
      });
      return;
    }

    if (formData.platforms.length === 0) {
      toast({
        title: "Select platforms",
        description: "Please select at least one platform",
        variant: "destructive",
      });
      return;
    }

    if (!formData.name.trim()) {
      toast({
        title: "Name required",
        description: "Please enter a campaign name",
        variant: "destructive",
      });
      return;
    }

    if (!hasAtLeastOneThumbnail) {
      toast({
        title: "Thumbnail required",
        description: "Upload at least one campaign thumbnail before launching.",
        variant: "destructive",
      });
      return;
    }

    if (
      selectedRequirementPresets.has("specific_sound") &&
      !formData.required_music_url.trim()
    ) {
      toast({
        title: "Sound or music link required",
        description:
          "Paste a link to the required audio track (e.g. a TikTok music URL) for Specific sound/music.",
        variant: "destructive",
      });
      return;
    }

    if (whopProductRequired && !whopProductId.trim()) {
      toast({
        title: "Select a product",
        description: "Choose the Whop product tied to this campaign.",
        variant: "destructive",
      });
      return;
    }

    if (
      requireApplication &&
      !applicationQuestions.some((q) => q.prompt.trim())
    ) {
      toast({
        title: "Application questions required",
        description:
          "Add at least one application question, or turn off Require application.",
        variant: "destructive",
      });
      return;
    }

    const budgetAmount = parseFloat(formData.total_budget);
    if (!Number.isFinite(budgetAmount) || budgetAmount <= 0) {
      toast({
        title: "Invalid budget",
        description: "Set a campaign budget greater than zero on the Fund step.",
        variant: "destructive",
      });
      return;
    }

    try {
      const selectedPlatformRewards = formData.platforms.map((p) => ({
        platform: p,
        ...platformRewards[p],
      }));
      const rewardSummary =
        rewardMode === "per_platform"
          ? selectedPlatformRewards
              .map(
                (r) =>
                  `${r.platform}: $${parseFloat(r.ratePerThousand || "0").toFixed(2)}/1,000 views` +
                  `, min payout $${parseFloat(r.minPayoutAmount || "0").toFixed(2)}` +
                  `, max payout $${parseFloat(r.maxPayout || "0").toFixed(2)}`,
              )
              .join(" | ")
          : "";
      const requirementsWithRewards = rewardSummary ? `Platform rewards: ${rewardSummary}` : "";
      const contentParts: string[] = [];
      if (customContentRequirements.length > 0) {
        contentParts.push(
          "Custom requirements:\n" + customContentRequirements.map((c) => `• ${c}`).join("\n"),
        );
      }
      if (contentLinks.length > 0) {
        contentParts.push(
          "Content links:\n" +
            contentLinks
              .map((l) => `• ${l.label.trim() || linkTypeLabel(l.linkType)}: ${l.url}`)
              .join("\n"),
        );
      }
      if (selectedRequirementPresets.size > 0) {
        const presetLines = [...selectedRequirementPresets].map((id) => {
          if (id === "specific_sound") {
            const u = formData.required_music_url.trim();
            return u
              ? `• ${PRESET_REQUIREMENT_LABELS[id]}: ${u}`
              : `• ${PRESET_REQUIREMENT_LABELS[id]}`;
          }
          return `• ${PRESET_REQUIREMENT_LABELS[id] ?? id}`;
        });
        contentParts.push("Enabled rules:\n" + presetLines.join("\n"));
      }
      const hashtagList = parseCommaSpaceList(formData.required_hashtags);
      const bioMentionList = parseCommaSpaceList(formData.required_bio_mentions);
      const captionMentionList = parseCommaSpaceList(formData.required_caption_mentions);
      if (hashtagList.length > 0) {
        contentParts.push("Required hashtags:\n" + hashtagList.map((h) => `• ${h}`).join("\n"));
      }
      if (bioMentionList.length > 0) {
        contentParts.push(
          "Required links/mentions in bio:\n" + bioMentionList.map((m) => `• ${m}`).join("\n"),
        );
      }
      if (captionMentionList.length > 0) {
        contentParts.push(
          "Required links/mentions in caption:\n" +
            captionMentionList.map((m) => `• ${m}`).join("\n"),
        );
      }
      const contentBlock = contentParts.join("\n\n");
      const settingsLines: string[] = [];
      settingsLines.push(`Require application: ${requireApplication ? "yes" : "no"}`);
      if (requireApplication) {
        const filled = applicationQuestions.filter((q) => q.prompt.trim());
        if (filled.length > 0) {
          settingsLines.push(
            "Application questions:\n" +
              filled
                .map(
                  (q, i) =>
                    `  ${i + 1}. [${q.questionType}] ${q.prompt.trim()}${q.required ? " (required)" : ""}`,
                )
                .join("\n"),
          );
        }
      }
      settingsLines.push(`Show on Discover: ${showOnDiscover ? "yes" : "no"}`);
      if (whopProductId.trim()) {
        const label =
          whopProducts.find((p) => p.id === whopProductId.trim())?.title ?? whopProductId.trim();
        settingsLines.push(`Whop product: ${label} (${whopProductId.trim()})`);
      }
      const settingsBlock = `Campaign settings:\n${settingsLines.join("\n")}`;
      const requirementsMerged = [requirementsWithRewards, contentBlock, settingsBlock]
        .filter(Boolean)
        .join("\n\n");
      const linkUrls = contentLinks.map((l) => l.url.trim()).filter(Boolean);
      const musicUrl = formData.required_music_url.trim();
      const allRequiredLinks = [
        ...linkUrls,
        ...bioMentionList,
        ...captionMentionList,
        ...(musicUrl ? [musicUrl] : []),
      ];
      const primaryPlatform = formData.platforms[0] || "tiktok";
      const primaryReward = platformRewards[primaryPlatform];

      await createCampaign.mutateAsync({
        campaignId: draftCampaignId,
        created_by: whopLayout?.whopViewer?.id ?? undefined,
        name: formData.name.trim(),
        whop_company_id: whopCompanyId ?? undefined,
        description: formData.description.trim() || undefined,
        requirements: requirementsMerged || undefined,
        platforms: formData.platforms,
        niche: formData.niche || undefined,
        rate_value:
          rewardMode === "per_platform"
            ? parseFloat(primaryReward.ratePerThousand) || 10
            : parseFloat(formData.rate_value) || 10,
        rate_unit: 1000,
        min_views: parseInt(formData.min_views, 10) || 0,
        min_payout_views:
          rewardMode === "per_platform"
            ? dollarsToMinPayoutViews(
                parseFloat(primaryReward.minPayoutAmount || "0"),
                parseFloat(primaryReward.ratePerThousand) || 10,
              )
            : dollarsToMinPayoutViews(
                parseFloat(formData.min_payout_amount || "0"),
                parseFloat(formData.rate_value) || 10,
              ),
        max_earnings_per_post:
          rewardMode === "per_platform"
            ? parseFloat(primaryReward.maxPayout || "0")
            : parseFloat(formData.max_earnings_per_post || "0"),
        total_budget: parseFloat(formData.total_budget) || DEFAULT_TOTAL_BUDGET,
        duration_days: parseInt(formData.duration_days, 10) || 30,
        required_hashtags: hashtagList.length > 0 ? hashtagList : undefined,
        required_links: allRequiredLinks.length > 0 ? allRequiredLinks : undefined,
        image_url: serializeCampaignImageUrls(thumbnailUrls),
        initialStatus,
      });

      campaignCreatedRef.current = true;
      if (initialStatus === "pending") {
        toast({
          title: "Campaign saved as pending",
          description:
            "Open My Campaigns and use the Pending tab to review it. Fund & activate when you’re ready to go live.",
        });
      } else {
        toast({
          title: "Campaign activated",
          description: showOnDiscover
            ? "Your campaign is live and visible to clippers on Discover."
            : "Your campaign is live for invited clippers.",
        });
      }
      if (mode === "embedded") {
        onClose?.();
        router.refresh();
      } else {
        router.push(getCampaignsListHref(experienceId));
      }
    } catch (error: unknown) {
      logError("Launch:finalizeCampaign", error);
      toast({
        title: "Error creating campaign",
        description: mapErrorToUserMessage(error),
        variant: "destructive",
      });
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
  };

  const progressSteps =
    mode !== "embedded" ? (
      <div className="mb-8">
        <div className="mb-4 flex items-center justify-between gap-1">
          {[1, 2, 3, 4, 5].map((s) => (
            <div key={s} className="flex min-w-0 flex-1 items-center">
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold transition-colors ${
                  step >= s
                    ? "bg-gradient-primary text-primary-foreground"
                    : "bg-secondary text-muted-foreground"
                }`}
              >
                {s}
              </div>
              {s < 5 && (
                <div
                  className={`mx-1.5 h-1 min-w-[24px] flex-1 rounded-full transition-colors sm:mx-2 ${
                    step > s ? "bg-primary" : "bg-secondary"
                  }`}
                />
              )}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-5 gap-1 text-center text-[10px] text-muted-foreground sm:text-xs">
          <span>Basics</span>
          <span>Platforms</span>
          <span>Requirements</span>
          <span>Settings</span>
          <span>Fund</span>
        </div>
      </div>
    ) : null;

  const campaignForm = (
        <form onSubmit={handleFormSubmit}>
          {/* Step 1: Basic Info */}
          {step === 1 && (
            <div className="grid items-start gap-4 sm:gap-6 sm:grid-cols-[minmax(0,1fr)_min(100%,300px)]">
              <div className={cn("space-y-6", step1Shell)}>
              {mode !== "embedded" ? (
                <div>
                  <h2 className="mb-1 text-xl font-semibold">Campaign Details</h2>
                  <p className="text-sm text-muted-foreground">
                    Tell clippers what your campaign is about
                  </p>
                </div>
              ) : null}

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className={step1Label}>
                    Campaign Name *
                  </Label>
                  <Input
                    id="name"
                    placeholder="e.g., Summer highlights campaign"
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    required
                    className={step1Input}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description" className={step1Label}>
                    Description
                  </Label>
                  <Textarea
                    id="description"
                    placeholder="Tell creators what this campaign is about..."
                    value={formData.description}
                    onChange={(e) => handleInputChange("description", e.target.value)}
                    className={step1Textarea}
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label className={step1Label}>Type</Label>
                    <Select
                      value={formData.campaign_type}
                      onValueChange={(v) => handleInputChange("campaign_type", v)}
                    >
                      <SelectTrigger className={cn("w-full", step1SelectTrigger)}>
                        <SelectValue placeholder="Type" />
                      </SelectTrigger>
                      <SelectContent className="border-primary/20 bg-popover text-popover-foreground">
                        {CAMPAIGN_TYPES.map((t) => (
                          <SelectItem key={t} value={t} className="focus:bg-primary/15">
                            {t}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className={step1Label}>Category</Label>
                    <Select
                      value={formData.niche || undefined}
                      onValueChange={(v) => handleInputChange("niche", v)}
                    >
                      <SelectTrigger className={cn("w-full", step1SelectTrigger)}>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent className="max-h-60 border-primary/20 bg-popover text-popover-foreground">
                        {CAMPAIGN_CATEGORIES.map((cat) => (
                          <SelectItem key={cat.value} value={cat.value} className="focus:bg-primary/15">
                            {cat.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className={step1Label}>
                    Thumbnails * (at least 1, up to {MAX_CAMPAIGN_THUMBNAILS})
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Upload at least one image. The live preview uses your thumbnails in the fan stack; with fewer
                    than five, images repeat across the stack.
                  </p>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-5 sm:gap-3">
                    {thumbnailUrls.map((url, slot) => (
                      <div
                        key={slot}
                        className="relative aspect-[3/4] w-full overflow-hidden rounded-lg border border-primary/25 bg-secondary/30"
                      >
                        {url ? (
                          <>
                            <Image
                              src={url}
                              alt=""
                              fill
                              className="object-cover"
                              sizes="120px"
                              unoptimized
                            />
                            <Button
                              type="button"
                              size="icon"
                              variant="destructive"
                              className="absolute right-1 top-1 h-7 w-7"
                              onClick={() => clearThumbnail(slot)}
                            >
                              <X className="h-3.5 w-3.5" />
                            </Button>
                          </>
                        ) : (
                          <button
                            type="button"
                            onClick={() => openThumbnailUpload(slot)}
                            disabled={uploadingSlot !== null}
                            className={cn(
                              "flex h-full min-h-[100px] w-full flex-col items-center justify-center gap-1 border-2 border-dashed p-2 text-center transition-colors",
                              mode === "embedded"
                                ? "border-primary/35 bg-background/40 hover:border-primary/55"
                                : "border-border hover:border-primary/50",
                            )}
                          >
                            {uploadingSlot === slot ? (
                              <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                            ) : (
                              <>
                                <Upload className="h-5 w-5 text-muted-foreground" />
                                <span className="text-[10px] text-muted-foreground">
                                  Slot {slot + 1}
                                </span>
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  <p className="text-xs text-muted-foreground">Max 5MB per image.</p>
                </div>
              </div>

              <div
                className={cn(
                  "flex pt-2",
                  mode === "embedded" ? "justify-between" : "justify-end",
                )}
              >
                {mode === "embedded" ? (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => onClose?.()}
                    className="border-primary/35 bg-transparent text-foreground hover:bg-primary/10 hover:text-foreground"
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back
                  </Button>
                ) : null}
                <Button
                  type="button"
                  onClick={() => setStep(2)}
                  disabled={!formData.name.trim() || !formData.niche || !hasAtLeastOneThumbnail}
                  className="bg-gradient-primary text-primary-foreground btn-glow hover:opacity-90"
                >
                  Next
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
              </div>
              <aside className="min-w-0 sm:sticky sm:top-1 sm:self-start sm:shrink-0">
                <LaunchGlassPreview
                  thumbnailUrls={filledThumbnailUrls}
                  name={formData.name}
                  description={formData.description}
                  platforms={formData.platforms}
                  niche={formData.niche}
                  contentType={formData.campaign_type}
                  authorName={authorDisplayName}
                  rateValue={formData.rate_value}
                  rateUnit={formData.rate_unit}
                  minViews={formData.min_views}
                  totalBudget={formData.total_budget}
                  platformIcons={platformIconMap}
                  launchStep={1}
                />
              </aside>
            </div>
          )}

          {/* Step 2: Platforms & Rewards */}
          {step === 2 && (
            <div className="grid items-start gap-4 sm:gap-6 sm:grid-cols-[minmax(0,1fr)_min(100%,300px)]">
              <div className={cn("space-y-6", step1Shell)}>
              <div>
                <h2 className="text-xl font-semibold mb-1">Platforms & rewards</h2>
                <p className="text-sm text-muted-foreground">
                  Choose platforms, then set your reward rates
                </p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className={step1Label}>Platforms *</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {PLATFORM_OPTIONS.map((platform) => (
                      <button
                        key={platform.id}
                        type="button"
                        onClick={() => togglePlatform(platform.id)}
                        className={`flex items-center justify-center gap-2.5 rounded-lg p-3 text-sm font-medium transition-all hover-scale ${
                          formData.platforms.includes(platform.id)
                            ? "bg-primary text-primary-foreground glow-primary-sm"
                            : "bg-secondary text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {platformBrandIcon(platform.id, "form")}
                        <span>{platform.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-3 rounded-xl border border-border bg-secondary/30 p-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">Rewards</h3>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        setRewardMode((m) => (m === "per_platform" ? "global" : "per_platform"))
                      }
                      className={cn(
                        "border-primary/40 bg-background text-foreground hover:bg-primary/10",
                        rewardMode === "per_platform" && "border-primary bg-primary/15",
                      )}
                    >
                      Per platform
                    </Button>
                  </div>

                  {rewardMode === "global" ? (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="rate_value" className="flex items-center gap-2">
                          <CircleDollarSign className="h-4 w-4 shrink-0 text-primary" />
                          Reward per 1,000 views *
                        </Label>
                        <div className="relative">
                          <CircleDollarSign className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                          <Input
                            id="rate_value"
                            type="number"
                            step="0.01"
                            placeholder="10"
                            value={formData.rate_value}
                            onChange={(e) => handleInputChange("rate_value", e.target.value)}
                            className="h-12 bg-secondary pl-10 border-border"
                          />
                        </div>
                      </div>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="min_payout_amount" className="flex items-center gap-2">
                            <Banknote className="h-4 w-4 shrink-0 text-primary" />
                            Minimum Payout *
                          </Label>
                          <div className="relative">
                            <Banknote className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                            <Input
                              id="min_payout_amount"
                              type="number"
                              step="0.01"
                              min={0}
                              placeholder="1"
                              value={formData.min_payout_amount}
                              onChange={(e) => handleInputChange("min_payout_amount", e.target.value)}
                              className="h-12 bg-secondary pl-10 border-border"
                            />
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {approxViewsHintFromDollars(
                              parseFloat(formData.min_payout_amount || "0"),
                              parseFloat(formData.rate_value || "0"),
                            )}
                          </p>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="max_earnings_per_post" className="flex items-center gap-2">
                            <Wallet className="h-4 w-4 shrink-0 text-primary" />
                            Maximum Payout *
                          </Label>
                          <div className="relative">
                            <Wallet className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                            <Input
                              id="max_earnings_per_post"
                              type="number"
                              step="0.01"
                              min={0}
                              placeholder="10"
                              value={formData.max_earnings_per_post}
                              onChange={(e) => handleInputChange("max_earnings_per_post", e.target.value)}
                              className="h-12 bg-secondary pl-10 border-border"
                            />
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {approxViewsHintFromDollars(
                              parseFloat(formData.max_earnings_per_post || "0"),
                              parseFloat(formData.rate_value || "0"),
                            )}
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {formData.platforms.length === 0 ? (
                        <p className="text-sm text-muted-foreground">Select at least one platform first.</p>
                      ) : (
                        <>
                          <div className="flex flex-wrap gap-2">
                            {formData.platforms.map((platform) => (
                              <button
                                key={platform}
                                type="button"
                                onClick={() => setActiveRewardPlatform(platform)}
                                className={cn(
                                  "rounded-full border px-3 py-1 text-xs capitalize transition-colors",
                                  activeRewardPlatform === platform
                                    ? "border-primary bg-primary/15 text-primary"
                                    : "border-border text-muted-foreground hover:text-foreground",
                                )}
                              >
                                {platform}
                              </button>
                            ))}
                          </div>
                          <div className="rounded-lg border border-border/60 bg-background/40 p-4 space-y-3">
                            <div className="font-medium capitalize flex items-center gap-2">
                              {platformBrandIcon(activeRewardPlatform, "form")}
                              {activeRewardPlatform}
                            </div>
                            <div className="space-y-4">
                              <div className="space-y-2">
                                <Label className="flex items-center gap-2">
                                  <CircleDollarSign className="h-4 w-4 shrink-0 text-primary" />
                                  Reward per 1,000 views *
                                </Label>
                                <div className="relative">
                                  <CircleDollarSign className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                                  <Input
                                    type="number"
                                    step="0.01"
                                    placeholder="10"
                                    value={platformRewards[activeRewardPlatform].ratePerThousand}
                                    onChange={(e) =>
                                      updatePlatformReward(activeRewardPlatform, "ratePerThousand", e.target.value)
                                    }
                                    className="h-11 bg-secondary pl-10 border-border"
                                  />
                                </div>
                              </div>
                              <div className="grid gap-3 sm:grid-cols-2">
                                <div className="space-y-2">
                                  <Label className="flex items-center gap-2">
                                    <Banknote className="h-4 w-4 shrink-0 text-primary" />
                                    Minimum Payout *
                                  </Label>
                                  <div className="relative">
                                    <Banknote className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                                    <Input
                                      type="number"
                                      step="0.01"
                                      min={0}
                                      placeholder="1"
                                      value={platformRewards[activeRewardPlatform].minPayoutAmount}
                                      onChange={(e) =>
                                        updatePlatformReward(activeRewardPlatform, "minPayoutAmount", e.target.value)
                                      }
                                      className="h-11 bg-secondary pl-10 border-border"
                                    />
                                  </div>
                                  <p className="text-xs text-muted-foreground">
                                    {approxViewsHintFromDollars(
                                      parseFloat(platformRewards[activeRewardPlatform].minPayoutAmount || "0"),
                                      parseFloat(platformRewards[activeRewardPlatform].ratePerThousand || "0"),
                                    )}
                                  </p>
                                </div>
                                <div className="space-y-2">
                                  <Label className="flex items-center gap-2">
                                    <Wallet className="h-4 w-4 shrink-0 text-primary" />
                                    Maximum Payout *
                                  </Label>
                                  <div className="relative">
                                    <Wallet className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                                    <Input
                                      type="number"
                                      step="0.01"
                                      min={0}
                                      placeholder="10"
                                      value={platformRewards[activeRewardPlatform].maxPayout}
                                      onChange={(e) =>
                                        updatePlatformReward(activeRewardPlatform, "maxPayout", e.target.value)
                                      }
                                      className="h-11 bg-secondary pl-10 border-border"
                                    />
                                  </div>
                                  <p className="text-xs text-muted-foreground">
                                    {approxViewsHintFromDollars(
                                      parseFloat(platformRewards[activeRewardPlatform].maxPayout || "0"),
                                      parseFloat(platformRewards[activeRewardPlatform].ratePerThousand || "0"),
                                    )}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex items-start gap-3 p-4 rounded-lg bg-primary/5 border border-primary/20">
                  <Info className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium mb-1">How payouts work</p>
                    <p className="text-muted-foreground">
                      Clippers earn based on the views their clips generate. At $
                      {rewardMode === "per_platform"
                        ? (formData.platforms[0]
                            ? platformRewards[formData.platforms[0]].ratePerThousand
                            : "10")
                        : (formData.rate_value || "10")}{" "}
                      per 1,000 views, a clip with 100K views would earn $
                      {((
                        parseFloat(
                          rewardMode === "per_platform"
                            ? (formData.platforms[0]
                                ? platformRewards[formData.platforms[0]].ratePerThousand
                                : "10")
                            : (formData.rate_value || "10"),
                        ) / 1000
                      ) * 100000).toFixed(2)}.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex justify-between pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep(1)}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
                <Button
                  type="button"
                  onClick={() => setStep(3)}
                  disabled={formData.platforms.length === 0 || !areRewardsValid()}
                  className="bg-gradient-primary hover:opacity-90 btn-glow"
                >
                  Next
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
              </div>
              <aside className="min-w-0 sm:sticky sm:top-1 sm:self-start sm:shrink-0">
                <LaunchGlassPreview
                  thumbnailUrls={filledThumbnailUrls}
                  name={formData.name}
                  description={formData.description}
                  platforms={formData.platforms}
                  niche={formData.niche}
                  contentType={formData.campaign_type}
                  authorName={authorDisplayName}
                  rateValue={formData.rate_value}
                  rateUnit={formData.rate_unit}
                  minViews={formData.min_views}
                  totalBudget={formData.total_budget}
                  platformIcons={platformIconMap}
                  launchStep={3}
                />
              </aside>
            </div>
          )}

          {/* Step 3: Content requirements */}
          {step === 3 && (
            <div className="grid items-start gap-4 sm:gap-6 sm:grid-cols-[minmax(0,1fr)_min(100%,320px)]">
              <div className={cn("space-y-6", step1Shell)}>
                <LaunchContentRequirementsStep
                  step1Label={step1Label}
                  step1Input={cn(step1Input, mode === "page" && "border-border")}
                  contentRequirementDraft={contentRequirementDraft}
                  onDraftChange={setContentRequirementDraft}
                  customRequirements={customContentRequirements}
                  onAddRequirement={addCustomContentRequirement}
                  onRemoveRequirement={(index) =>
                    setCustomContentRequirements((prev) => prev.filter((_, i) => i !== index))
                  }
                  linkDraft={linkDraft}
                  onLinkDraftChange={(patch) => setLinkDraft((d) => ({ ...d, ...patch }))}
                  contentLinks={contentLinks}
                  onAddLink={addContentLinkRow}
                  onRemoveLink={(id) => setContentLinks((prev) => prev.filter((l) => l.id !== id))}
                  onEditLink={editContentLink}
                  selectedPresets={selectedRequirementPresets}
                  onTogglePreset={toggleRequirementPreset}
                  requiredHashtags={formData.required_hashtags}
                  onRequiredHashtagsChange={(v) => handleInputChange("required_hashtags", v)}
                  requiredBioMentions={formData.required_bio_mentions}
                  onRequiredBioMentionsChange={(v) => handleInputChange("required_bio_mentions", v)}
                  requiredCaptionMentions={formData.required_caption_mentions}
                  onRequiredCaptionMentionsChange={(v) =>
                    handleInputChange("required_caption_mentions", v)
                  }
                  requiredMusicUrl={formData.required_music_url}
                  onRequiredMusicUrlChange={(v) => handleInputChange("required_music_url", v)}
                />
                <div className="flex justify-between pt-2">
                  <Button type="button" variant="outline" onClick={() => setStep(2)}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back
                  </Button>
                  <Button
                    type="button"
                    onClick={() => {
                      if (!hasAtLeastOneContentRequirement) {
                        toast({
                          title: "Add a content requirement",
                          description:
                            "Add at least one: custom item, content link, hashtags/mentions, or an available rule (e.g. face on camera or sound with link).",
                          variant: "destructive",
                        });
                        return;
                      }
                      setStep(4);
                    }}
                    className="bg-gradient-primary hover:opacity-90 btn-glow"
                  >
                    Next
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
              <aside className="min-w-0 sm:sticky sm:top-1 sm:self-start sm:shrink-0">
                <LaunchGlassPreview
                  thumbnailUrls={filledThumbnailUrls}
                  name={formData.name}
                  description={formData.description}
                  platforms={formData.platforms}
                  niche={formData.niche}
                  contentType={formData.campaign_type}
                  authorName={authorDisplayName}
                  rateValue={formData.rate_value}
                  rateUnit={formData.rate_unit}
                  minViews={formData.min_views}
                  totalBudget={formData.total_budget}
                  platformIcons={platformIconMap}
                  launchStep={3}
                />
              </aside>
            </div>
          )}

          {/* Step 4: Campaign settings + preview (launch) */}
          {step === 4 && (
            <div className="grid items-start gap-4 sm:gap-6 sm:grid-cols-[minmax(0,1fr)_min(100%,320px)]">
              <div className={cn("space-y-6", step1Shell)}>
                <LaunchCampaignSettingsStep
                  step1Label={step1Label}
                  step1Input={cn(step1Input, mode === "page" && "border-border")}
                  requireApplication={requireApplication}
                  onRequireApplicationChange={setRequireApplication}
                  applicationQuestions={applicationQuestions}
                  onApplicationQuestionsChange={setApplicationQuestions}
                  showOnDiscover={showOnDiscover}
                  onShowOnDiscoverChange={setShowOnDiscover}
                  whopProductId={whopProductId}
                  onWhopProductIdChange={setWhopProductId}
                  whopProducts={whopProducts}
                  whopProductRequired={whopProductRequired}
                />
                <div className="flex justify-between pt-2">
                  <Button type="button" variant="outline" onClick={() => setStep(3)}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back
                  </Button>
                  <Button
                    type="button"
                    onClick={() => {
                      if (whopProductRequired && !whopProductId.trim()) {
                        toast({
                          title: "Select a Whop product",
                          description:
                            "Discover listing requires a product. Choose one or turn off “Show Campaign on Discover Page”.",
                          variant: "destructive",
                        });
                        return;
                      }
                      setStep(5);
                    }}
                    className="bg-gradient-primary hover:opacity-90 btn-glow"
                  >
                    Next
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
              <aside className="min-w-0 sm:sticky sm:top-1 sm:self-start sm:shrink-0">
                <LaunchGlassPreview
                  thumbnailUrls={filledThumbnailUrls}
                  name={formData.name}
                  description={formData.description}
                  platforms={formData.platforms}
                  niche={formData.niche}
                  contentType={formData.campaign_type}
                  authorName={authorDisplayName}
                  rateValue={formData.rate_value}
                  rateUnit={formData.rate_unit}
                  minViews={formData.min_views}
                  totalBudget={formData.total_budget}
                  platformIcons={platformIconMap}
                  launchStep={4}
                />
              </aside>
            </div>
          )}

          {/* Step 5: Fund campaign (final) */}
          {step === 5 && (
            <div className="grid items-start gap-4 sm:gap-6 sm:grid-cols-[minmax(0,1fr)_min(100%,320px)]">
              <div className={cn("space-y-6", step1Shell)}>
                <LaunchFundCampaignStep
                  step1Label={step1Label}
                  step1Input={cn(step1Input, mode === "page" && "border-border")}
                  campaignName={formData.name}
                  totalBudget={formData.total_budget}
                  onTotalBudgetChange={(v) => handleInputChange("total_budget", v)}
                  onBack={() => setStep(4)}
                  onSummary={() => void finalizeCampaign("pending")}
                  onFundAndActivate={() => void finalizeCampaign("active")}
                  isSubmitting={createCampaign.isPending}
                />
              </div>
              <aside className="min-w-0 sm:sticky sm:top-1 sm:self-start sm:shrink-0">
                <LaunchGlassPreview
                  thumbnailUrls={filledThumbnailUrls}
                  name={formData.name}
                  description={formData.description}
                  platforms={formData.platforms}
                  niche={formData.niche}
                  contentType={formData.campaign_type}
                  authorName={authorDisplayName}
                  rateValue={formData.rate_value}
                  rateUnit={formData.rate_unit}
                  minViews={formData.min_views}
                  totalBudget={formData.total_budget}
                  platformIcons={platformIconMap}
                  launchStep={5}
                />
              </aside>
            </div>
          )}
        </form>
  );

  const formBody =
    mode === "embedded" ? (
      <div className="page-enter mx-auto w-full max-w-full px-0 sm:px-0.5">
        <div className="mb-6 grid grid-cols-1 items-center gap-4 pr-10 sm:grid-cols-[1fr_auto_1fr] sm:gap-3">
          <h2 className="text-lg font-semibold tracking-tight text-foreground sm:text-xl">
            New Content Rewards Campaign
          </h2>
          <div
            className="flex max-w-xs flex-1 justify-center gap-1.5 sm:mx-auto sm:max-w-[220px]"
            aria-label="Campaign setup progress"
          >
            {[1, 2, 3, 4, 5].map((s) => (
              <div
                key={s}
                className={cn(
                  "h-1.5 flex-1 rounded-full transition-colors",
                  step >= s
                    ? "bg-gradient-primary shadow-[0_0_14px_hsl(var(--primary)/0.35)]"
                    : "bg-muted",
                )}
              />
            ))}
          </div>
          <span className="hidden sm:block" aria-hidden />
        </div>
        {campaignForm}
      </div>
    ) : (
      <div
        className={cn(
          "mx-auto w-full page-enter",
          step === 1 || step === 2 || step === 3 || step === 4 || step === 5
            ? "max-w-5xl"
            : "max-w-3xl",
        )}
      >
        {progressSteps}
        {campaignForm}
      </div>
    );

  if (mode === "embedded") {
    return formBody;
  }

  return <AppLayout title="Launch Campaign">{formBody}</AppLayout>;
};

export default Launch;
