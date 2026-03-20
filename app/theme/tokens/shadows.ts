export const shadows = {
  sm:          "0 1px 2px rgba(11, 9, 9, 0.4)",
  md:          "0 4px 10px rgba(11, 9, 9, 0.5)",
  lg:          "0 10px 20px rgba(11, 9, 9, 0.6)",
  card:        "0 10px 24px rgba(11, 9, 9, 0.08)",
  brandGlow:   "0 0 20px rgba(255, 171, 26, 0.3)",
  brandGlowSm: "0 0 10px rgba(255, 171, 26, 0.2)",
} as const;

export type Shadows = typeof shadows;
