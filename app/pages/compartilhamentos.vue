<script setup lang="ts">
import { NEmpty, NSkeleton, NSpace, NTabPane, NTabs } from "naive-ui";

import InvitationItem from "~/features/sharing/components/InvitationItem.vue";
import InviteForm from "~/features/sharing/components/InviteForm.vue";
import SharedEntryItem from "~/features/sharing/components/SharedEntryItem.vue";
import { useInvitationsQuery } from "~/features/sharing/queries/use-invitations-query";
import { useRevokeShareMutation } from "~/features/sharing/queries/use-revoke-share-mutation";
import { useSharedByMeQuery, useSharedWithMeQuery } from "~/features/sharing/queries/use-shared-entries-query";

definePageMeta({
  middleware: ["authenticated"],
  pageTitle: "Compartilhamentos",
  pageSubtitle: "Gerencie convites e entradas compartilhadas",
});

const invitationsQuery = useInvitationsQuery();
const sharedByMeQuery = useSharedByMeQuery();
const sharedWithMeQuery = useSharedWithMeQuery();
const revokeShareMutation = useRevokeShareMutation();

/** @param id Shared entry ID to revoke. */
const handleRevokeShare = (id: string): void => {
  revokeShareMutation.mutate(id);
};
</script>

<template>
  <div class="compartilhamentos-page">
    <NTabs type="line" animated>
      <NTabPane name="convidados" tab="Convidados">
        <NSpace vertical :size="16" class="compartilhamentos-page__tab-content">
          <InviteForm />

          <NSpace v-if="invitationsQuery.isLoading.value" vertical :size="8">
            <NSkeleton height="56px" :sharp="false" />
            <NSkeleton height="56px" :sharp="false" />
          </NSpace>

          <p
            v-else-if="invitationsQuery.isError.value"
            class="compartilhamentos-page__error"
          >
            Erro ao carregar convites. Tente novamente.
          </p>

          <NEmpty
            v-else-if="!invitationsQuery.data.value?.length"
            description="Nenhum convite enviado ainda."
          />

          <NSpace v-else vertical :size="8">
            <InvitationItem
              v-for="invitation in invitationsQuery.data.value"
              :key="invitation.id"
              :invitation="invitation"
            />
          </NSpace>
        </NSpace>
      </NTabPane>

      <NTabPane name="com-mim" tab="Compartilhado comigo">
        <NSpace vertical :size="16" class="compartilhamentos-page__tab-content">
          <NSpace v-if="sharedWithMeQuery.isLoading.value" vertical :size="8">
            <NSkeleton height="56px" :sharp="false" />
            <NSkeleton height="56px" :sharp="false" />
          </NSpace>

          <p
            v-else-if="sharedWithMeQuery.isError.value"
            class="compartilhamentos-page__error"
          >
            Erro ao carregar entradas compartilhadas com você. Tente novamente.
          </p>

          <NEmpty
            v-else-if="!sharedWithMeQuery.data.value?.length"
            description="Nenhuma entrada foi compartilhada com você."
          />

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

      <NTabPane name="por-mim" tab="Compartilhei">
        <NSpace vertical :size="16" class="compartilhamentos-page__tab-content">
          <NSpace v-if="sharedByMeQuery.isLoading.value" vertical :size="8">
            <NSkeleton height="56px" :sharp="false" />
            <NSkeleton height="56px" :sharp="false" />
          </NSpace>

          <p
            v-else-if="sharedByMeQuery.isError.value"
            class="compartilhamentos-page__error"
          >
            Erro ao carregar entradas que você compartilhou. Tente novamente.
          </p>

          <NEmpty
            v-else-if="!sharedByMeQuery.data.value?.length"
            description="Você ainda não compartilhou nenhuma entrada."
          />

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
  gap: var(--space-4);
}

.compartilhamentos-page__tab-content {
  padding-top: var(--space-3);
}

.compartilhamentos-page__error {
  margin: 0;
  color: var(--color-negative);
}
</style>
