import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { parse } from "./yaml.js";
import { CONFIG_PATH } from "./write.js";
import type { MaestroSection } from "./schema.js";

/**
 * Reads the `maestro:` section, or an empty one when the project has no
 * configuration yet.
 *
 * Deliberately tolerant, unlike `readAgentConfig`: this is the path used to
 * resolve a task type, and a project that never ran `setup` should get "no
 * types declared" — which the resolution then reports by name — rather than
 * a failure about a file the person didn't ask about.
 */
export function readMaestroSection(root: string): Partial<MaestroSection> {
  const path = join(root, CONFIG_PATH);
  if (!existsSync(path)) return {};
  try {
    const document = parse(readFileSync(path, "utf8")).toJSON() as { maestro?: MaestroSection };
    return document.maestro ?? {};
  } catch {
    return {};
  }
}
