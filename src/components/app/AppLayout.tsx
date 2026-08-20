"use client";

import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { Menu } from "lucide-react";

interface AppLayoutProps {
  children: React.ReactNode;
  title?: string;
  /** Extra controls shown in the top bar before the notification bell (e.g. primary actions). */
  headerRight?: React.ReactNode;
}

export function AppLayout({ children, title, headerRight }: AppLayoutProps) {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar />
        
        <div className="flex min-w-0 flex-1 flex-col">
          {/* Top bar — same glass language as launch modal */}
          <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-border bg-background/80 px-4 backdrop-blur-xl lg:px-6">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="lg:hidden">
                <Menu className="h-5 w-5" />
              </SidebarTrigger>
              {title && (
                <h1 className="text-xl font-semibold">{title}</h1>
              )}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {headerRight}
              <NotificationBell />
            </div>
          </header>

          {/* Main content */}
          <main className="flex-1 p-4 lg:p-6 overflow-auto">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

export default AppLayout;