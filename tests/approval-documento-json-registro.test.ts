import { describe, it, expect } from "vitest";
import { mkdtempSync, mkdirSync, rmSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";

const cli = resolve(__dirname, "..", "dist", "cli.js");
const aprovado = JSON.stringify({ approved: true });

function projetoComAlvo(): string {
  const raiz = mkdtempSync(join(tmpdir(), "crs-registro-"));
  mkdirSync(join(raiz, ".claude"), { recursive: true });
  return raiz;
}

function rodar(raiz: string, input: string) {
  return spawnSync("node", [cli, "setup"], { cwd: raiz, encoding: "utf8", input, timeout: 120_000 });
}

describe("AC-118 — execução por documento JSON usa o mesmo registro", () => {
  // SPECSFY: US-070 US-071 US-072 FR-071 FR-074 NFR-071 AC-118
  it("com o comando de skills já registrado, drift não pede aprovação de novo mesmo sem documento", () => {
    const raiz = projetoComAlvo();
    rodar(raiz, aprovado);
    expect(existsSync(join(raiz, ".common-rules", "approved-commands.json"))).toBe(true);

    rmSync(join(raiz, ".claude", "skills"), { recursive: true, force: true });

    const segunda = rodar(raiz, "");
    expect(segunda.status).toBe(0);
    expect(existsSync(join(raiz, ".claude", "skills"))).toBe(true);
  }, 180_000);
});
