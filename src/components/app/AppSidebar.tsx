"use client";

import { useContext } from "react";
import Image from "next/image";
import { LayoutDashboard, Search, User, DollarSign, Shield, Settings, Building2, FileText, Wallet, Smartphone, Users } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarHeader, SidebarFooter, useSidebar } from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";
import { useWhopBusiness } from "@/hooks/useWhopBusiness";
import { useWhopExperienceViewer } from "@/hooks/useWhopExperienceViewer";
import { usePathname } from "next/navigation";
import { getCampaignsListHref } from "@/lib/campaign-routes";
import { WhopBusinessLayoutContext } from "@/components/providers/WhopBusinessProvider";

export function AppSidebar() {
  const { state } = useSidebar();
  const whopLayout = useContext(WhopBusinessLayoutContext);
  const whopTeamAdmin = whopLayout?.whopExperienceAccessLevel === "admin";
  const { profile, role, user, isLoading: authLoading } = useAuth();
  const { name: bizName, loading: bizLoading } = useWhopBusiness();
  const { viewer: whopViewer, viewerResolved: whopViewerResolved } =
    useWhopExperienceViewer();
  const pathname = usePathname();
  const isCollapsed = state === "collapsed";

  const experienceId = pathname.match(/\/experiences\/(exp_[A-Za-z0-9_-]+)/)?.[1];
  const dashboardUrl = experienceId ? `/experiences/${experienceId}/dashboard` : "/dashboard";
  const myCampaignsUrl = getCampaignsListHref(experienceId);

  const mainNavItems = [
    ...(!experienceId || role === "admin" || whopTeamAdmin
      ? [{ title: "Dashboard", url: dashboardUrl, icon: LayoutDashboard }]
      : []),
    { title: "My Campaigns", url: myCampaignsUrl, icon: Search },
  ];

  const accountNavItems = [
    { title: "My Profile", url: "/profile", icon: User },
    { title: "Earnings", url: "/earnings", icon: DollarSign },
    { title: "Social Accounts", url: "/social-accounts", icon: Smartphone },
    { title: "Settings", url: "/settings", icon: Settings },
  ];

  const email = profile?.email || user?.email || null;
  const hasFullName = Boolean(profile?.full_name?.trim());
  const displayName = profile?.full_name?.trim() || email || null;
  const secondLine = hasFullName
    ? email
    : role
      ? `${role.charAt(0).toUpperCase()}${role.slice(1)}`
      : !user && !authLoading
        ? "Sign in to see your account"
        : null;
  const avatarLetter = (displayName || "U").charAt(0).toUpperCase();
  const footerTitle =
    displayName && email ? `${displayName} · ${email}` : displayName || email || "Account";

  const inWhopExperience = Boolean(experienceId);
  const whopPrimary =
    whopViewer?.name?.trim() || whopViewer?.username || null;
  const whopSecondLine =
    whopViewer?.name?.trim() && whopViewer.username
      ? `@${whopViewer.username}`
      : null;
  const whopAvatarLetter = (
    whopViewer?.name?.trim() ||
    whopViewer?.username ||
    "U"
  ).charAt(0).toUpperCase();
  const whopFooterTitle = whopViewer
    ? whopViewer.name?.trim()
      ? `${whopViewer.name} · @${whopViewer.username}`
      : `@${whopViewer.username}`
    : footerTitle;

  const whopPending = inWhopExperience && !whopViewer && !whopViewerResolved;
  const footerLoading = whopPending || (!inWhopExperience && authLoading);

  const adminNavItems = role === "admin" ? [
    { title: "Admin Panel", url: "/admin", icon: Shield },
    { title: "Submissions", url: "/admin/submissions", icon: FileText },
    { title: "Payouts", url: "/admin/payouts", icon: Wallet },
    { title: "Brand Applications", url: "/admin/brands", icon: Building2 },
    { title: "Verify Accounts", url: "/admin/social-accounts", icon: Users },
  ] : [];

  return (
    <Sidebar className="border-r border-border bg-card">
      <SidebarHeader className="p-4 border-b border-border">
        <NavLink to={dashboardUrl} className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center shrink-0">
            {bizLoading ? (
              <div className="w-4 h-4 rounded bg-primary-foreground/30 animate-pulse" />
            ) : (
              <span className="text-sm font-bold text-primary-foreground">
                {bizName ? bizName.charAt(0).toUpperCase() : "A"}
              </span>
            )}
          </div>
          {!isCollapsed && (
            bizLoading ? (
              <div className="h-5 w-24 rounded bg-muted animate-pulse" />
            ) : (
              <span className="font-bold text-lg">{bizName ?? "Apex"}</span>
            )
          )}
        </NavLink>
      </SidebarHeader>

      <SidebarContent className="px-2 py-4">
        <SidebarGroup>
          <SidebarGroupLabel className="text-muted-foreground text-xs uppercase tracking-wider mb-2">{!isCollapsed && "Main"}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNavItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} className="flex items-center gap-3 px-3 py-2 rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors" activeClassName="bg-primary/10 text-primary">
                      <item.icon className="h-5 w-5 flex-shrink-0" />
                      {!isCollapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="mt-6">
          <SidebarGroupLabel className="text-muted-foreground text-xs uppercase tracking-wider mb-2">{!isCollapsed && "Account"}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {accountNavItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} className="flex items-center gap-3 px-3 py-2 rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors" activeClassName="bg-primary/10 text-primary">
                      <item.icon className="h-5 w-5 flex-shrink-0" />
                      {!isCollapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {adminNavItems.length > 0 && (
          <SidebarGroup className="mt-6">
            <SidebarGroupLabel className="text-muted-foreground text-xs uppercase tracking-wider mb-2">{!isCollapsed && "Admin"}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {adminNavItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink to={item.url} className="flex items-center gap-3 px-3 py-2 rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors" activeClassName="bg-primary/10 text-primary">
                        <item.icon className="h-5 w-5 flex-shrink-0" />
                        {!isCollapsed && <span>{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-border">
        <NavLink
          to="/profile"
          className="flex items-center gap-3 rounded-lg outline-none ring-offset-background transition-colors hover:bg-secondary/80 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 -m-1 p-1"
          title={whopViewer ? whopFooterTitle : footerTitle}
        >
          {footerLoading ? (
            <>
              <Skeleton className="h-8 w-8 rounded-full shrink-0" />
              {!isCollapsed && (
                <div className="flex-1 min-w-0 space-y-2">
                  <Skeleton className="h-4 w-[8rem] max-w-full" />
                  <Skeleton className="h-3 w-[10rem] max-w-full" />
                </div>
              )}
            </>
          ) : whopViewer ? (
            <>
              {whopViewer.profilePictureUrl ? (
                <Image
                  src={whopViewer.profilePictureUrl}
                  alt={whopPrimary || "Whop profile"}
                  width={32}
                  height={32}
                  unoptimized
                  className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-gradient-primary flex items-center justify-center text-xs font-semibold text-primary-foreground flex-shrink-0">
                  {whopAvatarLetter}
                </div>
              )}
              {!isCollapsed && (
                <div className="flex-1 min-w-0 text-left">
                  <div className="text-sm font-medium truncate">
                    {whopPrimary || "Whop member"}
                  </div>
                  {whopSecondLine != null && whopSecondLine !== "" && (
                    <div className="text-xs text-muted-foreground truncate">
                      {whopSecondLine}
                    </div>
                  )}
                </div>
              )}
            </>
          ) : (
            <>
              {profile?.avatar_url ? (
                <Image
                  src={profile.avatar_url}
                  alt={displayName || "Profile"}
                  width={32}
                  height={32}
                  unoptimized
                  className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-gradient-primary flex items-center justify-center text-xs font-semibold text-primary-foreground flex-shrink-0">
                  {avatarLetter}
                </div>
              )}
              {!isCollapsed && (
                <div className="flex-1 min-w-0 text-left">
                  <div className="text-sm font-medium truncate">
                    {displayName || "Guest"}
                  </div>
                  {secondLine != null && secondLine !== "" && (
                    <div className="text-xs text-muted-foreground truncate">
                      {secondLine}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </NavLink>
      </SidebarFooter>
    </Sidebar>
  );
}

export default AppSidebar;
