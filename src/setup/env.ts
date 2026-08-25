import { existsSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import type { TargetEnvironment } from "../hooks/detect.js";

/**
 * Observa o projeto para alimentar a detecção.
 *
 * Isolado num módulo próprio porque é a única parte que toca o sistema de
 * arquivos: a decisão em si recebe o resultado por parâmetro, e é isso que
 * torna a detecção verificável sem depender da máquina.
 */
export function detectEnvironment(root: string = process.cwd()): TargetEnvironment {
  const dir = resolve(root, ".claude");
  if (!existsSync(dir)) return { hasClaudeCode: false, files: [] };
  const files = readdirSync(dir).map((f) => `.claude/${f}`);
  return { hasClaudeCode: true, files: [".claude/", ...files] };
}
