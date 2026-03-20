export interface UiUserMenuProps {
  /** Nome do usuário */
  name: string
  /** Descrição/perfil — ex: "Investidor Arrojado" */
  description?: string
  /** URL do avatar. Se ausente, exibe inicial do nome */
  avatarUrl?: string
}

export type UiUserMenuEmits = {
  settings: []
  logout: []
}
