import type { CliBackendAdapter } from "./adapter.js";

/**
 * `codex exec --help`: prompt por argumento ou stdin, `--json` (eventos
 * JSONL), `-m`/`--model`, `--sandbox` (modo, não lista de tools). Nenhuma
 * flag de system prompt — o comportamento vai por `AGENTS.md` temporário
 * (`SPEC-0019`, `FR-002`).
 */
export const codex: CliBackendAdapter = {
  name: "codex",
  injectsBehaviorByFlag: false,
  supportsToolsAllowlist: false,
  buildArgs: (brief) => ["exec", "--json", "--model", brief.model ?? "", brief.task ?? ""],
};
