# Engineering Wiki Hub

[Product](product/) | [Architecture](architecture/) | [Engineering](engineering/) | [Operations](operations/) | [Onboarding](onboarding/) | [Tracking](tracking/) | [Documentation Protocol](DOCUMENTATION-PROTOCOL.md)

Este é o "Cérebro Vivo" (Living Brain) do projeto. Documentação deve ser tratada como código (Docs-in-Repo), mantida próxima à implementação e atualizada nos mesmos Pull Requests das alterações de sistema.

## Princípios de Manutenção
1. **Sem Documentação Zumbi**: Documentação antiga desinforma. Use marcadores do `DOCUMENTATION-PROTOCOL.md` para deprecá-la de forma rastreável.
2. **Minimum Viable Documentation**: É preferível ter poucas páginas atualizadas e vitais do que dezenas de guias desatualizados.
3. **Fonte Única da Verdade**: Se uma regra existe no código e na documentação, o código é a fonte final. A documentação explica o **porquê**.

## Como Navegar
- `/product`: Requisitos do produto, PRDs e Personas.
- `/architecture`: ADRs (Architecture Decision Records) e Design de Sistemas (ex: C4 model, Data Model).
- `/engineering`: Padrões de código, "Definition of Done", guias de testes.
- `/operations`: Playbooks de deploy, resposta a incidentes, Post-Mortems blameless.
- `/onboarding`: "Dia Um" de um novo desenvolvedor. Checklist e setup de ambiente.
- `/tracking`: Gestão Ágil Jira-like (Roadmap, Epics, Tickets).
