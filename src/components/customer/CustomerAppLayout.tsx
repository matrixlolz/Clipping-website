"use client";

import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { CustomerAppSidebar } from "./CustomerAppSidebar";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { Menu } from "lucide-react";

interface CustomerAppLayoutProps {
  children: React.ReactNode;
  title?: string;
  headerRight?: React.ReactNode;
}

export function CustomerAppLayout({ children, title, headerRight }: CustomerAppLayoutProps) {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <CustomerAppSidebar />

        <div className="flex min-w-0 flex-1 flex-col">
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

          <main className="flex-1 p-4 lg:p-6 overflow-auto">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

export default CustomerAppLayout;
