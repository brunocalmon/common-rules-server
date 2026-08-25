#!/usr/bin/env node
// Executa o ciclo de verificação da fatia 1a e registra o tempo de cada etapa.
//
// Existe porque a asserção de orçamento lê medições tomadas, e não as toma:
// num clone recém-obtido não há registro algum, e a suíte reprova. Este script
// é o passo que AC-009 descreve como "a pessoa executa as três etapas em
// sequência", tornado repetível.
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const ETAPAS = [
  { nome: "install", comando: "npm", args: ["ci", "--ignore-scripts"] },
  { nome: "build", comando: "npm", args: ["run", "build"] },
  { nome: "test", comando: "npm", args: ["run", "test:tdd"] },
];

const gitDir = spawnSync("git", ["rev-parse", "--absolute-git-dir"], { encoding: "utf8" })
  .stdout.trim();
const registro = resolve(gitDir, "phase1a-timings.json");

// A suíte afere um registro existente e não consegue medir a própria duração
// enquanto roda. Por isso as medições de instalação e compilação são gravadas
// antes da suíte, e a duração dela é atualizada depois. `test` parte do valor
// da execução anterior, ou de zero num clone recém-obtido.
const anterior = existsSync(registro) ? JSON.parse(readFileSync(registro, "utf8")) : {};
const tempos = { install: 0, build: 0, test: anterior.test ?? 0 };

for (const etapa of ETAPAS) {
  const inicio = Date.now();
  const r = spawnSync(etapa.comando, etapa.args, { stdio: "inherit" });
  tempos[etapa.nome] = Math.round((Date.now() - inicio) / 1000);

  if (etapa.nome !== "test") writeFileSync(registro, JSON.stringify(tempos));

  if (r.status !== 0) {
    // Interrompe na primeira reprovação: prosseguir mediria etapas que já não
    // fazem sentido, e o registro parcial induziria a leitura de que o ciclo
    // passou.
    console.error(`\nciclo interrompido: a etapa ${etapa.nome} reprovou com código ${r.status}`);
    process.exit(r.status ?? 1);
  }
}

writeFileSync(registro, JSON.stringify(tempos));

const total = Object.values(tempos).reduce((a, b) => a + b, 0);
const detalhe = ETAPAS.map((e) => `${e.nome} ${tempos[e.nome]}s`).join(", ");
console.log(`\nciclo concluído: ${detalhe} — total ${total}s`);
