import { ref, readonly, onMounted, onUnmounted } from "vue";
import type { UseResponsiveShellReturn } from "./useResponsiveShell.types";

const MOBILE_BREAKPOINT = 768;

/**
 * Manages the responsive behavior of the authenticated shell.
 * - On desktop: fixed sidebar, no drawer.
 * - On mobile: sidebar becomes a drawer (overlay).
 * @returns Object with isMobile, isDrawerOpen, openDrawer, closeDrawer and toggleDrawer.
 */
export function useResponsiveShell(): UseResponsiveShellReturn {
  const isMobile = ref(false);
  const isDrawerOpen = ref(false);

  /**
   * Verifica se o viewport é mobile e atualiza os estados.
   * @returns void
   */
  function checkMobile(): void {
    const mobile = window.innerWidth < MOBILE_BREAKPOINT;
    isMobile.value = mobile;
    if (!mobile) {
      isDrawerOpen.value = false;
    }
  }

  onMounted(() => {
    checkMobile();
    window.addEventListener("resize", checkMobile);
  });

  onUnmounted(() => {
    window.removeEventListener("resize", checkMobile);
  });

  return {
    isMobile: readonly(isMobile),
    isDrawerOpen: readonly(isDrawerOpen),
    openDrawer: (): void => { isDrawerOpen.value = true; },
    closeDrawer: (): void => { isDrawerOpen.value = false; },
    toggleDrawer: (): void => { isDrawerOpen.value = !isDrawerOpen.value; },
  };
}
