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
definePageMeta({
  middleware: ["tools-context"],
  pageTitle: "Ferramentas",
});

const toolsCatalogQuery = useToolsCatalogQuery();
const sessionStore = useSessionStore();
const toolContextStore = useToolContextStore();
const router = useRouter();
const route = useRoute();

const showSaveModal = ref(false);

const activeSaveToolId = ref<string | null>(null);

/**
 * Maps catalog tools to the feature domain model.
 * Falls back to accessLevel 'public' — backend contract does not yet expose
 * requires_auth/requires_premium per tool.
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

/** True when the catalog contains at least one tool. */
const hasTools = computed<boolean>(() => tools.value.length > 0);

/** Tool id restored from context after post-auth redirect, if any. */
const restoredToolId = computed<string | null>(() => {
  const queryTool = route.query.tool as string | undefined;
  return queryTool ?? toolContextStore.pendingToolId;
});

/** Navigates to the curated public calculator route. */
const goToInstallmentVsCash = (): void => {
  void router.push("/tools/parcelado-vs-a-vista");
};

/**
 * If the user is unauthenticated, persists the tool context and shows the
 * save-result modal — routing them to register/login with tool state encoded
 * in the redirect URL so it can be restored post-auth.
 * @param toolId The tool that produced a result.
 * @param result The result to persist across the auth redirect.
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

/** Navigates to register with tool context preserved in query params. */
const goToRegister = (): void => {
  showSaveModal.value = false;
  void router.push(buildRedirectWithContext("/register"));
};

/** Navigates to login with tool context preserved in query params. */
const goToLogin = (): void => {
  showSaveModal.value = false;
  void router.push(buildRedirectWithContext("/login"));
};
</script>

<template>
  <UiBaseCard title="Ferramentas">
    <BaseSkeleton v-if="toolsCatalogQuery.isLoading.value" />

    <p
      v-else-if="toolsCatalogQuery.isError.value"
      class="tools-page__error"
    >
      Não foi possível carregar as ferramentas. Tente novamente mais tarde.
    </p>

    <ToolsEmptyState v-else-if="!hasTools" />

    <template v-else>
      <UiGlassPanel glow class="tools-page__featured-tool">
        <div class="tools-page__featured-copy">
          <UiPageHeader
            title="Nova ferramenta: parcelado vs à vista"
            subtitle="Compare desconto à vista, parcelamento, inflação e custo de oportunidade em uma experiência pública e detalhada."
          />
          <p class="tools-page__featured-description">
            A ferramenta mostra uma resposta simples para iniciantes e abre os detalhes
            matemáticos para quem quer auditar a decisão.
          </p>
        </div>

        <NButton
          type="primary"
          size="large"
          @click="goToInstallmentVsCash"
        >
          Abrir ferramenta
        </NButton>
      </UiGlassPanel>

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
  color: var(--color-negative);
  font-size: var(--font-size-sm);
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

.tools-page__featured-tool {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
  margin-bottom: var(--space-3);
}

.tools-page__featured-copy {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.tools-page__featured-description {
  margin: 0;
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  line-height: 1.6;
}

.tools-page__cta {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-2);
  margin-top: var(--space-4);
}

.tools-page__restored-hint {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  margin: 0;
}

@media (max-width: 767px) {
  .tools-page__featured-tool {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
