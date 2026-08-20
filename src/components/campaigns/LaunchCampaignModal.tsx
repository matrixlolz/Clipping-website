"use client";

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import Launch from "@/views/Launch";
import { WhopEmbedTokenCapture } from "@/components/campaigns/WhopEmbedTokenCapture";

interface LaunchCampaignModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Full launch flow in a large dialog (used from My Campaigns / Dashboard instead of a separate route).
 */
export function LaunchCampaignModal({ open, onOpenChange }: LaunchCampaignModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          "!flex !max-w-5xl flex-col gap-0 overflow-hidden p-0 sm:rounded-2xl",
          "border border-primary/25 bg-popover/95 backdrop-blur-2xl",
          "shadow-[0_0_0_1px_hsl(var(--primary)/0.06),0_28px_64px_-12px_rgba(0,0,0,0.55)]",
          "max-h-[min(92vh,920px)] w-[calc(100vw-1.25rem)]",
          "[&>button.absolute]:right-4 [&>button.absolute]:top-4 [&>button.absolute]:flex [&>button.absolute]:h-9 [&>button.absolute]:w-9 [&>button.absolute]:items-center [&>button.absolute]:justify-center [&>button.absolute]:rounded-full [&>button.absolute]:border [&>button.absolute]:border-primary/35 [&>button.absolute]:bg-background/90 [&>button.absolute]:text-foreground [&>button.absolute]:opacity-100 [&>button.absolute]:shadow-sm [&>button.absolute]:hover:bg-primary/10 [&>button.absolute]:hover:text-foreground",
        )}
        aria-describedby={undefined}
      >
        <DialogTitle className="sr-only">New Content Rewards Campaign</DialogTitle>
        <div className="min-h-0 flex-1 overflow-y-auto bg-background/30 px-4 py-5 sm:px-7 sm:py-6">
          {open ? (
            <>
              <WhopEmbedTokenCapture />
              <Launch
                mode="embedded"
                onClose={() => onOpenChange(false)}
              />
            </>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
