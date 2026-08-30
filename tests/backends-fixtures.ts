import type { BackendEnvironment } from "../src/backends/detect";

export type Chamada = { name: string; tipo: "presence" | "version" };

/**
 * Nenhum backend de agente presente — para testes de `doctor` anteriores à
 * fatia 1d que não têm por objetivo exercitar a camada `agent`, e que sem
 * isso cairiam silenciosamente no ambiente real (NFR-032, SPEC-0008).
 */
export const semBackends: BackendEnvironment = {
  resolvePresence: () => false,
  resolveVersion: () => null,
};

/** Fonte fake: `presentes` mapeia nome para versão; ausência da chave é ausência do backend. */
export function fonteFake(presentes: Record<string, string>): { env: BackendEnvironment; chamadas: Chamada[] } {
  const chamadas: Chamada[] = [];
  const env: BackendEnvironment = {
    resolvePresence: (name) => {
      chamadas.push({ name, tipo: "presence" });
      return name in presentes;
    },
    resolveVersion: (name) => {
      chamadas.push({ name, tipo: "version" });
      return presentes[name] ?? null;
    },
  };
  return { env, chamadas };
}
