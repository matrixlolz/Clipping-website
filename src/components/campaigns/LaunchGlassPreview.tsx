"use client";

import { useMemo, useState } from "react";
import { ImageIcon, MoreVertical, Eye } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { LaunchPreviewSparkles } from "@/components/campaigns/LaunchPreviewSparkles";
import { getCategoryLabel } from "@/lib/campaign-taxonomy";
import type { ReactNode } from "react";

type PlatformType = "tiktok" | "instagram" | "youtube" | "twitter";

/** Ported from UIUX/folder glass ui DefaultProject + hooks (imagePositions). */
const EASE_OUT_EXPO = [0.16, 1, 0.3, 1] as const;
const TRANSITION_DURATION = 0.3;
const TRANSITION_EASE = EASE_OUT_EXPO;

export interface LaunchGlassPreviewProps {
  /** Up to 5 URLs; fan uses cycling like DefaultProject `images`. */
  thumbnailUrls: string[];
  name: string;
  description: string;
  platforms: PlatformType[];
  niche: string;
  contentType: string;
  authorName: string;
  rateValue: string;
  rateUnit: string;
  minViews: string;
  totalBudget: string;
  platformIcons: Record<string, ReactNode>;
  /**
   * Controls the frosted subline under the title.
   * 1 = type · category only (no description). 2 = selected platforms + type · category. 3+ = description + platforms + meta.
   */
  launchStep: 1 | 2 | 3 | 4 | 5;
}

interface ImagePosition {
  x: number;
  rotate: number;
}

function useImagePositions(count: number): ImagePosition[] {
  return useMemo(() => {
    const positions: ImagePosition[] = [];
    const totalSpread =
      count <= 1 ? 0 : count === 2 ? 72 : Math.min(160, 60 + count * 28);
    const step = count > 1 ? totalSpread / (count - 1) : 0;
    const startX = -totalSpread / 2;
    const rotateFactor = count === 2 ? 4 : 10;

    for (let i = 0; i < count; i++) {
      const x = count > 1 ? startX + step * i : 0;
      const normalizedPos = count > 1 ? (i / (count - 1)) * 2 - 1 : 0;
      const rotate = normalizedPos * rotateFactor;
      positions.push({ x, rotate });
    }
    return positions;
  }, [count]);
}

function formatPreviewStamp(d: Date) {
  const date = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  const time = d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  return `${date} · ${time}`;
}

/**
 * Faithful port of folder glass ui `DefaultProject`: 3D back slab + counter-rotated image stack,
 * spring hover (rotateX 15° / -15° / front -25°), per-card spring choreography, motion.img filters,
 * frosted front panel with blur(16px). Sparkles use `live` variant (same SVG + float-sparkle).
 */
export function LaunchGlassPreview({
  thumbnailUrls,
  name,
  description,
  platforms,
  niche,
  contentType,
  authorName: _authorName,
  rateValue: _rv,
  rateUnit: _ru,
  minViews,
  totalBudget: _tb,
  platformIcons,
  launchStep,
}: LaunchGlassPreviewProps) {
  void _authorName;
  void _rv;
  void _ru;
  void _tb;

  const [isHovered, setIsHovered] = useState(false);
  const reduceMotion = useReducedMotion();

  const isCompact = false;
  const isActive = isHovered;
  const shouldShowImages = true;

  const displayName = name.trim() || "Your campaign title";
  const metaLine = [contentType, niche ? getCategoryLabel(niche) : null].filter(Boolean).join(" · ");
  const viewsCount = Math.max(0, parseInt(minViews || "0", 10) || 0);
  const viewsLabel = `${viewsCount.toLocaleString()} views`;

  const urls = thumbnailUrls.filter(Boolean);
  const renderCount = urls.length > 0 ? urls.length : 5;
  const isSingle = renderCount === 1;
  const isPair = renderCount === 2;
  const imagePositions = useImagePositions(renderCount);

  const springBack = reduceMotion
    ? ({ duration: 0 } as const)
    : { type: "spring" as const, stiffness: 200, damping: 25, mass: 0.8 };
  const springInner = reduceMotion
    ? ({ duration: 0 } as const)
    : { type: "spring" as const, stiffness: 200, damping: 25, mass: 0.8 };
  const springCard = reduceMotion
    ? ({ duration: 0 } as const)
    : { type: "spring" as const, stiffness: 100, damping: 16, mass: 1 };
  const springFront = reduceMotion
    ? ({ duration: 0 } as const)
    : { type: "spring" as const, stiffness: 180, damping: 22, mass: 0.8 };

  return (
    <div className="relative w-full max-w-[288px] sm:ml-auto sm:mr-0">
      <div className="mb-3 flex items-center gap-2 text-sm text-muted-foreground">
        <Eye className="h-4 w-4 opacity-80" aria-hidden />
        <span className="font-medium tracking-wide text-foreground/90">Preview</span>
      </div>

      <motion.div
        className={`group relative w-[288px] max-w-full ${"cursor-default"}`}
        style={{
          perspective: "1200px",
          transformStyle: "preserve-3d",
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="relative w-[288px] max-w-full" style={{ perspective: "1200px" }}>
          {/* Back panel — same as DefaultProject */}
          <motion.div
            className="relative z-0 rounded-2xl"
            animate={{
              rotateX: isActive ? 15 : 0,
              backgroundColor: "#1e1e1e",
            }}
            transition={{
              rotateX: springBack,
              backgroundColor: {
                duration: TRANSITION_DURATION,
                ease: TRANSITION_EASE,
              },
            }}
            style={{
              height: "224px",
              border: "1px solid rgba(255, 255, 255, 0.06)",
              transformStyle: "preserve-3d",
              transformOrigin: "center bottom",
            }}
          >
            {/* Ambient sparkles — live variant (no generating pulse), matches kit SVG motion */}
            <div className="opacity-[0.55]">
              <LaunchPreviewSparkles count={14} fading={false} variant="live" />
            </div>

            <motion.div
              className="absolute inset-0"
              animate={{
                rotateX: isActive ? -15 : 0,
              }}
              transition={springInner}
              style={{
                transformStyle: "flat",
                transformOrigin: "center bottom",
              }}
            >
              {[...Array(renderCount)].map((_, imgIndex) => {
                const pos = imagePositions[imgIndex];
                const imageSrc = urls.length > 0 ? urls[imgIndex] || "" : "";
                const centerIndex = (renderCount - 1) / 2;
                const distanceFromCenter = Math.abs(imgIndex - centerIndex);
                const zIndex = 50 - distanceFromCenter * 10;
                const maxDistance = Math.max(1, centerIndex);

                const brightness = 1 - (distanceFromCenter / maxDistance) * (isPair ? 0.22 : 0.45);
                const blurAmount = isPair ? 0 : (distanceFromCenter / maxDistance) * 1.2;
                const yOffset = (isSingle ? -4 : isPair ? -6 : -16) * (1 - distanceFromCenter / maxDistance) || 0;
                const baseCenterScale = isSingle ? 1.04 : isPair ? 1.02 : 1.05;
                const scale = baseCenterScale - (distanceFromCenter / maxDistance) * (isPair ? 0.1 : 0.18);

                const xPos = isCompact ? pos.x * 0.85 : isActive ? pos.x * 1.4 : pos.x;
                const restingY = isSingle ? -34 : isPair ? -28 : 8;
                const hoverY = isSingle ? -40 : isPair ? -34 : -8;
                const yPos = isCompact ? 18 + yOffset : isActive ? hoverY + yOffset : restingY + yOffset;
                const rotation = isCompact ? pos.rotate * 0.8 : isActive ? pos.rotate * 1.3 : pos.rotate;
                const finalScale = isCompact ? scale * 0.98 : isActive ? scale * 1.02 : scale;

                const staggerDelay = distanceFromCenter * 0.08;

                return (
                  <motion.div
                    key={imgIndex}
                    className="absolute left-1/2 top-0"
                    initial={false}
                    animate={{
                      x: `calc(-50% + ${xPos}px)`,
                      y: yPos,
                      rotate: rotation,
                      scale: shouldShowImages ? finalScale : 0.8,
                      opacity: shouldShowImages ? 1 : 0,
                    }}
                    transition={{
                      ...springCard,
                      delay: shouldShowImages ? staggerDelay : 0,
                      opacity: { duration: 0.4, ease: "easeOut", delay: shouldShowImages ? staggerDelay : 0 },
                    }}
                    style={{ zIndex }}
                  >
                    <div
                      className={`relative overflow-hidden rounded-lg bg-[#111] ${
                        isSingle
                          ? "h-[138px] w-[222px]"
                          : isPair
                            ? "h-[132px] w-[168px]"
                            : "h-[160px] w-[100px]"
                      }`}
                    >
                      {imageSrc ? (
                        <>
                          <motion.img
                            src={imageSrc}
                            alt=""
                            className={`absolute inset-0 h-full w-full ${
                              isSingle || isPair ? "object-cover" : "object-cover"
                            }`}
                            animate={{
                              filter: `brightness(${isActive ? Math.min(1, brightness + 0.2) : brightness}) contrast(1.08) saturate(${1 - distanceFromCenter * 0.2}) blur(${isActive ? 0 : blurAmount}px)`,
                            }}
                            transition={{
                              duration: TRANSITION_DURATION,
                              ease: TRANSITION_EASE,
                            }}
                          />
                          <div className="launch-preview-glass-drops pointer-events-none absolute inset-0 rounded-lg" />
                          <div
                            className="pointer-events-none absolute inset-0 rounded-lg opacity-[0.12]"
                            style={{
                              background:
                                "repeating-linear-gradient(90deg, transparent, transparent 2px, rgba(255,255,255,0.04) 2px, rgba(255,255,255,0.04) 4px)",
                            }}
                          />
                        </>
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-zinc-800 to-black">
                          <ImageIcon className="h-8 w-8 text-white/20" />
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          </motion.div>

          {/* Front frosted panel — same springs / blur / border as DefaultProject */}
          <motion.div
            className="absolute bottom-0 left-0 right-0 z-10 overflow-hidden rounded-2xl"
            animate={{
              rotateX: isActive ? -25 : 0,
              backgroundColor: "rgba(26, 26, 26, 0.8)",
            }}
            transition={{
              rotateX: springFront,
              backgroundColor: {
                duration: TRANSITION_DURATION,
                ease: TRANSITION_EASE,
              },
            }}
            style={{
              backdropFilter: "blur(16px)",
              WebkitBackdropFilter: "blur(16px)",
              border: "1px solid rgba(255, 255, 255, 0.06)",
              transformStyle: "preserve-3d",
              transformOrigin: "center bottom",
            }}
          >
            <div className="relative min-h-[2.75rem] px-4 py-3">
              <div className="absolute inset-x-3 -top-px h-px bg-gradient-to-r from-transparent via-white/25 to-transparent" />

              <h3 className="line-clamp-2 text-[15px] font-semibold leading-snug tracking-tight text-white">
                {displayName}
              </h3>
              {launchStep === 1 && metaLine ? (
                <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-white/45">{metaLine}</p>
              ) : null}
              {launchStep === 2 ? (
                <div className="mt-1 space-y-1.5">
                  {platforms.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {platforms.map((pid) => (
                        <span
                          key={pid}
                          title={pid === "twitter" ? "X" : pid}
                          className="inline-flex items-center justify-center rounded-md border border-white/10 bg-white/[0.06] p-1.5"
                        >
                          <span className="flex shrink-0 text-white/90 [&>svg]:h-3.5 [&>svg]:w-3.5">
                            {platformIcons[pid]}
                          </span>
                          <span className="sr-only">{pid === "twitter" ? "X" : pid}</span>
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[11px] text-white/35">Select platforms…</p>
                  )}
                  {metaLine ? (
                    <p className="text-[10px] leading-snug text-white/40">{metaLine}</p>
                  ) : null}
                </div>
              ) : null}
              {launchStep >= 3 ? (
                <div className="mt-1 space-y-1.5">
                  {description.trim() ? (
                    <p className="line-clamp-2 text-xs leading-relaxed text-white/50">{description.trim()}</p>
                  ) : null}
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    {platforms.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {platforms.map((pid) => (
                          <span
                            key={pid}
                            title={pid === "twitter" ? "X" : pid}
                            className="inline-flex items-center justify-center rounded-md border border-white/10 bg-white/[0.04] p-1.5"
                          >
                            <span className="flex shrink-0 text-white/80 [&>svg]:h-3.5 [&>svg]:w-3.5">
                              {platformIcons[pid]}
                            </span>
                            <span className="sr-only">{pid === "twitter" ? "X" : pid}</span>
                          </span>
                        ))}
                      </div>
                    ) : null}
                    {metaLine ? (
                      <span className="text-[10px] text-white/40">{metaLine}</span>
                    ) : null}
                  </div>
                </div>
              ) : null}

              <div className="mt-3 grid grid-cols-[1fr_auto_1fr] items-center gap-2 border-t border-white/[0.06] pt-3 text-[11px] text-white/45 sm:text-[12px]">
                <span className="tabular-nums">{viewsLabel}</span>
                <span className="text-center">{formatPreviewStamp(new Date())}</span>
                <div className="flex justify-end">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-white/40 hover:bg-primary/15 hover:text-primary"
                    aria-label="More"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
