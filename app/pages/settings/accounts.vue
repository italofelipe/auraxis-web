<script setup lang="ts">
import { h, type VNodeChild } from "vue";
import {
  NButton,
  NCard,
  NDataTable,
  NFormItem,
  NInput,
  NInputNumber,
  NModal,
  NPopconfirm,
  NSelect,
  NSpace,
  NSpin,
  type DataTableColumns,
} from "naive-ui";

import type { AccountDto, AccountType } from "~/features/accounts/contracts/account.dto";
import { useAccountsQuery } from "~/features/accounts/queries/use-accounts-query";
import { useCreateAccountMutation } from "~/features/accounts/queries/use-create-account-mutation";
import { useUpdateAccountMutation } from "~/features/accounts/queries/use-update-account-mutation";
import { useDeleteAccountMutation } from "~/features/accounts/queries/use-delete-account-mutation";

const { t } = useI18n();

definePageMeta({
  middleware: ["authenticated", "coming-soon"],
  pageTitle: "Contas",
  pageSubtitle: "Gerencie suas contas bancárias",
});

useHead({ title: "Contas | Auraxis" });

const { data: accounts, isLoading } = useAccountsQuery();
const createMutation = useCreateAccountMutation();
const updateMutation = useUpdateAccountMutation();
const deleteMutation = useDeleteAccountMutation();

const showModal = ref(false);
const editingAccount = ref<AccountDto | null>(null);
const formName = ref("");
const formAccountType = ref<AccountType>("checking");
const formInstitution = ref<string>("");
const formInitialBalance = ref<number>(0);

const ACCOUNT_TYPE_OPTIONS = computed(() => [
  { value: "checking", label: t("pages.settings.accounts.accountTypes.checking") },
  { value: "savings", label: t("pages.settings.accounts.accountTypes.savings") },
  { value: "investment", label: t("pages.settings.accounts.accountTypes.investment") },
  { value: "wallet", label: t("pages.settings.accounts.accountTypes.wallet") },
  { value: "other", label: t("pages.settings.accounts.accountTypes.other") },
]);

/**
 *
 */
function openCreate(): void {
  editingAccount.value = null;
  formName.value = "";
  formAccountType.value = "checking";
  formInstitution.value = "";
  formInitialBalance.value = 0;
  showModal.value = true;
}

/**
 *
 * @param account
 */
function openEdit(account: AccountDto): void {
  editingAccount.value = account;
  formName.value = account.name;
  formAccountType.value = account.account_type;
  formInstitution.value = account.institution ?? "";
  formInitialBalance.value = account.initial_balance ?? 0;
  showModal.value = true;
}

/**
 *
 */
function closeModal(): void {
  showModal.value = false;
  formName.value = "";
  formAccountType.value = "checking";
  formInstitution.value = "";
  formInitialBalance.value = 0;
  editingAccount.value = null;
}

/**
 *
 */
async function submitForm(): Promise<void> {
  const name = formName.value.trim();
  if (!name) {return;}

  const institution = formInstitution.value.trim() || null;

  if (editingAccount.value) {
    await updateMutation.mutateAsync({
      id: editingAccount.value.id,
      name,
      account_type: formAccountType.value,
      institution,
      initial_balance: formInitialBalance.value,
    });
  } else {
    await createMutation.mutateAsync({
      name,
      account_type: formAccountType.value,
      institution,
      initial_balance: formInitialBalance.value,
    });
  }

  closeModal();
}

/**
 *
 * @param id
 */
async function confirmDelete(id: string): Promise<void> {
  await deleteMutation.mutateAsync(id);
}

const columns = computed((): DataTableColumns<AccountDto> => [
  {
    title: t("pages.settings.accounts.columns.name"),
    key: "name",
  },
  {
    title: t("pages.settings.accounts.columns.accountType"),
    key: "account_type",
    render(row: AccountDto): VNodeChild {
      const opt = ACCOUNT_TYPE_OPTIONS.value.find((o) => o.value === row.account_type);
      return opt?.label ?? row.account_type;
    },
  },
  {
    title: t("pages.settings.accounts.columns.institution"),
    key: "institution",
    render(row: AccountDto): VNodeChild {
      return row.institution ?? "—";
    },
  },
  {
    title: t("pages.settings.accounts.columns.actions"),
    key: "actions",
    width: 160,
    render(row: AccountDto): VNodeChild {
      return h(NSpace, { size: "small" }, () => [
        h(
          NButton,
          {
            size: "small",
            onClick: () => openEdit(row),
          },
          () => t("pages.settings.accounts.edit"),
        ),
        h(
          NPopconfirm,
          {
            onPositiveClick: () => confirmDelete(row.id),
          },
          {
            default: () => t("pages.settings.accounts.confirmDelete"),
            trigger: () =>
              h(
                NButton,
                { size: "small", type: "error" },
                () => t("pages.settings.accounts.remove"),
              ),
          },
        ),
      ]);
    },
  },
]);
</script>

<template>
  <div class="settings-page">
    <div class="settings-page__header">
      <div class="settings-page__title-block">
        <span class="settings-page__title">{{ $t('pages.settings.accounts.title') }}</span>
        <span class="settings-page__subtitle">{{ $t('pages.settings.accounts.subtitle') }}</span>
      </div>
      <NButton type="primary" size="medium" @click="openCreate">{{ $t('pages.settings.accounts.newAccount') }}</NButton>
    </div>

    <NCard>
      <NSpin v-if="isLoading" />
      <NDataTable
        v-else
        :columns="columns"
        :data="accounts ?? []"
        :pagination="{ pageSize: 20 }"
        :bordered="false"
        size="small"
      />
    </NCard>

    <NModal
      v-model:show="showModal"
      preset="dialog"
      :title="editingAccount ? $t('pages.settings.accounts.editAccount') : $t('pages.settings.accounts.newAccount')"
      :positive-text="editingAccount ? $t('pages.settings.accounts.save') : $t('pages.settings.accounts.create')"
      :negative-text="$t('pages.settings.accounts.cancel')"
      @positive-click="submitForm"
      @negative-click="closeModal"
    >
      <div class="modal-form">
        <NFormItem :label="$t('pages.settings.accounts.placeholder')">
          <NInput
            v-model:value="formName"
            :placeholder="$t('pages.settings.accounts.placeholder')"
            maxlength="100"
            show-count
          />
        </NFormItem>
        <NFormItem :label="$t('pages.settings.accounts.fields.accountType')">
          <NSelect
            v-model:value="formAccountType"
            :options="ACCOUNT_TYPE_OPTIONS"
          />
        </NFormItem>
        <NFormItem :label="$t('pages.settings.accounts.fields.institution')">
          <NInput
            v-model:value="formInstitution"
            :placeholder="$t('pages.settings.accounts.fields.institutionPlaceholder')"
            maxlength="100"
          />
        </NFormItem>
        <NFormItem :label="$t('pages.settings.accounts.fields.initialBalance')">
          <NInputNumber
            v-model:value="formInitialBalance"
            :min="0"
            :precision="2"
            style="width: 100%;"
          />
        </NFormItem>
      </div>
    </NModal>
  </div>
</template>

<style scoped>
.settings-page {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  padding: var(--space-3);
}

.settings-page__header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: var(--space-2);
  flex-wrap: wrap;
}

.settings-page__title-block {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.settings-page__title {
  font-size: var(--font-size-lg, 1.25rem);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
}

.settings-page__subtitle {
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
}

.modal-form {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  padding-top: var(--space-2);
}
</style>
