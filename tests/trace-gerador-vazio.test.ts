import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { runSetup } from "../src/setup/run";
import { detectEnvironment } from "../src/setup/env";
import { readTrace } from "../src/telemetry/read";
import { projeto, INSTANTE_FIXO } from "./trace-fixtures";

/** Origem cujo gerador devolve vazio, caso-limite da seção 7. */
const origemVazia = { now: () => INSTANTE_FIXO, id: () => "" };

function registro(): { raiz: string; reg: Record<string, unknown> } {
  const raiz = projeto();
  runSetup({ env: detectEnvironment(raiz), root: raiz, write: true, trace: origemVazia });
  return { raiz, reg: JSON.parse(readFileSync(join(raiz, ".common-rules", "install.json"), "utf8")) };
}

describe("Caso-limite — gerador que devolve valor vazio", () => {
  // SPECSFY: US-040 FR-040 AC-040
  it("o campo não é gravado vazio", () => {
    expect("trace" in registro().reg).toBe(false);
  });

  // SPECSFY: US-040 FR-044 AC-047
  it("a leitura reporta não identificado", () => {
    expect(readTrace(registro().raiz).kind).toBe("unidentified");
  });

  // SPECSFY: US-040 FR-040 AC-040
  it("o restante do registro permanece", () => {
    const { reg } = registro();
    expect((reg["hooks"] as unknown[]).length).toBe(7);
    for (const h of reg["hooks"] as { installedAt: string }[]) expect(h.installedAt).toBe(INSTANTE_FIXO);
  });
});
