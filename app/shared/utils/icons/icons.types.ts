import type { LucideIcon } from "lucide-vue-next";

/** Nomes canônicos dos ícones usados no Auraxis */
export type AuraxisIconName =
  | "dashboard"
  | "wallet"
  | "goals"
  | "tools"
  | "transactions"
  | "analytics"
  | "settings"
  | "logout"
  | "user"
  | "notifications"
  | "plus"
  | "minus"
  | "search"
  | "close"
  | "chevronRight"
  | "chevronDown"
  | "trendingUp"
  | "trendingDown"
  | "eye"
  | "eyeOff"
  | "check"
  | "warning"
  | "info"
  | "upload"
  | "download"
  | "filter"
  | "calendar"
  | "menu"

export type IconMap = Record<AuraxisIconName, LucideIcon>
