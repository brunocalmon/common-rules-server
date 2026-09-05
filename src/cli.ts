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
 * `--help`/`-h`, checked first by every command.
 *
 * Found missing entirely: nothing in this CLI documented its own flags,
 * and worse, an unrecognized flag like a stray `--help` wasn't refused —
 * `setup`'s own flag parsing silently drops anything it doesn't
 * recognize and falls through to running the real command anyway. That's
 * not just a discoverability gap, it's how a typo turns into an
 * unintended write; every command checks this before doing anything else,
 * and `setup` additionally refuses flags it doesn't recognize instead of
 * ignoring them (see `formatSetup`).
 */
const HELP_FLAGS = new Set(["--help", "-h"]);
const hasHelp = (args: readonly string[]): boolean => args.some((a) => HELP_FLAGS.has(a));

const USAGE_VERSION = "usage: common-rules version\n\nPrints the installed version.";
const USAGE_DOCTOR =
  "usage: common-rules doctor\n\n" +
  "Reports every dependency this project's layers need, whether each is present,\n" +
  "and its version. Exits non-zero when something required is missing.";
const USAGE_SETUP =
  "usage: common-rules setup [--target claude-code]\n\n" +
  "Installs the hooks that connect this project's subsystems to the agent's\n" +
  "cycle, plus the skills and the Specsfy framework, then records the\n" +
  "installation so a later run is a no-op when nothing changed.\n\n" +
  "  --target <name>   Configure this editor explicitly, skipping filesystem-\n" +
  "                     evidence detection. Known targets: " +
  KNOWN_TARGETS.join(", ") +
  ".\n" +
  "                     Required on a project that has never been configured\n" +
  "                     for it yet — evidence-based detection can never find\n" +
  "                     .claude/ before this command has run once to create it.\n\n" +
  "Without --target, detection falls back to filesystem evidence and does\n" +
  "nothing when none is found — that's a normal exit, not a failure.\n\n" +
  "Prompts for approval on a real terminal; reads a JSON document\n" +
  '({"approved": true}) from standard input otherwise.';
const USAGE_RECOMMEND =
  "usage: common-rules recommend [--backend <name>] [--local-model <name>]\n\n" +
  "Recommends which agent backend and local model to use, based on what's\n" +
  "installed and the machine's capacity. Both flags override detection by hand\n" +
  "and are never revalidated against what's actually present.";
const USAGE_EXTENSION_CREATE =
  "usage: common-rules extension create --category <override|extension|new> --target <target> --name <name> --file <file-with-the-content>\n\n" +
  "Writes one extension artifact. The sole write path for this — never edit\n" +
  "target files by hand, since that's exactly what lets an install detect drift.";
const USAGE_EXTENSION_REPAIR =
  "usage: common-rules extension repair --name <name>\n\n" +
  "Quarantines a divergent extension's content and restores the original.\n" +
  "Never deletes: the divergent content moves aside, it doesn't disappear.";
const USAGE_EXTENSION =
  "usage: common-rules extension <create|repair> ...\n\n" +
  "  create   " +
  USAGE_EXTENSION_CREATE.split("\n")[0]!.replace("usage: common-rules extension create ", "") +
  "\n  repair   " +
  USAGE_EXTENSION_REPAIR.split("\n")[0]!.replace("usage: common-rules extension repair ", "") +
  "\n\nRun `common-rules extension <create|repair> --help` for either one's full usage.";
const USAGE_TOP =
  "usage: common-rules <command> [options]\n\n" +
  "Commands:\n" +
  "  version               Print the installed version.\n" +
  "  doctor                Report every dependency this project's layers need.\n" +
  "  setup [--target ...]  Configure this project: hooks, skills, Specsfy.\n" +
  "  recommend [options]   Recommend an agent backend and local model.\n" +
  "  extension <create|repair> ...   Manage one extension artifact.\n\n" +
  "Run `common-rules <command> --help` for a command's full usage.";

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

function formatReport(args: readonly string[] = []): CommandOutcome {
  if (hasHelp(args)) return { output: USAGE_DOCTOR, exitCode: 0 };
  const report = inspectDependencies(defaultEnvironment(), process.cwd());
  return { output: renderReport(report), exitCode: report.exitCode };
}

/** Flags `setup` recognizes; anything else is refused, not silently dropped (see `HELP_FLAGS`'s comment for why). */
const SETUP_FLAGS = new Set(["target"]);

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
  if (hasHelp(args)) return { output: USAGE_SETUP, exitCode: 0 };

  const flags = parseFlags(args);
  const unknown = Object.keys(flags).filter((f) => !SETUP_FLAGS.has(f));
  if (unknown.length > 0) {
    // The incident this guards: --help alone, with nothing recognizable
    // after it, used to fall through parseFlags unnoticed and run the real
    // command — an unrecognized flag is a mistake to report, never a
    // reason to proceed as if nothing was asked for.
    return {
      output: `${USAGE_SETUP}\n\nunrecognized: --${unknown.join(", --")}`,
      exitCode: 2,
    };
  }

  const { target } = flags;
  if (target !== undefined && !KNOWN_TARGETS.includes(target)) {
    return { output: `${USAGE_SETUP}\n\nknown targets: ${KNOWN_TARGETS.join(", ")}`, exitCode: 2 };
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
  if (hasHelp(args)) return { output: USAGE_RECOMMEND, exitCode: 0 };
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

/** `common-rules extension create` — sole write path for an extension artifact (FR-080, NFR-083). */
function formatExtensionCreate(args: readonly string[]): CommandOutcome {
  if (hasHelp(args)) return { output: USAGE_EXTENSION_CREATE, exitCode: 0 };

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
  if (hasHelp(args)) return { output: USAGE_EXTENSION_REPAIR, exitCode: 0 };

  const { name } = parseFlags(args);
  if (!name) return { output: USAGE_EXTENSION_REPAIR, exitCode: 2 };

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
  return { output: USAGE_EXTENSION, exitCode: hasHelp(args) ? 0 : 2 };
}

export const COMMANDS: Record<string, (args: readonly string[]) => CommandOutcome> = {
  version: (args) => (hasHelp(args) ? { output: USAGE_VERSION, exitCode: 0 } : { output: readVersion(), exitCode: 0 }),
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
  // Checked before command resolution, not added as a "help" entry to
  // COMMANDS: a no-args invocation and a top-level --help both want the
  // same full listing, and neither is a command with a return value of its
  // own to fold in there.
  if (args.length === 0 || HELP_FLAGS.has(args[0]!)) {
    return { output: USAGE_TOP, exitCode: args.length === 0 ? 2 : 0 };
  }

  const name = resolveCommand(args);
  if (name === null) {
    const known = Object.keys(COMMANDS).join(", ");
    return { output: `unrecognized command "${args[0]}". Available: ${known}.\n\n${USAGE_TOP}`, exitCode: 2 };
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
