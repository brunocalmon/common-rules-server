import { readFileSync, readdirSync, existsSync } from "node:fs";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { detectTarget, TARGET, type TargetEnvironment } from "../hooks/detect.js";
import { readHook } from "../hooks/source.js";
import { renderSettings, translateForClaudeCode, type Settings, type TranslatedHook } from "../hooks/claude-code.js";
import { realSource, type TraceSource } from "../telemetry/trace.js";
import { installSkills, type Executor as SkillsExecutor, type InstallResult as SkillsInstallResult } from "../skills/install.js";
import { OFFICIAL_SOURCES } from "../skills/source.js";
import { readLock, toRecordEntries } from "../skills/record.js";
import { inspectSkills } from "../skills/inventory.js";
import { installSpecsfy, type Executor as SpecsfyExecutor } from "../specsfy/install.js";
import { describeSpecsfyCommand } from "../specsfy/executor.js";
import { describeSkillsCommand } from "../skills/executor.js";
import { bridgePythonSubsystem, VENV_DIR, type BridgeEnvironment } from "./bridge.js";
import { matches, readRecord, RECORD_PATH, type InstallRecord, type SkillsRecordEntry, type RecordEntry } from "./record.js";
import { readVersion } from "../version.js";
import { resolveChannel, type TerminalContext } from "../approval/context.js";
import { realSource as realApprovalSource, interpret, type DecisionSource, type StdinReader } from "../approval/decide.js";
import {
  assembleDependencyCommands,
  partitionByApproval,
  recordApproval,
  type CommandCandidate,
} from "../approval/plan.js";
import { readApprovalRegistry, writeApprovalRegistry, realRegistryEnvironment, type RegistryEnvironment } from "../approval/registry.js";
import { writeRecordFile, writeSettings } from "./write.js";

/** Onde o arquivo do alvo é escrito, relativo ao projeto. */
export const TARGET_SETTINGS = ".claude/settings.json";

export interface SetupOptions {
  env: TargetEnvironment;
  /** Raiz do projeto onde escrever. */
  root?: string;
  /** Falso apenas para inspecionar; nada é escrito de qualquer forma quando `dryRun`. */
  write: boolean;
  dryRun?: boolean;
  previous?: InstallRecord | null;
  bridgeEnv?: BridgeEnvironment;
  /** Onde a ponte Python cria `.venv-crg/`, quando executada. Ausente, usa a raiz do pacote `common-rules` (`bridgePythonSubsystem`'s próprio padrão) — existe para que a suíte não polua o próprio repositório. */
  bridgeCwd?: string;
  /** Fonte do registro de comandos de dependência aprovados. Ausente, usa `.common-rules/approved-commands.json` na raiz do projeto. */
  registryEnv?: RegistryEnvironment;
  /**
   * Executor do instalador de skills. Ausente, a instalação é pulada, do mesmo
   * modo que a ponte Python só corre quando seu ambiente é fornecido.
   *
   * `sources`, ausente, instala as duas origens oficiais (`OFFICIAL_SOURCES`);
   * informado, instala só as listadas — usado pelos casos que exercitam uma
   * origem isolada.
   */
  skills?: { execute: SkillsExecutor; sources?: readonly string[] };
  /**
   * Executor do instalador de projeto do framework Specsfy. Ausente, a
   * instalação é pulada, no mesmo padrão de `skills`.
   */
  specsfy?: { execute: SpecsfyExecutor };
  /**
   * Origem do instante e do identificador. Ausente, a real é usada.
   *
   * Existe para dar previsibilidade aos casos sem congelar o valor em
   * produção, que foi o defeito corrigido pela SPEC-0006.
   */
  trace?: TraceSource;
  /**
   * Como obter aprovação do plano antes de escrever. Ausente na chamada da
   * biblioteca, o comando de terminal é quem decide passar um valor real por
   * padrão — do mesmo modo que `skills` fica de fora até ser fornecido.
   */
  approval?: { context?: TerminalContext; source?: DecisionSource; stdin?: StdinReader };
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

  const raiz = opts.root ?? process.cwd();

  // Já configurado pelo mesmo conjunto e pela mesma versão: nada a fazer —
  // mas hooks batendo não basta. Skills e o framework Specsfy podem ter sido
  // apagados por fora do `setup`, e "já configurado" precisa ser uma
  // afirmação sobre o disco, não só sobre o registro. As duas checagens
  // extras são baratas — sistema de arquivos, sem subprocesso — porque
  // chamar os instaladores reais a cada execução só para descobrir se há o
  // que fazer pagaria um custo desnecessário no caso comum, em que nada mudou.
  const hooksJaFeito = matches(opts.previous ?? null, hooks.map((h) => h.name), version);
  const skillsPrevias = opts.previous?.skills ?? [];
  const skillsJaFeito =
    !opts.skills || skillsPrevias.length === 0 || skillsPrevias.every((s) => inspectSkills(raiz).dirs.includes(s.name));
  const specsfyJaFeito = !opts.specsfy || existsSync(join(raiz, ".specsfy"));

  // Só a leitura de presença (sem subprocesso) decide se a ponte está
  // pendente — a mesma economia que as duas checagens acima já fazem.
  const bridgePreview = opts.bridgeEnv ? bridgePythonSubsystem({ env: opts.bridgeEnv, execute: false }) : { wouldInstall: null };
  const bridgePending = bridgePreview.wouldInstall !== null;

  const jaFeito = hooksJaFeito && skillsJaFeito && specsfyJaFeito && !bridgePending;
  if (jaFeito) {
    return {
      ...vazio, installed: traduzidos, settings,
      record: readRecord(opts.previous ?? null),
      report: `já estava configurado: ${traduzidos.length} hooks inalterados em ${TARGET_SETTINGS}`,
    };
  }

  // Candidatos de dependência: bin/args resolvidos sem executar nada (fatia
  // 1i, `PR-062`) — é isto que faz o plano de aprovação mostrar o comando de
  // verdade, e não uma descrição paralela do que skills/Specsfy/ponte fariam.
  //
  // Skills e Specsfy entram como candidatos sempre que configurados — o mesmo
  // padrão de `installSkills`/`installSpecsfy` abaixo, que já são chamados
  // incondicionalmente quando `jaFeito` é falso, deixando a idempotência real
  // para dentro de cada instalador. `skillsJaFeito`/`specsfyJaFeito` só
  // decidem se HÁ algo pendente no total (acima); quem decide se ESTE
  // comando específico já foi aprovado antes é o registro, via
  // `partitionByApproval` — não esta checagem.
  const candidatos: CommandCandidate[] = [];
  if (opts.skills) {
    for (const source of opts.skills.sources ?? OFFICIAL_SOURCES) {
      candidatos.push({
        kind: "skills",
        label: `instalar skills de ${source}`,
        command: describeSkillsCommand(source),
        pending: true,
      });
    }
  }
  if (opts.specsfy) {
    candidatos.push({
      kind: "specsfy",
      label: "instalar framework Specsfy",
      command: describeSpecsfyCommand(raiz),
      pending: true,
    });
  }
  if (bridgePending && bridgePreview.wouldInstall) {
    candidatos.push({
      kind: "bridge",
      label: "instalar code-review-graph via uv",
      command: { bin: "uv", args: ["pip", "install", "--python", VENV_DIR, bridgePreview.wouldInstall] },
      pending: true,
    });
  }
  const comandosDoPlano = assembleDependencyCommands(candidatos);

  const registryEnv = opts.registryEnv ?? realRegistryEnvironment(raiz);
  const registro = readApprovalRegistry(registryEnv);
  const { pending: comandosPendentes } = partitionByApproval(registro, comandosDoPlano);

  // A aprovação precede toda escrita, inclusive a instalação de skills, e só
  // é consultada depois das duas saídas antecipadas acima — que não escrevem
  // nada — para que AC-073 e AC-074 não recebam pergunta à toa. Um comando já
  // aprovado antes, com o mesmo binário e argv exatos, não entra nesta
  // pergunta de novo (`FR-072`, fatia 1i) — e quando hooks já batem e nenhum
  // comando de dependência é novo, a pergunta inteira é pulada (`AC-118`):
  // pedir aprovação de novo sobre o que já foi aprovado antes não é o que
  // "em lote" significa.
  const precisaAprovar = !hooksJaFeito || comandosPendentes.length > 0;
  if (opts.approval && precisaAprovar) {
    const canal = resolveChannel(opts.approval.context);
    const fonte = opts.approval.source ?? realApprovalSource(canal, opts.approval.stdin);
    const decisao = interpret(fonte, planned, comandosPendentes);
    if (!decisao.approved) {
      return { ...vazio, planned, settings, report: `não escrito: ${decisao.reason ?? "recusado"}`, exitCode: 1 };
    }
  }

  // Consumida uma vez por execução, e não por entrada: um identificador que
  // muda dentro da mesma execução não correlaciona coisa alguma.
  const origem = opts.trace ?? realSource();
  const agora = origem.now();
  const trace = origem.id();
  const entradas: RecordEntry[] = traduzidos.map((h) => ({
    name: h.name, target: TARGET_SETTINGS, version, installedAt: agora, event: h.event,
  }));
  // A instalação precede o registro: é o lockfile que ela produz que fornece a
  // procedência gravada aqui. Montar o registro antes deixaria a lista vazia.
  //
  // Uma chamada de `installSkills` por origem, relendo o lockfile entre uma e
  // outra: a primeira chamada real reescreve `skills-lock.json` (acumulando,
  // não sobrescrevendo — confirmado na reabertura), e a segunda precisa
  // enxergar esse estado atualizado para calcular conflito e idempotência
  // sobre o que já está lá, não sobre o que estava antes da primeira.
  const conjuntosPorOrigem: SkillsInstallResult[] = [];
  if (opts.skills) {
    for (const source of opts.skills.sources ?? OFFICIAL_SOURCES) {
      conjuntosPorOrigem.push(
        installSkills({
          root: raiz,
          source,
          execute: opts.skills.execute,
          previous: toRecordEntries(readLock(raiz)),
        }),
      );
    }
  }
  const algumConjuntoOk = conjuntosPorOrigem.some((c) => !c.isError);

  const skills: SkillsRecordEntry[] | undefined = algumConjuntoOk
    ? toRecordEntries(readLock(raiz)).map((e) => ({ ...e, installedAt: agora }))
    : undefined;

  const framework = opts.specsfy ? installSpecsfy({ root: raiz, execute: opts.specsfy.execute }) : null;

  // O campo é omitido quando o identificador vem vazio, em vez de gravado sem
  // conteúdo: registro com campo vazio afirma identificação que não houve.
  const record: InstallRecord = {
    target: TARGET, version,
    ...(trace ? { trace } : {}),
    hooks: entradas,
    ...(skills ? { skills } : {}),
  };
  // Escreve de fato. Antes desta linha o comando relatava instalação sem
  // produzir arquivo algum, e nenhum teste pegava porque todos verificavam o
  // retorno da função e não o disco. A regressão em clone limpo pegou.
  const written: string[] = [];
  if (opts.write) {
    written.push(writeSettings(raiz, TARGET_SETTINGS, settings));
    written.push(writeRecordFile(raiz, RECORD_PATH, record));
  }

  // Aprovado (ou sem `approval` exigida), a ponte executa de verdade quando
  // está pendente — substitui o `execute: false` fixo que nunca a deixava
  // rodar em produção (fatia 1i).
  const ponte = opts.bridgeEnv
    ? bridgePythonSubsystem({ env: opts.bridgeEnv, execute: bridgePending, cwd: opts.bridgeCwd })
    : { wouldInstall: null, executed: false, refused: null };

  // Grava depois da escrita real, nunca antes de uma recusa (que já retornou
  // cedo acima) — o registro só cresce com o que de fato foi aprovado.
  if (opts.write && comandosDoPlano.length > 0) {
    writeApprovalRegistry(recordApproval(registro, comandosDoPlano), registryEnv);
  }

  return {
    installed: traduzidos, planned, written, settings, record, recordPath: RECORD_PATH,
    report: [
      `${traduzidos.length} hooks instalados em ${TARGET_SETTINGS}`,
      ...conjuntosPorOrigem.map((c) => c.report),
      framework?.report,
      ponte.refused ? `ponte Python: ${ponte.refused}` : null,
      `execução ${trace}`,
    ].filter(Boolean).join("; "),
    bridged: ponte.executed,
    exitCode: 0,
  };
}
