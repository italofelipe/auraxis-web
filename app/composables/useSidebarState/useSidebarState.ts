import { ref, readonly } from "vue";
import type { UseSidebarStateReturn } from "./useSidebarState.types";

const STORAGE_KEY = "auraxis:sidebar:collapsed";

/**
 * Gerencia o estado collapsed/expanded do sidebar principal.
 * Estado é persistido em localStorage e compartilhado entre instâncias.
 *
 * Singleton por sessão: usa variável de módulo para compartilhar estado
 * sem precisar de store global.
 */
const isCollapsed = ref<boolean>(
  typeof window !== "undefined"
    ? localStorage.getItem(STORAGE_KEY) === "true"
    : false,
);

/**
 * Persiste o estado no localStorage e atualiza o ref.
 * @param value - Novo valor para isCollapsed.
 * @returns void
 */
function persist(value: boolean): void {
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY, String(value));
  }
  isCollapsed.value = value;
}

/**
 * Composable que expõe o estado collapsed/expanded do sidebar.
 * @returns Objeto com isCollapsed, toggle, collapse e expand.
 */
export function useSidebarState(): UseSidebarStateReturn {
  return {
    isCollapsed: readonly(isCollapsed),
    toggle: (): void => persist(!isCollapsed.value),
    collapse: (): void => persist(true),
    expand: (): void => persist(false),
  };
}
