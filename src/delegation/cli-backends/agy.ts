import type { CliBackendAdapter } from "./adapter.js";

/**
 * `agy --help`: `-p`/`--print`, `--output-format json`, `--model`,
 * `--dangerously-skip-permissions`. Nenhuma flag de system prompt nem de
 * allowlist de tools — o comportamento vai por `AGENTS.md` temporário
 * (`SPEC-0019`, `FR-002`).
 *
 * `--print` toma o próximo argumento como o prompt em si — confirmado por
 * execução real: colocar outra flag logo depois faz `agy` interpretar essa
 * flag como o prompt. A tarefa precisa vir imediatamente após `--print`.
 */
export const agy: CliBackendAdapter = {
  name: "agy",
  injectsBehaviorByFlag: false,
  supportsToolsAllowlist: false,
  buildArgs: (brief) => ["--print", brief.task ?? "", "--output-format", "json", "--model", brief.model ?? ""],
};
