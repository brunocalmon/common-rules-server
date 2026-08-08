# Metodologia de Desenvolvimento (Wiki Jira-like)

Este diretório contém os templates para a metodologia de gestão de projetos baseada em Wiki (Markdown). A ideia é ter um fluxo de trabalho estruturado, com links bidirecionais, organizando o projeto em **Épicos**, **Tickets** e **Findings**.

## Estrutura de Diretórios

- `epics/`: Contém arquivos `.md` descrevendo grandes objetivos ou conjuntos de funcionalidades (ex: `EPC-001.md`).
- `tickets/`: Contém as menores unidades de trabalho (ex: `TKT-001.md`).
- `findings/`: Descobertas técnicas, dívidas ou sugestões que não bloqueiam o trabalho atual, mas devem ser registradas.
- `ROADMAP.md`: Uma visão agregada estilo Kanban.

## Fluxo de Status (Ciclo de Vida do Ticket)

O ciclo de vida obrigatório de um ticket (sem pular etapas) é:

1. **Backlog**: O ticket foi criado mas ainda não foi detalhado.
2. **Refinement**: O ticket está sendo detalhado, definindo o "Definition of Done".
3. **In Progress**: O desenvolvedor está ativamente trabalhando na tarefa.
4. **Review**: O código foi escrito e está em revisão (Code Review / Pull Request).
5. **Signoff**: Teste manual (QA ou PO) para validar o aceite.
6. **Done**: Ticket 100% concluído e integrado.

## Tipos de Ticket

- `feature`: Nova funcionalidade.
- `bug`: Correção de falha.
- `follow-up`: Trabalho derivado de um ticket anterior.
- `refactor`: Refatoração estrutural.

## Como Usar os Templates

Copie os templates localizados nas respectivas pastas e preencha o Frontmatter (YAML no topo do arquivo).

- Para um ticket: `cp .docs/template/tickets/TKT-TEMPLATE.md .docs/meu-projeto/tickets/TKT-XXX.md`
- Atualize os links bidirecionais `[Epic → Ticket]` e `[Ticket → Epic]`.
