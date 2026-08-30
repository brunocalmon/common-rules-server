/**
 * Backends de agente com capacidade de invocação sem interação demonstrada por
 * execução real — ver `research/backends/invocacao-sem-interacao.md`, SPEC-0008.
 *
 * A lista é fixa no código, e não descoberta por sondagem de `--help` em
 * produção: a fatia 1d corrigiu uma conclusão anterior do backlog, que havia
 * checado só o `--help` de topo de cada CLI e perdido `codex exec` e
 * `goose run`, ambos subcomandos dedicados à mesma capacidade.
 */
export const SUPPORTED_AGENT_BACKENDS = ["pi", "agy", "claude", "codex", "goose"] as const;

/**
 * Candidatos conhecidos, suportados e não suportados.
 *
 * `dsh` e `cursor-agent` entram aqui para que o `doctor` os distinga de
 * backends realmente ausentes (`FR-032`, `FR-033`) — presentes na máquina,
 * mas sem capacidade demonstrada de invocação sem interação.
 */
export const KNOWN_AGENT_BACKENDS = [...SUPPORTED_AGENT_BACKENDS, "dsh", "cursor-agent"] as const;
