import { describe, it, expect } from "vitest";
import { mkdtempSync, mkdirSync, rmSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";

const cli = resolve(__dirname, "..", "dist", "cli.js");
const aprovado = JSON.stringify({ approved: true });

function projetoComAlvo(): string {
  const raiz = mkdtempSync(join(tmpdir(), "crs-drift-"));
  mkdirSync(join(raiz, ".claude"), { recursive: true });
  return raiz;
}

function rodar(raiz: string) {
  return spawnSync("node", [cli, "setup"], { cwd: raiz, encoding: "utf8", input: aprovado, timeout: 120_000 });
}

describe("AC-077 — skills apagadas são restauradas mesmo com hooks já configurados", () => {
  // SPECSFY: US-020 FR-030 AC-077
  it("rm -rf .claude/skills seguido de setup restaura as skills", () => {
    const raiz = projetoComAlvo();
    rodar(raiz);
    expect(existsSync(join(raiz, ".claude", "skills"))).toBe(true);

    rmSync(join(raiz, ".claude", "skills"), { recursive: true, force: true });
    expect(existsSync(join(raiz, ".claude", "skills"))).toBe(false);

    const segunda = rodar(raiz);
    expect(segunda.stdout).not.toMatch(/^já estava configurado/);
    expect(existsSync(join(raiz, ".claude", "skills"))).toBe(true);
  }, 180_000);
});

describe("AC-078 — framework Specsfy apagado é restaurado mesmo com hooks já configurados", () => {
  // SPECSFY: US-023 FR-030 AC-078
  it("rm -rf .specsfy seguido de setup restaura o framework", () => {
    const raiz = projetoComAlvo();
    rodar(raiz);
    expect(existsSync(join(raiz, ".specsfy"))).toBe(true);

    rmSync(join(raiz, ".specsfy"), { recursive: true, force: true });
    expect(existsSync(join(raiz, ".specsfy"))).toBe(false);

    const segunda = rodar(raiz);
    expect(segunda.stdout).not.toMatch(/^já estava configurado/);
    expect(existsSync(join(raiz, ".specsfy"))).toBe(true);
  }, 180_000);
});
