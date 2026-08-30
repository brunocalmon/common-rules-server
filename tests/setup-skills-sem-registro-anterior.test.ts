import { describe, it, expect } from "vitest";
import { runSetup } from "../src/setup/run";
import { detectEnvironment } from "../src/setup/env";
import { projeto, decisaoFixa } from "./aprovacao-fixtures";

/**
 * Bug real, achado rodando `common-rules setup` de verdade neste próprio
 * repositório: hooks gravados numa execução anterior sem `skills`
 * configurada deixavam `skillsPrevias` vazio, e o antigo
 * `skillsJaFeito = ... || skillsPrevias.length === 0 || ...` tratava
 * "nenhum registro anterior" como "já feito" — uma execução seguinte com
 * `skills` configurada nunca chegava a instalar nada.
 */
describe("Registro de hooks sem skills anteriores não finge que skills já foram instaladas", () => {
  it("primeira execução sem skills, segunda com skills configurada: o executor é chamado de verdade", () => {
    const raiz = projeto();
    const env = detectEnvironment(raiz);

    const primeira = runSetup({ env, root: raiz, write: true, approval: { source: decisaoFixa(true) } });
    expect(primeira.record?.skills).toBeUndefined();

    let chamado = false;
    runSetup({
      env,
      root: raiz,
      write: true,
      previous: primeira.record,
      skills: {
        execute: (args, cwd) => {
          chamado = true;
          return { status: 0, skills: ["exemplo"] };
        },
      },
      approval: { source: decisaoFixa(true) },
    });

    expect(chamado).toBe(true);
  });
});
