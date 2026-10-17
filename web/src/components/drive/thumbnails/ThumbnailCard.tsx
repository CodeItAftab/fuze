import React from "react";

export interface ThumbnailCardProps {
  ext: string;
  badgeText?: string;
  badgeColor?: string;
  badgeBorder?: string;
  theme?: "light" | "dark";
  headerIcon?: React.ReactNode;
  headerLeft?: React.ReactNode;
  headerRight?: React.ReactNode;
  footerLabel: string;
  footerColor?: string;
  containerBg?: string;
  containerHoverBg?: string;
  cardBorder?: string;
  cardBg?: string;
  showCornerBadge?: boolean;
  children: React.ReactNode;
}

export function CornerBadge({ ext }: { ext: string }) {
  return (
    <span className="absolute bottom-2 right-2 text-[9px] font-bold uppercase bg-slate-900/75 text-white px-1.5 py-0.5 rounded backdrop-blur-xs select-none shadow-xs pointer-events-none">
      {ext}
    </span>
  );
}

export function ThumbnailCard({
  ext,
  badgeText,
  badgeColor,
  badgeBorder,
  theme = "light",
  headerIcon,
  headerLeft,
  headerRight,
  footerLabel,
  footerColor,
  containerBg,
  containerHoverBg,
  cardBorder,
  cardBg,
  showCornerBadge = true,
  children,
}: ThumbnailCardProps) {
  const isDark = theme === "dark";

  const defaultContainerBg =
    containerBg || (isDark ? "bg-slate-900" : "bg-slate-50/50");
  const defaultContainerHover =
    containerHoverBg ||
    (isDark ? "group-hover:bg-slate-850" : "group-hover:bg-slate-100/80");
  const defaultCardBg = cardBg || (isDark ? "bg-slate-950" : "bg-white");
  const defaultCardBorder =
    cardBorder || (isDark ? "border-slate-800" : "border-slate-200/80");
  const defaultFooterColor =
    footerColor || (isDark ? "text-slate-400" : "text-slate-600");

  return (
    <div
      className={`w-full h-full ${defaultContainerBg} rounded-lg flex items-center justify-center relative overflow-hidden p-3 ${defaultContainerHover} transition`}
    >
      <div
        className={`w-24 h-28 ${defaultCardBg} rounded-lg shadow-2xs border ${defaultCardBorder} flex flex-col items-center justify-between p-2.5 transition-transform duration-300 group-hover:scale-105 group-hover:shadow-xs`}
      >
        {/* Header */}
        <div className="w-full flex items-center justify-between">
          {headerLeft ? headerLeft : headerIcon}
          {headerRight ? (
            headerRight
          ) : (
            <span
              className={`text-[8px] font-bold px-1.5 py-0.2 rounded uppercase ${
                badgeColor ||
                (isDark
                  ? "bg-slate-800 text-slate-300"
                  : "bg-slate-100 text-slate-700")
              } ${badgeBorder || ""}`}
            >
              {badgeText || ext}
            </span>
          )}
        </div>

        {/* Centerpiece Artwork */}
        {children}

        {/* Footer */}
        <div
          className={`w-full pt-1 border-t flex items-center justify-center ${
            isDark ? "border-slate-800/80" : "border-slate-100"
          }`}
        >
          <span
            className={`text-[8px] font-bold uppercase tracking-wide ${defaultFooterColor}`}
          >
            {footerLabel}
          </span>
        </div>
      </div>

      {showCornerBadge && <CornerBadge ext={ext} />}
    </div>
  );
}
