"use client";

import { CircleDollarSign, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export interface LaunchFundCampaignStepProps {
  step1Label?: string;
  step1Input: string;
  campaignName: string;
  totalBudget: string;
  onTotalBudgetChange: (v: string) => void;
  onBack: () => void;
  onSummary: () => void;
  onFundAndActivate: () => void;
  isSubmitting: boolean;
}

export function LaunchFundCampaignStep({
  step1Label,
  step1Input,
  campaignName,
  totalBudget,
  onTotalBudgetChange,
  onBack,
  onSummary,
  onFundAndActivate,
  isSubmitting,
}: LaunchFundCampaignStepProps) {
  const budgetNum = parseFloat(totalBudget) || 0;
  const formatted = budgetNum.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="mb-1 text-xl font-semibold">Fund campaign</h2>
        <p className="text-sm text-muted-foreground">{campaignName.trim() || "Your campaign"}</p>
      </div>

      <div className="rounded-lg border border-primary/30 bg-secondary/20 p-3 text-sm text-muted-foreground">
        You&apos;ll fund this campaign using the budget below (aligned with what you set in step 2).
        Adjust the amount if needed before activating.
      </div>

      <div className="space-y-2">
        <Label htmlFor="fund-budget" className={step1Label}>
          Campaign budget
        </Label>
        <Input
          id="fund-budget"
          type="number"
          min={1}
          step={1}
          inputMode="decimal"
          value={totalBudget}
          onChange={(e) => onTotalBudgetChange(e.target.value)}
          className={cn(step1Input)}
        />
      </div>

      <div className="rounded-xl border-2 border-primary/50 bg-card/80 p-4 shadow-[inset_0_0_0_1px_hsl(var(--primary)/0.2)]">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
            <CircleDollarSign className="h-6 w-6" />
          </div>
          <div>
            <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Campaign budget
            </div>
            <div className="text-2xl font-semibold tabular-nums text-foreground">{formatted}</div>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-secondary/30 p-4">
        <p className="mb-2 text-sm font-medium text-foreground">What happens next:</p>
        <ul className="list-inside list-disc space-y-1.5 text-sm text-muted-foreground">
          <li>Campaign is created with all your settings</li>
          <li>
            <span className="font-medium text-foreground">Summary</span> saves it as{" "}
            <span className="font-medium text-foreground">pending</span> until you fund
          </li>
          <li>
            <span className="font-medium text-foreground">Fund &amp; Activate</span> marks it live for
            clippers after budget checkout (or immediately in dev)
          </li>
        </ul>
      </div>

      <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <Button type="button" variant="outline" onClick={onBack} disabled={isSubmitting}>
          Back
        </Button>
        <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            className="border-primary/50 bg-primary/5 hover:bg-primary/10"
            onClick={onSummary}
            disabled={isSubmitting}
          >
            Summary
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
          <Button
            type="button"
            className="btn-glow border-2 border-primary bg-transparent hover:bg-primary/10"
            onClick={onFundAndActivate}
            disabled={isSubmitting || budgetNum <= 0}
          >
            {isSubmitting ? "Working…" : `Fund & Activate (${formatted})`}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
