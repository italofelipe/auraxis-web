<template>
  <ChakraBox border-radius="md" bg="white" border-width="1px" border-color="gray.200" box-shadow="md" p={4}>
    <header v-if="title" class="base-card__header">
      <ChakraHeading size="md" display="flex" align-items="center" justify-content="space-between">
        {{ title }}
        <slot name="header-extra" />
      </ChakraHeading>
    </header>
    <slot />
  </ChakraBox>
</template>

<script setup lang="ts">
import { ChakraBox, ChakraHeading } from "@chakra-ui/vue-next";

interface Props {
  title?: string;
}

defineProps<Props>();
</script>

<style scoped>
.base-card__header {
  margin-bottom: var(--space-2);
}
</style>
