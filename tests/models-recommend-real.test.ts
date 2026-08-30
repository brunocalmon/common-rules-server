import { describe, it, expect } from "vitest";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";

const cli = resolve(__dirname, "..", "dist", "cli.js");

describe("AC-097 — o comando real imprime o relatório completo", () => {
  // SPECSFY: US-033 FR-037 NFR-035 AC-097
  it("nomeia backend e modelo local recomendados (ou a ausência) e a limitação de custo/plano", () => {
    const r = spawnSync("node", [cli, "recommend"], { encoding: "utf8", timeout: 10_000 });
    const texto = r.stdout + r.stderr;
    expect(texto).toMatch(/backend/i);
    expect(texto).toMatch(/modelo local/i);
    expect(texto).toMatch(/custo|uso de plano/i);
  }, 60_000);
});

describe("AC-101 — o comando real não faz chamada de rede nem trava esperando credencial", () => {
  // SPECSFY: US-035 FR-037 NFR-033 NFR-035 AC-101
  it("termina sozinho, sem prompt, dentro de um tempo limite curto", () => {
    const r = spawnSync("node", [cli, "recommend"], { encoding: "utf8", timeout: 10_000 });
    expect(r.error).toBeUndefined();
    expect(r.signal).toBeNull();
    expect(typeof r.status).toBe("number");
  }, 60_000);
});
