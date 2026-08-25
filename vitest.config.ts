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
  },
});
