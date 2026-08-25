import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import type { Settings } from "../hooks/claude-code.js";
import type { InstallRecord } from "./record.js";

/**
 * Grava a configuração do alvo, preservando o que não é nosso.
 *
 * Chaves de terceiro no arquivo sobrevivem, e dentro de `hooks` só os eventos
 * que esta ferramenta gerencia são substituídos. Sobrescrever o arquivo inteiro
 * destruiria ajuste que a pessoa fez e a seção 7 exige preservar.
 */
export function writeSettings(root: string, relPath: string, settings: Settings): string {
  const alvo = resolve(root, relPath);
  mkdirSync(dirname(alvo), { recursive: true });

  let atual: Record<string, unknown> = {};
  if (existsSync(alvo)) {
    try {
      atual = JSON.parse(readFileSync(alvo, "utf8")) as Record<string, unknown>;
    } catch {
      // Arquivo ilegível é tratado como ausente, mas nunca apagado às cegas.
      atual = {};
    }
  }

  const hooksAtuais = (atual["hooks"] ?? {}) as Record<string, unknown>;
  const fundido = { ...atual, hooks: { ...hooksAtuais, ...settings.hooks } };
  writeFileSync(alvo, `${JSON.stringify(fundido, null, 2)}\n`);
  return relPath;
}

/** Grava o registro de instalação dentro do projeto. */
export function writeRecordFile(root: string, relPath: string, record: InstallRecord): string {
  const alvo = resolve(root, relPath);
  mkdirSync(dirname(alvo), { recursive: true });
  writeFileSync(alvo, `${JSON.stringify(record, null, 2)}\n`);
  return relPath;
}

/** Lê o registro anterior, quando existir. */
export function readRecordFile(root: string, relPath: string): InstallRecord | null {
  const alvo = resolve(root, relPath);
  if (!existsSync(alvo)) return null;
  try {
    return JSON.parse(readFileSync(alvo, "utf8")) as InstallRecord;
  } catch {
    return null;
  }
}
