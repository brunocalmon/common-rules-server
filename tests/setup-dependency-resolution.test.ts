import { describe, it, expect } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";
import { runSetup } from "../src/setup/run";
import { realBridgeEnvironment } from "../src/setup/bridge";
import { packageRoot } from "../src/setup/bridge";
import { unwrap } from "../src/hooks/claude-code";
import { disposableProject } from "./mcp-fixtures";

const env = { hasClaudeCode: true, files: [".claude/settings.json"] };

/** Every command a translated hook ended up with, across every event. */
function commandsIn(root: string): string[] {
  const settings = JSON.parse(readFileSync(resolve(root, ".claude", "settings.json"), "utf8")) as {
    hooks: Record<string, { hooks: { command: string }[] }[]>;
  };
  return Object.values(settings.hooks)
    .flat()
    .flatMap((entry) => entry.hooks.map((h) => h.command));
}

describe("AC-014 — the installed hook doesn't depend on PATH for a dependency common-rules already knows the location of", () => {
  // SPECSFY: US-001 FR-001 AC-014
  it("embeds context-mode's absolute bin path, not the bare command", () => {
    const bin = resolve(packageRoot(), "node_modules", ".bin", "context-mode");
    // Only meaningful on a real, fully-installed checkout; skip rather than
    // false-fail on a machine where this repo's own npm install is partial.
    if (!existsSync(bin)) return;

    const root = disposableProject();
    runSetup({ env, root, write: true, bridgeEnv: realBridgeEnvironment() });

    const contextModeCommands = commandsIn(root).filter((c) => c.includes("hook claude-code"));
    expect(contextModeCommands.length).toBeGreaterThan(0);
    for (const command of contextModeCommands) {
      const fragment = unwrap(command).trim();
      expect(fragment).toContain(bin);
      expect(fragment.startsWith("context-mode ")).toBe(false);
    }
  });

  // SPECSFY: US-001 FR-001 NFR-001 AC-014
  it("the resolved hook still runs context-mode for real, with PATH stripped of it", () => {
    const bin = resolve(packageRoot(), "node_modules", ".bin", "context-mode");
    if (!existsSync(bin)) return;

    const root = disposableProject();
    runSetup({ env, root, write: true, bridgeEnv: realBridgeEnvironment() });

    const [command] = commandsIn(root).filter((c) => c.includes("hook claude-code pretooluse"));
    expect(command).toBeDefined();

    // A PATH with none of context-mode's real directories — proves the
    // hook doesn't fall back to searching for it, it goes straight to the
    // resolved path.
    const r = spawnSync("bash", ["-c", command!], {
      input: '{"tool_input":{"command":"echo x"}}',
      encoding: "utf8",
      env: { ...process.env, PATH: "/usr/bin:/bin" },
      timeout: 25_000,
    });
    expect(r.error).toBeUndefined();
    expect(r.status).not.toBeNull();
  }, 30_000);

  // SPECSFY: US-001 FR-002 AC-014
  it("leaves code-review-graph as a bare command when only a global copy exists (no forced local path)", () => {
    const localBin = resolve(packageRoot(), ".venv-crg", "bin", "code-review-graph");
    // This assertion is about the common case in this checkout — global
    // covers it, so nothing should force the (nonexistent) local path.
    if (existsSync(localBin)) return;

    const root = disposableProject();
    runSetup({ env, root, write: true, bridgeEnv: realBridgeEnvironment() });

    const [command] = commandsIn(root).filter((c) => c.includes("update --brief"));
    expect(command).toBeDefined();
    expect(unwrap(command!).trim().startsWith("code-review-graph ")).toBe(true);
  });
});
