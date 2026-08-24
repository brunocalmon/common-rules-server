# Backlog: Phase 1: MVP TypeScript core com subsistemas integrados (specsfy, context-mode, code-review-graph, pi.dev)

| Metainformação | Valor |
| --- | --- |
| ID | BACKLOG-0003 |
| Status | Captured |
| Produto | A esclarecer |
| Épico | A esclarecer |
| Funcionalidade | A esclarecer |
| Tipo | A esclarecer |
| Prioridade | Não priorizado |
| Milestones | |
| Criado em | 2026-08-24 |
| Spec promovida | Nenhuma |

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
