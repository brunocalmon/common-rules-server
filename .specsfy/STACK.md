# Stack do sistema

## Inventário detectado

<!-- specsfy:stack:start -->
| Camada | Tecnologia | Evidência |
| --- | --- | --- |
| Linguagem | TypeScript | `package.json` (`typescript`) |
| Testes | Vitest | `package.json` (`vitest`) |
| Runtime | Node.js | `package.json` |
<!-- specsfy:stack:end -->

## Decisões estruturais e camadas de dependência

Conteúdo humano, fora do bloco reconstruído. Cada linha cita uma fonte executável.

| Camada | Tecnologia | Responsabilidade | Evidência |
| --- | --- | --- | --- |
| Módulo | ESM | Formato de módulo do pacote e da compilação | `package.json` (`"type": "module"`) |
| Ferramenta | `@types/node` 26.3.0 | Tipos do runtime Node para a compilação estrita | `package.json` (`devDependencies`) |
| Runtime | Node maior ou igual a 20 | Versão mínima suportada | `package.json` (`engines.node`) |
| Biblioteca | `@modelcontextprotocol/sdk` 1.30.0 | Servidor e cliente do protocolo que expõe a tool `setup` ao editor | `package.json` (`dependencies`) |
| Biblioteca | `zod` 3.25.76 | Esquema de entrada da tool. Declarada direta e fixa porque `inputSchema` do SDK aceita apenas esquema zod — `AnySchema = z3.ZodTypeAny \| z4.$ZodType` — sem porta para esquema JSON puro; depender da resolução transitiva deixaria a versão fora da regra de fixação | `package.json` (`dependencies`) |
| Binário | `common-rules-mcp` | Segundo executável do pacote, que sobe o servidor do protocolo sobre entrada e saída padrão | `package.json` (`bin`) |
| Biblioteca | `skills` 1.5.23 | Instalador oficial de conjuntos de skills, da vercel-labs. Já chegava por via transitiva como dependência de `@promovaweb/specsfy` em faixa `^1.5.22`; declarado direto e exato para entrar na regra de fixação | `package.json` (`dependencies`) |
| Subsistema npm | `@promovaweb/specsfy` 0.10.2 | Motor de skills e regras do processo | `package.json` (`dependencies`) |
| Subsistema npm | `context-mode` 1.0.169 | Gestão de janela de contexto entre sessões | `package.json` (`dependencies`) |
| Subsistema Python | `code-review-graph` 2.3.7 | Análise de relações de código e call graphs | Exigido do ambiente; instalado por `uv`, ausente do npm |
| Backend de agente | `pi`, `claude`, `cursor-agent`, `codex`, `agy`, `goose`, `dsh`, Ollama | Execução delegada pelo Orchestrator, em fatia futura | **Nada os detecta hoje**: `src/doctor.ts` cobre apenas as três dependências do projeto. A detecção pertence à fatia 1d, e nenhum deles é dependência declarada |

### Regra de resolução das dependências do projeto

Preferir a cópia local do projeto, aceitar a global quando não houver local, e
nunca instalar no ambiente global. A verificação relata qual origem resolveu,
para que a diferença entre máquinas seja visível em vez de silenciosa.

Fixar versão só garante alguma coisa quando o binário executado é o do projeto.
Ao mesmo tempo, o ambiente de destino é gerido por um playbook declarativo cuja
regra é que nada se instala manualmente, e `uv tool install` escreve fora do
projeto. A ordem local antes de global honra as duas restrições.

### Instalação sem scripts de ciclo de vida

Toda instalação de dependência usa `--ignore-scripts`. Script de ciclo de vida
executa código de terceiros durante a instalação, e a documentação do próprio
`pi` recomenda o flag. O registro canônico da regra fica em `.specsfy/RULES.md`.

### Compilação não deixa artefato quando falha

`tsconfig.json` declara `noEmitOnError`. Sem isso, `tsc` emite `dist/` mesmo com
erro de tipo, e a asserção que verifica a existência do binário passaria sobre
uma compilação quebrada. Verificado por mutação: build com erro sai com código 1
e não cria `dist/`; build limpo sai com zero e cria.

### Hooks empacotados com o produto

Os sete hooks portados da v0.2.8 vivem em `hooks/`, na raiz do pacote, e são
declarados em `files` do manifesto. Não vivem dentro de `specs/`: o caminho de
uma spec muda conforme ela avança de estado, e código que dependesse dele
quebraria a cada transição — como de fato quebrou, com `ENOENT`, ao mover a
SPEC-0003 de `defined` para `in-progress`.

O bloco de código dentro de cada `.md` é fragmento, e não script completo. Ele
lê `HOOK_COMMAND`, `HOOK_FILE` e `HOOK_INPUT`, que o invólucro fornece, e
comunica por `decision` e `message`, que o invólucro emite. Sozinho, o fragmento
de um guard termina no último `fi` sem imprimir nada e não bloquearia coisa
alguma.

### Configuração de hooks, introduzida pela fatia 1b

| Camada | Item | Responsabilidade | Evidência |
| --- | --- | --- | --- |
| Módulo | `src/hooks/source.ts` | Lê frontmatter e fragmento de cada hook | `src/hooks/source.ts` |
| Módulo | `src/hooks/claude-code.ts` | Traduz para o formato do alvo e envolve o fragmento | `src/hooks/claude-code.ts` |
| Módulo | `src/hooks/detect.ts` | Decide se há evidência de uso do alvo | `src/hooks/detect.ts` |
| Módulo | `src/setup/run.ts` | Encadeia detecção, tradução, escrita e registro | `src/setup/run.ts` |
| Módulo | `src/setup/record.ts` | Lê, grava e compara o registro de instalação | `src/setup/record.ts` |
| Módulo | `src/setup/bridge.ts` | Cria a cópia local do subsistema Python | `src/setup/bridge.ts` |
| Módulo | `src/setup/env.ts` | Observa o sistema de arquivos para alimentar a detecção | `src/setup/env.ts` |
| Alvo | Claude Code | Único alvo suportado; Cursor e Antigravity ficam para fatia própria | `src/hooks/detect.ts` |
| Estado | `.common-rules/install.json` | Registro do que foi instalado, dentro do projeto | `src/setup/record.ts` |
| Estado | `.claude/settings.json` | Onde as entradas de hook são escritas | `src/setup/run.ts` |

### Separação entre decidir, traduzir e escrever

Cada uma vive em módulo próprio, e a razão é concreta. A tradução devolve
conteúdo e não escreve, de modo que a fidelidade do fragmento é verificável sem
tocar o disco. Na v0.2.8 escape e escrita estavam no mesmo caminho, o escape foi
consumido duas vezes e todos os guards passaram a permitir tudo — defeito que
sobreviveu à revisão porque o arquivo gerado parecia correto.

Pela mesma razão, `env.ts` é a única parte que observa o sistema de arquivos: a
decisão de detecção recebe o resultado por parâmetro e pode ser exercitada
contra ambientes construídos.

## Servidor do protocolo

Quatro módulos em `src/mcp/`, acrescentados pela SPEC-0004:

| Arquivo | Responsabilidade |
| --- | --- |
| `src/mcp/root.ts` | Valida a raiz recebida: caminho absoluto, existente, diretório e com marcador de projeto. Não consulta diretório de trabalho nem variável de ambiente. |
| `src/mcp/tool.ts` | Esquema de entrada e de saída da tool `setup`, e sua execução sobre a raiz validada. Reusa `runSetup` sem duplicar lógica. |
| `src/mcp/server.ts` | Registra a única tool e identifica o servidor com o nome `common-rules` e a versão devolvida por `readVersion()`. |
| `src/mcp/main.ts` | Entrada de execução, que liga o servidor ao transporte de entrada e saída padrão. |

A raiz do projeto é parâmetro obrigatório da tool. A observação registrada na
pesquisa da SPEC-0004 encontrou três servidores do protocolo em execução, dois
com o diretório pessoal como diretório de trabalho e um apontando para outro
projeto: nenhum tinha a raiz correta. Derivar a raiz do processo produziria
escrita silenciosa na árvore errada, e por isso a tool recusa quando não pode
confirmá-la.

## Conjuntos de skills e framework Specsfy

Cinco módulos em `src/skills/` e dois em `src/specsfy/`, acrescentados pela
SPEC-0005 e ampliados na reabertura de 2026-08-30:

| Arquivo | Responsabilidade |
| --- | --- |
| `src/skills/source.ts` | Nomeia as duas origens oficiais (`mattpocock/skills`, `promovaweb/specsfy`) e recusa qualquer outra. Não toca o sistema de arquivos. |
| `src/skills/inventory.ts` | Enumera os conjuntos sob `.claude/skills/` e detecta link simbólico em qualquer nível. |
| `src/skills/install.ts` | Enumera com `--list`, recusa conflito antes de escrever e instala com alvo restrito, cópia e sem interação, uma origem por chamada. |
| `src/skills/executor.ts` | Executor real: resolve o binário local de `skills` a partir do próprio pacote `common-rules` e traduz sua saída — TUI com `--list`, silenciosa sem. |
| `src/skills/record.ts` | Lê a procedência do lockfile do instalador e compara o registrado com o presente, sem escrever. |
| `src/specsfy/install.ts` | Executa o instalador de projeto do framework Specsfy e traduz o resultado; não persiste registro próprio. |
| `src/specsfy/executor.ts` | Executor real: resolve o binário local de `@promovaweb/specsfy` a partir do próprio pacote `common-rules` e faz o parsing do JSON de saída. |

A instalação de skills usa cópia real e nunca link simbólico. O instalador cria
link por padrão, e conteúdo por link mora fora do projeto: o hash deixaria de
descrever o que o agente lê, duas máquinas divergiriam sem registro, e o
ferramental do Specsfy recusa caminho por link.

A entrega dá rastreabilidade, não reprodutibilidade. O lockfile registra o que
se obteve, e não o que se deve obter: não há referência de commit nem versão do
conjunto, e reexecutar busca a ponta.

`src/cli.ts` injeta os dois executores reais (`realSkillsExecutor()`,
`realSpecsfyExecutor()`) em toda execução de `setup` — resolvidos contra o
próprio pacote `common-rules`, não contra o projeto alvo. Até a reabertura de
2026-08-30, nenhum dos dois existia em produção: `installSkills` e
`installSpecsfy` eram exercitados só por fixture, e `formatSetup()` nunca
fornecia `skills` nem `specsfy` a `runSetup` — o `setup` real não instalava
coisa alguma. `tests/cli-setup-real.test.ts` prova a integração completa sem
nenhum executor injetado.

## Telemetria da execução

Dois módulos em `src/telemetry/`, acrescentados pela SPEC-0006:

| Arquivo | Responsabilidade |
| --- | --- |
| `src/telemetry/trace.ts` | Única fonte de não determinismo: identificador hexadecimal de comprimento fixo e instante do relógio do sistema, ambos substituíveis por injeção. |
| `src/telemetry/read.ts` | Lê o identificador da última execução registrada, distinguindo identificado, não identificado e ausente, sem escrever. |

`.common-rules/install.json` ganhou o campo `trace`, com o identificador da
execução que gravou o arquivo, e as entradas passaram a receber o instante real.

Relógio e gerador são injetáveis por decisão registrada em `DEC-043`. A fatia 1b
havia tentado o caminho oposto — congelar o instante em `new Date(0)` para dar
previsibilidade aos casos — e o resultado foi um registro que afirmava, em toda
máquina, que a instalação ocorrera em 1970. Determinismo de teste se obtém
injetando a fonte, e não falsificando o valor em produção.

## Aprovação do plano

Três módulos em `src/approval/`, acrescentados pela SPEC-0007:

| Arquivo | Responsabilidade |
| --- | --- |
| `src/approval/context.ts` | Escolhe o canal de aprovação pela presença de terminal na entrada padrão. |
| `src/approval/render.ts` | Deriva as formas de texto e documento do plano a partir de um único percurso, para que não divirjam entre si. |
| `src/approval/decide.ts` | Interpreta a decisão da fonte escolhida, tratando exceção, entrada vazia e documento inválido como negativa. |

`SetupOptions.approval` é opcional, no mesmo padrão de `skills` e `bridgeEnv`:
ausente, nada é consultado. O comando de terminal em `src/cli.ts` ainda não
passa um valor real — gap conhecido, análogo ao que `skills` já tinha antes da
fatia 1h — e por isso a garantia desta fatia vale hoje na biblioteca, e não
ainda ponta a ponta pelo comando `common-rules setup`.
