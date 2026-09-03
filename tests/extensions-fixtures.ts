import type { ExtensionRegistry, ExtensionArtifact } from "../src/extensions/registry";
import type { ChecksumEnvironment } from "../src/extensions/registry";
import type { TargetFileEnvironment } from "../src/extensions/create";

export function registryFake(artifacts: ExtensionArtifact[] = []): ExtensionRegistry {
  return { artifacts };
}

/** Ambiente de registro em memória, injetável nos casos. */
export function checksumEnvFake(initial = "{}"): ChecksumEnvironment & { contents: () => string } {
  let stored = initial;
  return {
    read: () => stored,
    write: (contents: string) => {
      stored = contents;
    },
    contents: () => stored,
  };
}

/** Ambiente de arquivo alvo em memória, um mapa nome→conteúdo. */
export function targetEnvFake(initial: Record<string, string> = {}): TargetFileEnvironment & { files: () => Record<string, string> } {
  const files: Record<string, string> = { ...initial };
  return {
    read: (path: string) => files[path] ?? "",
    write: (path: string, content: string) => {
      files[path] = content;
    },
    files: () => files,
  };
}
