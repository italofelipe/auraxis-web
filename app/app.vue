<script setup lang="ts">
import { NConfigProvider, NMessageProvider, NDialogProvider } from "naive-ui";
import { useNaiveTheme } from "~/composables/useNaiveTheme";
import { useTheme } from "~/composables/useTheme";

const { themeOverrides } = useNaiveTheme();
const { naiveTheme } = useTheme();
</script>

<template>
  <!--
    NConfigProvider applies the Auraxis theme globally to all Naive UI components.
    - naiveTheme: darkTheme or null (light), toggled via useTheme composable
    - themeOverrides: token overrides from app/composables/useNaiveTheme.ts
    - preflight-style-disabled: prevents Naive UI from injecting a CSS reset
      that would conflict with our own global styles in assets/css/main.css
  -->
  <NConfigProvider
    :theme="naiveTheme"
    :theme-overrides="themeOverrides"
    :preflight-style-disabled="true"
  >
    <NMessageProvider>
      <NDialogProvider>
        <NuxtLoadingIndicator color="var(--color-brand-500)" />
        <NuxtLayout>
          <NuxtPage />
        </NuxtLayout>
      </NDialogProvider>
    </NMessageProvider>
  </NConfigProvider>
</template>
