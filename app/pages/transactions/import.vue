<script setup lang="ts">
import { computed, ref } from "vue";
import { NAlert, NButton, NTabPane, NTabs } from "naive-ui";

import BankImportPanel from "~/features/import/components/BankImportPanel.vue";
import SpreadsheetImportPanel from "~/features/import/components/SpreadsheetImportPanel.vue";
import {
  BANK_IMPORT_FEATURE_FLAG_KEY,
  IMPORT_FEATURE_FLAG_KEY,
} from "~/features/import/model/import-config";
import { useOnboarding } from "~/features/onboarding/composables/useOnboarding";
import { useFeatureFlag } from "~/shared/feature-flags/use-feature-flag";

definePageMeta({
  middleware: ["authenticated"],
  pageTitle: "Importar transações",
  pageSubtitle: "Traga seus lançamentos de uma planilha ou de um extrato bancário",
});

useHead({ title: "Importar transações | Auraxis" });

const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const { start: startOnboarding } = useOnboarding();
const isSpreadsheetEnabled = useFeatureFlag(IMPORT_FEATURE_FLAG_KEY);
const isBankEnabled = useFeatureFlag(BANK_IMPORT_FEATURE_FLAG_KEY);

const isEnabled = computed(
  (): boolean => isSpreadsheetEnabled.value || isBankEnabled.value,
);
// Duas abas só quando os dois caminhos existem — com um só, a aba seria um
// enfeite em volta de um wizard único.
const hasTabs = computed(
  (): boolean => isSpreadsheetEnabled.value && isBankEnabled.value,
);
const activeTab = ref<"spreadsheet" | "bank">("spreadsheet");

// Quem chegou pelo onboarding perdeu o overlay do tour ao navegar para cá, e o
// banner de retomada só existe no dashboard. Sem esta faixa, o caminho de
// volta ao tutorial some (#1286).
const isFromOnboarding = computed((): boolean => route.query.from === "onboarding");

/** Volta para a lista de transações depois do import. */
const goToTransactions = (): void => {
  void router.push("/transactions");
};

/** Reabre o tour de onde ele parou (etapa de metas). */
const resumeOnboarding = (): void => {
  startOnboarding();
};

/** Leva ao paywall quando a cota gratuita do mês acabou. */
const goToUpgrade = (): void => {
  void router.push("/checkout");
};
</script>

<template>
  <div class="import-page">
    <NAlert
      v-if="isFromOnboarding"
      type="info"
      closable
      :title="t('import.onboarding.title')"
      data-testid="import-onboarding-banner"
    >
      <p>{{ t("import.onboarding.description") }}</p>
      <NButton size="small" data-testid="import-onboarding-resume" @click="resumeOnboarding">
        {{ t("import.onboarding.resume") }}
      </NButton>
    </NAlert>

    <NAlert v-if="!isEnabled" type="info" :title="t('import.disabled.title')">
      {{ t("import.disabled.description") }}
    </NAlert>

    <!--
      `display-directive="if"` de propósito: cada aba tem seu próprio wizard
      com estado, arquivo e prévia. Mantendo os dois vivos, a cota freemium
      poderia ser consumida por uma prévia esquecida na aba escondida.
    -->
    <NTabs
      v-else-if="hasTabs"
      v-model:value="activeTab"
      type="line"
      animated
      data-testid="import-tabs"
    >
      <NTabPane name="spreadsheet" display-directive="if">
        <template #tab>
          <span data-testid="import-tab-spreadsheet">
            {{ t("import.tabs.spreadsheet") }}
          </span>
        </template>
        <SpreadsheetImportPanel
          @go-to-transactions="goToTransactions"
          @upgrade="goToUpgrade"
        />
      </NTabPane>
      <NTabPane name="bank" display-directive="if">
        <template #tab>
          <span data-testid="import-tab-bank">{{ t("import.tabs.bank") }}</span>
        </template>
        <BankImportPanel
          @go-to-transactions="goToTransactions"
          @upgrade="goToUpgrade"
        />
      </NTabPane>
    </NTabs>

    <SpreadsheetImportPanel
      v-else-if="isSpreadsheetEnabled"
      @go-to-transactions="goToTransactions"
      @upgrade="goToUpgrade"
    />

    <BankImportPanel
      v-else
      @go-to-transactions="goToTransactions"
      @upgrade="goToUpgrade"
    />
  </div>
</template>

<style scoped>
.import-page {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}
</style>
