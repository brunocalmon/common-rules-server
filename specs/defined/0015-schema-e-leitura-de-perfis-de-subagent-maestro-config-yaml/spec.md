# Especificação integrada: Schema e leitura de perfis de subagent (.maestro/config.yaml)

| Campo | Valor |
| --- | --- |
| Formato | Specsfy/2.0 |
| ID | SPEC-0015 |
| Slug | 0015-schema-e-leitura-de-perfis-de-subagent-maestro-config-yaml |
| Status | Defined |
| Effort | 6 |
| Effort updated at | 2026-09-06 |
| Effort rationale | Mecanismo novo sem precedente direto no projeto (composição de agente em cinco grupos, wrapper `{value, mode}` uniforme, semeadura de arquivos físicos), somado a integração com três superfícies já existentes (`setup`, leitor de config da SPEC-0012, `doctor` da SPEC-0011). Sem I/O de rede, concorrência ou execução de agente — a execução em si pertence às fatias MA-4/MA-5. Faixa `standard` alta. |
| ClickUp Task | |
| Milestones | |
| Definition Gate | Passed |
| Plan Gate | Pending |
| Delivery Gate | Pending |
| Evidence Contract | 1 |
| Interface para pessoas | Não — arquivo de configuração YAML e comandos de terminal já existentes (`setup`, `doctor`), sem tela. |
| Atualizada em | 2026-09-06 |

## Ato I — Definir

### 1. Problema e resultado

#### Problema

O épico de orquestração multi-agente (`BACKLOG-0009`) exige que a pessoa possa
declarar perfis de agente — o próprio maestro e seus subagents — com modelo,
comportamento, capacidades e forma de execução, e que cada propriedade possa
ser uma *sugestão* (o planejamento pode propor algo diferente, explicando o
trade-off) ou *obrigatória* (não negociável). Hoje nada disso existe:
`.maestro/config.yaml` (renomeado de `.common-rules/config.yaml` pela
`SPEC-0014`) tem apenas as seções `language`, `project`, `system` e `git`
entregues pela `SPEC-0012`, e o projeto não tem nenhum conceito de perfil de
agente, nem em código nem em disco.

Sem essa fundação, nenhuma das fatias seguintes do épico consegue existir: o
planejamento (MA-2) não tem perfis para referenciar, a recomendação de modelo
estendida (MA-3) não tem onde ler restrição por agente, e as duas fatias de
execução (MA-4 nativa, MA-5 CLI externa) não têm como saber qual runtime cada
agente deve usar.

#### Resultado desejado

`.maestro/config.yaml` ganha uma seção `maestro:` que descreve o agente mestre
e sua lista de `subagents`, cada um composto por cinco grupos de propriedades
(`identity`, `cognition`, `instruction`, `capability`, `execution`), com toda
propriedade no formato uniforme `{ value, mode }` — `mode` sendo `suggested`
ou `required`. O `setup` semeia os arquivos de fábrica reais quando ausentes
(nunca sobrescrevendo o que existe); um leitor carrega e valida a seção; e o
`doctor` relata referência quebrada sem alterar nada.

#### Métricas de sucesso

- Um projeto recém-configurado tem `.maestro/config.yaml` com a seção `maestro:` preenchida e os arquivos que ela referencia existindo fisicamente em `.maestro/subagents/maestro/`.
- Nenhum comportamento padrão de agente vive como string embutida no código — cada default de fábrica é um arquivo real, referenciado explicitamente pela config.
- Uma referência quebrada (arquivo apagado, caminho inválido) faz a leitura recusar em voz alta nomeando o perfil e o arquivo, e aparece no relatório do `doctor` com código de saída diferente de zero.

### 2. Research e esclarecimentos

#### Researchs executados

- Nenhum research externo. O desenho vem da entrevista de descoberta desta sessão (8 perguntas numeradas, registradas em `Dúvidas respondidas`) e da inspeção do código existente.

#### Fontes e contexto consultados

- `src/config/schema.ts` — seções atuais (`language`, `project`, `system`, `git`), interface `ConfigDocument` e a lista `SCHEMA_KEYS` que prova a invariante "nenhuma chave omitida" (`SPEC-0012`, `NFR-001`).
- `src/config/write.ts` — `CONFIG_PATH` e `ensureConfigFile(root)`, que cria o arquivo somente quando ausente e nunca sobrescreve valor já definido pela pessoa.
- `src/setup/run.ts:158` — ponto onde o `setup` já garante `config.yaml` presente e completo; é onde a semeadura desta fatia se conecta.
- `src/extensions/diagnose.ts`, `src/doctor.ts` — padrão de diagnóstico só-leitura que relata divergência sem tocar em disco (`SPEC-0011`, `PR-082`).
- `specs/backlog/0009-orchestrator-monta-times-multi-agente-dinamicos-e-delega-para-clis-externas.md` — épico de origem, decisões D1–D7 e a decomposição em fatias MA-1 a MA-6.

#### Documentação consultada

- Nenhuma documentação externa.

#### Artefatos de pesquisa armazenados

- Nenhum artefato externo. O levantamento inteiro é inspeção do próprio repositório, citada com caminho relativo acima.

#### Dúvidas respondidas

- **Q**: Como expressar a flag sugestão-vs-obrigatória no YAML? → **A**: formato objeto uniforme `{ value, mode }` em toda propriedade, sempre — sem forma curta alternativa (rodada 1).
- **Q**: Onde fica a config do próprio maestro? → **A**: chave `maestro:` de topo, com suas próprias propriedades, e `maestro.subagents:` como lista aninhada de perfis (rodada 2).
- **Q**: `behavior` substitui ou soma ao padrão? → **A**: duas chaves separadas — `behavior` substitui, `additional_behavior` soma (rodada 3).
- **Q**: Qual a estrutura de composição de um agente e onde vivem seus arquivos? → **A**: cinco grupos (`identity`, `cognition`, `instruction`, `capability`, `execution`), com diretório físico `.maestro/subagents/<nome>/` por agente; nada hardcoded, cada default de fábrica é arquivo real referenciado explicitamente; `capability.skills` aceita caminho para `.agents/skills/*` já instalada, sem duplicar (rodada 4).
- **Q**: O que acontece com referência quebrada? → **A**: recusa em voz alta na leitura, nomeando perfil e arquivo; `doctor` relata a mesma divergência sem alterar nada (rodada 5).
- **Q**: Os defaults de fábrica entram no checksum da `SPEC-0011`? → **A**: não — são sementes livres, escritas uma vez quando ausentes e a partir daí pertencentes à pessoa, mesmo espírito do `config.yaml` da `SPEC-0012` (rodada 6).
- **Q**: Qual a fronteira da MA-1? → **A**: fatia vertical completa — semear no `setup`, ler, validar e relatar no `doctor` (rodada 7).
- **Q**: Existe camada de config por máquina/usuário? → **A**: não, apenas por projeto (rodada 8).

#### Dúvidas abertas

- Nenhuma bloqueante. Uma decisão deliberadamente adiada está registrada em `17. Decisões` (`DEC-005`): herança/composição entre perfis (`extends`) fica fora desta fatia, e pode ser acrescentada depois como propriedade opcional sem quebrar o schema.

### 3. Escopo e atores

#### Incluído

- Seção `maestro:` no schema de `.maestro/config.yaml`, com os cinco grupos de propriedades e a lista `subagents`.
- Wrapper uniforme `{ value, mode }` para toda propriedade configurável, com `mode` ∈ `suggested | required`.
- Semeadura pelo `setup`: cria `.maestro/subagents/maestro/description.md` e `behavior.md` e a seção `maestro:` do `config.yaml` quando ausentes, sem sobrescrever o que já existir.
- Leitor que carrega a seção, resolve os caminhos referenciados e valida a estrutura.
- Relato do `doctor` sobre referência quebrada, só-leitura, com código de saída diferente de zero.

#### Fora de escopo

- Planejamento de orquestração e o gate de aprovação humana (fatia MA-2).
- Extensão do `recommend()` com janela de contexto e tipo de tarefa (fatia MA-3).
- Qualquer execução de agente, nativa ou por subprocesso (fatias MA-4 e MA-5).
- Telemetria multi-agente (fatia MA-6).
- Herança entre perfis (`extends`) — ver `DEC-005`.
- Camada de configuração por máquina/usuário (`~/.maestro/`) — rejeitada na rodada 8.
- Submeter os arquivos-semente ao checksum/quarentena da `SPEC-0011` — rejeitado na rodada 6.

#### Atores

- **Pessoa que configura o projeto**: escreve e edita perfis em `.maestro/config.yaml` e os arquivos Markdown em `.maestro/subagents/<nome>/`; espera que o sistema recuse em voz alta quando algo estiver inconsistente, em vez de operar sobre estado parcial.
- **Fatias seguintes do épico (MA-2 a MA-6)**: consumidoras do leitor entregue aqui; dependem de um contrato estável de perfil carregado e validado.

### 4. Princípios e restrições do projeto

- **PR-001**: Nada implícito, nada hardcoded — cada comportamento padrão de agente é um arquivo real em disco, referenciado explicitamente pela config; o código nunca carrega comportamento embutido em string.
- **PR-002**: Recusa em voz alta em vez de operar sobre estado parcial, mesmo princípio já fixado em `SPEC-0004` (`DEC-002`) e `SPEC-0011`.
- **PR-003**: `doctor` permanece estritamente só-leitura, nunca altera o sistema de arquivos (`PR-082`, `SPEC-0011`).
- **PR-004**: Nada é escrito fora da raiz do projeto (`SPEC-0003`, `NFR-001`) — a config é por projeto, sem camada de máquina.
- **PR-005**: O `setup` cria somente o que está ausente e nunca sobrescreve valor já definido pela pessoa — regra estabelecida pela `SPEC-0012` na garantia de presença do `config.yaml`.

### 5. Histórias de usuário

#### US-001 — Declarar perfis de agente verificáveis (P1)

Como pessoa que configura o maestro, quero declarar em `.maestro/config.yaml`
o perfil do agente mestre e de cada subagent — com modelo, comportamento,
capacidades e forma de execução, marcando cada propriedade como sugestão ou
obrigatória — para que as fatias de planejamento e execução tenham uma fonte
explícita e validada de como cada agente deve operar.

**Por que P1**: é a fundação do épico; nenhuma fatia seguinte existe sem ela.
**Teste independente**: rodar `setup` num projeto novo e confirmar `.maestro/config.yaml` com seção `maestro:` completa e os arquivos referenciados existindo; apagar um arquivo referenciado e confirmar recusa em voz alta na leitura e relato no `doctor`.
**Requisitos**: FR-001, FR-002, FR-003, FR-004

### 6. Cenários BDD de aceite

#### AC-001 — a seção maestro existe e está completa após o setup

**Cobre**: US-001, FR-001, NFR-001

```gherkin
@US-001 @FR-001 @NFR-001 @AC-001
Feature: schema de perfis de agente

  Scenario: setup num projeto sem configuração prévia
    Given um projeto sem .maestro/config.yaml
    When a pessoa roda o setup
    Then .maestro/config.yaml contém a seção maestro
    And a seção declara os cinco grupos identity, cognition, instruction, capability e execution
    And declara uma lista subagents
```

#### AC-002 — toda propriedade usa o formato uniforme value/mode

**Cobre**: US-001, FR-001, NFR-001

```gherkin
@US-001 @FR-001 @NFR-001 @AC-002
Feature: schema de perfis de agente

  Scenario: formato das propriedades semeadas
    Given a seção maestro recém-semeada pelo setup
    When alguém inspeciona qualquer propriedade configurável
    Then ela é um objeto com as chaves value e mode
    And mode vale suggested ou required
```

#### AC-003 — o setup não sobrescreve configuração já existente

**Cobre**: US-001, FR-001, NFR-002

```gherkin
@US-001 @FR-001 @NFR-002 @AC-003
Feature: schema de perfis de agente

  Scenario: rodar o setup sobre uma configuração já customizada
    Given um projeto cuja seção maestro já declara um subagent chamado gitops-dev
    When a pessoa roda o setup de novo
    Then o subagent gitops-dev continua declarado, inalterado
    And nenhuma propriedade já definida pela pessoa é substituída pelo default de fábrica
```

#### AC-004 — os arquivos de fábrica existem fisicamente

**Cobre**: US-001, FR-002, NFR-001

```gherkin
@US-001 @FR-002 @NFR-001 @AC-004
Feature: sementes de fábrica em disco

  Scenario: arquivos referenciados pela config de fábrica
    Given um projeto recém-configurado pelo setup
    When alguém abre os caminhos que a seção maestro referencia
    Then .maestro/subagents/maestro/description.md existe com conteúdo
    And .maestro/subagents/maestro/behavior.md existe com conteúdo
```

#### AC-005 — nenhum comportamento padrão vive embutido no código

**Cobre**: US-001, FR-002, NFR-001

```gherkin
@US-001 @FR-002 @NFR-001 @AC-005
Feature: sementes de fábrica em disco

  Scenario: origem do comportamento padrão
    Given o código de produção do projeto
    When alguém procura o texto do comportamento padrão do maestro
    Then ele aparece somente em um arquivo de recurso versionado, nunca como string embutida na lógica
    And a semeadura copia esse recurso para .maestro/subagents/maestro/behavior.md
```

#### AC-006 — a semeadura não apaga arquivo de comportamento já editado

**Cobre**: US-001, FR-002, NFR-002

```gherkin
@US-001 @FR-002 @NFR-002 @AC-006
Feature: sementes de fábrica em disco

  Scenario: comportamento customizado sobrevive a uma reexecução
    Given .maestro/subagents/maestro/behavior.md editado à mão pela pessoa
    When a pessoa roda o setup de novo
    Then o conteúdo editado permanece intacto
    And nenhum aviso de divergência é emitido, porque o arquivo pertence à pessoa
```

#### AC-007 — o leitor carrega perfis válidos

**Cobre**: US-001, FR-003, NFR-001

```gherkin
@US-001 @FR-003 @NFR-001 @AC-007
Feature: leitura e validação de perfis

  Scenario: config válida com um subagent declarado
    Given uma seção maestro válida declarando o subagent gitops-dev com model required
    When o leitor carrega a configuração
    Then o perfil gitops-dev é devolvido com seu modelo e o mode required preservado
    And o perfil do próprio maestro é devolvido junto
```

#### AC-008 — referência quebrada faz a leitura recusar em voz alta

**Cobre**: US-001, FR-003, NFR-002

```gherkin
@US-001 @FR-003 @NFR-002 @AC-008
Feature: leitura e validação de perfis

  Scenario: arquivo de behavior apagado
    Given um perfil cujo behavior aponta para um arquivo inexistente
    When o leitor carrega a configuração
    Then a leitura falha nomeando o perfil e o caminho quebrado
    And nenhum perfil parcialmente válido é devolvido
```

#### AC-009 — mode inválido é recusado

**Cobre**: US-001, FR-003, NFR-002

```gherkin
@US-001 @FR-003 @NFR-002 @AC-009
Feature: leitura e validação de perfis

  Scenario: valor de mode fora do domínio
    Given uma propriedade cujo mode não é suggested nem required
    When o leitor carrega a configuração
    Then a leitura falha nomeando a propriedade e o valor inválido
```

#### AC-010 — o doctor relata referência quebrada

**Cobre**: US-001, FR-004, NFR-002

```gherkin
@US-001 @FR-004 @NFR-002 @AC-010
Feature: relato do doctor

  Scenario: diagnóstico sobre config com referência quebrada
    Given um perfil cujo behavior aponta para um arquivo inexistente
    When a pessoa roda o doctor
    Then o relatório nomeia o perfil e o caminho quebrado
    And o código de saída é diferente de zero
```

#### AC-011 — o doctor não altera nada

**Cobre**: US-001, FR-004, NFR-002

```gherkin
@US-001 @FR-004 @NFR-002 @AC-011
Feature: relato do doctor

  Scenario: sistema de arquivos após o diagnóstico
    Given um projeto com config de agentes quebrada
    When a pessoa roda o doctor
    Then nenhum arquivo é criado, alterado ou removido
```

#### AC-012 — config íntegra passa limpa pelo doctor

**Cobre**: US-001, FR-004, NFR-001

```gherkin
@US-001 @FR-004 @NFR-001 @AC-012
Feature: relato do doctor

  Scenario: diagnóstico sobre config íntegra
    Given um projeto recém-configurado, com todas as referências resolvendo
    When a pessoa roda o doctor
    Then nenhuma divergência de perfil de agente é relatada
```

### 7. Requisitos

#### Funcionais

- **FR-001**: `.maestro/config.yaml` deve aceitar uma seção `maestro:` composta pelos grupos `identity`, `cognition`, `instruction`, `capability` e `execution`, mais a lista `subagents` (cada item com a mesma composição); toda propriedade configurável deve usar o formato `{ value, mode }`, com `mode` ∈ `suggested | required`; o `setup` deve semear essa seção quando ausente sem sobrescrever nada já definido pela pessoa.
- **FR-002**: O `setup` deve criar `.maestro/subagents/maestro/description.md` e `.maestro/subagents/maestro/behavior.md` a partir de recursos versionados quando ausentes, sem sobrescrever conteúdo existente; nenhum comportamento padrão pode existir como string embutida na lógica de produção.
- **FR-003**: Um leitor deve carregar a seção `maestro:`, resolver os caminhos referenciados por `instruction.behavior`, `instruction.additional_behavior` e `capability.skills`, e recusar em voz alta — nomeando perfil, propriedade e caminho — diante de referência quebrada, `mode` fora do domínio ou estrutura inválida, nunca devolvendo perfil parcialmente válido.
- **FR-004**: O `doctor` deve relatar as mesmas divergências que o leitor recusa, nomeando perfil e caminho, sair com código diferente de zero quando houver alguma, e não alterar o sistema de arquivos sob nenhuma condição.

#### Não funcionais

- **NFR-001**: Nenhuma chave do schema pode ser omitida na semeadura, e nenhum default pode vir de string embutida no código. **Verificação**: lista `SCHEMA_KEYS` estendida com as chaves novas e teste que confirma que o texto do comportamento padrão vive em recurso versionado, não em `src/`.
- **NFR-002**: Nenhuma operação desta fatia destrói ou sobrescreve conteúdo da pessoa, e nenhum estado parcialmente válido é devolvido. **Verificação**: testes de reexecução do `setup` sobre config customizada e de leitura sobre config quebrada, mais inspeção do `doctor` confirmando ausência de escrita.

#### Erros e casos-limite

- Arquivo referenciado por `behavior`/`additional_behavior` inexistente → leitura recusa nomeando perfil e caminho (AC-008); `doctor` relata (AC-010).
- Caminho em `capability.skills` que não existe → mesmo tratamento de referência quebrada.
- `mode` fora de `suggested | required` → recusa nomeando propriedade e valor (AC-009).
- Seção `maestro:` ausente num projeto que nunca rodou o `setup` renomeado → o leitor devolve ausência explícita (não erro), e o `setup` semeia na próxima execução.
- Dois subagents com o mesmo `identity.name` → recusa; nome é o identificador usado pelo planejamento e por logs, precisa ser único.

## Ato II — Projetar e provar

### 8. Plano técnico

#### Contexto existente

`src/config/schema.ts` define `ConfigDocument` com quatro seções e a lista
`SCHEMA_KEYS` que prova a invariante de completude. `src/config/write.ts`
expõe `CONFIG_PATH` e `ensureConfigFile(root)`, que cria o arquivo somente
quando ausente. `src/setup/run.ts:158` já chama essa garantia durante o
`setup`. `src/doctor.ts` compõe seu relatório a partir de funções de
diagnóstico puras e só-leitura (padrão de `src/extensions/diagnose.ts`).

#### Arquitetura e módulos

- `src/config/schema.ts`: acrescenta `MaestroSection`, `AgentProfile`,
  `ConfiguredProperty<T>` (`{ value, mode }`), `PropertyMode` e os cinco
  grupos; estende `ConfigDocument` e `SCHEMA_KEYS`.
- `src/agents/profile.ts` (novo): tipos de domínio do perfil carregado e a
  função pura de validação estrutural (formato, `mode` no domínio, nomes
  únicos), sem tocar em disco.
- `src/agents/read.ts` (novo): leitor que resolve caminhos referenciados
  contra a raiz do projeto e recusa em voz alta; recebe um ambiente injetado
  (existência de arquivo) para ser testável sem I/O real.
- `src/agents/diagnose.ts` (novo): diagnóstico só-leitura consumido pelo
  `doctor`, no mesmo formato de `src/extensions/diagnose.ts`.
- `src/agents/seed.ts` (novo): semeadura dos arquivos de fábrica a partir de
  `resources/agents/maestro/`, criando somente o ausente.
- `resources/agents/maestro/description.md` e
  `resources/agents/maestro/behavior.md` (novos): os defaults de fábrica como
  arquivos versionados — a fonte que a semeadura copia.
- `src/doctor.ts`: passa a compor também o diagnóstico de perfis de agente.
- `src/setup/run.ts`: chama a semeadura junto da garantia de `config.yaml`.

#### Migrations

- Não aplicável — não há banco de dados.

#### Models

- `AgentProfile`: identidade (`name`, `description`), cognição (`model`, `context_budget`, `reasoning_effort`), instrução (`behavior`, `additional_behavior`), capacidade (`skills`, `tools`, `mcp_servers`) e execução (`runtime`, `concurrency`, `cli`). Invariante: `name` único entre perfis; cada campo configurável é `ConfiguredProperty<T>`.

#### Controllers e casos de uso

- Não aplicável — CLI e servidor MCP, sem camada de controller.

#### Views e experiência

- Não aplicável — sem interface para pessoas.

#### Queries e repositórios

- Não aplicável.

#### Jobs e processamento assíncrono

- Não aplicável.

#### Estrutura de arquivos

```text
specs/draft/0015-schema-e-leitura-de-perfis-de-subagent-maestro-config-yaml/
  spec.md
src/
  config/schema.ts
  agents/profile.ts
  agents/read.ts
  agents/diagnose.ts
  agents/seed.ts
  doctor.ts
  setup/run.ts
resources/
  agents/maestro/description.md
  agents/maestro/behavior.md
tests/
```

### 9. Modelo de dados

#### Entidades

| Entidade | Identidade | Atributos e regras | Relações |
| --- | --- | --- | --- |
| `AgentProfile` | `identity.name.value`, único | cinco grupos; cada campo configurável no formato `{ value, mode }`; `mode` ∈ `suggested \| required` | o perfil `maestro` contém 0..N subagents |
| `ConfiguredProperty<T>` | — | `value: T`; `mode: PropertyMode` | composta por cada campo de `AgentProfile` |

#### Estados e transições

| Entidade | Estado atual | Evento | Próximo estado | Invariantes |
| --- | --- | --- | --- | --- |
| Configuração | ausente | `setup` | semeada com defaults de fábrica | nada existente é sobrescrito |
| Configuração | semeada | edição pela pessoa | customizada | arquivos pertencem à pessoa, sem checksum |
| Configuração | customizada | referência apagada | inválida | leitura recusa; `doctor` relata; disco intocado |

#### Migração e retenção

- Não aplicável — seção nova, sem dado prévio a migrar.

### 10. Interfaces e contratos

#### Interface para pessoas

- **Há interface para pessoas**: Não. A entrega é schema de configuração YAML, semeadura de arquivos e relato em comandos de terminal já existentes.

#### Stack e convenções de interface

- Não aplicável.

#### Telas e responsabilidades

- Não aplicável.

#### Fluxo de informação e navegação

- Não aplicável.

#### Menus e navegação principal

- Não aplicável.

#### Formulários e ações

- Não aplicável.

#### Composição e disposição

- Não aplicável.

#### Blocos React e componentes selecionados

- Não aplicável.

#### Estados e acessibilidade

- Não aplicável.

#### Contrato CRUD

- Não aplicável.

#### Revisão visual durante o desenvolvimento

- Não aplicável — nenhuma superfície visual nesta entrega.

#### APIs expostas

- `readAgentConfig(root, env)` — devolve os perfis validados ou lança recusa nomeando perfil, propriedade e caminho.
- `diagnoseAgents(root, env)` — devolve a lista de divergências, sem escrever nada.
- `seedAgentDefaults(root, env)` — cria o ausente e devolve o que escreveu.

#### APIs externas utilizadas

- Nenhuma.

#### Documentação das APIs consultadas

- Não aplicável.

#### Eventos e outros contratos

- Contrato consumido pelas fatias MA-2 a MA-6: o formato de `AgentProfile` devolvido pelo leitor é a fronteira estável entre esta fatia e o restante do épico.

### 11. Estratégia TDD

- **Unidade**: validação estrutural pura (`profile.ts`), resolução de caminho e recusa (`read.ts`), diagnóstico (`diagnose.ts`), semeadura idempotente (`seed.ts`).
- **Integração/contrato**: `setup` num root isolado produzindo config + arquivos semeados; `doctor` compondo o diagnóstico novo.
- **BDD/aceite**: os doze cenários da seção 6 orientam os doze casos TDD (um por AC).
- **Runner TDD**: Vitest, já materializado em `test:tdd` (decisão vigente do projeto, reaproveitada sem nova pergunta).
- **E2E**: não aplicável — nenhuma execução de agente nesta fatia.
- **Verificação manual**: nenhuma; todos os ACs desta fatia são automatizáveis.

#### Evidência RED-GREEN-REFACTOR

| IDs | BDD de referência | Teste TDD informado pelo BDD | RED observado | GREEN observado | Refactor/regressão |
| --- | --- | --- | --- | --- | --- |
| US-001, FR-001, NFR-001, AC-001 | AC-001 na seção 6 | tests/agents-config-schema.test.ts | Pending | Pending | Pending |
| US-001, FR-001, NFR-001, AC-002 | AC-002 na seção 6 | tests/agents-config-schema.test.ts | Pending | Pending | Pending |
| US-001, FR-001, NFR-002, AC-003 | AC-003 na seção 6 | tests/agents-config-schema.test.ts | Pending | Pending | Pending |
| US-001, FR-002, NFR-001, AC-004 | AC-004 na seção 6 | tests/agents-seed.test.ts | Pending | Pending | Pending |
| US-001, FR-002, NFR-001, AC-005 | AC-005 na seção 6 | tests/agents-seed.test.ts | Pending | Pending | Pending |
| US-001, FR-002, NFR-002, AC-006 | AC-006 na seção 6 | tests/agents-seed.test.ts | Pending | Pending | Pending |
| US-001, FR-003, NFR-001, AC-007 | AC-007 na seção 6 | tests/agents-read.test.ts | Pending | Pending | Pending |
| US-001, FR-003, NFR-002, AC-008 | AC-008 na seção 6 | tests/agents-read.test.ts | Pending | Pending | Pending |
| US-001, FR-003, NFR-002, AC-009 | AC-009 na seção 6 | tests/agents-read.test.ts | Pending | Pending | Pending |
| US-001, FR-004, NFR-002, AC-010 | AC-010 na seção 6 | tests/agents-doctor.test.ts | Pending | Pending | Pending |
| US-001, FR-004, NFR-002, AC-011 | AC-011 na seção 6 | tests/agents-doctor.test.ts | Pending | Pending | Pending |
| US-001, FR-004, NFR-001, AC-012 | AC-012 na seção 6 | tests/agents-doctor.test.ts | Pending | Pending | Pending |

### 12. Plano de testes e rastreabilidade

| Requisito | Cenário BDD | Nível | Arquivo/comando esperado | Evidência |
| --- | --- | --- | --- | --- |
| FR-001 | AC-001 | Integração (root isolado) | `tests/agents-config-schema.test.ts` | Pending |
| FR-001 | AC-002 | Unidade | `tests/agents-config-schema.test.ts` | Pending |
| FR-001 | AC-003 | Integração (root isolado) | `tests/agents-config-schema.test.ts` | Pending |
| FR-002 | AC-004 | Integração (root isolado) | `tests/agents-seed.test.ts` | Pending |
| FR-002 | AC-005 | Unidade (inspeção de fonte) | `tests/agents-seed.test.ts` | Pending |
| FR-002 | AC-006 | Integração (root isolado) | `tests/agents-seed.test.ts` | Pending |
| FR-003 | AC-007 | Unidade | `tests/agents-read.test.ts` | Pending |
| FR-003 | AC-008 | Unidade | `tests/agents-read.test.ts` | Pending |
| FR-003 | AC-009 | Unidade | `tests/agents-read.test.ts` | Pending |
| FR-004 | AC-010 | Unidade | `tests/agents-doctor.test.ts` | Pending |
| FR-004 | AC-011 | Integração (root isolado) | `tests/agents-doctor.test.ts` | Pending |
| FR-004 | AC-012 | Unidade | `tests/agents-doctor.test.ts` | Pending |
| NFR-001 | AC-001, AC-002, AC-004, AC-005, AC-012 | Unidade + integração | ver linhas acima | Pending |
| NFR-002 | AC-003, AC-006, AC-008, AC-009, AC-010, AC-011 | Unidade + integração | ver linhas acima | Pending |

### 13. Validações

#### Gate do Ato I — Definição

- **Resultado**: READY (2026-09-06)
- **Comando**: `node .claude/skills/specsfy-04-validate/scripts/validate_spec.mjs specs/draft/0015-schema-e-leitura-de-perfis-de-subagent-maestro-config-yaml/spec.md --allow-draft` → `VALID DRAFT`.
- **Achados**: Nenhum `BLOCKER`. Revisão semântica: as 8 decisões da entrevista (`BACKLOG-0009`, fatia MA-1) viraram `FR`, `AC` ou `DEC` rastreáveis. Cobertura mínima confirmada: US-001 → 12 AC; FR-001 → 3 AC (AC-001/002/003); FR-002 → 3 AC (AC-004/005/006); FR-003 → 3 AC (AC-007/008/009); FR-004 → 3 AC (AC-010/011/012); NFR-001 → 5 AC; NFR-002 → 6 AC. `Interface para pessoas: Não` justificada. Uma decisão foi deliberadamente adiada e registrada como tal (`DEC-005`, herança entre perfis), não como lacuna. Dependência dura registrada na seção 16: esta fatia não vai a GREEN antes da `SPEC-0014` estar implementada, porque `.maestro/` só existe depois dela. Um falso positivo do validador foi corrigido: a citação cruzada a um requisito de outra spec era lida como requisito local sem cenários.

#### Gate do Ato II — Plano

- **Resultado**: Pending
- **Comando**: `node .claude/skills/specsfy-05-tasks/scripts/validate_tasks.mjs specs/draft/0015-schema-e-leitura-de-perfis-de-subagent-maestro-config-yaml/spec.md`
- **Achados**: Pending.

#### Gate do Ato III — Entrega

- **Resultado**: Pending
- **Comando**: `node .claude/skills/specsfy-06-tdd-bdd/scripts/check_traceability.mjs specs/draft/0015-schema-e-leitura-de-perfis-de-subagent-maestro-config-yaml/spec.md .`
- **Achados**: Pending.

### 14. Tarefas

A seção de tarefas é responsabilidade de `$specsfy-05-tasks`, depois do
Definition Gate.

### 15. Ordem de execução

- A ordem exata é decidida por `$specsfy-05-tasks`. Restrição conhecida: a
  semeadura (`seed.ts`) depende dos recursos versionados existirem em
  `resources/agents/maestro/`, e o diagnóstico do `doctor` depende do leitor
  já expor as divergências que ele relata.

## Ato III — Entregar e validar

### 16. Dependências, riscos e suposições

#### Dependências

- `SPEC-0014` (renomeação para `maestro`) precisa estar entregue antes desta fatia, porque o caminho `.maestro/config.yaml` e o diretório `.maestro/subagents/` só existem depois dela. Enquanto `SPEC-0014` não for implementada, esta fatia não pode ir a GREEN.
- `SPEC-0012` (config.yaml sempre presente) — mecanismo de garantia de config reaproveitado, não substituído.

#### Riscos

- Schema muito rico entregue de uma vez pode revelar, nas fatias seguintes, que uma propriedade não serve como desenhada → mitigado por manter o formato `{ value, mode }` uniforme, que aceita acrescentar propriedade sem quebrar as existentes.
- `capability.skills` apontando para `.agents/skills/*` cria acoplamento com a instalação do Specsfy → mitigado por tratar caminho inexistente como referência quebrada comum, sem lógica especial por origem da skill.

#### Suposições

- Os nomes de propriedade propostos (`context_budget`, `reasoning_effort`, `concurrency`, `runtime`) são defaults reversíveis desta especificação; renomeá-los antes da implementação não muda comportamento, só vocabulário.
- `resources/` é o lugar certo para os defaults de fábrica, por consistência com `resources/hooks/` e `resources/skills/` já existentes.

### 17. Decisões

- **DEC-001**: formato uniforme `{ value, mode }` em toda propriedade, sem forma curta alternativa — razão: uma única forma de escrever a mesma coisa elimina ambiguidade de parsing e de leitura humana; o custo é verbosidade. Alternativa descartada: valor simples significando `suggested` e objeto significando `required` (rodada 1).
- **DEC-002**: composição do agente em cinco grupos (`identity`, `cognition`, `instruction`, `capability`, `execution`) — razão: separa dimensões que mudam por motivos diferentes (o que o agente é, como pensa, como se comporta, o que pode fazer, como roda); `identity.description` existe especificamente para o planejamento (MA-2) ter critério de casamento perfil↔tarefa.
- **DEC-003**: `behavior` e `additional_behavior` como chaves separadas (substituir vs somar) em vez de um campo `apply` dentro de uma única chave — razão: a distinção é semântica o bastante para merecer nome próprio, e evita um terceiro campo que só existiria para uma propriedade (rodada 3).
- **DEC-004**: sementes de fábrica são arquivos livres da pessoa, fora do checksum da `SPEC-0011` — razão: comportamento de agente é exatamente o que se espera que a pessoa edite; tratá-lo como artefato gerenciado transformaria uso legítimo em divergência (rodada 6).
- **DEC-005**: herança entre perfis (`extends`) fica fora desta fatia — razão: pode ser acrescentada depois como propriedade opcional sem quebrar o schema, e incluí-la agora ampliaria a fatia fundacional sem necessidade comprovada. Registrado como decisão adiada, não rejeitada.
- **DEC-006**: configuração apenas por projeto, sem camada `~/.maestro/` — razão: consistente com `PR-004` (nada fora da raiz do projeto) e com o objetivo de duas máquinas nunca divergirem em silêncio (rodada 8).

### 18. Definition of Done

- [ ] `Definition Gate` está `Passed`.
- [ ] `Plan Gate` está `Passed`.
- [ ] `Delivery Gate` está `Passed`.
- [ ] Os cenários `AC-001` a `AC-012` passam.
- [ ] `FR-001` a `FR-004` e `NFR-001`/`NFR-002` têm evidência de verificação nas seções 11–12.
- [ ] Todas as tarefas da seção 14 estão concluídas.
- [ ] `.specsfy/STACK.md` registra a seção nova do schema de configuração.
- [ ] `PROJECT.md` revisado quanto à capacidade nova (perfis de agente configuráveis).
