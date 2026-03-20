import { ref } from "vue";
import { defineStore } from "pinia";

const STORAGE_KEY_TOOL_ID = "auraxis_pending_tool_id";
const STORAGE_KEY_RESULT = "auraxis_pending_result";

/**
 * Persists and restores tool context across the unauthenticated → login →
 * authenticated redirect flow so the user lands back on /tools with their
 * previous interaction pre-loaded.
 */
export const useToolContextStore = defineStore("toolContext", () => {
  const pendingToolId = ref<string | null>(null);
  const pendingResult = ref<unknown>(null);

  /**
   * Saves the tool id and result to both reactive state and sessionStorage so
   * the context survives the login redirect.
   * @param toolId  The identifier of the tool that produced the result.
   * @param result  The result payload to restore after login.
   */
  function save(toolId: string, result: unknown): void {
    pendingToolId.value = toolId;
    pendingResult.value = result;

    if (typeof window !== "undefined") {
      sessionStorage.setItem(STORAGE_KEY_TOOL_ID, toolId);
      sessionStorage.setItem(STORAGE_KEY_RESULT, JSON.stringify(result));
    }
  }

  /**
   * Restores pending tool context from sessionStorage into reactive state.
   * Call this after a successful login to re-hydrate the tool session.
   */
  function restore(): void {
    if (typeof window === "undefined") {
      return;
    }

    const toolId = sessionStorage.getItem(STORAGE_KEY_TOOL_ID);
    const rawResult = sessionStorage.getItem(STORAGE_KEY_RESULT);

    if (toolId !== null) {
      pendingToolId.value = toolId;
    }

    if (rawResult !== null) {
      try {
        pendingResult.value = JSON.parse(rawResult) as unknown;
      } catch {
        pendingResult.value = null;
      }
    }
  }

  /**
   * Clears pending tool context from both reactive state and sessionStorage.
   */
  function clear(): void {
    pendingToolId.value = null;
    pendingResult.value = null;

    if (typeof window !== "undefined") {
      sessionStorage.removeItem(STORAGE_KEY_TOOL_ID);
      sessionStorage.removeItem(STORAGE_KEY_RESULT);
    }
  }

  return { pendingToolId, pendingResult, save, restore, clear };
});
