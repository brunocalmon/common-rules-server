import { describe, it, expect } from "vitest";
import { mkdtempSync, mkdirSync, existsSync, readdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";

/**
 * Ponta a ponta real: nenhum `Executor` é injetado. É o mesmo comando que a
 * pessoa responsável rodou manualmente para descobrir que o `setup` nunca
 * instalava nada — timeout generoso pelo mesmo motivo de
 * `tests/hooks-context-mode-comando.test.ts`: dois subprocessos reais de
 * terceiro, sob carga de suíte completa.
 *
 * `input` aprova pela entrada padrão: desde a reabertura da SPEC-0007,
 * `formatSetup()` também liga `approval` real, e sem isso a execução seria
 * lida como documento vazio — recusa, sem escrita.
 */
describe("AC-036 / AC-038 — common-rules setup, de ponta a ponta, sem fixture", () => {
  it("instala as duas origens de skills e o framework Specsfy de verdade", () => {
    const raiz = mkdtempSync(join(tmpdir(), "crs-e2e-"));
    mkdirSync(join(raiz, ".claude"), { recursive: true });
    const cli = resolve(__dirname, "..", "dist", "cli.js");

    const r = spawnSync("node", [cli, "setup"], {
      cwd: raiz,
      encoding: "utf8",
      input: JSON.stringify({ approved: true }),
      timeout: 120_000,
    });
    expect(r.status).toBe(0);

    const skills = existsSync(join(raiz, ".claude", "skills")) ? readdirSync(join(raiz, ".claude", "skills")) : [];
    expect(skills.some((n) => n === "ask-matt" || n === "code-review")).toBe(true);
    expect(skills.some((n) => n.startsWith("specsfy-"))).toBe(true);

    expect(existsSync(join(raiz, ".specsfy"))).toBe(true);
    expect(existsSync(join(raiz, ".agents", "skills"))).toBe(true);
    expect(existsSync(join(raiz, "CLAUDE.md"))).toBe(true);
    expect(existsSync(join(raiz, "AGENTS.md"))).toBe(true);
  }, 120_000);
});
