<script setup lang="ts">
import { computed } from "vue";

import UiImage from "~/components/ui/UiImage.vue";

import type { CreditCardBrand } from "../contracts/credit-card.dto";

const props = withDefaults(
  defineProps<{
    /** Bandeira do cartão; null cai no logo genérico. */
    brand: CreditCardBrand | null;
    /** Largura em px (a altura mantém a proporção 3:2). */
    width?: number;
  }>(),
  { width: 36 },
);

/** Rótulo acessível por bandeira. */
const BRAND_LABEL: Record<CreditCardBrand, string> = {
  visa: "Visa",
  mastercard: "Mastercard",
  elo: "Elo",
  hipercard: "Hipercard",
  amex: "American Express",
  other: "Cartão",
};

const brandKey = computed<CreditCardBrand>(() => props.brand ?? "other");
const src = computed<string>(() => `/assets/card-brands/${brandKey.value}.svg`);
const label = computed<string>(() => BRAND_LABEL[brandKey.value]);
const height = computed<number>(() => Math.round((props.width * 32) / 48));
</script>

<template>
  <UiImage
    :src="src"
    :alt="label"
    :width="props.width"
    :height="height"
    class="cc-brand-logo"
    data-testid="cc-brand-logo"
  />
</template>
