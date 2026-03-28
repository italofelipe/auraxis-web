import { defineStore } from "pinia";

interface UiState {
  /** Whether the global full-page loading overlay is visible. */
  isPageLoading: boolean;
  /** Whether the mobile navigation drawer is open. */
  isMobileMenuOpen: boolean;
}

/**
 * Store for global UI state that is not tied to a specific feature.
 *
 * Covers full-page loading overlays and mobile navigation drawer visibility.
 * Per-component loading states should remain local (useQuery isLoading, etc.).
 */
export const useUiStore = defineStore("ui", {
  state: (): UiState => ({
    isPageLoading: false,
    isMobileMenuOpen: false,
  }),

  actions: {
    /**
     * Sets the global page-loading overlay state.
     * @param value - true to show the overlay, false to hide it.
     */
    setPageLoading(value: boolean): void {
      this.isPageLoading = value;
    },

    /** Opens the mobile navigation drawer. */
    openMobileMenu(): void {
      this.isMobileMenuOpen = true;
    },

    /** Closes the mobile navigation drawer. */
    closeMobileMenu(): void {
      this.isMobileMenuOpen = false;
    },

    /** Toggles the mobile navigation drawer open/closed. */
    toggleMobileMenu(): void {
      this.isMobileMenuOpen = !this.isMobileMenuOpen;
    },
  },
});
