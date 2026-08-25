import type { CanonicalEvent, Hook } from "./source.js";

/** Nome do evento no formato que o alvo usa. */
export type TargetEvent = "PreToolUse" | "PostToolUse" | "Stop";

export interface TranslatedHook {
  name: string;
  event: TargetEvent;
  blocking: boolean;
  script: string;
}

const EVENT_MAP: Record<CanonicalEvent, TargetEvent> = {
  "before-shell": "PreToolUse",
  "after-file-edit": "PostToolUse",
  stop: "Stop",
};

/**
 * Converte um hook canônico para o formato do alvo.
 *
 * Devolve estrutura e não escreve arquivo. Essa separação é deliberada: é o que
 * permite verificar a fidelidade do script sem tocar o disco. Na v0.2.8 escape
 * e escrita viviam no mesmo caminho, o escape foi consumido duas vezes e todos
 * os guards passaram a permitir tudo — defeito que sobreviveu à revisão porque
 * o arquivo gerado parecia correto.
 */
export function translateForClaudeCode(hook: Hook): TranslatedHook {
  return {
    name: hook.name,
    event: EVENT_MAP[hook.event],
    blocking: hook.blocking,
    // O fragmento atravessa sem qualquer transformação, embutido entre
    // preâmbulo e pós-âmbulo. Escapar aqui e de novo na serialização é o
    // defeito que esta fatia existe para evitar.
    script: wrap(hook),
  };
}

/**
 * Envolve o fragmento no que o torna executável.
 *
 * O bloco dentro do Markdown não é script completo: lê variáveis que alguém
 * precisa fornecer e comunica por `decision` e `message`, que alguém precisa
 * emitir. O fragmento de `guard-destructive` termina no último `fi` sem
 * imprimir nada — sozinho, nunca bloquearia.
 */
function wrap(hook: Hook): string {
  return [PREAMBLE, `HOOK_EVENT=${JSON.stringify(hook.event)}`, "", FRAGMENT_START + hook.script + FRAGMENT_END, POSTAMBLE].join("\n");
}

/** Extrai o fragmento de volta, para conferir a ida e a volta. */
export function unwrap(command: string): string {
  const i = command.indexOf(FRAGMENT_START);
  const j = command.lastIndexOf(FRAGMENT_END);
  if (i < 0 || j < 0) return command;
  return command.slice(i + FRAGMENT_START.length, j);
}

const FRAGMENT_START = "# >>> fragmento do hook\n";
const FRAGMENT_END = "\n# <<< fragmento do hook";

const PREAMBLE = [
  "#!/usr/bin/env bash",
  "HOOK_INPUT=$(cat)",
  "decision=allow",
  "message=''",
  "PROJECT_DIR=\"${CLAUDE_PROJECT_DIR:-$PWD}\"",
  // Extrair o comando do JSON, em vez de casar contra o JSON inteiro. O bruto
  // também carrega prosa: uma mensagem de commit que menciona `rm -rf` faria um
  // guard disparar sobre texto, e guard que atrapalha trabalho comum é desligado.
  "HOOK_COMMAND=$(printf '%s' \"$HOOK_INPUT\" | tr '\\n' ' ' \\",
  "  | sed -n 's/.*\"command\"[[:space:]]*:[[:space:]]*\"\\(\\([^\"\\\\]\\|\\\\.\\)*\\)\".*/\\1/p')",
  "HOOK_FILE=$(printf '%s' \"$HOOK_INPUT\" | tr '\\n' ' ' \\",
  "  | sed -n 's/.*\"\\(file_path\\|path\\)\"[[:space:]]*:[[:space:]]*\"\\(\\([^\"\\\\]\\|\\\\.\\)*\\)\".*/\\2/p')",
  "",
].join("\n");

const POSTAMBLE = [
  "",
  "# Emite a decisão que o fragmento definiu. Sem isto o fragmento não bloqueia.",
  "case \"$decision\" in",
  "  deny) printf '%s\\n' \"$message\" >&2; exit 2 ;;",
  "  ask)  printf '%s\\n' \"$message\" >&2; exit 2 ;;",
  "  *)    exit 0 ;;",
  "esac",
].join("\n");

interface SettingsEntry {
  matcher: string;
  hooks: { type: "command"; command: string; blocking?: boolean }[];
}

export interface Settings {
  hooks: Partial<Record<TargetEvent, SettingsEntry[]>>;
}

/**
 * Monta o objeto de configuração do alvo.
 *
 * Devolve estrutura de dados, não texto. Quem serializa é quem escreve, e o
 * serializador do JSON faz o escape uma única vez.
 */
export function renderSettings(hooks: readonly TranslatedHook[]): Settings {
  const settings: Settings = { hooks: {} };
  for (const h of hooks) {
    const lista = (settings.hooks[h.event] ??= []);
    lista.push({
      matcher: h.name,
      hooks: [{ type: "command", command: h.script, ...(h.blocking ? { blocking: true } : {}) }],
    });
  }
  return settings;
}

/** Recupera os scripts na ordem em que foram inseridos, para conferir a ida e a volta. */
export function extractScripts(settings: Settings): string[] {
  const ordem: TargetEvent[] = ["PreToolUse", "PostToolUse", "Stop"];
  const out: string[] = [];
  for (const evento of ordem) {
    for (const entrada of settings.hooks[evento] ?? []) {
      for (const h of entrada.hooks) out.push(h.command);
    }
  }
  return out;
}
