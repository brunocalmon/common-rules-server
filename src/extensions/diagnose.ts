import type { ExtensionRegistry } from "./registry.js";
import type { TargetFileEnvironment } from "./create.js";
import { resolveTargetPath } from "./create.js";
import { readAnchor, computeChecksum } from "./anchor.js";

export interface DivergentArtifact {
  name: string;
  target: string;
  reason: "checksum-mismatch" | "checksum-missing";
}

/**
 * Função pura de leitura — nunca escreve nada (`PR-082`, `NFR-082`).
 * `presentNames` são nomes de extensão encontrados no disco sem entrada
 * correspondente no registro (`checksum-missing`, `AC-135`); quem resolve
 * essa lista é o `doctor` real, listando `.common-rules/extensions/`.
 */
export function diagnoseExtensions(
  registry: ExtensionRegistry,
  targetEnv: TargetFileEnvironment,
  presentNames: readonly string[],
): DivergentArtifact[] {
  const divergentes: DivergentArtifact[] = [];

  for (const artefato of registry.artifacts) {
    const path = resolveTargetPath(artefato.target);
    const conteudoReal = readAnchor(targetEnv.read(path), artefato.category, artefato.name);
    const checksumReal = conteudoReal === null ? null : computeChecksum(conteudoReal);
    if (checksumReal !== artefato.checksum) {
      divergentes.push({ name: artefato.name, target: artefato.target, reason: "checksum-mismatch" });
    }
  }

  // Presença em disco vem do nome do arquivo, que é o `target` resolvido
  // (`resolveTargetPath`), nunca o `name` da extensão — os dois divergem
  // sempre que a pessoa nomeia a extensão diferente do hook que ela mira,
  // o caso comum. Comparar contra `name` fazia todo artefato íntegro nessa
  // situação aparecer como órfão (achado real rodando `dist/cli.js doctor`
  // de verdade, T021).
  const targetsRegistrados = new Set(registry.artifacts.map((a) => a.target));
  for (const nome of presentNames) {
    if (!targetsRegistrados.has(nome)) {
      divergentes.push({ name: nome, target: nome, reason: "checksum-missing" });
    }
  }

  return divergentes;
}
