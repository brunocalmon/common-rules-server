import { describe, it, expect } from "vitest";
import { detectBackends } from "../src/backends/detect";
import { SUPPORTED_AGENT_BACKENDS } from "../src/backends/known";
import { fonteFake } from "./backends-fixtures";

describe("AC-080 — backends suportados presentes aparecem no relato", () => {
  // SPECSFY: US-030 FR-030 FR-031 AC-080
  it("os cinco suportados presentes trazem presença, versão e a marca de suportado", () => {
    const versoes: Record<string, string> = { pi: "0.84.3", agy: "1.1.20", claude: "2.1.251", codex: "0.151.0", goose: "1.47.0" };
    const { env } = fonteFake(versoes);
    const resultado = detectBackends(env);
    for (const nome of SUPPORTED_AGENT_BACKENDS) {
      const entrada = resultado.find((r) => r.name === nome);
      expect(entrada?.present).toBe(true);
      expect(entrada?.version).toBe(versoes[nome]);
      expect(entrada?.supported).toBe(true);
    }
  });
});
