# Known Issues — auraxis-web

Armadilhas documentadas com base em incidentes reais. Consulte antes de abrir PR.

---

## CI Gotchas

### E2E job: não use `download-artifact@v4`

**Sintoma:** CI falha com `Artifact not found for name: nuxt-build` mesmo com Build job bem-sucedido.

**Causa:** `download-artifact@v4` não encontra artifacts do mesmo run em certos contextos (re-tentativas, PR runners).

**Solução:** O job `e2e` em `ci.yml` deve sempre fazer `pnpm build` localmente:

```yaml
- name: Build Nuxt app
  run: pnpm build
  env:
    NODE_ENV: production
```

**Nunca** substituir por `download-artifact`. Referência: PRs #808, #809, #810.

---

## Locale Gotchas

### Modificar `en.json` sem bypass

**Sintoma:** CI falha no job `Locale EN Freeze (DEC-186)` com "locale EN freeze violation".

**Causa:** `app/i18n/locales/en.json` está congelado durante MVP1. Qualquer mudança quebra o SHA-256 de referência.

**Solução:** Para modificar EN legitimamente:

1. Adicionar `[en-freeze-bypass]` no subject do commit
2. Regenerar o SHA: `sha256sum app/i18n/locales/en.json | awk '{print $1}' > app/i18n/locales/.en-frozen.sha256`
3. Commitar ambos

**Atalho:** Não modificar `en.json` durante MVP1. Adicionar chaves apenas em `pt.json`.

---

## Git Gotchas

### `git add .` ou `git add -A`

**Sintoma:** Hook bloqueia com "BLOQUEADO: git add . é proibido."

**Causa:** Stage em massa pode incluir arquivos sensíveis, gerados ou não intencionais.

**Solução:** Sempre stage seletivo:

```bash
git add app/features/transactions/components/TransactionCard.vue
git add app/features/transactions/components/TransactionCard.spec.ts
```

---

## Naive UI Gotchas

### Usar `useMessage()` diretamente

**Sintoma:** Toast não aparece ou aparece sem estilo correto, erro no console sobre `NMessageProvider`.

**Causa:** `useMessage()` requer que `NMessageProvider` esteja na árvore de componentes. O wrapper do projeto garante isso.

**Solução:** Sempre usar `useToast()` de `app/composables/useToast/`:

```typescript
import { useToast } from "~/composables/useToast";
const toast = useToast();
toast.success("Salvo com sucesso");
```

### `<img>` diretamente no template

**Sintoma:** Lint falha com "Use UiImage instead of raw img".

**Solução:** Usar `<UiImage>` em vez de `<img>`.

---

## Referência rápida

| Problema                  | Solução                                       |
| ------------------------- | --------------------------------------------- |
| E2E artifact not found    | Build local no job E2E, não download-artifact |
| EN locale freeze          | [en-freeze-bypass] + update .en-frozen.sha256 |
| git add . bloqueado       | git add arquivo-especifico                    |
| useMessage() não funciona | usar useToast() composable                    |
| img tag proibida          | usar UiImage component                        |
