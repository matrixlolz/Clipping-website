"use client";

import Image from "next/image";
import Link from "next/link";
import { AppLayout } from "@/components/app/AppLayout";
import { useCampaigns } from "@/hooks/useCampaigns";
import { useAllSubmissions } from "@/hooks/useSubmissions";
import { primaryCampaignImageUrl } from "@/lib/campaign-images";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronRight, Film, Clock, CheckCircle } from "lucide-react";
import { useMemo } from "react";

const AdminSubmissions = () => {
  const { data: campaigns, isLoading: campaignsLoading } = useCampaigns();
  const { data: submissions } = useAllSubmissions();

  // Count submissions per campaign
  const campaignStats = useMemo(() => {
    if (!submissions || !campaigns) return new Map();
    
    const stats = new Map<string, { pending: number; approved: number; total: number }>();
    
    submissions.forEach(sub => {
      const existing = stats.get(sub.campaign_id) || { pending: 0, approved: 0, total: 0 };
      existing.total += 1;
      if (sub.status === "pending") existing.pending += 1;
      if (sub.status === "approved" || sub.status === "paid") existing.approved += 1;
      stats.set(sub.campaign_id, existing);
    });
    
    return stats;
  }, [submissions, campaigns]);

  return (
    <AppLayout title="Manage Submissions">
      <p className="text-muted-foreground mb-6">Select a campaign to review submissions</p>
      
      {campaignsLoading ? (
        <div className="space-y-4">
          {Array(5).fill(0).map((_, i) => <Skeleton key={i} className="h-24" />)}
        </div>
      ) : campaigns?.length === 0 ? (
        <div className="p-8 rounded-xl bg-card border border-border text-center text-muted-foreground">
          <Film className="h-10 w-10 mx-auto mb-2 opacity-50" />
          <p>No campaigns found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {campaigns?.map((campaign) => {
            const stats = campaignStats.get(campaign.id) || { pending: 0, approved: 0, total: 0 };
            const hero = primaryCampaignImageUrl(campaign.image_url);
            return (
              <Link
                key={campaign.id}
                href={`/admin/submissions/${campaign.id}`}
                className="flex items-center justify-between p-5 rounded-xl bg-card border border-border hover:border-primary/30 transition-colors"
              >
                <div className="flex items-center gap-4">
                  {hero ? (
                    <Image
                      src={hero}
                      alt=""
                      width={48}
                      height={48}
                      unoptimized
                      className="w-12 h-12 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-gradient-primary flex items-center justify-center text-lg font-bold text-primary-foreground">
                      {campaign.name.charAt(0)}
                    </div>
                  )}
                  <div>
                    <h3 className="font-semibold">{campaign.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {stats.total} submissions
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  {stats.pending > 0 && (
                    <span className="px-3 py-1 rounded-full text-xs bg-yellow-500/10 text-yellow-400 flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {stats.pending} pending
                    </span>
                  )}
                  {stats.approved > 0 && (
                    <span className="px-3 py-1 rounded-full text-xs bg-emerald-500/10 text-emerald-400 flex items-center gap-1">
                      <CheckCircle className="h-3 w-3" />
                      {stats.approved} approved
                    </span>
                  )}
                  <span className={`px-3 py-1 rounded-full text-xs capitalize ${
                    campaign.status === "active" ? "bg-emerald-500/10 text-emerald-400" :
                    campaign.status === "paused" ? "bg-yellow-500/10 text-yellow-400" :
                    "bg-secondary text-muted-foreground"
                  }`}>
                    {campaign.status}
                  </span>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </AppLayout>
  );
};

export default AdminSubmissions;