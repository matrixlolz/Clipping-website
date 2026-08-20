"use client";

import { useState, useEffect } from "react";
import { AppLayout } from "@/components/app/AppLayout";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { mysqlApi } from "@/integrations/mysql/api";
import { useAuth } from "@/hooks/useAuth";
import { Bell, Trash2, Mail, Shield } from "lucide-react";
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

const Settings = () => {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState({
    email: true,
    submissions: true,
    payouts: true,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Load settings on mount
  useEffect(() => {
    const loadSettings = async () => {
      if (!user) return;
      
      try {
        setIsLoading(true);
        const settings = (await mysqlApi.settings.get()) as {
          email_notifications?: boolean;
          submission_notifications?: boolean;
          payout_notifications?: boolean;
        };
        setNotifications({
          email: settings.email_notifications ?? true,
          submissions: settings.submission_notifications ?? true,
          payouts: settings.payout_notifications ?? true,
        });
      } catch (error: any) {
        console.error('Error loading settings:', error);
        // Settings will default to all true if not found
      } finally {
        setIsLoading(false);
      }
    };

    loadSettings();
  }, [user]);

  const handleSaveNotifications = async () => {
    if (!user) return;

    setIsSaving(true);
    try {
      await mysqlApi.settings.update({
        email_notifications: notifications.email,
        submission_notifications: notifications.submissions,
        payout_notifications: notifications.payouts,
      });

      toast({
        title: "Settings saved",
        description: "Your notification preferences have been updated.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save settings",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!user) return;

    setIsDeleting(true);
    try {
      await mysqlApi.account.delete();
      
      toast({
        title: "Account deleted",
        description: "Your account has been permanently deleted.",
      });

      // Clear local storage and sign out
      localStorage.removeItem('apex_auth_token');
      localStorage.removeItem('apex_session');
      await signOut();
      
      // Redirect to home
      window.location.href = '/';
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete account",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <AppLayout title="Settings">
        <div className="max-w-2xl mx-auto flex items-center justify-center min-h-[400px]">
          <div className="flex flex-col items-center gap-4">
            <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
            <p className="text-muted-foreground">Loading settings...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Settings">
      <div className="max-w-2xl mx-auto space-y-8">
        {/* Authentication Info */}
        <div className="p-6 rounded-xl bg-card border border-border">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-primary/10">
              <Shield className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="font-semibold">Authentication</h2>
              <p className="text-sm text-muted-foreground">Your account uses passwordless OTP authentication</p>
            </div>
          </div>
          <div className="mt-4 p-4 rounded-lg bg-secondary/50 border border-border">
            <div className="flex items-center gap-2 text-sm">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Email:</span>
              <span className="font-medium">{user?.email}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              To sign in, you&apos;ll receive a verification code via email. No password needed!
            </p>
          </div>
        </div>

        {/* Notifications */}
        <div className="p-6 rounded-xl bg-card border border-border">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-primary/10">
              <Bell className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="font-semibold">Notifications</h2>
              <p className="text-sm text-muted-foreground">Manage your notification preferences</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Email Notifications</div>
                <div className="text-sm text-muted-foreground">Receive updates via email</div>
              </div>
              <Switch
                checked={notifications.email}
                onCheckedChange={(checked) =>
                  setNotifications({ ...notifications, email: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Submission Updates</div>
                <div className="text-sm text-muted-foreground">
                  Get notified when submissions are approved/rejected
                </div>
              </div>
              <Switch
                checked={notifications.submissions}
                onCheckedChange={(checked) =>
                  setNotifications({ ...notifications, submissions: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Payout Notifications</div>
                <div className="text-sm text-muted-foreground">
                  Get notified when payouts are processed
                </div>
              </div>
              <Switch
                checked={notifications.payouts}
                onCheckedChange={(checked) =>
                  setNotifications({ ...notifications, payouts: checked })
                }
              />
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-border">
            <Button
              onClick={handleSaveNotifications}
              disabled={isSaving}
              className="bg-gradient-primary"
            >
              {isSaving ? "Saving..." : "Save Preferences"}
            </Button>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="p-6 rounded-xl bg-card border border-red-500/20">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-red-500/10">
              <Trash2 className="h-5 w-5 text-red-400" />
            </div>
            <div>
              <h2 className="font-semibold text-red-400">Danger Zone</h2>
              <p className="text-sm text-muted-foreground">Irreversible actions</p>
            </div>
          </div>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" className="border-red-500/30 text-red-400 hover:bg-red-500/10">
                Delete Account
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Account?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete your account and
                  remove all your data from our servers.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeleteAccount}
                  className="bg-red-500 hover:bg-red-600"
                >
                  Delete Account
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </AppLayout>
  );
};

export default Settings;
