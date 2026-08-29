import { mkdtempSync, mkdirSync, writeFileSync, readdirSync, existsSync, symlinkSync } from "node:fs";
import { homedir, tmpdir } from "node:os";
import { join } from "node:path";

export const CONJUNTO_SPECSFY = ["specsfy-01-inbox", "specsfy-04-validate", "specsfy-setup"];
export const CONJUNTO_MATTPOCOCK = ["ask-matt", "code-review", "writing-shape"];

/** Raiz descartável com o que o `specsfy` já ocupa em `.claude/skills/`. */
export function projetoComSkills(prefixo = "crs-sk-"): string {
  const raiz = mkdtempSync(join(tmpdir(), prefixo));
  writeFileSync(join(raiz, "package.json"), '{"name":"descartavel"}\n');
  for (const n of CONJUNTO_SPECSFY) {
    mkdirSync(join(raiz, ".claude", "skills", n), { recursive: true });
    writeFileSync(join(raiz, ".claude", "skills", n, "SKILL.md"), `---\nname: ${n}\n---\ncorpo\n`);
  }
  return raiz;
}

/** Lista recursivamente os caminhos relativos existentes sob uma raiz. */
export function arvore(raiz: string): string[] {
  if (!existsSync(raiz)) return [];
  const saida: string[] = [];
  const andar = (dir: string, prefixo: string): void => {
    for (const e of readdirSync(dir, { withFileTypes: true })) {
      const rel = prefixo ? `${prefixo}/${e.name}` : e.name;
      saida.push(rel);
      if (e.isDirectory() && !e.isSymbolicLink()) andar(join(dir, e.name), rel);
    }
  };
  andar(raiz, "");
  return saida.sort();
}

/** Substitui um diretório de skill por um link para fora do projeto. */
export function trocarPorLink(raiz: string, nome: string): void {
  const alvo = mkdtempSync(join(tmpdir(), "crs-alheio-"));
  symlinkSync(alvo, join(raiz, ".claude", "skills", nome + "-ligado"), "dir");
}

export type Resultado = { status: number; skills?: string[] } | null;

/**
 * Executor injetado no lugar do binário real.
 *
 * `modo` decide o caminho exercitado: `sucesso` escreve os diretórios e o
 * lockfile como o instalador faria, `ausente` devolve nulo como se o binário
 * não existisse, e `erro` termina com código diferente de zero sem completar.
 */
export function executorFalso(modo: "sucesso" | "ausente" | "erro", raiz: string) {
  const chamadas: string[][] = [];
  const fn = (args: string[]): Resultado => {
    chamadas.push(args);
    if (modo === "ausente") return null;
    // A CLI real oferece `--list`, que enumera sem instalar. A detecção de
    // conflito depende disso: sem saber os nomes antes, só restaria descobrir
    // o conflito depois de já ter sobrescrito.
    if (args.includes("--list")) return { status: 0, skills: [...CONJUNTO_MATTPOCOCK] };
    if (modo === "erro") {
      // Deixa metade escrita, para que o caso prove que parcial não vira completo.
      mkdirSync(join(raiz, ".claude", "skills", CONJUNTO_MATTPOCOCK[0]!), { recursive: true });
      return { status: 1 };
    }
    for (const n of CONJUNTO_MATTPOCOCK) {
      mkdirSync(join(raiz, ".claude", "skills", n), { recursive: true });
      writeFileSync(join(raiz, ".claude", "skills", n, "SKILL.md"), `---\nname: ${n}\n---\ncorpo\n`);
    }
    escreverLock(raiz, CONJUNTO_MATTPOCOCK);
    return { status: 0 };
  };
  return { fn, chamadas };
}

/** Grava o lockfile na forma observada na pesquisa. */
export function escreverLock(raiz: string, nomes: string[], origem = "mattpocock/skills"): void {
  const skills: Record<string, unknown> = {};
  for (const n of nomes) {
    skills[n] = {
      source: origem,
      sourceType: "github",
      skillPath: `skills/engineering/${n}/SKILL.md`,
      computedHash: `hash-${n}`,
    };
  }
  writeFileSync(join(raiz, "skills-lock.json"), JSON.stringify({ version: 1, skills }, null, 2));
}

/**
 * Oráculo de confinamento para fora do projeto.
 *
 * Percorrer `$HOME` inteiro é caro e instável: outros processos escrevem lá
 * durante a execução. Este observa o primeiro nível e, sobretudo, o caminho
 * exato onde a forma global do instalador escreveria — que é onde a violação
 * apareceria de fato.
 */
export function foraDoProjeto(): { topo: number; global: string[] } {
  const topo = existsSync(homedir()) ? readdirSync(homedir()).length : 0;
  const dirGlobal = join(homedir(), ".claude", "skills");
  const global = existsSync(dirGlobal) ? readdirSync(dirGlobal).sort() : [];
  return { topo, global };
}
