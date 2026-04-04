<template>
  <div class="public-layout">
    <UiPublicHeader />
    <main id="main-content" class="public-layout__main" tabindex="-1">
      <slot />
    </main>
    <UiPublicFooter />
  </div>
</template>

<style scoped>
.public-layout {
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
}

.public-layout__main {
  flex: 1;
  outline: none;
}
</style>
