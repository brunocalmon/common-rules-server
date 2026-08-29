import { existsSync, lstatSync, readdirSync } from "node:fs";
import { join } from "node:path";

/** Onde os conjuntos de skills convivem, relativo à raiz do projeto. */
export const SKILLS_DIR = ".claude/skills";

export interface SkillsInspection {
  /** Nomes dos conjuntos presentes, relativos a `SKILLS_DIR`. */
  dirs: string[];
  /** Caminhos que são link simbólico, em qualquer nível. */
  symlinks: string[];
  ok: boolean;
  reason?: string;
}

/**
 * Enumera o que está instalado e recusa conteúdo que viva por link.
 *
 * O instalador oficial cria link simbólico por padrão, e `--copy` é opcional.
 * Conteúdo por link mora fora do projeto: o hash deixa de descrever o que o
 * agente lê, duas máquinas divergem sem registro, e o ferramental do Specsfy
 * recusa caminho por link. Por isso a detecção percorre a árvore inteira, e não
 * apenas o primeiro nível.
 *
 * Recebe a raiz por parâmetro e não consulta diretório de trabalho nem
 * variável de ambiente.
 */
export function inspectSkills(root: string): SkillsInspection {
  const base = join(root, SKILLS_DIR);
  if (!existsSync(base)) return { dirs: [], symlinks: [], ok: true };

  const dirs: string[] = [];
  const symlinks: string[] = [];

  const andar = (dir: string, prefixo: string): void => {
    for (const entrada of readdirSync(dir, { withFileTypes: true })) {
      const rel = prefixo ? `${prefixo}/${entrada.name}` : entrada.name;
      const caminho = join(dir, entrada.name);
      if (lstatSync(caminho).isSymbolicLink()) {
        symlinks.push(rel);
        continue;
      }
      if (entrada.isDirectory()) {
        if (!prefixo) dirs.push(rel);
        andar(caminho, rel);
      }
    }
  };
  andar(base, "");

  if (symlinks.length > 0) {
    return {
      dirs, symlinks, ok: false,
      reason: `conteúdo por link simbólico em ${symlinks.join(", ")}: as skills precisam viver dentro do projeto, em arquivo real`,
    };
  }
  return { dirs, symlinks, ok: true };
}
