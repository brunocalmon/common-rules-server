# Backlog: Epic: Common Rules v1.0 — CLI-first orchestrator com human-in-the-loop

| Metainformação | Valor |
| --- | --- |
| ID | BACKLOG-0001 |
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

Rewrite radical do common-rules-server: de MCP-centric Python para CLI-first TypeScript. Wrapper que orquestra agentes (specsfy, context-mode, code-review-graph, pi.dev) com Orchestrator self-aware que solicita aprovação de plano e recomenda modelo baseado em análise completa de custo/capacidade/recursos. Setup híbrido MCP+CLI. Graceful degradation: apenas backends disponíveis. Zero compatibilidade com v0.2.8. Branch experimental refactor/v1-cli-first, versão 1.0.0.

## Problema percebido

v0.2.8 é pesado (Python, 6 tools MCP, 47 recursos built-in), replica funcionalidades de ferramentas especializadas (specsfy, context-mode, code-review-graph), não força aprovação de plano antes de orquestração, sem detecção clara de ambiente.

## Pessoa afetada ou beneficiada

Desenvolvedores usando agentes em CLI e IDEs; times com ambientes heterogêneos; usuários que querem versões fixadas garantidas; CI/CD pipelines.

## Resultado ou valor esperado

Projeto simples como wrapper/orchestrator em TypeScript; aprovação explícita de plano antes de execução; recomendação automática de modelo; detecção de backends com fallback graceful; instalação determinística via npm; isolamento de ambiente garantido; reutilização de specsfy/context-mode/code-review-graph.

## Contexto

Consolidação de 4 ideias: (1) arquitetura CLI+wrapper, (2) TypeScript+Orchestrator self-aware, (3) graceful degradation, (4) reescrita completa. Decisões: branch experimental refactor/v1-cli-first, versão 1.0.0, npm como package manager, hybrid MCP+CLI setup, approval workflow interativo/JSON, detecção híbrida com cache+revalidação, model selection analítico (custo/capacidade/recursos/usage).

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
