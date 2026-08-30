# common-rules

Um wrapper de linha de comando que orquestra subsistemas e agentes de
codificação a partir de um contrato verificável de dependências.

Pacote npm `@brunocalmon/common-rules`, binário `common-rules`.

## O que existe hoje

**Três comandos e um servidor de protocolo, e nada além disso.**

| Comando | O que faz |
| --- | --- |
| `common-rules --version` | Imprime a versão declarada no manifesto |
| `common-rules doctor` | Relata as três dependências do projeto, com camada, origem resolvida e versão, os conjuntos de skills registrados, nomeando o que divergiu, e o identificador da última execução |
| `common-rules setup` | Instala os sete hooks no editor detectado, instala os dois conjuntos de skills e o framework Specsfy, e registra o que escreveu, identificando a execução e o momento |

**Aprovação do plano.** A biblioteca que o `setup` usa (`runSetup`) sabe apresentar o plano e aguardar aprovação antes de escrever — interativa quando há terminal, por documento JSON pela entrada padrão quando não há. Recusa, ausência e entrada malformada são negativa, sem escrita. O comando de terminal ainda não aciona esse mecanismo por padrão; a garantia vale hoje na biblioteca.

Exemplo real de `doctor`:

```text
ok      @promovaweb/specsfy — camada npm, origem local, versão 0.10.2
ok      context-mode — camada npm, origem local, versão 1.0.169
ok      code-review-graph — camada python, origem global, versão 2.3.7
```

Quinze módulos em `src/`, trinta e sete arquivos de teste, 133 casos.

O `setup` liga os subsistemas ao ciclo do agente e protege o repositório. Sete
hooks: quatro conectam `context-mode` e `code-review-graph`, dois barram comando
destrutivo e exibição de credencial, e um preserva a autoria dos commits. Ele só
escreve quando há evidência de uso do editor, grava um registro do que fez e
reexecutar não duplica nada.

Exemplo real de `setup`:

```text
7 hooks instalados em .claude/settings.json
  guard-destructive — evento PreToolUse, em .claude/settings.json
  guard-secrets — evento PreToolUse, em .claude/settings.json
  ...
```

**Dois ecossistemas de skills lado a lado, e o framework Specsfy instalado de
verdade.** O `setup` instala as skills de `mattpocock/skills` e as de
`promovaweb/specsfy` pelo mesmo instalador oficial da vercel-labs, uma origem
por vez, em cópia real e nunca link, convivendo em `.claude/skills/` sem que
uma sobrescreva a outra. A procedência de cada conjunto fica no registro do
projeto, e o `doctor` relata a deriva sem repará-la — a referência obtida não é
fixada pela origem, e dizer isso faz parte do relato.

Separadamente, o mesmo `setup` executa o instalador de projeto do próprio
framework Specsfy (`specsfy install --project <raiz>`), deixando `.specsfy/`,
`.agents/skills/`, `CLAUDE.md` e `AGENTS.md` presentes e atualizados — sem o
`common-rules` escrever ou compor o conteúdo desses arquivos por conta própria;
quem o faz é o instalador do próprio Specsfy. Enriquecer `CLAUDE.md`/`AGENTS.md`
com conteúdo próprio de orquestração do `common-rules` continua fora de escopo,
adiado para o épico de extensões da Phase 2 — só a existência desses arquivos é
garantida hoje.

**Servidor MCP**, com a tool `setup` única, sobre entrada e saída padrão pelo
binário `common-rules-mcp`. Expõe a mesma lógica que o comando de terminal, e
exige a raiz do projeto como parâmetro: o processo servidor não sabe em que
projeto está, e adivinhar escreveria na árvore errada relatando sucesso.

## O que ainda não existe

Esta lista importa tanto quanto a anterior. Nada abaixo está implementado:

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
