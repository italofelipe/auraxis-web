<script setup lang="ts">
import { NAlert, NButton, NInput, NModal, NSkeleton, NTag } from "naive-ui";
import { Download, FileCheck2, RotateCw, ShieldCheck, Trash2 } from "lucide-vue-next";

import type {
  PrivacyDataExportDto,
  PrivacyDeletionRequestDto,
} from "~/features/privacy/contracts/privacy-center.dto";
import { buildConsentViewModels } from "~/features/privacy/model/privacy-center";
import { usePrivacyConsentsQuery } from "~/features/privacy/queries/use-privacy-consents-query";
import { useRequestAccountDeletionMutation } from "~/features/privacy/queries/use-request-account-deletion-mutation";
import { useRequestDataExportMutation } from "~/features/privacy/queries/use-request-data-export-mutation";

definePageMeta({
  middleware: ["authenticated"],
  pageTitle: "Privacidade",
  pageSubtitle: "Controle de dados pessoais e direitos LGPD",
});

useHead({ title: "Privacidade | Auraxis" });

const consentsQuery = usePrivacyConsentsQuery();
const exportMutation = useRequestDataExportMutation();
const deletionMutation = useRequestAccountDeletionMutation();

const showDeletionModal = ref(false);
const deletionPassword = ref("");
const deletionReason = ref("");
const exportResult = ref<PrivacyDataExportDto | null>(null);
const deletionResult = ref<PrivacyDeletionRequestDto | null>(null);

const consentRows = computed(() => buildConsentViewModels(consentsQuery.data.value?.items ?? []));
const grantedConsentCount = computed(() => consentRows.value.filter((row) => row.granted).length);
const deletionDisabled = computed(
  () => deletionPassword.value.trim().length === 0 || deletionMutation.isPending.value,
);

/** Retries the consent overview request after a loading failure. */
function retryConsents(): void {
  void consentsQuery.refetch();
}

/** Sends a request to generate a portable data package. */
function requestDataExport(): void {
  exportResult.value = null;
  exportMutation.mutate(undefined, {
    onSuccess: (result): void => {
      exportResult.value = result;
    },
  });
}

/** Opens the deletion request modal with a clean form. */
function openDeletionModal(): void {
  deletionPassword.value = "";
  deletionReason.value = "";
  deletionResult.value = null;
  showDeletionModal.value = true;
}

/** Closes the deletion request modal when no request is running. */
function closeDeletionModal(): void {
  if (deletionMutation.isPending.value) {
    return;
  }

  showDeletionModal.value = false;
  deletionPassword.value = "";
  deletionReason.value = "";
}

/** Sends an authenticated LGPD deletion/anonymisation request. */
function submitDeletionRequest(): void {
  if (deletionDisabled.value) {
    return;
  }

  deletionMutation.mutate(
    {
      password: deletionPassword.value,
      reason: deletionReason.value.trim() || null,
    },
    {
      onSuccess: (result): void => {
        deletionResult.value = result;
        showDeletionModal.value = false;
        deletionPassword.value = "";
        deletionReason.value = "";
      },
    },
  );
}
</script>

<template>
  <div class="settings-page privacy-center-page">
    <div class="settings-page__header privacy-center-page__header">
      <div class="settings-page__title-block">
        <span class="settings-page__title">Privacidade e dados</span>
        <span class="settings-page__subtitle">
          Veja consentimentos, solicite portabilidade e inicie exclusão de dados.
        </span>
      </div>
      <NButton secondary :loading="consentsQuery.isFetching.value" @click="retryConsents">
        <template #icon>
          <RotateCw :size="16" />
        </template>
        Atualizar
      </NButton>
    </div>

    <NAlert type="info" class="privacy-center-page__notice" title="Seus dados não treinam modelos">
      Os dados usados em recursos de IA são tratados apenas para gerar análises dentro do Auraxis.
      Não usamos seus dados financeiros pessoais para treinar modelos de terceiros.
    </NAlert>

    <section class="privacy-center-page__summary" aria-label="Resumo de privacidade">
      <UiSurfaceCard padding="lg">
        <div class="privacy-center-page__metric">
          <ShieldCheck :size="22" />
          <div>
            <strong>{{ grantedConsentCount }}/{{ consentRows.length }}</strong>
            <span>consentimentos ativos</span>
          </div>
        </div>
      </UiSurfaceCard>
      <UiSurfaceCard padding="lg">
        <div class="privacy-center-page__metric">
          <FileCheck2 :size="22" />
          <div>
            <strong>LGPD</strong>
            <span>acesso, portabilidade e exclusão</span>
          </div>
        </div>
      </UiSurfaceCard>
      <UiSurfaceCard padding="lg">
        <div class="privacy-center-page__metric">
          <Download :size="22" />
          <div>
            <strong>JSON</strong>
            <span>pacote de dados portável</span>
          </div>
        </div>
      </UiSurfaceCard>
    </section>

    <UiSurfaceCard padding="lg" class="privacy-center-page__section">
      <div class="privacy-center-page__section-header">
        <div>
          <h2>Consentimentos</h2>
          <p>Controle quais permissões estão ativas e quais versões foram aceitas.</p>
        </div>
      </div>

      <div v-if="consentsQuery.isLoading.value" class="privacy-center-page__loading">
        <NSkeleton text :repeat="4" />
      </div>
      <NAlert
        v-else-if="consentsQuery.isError.value"
        type="error"
        title="Não foi possível carregar seus consentimentos"
      >
        Tente novamente. Se o erro continuar, fale com o suporte antes de alterar permissões
        sensíveis.
      </NAlert>
      <NButton
        v-if="consentsQuery.isError.value"
        class="privacy-center-page__retry"
        size="small"
        @click="retryConsents"
      >
        Tentar novamente
      </NButton>
      <div v-else class="privacy-center-page__consents">
        <article
          v-for="consent in consentRows"
          :key="consent.kind"
          class="privacy-center-page__consent-card"
        >
          <div class="privacy-center-page__consent-main">
            <div>
              <h3>{{ consent.label }}</h3>
              <p>{{ consent.description }}</p>
            </div>
            <NTag :type="consent.granted ? 'success' : 'default'" round>
              {{ consent.granted ? "Ativo" : "Inativo" }}
            </NTag>
          </div>
          <dl class="privacy-center-page__consent-meta">
            <div>
              <dt>Versão</dt>
              <dd>{{ consent.version }}</dd>
            </div>
            <div>
              <dt>Origem</dt>
              <dd>{{ consent.source }}</dd>
            </div>
            <div>
              <dt>Atualizado em</dt>
              <dd>{{ consent.updatedAt }}</dd>
            </div>
          </dl>
        </article>
      </div>
    </UiSurfaceCard>

    <section class="privacy-center-page__actions" aria-label="Direitos do titular">
      <UiSurfaceCard padding="lg" class="privacy-center-page__action-card">
        <div class="privacy-center-page__action-icon">
          <Download :size="22" />
        </div>
        <div class="privacy-center-page__action-copy">
          <h2>Exportar meus dados</h2>
          <p>
            Gere um pacote com perfil, transações, metas, carteira, consentimentos, assinatura e
            insights registrados na sua conta.
          </p>
          <NAlert v-if="exportResult" type="success" title="Exportação solicitada">
            Protocolo {{ exportResult.request_id }} em status {{ exportResult.status }}. Você
            receberá o pacote quando o processamento terminar.
          </NAlert>
        </div>
        <NButton
          type="primary"
          :loading="exportMutation.isPending.value"
          @click="requestDataExport"
        >
          Solicitar pacote
        </NButton>
      </UiSurfaceCard>

      <UiSurfaceCard
        padding="lg"
        class="privacy-center-page__action-card privacy-center-page__action-card--danger"
      >
        <div class="privacy-center-page__action-icon privacy-center-page__action-icon--danger">
          <Trash2 :size="22" />
        </div>
        <div class="privacy-center-page__action-copy">
          <h2>Solicitar exclusão</h2>
          <p>
            Inicie a remoção ou anonimização integral dos dados mapeados para sua conta. A ação
            exige confirmação de senha e gera um protocolo interno.
          </p>
          <NAlert v-if="deletionResult" type="warning" title="Exclusão solicitada">
            Protocolo {{ deletionResult.request_id }} em status {{ deletionResult.status }}.
          </NAlert>
        </div>
        <NButton type="error" ghost @click="openDeletionModal"> Solicitar exclusão </NButton>
      </UiSurfaceCard>
    </section>

    <UiSurfaceCard padding="lg" class="privacy-center-page__legal">
      <h2>Documentos legais</h2>
      <p>
        Leia os documentos públicos que explicam como o Auraxis trata dados, responsabilidades de
        uso e limites das análises financeiras.
      </p>
      <div class="privacy-center-page__legal-links">
        <NuxtLink to="/privacy">Política de Privacidade</NuxtLink>
        <NuxtLink to="/terms">Termos de uso</NuxtLink>
      </div>
    </UiSurfaceCard>

    <NModal
      v-model:show="showDeletionModal"
      preset="dialog"
      type="error"
      title="Confirmar solicitação de exclusão"
      :mask-closable="!deletionMutation.isPending.value"
      :close-on-esc="!deletionMutation.isPending.value"
      @close="closeDeletionModal"
    >
      <div class="privacy-deletion-modal">
        <p>
          Para proteger sua conta, confirme sua senha. A solicitação será registrada e processada
          conforme a política de retenção aplicável.
        </p>
        <label>
          <span>Senha atual</span>
          <NInput
            id="privacy-delete-password"
            v-model:value="deletionPassword"
            type="password"
            show-password-on="click"
            placeholder="Digite sua senha"
            :disabled="deletionMutation.isPending.value"
            @keyup.enter="submitDeletionRequest"
          />
        </label>
        <label>
          <span>Motivo (opcional)</span>
          <NInput
            v-model:value="deletionReason"
            type="textarea"
            placeholder="Conte brevemente por que deseja excluir os dados"
            :autosize="{ minRows: 3, maxRows: 5 }"
            :disabled="deletionMutation.isPending.value"
          />
        </label>
      </div>

      <template #action>
        <div class="privacy-deletion-modal__actions">
          <NButton :disabled="deletionMutation.isPending.value" @click="closeDeletionModal">
            Cancelar
          </NButton>
          <NButton
            type="error"
            :disabled="deletionDisabled"
            :loading="deletionMutation.isPending.value"
            @click="submitDeletionRequest"
          >
            Enviar solicitação
          </NButton>
        </div>
      </template>
    </NModal>
  </div>
</template>

<style scoped>
@import "~/assets/css/settings.css";

.privacy-center-page {
  gap: var(--space-4);
}

.privacy-center-page__header {
  align-items: center;
}

.privacy-center-page__notice {
  max-width: 960px;
}

.privacy-center-page__summary {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--space-3);
}

.privacy-center-page__metric {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  color: var(--color-brand-600);
}

.privacy-center-page__metric strong,
.privacy-center-page__metric span {
  display: block;
}

.privacy-center-page__metric strong {
  color: var(--color-text-primary);
  font-size: var(--font-size-lg);
}

.privacy-center-page__metric span {
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
}

.privacy-center-page__section,
.privacy-center-page__legal {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.privacy-center-page__section-header h2,
.privacy-center-page__action-copy h2,
.privacy-center-page__legal h2 {
  margin: 0;
  color: var(--color-text-primary);
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
}

.privacy-center-page__section-header p,
.privacy-center-page__action-copy p,
.privacy-center-page__legal p {
  margin: 4px 0 0;
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
  line-height: 1.55;
}

.privacy-center-page__loading {
  max-width: 680px;
}

.privacy-center-page__retry {
  align-self: flex-start;
}

.privacy-center-page__consents {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--space-3);
}

.privacy-center-page__consent-card {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  padding: var(--space-3);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background: color-mix(in srgb, var(--color-surface-elevated) 86%, transparent);
}

.privacy-center-page__consent-main {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-2);
}

.privacy-center-page__consent-main h3 {
  margin: 0;
  color: var(--color-text-primary);
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-semibold);
}

.privacy-center-page__consent-main p {
  margin: 4px 0 0;
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
  line-height: 1.45;
}

.privacy-center-page__consent-meta {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--space-2);
  margin: 0;
}

.privacy-center-page__consent-meta dt {
  color: var(--color-text-muted);
  font-size: var(--font-size-xs);
}

.privacy-center-page__consent-meta dd {
  margin: 3px 0 0;
  color: var(--color-text-primary);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
}

.privacy-center-page__actions {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--space-3);
}

.privacy-center-page__action-card {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  gap: var(--space-3);
  align-items: flex-start;
}

.privacy-center-page__action-card--danger {
  border-color: color-mix(in srgb, var(--color-negative) 42%, var(--color-border)) !important;
}

.privacy-center-page__action-icon {
  display: grid;
  width: 44px;
  height: 44px;
  place-items: center;
  border-radius: var(--radius-lg);
  background: color-mix(in srgb, var(--color-brand-600) 14%, transparent);
  color: var(--color-brand-600);
}

.privacy-center-page__action-icon--danger {
  background: var(--color-negative-bg);
  color: var(--color-negative);
}

.privacy-center-page__action-copy {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.privacy-center-page__legal-links {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}

.privacy-center-page__legal-links a {
  color: var(--color-brand-600);
  font-weight: var(--font-weight-semibold);
  text-decoration: none;
}

.privacy-center-page__legal-links a:hover {
  text-decoration: underline;
}

.privacy-deletion-modal {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  padding-top: var(--space-2);
}

.privacy-deletion-modal p {
  margin: 0;
  color: var(--color-text-primary);
  line-height: 1.55;
}

.privacy-deletion-modal label {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.privacy-deletion-modal label span {
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
}

.privacy-deletion-modal__actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-2);
}

@media (max-width: 960px) {
  .privacy-center-page__summary,
  .privacy-center-page__actions,
  .privacy-center-page__consents {
    grid-template-columns: 1fr;
  }

  .privacy-center-page__action-card {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .privacy-center-page__consent-main,
  .privacy-deletion-modal__actions {
    align-items: stretch;
    flex-direction: column;
  }

  .privacy-center-page__consent-meta {
    grid-template-columns: 1fr;
  }
}
</style>
