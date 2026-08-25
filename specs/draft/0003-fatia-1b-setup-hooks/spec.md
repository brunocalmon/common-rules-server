# Especificação integrada: Fatia 1b: setup que liga subsistemas e protege o repositório

| Campo | Valor |
| --- | --- |
| Formato | Specsfy/2.0 |
| ID | SPEC-0003 |
| Slug | 0003-fatia-1b-setup-hooks |
| Status | Draft |
| Effort | 6 |
| Effort updated at | 2026-08-24 |
| Effort rationale | Tradução de sete hooks para formato nativo, com três bloqueantes cujo erro de escape é falha de segurança silenciosa. A v0.2.8 gastou 494 linhas nisso e registrou dois defeitos críticos no caminho. |
| ClickUp Task | |
| Milestones | |
| Definition Gate | Pending |
| Plan Gate | Pending |
| Delivery Gate | Pending |
| Evidence Contract | 1 |
| Interface para pessoas | Não — a entrega é um comando de terminal que escreve arquivos de configuração, sem tela. |
| Atualizada em | 2026-08-24 |

## Ato I — Definir

### 1. Problema e resultado

#### Problema

A fatia 1a entregou um esqueleto que verifica dependências e não faz mais nada. `context-mode` e `code-review-graph` estão instalados e alcançáveis, mas nada os liga ao ciclo de vida do agente: nenhum evento os aciona, e eles permanecem inertes enquanto o agente trabalha.

O repositório também está desprotegido. Comando destrutivo, vazamento de credencial para o transcrito e atribuição indevida de autoria em commit dependem hoje de o agente ler orientação e cooperar. A v0.2.8 já havia concluído que orientação não basta, e registrou isso em ADR-005: hooks disparam a partir do editor e valem tenha o agente lido algo ou não.

Há ainda um problema de rastro. Quando uma ferramenta escreve configuração na máquina de alguém, precisa dizer o que escreveu. Sem esse registro não há como reexecutar com segurança, auditar o que mudou, nem desfazer.

#### Resultado desejado

`common-rules setup` liga os subsistemas e instala as proteções, uma vez, de forma auditável.

Ao fim da fatia, executar o comando num projeto que evidencia uso de Claude Code instala sete hooks no formato nativo do editor, grava um registro nomeando cada um com destino e versão, e reexecutar não duplica nada. Num projeto sem essa evidência, nada é escrito e o comando relata o que ignorou e por quê.

O valor não é a instalação em si. É que a partir daqui `context-mode` recebe o que precisa sem configuração manual, e as três proteções valem independentemente de cooperação.

#### Métricas de sucesso

- Os sete hooks ficam instalados no formato nativo do alvo, e o editor os reconhece.
- O registro nomeia cada hook instalado, seu destino, sua versão e a data.
- Uma segunda execução não altera nada e reporta que já estava configurado.
- Num projeto sem evidência de Claude Code, nenhum arquivo é escrito e o motivo é relatado.
- Os três hooks bloqueantes recusam o comando que deveriam recusar, verificado por execução e não por leitura do texto gerado.
- Nenhum arquivo é escrito fora do projeto.

### 2. Research e esclarecimentos

#### Researchs executados

- **R-001** [critical] Os sete hooks portados declaram três eventos canônicos e três deles são bloqueantes — Verdict: verified — Confidence: high — Evidence: research/hooks-v028/README.md#dimensionamento-observado — Budget: 1/1.

A leitura das fontes congeladas mostrou `before-shell` em quatro hooks, `after-file-edit` em dois e `stop` em um, com `blocking: true` em `guard-destructive`, `guard-secrets` e `protect-authorship`. A mesma leitura mediu o custo da tradução e motivou separar o servidor MCP para a fatia 1f.

#### Fontes e contexto consultados

- `specs/backlog/0003-phase-1-mvp-typescript-subsistemas.md`, seção de decisões da fatia 1b.
- Branch `archived`, commit `aac477a`: os sete hooks, `service/hook_service.py` e `mcp_server.py`.
- `specs/completed/0002-phase-1a-esqueleto-typescript/spec.md`, pela stack e pelas camadas de dependência.
- `.specsfy/STACK.md` e `.specsfy/RULES.md`.

#### Documentação consultada

Nenhuma documentação externa. As fontes são do próprio repositório, congeladas em `archived`.

#### Artefatos de pesquisa armazenados

- `specs/draft/0003-fatia-1b-setup-hooks/research/hooks-v028/` — cópias literais dos sete hooks portados, mais um índice com proveniência, dimensionamento medido e a justificativa dos três descartados. Código do próprio projeto; a fonte normativa continua sendo este `spec.md`.

#### Dúvidas respondidas

- **Q**: O que o `setup` configura, se não há mais recursos com placeholders? → **A**: Liga subsistemas ao ciclo do agente e protege o repositório. É o que só o `common-rules` pode fazer: ele não reimplementa `context-mode`, mas é quem o conecta.
- **Q**: Quais hooks? → **A**: Sete dos dez da v0.2.8. Os três de orquestração ficam com o `specsfy`, porque pressupõem o kit de recursos removido na Phase 0.
- **Q**: O `setup` guarda estado? → **A**: Guarda registro do que fez, para ser idempotente e auditável. Não guarda cache de resolução de dependências, que divergiria do sistema real.
- **Q**: Quantos alvos de editor? → **A**: Apenas Claude Code, com detecção. Cursor e Antigravity viram fatia própria.
- **Q**: O servidor MCP entra aqui? → **A**: Não. O dimensionamento mostrou dois subsistemas independentes numa fatia só. O MCP vira a fatia 1f e expõe a lógica já funcionando.

#### Dúvidas abertas

Nenhuma que bloqueie esta fatia.

### 3. Escopo e atores

#### Incluído

- Comando `common-rules setup`, que instala os sete hooks no alvo detectado.
- Tradução de cada hook do formato canônico para o formato nativo do Claude Code, cobrindo os três eventos declarados e a semântica de bloqueio.
- Detecção de evidência de uso do alvo, com recusa silenciosa de escrever quando ausente e relato do que foi ignorado.
- Registro de instalação, nomeando hook, destino, versão e data.
- Idempotência: reexecutar reconhece o que existe e não duplica.
- Ponte `uv` explícita, que cria a cópia local de `code-review-graph` quando ausente das duas origens.
- Comando `common-rules setup --dry-run`, que relata o que faria sem escrever.

#### Fora de escopo

- Servidor MCP e a tool `setup` sobre protocolo. É a fatia 1f.
- Approval workflow. É a fatia 1c.
- Detecção de backends de agente e a lista de suportados. É a fatia 1d.
- Seleção de modelo. É a fatia 1e.
- Tradução para Cursor, Antigravity ou qualquer alvo além do Claude Code.
- Os três hooks de orquestração, devolvidos ao `specsfy`.
- Desinstalação. O registro a torna possível, mas o comando pertence a fatia posterior.
- Publicar o pacote no npm.

#### Atores

- **Pessoa que configura um projeto**: executa o comando uma vez e passa a ter subsistemas ligados e proteções ativas.
- **Agente de codificação**: tem seu ciclo interceptado pelos hooks, sem precisar ler ou cooperar.
- **Pessoa que administra a máquina**: lê o registro para saber o que foi escrito, onde e quando.
- **Fatias 1c a 1f**: herdam o registro e o mecanismo de detecção.

### 4. Princípios e restrições do projeto

- **PR-001**: Nada é escrito fora do projeto. O ambiente global pertence ao playbook.
- **PR-002**: A ferramenta não escreve em alvo sem evidência de uso. Silêncio é preferível a configuração indesejada num editor que a pessoa não usa.
- **PR-003**: Hook bloqueante é código de segurança. Seu comportamento é verificado por execução do comando que ele deve recusar, nunca por inspeção do texto gerado.
- **PR-004**: O `setup` é idempotente. Reexecutar é seguro e não produz efeito acumulado.
- **PR-005**: `common-rules` não reimplementa subsistema. Liga o que existe.

### 5. Histórias de usuário

#### US-001 — Ligar os subsistemas ao ciclo do agente

Como **pessoa que configura um projeto**, quero **que `context-mode` e `code-review-graph` sejam acionados pelos eventos do agente**, para **que operem sem eu configurar cada integração à mão**.

**Por que P1**: É a razão de existir do wrapper. Sem isso os subsistemas estão instalados e inertes.
**Teste independente**: Após o comando, o arquivo de configuração do alvo contém as quatro entradas de integração, nos eventos que cada hook declara.
**Requisitos**: FR-001, FR-002, FR-005

#### US-002 — Proteger o repositório sem depender de cooperação

Como **pessoa responsável pelo repositório**, quero **guardrails e proteção de autoria que disparem do editor**, para **que comando destrutivo, vazamento de credencial e autoria indevida sejam barrados mesmo que o agente ignore qualquer orientação**.

**Por que P1**: A v0.2.8 concluiu em ADR-005 que orientação não basta, e registrou defeito crítico quando o escape de um guard foi consumido duas vezes e todos passaram a permitir tudo.
**Teste independente**: Com os hooks instalados, um comando destrutivo e um comando que exibiria credencial são recusados; um comando comum sobre os mesmos arquivos continua permitido.
**Requisitos**: FR-003, FR-006

#### US-003 — Saber o que a ferramenta escreveu

Como **pessoa que administra a máquina**, quero **um registro do que foi instalado**, para **reexecutar com segurança, auditar o que mudou e poder desfazer**.

**Por que P1**: Escrever configuração sem deixar rastro impede reexecução segura e torna a reversão adivinhação.
**Teste independente**: O registro nomeia os sete hooks com destino, versão e data; uma segunda execução o lê, reconhece o estado e não altera nada.
**Requisitos**: FR-004, FR-005, FR-007

### 6. Cenários BDD de aceite

#### AC-001 — Os quatro hooks de integração ficam instalados

**Cobre**: US-001, FR-001, FR-002, FR-004, NFR-001

```gherkin
@US-001 @FR-001 @FR-002 @FR-004 @NFR-001 @AC-001
Feature: Ligação dos subsistemas

  Scenario: O alvo passa a acionar context-mode e code-review-graph
    Given um projeto com evidência de uso do alvo
    When a pessoa executa o comando de configuração
    Then a configuração do alvo contém as quatro entradas de integração
    And cada uma aparece sob o evento que o hook declara
    And o registro de instalação passa a existir dentro do projeto
    And nenhum arquivo fora do projeto é escrito
```

#### AC-002 — Os três hooks bloqueantes recusam o que devem recusar

**Cobre**: US-002, FR-003, FR-006

```gherkin
@US-002 @FR-003 @FR-006 @AC-002
Feature: Proteção que não depende de cooperação

  Scenario: Comando destrutivo e exibição de credencial são recusados
    Given os hooks bloqueantes instalados
    When o script do guard recebe um comando que apaga diretório sem confirmação
    Then ele recusa, com código de saída de bloqueio
    When o script do guard recebe um comando que exibiria um arquivo de credencial
    Then ele recusa
    And a recusa é observada executando o script, e não lendo seu texto
```

#### AC-003 — Trabalho comum continua permitido

**Cobre**: US-002, FR-003, FR-006

```gherkin
@US-002 @FR-003 @FR-006 @AC-003
Feature: Guardrail estreito

  Scenario: Comandos ordinários sobre os mesmos arquivos passam
    Given os hooks bloqueantes instalados
    When o script do guard recebe um comando que edita um arquivo de credencial
    Then ele permite, porque editar não é exibir
    When o script do guard recebe uma remoção comum de arquivo dentro do projeto
    Then ele permite
```

#### AC-004 — O registro nomeia o que foi escrito

**Cobre**: US-003, FR-001, FR-004, FR-005

```gherkin
@US-003 @FR-001 @FR-004 @FR-005 @AC-004
Feature: Rastro da instalação

  Scenario: Cada hook instalado aparece no registro
    Given uma configuração recém-executada
    When a pessoa inspeciona o registro
    Then os sete hooks aparecem nomeados
    And cada entrada declara destino, versão e data
    And o registro fica dentro do projeto
    And nomeia o alvo que a detecção escolheu
```

#### AC-005 — Reexecutar não duplica

**Cobre**: US-003, FR-005, FR-007, FR-008, NFR-002

```gherkin
@US-003 @FR-005 @FR-007 @FR-008 @NFR-002 @AC-005
Feature: Idempotência

  Scenario: A segunda execução reconhece o estado e não altera nada
    Given uma configuração já executada
    When a pessoa executa o comando outra vez
    Then a configuração do alvo permanece idêntica
    And o relato informa que já estava configurado
    And o registro não ganha entrada duplicada
    And a ponte não recria a cópia local que já existe
```

#### AC-006 — Sem evidência do alvo, nada é escrito

**Cobre**: US-001, FR-001, FR-007, FR-008, NFR-001

```gherkin
@US-001 @FR-001 @FR-007 @FR-008 @NFR-001 @AC-006
Feature: Recusa de configurar alvo não usado

  Scenario: Projeto sem sinal de uso do alvo permanece intocado
    Given um projeto sem qualquer evidência de uso do alvo
    When a pessoa executa o comando de configuração
    Then nenhum arquivo de configuração é criado
    And o relato nomeia o alvo ignorado e a evidência que faltou
    And o comando encerra sem erro, porque não configurar não é falha
    And nenhuma cópia local de subsistema é criada
```

#### AC-007 — A execução seca não escreve

**Cobre**: US-003, FR-004, FR-005, NFR-002

```gherkin
@US-003 @FR-004 @FR-005 @NFR-002 @AC-007
Feature: Ensaio antes de escrever

  Scenario: O modo de ensaio relata sem alterar
    Given um projeto com evidência de uso do alvo e sem configuração
    When a pessoa executa o comando em modo de ensaio
    Then o relato lista os sete hooks que seriam instalados e seus destinos
    And nenhum arquivo é criado ou alterado
    And o registro não é gravado
```

#### AC-008 — A ponte cria a cópia local quando falta

**Cobre**: US-001, FR-008, NFR-001, NFR-003

```gherkin
@US-001 @FR-008 @NFR-001 @NFR-003 @AC-008
Feature: Ponte para o subsistema Python

  Scenario: A ferramenta ausente das duas origens é criada dentro do projeto
    Given code-review-graph ausente do projeto e do PATH
    When a pessoa executa a ponte
    Then a cópia é criada dentro do projeto, na versão fixada
    And nada é escrito no ambiente global
    And a verificação de dependências passa a resolvê-la com origem local
    And a versão instalada coincide exatamente com a fixada, sem faixa
```

#### AC-009 — A tradução preserva a semântica de bloqueio

**Cobre**: US-002, FR-002, FR-003, FR-006, NFR-003

```gherkin
@US-002 @FR-002 @FR-003 @FR-006 @NFR-003 @AC-009
Feature: Fidelidade da tradução

  Scenario: Hook declarado bloqueante chega bloqueante ao alvo
    Given os sete hooks no formato canônico
    When a tradução para o formato nativo termina
    Then os três declarados bloqueantes produzem entrada que interrompe a ação
    And os quatro não bloqueantes produzem entrada que observa sem interromper
    And nenhum conteúdo de script é escapado mais de uma vez
```

#### AC-010 — O escape sobrevive à ida e à volta

**Cobre**: US-002, FR-002, FR-006, NFR-003

```gherkin
@US-002 @FR-002 @FR-006 @NFR-003 @AC-010
Feature: Guarda contra escape duplo

  Scenario: O script chega ao alvo idêntico ao original
    Given um hook cujo script contém aspas, barras invertidas e cifrões
    When ele é traduzido e depois lido de volta do arquivo de configuração
    Then o script recuperado é idêntico ao original, byte a byte
    And executá-lo produz o mesmo resultado que executar a fonte
    And o guard recuperado continua recusando o comando que a fonte recusava
```

#### AC-011 — A fatia não entrega capacidade de outra

**Cobre**: US-001, US-003, FR-001, FR-007, NFR-002, NFR-003

```gherkin
@US-001 @US-003 @FR-001 @FR-007 @NFR-002 @NFR-003 @AC-011
Feature: Limite da fatia

  Scenario: Nenhuma superfície das fatias seguintes aparece
    Given o binário compilado
    When a pessoa lista os comandos disponíveis
    Then existem identificação de versão, verificação de dependências e configuração
    And não existe servidor MCP, aprovação, detecção de agente ou seleção de modelo
```

### 7. Requisitos

#### Funcionais

- **FR-001**: O comando deve detectar evidência de uso do alvo e escrever configuração somente quando ela existir, relatando o alvo ignorado e a evidência ausente quando não existir.
- **FR-002**: O comando deve traduzir cada hook do formato canônico para o formato nativo do alvo, preservando o evento declarado e o conteúdo do script sem alteração.
- **FR-003**: O comando deve preservar a semântica de bloqueio: hook declarado bloqueante interrompe a ação no alvo, e hook não bloqueante apenas observa.
- **FR-004**: O comando deve gravar, dentro do projeto, um registro nomeando cada hook instalado, seu destino, sua versão e a data.
- **FR-005**: O comando deve instalar os sete hooks portados, sem instalar os três devolvidos ao `specsfy`.
- **FR-006**: Os três hooks bloqueantes devem recusar a ação que protegem e permitir trabalho ordinário sobre os mesmos arquivos.
- **FR-007**: O comando deve ser idempotente, reconhecendo estado já configurado, deixando-o inalterado e relatando essa condição, e deve oferecer modo de ensaio que relata sem escrever.
- **FR-008**: O comando deve oferecer a ponte que cria a cópia local de `code-review-graph` na versão fixada, dentro do projeto, quando ela estiver ausente das duas origens, sem escrever no ambiente global.

#### Não funcionais

- **NFR-001**: **Isolamento**. Nenhum arquivo é criado ou alterado fora do projeto. **Verificação**: comparação da árvore do diretório pessoal antes e depois da execução, em ambiente controlado.
- **NFR-002**: **Reversibilidade**. O registro identifica cada escrita com precisão suficiente para desfazê-la. **Verificação**: para cada entrada do registro, o caminho existe e contém o hook nomeado.
- **NFR-003**: **Fidelidade da tradução**. O script entregue ao alvo é idêntico ao da fonte canônica. **Verificação**: comparação byte a byte após ida e volta, incluindo aspas, barras invertidas e cifrões.

#### Erros e casos-limite

- Alvo detectado mas configuração existente escrita por outra ferramenta → preservar o conteúdo alheio, acrescentar apenas as entradas próprias e registrar o que foi preservado. Nunca sobrescrever bloco de terceiro.
- Registro presente mas configuração ausente, por remoção manual → reinstalar e relatar a divergência, em vez de confiar no registro.
- Registro corrompido ou ilegível → tratar como ausente e reinstalar, sem apagar o arquivo anterior.
- `uv` ausente ao acionar a ponte → recusar nomeando a ferramenta e o motivo, sem tentar instalar.
- Permissão negada no destino → recusar sem escrita parcial; configuração pela metade é pior que nenhuma.
- Script de hook contendo caractere que o formato do alvo interpreta → tratado por NFR-003; a v0.2.8 registrou defeito crítico exatamente aqui, com escape consumido duas vezes fazendo todos os guards permitirem tudo.

## Ato II — Projetar e provar

### 8. Plano técnico

#### Contexto existente

- Branch `refactor/v1-cli-first`, com o esqueleto da fatia 1a: `src/cli.ts`, `src/doctor.ts`, `src/version.ts`, 207 linhas.
- `src/cli.ts` já despacha por argumento e exporta `COMMANDS`; `src/doctor.ts` já resolve dependências com ordem local antes de global e expõe `Environment` injetável.
- Vitest com escopo restrito a `tests/`, treze arquivos, 43 casos.
- Os sete hooks portados estão em `research/hooks-v028/`, com frontmatter YAML declarando `kind`, `name`, `description`, `event` e `blocking`.

#### Arquitetura e módulos

| Módulo | Responsabilidade | Arquivo |
| --- | --- | --- |
| Leitura de hook | Ler frontmatter e corpo, devolver estrutura tipada | `src/hooks/source.ts` |
| Tradução | Converter estrutura canônica no formato nativo do alvo | `src/hooks/claude-code.ts` |
| Detecção de alvo | Decidir se há evidência de uso, sem escrever | `src/hooks/detect.ts` |
| Registro | Ler, gravar e comparar o registro de instalação | `src/setup/record.ts` |
| Orquestração do setup | Encadear detecção, tradução, escrita e registro | `src/setup/run.ts` |
| Ponte Python | Criar a cópia local do subsistema Python | `src/setup/bridge.ts` |

A tradução não escreve arquivo e a escrita não traduz. Essa separação é o que permite verificar a fidelidade do escape sem tocar o sistema de arquivos, e é a lição direta do defeito da v0.2.8, em que escape e escrita estavam no mesmo caminho e o duplo consumo passou despercebido.

#### Migrations

Não aplicável. A fatia não introduz persistência de domínio.

#### Models

Estrutura de hook, com nome, descrição, evento, bloqueio e corpo do script. Entrada de registro, com hook, destino, versão e data. Ambas em `src/hooks/source.ts` e `src/setup/record.ts`.

#### Controllers e casos de uso

`src/setup/run.ts` concentra o caso de uso, e `src/cli.ts` ganha o despacho do novo comando. Sem autorização: a operação é local e explícita.

#### Views e experiência

Não aplicável. A seção 10 registra a ausência de interface.

#### Queries e repositórios

Não aplicável.

#### Jobs e processamento assíncrono

Não aplicável. Toda a operação é síncrona.

#### Estrutura de arquivos

```text
src/
  cli.ts
  doctor.ts
  version.ts
  hooks/
    source.ts
    claude-code.ts
    detect.ts
  setup/
    run.ts
    record.ts
    bridge.ts
tests/
  hooks-source.test.ts
  hooks-translate.test.ts
  hooks-escape.test.ts
  hooks-blocking.test.ts
  setup-detect.test.ts
  setup-record.test.ts
  setup-idempotent.test.ts
  setup-dryrun.test.ts
  setup-isolation.test.ts
  setup-bridge.test.ts
  setup-surface.test.ts
```

### 9. Modelo de dados

Não aplicável como persistência de domínio. O registro de instalação é estado operacional da própria ferramenta, descrito na seção 8 e verificado por AC-004.

### 10. Interfaces e contratos

#### Interface para pessoas

**Não há interface para pessoas.** A entrega é um comando de terminal que escreve arquivos de configuração e imprime um relato. Não existe tela, formulário ou navegação a especificar.

#### APIs expostas

Nenhuma. O servidor MCP, que seria a superfície de protocolo, pertence à fatia 1f.

#### APIs externas utilizadas

Nenhuma em tempo de execução. A ponte Python invoca `uv` como subprocesso local, e a detecção lê o sistema de arquivos do projeto.

#### Documentação das APIs consultadas

Nenhuma. As fontes são internas, congeladas em `archived`.

#### Eventos e outros contratos

Os três eventos canônicos que os hooks portados declaram — `before-shell`, `after-file-edit` e `stop` — e seu mapeamento para os nomes que o alvo usa. O mapeamento é contrato desta fatia e vive em `src/hooks/claude-code.ts`.

### 11. Estratégia TDD

- **Unidade**: leitura de frontmatter, tradução, decisão de detecção e comparação de registro, todas com entrada em memória.
- **Integração**: escrita em diretório temporário, com o sistema de arquivos injetado para que nenhum teste toque o projeto real ou o diretório pessoal.
- **Contrato**: fidelidade do escape, verificada por ida e volta byte a byte.
- **Execução**: os três guards exercitados como subprocesso, recebendo o comando que devem recusar e o comando que devem permitir.
- **Runner**: Vitest, pelo script `test:tdd`, conforme DEC-003 da SPEC-0002.
- **Verificação manual**: nenhuma.

O ponto sensível é o mesmo que derrubou a v0.2.8. Verificar que o texto gerado contém a string esperada não prova que o guard bloqueia: o defeito registrado à época passou por revisão porque o arquivo parecia certo, e só apareceu quando alguém executou. Por isso AC-002 e AC-003 exigem execução do script, e AC-010 exige comparação byte a byte.

### 12. Plano de testes e rastreabilidade

| Requisito | Cenário BDD | Nível | Comando de verificação | Evidência |
| --- | --- | --- | --- | --- |
| FR-001 | AC-001 | Integração | `npm run test:tdd` — detecção com evidência presente | Pending |
| FR-001 | AC-006 | Integração | `npm run test:tdd` — detecção com evidência ausente | Pending |
| FR-002 | AC-001 | Unidade | tradução dos quatro hooks de integração | Pending |
| FR-002 | AC-009 | Unidade | semântica de bloqueio preservada na tradução | Pending |
| FR-002 | AC-010 | Contrato | ida e volta byte a byte do script | Pending |
| FR-003 | AC-002 | Execução | guards recusam a ação protegida | Pending |
| FR-003 | AC-003 | Execução | guards permitem trabalho ordinário | Pending |
| FR-003 | AC-009 | Unidade | bloqueante e não bloqueante produzem entradas distintas | Pending |
| FR-004 | AC-004 | Integração | registro nomeia os sete com destino e versão | Pending |
| FR-004 | AC-007 | Integração | ensaio não grava registro | Pending |
| FR-005 | AC-001 | Integração | os sete instalados, os três de orquestração ausentes | Pending |
| FR-005 | AC-004 | Integração | registro cobre exatamente os sete | Pending |
| FR-006 | AC-002 | Execução | recusa observada por execução | Pending |
| FR-006 | AC-003 | Execução | permissão observada por execução | Pending |
| FR-007 | AC-005 | Integração | segunda execução não altera nada | Pending |
| FR-007 | AC-007 | Integração | ensaio relata sem escrever | Pending |
| FR-007 | AC-011 | Execução | superfície limitada aos três comandos | Pending |
| FR-008 | AC-008 | Integração | ponte cria cópia local na versão fixada | Pending |
| NFR-001 | AC-001 | Integração | árvore do diretório pessoal inalterada | Pending |
| NFR-001 | AC-006 | Integração | nada escrito quando o alvo não é usado | Pending |
| NFR-001 | AC-008 | Integração | ponte não escreve fora do projeto | Pending |
| NFR-002 | AC-005 | Integração | registro permite reconhecer estado | Pending |
| NFR-002 | AC-007 | Integração | ensaio deixa o estado intacto | Pending |
| NFR-002 | AC-011 | Integração | cada entrada do registro aponta caminho existente | Pending |
| NFR-003 | AC-009 | Unidade | bloqueio preservado | Pending |
| NFR-003 | AC-010 | Contrato | escape sobrevive à ida e à volta | Pending |

### 13. Validações

#### Gate do Ato I — Definição

- **Resultado**: Pending
- **Comando**: `node .claude/skills/specsfy-04-validate/scripts/validate_spec.mjs specs/draft/0003-fatia-1b-setup-hooks/spec.md --allow-draft`

#### Gate do Ato II — Plano

- **Resultado**: Pending
- **Comando**: `node .claude/skills/specsfy-05-tasks/scripts/validate_tasks.mjs specs/draft/0003-fatia-1b-setup-hooks/spec.md`

#### Gate do Ato III — Entrega

- **Resultado**: Pending
- **Verificação**: suíte verde, guards exercitados por execução, escape verificado byte a byte e árvore do diretório pessoal inalterada.

#### Suposições

- O registro fica em `.common-rules/install.json`, dentro do projeto. Formato estruturado, e não `.env`: um registro de instalação tem lista e campos, e `.env` era herança dos placeholders da v0.2.8.
- A evidência de uso do alvo é a presença do diretório de configuração do editor no projeto. Reversível se a detecção se mostrar frágil.
- A versão fixada de `code-review-graph` para a ponte é 2.3.7, verificada em 2026-08-24.

#### Decisões abertas

Nenhuma que bloqueie esta fatia.

### 14. Tarefas

A seção é preenchida por `$specsfy-05-tasks` depois do Definition Gate.

### 15. Ordem de execução

Definida junto das tarefas, depois do Definition Gate.

## Ato III — Entregar e validar

### 16. Dependências, riscos e suposições

#### Dependências

- Fatia 1a concluída, que fornece manifesto, build, runner e a resolução de dependências.
- `uv` disponível para a ponte.
- Os sete hooks portados, preservados em `research/hooks-v028/`.

#### Riscos

- **Escape consumido duas vezes na tradução** → todos os guards passam a permitir tudo, e o arquivo gerado parece correto. É o defeito crítico que a v0.2.8 registrou. Mitigação: AC-010 compara byte a byte, e AC-002 exige execução.
- **Guard estreito demais ou largo demais** → ou não protege, ou impede trabalho ordinário. A v0.2.8 registrou as duas falhas. Mitigação: AC-002 e AC-003 são pares, e nenhum passa sozinho.
- **Escrita destruindo configuração de terceiro** → a pessoa perde ajuste que não era nosso. Mitigação: a seção 7 exige preservar bloco alheio, e o caso está entre os erros previstos.
- **Detecção por presença de diretório dando falso positivo** → configurar editor que a pessoa não usa. Mitigação: registrada como suposição reversível; AC-006 fixa o comportamento na ausência.
- **Registro divergindo do sistema** → a ferramenta confia em si mesma e ignora remoção manual. Mitigação: a seção 7 manda reinstalar e relatar quando o registro afirmar o que o sistema nega.

#### Suposições

Registradas na seção 13, todas reversíveis nesta fatia.

### 17. Decisões

- **DEC-001**: O `setup` liga subsistemas e protege o repositório, e não distribui regras nem skills. *Razão*: `specsfy` é o motor de skills desde a reescrita, e o `common-rules` é wrapper. Ligar `context-mode` e `code-review-graph` ao ciclo do agente é o que só ele pode fazer.
- **DEC-002**: Sete dos dez hooks da v0.2.8 são portados. *Razão*: os quatro de integração conectam subsistemas, e os três de guardrail e autoria não dependem de motor de skills. *Descartados*: `orchestration-briefing`, `completion-gate` e `format-after-edit` pressupõem o kit de 47 recursos removido na Phase 0.
- **DEC-003**: O servidor MCP sai desta fatia e vira a 1f. *Razão*: a medição em `archived` mostrou 494 linhas de tradução de hooks e 536 de servidor MCP, contra 207 da fatia 1a inteira. *Critério*: o projeto é primordialmente CLI, de modo que a superfície secundária não precede a lógica que expõe.
- **DEC-004**: Alvo único, Claude Code, com detecção. *Razão*: fatia estreita expõe defeito que fatia larga encobre, como a 1a demonstrou. Com três tradutores simultâneos, um erro num deles ficaria coberto pelos outros dois passando.
- **DEC-005**: Tradução e escrita vivem em módulos separados. *Razão*: é o que permite verificar a fidelidade do escape sem tocar o sistema de arquivos. Na v0.2.8 os dois estavam no mesmo caminho, e o duplo consumo do escape passou por revisão porque o arquivo gerado parecia correto.
- **DEC-006**: O registro fica dentro do projeto, em formato estruturado. *Razão*: escrever configuração sem rastro impede reexecução segura e torna reversão adivinhação. *Alternativa descartada*: `.env`, herança dos placeholders que deixaram de existir.

### 18. Definition of Done

- [ ] `Definition Gate` está `Passed`.
- [ ] `Plan Gate` está `Passed`.
- [ ] `Delivery Gate` está `Passed`.
- [ ] Todos os cenários `AC` aplicáveis passam.
- [ ] Todos os requisitos possuem evidência de verificação registrada na seção 12.
- [ ] Todas as tarefas da seção 14 estão concluídas.
- [ ] Os três guards foram exercitados por execução, recusando o que devem recusar e permitindo trabalho ordinário.
- [ ] O escape foi verificado byte a byte na ida e na volta.
- [ ] A árvore do diretório pessoal permanece inalterada após a execução dos testes.
- [ ] `.specsfy/STACK.md` registra o que esta fatia introduziu, ou a ausência de mudança estrutural fica justificada.
- [ ] `PROJECT.md` passa a listar o comando de configuração entre as capacidades, e a remover a menção de que ele não existe.
