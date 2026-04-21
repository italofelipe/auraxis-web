<script setup lang="ts">
import { useToolStructuredData } from "~/features/tools/composables/useToolStructuredData";
import type { ToolStructuredDataInput } from "~/features/tools/model/structured-data.types";

/**
 * Renderless component that injects schema.org JSON-LD payloads (WebApplication,
 * FAQPage, BreadcrumbList) into the document head for the current tool page.
 *
 * Usage (inside a tool page):
 *
 * ```vue
 * <ToolStructuredData
 *   :input="{
 *     name: 'Juros Compostos',
 *     description: 'Simule aportes mensais.',
 *     url: 'https://app.auraxis.com.br/tools/juros-compostos',
 *     faqs: JUROS_COMPOSTOS_FAQS,
 *     breadcrumbs: [...],
 *   }"
 * />
 * ```
 */
const props = defineProps<{ input: ToolStructuredDataInput }>();

useToolStructuredData(props.input);
</script>

<template>
  <!-- Renderless: structured data is injected via useHead. -->
  <span hidden aria-hidden="true" />
</template>
