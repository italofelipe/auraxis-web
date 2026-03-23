<script setup lang="ts">
import { NEmpty, NSkeleton, NSpace, NTabPane, NTabs } from "naive-ui";

import InvitationItem from "~/features/sharing/components/InvitationItem.vue";
import InviteForm from "~/features/sharing/components/InviteForm.vue";
import SharedEntryItem from "~/features/sharing/components/SharedEntryItem.vue";
import { useInvitationsQuery } from "~/features/sharing/queries/use-invitations-query";
import { useRevokeShareMutation } from "~/features/sharing/queries/use-revoke-share-mutation";
import { useSharedByMeQuery, useSharedWithMeQuery } from "~/features/sharing/queries/use-shared-entries-query";

const { t } = useI18n();

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
  <div class="shared-entries-page">
    <NTabs type="line" animated>
      <NTabPane name="guests" :tab="t('pages.sharedEntries.tabs.guests')">
        <NSpace vertical :size="16" class="shared-entries-page__tab-content">
          <InviteForm />

          <NSpace v-if="invitationsQuery.isLoading.value" vertical :size="8">
            <NSkeleton height="56px" :sharp="false" />
            <NSkeleton height="56px" :sharp="false" />
          </NSpace>

          <p
            v-else-if="invitationsQuery.isError.value"
            class="shared-entries-page__error"
          >
            {{ t('pages.sharedEntries.errorGuests') }}
          </p>

          <NEmpty
            v-else-if="!invitationsQuery.data.value?.length"
            :description="t('pages.sharedEntries.emptyGuests')"
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

      <NTabPane name="shared-with-me" :tab="t('pages.sharedEntries.tabs.sharedWithMe')">
        <NSpace vertical :size="16" class="shared-entries-page__tab-content">
          <NSpace v-if="sharedWithMeQuery.isLoading.value" vertical :size="8">
            <NSkeleton height="56px" :sharp="false" />
            <NSkeleton height="56px" :sharp="false" />
          </NSpace>

          <p
            v-else-if="sharedWithMeQuery.isError.value"
            class="shared-entries-page__error"
          >
            {{ t('pages.sharedEntries.errorSharedWithMe') }}
          </p>

          <NEmpty
            v-else-if="!sharedWithMeQuery.data.value?.length"
            :description="t('pages.sharedEntries.emptySharedWithMe')"
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

      <NTabPane name="shared-by-me" :tab="t('pages.sharedEntries.tabs.sharedByMe')">
        <NSpace vertical :size="16" class="shared-entries-page__tab-content">
          <NSpace v-if="sharedByMeQuery.isLoading.value" vertical :size="8">
            <NSkeleton height="56px" :sharp="false" />
            <NSkeleton height="56px" :sharp="false" />
          </NSpace>

          <p
            v-else-if="sharedByMeQuery.isError.value"
            class="shared-entries-page__error"
          >
            {{ t('pages.sharedEntries.errorSharedByMe') }}
          </p>

          <NEmpty
            v-else-if="!sharedByMeQuery.data.value?.length"
            :description="t('pages.sharedEntries.emptySharedByMe')"
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
.shared-entries-page {
  display: grid;
  gap: var(--space-4);
}

.shared-entries-page__tab-content {
  padding-top: var(--space-3);
}

.shared-entries-page__error {
  margin: 0;
  color: var(--color-negative);
}
</style>
