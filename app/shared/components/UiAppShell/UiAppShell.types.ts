import type { Component } from "vue";

export interface AppShellNavItem {
  key: string;
  label: string;
  to: string;
  icon?: Component;
}

export interface AppShellUser {
  name: string;
  description?: string;
  avatarUrl?: string;
}

export interface AppShellAction {
  key: string;
  label: string;
  icon?: Component;
  variant: "positive" | "negative" | "default";
}

export interface UiAppShellProps {
  /** Items de navegação do sidebar */
  navItems: AppShellNavItem[];
  /** Dados do usuário logado */
  user: AppShellUser;
  /** Título da página atual (passado para UiTopbar) */
  pageTitle: string;
  /** Subtítulo da página */
  pageSubtitle?: string;
  /** Ações da topbar */
  topbarActions?: AppShellAction[];
}

export type UiAppShellEmits = {
  "topbar-action": [key: string];
  "user-settings": [];
  "user-logout": [];
};
