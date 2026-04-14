<script setup lang="ts">
// ToolsSidebar and UiPublicHeader/Footer are auto-imported from app/components/.
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
