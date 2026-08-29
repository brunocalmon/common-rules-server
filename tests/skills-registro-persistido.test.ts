import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { runSetup } from "../src/setup/run";
import { detectEnvironment } from "../src/setup/env";
import { projetoComSkills, executorFalso, CONJUNTO_MATTPOCOCK } from "./skills-fixtures";

/** Roda o setup completo, com o executor injetado, e devolve o registro gravado. */
function registroGravado(): Record<string, unknown> {
  const raiz = projetoComSkills();
  runSetup({
    env: detectEnvironment(raiz),
    root: raiz,
    write: true,
    skills: { execute: executorFalso("sucesso", raiz).fn },
  });
  return JSON.parse(readFileSync(join(raiz, ".common-rules", "install.json"), "utf8"));
}

describe("AC-023 — o registro do projeto guarda a procedência dos conjuntos", () => {
  // SPECSFY: US-021 FR-023 AC-023
  it("a lista skills existe no arquivo gravado", () => {
    const reg = registroGravado();
    expect(Array.isArray(reg["skills"])).toBe(true);
    expect((reg["skills"] as unknown[]).length).toBe(CONJUNTO_MATTPOCOCK.length);
  });

  // SPECSFY: US-021 FR-023 AC-023
  it("cada entrada traz nome, origem, procedência e momento", () => {
    for (const e of registroGravado()["skills"] as Record<string, unknown>[]) {
      expect(typeof e["name"]).toBe("string");
      expect(e["source"]).toBe("mattpocock/skills");
      expect(String(e["computedHash"])).toContain("hash-");
      expect(typeof e["installedAt"]).toBe("string");
    }
  });

  // SPECSFY: US-021 FR-023 AC-023
  it("a lista hooks permanece como estava", () => {
    const reg = registroGravado();
    expect((reg["hooks"] as unknown[]).length).toBe(7);
  });
});
