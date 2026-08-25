# common-rules

Um wrapper de linha de comando que orquestra subsistemas e agentes de
codificação a partir de um contrato verificável de dependências.

Pacote npm `@brunocalmon/common-rules`, binário `common-rules`.

## O que existe hoje

**Dois comandos, e nada além disso.**

| Comando | O que faz |
| --- | --- |
| `common-rules --version` | Imprime a versão declarada no manifesto |
| `common-rules doctor` | Relata as três dependências do projeto, com camada, origem resolvida e versão |

Exemplo real de `doctor`:

```text
ok      @promovaweb/specsfy — camada npm, origem local, versão 0.10.2
ok      context-mode — camada npm, origem local, versão 1.0.169
ok      code-review-graph — camada python, origem global, versão 2.3.7
```

Três módulos em `src/`, dez arquivos de teste, 35 casos. Ciclo completo de
instalação, compilação e suíte em sete segundos.

## O que ainda não existe

Esta lista importa tanto quanto a anterior. Nada abaixo está implementado:

- **Setup**, em qualquer forma, de linha de comando ou MCP.
- **Fluxo de aprovação** antes de execução.
- **Detecção de backends de agente** — `pi`, `claude`, `cursor-agent`, `codex`,
  `agy`, `goose`, `dsh` e Ollama. O `doctor` cobre somente as três dependências
  do projeto.
- **Seleção de modelo** pelo Orchestrator.
- **Orquestração, subagentes e delegação.**
- **Regras, skills e hooks próprios.**

## Finalidade

O produto se propõe a ser um agrupador, não uma reimplementação. A intenção é
orquestrar ferramentas que já existem e são mantidas por terceiros, em vez de
reescrever suas capacidades.

Disso decorre a decisão central de arquitetura, registrada em SPEC-0002: as
dependências ocupam três camadas distintas, e cada uma recebe tratamento
diferente.

| Camada | Exemplo | Tratamento |
| --- | --- | --- |
| Subsistema npm | `@promovaweb/specsfy`, `context-mode` | Versão fixada, resolvida da cópia do projeto |
| Subsistema Python | `code-review-graph` | Instalado por `uv`, verificado e nunca instalado por esta ferramenta |
| Backend de agente | `pi`, `claude`, `codex` e outros | Detectado por capacidade, nunca instalado, intercambiável por desenho |

Para as duas primeiras vale uma regra única: **preferir a cópia local, aceitar a
global, nunca instalar globalmente**. O `doctor` sempre relata qual origem
resolveu, de modo que a diferença entre máquinas fique visível em vez de
silenciosa.

A terceira camada existe porque agentes são substituíveis. Fixar a versão de um
agente criaria uma cópia que nunca roda, já que o binário executado é o que o
`PATH` resolve.

## Limites deliberados

- **Não instala nada no ambiente global.** O ambiente de destino é gerido de
  forma declarativa por um playbook, cuja regra é que nada se instala
  manualmente. Uma ferramenta que instalasse por conta própria disputaria com a
  única fonte da verdade do ambiente em vez de informá-la.
- **Não usa scripts de ciclo de vida na instalação.** Registrado em
  `.specsfy/RULES.md`.
- **Não publica no npm.** O manifesto declara `private` enquanto publicar
  estiver fora de escopo.

## História

O repositório abrigou, até agosto de 2026, o `common-rules-server`: um servidor
MCP em Python com seis ferramentas e 47 recursos embutidos. Aquele produto está
congelado na branch `archived`, no commit `aac477a`, com 378 arquivos e a suíte
de 1010 testes intacta. A branch é protegida contra escrita e deleção.

A v1.0 não é uma evolução daquele código. É um produto diferente, com histórico
próprio: a branch de trabalho nasceu de uma raiz órfã, sem ancestral comum com a
main, preservando apenas o registro de decisões e o framework de processo. Não
há migração, guia de compatibilidade ou caminho de atualização entre os dois.

O registro completo dessa transição está em
`specs/completed/0001-phase-0-preparacao-limpeza/spec.md`.

## Onde as decisões vivem

| Assunto | Arquivo |
| --- | --- |
| Tecnologias e camadas de dependência | `.specsfy/STACK.md` |
| Regras confirmadas | `.specsfy/RULES.md` |
| Inventário de pacotes | `.specsfy/PACKAGES.md` |
| Documentação técnica | `docs/` |
| Especificações e seu histórico | `specs/` |
