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

Há um segundo problema, menos visível e mais caro. O plano inteiro da v1.0 se apoia em quatro ferramentas tratadas como dependências fixadas, e essa premissa nunca foi exercitada neste repositório. A verificação de 2026-08-24 já mostrou que três dos quatro nomes registrados no backlog estavam errados: `specsfy` é `@promovaweb/specsfy`, `pi.dev` é `@earendil-works/pi-coding-agent`, e `code-review-graph` sequer é um pacote npm — é Python instalado por `uv`. Construir setup, orquestração e seleção de modelo sobre uma premissa não exercitada repetiria o erro que a Phase 0 encontrou no `.gitignore`, quando o conjunto que a fase prometia preservar não existia em git.

#### Resultado desejado

Um pacote mínimo que instala, compila, testa e executa, e que prova de forma executável que as quatro dependências são alcançáveis.

Ao fim desta fatia, `npm install` seguido de `npm run build` produz um binário `common-rules` que responde `--version`, e `common-rules doctor` reporta cada uma das quatro dependências, saindo com código diferente de zero quando alguma faltar. Nada além disso: sem setup, sem orquestração, sem aprovação, sem seleção de modelo.

O valor não é o comando `--version`. É ter chão firme e a premissa das dependências exercitada antes que qualquer capacidade se apoie nela.

#### Métricas de sucesso

- `npm ci` a partir de um clone limpo conclui sem erro.
- `npm run build` produz um ponto de entrada executável em `dist/`.
- `npm run test:tdd` executa a suíte Vitest e passa.
- `common-rules --version` imprime exatamente a versão declarada no manifesto.
- `common-rules doctor` reporta as quatro dependências e sai com zero quando todas estão presentes.
- `common-rules doctor` sai com código diferente de zero, nomeando a ausente, quando `code-review-graph` não está no PATH.
- As três dependências npm estão fixadas em versão exata, sem faixa.

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
- As três dependências npm declaradas em versão exata: `@promovaweb/specsfy`, `context-mode` e `@earendil-works/pi-coding-agent`.
- Comando `common-rules --version`, que imprime a versão do manifesto.
- Comando `common-rules doctor`, que reporta o alcance das quatro dependências e sai com código diferente de zero quando alguma falta.
- `.gitignore` para o projeto Node, removido pela Phase 0 e necessário antes da primeira instalação.

#### Fora de escopo

- `setup`, em qualquer forma, CLI ou MCP. É a fatia 1b.
- Approval workflow. É a fatia 1c.
- Detecção de backends de agente além das quatro dependências, e a lista de backends suportados. É a fatia 1d.
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

#### US-002 — Saber se o ambiente alcança as quatro dependências

Como **pessoa que desenvolve a v1.0**, quero **um comando que reporte o alcance de cada dependência**, para **descobrir uma ausência agora, e não no meio da orquestração**.

**Por que P1**: A Phase 0 mostrou o custo de construir sobre premissa não exercitada. Esta é a menor prova executável de que o plano se sustenta.
**Teste independente**: `common-rules doctor` lista as quatro dependências com veredito individual, sai com zero num ambiente completo e com código diferente de zero nomeando a ausente quando `code-review-graph` não está no PATH.
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
    And as três dependências npm aparecem em node_modules nas versões exatas declaradas
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
    Given as três dependências npm instaladas
    And code-review-graph alcançável no PATH
    When a pessoa executa o comando doctor
    Then a saída lista as quatro dependências com veredito individual
    And cada dependência npm aparece com a versão encontrada
    And o comando sai com código zero
```

#### AC-006 — `doctor` reprova nomeando a ausente

**Cobre**: US-002, FR-006, FR-004

```gherkin
@US-002 @FR-006 @FR-004 @AC-006
Feature: Ausência de dependência

  Scenario: code-review-graph indisponível reprova a verificação
    Given as três dependências npm instaladas
    And code-review-graph ausente do PATH
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
    And as três dependências npm são resolvidas de node_modules
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
- **FR-004**: O projeto deve declarar as três dependências npm em versão exata, sem faixa.
- **FR-005**: O binário deve imprimir a versão declarada no manifesto quando invocado com o argumento de versão, saindo com zero.
- **FR-006**: O binário deve reportar, no comando `doctor`, o alcance de cada uma das quatro dependências, saindo com zero quando todas estão presentes e com código diferente de zero quando alguma falta, nomeando-a.

#### Não funcionais

- **NFR-001**: **Tempo do ciclo**. Instalação com cache frio, build e suíte concluem em menos de cinco minutos somados. **Verificação**: medição do tempo decorrido das três etapas, registrada na seção 12.
- **NFR-002**: **Reprodutibilidade**. Nenhuma dependência declarada aceita faixa de versão, de modo que duas máquinas instalem o mesmo conteúdo. **Verificação**: inspeção programática do manifesto, falhando ao encontrar prefixo de intervalo.
- **NFR-003**: **Isolamento**. O pacote executa a partir do projeto, sem exigir instalação global de si mesmo nem das dependências npm. **Verificação**: execução do binário pelo caminho local em clone limpo.

#### Erros e casos-limite

- `code-review-graph` ausente do PATH → `doctor` reprova nomeando a ferramenta e explicando que vem de `uv`, não do npm. Não tentar instalar.
- Dependência npm ausente de `node_modules` → `doctor` reprova nomeando o pacote e orientando a instalação local. Não instalar por conta própria.
- Versão instalada divergente da declarada → `doctor` reporta ambas e reprova, porque divergência silenciosa é o problema que a fixação existe para evitar.
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
| Verificação de dependências | Resolver as três npm e sondar `code-review-graph` no PATH | `src/doctor.ts` |

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
- As versões fixadas são as verificadas em 2026-08-24: `@promovaweb/specsfy` 0.10.2, `context-mode` 1.0.169 e `@earendil-works/pi-coding-agent` 0.84.3.
- `uv` e `code-review-graph` são pré-requisitos do ambiente. Esta fatia verifica alcance e nunca instala.

#### Decisões abertas

Nenhuma que bloqueie esta fatia.

### 14. Tarefas

A seção é preenchida por `$specsfy-05-tasks` depois do Definition Gate.

### 15. Ordem de execução

Definida junto das tarefas, depois do Definition Gate.

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
- **O esqueleto crescer além do escopo** → a fatia perde a função de provar chão firme depressa. Mitigação: AC-010 verifica que apenas dois comandos existem.
- **`code-review-graph` seguir fora do npm indefinidamente** → o modelo de duas classes se torna permanente. Aceito: a decisão registrada admite a exigência de `uv` no setup, na fatia 1b.

#### Suposições

Registradas na seção 13, todas reversíveis nesta fatia.

### 17. Decisões

- **DEC-001**: O pacote se chama `@brunocalmon/common-rules`, com binário `common-rules`. *Razão*: `common-rules` sem escopo está ocupado no npm por um pacote de expressões regulares sem atualização desde 2023. *Trade-off*: perde-se a forma curta do comando de instalação; o nome do comando não muda, porque o escopo restringe o pacote e não o binário.
- **DEC-002**: As dependências seguem duas classes. npm fixa `@promovaweb/specsfy`, `context-mode` e `@earendil-works/pi-coding-agent`; `code-review-graph` é exigido do ambiente e verificado. *Razão*: `code-review-graph` é Python instalado por `uv` e não existe no npm, de modo que a premissa original do backlog era irrealizável. *Alternativa*: tratar tudo como CLI externa detectada — descartada por abrir mão da reprodutibilidade onde ela é possível.
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
