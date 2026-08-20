import { ShieldOff } from "lucide-react";

export function SessionNotActive() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="flex flex-col items-center gap-6 text-center max-w-sm">
        <div className="w-16 h-16 rounded-2xl bg-destructive/10 flex items-center justify-center">
          <ShieldOff className="w-8 h-8 text-destructive" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight">Session Not Active</h1>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Your session has expired or you don&apos;t have access to this
            experience. Please re-open the app from your Whop dashboard.
          </p>
        </div>

        <div className="w-full h-px bg-border" />

        <p className="text-xs text-muted-foreground">
          If you believe this is an error, contact your community administrator.
        </p>
      </div>
    </div>
  );
}
