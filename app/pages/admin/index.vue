<script setup lang="ts">
import AdminDashboardMetrics from "~/features/admin/dashboard/components/AdminDashboardMetrics.vue";
import AdminOverviewFallback from "~/features/admin/dashboard/components/AdminOverviewFallback.vue";
import { useFeatureFlag } from "~/shared/feature-flags/use-feature-flag";

definePageMeta({
  layout: "admin",
  middleware: ["admin"],
  pageTitle: "Visão geral",
  pageSubtitle: "Métricas de produto: usuários, premium, uso de IA e atividade.",
});

useHead({ title: "Admin | Auraxis" });

/**
 * `web.admin.dashboard` gates the metrics dashboard (issue #1158).
 * While OFF (production today) the page keeps the previous static overview,
 * so the flip to prod is independent from this deploy.
 */
const dashboardEnabled = useFeatureFlag("web.admin.dashboard");
</script>

<template>
  <AdminDashboardMetrics v-if="dashboardEnabled" />
  <AdminOverviewFallback v-else />
</template>
