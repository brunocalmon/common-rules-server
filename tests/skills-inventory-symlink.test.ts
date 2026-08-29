import { describe, it, expect } from "vitest";
import { inspectSkills } from "../src/skills/inventory";
import { projetoComSkills, trocarPorLink } from "./skills-fixtures";

describe("AC-033 — um conjunto presente como link é tratado como inválido", () => {
  // SPECSFY: US-020 FR-021 AC-033
  it("o link é detectado", () => {
    const raiz = projetoComSkills();
    trocarPorLink(raiz, "specsfy-setup");
    expect(inspectSkills(raiz).symlinks.length).toBeGreaterThan(0);
  });

  // SPECSFY: US-020 FR-022 AC-033
  it("o resultado é inválido", () => {
    const raiz = projetoComSkills();
    trocarPorLink(raiz, "specsfy-setup");
    expect(inspectSkills(raiz).ok).toBe(false);
  });

  // SPECSFY: US-020 NFR-022 AC-033
  it("a razão cita que o conteúdo precisa viver dentro do projeto", () => {
    const raiz = projetoComSkills();
    trocarPorLink(raiz, "specsfy-setup");
    expect(inspectSkills(raiz).reason ?? "").toMatch(/dentro do projeto|link/i);
  });
});
