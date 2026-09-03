import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";

export interface ApprovedCommand {
  bin: string;
  args: string[];
}

export interface ApprovalRegistry {
  commands: ApprovedCommand[];
}

/**
 * Read/write source, injected in the same pattern as `BackendEnvironment`
 * (fatia 1d) — the suite never depends on the disk of whoever runs it.
 */
export interface RegistryEnvironment {
  read(): string;
  write(contents: string): void;
}

export const REGISTRY_PATH = ".common-rules/approved-commands.json";

export function realRegistryEnvironment(root: string): RegistryEnvironment {
  const path = join(root, REGISTRY_PATH);
  return {
    read: () => (existsSync(path) ? readFileSync(path, "utf8") : ""),
    write: (contents: string) => {
      mkdirSync(dirname(path), { recursive: true });
      writeFileSync(path, contents);
    },
  };
}

/** Missing, empty, or invalid JSON resolves to an empty registry — never throws (`AC-119`). */
export function readApprovalRegistry(env: RegistryEnvironment): ApprovalRegistry {
  const raw = env.read().trim();
  if (raw.length === 0) return { commands: [] };
  try {
    const value = JSON.parse(raw) as unknown;
    if (typeof value !== "object" || value === null || !Array.isArray((value as ApprovalRegistry).commands)) {
      return { commands: [] };
    }
    return { commands: (value as ApprovalRegistry).commands };
  } catch {
    return { commands: [] };
  }
}

export function writeApprovalRegistry(registry: ApprovalRegistry, env: RegistryEnvironment): void {
  env.write(JSON.stringify(registry, null, 2));
}

/** Exact identity — binary and argv, same length, no normalization (`PR-070`). */
export function isApproved(registry: ApprovalRegistry, item: { bin: string; args: string[] }): boolean {
  return registry.commands.some(
    (c) => c.bin === item.bin && c.args.length === item.args.length && c.args.every((a, i) => a === item.args[i]),
  );
}
