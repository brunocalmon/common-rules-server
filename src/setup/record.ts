export interface RecordEntry {
  /** Nome canônico do hook instalado. */
  name: string;
  /** Caminho, relativo ao projeto, onde a entrada foi escrita. */
  target: string;
  /** Versão do pacote que instalou, para detectar defasagem. */
  version: string;
  /** Momento da instalação, em ISO 8601. */
  installedAt: string;
  /** Evento sob o qual a entrada ficou no alvo, para localizá-la na remoção. */
  event: string;
}

/** Procedência de um conjunto de skills, lida do lockfile do instalador. */
export interface SkillsRecordEntry {
  name: string;
  source: string;
  sourceType: string;
  skillPath: string;
  computedHash: string;
  installedAt: string;
}

export interface InstallRecord {
  target: string;
  version: string;
  hooks: RecordEntry[];
  /** Conjuntos instalados, quando houve instalação de skills. */
  skills?: SkillsRecordEntry[];
}

/** Caminho do registro, sempre dentro do projeto. */
export const RECORD_PATH = ".common-rules/install.json";

/**
 * Normaliza um registro lido de disco.
 *
 * Aceita o objeto já em memória, e não um caminho, para que a leitura seja
 * verificável sem tocar o sistema de arquivos.
 */
export function readRecord(raw: InstallRecord | string | null): InstallRecord {
  if (raw === null) return { target: "", version: "", hooks: [] };
  const o = typeof raw === "string" ? (JSON.parse(raw) as InstallRecord) : raw;
  return { target: o.target ?? "", version: o.version ?? "", hooks: [...(o.hooks ?? [])] };
}

/** Serializa o registro. Devolve o objeto normalizado, para conferir a ida e a volta. */
export function writeRecord(record: InstallRecord): InstallRecord {
  return readRecord(JSON.parse(JSON.stringify(record)) as InstallRecord);
}

/**
 * Lista o que precisa ser removido para desfazer a instalação.
 *
 * Cada item carrega caminho e evento porque remover exige localizar a entrada
 * dentro do arquivo do alvo, e não apagar o arquivo inteiro: ele pode conter
 * configuração de terceiro que a ferramenta preservou ao escrever.
 */
export function entriesToRemove(record: InstallRecord): { target: string; event: string; name: string }[] {
  return readRecord(record).hooks.map((h) => ({ target: h.target, event: h.event, name: h.name }));
}

/** Decide se o registro descreve o mesmo conjunto que se pretende instalar. */
export function matches(record: InstallRecord | null, names: readonly string[], version: string): boolean {
  if (record === null) return false;
  const r = readRecord(record);
  if (r.version !== version) return false;
  const instalados = r.hooks.map((h) => h.name).sort();
  return instalados.length === names.length && instalados.every((n, i) => n === [...names].sort()[i]);
}
