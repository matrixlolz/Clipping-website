"use client";

import { useState } from "react";
import Image from "next/image";
import { useParams } from "next/navigation";
import Link from "next/link";
import { AppLayout } from "@/components/app/AppLayout";
import { useUserProfile, useUserSubmissions } from "@/hooks/useAdminUsers";
import { useCampaign } from "@/hooks/useCampaigns";
import { useUpdateSubmission } from "@/hooks/useSubmissions";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { mapErrorToUserMessage, logError } from "@/lib/errorMapping";
import { 
  ChevronRight, 
  ExternalLink,
  Eye,
  Heart,
  MessageCircle,
  DollarSign,
  CheckCircle,
  XCircle,
  RefreshCw,
  Smartphone,
  Camera,
  Play,
  AlertCircle
} from "lucide-react";

const platformIcons: Record<string, React.ReactNode> = {
  tiktok: <Smartphone className="h-4 w-4" />,
  instagram: <Camera className="h-4 w-4" />,
  youtube: <Play className="h-4 w-4" />,
};

const AdminUserSubmissions = () => {
  const params = useParams();
  const campaignId = params.campaignId as string;
  const userId = params.userId as string;
  const { toast } = useToast();
  
  const { data: user, isLoading: userLoading } = useUserProfile(userId || "");
  const { data: submissions, isLoading: submissionsLoading, refetch } = useUserSubmissions(userId || "", campaignId);
  const { data: campaign } = useCampaign(campaignId || "");
  const updateSubmission = useUpdateSubmission();
  
  const [processing, setProcessing] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState<string | null>(null);

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
    if (num >= 1000) return (num / 1000).toFixed(1) + "K";
    return num.toString();
  };

  const handleRefreshViews = async (id: string, clipUrl: string, platform: string) => {
    if (platform !== "tiktok" && platform !== "instagram") {
      toast({
        title: "Not supported",
        description: "Auto-fetch is only available for TikTok and Instagram",
        variant: "destructive",
      });
      return;
    }

    setRefreshing(id);
    const functionName = platform === "instagram" ? "fetch-instagram-views" : "fetch-tiktok-views";
    
    try {
      const { data, error } = await supabase.functions.invoke(functionName, {
        body: { video_url: clipUrl },
      });

      if (error) throw error;

      if (data?.success === false) {
        toast({
          title: "Could not fetch views",
          description: data?.error || "API unavailable",
          variant: "destructive",
        });
        return;
      }

      const playCount = Number(data?.play_count ?? 0);
      const likeCount = Number(data?.like_count ?? 0);
      const commentCount = Number(data?.comment_count ?? 0);

      if (playCount > 0) {
        await updateSubmission.mutateAsync({ 
          id, 
          views: playCount,
          likes: likeCount,
          comments: commentCount
        });
        toast({
          title: "Stats updated",
          description: `${playCount.toLocaleString()} views, ${likeCount.toLocaleString()} likes`,
        });
        refetch();
      } else {
        toast({
          title: "Could not fetch views",
          description: "No view data returned",
          variant: "destructive",
        });
      }
    } catch (error: unknown) {
      logError("AdminUserSubmissions:handleRefreshViews", error);
      toast({ 
        title: "API unavailable", 
        description: "Could not refresh views",
        variant: "destructive" 
      });
    } finally {
      setRefreshing(null);
    }
  };

  const handleApprove = async (id: string, views: number) => {
    if (views <= 0) {
      toast({
        title: "No views available",
        description: "Please refresh views first before approving",
        variant: "destructive",
      });
      return;
    }

    setProcessing(id);

    try {
      const { data, error } = await supabase.functions.invoke("calculate-earnings", {
        body: { submission_id: id, verified_views: views },
      });

      if (error) throw error;

      if (data?.error) {
        toast({
          title: "Error",
          description: data.error,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Submission approved!",
        description: `Earnings calculated: $${data.earnings}`,
      });
      refetch();
    } catch (error: unknown) {
      logError("AdminUserSubmissions:handleApprove", error);
      toast({ title: "Error", description: mapErrorToUserMessage(error), variant: "destructive" });
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (id: string) => {
    try {
      await updateSubmission.mutateAsync({ id, status: "rejected" });
      toast({ title: "Submission rejected" });
      refetch();
    } catch (error: unknown) {
      logError("AdminUserSubmissions:handleReject", error);
      toast({ title: "Error", description: mapErrorToUserMessage(error), variant: "destructive" });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
      case "paid":
        return <span className="px-2 py-1 rounded-full text-xs bg-emerald-500/10 text-emerald-400">{status}</span>;
      case "rejected":
        return <span className="px-2 py-1 rounded-full text-xs bg-red-500/10 text-red-400">{status}</span>;
      default:
        return <span className="px-2 py-1 rounded-full text-xs bg-yellow-500/10 text-yellow-400">{status}</span>;
    }
  };

  if (userLoading) {
    return (
      <AppLayout title="User Submissions">
        <Skeleton className="h-96" />
      </AppLayout>
    );
  }

  if (!user) {
    return (
      <AppLayout title="User Not Found">
        <div className="text-center py-16">
          <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">User not found</h3>
        </div>
      </AppLayout>
    );
  }

  const totalViews = submissions?.reduce((sum, s) => sum + Number(s.views || 0), 0) || 0;
  const totalEarnings = submissions?.reduce((sum, s) => sum + Number(s.earnings || 0), 0) || 0;

  return (
    <AppLayout title={`${user.full_name || "User"}'s Submissions`}>
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
        <Link href="/admin/submissions" className="hover:text-foreground transition-colors">Campaigns</Link>
        <ChevronRight className="h-4 w-4" />
        <Link href={`/admin/submissions/${campaignId}`} className="hover:text-foreground transition-colors">
          {campaign?.name}
        </Link>
        <ChevronRight className="h-4 w-4" />
        <span className="text-foreground">{user.full_name || user.email}</span>
      </div>

      {/* User Header */}
      <div className="p-6 rounded-xl bg-card border border-border mb-6">
        <div className="flex items-center gap-4 mb-4">
          <div className="relative w-14 h-14 rounded-xl bg-gradient-primary flex items-center justify-center text-xl font-bold text-primary-foreground overflow-hidden">
            {user.avatar_url ? (
              <Image
                src={user.avatar_url}
                alt=""
                fill
                className="object-cover"
                sizes="56px"
                unoptimized
              />
            ) : (
              user.full_name?.charAt(0) || "?"
            )}
          </div>
          <div>
            <h2 className="text-xl font-bold">{user.full_name || "Anonymous"}</h2>
            <p className="text-muted-foreground">{user.email}</p>
          </div>
        </div>
        
        <div className="grid grid-cols-3 gap-4 pt-4 border-t border-border">
          <div className="text-center">
            <div className="text-2xl font-bold">{submissions?.length || 0}</div>
            <div className="text-sm text-muted-foreground">Clips</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold flex items-center justify-center gap-1">
              <Eye className="h-5 w-5 text-muted-foreground" />
              {formatNumber(totalViews)}
            </div>
            <div className="text-sm text-muted-foreground">Total Views</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-primary flex items-center justify-center gap-1">
              <DollarSign className="h-5 w-5" />
              {totalEarnings.toFixed(2)}
            </div>
            <div className="text-sm text-muted-foreground">Earnings</div>
          </div>
        </div>
      </div>

      {/* Submissions List */}
      <h3 className="text-lg font-semibold mb-4">Clips</h3>

      {submissionsLoading ? (
        <div className="space-y-4">
          {Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-32" />)}
        </div>
      ) : submissions?.length === 0 ? (
        <div className="p-8 rounded-xl bg-card border border-border text-center text-muted-foreground">
          No submissions for this campaign
        </div>
      ) : (
        <div className="space-y-4">
          {submissions?.map((sub: any) => {
            const currentViews = Number(sub.views) || Number(sub.submitted_views) || 0;
            
            return (
              <div key={sub.id} className="p-5 rounded-xl bg-card border border-border">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <span className={`p-2 rounded-lg ${
                      sub.status === "pending" 
                        ? "bg-yellow-500/10 text-yellow-400"
                        : sub.status === "approved" || sub.status === "paid"
                        ? "bg-emerald-500/10 text-emerald-400"
                        : "bg-red-500/10 text-red-400"
                    }`}>
                      {platformIcons[sub.platform]}
                    </span>
                    <div>
                      <a 
                        href={sub.clip_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline flex items-center gap-1 font-medium"
                      >
                        <ExternalLink className="h-4 w-4" />
                        View Clip
                      </a>
                      <p className="text-xs text-muted-foreground mt-1 max-w-md truncate">
                        {sub.clip_url}
                      </p>
                    </div>
                  </div>
                  {getStatusBadge(sub.status)}
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-4 gap-4 p-4 rounded-lg bg-secondary/30 mb-4">
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 text-lg font-bold">
                      <Eye className="h-5 w-5 text-muted-foreground" />
                      {currentViews.toLocaleString()}
                    </div>
                    <div className="text-xs text-muted-foreground">Views</div>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 text-lg font-bold">
                      <Heart className="h-5 w-5 text-red-400" />
                      {Number(sub.likes || 0).toLocaleString()}
                    </div>
                    <div className="text-xs text-muted-foreground">Likes</div>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 text-lg font-bold">
                      <MessageCircle className="h-5 w-5 text-blue-400" />
                      {Number(sub.comments || 0).toLocaleString()}
                    </div>
                    <div className="text-xs text-muted-foreground">Comments</div>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 text-lg font-bold text-primary">
                      <DollarSign className="h-5 w-5" />
                      {Number(sub.earnings || 0).toFixed(2)}
                    </div>
                    <div className="text-xs text-muted-foreground">Earnings</div>
                  </div>
                </div>

                {/* Actions */}
                {sub.status === "pending" && (
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      className="bg-emerald-500 hover:bg-emerald-600"
                      onClick={() => handleApprove(sub.id, currentViews)}
                      disabled={processing === sub.id}
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      {processing === sub.id ? "Processing..." : "Approve"}
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleReject(sub.id)}
                    >
                      <XCircle className="h-4 w-4 mr-1" />
                      Reject
                    </Button>
                    {(sub.platform === "tiktok" || sub.platform === "instagram") && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleRefreshViews(sub.id, sub.clip_url, sub.platform)}
                        disabled={refreshing === sub.id}
                      >
                        <RefreshCw className={`h-4 w-4 mr-1 ${refreshing === sub.id ? "animate-spin" : ""}`} />
                        Refresh Views
                      </Button>
                    )}
                  </div>
                )}

                <div className="text-xs text-muted-foreground mt-3">
                  Submitted {new Date(sub.created_at).toLocaleDateString()} at {new Date(sub.created_at).toLocaleTimeString()}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </AppLayout>
  );
};

export default AdminUserSubmissions;