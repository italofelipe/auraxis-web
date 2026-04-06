import { darkTheme, type GlobalTheme } from "naive-ui";
import type { ComputedRef, Ref } from "vue";

const STORAGE_KEY = "auraxis-theme";

/**
 * Global reactive theme state shared across the entire app.
 * Initialised once at module level so all composable calls share the same ref.
 */
const isDark = ref<boolean>(true);

let _initialised = false;

/**
 * Composable for toggling between dark and light themes.
 *
 * - Reads the user preference from `localStorage` on first call.
 * - Defaults to `dark` when no preference is stored.
 * - Persists the selection to `localStorage` on every toggle.
 *
 * Usage in `app.vue`:
 * ```ts
 * const { naiveTheme } = useTheme()
 * // <NConfigProvider :theme="naiveTheme" ...>
 * ```
 *
 * Usage in a toggle button:
 * ```ts
 * const { isDark, toggle } = useTheme()
 * ```
 *
 * @returns Reactive theme state and toggle function.
 */
export function useTheme(): {
  isDark: Ref<boolean>;
  toggle: () => void;
  naiveTheme: ComputedRef<GlobalTheme | null>;
} {
  if (!_initialised && typeof localStorage !== "undefined") {
    _initialised = true;
    const stored = localStorage.getItem(STORAGE_KEY);
    // Default to dark; only switch to light if explicitly stored
    isDark.value = stored !== "light";
  }

  /**
   * Toggles between dark and light and persists the choice.
   * @returns void
   */
  function toggle(): void {
    isDark.value = !isDark.value;
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(STORAGE_KEY, isDark.value ? "dark" : "light");
    }
  }

  /** The Naive UI theme object to pass to `NConfigProvider`. */
  const naiveTheme = computed(() => (isDark.value ? darkTheme : null));

  return { isDark, toggle, naiveTheme };
}
