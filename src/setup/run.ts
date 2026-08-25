import { readFileSync, readdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { detectTarget, TARGET, type TargetEnvironment } from "../hooks/detect.js";
import { readHook } from "../hooks/source.js";
import { renderSettings, translateForClaudeCode, type Settings, type TranslatedHook } from "../hooks/claude-code.js";
import { bridgePythonSubsystem, type BridgeEnvironment } from "./bridge.js";
import { matches, readRecord, RECORD_PATH, type InstallRecord, type RecordEntry } from "./record.js";
import { readVersion } from "../version.js";

/** Onde o arquivo do alvo é escrito, relativo ao projeto. */
export const TARGET_SETTINGS = ".claude/settings.json";

export interface SetupOptions {
  env: TargetEnvironment;
  /** Falso apenas para inspecionar; nada é escrito de qualquer forma quando `dryRun`. */
  write: boolean;
  dryRun?: boolean;
  previous?: InstallRecord | null;
  bridgeEnv?: BridgeEnvironment;
}

export interface SetupResult {
  installed: TranslatedHook[];
  planned: { name: string; target: string; event: string }[];
  written: string[];
  settings: Settings | null;
  record: InstallRecord | null;
  recordPath: string;
  report: string;
  bridged: boolean;
  exitCode: number;
}

const hooksDir = (): string => resolve(dirname(fileURLToPath(import.meta.url)), "..", "..", "hooks");

/** Lê os hooks empacotados. Vivem em `hooks/` na raiz, e não em `specs/`, cujo caminho muda. */
export function loadHooks(dir: string = hooksDir()): ReturnType<typeof readHook>[] {
  return readdirSync(dir)
    .filter((f) => f.endsWith(".md"))
    .sort()
    .map((f) => readHook(readFileSync(resolve(dir, f), "utf8")));
}

/**
 * Encadeia detecção, tradução, escrita e registro.
 *
 * Não escreve quando falta evidência do alvo, e não escreve em ensaio. Nos dois
 * casos devolve o que faria, porque relatar sem agir é o que permite conferir
 * antes de mexer na máquina de alguém.
 */
export function runSetup(opts: SetupOptions): SetupResult {
  const version = readVersion();
  const deteccao = detectTarget(opts.env);
  const vazio: SetupResult = {
    installed: [], planned: [], written: [], settings: null, record: null,
    recordPath: RECORD_PATH, report: "", bridged: false, exitCode: 0,
  };

  if (!deteccao.found) {
    return { ...vazio, report: `alvo ${deteccao.target} ignorado: ${deteccao.reason}` };
  }

  const hooks = loadHooks();
  const traduzidos = hooks.map(translateForClaudeCode);
  const planned = traduzidos.map((h) => ({ name: h.name, target: TARGET_SETTINGS, event: h.event }));
  const settings = renderSettings(traduzidos);

  if (opts.dryRun === true) {
    return {
      ...vazio, planned, settings,
      report: `ensaio: ${planned.length} hooks seriam instalados em ${TARGET_SETTINGS}`,
    };
  }

  // Já configurado pelo mesmo conjunto e pela mesma versão: nada a fazer.
  const jaFeito = matches(opts.previous ?? null, hooks.map((h) => h.name), version);
  if (jaFeito) {
    return {
      ...vazio, installed: traduzidos, settings,
      record: readRecord(opts.previous ?? null),
      report: `já estava configurado: ${traduzidos.length} hooks inalterados em ${TARGET_SETTINGS}`,
    };
  }

  const agora = new Date(0).toISOString();
  const entradas: RecordEntry[] = traduzidos.map((h) => ({
    name: h.name, target: TARGET_SETTINGS, version, installedAt: agora, event: h.event,
  }));
  const record: InstallRecord = { target: TARGET, version, hooks: entradas };
  const written = [TARGET_SETTINGS, RECORD_PATH];

  const ponte = opts.bridgeEnv
    ? bridgePythonSubsystem({ env: opts.bridgeEnv, execute: false })
    : { wouldInstall: null };

  return {
    installed: traduzidos, planned, written, settings, record, recordPath: RECORD_PATH,
    report: `${traduzidos.length} hooks instalados em ${TARGET_SETTINGS}`,
    bridged: ponte.wouldInstall !== null,
    exitCode: 0,
  };
}
