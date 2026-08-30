# Especificação integrada: Fatia 1e: seleção de modelo pelo Orchestrator

| Campo | Valor |
| --- | --- |
| Formato | Specsfy/2.0 |
| ID | SPEC-0009 |
| Slug | 0009-fatia-1e-selecao-de-modelo |
| Status | Defined |
| Effort | 3 |
| Effort updated at | 2026-08-30 |
| Effort rationale | Comparável à 1d: presença e leitura local, sem subprocesso caro nem rede. O custo está no cálculo de capacidade (memória livre vs. tamanho de modelo) e no contrato de override, não na integração em si. |
| ClickUp Task | |
| Milestones | |
| Definition Gate | Passed |
| Plan Gate | Pending |
| Delivery Gate | Pending |
| Evidence Contract | 1 |
| Interface para pessoas | Não — a entrega é um módulo reutilizável e um comando de terminal novo, em texto, sem tela. |
| Atualizada em | 2026-08-30 |

## Ato I — Definir

### 1. Problema e resultado

#### Problema

A fatia 1d sabe dizer quais backends de agente são acionáveis por subprocesso. Nenhum código deste projeto sabe, hoje, **qual** deles usar, nem se algum modelo local do `ollama` cabe na máquina antes de tentar carregá-lo. Quem quiser orquestrar precisa decidir isso à mão, olhando `ollama list` e a memória livre por conta própria.

A ideia original desta fatia pedia "análise completa": modelos disponíveis por backend, custo, uso do plano Claude, capacidade da máquina, recomendação e override humano. Investigado antes de especificar: nenhum dos cinco backends suportados (`pi`, `agy`, `claude`, `codex`, `goose`) expõe lista de modelo, custo ou uso de plano sem autenticação — `agy models`, executado de verdade, pediu login antes de mostrar qualquer coisa; os demais declaram `--model` como texto livre, nunca uma lista fechada. Perseguir a "análise completa" original quebraria a regra que este projeto manteve em toda fatia anterior: nenhuma chamada de rede, nenhum prompt de autenticação (`DEC-002`; a mesma garantia sem rede da fatia 1d).

#### Resultado desejado

Um módulo recomenda, sem rede e sem autenticação: qual backend suportado usar (dentre os presentes, fatia 1d) e, quando o `ollama` estiver presente com modelo cujo tamanho caiba na memória livre da máquina, qual modelo local usar. A pessoa pode informar sua própria escolha de backend e/ou modelo local, e o relato passa a refletir essa escolha em vez de recalcular.

`common-rules recommend` imprime esse relatório. Custo e uso de plano ficam de fora, com a ausência dita em voz alta — não fingida como calculada.

#### Métricas de sucesso

- Com pelo menos um backend suportado presente, a recomendação nomeia um deles, sempre um dos presentes.
- Sem backend suportado presente, a recomendação diz isso, sem lançar exceção nem recomendar um nome inventado.
- Com `ollama` presente e ao menos um modelo cujo tamanho caiba na memória livre, a recomendação nomeia o maior que cabe.
- Sem `ollama`, ou sem modelo que caiba, a recomendação diz isso, sem escolher um modelo que não caberia.
- Uma escolha humana explícita de backend e/ou modelo local é respeitada e relatada como override, sem ser recalculada.
- Nenhuma chamada de rede nem prompt de autenticação ocorre em ponto algum do módulo ou do comando.
- O relato declara, em voz alta, que custo e uso de plano não entram no cálculo.

### 2. Research e esclarecimentos

#### Researchs executados

- **R-033** [critical] `ollama list` enumera modelos locais sem rede nem autenticação, em formato tabular estável (`NAME`, `ID`, `SIZE`, `MODIFIED`) — Verdict: verified — Confidence: high — Evidence: research/modelos/analise-completa-exige-rede.md#o-que-é-local-e-real — Budget: 1/2.
- **R-034** [critical] Nenhum dos cinco backends suportados expõe modelo, custo ou uso de plano sem autenticação; `agy models` pede login por execução real, e os demais tratam `--model` como texto livre, não lista fechada — Verdict: verified — Confidence: high — Evidence: research/modelos/analise-completa-exige-rede.md#o-que-exige-redeautenticação-verificado-por-execução-real — Budget: 2/2.
- **R-035** [high] `os.totalmem()`/`os.freemem()` do Node dão capacidade de memória sem subprocesso nem rede — Verdict: verified — Confidence: high — Evidence: research/modelos/analise-completa-exige-rede.md#o-que-é-local-e-real — Budget: 1/1.

#### Fontes e contexto consultados

- `specs/backlog/0003-phase-1-mvp-typescript-subsistemas.md`, pela `D4` e sua correção nesta data.
- `specs/completed/0008-fatia-1d-deteccao-backends/spec.md`, pela lista suportada (`SUPPORTED_AGENT_BACKENDS`) que esta fatia consome, e pela decisão de que `ollama` fica fora da detecção de backend de agente.
- `ollama list`, `ollama --help`, e `--help`/`models` dos cinco backends suportados, executados de verdade nesta máquina em 2026-08-30.

#### Documentação consultada

Nenhuma documentação externa publicada; evidência vem de execução real dos próprios binários e da API nativa do Node, capturadas em `research/`.

#### Artefatos de pesquisa armazenados

- `specs/defined/0009-fatia-1e-selecao-de-modelo/research/modelos/analise-completa-exige-rede.md` — o que é local e real, o que exige rede/autenticação, e a consequência para o escopo.

#### Dúvidas respondidas

- **Q**: A recomendação inclui custo e uso do plano Claude, como a ideia original pedia? → **A**: Não. Nenhum backend suportado expõe isso sem rede e autenticação — verificado por execução real, não suposto. Perseguir isso quebraria a regra sem rede que o projeto mantém desde a `DEC-002`. O relato declara essa ausência, em vez de fingir um cálculo que não existe.
- **Q**: A recomendação escolhe modelo de nuvem dentro de um backend (ex.: qual modelo do `claude`)? → **A**: Não. `--model` de todos os cinco é texto livre, sem lista fechada consultável sem autenticação; escolher modelo de nuvem permanece com o próprio backend e com quem o configura. Esta fatia recomenda **backend**, e recomenda **modelo local** só quando o `ollama` está envolvido.
- **Q**: `ollama` entra na lista de backends suportados da fatia 1d? → **A**: Não — decisão já registrada lá. Esta fatia detecta `ollama` por conta própria, com objetivo diferente: inventariar modelo local, não decidir se é um backend de agente acionável.
- **Q**: O que "capacidade da máquina" considera? → **A**: Memória, via `os.totalmem()`/`os.freemem()`. CPU e GPU ficam fora: não há sinal local confiável e comparável entre modelos sem rodar cada um, o que contradiria "sem chamada cara" do mesmo jeito que rede contradiria "sem rede".

#### Dúvidas abertas

Nenhuma que bloqueie esta fatia.

### 3. Escopo e atores

#### Incluído

- Um módulo que detecta modelos locais do `ollama` (presença e `ollama list`), com fonte injetável.
- Um módulo que lê a capacidade de memória da máquina (`os.totalmem`/`os.freemem`), com fonte injetável.
- Uma função de recomendação que combina os backends suportados presentes (fatia 1d), os modelos locais e a capacidade, e devolve backend recomendado e, quando aplicável, modelo local recomendado.
- Aceitação de override humano explícito de backend e/ou modelo local, usado no lugar do cálculo.
- `common-rules recommend`, novo comando de terminal, que imprime o relatório.

#### Fora de escopo

- Custo e uso de plano de qualquer backend — sem fonte local sem rede/autenticação; registrado como limitação assumida, não pendência silenciosa.
- Escolha de modelo de nuvem dentro de um backend — permanece com o próprio backend.
- Executar, orquestrar ou despachar qualquer comando para o backend ou modelo recomendado — esta fatia produz recomendação, não execução.
- Persistir a recomendação em disco — recalculada a cada chamada, no mesmo padrão de `doctor`.
- CPU e GPU como fator de capacidade.
- Aprovação da recomendação pelo mecanismo de `SetupOptions.approval` (SPEC-0007) — não há escrita a aprovar aqui; a "aprovação de modelo" da captura original é o próprio override humano, que este comando já aceita.

#### Atores

- **Quem usa o `common-rules`**: roda `recommend` e recebe um backend e, quando aplicável, um modelo local a considerar, ou informa a própria escolha.
- **Quem constrói o Orchestrator (fora desta fatia)**: importa `recommend()` diretamente, sem passar pelo comando de terminal.
- **A fatia 1d**: fornece a lista de backends suportados presentes, consumida sem duplicação.

### 4. Princípios e restrições do projeto

- **PR-034**: Sem chamada de rede, sem prompt de autenticação, em ponto algum do módulo — o mesmo princípio que a garantia sem rede da fatia 1d já aplicou aos backends.
- **PR-035**: Nenhum dado de custo ou preço fica chumbado no código — se não há fonte local confiável, o relato declara a ausência em vez de inventar um número.
- **PR-036**: Override humano nunca é recalculado nem validado contra a recomendação — é a decisão de quem usa, registrada como tal.
- **PR-037**: Toda fonte de resolução externa ao processo é injetável, no mesmo padrão do `Environment` de `doctor` e do `BackendEnvironment` da fatia 1d.

### 5. Histórias de usuário

#### US-033 — Saber qual backend e qual modelo local usar (P1)

Como **quem usa o `common-rules`**, quero **que um comando recomende backend e, quando aplicável, modelo local**, para **decidir com que rodar o Orchestrator sem sondar `ollama list` e memória livre à mão**.

**Por que P1**: É a razão da fatia — sem ela, a fatia 1d fica sem consumidor, e a decisão de backend/modelo continua manual.
**Teste independente**: Com um backend suportado presente e um modelo do `ollama` que cabe na memória livre, `recommend` nomeia os dois.
**Requisitos**: FR-034, FR-035, FR-037

#### US-034 — Informar minha própria escolha (P1)

Como **quem usa o `common-rules`**, quero **poder informar backend e/ou modelo local**, para **que a ferramenta respeite minha decisão em vez de recalcular**.

**Por que P1**: É a "aprovação de modelo" que a captura original nomeia — sem override, a recomendação seria automática demais para a garantia que a captura promete.
**Teste independente**: Informado um backend específico, o relato nomeia exatamente esse backend, marcado como escolha da pessoa, mesmo que outro fosse o calculado.
**Requisitos**: FR-036

#### US-035 — Módulo reutilizável e testável sem rede nem máquina real (P1)

Como **quem constrói o Orchestrator**, quero **um módulo de recomendação com fontes injetáveis**, para **testar a lógica de escolha sobre qualquer combinação de backends, modelos e memória, sem depender da máquina onde a suíte roda**.

**Por que P1**: Mesmo requisito que já vale para `TargetEnvironment`, `Environment` de `doctor` e `BackendEnvironment` da fatia 1d.
**Teste independente**: Um caso injeta memória livre pequena e um modelo grande, e confere que a recomendação diz que nada coube, sem tocar a máquina real.
**Requisitos**: FR-034, FR-035, NFR-033, NFR-034

### 6. Cenários BDD de aceite

#### AC-090 — Backend suportado presente é recomendado

**Cobre**: US-033, FR-034

```gherkin
@US-033 @FR-034 @AC-090
Feature: Recomendação de backend

  Scenario: Ao menos um backend suportado está presente
    Given uma fonte em que pi está presente e os demais suportados ausentes
    When a recomendação é calculada
    Then o backend recomendado é pi
```

#### AC-091 — Nenhum backend presente é comunicado, não inventado

**Cobre**: US-033, FR-034

```gherkin
@US-033 @FR-034 @AC-091
Feature: Ausência de backend

  Scenario: Nenhum backend suportado está presente
    Given uma fonte em que nenhum backend suportado está presente
    When a recomendação é calculada
    Then o backend recomendado é nulo
    And o relato diz que nenhum backend suportado foi encontrado
```

#### AC-092 — Maior modelo local que cabe na memória livre é recomendado

**Cobre**: US-033, FR-035

```gherkin
@US-033 @FR-035 @AC-092
Feature: Recomendação de modelo local

  Scenario: Memória livre comporta o maior dos modelos presentes
    Given ollama presente com modelos de 2GB e de 9GB, e 10GB de memória livre
    When a recomendação é calculada
    Then o modelo local recomendado é o de 9GB
```

#### AC-093 — Nenhum modelo local cabe é comunicado, não escolhido às cegas

**Cobre**: US-033, FR-035

```gherkin
@US-033 @FR-035 @AC-093
Feature: Nenhum modelo cabe

  Scenario: Memória livre menor que qualquer modelo presente
    Given ollama presente com um modelo de 9GB, e 2GB de memória livre
    When a recomendação é calculada
    Then o modelo local recomendado é nulo
    And o relato diz que nenhum modelo local coube na memória livre
```

#### AC-094 — ollama ausente é comunicado

**Cobre**: US-033, FR-035

```gherkin
@US-033 @FR-035 @AC-094
Feature: ollama ausente

  Scenario: ollama não está no PATH
    Given uma fonte em que ollama está ausente
    When a recomendação é calculada
    Then o modelo local recomendado é nulo
    And o relato diz que ollama não foi encontrado
```

#### AC-095 — Override de backend é respeitado, não recalculado

**Cobre**: US-034, FR-036

```gherkin
@US-034 @FR-036 @AC-095
Feature: Override de backend

  Scenario: A pessoa informa um backend específico
    Given uma fonte em que pi e claude estão presentes
    And a pessoa informa claude como escolha
    When a recomendação é calculada
    Then o backend recomendado é claude
    And o relato marca a escolha como override, não como cálculo
```

#### AC-096 — Override de modelo local é respeitado, não recalculado

**Cobre**: US-034, FR-036

```gherkin
@US-034 @FR-036 @AC-096
Feature: Override de modelo local

  Scenario: A pessoa informa um modelo local específico, mesmo que não caiba
    Given ollama presente com um modelo de 9GB, e 2GB de memória livre
    And a pessoa informa esse modelo de 9GB como escolha
    When a recomendação é calculada
    Then o modelo local recomendado é o informado
    And o relato marca a escolha como override, sem impedir por causa da memória
```

#### AC-097 — O comando real imprime o relatório completo

**Cobre**: US-033, FR-037, NFR-035

```gherkin
@US-033 @FR-037 @NFR-035 @AC-097
Feature: Comando real de recomendação

  Scenario: common-rules recommend roda de verdade nesta máquina
    Given a máquina real, sem override informado
    When common-rules recommend roda
    Then o texto nomeia o backend recomendado ou a ausência
    And o texto nomeia o modelo local recomendado ou a ausência
    And o texto declara que custo e uso de plano não entram no cálculo
```

#### AC-098 — O módulo aceita fontes injetadas, sem tocar rede nem máquina real

**Cobre**: US-035, NFR-033, NFR-034

```gherkin
@US-035 @NFR-033 @NFR-034 @AC-098
Feature: Fontes injetáveis

  Scenario: Memória e modelos vêm de fontes fake
    Given uma fonte de memória fake e uma fonte de modelos ollama fake
    When a recomendação é calculada com essas fontes
    Then o resultado reflete exatamente o que as fontes fake decidiram
    And nada no módulo consulta rede nem a máquina real
```

#### AC-099 — Paridade entre a fonte real e a máquina

**Cobre**: US-035, NFR-034

```gherkin
@US-035 @NFR-034 @AC-099
Feature: Paridade da fonte real

  Scenario: A fonte real resolve o que de fato está instalado e disponível
    Given a fonte real de memória e de modelos ollama, sem injeção
    When a recomendação é calculada sobre esta máquina
    Then a memória usada corresponde a os.freemem() e os.totalmem()
    And os modelos locais correspondem à saída real de "ollama list"
```

#### AC-100 — Override parcial combina escolha humana com cálculo do restante

**Cobre**: US-034, FR-034, FR-036

```gherkin
@US-034 @FR-034 @FR-036 @AC-100
Feature: Override parcial

  Scenario: Só o backend é informado; o modelo local segue calculado
    Given uma fonte em que pi e claude estão presentes, e ollama com um modelo que cabe na memória livre
    And a pessoa informa claude como escolha de backend, sem informar modelo local
    When a recomendação é calculada
    Then o backend recomendado é claude, marcado como override
    And o modelo local recomendado é o calculado, não marcado como override
```

#### AC-101 — O comando real não faz chamada de rede nem trava esperando credencial

**Cobre**: US-035, FR-037, NFR-033, NFR-035

```gherkin
@US-035 @FR-037 @NFR-033 @NFR-035 @AC-101
Feature: Execução real sem rede

  Scenario: common-rules recommend termina sozinho, sem prompt
    Given a máquina real, sem override informado
    When common-rules recommend roda, com um tempo limite curto
    Then o comando termina sozinho, sem esperar entrada nem credencial
    And o texto declara que custo e uso de plano não entram no cálculo
```

#### AC-102 — Nenhuma variável de ambiente de credencial é lida durante o cálculo

**Cobre**: FR-037, NFR-033, NFR-034, NFR-035

```gherkin
@FR-037 @NFR-033 @NFR-034 @NFR-035 @AC-102
Feature: Nenhuma leitura de credencial

  Scenario: O cálculo não depende de variável de ambiente de API
    Given um ambiente sem nenhuma variável de credencial de backend definida
    When a recomendação é calculada, com fontes injetadas
    Then o resultado não muda em função da ausência dessas variáveis
    And nenhuma exceção é lançada
```

### 7. Requisitos

#### Funcionais

- **FR-034**: O sistema deve recomendar um backend dentre os suportados presentes (fatia 1d), determinístico pela ordem declarada em `SUPPORTED_AGENT_BACKENDS`, e comunicar quando nenhum estiver presente, sem inventar um nome.
- **FR-035**: O sistema deve recomendar, entre os modelos locais do `ollama`, o maior cujo tamanho caiba na memória livre da máquina, e comunicar quando `ollama` estiver ausente ou nenhum modelo couber, sem escolher um que não caiba.
- **FR-036**: O sistema deve aceitar uma escolha humana explícita de backend e/ou de modelo local, usá-la no lugar do cálculo correspondente, e relatar que houve override, sem revalidar a escolha contra presença ou capacidade.
- **FR-037**: `common-rules recommend` deve imprimir o relatório da recomendação, incluindo a memória usada no cálculo e a declaração de que custo e uso de plano não entram nele.

#### Não funcionais

- **NFR-033**: **Sem rede, sem autenticação**. Nenhuma chamada de rede nem prompt de autenticação ocorre em ponto algum do módulo ou do comando. **Verificação**: inspeção do código, confirmando que só `os.totalmem`/`os.freemem` e `which`/`ollama list` locais são usados, e execução real sem qualquer prompt.
- **NFR-034**: **Determinismo**. Nenhum caso de unidade ou integração depende do que está de fato na máquina onde a suíte roda — as fontes de memória e de modelos são sempre injetadas; um único caso de paridade confere a fonte real contra a máquina.
- **NFR-035**: **Limitação declarada**. O relato afirma explicitamente que custo e uso de plano não entram no cálculo, em vez de silenciar a ausência. **Verificação**: inspeção do texto do relatório real.

#### Erros e casos-limite

- `ollama` presente, mas `ollama list` devolve saída vazia (nenhum modelo baixado) → modelo local recomendado nulo, mesmo tratamento de "nenhum coube".
- `ollama` presente, mas `ollama list` termina com erro (serviço não respondeu) → mesmo tratamento de ausência, sem lançar exceção.
- Override de backend informado para um nome fora da lista suportada → aceito e relatado como override; `PR-036` decide não revalidar, e um nome desconhecido é problema de quem informou, não motivo para o comando recusar silenciosamente uma decisão humana.
- Memória livre exatamente igual ao tamanho do modelo → cabe (`<=`, não `<`).
- Dois modelos locais do mesmo tamanho, ambos cabendo → qualquer um dos dois é aceitável, desde que a escolha seja determinística entre execuções com a mesma fonte (mesma ordem de `ollama list`).

## Ato II — Projetar e provar

### 8. Plano técnico

#### Contexto existente

- `src/backends/known.ts`/`detect.ts` (fatia 1d) expõem `SUPPORTED_AGENT_BACKENDS` e `detectBackends`, reaproveitados sem duplicação.
- `src/doctor.ts` estabelece o padrão de `Environment` injetável com implementação real padrão via parâmetro opcional.
- A suíte tem 109 arquivos e 324 casos.

#### Arquitetura e módulos

| Módulo | Responsabilidade | Arquivo |
| --- | --- | --- |
| Modelos locais | Detecta presença do `ollama` e lista modelos locais, com fonte injetável | `src/models/ollama.ts` |
| Capacidade | Lê memória total/livre, com fonte injetável | `src/models/capacity.ts` |
| Recomendação | Combina backends (fatia 1d), modelos locais e capacidade; aceita override | `src/models/recommend.ts` |

Três módulos porque cada fonte externa (backend, `ollama`, memória) tem seu próprio ponto de injeção, no mesmo padrão já estabelecido: a lógica de decisão (`recommend.ts`) não sabe resolver nada sozinha, só combina o que cada fonte devolve.

#### Migrations

Não aplicável.

#### Models

```ts
interface OllamaModel { name: string; sizeBytes: number }
interface Capacity { totalBytes: number; freeBytes: number }
interface RecommendOverride { backend?: string; localModel?: string }
interface Recommendation {
  backend: string | null;
  backendOverridden: boolean;
  localModel: string | null;
  localModelOverridden: boolean;
  freeBytesConsidered: number;
  report: string;
}
```

#### Controllers e casos de uso

`recommend(backends: BackendResult[], models: OllamaModel[], capacity: Capacity, override?: RecommendOverride): Recommendation` é uma função pura, sem I/O — quem chama já resolveu `detectBackends`, `listOllamaModels` e `readCapacity` antes. `common-rules recommend`, em `src/cli.ts`, resolve as três fontes reais, aceita `--backend <nome>` e `--local-model <nome>` como override, e imprime `recommendation.report`.

#### Views e experiência

Não aplicável. A seção 10 registra a ausência de interface.

#### Queries e repositórios

Não aplicável.

#### Jobs e processamento assíncrono

Síncrono, como as fatias anteriores.

#### Estrutura de arquivos

```text
src/models/
  ollama.ts
  capacity.ts
  recommend.ts
src/cli.ts        (alterado — novo comando recommend)
tests/
  models-fixtures.ts
  models-backend-recomendado.test.ts
  models-backend-ausente.test.ts
  models-local-recomendado.test.ts
  models-local-nao-cabe.test.ts
  models-ollama-ausente.test.ts
  models-override-backend.test.ts
  models-override-local.test.ts
  models-recommend-real.test.ts
  models-injetavel.test.ts
  models-paridade-real.test.ts
  models-override-parcial.test.ts
  models-sem-credencial.test.ts
specs/defined/0009-fatia-1e-selecao-de-modelo/
  spec.md
  research/
    modelos/
      analise-completa-exige-rede.md
```

### 9. Modelo de dados

Não aplicável. Nada é persistido: a recomendação é recalculada a cada chamada, no mesmo padrão de `doctor` e da fatia 1d — não há registro, cache nem arquivo `.env` (`DEC-006`, SPEC-0003).

### 10. Interfaces e contratos

#### Interface para pessoas

**Não há interface para pessoas.** A entrega é um módulo e um comando de terminal, em texto, sem tela.

#### APIs expostas

Nenhuma.

#### APIs externas utilizadas

Nenhuma chamada de rede. `ollama list`, subprocesso local; `os.totalmem`/`os.freemem`, API nativa do Node.

#### Documentação das APIs consultadas

Não aplicável — evidência vem de execução real, registrada em `research/`.

#### Eventos e outros contratos

Não aplicável.

### 11. Estratégia TDD

- **Unidade**: `recommend()` com backends, modelos e capacidade fake, cobrindo presente/ausente, cabe/não cabe, e os dois overrides.
- **Integração**: `common-rules recommend` real, conferindo o texto do relatório.
- **Paridade**: um caso confere a fonte real de memória e de `ollama list` contra a máquina, no mesmo padrão da fatia 1d.
- **Runner**: Vitest, pelo script `test:tdd`.
- **Verificação manual**: `node dist/cli.js recommend` executado de verdade nesta máquina.

O ponto sensível é a tentação de tratar ausência de capacidade como erro. `AC-091`, `AC-093` e `AC-094` existem para que "nada recomendável" produza um relato claro, nunca uma exceção nem uma escolha inventada — o mesmo princípio que a camada `agent` do `doctor` já aplica.

#### Evidência RED-GREEN-REFACTOR

| IDs | BDD de referência | Teste TDD informado pelo BDD | RED observado | GREEN observado | Refactor/regressão |
| --- | --- | --- | --- | --- | --- |
| US-033, FR-034, AC-090 | AC-090 na seção 6 | tests/models-backend-recomendado.test.ts | Pending | Pending | Pending |
| US-033, FR-034, AC-091 | AC-091 na seção 6 | tests/models-backend-ausente.test.ts | Pending | Pending | Pending |
| US-033, FR-035, AC-092 | AC-092 na seção 6 | tests/models-local-recomendado.test.ts | Pending | Pending | Pending |
| US-033, FR-035, AC-093 | AC-093 na seção 6 | tests/models-local-nao-cabe.test.ts | Pending | Pending | Pending |
| US-033, FR-035, AC-094 | AC-094 na seção 6 | tests/models-ollama-ausente.test.ts | Pending | Pending | Pending |
| US-034, FR-036, AC-095 | AC-095 na seção 6 | tests/models-override-backend.test.ts | Pending | Pending | Pending |
| US-034, FR-036, AC-096 | AC-096 na seção 6 | tests/models-override-local.test.ts | Pending | Pending | Pending |
| US-033, FR-037, AC-097 | AC-097 na seção 6 | tests/models-recommend-real.test.ts | Pending | Pending | Pending |
| US-035, NFR-033/034, AC-098 | AC-098 na seção 6 | tests/models-injetavel.test.ts | Pending | Pending | Pending |
| US-035, NFR-034, AC-099 | AC-099 na seção 6 | tests/models-paridade-real.test.ts | Pending | Pending | Pending |

### 12. Plano de testes e rastreabilidade

| Requisito | Cenário BDD | Nível | Arquivo/comando esperado | Evidência |
| --- | --- | --- | --- | --- |
| FR-034 | AC-090 | Unidade | tests/models-backend-recomendado.test.ts | Pending |
| FR-034 | AC-091 | Unidade | tests/models-backend-ausente.test.ts | Pending |
| FR-034 | AC-095 | Unidade | tests/models-override-backend.test.ts | Pending |
| FR-035 | AC-092 | Unidade | tests/models-local-recomendado.test.ts | Pending |
| FR-035 | AC-093 | Unidade | tests/models-local-nao-cabe.test.ts | Pending |
| FR-035 | AC-094 | Unidade | tests/models-ollama-ausente.test.ts | Pending |
| FR-036 | AC-095 | Unidade | tests/models-override-backend.test.ts | Pending |
| FR-036 | AC-096 | Unidade | tests/models-override-local.test.ts | Pending |
| FR-037 | AC-097 | Integração | tests/models-recommend-real.test.ts | Pending |
| NFR-033 | AC-098 | Unidade | tests/models-injetavel.test.ts | Pending |
| NFR-033 | AC-097 | Integração | tests/models-recommend-real.test.ts | Pending |
| NFR-034 | AC-098 | Unidade | tests/models-injetavel.test.ts | Pending |
| NFR-034 | AC-099 | Paridade | tests/models-paridade-real.test.ts | Pending |
| NFR-034 | AC-102 | Unidade | tests/models-sem-credencial.test.ts | Pending |
| NFR-035 | AC-097 | Integração | tests/models-recommend-real.test.ts | Pending |
| NFR-035 | AC-101 | Integração | tests/models-recommend-real.test.ts | Pending |
| NFR-035 | AC-102 | Unidade | tests/models-sem-credencial.test.ts | Pending |
| FR-034 | AC-100 | Unidade | tests/models-override-parcial.test.ts | Pending |
| FR-036 | AC-100 | Unidade | tests/models-override-parcial.test.ts | Pending |
| FR-037 | AC-101 | Integração | tests/models-recommend-real.test.ts | Pending |
| FR-037 | AC-102 | Unidade | tests/models-sem-credencial.test.ts | Pending |
| NFR-033 | AC-101 | Integração | tests/models-recommend-real.test.ts | Pending |
| NFR-033 | AC-102 | Unidade | tests/models-sem-credencial.test.ts | Pending |

### 13. Validações

#### Gate do Ato I — Definição

- **Resultado**: READY (2026-08-30)
- **Comando**: `node .agents/skills/specsfy-04-validate/scripts/validate_spec.mjs specs/defined/0009-fatia-1e-selecao-de-modelo/spec.md`
- **Cobertura**: 3 US, 4 FR, 3 NFR, 13 AC, 4 DEC; mínimo de 3 AC por ID satisfeito em todos.
- **Research**: `load_research.mjs` em `PASSED`, com `R-033`, `R-034` e `R-035` verificados e um artefato indexado.
- **Revisão PROD**: a redução de escopo de "análise completa" para "sem rede, sem autenticação" foi verificada por execução real antes de escrever a spec (`agy models` pedindo login), não suposta — mesma disciplina da correção de `D2` na fatia 1d.
- **Achados**: Nenhum bloqueante.

#### Gate do Ato II — Plano

- **Resultado**: Pending
- **Comando**: `node .agents/skills/specsfy-05-tasks/scripts/validate_tasks.mjs specs/defined/0009-fatia-1e-selecao-de-modelo/spec.md`
- **Achados**: Pending.

#### Gate do Ato III — Entrega

- **Resultado**: Pending
- **Comando**: `node .agents/skills/specsfy-06-tdd-bdd/scripts/check_traceability.mjs specs/defined/0009-fatia-1e-selecao-de-modelo/spec.md .`
- **Achados**: Pending.

### 14. Tarefas

Preenchida por `$specsfy-05-tasks`.

### 15. Ordem de execução

Preenchida por `$specsfy-05-tasks`.

## Ato III — Entregar e validar

### 16. Dependências, riscos e suposições

#### Dependências

- Fatia 1d concluída, que fornece `SUPPORTED_AGENT_BACKENDS` e `detectBackends`.
- `ollama`, opcional na máquina — sua ausência é um caminho relatado, não uma falha desta fatia.

#### Riscos

- **Perseguir "análise completa" apesar da evidência** → reintroduziria rede e autenticação, quebrando o padrão de todas as fatias anteriores. Mitigação: `PR-034`, `NFR-033`, `AC-098`, e a correção registrada de `D4` no backlog.
- **Silenciar a ausência de custo/uso de plano** → prometeria implicitamente algo que o relato não calcula. Mitigação: `NFR-035`, `FR-037`, `AC-097`.
- **Tratar ausência de backend/modelo como erro** → contradiria a "graceful degradation" que a fatia 1d já estabeleceu para backends. Mitigação: `AC-091`, `AC-093`, `AC-094`, sem exceção em nenhum dos três.
- **Revalidar o override e recusar uma escolha humana "errada"** → contradiria o próprio propósito do override, que é a pessoa decidir. Mitigação: `PR-036`, `AC-095`, `AC-096`.
- **Parsing frágil de `ollama list`** → mesma classe de risco que a listagem do `skills` (fatia 1h) e do `--version` dos backends (fatia 1d). Mitigação: formato tabular estável, testado contra a saída real da máquina (`AC-099`), e tratamento de saída vazia ou erro como "nenhum modelo", nunca como sucesso silencioso.

#### Suposições

- O tamanho reportado por `ollama list` (`SIZE`, ex. "9.0 GB") é convertido para bytes para comparação com `os.freemem()`. Reversível: se o formato mudar, só o parser muda.
- "Cabe na memória livre" usa `freeBytes`, não `totalBytes` — decisão conservadora, reversível se a fatia 1e futura (Orchestrator de verdade) mostrar que outro critério serve melhor.

### 17. Decisões

- **DEC-037**: A recomendação cobre backend (dos suportados presentes, fatia 1d) e modelo local (via `ollama`), nunca modelo de nuvem dentro de um backend. *Razão*: nenhum backend suportado expõe lista de modelo de nuvem sem autenticação — verificado por execução real (`R-034`), não suposto. *Alternativas descartadas*: pedir login por backend para enumerar — quebraria `DEC-002` e a garantia sem rede da fatia 1d; manter uma lista de modelos de nuvem chumbada no código — envelheceria em silêncio, o mesmo risco que `PR-035` evita.
- **DEC-038**: Custo e uso de plano ficam fora desta fatia, com a ausência declarada no relato. *Razão*: sem fonte local sem rede/autenticação, calcular seria inventar; a "análise completa" da ideia original pressupunha uma integração autenticada que contradiz o resto do projeto. *Alternativa descartada*: aceitar configuração declarada de custo por modelo — descartada por falta de pedido concreto de formato, ficando para quando alguém precisar de fato, e não como trabalho especulativo.
- **DEC-039**: Override humano nunca é revalidado contra presença ou capacidade. *Razão*: é a "aprovação de modelo" que a captura original nomeia — validar a escolha da pessoa e recusá-la silenciosamente contradiria o próprio ponto do override. *Alternativa descartada*: recusar override para backend não presente ou modelo que não caiba — descartada por tirar da pessoa uma decisão que é dela.
- **DEC-040**: "Cabe na memória livre" é `tamanho ≤ os.freemem()`, sem margem de segurança adicional. *Razão*: simplicidade e testabilidade; margem de segurança é heurística sem dado real que a sustente nesta fatia. *Alternativa descartada*: aplicar uma margem arbitrária (ex.: 80% da memória livre) — descartada por ser um número inventado, a mesma classe de problema que `PR-035` evita para custo.

### 18. Definition of Done

- [ ] `Definition Gate` está `Passed`.
- [ ] `Plan Gate` está `Passed`.
- [ ] `Delivery Gate` está `Passed`.
- [ ] Todos os cenários `AC` aplicáveis passam.
- [ ] Todos os requisitos possuem evidência de verificação registrada na seção 12.
- [ ] Todas as tarefas na seção 14 estão concluídas.
- [ ] `npx tsc --noEmit`, `npm run build` e a suíte completa passam.
- [ ] Nenhuma chamada de rede nem prompt de autenticação ocorre, conferido por inspeção do código e por execução manual real.
- [ ] `node dist/cli.js recommend`, executado de verdade nesta máquina, imprime backend e modelo local recomendados (ou a ausência de cada um) e a declaração de que custo e uso de plano não entram no cálculo.
- [ ] `.specsfy/STACK.md` registra os três módulos novos e o comando `recommend`.
- [ ] `PROJECT.md` descreve o que `common-rules recommend` faz e o que deliberadamente não calcula.
