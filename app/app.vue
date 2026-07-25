<script setup lang="ts">
import { tryUseNuxtApp } from "#app";
import { NConfigProvider, NMessageProvider, NDialogProvider } from "naive-ui";
import CookieConsentBanner from "~/components/privacy/CookieConsentBanner.vue";
import { useNaiveTheme } from "~/composables/useNaiveTheme";

const { theme, themeOverrides } = useNaiveTheme();

// Landing surface (#1165): the apex capture page sets no analytics or
// marketing cookies (PostHog key is not baked into that build), so the LGPD
// consent banner has nothing to gate — and it would cover the hero CTA.
// tryUseNuxtApp keeps the component mountable in bare unit tests (app.spec.ts).
const nuxtApp = tryUseNuxtApp();
const isLandingSurface = computed(
  (): boolean =>
    (nuxtApp?.$config.public as Record<string, unknown> | undefined)?.siteSurface === "landing",
);
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
        <CookieConsentBanner v-if="!isLandingSurface" />
      </NDialogProvider>
    </NMessageProvider>
  </NConfigProvider>
</template>
