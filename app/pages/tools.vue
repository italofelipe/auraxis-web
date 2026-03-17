<script setup lang="ts">
import { computed, ref } from "vue";
import { NButton, NModal } from "naive-ui";
import { useRouter } from "#app";
import { useToolsCatalogQuery } from "~/composables/useTools";
import { useSessionStore } from "~/stores/session";
import ToolCard from "~/features/tools/components/ToolCard.vue";
import ToolsEmptyState from "~/features/tools/components/ToolsEmptyState.vue";
import type { Tool } from "~/features/tools/model/tools";

// Page is intentionally PUBLIC — no middleware: authenticated

const toolsCatalogQuery = useToolsCatalogQuery();
const sessionStore = useSessionStore();
const router = useRouter();

const showSaveModal = ref(false);

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
 * Handles tool interaction. If the user is not authenticated, shows a
 * save-result modal prompting them to register or log in.
 */
const handleToolInteraction = (): void => {
  sessionStore.restore();
  if (!sessionStore.isAuthenticated) {
    showSaveModal.value = true;
  }
};

/** Navigates to the registration page. */
const goToRegister = (): void => {
  showSaveModal.value = false;
  void router.push("/register?redirect=/tools");
};

/** Navigates to the login page. */
const goToLogin = (): void => {
  showSaveModal.value = false;
  void router.push("/login?redirect=/tools");
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
          @click="handleToolInteraction"
        >
          Salvar resultado
        </NButton>
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
  justify-content: center;
  margin-top: var(--space-4);
}
</style>
