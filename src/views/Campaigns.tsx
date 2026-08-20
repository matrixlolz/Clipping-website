"use client";

import { useState, useContext } from "react";
import { LaunchCampaignModal } from "@/components/campaigns/LaunchCampaignModal";
import Image from "next/image";
import { AppLayout } from "@/components/app/AppLayout";
import { CustomerAppLayout } from "@/components/customer/CustomerAppLayout";
import { getCampaignDetailHref } from "@/lib/campaign-routes";
import { 
  Search, 
  Filter, 
  DollarSign, 
  Eye, 
  ArrowRight,
  Plus,
  Gamepad2,
  Dumbbell,
  Laptop,
  Music,
  Utensils,
  Sparkles,
  AlertCircle,
  Smartphone,
  Camera,
  Play,
  ImageIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import Link from "next/link";
import { useCampaigns, CampaignStatus } from "@/hooks/useCampaigns";
import { primaryCampaignImageUrl } from "@/lib/campaign-images";
import { useAuth } from "@/hooks/useAuth";
import { CampaignFiltersModal, FilterValues } from "@/components/campaigns/CampaignFiltersModal";
import { WhopBusinessLayoutContext } from "@/components/providers/WhopBusinessProvider";

const categories = [
  { id: "all", label: "All", icon: Sparkles },
  { id: "gaming", label: "Gaming", icon: Gamepad2 },
  { id: "fitness", label: "Fitness", icon: Dumbbell },
  { id: "tech", label: "Tech", icon: Laptop },
  { id: "music", label: "Music", icon: Music },
  { id: "food", label: "Food", icon: Utensils },
];

const platformIcons: Record<string, React.ReactNode> = {
  tiktok: <Smartphone className="h-3 w-3" />,
  instagram: <Camera className="h-3 w-3" />,
  youtube: <Play className="h-3 w-3" />,
};

type CampaignsLayoutVariant = "app" | "customer";

interface CampaignsProps {
  experienceId?: string;
  layoutVariant?: CampaignsLayoutVariant;
}

const Campaigns = ({ experienceId, layoutVariant = "app" }: CampaignsProps) => {
  const Shell = layoutVariant === "customer" ? CustomerAppLayout : AppLayout;
  const whopCtx = useContext(WhopBusinessLayoutContext);
  const whopCompanyId =
    experienceId && whopCtx?.whopCompanyId ? whopCtx.whopCompanyId : undefined;
  const { role } = useAuth();
  const whopTeamAdmin = whopCtx?.whopExperienceAccessLevel === "admin";
  const isAdmin = role === "admin" || whopTeamAdmin;
  const canCreateCampaign =
    role === "admin" || role === "brand" || whopTeamAdmin;
  /** Brand dashboard in an experience can filter by pending vs active. */
  const canFilterStatusTabs = isAdmin || (canCreateCampaign && Boolean(experienceId));
  
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<CampaignStatus | "all">("active");
  const [launchModalOpen, setLaunchModalOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<FilterValues>({
    platforms: [],
    minRate: 0,
    maxRate: 500,
    minViews: 0,
  });

  const effectiveStatus = canFilterStatusTabs ? statusFilter : "active";

  const nicheFilter =
    experienceId ? undefined : selectedCategory === "all" ? undefined : selectedCategory;

  // For brand/admin dashboard, fetch all statuses once and filter client-side.
  const serverStatusFilter = canFilterStatusTabs ? undefined : effectiveStatus;

  const { data: campaigns, isLoading } = useCampaigns({
    status: serverStatusFilter,
    niche: nicheFilter,
    search: searchQuery || undefined,
    whopCompanyId,
  });

  // Apply client-side filters
  const filteredCampaigns = campaigns?.filter((campaign) => {
    if (canFilterStatusTabs && statusFilter !== "all" && campaign.status !== statusFilter) {
      return false;
    }
    if (filters.platforms.length > 0) {
      const hasMatchingPlatform = campaign.platforms?.some((p) =>
        filters.platforms.includes(p)
      );
      if (!hasMatchingPlatform) return false;
    }
    if (campaign.rate_value < filters.minRate || campaign.rate_value > filters.maxRate) {
      return false;
    }
    if (filters.minViews > 0 && campaign.min_views > filters.minViews) {
      return false;
    }
    return true;
  });

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
    if (num >= 1000) return (num / 1000).toFixed(1) + "K";
    return num.toString();
  };

  const normalizeStatus = (value: unknown): CampaignStatus => {
    if (
      value === "active" ||
      value === "pending" ||
      value === "paused" ||
      value === "completed" ||
      value === "private"
    ) {
      return value;
    }
    return "pending";
  };

  const getStatusColor = (status: CampaignStatus) => {
    switch (status) {
      case "active":
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
      case "pending":
        return "bg-amber-500/10 text-amber-400 border-amber-500/20";
      case "paused":
        return "bg-yellow-500/10 text-yellow-400 border-yellow-500/20";
      case "completed":
        return "bg-gray-500/10 text-gray-400 border-gray-500/20";
      case "private":
        return "bg-purple-500/10 text-purple-400 border-purple-500/20";
      default:
        return "bg-primary/10 text-primary border-primary/20";
    }
  };

  const hasActiveFilters = filters.platforms.length > 0 || filters.minRate > 0 || filters.maxRate < 500 || filters.minViews > 0;

  const headerRight =
    canCreateCampaign ? (
      <Button
        type="button"
        size="sm"
        className="gap-2 bg-gradient-primary hover:opacity-90 text-primary-foreground shadow-sm"
        onClick={() => setLaunchModalOpen(true)}
      >
        <Plus className="h-4 w-4" />
        New campaign
      </Button>
    ) : null;

  return (
    <Shell title="My Campaigns" headerRight={headerRight}>
      {/* Status tabs: admins + brand owners in Whop experience */}
      {canFilterStatusTabs && (
        <div className="mb-6">
          <Tabs value={statusFilter} onValueChange={(v) => setStatusFilter(v as CampaignStatus | "all")}>
            <TabsList className="flex flex-wrap h-auto gap-1">
              <TabsTrigger value="pending">Pending</TabsTrigger>
              <TabsTrigger value="active">Active</TabsTrigger>
              {isAdmin ? (
                <>
                  <TabsTrigger value="paused">Paused</TabsTrigger>
                  <TabsTrigger value="completed">Completed</TabsTrigger>
                  <TabsTrigger value="all">All</TabsTrigger>
                </>
              ) : null}
            </TabsList>
          </Tabs>
        </div>
      )}

      {/* Search and filters */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="Search campaigns..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-12 bg-card border-border"
          />
        </div>
        <Button 
          variant="outline" 
          className={`h-12 gap-2 ${hasActiveFilters ? "border-primary text-primary" : ""}`}
          onClick={() => setShowFilters(true)}
        >
          <Filter className="h-4 w-4" />
          Filters
          {hasActiveFilters && <span className="ml-1 px-1.5 py-0.5 text-xs bg-primary text-primary-foreground rounded-full">!</span>}
        </Button>
      </div>

      {/* Category chips — standalone /campaigns only (hidden on experience My Campaigns) */}
      {!experienceId && (
        <div className="mb-8 flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                selectedCategory === category.id
                  ? "bg-primary text-primary-foreground"
                  : "bg-card border border-border text-muted-foreground hover:text-foreground hover:border-primary/30"
              }`}
            >
              <category.icon className="h-4 w-4" />
              {category.label}
            </button>
          ))}
        </div>
      )}

      {/* Results count */}
      <div className="mb-4 text-sm text-muted-foreground">
        {isLoading ? "Loading..." : `Showing ${filteredCampaigns?.length || 0} campaigns`}
      </div>

      {/* Campaign grid */}
      {isLoading ? (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
          {Array(6).fill(0).map((_, i) => (
            <Skeleton key={i} className="h-80 rounded-2xl" />
          ))}
        </div>
      ) : filteredCampaigns?.length === 0 ? (
        <div className="text-center py-16">
          <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">No campaigns found</h3>
          <p className="text-muted-foreground">
            {searchQuery || hasActiveFilters
              ? "Try adjusting your filters"
              : "Check back later for new campaigns"
            }
          </p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredCampaigns?.map((campaign) => {
            const safeStatus = normalizeStatus(campaign?.status);
            const safeId =
              typeof campaign?.id === "string" && campaign.id.trim() ? campaign.id : "unknown-id";
            const safeName =
              typeof campaign?.name === "string" && campaign.name.trim()
                ? campaign.name
                : "Untitled campaign";
            const safeRateValue = Number(campaign?.rate_value || 0);
            const safeRateUnit = Number(campaign?.rate_unit || 1000);
            const safeMinViews = Number(campaign?.min_views || 0);
            const safeSpent = Number(campaign?.spent_budget || 0);
            const safeBudget = Math.max(Number(campaign?.total_budget || 0), 0);
            const budgetPct = safeBudget > 0 ? Math.min((safeSpent / safeBudget) * 100, 100) : 0;

            return (
            <div
              key={safeId}
              className="group rounded-2xl bg-card border border-border hover:border-primary/30 transition-all duration-300 overflow-hidden"
            >
              {/* Campaign Image - Always shown as hero */}
              <div className="relative w-full h-40 bg-secondary/50">
                {(() => {
                  const hero = primaryCampaignImageUrl(campaign?.image_url);
                  return hero ? (
                    <Image
                      src={hero}
                      alt={safeName}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                      sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
                      unoptimized
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
                      <ImageIcon className="h-12 w-12 text-muted-foreground/50" />
                    </div>
                  );
                })()}
                
                {/* Status Badge */}
                <div className="absolute top-3 left-3">
                  <Badge className={`${getStatusColor(safeStatus)} flex items-center gap-1`}>
                    <Sparkles className="h-3 w-3" />
                    {safeStatus.charAt(0).toUpperCase() + safeStatus.slice(1)}
                  </Badge>
                </div>

                {/* Platform Icons */}
                {Array.isArray(campaign?.platforms) && campaign.platforms.length > 0 && (
                  <div className="absolute top-3 right-3 flex gap-1">
                    {campaign.platforms.map((platform) => (
                      <div
                        key={platform}
                        className="w-7 h-7 rounded-full bg-background/90 backdrop-blur-sm flex items-center justify-center"
                      >
                        {platformIcons[platform]}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="p-6">
                {/* Campaign Name as Primary Title */}
                <div className="mb-3">
                  <h3 className="font-semibold text-lg group-hover:text-primary transition-colors line-clamp-1">
                    {safeName}
                  </h3>
                  {campaign?.niche && (
                    <Badge variant="secondary" className="mt-1 text-xs capitalize">
                      {campaign.niche}
                    </Badge>
                  )}
                </div>

                <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                  {campaign?.description || "No description provided"}
                </p>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="p-3 rounded-lg bg-secondary/50">
                    <div className="flex items-center gap-1.5 text-muted-foreground text-xs mb-1">
                      <DollarSign className="w-3 h-3" />Rate
                    </div>
                    <div className="font-semibold text-primary">${safeRateValue}/{formatNumber(safeRateUnit)} views</div>
                  </div>
                  <div className="p-3 rounded-lg bg-secondary/50">
                    <div className="flex items-center gap-1.5 text-muted-foreground text-xs mb-1">
                      <Eye className="w-3 h-3" />Min Views
                    </div>
                    <div className="font-semibold">{formatNumber(safeMinViews)}</div>
                  </div>
                </div>

                {/* Budget Progress */}
                <div className="mb-4">
                  <div className="flex justify-between text-xs text-muted-foreground mb-1">
                    <span>Budget Used</span>
                    <span>${safeSpent.toFixed(0)} / ${safeBudget.toFixed(0)}</span>
                  </div>
                  <Progress 
                    value={budgetPct} 
                    className="h-2"
                  />
                </div>

                {/* Max Earnings */}
                {campaign?.max_earnings_per_post ? (
                  <p className="text-xs text-muted-foreground mb-4">
                    Max ${campaign.max_earnings_per_post} per post
                  </p>
                ) : null}

                <Button asChild className="w-full bg-gradient-primary hover:opacity-90 glow-primary">
                  <Link href={getCampaignDetailHref(safeId, experienceId)}>
                    View Campaign<ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          )})}
        </div>
      )}

      <CampaignFiltersModal
        open={showFilters}
        onOpenChange={setShowFilters}
        onApply={setFilters}
        currentFilters={filters}
      />

      <LaunchCampaignModal open={launchModalOpen} onOpenChange={setLaunchModalOpen} />
    </Shell>
  );
};

export default Campaigns;
