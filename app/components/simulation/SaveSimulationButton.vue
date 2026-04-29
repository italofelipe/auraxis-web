<script setup lang="ts">
import { computed } from "vue";
import { NButton, useMessage } from "naive-ui";
import { useRouter } from "#app";
import { useSessionStore } from "~/stores/session";
import { useToolContextStore } from "~/stores/toolContext";
import { useSaveSimulationMutation } from "~/features/simulations/queries/use-save-simulation-mutation";

const props = withDefaults(
  defineProps<{
    /** Canonical kebab-case tool id from the registry (e.g. "compound-interest"). */
    toolId: string;
    /** Formula version declared by the client (e.g. "2026.04"). */
    ruleVersion: string;
    /** The inputs passed to the tool — must be a JSON object. */
    inputs: Record<string, unknown>;
    /** The result produced by the tool — must be a JSON object. */
    result: Record<string, unknown>;
    /** Optional human-friendly label persisted under metadata.label. */
    label?: string;
  }>(),
  {
    label: undefined,
  },
);

const { t } = useI18n();

const router = useRouter();
const message = useMessage();
const sessionStore = useSessionStore();
const toolContextStore = useToolContextStore();
const saveSimulationMutation = useSaveSimulationMutation();

/**
 * Whether the current user is authenticated.
 *
 * @returns True when a valid session is present.
 */
const isAuthenticated = computed<boolean>(() => {
  sessionStore.restore();
  return sessionStore.isAuthenticated;
});

const simulationLabel = computed<string | undefined>(() => props.label);

/**
 * Saves the current simulation when authenticated; otherwise stores the
 * tool context in sessionStorage and redirects to login so the flow can
 * resume after authentication.
 */
const handleSave = (): void => {
  if (isAuthenticated.value) {
    saveSimulationMutation.mutate(
      {
        toolId: props.toolId,
        ruleVersion: props.ruleVersion,
        inputs: props.inputs,
        result: props.result,
        ...(simulationLabel.value !== undefined && {
          metadata: { label: simulationLabel.value },
        }),
      },
      {
        onSuccess: (): void => {
          message.success(t("simulation.saveButton.success"));
        },
        onError: (): void => {
          message.error(t("simulation.saveButton.error"));
        },
      },
    );
    return;
  }

  toolContextStore.save(props.toolId, props.result);
  const encodedResult = encodeURIComponent(JSON.stringify(props.result));
  const redirectUrl = `/login?redirect=/tools&tool=${props.toolId}&result=${encodedResult}`;
  void router.push(redirectUrl);
};
</script>

<template>
  <NButton
    type="primary"
    size="medium"
    :loading="saveSimulationMutation.isPending.value"
    :disabled="saveSimulationMutation.isPending.value"
    class="save-simulation-button"
    @click="handleSave"
  >
    {{ $t('simulation.saveButton.label') }}
  </NButton>
</template>

<style scoped>
.save-simulation-button {
  border-radius: var(--border-radius-md, var(--n-border-radius));
}
</style>
