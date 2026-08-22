<script setup lang="ts">
/**
 * Escolha da conta de destino, antes do upload.
 *
 * Perguntar antes e não depois é deliberado: um extrato concilia contra uma
 * conta, e a detecção de duplicidade compara o lançamento com o que já existe
 * naquela conta. Subir primeiro e perguntar depois faria a prévia inteira ser
 * recalculada — ou, pior, ser exibida com uma conciliação que não vale.
 */
import { NAlert, NButton, NSelect, NSpin, NText } from "naive-ui";
import { computed } from "vue";

import { useAccountsQuery } from "~/features/accounts/queries/use-accounts-query";

const properties = defineProps<{
  /** Conta já escolhida, quando o usuário volta ao passo. */
  modelValue: string | null;
  /** Desabilita a interação durante uma operação em curso. */
  disabled?: boolean;
}>();

const emit = defineEmits<{
  (event: "update:modelValue", value: string | null): void;
  (event: "confirm", accountId: string): void;
}>();

const { data: accounts, isPending, isError } = useAccountsQuery();

// Array.isArray e não `?? []`: se a resposta vier num formato inesperado, um
// `.map` em cima de um objeto lança e derruba a tela inteira — o seletor de
// conta some junto com o upload e o usuário fica sem nada, sem explicação.
const options = computed(() =>
  (Array.isArray(accounts.value) ? accounts.value : []).map((account) => ({
    label: account.institution
      ? `${account.name} · ${account.institution}`
      : account.name,
    value: account.id,
  })),
);

const hasAccounts = computed(() => options.value.length > 0);

const selected = computed({
  get: () => properties.modelValue,
  /**
   * @param value Conta escolhida no select.
   * @returns Nada; apenas propaga a escolha ao pai.
   */
  set: (value: string | null): void => emit("update:modelValue", value),
});

/**
 * Avança para o upload com a conta escolhida.
 */
const confirmAccount = (): void => {
  if (selected.value) {
    emit("confirm", selected.value);
  }
};
</script>

<template>
  <section class="account-picker" data-testid="statement-account-picker">
    <NText tag="p" class="account-picker__hint">
      {{ $t("import.statement.account.hint") }}
    </NText>

    <NSpin v-if="isPending" size="small" data-testid="statement-accounts-loading" />

    <NAlert
      v-else-if="isError"
      type="error"
      :bordered="false"
      data-testid="statement-accounts-error"
    >
      {{ $t("import.statement.account.loadError") }}
    </NAlert>

    <NAlert
      v-else-if="!hasAccounts"
      type="warning"
      :bordered="false"
      data-testid="statement-accounts-empty"
    >
      {{ $t("import.statement.account.empty") }}
      <NButton text tag="a" href="/accounts" class="account-picker__link">
        {{ $t("import.statement.account.createCta") }}
      </NButton>
    </NAlert>

    <template v-else>
      <NSelect
        v-model:value="selected"
        :options="options"
        :disabled="disabled"
        filterable
        :placeholder="$t('import.statement.account.placeholder')"
        :aria-label="$t('import.statement.account.placeholder')"
        data-testid="statement-account-select"
      />
      <NButton
        type="primary"
        :disabled="!selected || disabled"
        class="account-picker__cta"
        data-testid="statement-account-confirm"
        @click="confirmAccount"
      >
        {{ $t("import.statement.account.continue") }}
      </NButton>
    </template>
  </section>
</template>

<style scoped>
.account-picker {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.account-picker__hint {
  color: var(--color-text-secondary);
}

.account-picker__cta {
  align-self: flex-start;
}

.account-picker__link {
  margin-left: var(--space-2);
}
</style>
