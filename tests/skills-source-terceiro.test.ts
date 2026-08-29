import { describe, it, expect } from "vitest";
import { resolveSource, OFFICIAL_SOURCE } from "../src/skills/source";
import { arvore, projetoComSkills } from "./skills-fixtures";

describe("AC-026 — o pacote npm de terceiro não é aceito", () => {
  // SPECSFY: US-022 FR-025 AC-026
  it("recusa a republicação do registro npm", () => {
    expect(resolveSource("mattpocock-skills").ok).toBe(false);
  });

  // SPECSFY: US-022 FR-020 FR-025 AC-026
  it("nomeia a origem oficial na explicação", () => {
    const r = resolveSource("mattpocock-skills");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toContain(OFFICIAL_SOURCE);
  });

  // SPECSFY: US-022 FR-025 AC-026
  it("nada é instalado ao recusar", () => {
    const raiz = projetoComSkills();
    const antes = arvore(raiz);
    resolveSource("mattpocock-skills");
    expect(arvore(raiz)).toEqual(antes);
  });
});
