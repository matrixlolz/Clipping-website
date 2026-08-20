"use client";

import { useState } from "react";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { AppLayout } from "@/components/app/AppLayout";
import { CustomerAppLayout } from "@/components/customer/CustomerAppLayout";
import { getCampaignsListHref } from "@/lib/campaign-routes";
import { primaryCampaignImageUrl } from "@/lib/campaign-images";
import { CampaignLeaderboard } from "@/components/campaigns/CampaignLeaderboard";
import { 
  ArrowLeft,
  DollarSign, 
  Eye, 
  Users,
  CheckCircle,
  AlertCircle,
  Plus,
  X,
  ExternalLink,
  Pause,
  Trash2,
  Smartphone,
  Camera,
  Play,
  Trophy
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useCampaign, useUpdateCampaign, type PlatformType as CampaignPlatformType } from "@/hooks/useCampaigns";
import { useCreateSubmission, useCampaignSubmissions } from "@/hooks/useSubmissions";
import { useDeleteCampaign } from "@/hooks/useCampaignActions";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useMySocialAccounts } from "@/hooks/useSocialAccounts";
import { validateClipUrl, SocialPlatform } from "@/lib/urlValidation";

const platformIcons: Record<string, React.ReactNode> = {
  tiktok: <Smartphone className="h-4 w-4" />,
  instagram: <Camera className="h-4 w-4" />,
  youtube: <Play className="h-4 w-4" />,
  twitter: <span className="text-sm font-semibold leading-none">X</span>,
};

type CampaignDetailLayoutVariant = "app" | "customer";

interface CampaignDetailProps {
  layoutVariant?: CampaignDetailLayoutVariant;
}

const CampaignDetail = ({ layoutVariant = "app" }: CampaignDetailProps) => {
  const params = useParams();
  const id = params.id as string;
  const experienceId = params.experienceId as string | undefined;
  const listHref = getCampaignsListHref(experienceId);
  const Shell = layoutVariant === "customer" ? CustomerAppLayout : AppLayout;
  const router = useRouter();
  const { toast } = useToast();
  const { role, user } = useAuth();
  const { data: socialAccounts } = useMySocialAccounts();
  const { data: campaign, isLoading, refetch } = useCampaign(id || "");
  const { data: submissions } = useCampaignSubmissions(id || "");
  const createSubmission = useCreateSubmission();
  const updateCampaign = useUpdateCampaign();
  const deleteCampaign = useDeleteCampaign();

  const [clipUrls, setClipUrls] = useState<string[]>([""]);
  const [urlErrors, setUrlErrors] = useState<(string | null)[]>([null]);
  const [selectedPlatform, setSelectedPlatform] = useState<CampaignPlatformType>("tiktok");
  const [agreeToTerms, setAgreeToTerms] = useState(false);

  const isVerificationRequired = selectedPlatform === "tiktok" || selectedPlatform === "instagram";
  const hasVerifiedSocialAccount = !isVerificationRequired
    ? true
    : (socialAccounts?.some((a) => a.platform === selectedPlatform && a.verified) ?? false);

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
    if (num >= 1000) return (num / 1000).toFixed(1) + "K";
    return num.toString();
  };

  const addClipUrl = () => {
    setClipUrls([...clipUrls, ""]);
    setUrlErrors([...urlErrors, null]);
  };

  const removeClipUrl = (index: number) => {
    setClipUrls(clipUrls.filter((_, i) => i !== index));
    setUrlErrors(urlErrors.filter((_, i) => i !== index));
  };

  const updateClipUrl = (index: number, value: string) => {
    const newUrls = [...clipUrls];
    newUrls[index] = value;
    setClipUrls(newUrls);
    
    const newErrors = [...urlErrors];
    if (value.trim()) {
      newErrors[index] = validateClipUrl(value, selectedPlatform as SocialPlatform);
    } else {
      newErrors[index] = null;
    }
    setUrlErrors(newErrors);
  };

  const handleSubmit = async () => {
    const validUrls = clipUrls.filter(url => url.trim() !== "");

    if (isVerificationRequired && !hasVerifiedSocialAccount) {
      toast({
        title: "Verification required",
        description: `Please verify your ${selectedPlatform} account before submitting clips.`,
        variant: "destructive",
      });
      return;
    }
    
    if (validUrls.length === 0) {
      toast({
        title: "No clips to submit",
        description: "Please add at least one clip URL",
        variant: "destructive",
      });
      return;
    }

    const validationErrors = validUrls.map(url => validateClipUrl(url, selectedPlatform as SocialPlatform));
    const hasErrors = validationErrors.some(error => error !== null);
    
    if (hasErrors) {
      toast({
        title: "Invalid URLs",
        description: "Please fix the invalid URLs before submitting",
        variant: "destructive",
      });
      return;
    }

    if (!agreeToTerms) {
      toast({
        title: "Agreement required",
        description: "Please agree to the campaign requirements",
        variant: "destructive",
      });
      return;
    }

    try {
      await createSubmission.mutateAsync(
        validUrls.map(url => ({
          campaign_id: id!,
          clip_url: url.trim(),
          platform: selectedPlatform,
        }))
      );

      toast({
        title: "Clips submitted!",
        description: `${validUrls.length} clip(s) submitted successfully`,
      });

      setClipUrls([""]);
      setAgreeToTerms(false);
      refetch();
    } catch (error: any) {
      toast({
        title: "Submission failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleStatusChange = async (status: "active" | "paused" | "completed") => {
    try {
      await updateCampaign.mutateAsync({ id: id!, status });
      toast({ title: `Campaign ${status}` });
      refetch();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleDelete = async () => {
    try {
      await deleteCampaign.mutateAsync(id!);
      toast({ title: "Campaign deleted" });
      router.push(listHref);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  if (isLoading) {
    return (
      <Shell title="Campaign Details">
        <Skeleton className="h-96" />
      </Shell>
    );
  }

  if (!campaign) {
    return (
      <Shell title="Campaign Not Found">
        <div className="text-center py-16">
          <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">Campaign not found</h3>
          <Button asChild>
            <Link href={listHref}>My Campaigns</Link>
          </Button>
        </div>
      </Shell>
    );
  }

  const campaignHeroImage = primaryCampaignImageUrl(campaign.image_url);
  const isActive = campaign.status === "active";
  const budgetRemaining = Number(campaign.total_budget) - Number(campaign.spent_budget);
  const isBudgetExhausted = budgetRemaining <= 0;
  const isOwner = user?.id === campaign.created_by;
  const canManage = isOwner || role === "admin";

  return (
    <Shell title={campaign.name}>
      {/* Back button */}
      <div className="flex items-center justify-between mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push(listHref)}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to My Campaigns
        </Button>

        {/* Campaign Management for owners/admins */}
        {canManage && (
          <div className="flex gap-2">
            {campaign.status === "active" && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleStatusChange("paused")}
              >
                <Pause className="h-4 w-4 mr-1" />
                Pause
              </Button>
            )}
            {campaign.status === "paused" && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleStatusChange("active")}
              >
                <Play className="h-4 w-4 mr-1" />
                Resume
              </Button>
            )}
            {(campaign.status === "active" || campaign.status === "paused") && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleStatusChange("completed")}
              >
                <CheckCircle className="h-4 w-4 mr-1" />
                End Campaign
              </Button>
            )}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button size="sm" variant="destructive">
                  <Trash2 className="h-4 w-4 mr-1" />
                  Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Campaign?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. All submissions will also be deleted.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete} className="bg-red-500 hover:bg-red-600">
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Header */}
          <div className="p-6 rounded-xl bg-card border border-border card-hover">
            {/* Campaign Image */}
            {campaignHeroImage && (
              <div className="relative w-full h-48 rounded-lg overflow-hidden mb-4">
                <Image
                  src={campaignHeroImage}
                  alt={campaign.name}
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 66vw"
                  unoptimized
                />
              </div>
            )}

            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-4">
                <div className="relative w-16 h-16 rounded-xl bg-gradient-primary flex items-center justify-center text-2xl font-bold text-primary-foreground overflow-hidden">
                  {campaign.creator_profile?.avatar_url ? (
                    <Image
                      src={campaign.creator_profile.avatar_url}
                      alt=""
                      fill
                      className="object-cover"
                      sizes="64px"
                      unoptimized
                    />
                  ) : (
                    campaign.creator_profile?.full_name?.charAt(0) || "C"
                  )}
                </div>
                <div>
                  <h1 className="text-2xl font-bold">{campaign.name}</h1>
                  <p className="text-muted-foreground">
                    by {campaign.creator_profile?.full_name || "Creator"}
                  </p>
                </div>
              </div>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                isActive
                  ? "bg-emerald-500/10 text-emerald-400"
                  : campaign.status === "paused"
                  ? "bg-yellow-500/10 text-yellow-400"
                  : "bg-secondary text-muted-foreground"
              }`}>
                {campaign.status}
              </span>
            </div>

            {/* Platforms */}
            {campaign.platforms && campaign.platforms.length > 0 && (
              <div className="flex gap-2 mb-4">
                {campaign.platforms.map((platform) => (
                  <span 
                    key={platform}
                    className="px-3 py-1.5 rounded-lg bg-secondary text-sm capitalize flex items-center gap-2"
                  >
                    {platformIcons[platform]} {platform}
                  </span>
                ))}
              </div>
            )}

            {/* Description */}
            <div className="mb-6">
              <h3 className="font-semibold mb-2">Description</h3>
              <p className="text-muted-foreground">
                {campaign.description || "No description provided"}
              </p>
            </div>

            {/* Requirements */}
            {campaign.requirements && (
              <div className="p-4 rounded-lg bg-secondary/50 border border-border">
                <h3 className="font-semibold mb-2">Requirements</h3>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {campaign.requirements}
                </p>
              </div>
            )}
          </div>

          {/* Tabs for Submit / Leaderboard */}
          <Tabs defaultValue="submit" className="w-full">
            <TabsList className="w-full grid grid-cols-2 mb-4">
              <TabsTrigger value="submit" className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Submit Clips
              </TabsTrigger>
              <TabsTrigger value="leaderboard" className="flex items-center gap-2">
                <Trophy className="h-4 w-4" />
                Leaderboard
              </TabsTrigger>
            </TabsList>

            <TabsContent value="submit" className="space-y-6">
              {/* Submit clips (for creators) */}
              {role === "creator" && isActive && !isBudgetExhausted && (
                <div className="p-6 rounded-xl bg-card border border-border card-hover">
                  <h3 className="text-lg font-semibold mb-4">Submit Your Clips</h3>

                  <div className="space-y-4">
                    {/* Platform selector */}
                    <div className="space-y-2">
                      <Label>Platform</Label>
                      <div className="flex gap-2">
                        {campaign.platforms?.map((platform) => (
                          <button
                            key={platform}
                            onClick={() => setSelectedPlatform(platform)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                              selectedPlatform === platform
                                ? "bg-primary text-primary-foreground glow-primary-sm"
                                : "bg-secondary text-muted-foreground hover:text-foreground hover:bg-secondary/80"
                            }`}
                          >
                            {platformIcons[platform]} {platform}
                          </button>
                        ))}
                      </div>
                    </div>

                    {isVerificationRequired && !hasVerifiedSocialAccount && (
                      <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/30">
                        <div className="flex items-start gap-3">
                          <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="text-sm font-medium text-destructive">Verification Required</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              You must verify your {selectedPlatform} account before submitting clips to this campaign.
                            </p>
                            <Button asChild size="sm" variant="outline" className="mt-3 btn-glow">
                              <Link href="/social-accounts">Verify {selectedPlatform} Account</Link>
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Clip URLs */}
                    <div className="space-y-2">
                      <Label>Clip URLs</Label>
                      {clipUrls.map((url, index) => (
                        <div key={index} className="space-y-1">
                          <div className="flex gap-2">
                            <Input
                              placeholder={`https://${selectedPlatform}.com/...`}
                              value={url}
                              onChange={(e) => updateClipUrl(index, e.target.value)}
                              className={`bg-secondary ${urlErrors[index] ? 'border-red-500' : 'border-border'}`}
                            />
                            {clipUrls.length > 1 && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => removeClipUrl(index)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                          {urlErrors[index] && (
                            <p className="text-xs text-red-500 pl-1">{urlErrors[index]}</p>
                          )}
                        </div>
                      ))}
                      <Button variant="outline" size="sm" onClick={addClipUrl} className="btn-glow">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Another
                      </Button>
                    </div>

                    {/* Agreement */}
                    <div className="flex items-start gap-3 p-4 rounded-lg bg-secondary/50">
                      <Checkbox
                        id="agree"
                        checked={agreeToTerms}
                        onCheckedChange={(checked) => setAgreeToTerms(checked === true)}
                      />
                      <label htmlFor="agree" className="text-sm text-muted-foreground cursor-pointer">
                        I confirm that my clips meet all campaign requirements and I agree to the terms
                      </label>
                    </div>

                    <Button
                      onClick={handleSubmit}
                      disabled={createSubmission.isPending || !agreeToTerms || (isVerificationRequired && !hasVerifiedSocialAccount)}
                      className="w-full bg-gradient-primary hover:opacity-90 btn-glow"
                    >
                      {isVerificationRequired && !hasVerifiedSocialAccount 
                        ? "Verification Required" 
                        : createSubmission.isPending 
                        ? "Submitting..." 
                        : "Submit Clips"}
                    </Button>
                  </div>
                </div>
              )}

              {/* Budget Exhausted Notice */}
              {role === "creator" && isBudgetExhausted && (
                <div className="p-6 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
                  <div className="flex items-center gap-3">
                    <AlertCircle className="h-6 w-6 text-yellow-500" />
                    <div>
                      <h3 className="font-semibold text-yellow-500">Budget Exhausted</h3>
                      <p className="text-sm text-muted-foreground">
                        This campaign has reached its budget limit and is no longer accepting submissions.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Campaign Paused Notice */}
              {role === "creator" && campaign.status === "paused" && (
                <div className="p-6 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
                  <div className="flex items-center gap-3">
                    <Pause className="h-6 w-6 text-yellow-500" />
                    <div>
                      <h3 className="font-semibold text-yellow-500">Campaign Paused</h3>
                      <p className="text-sm text-muted-foreground">
                        This campaign is currently paused and not accepting new submissions.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Submissions list (for brand/admin) */}
              {(role === "brand" || role === "admin") && submissions && submissions.length > 0 && (
                <div className="p-6 rounded-xl bg-card border border-border">
                  <h3 className="text-lg font-semibold mb-4">
                    Submissions ({submissions.length})
                  </h3>
                  <div className="space-y-3 stagger-enter">
                    {submissions.map((sub) => (
                      <div key={sub.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 hover-scale">
                        <div className="flex items-center gap-3">
                          <span className={`p-2 rounded-lg ${
                            sub.status === "approved" || sub.status === "paid"
                              ? "bg-emerald-500/10 text-emerald-400"
                              : sub.status === "rejected"
                              ? "bg-red-500/10 text-red-400"
                              : "bg-primary/10 text-primary"
                          }`}>
                            {sub.status === "approved" || sub.status === "paid" ? (
                              <CheckCircle className="h-4 w-4" />
                            ) : (
                              <AlertCircle className="h-4 w-4" />
                            )}
                          </span>
                          <div>
                            <p className="text-sm font-medium">{sub.creator_profile?.full_name || "Creator"}</p>
                            <p className="text-xs text-muted-foreground">{formatNumber(sub.views)} views</p>
                          </div>
                          <span className="px-2 py-1 rounded bg-secondary text-xs capitalize flex items-center gap-1">
                            {platformIcons[sub.platform]}
                            {sub.platform}
                          </span>
                        </div>
                        <a 
                          href={sub.clip_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-primary hover:underline text-sm flex items-center gap-1"
                        >
                          View <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="leaderboard">
              <CampaignLeaderboard campaignId={id || ""} />
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Stats */}
          <div className="p-6 rounded-xl bg-card border border-border">
            <h3 className="font-semibold mb-4">Campaign Stats</h3>

            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <DollarSign className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Rate</div>
                  <div className="font-semibold">
                    ${campaign.rate_value} / {formatNumber(campaign.rate_unit)} views
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Eye className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Min Views</div>
                  <div className="font-semibold">{formatNumber(campaign.min_views)}</div>
                </div>
              </div>

              {campaign.max_earnings_per_post && (
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <DollarSign className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Max Per Post</div>
                    <div className="font-semibold">${campaign.max_earnings_per_post}</div>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Submissions</div>
                  <div className="font-semibold">{submissions?.length || 0}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Budget */}
          <div className="p-6 rounded-xl bg-card border border-border">
            <h3 className="font-semibold mb-4">Budget</h3>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-muted-foreground">Used</span>
                  <span className="font-medium">
                    ${Number(campaign.spent_budget).toFixed(0)} / ${Number(campaign.total_budget).toFixed(0)}
                  </span>
                </div>
                <div className="h-3 bg-background rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all ${
                      isBudgetExhausted ? "bg-red-500" : "bg-gradient-primary"
                    }`}
                    style={{ width: `${Math.min((Number(campaign.spent_budget) / Number(campaign.total_budget)) * 100, 100)}%` }}
                  />
                </div>
              </div>

              <div className={`p-4 rounded-lg border ${
                isBudgetExhausted 
                  ? "bg-red-500/10 border-red-500/20" 
                  : "bg-primary/10 border-primary/20"
              }`}>
                <div className="text-sm text-muted-foreground">Remaining</div>
                <div className={`text-2xl font-bold ${isBudgetExhausted ? "text-red-500" : "text-primary"}`}>
                  ${budgetRemaining.toFixed(0)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Shell>
  );
};

export default CampaignDetail;
