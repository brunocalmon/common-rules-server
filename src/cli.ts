#!/usr/bin/env node
import { argv, exit, stderr, stdout } from "node:process";
import { fileURLToPath } from "node:url";
import { realpathSync, readFileSync } from "node:fs";
import { defaultEnvironment, inspectDependencies, type Report } from "./doctor.js";
import { runSetup, TARGET_SETTINGS, loadHooks } from "./setup/run.js";
import { detectEnvironment } from "./setup/env.js";
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
 * Formata uma linha por dependência, com camada, origem e versão.
 *
 * Extraído de `formatReport()` para ser exercitável com um `Report` injetado
 * — a fatia 1d precisa provar o texto da camada `agent` sem depender do que
 * está instalado na máquina de quem roda a suíte (NFR-032, SPEC-0008).
 */
export function renderReport(report: Report): string {
  const lines = report.results.map((d) => {
    const head = `${d.present ? "ok     " : "ausente"} ${d.name}`;
    if (!d.present) return `${head}\n        ${d.hint ?? ""}`.trimEnd();
    const suportado = d.layer === "agent" ? `, ${d.supported ? "suportado" : "não suportado"}` : "";
    return `${head} — camada ${d.layer}, origem ${d.origin}, versão ${d.version}${suportado}`;
  });
  const divergentes = (report.divergentExtensions ?? []).map(
    (d) => `divergente extensão "${d.name}" — alvo ${d.target}, ${d.reason}`,
  );
  return [...lines, ...divergentes].join("\n");
}

function formatReport(): CommandOutcome {
  const report = inspectDependencies(defaultEnvironment(), process.cwd());
  return { output: renderReport(report), exitCode: report.exitCode };
}

/** Formata o resultado do setup, sem decidir nada sobre ele. */
function formatSetup(): CommandOutcome {
  // Ler o registro anterior é o que faz a idempotência valer na prática: sem
  // isto o comando reinstala e relata instalação a cada execução, ainda que o
  // resultado em disco seja o mesmo.
  const root = process.cwd();
  const previous = readRecordFile(root, RECORD_PATH);
  const r = runSetup({
    env: detectEnvironment(root),
    root,
    write: true,
    previous,
    skills: { execute: realSkillsExecutor() },
    specsfy: { execute: realSpecsfyExecutor() },
    bridgeEnv: realBridgeEnvironment(),
    approval: {},
  });
  if (r.installed.length === 0) return { output: r.report, exitCode: r.exitCode };
  const linhas = r.installed.map((h) => `  ${h.name} — evento ${h.event}, em ${TARGET_SETTINGS}`);
  return { output: [r.report, ...linhas].join("\n"), exitCode: r.exitCode };
}

/** `--backend <nome>` e `--local-model <nome>` — override humano, nunca revalidado (FR-036, DEC-039). */
function parseRecommendOverride(args: readonly string[]): RecommendOverride {
  const override: RecommendOverride = {};
  for (let i = 0; i < args.length; i++) {
    const flag = args[i];
    const valor = args[i + 1];
    if (flag === "--backend" && valor !== undefined) {
      override.backend = valor;
      i++;
    } else if (flag === "--local-model" && valor !== undefined) {
      override.localModel = valor;
      i++;
    }
  }
  return override;
}

/** Resolve as três fontes reais e imprime `recommendation.report` (FR-037). */
function formatRecommend(args: readonly string[]): CommandOutcome {
  const r = recommend(
    detectBackends(realBackendEnvironment()),
    listOllamaModels(),
    readCapacity(),
    parseRecommendOverride(args),
  );
  return { output: r.report, exitCode: r.backend === null ? 1 : 0 };
}

/** Lê `--flag valor` da linha de comando; flags sem valor seguinte são ignoradas. */
function parseFlags(args: readonly string[]): Record<string, string> {
  const flags: Record<string, string> = {};
  for (let i = 0; i < args.length; i++) {
    const flag = args[i];
    const valor = args[i + 1];
    if (flag?.startsWith("--") && valor !== undefined) {
      flags[flag.slice(2)] = valor;
      i++;
    }
  }
  return flags;
}

const USO_EXTENSION_CREATE =
  "uso: common-rules extension create --category <override|extension|new> --target <alvo> --name <nome> --file <arquivo-com-o-conteudo>";

/** `common-rules extension create` — único caminho de escrita de um artefato de extensão (FR-080, NFR-083). */
function formatExtensionCreate(args: readonly string[]): CommandOutcome {
  const { category, target, name, file } = parseFlags(args);
  if (category !== "override" && category !== "extension" && category !== "new") {
    return { output: USO_EXTENSION_CREATE, exitCode: 2 };
  }
  if (!target || !name || !file) {
    return { output: USO_EXTENSION_CREATE, exitCode: 2 };
  }
  const root = process.cwd();
  const content = readFileSync(file, "utf8");
  const managedHooks = loadHooks().map((h) => h.name);
  const resultado = createExtension({
    category,
    name,
    target,
    content,
    registryEnv: realChecksumEnvironment(root),
    targetEnv: realTargetFileEnvironment(root),
    managedHooks,
  });
  if (!resultado.ok) return { output: resultado.reason ?? "recusado", exitCode: 1 };
  return { output: `extensão "${name}" criada em ${resolveTargetPath(target)}`, exitCode: 0 };
}

/** `common-rules extension repair` — quarentena o divergente e restaura o original, nunca apaga (FR-084, FR-085). */
function formatExtensionRepair(args: readonly string[]): CommandOutcome {
  const { name } = parseFlags(args);
  if (!name) return { output: "uso: common-rules extension repair --name <nome>", exitCode: 2 };

  const root = process.cwd();
  const registryEnv = realChecksumEnvironment(root);
  const targetEnv = realTargetFileEnvironment(root);
  const registry = readExtensionRegistry(registryEnv);
  const divergentes = diagnoseExtensions(registry, targetEnv, listPresentExtensionNames(root));
  const divergente = divergentes.find((d) => d.name === name);
  if (!divergente) return { output: `"${name}" não está divergente; nada para reparar`, exitCode: 1 };

  const resultado = repairExtension(divergente, {
    registry,
    targetEnv,
    quarantineEnv: realQuarantineEnvironment(root),
  });
  if (!resultado.ok) return { output: resultado.reason ?? "reparo recusado", exitCode: 1 };
  return { output: `"${name}" reparado; conteúdo divergente movido para ${resultado.quarantinePath}`, exitCode: 0 };
}

function formatExtension(args: readonly string[]): CommandOutcome {
  const sub = args[0];
  if (sub === "create") return formatExtensionCreate(args.slice(1));
  if (sub === "repair") return formatExtensionRepair(args.slice(1));
  return { output: "uso: common-rules extension <create|repair> ...", exitCode: 2 };
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

/** Resolve o argumento recebido para um comando conhecido, ou null. */
export function resolveCommand(args: readonly string[]): string | null {
  const first = args[0];
  if (first === undefined) return null;
  return ALIASES[first] ?? null;
}

export function run(args: readonly string[]): CommandOutcome {
  const name = resolveCommand(args);
  if (name === null) {
    const conhecidos = Object.keys(COMMANDS).join(", ");
    return { output: `comando não reconhecido. Disponíveis: ${conhecidos}`, exitCode: 2 };
  }
  const command = COMMANDS[name];
  if (command === undefined) return { output: `comando ${name} sem implementação`, exitCode: 2 };
  return command(args.slice(1));
}

/**
 * Resolve `argv[1]` pelo caminho real antes de comparar.
 *
 * Toda instalação global do npm — `npm link` ou `npm install -g` de pacote
 * publicado — entrega o binário como link simbólico. `argv[1]` preserva o
 * caminho do link, e `fileURLToPath(import.meta.url)` é sempre o caminho
 * real; comparar os dois direto nunca bate fora deste checkout. Devolve
 * `undefined` em vez de lançar quando o caminho não existe, para que o guard
 * simplesmente não dispare em vez de derrubar o processo.
 */
function realEntryPath(caminho: string | undefined): string | undefined {
  if (caminho === undefined) return undefined;
  try {
    return realpathSync(caminho);
  } catch {
    return undefined;
  }
}

// Só executa quando invocado como binário; importar o módulo não imprime nada,
// o que é o que permite a surface.test.ts inspecionar COMMANDS sem efeito.
if (fileURLToPath(import.meta.url) === realEntryPath(argv[1])) {
  const { output, exitCode } = run(argv.slice(2));
  (exitCode === 0 ? stdout : stderr).write(`${output}\n`);
  exit(exitCode);
}
