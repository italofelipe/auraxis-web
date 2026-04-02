import type { Component } from "vue";

/**
 * A single navigation item in the UiToolsShell sidebar.
 */
export interface ToolsNavItem {
  /** Unique identifier for the item. */
  key: string;
  /** Display label shown in the sidebar (hidden when collapsed). */
  label: string;
  /** Target route path (NuxtLink `to` prop). */
  to: string;
  /** Optional icon component (e.g. from lucide-vue-next). */
  icon?: Component;
}

/**
 * Props for UiToolsShell.
 */
export interface UiToolsShellProps {
  /**
   * Navigation items rendered in the sidebar.
   * When omitted, the nav section is empty.
   */
  navItems?: ToolsNavItem[];
}
