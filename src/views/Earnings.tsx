"use client";

import { useMemo } from "react";
import { AppLayout } from "@/components/app/AppLayout";
import { DollarSign, TrendingUp, Clock, Eye, AlertCircle, ChevronRight, CheckCircle, XCircle, Film } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useWallet, usePayouts, useRequestPayout } from "@/hooks/useWallet";
import { useMySubmissions } from "@/hooks/useSubmissions";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import Link from "next/link";
import { useParams } from "next/navigation";
import { getCampaignDetailHref, getCampaignsListHref } from "@/lib/campaign-routes";

interface CampaignEarnings {
  campaign_id: string;
  campaign_name: string;
  approved_count: number;
  rejected_count: number;
  pending_count: number;
  total_views: number;
  total_earnings: number;
  min_payout_views: number;
  is_eligible: boolean;
}

const Earnings = () => {
  const params = useParams();
  const experienceId = params.experienceId as string | undefined;
  const campaignsListHref = getCampaignsListHref(experienceId);
  const { data: wallet, isLoading: walletLoading } = useWallet();
  const { data: payouts, isLoading: payoutsLoading } = usePayouts();
  const { data: submissions, isLoading: submissionsLoading } = useMySubmissions();
  const { profile } = useAuth();
  const requestPayout = useRequestPayout();
  const { toast } = useToast();

  // Group submissions by campaign
  const campaignEarnings = useMemo(() => {
    if (!submissions) return [];
    
    const grouped = new Map<string, CampaignEarnings>();
    
    submissions.forEach((sub: any) => {
      const campaignId = sub.campaign_id;
      const campaignName = sub.campaign?.name || "Unknown Campaign";
      
      if (!grouped.has(campaignId)) {
        grouped.set(campaignId, {
          campaign_id: campaignId,
          campaign_name: campaignName,
          approved_count: 0,
          rejected_count: 0,
          pending_count: 0,
          total_views: 0,
          total_earnings: 0,
          min_payout_views: 1000,
          is_eligible: false,
        });
      }
      
      const entry = grouped.get(campaignId)!;
      
      if (sub.status === "approved" || sub.status === "paid") {
        entry.approved_count += 1;
        entry.total_views += Number(sub.views || 0);
        entry.total_earnings += Number(sub.earnings || 0);
      } else if (sub.status === "rejected") {
        entry.rejected_count += 1;
      } else if (sub.status === "pending") {
        entry.pending_count += 1;
      }
    });
    
    // Determine eligibility - must have earnings > 0 and at least one approved submission
    grouped.forEach((entry) => {
      entry.is_eligible = entry.total_earnings >= 10 && entry.approved_count > 0;
    });
    
    return Array.from(grouped.values()).sort((a, b) => b.total_earnings - a.total_earnings);
  }, [submissions]);

  const totalEarnings = submissions?.reduce((sum, s) => sum + Number(s.earnings || 0), 0) || 0;
  const paidSubmissions = submissions?.filter(s => s.status === "paid" || s.status === "approved") || [];

  // Check if payment details are complete
  const hasPaymentDetails = () => {
    if (!profile) return false;
    if (profile.payout_method === "paypal") {
      return !!profile.payout_email;
    }
    if (profile.payout_method === "usdc_solana") {
      return !!profile.solana_wallet_address;
    }
    return false;
  };

  // Check for existing pending/approved payout
  const hasPendingPayout = payouts?.some(p => p.status === "pending" || p.status === "approved");

  const handleRequestPayout = async () => {
    if (!wallet || wallet.pending_balance < 10) {
      toast({ title: "Minimum $10 required", variant: "destructive" });
      return;
    }

    if (!hasPaymentDetails()) {
      toast({ 
        title: "Payment details required", 
        description: "Please add your payment details in your profile before requesting a payout",
        variant: "destructive" 
      });
      return;
    }

    if (hasPendingPayout) {
      toast({ 
        title: "Payout in progress", 
        description: "You already have a payout request pending",
        variant: "destructive" 
      });
      return;
    }

    try {
      await requestPayout.mutateAsync(wallet.pending_balance);
      toast({ title: "Payout requested" });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
    if (num >= 1000) return (num / 1000).toFixed(1) + "K";
    return num.toString();
  };

  return (
    <AppLayout title="Earnings">
      <div className="page-enter">
        {/* Stats Cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8 stagger-enter">
          {walletLoading ? Array(5).fill(0).map((_, i) => <Skeleton key={i} className="h-32" />) : (
            <>
              <div className="p-5 rounded-xl bg-card border border-border card-hover">
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2 rounded-lg bg-emerald-500/10"><DollarSign className="h-5 w-5 text-emerald-400" /></div>
                </div>
                <div className="text-2xl font-bold mb-1">${totalEarnings.toFixed(2)}</div>
                <div className="text-sm text-muted-foreground">Total Earnings</div>
              </div>
              <div className="p-5 rounded-xl bg-card border border-border card-hover">
                <div className="p-2 rounded-lg bg-yellow-500/10 w-fit mb-3"><Clock className="h-5 w-5 text-yellow-400" /></div>
                <div className="text-2xl font-bold mb-1">${(wallet?.pending_balance || 0).toFixed(2)}</div>
                <div className="text-sm text-muted-foreground">Available</div>
              </div>
              <div className="p-5 rounded-xl bg-card border border-border card-hover">
                <div className="p-2 rounded-lg bg-orange-500/10 w-fit mb-3"><Clock className="h-5 w-5 text-orange-400" /></div>
                <div className="text-2xl font-bold mb-1">${(wallet?.locked_earnings || 0).toFixed(2)}</div>
                <div className="text-sm text-muted-foreground">Processing</div>
              </div>
              <div className="p-5 rounded-xl bg-card border border-border card-hover">
                <div className="p-2 rounded-lg bg-primary/10 w-fit mb-3"><TrendingUp className="h-5 w-5 text-primary" /></div>
                <div className="text-2xl font-bold mb-1">${(wallet?.paid_balance || 0).toFixed(2)}</div>
                <div className="text-sm text-muted-foreground">Paid Out</div>
              </div>
              <div className="p-5 rounded-xl bg-card border border-border card-hover">
                <div className="p-2 rounded-lg bg-blue-500/10 w-fit mb-3"><Eye className="h-5 w-5 text-blue-400" /></div>
                <div className="text-2xl font-bold mb-1">{paidSubmissions.length}</div>
                <div className="text-sm text-muted-foreground">Paid Clips</div>
              </div>
            </>
          )}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* My Campaigns Section */}
          <div className="lg:col-span-2 space-y-6">
            <div className="p-6 rounded-xl bg-card border border-border">
              <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
                <Film className="h-5 w-5" />
                My Campaigns
              </h3>
              
              {submissionsLoading ? (
                <div className="space-y-4">
                  {Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-24" />)}
                </div>
              ) : campaignEarnings.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">No campaigns joined yet</p>
                  <Button asChild variant="outline">
                    <Link href={campaignsListHref}>My Campaigns</Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {campaignEarnings.map((campaign) => (
                    <div 
                      key={campaign.campaign_id}
                      className="p-4 rounded-xl bg-secondary/30 border border-border hover:border-primary/30 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-semibold">{campaign.campaign_name}</h4>
                          <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <CheckCircle className="h-4 w-4 text-emerald-400" />
                              {campaign.approved_count} approved
                            </span>
                            {campaign.rejected_count > 0 && (
                              <span className="flex items-center gap-1">
                                <XCircle className="h-4 w-4 text-red-400" />
                                {campaign.rejected_count} rejected
                              </span>
                            )}
                            {campaign.pending_count > 0 && (
                              <span className="flex items-center gap-1">
                                <Clock className="h-4 w-4 text-yellow-400" />
                                {campaign.pending_count} pending
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xl font-bold text-primary">
                            ${campaign.total_earnings.toFixed(2)}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {formatNumber(campaign.total_views)} views
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between pt-3 border-t border-border">
                        <span className={`px-2 py-1 rounded text-xs ${
                          campaign.is_eligible 
                            ? "bg-emerald-500/10 text-emerald-400" 
                            : "bg-secondary text-muted-foreground"
                        }`}>
                          {campaign.is_eligible ? "Eligible for payout" : "Not eligible yet"}
                        </span>
                        <Link
                          href={getCampaignDetailHref(campaign.campaign_id, experienceId)}
                          className="text-sm text-primary hover:underline flex items-center gap-1"
                        >
                          View Campaign <ChevronRight className="h-4 w-4" />
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Payout Section */}
          <div className="space-y-6">
            <div className="p-6 rounded-xl bg-card border border-border">
              <h3 className="text-lg font-semibold mb-6">Request Payout</h3>
              <div className="space-y-4">
                <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                  <div className="text-sm text-muted-foreground">Available Balance</div>
                  <div className="text-2xl font-bold text-primary">${(wallet?.pending_balance || 0).toFixed(2)}</div>
                </div>

                {/* Pending Payout Warning */}
                {hasPendingPayout && (
                  <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                    <div className="flex items-start gap-3">
                      <Clock className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-yellow-500">Payout in progress</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          You already have a pending payout request.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Payment Details Warning */}
                {!hasPaymentDetails() && !hasPendingPayout && (
                  <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-yellow-500">Payment details required</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Add your payment details before requesting a payout.
                        </p>
                        <Button asChild size="sm" variant="outline" className="mt-2">
                          <Link href="/profile">Update Profile</Link>
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Current Payment Method */}
                {hasPaymentDetails() && (
                  <div className="p-3 rounded-lg bg-secondary/50">
                    <div className="text-xs text-muted-foreground">Payment Method</div>
                    <div className="font-medium capitalize">
                      {profile?.payout_method === "usdc_solana" ? "USDC (Solana)" : "PayPal"}
                    </div>
                    <div className="text-xs text-muted-foreground font-mono truncate mt-1">
                      {profile?.payout_method === "usdc_solana" 
                        ? profile?.solana_wallet_address 
                        : profile?.payout_email}
                    </div>
                  </div>
                )}

                <Button 
                  onClick={handleRequestPayout} 
                  disabled={requestPayout.isPending || (wallet?.pending_balance || 0) < 10 || !hasPaymentDetails() || hasPendingPayout} 
                  className="w-full bg-gradient-primary"
                >
                  {requestPayout.isPending ? "Requesting..." : "Request Payout"}
                </Button>
                <p className="text-xs text-muted-foreground text-center">Minimum $10 required</p>
              </div>
            </div>

            {/* Recent Payouts */}
            {payouts && payouts.length > 0 && (
              <div className="p-6 rounded-xl bg-card border border-border">
                <h3 className="text-lg font-semibold mb-4">Recent Payouts</h3>
                <div className="space-y-3">
                  {payouts.slice(0, 5).map((payout) => (
                    <div key={payout.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
                      <div>
                        <p className="font-medium">${Number(payout.amount).toFixed(2)}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(payout.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs capitalize ${
                        payout.status === "paid" ? "bg-emerald-500/10 text-emerald-400" :
                        payout.status === "approved" ? "bg-blue-500/10 text-blue-400" :
                        payout.status === "pending" ? "bg-yellow-500/10 text-yellow-400" :
                        "bg-red-500/10 text-red-400"
                      }`}>
                        {payout.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default Earnings;