import { defineConfig } from "vitest/config";

// O escopo é restrito a tests/ por necessidade, não por estilo.
// As asserções da Phase 0, em .claude/scripts/phase0/, chamam-se *.test.js
// porque o auditor de rastreabilidade do Specsfy só reconhece arquivo cujo nome
// pareça de teste. São scripts autônomos que executam no import e encerram o
// processo, não suítes Vitest. Sem esta restrição o runner tenta executá-las e
// reprova em dezesseis arquivos que não lhe dizem respeito.
export default defineConfig({
  test: {
    include: ["tests/**/*.test.ts"],
    // A suíte tem dezenas de casos que sobem subprocesso real (execFileSync/
    // spawnSync — instalação real, CLI real, ponte Python real). Sob carga
    // externa pesada (achado real, 2026-09-02: load average 7 numa máquina
    // de 16 núcleos, com a VM do Cowork do próprio Claude Desktop competindo
    // por CPU), dois problemas distintos apareciam:
    //
    // 1. Casos sem timeout próprio caíam no default do Vitest (5s) — curto
    //    demais para um `node dist/cli.js` ou um `which <backend>` real
    //    quando a CPU está saturada por processos externos à suíte.
    // 2. Mesmo casos com timeout próprio generoso (30s) falhavam com um erro
    //    de `spawnSync` (não um timeout) — sintoma de exaustão de recursos
    //    do SO por excesso de fork() concorrentes, não de lentidão.
    //
    // `testTimeout` mais alto resolve (1); `maxForks` mais baixo reduz a
    // pressão de fork() concorrente que causava (2), trocando paralelismo
    // máximo por estabilidade sob carga real.
    testTimeout: 30_000,
    poolOptions: {
      forks: {
        maxForks: 4,
      },
    },
  },
});
