<script setup lang="ts">
import { computed, ref } from "vue";
import { NButton, NModal } from "naive-ui";
import { useRouter, useRoute } from "#app";
import { useToolsCatalogQuery } from "~/composables/useTools";
import { useSessionStore } from "~/stores/session";
import { useToolContextStore } from "~/stores/toolContext";
import ToolCard from "~/features/tools/components/ToolCard.vue";
import ToolsEmptyState from "~/features/tools/components/ToolsEmptyState.vue";
import type { Tool } from "~/features/tools/model/tools";

// Page is intentionally PUBLIC — no middleware: authenticated
definePageMeta({ middleware: ["tools-context"] });

const toolsCatalogQuery = useToolsCatalogQuery();
const sessionStore = useSessionStore();
const toolContextStore = useToolContextStore();
const router = useRouter();
const route = useRoute();

const showSaveModal = ref(false);

/**
 * The tool id that triggered the current save-result flow.
 * Set when the user clicks "Salvar resultado" on a specific tool.
 */
const activeSaveToolId = ref<string | null>(null);

/**
 * Maps the catalog tools (ToolDefinition[]) to the feature domain model (Tool[]).
 * Falls back to accessLevel 'public' for tools without explicit auth requirements,
 * as the current backend contract does not yet expose requires_auth/requires_premium.
 * @returns Array of domain Tool models ready for display.
 */
const tools = computed<Tool[]>(() => {
  const catalog = toolsCatalogQuery.data.value;
  if (!catalog) {
    return [];
  }
  return catalog.tools.map((t) => ({
    id: t.id,
    name: t.name,
    description: t.description,
    enabled: t.enabled,
    accessLevel: "public" as const,
  }));
});

/**
 * Returns true when the catalog contains at least one tool.
 * @returns True if there are tools to display.
 */
const hasTools = computed<boolean>(() => tools.value.length > 0);

/**
 * Returns the pending tool id restored from context after login, if any.
 * @returns The pending tool id string or null.
 */
const restoredToolId = computed<string | null>(() => {
  const queryTool = route.query.tool as string | undefined;
  return queryTool ?? toolContextStore.pendingToolId;
});

/**
 * Handles tool interaction for a specific tool. If the user is not
 * authenticated, shows a save-result modal prompting them to register
 * or log in, encoding the tool id and a placeholder result in the redirect.
 * @param toolId The id of the tool that produced a result.
 * @param result The tool result to persist across the auth redirect.
 */
const handleToolInteraction = (toolId: string, result: unknown = null): void => {
  sessionStore.restore();
  if (!sessionStore.isAuthenticated) {
    activeSaveToolId.value = toolId;
    toolContextStore.save(toolId, result);
    showSaveModal.value = true;
  }
};

/**
 * Builds the redirect URL with tool context encoded in query params.
 * @param basePath The base path to redirect to after login/register.
 * @returns Full path string with tool and result query params.
 */
const buildRedirectWithContext = (basePath: string): string => {
  const toolId = activeSaveToolId.value;
  const result = toolContextStore.pendingResult;
  if (!toolId) {
    return `${basePath}?redirect=/tools`;
  }
  const encodedResult = result !== null
    ? `&result=${encodeURIComponent(JSON.stringify(result))}`
    : "";
  return `${basePath}?redirect=/tools&tool=${toolId}${encodedResult}`;
};

/** Navigates to the registration page with tool context preserved. */
const goToRegister = (): void => {
  showSaveModal.value = false;
  void router.push(buildRedirectWithContext("/register"));
};

/** Navigates to the login page with tool context preserved. */
const goToLogin = (): void => {
  showSaveModal.value = false;
  void router.push(buildRedirectWithContext("/login"));
};
</script>

<template>
  <UiBaseCard title="Ferramentas">
    <!-- Loading state -->
    <BaseSkeleton v-if="toolsCatalogQuery.isLoading.value" />

    <!-- Error state -->
    <p
      v-else-if="toolsCatalogQuery.isError.value"
      class="tools-page__error"
    >
      Não foi possível carregar as ferramentas. Tente novamente mais tarde.
    </p>

    <!-- Empty state -->
    <ToolsEmptyState v-else-if="!hasTools" />

    <!-- Tools grid -->
    <template v-else>
      <ul class="tools-page__grid" role="list">
        <li
          v-for="tool in tools"
          :key="tool.id"
        >
          <ToolCard
            :tool="tool"
            :is-authenticated="sessionStore.isAuthenticated"
            :is-premium="false"
          />
        </li>
      </ul>

      <!-- Post-result CTA (simulated interaction) -->
      <div class="tools-page__cta">
        <NButton
          type="primary"
          size="medium"
          @click="handleToolInteraction(tools[0]?.id ?? 'unknown')"
        >
          Salvar resultado
        </NButton>
        <p
          v-if="restoredToolId"
          class="tools-page__restored-hint"
          aria-live="polite"
        >
          Contexto restaurado para ferramenta: {{ restoredToolId }}
        </p>
      </div>
    </template>

    <!-- Save result modal for unauthenticated users -->
    <NModal
      v-model:show="showSaveModal"
      preset="dialog"
      title="Salve seu resultado"
      content="Crie uma conta gratuita ou faça login para salvar e acompanhar seus resultados."
      positive-text="Criar conta"
      negative-text="Fazer login"
      @positive-click="goToRegister"
      @negative-click="goToLogin"
    />
  </UiBaseCard>
</template>

<style scoped>
.tools-page__error {
  color: var(--color-error);
  font-size: var(--font-size-body-sm);
  margin: 0;
}

.tools-page__grid {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: var(--space-2);
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
}

.tools-page__cta {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-2);
  margin-top: var(--space-4);
}

.tools-page__restored-hint {
  font-size: var(--font-size-body-sm);
  color: var(--color-text-secondary, #888);
  margin: 0;
}
</style>
