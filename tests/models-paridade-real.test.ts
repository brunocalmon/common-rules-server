import { describe, it, expect } from "vitest";
import { execFileSync } from "node:child_process";
import { totalmem, freemem } from "node:os";
import { readCapacity } from "../src/models/capacity";
import { listOllamaModels } from "../src/models/ollama";

const temOllama = (): boolean => {
  try {
    execFileSync("which", ["ollama"], { stdio: ["ignore", "ignore", "ignore"] });
    return true;
  } catch {
    return false;
  }
};

function ollamaListReal(): string[] {
  const saida = execFileSync("ollama", ["list"], { encoding: "utf8" });
  return saida
    .split("\n")
    .slice(1)
    .map((l) => l.trim())
    .filter((l) => l.length > 0)
    .map((l) => l.split(/\s{2,}/)[0]);
}

describe("AC-099 — paridade entre a fonte real e a máquina", () => {
  // SPECSFY: US-035 NFR-034 AC-099
  it("a memória usada corresponde a os.freemem() e os.totalmem()", () => {
    const antes = freemem();
    const capacidade = readCapacity();
    const depois = freemem();
    expect(capacidade.totalBytes).toBe(totalmem());
    expect(capacidade.freeBytes).toBeGreaterThanOrEqual(Math.min(antes, depois) * 0.9);
    expect(capacidade.freeBytes).toBeLessThanOrEqual(Math.max(antes, depois) * 1.1);
  });

  // SPECSFY: US-035 NFR-034 AC-099
  it("os modelos locais correspondem à saída real de 'ollama list'", () => {
    if (!temOllama()) return;
    const esperados = ollamaListReal();
    const snapshot = listOllamaModels();
    expect(snapshot.present).toBe(true);
    expect(snapshot.models.map((m) => m.name).sort()).toEqual(esperados.sort());
  });
});
