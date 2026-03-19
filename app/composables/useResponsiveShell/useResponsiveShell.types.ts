import type { Ref } from "vue";

export interface UseResponsiveShellReturn {
  /** true quando viewport < 768px */
  isMobile: Readonly<Ref<boolean>>
  /** Controla o drawer lateral em mobile */
  isDrawerOpen: Readonly<Ref<boolean>>
  openDrawer: () => void
  closeDrawer: () => void
  toggleDrawer: () => void
}
