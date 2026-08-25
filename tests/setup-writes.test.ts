import { describe, it, expect } from "vitest";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { runSetup, TARGET_SETTINGS } from "../src/setup/run";
import { RECORD_PATH } from "../src/setup/record";

const env = { hasClaudeCode: true, files: [".claude/settings.json"] };

/** Projeto descartável, para que a verificação toque disco sem tocar o real. */
function projeto(conteudoPrevio?: string): string {
  const root = mkdtempSync(join(tmpdir(), "setup-"));
  mkdirSync(resolve(root, ".claude"), { recursive: true });
  if (conteudoPrevio !== undefined) writeFileSync(resolve(root, TARGET_SETTINGS), conteudoPrevio);
  return root;
}

describe("AC-001 — a instalação escreve de fato no disco", () => {
  // SPECSFY: US-001 FR-002 FR-004 AC-001
  it("cria o arquivo de configuração do alvo", () => {
    const root = projeto();
    runSetup({ env, root, write: true });
    expect(existsSync(resolve(root, TARGET_SETTINGS))).toBe(true);
  });

  // SPECSFY: US-003 FR-004 AC-004
  it("cria o registro de instalação", () => {
    const root = projeto();
    runSetup({ env, root, write: true });
    expect(existsSync(resolve(root, RECORD_PATH))).toBe(true);
  });

  // SPECSFY: US-001 FR-002 AC-001
  it("grava os sete hooks no arquivo escrito", () => {
    const root = projeto();
    runSetup({ env, root, write: true });
    const escrito = JSON.parse(readFileSync(resolve(root, TARGET_SETTINGS), "utf8")) as {
      hooks: Record<string, { matcher: string }[]>;
    };
    const nomes = Object.values(escrito.hooks).flat().map((e) => e.matcher);
    expect(nomes).toHaveLength(7);
  });

  // SPECSFY: US-001 FR-002 NFR-002 AC-001
  it("preserva chave de terceiro que já estava no arquivo", () => {
    const root = projeto(JSON.stringify({ permissions: { allow: ["Bash"] }, hooks: {} }));
    runSetup({ env, root, write: true });
    const escrito = JSON.parse(readFileSync(resolve(root, TARGET_SETTINGS), "utf8")) as {
      permissions?: unknown;
    };
    expect(escrito.permissions).toEqual({ allow: ["Bash"] });
  });

  // SPECSFY: US-003 FR-007 NFR-002 AC-007
  it("não escreve arquivo algum em modo de ensaio", () => {
    const root = projeto();
    runSetup({ env, root, write: true, dryRun: true });
    expect(existsSync(resolve(root, TARGET_SETTINGS))).toBe(false);
    expect(existsSync(resolve(root, RECORD_PATH))).toBe(false);
  });
});
