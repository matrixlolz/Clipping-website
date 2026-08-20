import { Clock } from "lucide-react";

/** Full-page state when an experience route requires admin access. */
export function SessionExpired() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="flex flex-col items-center gap-6 text-center max-w-sm">
        <div className="w-16 h-16 rounded-2xl bg-destructive/10 flex items-center justify-center">
          <Clock className="w-8 h-8 text-destructive" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight">Session expired</h1>
          <p className="text-muted-foreground text-sm leading-relaxed">
            This dashboard is only available to administrators. Sign in with an
            admin account or return to your member area.
          </p>
        </div>

        <div className="w-full h-px bg-border" />

        <p className="text-xs text-muted-foreground">
          If you need access, contact your community administrator.
        </p>
      </div>
    </div>
  );
}
