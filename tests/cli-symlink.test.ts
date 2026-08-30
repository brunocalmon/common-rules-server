import { describe, it, expect } from "vitest";
import { mkdtempSync, symlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";

/**
 * Invoca o CLI através de um link simbólico real, no mesmo padrão que
 * `npm link` e `npm install -g` produzem para todo pacote instalado
 * globalmente. Execução direta do caminho real nunca exercitou este caso.
 */
function viaLink(...args: string[]): { stdout: string; stderr: string; status: number | null } {
  const cliReal = resolve(__dirname, "..", "dist", "cli.js");
  const dir = mkdtempSync(join(tmpdir(), "crs-link-"));
  const link = join(dir, "common-rules");
  symlinkSync(cliReal, link);
  const r = spawnSync("node", [link, ...args], { encoding: "utf8" });
  return { stdout: r.stdout, stderr: r.stderr, status: r.status };
}

describe("AC-008 — o binário responde quando invocado por link simbólico", () => {
  // SPECSFY: US-001 FR-005 AC-008
  it("--version produz saída e sai com zero", () => {
    const r = viaLink("--version");
    expect(r.status).toBe(0);
    expect(r.stdout.trim().length).toBeGreaterThan(0);
  });

  // SPECSFY: US-002 FR-006 AC-008
  it("doctor produz saída", () => {
    const r = viaLink("doctor");
    expect((r.stdout + r.stderr).trim().length).toBeGreaterThan(0);
  });

  // SPECSFY: US-001 US-002 NFR-003 AC-008
  it("a saída por link coincide com a saída por caminho direto", () => {
    const cliReal = resolve(__dirname, "..", "dist", "cli.js");
    const direto = spawnSync("node", [cliReal, "--version"], { encoding: "utf8" });
    const link = viaLink("--version");
    expect(link.stdout).toBe(direto.stdout);
    expect(link.status).toBe(direto.status);
  });
});
