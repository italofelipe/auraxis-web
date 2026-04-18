export const shadows = {
  sm:          "0 1px 2px rgba(0, 0, 0, 0.3)",
  md:          "0 4px 10px rgba(0, 0, 0, 0.35)",
  lg:          "0 14px 34px rgba(0, 0, 0, 0.35)",
  card:        "0 10px 24px rgba(0, 0, 0, 0.15)",
  brandGlow:   "0 18px 44px rgba(68, 212, 255, 0.24)",
  brandGlowSm: "0 0 10px rgba(68, 212, 255, 0.2)",
} as const;

export type Shadows = typeof shadows;
