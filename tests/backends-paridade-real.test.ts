import { describe, it, expect } from "vitest";
import { execFileSync } from "node:child_process";
import { detectBackends, realBackendEnvironment } from "../src/backends/detect";
import { SUPPORTED_AGENT_BACKENDS } from "../src/backends/known";

const noPath = (nome: string): boolean => {
  try {
    execFileSync("which", [nome], { stdio: ["ignore", "ignore", "ignore"] });
    return true;
  } catch {
    return false;
  }
};

describe("AC-085 — paridade entre a fonte real e a máquina", () => {
  // SPECSFY: US-032 NFR-032 AC-085
  it("a fonte real resolve o que de fato está instalado", () => {
    const resultado = detectBackends(realBackendEnvironment());
    for (const nome of SUPPORTED_AGENT_BACKENDS) {
      const entrada = resultado.find((r) => r.name === nome);
      expect(entrada?.present).toBe(noPath(nome));
    }
  });

  // SPECSFY: NFR-032 AC-085
  it("a versão de claude, cuja saída real tem parênteses, vem limpa", () => {
    if (!noPath("claude")) return;
    const entrada = detectBackends(realBackendEnvironment()).find((r) => r.name === "claude");
    expect(entrada?.version).toMatch(/^\d/);
    expect(entrada?.version).not.toMatch(/[()]/);
  });
});
