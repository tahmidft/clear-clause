import * as React from "react";
import { cn } from "@/lib/utils";

export interface BrandIconProps {
  size?: number;
  className?: string;
  /** Accessible label; omit when decorative (parent provides context). */
  title?: string;
}

/**
 * ClearClause brand mark — CC monogram on a contract tile with fold, clause lines,
 * subtle legal shield, and an integrated green “clear” check.
 */
export function BrandIcon({ size = 26, className, title }: BrandIconProps) {
  const uid = React.useId().replace(/:/g, "");
  const bgId = `cc-bg-${uid}`;
  const shineId = `cc-shine-${uid}`;
  const docId = `cc-doc-${uid}`;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("shrink-0", className)}
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
    >
      <defs>
        <linearGradient id={bgId} x1="5" y1="4" x2="27" y2="28" gradientUnits="userSpaceOnUse">
          <stop stopColor="var(--color-blue, #007aff)" />
          <stop offset="1" stopColor="#0051d5" />
        </linearGradient>
        <linearGradient id={shineId} x1="8" y1="5" x2="22" y2="16" gradientUnits="userSpaceOnUse">
          <stop stopColor="#ffffff" stopOpacity="0.42" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
        <linearGradient id={docId} x1="8" y1="7" x2="22" y2="24" gradientUnits="userSpaceOnUse">
          <stop stopColor="#ffffff" stopOpacity="0.2" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0.08" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="7.5" fill={`url(#${bgId})`} />
      <rect x="4" y="3.5" width="24" height="11" rx="5.5" fill={`url(#${shineId})`} />
      {/* Contract sheet with folded corner */}
      <path
        d="M8.25 7.25h10.9a1.1 1.1 0 0 1 1.1 1.1v1.95l3.35-3.35V22.1H9.05a1.05 1.05 0 0 1-1.05-1.05V7.25z"
        fill={`url(#${docId})`}
      />
      <path d="M20.25 10.3l3.35 3.35V10.3h-3.35z" fill="#ffffff" opacity="0.26" />
      {/* Clause lines */}
      <path
        d="M9.5 12.2h7.2M9.5 14.1h6.4M9.5 16h5.2"
        fill="none"
        stroke="#ffffff"
        strokeWidth="0.85"
        strokeLinecap="round"
        opacity="0.22"
      />
      {/* Subtle legal shield hint */}
      <path
        d="M9.2 21.8c1.6 1.35 3.2 1.35 4.8 0 1.6 1.35 3.2 1.35 4.8 0"
        fill="none"
        stroke="#ffffff"
        strokeWidth="0.75"
        strokeLinecap="round"
        opacity="0.14"
      />
      {/* Interlocking C's */}
      <path
        d="M11.35 10.85C9.15 10.85 7.85 12.55 7.85 16s1.3 5.15 3.5 5.15c.75 0 1.35-.12 1.85-.32"
        fill="none"
        stroke="#ffffff"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      <path
        d="M16.55 10.85c-2.2 0-3.5 1.7-3.5 5.15s1.3 5.15 3.5 5.15c.75 0 1.35-.12 1.85-.32"
        fill="none"
        stroke="#ffffff"
        strokeWidth="2.2"
        strokeLinecap="round"
        opacity="0.96"
      />
      {/* Integrated “clear” check — seal on the contract corner */}
      <path
        d="M18.1 17.85c.95.65 1.75 1.95 2.05 3.35l2.75-4.1 1.25 1.05"
        fill="none"
        stroke="var(--color-green, #34c759)"
        strokeWidth="2.15"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="23.85" cy="17.15" r="1.05" fill="var(--color-green, #34c759)" opacity="0.9" />
    </svg>
  );
}

/** @deprecated Use `BrandIcon` — kept for existing imports. */
export const BrandMark = BrandIcon;

export type BrandMarkProps = BrandIconProps;

export interface BrandLogoProps {
  size?: number;
  showWordmark?: boolean;
  wordmarkClassName?: string;
  className?: string;
}

export function BrandLogo({ size = 26, showWordmark = true, wordmarkClassName, className }: BrandLogoProps) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <BrandIcon size={size} />
      {showWordmark ? (
        <span
          className={cn(
            "font-display text-base font-semibold tracking-tight text-[var(--color-label)]",
            wordmarkClassName,
          )}
        >
          ClearClause
        </span>
      ) : null}
    </span>
  );
}
