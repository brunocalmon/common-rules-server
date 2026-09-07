import type { CliBackendAdapter } from "./adapter.js";

/** `claude --help`: `-p`/`--print`, `--output-format json`, `--model`, `--system-prompt`, `--allowedTools`. */
export const claude: CliBackendAdapter = {
  name: "claude",
  injectsBehaviorByFlag: true,
  supportsToolsAllowlist: true,
  buildArgs: (brief) => [
    "--print",
    "--output-format",
    "json",
    "--model",
    brief.model ?? "",
    "--system-prompt",
    brief.behavior,
    ...(brief.tools.length ? ["--allowedTools", brief.tools.join(",")] : []),
    brief.task ?? "",
  ],
};
