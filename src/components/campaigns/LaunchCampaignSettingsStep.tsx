"use client";

import { GripVertical, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export type ApplicationQuestionType = "text" | "select" | "image" | "video";

export interface ApplicationQuestionRow {
  id: string;
  prompt: string;
  questionType: ApplicationQuestionType;
  required: boolean;
}

const QUESTION_TYPE_HINT: Record<ApplicationQuestionType, string> = {
  text: "Free text input",
  select: "Single choice from options",
  image: "Image upload",
  video: "Video upload",
};

export interface LaunchCampaignSettingsStepProps {
  step1Label?: string;
  step1Input: string;
  requireApplication: boolean;
  onRequireApplicationChange: (v: boolean) => void;
  applicationQuestions: ApplicationQuestionRow[];
  onApplicationQuestionsChange: (rows: ApplicationQuestionRow[]) => void;
  showOnDiscover: boolean;
  onShowOnDiscoverChange: (v: boolean) => void;
  whopProductId: string;
  onWhopProductIdChange: (v: string) => void;
  whopProducts: { id: string; title: string }[];
  whopProductRequired: boolean;
}

export function LaunchCampaignSettingsStep({
  step1Label,
  step1Input,
  requireApplication,
  onRequireApplicationChange,
  applicationQuestions,
  onApplicationQuestionsChange,
  showOnDiscover,
  onShowOnDiscoverChange,
  whopProductId,
  onWhopProductIdChange,
  whopProducts,
  whopProductRequired,
}: LaunchCampaignSettingsStepProps) {
  const addQuestion = () => {
    onApplicationQuestionsChange([
      ...applicationQuestions,
      {
        id: crypto.randomUUID(),
        prompt: "",
        questionType: "text",
        required: true,
      },
    ]);
  };

  const updateQuestion = (id: string, patch: Partial<ApplicationQuestionRow>) => {
    onApplicationQuestionsChange(
      applicationQuestions.map((q) => (q.id === id ? { ...q, ...patch } : q)),
    );
  };

  const removeQuestion = (id: string) => {
    onApplicationQuestionsChange(applicationQuestions.filter((q) => q.id !== id));
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="mb-1 text-xl font-semibold">Campaign settings</h2>
        <p className="text-sm text-muted-foreground">
          Application flow, visibility, and Whop product
        </p>
      </div>

      <div className="space-y-5">
        <div className="flex items-start justify-between gap-4 rounded-xl border border-border bg-secondary/25 p-4">
          <div className="min-w-0 space-y-1">
            <div className={cn("text-sm font-medium text-foreground", step1Label)}>Require Application</div>
            <p className="text-xs text-muted-foreground">
              Require creators to apply before submitting content.
            </p>
          </div>
          <Switch
            checked={requireApplication}
            onCheckedChange={onRequireApplicationChange}
            aria-label="Require application"
          />
        </div>

        {requireApplication ? (
          <div className="space-y-3 rounded-xl border border-border bg-card/50 p-3 sm:p-4">
            <div className="space-y-3">
              {applicationQuestions.map((q, idx) => (
                <div
                  key={q.id}
                  className="relative rounded-lg border border-border bg-secondary/40 p-3 pt-3"
                >
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="absolute right-2 top-2 h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={() => removeQuestion(q.id)}
                    aria-label="Remove question"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                  <div className="flex gap-2 pr-10">
                    <GripVertical
                      className="mt-2 h-4 w-4 shrink-0 text-muted-foreground"
                      aria-hidden
                    />
                    <div className="min-w-0 flex-1 space-y-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-medium text-muted-foreground">
                          Question {idx + 1}
                        </span>
                        <span className="rounded-md bg-primary/15 px-1.5 py-0.5 text-[10px] font-medium uppercase text-primary">
                          {q.questionType}
                        </span>
                      </div>
                      <Input
                        placeholder="Enter question"
                        value={q.prompt}
                        onChange={(e) => updateQuestion(q.id, { prompt: e.target.value })}
                        className={cn(step1Input)}
                      />
                      <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground">Question Type</Label>
                        <Select
                          value={q.questionType}
                          onValueChange={(v) =>
                            updateQuestion(q.id, { questionType: v as ApplicationQuestionType })
                          }
                        >
                          <SelectTrigger className={step1Input}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="text">Text</SelectItem>
                            <SelectItem value="select">Select</SelectItem>
                            <SelectItem value="image">Image</SelectItem>
                            <SelectItem value="video">Video</SelectItem>
                          </SelectContent>
                        </Select>
                        <p className="text-[11px] text-muted-foreground">
                          {QUESTION_TYPE_HINT[q.questionType]}
                        </p>
                      </div>
                      <label className="flex cursor-pointer items-center gap-2 text-sm">
                        <Checkbox
                          checked={q.required}
                          onCheckedChange={(c) =>
                            updateQuestion(q.id, { required: c === true })
                          }
                        />
                        <span>Is required</span>
                      </label>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={addQuestion}
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-primary/40 bg-secondary/20 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:border-primary/60 hover:bg-secondary/40 hover:text-foreground"
            >
              <Plus className="h-4 w-4" />
              Add question
            </button>
          </div>
        ) : null}

        <div className="flex items-start justify-between gap-4 rounded-xl border border-border bg-secondary/25 p-4">
          <div className="min-w-0 space-y-1">
            <div className={cn("text-sm font-medium text-foreground", step1Label)}>
              Show Campaign on Discover Page
            </div>
            <p className="text-xs text-muted-foreground">
              Make your campaign visible in the Discover Marketplace.
            </p>
          </div>
          <Switch
            checked={showOnDiscover}
            onCheckedChange={onShowOnDiscoverChange}
            aria-label="Show on Discover"
          />
        </div>

        <div className="space-y-2">
          <Label className={step1Label}>
            Select Product{whopProductRequired ? <span className="text-destructive"> *</span> : null}
          </Label>
          {whopProducts.length > 0 ? (
            <Select
              value={whopProductId.trim() ? whopProductId : "__none__"}
              onValueChange={(v) => onWhopProductIdChange(v === "__none__" ? "" : v)}
            >
              <SelectTrigger className={step1Input}>
                <SelectValue placeholder="Choose a Whop product…" />
              </SelectTrigger>
              <SelectContent className="max-h-60">
                <SelectItem value="__none__">Choose a Whop product…</SelectItem>
                {whopProducts.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <div className="space-y-1">
              <Input
                placeholder="prod_… (Whop product id)"
                value={whopProductId}
                onChange={(e) => onWhopProductIdChange(e.target.value)}
                className={step1Input}
              />
              <p className="text-[11px] text-muted-foreground">
                No products loaded from Whop; paste a product id, or configure WHOP_API_KEY and company access.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
