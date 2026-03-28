import type { Component } from "vue";

export interface UiTopbarAction {
  key: string
  label: string
  icon?: Component
  variant: "positive" | "negative" | "default"
}

export interface UiTopbarProps {
  title: string
  subtitle?: string
  actions?: UiTopbarAction[]
  /** Dados do usuário para o UiUserMenu */
  userName: string
  userDescription?: string
  userAvatarUrl?: string
  /** Exibir botão de menu mobile */
  showMenuButton?: boolean
}

export type UiTopbarEmits = {
  action: [key: string]
  "user-settings": []
  "user-logout": []
  "menu-toggle": []
}
