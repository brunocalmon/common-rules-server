import { describe, it, expect } from "vitest";
import { assembleDependencyCommands } from "../src/approval/plan";

describe("AC-117 — a ponte Python não executa quando já presente", () => {
  // SPECSFY: US-072 FR-074 NFR-072 AC-117
  it("candidato da ponte com pending=false não aparece na lista de comandos", () => {
    const candidatos = [
      {
        kind: "bridge" as const,
        label: "instalar code-review-graph via uv",
        command: { bin: "uv", args: ["pip", "install", "--python", ".venv-crg", "code-review-graph==2.3.7"] },
        pending: false,
      },
    ];
    const itens = assembleDependencyCommands(candidatos);
    expect(itens).toEqual([]);
  });

  // SPECSFY: FR-074 AC-117
  it("candidato sem comando resolvido (bin ausente) não aparece mesmo pendente", () => {
    const candidatos = [
      { kind: "bridge" as const, label: "instalar code-review-graph via uv", command: null, pending: true },
    ];
    const itens = assembleDependencyCommands(candidatos);
    expect(itens).toEqual([]);
  });
});
