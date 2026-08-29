import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const manifest = () => JSON.parse(readFileSync(resolve(__dirname, "../package.json"), "utf8"));
const NPM_SUBSYSTEMS = ["@promovaweb/specsfy", "context-mode"];

describe("AC-001 — instalação limpa conclui", () => {
  // SPECSFY: US-001 FR-001 AC-001
  it("declara o nome do pacote de produto", () => {
    expect(manifest().name).toBe("@brunocalmon/common-rules");
  });

  // SPECSFY: US-001 FR-004 AC-001
  it("declara as duas dependências de subsistema npm em versão exata", () => {
    const deps = manifest().dependencies ?? {};
    // FR-004 exige que os dois subsistemas estejam declarados e fixados, não que
    // sejam as únicas dependências. Comparar por igualdade de conjunto fixava um
    // retrato da entrega e proibia qualquer biblioteca futura — foi o que
    // aconteceu quando o SDK do protocolo entrou na fatia 1f.
    for (const nome of NPM_SUBSYSTEMS) {
      expect(Object.keys(deps)).toContain(nome);
      expect(String(deps[nome])).toMatch(/^\d+\.\d+\.\d+$/);
    }
  });

  // SPECSFY: US-001 FR-004 NFR-002 AC-001
  it("não declara nenhuma dependência com faixa de versão", () => {
    const prod = manifest().dependencies ?? {};
    // Sem esta guarda a asserção seguinte seria trivialmente verdadeira sobre um
    // conjunto vazio, e passaria antes de existir o que ela deveria proteger.
    expect(Object.keys(prod).length).toBeGreaterThan(0);
    const all = { ...prod, ...(manifest().devDependencies ?? {}) };
    const ranged = Object.entries(all).filter(([, v]) => /^[\^~><*]|\s-\s|\|\|/.test(String(v)));
    expect(ranged).toEqual([]);
  });

  // SPECSFY: US-001 FR-003 AC-001
  it("traz o runner de testes instalável pela instalação limpa", () => {
    expect(manifest().devDependencies?.vitest).toBeDefined();
  });
});
