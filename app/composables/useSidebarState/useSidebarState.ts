import { ref, readonly } from "vue";
import type { UseSidebarStateReturn } from "./useSidebarState.types";

const STORAGE_KEY = "auraxis:sidebar:collapsed";

/**
 * Manages the collapsed/expanded state of the main sidebar.
 * State is persisted in localStorage and shared across instances.
 *
 * Session singleton: uses a module-level variable to share state
 * without requiring a global store.
 */
const isCollapsed = ref<boolean>(
  typeof window !== "undefined"
    ? localStorage.getItem(STORAGE_KEY) === "true"
    : false,
);

/**
 * Persists the state to localStorage and updates the ref.
 * @param value - New value for isCollapsed.
 * @returns void
 */
function persist(value: boolean): void {
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY, String(value));
  }
  isCollapsed.value = value;
}

/**
 * Composable that exposes the collapsed/expanded state of the sidebar.
 * @returns Object with isCollapsed, toggle, collapse and expand.
 */
export function useSidebarState(): UseSidebarStateReturn {
  return {
    isCollapsed: readonly(isCollapsed),
    toggle: (): void => persist(!isCollapsed.value),
    collapse: (): void => persist(true),
    expand: (): void => persist(false),
  };
}
