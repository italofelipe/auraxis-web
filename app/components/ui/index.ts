/**
 * Auraxis UI Kit — barrel export.
 *
 * All components are auto-imported by Nuxt (pathPrefix: false) and do not
 * require explicit imports in templates. This file exists for:
 *   - IDE type discovery and IntelliSense in non-Nuxt contexts (Storybook, tests)
 *   - Explicit imports in TypeScript files that need the component type
 *   - Documentation: a single place listing every shared UI component
 *
 * Usage in tests / Storybook:
 *   import { UiEmptyState } from '~/components/ui';
 */

// ── Shell & Navigation ────────────────────────────────────────────────────────
export { default as UiAppShell } from "./UiAppShell/UiAppShell.vue";
export { default as UiSidebarNav } from "./UiSidebarNav/UiSidebarNav.vue";
export { default as UiSidebarNavItem } from "./UiSidebarNavItem/UiSidebarNavItem.vue";
export { default as UiTopbar } from "./UiTopbar/UiTopbar.vue";
export { default as UiUserMenu } from "./UiUserMenu/UiUserMenu.vue";

// ── Layout & Surfaces ─────────────────────────────────────────────────────────
export { default as UiGlassPanel } from "./UiGlassPanel/UiGlassPanel.vue";
export { default as UiSurfaceCard } from "./UiSurfaceCard/UiSurfaceCard.vue";
export { default as UiListPanel } from "./UiListPanel/UiListPanel.vue";
export { default as UiPageHeader } from "./UiPageHeader/UiPageHeader.vue";

// ── Data Display ──────────────────────────────────────────────────────────────
export { default as UiMetricCard } from "./UiMetricCard/UiMetricCard.vue";
export { default as UiTrendBadge } from "./UiTrendBadge/UiTrendBadge.vue";
export { default as UiChartPanel } from "./UiChartPanel/UiChartPanel.vue";
export { default as UiChart } from "./UiChart.vue";

// ── Feedback & States ─────────────────────────────────────────────────────────
export { default as UiEmptyState } from "./UiEmptyState/UiEmptyState.vue";
export { default as UiPageLoader } from "./UiPageLoader/UiPageLoader.vue";
export { default as UiInlineError } from "./UiInlineError/UiInlineError.vue";

// ── Form & Input ──────────────────────────────────────────────────────────────
export { default as UiFormField } from "./UiFormField/UiFormField.vue";
export { default as UiPasswordField } from "./UiPasswordField/UiPasswordField.vue";
export { default as UiSearchField } from "./UiSearchField/UiSearchField.vue";
export { default as UiSegmentedControl } from "./UiSegmentedControl/UiSegmentedControl.vue";
export { default as UiSocialAuthButtons } from "./UiSocialAuthButtons/UiSocialAuthButtons.vue";

// ── Iconography & Decorative ──────────────────────────────────────────────────
export { default as UiIcon } from "./UiIcon/UiIcon.vue";
export { default as UiInfoTooltip } from "./UiInfoTooltip/UiInfoTooltip.vue";
