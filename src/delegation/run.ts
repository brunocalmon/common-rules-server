import type { ApprovedPlan, PlannedAgent } from "../plan/model.js";
import { renderBriefs, findProfile, resolveBehavior, type DelegationConfig, type FileReader, type AgentBrief } from "./brief.js";
import type { BackendResult } from "../backends/detect.js";
import { resolveAdapter } from "./cli-backends/registry.js";
import { selectBackend } from "./cli-select.js";
import { checkToolsSupport } from "./cli-tools.js";
import { decideSpawn } from "./cli-gate.js";
import { withTemporaryAgentsFile } from "./cli-behavior-file.js";
import { spawnCliAgent, type SpawnOptions } from "./cli-spawn.js";
import type { AgentTelemetryEntry } from "../telemetry/record.js";

export type DelegationResult = { ok: true; text: string } | { ok: false; reason: string };

/** Hooks de telemetria (`SPEC-0020`) — opcionais, aditivos, sem efeito no texto retornado. */
export interface TelemetryHooks {
  now(): string;
  record(entry: AgentTelemetryEntry): void;
}

/**
 * O que `runtime: cli` precisa para de fato rodar — ambiente detectado,
 * canal de decisão do gate novo (`FR-005`) e o próprio spawn. Sem isso, um
 * agente `cli` é recusado nomeando a ausência, nunca executado às cegas.
 */
export interface CliRuntimeContext {
  /** Raiz do projeto, onde um `AGENTS.md` temporário seria escrito. */
  root: string;
  detected: readonly BackendResult[];
  /** Pergunta a decisão de UM spawn específico; chamada uma vez por agente `cli` (`FR-005`). */
  ask(): boolean;
  spawn(command: string, args: readonly string[], options?: SpawnOptions): ReturnType<typeof spawnCliAgent>;
  /** Grava um registro por tentativa de spawn (`SPEC-0020`). Ausente = nenhuma telemetria gravada. */
  telemetry?: TelemetryHooks;
}

function renderNativeAgent(planned: PlannedAgent, brief: AgentBrief): string {
  return renderBriefs([brief]);
}

/** Roda um agente `runtime: cli` de ponta a ponta, sem nunca lançar — toda recusa vira texto no relato desse agente. */
function runCliAgent(planned: PlannedAgent, brief: AgentBrief, profile: ReturnType<typeof findProfile>, cli: CliRuntimeContext): string {
  const header = `## ${planned.profile}`;
  if (profile === undefined) return `${header}\nrefused: profile not found`;

  const startedAt = cli.telemetry?.now() ?? "";
  const start = Date.now();
  const finishRefused = (stage: "tools" | "backend" | "gate" | "spawn", reason: string, backend: string | null): string => {
    cli.telemetry?.record({ agent: planned.profile, backend, model: planned.model, startedAt, durationMs: Date.now() - start, outcome: "refused", stage, reason });
    return `${header}\nrefused: ${reason}`;
  };

  const selected = selectBackend(profile, cli.detected);
  if (!selected.ok) return finishRefused("backend", selected.reason, null);

  const adapter = resolveAdapter(selected.backend);
  if (adapter === undefined) return finishRefused("backend", `unknown backend "${selected.backend}"`, selected.backend);

  const toolsCheck = checkToolsSupport(profile.capability.tools.value, profile.capability.tools.mode, adapter);
  if (!toolsCheck.ok) return finishRefused("tools", toolsCheck.reason, adapter.name);

  const decision = decideSpawn(cli.ask);
  if (!decision.approved) return finishRefused("gate", decision.reason ?? "refused", adapter.name);

  const args = adapter.buildArgs(brief);
  const runSpawn = () => cli.spawn(adapter.name, args);

  const spawnResult = adapter.injectsBehaviorByFlag
    ? runSpawn()
    : (() => {
        const wrapped = withTemporaryAgentsFile(cli.root, brief.behavior, runSpawn);
        return wrapped.ok ? wrapped.result : { ok: false as const, reason: wrapped.reason };
      })();

  if (!spawnResult.ok) return finishRefused("spawn", spawnResult.reason, adapter.name);

  cli.telemetry?.record({
    agent: planned.profile,
    backend: adapter.name,
    model: planned.model,
    startedAt,
    durationMs: Date.now() - start,
    outcome: "ran",
    exitCode: spawnResult.exitCode,
  });
  return `${header}\nbackend: ${adapter.name}\nexitCode: ${spawnResult.exitCode}\nstdout:\n${spawnResult.stdout}\nstderr:\n${spawnResult.stderr}`;
}

/**
 * Roda o gate de delegação sobre um plano já aprovado.
 *
 * `native` e `auto` emitem o briefing — `auto` resolve para nativo enquanto
 * essa for a única via entregue (`AC-011`). `cli` de fato executa via
 * subprocesso quando `cliRuntime` é informado (`SPEC-0019`); sem ele, é
 * recusado nomeando a ausência do contexto de execução, nunca rodado às
 * cegas com um ambiente adivinhado.
 *
 * Cada agente `cli` é independente: recusar um (tools, backend ausente,
 * decisão negativa) não impede os demais do mesmo plano (`FR-005`) — por
 * isso o relato agrega um bloco por agente em vez de um resultado único
 * de tudo-ou-nada. Só uma falha estrutural (perfil inexistente na
 * configuração) recusa a chamada inteira, mesma regra que `SPEC-0018` já
 * usava para `native`/`auto`.
 */
export function runDelegation(
  plan: ApprovedPlan,
  config: DelegationConfig,
  read: FileReader,
  base: string,
  cliRuntime?: CliRuntimeContext,
): DelegationResult {
  const needsCli = plan.agents.some((agent) => agent.runtime === "cli");
  if (needsCli && cliRuntime === undefined) {
    return {
      ok: false,
      reason: "runtime cli requires an execution context (detected backends, decision source, spawner) that wasn't supplied",
    };
  }

  try {
    const sections = plan.agents.map((planned) => {
      const profile = findProfile(config, planned.profile);
      if (profile === undefined) {
        throw new Error(`briefing recusado: perfil "${planned.profile}" não existe na configuração`);
      }
      const brief: AgentBrief = {
        profile: planned.profile,
        model: planned.model,
        behavior: resolveBehavior(profile, read, base),
        skills: profile.capability.skills.value,
        tools: profile.capability.tools.value,
        task: plan.task,
      };

      if (planned.runtime !== "cli") return renderNativeAgent(planned, brief);
      return runCliAgent(planned, brief, profile, cliRuntime!);
    });
    return { ok: true, text: sections.join("\n\n") };
  } catch (error) {
    return { ok: false, reason: (error as Error).message };
  }
}
