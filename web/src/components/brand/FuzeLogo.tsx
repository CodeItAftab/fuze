import React from "react";
import Image from "next/image";

export interface FuzeLogoProps {
  /**
   * full: Horizontal logo with icon and wordmark
   * icon: Just the multi-cloud bolt ring icon
   * stacked: Vertical icon with wordmark below
   */
  variant?: "full" | "icon" | "stacked";
  /**
   * light: For display on light backgrounds (slate/ink text)
   * dark: For display on dark backgrounds (white/mist text)
   */
  theme?: "light" | "dark";
  className?: string;
  style?: React.CSSProperties;
  alt?: string;
  height?: number;
  width?: number;
}

export function FuzeLogo({
  variant = "full",
  theme = "light",
  className = "",
  style,
  alt = "Fuze Drive",
  height,
  width,
}: FuzeLogoProps) {
  if (variant === "icon") {
    // 1:1 Aspect ratio (512x512)
    const h = height || (width ? width : 24);
    const w = width || h;
    return (
      <Image
        src="/brand/svg/fuze-icon.svg"
        alt={alt}
        width={w}
        height={h}
        style={{
          width: `${w}px`,
          height: `${h}px`,
          maxWidth: `${w}px`,
          maxHeight: `${h}px`,
          ...style,
        }}
        className={`block shrink-0 select-none object-contain ${className}`}
        priority
        unoptimized
      />
    );
  }

  if (variant === "stacked") {
    const src =
      theme === "dark"
        ? "/brand/svg/fuze-logo-stacked-for-dark-bg.svg"
        : "/brand/svg/fuze-logo-stacked-for-light-bg.svg";
    // viewBox 240 x 360 (ratio 2/3)
    const h = height || (width ? Math.round((width * 3) / 2) : 48);
    const w = width || Math.round((h * 2) / 3);
    return (
      <Image
        src={src}
        alt={alt}
        width={w}
        height={h}
        style={{
          width: `${w}px`,
          height: `${h}px`,
          maxWidth: `${w}px`,
          maxHeight: `${h}px`,
          ...style,
        }}
        className={`block shrink-0 select-none object-contain ${className}`}
        priority
        unoptimized
      />
    );
  }

  // Horizontal Full Logo (Default)
  const src =
    theme === "dark"
      ? "/brand/svg/fuze-logo-horizontal-for-dark-bg.svg"
      : "/brand/svg/fuze-logo-horizontal-for-light-bg.svg";
  // viewBox 570 x 120 (ratio ~ 4.75)
  const h = height || (width ? Math.round(width / 4.75) : 26);
  const w = width || Math.round(h * 4.75);

  return (
    <Image
      src={src}
      alt={alt}
      width={w}
      height={h}
      style={{
        width: `${w}px`,
        height: `${h}px`,
        maxWidth: `${w}px`,
        maxHeight: `${h}px`,
        ...style,
      }}
      className={`block shrink-0 select-none object-contain ${className}`}
      priority
      unoptimized
    />
  );
}
