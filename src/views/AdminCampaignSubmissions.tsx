"use client";

import Image from "next/image";
import { useParams } from "next/navigation";
import Link from "next/link";
import { AppLayout } from "@/components/app/AppLayout";
import { useCampaign } from "@/hooks/useCampaigns";
import { useCampaignParticipants } from "@/hooks/useAdminUsers";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  ChevronRight, 
  Users, 
  Eye, 
  DollarSign,
  CheckCircle,
  XCircle,
  Clock
} from "lucide-react";

const AdminCampaignSubmissions = () => {
  const params = useParams();
  const campaignId = params.campaignId as string;
  const { data: campaign, isLoading: campaignLoading } = useCampaign(campaignId || "");
  const { data: participants, isLoading: participantsLoading } = useCampaignParticipants(campaignId || "");

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
    if (num >= 1000) return (num / 1000).toFixed(1) + "K";
    return num.toString();
  };

  if (campaignLoading) {
    return (
      <AppLayout title="Campaign Submissions">
        <Skeleton className="h-96" />
      </AppLayout>
    );
  }

  return (
    <AppLayout title={campaign?.name || "Campaign Submissions"}>
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
        <Link href="/admin/submissions" className="hover:text-foreground transition-colors">Campaigns</Link>
        <ChevronRight className="h-4 w-4" />
        <span className="text-foreground">{campaign?.name}</span>
      </div>

      {/* Campaign Stats */}
      {campaign && (
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="p-4 rounded-xl bg-card border border-border">
            <div className="text-sm text-muted-foreground">Total Budget</div>
            <div className="text-xl font-bold">${Number(campaign.total_budget).toFixed(0)}</div>
          </div>
          <div className="p-4 rounded-xl bg-card border border-border">
            <div className="text-sm text-muted-foreground">Spent</div>
            <div className="text-xl font-bold text-primary">${Number(campaign.spent_budget).toFixed(2)}</div>
          </div>
          <div className="p-4 rounded-xl bg-card border border-border">
            <div className="text-sm text-muted-foreground">Status</div>
            <div className={`text-xl font-bold capitalize ${
              campaign.status === "active" ? "text-emerald-400" :
              campaign.status === "paused" ? "text-yellow-400" :
              "text-muted-foreground"
            }`}>
              {campaign.status}
            </div>
          </div>
        </div>
      )}

      {/* Participants */}
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <Users className="h-5 w-5" />
        Participants ({participants?.length || 0})
      </h3>

      {participantsLoading ? (
        <div className="space-y-4">
          {Array(5).fill(0).map((_, i) => <Skeleton key={i} className="h-20" />)}
        </div>
      ) : participants?.length === 0 ? (
        <div className="p-8 rounded-xl bg-card border border-border text-center text-muted-foreground">
          <Users className="h-10 w-10 mx-auto mb-2 opacity-50" />
          <p>No participants in this campaign</p>
        </div>
      ) : (
        <div className="space-y-3">
          {participants?.map((participant) => (
            <Link
              key={participant.creator_id}
              href={`/admin/submissions/${campaignId}/user/${participant.creator_id}`}
              className="flex items-center justify-between p-5 rounded-xl bg-card border border-border hover:border-primary/30 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="relative w-12 h-12 rounded-full bg-gradient-primary flex items-center justify-center text-lg font-bold text-primary-foreground overflow-hidden">
                  {participant.avatar_url ? (
                    <Image
                      src={participant.avatar_url}
                      alt=""
                      fill
                      className="object-cover"
                      sizes="48px"
                      unoptimized
                    />
                  ) : (
                    participant.full_name?.charAt(0) || "?"
                  )}
                </div>
                <div>
                  <h3 className="font-semibold">{participant.full_name || "Anonymous"}</h3>
                  <p className="text-sm text-muted-foreground">{participant.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-6">
                {/* Clip counts */}
                <div className="flex items-center gap-3 text-sm">
                  <span className="flex items-center gap-1 text-emerald-400" title="Approved">
                    <CheckCircle className="h-4 w-4" />
                    {participant.approved_count || 0}
                  </span>
                  <span className="flex items-center gap-1 text-red-400" title="Rejected">
                    <XCircle className="h-4 w-4" />
                    {participant.rejected_count || 0}
                  </span>
                  <span className="flex items-center gap-1 text-yellow-400" title="Pending">
                    <Clock className="h-4 w-4" />
                    {participant.pending_count || 0}
                  </span>
                </div>

                <div className="text-right">
                  <div className="flex items-center gap-1 text-sm">
                    <Eye className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{formatNumber(participant.total_views)}</span>
                  </div>
                  <div className="flex items-center gap-1 text-sm text-primary">
                    <DollarSign className="h-4 w-4" />
                    <span className="font-medium">${participant.total_earnings.toFixed(2)}</span>
                  </div>
                </div>

                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </AppLayout>
  );
};

export default AdminCampaignSubmissions;