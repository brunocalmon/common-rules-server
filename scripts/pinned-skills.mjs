#!/usr/bin/env node
/**
 * Faz o Specsfy usar o `skills` que este projeto fixa, em vez do que o `npx`
 * baixar na hora.
 *
 * O instalador do Specsfy resolve a CLI de skills por `npx skills` — sem
 * versão. Duas consequências, ambas observadas: o `skills@1.5.23` que o
 * `package.json` fixa não é o que roda (o `npx` traz o `latest`, hoje
 * 1.5.24), e cada execução depende da árvore que o `npx` monta em
 * `~/.npm/_npx/<hash>`, que no runner do CI chegou incompleta e derrubou a
 * instalação com `ERR_MODULE_NOT_FOUND` em `yaml`.
 *
 * `SPECSFY_NPX_COMMAND` é o ponto de extensão que o próprio Specsfy oferece:
 * ele chama `<executável> skills <args...>`. Este shim descarta esse primeiro
 * argumento e repassa o resto para a cópia local — a mesma regra de resolução
 * que a `DEC-002` já fixa para todo o resto do projeto: preferir a cópia
 * local, nunca depender de resolução ambiente.
 */
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const bin = resolve(root, "node_modules", ".bin", "skills");

if (!existsSync(bin)) {
  console.error(`pinned-skills: ${bin} não existe. Rode a instalação de dependências antes.`);
  process.exit(1);
}

// O Specsfy monta `[executável, "skills"]` e acrescenta os argumentos reais.
const args = process.argv.slice(2);
const forwarded = args[0] === "skills" ? args.slice(1) : args;

const result = spawnSync(bin, forwarded, { stdio: "inherit" });
process.exit(result.status ?? 1);
