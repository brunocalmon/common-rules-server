#!/usr/bin/env node
import { argv, exit, stderr, stdout } from "node:process";
import { fileURLToPath } from "node:url";
import { realpathSync, readFileSync } from "node:fs";
import { defaultEnvironment, inspectDependencies, type Report } from "./doctor.js";
import { runSetup, TARGET_SETTINGS, loadHooks } from "./setup/run.js";
import { detectEnvironment } from "./setup/env.js";
import { KNOWN_TARGETS } from "./hooks/detect.js";
import { readRecordFile } from "./setup/write.js";
import { RECORD_PATH } from "./setup/record.js";
import { realSkillsExecutor } from "./skills/executor.js";
import { realSpecsfyExecutor } from "./specsfy/executor.js";
import { realBridgeEnvironment } from "./setup/bridge.js";
import { readVersion } from "./version.js";
import { detectBackends, realBackendEnvironment } from "./backends/detect.js";
import { listOllamaModels } from "./models/ollama.js";
import { readCapacity } from "./models/capacity.js";
import { recommend, type RecommendOverride } from "./models/recommend.js";
import { realChecksumEnvironment, readExtensionRegistry } from "./extensions/registry.js";
import { createExtension, realTargetFileEnvironment, resolveTargetPath, listPresentExtensionNames } from "./extensions/create.js";
import { diagnoseExtensions } from "./extensions/diagnose.js";
import { repairExtension, realQuarantineEnvironment } from "./extensions/repair.js";

export interface CommandOutcome {
  output: string;
  exitCode: number;
}

/**
 * Formats one line per dependency, with layer, origin and version.
 *
 * Extracted from `formatReport()` to be exercisable with an injected
 * `Report` — fatia 1d needs to prove the `agent` layer's text without
 * depending on what's installed on the machine running the suite
 * (NFR-032, SPEC-0008).
 */
export function renderReport(report: Report): string {
  const lines = report.results.map((d) => {
    const head = `${d.present ? "ok     " : "absent "} ${d.name}`;
    if (!d.present) return `${head}\n        ${d.hint ?? ""}`.trimEnd();
    const supported = d.layer === "agent" ? `, ${d.supported ? "supported" : "not supported"}` : "";
    return `${head} — layer ${d.layer}, origin ${d.origin}, version ${d.version}${supported}`;
  });
  const divergent = (report.divergentExtensions ?? []).map(
    (d) => `divergent extension "${d.name}" — target ${d.target}, ${d.reason}`,
  );
  return [...lines, ...divergent].join("\n");
}

function formatReport(): CommandOutcome {
  const report = inspectDependencies(defaultEnvironment(), process.cwd());
  return { output: renderReport(report), exitCode: report.exitCode };
}

const USAGE_SETUP = "usage: common-rules setup [--target claude-code]";

/**
 * Formats the setup result, without deciding anything about it.
 *
 * `--target`, given, forces detection to that value instead of reading
 * filesystem evidence — the only way to configure a brand-new project,
 * since evidence-based detection can never find `.claude/` before `setup`
 * has run once to create it (a bug found running this exact command
 * against a fresh project: `target claude-code ignored: no evidence...`
 * even though the caller was Claude Code itself). The MCP facade is
 * expected to pass this explicitly, from its own client handshake, rather
 * than a person needing to type it by hand every time.
 */
function formatSetup(args: readonly string[] = []): CommandOutcome {
  const { target } = parseFlags(args);
  if (target !== undefined && !KNOWN_TARGETS.includes(target)) {
    return { output: `${USAGE_SETUP}\nknown targets: ${KNOWN_TARGETS.join(", ")}`, exitCode: 2 };
  }

  // Reading the previous record is what makes idempotency hold in
  // practice: without it the command reinstalls and reports an
  // installation on every run, even though the result on disk is the same.
  const root = process.cwd();
  const previous = readRecordFile(root, RECORD_PATH);
  const r = runSetup({
    env: detectEnvironment(root),
    root,
    write: true,
    previous,
    target,
    skills: { execute: realSkillsExecutor() },
    specsfy: { execute: realSpecsfyExecutor() },
    bridgeEnv: realBridgeEnvironment(),
    approval: {},
  });
  if (r.installed.length === 0) return { output: r.report, exitCode: r.exitCode };
  const lines = r.installed.map((h) => `  ${h.name} — event ${h.event}, in ${TARGET_SETTINGS}`);
  return { output: [r.report, ...lines].join("\n"), exitCode: r.exitCode };
}

/** `--backend <name>` and `--local-model <name>` — human override, never revalidated (FR-036, DEC-039). */
function parseRecommendOverride(args: readonly string[]): RecommendOverride {
  const override: RecommendOverride = {};
  for (let i = 0; i < args.length; i++) {
    const flag = args[i];
    const value = args[i + 1];
    if (flag === "--backend" && value !== undefined) {
      override.backend = value;
      i++;
    } else if (flag === "--local-model" && value !== undefined) {
      override.localModel = value;
      i++;
    }
  }
  return override;
}

/** Resolves the three real sources and prints `recommendation.report` (FR-037). */
function formatRecommend(args: readonly string[]): CommandOutcome {
  const r = recommend(
    detectBackends(realBackendEnvironment()),
    listOllamaModels(),
    readCapacity(),
    parseRecommendOverride(args),
  );
  return { output: r.report, exitCode: r.backend === null ? 1 : 0 };
}

/** Reads `--flag value` from the command line; flags with no following value are ignored. */
function parseFlags(args: readonly string[]): Record<string, string> {
  const flags: Record<string, string> = {};
  for (let i = 0; i < args.length; i++) {
    const flag = args[i];
    const value = args[i + 1];
    if (flag?.startsWith("--") && value !== undefined) {
      flags[flag.slice(2)] = value;
      i++;
    }
  }
  return flags;
}

const USAGE_EXTENSION_CREATE =
  "usage: common-rules extension create --category <override|extension|new> --target <target> --name <name> --file <file-with-the-content>";

/** `common-rules extension create` — sole write path for an extension artifact (FR-080, NFR-083). */
function formatExtensionCreate(args: readonly string[]): CommandOutcome {
  const { category, target, name, file } = parseFlags(args);
  if (category !== "override" && category !== "extension" && category !== "new") {
    return { output: USAGE_EXTENSION_CREATE, exitCode: 2 };
  }
  if (!target || !name || !file) {
    return { output: USAGE_EXTENSION_CREATE, exitCode: 2 };
  }
  const root = process.cwd();
  const content = readFileSync(file, "utf8");
  const managedHooks = loadHooks().map((h) => h.name);
  const result = createExtension({
    category,
    name,
    target,
    content,
    registryEnv: realChecksumEnvironment(root),
    targetEnv: realTargetFileEnvironment(root),
    managedHooks,
  });
  if (!result.ok) return { output: result.reason ?? "refused", exitCode: 1 };
  return { output: `extension "${name}" created at ${resolveTargetPath(target)}`, exitCode: 0 };
}

/** `common-rules extension repair` — quarantines the divergent one and restores the original, never deletes (FR-084, FR-085). */
function formatExtensionRepair(args: readonly string[]): CommandOutcome {
  const { name } = parseFlags(args);
  if (!name) return { output: "usage: common-rules extension repair --name <name>", exitCode: 2 };

  const root = process.cwd();
  const registryEnv = realChecksumEnvironment(root);
  const targetEnv = realTargetFileEnvironment(root);
  const registry = readExtensionRegistry(registryEnv);
  const divergent = diagnoseExtensions(registry, targetEnv, listPresentExtensionNames(root));
  const item = divergent.find((d) => d.name === name);
  if (!item) return { output: `"${name}" isn't divergent; nothing to repair`, exitCode: 1 };

  const result = repairExtension(item, {
    registry,
    targetEnv,
    quarantineEnv: realQuarantineEnvironment(root),
  });
  if (!result.ok) return { output: result.reason ?? "repair refused", exitCode: 1 };
  return { output: `"${name}" repaired; divergent content moved to ${result.quarantinePath}`, exitCode: 0 };
}

function formatExtension(args: readonly string[]): CommandOutcome {
  const sub = args[0];
  if (sub === "create") return formatExtensionCreate(args.slice(1));
  if (sub === "repair") return formatExtensionRepair(args.slice(1));
  return { output: "usage: common-rules extension <create|repair> ...", exitCode: 2 };
}

export const COMMANDS: Record<string, (args: readonly string[]) => CommandOutcome> = {
  version: () => ({ output: readVersion(), exitCode: 0 }),
  doctor: formatReport,
  setup: formatSetup,
  recommend: formatRecommend,
  extension: formatExtension,
};

const ALIASES: Record<string, string> = {
  "--version": "version",
  "-v": "version",
  version: "version",
  doctor: "doctor",
  setup: "setup",
  recommend: "recommend",
  extension: "extension",
};

/** Resolves the received argument to a known command, or null. */
export function resolveCommand(args: readonly string[]): string | null {
  const first = args[0];
  if (first === undefined) return null;
  return ALIASES[first] ?? null;
}

export function run(args: readonly string[]): CommandOutcome {
  const name = resolveCommand(args);
  if (name === null) {
    const known = Object.keys(COMMANDS).join(", ");
    return { output: `unrecognized command. Available: ${known}`, exitCode: 2 };
  }
  const command = COMMANDS[name];
  if (command === undefined) return { output: `command ${name} has no implementation`, exitCode: 2 };
  return command(args.slice(1));
}

/**
 * Resolves `argv[1]` to its real path before comparing.
 *
 * Every global npm install — `npm link` or `npm install -g` of a
 * published package — delivers the binary as a symlink. `argv[1]`
 * preserves the link's path, and `fileURLToPath(import.meta.url)` is
 * always the real path; comparing the two directly never matches outside
 * this checkout. Returns `undefined` instead of throwing when the path
 * doesn't exist, so the guard simply doesn't fire instead of crashing the process.
 */
function realEntryPath(path: string | undefined): string | undefined {
  if (path === undefined) return undefined;
  try {
    return realpathSync(path);
  } catch {
    return undefined;
  }
}

// Only runs when invoked as a binary; importing the module prints
// nothing, which is what lets surface.test.ts inspect COMMANDS with no
// side effect.
if (fileURLToPath(import.meta.url) === realEntryPath(argv[1])) {
  const { output, exitCode } = run(argv.slice(2));
  (exitCode === 0 ? stdout : stderr).write(`${output}\n`);
  exit(exitCode);
}
