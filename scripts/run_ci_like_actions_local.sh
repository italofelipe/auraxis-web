#!/usr/bin/env bash
set -euo pipefail

# Run a local gate bundle that mirrors GitHub Actions CI as closely as possible.
#
# Default: Dockerized Node 22 environment for parity with ubuntu-latest jobs.
# Flags:
#   --local            Run in current shell environment
#   --with-lighthouse  Include Lighthouse run
#   --with-e2e         Include Playwright e2e run
#   --with-sonar       Include local sonar-scanner run
#   --help             Show usage

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

MODE="docker"
RUN_LIGHTHOUSE=0
RUN_E2E=0
RUN_SONAR=0

usage() {
  cat <<'USAGE'
Usage: bash scripts/run_ci_like_actions_local.sh [options]

Options:
  --local            Run checks in the current environment
  --with-lighthouse  Include Lighthouse checks
  --with-e2e         Include Playwright e2e checks
  --with-sonar       Include sonar-scanner execution
  --help             Show this help

Examples:
  bash scripts/run_ci_like_actions_local.sh
  bash scripts/run_ci_like_actions_local.sh --local
  bash scripts/run_ci_like_actions_local.sh --local --with-e2e
USAGE
}

require_command() {
  local cmd="$1"
  if ! command -v "$cmd" >/dev/null 2>&1; then
    echo "[ci-like-local] missing required command: $cmd" >&2
    exit 3
  fi
}

run_core_pipeline() {
  echo "[ci-like-local] step=install:pnpm"
  corepack enable
  corepack prepare pnpm@10.30.1 --activate
  pnpm install --frozen-lockfile

  echo "[ci-like-local] step=lint"
  pnpm lint

  echo "[ci-like-local] step=typecheck"
  pnpm typecheck

  echo "[ci-like-local] step=test:coverage"
  pnpm test:coverage

  echo "[ci-like-local] step=flags:hygiene"
  pnpm flags:check

  echo "[ci-like-local] step=frontend:governance"
  pnpm policy:check

  echo "[ci-like-local] step=build"
  pnpm build

  echo "[ci-like-local] step=audit-gate"
  node scripts/ci-audit-gate.cjs

  if [[ "$RUN_LIGHTHOUSE" -eq 1 ]]; then
    echo "[ci-like-local] step=lighthouse"
    pnpm dlx @lhci/cli autorun
  else
    echo "[ci-like-local] step=lighthouse skipped (use --with-lighthouse)"
  fi

  if [[ "$RUN_E2E" -eq 1 ]]; then
    echo "[ci-like-local] step=e2e"
    pnpm exec playwright install --with-deps chromium
    pnpm test:e2e
  else
    echo "[ci-like-local] step=e2e skipped (use --with-e2e)"
  fi

  if [[ "$RUN_SONAR" -eq 1 ]]; then
    require_command sonar-scanner

    if [[ -z "${SONAR_AURAXIS_WEB_TOKEN:-}" ]]; then
      echo "[ci-like-local] SONAR_AURAXIS_WEB_TOKEN is required for --with-sonar" >&2
      exit 4
    fi

    echo "[ci-like-local] step=sonar"
    SONAR_TOKEN="$SONAR_AURAXIS_WEB_TOKEN" sonar-scanner
  else
    echo "[ci-like-local] step=sonar skipped (use --with-sonar)"
  fi

  echo "[ci-like-local] all selected checks passed (local mode)."
}

run_in_docker() {
  require_command docker

  if [[ "$RUN_LIGHTHOUSE" -eq 1 || "$RUN_E2E" -eq 1 ]]; then
    echo "[ci-like-local] --with-lighthouse and --with-e2e are supported only with --local." >&2
    echo "[ci-like-local] use local mode for browser/runtime dependent checks." >&2
    exit 4
  fi

  local args=("--local")
  if [[ "$RUN_SONAR" -eq 1 ]]; then
    args+=("--with-sonar")
  fi

  echo "[ci-like-local] running in node:22-bookworm container..."
  docker run --rm \
    -v "$ROOT_DIR:/workspace" \
    -w /workspace \
    -e SONAR_AURAXIS_WEB_TOKEN="${SONAR_AURAXIS_WEB_TOKEN:-}" \
    node:22-bookworm \
    bash -lc "bash scripts/run_ci_like_actions_local.sh ${args[*]}"

  echo "[ci-like-local] all selected checks passed (docker mode)."
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --)
      shift
      ;;
    --local)
      MODE="local"
      shift
      ;;
    --with-lighthouse)
      RUN_LIGHTHOUSE=1
      shift
      ;;
    --with-e2e)
      RUN_E2E=1
      shift
      ;;
    --with-sonar)
      RUN_SONAR=1
      shift
      ;;
    --help|-h)
      usage
      exit 0
      ;;
    *)
      echo "Unknown option: $1" >&2
      usage
      exit 2
      ;;
  esac
done

if [[ "$MODE" == "docker" ]]; then
  run_in_docker
else
  run_core_pipeline
fi
