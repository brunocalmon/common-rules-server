import type { CliBackendAdapter } from "./adapter.js";

/** `pi --help`: `--print`/`-p`, `--mode json`, `--system-prompt`, `--model`, `--tools`. */
export const pi: CliBackendAdapter = {
  name: "pi",
  injectsBehaviorByFlag: true,
  supportsToolsAllowlist: true,
  buildArgs: (brief) => [
    "--print",
    "--mode",
    "json",
    "--model",
    brief.model ?? "",
    "--system-prompt",
    brief.behavior,
    ...(brief.tools.length ? ["--tools", brief.tools.join(",")] : []),
    brief.task ?? "",
  ],
};
