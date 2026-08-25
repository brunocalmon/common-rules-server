import { describe, it, expect } from "vitest";
import { bridgePythonSubsystem } from "../src/setup/bridge";

const ausente = { localVenv: null as string | null, onPath: null as string | null, hasUv: true };
const presente = { localVenv: "2.3.7", onPath: null as string | null, hasUv: true };

describe("AC-008 — a ponte cria a cópia local quando falta", () => {
  // SPECSFY: US-001 FR-008 AC-008
  it("cria a cópia dentro do projeto, na versão fixada", () => {
    const r = bridgePythonSubsystem({ env: ausente, execute: false });
    expect(r.wouldInstall).toBe("code-review-graph==2.3.7");
    expect(r.targetDir.startsWith("/")).toBe(false);
  });

  // SPECSFY: US-001 FR-008 NFR-001 AC-008
  it("não escreve no ambiente global", () => {
    expect(bridgePythonSubsystem({ env: ausente, execute: false }).touchesGlobal).toBe(false);
  });

  // SPECSFY: US-001 FR-008 AC-008
  it("não age quando a cópia local já existe", () => {
    expect(bridgePythonSubsystem({ env: presente, execute: false }).wouldInstall).toBeNull();
  });

  // SPECSFY: US-001 FR-008 AC-008
  it("recusa nomeando a ferramenta quando uv falta", () => {
    const r = bridgePythonSubsystem({ env: { ...ausente, hasUv: false }, execute: false });
    expect(r.refused).toMatch(/uv/i);
  });
});
