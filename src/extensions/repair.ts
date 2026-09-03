import { writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import type { ExtensionRegistry } from "./registry.js";
import type { TargetFileEnvironment } from "./create.js";
import { resolveTargetPath } from "./create.js";
import { insertAnchor } from "./anchor.js";
import type { DivergentArtifact } from "./diagnose.js";

/** Quarantine write source, injected. */
export interface QuarantineEnvironment {
  write(name: string, content: string): void;
}

/** `.common-rules/quarantine/`, with no automatic expiration (`D7`, `NFR-081`). */
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
 * Moves the divergent content to quarantine and restores the original
 * artifact from what the registry already had — never deletes (`FR-085`,
 * `PR-081`). Refuses the whole repair if quarantine isn't writable
 * (`AC-139`), instead of repairing halfway.
 */
export function repairExtension(
  divergent: DivergentArtifact,
  opts: { registry: ExtensionRegistry; targetEnv: TargetFileEnvironment; quarantineEnv: QuarantineEnvironment; now?: () => string },
): RepairResult {
  const artifact = opts.registry.artifacts.find((a) => a.name === divergent.name);
  if (!artifact) {
    return { ok: false, reason: `artifact "${divergent.name}" isn't in the registry; nothing to repair` };
  }

  const path = resolveTargetPath(artifact.target);
  const divergentContent = opts.targetEnv.read(path);
  const stamp = (opts.now ?? (() => new Date().toISOString()))().replace(/[:.]/g, "-");
  const quarantineName = `${stamp}-${divergent.name}`;

  try {
    opts.quarantineEnv.write(quarantineName, divergentContent);
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    return { ok: false, reason: `quarantine not writable, whole repair refused: ${reason}` };
  }

  const restored = insertAnchor(divergentContent, artifact.category, artifact.name, artifact.content);
  opts.targetEnv.write(path, restored);

  return { ok: true, quarantinePath: quarantineName };
}
