import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";

interface CampaignFiltersModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApply: (filters: FilterValues) => void;
  currentFilters: FilterValues;
}

export interface FilterValues {
  platforms: string[];
  minRate: number;
  maxRate: number;
  minViews: number;
}

const platformOptions = [
  { id: "tiktok", label: "TikTok", icon: "📱" },
  { id: "instagram", label: "Instagram", icon: "📸" },
  { id: "youtube", label: "YouTube", icon: "▶️" },
];

export function CampaignFiltersModal({
  open,
  onOpenChange,
  onApply,
  currentFilters,
}: CampaignFiltersModalProps) {
  const [filters, setFilters] = useState<FilterValues>(currentFilters);

  const handlePlatformToggle = (platform: string) => {
    setFilters((prev) => ({
      ...prev,
      platforms: prev.platforms.includes(platform)
        ? prev.platforms.filter((p) => p !== platform)
        : [...prev.platforms, platform],
    }));
  };

  const handleApply = () => {
    onApply(filters);
    onOpenChange(false);
  };

  const handleReset = () => {
    const defaultFilters: FilterValues = {
      platforms: [],
      minRate: 0,
      maxRate: 500,
      minViews: 0,
    };
    setFilters(defaultFilters);
    onApply(defaultFilters);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Filter Campaigns</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Platforms */}
          <div className="space-y-3">
            <Label>Platforms</Label>
            <div className="flex flex-wrap gap-2">
              {platformOptions.map((platform) => (
                <button
                  key={platform.id}
                  onClick={() => handlePlatformToggle(platform.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    filters.platforms.includes(platform.id)
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <span>{platform.icon}</span>
                  {platform.label}
                </button>
              ))}
            </div>
          </div>

          {/* Rate Range */}
          <div className="space-y-3">
            <div className="flex justify-between">
              <Label>Rate per 100K views</Label>
              <span className="text-sm text-muted-foreground">
                ${filters.minRate} - ${filters.maxRate}
              </span>
            </div>
            <Slider
              value={[filters.minRate, filters.maxRate]}
              min={0}
              max={500}
              step={10}
              onValueChange={([min, max]) =>
                setFilters({ ...filters, minRate: min, maxRate: max })
              }
              className="w-full"
            />
          </div>

          {/* Min Views */}
          <div className="space-y-3">
            <div className="flex justify-between">
              <Label>Minimum Views Required</Label>
              <span className="text-sm text-muted-foreground">
                {filters.minViews >= 1000
                  ? (filters.minViews / 1000).toFixed(0) + "K"
                  : filters.minViews}
              </span>
            </div>
            <Slider
              value={[filters.minViews]}
              min={0}
              max={100000}
              step={1000}
              onValueChange={([value]) => setFilters({ ...filters, minViews: value })}
              className="w-full"
            />
          </div>
        </div>

        <div className="flex gap-3">
          <Button variant="outline" onClick={handleReset} className="flex-1">
            Reset
          </Button>
          <Button onClick={handleApply} className="flex-1 bg-gradient-primary">
            Apply Filters
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
