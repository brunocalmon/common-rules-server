// Guarda o risco mais grave da fase: a sequência destrutiva escrever na linha
// que deveria permanecer intocada. Sem esta asserção, uma escrita acidental em
// main ou archived passaria despercebida até que fosse tarde para desfazer.
const { git, sha, readState, assert, MAIN_BRANCH, ARCHIVED_BRANCH, STATE_FILE } = require("./lib");

const compare = (branch, key) => () => {
  const state = readState();
  if (!state) return `baseline não registrada em ${STATE_FILE}`;
  const expected = state[key];
  if (!expected) return `baseline não contém ${key}`;
  const current = sha(branch);
  if (current === null) return `referência ${branch} não encontrada`;
  return current === expected || `${branch} mudou: ${current} ≠ ${expected}`;
};

assert("assert-baseline-untouched", [
  // SPECSFY: US-001 US-002 NFR-002 AC-007
  ["a baseline foi registrada no congelamento", () =>
    readState() !== null || `${STATE_FILE} ausente ou ilegível`],

  // SPECSFY: US-002 FR-001 NFR-002 AC-007
  [`${MAIN_BRANCH} mantém o SHA da baseline`, compare(MAIN_BRANCH, "mainSha")],

  // SPECSFY: US-002 FR-001 NFR-002 AC-007
  [`${ARCHIVED_BRANCH} mantém o SHA da baseline`, compare(ARCHIVED_BRANCH, "archivedSha")],

  // A referência remota tem baseline própria. Compará-la com a da main local
  // testaria se local e remoto coincidem — propriedade que nunca foi requisito
  // e que diverge legitimamente quando há commit local ainda não publicado.
  // SPECSFY: US-002 FR-001 NFR-002 AC-007
  [`origin/${MAIN_BRANCH} mantém o SHA da baseline`, compare(`refs/remotes/origin/${MAIN_BRANCH}`, "originMainSha")],

  // SPECSFY: US-002 NFR-003 AC-007
  [`${ARCHIVED_BRANCH} não recebeu commit posterior`, () => {
    const state = readState();
    if (!state || !state.archivedSha) return "baseline não registrada";
    const descendants = git(["rev-list", "--count", `${state.archivedSha}..${ARCHIVED_BRANCH}`]);
    if (descendants === null) return `não foi possível inspecionar ${ARCHIVED_BRANCH}`;
    return descendants === "0" || `${descendants} commit(s) além da baseline`;
  }],
]);
