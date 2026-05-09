## Descrição

<!-- Explique o que foi implementado e por quê. -->

Closes #<!-- número da issue -->

## Tipo de mudança

- [ ] Feature nova
- [ ] Bug fix
- [ ] Refactor
- [ ] Documentação / infraestrutura
- [ ] Outros: \_\_\_

## Checklist de qualidade

- [ ] `pnpm quality-check` passou localmente (lint + typecheck + coverage + build)
- [ ] Coverage **não** regrediu abaixo de 85%
- [ ] Testes unitários criados ou atualizados para o código novo
- [ ] Nenhum `xit()`, `xtest()` ou `skip()` sem `// reason:`

## Checklist de locale

- [ ] **Não modifiquei `en.json`** — OU —
- [ ] Modifiquei `en.json` com `[en-freeze-bypass]` no commit subject E atualizei `.en-frozen.sha256`

## Checklist de CI

- [ ] O job E2E builda o Nuxt **localmente** (não usa `download-artifact@v4`)
- [ ] Nenhum novo `download-artifact` adicionado ao `ci.yml`

## Screenshots / evidência (se UI)

<!-- Opcional — screenshot ou vídeo da mudança visual -->
