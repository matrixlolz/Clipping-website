"use client";

import type { ComponentType } from "react";
import {
  Plus,
  Trash2,
  Link2,
  Smile,
  Music,
  ChevronDown,
  ChevronUp,
  GripVertical,
  Pencil,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export type ContentLinkRow = { id: string; linkType: string; label: string; url: string };

export const LINK_TYPES: { value: string; label: string }[] = [
  { value: "google_drive", label: "Google Drive" },
  { value: "youtube", label: "YouTube" },
  { value: "external_link", label: "External Link" },
  { value: "tiktok", label: "TikTok" },
  { value: "instagram", label: "Instagram" },
  { value: "twitter", label: "X" },
  { value: "google_doc", label: "Google Doc" },
  { value: "twitch", label: "Twitch" },
  { value: "vimeo", label: "Vimeo" },
];

export function linkTypeLabel(value: string): string {
  return LINK_TYPES.find((t) => t.value === value)?.label ?? value;
}

const PRESETS: {
  id: string;
  title: string;
  hint: string;
  icon: ComponentType<{ className?: string }>;
}[] = [
  { id: "face_camera", title: "Require face on camera", hint: "Creator must show their face.", icon: Smile },
  { id: "specific_sound", title: "Specific sound/music", hint: "Require a specific audio track.", icon: Music },
];

export const PRESET_REQUIREMENT_LABELS: Record<string, string> = Object.fromEntries(
  PRESETS.map((p) => [p.id, p.title]),
);

export interface LaunchContentRequirementsStepProps {
  step1Label?: string;
  step1Input: string;
  contentRequirementDraft: string;
  onDraftChange: (v: string) => void;
  customRequirements: string[];
  onAddRequirement: () => void;
  onRemoveRequirement: (index: number) => void;
  linkDraft: { linkType: string; label: string; url: string };
  onLinkDraftChange: (patch: Partial<{ linkType: string; label: string; url: string }>) => void;
  contentLinks: ContentLinkRow[];
  onAddLink: () => void;
  onRemoveLink: (id: string) => void;
  onEditLink?: (row: ContentLinkRow) => void;
  selectedPresets: Set<string>;
  onTogglePreset: (id: string) => void;
  requiredHashtags: string;
  onRequiredHashtagsChange: (v: string) => void;
  requiredBioMentions: string;
  onRequiredBioMentionsChange: (v: string) => void;
  requiredCaptionMentions: string;
  onRequiredCaptionMentionsChange: (v: string) => void;
  requiredMusicUrl: string;
  onRequiredMusicUrlChange: (v: string) => void;
}

export function LaunchContentRequirementsStep({
  step1Label,
  step1Input,
  contentRequirementDraft,
  onDraftChange,
  customRequirements,
  onAddRequirement,
  onRemoveRequirement,
  linkDraft,
  onLinkDraftChange,
  contentLinks,
  onAddLink,
  onRemoveLink,
  onEditLink,
  selectedPresets,
  onTogglePreset,
  requiredHashtags,
  onRequiredHashtagsChange,
  requiredBioMentions,
  onRequiredBioMentionsChange,
  requiredCaptionMentions,
  onRequiredCaptionMentionsChange,
  requiredMusicUrl,
  onRequiredMusicUrlChange,
}: LaunchContentRequirementsStepProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-1">Content Requirements</h2>
        <p className="text-sm text-muted-foreground">
          Add checklist items, reference links, and optional clip rules
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label className={step1Label}>Custom Content Requirements</Label>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch">
            <Input
              placeholder="Enter requirement"
              value={contentRequirementDraft}
              onChange={(e) => onDraftChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  onAddRequirement();
                }
              }}
              className={cn("flex-1", step1Input)}
            />
            <Button
              type="button"
              variant="outline"
              onClick={onAddRequirement}
              className="shrink-0 border-primary/50 bg-transparent hover:bg-primary/10"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add
            </Button>
          </div>
          {customRequirements.length > 0 ? (
            <ul className="space-y-2">
              {customRequirements.map((text, i) => (
                <li
                  key={`${text}-${i}`}
                  className="flex items-center justify-between gap-2 rounded-lg border border-border bg-secondary/40 px-3 py-2 text-sm"
                >
                  <span className="min-w-0 truncate">{text}</span>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
                    onClick={() => onRemoveRequirement(i)}
                    aria-label={`Remove ${text}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </li>
              ))}
            </ul>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label className={step1Label}>Content Links</Label>

          {contentLinks.length > 0 ? (
            <ul className="mb-3 space-y-2">
              {contentLinks.map((row) => (
                <li
                  key={row.id}
                  className="flex items-center gap-3 rounded-lg border border-border bg-secondary/50 px-3 py-2.5"
                >
                  <GripVertical
                    className="h-4 w-4 shrink-0 cursor-grab text-muted-foreground"
                    aria-hidden
                  />
                  <Link2 className="h-4 w-4 shrink-0 text-primary" aria-hidden />
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-medium text-foreground">
                      {row.label.trim() || linkTypeLabel(row.linkType)}
                    </div>
                    <div className="truncate font-mono text-xs text-muted-foreground">{row.url}</div>
                  </div>
                  {onEditLink ? (
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 shrink-0 text-muted-foreground hover:text-foreground"
                      aria-label="Edit link"
                      onClick={() => onEditLink(row)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  ) : null}
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
                    aria-label="Remove link"
                    onClick={() => onRemoveLink(row.id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </li>
              ))}
            </ul>
          ) : null}

          <div className="rounded-xl border border-dashed border-primary/35 bg-secondary/20 p-4 space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Plus className="h-4 w-4 shrink-0" />
              <span>Add content link</span>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Link type</Label>
                <Select
                  value={linkDraft.linkType}
                  onValueChange={(v) => onLinkDraftChange({ linkType: v })}
                >
                  <SelectTrigger className={step1Input}>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {LINK_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Content label</Label>
                <Input
                  placeholder="Content Label"
                  value={linkDraft.label}
                  onChange={(e) => onLinkDraftChange({ label: e.target.value })}
                  className={step1Input}
                />
              </div>
            </div>
            <div className="relative">
              <Link2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Paste URL"
                value={linkDraft.url}
                onChange={(e) => onLinkDraftChange({ url: e.target.value })}
                className={cn("pl-9", step1Input)}
              />
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={onAddLink}
              className="w-full border-primary/50 sm:w-auto"
            >
              Add Link
            </Button>
          </div>
        </div>

        <div className="space-y-3">
          <Label className={step1Label}>Available Requirements</Label>
          <div className="rounded-lg border border-border bg-secondary/20 p-2.5 sm:p-3">
            <p className="mb-2 text-[11px] leading-snug text-muted-foreground">
              Separate entries with commas or spaces (e.g. #brand @handle https://…).
            </p>
            <div className="space-y-2">
              <div className="space-y-1">
                <Label className="text-xs font-medium text-foreground">Required hashtags</Label>
                <Textarea
                  placeholder="#yourbrand #campaign"
                  value={requiredHashtags}
                  onChange={(e) => onRequiredHashtagsChange(e.target.value)}
                  rows={2}
                  className={cn(
                    "h-auto min-h-[3rem] max-h-24 resize-y py-1.5 text-sm leading-snug",
                    step1Input,
                  )}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-medium text-foreground">
                  Required links/mentions in bio
                </Label>
                <Textarea
                  placeholder="@yourbrand https://yoursite.com"
                  value={requiredBioMentions}
                  onChange={(e) => onRequiredBioMentionsChange(e.target.value)}
                  rows={2}
                  className={cn(
                    "h-auto min-h-[3rem] max-h-24 resize-y py-1.5 text-sm leading-snug",
                    step1Input,
                  )}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-medium text-foreground">
                  Required links/mentions in caption
                </Label>
                <Textarea
                  placeholder="@partner https://link.com"
                  value={requiredCaptionMentions}
                  onChange={(e) => onRequiredCaptionMentionsChange(e.target.value)}
                  rows={2}
                  className={cn(
                    "h-auto min-h-[3rem] max-h-24 resize-y py-1.5 text-sm leading-snug",
                    step1Input,
                  )}
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            {PRESETS.map((p) => {
              const Icon = p.icon;
              const on = selectedPresets.has(p.id);

              if (p.id === "specific_sound") {
                return (
                  <div
                    key={p.id}
                    className={cn(
                      "overflow-hidden rounded-xl border transition-colors",
                      on
                        ? "border-primary bg-primary/10 shadow-[inset_0_0_0_1px_hsl(var(--primary)/0.35)]"
                        : "border-border bg-secondary/30",
                    )}
                  >
                    <button
                      type="button"
                      onClick={() => onTogglePreset(p.id)}
                      aria-expanded={on}
                      className={cn(
                        "flex w-full items-start gap-3 p-3 text-left transition-colors",
                        !on && "hover:border-primary/40",
                      )}
                    >
                      <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-background/80 text-primary">
                        <Icon className="h-4 w-4" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-medium text-foreground">{p.title}</span>
                        <span className="mt-0.5 block text-xs text-muted-foreground">{p.hint}</span>
                      </span>
                      {on ? (
                        <ChevronUp
                          className="mt-1 h-4 w-4 shrink-0 text-muted-foreground"
                          aria-hidden
                        />
                      ) : (
                        <ChevronDown
                          className="mt-1 h-4 w-4 shrink-0 text-muted-foreground"
                          aria-hidden
                        />
                      )}
                    </button>
                    {on ? (
                      <div className="border-t border-primary/25 bg-secondary/20 p-3 pt-3">
                        <div className="relative">
                          <Link2 className="pointer-events-none absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                          <Input
                            type="url"
                            inputMode="url"
                            autoComplete="url"
                            placeholder="https://www.tiktok.com/music/..."
                            value={requiredMusicUrl}
                            onChange={(e) => onRequiredMusicUrlChange(e.target.value)}
                            className={cn("pl-9", step1Input)}
                            aria-label="Sound or music link"
                          />
                        </div>
                      </div>
                    ) : null}
                  </div>
                );
              }

              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => onTogglePreset(p.id)}
                  className={cn(
                    "flex w-full items-start gap-3 rounded-xl border p-3 text-left transition-colors",
                    on
                      ? "border-primary bg-primary/10 shadow-[inset_0_0_0_1px_hsl(var(--primary)/0.35)]"
                      : "border-border bg-secondary/30 hover:border-primary/40",
                  )}
                >
                  <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-background/80 text-primary">
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium text-foreground">{p.title}</span>
                    <span className="mt-0.5 block text-xs text-muted-foreground">{p.hint}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
