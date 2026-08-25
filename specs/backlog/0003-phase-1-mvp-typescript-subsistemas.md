# Backlog: Phase 1: MVP TypeScript core com subsistemas integrados (specsfy, context-mode, code-review-graph, pi.dev)

| Metainformação | Valor |
| --- | --- |
| ID | BACKLOG-0003 |
| Status | Promoted |
| Produto | A esclarecer |
| Épico | A esclarecer |
| Funcionalidade | A esclarecer |
| Tipo | A esclarecer |
| Prioridade | Não priorizado |
| Milestones | |
| Criado em | 2026-08-24 |
| Spec promovida | specs/completed/0002-phase-1a-esqueleto-typescript/spec.md (fatia 1a) |

## Ideia original

Primeira fase de desenvolvimento: TypeScript core + CLI. Dependências fixadas via npm: specsfy, context-mode, code-review-graph, pi.dev (common-rules vence conflitos). Hybrid setup: MCP setup() tool + CLI common-rules setup (mesma lógica). Approval workflow hybrid (interativo terminal / JSON stdin CI/CD). Graceful degradation: detecção setup-time (which), cache .env, runtime revalidação se usuário pedir backend detectado como indisponível. Stock built-in IDE agents por padrão. Orchestrator model selection: análise completa (disponíveis via ollama ls etc, custo, capacidade máquina, plan usage Claude, recomendação + user override).

## Problema percebido

v0.2.8 é Python pesado. Oportunidade: MVP rápido em TypeScript com subsistemas já testados (specsfy, context-mode, code-review-graph, pi.dev). Valida wrapper/delegation pattern sem fazer tudo do zero. Graceful degradation prova robustez em ambientes heterogêneos.

## Pessoa afetada ou beneficiada

Desenvolvedores iterando rápido em TypeScript; times com specsfy/context-mode/code-review-graph já instalados; usuários em ambientes com ollama/agy/claude disponível; CI/CD sem UI interativa.

## Resultado ou valor esperado

CLI TypeScript funcional; setup único configura tudo (dependências, hooks, .env); aprovação explícita antes de orquestração; detecção robusta de backends; recomendação inteligente de modelo; fallback seguro para built-in IDE agents; prova que wrapper funciona com subsistemas reais.

## Contexto

Estratégia ágil: MVP rápido antes de adicionar complexidade. Phase 1 entrega subsistemas existentes integrados. Phase 2+ (graceful degradation refinement, multi-agente orchestration, etc). Dependências gerenciadas via npm com 'common-rules wins' em conflitos. Approval workflow detecta context (terminal vs JSON stdin). Model selection é análise completa, não heurística.

## Dependências verificadas em 2026-08-24

O backlog assumia quatro dependências fixadas via npm. A verificação contra o registro e contra a máquina mostrou que três dessas afirmações estavam erradas. Decisão confirmada: npm fixa o que é npm, e o setup exige `uv` para o que é Python, falhando quando ausente.

| Nome no backlog | Pacote real | Versão | Forma |
| --- | --- | --- | --- |
| `specsfy` | `@promovaweb/specsfy` | 0.10.2 | npm, com escopo |
| `context-mode` | `context-mode` | 1.0.169 | npm |
| `pi.dev` | `@earendil-works/pi-coding-agent` | 0.84.3 | npm, binário `pi` |
| `code-review-graph` | `code-review-graph` | 2.3.7 | **Python**, instalado por `uv tool` |

`pi` expõe `-p` para modo print e `--mode json`, que é o consumo headless previsto para o Orchestrator. `@mariozechner/pi` foi descartado: é um gerenciador de pods vLLM, não o agente.

## Backends de agente presentes nesta máquina

`claude`, `cursor-agent` e `codex` (`@openai/codex@0.149.1`). Ausentes: `pi`, `agy`, `ollama`, `aider`, `goose`. A inclusão de `codex` na lista suportada continua em aberto.

## Fatiamento decidido em 2026-08-24

A Phase 1 empacotava seis entregas. Cada uma é comparável em tamanho à Phase 0, que rendeu 14 tarefas e 93 itens de checklist sendo uma única coisa estreita. Decisão: esqueleto primeiro, capacidades depois.

| Fatia | Entrega | Estado |
| --- | --- | --- |
| 1a | Esqueleto executável: manifesto, build, runner, dependências resolvidas | **SPEC-0002, concluída** |
| 1b | Setup híbrido MCP + CLI | A especificar |
| 1c | Approval workflow interativo e JSON | A especificar |
| 1d | Detecção de backends e graceful degradation | A especificar |
| 1e | Seleção de modelo pelo Orchestrator | A especificar |

Decisões desta fatia: pacote `@brunocalmon/common-rules` com binário `common-rules`, porque `common-rules` sem escopo está ocupado no npm por um pacote abandonado desde 2023. Runner Vitest. ESM e Node maior ou igual a 20 como defaults reversíveis.

`codex` na lista de backends suportados continua em aberto, adiado para a fatia 1d.

## Referências relacionadas

- Nenhuma referência relevante encontrada.

## Comportamento esperado

A esclarecer.

## Regras de negócio

- A esclarecer conforme risco e complexidade.

## Critérios de aceitação

- A esclarecer antes de considerar o item refinado.

## Qualidades e operação

- Segurança: a avaliar.
- Privacidade: a avaliar.
- Desempenho e volume: a avaliar.
- Auditoria e observabilidade: a avaliar.

## Dependências

- Nenhuma registrada.

## Situações de erro

- A esclarecer.

## Escopo

- Dentro: a esclarecer.
- Fora: a esclarecer.

## Dúvidas, decisões e riscos

- Nenhum registrado.

## Pronto para desenvolvimento

- [ ] O problema e a pessoa beneficiada estão claros.
- [ ] O evento inicial e o resultado esperado estão claros.
- [ ] Permissões, regras e exceções relevantes estão claras.
- [ ] O resultado pode ser verificado objetivamente.
- [ ] Segurança, privacidade e desempenho foram avaliados conforme o risco.
- [ ] Fora de escopo, dependências e decisões pendentes estão registrados.

## Próximo passo

Aprofundar nesta etapa até o item ficar pronto para `$specsfy-03-specify`.
