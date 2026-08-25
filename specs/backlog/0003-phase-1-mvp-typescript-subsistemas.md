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

## Decisões da fatia 1b, refinadas em 2026-08-24

O `setup` da v0.2.8 existia para resolver `{{PLACEHOLDER}}` dentro de 47 recursos e colocar guidance por IDE. Os recursos foram removidos na Phase 0 e o specsfy assumiu o motor de skills, de modo que o propósito precisou ser redefinido antes de especificar.

**Trabalho do setup.** Ligar subsistemas ao ciclo do agente e proteger o repositório. É o que só o common-rules pode fazer: ele não reimplementa `context-mode` nem `code-review-graph`, mas é quem os conecta.

**Hooks distribuídos.** Sete, dos dez que a v0.2.8 tinha:

| Grupo | Hooks | Motivo |
| --- | --- | --- |
| Integração de subsistema | `context-mode-pretooluse`, `context-mode-posttooluse`, `context-mode-stop`, `code-review-graph-update` | Ligam os subsistemas ao ciclo do agente |
| Guardrails | `guard-destructive`, `guard-secrets` | Segurança, independente de motor de skills |
| Autoria | `protect-authorship` | Preserva a autoria dos commits |

Os três restantes — `orchestration-briefing`, `completion-gate` e `format-after-edit` — ficam fora: pressupõem o kit de recursos que deixou de existir, e orquestração é território do specsfy. As fontes seguem consultáveis em `archived`.

**Persistência.** O `setup` grava um registro do que fez: quais hooks instalou, em qual alvo, quando e em que versão. Sem memória ele não seria idempotente nem reversível, e não responderia "o que essa ferramenta mexeu na minha máquina". Não guarda cache de resolução de dependências: `doctor` resolve em milissegundos e cache divergente reintroduz a diferença silenciosa que a coluna de origem existe para expor.

**Alvo de IDE.** Apenas Claude Code, com detecção — o `setup` só escreve se o projeto evidenciar uso, e relata o que ignorou. Cursor e Antigravity viram fatia própria. A 1a mostrou que fatia estreita expõe defeito que fatia larga encobre; com três tradutores simultâneos, um erro em um deles ficaria coberto pelos outros dois passando.

**Fora de escopo em 1b.** Approval workflow, que é 1c. Detecção de backends de agente, que é 1d. Seleção de modelo, que é 1e. Tradução para Cursor e Antigravity.

**Refatiamento por dimensionamento.** A medição contra o código congelado em `archived` mostrou que a 1b não cabia: `hook_service.py` tinha 494 linhas e 13 funções só para traduzir hooks, e `mcp_server.py` tinha 536, contra 207 linhas em três módulos que a fatia 1a inteira produziu. Eram dois subsistemas independentes numa fatia só.

A separação é por ponto de entrada. A 1b entrega os sete hooks, a detecção, o registro, a idempotência e a ponte `uv`, tendo o comando `common-rules setup` como entrada. O servidor MCP vira a fatia 1f, expondo a mesma lógica já funcionando e coberta por testes.

O critério é a própria decisão de que o projeto é primordialmente CLI e o MCP permanece enxuto: a superfície secundária não precede a lógica que expõe.

| Fatia | Entrega | Estado |
| --- | --- | --- |
| 1b | Hooks, detecção, registro e ponte `uv`, via CLI | **SPEC-0003, concluída** |
| 1f | Servidor MCP com a tool `setup` única | A especificar |

**Anotação sem efeito nesta fatia.** A pessoa responsável mencionou querer renomear a ferramenta para `maestro`, e pediu explicitamente que isso não fosse considerado agora. Fica registrado como captura futura: é renomeação que toca nome de pacote, binário, `PROJECT.md`, `STACK.md` e duas specs concluídas.

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
