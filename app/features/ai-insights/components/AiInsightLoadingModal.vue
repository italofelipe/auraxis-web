<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from "vue";
import { NModal, NSpin } from "naive-ui";

const props = defineProps<{
  modelValue: boolean;
}>();

const emit = defineEmits<{
  "update:modelValue": [value: boolean];
}>();

const financialFacts = [
  "Guardar só 10% da sua renda por 30 anos pode gerar mais de R$ 500 mil.",
  "A regra 50/30/20 destina 50% às necessidades, 30% aos desejos e 20% às economias.",
  "Investidores que vendem na crise costumam perder mais do que os que ficam.",
  "O efeito dos juros compostos dobra seu dinheiro a cada 72 ÷ taxa% anos.",
  "Ter 3 a 6 meses de despesas em reserva é a base da saúde financeira.",
  "R$ 5 por dia economizados equivalem a R$ 1.825 por ano.",
  "Cartão de crédito rotativo tem juros médios de 430% ao ano no Brasil.",
  "Diversificar investimentos reduz o risco sem reduzir o retorno esperado.",
  "Inflação de 5% ao ano reduz pela metade o poder de compra em 14 anos.",
  "Automatizar transferências para poupança é mais eficaz do que tentar lembrar.",
  "Tesouro Selic rende mais que poupança e tem liquidez diária.",
  "Renegociar dívidas antes de investir quase sempre compensa mais.",
  "O custo emocional de compras por impulso costuma superar o valor do produto.",
  "Pequenos gastos diários somam valores expressivos no ano.",
  "Revisar assinaturas mensalmente pode liberar R$ 100-300 sem esforço.",
  "Fundos imobiliários distribuem rendimentos mensais isentos de IR para PF.",
  "O FGTS rende 3% ao ano, menos que a inflação na maioria dos anos.",
  "Metas financeiras escritas têm 42% mais chance de serem alcançadas.",
  "Planos de saúde sobem em média 10% ao ano; provisionar é essencial.",
  "Consolidar dívidas em uma taxa menor pode reduzir o pagamento mensal em 30%.",
] as const;

const factIndex = ref(0);
let intervalId: ReturnType<typeof setInterval> | null = null;

const currentFact = computed(() => financialFacts[factIndex.value] ?? financialFacts[0]);

/**
 * Stops the rotating financial fact timer.
 */
const stopRotation = (): void => {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
};

/**
 * Starts rotating financial facts while the loading modal is visible.
 */
const startRotation = (): void => {
  stopRotation();
  intervalId = setInterval(() => {
    factIndex.value = (factIndex.value + 1) % financialFacts.length;
  }, 3_000);
};

watch(
  () => props.modelValue,
  (isOpen) => {
    if (isOpen) {
      startRotation();
      return;
    }
    stopRotation();
    factIndex.value = 0;
  },
  { immediate: true },
);

onBeforeUnmount(stopRotation);
</script>

<template>
  <NModal
    :show="modelValue"
    preset="card"
    class="ai-insight-loading-modal"
    :closable="false"
    :mask-closable="false"
    @update:show="emit('update:modelValue', $event)"
  >
    <div class="ai-insight-loading-modal__body" role="status" aria-live="polite">
      <NSpin size="large" />
      <div class="ai-insight-loading-modal__copy">
        <h3>Analisando seus dados...</h3>
        <Transition name="ai-fade" mode="out-in">
          <p :key="currentFact">{{ currentFact }}</p>
        </Transition>
      </div>
    </div>
  </NModal>
</template>

<style scoped>
.ai-insight-loading-modal {
  max-width: 440px;
}

.ai-insight-loading-modal__body {
  display: grid;
  justify-items: center;
  gap: var(--space-4);
  padding: var(--space-5) var(--space-3);
  text-align: center;
}

.ai-insight-loading-modal__copy {
  display: grid;
  gap: var(--space-2);
}

.ai-insight-loading-modal__copy h3,
.ai-insight-loading-modal__copy p {
  margin: 0;
}

.ai-insight-loading-modal__copy h3 {
  color: var(--color-text-primary);
  font-size: var(--font-size-body-lg);
}

.ai-insight-loading-modal__copy p {
  color: var(--color-text-secondary);
  line-height: 1.5;
}

.ai-fade-enter-active,
.ai-fade-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.ai-fade-enter-from,
.ai-fade-leave-to {
  opacity: 0;
  transform: translateY(4px);
}
</style>
