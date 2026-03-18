<script setup lang="ts">
import { NEmpty, NSkeleton, NSpace, NTabPane, NTabs } from "naive-ui";

import InvitationItem from "~/features/sharing/components/InvitationItem.vue";
import InviteForm from "~/features/sharing/components/InviteForm.vue";
import SharedEntryItem from "~/features/sharing/components/SharedEntryItem.vue";
import { useInvitationsQuery } from "~/features/sharing/queries/use-invitations-query";
import { useRevokeShareMutation } from "~/features/sharing/queries/use-revoke-share-mutation";
import { useSharedByMeQuery, useSharedWithMeQuery } from "~/features/sharing/queries/use-shared-entries-query";

definePageMeta({ middleware: ["authenticated"] });

const invitationsQuery = useInvitationsQuery();
const sharedByMeQuery = useSharedByMeQuery();
const sharedWithMeQuery = useSharedWithMeQuery();
const revokeShareMutation = useRevokeShareMutation();

/**
 * Handles revoking a shared entry by its ID.
 *
 * @param id Shared entry ID to revoke.
 */
const handleRevokeShare = (id: string): void => {
  revokeShareMutation.mutate(id);
};
</script>

<template>
  <div class="compartilhamentos-page">
    <header class="compartilhamentos-page__header">
      <h1>Compartilhamentos</h1>
      <p class="compartilhamentos-page__subtitle">
        Gerencie convites e entradas compartilhadas com você ou por você.
      </p>
    </header>

    <NTabs type="line" animated>
      <!-- Tab: Convidados -->
      <NTabPane name="convidados" tab="Convidados">
        <NSpace vertical :size="16" class="compartilhamentos-page__tab-content">
          <InviteForm />

          <!-- Loading -->
          <NSpace v-if="invitationsQuery.isLoading.value" vertical :size="8">
            <NSkeleton height="56px" :sharp="false" />
            <NSkeleton height="56px" :sharp="false" />
          </NSpace>

          <!-- Error -->
          <p
            v-else-if="invitationsQuery.isError.value"
            class="compartilhamentos-page__error"
          >
            Erro ao carregar convites. Tente novamente.
          </p>

          <!-- Empty -->
          <NEmpty
            v-else-if="!invitationsQuery.data.value?.length"
            description="Nenhum convite enviado ainda."
          />

          <!-- List -->
          <NSpace v-else vertical :size="8">
            <InvitationItem
              v-for="invitation in invitationsQuery.data.value"
              :key="invitation.id"
              :invitation="invitation"
            />
          </NSpace>
        </NSpace>
      </NTabPane>

      <!-- Tab: Compartilhado comigo -->
      <NTabPane name="com-mim" tab="Compartilhado comigo">
        <NSpace vertical :size="16" class="compartilhamentos-page__tab-content">
          <!-- Loading -->
          <NSpace v-if="sharedWithMeQuery.isLoading.value" vertical :size="8">
            <NSkeleton height="56px" :sharp="false" />
            <NSkeleton height="56px" :sharp="false" />
          </NSpace>

          <!-- Error -->
          <p
            v-else-if="sharedWithMeQuery.isError.value"
            class="compartilhamentos-page__error"
          >
            Erro ao carregar entradas compartilhadas com você. Tente novamente.
          </p>

          <!-- Empty -->
          <NEmpty
            v-else-if="!sharedWithMeQuery.data.value?.length"
            description="Nenhuma entrada foi compartilhada com você."
          />

          <!-- List -->
          <NSpace v-else vertical :size="8">
            <SharedEntryItem
              v-for="entry in sharedWithMeQuery.data.value"
              :key="entry.id"
              :entry="entry"
              @revoke="handleRevokeShare"
            />
          </NSpace>
        </NSpace>
      </NTabPane>

      <!-- Tab: Compartilhei -->
      <NTabPane name="por-mim" tab="Compartilhei">
        <NSpace vertical :size="16" class="compartilhamentos-page__tab-content">
          <!-- Loading -->
          <NSpace v-if="sharedByMeQuery.isLoading.value" vertical :size="8">
            <NSkeleton height="56px" :sharp="false" />
            <NSkeleton height="56px" :sharp="false" />
          </NSpace>

          <!-- Error -->
          <p
            v-else-if="sharedByMeQuery.isError.value"
            class="compartilhamentos-page__error"
          >
            Erro ao carregar entradas que você compartilhou. Tente novamente.
          </p>

          <!-- Empty -->
          <NEmpty
            v-else-if="!sharedByMeQuery.data.value?.length"
            description="Você ainda não compartilhou nenhuma entrada."
          />

          <!-- List -->
          <NSpace v-else vertical :size="8">
            <SharedEntryItem
              v-for="entry in sharedByMeQuery.data.value"
              :key="entry.id"
              :entry="entry"
              @revoke="handleRevokeShare"
            />
          </NSpace>
        </NSpace>
      </NTabPane>
    </NTabs>
  </div>
</template>

<style scoped>
.compartilhamentos-page {
  display: grid;
  gap: var(--space-4, 16px);
  padding: var(--space-4, 16px);
}

.compartilhamentos-page__header {
  margin-bottom: var(--space-2, 8px);
}

.compartilhamentos-page__subtitle {
  margin: var(--space-1, 4px) 0 0;
  color: var(--color-text-subtle, #888);
}

.compartilhamentos-page__tab-content {
  padding-top: var(--space-3, 12px);
}

.compartilhamentos-page__error {
  margin: 0;
  color: var(--color-error, #d03050);
}
</style>
