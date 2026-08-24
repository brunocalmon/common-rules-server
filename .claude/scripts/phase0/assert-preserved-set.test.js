// Guarda o risco de perder o registro de decisões ou o framework durante a limpeza.
const { filesIn, refExists, assert, WORK_BRANCH, MAIN_BRANCH } = require("./lib");

// Compara um caminho preservado entre a branch de trabalho e a main, arquivo a arquivo.
const identical = (path) => () => {
  if (!refExists(WORK_BRANCH) || !refExists(MAIN_BRANCH)) return "referência ausente";
  const work = filesIn(WORK_BRANCH, [path]);
  const main = filesIn(MAIN_BRANCH, [path]);
  if (main === null || !main.length) return `${path} não existe em ${MAIN_BRANCH}`;
  if (work === null || !work.length) return `${path} ausente ou vazio em ${WORK_BRANCH}`;
  const missing = main.filter((f) => !work.includes(f));
  const extra = work.filter((f) => !main.includes(f));
  if (missing.length) return `${missing.length} arquivo(s) perdido(s), p.ex. ${missing[0]}`;
  if (extra.length) return `${extra.length} arquivo(s) inesperado(s), p.ex. ${extra[0]}`;
  return true;
};

// Uma condição por caminho, para que a falha nomeie exatamente o que se perdeu.
assert("assert-preserved-set", [
  // SPECSFY: US-001 FR-003 AC-003
  [`branch ${WORK_BRANCH} existe`, () =>
    refExists(WORK_BRANCH) || `referência ${WORK_BRANCH} não encontrada`],

  // SPECSFY: US-001 FR-003 NFR-003 AC-003 AC-009
  ["specs preservado e idêntico ao da main", identical("specs")],

  // SPECSFY: US-001 FR-003 NFR-003 AC-003 AC-009
  [".claude preservado e idêntico ao da main", identical(".claude")],

  // SPECSFY: US-001 FR-003 NFR-003 AC-003 AC-009
  [".specsfy preservado e idêntico ao da main", identical(".specsfy")],

  // SPECSFY: US-001 FR-003 NFR-003 AC-003 AC-009
  [".agents preservado e idêntico ao da main", identical(".agents")],
]);
