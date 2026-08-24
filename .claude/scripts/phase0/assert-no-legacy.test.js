// Guarda o risco de resíduo do produto antigo sobreviver na branch nova.
const { filesIn, refExists, assert, WORK_BRANCH, PRESERVED } = require("./lib");

const REMOVED = [
  "pyproject.toml", "uv.lock", ".python-version", ".coverage",
  "Dockerfile", ".dockerignore", "agent_bdd.feature", "skills-lock.json",
  "README.md", "AGENTS.md", "CLAUDE.md",
];
const REMOVED_DIRS = ["src", ".docs", "tools", ".github", ".pytest_cache", "dist"];

const tree = () => (refExists(WORK_BRANCH) ? filesIn(WORK_BRANCH) : null);

assert("assert-no-legacy", [
  // SPECSFY: US-001 FR-004 AC-004
  [`branch ${WORK_BRANCH} existe`, () =>
    refExists(WORK_BRANCH) || `referência ${WORK_BRANCH} não encontrada`],

  // SPECSFY: US-001 FR-004 AC-004 AC-009
  ["cada caminho versionado está sob o conjunto preservado", () => {
    const files = tree();
    if (files === null) return "referência ausente";
    const outside = files.filter((f) => !PRESERVED.some((p) => f === p || f.startsWith(`${p}/`)));
    return outside.length
      ? `${outside.length} fora do conjunto, p.ex. ${outside.slice(0, 3).join(", ")}`
      : true;
  }],

  // SPECSFY: US-001 FR-004 AC-004
  ["nenhum arquivo Python versionado", () => {
    const files = tree();
    if (files === null) return "referência ausente";
    const py = files.filter((f) => f.endsWith(".py"));
    return py.length ? `${py.length} arquivo(s), p.ex. ${py.slice(0, 3).join(", ")}` : true;
  }],

  // SPECSFY: US-001 FR-004 AC-004
  ["nenhum diretório da v0.2.8 versionado", () => {
    const files = tree();
    if (files === null) return "referência ausente";
    const found = REMOVED_DIRS.filter((d) => files.some((f) => f.startsWith(`${d}/`)));
    return found.length ? `presente(s): ${found.join(", ")}` : true;
  }],

  // SPECSFY: US-001 FR-004 AC-004
  ["nenhum manifesto ou artefato nomeado da v0.2.8", () => {
    const files = tree();
    if (files === null) return "referência ausente";
    const found = REMOVED.filter((f) => files.includes(f));
    return found.length ? `presente(s): ${found.join(", ")}` : true;
  }],
]);
