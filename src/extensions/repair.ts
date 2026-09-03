import { writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import type { ExtensionRegistry } from "./registry.js";
import type { TargetFileEnvironment } from "./create.js";
import { resolveTargetPath } from "./create.js";
import { insertAnchor } from "./anchor.js";
import type { DivergentArtifact } from "./diagnose.js";

/** Fonte de escrita da quarentena, injetada. */
export interface QuarantineEnvironment {
  write(name: string, content: string): void;
}

/** `.common-rules/quarantine/`, sem expiração automática (`D7`, `NFR-081`). */
export const QUARANTINE_DIR = ".common-rules/quarantine";

export function realQuarantineEnvironment(root: string): QuarantineEnvironment {
  const dir = join(root, QUARANTINE_DIR);
  return {
    write: (name: string, content: string) => {
      mkdirSync(dir, { recursive: true });
      writeFileSync(join(dir, name), content);
    },
  };
}

export interface RepairResult {
  ok: boolean;
  reason?: string;
  quarantinePath?: string;
}

/**
 * Move o conteúdo divergente para a quarentena e restaura o artefato
 * original a partir do que o registro já tinha — nunca apaga (`FR-085`,
 * `PR-081`). Recusa o reparo inteiro se a quarentena não for gravável
 * (`AC-139`), em vez de reparar pela metade.
 */
export function repairExtension(
  divergent: DivergentArtifact,
  opts: { registry: ExtensionRegistry; targetEnv: TargetFileEnvironment; quarantineEnv: QuarantineEnvironment; now?: () => string },
): RepairResult {
  const artefato = opts.registry.artifacts.find((a) => a.name === divergent.name);
  if (!artefato) {
    return { ok: false, reason: `artefato "${divergent.name}" não está no registro; nada para reparar` };
  }

  const path = resolveTargetPath(artefato.target);
  const conteudoDivergente = opts.targetEnv.read(path);
  const carimbo = (opts.now ?? (() => new Date().toISOString()))().replace(/[:.]/g, "-");
  const nomeQuarentena = `${carimbo}-${divergent.name}`;

  try {
    opts.quarantineEnv.write(nomeQuarentena, conteudoDivergente);
  } catch (error) {
    const motivo = error instanceof Error ? error.message : String(error);
    return { ok: false, reason: `quarentena não gravável, reparo recusado inteiro: ${motivo}` };
  }

  const restaurado = insertAnchor(conteudoDivergente, artefato.category, artefato.name, artefato.content);
  opts.targetEnv.write(path, restaurado);

  return { ok: true, quarantinePath: nomeQuarentena };
}
