import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

/** Where bundled, locally-authored skills ship from inside this package. */
export const resourcesSkillsDir = (): string =>
  resolve(dirname(fileURLToPath(import.meta.url)), "..", "..", "resources", "skills");

export interface BundledSkillFile {
  relativePath: string;
  content: string;
}

/**
 * Reads a bundled skill's files from `resources/skills/<name>/`.
 *
 * Flat only — no bundled skill needs a nested directory today. Extend when
 * one actually does, not before.
 */
export function readBundledSkill(name: string, dir: string = resourcesSkillsDir()): BundledSkillFile[] {
  const skillDir = join(dir, name);
  if (!existsSync(skillDir)) return [];
  return readdirSync(skillDir).map((relativePath) => ({
    relativePath,
    content: readFileSync(join(skillDir, relativePath), "utf8"),
  }));
}

/** Write destination for a delivered skill, injected like every other real source in this project. */
export interface SkillWriteEnvironment {
  write(path: string, content: string): void;
}

export function realSkillWriteEnvironment(root: string): SkillWriteEnvironment {
  return {
    write: (path, content) => {
      const full = join(root, path);
      mkdirSync(dirname(full), { recursive: true });
      writeFileSync(full, content);
    },
  };
}

/**
 * Copies a bundled skill's files into every target skills directory.
 *
 * The only supported target today is `claude-code`, which the real installer
 * observably populates in both `.claude/skills/` and `.agents/skills/` — this
 * mirrors that, rather than picking one and guessing wrong for the other.
 */
export function deliverBundledSkill(
  files: readonly BundledSkillFile[],
  name: string,
  targetDirs: readonly string[],
  env: SkillWriteEnvironment,
): string[] {
  const written: string[] = [];
  for (const dir of targetDirs) {
    for (const file of files) {
      const path = `${dir}/${name}/${file.relativePath}`;
      env.write(path, file.content);
      written.push(path);
    }
  }
  return written;
}
