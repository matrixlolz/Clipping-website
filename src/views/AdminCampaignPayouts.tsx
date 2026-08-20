"use client";

import { useState } from "react";
import Image from "next/image";
import { useParams } from "next/navigation";
import Link from "next/link";
import { AppLayout } from "@/components/app/AppLayout";
import { useCampaigns } from "@/hooks/useCampaigns";
import { useCampaignParticipants } from "@/hooks/useAdminUsers";
import { primaryCampaignImageUrl } from "@/lib/campaign-images";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { 
  ChevronRight, 
  Users, 
  Eye, 
  DollarSign, 
  CheckCircle,
  Clock,
  Ban,
  Video,
  XCircle,
  Wallet
} from "lucide-react";

const AdminCampaignPayouts = () => {
  const params = useParams();
  const campaignId = params.campaignId as string;
  const { data: campaigns, isLoading: campaignsLoading } = useCampaigns();
  const { data: participants, isLoading: participantsLoading } = useCampaignParticipants(campaignId || "");

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
    if (num >= 1000) return (num / 1000).toFixed(1) + "K";
    return num.toString();
  };

  const getPayoutStatusBadge = (status: string) => {
    switch (status) {
      case "eligible":
        return <span className="px-2 py-1 rounded-full text-xs bg-emerald-500/10 text-emerald-400 flex items-center gap-1"><CheckCircle className="h-3 w-3" />Eligible</span>;
      case "pending":
        return <span className="px-2 py-1 rounded-full text-xs bg-yellow-500/10 text-yellow-400 flex items-center gap-1"><Clock className="h-3 w-3" />Pending</span>;
      case "paid":
        return <span className="px-2 py-1 rounded-full text-xs bg-primary/10 text-primary flex items-center gap-1"><DollarSign className="h-3 w-3" />Paid</span>;
      default:
        return <span className="px-2 py-1 rounded-full text-xs bg-secondary text-muted-foreground">Not Eligible</span>;
    }
  };

  // Campaign list view
  if (!campaignId) {
    return (
      <AppLayout title="Payout Management">
        <p className="text-muted-foreground mb-6">Select a campaign to view payout details</p>
        
        {campaignsLoading ? (
          <div className="space-y-4">
            {Array(5).fill(0).map((_, i) => <Skeleton key={i} className="h-24" />)}
          </div>
        ) : campaigns?.length === 0 ? (
          <div className="p-8 rounded-xl bg-card border border-border text-center text-muted-foreground">
            No campaigns found
          </div>
        ) : (
          <div className="space-y-3">
            {campaigns?.map((campaign) => {
              const hero = primaryCampaignImageUrl(campaign.image_url);
              return (
              <Link
                key={campaign.id}
                href={`/admin/payouts/campaign/${campaign.id}`}
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
                      ${Number(campaign.spent_budget).toFixed(0)} / ${Number(campaign.total_budget).toFixed(0)} spent
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
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
  }

  // Campaign participants view
  const selectedCampaign = campaigns?.find(c => c.id === campaignId);

  return (
    <AppLayout title={selectedCampaign?.name || "Campaign Payouts"}>
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
        <Link href="/admin/payouts" className="hover:text-foreground transition-colors">Campaigns</Link>
        <ChevronRight className="h-4 w-4" />
        <span className="text-foreground">{selectedCampaign?.name}</span>
      </div>

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
              href={`/admin/payouts/campaign/${campaignId}/user/${participant.creator_id}`}
              className="block p-5 rounded-xl bg-card border border-border hover:border-primary/30 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="relative">
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
                    {participant.is_banned && (
                      <div className="absolute -bottom-1 -right-1 bg-destructive rounded-full p-0.5">
                        <Ban className="h-3 w-3 text-destructive-foreground" />
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{participant.full_name || "Anonymous"}</h3>
                      {!participant.payment_verified && (
                        <Badge variant="outline" className="text-yellow-500 border-yellow-500/30 text-xs">
                          Unverified
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{participant.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  {getPayoutStatusBadge(participant.payout_status)}
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </div>
              </div>

              {/* Clip Stats Row */}
              <div className="mt-4 pt-4 border-t border-border flex flex-wrap gap-4 text-sm">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-secondary/50">
                  <Video className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Clips:</span>
                  <span className="font-medium text-emerald-400">{participant.approved_count || 0}</span>
                  <span className="text-muted-foreground">/</span>
                  <span className="font-medium text-destructive">{participant.rejected_count || 0}</span>
                  <span className="text-muted-foreground">/</span>
                  <span className="font-medium text-yellow-400">{participant.pending_count || 0}</span>
                  <span className="text-xs text-muted-foreground">(A/R/P)</span>
                </div>

                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-secondary/50">
                  <Eye className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Views:</span>
                  <span className="font-medium">{formatNumber(participant.total_views)}</span>
                </div>

                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/10">
                  <DollarSign className="h-4 w-4 text-primary" />
                  <span className="text-muted-foreground">Earnings:</span>
                  <span className="font-bold text-primary">${participant.total_earnings.toFixed(2)}</span>
                </div>

                {participant.payout_method && (
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-secondary/50">
                    <Wallet className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Payment:</span>
                    <span className="font-medium capitalize">{participant.payout_method}</span>
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </AppLayout>
  );
};

export default AdminCampaignPayouts;
