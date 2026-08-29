import { mkdtempSync, mkdirSync, writeFileSync, readdirSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

/** Instante reconhecível e distante da época, para que passar por acaso seja impossível. */
export const INSTANTE_FIXO = "2026-08-29T17:45:00.000Z";
export const ID_FIXO = "0123456789abcdef0123456789abcdef";
export const EPOCA = "1970-01-01T00:00:00.000Z";

/** Origem injetada, previsível por construção. */
export function origemFixa(id = ID_FIXO, instante = INSTANTE_FIXO) {
  return { now: () => instante, id: () => id };
}

/** Raiz descartável com evidência de uso do alvo. */
export function projeto(prefixo = "crs-tr-"): string {
  const raiz = mkdtempSync(join(tmpdir(), prefixo));
  writeFileSync(join(raiz, "package.json"), '{"name":"descartavel"}\n');
  mkdirSync(join(raiz, ".claude"), { recursive: true });
  writeFileSync(join(raiz, ".claude", "settings.json"), "{}\n");
  return raiz;
}

/** Grava um registro à mão, para exercitar a leitura sem rodar o setup. */
export function gravarRegistro(raiz: string, conteudo: Record<string, unknown>): void {
  mkdirSync(join(raiz, ".common-rules"), { recursive: true });
  writeFileSync(join(raiz, ".common-rules", "install.json"), JSON.stringify(conteudo, null, 2));
}

/** Registro na forma que a versão anterior a esta fatia gravava. */
export function registroAntigo(): Record<string, unknown> {
  return {
    target: "claude-code",
    version: "1.0.0",
    hooks: [{ name: "guard-secrets", target: ".claude/settings.json", version: "1.0.0", installedAt: EPOCA, event: "PreToolUse" }],
  };
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
