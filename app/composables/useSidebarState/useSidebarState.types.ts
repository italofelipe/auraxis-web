import type { Ref } from "vue";

export interface SidebarState {
  isCollapsed: boolean
}

export interface UseSidebarStateReturn {
  isCollapsed: Readonly<Ref<boolean>>
  toggle: () => void
  collapse: () => void
  expand: () => void
}
