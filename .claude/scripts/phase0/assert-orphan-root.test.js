// Guarda o risco de a v0.2.8 continuar alcançável a partir da linha nova.
const { git, refExists, assert, WORK_BRANCH, MAIN_BRANCH } = require("./lib");

assert("assert-orphan-root", [
  // SPECSFY: US-001 FR-002 AC-002
  [`branch ${WORK_BRANCH} existe`, () =>
    refExists(WORK_BRANCH) || `referência ${WORK_BRANCH} não encontrada`],

  // SPECSFY: US-001 FR-002 AC-002
  ["histórico tem exatamente um commit", () => {
    if (!refExists(WORK_BRANCH)) return "referência ausente";
    const count = git(["rev-list", "--count", WORK_BRANCH]);
    return count === "1" || `encontrados ${count} commits`;
  }],

  // SPECSFY: US-001 FR-002 AC-002
  ["o commit raiz não tem pai", () => {
    if (!refExists(WORK_BRANCH)) return "referência ausente";
    const line = git(["rev-list", "--parents", "-n", "1", WORK_BRANCH]);
    if (line === null) return "não foi possível ler o commit";
    const parents = line.split(/\s+/).length - 1;
    return parents === 0 || `o commit declara ${parents} pai(s)`;
  }],

  // SPECSFY: US-001 FR-002 AC-002
  [`sem ancestral comum com ${MAIN_BRANCH}`, () => {
    if (!refExists(WORK_BRANCH) || !refExists(MAIN_BRANCH)) return "referência ausente";
    // merge-base sai diferente de zero quando não há ancestral: é exatamente o que queremos.
    const base = git(["merge-base", WORK_BRANCH, MAIN_BRANCH]);
    return base === null || `ancestral comum encontrado: ${base}`;
  }],
]);
