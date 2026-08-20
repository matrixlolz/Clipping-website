"use client";

import { useState } from "react";
import Image from "next/image";
import { useParams } from "next/navigation";
import Link from "next/link";
import { AppLayout } from "@/components/app/AppLayout";
import { 
  useUserProfile, 
  useUserSubmissions, 
  useUpdateUserStatus 
} from "@/hooks/useAdminUsers";
import { useAdminLogs } from "@/hooks/useAdminLogs";
import { useCampaign } from "@/hooks/useCampaigns";
import { useAllPayouts, useUpdatePayout } from "@/hooks/useWallet";
import { Button } from "@/components/ui/button";
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
import { useToast } from "@/hooks/use-toast";
import { 
  ChevronRight, 
  Ban, 
  Shield, 
  CheckCircle, 
  XCircle, 
  ExternalLink,
  Eye,
  DollarSign,
  Copy,
  Clock,
  AlertCircle,
  Wallet,
  FileText
} from "lucide-react";

const AdminUserDetail = () => {
  const params = useParams();
  const campaignId = params.campaignId as string;
  const userId = params.userId as string;
  const { toast } = useToast();
  
  const { data: user, isLoading: userLoading } = useUserProfile(userId || "");
  const { data: submissions, isLoading: submissionsLoading } = useUserSubmissions(userId || "", campaignId);
  const { data: campaign } = useCampaign(campaignId || "");
  const { data: allPayouts } = useAllPayouts();
  const { data: logs, isLoading: logsLoading } = useAdminLogs("user", userId);
  
  const updateUserStatus = useUpdateUserStatus();
  const updatePayout = useUpdatePayout();

  const userPayouts = allPayouts?.filter((p: any) => p.user_id === userId) || [];
  const pendingPayouts = userPayouts.filter((p: any) => p.status === "pending");

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
    if (num >= 1000) return (num / 1000).toFixed(1) + "K";
    return num.toString();
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied", description: `${label} copied to clipboard` });
  };

  const handleBan = async () => {
    try {
      await updateUserStatus.mutateAsync({
        userId: userId!,
        updates: { is_banned: true },
        action: "ban_user",
      });
      toast({ title: "User banned" });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleUnban = async () => {
    try {
      await updateUserStatus.mutateAsync({
        userId: userId!,
        updates: { is_banned: false },
        action: "unban_user",
      });
      toast({ title: "User unbanned" });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleVerifyPayment = async () => {
    try {
      await updateUserStatus.mutateAsync({
        userId: userId!,
        updates: { payment_verified: true },
        action: "verify_payment",
      });
      toast({ title: "Payment method verified" });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handlePayoutAction = async (payoutId: string, status: "approved" | "rejected" | "paid") => {
    try {
      await updatePayout.mutateAsync({ id: payoutId, status });
      toast({ title: `Payout ${status}` });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
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
      <AppLayout title="User Details">
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
    <AppLayout title={user.full_name || "User Details"}>
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
        <Link href="/admin/payouts" className="hover:text-foreground transition-colors">Campaigns</Link>
        <ChevronRight className="h-4 w-4" />
        <Link href={`/admin/payouts/campaign/${campaignId}`} className="hover:text-foreground transition-colors">
          {campaign?.name}
        </Link>
        <ChevronRight className="h-4 w-4" />
        <span className="text-foreground">{user.full_name || user.email}</span>
      </div>

      {/* User Header Card */}
      <div className="p-6 rounded-xl bg-card border border-border mb-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="relative w-16 h-16 rounded-xl bg-gradient-primary flex items-center justify-center text-2xl font-bold text-primary-foreground overflow-hidden">
                {user.avatar_url ? (
                  <Image
                    src={user.avatar_url}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="64px"
                    unoptimized
                  />
                ) : (
                  user.full_name?.charAt(0) || "?"
                )}
              </div>
              {user.is_banned && (
                <div className="absolute -bottom-1 -right-1 bg-red-500 rounded-full p-1">
                  <Ban className="h-3 w-3 text-white" />
                </div>
              )}
            </div>
            <div>
              <h2 className="text-xl font-bold flex items-center gap-2">
                {user.full_name || "Anonymous"}
                {user.is_banned && <span className="text-xs text-red-400">(Banned)</span>}
              </h2>
              <p className="text-muted-foreground">{user.email}</p>
              <div className="flex items-center gap-2 mt-2">
                {user.payment_verified ? (
                  <span className="px-2 py-1 rounded text-xs bg-emerald-500/10 text-emerald-400 flex items-center gap-1">
                    <CheckCircle className="h-3 w-3" /> Payment Verified
                  </span>
                ) : (
                  <span className="px-2 py-1 rounded text-xs bg-yellow-500/10 text-yellow-400 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" /> Payment Unverified
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            {!user.payment_verified && (
              <Button size="sm" variant="outline" onClick={handleVerifyPayment}>
                <Shield className="h-4 w-4 mr-1" />
                Verify Payment
              </Button>
            )}
            {user.is_banned ? (
              <Button size="sm" variant="outline" onClick={handleUnban}>
                <CheckCircle className="h-4 w-4 mr-1" />
                Unban
              </Button>
            ) : (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button size="sm" variant="destructive">
                    <Ban className="h-4 w-4 mr-1" />
                    Ban User
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Ban User?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will prevent the user from logging in and submitting clips. Pending payouts will be blocked.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleBan} className="bg-red-500 hover:bg-red-600">
                      Ban User
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </div>

        {/* Campaign Stats */}
        <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-border">
          <div className="text-center">
            <div className="text-2xl font-bold">{submissions?.length || 0}</div>
            <div className="text-sm text-muted-foreground">Submissions</div>
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

      <Tabs defaultValue="submissions" className="space-y-6">
        <TabsList>
          <TabsTrigger value="submissions">Submissions</TabsTrigger>
          <TabsTrigger value="payment">Payment Details</TabsTrigger>
          <TabsTrigger value="payouts">Payouts ({userPayouts.length})</TabsTrigger>
          <TabsTrigger value="logs">Audit Logs</TabsTrigger>
        </TabsList>

        {/* Submissions Tab */}
        <TabsContent value="submissions">
          {submissionsLoading ? (
            <div className="space-y-4">
              {Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-20" />)}
            </div>
          ) : submissions?.length === 0 ? (
            <div className="p-8 rounded-xl bg-card border border-border text-center text-muted-foreground">
              No submissions for this campaign
            </div>
          ) : (
            <div className="space-y-3">
              {submissions?.map((sub: any) => (
                <div key={sub.id} className="p-4 rounded-xl bg-card border border-border">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <a 
                          href={sub.clip_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-primary hover:underline flex items-center gap-1"
                        >
                          <ExternalLink className="h-4 w-4" />
                          {sub.clip_url.slice(0, 50)}...
                        </a>
                        {getStatusBadge(sub.status)}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="capitalize">{sub.platform}</span>
                        <span className="flex items-center gap-1">
                          <Eye className="h-4 w-4" /> {formatNumber(sub.views)}
                        </span>
                        <span className="flex items-center gap-1 text-primary">
                          <DollarSign className="h-4 w-4" /> ${Number(sub.earnings).toFixed(2)}
                        </span>
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(sub.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Payment Details Tab */}
        <TabsContent value="payment">
          <div className="p-6 rounded-xl bg-card border border-border">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Wallet className="h-5 w-5" />
              Payment Method
            </h3>
            
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-secondary/50">
                <div className="text-sm text-muted-foreground mb-1">Method</div>
                <div className="font-medium capitalize">
                  {user.payout_method === "usdc_solana" ? "USDC (Solana)" : user.payout_method || "Not set"}
                </div>
              </div>

              {user.payout_method === "paypal" && (
                <div className="p-4 rounded-lg bg-secondary/50">
                  <div className="text-sm text-muted-foreground mb-1">PayPal Email</div>
                  <div className="flex items-center gap-2">
                    <code className="font-mono">{user.payout_email || "Not set"}</code>
                    {user.payout_email && (
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6"
                        onClick={() => copyToClipboard(user.payout_email!, "PayPal email")}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
              )}

              {user.payout_method === "usdc_solana" && (
                <div className="p-4 rounded-lg bg-secondary/50">
                  <div className="text-sm text-muted-foreground mb-1">Solana Wallet</div>
                  <div className="flex items-center gap-2">
                    <code className="font-mono text-sm break-all">
                      {user.solana_wallet_address || "Not set"}
                    </code>
                    {user.solana_wallet_address && (
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6 flex-shrink-0"
                        onClick={() => copyToClipboard(user.solana_wallet_address!, "Wallet address")}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3 pt-4">
                <span className={`px-3 py-1.5 rounded-lg text-sm ${
                  user.payment_verified 
                    ? "bg-emerald-500/10 text-emerald-400" 
                    : "bg-yellow-500/10 text-yellow-400"
                }`}>
                  {user.payment_verified ? "✓ Verified" : "⚠ Unverified"}
                </span>
                {!user.payment_verified && (
                  <Button size="sm" onClick={handleVerifyPayment}>
                    Verify Payment Method
                  </Button>
                )}
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Payouts Tab */}
        <TabsContent value="payouts">
          {userPayouts.length === 0 ? (
            <div className="p-8 rounded-xl bg-card border border-border text-center text-muted-foreground">
              No payout requests
            </div>
          ) : (
            <div className="space-y-3">
              {userPayouts.map((payout: any) => (
                <div key={payout.id} className="p-5 rounded-xl bg-card border border-border">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-2xl font-bold text-primary">${Number(payout.amount).toFixed(2)}</div>
                      <div className="text-sm text-muted-foreground mt-1">
                        Requested {new Date(payout.created_at).toLocaleDateString()}
                      </div>
                      {getStatusBadge(payout.status)}
                    </div>

                    {payout.status === "pending" && (
                      <div className="flex gap-2">
                        {!user.payment_verified ? (
                          <div className="text-xs text-yellow-500 flex items-center gap-1">
                            <AlertCircle className="h-4 w-4" />
                            Verify payment first
                          </div>
                        ) : user.is_banned ? (
                          <div className="text-xs text-red-500 flex items-center gap-1">
                            <Ban className="h-4 w-4" />
                            User is banned
                          </div>
                        ) : (
                          <>
                            <Button 
                              size="sm" 
                              className="bg-emerald-500 hover:bg-emerald-600"
                              onClick={() => handlePayoutAction(payout.id, "approved")}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" /> Approve
                            </Button>
                            <Button 
                              size="sm" 
                              variant="destructive"
                              onClick={() => handlePayoutAction(payout.id, "rejected")}
                            >
                              <XCircle className="h-4 w-4 mr-1" /> Reject
                            </Button>
                          </>
                        )}
                      </div>
                    )}

                    {payout.status === "approved" && (
                      <Button 
                        size="sm"
                        onClick={() => handlePayoutAction(payout.id, "paid")}
                      >
                        <DollarSign className="h-4 w-4 mr-1" /> Mark as Paid
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Audit Logs Tab */}
        <TabsContent value="logs">
          {logsLoading ? (
            <Skeleton className="h-40" />
          ) : logs?.length === 0 ? (
            <div className="p-8 rounded-xl bg-card border border-border text-center text-muted-foreground">
              <FileText className="h-10 w-10 mx-auto mb-2 opacity-50" />
              No admin actions logged
            </div>
          ) : (
            <div className="space-y-2">
              {logs?.map((log) => (
                <div key={log.id} className="p-4 rounded-lg bg-card border border-border flex items-center gap-4">
                  <div className="p-2 rounded-lg bg-secondary">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium capitalize">{log.action.replace(/_/g, " ")}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(log.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </AppLayout>
  );
};

export default AdminUserDetail;
