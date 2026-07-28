<script setup lang="ts">
import { computed } from "vue";
import { useRoute } from "#app";

// ToolsSidebar and UiPublicHeader/Footer are auto-imported from app/components/.

// #1224: o slug sai da própria rota, então o bloco de links relacionados vale
// para as 27 calculadoras sem tocar em 27 páginas. Só o índice /tools fica de
// fora (ele já é a lista completa).
const route = useRoute();
const toolId = computed((): string => {
  const match = /^\/(?:en\/)?tools\/([\w-]+)\/?$/.exec(route.path);
  return match?.[1] ?? "";
});
</script>

<template>
  <div class="tools-public-layout">
    <UiPublicHeader />

    <div class="tools-public-layout__body">
      <!-- Mobile sidebar toggle + drawer rendered inside ToolsSidebar -->
      <ToolsSidebar />

      <main
        id="main-content"
        class="tools-public-layout__main"
        tabindex="-1"
      >
        <slot />
        <ToolRelatedLinks v-if="toolId" :tool-id="toolId" />
      </main>
    </div>

    <UiPublicFooter />
  </div>
</template>

<style scoped>
.tools-public-layout {
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
}

.tools-public-layout__body {
  flex: 1;
  display: flex;
  align-items: flex-start;
  overflow: hidden;
}

.tools-public-layout__main {
  flex: 1;
  min-width: 0;
  outline: none;
  overflow-y: auto;
}

/* On mobile, the sidebar is fixed/drawer so the body is a single column */
@media (max-width: 767px) {
  .tools-public-layout__body {
    flex-direction: column;
  }
}
</style>
