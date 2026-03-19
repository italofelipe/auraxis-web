# Server-State Patterns — auraxis-web

## Padrão canônico: TanStack Query

O `@tanstack/vue-query` é a única biblioteca de server-state no auraxis-web.
Use para: fetching de dados remotos, cache, refetch automático, mutations com invalidação.

**Pinia** (`@pinia/nuxt`) é mantida exclusivamente para client-state (session, toolContext, UI state).
Não use Pinia para dados que vêm da API.

---

## Query básica

```ts
// app/features/[feature]/queries/useFeatureQuery.ts
import { useQuery } from "@tanstack/vue-query";
import { featureApi } from "../api/featureApi";

export function useFeatureQuery(id: MaybeRef<string>) {
  return useQuery({
    queryKey: ["feature", id],
    queryFn: () => featureApi.getById(toValue(id)),
    staleTime: 1000 * 60 * 5, // 5 min
  });
}
```

## Mutation com invalidação

```ts
// app/features/[feature]/queries/useCreateFeature.ts
import { useMutation, useQueryClient } from "@tanstack/vue-query";
import { featureApi } from "../api/featureApi";

export function useCreateFeature() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: featureApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["feature"] });
    },
  });
}
```

## Chaves de query

Convenção de chaves:

- Lista: `["recurso"]`
- Item: `["recurso", id]`
- Filtrado: `["recurso", { filtros }]`

Nunca use strings soltas como chave única. Sempre array.

## O que NÃO fazer

```ts
// ❌ Não use @pinia/colada
import { useQuery } from "@pinia/colada";

// ❌ Não faça fetch diretamente em setup() sem query
const data = await $fetch("/api/something");

// ✅ Use TanStack Query
import { useQuery } from "@tanstack/vue-query";
```
