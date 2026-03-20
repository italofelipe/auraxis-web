import type { Component } from "vue";

export interface UiSidebarNavItemProps {
  /** Label do item */
  label: string;
  /** Rota de destino (para NuxtLink) */
  to: string;
  /** Ícone Lucide */
  icon?: Component;
  /** Estado ativo — normalmente derivado da rota atual */
  active?: boolean;
  /** Sidebar colapsado — exibe só ícone */
  collapsed?: boolean;
}
