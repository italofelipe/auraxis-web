#!/usr/bin/env bash
# DEC-186 — enforce locale EN freeze during MVP1.
#
# The English locale is frozen during MVP1 delivery: PT-BR is the only actively
# maintained locale. Any change to `app/i18n/locales/en.json` must be an
# explicit, reviewed exception.
#
# This script verifies that `app/i18n/locales/en.json` matches the recorded
# SHA-256 baseline at `app/i18n/locales/.en-frozen.sha256`. It exits 0 on
# match, 1 on mismatch.
#
# Legit update path (rare):
# 1. Update `en.json`.
# 2. Regenerate the baseline:
#    `shasum -a 256 app/i18n/locales/en.json | awk '{print $1}' > app/i18n/locales/.en-frozen.sha256`
# 3. Include the marker `[en-freeze-bypass]` in the commit message AND mention
#    it in the PR description so reviewers know the exception was intentional.
# 4. Re-run this script locally — it will exit 0 once the baseline matches.
#
# CI bypass: the workflow step that calls this script greps the PR head commit
# subject for `[en-freeze-bypass]` and skips the check when present. Keep that
# bypass rare — every use is a deviation from the MVP1 contract.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
LOCALE_FILE="${ROOT}/app/i18n/locales/en.json"
BASELINE_FILE="${ROOT}/app/i18n/locales/.en-frozen.sha256"

if [[ ! -f "${LOCALE_FILE}" ]]; then
  echo "[dec-02] en.json not found at ${LOCALE_FILE}" >&2
  exit 1
fi

if [[ ! -f "${BASELINE_FILE}" ]]; then
  echo "[dec-02] baseline file not found at ${BASELINE_FILE}" >&2
  echo "[dec-02] regenerate with: shasum -a 256 '${LOCALE_FILE}' | awk '{print \$1}' > '${BASELINE_FILE}'" >&2
  exit 1
fi

if ! command -v shasum >/dev/null 2>&1; then
  echo "[dec-02] 'shasum' not on PATH — cannot verify locale freeze." >&2
  exit 1
fi

actual="$(shasum -a 256 "${LOCALE_FILE}" | awk '{print $1}')"
expected="$(tr -d '[:space:]' < "${BASELINE_FILE}")"

if [[ "${actual}" == "${expected}" ]]; then
  echo "[dec-02] en.json matches frozen baseline (${expected:0:12}…)"
  exit 0
fi

cat <<MSG >&2
[dec-02] locale EN freeze violation (DEC-186)

  file      : ${LOCALE_FILE}
  expected  : ${expected}
  actual    : ${actual}

The English locale is frozen during MVP1. If this change is an approved
exception, include '[en-freeze-bypass]' in the commit subject AND update the
baseline file at ${BASELINE_FILE} to the new SHA-256 (regen command in the
header of this script). Otherwise revert the change to en.json.
MSG
exit 1
