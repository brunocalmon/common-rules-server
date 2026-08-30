import { mkdtempSync, mkdirSync, writeFileSync, readdirSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { PlannedItem } from "../src/approval/render";

/** Raiz descartável com evidência de uso do alvo. */
export function projeto(prefixo = "crs-ap-"): string {
  const raiz = mkdtempSync(join(tmpdir(), prefixo));
  writeFileSync(join(raiz, "package.json"), '{"name":"descartavel"}\n');
  mkdirSync(join(raiz, ".claude"), { recursive: true });
  writeFileSync(join(raiz, ".claude", "settings.json"), "{}\n");
  return raiz;
}

export function arvore(raiz: string): string[] {
  if (!existsSync(raiz)) return [];
  const saida: string[] = [];
  const andar = (dir: string, prefixo: string): void => {
    for (const e of readdirSync(dir, { withFileTypes: true })) {
      const rel = prefixo ? `${prefixo}/${e.name}` : e.name;
      saida.push(rel);
      if (e.isDirectory()) andar(join(dir, e.name), rel);
    }
  };
  andar(raiz, "");
  return saida.sort();
}

/** Contexto injetado: declara presença ou ausência de terminal na entrada padrão. */
export function contextoFixo(temTerminal: boolean) {
  return { hasTerminal: () => temTerminal };
}

/**
 * Fonte de decisão injetada, síncrona por desenho: `ask` devolve a resposta
 * diretamente, sem promessa, para que `runSetup` não precise virar
 * assíncrona. É o mesmo padrão de `TraceSource` e do executor de skills.
 */
export function decisaoFixa(aprovado: boolean, recebidos: PlannedItem[][] = []) {
  return {
    ask: (plano: PlannedItem[]): boolean => {
      recebidos.push(plano);
      return aprovado;
    },
  };
}

/** Fonte que lança se for chamada — usada para provar ausência de pedido. */
export function decisaoQueLancaSeChamada() {
  return {
    ask: (): boolean => {
      throw new Error("aprovação não deveria ter sido solicitada");
    },
  };
}

/** Fonte de canal de documento: devolve o texto que a "entrada padrão" conteria. */
export function documentoFixo(texto: string) {
  return { hasTerminal: () => false, readDocument: () => texto };
}
