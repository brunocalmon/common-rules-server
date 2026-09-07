import type { CliBackendAdapter } from "./adapter.js";

/**
 * `goose run --help`: `-i`/`--instructions` ou `-t`/`--text`, `--system`,
 * `--output-format json`, `--model`. Sem allowlist de tools.
 *
 * `run` é subcomando obrigatório — confirmado por execução real: `goose
 * --text ...` sem `run` recusa com "unexpected argument '--text'".
 * `--text` carrega a tarefa; `--system` carrega o comportamento composto —
 * papéis distintos, ambos exigidos pelo adaptador.
 */
export const goose: CliBackendAdapter = {
  name: "goose",
  injectsBehaviorByFlag: true,
  supportsToolsAllowlist: false,
  buildArgs: (brief) => [
    "run",
    "--text",
    brief.task ?? "",
    "--system",
    brief.behavior,
    "--output-format",
    "json",
    "--model",
    brief.model ?? "",
  ],
};
