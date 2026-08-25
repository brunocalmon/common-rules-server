import { describe, it, expect } from "vitest";
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, writeFileSync, chmodSync } from "node:fs";
import { tmpdir } from "node:os";
import { resolve, join } from "node:path";
import { readHook } from "../src/hooks/source";

const CORPUS = resolve(__dirname, "../specs/defined/0003-fatia-1b-setup-hooks/research/hooks-v028");

// Executa o guard de verdade. Verificar que o texto gerado contém a string
// esperada não prova bloqueio: foi assim que o defeito da v0.2.8 passou.
function rodarGuard(nome: string, comando: string): number {
  const hook = readHook(readFileSync(resolve(CORPUS, `${nome}.md`), "utf8"));
  const dir = mkdtempSync(join(tmpdir(), "guard-"));
  const alvo = join(dir, "guard.sh");
  writeFileSync(alvo, hook.script);
  chmodSync(alvo, 0o755);
  try {
    execFileSync("bash", [alvo], { input: JSON.stringify({ command: comando }), encoding: "utf8" });
    return 0;
  } catch (e: unknown) {
    return (e as { status?: number }).status ?? 1;
  }
}

describe("AC-003 — trabalho comum continua permitido", () => {
  // SPECSFY: US-002 FR-003 FR-006 AC-003
  it("permite editar um arquivo de credencial, porque editar não é exibir", () => {
    expect(rodarGuard("guard-secrets", "vim .env")).toBe(0);
  });

  // SPECSFY: US-002 FR-003 FR-006 AC-003
  it("permite remoção comum de arquivo dentro do projeto", () => {
    expect(rodarGuard("guard-destructive", "rm dist/cli.js")).toBe(0);
  });

  // SPECSFY: US-002 FR-006 AC-003
  it("permite comando ordinário que apenas menciona o caminho protegido", () => {
    expect(rodarGuard("guard-secrets", "grep -l KEY .env.example")).toBe(0);
  });
});
