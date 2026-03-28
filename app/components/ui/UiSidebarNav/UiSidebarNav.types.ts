import type { Component } from "vue";

export interface SidebarNavItem {
  key: string;
  label: string;
  to: string;
  icon?: Component;
}

export interface UiSidebarNavProps {
  items: SidebarNavItem[];
  collapsed?: boolean;
  /** Rota ativa atual — para comparar com item.to */
  currentRoute?: string;
}
