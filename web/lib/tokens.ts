/**
 * MathBounty Design Tokens
 *
 * Single source of truth for all reusable visual values.
 * AI coding agents: always import from here — never hardcode colors or spacing.
 */

// ------------------------------------------------------------------
// Color Palette (Brutalist Hex)
// ------------------------------------------------------------------

export const colors = {
  // Brand
  brand: "#ff3b00",
  brandDim: "#cc2f00",
  brandGlow: "rgba(255, 59, 0, 0.3)",

  // Semantic
  success: "#00c853",
  successDim: "#00a344",
  error: "#ff1744",
  errorDim: "#d50000",

  // Surfaces (dark mode default)
  surface: "#0a0a0a",
  surfaceRaised: "#111111",
  surfaceSunken: "#050505",

  // Text
  ink: "#f0f0f0",
  inkMuted: "#888888",
  inkFaint: "#555555",

  // Borders
  border: "#222222",
  borderStrong: "#333333",
  borderBrutal: "#f0f0f0",
} as const;

// Tailwind utility class references for copy-paste
export const colorClasses = {
  brand: "text-brand",
  brandBg: "bg-brand",
  brandBorder: "border-brand",
  success: "text-success",
  successBg: "bg-success",
  error: "text-error",
  errorBg: "bg-error",
  surface: "bg-surface",
  surfaceRaised: "bg-surface-raised",
  ink: "text-ink",
  inkMuted: "text-ink-muted",
  border: "border-border",
} as const;

// ------------------------------------------------------------------
// Bounty Status Colors
// ------------------------------------------------------------------

export const bountyStatus = {
  Open: {
    label: "Open",
    textColor: "text-success",
    bgColor: "bg-success-dim",
    borderColor: "border-success",
    hex: colors.success,
    description: "Bounty is live and accepting claims",
  },
  Claimed: {
    label: "Claimed",
    textColor: "text-brand",
    bgColor: "bg-brand-dim",
    borderColor: "border-brand",
    hex: colors.brand,
    description: "A solver has claimed this bounty and is working on it",
  },
  Paid: {
    label: "Paid",
    textColor: "text-success",
    bgColor: "bg-success-dim",
    borderColor: "border-success",
    hex: colors.success,
    description: "Bounty has been successfully paid out",
  },
  Expired: {
    label: "Expired",
    textColor: "text-ink-muted",
    bgColor: "bg-surface-sunken",
    borderColor: "border-border",
    hex: colors.inkMuted,
    description: "Deadline passed with no successful claim",
  },
} as const;

export type BountyStatus = keyof typeof bountyStatus;

// ------------------------------------------------------------------
// Spacing Scale (4px base)
// ------------------------------------------------------------------

export const spacing = {
  1: "4px",
  2: "8px",
  3: "12px",
  4: "16px",
  6: "24px",
  8: "32px",
  12: "48px",
  16: "64px",
  24: "96px",
} as const;

export const space = {
  xs: "4px",
  sm: "8px",
  md: "12px",
  lg: "16px",
  xl: "24px",
  "2xl": "32px",
  "3xl": "48px",
  "4xl": "64px",
  "5xl": "96px",
} as const;

// Tailwind spacing utility references
export const spaceClasses = {
  xs: "p-1",
  sm: "p-2",
  md: "p-3",
  lg: "p-4",
  xl: "p-6",
  "2xl": "p-8",
  "3xl": "p-12",
  "4xl": "p-16",
} as const;

// ------------------------------------------------------------------
// Typography Scale
// ------------------------------------------------------------------

export const typography = {
  // Display — Bebas Neue, condensed all-caps architectural presence
  display: {
    family: "var(--font-display), 'Arial Narrow', Impact, sans-serif",
    weights: {
      normal: 400,
    },
  },

  // Body — DM Sans, clean geometric sans for reading
  body: {
    family: "var(--font-body), system-ui, sans-serif",
    weights: {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
  },

  // Mono — JetBrains Mono, technical monospace for code
  mono: {
    family: 'var(--font-mono), "Courier New", monospace',
    weights: {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
  },

  // Fixed rem scale for app UI (no fluid sizing in product)
  sizes: {
    xs: "0.75rem",    // 12px
    sm: "0.875rem",   // 14px
    base: "1rem",     // 16px
    lg: "1.125rem",   // 18px
    xl: "1.25rem",    // 20px
    "2xl": "1.5rem",  // 24px
    "3xl": "1.875rem",// 30px
    "4xl": "2.25rem", // 36px
    "5xl": "3rem",    // 48px
    "6xl": "4rem",    // 64px
    "7xl": "6rem",    // 96px
  },
} as const;

// Tailwind text size utility references
export const textSizeClasses = {
  xs: "text-xs",
  sm: "text-sm",
  base: "text-base",
  lg: "text-lg",
  xl: "text-xl",
  "2xl": "text-2xl",
  "3xl": "text-3xl",
  "4xl": "text-4xl",
  "5xl": "text-5xl",
  "6xl": "text-6xl",
  "7xl": "text-7xl",
} as const;

// ------------------------------------------------------------------
// Border Radius (Brutalist — Zero)
// ------------------------------------------------------------------

export const radius = {
  sm: "0px",
  md: "0px",
  lg: "0px",
  full: "0px",
} as const;

export const radiusClasses = {
  sm: "rounded-none",
  md: "rounded-none",
  lg: "rounded-none",
  full: "rounded-none",
} as const;

// ------------------------------------------------------------------
// Shadows (Harsh, not soft)
// ------------------------------------------------------------------

export const shadows = {
  sm: "2px 2px 0 0 rgb(0 0 0 / 1)",
  md: "4px 4px 0 0 rgb(0 0 0 / 1)",
  lg: "8px 8px 0 0 rgb(0 0 0 / 1)",
} as const;

// ------------------------------------------------------------------
// Animation Tokens
// ------------------------------------------------------------------

export const animation = {
  duration: {
    fast: "150ms",
    normal: "250ms",
    slow: "400ms",
  },
  easing: {
    easeOut: "cubic-bezier(0.25, 0.46, 0.45, 0.94)",
    easeOutExpo: "cubic-bezier(0.19, 1, 0.22, 1)",
    easeOutQuart: "cubic-bezier(0.165, 0.84, 0.44, 1)",
  },
} as const;
