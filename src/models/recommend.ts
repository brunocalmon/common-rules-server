import type { BackendResult } from "../backends/detect.js";
import { SUPPORTED_AGENT_BACKENDS } from "../backends/known.js";
import type { OllamaModel, OllamaSnapshot } from "./ollama.js";
import type { Capacity } from "./capacity.js";

export interface RecommendOverride {
  backend?: string;
  localModel?: string;
}

export interface Recommendation {
  backend: string | null;
  backendOverridden: boolean;
  localModel: string | null;
  localModelOverridden: boolean;
  freeBytesConsidered: number;
  report: string;
}

/** Determinístico pela ordem declarada em `SUPPORTED_AGENT_BACKENDS` (FR-034). */
function recomendarBackend(backends: BackendResult[]): string | null {
  for (const nome of SUPPORTED_AGENT_BACKENDS) {
    const entrada = backends.find((b) => b.name === nome);
    if (entrada?.present && entrada.supported) return nome;
  }
  return null;
}

/** O maior modelo cujo tamanho cabe na memória livre, "cabe" é `<=` (FR-035). */
function recomendarModeloLocal(ollama: OllamaSnapshot, capacity: Capacity): OllamaModel | null {
  const cabem = ollama.models.filter((m) => m.sizeBytes <= capacity.freeBytes);
  if (cabem.length === 0) return null;
  return cabem.reduce((maior, atual) => (atual.sizeBytes > maior.sizeBytes ? atual : maior));
}

function relatar(params: {
  backend: string | null;
  backendOverridden: boolean;
  localModel: string | null;
  localModelOverridden: boolean;
  ollamaPresent: boolean;
  freeBytes: number;
}): string {
  const linhas: string[] = [];
  if (params.backend === null) {
    linhas.push("Nenhum backend suportado presente.");
  } else {
    linhas.push(`Backend recomendado: ${params.backend}${params.backendOverridden ? " (override)" : ""}`);
  }
  if (params.localModel === null) {
    linhas.push(
      params.ollamaPresent
        ? "Nenhum modelo local coube na memória livre."
        : "ollama não foi encontrado nesta máquina.",
    );
  } else {
    linhas.push(`Modelo local recomendado: ${params.localModel}${params.localModelOverridden ? " (override)" : ""}`);
  }
  linhas.push(`Memória livre considerada: ${params.freeBytes} bytes. Custo e uso de plano não entram neste cálculo.`);
  return linhas.join("\n");
}

/**
 * Função pura, sem I/O — quem chama já resolveu `detectBackends`,
 * `listOllamaModels` e `readCapacity` antes (`DEC-041`).
 *
 * Override nunca é revalidado contra presença ou capacidade (`DEC-039`,
 * `FR-036`): a escolha humana substitui o cálculo correspondente sem
 * checagem adicional.
 */
export function recommend(
  backends: BackendResult[],
  ollama: OllamaSnapshot,
  capacity: Capacity,
  override: RecommendOverride = {},
): Recommendation {
  const backendCalculado = recomendarBackend(backends);
  const backendOverridden = override.backend !== undefined;
  const backend = backendOverridden ? (override.backend as string) : backendCalculado;

  const modeloCalculado = recomendarModeloLocal(ollama, capacity);
  const localModelOverridden = override.localModel !== undefined;
  const localModel = localModelOverridden ? (override.localModel as string) : (modeloCalculado?.name ?? null);

  const report = relatar({
    backend,
    backendOverridden,
    localModel,
    localModelOverridden,
    ollamaPresent: ollama.present,
    freeBytes: capacity.freeBytes,
  });

  return {
    backend,
    backendOverridden,
    localModel,
    localModelOverridden,
    freeBytesConsidered: capacity.freeBytes,
    report,
  };
}
