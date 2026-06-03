<script setup lang="ts">
import { NConfigProvider, NMessageProvider, NDialogProvider } from "naive-ui";
import CookieConsentBanner from "~/components/privacy/CookieConsentBanner.vue";
import { useNaiveTheme } from "~/composables/useNaiveTheme";

const { theme, themeOverrides } = useNaiveTheme();
</script>

<template>
  <!--
    NConfigProvider applies the Auraxis theme globally to all Naive UI components.
    - theme: darkTheme or null (light), toggled via useTheme composable
    - themeOverrides: light/dark token overrides from app/composables/useNaiveTheme.ts
    - preflight-style-disabled: prevents Naive UI from injecting a CSS reset
      that would conflict with our own global styles in assets/css/main.css
  -->
  <NConfigProvider
    :theme="theme"
    :theme-overrides="themeOverrides"
    :preflight-style-disabled="true"
  >
    <!--
      :max="1" caps the toast stack to a single visible message at a time.
      Combined with the dedup guard in useToast (#977), concurrent failures
      (e.g. a token expiry firing many requests) can never stack identical
      error toasts.
    -->
    <NMessageProvider :max="1">
      <NDialogProvider>
        <NuxtLoadingIndicator color="var(--color-brand-500)" />
        <NuxtLayout>
          <NuxtPage />
        </NuxtLayout>
        <CookieConsentBanner />
      </NDialogProvider>
    </NMessageProvider>
  </NConfigProvider>
</template>
