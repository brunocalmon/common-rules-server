import { describe, it, expect } from "vitest";
import { mkdtempSync, mkdirSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";

const cli = resolve(__dirname, "..", "dist", "cli.js");

function projetoComAlvo(): string {
  const raiz = mkdtempSync(join(tmpdir(), "crs-appr-"));
  mkdirSync(join(raiz, ".claude"), { recursive: true });
  return raiz;
}

describe("AC-075 — o comando real, sem canal injetado, aprova e escreve", () => {
  // SPECSFY: US-060 FR-060 FR-065 AC-075
  it("documento aprovando pela entrada padrão libera a escrita", () => {
    const raiz = projetoComAlvo();
    const r = spawnSync("node", [cli, "setup"], {
      cwd: raiz,
      encoding: "utf8",
      input: JSON.stringify({ approved: true }),
      timeout: 120_000,
    });
    expect(existsSync(join(raiz, ".claude", "settings.json"))).toBe(true);
    expect(r.stdout).not.toMatch(/não escrito/);
  }, 120_000);
});

describe("AC-076 — o comando real, sem canal injetado, recusa e não escreve", () => {
  // SPECSFY: US-061 FR-060 FR-064 NFR-060 AC-076
  it("entrada padrão vazia é negativa, sem escrita", () => {
    const raiz = projetoComAlvo();
    const r = spawnSync("node", [cli, "setup"], {
      cwd: raiz,
      encoding: "utf8",
      input: "",
      timeout: 120_000,
    });
    expect(existsSync(join(raiz, ".claude", "settings.json"))).toBe(false);
    expect(r.stdout + r.stderr).toMatch(/não escrito/);
    expect(r.status).not.toBe(0);
  }, 120_000);
});
