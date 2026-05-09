#!/usr/bin/env python3
"""auraxis-web pre-tool-use hook."""
from __future__ import annotations
import json, re, sys

def main() -> None:
    try:
        data = json.load(sys.stdin)
    except (json.JSONDecodeError, ValueError):
        sys.exit(0)
    tool_name = data.get("tool_name", "")
    tool_input = data.get("tool_input", {})
    if tool_name == "Bash":
        _check_bash(tool_input.get("command", ""))
    elif tool_name in ("Write", "Edit"):
        content = tool_input.get("content", "") or tool_input.get("new_string", "")
        _check_file_write(tool_input.get("file_path", ""), content=content)

def _check_bash(command: str) -> None:
    hard_blocks = [
        (r"git add \.(\s|$)", "BLOQUEADO: 'git add .' proibido. Use: git add <arquivo>"),
        (r"git add -A(\s|$)", "BLOQUEADO: 'git add -A' proibido."),
        (r"git add --all(\s|$)", "BLOQUEADO: 'git add --all' proibido."),
        (r"git push --force", "BLOQUEADO: push --force requer aprovação humana."),
        (r"git push -f(\s|$)", "BLOQUEADO: push -f requer aprovação humana."),
        (r"git commit --no-verify", "BLOQUEADO: --no-verify pula quality gates."),
        (r"git commit -n(\s|$)", "BLOQUEADO: -n pula quality gates."),
        (r"git push\s+(\S+\s+)?(main|master)(\s|$)", "BLOQUEADO: push direto para main/master. Use PR."),
    ]
    soft_warns = [
        (r"git reset --hard", "⚠️ AVISO: git reset --hard é destrutivo."),
        (r"rm -rf", "⚠️ AVISO: rm -rf é destrutivo."),
        (r"git clean -f", "⚠️ AVISO: git clean -f remove arquivos permanentemente."),
    ]
    for pattern, msg in hard_blocks:
        if re.search(pattern, command):
            print(msg, file=sys.stderr); sys.exit(2)
    for pattern, msg in soft_warns:
        if re.search(pattern, command):
            print(msg, file=sys.stderr)

_ENV_FILE_RE = re.compile(r"(^|/)\.env(?:\.(?!example$)[\w.-]+)?$")
_SENSITIVE = ("secrets.", "credentials.")
_TEST_DISABLE = ("skip(", "xit(", "xtest(", "xdescribe(")

def _check_file_write(file_path: str, content: str = "") -> None:
    for s in _SENSITIVE:
        if s in file_path:
            print(f"BLOQUEADO: escrita em '{file_path}' proibida.", file=sys.stderr); sys.exit(2)
    if _ENV_FILE_RE.search(file_path):
        print(f"BLOQUEADO: escrita em '{file_path}' proibida (.env).", file=sys.stderr); sys.exit(2)
    # EN locale freeze
    if file_path.endswith("locales/en.json"):
        print("⚠️ AVISO: en.json está CONGELADO (DEC-186).\nPara modificar: adicione '[en-freeze-bypass]' no commit subject E atualize .en-frozen.sha256", file=sys.stderr)
    # E2E CI gotcha
    if "ci.yml" in file_path:
        print("⚠️ AVISO: editando ci.yml.\nNão re-introduza 'download-artifact' no job E2E — ele deve fazer 'pnpm build' local.", file=sys.stderr)
    # Coverage regression
    if "vitest.config" in file_path or "nuxt.config" in file_path:
        print("⚠️ AVISO: editando config de qualidade. Não reduza threshold de 85%.", file=sys.stderr)
    # Test disable guard
    is_test = any(file_path.endswith(ext) for ext in (".spec.ts", ".test.ts", ".spec.vue"))
    if is_test and content:
        for dp in _TEST_DISABLE:
            if dp in content and "// reason:" not in content:
                print(f"BLOQUEADO: '{dp}' sem justificativa. Use // reason:", file=sys.stderr); sys.exit(2)

if __name__ == "__main__":
    main()
