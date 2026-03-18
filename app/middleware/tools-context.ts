import { defineNuxtRouteMiddleware } from "#app";
import { useToolContextStore } from "~/stores/toolContext";

/**
 * Restores tool context after a login redirect.
 *
 * When the user is redirected from /tools to /login with
 * `?redirect=/tools&tool=<id>&result=<encoded>` query params and then
 * completes authentication, this middleware reads those params and persists
 * them into the tool context store so the /tools page can restore the
 * previous interaction.
 *
 * Usage: add `definePageMeta({ middleware: ['tools-context'] })` to any page
 * that should react to a returning tools context (e.g., /tools itself).
 */
export default defineNuxtRouteMiddleware((to) => {
  const toolId = to.query.tool as string | undefined;
  const rawResult = to.query.result as string | undefined;

  if (!toolId) {
    return undefined;
  }

  const toolContextStore = useToolContextStore();

  let parsedResult: unknown = null;
  if (rawResult) {
    try {
      parsedResult = JSON.parse(decodeURIComponent(rawResult));
    } catch {
      parsedResult = rawResult;
    }
  }

  toolContextStore.save(toolId, parsedResult);

  return undefined;
});
