# WEB9 — Docker Runbook (Nuxt)

## Objetivo

Padronizar execucao local e validacao de build em CI para o frontend web.

## Artefatos

- `Dockerfile` com targets `dev` e `runner`
- `.dockerignore`
- `docker-compose.yml` (`web-dev` e `web-prod`)

## Execucao local

### 1) Desenvolvimento (hot reload)

```bash
docker compose up web-dev
```

App disponivel em `http://localhost:3000`.

### 2) Runtime de producao local

```bash
docker compose up --build web-prod
```

App disponivel em `http://localhost:3001`.

## Build manual de imagem

### Runtime de producao

```bash
docker build --target runner -t auraxis-web:runner .
```

### Imagem de desenvolvimento

```bash
docker build --target dev -t auraxis-web:dev .
```

## Variaveis de ambiente

- `NUXT_PUBLIC_API_BASE` (publica): base da API consumida no browser.
- Em ambiente Docker local, default: `http://host.docker.internal:5000`.

## Notas de CI

- O CI valida build da imagem `runner` e `dev` no job dedicado de Docker.
- Falha no build de imagem bloqueia merge via status gate.
