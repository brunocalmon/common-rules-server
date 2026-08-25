import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

// O módulo compilado vive em dist/, e o manifesto fica um nível acima — tanto no
// repositório quanto no pacote publicado, porque `files` inclui apenas `dist`.
const defaultManifestPath = (): string =>
  resolve(dirname(fileURLToPath(import.meta.url)), "..", "package.json");

/**
 * Devolve a versão declarada no manifesto, sem imprimir.
 *
 * Separar leitura de apresentação é o que permite verificar o valor sem
 * capturar saída de terminal; quem imprime é o despacho da linha de comando.
 *
 * O caminho é injetável para que o teste não dependa da posição real do
 * manifesto na máquina em que roda.
 */
export function readVersion(manifestPath: string = defaultManifestPath()): string {
  const raw = readFileSync(manifestPath, "utf8");
  const version: unknown = (JSON.parse(raw) as Record<string, unknown>)["version"];
  if (typeof version !== "string" || version.length === 0) {
    throw new Error(`o manifesto em ${manifestPath} não declara uma versão utilizável`);
  }
  return version;
}
