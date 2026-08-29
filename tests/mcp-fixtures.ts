import { mkdtempSync, mkdirSync, writeFileSync, readdirSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

/** Cria uma raiz descartável que passa por projeto e tem evidência do alvo. */
export function projetoDescartavel(prefixo = "crs-"): string {
  const raiz = mkdtempSync(join(tmpdir(), prefixo));
  mkdirSync(join(raiz, ".claude"), { recursive: true });
  writeFileSync(join(raiz, ".claude", "settings.json"), "{}\n");
  writeFileSync(join(raiz, "package.json"), '{"name":"descartavel"}\n');
  return raiz;
}

/** Cria um diretório sem qualquer marcador de projeto. */
export function diretorioVazio(): string {
  return mkdtempSync(join(tmpdir(), "crs-vazio-"));
}

/** Lista recursivamente os caminhos relativos existentes sob uma raiz. */
export function arvore(raiz: string): string[] {
  if (!existsSync(raiz)) return [];
  const saida: string[] = [];
  const andar = (dir: string, prefixo: string): void => {
    for (const entrada of readdirSync(dir, { withFileTypes: true })) {
      const rel = prefixo ? `${prefixo}/${entrada.name}` : entrada.name;
      saida.push(rel);
      if (entrada.isDirectory()) andar(join(dir, entrada.name), rel);
    }
  };
  andar(raiz, "");
  return saida.sort();
}
