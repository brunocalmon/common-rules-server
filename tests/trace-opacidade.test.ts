import { describe, it, expect } from "vitest";
import { hostname, userInfo, homedir } from "node:os";
import { generateId } from "../src/telemetry/trace";

describe("AC-049 — nada do ambiente vaza para o identificador", () => {
  const valores = () => Array.from({ length: 100 }, () => generateId());

  // SPECSFY: US-042 NFR-041 AC-049
  it("não contém o nome do usuário", () => {
    const u = userInfo().username.toLowerCase();
    for (const v of valores()) expect(v.toLowerCase()).not.toContain(u);
  });

  // SPECSFY: US-042 NFR-041 AC-049
  it("não contém caminho absoluto", () => {
    for (const v of valores()) expect(v).not.toContain(homedir());
  });

  // SPECSFY: US-042 NFR-041 AC-049
  it("não contém o nome da máquina", () => {
    const h = hostname().toLowerCase();
    for (const v of valores()) expect(v.toLowerCase()).not.toContain(h);
  });
});
