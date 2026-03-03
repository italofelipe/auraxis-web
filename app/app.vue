<script setup lang="ts">
import { NConfigProvider, darkTheme } from "naive-ui";
import { auraxisThemeOverrides } from "~/utils/naive-theme";
</script>

<template>
  <!--
    NConfigProvider applies the Auraxis theme globally to all Naive UI components.
    - darkTheme: Naive UI's built-in dark base (matches Auraxis dark palette)
    - auraxisThemeOverrides: token overrides from app/utils/naive-theme.ts
    - preflight-style-disabled: prevents Naive UI from injecting a CSS reset
      that would conflict with our own global styles in assets/css/main.css
  -->
  <NConfigProvider
    :theme="darkTheme"
    :theme-overrides="auraxisThemeOverrides"
    :preflight-style-disabled="true"
  >
    <NuxtLoadingIndicator color="var(--color-brand-500)" />
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </NConfigProvider>
</template>
