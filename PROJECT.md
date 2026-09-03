# common-rules

Um wrapper de linha de comando que orquestra subsistemas e agentes de
codificação a partir de um contrato verificável de dependências.

Pacote npm `@brunocalmon/common-rules`, binário `common-rules`.

## O que existe hoje

**Cinco comandos e um servidor de protocolo, e nada além disso.**

| Comando | O que faz |
| --- | --- |
| `common-rules --version` | Imprime a versão declarada no manifesto |
| `common-rules doctor` | Relata as três dependências do projeto e os backends de agente detectados, com camada, origem resolvida e versão, os conjuntos de skills registrados, nomeando o que divergiu, cada extensão local divergente do que a CLI gravou, e o identificador da última execução |
| `common-rules setup` | Instala os sete hooks no editor detectado, instala os dois conjuntos de skills e o framework Specsfy, escreve o roteador do `common-rules` em `CLAUDE.md`/`AGENTS.md`, e registra o que escreveu, identificando a execução e o momento |
| `common-rules recommend` | Recomenda um backend de agente presente e, quando o `ollama` está disponível, o maior modelo local que cabe na memória livre, com override humano opcional |
| `common-rules extension create` | Cria um artefato de extensão local (`override`/`extension`, nunca `new` para um dos sete hooks gerenciados) — hook, regra ou o próprio roteador — que sobrevive a uma reinstalação |
| `common-rules extension repair` | Move o conteúdo de uma extensão divergente para `.common-rules/quarantine/` e restaura o original, sem apagar nada |

**Aprovação do plano, em lote.** `common-rules setup` apresenta o plano e aguarda aprovação antes de escrever — interativa quando há terminal, por documento JSON pela entrada padrão quando não há. Recusa, ausência e entrada malformada são negativa, sem escrita. O plano lista cada comando de dependência que a execução de fato dispararia — hooks, instalador de skills por origem, instalador do framework Specsfy e a ponte Python, quando aplicável — não só os hooks. Um comando já aprovado antes, com o mesmo binário e argv exatos, não pede aprovação de novo, mesmo quando a execução precisa reinstalar por drift; qualquer diferença no argv, como uma versão diferente, conta como comando novo. O registro fica em `.common-rules/approved-commands.json`, local ao projeto.

**Reconciliação de drift.** `setup` só relata "já estava configurado" quando hooks, skills e o framework Specsfy estão de fato presentes no disco — não só quando os hooks batem com o registro. Apagar `.claude/skills/` ou `.specsfy/` por fora e rodar `setup` de novo restaura o que faltar.

**Backends de agente.** `doctor` relata, numa terceira camada informativa, cada backend de agente candidato conhecido — presença, versão e se tem capacidade demonstrada de invocação sem interação. Suportados hoje: `pi`, `agy`, `claude`, `codex` e `goose`. Nenhum backend ausente afeta o código de saída: `common-rules` detecta, nunca instala agente.

Exemplo real de `doctor`:

```text
ok      @promovaweb/specsfy — camada npm, origem local, versão 0.10.2
ok      context-mode — camada npm, origem local, versão 1.0.169
ok      code-review-graph — camada python, origem global, versão 2.3.7
```

Quarenta e um módulos em `src/`, 145 arquivos de teste, 370 casos.

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
`.agents/skills/`, `CLAUDE.md` e `AGENTS.md` presentes e atualizados — quem
compõe o conteúdo desses arquivos é o instalador do próprio Specsfy. Por cima
disso, o `setup` acrescenta sua própria seção — um roteador minimalista em
`CLAUDE.md` e um ponteiro mínimo em `AGENTS.md`, ambos gravados pelo mesmo
caminho único de criação de extensão, ancorados por comentário HTML e
idempotentes (não reescreve quando já presentes).

**Extensões locais e reparo assistido.** Um hotfix local — customizar um dos
sete hooks, adicionar uma regra nova, ou ajustar o próprio roteador — sobrevive
a uma reinstalação sem esperar release. `common-rules extension create` grava
o conteúdo com uma âncora HTML no arquivo alvo (o próprio `CLAUDE.md`/
`AGENTS.md`, ou `.common-rules/extensions/<nome>.md`) e o checksum em
`.common-rules/extensions.json` — o único caminho de escrita; uma skill de
fachada (`common-rules-extension-creator`) entrevista a pessoa e aciona esse
comando, nunca escreve arquivo por conta própria. Essa skill é empacotada
com o próprio `common-rules` (`resources/skills/`, junto de `resources/hooks/`)
e o `setup` a entrega em `.claude/skills/`/`.agents/skills/` do projeto-alvo,
sem checksum — é conteúdo do pacote, não algo que a pessoa customiza. `doctor` relata cada
artefato cujo conteúdo real diverge do checksum registrado, sem nunca
corrigir sozinho — detectabilidade, não prevenção. `common-rules extension
repair --name <nome>` move o conteúdo divergente para
`.common-rules/quarantine/` (sem expiração automática) e restaura o original;
recusa o reparo inteiro se a quarentena não for gravável, em vez de reparar
pela metade.

**Seleção de modelo.** `common-rules recommend` recomenda, de forma
determinística e sem rede, um backend dentre os suportados presentes (na
ordem de `pi`, `agy`, `claude`, `codex`, `goose`) e, quando o `ollama` está
disponível, o maior modelo local cujo tamanho cabe na memória livre da
máquina. Uma escolha humana explícita (`--backend`/`--local-model`) substitui
o cálculo correspondente sem revalidação. **Custo e uso de plano por backend
ficam deliberadamente fora do cálculo** — nenhum dos cinco backends
suportados expõe essa informação sem exigir login, e calculá-la exigiria
quebrar a garantia sem rede e sem autenticação que o projeto inteiro mantém;
o relatório sempre declara essa ausência em vez de silenciá-la.

**Servidor MCP**, com a tool `setup` única, sobre entrada e saída padrão pelo
binário `common-rules-mcp`. Expõe a mesma lógica que o comando de terminal, e
exige a raiz do projeto como parâmetro: o processo servidor não sabe em que
projeto está, e adivinhar escreveria na árvore errada relatando sucesso.

## O que ainda não existe

Esta lista importa tanto quanto a anterior. Nada abaixo está implementado:

- **Orquestração, subagentes e delegação.** Nenhum motor de Orchestrator
  existe ainda — `recommend` calcula uma recomendação isolada, sem consumi-la
  em nenhum fluxo automático.
- **Custo e uso de plano** na seleção de modelo — deliberadamente fora de
  escopo, não apenas ainda não construído (ver "Seleção de modelo" acima).
- **Hidratação sob demanda de uma extensão de hook.** Uma extensão local
  hoje cria, sobrevive e é reparada; consumir seu conteúdo para alterar de
  fato o comando renderizado em `.claude/settings.json` fica para um
  incremento futuro (Fatia D, adiada em `BACKLOG-0004`).

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
| Subsistema Python | `code-review-graph` | Instalado localmente por `uv`, sob aprovação, quando ausente das duas origens (SPEC-0010); nunca no ambiente global |
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
