// MIC-06 — Surface card container
export { UiSurfaceCard } from "./UiSurfaceCard";
export type { UiSurfaceCardProps } from "./UiSurfaceCard";

// MIC-07 — Glass panel with backdrop blur
export { UiGlassPanel } from "./UiGlassPanel";
export type { UiGlassPanelProps } from "./UiGlassPanel";

// MIC-09 — Trend badge for numeric variation
export { UiTrendBadge } from "./UiTrendBadge";
export type { UiTrendBadgeProps, TrendDirection } from "./UiTrendBadge";

// MIC-08 — Metric card (summary card with label, value, trend)
export { UiMetricCard } from "./UiMetricCard";
export type { UiMetricCardProps } from "./UiMetricCard";

// MIC-18 — Empty state display
export { UiEmptyState } from "./UiEmptyState";
export type { UiEmptyStateProps, UiEmptyStateEmits } from "./UiEmptyState";

// MIC-22 — Form field wrapper with label, error and hint
export { UiFormField } from "./UiFormField";
export type { UiFormFieldProps } from "./UiFormField";

// MIC-23 — Password input with show/hide toggle
export { UiPasswordField } from "./UiPasswordField";
export type { UiPasswordFieldProps, UiPasswordFieldEmits } from "./UiPasswordField";

// MIC-16 — Search input with clear button
export { UiSearchField } from "./UiSearchField";
export type { UiSearchFieldProps, UiSearchFieldEmits } from "./UiSearchField";

// MIC-17 — Segmented control for selecting among options
export { UiSegmentedControl } from "./UiSegmentedControl";
export type {
  UiSegmentedControlProps,
  UiSegmentedControlEmits,
  UiSegmentedControlOption,
} from "./UiSegmentedControl";

// MIC-05 — Canonical icon component backed by Lucide
export { UiIcon } from "./UiIcon";
export type { UiIconProps } from "./UiIcon";

// MIC-14 — Sidebar navigation item (single entry)
export { UiSidebarNavItem } from "./UiSidebarNavItem";
export type { UiSidebarNavItemProps } from "./UiSidebarNavItem";

// MIC-14 — Sidebar navigation container
export { UiSidebarNav } from "./UiSidebarNav";
export type { UiSidebarNavProps, SidebarNavItem } from "./UiSidebarNav";

// MIC-10 — Page header with title and optional subtitle
export { UiPageHeader } from "./UiPageHeader";
export type { UiPageHeaderProps } from "./UiPageHeader";

// MIC-15 — User menu dropdown with avatar, name and actions
export { UiUserMenu } from "./UiUserMenu";
export type { UiUserMenuProps, UiUserMenuEmits } from "./UiUserMenu";

// MIC-15 — Topbar container with page header, actions and user menu
export { UiTopbar } from "./UiTopbar";
export type { UiTopbarProps, UiTopbarEmits, UiTopbarAction } from "./UiTopbar";

// MIC-13 — Authenticated layout shell with sidebar, topbar and mobile drawer
export { UiAppShell } from "./UiAppShell";
export type {
  UiAppShellProps,
  UiAppShellEmits,
  AppShellNavItem,
  AppShellUser,
  AppShellAction,
} from "./UiAppShell";

// MIC-24 — Social auth buttons (Google, Apple)
export { UiSocialAuthButtons } from "./UiSocialAuthButtons";
export type { UiSocialAuthButtonsProps, UiSocialAuthButtonsEmits } from "./UiSocialAuthButtons";
