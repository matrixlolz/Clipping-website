import Image from "next/image";
import { Trophy, Eye, DollarSign } from "lucide-react";
import { useCampaignLeaderboard, LeaderboardEntry } from "@/hooks/useLeaderboard";
import { Skeleton } from "@/components/ui/skeleton";

interface CampaignLeaderboardProps {
  campaignId: string;
}

export function CampaignLeaderboard({ campaignId }: CampaignLeaderboardProps) {
  const { data: leaderboard, isLoading } = useCampaignLeaderboard(campaignId);

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
    if (num >= 1000) return (num / 1000).toFixed(1) + "K";
    return num.toString();
  };

  const getRankStyle = (rank: number) => {
    switch (rank) {
      case 1:
        return "bg-yellow-500/20 border-yellow-500/30 text-yellow-400";
      case 2:
        return "bg-gray-400/20 border-gray-400/30 text-gray-300";
      case 3:
        return "bg-amber-700/20 border-amber-700/30 text-amber-600";
      default:
        return "bg-secondary/50 border-border text-muted-foreground";
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array(5).fill(0).map((_, i) => (
          <Skeleton key={i} className="h-16" />
        ))}
      </div>
    );
  }

  if (!leaderboard || leaderboard.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Trophy className="h-10 w-10 mx-auto mb-2 opacity-50" />
        <p>No participants yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {leaderboard.slice(0, 10).map((entry) => (
        <div
          key={entry.creator_id}
          className={`flex items-center gap-4 p-4 rounded-lg border ${getRankStyle(entry.rank)}`}
        >
          {/* Rank */}
          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
            entry.rank <= 3 ? "bg-current/20" : "bg-secondary"
          }`}>
            {entry.rank <= 3 ? (
              <Trophy className="h-4 w-4" />
            ) : (
              entry.rank
            )}
          </div>

          {/* Avatar & Name */}
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="relative w-10 h-10 rounded-full bg-gradient-primary flex items-center justify-center text-sm font-bold text-primary-foreground overflow-hidden">
              {entry.avatar_url ? (
                <Image src={entry.avatar_url} alt="" fill className="object-cover" sizes="40px" unoptimized />
              ) : (
                entry.full_name?.charAt(0) || "?"
              )}
            </div>
            <div className="min-w-0">
              <p className="font-medium truncate">
                {entry.full_name || "Anonymous"}
              </p>
              <p className="text-xs text-muted-foreground">
                {entry.submission_count} clip{entry.submission_count !== 1 ? "s" : ""}
              </p>
            </div>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-6 text-sm">
            <div className="flex items-center gap-1.5">
              <Eye className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{formatNumber(entry.total_views)}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <DollarSign className="h-4 w-4 text-primary" />
              <span className="font-medium text-primary">${entry.total_earnings.toFixed(2)}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
