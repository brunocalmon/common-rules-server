import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import type { ChecksumEnvironment, ExtensionArtifact } from "./registry.js";
import { readExtensionRegistry, writeExtensionRegistry } from "./registry.js";
import { insertAnchor, computeChecksum } from "./anchor.js";

/**
 * Read/write source for the target file, injected — same pattern as this
 * project's other resolution sources.
 */
export interface TargetFileEnvironment {
  read(path: string): string;
  write(path: string, content: string): void;
}

const ROUTER_FILES = new Set(["CLAUDE.md", "AGENTS.md"]);

/** Which file `target` resolves to — the root for CLAUDE.md/AGENTS.md, its own artifact for everything else. */
export function resolveTargetPath(target: string): string {
  return ROUTER_FILES.has(target) ? target : `.common-rules/extensions/${target}.md`;
}

export const EXTENSIONS_DIR = ".common-rules/extensions";

/** Real environment, used by the command line. Only reads/writes the resolved paths, never more. */
export function realTargetFileEnvironment(root: string): TargetFileEnvironment {
  return {
    read: (path: string) => {
      const full = join(root, path);
      return existsSync(full) ? readFileSync(full, "utf8") : "";
    },
    write: (path: string, content: string) => {
      const full = join(root, path);
      mkdirSync(dirname(full), { recursive: true });
      writeFileSync(full, content);
    },
  };
}

/** Names of the files present in `.common-rules/extensions/`, without the `.md` extension — used by `doctor` to find an artifact with no record (`AC-135`). */
export function listPresentExtensionNames(root: string): string[] {
  const dir = join(root, EXTENSIONS_DIR);
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((f: string) => f.endsWith(".md"))
    .map((f: string) => f.slice(0, -3));
}

export interface CreateOptions {
  category: "override" | "extension" | "new";
  name: string;
  target: string;
  content: string;
  registryEnv: ChecksumEnvironment;
  targetEnv: TargetFileEnvironment;
  /** Names of the seven managed hooks. Absent, resolves to `[]` — the real `setup` caller passes the real list. */
  managedHooks?: string[];
  /**
   * Source of the instant recorded in `createdAt`. Absent, uses the real
   * `Date.now` — exists to avoid repeating the defect `SPEC-0006` already
   * fixed (a frozen or non-injectable instant in tests).
   */
  now?: () => string;
}

export interface CreateResult {
  ok: boolean;
  reason?: string;
  artifact?: ExtensionArtifact;
}

/**
 * Creates an extension artifact via the sole write path — writes the
 * anchor into the target file and records the checksum. Refuses `new`
 * for one of the seven managed hooks (`FR-081`) and a name conflict with
 * no default choice (`FR-082`).
 */
export function createExtension(opts: CreateOptions): CreateResult {
  const managedHooks = opts.managedHooks ?? [];
  if (opts.category === "new" && managedHooks.includes(opts.target)) {
    return {
      ok: false,
      reason: `category new refused: "${opts.target}" is one of the seven hooks setup manages; use override or extension`,
    };
  }

  const registry = readExtensionRegistry(opts.registryEnv);
  const conflict = registry.artifacts.find((a) => a.name === opts.name);
  if (conflict) {
    return {
      ok: false,
      reason: `name conflict: "${opts.name}" is already registered — explicitly choose to skip or replace`,
    };
  }

  const path = resolveTargetPath(opts.target);
  const current = opts.targetEnv.read(path);
  const updated = insertAnchor(current, opts.category, opts.name, opts.content);
  opts.targetEnv.write(path, updated);

  const artifact: ExtensionArtifact = {
    category: opts.category,
    name: opts.name,
    target: opts.target,
    content: opts.content,
    checksum: computeChecksum(opts.content),
    createdAt: (opts.now ?? (() => new Date().toISOString()))(),
  };
  writeExtensionRegistry({ artifacts: [...registry.artifacts, artifact] }, opts.registryEnv);

  return { ok: true, artifact };
}
