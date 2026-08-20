"use client";

import { useState } from "react";
import { AppLayout } from "@/components/app/AppLayout";
import { LaunchCampaignModal } from "@/components/campaigns/LaunchCampaignModal";
import { useAdminStats } from "@/hooks/useStats";
import { useAllSubmissions } from "@/hooks/useSubmissions";
import { useAllBrandApplications } from "@/hooks/useBrandApplications";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { 
  DollarSign, 
  Eye, 
  Film, 
  Users, 
  Clock, 
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Building2,
  Wallet,
  ArrowRight
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

// Fetch all payouts for admin
const useAllPayouts = () => {
  return useQuery({
    queryKey: ["all-payouts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payouts")
        .select(`
          *,
          profiles:user_id (full_name, email)
        `)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });
};

// Fetch all wallets for total owed calculation
const useAllWallets = () => {
  return useQuery({
    queryKey: ["all-wallets"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("wallets")
        .select("*");
      
      if (error) throw error;
      return data;
    },
  });
};

const AdminDashboard = () => {
  const [launchModalOpen, setLaunchModalOpen] = useState(false);
  const { data: stats, isLoading: statsLoading } = useAdminStats();
  const { data: submissions, isLoading: submissionsLoading } = useAllSubmissions();
  const { data: brandApps, isLoading: brandsLoading } = useAllBrandApplications();
  const { data: payouts, isLoading: payoutsLoading } = useAllPayouts();
  const { data: wallets, isLoading: walletsLoading } = useAllWallets();

  const isLoading = statsLoading || submissionsLoading || brandsLoading || payoutsLoading || walletsLoading;

  // Calculate financial metrics
  const pendingPayouts = payouts?.filter(p => p.status === "pending") || [];
  const totalPendingPayoutAmount = pendingPayouts.reduce((sum, p) => sum + Number(p.amount), 0);
  const totalPaidOut = payouts?.filter(p => p.status === "paid").reduce((sum, p) => sum + Number(p.amount), 0) || 0;
  const totalOwedToCreators = wallets?.reduce((sum, w) => sum + Number(w.pending_balance), 0) || 0;

  // Submission stats
  const pendingSubmissions = submissions?.filter(s => s.status === "pending") || [];
  const approvedSubmissions = submissions?.filter(s => s.status === "approved" || s.status === "paid") || [];
  const totalEarningsGenerated = submissions?.reduce((sum, s) => sum + Number(s.earnings), 0) || 0;

  // Brand application stats  
  const pendingBrandApps = brandApps?.filter(a => a.status === "pending") || [];

  return (
    <AppLayout title="Admin Dashboard">
      {/* Financial Overview */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-4">Financial Overview</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {isLoading ? (
            Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-32" />)
          ) : (
            <>
              <StatCard 
                icon={Wallet} 
                label="Total Owed to Creators" 
                value={`$${totalOwedToCreators.toFixed(2)}`}
                variant="warning"
              />
              <StatCard 
                icon={Clock} 
                label="Pending Payout Requests" 
                value={`$${totalPendingPayoutAmount.toFixed(2)}`}
                sublabel={`${pendingPayouts.length} requests`}
              />
              <StatCard 
                icon={CheckCircle} 
                label="Total Paid Out" 
                value={`$${totalPaidOut.toFixed(2)}`}
                variant="success"
              />
              <StatCard 
                icon={DollarSign} 
                label="Total Earnings Generated" 
                value={`$${totalEarningsGenerated.toFixed(2)}`}
              />
            </>
          )}
        </div>
      </div>

      {/* Platform Stats */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-4">Platform Activity</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {isLoading ? (
            Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-32" />)
          ) : (
            <>
              <StatCard 
                icon={TrendingUp} 
                label="Active Campaigns" 
                value={stats?.activeCampaigns?.toString() || "0"} 
              />
              <StatCard 
                icon={Film} 
                label="Pending Submissions" 
                value={pendingSubmissions.length.toString()}
                variant={pendingSubmissions.length > 0 ? "warning" : "default"}
              />
              <StatCard 
                icon={Building2} 
                label="Pending Brand Apps" 
                value={pendingBrandApps.length.toString()}
                variant={pendingBrandApps.length > 0 ? "warning" : "default"}
              />
              <StatCard 
                icon={Users} 
                label="Total Submissions" 
                value={submissions?.length?.toString() || "0"} 
              />
            </>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <QuickActionCard 
          to="/admin/submissions"
          title="Review Submissions"
          description={`${pendingSubmissions.length} pending reviews`}
          icon={Film}
          highlight={pendingSubmissions.length > 0}
        />
        <QuickActionCard 
          to="/admin/payouts"
          title="Manage Payouts"
          description={`${pendingPayouts.length} pending requests`}
          icon={Wallet}
          highlight={pendingPayouts.length > 0}
        />
        <QuickActionCard 
          to="/admin/brands"
          title="Brand Applications"
          description={`${pendingBrandApps.length} waiting for review`}
          icon={Building2}
          highlight={pendingBrandApps.length > 0}
        />
        <QuickActionCard
          onClick={() => setLaunchModalOpen(true)}
          title="Create Campaign"
          description="Launch a new campaign for a brand"
          icon={TrendingUp}
        />
      </div>

      <LaunchCampaignModal open={launchModalOpen} onOpenChange={setLaunchModalOpen} />

      {/* Recent Activity */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Recent Submissions */}
        <div className="p-6 rounded-xl bg-card border border-border">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold">Recent Submissions</h3>
            <Link href="/admin/submissions" className="text-sm text-primary hover:underline">View all</Link>
          </div>
          <div className="space-y-3">
            {isLoading ? (
              Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-12" />)
            ) : pendingSubmissions.length === 0 ? (
              <p className="text-muted-foreground text-sm">No pending submissions</p>
            ) : (
              pendingSubmissions.slice(0, 5).map((sub) => (
                <div key={sub.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
                  <div className="flex items-center gap-3">
                    <AlertCircle className="h-4 w-4 text-amber-500" />
                    <div>
                      <p className="text-sm font-medium">{sub.creator_profile?.full_name || "Creator"}</p>
                      <p className="text-xs text-muted-foreground">{sub.campaign?.name}</p>
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground">Pending</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Payout Requests */}
        <div className="p-6 rounded-xl bg-card border border-border">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold">Pending Payouts</h3>
            <Link href="/admin/payouts" className="text-sm text-primary hover:underline">View all</Link>
          </div>
          <div className="space-y-3">
            {isLoading ? (
              Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-12" />)
            ) : pendingPayouts.length === 0 ? (
              <p className="text-muted-foreground text-sm">No pending payout requests</p>
            ) : (
              pendingPayouts.slice(0, 5).map((payout) => (
                <div key={payout.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
                  <div className="flex items-center gap-3">
                    <Clock className="h-4 w-4 text-amber-500" />
                    <div>
                      <p className="text-sm font-medium">{payout.profiles?.full_name || "Creator"}</p>
                      <p className="text-xs text-muted-foreground">{payout.payout_method}</p>
                    </div>
                  </div>
                  <span className="font-medium text-primary">${Number(payout.amount).toFixed(2)}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

function StatCard({ 
  icon: Icon, 
  label, 
  value, 
  sublabel,
  variant = "default" 
}: { 
  icon: React.ElementType; 
  label: string; 
  value: string;
  sublabel?: string;
  variant?: "default" | "success" | "warning";
}) {
  const iconBg = {
    default: "bg-primary/10",
    success: "bg-emerald-500/10",
    warning: "bg-amber-500/10",
  }[variant];

  const iconColor = {
    default: "text-primary",
    success: "text-emerald-500",
    warning: "text-amber-500",
  }[variant];

  return (
    <div className="p-5 rounded-xl bg-card border border-border">
      <div className={`p-2 rounded-lg ${iconBg} w-fit mb-3`}>
        <Icon className={`h-5 w-5 ${iconColor}`} />
      </div>
      <div className="text-2xl font-bold mb-1">{value}</div>
      <div className="text-sm text-muted-foreground">{label}</div>
      {sublabel && <div className="text-xs text-muted-foreground mt-1">{sublabel}</div>}
    </div>
  );
}

function QuickActionCard({
  to,
  onClick,
  title,
  description,
  icon: Icon,
  highlight = false,
}: {
  to?: string;
  onClick?: () => void;
  title: string;
  description: string;
  icon: React.ElementType;
  highlight?: boolean;
}) {
  const className = `p-6 rounded-xl bg-card border transition-colors flex items-center justify-between ${
    highlight ? "border-amber-500/50 hover:border-amber-500" : "border-border hover:border-primary/30"
  }`;

  const inner = (
    <>
      <div className="flex items-center gap-4">
        <div className={`p-3 rounded-lg ${highlight ? "bg-amber-500/10" : "bg-primary/10"}`}>
          <Icon className={`h-5 w-5 ${highlight ? "text-amber-500" : "text-primary"}`} />
        </div>
        <div>
          <h3 className="font-semibold">{title}</h3>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
      <ArrowRight className="h-5 w-5 text-muted-foreground" />
    </>
  );

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={`${className} w-full text-left`}>
        {inner}
      </button>
    );
  }

  return (
    <Link href={to!} className={className}>
      {inner}
    </Link>
  );
}

export default AdminDashboard;
