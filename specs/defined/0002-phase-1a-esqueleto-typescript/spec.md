# Especificação integrada: Phase 1a: Esqueleto TypeScript executável com dependências resolvidas

| Campo | Valor |
| --- | --- |
| Formato | Specsfy/2.0 |
| ID | SPEC-0002 |
| Slug | 0002-phase-1a-esqueleto-typescript |
| Status | Defined |
| Effort | 4 |
| Effort updated at | 2026-08-24 |
| Effort rationale | Volume pequeno de código, mas decide manifesto, módulo, build e runner — escolhas caras de reverter depois que as fatias seguintes se apoiarem nelas. |
| ClickUp Task | |
| Milestones | |
| Definition Gate | Passed |
| Plan Gate | Pending |
| Delivery Gate | Pending |
| Evidence Contract | 1 |
| Interface para pessoas | Não — a entrega é um pacote e um comando de terminal, sem tela. |
| Atualizada em | 2026-08-24 |

## Ato I — Definir

### 1. Problema e resultado

#### Problema

A branch de trabalho nasceu com 119 arquivos, e nenhum deles é código. Não há manifesto, build, runner de testes nem ponto de entrada: a v1.0 não compila nem executa, porque ainda não existe.

Há um segundo problema, menos visível e mais caro. O plano da v1.0 tratava quatro ferramentas como dependências fixadas, e essa premissa nunca foi exercitada neste repositório. A verificação de 2026-08-24 mostrou que três dos quatro nomes estavam errados e que a categoria era uma só quando deveria ser duas: `specsfy` é `@promovaweb/specsfy`, `code-review-graph` sequer é pacote npm — é Python instalado por `uv` — e `pi` não é subsistema, é agente, intercambiável por desenho e pertencente a outra camada. Construir setup, orquestração e seleção de modelo sobre uma premissa não exercitada repetiria o erro que a Phase 0 encontrou no `.gitignore`, quando o conjunto que a fase prometia preservar não existia em git.

#### Resultado desejado

Um pacote mínimo que instala, compila, testa e executa, e que prova de forma executável que as três dependências do projeto são alcançáveis.

Ao fim desta fatia, `npm install` seguido de `npm run build` produz um binário `common-rules` que responde `--version`, e `common-rules doctor` reporta cada uma das três dependências do projeto, saindo com código diferente de zero quando alguma faltar. Nada além disso: sem setup, sem orquestração, sem aprovação, sem seleção de modelo.

O valor não é o comando `--version`. É ter chão firme e a premissa das dependências exercitada antes que qualquer capacidade se apoie nela.

#### Métricas de sucesso

- `npm ci` a partir de um clone limpo conclui sem erro.
- `npm run build` produz um ponto de entrada executável em `dist/`.
- `npm run test:tdd` executa a suíte Vitest e passa.
- `common-rules --version` imprime exatamente a versão declarada no manifesto.
- `common-rules doctor` reporta as três dependências do projeto e sai com zero quando todas estão presentes.
- `common-rules doctor` sai com código diferente de zero, nomeando a ausente, quando `code-review-graph` não está no PATH.
- As duas dependências npm estão fixadas em versão exata, sem faixa.

### 2. Research e esclarecimentos

#### Researchs executados

- **R-001** [critical] As quatro dependências do plano existem e são instaláveis como descrito — Verdict: refuted — Confidence: high — Evidence: seção `Fontes e contexto consultados` — Budget: 1/1. Três dos quatro nomes estavam errados e um não é pacote npm. A decisão de modelo de dependências foi revista em consequência.

#### Fontes e contexto consultados

- `npm view` contra o registro público em 2026-08-24, para cada nome candidato.
- `npm ls -g --depth=0` e `command -v` na máquina de desenvolvimento, para levantar o que está instalado.
- `https://pi.dev/`, consultada para resolver a identidade do agente `pi`.
- `specs/backlog/0003-phase-1-mvp-typescript-subsistemas.md`, backlog de origem.
- `specs/completed/0001-phase-0-preparacao-limpeza/spec.md`, pela lição sobre premissa não verificada.

#### Documentação consultada

- Página do Pi Coding Agent, `https://pi.dev/`, consultada em 2026-08-24. Extraído: pacote `@earendil-works/pi-coding-agent`, binário `pi`, modo print `-p` e saída estruturada `--mode json`. Nenhum trecho da página foi copiado.

#### Artefatos de pesquisa armazenados

Nenhum artefato externo. A consulta a `pi.dev` produziu apenas os identificadores registrados acima, confirmados de forma independente por `npm view @earendil-works/pi-coding-agent`, cuja saída é o registro público e não conteúdo da página.

#### Dúvidas respondidas

- **Q**: O `common-rules` deve instalar as ferramentas ou apenas usar o que o ambiente já tem? → **A**: Depende da camada. Agentes são detectados e nunca instalados. As três dependências do projeto seguem uma regra única: preferir a cópia local, aceitar a global, nunca instalar globalmente. A ponte que cria a cópia local é explícita e vive na fatia 1b.
- **Q**: `code-review-graph` é Python; dá para instalá-lo pelo `package.json`? → **A**: Dá, e foi verificado: `uv venv` seguido de `uv pip install code-review-graph==2.3.7` produz o binário funcional dentro do projeto, sem tocar em `~/.local/share/uv/tools/`. O ambiente resultante mede cerca de 262 MB, e por isso a cópia local é criada sob pedido, e não a cada `npm install`.
- **Q**: Por que não usar `postinstall` para isso? → **A**: Porque escreveria no ambiente global durante um `npm install`, seria desligado por `--ignore-scripts`, quebraria CI sem `uv` e faria este projeto ditar a versão de uma ferramenta compartilhada. Ver DEC-002.

- **Q**: Como fica o modelo de dependências, se `code-review-graph` é Python? → **A**: npm fixa as três que são npm; o setup exige `uv` para `code-review-graph` e falha quando ausente. Nesta fatia, apenas a verificação de alcance é implementada; a exigência no setup pertence à fatia 1b.
- **Q**: Qual pacote é o `pi.dev`? → **A**: `@earendil-works/pi-coding-agent`, versão 0.84.3, binário `pi`. `@mariozechner/pi` foi descartado: é um gerenciador de pods vLLM.
- **Q**: Qual runner de testes? → **A**: Vitest.
- **Q**: Qual o nome do pacote? → **A**: `@brunocalmon/common-rules`, com binário `common-rules`. O nome sem escopo está ocupado no npm por um pacote de expressões regulares abandonado desde 2023.
- **Q**: A Phase 1 cabe em uma spec? → **A**: Não. Foi fatiada em 1a a 1e; esta é a 1a.

#### Dúvidas abertas

Nenhuma que bloqueie esta fatia. A inclusão de `codex` na lista de backends suportados segue em aberto e pertence à fatia 1d.

### 3. Escopo e atores

#### Incluído

- Manifesto `package.json` com nome `@brunocalmon/common-rules`, binário `common-rules`, `type: module` e `engines.node`.
- Configuração TypeScript e build que produz um ponto de entrada executável em `dist/`.
- Vitest instalado e exposto pelo script `test:tdd`, exigido pelo contrato do framework em projeto Node.
- As duas dependências npm declaradas em versão exata: `@promovaweb/specsfy` e `context-mode`. Elas são subsistemas do produto, resolvidos de `node_modules`, e é daí que vem a garantia de versão.
- Comando `common-rules --version`, que imprime a versão do manifesto.
- Comando `common-rules doctor`, que reporta o alcance das três dependências do projeto e sai com código diferente de zero quando alguma falta.
- `.gitignore` cobrindo tudo que a instalação e o build geram e que não pertence ao repositório: `node_modules/`, `dist/` e o ambiente virtual Python local. O venv de `code-review-graph` mede cerca de 262 MB, de modo que versioná-lo por descuido seria um estrago difícil de desfazer.

#### Fora de escopo

- `setup`, em qualquer forma, CLI ou MCP. É a fatia 1b.
- Approval workflow. É a fatia 1c.
- Detecção de backends de agente — `pi`, `claude`, `cursor-agent`, `codex`, `agy`, `goose`, `dsh` e Ollama — e a lista de suportados. É a fatia 1d. Agentes nunca são instalados por esta ferramenta.
- Seleção de modelo. É a fatia 1e.
- Orquestração, subagentes, delegação, hooks, regras e skills próprias.
- Instalar `code-review-graph` ou `uv`. Esta fatia apenas verifica alcance; exigir instalação pertence ao setup.
- Publicar o pacote no npm.
- Substituir a main pela branch de trabalho.

#### Atores

- **Pessoa que desenvolve a v1.0**: instala, compila, executa a suíte e usa `doctor` para saber se o ambiente sustenta as fatias seguintes.
- **Fatias 1b a 1e**: herdam manifesto, build, runner e as dependências resolvidas, e não repetem essas decisões.
- **Pipeline de CI, quando existir**: executa `npm ci`, `build` e `test:tdd` sem interação.

### 4. Princípios e restrições do projeto

- **PR-001**: Esta fatia entrega chão, não capacidade. Qualquer comportamento de produto pertence a 1b ou adiante.
- **PR-002**: As dependências npm são fixadas em versão exata, sem faixa. Faixa reintroduz a divergência entre máquinas que o plano quer eliminar.
- **PR-003**: Nada é instalado globalmente por esta entrega. `code-review-graph` e `uv` são pré-requisitos do ambiente, verificados e nunca instalados.
- **PR-004**: A premissa das dependências é exercitada por comando, não por afirmação em documento.

### 5. Histórias de usuário

#### US-001 — Ter um pacote que instala, compila, testa e executa

Como **pessoa que desenvolve a v1.0**, quero **um pacote mínimo que passe por instalação, build, testes e execução**, para **construir as capacidades seguintes sobre chão verificado em vez de suposto**.

**Por que P1**: Bloqueia todas as fatias seguintes. Sem manifesto e build não há onde escrever código.
**Teste independente**: A partir de um clone limpo, `npm ci && npm run build && npm run test:tdd` conclui sem erro e `common-rules --version` imprime a versão do manifesto.
**Requisitos**: FR-001, FR-002, FR-003, FR-005

#### US-002 — Saber se o ambiente alcança as três dependências do projeto

Como **pessoa que desenvolve a v1.0**, quero **um comando que reporte o alcance de cada dependência**, para **descobrir uma ausência agora, e não no meio da orquestração**.

**Por que P1**: A Phase 0 mostrou o custo de construir sobre premissa não exercitada. Esta é a menor prova executável de que o plano se sustenta.
**Teste independente**: `common-rules doctor` lista as três dependências do projeto com veredito e origem resolvida, sai com zero num ambiente completo e com código diferente de zero nomeando a ausente quando `code-review-graph` não existe em nenhuma das duas origens.
**Requisitos**: FR-004, FR-006

### 6. Cenários BDD de aceite

#### AC-001 — Instalação limpa conclui

**Cobre**: US-001, FR-001, FR-003, FR-004, NFR-002

```gherkin
@US-001 @FR-001 @FR-003 @FR-004 @NFR-002 @AC-001
Feature: Instalação a partir de clone limpo

  Scenario: npm ci conclui sem erro
    Given um clone limpo da branch de trabalho
    When a pessoa executa a instalação de dependências
    Then a instalação conclui com código zero
    And as duas dependências npm aparecem em node_modules nas versões exatas declaradas
    And nenhuma dependência do manifesto declara faixa de versão
```

#### AC-002 — Build produz um executável

**Cobre**: US-001, FR-001, FR-002, NFR-001

```gherkin
@US-001 @FR-001 @FR-002 @NFR-001 @AC-002
Feature: Compilação do TypeScript

  Scenario: O build gera o ponto de entrada
    Given as dependências instaladas
    When a pessoa executa o build
    Then o build conclui com código zero
    And existe um ponto de entrada executável em dist/
    And esse arquivo é o alvo declarado pelo campo de binário do manifesto
```

#### AC-003 — A suíte executa pelo script exigido

**Cobre**: US-001, FR-003, NFR-001

```gherkin
@US-001 @FR-003 @NFR-001 @AC-003
Feature: Runner de testes

  Scenario: test:tdd executa a suíte Vitest
    Given o projeto instalado
    When a pessoa executa o script test:tdd
    Then o Vitest executa a suíte e conclui com código zero
    And o script test:tdd existe no manifesto, como o contrato do framework exige em projeto Node
```

#### AC-004 — `--version` imprime a versão do manifesto

**Cobre**: US-001, FR-001, FR-002, FR-005, NFR-003

```gherkin
@US-001 @FR-001 @FR-002 @FR-005 @NFR-003 @AC-004
Feature: Identificação da versão

  Scenario: O comando reporta a versão declarada
    Given o projeto compilado
    When a pessoa executa o binário com o argumento de versão
    Then a saída contém exatamente a versão declarada no manifesto
    And o comando sai com código zero
```

#### AC-005 — `doctor` aprova um ambiente completo

**Cobre**: US-002, FR-006, NFR-002, NFR-003

```gherkin
@US-002 @FR-006 @NFR-002 @NFR-003 @AC-005
Feature: Verificação de dependências

  Scenario: Ambiente completo é aprovado
    Given as duas dependências npm resolvíveis, local ou globalmente
    And code-review-graph alcançável em alguma das duas origens
    When a pessoa executa o comando doctor
    Then a saída lista as três dependências do projeto com veredito individual
    And cada dependência aparece com a camada, a origem resolvida e a versão encontrada
    And o comando sai com código zero
```

#### AC-006 — `doctor` reprova nomeando a ausente

**Cobre**: US-002, FR-006, FR-004

```gherkin
@US-002 @FR-006 @FR-004 @AC-006
Feature: Ausência de dependência

  Scenario: code-review-graph indisponível reprova a verificação
    Given as duas dependências npm resolvíveis
    And code-review-graph ausente tanto do projeto quanto do PATH
    When a pessoa executa o comando doctor
    Then a saída nomeia code-review-graph como ausente
    And explica que se trata de ferramenta Python instalada por uv, e não de pacote npm
    And o comando sai com código diferente de zero
```

#### AC-007 — Versões fixas, sem faixa

**Cobre**: US-001, FR-004, NFR-002

```gherkin
@US-001 @FR-004 @NFR-002 @AC-007
Feature: Fixação de versões

  Scenario: Nenhuma dependência aceita faixa
    Given o manifesto do projeto
    When a pessoa inspeciona as dependências declaradas
    Then cada versão é exata, sem prefixo de intervalo
    And as versões correspondem às verificadas em 2026-08-24
```

#### AC-008 — O pacote não exige instalação global

**Cobre**: US-001, US-002, FR-001, FR-002, FR-005, NFR-003

```gherkin
@US-001 @US-002 @FR-001 @FR-002 @FR-005 @NFR-003 @AC-008
Feature: Isolamento do ambiente

  Scenario: O binário roda sem instalar nada globalmente
    Given um clone limpo, instalado e compilado
    When a pessoa executa o binário pelo caminho local do projeto
    Then o comando responde sem exigir instalação global do próprio pacote
    And as duas dependências npm são resolvidas de node_modules e não do PATH global
```

#### AC-009 — Instalação, build e testes cabem no orçamento

**Cobre**: US-001, NFR-001, FR-002, FR-003

```gherkin
@US-001 @FR-002 @FR-003 @NFR-001 @AC-009
Feature: Orçamento de tempo do ciclo

  Scenario: O ciclo completo termina dentro do limite
    Given um clone limpo com cache de pacotes frio
    When a pessoa executa instalação, build e suíte em sequência
    Then o tempo total medido fica abaixo de cinco minutos
    And cada etapa conclui com código zero
```

#### AC-010 — O esqueleto não entrega capacidade de produto

**Cobre**: US-001, US-002, FR-005, FR-006

```gherkin
@US-001 @US-002 @FR-005 @FR-006 @AC-010
Feature: Limite do esqueleto

  Scenario: Apenas dois comandos existem
    Given o binário compilado
    When a pessoa lista os comandos disponíveis
    Then apenas identificação de versão e verificação de dependências são oferecidas
    And nenhum comando de setup, orquestração, aprovação ou seleção de modelo existe
```

### 7. Requisitos

#### Funcionais

- **FR-001**: O projeto deve declarar um manifesto com nome `@brunocalmon/common-rules`, binário `common-rules`, módulo ESM e versão mínima de Node.
- **FR-002**: O projeto deve compilar TypeScript para um ponto de entrada executável em `dist/`, alvo do campo de binário.
- **FR-003**: O projeto deve expor o script `test:tdd` executando Vitest.
- **FR-004**: O projeto deve declarar as duas dependências npm de subsistema em versão exata, sem faixa.
- **FR-005**: O binário deve imprimir a versão declarada no manifesto quando invocado com o argumento de versão, saindo com zero.
- **FR-006**: O binário deve reportar, no comando `doctor`, o alcance de cada uma das três dependências do projeto e a origem que resolveu para cada uma, local ou global, saindo com zero quando todas estão presentes e com código diferente de zero quando alguma falta, nomeando-a.

#### Não funcionais

- **NFR-001**: **Tempo do ciclo**. Instalação com cache frio, build e suíte concluem em menos de cinco minutos somados. **Verificação**: medição do tempo decorrido das três etapas, registrada na seção 12.
- **NFR-002**: **Reprodutibilidade**. Nenhuma dependência declarada aceita faixa de versão, de modo que duas máquinas instalem o mesmo conteúdo. **Verificação**: inspeção programática do manifesto, falhando ao encontrar prefixo de intervalo.
- **NFR-003**: **Isolamento**. O pacote executa a partir do projeto, e os subsistemas npm são resolvidos de `node_modules`, não do PATH global. **Verificação**: execução do binário pelo caminho local em clone limpo.

#### Erros e casos-limite

- `code-review-graph` ausente do PATH → `doctor` reprova nomeando a ferramenta e explicando que vem de `uv`, não do npm. Não tentar instalar.
- Dependência do projeto ausente nas duas origens → `doctor` reprova nomeando o pacote e a camada, e aponta a ponte explícita da fatia 1b. Não instalar por conta própria, nem local nem globalmente.
- Versão resolvida divergente da declarada → `doctor` reporta a origem, a versão encontrada e a esperada, e reprova. Divergência silenciosa é o problema que a fixação existe para evitar, e ela é mais provável justamente quando a resolução caiu na cópia global.
- Node abaixo da versão mínima → o manifesto declara o requisito e a instalação avisa; o binário não tenta contornar.
- `dist/` ausente ao invocar o binário → mensagem indicando que o build não foi executado, em vez de erro de módulo não encontrado.

## Ato II — Projetar e provar

### 8. Plano técnico

#### Contexto existente

- Branch `refactor/v1-cli-first`, com 119 arquivos versionados e nenhum de código: `specs/`, `.claude/`, `.specsfy/` e o link `.agents`.
- Sem `package.json`, sem `.gitignore`, sem `dist/`, sem `node_modules/`.
- Node 22.23.1 e npm 10.9.8 na máquina de desenvolvimento; `uv` presente, com `code-review-graph` 2.3.7 instalado por ele.
- `.claude/scripts/phase0/` contém as sete asserções da Phase 0, em Node CommonJS. Elas continuam válidas e não são migradas por esta fatia.

#### Arquitetura e módulos

Três camadas, deliberadamente rasas nesta fatia:

| Módulo | Responsabilidade | Arquivo |
| --- | --- | --- |
| Ponto de entrada | Interpretar o argumento, despachar e definir o código de saída | `src/cli.ts` |
| Versão | Ler a versão do manifesto | `src/version.ts` |
| Verificação de dependências | Resolver cada dependência do projeto preferindo a cópia local e aceitando a global, relatando a origem | `src/doctor.ts` |

O ponto de entrada não contém lógica de verificação, e a verificação não imprime — devolve um resultado que o ponto de entrada formata. Essa separação é o que permite testar `doctor` sem capturar saída de terminal.

#### Migrations

Não aplicável. A fatia não introduz persistência.

#### Models

Um tipo de resultado por dependência, com nome, forma de obtenção, versão encontrada e veredito, em `src/doctor.ts`. Não há entidade de domínio.

#### Controllers e casos de uso

`src/cli.ts` concentra o despacho dos dois comandos. Não há autorização: os comandos são locais e apenas leem.

#### Views e experiência

Não aplicável. A seção 10 registra a ausência de interface.

#### Queries e repositórios

Não aplicável.

#### Jobs e processamento assíncrono

Não aplicável. A sondagem do PATH é síncrona e pontual.

#### Estrutura de arquivos

```text
package.json
tsconfig.json
vitest.config.ts
.gitignore
src/
  cli.ts
  version.ts
  doctor.ts
tests/
  cli.test.ts
  doctor.test.ts
dist/
```

### 9. Modelo de dados

Não aplicável. A fatia não persiste informação: `doctor` inspeciona o ambiente e descarta o resultado ao terminar.

### 10. Interfaces e contratos

#### Interface para pessoas

**Não há interface para pessoas.** A entrega é um pacote npm e um binário de terminal com dois argumentos. Não existe tela, formulário ou navegação a especificar.

#### APIs expostas

Nenhuma. O binário é a única superfície, e ela é local.

#### APIs externas utilizadas

Nenhuma em tempo de execução. As dependências são resolvidas do sistema de arquivos e do PATH; não há chamada de rede.

#### Documentação das APIs consultadas

- `https://pi.dev/`, 2026-08-24 — identidade do pacote e existência dos modos `-p` e `--mode json`, registrados para as fatias seguintes. Esta fatia não invoca `pi`.

#### Eventos e outros contratos

Não aplicável.

### 11. Estratégia TDD

- **Unidade**: leitura da versão e formação do resultado de cada dependência, com o ambiente injetado para que o teste não dependa da máquina.
- **Integração**: `doctor` contra `node_modules` real e contra um PATH controlado, que é onde a ausência de `code-review-graph` pode ser simulada sem desinstalar nada.
- **Contrato**: forma do manifesto — nome, binário, tipo de módulo, versões exatas e presença de `test:tdd`.
- **Runner TDD**: Vitest, exposto pelo script `test:tdd` conforme o contrato do framework para projeto Node.
- **E2E**: execução do binário compilado como subprocesso, que é a única forma de provar que o build produziu algo executável.
- **BDD/aceite**: os cenários da seção 6 são a referência de desenho dos testes; nenhum arquivo `.feature` é criado ou executado.
- **Verificação manual**: nenhuma.

O ponto sensível é a injeção do ambiente. Um teste de `doctor` que consulte o PATH real passaria nesta máquina e falharia noutra, provando apenas onde foi executado. As funções recebem o resolvedor e o PATH como parâmetro, e os testes fornecem ambientes controlados.

### 12. Plano de testes e rastreabilidade

| Requisito | Cenário BDD | Nível | Comando de verificação | Evidência |
| --- | --- | --- | --- | --- |
| FR-001 | AC-001 | Contrato | `npm run test:tdd` — caso de forma do manifesto | Pending |
| FR-001 | AC-007 | Contrato | `npm run test:tdd` — caso de versões exatas | Pending |
| FR-001 | AC-008 | E2E | execução do binário pelo caminho local | Pending |
| FR-002 | AC-002 | E2E | `npm run build` e inspeção de `dist/` | Pending |
| FR-002 | AC-009 | Medição | tempo de build registrado | Pending |
| FR-002 | AC-010 | E2E | lista de comandos do binário compilado | Pending |
| FR-003 | AC-003 | Contrato | `npm run test:tdd` — caso de presença do script | Pending |
| FR-003 | AC-009 | Medição | tempo da suíte registrado | Pending |
| FR-003 | AC-002 | Unidade | suíte executa sobre o build corrente | Pending |
| FR-004 | AC-007 | Contrato | inspeção programática do manifesto | Pending |
| FR-004 | AC-001 | Integração | versões em `node_modules` iguais às declaradas | Pending |
| FR-004 | AC-006 | Integração | divergência de versão reprova `doctor` | Pending |
| FR-005 | AC-004 | E2E | binário com argumento de versão | Pending |
| FR-005 | AC-010 | E2E | apenas dois comandos oferecidos | Pending |
| FR-005 | AC-008 | E2E | execução local sem instalação global | Pending |
| FR-006 | AC-005 | Integração | `doctor` em ambiente completo | Pending |
| FR-006 | AC-006 | Integração | `doctor` com PATH sem `code-review-graph` | Pending |
| FR-006 | AC-010 | E2E | `doctor` presente na lista de comandos | Pending |
| NFR-001 | AC-009 | Medição | tempo somado das três etapas | Pending |
| NFR-001 | AC-002 | Medição | build isolado dentro do orçamento | Pending |
| NFR-001 | AC-003 | Medição | suíte isolada dentro do orçamento | Pending |
| NFR-002 | AC-007 | Contrato | nenhum prefixo de intervalo no manifesto | Pending |
| NFR-002 | AC-001 | Integração | instalação reproduz as versões declaradas | Pending |
| NFR-003 | AC-008 | E2E | binário roda pelo caminho local | Pending |
| NFR-003 | AC-004 | E2E | versão impressa sem instalação global | Pending |
| NFR-003 | AC-005 | Integração | dependências npm resolvidas de `node_modules` | Pending |

### 13. Validações

#### Gate do Ato I — Definição

- **Resultado**: READY (2026-08-24)
- **Comando**: `node .claude/skills/specsfy-04-validate/scripts/validate_spec.mjs specs/defined/0002-phase-1a-esqueleto-typescript/spec.md`
- **Cobertura**: 2 US, 6 FR, 3 NFR, 10 AC, 5 DEC; mínimo de 3 AC por ID satisfeito.

**Achados da rodada**

| ID | Achado | Estado |
| --- | --- | --- |
| D1 | Seis IDs declaravam menos de três cenários em `**Cobre**`; a cobertura extra existia só na matriz da seção 12, que o validador não lê | Resolvido — cobertura declarada onde o cenário de fato exercita o requisito |
| D2 | O defeito do quantificador português reincidiu pela quarta vez, na abertura de uma frase da seção 1, e pela quinta ao redigir esta própria nota | Contornado — frases reescritas; ver N5 e N6 em SPEC-0001 |

#### Gate do Ato II — Plano

- **Resultado**: Pending
- **Comando**: `node .claude/skills/specsfy-05-tasks/scripts/validate_tasks.mjs specs/defined/0002-phase-1a-esqueleto-typescript/spec.md`

#### Gate do Ato III — Entrega

- **Resultado**: Pending
- **Verificação**: suíte Vitest verde, build executável e `doctor` aprovando o ambiente, com evidência na seção 12.

#### Suposições

- Módulo ESM, por ser o padrão de um projeto TypeScript novo em Node 22 e por `context-mode` e `pi` já serem ESM. Reversível enquanto nenhuma fatia depender do formato.
- Node maior ou igual a 20, a linha LTS, embora a máquina de desenvolvimento use 22.
- As versões fixadas são as verificadas em 2026-08-24: `@promovaweb/specsfy` 0.10.2 e `context-mode` 1.0.169 na camada npm, e `code-review-graph` 2.3.7 na camada Python. `@earendil-works/pi-coding-agent` 0.84.3 permanece registrado como identidade do agente `pi`, que pertence à camada 3 e não é fixado por este projeto.
- `uv` está disponível para a ponte da fatia 1b. Esta fatia apenas resolve e relata, sem instalar em nenhuma origem.

#### Decisões abertas

Nenhuma que bloqueie esta fatia.

### 14. Tarefas

#### Fase 1 — Bootstrap do runner

As dez asserções da fase seguinte rodam em Vitest, que vem do manifesto que elas verificam. A saída é separar os dois papéis: esta tarefa instala apenas o runner, sem nenhum campo de produto, de modo que as asserções reprovem por ausência real e não por falta de ferramenta.

- [ ] T001 [OPS] [US-001] Criar .gitignore e um package.json de bootstrap contendo apenas Vitest e o script test:tdd — Refs: US-001, FR-003 — Depends: none
  - [ ] **PREP**: Confirmar que o projeto não tem manifesto, e que a Phase 0 removeu o `.gitignore` antigo junto com o restante da v0.2.8.
  - [ ] **EXECUTE**: Escrever `.gitignore` cobrindo `node_modules/`, `dist/` e o ambiente virtual Python local, antes de qualquer instalação, para que nada de gerado alcance o índice; escrever `package.json` com `private: true`, `devDependencies.vitest` e `scripts.test:tdd`, sem nome, binário, tipo de módulo ou dependências de produto; instalar.
  - [ ] **VERIFY**: `npm run test:tdd` executa o Vitest e reporta ausência de teste, o que prova o runner operante sem afirmar nada sobre o produto.
  - [ ] **EVIDENCE**: Registrar comando, saída e a lista de campos deliberadamente ausentes do manifesto de bootstrap na seção 12.
  - [ ] **IMPROVE**: Registrar melhoria aplicada ao bootstrap ou justificar ausência.

#### Fase 2 — Asserções em RED

Uma tarefa por cenário da seção 6. Nenhuma depende das outras e cada uma escreve num arquivo distinto, por isso executam em paralelo.

- [ ] T002 [P] [TEST] [TDD] [US-001] Derivar do AC-001 o caso de instalação limpa em tests/manifest.test.ts — Refs: US-001, FR-001, FR-003, FR-004, NFR-002, AC-001 — Depends: T001
  - [ ] **PREP**: Ler o Gherkin de AC-001 e definir as asserções: nome do pacote, presença das três dependências e ausência de faixa de versão.
  - [ ] **EXECUTE**: Escrever o caso lendo o manifesto do disco, com marcador `SPECSFY` declarando os IDs.
  - [ ] **VERIFY**: Executar `npm run test:tdd` e observar RED por ausência dos campos de produto no manifesto de bootstrap.
  - [ ] **EVIDENCE**: Registrar comando, saída de RED e a asserção que falhou na seção 12.
  - [ ] **IMPROVE**: Registrar melhoria aplicada ao caso ou justificar ausência.

- [ ] T003 [P] [TEST] [TDD] [US-001] Derivar do AC-002 o caso de build executável em tests/build.test.ts — Refs: US-001, FR-001, FR-002, NFR-001, AC-002 — Depends: T001
  - [ ] **PREP**: Ler o Gherkin de AC-002 e definir o critério: existe em `dist/` o arquivo que o campo de binário do manifesto declara.
  - [ ] **EXECUTE**: Escrever o caso que resolve o alvo do binário pelo manifesto e verifica sua presença, com marcador `SPECSFY`.
  - [ ] **VERIFY**: Executar a suíte e observar RED por não existir campo de binário nem `dist/`.
  - [ ] **EVIDENCE**: Registrar comando, saída de RED e código de saída na seção 12.
  - [ ] **IMPROVE**: Registrar melhoria aplicada ao caso ou justificar ausência.

- [ ] T004 [P] [TEST] [TDD] [US-001] Derivar do AC-003 o caso de contrato do runner em tests/scripts.test.ts — Refs: US-001, FR-003, NFR-001, AC-003 — Depends: T001
  - [ ] **PREP**: Ler o Gherkin de AC-003 e definir o critério: o manifesto expõe `test:tdd` e ele invoca Vitest, como o enforcement do framework exige em projeto Node.
  - [ ] **EXECUTE**: Escrever o caso verificando o script e o runner que ele chama, com marcador `SPECSFY`.
  - [ ] **VERIFY**: Executar a suíte. O script já existe desde T001; a asserção que reprova é a de o manifesto ser o de produto e não o de bootstrap.
  - [ ] **EVIDENCE**: Registrar comando, saída de RED e a asserção que falhou na seção 12.
  - [ ] **IMPROVE**: Registrar melhoria aplicada ao caso ou justificar ausência.

- [ ] T005 [P] [TEST] [TDD] [US-001] Derivar do AC-004 o caso de impressão da versão em tests/version.test.ts — Refs: US-001, FR-001, FR-002, FR-005, NFR-003, AC-004 — Depends: T001
  - [ ] **PREP**: Ler o Gherkin de AC-004 e definir o critério: a saída do binário compilado contém exatamente a versão do manifesto e o código de saída é zero.
  - [ ] **EXECUTE**: Escrever o caso executando o binário como subprocesso, com marcador `SPECSFY`.
  - [ ] **VERIFY**: Executar a suíte e observar RED por não existir binário compilado.
  - [ ] **EVIDENCE**: Registrar comando, saída de RED e código de saída na seção 12.
  - [ ] **IMPROVE**: Registrar melhoria aplicada ao caso ou justificar ausência.

- [ ] T006 [P] [TEST] [TDD] [US-002] Derivar do AC-005 o caso de ambiente aprovado em tests/doctor-ok.test.ts — Refs: US-002, FR-006, NFR-002, NFR-003, AC-005 — Depends: T001
  - [ ] **PREP**: Ler o Gherkin de AC-005 e definir o critério: as três dependências do projeto recebem veredito individual, cada uma reporta camada, origem resolvida e versão, e o código de saída é zero.
  - [ ] **EXECUTE**: Escrever o caso injetando um ambiente controlado completo, para que o resultado não dependa da máquina, com marcador `SPECSFY`.
  - [ ] **VERIFY**: Executar a suíte e observar RED por não existir o módulo de verificação.
  - [ ] **EVIDENCE**: Registrar comando, saída de RED e código de saída na seção 12.
  - [ ] **IMPROVE**: Registrar melhoria aplicada ao caso ou justificar ausência.

- [ ] T007 [P] [TEST] [TDD] [US-002] Derivar do AC-006 o caso de dependência ausente em tests/doctor-missing.test.ts — Refs: US-002, FR-004, FR-006, AC-006 — Depends: T001
  - [ ] **PREP**: Ler o Gherkin de AC-006 e definir o critério: a saída nomeia `code-review-graph`, explica que vem de `uv` e não do npm, e o código de saída difere de zero.
  - [ ] **EXECUTE**: Escrever o caso com um PATH controlado sem a ferramenta, sem desinstalar nada da máquina, com marcador `SPECSFY`.
  - [ ] **VERIFY**: Executar a suíte e observar RED por não existir o módulo de verificação.
  - [ ] **EVIDENCE**: Registrar comando, saída de RED e código de saída na seção 12.
  - [ ] **IMPROVE**: Registrar melhoria aplicada ao caso ou justificar ausência.

- [ ] T008 [P] [TEST] [TDD] [US-001] Derivar do AC-007 o caso de versões fixas em tests/pinning.test.ts — Refs: US-001, FR-004, NFR-002, AC-007 — Depends: T001
  - [ ] **PREP**: Ler o Gherkin de AC-007 e definir o critério: nenhuma dependência declarada aceita prefixo de intervalo, e as versões conferem com as verificadas em 2026-08-24.
  - [ ] **EXECUTE**: Escrever o caso inspecionando cada versão declarada, com marcador `SPECSFY`.
  - [ ] **VERIFY**: Executar a suíte e observar RED por não existirem dependências de produto no manifesto de bootstrap.
  - [ ] **EVIDENCE**: Registrar comando, saída de RED e código de saída na seção 12.
  - [ ] **IMPROVE**: Registrar melhoria aplicada ao caso ou justificar ausência.

- [ ] T009 [P] [TEST] [TDD] [US-001] [US-002] Derivar do AC-008 o caso de execução local em tests/local-run.test.ts — Refs: US-001, US-002, FR-001, FR-002, FR-005, NFR-003, AC-008 — Depends: T001
  - [ ] **PREP**: Ler o Gherkin de AC-008 e definir o critério: o binário responde ao ser invocado pelo caminho do projeto, sem instalação global do próprio pacote.
  - [ ] **EXECUTE**: Escrever o caso executando o alvo do binário por caminho relativo, com marcador `SPECSFY`.
  - [ ] **VERIFY**: Executar a suíte e observar RED por não existir alvo de binário.
  - [ ] **EVIDENCE**: Registrar comando, saída de RED e código de saída na seção 12.
  - [ ] **IMPROVE**: Registrar melhoria aplicada ao caso ou justificar ausência.

- [ ] T010 [P] [TEST] [TDD] [US-001] Derivar do AC-009 o caso de orçamento do ciclo em tests/budget.test.ts — Refs: US-001, FR-002, FR-003, NFR-001, AC-009 — Depends: T001
  - [ ] **PREP**: Ler o Gherkin de AC-009 e definir o critério: a soma dos tempos registrados de instalação, build e suíte fica abaixo de cinco minutos.
  - [ ] **EXECUTE**: Escrever o caso lendo os tempos registrados pela execução das etapas, falhando quando algum estiver ausente, com marcador `SPECSFY`.
  - [ ] **VERIFY**: Executar a suíte e observar RED por não haver tempos registrados.
  - [ ] **EVIDENCE**: Registrar comando, saída de RED e código de saída na seção 12.
  - [ ] **IMPROVE**: Registrar melhoria aplicada ao caso ou justificar ausência.

- [ ] T011 [P] [TEST] [TDD] [US-001] [US-002] Derivar do AC-010 o caso de limite do esqueleto em tests/surface.test.ts — Refs: US-001, US-002, FR-005, FR-006, AC-010 — Depends: T001
  - [ ] **PREP**: Ler o Gherkin de AC-010 e definir o critério: apenas identificação de versão e verificação de dependências são oferecidas.
  - [ ] **EXECUTE**: Escrever o caso verificando a superfície de comandos e a ausência de setup, orquestração, aprovação e seleção de modelo, com marcador `SPECSFY`.
  - [ ] **VERIFY**: Executar a suíte e observar RED por não existir superfície de comandos.
  - [ ] **EVIDENCE**: Registrar comando, saída de RED e código de saída na seção 12.
  - [ ] **IMPROVE**: Registrar melhoria aplicada ao caso ou justificar ausência.

#### Fase 3 — Fundação

- [ ] T012 [CODE] [US-001] Promover o bootstrap a manifesto de produto em package.json — Refs: US-001, FR-001, FR-003, FR-004, NFR-002, AC-001, AC-007 — Depends: T002, T003, T004, T008
  - [ ] **PREP**: Confirmar RED em T002, T004 e T008; reconstruir `docs/` com `$specsfy-documentator` e conferir que a reconstrução está atual.
  - [ ] **EXECUTE**: Declarar nome `@brunocalmon/common-rules`, binário `common-rules`, `type: module`, `engines.node` maior ou igual a 20 e as três dependências em versão exata.
  - [ ] **VERIFY**: `npm run test:tdd` — os casos de manifesto, contrato do runner e fixação passam a GREEN; os demais continuam em RED por dependerem de build e código.
  - [ ] **EVIDENCE**: Registrar comando, transição de RED para GREEN por caso e arquivos alterados na seção 12.
  - [ ] **IMPROVE**: Registrar melhoria aplicada ao manifesto ou justificar ausência.

- [ ] T013 [CODE] [US-001] Configurar TypeScript e o build em tsconfig.json — Refs: US-001, FR-002, NFR-001, AC-002, AC-009 — Depends: T003, T005, T010, T012
  - [ ] **PREP**: Confirmar RED em T003 e T010; reconstruir `docs/` com `$specsfy-documentator` antes de alterar produção.
  - [ ] **EXECUTE**: Configurar a compilação ESM para `dist/` e declarar o script de build, com o alvo do binário coincidindo com o declarado no manifesto.
  - [ ] **VERIFY**: `npm run build` conclui com código zero e o caso de build passa a GREEN.
  - [ ] **EVIDENCE**: Registrar comandos, tempos de build para o orçamento e arquivos gerados na seção 12.
  - [ ] **IMPROVE**: Registrar melhoria aplicada à configuração ou justificar ausência.

- [ ] T014 [CODE] [US-001] Implementar a leitura da versão em src/version.ts — Refs: US-001, FR-005, NFR-003, AC-004 — Depends: T005, T009, T011, T013
  - [ ] **PREP**: Confirmar RED em T005 e T009; reconstruir `docs/` com `$specsfy-documentator`.
  - [ ] **EXECUTE**: Ler a versão do manifesto e devolvê-la, sem imprimir, para que o valor seja testável sem capturar saída de terminal.
  - [ ] **VERIFY**: `npm run test:tdd` — o caso de versão passa a GREEN após o despacho de T016.
  - [ ] **EVIDENCE**: Registrar comando, resultado e arquivo na seção 12.
  - [ ] **IMPROVE**: Registrar melhoria aplicada ao módulo ou justificar ausência.

- [ ] T015 [CODE] [US-002] Implementar a verificação de dependências em src/doctor.ts — Refs: US-002, FR-004, FR-006, NFR-002, NFR-003, AC-005, AC-006 — Depends: T006, T007, T008, T013
  - [ ] **PREP**: Confirmar RED em T006 e T007; reconstruir `docs/` com `$specsfy-documentator`.
  - [ ] **EXECUTE**: Resolver cada dependência do projeto na ordem local e depois global — `node_modules` antes do PATH para as npm, ambiente virtual do projeto antes do PATH para a Python — e devolver um resultado por dependência com nome, camada, origem resolvida, versão e veredito. Receber o ambiente por parâmetro, para que o teste não dependa da máquina.
  - [ ] **VERIFY**: `npm run test:tdd` — os casos de ambiente aprovado e de dependência ausente passam a GREEN.
  - [ ] **EVIDENCE**: Registrar comando, os dois vereditos e o arquivo na seção 12.
  - [ ] **IMPROVE**: Registrar melhoria aplicada ao módulo ou justificar ausência.

#### Fase 4 — Superfície

- [ ] T016 [CODE] [US-001] [US-002] Implementar o despacho dos dois comandos em src/cli.ts — Refs: US-001, US-002, FR-005, FR-006, AC-008, AC-010 — Depends: T006, T009, T011, T014, T015
  - [ ] **PREP**: Confirmar RED em T009 e T011 e GREEN nos módulos de versão e verificação; reconstruir `docs/` com `$specsfy-documentator`.
  - [ ] **EXECUTE**: Interpretar o argumento, despachar para versão ou verificação, formatar a saída e definir o código de saída. Nenhuma lógica de verificação vive aqui.
  - [ ] **VERIFY**: `npm run build` seguido de `npm run test:tdd` — os casos de execução local e de limite do esqueleto passam a GREEN, e a suíte inteira fica verde.
  - [ ] **EVIDENCE**: Registrar comandos, suíte completa em GREEN e arquivos na seção 12.
  - [ ] **IMPROVE**: Registrar melhoria aplicada ao despacho ou justificar ausência.

#### Fase 5 — Contexto persistente e fechamento

- [ ] T017 [DOC] [US-001] Registrar a stack introduzida por esta fatia em .specsfy/STACK.md — Refs: US-001, FR-001, FR-003, AC-001, AC-003 — Depends: T012, T013, T016
  - [ ] **PREP**: Levantar o que a fatia de fato introduziu: TypeScript, ESM, Vitest, as três dependências fixadas e a exigência de `uv` para `code-review-graph`.
  - [ ] **EXECUTE**: Registrar cada tecnologia com sua evidência no repositório, sem apagar conteúdo humano preexistente.
  - [ ] **VERIFY**: O arquivo cita manifesto e configuração como evidência, e o monitor de contexto deixa de apontar pendência de stack.
  - [ ] **EVIDENCE**: Registrar o comando do monitor e seu resultado na seção 12.
  - [ ] **IMPROVE**: Registrar melhoria aplicada ao registro ou justificar ausência.

- [ ] T018 [DOC] [US-001] [US-002] Criar PROJECT.md descrevendo a finalidade e os limites do produto novo — Refs: US-001, US-002, FR-005, FR-006, AC-010 — Depends: T016
  - [ ] **PREP**: Confirmar que o arquivo não existe, e que a Phase 0 atribuiu a esta fase a tarefa de descrever o produto novo.
  - [ ] **EXECUTE**: Registrar história, finalidade, capacidades atuais e limites, deixando explícito que hoje existem apenas dois comandos e que setup, aprovação, detecção e seleção de modelo pertencem às fatias seguintes.
  - [ ] **VERIFY**: O conteúdo corresponde ao que a fatia entregou, sem prometer capacidade inexistente.
  - [ ] **EVIDENCE**: Registrar o caminho e a conferência contra a superfície real na seção 12.
  - [ ] **IMPROVE**: Registrar melhoria aplicada ao documento ou justificar ausência.

- [ ] T019 [TEST] [US-001] [US-002] Executar regressão e rastreabilidade pelos scripts declarados em package.json — Refs: US-001, US-002, FR-001, FR-002, FR-003, FR-004, FR-005, FR-006, NFR-001, NFR-002, NFR-003, AC-001, AC-002, AC-003, AC-004, AC-005, AC-006, AC-007, AC-008, AC-009, AC-010 — Depends: T016, T017, T018
  - [ ] **PREP**: Reunir os dez casos e confirmar que cada um esteve em RED antes da implementação correspondente.
  - [ ] **EXECUTE**: Executar `npm ci`, `npm run build` e `npm run test:tdd` a partir de um clone limpo, medindo cada etapa para o orçamento.
  - [ ] **VERIFY**: As três etapas concluem com código zero, a suíte fica verde e o auditor de rastreabilidade cobre os IDs da spec.
  - [ ] **EVIDENCE**: Registrar comandos, tempos, contagens e o resultado do auditor na seção 12.
  - [ ] **IMPROVE**: Registrar a retrospectiva da fatia, incluindo o que a suíte pegou e o que passou.

### 15. Ordem de execução

- Caminho crítico: T001 → T002 e T003 → T012 → T013 → T015 → T016 → T019.
- Tarefas paralelas: T002 a T011 executam em paralelo, porque cada uma escreve num arquivo distinto de `tests/` e nenhuma depende do resultado das outras.
- Barreira deliberada: T001 precede toda a fase de asserções. Sem runner instalado não há como observar RED, e sem RED observado não se escreve produção.
- Ordem interna da fundação: o manifesto precede o build, que precede os módulos, porque cada um resolve o alvo declarado pelo anterior. T016 vem por último na superfície, porque só ele torna a suíte inteira verde.
- Estratégia de MVP: a própria fatia já é o mínimo. Reduzi-la mais entregaria um pacote que instala e não executa, o que não prova chão firme nem exercita a premissa das dependências.

## Ato III — Entregar e validar

### 16. Dependências, riscos e suposições

#### Dependências

- Node maior ou igual a 20 e npm no ambiente de desenvolvimento.
- Registro npm acessível para instalar as três dependências fixadas.
- `uv` com `code-review-graph` instalado, para que `doctor` aprove. A ausência é caso de teste, não impedimento.

#### Riscos

- **Uma das versões fixadas sai do registro ou é despublicada** → a instalação quebra sem aviso. Mitigação: o lockfile é versionado, e `doctor` reporta divergência entre declarado e instalado.
- **ESM cria atrito com dependência que só ofereça CommonJS** → integração travada numa fatia posterior. Mitigação: as três dependências foram verificadas como ESM ou com binário próprio; a decisão está registrada como suposição reversível enquanto nenhuma fatia depender dela.
- **`doctor` passar a testar o ambiente em vez do código** → suíte verde numa máquina e vermelha noutra. Mitigação: ambiente injetado nos testes, conforme a seção 11.
- **Resolução cair na cópia global sem que ninguém perceba** → duas máquinas rodam versões diferentes achando que rodam a mesma. Mitigação: `doctor` sempre relata a origem resolvida, e divergência de versão reprova.
- **O esqueleto crescer além do escopo** → a fatia perde a função de provar chão firme depressa. Mitigação: AC-010 verifica que apenas dois comandos existem.
- **`code-review-graph` seguir fora do npm indefinidamente** → o modelo de três camadas se torna permanente. Aceito: a ponte `uv` explícita da fatia 1b resolve sem exigir que o pacote migre de ecossistema.

#### Suposições

Registradas na seção 13, todas reversíveis nesta fatia.

### 17. Decisões

- **DEC-001**: O pacote se chama `@brunocalmon/common-rules`, com binário `common-rules`. *Razão*: `common-rules` sem escopo está ocupado no npm por um pacote de expressões regulares sem atualização desde 2023. *Trade-off*: perde-se a forma curta do comando de instalação; o nome do comando não muda, porque o escopo restringe o pacote e não o binário.
- **DEC-002**: As dependências seguem três camadas, e as do projeto seguem uma única regra de resolução.

  *Camada 1, subsistema npm*: `@promovaweb/specsfy` e `context-mode`, declarados em versão exata. *Camada 2, subsistema Python*: `code-review-graph`, que não existe no npm e é instalado por `uv` num ambiente virtual do projeto. *Camada 3, backend de agente*: `pi`, `claude`, `cursor-agent`, `codex`, `agy`, `goose`, `dsh` e Ollama, detectados por capacidade, nunca instalados, e pertencentes à fatia 1d.

  *Regra de resolução das camadas 1 e 2*: preferir a cópia local do projeto; aceitar a global quando não houver local; nunca instalar no ambiente global. O `doctor` sempre relata qual origem resolveu, de modo que a diferença entre máquinas seja visível em vez de silenciosa.

  *Razão*: fixar versão só garante alguma coisa quando o binário executado é o do projeto. Ao mesmo tempo, o ambiente de destino é gerido por um playbook declarativo cuja regra é que nada se instala manualmente, e `uv tool install` escreve em `~/.local/share/uv/tools/`, fora do projeto. Preferir o local honra a fixação; aceitar o global evita baixar 262 MB de ambiente Python quando o playbook já proveu a ferramenta; nunca instalar global preserva a autoridade do playbook sobre o sistema.

  *Correção de uma versão anterior desta decisão*: `pi` estava na camada 1. Estava errado — `pi` é agente, não subsistema. Fixá-lo criaria uma segunda cópia enquanto o Orchestrator continuaria invocando o binário do PATH, pagando divergência sem ganhar reprodutibilidade.

  *Alternativa descartada*: `postinstall` instalando o que faltar. Escreveria no ambiente global durante um `npm install`, seria desligado por `--ignore-scripts` — flag que a própria documentação do `pi` recomenda —, quebraria CI sem `uv` e faria este projeto ditar a versão de uma ferramenta global usada por outros trabalhos. A ponte `uv` permanece, movida para invocação explícita na fatia 1b.
- **DEC-003**: O runner é Vitest, exposto por `test:tdd`. *Razão*: recomendação do contrato do framework, TypeScript nativo e o script que o enforcement exige em projeto Node.
- **DEC-004**: A Phase 1 foi fatiada em 1a a 1e, e esta fatia entrega apenas o esqueleto. *Razão*: as seis entregas do backlog são cada uma comparável à Phase 0, que rendeu 14 tarefas sendo uma única coisa estreita; uma spec única produziria gates que não se sustentariam honestamente.
- **DEC-005**: A verificação de dependências é comando, não documento. *Razão*: a Phase 0 encontrou uma premissa falsa que estava escrita como verdade em três lugares. Premissa exercitada por comando falha alto e cedo.

### 18. Definition of Done

- [ ] `Definition Gate` está `Passed`.
- [ ] `Plan Gate` está `Passed`.
- [ ] `Delivery Gate` está `Passed`.
- [ ] Todos os cenários `AC` aplicáveis passam.
- [ ] Todos os requisitos possuem evidência de verificação registrada na seção 12.
- [ ] Todas as tarefas da seção 14 estão concluídas.
- [ ] `npm ci`, `npm run build` e `npm run test:tdd` concluem com código zero a partir de clone limpo.
- [ ] `common-rules doctor` aprova o ambiente completo e reprova nomeando a ausente quando `code-review-graph` sai do PATH.
- [ ] `.specsfy/STACK.md` registra a stack introduzida por esta fatia: TypeScript, ESM, Vitest e as três dependências fixadas.
- [ ] `PROJECT.md` é criado ou revisado, porque esta fatia introduz o produto novo no repositório.
