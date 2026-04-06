import { darkTheme, type GlobalTheme } from "naive-ui";
import type { ComputedRef, Ref } from "vue";

const STORAGE_KEY = "auraxis-theme";

/**
 * Composable for toggling between dark and light themes.
 *
 * Uses Nuxt's `useState` so the reactive value is isolated per SSR request on
 * the server and shared (hydrated) on the client.  localStorage is only read
 * inside `onMounted`, which never runs during SSR, eliminating the module-level
 * singleton problem that caused `/` to return 500 during Nitro prerender.
 *
 * - Defaults to `dark` when no preference is stored.
 * - Reads the user preference from `localStorage` after hydration.
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
  // useState creates per-request state on the server and shared state on the
  // client (after hydration), replacing the unsafe module-level ref singleton.
  const isDark = useState<boolean>("auraxis-theme", () => true);

  // Only access localStorage on the client, after the component has mounted.
  onMounted(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    // Default to dark; only switch to light if explicitly stored
    isDark.value = stored !== "light";
  });

  /**
   * Toggles between dark and light and persists the choice.
   * @returns void
   */
  function toggle(): void {
    isDark.value = !isDark.value;
    if (import.meta.client) {
      localStorage.setItem(STORAGE_KEY, isDark.value ? "dark" : "light");
    }
  }

  /** The Naive UI theme object to pass to `NConfigProvider`. */
  const naiveTheme = computed(() => (isDark.value ? darkTheme : null));

  return { isDark, toggle, naiveTheme };
}
