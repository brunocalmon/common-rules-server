# Especificação integrada: Fatia 1h: instalar specsfy e mattpocock lado a lado

| Campo | Valor |
| --- | --- |
| Formato | Specsfy/2.0 |
| ID | SPEC-0005 |
| Slug | 0005-fatia-1h-skills-lado-a-lado |
| Status | Complete |
| Effort | 5 |
| Effort updated at | 2026-08-29 |
| Effort rationale | O `setup` e o registro já existem. O custo está em acoplar um instalador de terceiro que simboliza por padrão, não fixa conteúdo e falha de formas que precisam chegar como falha. |
| ClickUp Task | |
| Milestones | |
| Definition Gate | Passed |
| Plan Gate | Passed |
| Delivery Gate | Passed |
| Evidence Contract | 1 |
| Interface para pessoas | Não — a entrega acontece dentro de um comando de terminal já existente, sem tela. |
| Atualizada em | 2026-08-29 |

## Ato I — Definir

### 1. Problema e resultado

#### Problema

O `setup` resolve três subsistemas e instala sete hooks, mas as skills de engenharia ficam fora. Quem as quer instala à mão, e o projeto não registra origem, referência nem presença. O `doctor` não consegue dizer o que está instalado, e nada percebe quando o conteúdo muda.

Há um obstáculo concreto: as skills de Matt Pocock não existem como pacote npm publicado pelo autor. O caminho oficial é um instalador de terceiro, o `skills`, da vercel-labs, que por padrão cria **link simbólico** para os diretórios do agente e não oferece lockfile, fixação de versão nem hash de commit.

Isso encontra três regras já vigentes neste projeto: nada se instala no ambiente global; a origem resolvida é sempre relatada; e falha silenciosa é o modo de falha caro. Um instalador que simboliza para um armazenamento fora do projeto e busca da ponta viola as três de uma vez, se usado como vem.

#### Resultado desejado

Um único `setup` deixa os dois ecossistemas instalados, íntegros e lado a lado, e o projeto sabe dizer o que colocou lá.

Ao fim da fatia, `.claude/skills/` contém as skills do `specsfy` e as de `mattpocock/skills` como diretórios irmãos, em arquivos reais e não links. O registro que a fatia 1b já grava ganha, para cada conjunto, a origem, a referência instalada e o hash do conteúdo. O `doctor` relata o que existe e o que divergiu, sem alterar coisa alguma.

O `common-rules` não escolhe entre os ecossistemas, não os mescla e não reescreve nenhum deles.

#### Métricas de sucesso

- Depois de um `setup`, os dois conjuntos existem em `.claude/skills/` e nenhum sobrescreveu o outro.
- Nenhuma entrada instalada é link simbólico.
- Nada é escrito fora da raiz do projeto, em particular no diretório do usuário.
- O registro nomeia, por conjunto, a origem, o caminho de cada skill dentro dela e o hash do conteúdo.
- O `doctor` nomeia conjunto divergente e sai com código diferente de zero, sem tocar no sistema de arquivos.
- Origem que não seja a oficial é recusada, com a aceita nomeada.
- O relato declara que a entrega dá rastreabilidade e não reprodutibilidade.

### 2. Research e esclarecimentos

#### Researchs executados

- **R-020** [critical] O instalador oficial cria link simbólico por padrão, aceita restringir o alvo e pode operar sem interação — Verdict: verified — Confidence: high — Evidence: research/instalador-skills/interface-da-cli.md#flags-relevantes-para-esta-fatia — Budget: 1/2.
- **R-021** [critical] Os dois conjuntos convivem em `.claude/skills/` sem que um remova ou sobrescreva o outro, e o instalador grava um lockfile com hash por skill — Verdict: verified — Confidence: high — Evidence: research/instalador-skills/coexistencia-observada.md#resultado — Budget: 2/2.

A execução real em projeto descartável levou três diretórios simulados do `specsfy` a conviver com trinta e sete de `mattpocock`, quarenta no total, sem link simbólico em nível algum e sem que `AGENTS.md` ou `CLAUDE.md` fossem criados. A mesma execução revelou o `skills-lock.json`, que a documentação não menciona e que corrige uma afirmação anterior desta pesquisa.

O README do projeto descreve `--copy` como copiar arquivos **em vez de** criar link simbólico, o que revela o link como padrão. Também oferece `-a` para restringir agentes, `-y` para pular confirmações, `-s` para selecionar skills e `-g` para instalar no diretório do usuário. A ausência de lockfile, fixação de versão ou hash de commit é igualmente parte da observação.

#### Fontes e contexto consultados

- README de `github.com/vercel-labs/skills`, acessado em 2026-08-29.
- README de `github.com/mattpocock/skills`, que instrui o caminho oficial de instalação.
- Registro npm para `skills` 1.5.23 e para `mattpocock-skills` 1.3.0.
- `specs/backlog/0005-fatia-1h-skills-lado-a-lado.md`, o brief refinado.
- `specs/completed/0003-fatia-1b-setup-hooks/spec.md`, pelo `setup`, pelo registro e pela detecção.
- `specs/completed/0002-phase-1a-esqueleto-typescript/spec.md`, pela DEC-002 e pelo `doctor`.
- `.specsfy/RULES.md`, pelas regras de instalação e de relato de origem.
- `src/setup/record.ts` e `src/doctor.ts`, pela forma real do registro e do relato.

#### Documentação consultada

Dois README públicos e o registro npm. As notas ficam em `research/`, sem reprodução de texto de terceiro.

#### Artefatos de pesquisa armazenados

- `specs/completed/0005-fatia-1h-skills-lado-a-lado/research/instalador-skills/interface-da-cli.md` — interface observada da CLI, com proveniência, as flags relevantes e a consequência do padrão por link. Contém a correção da afirmação sobre ausência de lockfile.
- `specs/completed/0005-fatia-1h-skills-lado-a-lado/research/instalador-skills/coexistencia-observada.md` — execução real em projeto descartável, com contagem antes e depois, ausência de links, arquivos não criados e a forma do lockfile encontrado.

#### Dúvidas respondidas

- **Q**: As skills de Matt Pocock entram por npm, como o `specsfy`? → **A**: Não. O autor não publica no npm; o `mattpocock-skills` do registro é de terceiro. O caminho oficial é o instalador `skills`.
- **Q**: O `common-rules` escolhe entre os ecossistemas? → **A**: Não. Ambos ficam instalados e íntegros; ele registra e relata.
- **Q**: Fixar a versão do instalador basta? → **A**: Não. O conteúdo vem da ponta. A fatia entrega rastreabilidade, e a limitação é assumida.
- **Q**: E a camada de orquestração em `CLAUDE.md`? → **A**: Fora desta fatia. Pertence ao épico de extensões da Phase 2.
- **Q**: E `AGENTS.md`? → **A**: Espera a fatia 1d, que abre a detecção de outros backends.

#### Dúvidas abertas

Nenhuma que bloqueie esta fatia.

### 3. Escopo e atores

#### Incluído

- Instalação do conjunto de `mattpocock/skills` pelo instalador oficial, em escopo de projeto, restrita ao alvo Claude Code e sem interação.
- Uso de cópia real em vez de link simbólico.
- Entradas no registro existente com origem, referência instalada e hash do conteúdo, por conjunto.
- Relato pelo `doctor` da presença de cada conjunto e da divergência entre o registrado e o presente.
- Recusa de qualquer origem que não seja a oficial, nomeando a aceita.
- Recusa de conflito de nome entre diretórios dos dois conjuntos, em vez de sobrescrita.

#### Fora de escopo

- A camada de orquestração em `CLAUDE.md`, que pertence ao épico de extensões da Phase 2.
- `AGENTS.md`, que espera a fatia 1d.
- Mesclar, reescrever, preterir ou desativar qualquer um dos conjuntos.
- Instalação no diretório do usuário ou em qualquer lugar fora do projeto.
- Reparo, reversão ou remoção de conteúdo divergente.
- Alvos de editor além do Claude Code.
- Fixar o conteúdo instalado, que o instalador não permite.

#### Atores

- **Quem usa o `common-rules`**: roda um `setup` e obtém o ambiente do agente completo.
- **Quem mantém este repositório**: deixa de instalar as skills à mão.
- **O `doctor`**: passa a ter o que relatar sobre os conjuntos.
- **A fatia 1d e o épico de extensões**: herdam o registro e a instalação, sem recriá-los.

### 4. Princípios e restrições do projeto

- **PR-020**: Os dois ecossistemas ficam íntegros. O `common-rules` orquestra, não arbitra.
- **PR-021**: Nada é instalado fora do projeto.
- **PR-022**: Arquivo real, nunca link simbólico. Conteúdo por link não descreve o que o agente lê.
- **PR-023**: A entrega promete rastreabilidade, não reprodutibilidade, e diz isso em voz alta.
- **PR-024**: Nada é apagado nem revertido por esta entrega.

### 5. Histórias de usuário

#### US-020 — Obter o ambiente completo com um comando

Como **quem usa o `common-rules`**, quero **que um único `setup` instale os dois conjuntos de skills**, para **não montar o ambiente do agente à mão**.

**Por que P1**: É a razão da fatia. Sem ela o `setup` entrega um ambiente incompleto e a diferença fica por conta de cada pessoa.
**Teste independente**: Após um `setup`, os dois conjuntos existem em `.claude/skills/` como arquivos reais, nenhum sobrescreveu o outro, e nada foi criado fora do projeto.
**Requisitos**: FR-020, FR-021, FR-022, FR-026

#### US-021 — Saber o que está instalado e o que mudou

Como **quem mantém o projeto**, quero **que o registro e o `doctor` digam o que foi instalado e o que divergiu**, para **que a diferença entre máquinas apareça em vez de agir em silêncio**.

**Por que P1**: O instalador não fixa conteúdo. Sem registro, a deriva é invisível, que é o modo de falha caro deste projeto.
**Teste independente**: O registro nomeia origem, referência e hash por conjunto; alterado o conteúdo, o `doctor` nomeia o conjunto divergente, sai com código diferente de zero e não altera nada.
**Requisitos**: FR-023, FR-024, FR-025

#### US-022 — Recusar o que não é a origem oficial

Como **quem usa o `common-rules`**, quero **que apenas a origem oficial seja aceita**, para **não receber skills de uma republicação de terceiro sem perceber**.

**Por que P1**: Skills são instruções que entram no contexto do agente. Existe no npm uma republicação com nome plausível apontando o repositório original nos metadados.
**Teste independente**: Pedida uma origem diferente da oficial, o comando recusa e nomeia a aceita; instalador ausente ou rede indisponível produzem erro, e nunca relato de sucesso.
**Requisitos**: FR-020, FR-025, FR-026

### 6. Cenários BDD de aceite

#### AC-020 — Os dois conjuntos convivem após um setup

**Cobre**: US-020, FR-020, FR-026

```gherkin
@US-020 @FR-020 @FR-026 @AC-020
Feature: Convivência dos ecossistemas

  Scenario: Um único setup deixa os dois instalados
    Given um projeto com evidência de uso do alvo
    When o setup roda
    Then as skills do specsfy estão em .claude/skills/
    And as skills de mattpocock estão em .claude/skills/
    And nenhuma sobrescreveu a outra
```

#### AC-021 — A instalação usa arquivo real

**Cobre**: US-020, FR-021, NFR-022

```gherkin
@US-020 @FR-021 @NFR-022 @AC-021
Feature: Cópia em vez de link

  Scenario: Nenhuma entrada instalada é link simbólico
    Given o setup concluído sobre um projeto válido
    When as entradas instaladas são inspecionadas
    Then nenhuma delas é link simbólico
    And o conteúdo lido pelo agente vive dentro do projeto
```

#### AC-022 — O diretório do usuário permanece intocado

**Cobre**: US-020, FR-022, NFR-022

```gherkin
@US-020 @FR-022 @NFR-022 @AC-022
Feature: Confinamento ao projeto

  Scenario: Nada é escrito fora da raiz
    Given a árvore do diretório do usuário registrada antes da execução
    When o setup instala os dois conjuntos
    Then os arquivos aparecem apenas dentro do projeto
    And a árvore do diretório do usuário permanece igual
```

#### AC-023 — O registro nomeia origem, referência e hash

**Cobre**: US-021, FR-023

```gherkin
@US-021 @FR-023 @AC-023
Feature: Registro do que foi instalado

  Scenario: Cada conjunto aparece com sua procedência
    Given o setup concluído
    When o registro de instalação é lido
    Then cada conjunto instalado aparece nomeado
    And traz a origem de onde veio
    And traz a referência instalada e o hash do conteúdo
```

#### AC-024 — O doctor relata o que está presente

**Cobre**: US-021, FR-024

```gherkin
@US-021 @FR-024 @AC-024
Feature: Relato de presença

  Scenario: O doctor enumera os conjuntos
    Given um projeto com os dois conjuntos instalados
    When o doctor examina o projeto
    Then ele nomeia cada conjunto e sua origem
    And sai com código zero quando nada divergiu
```

#### AC-025 — O doctor torna a deriva visível sem mutar nada

**Cobre**: US-021, FR-024, NFR-020

```gherkin
@US-021 @FR-024 @NFR-020 @AC-025
Feature: Deriva visível

  Scenario: Conteúdo alterado depois da instalação
    Given um conjunto de skills alterado após o setup
    When o doctor examina o projeto
    Then ele nomeia o conjunto divergente
    And sai com código diferente de zero
    And nenhum arquivo é criado, alterado ou removido
```

#### AC-026 — A republicação de terceiro é recusada

**Cobre**: US-022, FR-020, FR-025

```gherkin
@US-022 @FR-020 @FR-025 @AC-026
Feature: Origem oficial

  Scenario: O pacote npm de terceiro não é aceito
    Given um pedido de instalar as skills a partir do pacote npm de terceiro
    When o setup processa esse pedido
    Then ele recusa
    And nomeia a origem oficial como a única aceita
    And nada é instalado
```

#### AC-027 — Conflito de nome recusa em vez de sobrescrever

**Cobre**: US-022, FR-026, NFR-020

```gherkin
@US-022 @FR-026 @NFR-020 @AC-027
Feature: Conflito entre conjuntos

  Scenario: Dois conjuntos disputam o mesmo nome de diretório
    Given um diretório de skills cujo nome já pertence ao outro conjunto
    When o setup tenta instalar
    Then ele recusa e nomeia o conflito
    And o diretório existente permanece como estava
```

#### AC-028 — Instalador ausente não vira sucesso

**Cobre**: US-022, FR-020, NFR-021

```gherkin
@US-022 @FR-020 @NFR-021 @AC-028
Feature: Instalador indisponível

  Scenario: O instalador oficial não pode ser executado
    Given um ambiente em que o instalador não está disponível
    When o setup tenta instalar o conjunto
    Then a resposta indica que o conjunto não foi instalado
    And não afirma sucesso
    And o restante do setup segue e é relatado
```

#### AC-029 — Reexecutar não duplica nem sobrescreve

**Cobre**: US-020, FR-023, FR-026, NFR-020

```gherkin
@US-020 @FR-023 @FR-026 @NFR-020 @AC-029
Feature: Reexecução

  Scenario: O segundo setup reconhece o estado
    Given um projeto já configurado pelo setup
    When o setup roda outra vez
    Then o registro continua com uma entrada por conjunto
    And nenhum conteúdo instalado foi removido
```

#### AC-030 — O relato declara o alcance da garantia

**Cobre**: US-021, FR-024, NFR-021

```gherkin
@US-021 @FR-024 @NFR-021 @AC-030
Feature: Garantia declarada

  Scenario: O relato não promete o que não entrega
    Given os dois conjuntos instalados e registrados
    When o doctor relata os conjuntos
    Then o relato informa que a referência não é fixada pela origem
    And não afirma que duas máquinas obterão conteúdo idêntico
```

#### AC-031 — Instalação parcial não passa por completa

**Cobre**: US-022, FR-020, NFR-021

```gherkin
@US-022 @FR-020 @NFR-021 @AC-031
Feature: Falha no meio do caminho

  Scenario: A instalação é interrompida antes de terminar
    Given uma execução do instalador que falha no meio
    When o setup avalia o resultado
    Then ele relata que o conjunto não ficou instalado
    And o registro não ganha entrada para um conjunto incompleto
```

#### AC-032 — Nenhum caminho apaga conteúdo

**Cobre**: US-020, FR-021, FR-022, FR-026, NFR-020, NFR-022

```gherkin
@US-020 @FR-021 @FR-022 @FR-026 @NFR-020 @NFR-022 @AC-032
Feature: Entrega não destrutiva

  Scenario: Recusa, conflito e reexecução preservam o que existe
    Given um projeto com conteúdo instalado e um conflito preparado
    When o setup recusa por conflito e depois roda de novo
    Then nenhum arquivo foi apagado em qualquer dos caminhos
    And nada fora da raiz do projeto foi tocado
```

#### AC-033 — Link simbólico não é forma aceita de instalação

**Cobre**: US-020, FR-021, FR-022, NFR-022

```gherkin
@US-020 @FR-021 @FR-022 @NFR-022 @AC-033
Feature: Recusa de conteúdo por link

  Scenario: Um conjunto presente como link é tratado como inválido
    Given um diretório de skills que é link simbólico para fora do projeto
    When o setup ou o doctor avalia esse conjunto
    Then ele é reportado como inválido
    And a razão cita que o conteúdo precisa viver dentro do projeto
```

#### AC-034 — O registro guarda apenas a origem oficial

**Cobre**: US-021, FR-023, FR-025

```gherkin
@US-021 @FR-023 @FR-025 @AC-034
Feature: Procedência no registro

  Scenario: A origem gravada é a oficial
    Given o conjunto instalado pelo caminho oficial
    When o registro é lido
    Then a origem gravada é a oficial
    And nenhuma outra origem aparece no registro
```

#### AC-035 — Origem arbitrária é recusada

**Cobre**: US-022, FR-025, NFR-021

```gherkin
@US-022 @FR-025 @NFR-021 @AC-035
Feature: Origem fora da lista

  Scenario: Um endereço qualquer não serve como fonte
    Given um pedido de instalar de uma origem que não a oficial
    When o setup processa o pedido
    Then ele recusa
    And explica que a origem não é reconhecida
    And nada é baixado nem instalado
```

### 7. Requisitos

#### Funcionais

- **FR-020**: O `setup` deve instalar o conjunto de `mattpocock/skills` pelo instalador oficial — o comando que o README do autor documenta, `npx skills@latest add mattpocock/skills`, aqui executado pelo binário local do pacote fixado —, em escopo de projeto, restrito ao alvo Claude Code e sem interação.
- **FR-021**: A instalação deve produzir arquivos reais dentro do projeto, e nunca link simbólico.
- **FR-022**: Nada deve ser escrito fora da raiz do projeto, em particular no diretório do usuário.
- **FR-023**: O registro de instalação deve conter, por conjunto, o nome, a origem e a procedência por skill — caminho e hash —, lida do lockfile que o instalador grava, sem recalcular o que ele já computou.
- **FR-024**: O `doctor` deve relatar cada conjunto presente e nomear o que divergiu do registrado, saindo com código diferente de zero quando houver divergência, sem alterar o sistema de arquivos.
- **FR-025**: Origem diferente da oficial deve ser recusada, com a origem aceita nomeada e sem instalar nada.
- **FR-026**: Nenhum conjunto deve sobrescrever o outro; conflito de nome deve ser recusado com o conflito nomeado.

#### Não funcionais

- **NFR-020**: **Não destrutivo**. Nenhum caminho desta entrega apaga, reverte ou remove conteúdo. **Verificação**: comparação da árvore antes e depois nos caminhos de sucesso, de recusa e de conflito.
- **NFR-021**: **Rastreabilidade declarada**. A entrega registra procedência e torna a deriva visível, e declara que não garante reprodutibilidade. **Verificação**: leitura do relato do `doctor` e inspeção do registro, conferindo que a limitação é dita e que falha não vira sucesso.
- **NFR-022**: **Confinamento**. Cada conteúdo instalado vive dentro da raiz do projeto, em arquivo real. **Verificação**: inspeção das entradas quanto a link simbólico e comparação da árvore do diretório do usuário antes e depois.

#### Erros e casos-limite

- Instalador ausente ou não executável → relatar que o conjunto não foi instalado, seguir com o restante do `setup` e não afirmar sucesso.
- Execução do instalador terminando com erro → não gravar entrada no registro para conjunto incompleto.
- Rede indisponível → mesmo tratamento da falha de execução, com a causa dita.
- Diretório de skills presente como link simbólico → reportar como inválido, citando que o conteúdo precisa viver dentro do projeto.
- Conflito de nome entre conjuntos → recusar, nomear o conflito, preservar o existente.
- Alvo não detectado na raiz → relatar alvo ignorado, como o `setup` já faz para os hooks, sem tratar como erro.
- Registro corrompido → recusar e pedir reexecução, sem reconstruir por inferência.

## Ato II — Projetar e provar

### 8. Plano técnico

#### Contexto existente

- `runSetup` recebe `root` por parâmetro e devolve resultado estruturado; `writeRecordFile` e `readRecordFile` operam sobre raiz explícita.
- `InstallRecord` tem hoje `target`, `version` e `hooks`, com `RecordEntry` de `name`, `target`, `version`, `installedAt` e `event`.
- `inspectDependencies` devolve `Report` com `results` e `exitCode`, e `DependencyResult` traz `name`, `layer`, `present`, `origin`, `version` e `hint`.
- O `setup` só escreve onde há evidência de uso do alvo e relata o que ignorou.
- A suíte tem 37 arquivos e 133 casos.

#### Arquitetura e módulos

| Módulo | Responsabilidade | Arquivo |
| --- | --- | --- |
| Origens aceitas | Nomear a origem oficial e recusar as demais | `src/skills/source.ts` |
| Instalação | Montar e executar a invocação do instalador, com alvo, cópia e sem interação | `src/skills/install.ts` |
| Inventário | Enumerar conjuntos presentes, detectar link simbólico e calcular hash | `src/skills/inventory.ts` |
| Registro | Converter inventário em entradas e comparar com o registrado | `src/skills/record.ts` |

A origem vive separada porque é a única regra de recusa que não depende de sistema de arquivos, e precisa ser exercitável sem instalar nada. O inventário é separado da instalação para que o `doctor` o use sem carregar o caminho que escreve.

#### Migrations

Não aplicável. A fatia não introduz banco.

#### Models

`InstallRecord` ganha uma lista `skills`, paralela a `hooks`, cujo item traz nome do conjunto, origem, referência instalada, hash e momento. A forma existente é preservada para não invalidar registros já gravados pela fatia 1b.

#### Controllers e casos de uso

`src/skills/install.ts` é acionado por `runSetup` depois dos hooks; `src/skills/record.ts` é lido por `inspectDependencies` para o relato. Não há autorização a decidir.

#### Views e experiência

Não aplicável. A seção 10 registra a ausência de interface.

#### Queries e repositórios

Não aplicável.

#### Jobs e processamento assíncrono

A instalação é síncrona dentro do `setup`. Não há fila.

#### Estrutura de arquivos

```text
src/skills/
  source.ts
  install.ts
  inventory.ts
  record.ts
tests/
  skills-fixtures.ts
  skills-registro-persistido.test.ts
  skills-source-oficial.test.ts
  skills-source-terceiro.test.ts
  skills-source-arbitraria.test.ts
  skills-install-alvo.test.ts
  skills-install-copia.test.ts
  skills-install-falha.test.ts
  skills-install-parcial.test.ts
  skills-inventory-symlink.test.ts
  skills-conflito.test.ts
  skills-confinamento.test.ts
  skills-registro.test.ts
  skills-doctor-presenca.test.ts
  skills-doctor-deriva.test.ts
  skills-doctor-garantia.test.ts
  skills-idempotente.test.ts
  skills-nao-destrutivo.test.ts
```

### 9. Modelo de dados

O registro em `.common-rules/install.json` ganha a lista `skills`. Cada item guarda o nome do conjunto, a origem, o caminho da skill dentro dela, o hash do conteúdo e o momento da instalação. Não há referência de commit nem versão: `DEC-024` registra que o instalador não as fornece, e nomear no modelo algo que a entrada não pode carregar seria prometer o que não se entrega. A lista `hooks` permanece como está.

O hash existe para tornar a deriva visível, e não para impedi-la: o mesmo processo que escreve o conteúdo escreve o registro.

### 10. Interfaces e contratos

#### Interface para pessoas

**Não há interface para pessoas.** A entrega acontece dentro de comandos de terminal que já existem, e quem lê o resultado é quem executou o comando ou o agente.

#### APIs expostas

Nenhuma. A fatia amplia o comportamento de `setup` e `doctor`.

#### APIs externas utilizadas

O executável `skills`, invocado como subprocesso. O caminho documentado pelo autor é `npx skills@latest add mattpocock/skills`; esta fatia executa a mesma operação pelo binário local do pacote fixado, acrescentando alvo restrito, cópia real e ausência de interação. A forma exercitada na pesquisa foi `skills add mattpocock/skills -a claude-code --skill '*' --copy -y`, com código de saída zero. Falha de execução, ausência do executável e término com erro são tratados como erro pelo chamador.

#### Documentação das APIs consultadas

README de `github.com/vercel-labs/skills`, acessado em 2026-08-29, com as notas em `research/instalador-skills/interface-da-cli.md`.

#### Eventos e outros contratos

Não aplicável.

### 11. Estratégia TDD

- **Unidade**: aceitação e recusa de origem, e detecção de link simbólico, com entradas construídas em diretório temporário.
- **Integração**: `setup` sobre projetos descartáveis, com o instalador injetado, conferindo o disco e o registro.
- **Confinamento**: execução conferindo que o diretório do usuário e um projeto vizinho permanecem intocados.
- **Falha**: instalador ausente, término com erro e interrupção no meio, todos exercitados pelo caminho real de erro.
- **Runner**: Vitest, pelo script `test:tdd`.
- **Verificação manual**: nenhuma.

O ponto sensível é que o instalador é um subprocesso de terceiro. Os casos injetam o executor em vez de chamar o `skills` real, para que a suíte não dependa de rede nem instale nada durante o teste. Em troca, os casos precisam exercitar o contrato de falha com o mesmo rigor do de sucesso: instalador ausente e término com erro são os caminhos que, se tratados com descuido, produzem o relato de sucesso sobre nada — o defeito que a fatia 1b já cometeu uma vez.

### 12. Plano de testes e rastreabilidade

| Requisito | Cenário BDD | Nível | Comando de verificação | Evidência |
| --- | --- | --- | --- | --- |
| FR-020 | AC-020 | Integração | instalação dos dois conjuntos | **Passed** — skills-install-alvo, T020 |
| FR-020 | AC-026 | Unidade | recusa da republicação | **Passed** — skills-source-terceiro, T018 |
| FR-020 | AC-028 | Integração | instalador ausente | **Passed** — skills-install-falha, T020 |
| FR-020 | AC-031 | Integração | interrupção no meio | **Passed** — skills-install-parcial, T020 |
| FR-021 | AC-021 | Integração | nenhuma entrada é link | **Passed** — skills-install-copia, T019 |
| FR-021 | AC-032 | Confinamento | nada apagado | **Passed** — skills-nao-destrutivo, 3 casos, T021 |
| FR-021 | AC-033 | Unidade | link é inválido | **Passed** — skills-inventory-symlink, T019 |
| FR-022 | AC-022 | Confinamento | diretório do usuário intocado | **Passed** — skills-confinamento, 3 casos, T020 |
| FR-022 | AC-032 | Confinamento | nada fora da raiz | **Passed** — skills-nao-destrutivo, 3 casos, T021 |
| FR-022 | AC-033 | Unidade | conteúdo fora do projeto recusado | **Passed** — skills-inventory-symlink, T019 |
| FR-023 | AC-023 | Integração | registro com origem e hash | **Passed** — skills-registro e skills-registro-persistido, T029 |
| FR-023 | AC-029 | Integração | reexecução não duplica | **Passed** — skills-idempotente, T021 |
| FR-023 | AC-034 | Integração | origem gravada é a oficial | **Passed** — skills-source-oficial, T021 |
| FR-024 | AC-024 | Integração | relato de presença | **Passed** — skills-doctor-presenca, T021 |
| FR-024 | AC-025 | Integração | relato de divergência | **Passed** — skills-doctor-deriva, T021 |
| FR-024 | AC-030 | Integração | garantia declarada | **Passed** — skills-doctor-garantia, T021 |
| FR-025 | AC-026 | Unidade | republicação recusada | **Passed** — skills-source-terceiro, T018 |
| FR-025 | AC-034 | Integração | só a oficial no registro | **Passed** — skills-source-oficial, T021 |
| FR-025 | AC-035 | Unidade | origem arbitrária recusada | **Passed** — skills-source-arbitraria, T018 |
| FR-026 | AC-020 | Integração | nenhum sobrescreve o outro | **Passed** — skills-install-alvo, T020 |
| FR-026 | AC-027 | Integração | conflito recusado | **Passed** — skills-conflito, T020 |
| FR-026 | AC-029 | Integração | reexecução preserva | **Passed** — skills-idempotente, T021 |
| FR-026 | AC-032 | Confinamento | conflito não apaga | **Passed** — skills-nao-destrutivo, 3 casos, T021 |
| NFR-020 | AC-025 | Integração | doctor não muta | **Passed** — skills-doctor-deriva, T021 |
| NFR-020 | AC-027 | Integração | conflito preserva | **Passed** — skills-conflito, T020 |
| NFR-020 | AC-029 | Integração | reexecução preserva | **Passed** — skills-idempotente, T021 |
| NFR-020 | AC-032 | Confinamento | nenhum caminho apaga | **Passed** — skills-nao-destrutivo, 3 casos, T021 |
| NFR-021 | AC-028 | Integração | falha não vira sucesso | **Passed** — skills-install-falha, T020 |
| NFR-021 | AC-030 | Integração | limitação declarada | **Passed** — skills-doctor-garantia, T021 |
| NFR-021 | AC-031 | Integração | parcial não vira completa | **Passed** — skills-install-parcial, T020 |
| NFR-021 | AC-035 | Unidade | origem não reconhecida | **Passed** — skills-source-arbitraria, T018 |
| NFR-022 | AC-021 | Integração | arquivo real | **Passed** — skills-install-copia, T019 |
| NFR-022 | AC-022 | Confinamento | fora da raiz intocado | **Passed** — skills-confinamento, 3 casos, T020 |
| NFR-022 | AC-032 | Confinamento | nada fora do projeto | **Passed** — skills-nao-destrutivo, 3 casos, T021 |
| NFR-022 | AC-033 | Unidade | link recusado | **Passed** — skills-inventory-symlink, T019 |

### 13. Validações

#### Gate do Ato I — Definição

- **Resultado**: READY (2026-08-29), reconfirmado no aceite final em 2026-08-29
- **Comando**: `node .claude/skills/specsfy-04-validate/scripts/validate_spec.mjs specs/completed/0005-fatia-1h-skills-lado-a-lado/spec.md`
- **Cobertura**: 3 US, 7 FR, 3 NFR, 16 AC, 9 DEC; mínimo de 3 AC por ID satisfeito nos treze. Identificadores de 020 a 035, conforme a regra de faixa por spec.
- **Research**: `load_research.mjs` em `PASSED`, com `R-020` e `R-021` verificados e dois artefatos indexados.

**Achados da rodada de definição**

| ID | Achado | Severidade | Estado |
| --- | --- | --- | --- |
| D1 | A spec não decidia como o instalador é obtido, e `npx` em tempo de execução buscaria a ponta a cada chamada | BLOCKER | Resolvido — `DEC-027` fixa o pacote em versão exata |
| D2 | A coexistência dos dois conjuntos era inferência e nunca fora observada | BLOCKER | Resolvido — execução real registrada como `R-021` |
| D3 | A pesquisa afirmava ausência de lockfile a partir da ausência dele no README | BLOCKER | Resolvido — `FR-023` passou a ler a procedência, `DEC-024` teve a razão corrigida e `DEC-028` foi acrescentada |
| D4 | O `skills-lock.json` está no `.gitignore`, e passa a carregar a procedência | WARNING | Resolvido em `T026` — permanece ignorado, com a razão escrita; a procedência que este produto controla passou a viver em `.common-rules/install.json` |
| D5 | Julguei errada a atribuição do `skills-lock.json` ao instalador do `specsfy` e a alterei. `@promovaweb/specsfy` declara `skills` entre suas dependências e seu instalador grava o arquivo: a atribuição original estava correta | NOTE | Revertido — comentário restaurado, e o erro registrado em vez de apagado |

**Achados do aceite final**

| ID | Achado | Severidade | Estado |
| --- | --- | --- | --- |
| A1 | `AC-022` não aparecia nas refs de evidência de nenhuma tarefa de código, e sob `--full-chain` — que é como o enforcement roda — a cadeia quebrava em `evidence`. `install.ts` é justamente o que não pode escrever fora da raiz | BLOCKER | Resolvido — `T020` passou a declarar `AC-022`, `FR-022` e `NFR-022`, que exercita de fato |
| A2 | As métricas da seção 1 e o modelo da seção 9 prometiam gravar a "referência instalada", enquanto `DEC-024` estabelece que o instalador não fornece referência de commit nem versão. A entrada guarda caminho e hash, não um ponteiro | WARNING | Resolvido — o vocabulário passou a nomear o que a entrada carrega, e a seção 9 registra por que não há referência |
| A3 | A estrutura da seção 8 omitia `tests/skills-registro-persistido.test.ts`, criado por `T028` | NOTE | Resolvido — acrescentado |
| A4 | `check_traceability` acusa vinte e sete marcadores órfãos, que são os das quatro specs anteriores | NOTE | Aceito — limitação conhecida, cuja correção pertence ao `@promovaweb/specsfy` |

**Sobre A1.** É a repetição exata do achado `A1` do aceite da `SPEC-0004`, onde os comentários de evidência omitiam identificadores que as tarefas serviam. Corrigi lá e reincidi aqui, o que indica que a causa não é desatenção pontual: escrevo as refs a partir do título da tarefa, e o título não carrega os identificadores que a implementação passa a cobrir quando o código cresce. Conferir a cadeia completa durante a entrega, e não apenas no aceite, é o que interromperia o ciclo.

#### Gate do Ato II — Plano

- **Resultado**: Passed (2026-08-29)
- **Comando**: `node .claude/skills/specsfy-05-tasks/scripts/validate_tasks.mjs specs/completed/0005-fatia-1h-skills-lado-a-lado/spec.md`
- **Plano**: 27 tarefas — 16 `[TEST] [TDD]`, 6 `[CODE]`, 3 `[DOC]`, 2 `[OPS]`; 135 itens de checklist; 29 de 29 IDs cobertos.
- **RED**: `npm run test:tdd` com dezesseis arquivos novos reprovando por `Cannot find module` sobre `src/skills/source`, `src/skills/inventory`, `src/skills/install` e `src/skills/record`, e os 133 casos anteriores verdes. 50 casos marcados com `SPECSFY`, cobrindo os dezesseis `AC`.
- **Rastreabilidade**: `check_traceability.mjs` em 29 de 29 IDs cobertos sobre 55 arquivos de teste.

**Sobre a dependência.** `skills` entrou fixado em 1.5.23. A instalação revelou que ele já chegava ao projeto por via transitiva, como dependência de `@promovaweb/specsfy` em faixa `^1.5.22`. Declará-lo direto e exato o traz para dentro da regra de fixação, que a faixa transitiva não alcançava, e fortalece a `DEC-027` com uma razão que a definição não conhecia.

**Erro cometido e revertido.** No Definition Gate registrei que o comentário do `.gitignore` atribuía indevidamente o `skills-lock.json` ao instalador do `specsfy`, e alterei o comentário. A verificação seguinte mostrou que `@promovaweb/specsfy` declara `skills` entre suas dependências e que seu `installer.js` grava esse arquivo: a atribuição original estava correta e a minha alteração é que era o erro. O comentário foi restaurado com a confirmação, e o achado `D5` reescrito para registrar a reversão em vez de escondê-la.

**A regra de numeração fez o sintoma piorar antes de melhorar.** `check_traceability` acusa vinte e sete marcadores órfãos nesta spec, contra dois na anterior. A causa é aritmética: esta numera de 020 a 035, e nenhum marcador das quatro specs anteriores cai nesse conjunto. A regra impede que duas specs disputem o mesmo identificador, que é a ambiguidade grave; ela não conserta o auditor, que varre `tests/` sem saber a que spec pertence cada marcador. A correção pertence ao `@promovaweb/specsfy`, dono do auditor, e está registrada como pendência conhecida.

#### Gate do Ato III — Entrega

- **Resultado**: Passed (2026-08-29)
- **Verificação**: `npm run test:tdd` em exit 0, com **184 casos em 54 arquivos**; `npx tsc --noEmit` e `npm run build` em exit 0; `npm run verify` em exit 0 a partir de clone limpo, em 5s contra orçamento de 300; diretório pessoal com 42 entradas antes e depois.
- **Auditorias**: `verify_acceptance` em `QA: PASSED`; `verify_evidence` em `PASSED (strict)`; `load_research` em `PASSED`; `build_documentation --check` em exit 0; monitor de contexto em `CURRENT`.
- **Confinamento**: `skills-confinamento` e `skills-nao-destrutivo` conferem o primeiro nível do diretório pessoal e, sobretudo, `~/.claude/skills`, que é onde a forma global do instalador escreveria. Também conferem um projeto vizinho antes e depois.

**Defeitos encontrados durante a entrega, e corrigidos.**

| Onde | Defeito | Correção |
| --- | --- | --- |
| `FR-023` | A persistência exigida pela seção 9 não foi implementada, e nenhum caso a cobria: o caso de `AC-023` afirmava sobre o valor devolvido pela leitura do lockfile, e a spec distingue esse arquivo do registro do projeto | `T028` e `T029` acrescentadas ao plano, com RED antes do código. `InstallRecord` ganhou a lista `skills`, e `runSetup` foi reordenado para que a instalação preceda a montagem do registro |
| `tests/skills-confinamento.test.ts` | O oráculo percorria `$HOME` inteiro e estourava o tempo em 5s, além de ser instável porque outros processos escrevem lá | Substituído por um oráculo mais preciso: primeiro nível do diretório pessoal e o caminho exato onde a forma global escreveria |
| `src/skills/install.ts` | Declarada assíncrona sem necessidade, o que obrigaria `runSetup` a virar assíncrona e quebraria os 133 casos existentes | Passou a síncrona; os casos que a aguardavam seguem válidos |
| Matriz da seção 12 | Sete linhas seguiam como RED depois de os casos ficarem verdes | Corrigidas; foi o `verify_acceptance` que percebeu, não a suíte |

**Sobre o defeito de `FR-023`.** É a mesma classe que a fatia 1b descobriu tarde: afirmar sobre o retorno da função em vez do arquivo escrito. Ali o comando relatava sete hooks instalados sem produzir arquivo algum; aqui a leitura funcionava e a gravação não existia. A diferença é que desta vez o defeito apareceu antes do fechamento, ao conferir a seção 9 contra o código — e não depois, num clone limpo.

**Rastreabilidade com ressalva conhecida.** `check_traceability` cobre 29 de 29 identificadores desta fatia e acusa vinte e sete marcadores órfãos, que são os das quatro specs anteriores. A regra de faixa por spec impede que duas disputem o mesmo identificador; ela não conserta o auditor, que varre `tests/` sem saber a que spec pertence cada marcador. A correção pertence ao `@promovaweb/specsfy`.

#### Suposições

- A procedência vem do `skills-lock.json` que o instalador grava, com um hash por skill. Recalcular seria duplicar trabalho e criar uma segunda verdade sobre o mesmo conteúdo.
- O conjunto de Matt Pocock é instalado inteiro, sem seleção por nome. Reversível: o instalador oferece seleção.
- `.claude/skills/` permanece fora do controle de versão deste repositório, como já está. Reversível.
- O executor do instalador é injetável, para que a suíte não dependa de rede.

#### Decisões abertas

Nenhuma que bloqueie esta fatia.

### 14. Tarefas

Formato:
`- [ ] TNNN [P?] [TIPO] [US-NNN?] Ação com caminho — Refs: IDs — Depends: IDs|none`

Checklist obrigatório por tarefa, na ordem `PREP`, `EXECUTE`, `VERIFY`, `EVIDENCE`, `IMPROVE`.

#### Fase 1 — Dependência

- [x] T001 [OPS] Fixar `skills` em 1.5.23 no package.json e instalar sem executar scripts — Refs: FR-020 — Depends: none
  - [x] **PREP**: Confirmar 1.5.23 como versão corrente e que o pacote expõe binário próprio, de modo que a invocação use a cópia local em vez de buscar a ponta.
  - [x] **EXECUTE**: Acrescentar `skills` às dependências em versão exata, sem intervalo, e instalar com `--ignore-scripts`.
  - [x] **VERIFY**: `npm ls skills` resolve 1.5.23, os binários `skills` e `add-skill` existem em `node_modules/.bin/`, e o manifesto segue com zero dependências em faixa.
  - [x] **EVIDENCE**: Comandos e versão resolvida registrados na seção 12.
  - [x] **IMPROVE**: A instalação revelou que `skills` já chegava por via transitiva, como dependência de `@promovaweb/specsfy` em faixa `^1.5.22`. Declará-lo direto e exato o traz para dentro da regra de fixação, que a faixa transitiva não respeitava. Isso também confirmou que o comentário do `.gitignore` sobre o `skills-lock.json` estava certo desde o início, e que a alteração que eu havia feito nele era o erro; foi revertida.

#### Fase 2 — RED, um caso por cenário da seção 6

Dezesseis tarefas, uma por `AC`, cada uma em arquivo próprio de `tests/`. Nenhuma depende das outras, por isso executam em paralelo.

- [x] T002 [P] [TEST] [TDD] [US-020] Derivar de AC-020 o caso em tests/skills-install-alvo.test.ts — Refs: US-020, FR-020, FR-026, AC-020 — Depends: none
  - [x] **PREP**: Ler o Gherkin de AC-020 e fixar o critério: os dois conjuntos existem em `.claude/skills/` após um setup, e nenhum diretório preexistente foi removido ou renomeado.
  - [x] **EXECUTE**: Escrever o caso em `tests/skills-install-alvo.test.ts`, com marcador `SPECSFY` por asserção, raízes em diretório temporário e o executor do instalador injetado, para que nenhum caso toque o projeto real nem dependa de rede.
  - [x] **VERIFY**: RED observado — `npm run test:tdd` reprova o arquivo inteiro por `Cannot find module` sobre `src/skills/`, e não por erro de escrita do caso.
  - [x] **EVIDENCE**: `npm run test:tdd` com 16 arquivos em RED e os 133 casos anteriores verdes; 50 casos marcados com `SPECSFY` sobre os dezesseis `AC`. Registrado na seção 12.
  - [x] **IMPROVE**: Contar diretórios antes e depois, e não apenas conferir que os novos chegaram: presença não prova ausência de remoção.

- [x] T003 [P] [TEST] [TDD] [US-020] Derivar de AC-021 o caso em tests/skills-install-copia.test.ts — Refs: US-020, FR-021, NFR-022, AC-021 — Depends: none
  - [x] **PREP**: Ler o Gherkin de AC-021 e fixar o critério: nenhuma entrada instalada é link simbólico, em nível algum.
  - [x] **EXECUTE**: Escrever o caso em `tests/skills-install-copia.test.ts`, com marcador `SPECSFY` por asserção, raízes em diretório temporário e o executor do instalador injetado, para que nenhum caso toque o projeto real nem dependa de rede.
  - [x] **VERIFY**: RED observado — `npm run test:tdd` reprova o arquivo inteiro por `Cannot find module` sobre `src/skills/`, e não por erro de escrita do caso.
  - [x] **EVIDENCE**: `npm run test:tdd` com 16 arquivos em RED e os 133 casos anteriores verdes; 50 casos marcados com `SPECSFY` sobre os dezesseis `AC`. Registrado na seção 12.
  - [x] **IMPROVE**: Percorrer a árvore inteira, e não só o primeiro nível, porque link aninhado é igualmente conteúdo fora do projeto.

- [x] T004 [P] [TEST] [TDD] [US-020] Derivar de AC-022 o caso em tests/skills-confinamento.test.ts — Refs: US-020, FR-022, NFR-022, AC-022 — Depends: none
  - [x] **PREP**: Ler o Gherkin de AC-022 e fixar o critério: o diretório do usuário tem a mesma árvore antes e depois.
  - [x] **EXECUTE**: Escrever o caso em `tests/skills-confinamento.test.ts`, com marcador `SPECSFY` por asserção, raízes em diretório temporário e o executor do instalador injetado, para que nenhum caso toque o projeto real nem dependa de rede.
  - [x] **VERIFY**: RED observado — `npm run test:tdd` reprova o arquivo inteiro por `Cannot find module` sobre `src/skills/`, e não por erro de escrita do caso.
  - [x] **EVIDENCE**: `npm run test:tdd` com 16 arquivos em RED e os 133 casos anteriores verdes; 50 casos marcados com `SPECSFY` sobre os dezesseis `AC`. Registrado na seção 12.
  - [x] **IMPROVE**: Fotografar a árvore do diretório pessoal e comparar; conferir apenas o projeto não distingue confinamento de coincidência.

- [x] T005 [P] [TEST] [TDD] [US-021] Derivar de AC-023 o caso em tests/skills-registro.test.ts — Refs: US-021, FR-023, AC-023 — Depends: none
  - [x] **PREP**: Ler o Gherkin de AC-023 e fixar o critério: o registro nomeia cada conjunto, sua origem e a procedência por skill lida do lockfile.
  - [x] **EXECUTE**: Escrever o caso em `tests/skills-registro.test.ts`, com marcador `SPECSFY` por asserção, raízes em diretório temporário e o executor do instalador injetado, para que nenhum caso toque o projeto real nem dependa de rede.
  - [x] **VERIFY**: RED observado — `npm run test:tdd` reprova o arquivo inteiro por `Cannot find module` sobre `src/skills/`, e não por erro de escrita do caso.
  - [x] **EVIDENCE**: `npm run test:tdd` com 16 arquivos em RED e os 133 casos anteriores verdes; 50 casos marcados com `SPECSFY` sobre os dezesseis `AC`. Registrado na seção 12.
  - [x] **IMPROVE**: Ler a procedência do lockfile do instalador em vez de recalcular, para não criar uma segunda verdade sobre o mesmo conteúdo.

- [x] T006 [P] [TEST] [TDD] [US-021] Derivar de AC-024 o caso em tests/skills-doctor-presenca.test.ts — Refs: US-021, FR-024, AC-024 — Depends: none
  - [x] **PREP**: Ler o Gherkin de AC-024 e fixar o critério: o doctor enumera os conjuntos com suas origens e sai com zero quando nada divergiu.
  - [x] **EXECUTE**: Escrever o caso em `tests/skills-doctor-presenca.test.ts`, com marcador `SPECSFY` por asserção, raízes em diretório temporário e o executor do instalador injetado, para que nenhum caso toque o projeto real nem dependa de rede.
  - [x] **VERIFY**: RED observado — `npm run test:tdd` reprova o arquivo inteiro por `Cannot find module` sobre `src/skills/`, e não por erro de escrita do caso.
  - [x] **EVIDENCE**: `npm run test:tdd` com 16 arquivos em RED e os 133 casos anteriores verdes; 50 casos marcados com `SPECSFY` sobre os dezesseis `AC`. Registrado na seção 12.
  - [x] **IMPROVE**: Derivar a expectativa do registro, e não de uma lista literal que envelhece a cada conjunto novo.

- [x] T007 [P] [TEST] [TDD] [US-021] Derivar de AC-025 o caso em tests/skills-doctor-deriva.test.ts — Refs: US-021, FR-024, NFR-020, AC-025 — Depends: none
  - [x] **PREP**: Ler o Gherkin de AC-025 e fixar o critério: conteúdo alterado após a instalação é nomeado, o código de saída é diferente de zero e nada no disco muda.
  - [x] **EXECUTE**: Escrever o caso em `tests/skills-doctor-deriva.test.ts`, com marcador `SPECSFY` por asserção, raízes em diretório temporário e o executor do instalador injetado, para que nenhum caso toque o projeto real nem dependa de rede.
  - [x] **VERIFY**: RED observado — `npm run test:tdd` reprova o arquivo inteiro por `Cannot find module` sobre `src/skills/`, e não por erro de escrita do caso.
  - [x] **EVIDENCE**: `npm run test:tdd` com 16 arquivos em RED e os 133 casos anteriores verdes; 50 casos marcados com `SPECSFY` sobre os dezesseis `AC`. Registrado na seção 12.
  - [x] **IMPROVE**: Comparar a árvore antes e depois da execução do doctor, porque a proibição de mutar é o ponto do caso.

- [x] T008 [P] [TEST] [TDD] [US-022] Derivar de AC-026 o caso em tests/skills-source-terceiro.test.ts — Refs: US-022, FR-020, FR-025, AC-026 — Depends: none
  - [x] **PREP**: Ler o Gherkin de AC-026 e fixar o critério: o pacote npm de terceiro é recusado, a origem oficial é nomeada e nada é instalado.
  - [x] **EXECUTE**: Escrever o caso em `tests/skills-source-terceiro.test.ts`, com marcador `SPECSFY` por asserção, raízes em diretório temporário e o executor do instalador injetado, para que nenhum caso toque o projeto real nem dependa de rede.
  - [x] **VERIFY**: RED observado — `npm run test:tdd` reprova o arquivo inteiro por `Cannot find module` sobre `src/skills/`, e não por erro de escrita do caso.
  - [x] **EVIDENCE**: `npm run test:tdd` com 16 arquivos em RED e os 133 casos anteriores verdes; 50 casos marcados com `SPECSFY` sobre os dezesseis `AC`. Registrado na seção 12.
  - [x] **IMPROVE**: Exercitar a recusa sem rede, com a decisão isolada do sistema de arquivos.

- [x] T009 [P] [TEST] [TDD] [US-022] Derivar de AC-027 o caso em tests/skills-conflito.test.ts — Refs: US-022, FR-026, NFR-020, AC-027 — Depends: none
  - [x] **PREP**: Ler o Gherkin de AC-027 e fixar o critério: conflito de nome recusa, nomeia o conflito e preserva o diretório existente.
  - [x] **EXECUTE**: Escrever o caso em `tests/skills-conflito.test.ts`, com marcador `SPECSFY` por asserção, raízes em diretório temporário e o executor do instalador injetado, para que nenhum caso toque o projeto real nem dependa de rede.
  - [x] **VERIFY**: RED observado — `npm run test:tdd` reprova o arquivo inteiro por `Cannot find module` sobre `src/skills/`, e não por erro de escrita do caso.
  - [x] **EVIDENCE**: `npm run test:tdd` com 16 arquivos em RED e os 133 casos anteriores verdes; 50 casos marcados com `SPECSFY` sobre os dezesseis `AC`. Registrado na seção 12.
  - [x] **IMPROVE**: Conferir o conteúdo do diretório preexistente, e não só sua presença.

- [x] T010 [P] [TEST] [TDD] [US-022] Derivar de AC-028 o caso em tests/skills-install-falha.test.ts — Refs: US-022, FR-020, NFR-021, AC-028 — Depends: none
  - [x] **PREP**: Ler o Gherkin de AC-028 e fixar o critério: instalador indisponível produz relato de que o conjunto não foi instalado, sem afirmar sucesso, e o restante do setup segue.
  - [x] **EXECUTE**: Escrever o caso em `tests/skills-install-falha.test.ts`, com marcador `SPECSFY` por asserção, raízes em diretório temporário e o executor do instalador injetado, para que nenhum caso toque o projeto real nem dependa de rede.
  - [x] **VERIFY**: RED observado — `npm run test:tdd` reprova o arquivo inteiro por `Cannot find module` sobre `src/skills/`, e não por erro de escrita do caso.
  - [x] **EVIDENCE**: `npm run test:tdd` com 16 arquivos em RED e os 133 casos anteriores verdes; 50 casos marcados com `SPECSFY` sobre os dezesseis `AC`. Registrado na seção 12.
  - [x] **IMPROVE**: Injetar o executor em vez de depender do ambiente, para que o caso não passe por acidente numa máquina sem a ferramenta.

- [x] T011 [P] [TEST] [TDD] [US-020] Derivar de AC-029 o caso em tests/skills-idempotente.test.ts — Refs: US-020, FR-023, FR-026, NFR-020, AC-029 — Depends: none
  - [x] **PREP**: Ler o Gherkin de AC-029 e fixar o critério: a segunda execução mantém uma entrada por conjunto e não remove conteúdo.
  - [x] **EXECUTE**: Escrever o caso em `tests/skills-idempotente.test.ts`, com marcador `SPECSFY` por asserção, raízes em diretório temporário e o executor do instalador injetado, para que nenhum caso toque o projeto real nem dependa de rede.
  - [x] **VERIFY**: RED observado — `npm run test:tdd` reprova o arquivo inteiro por `Cannot find module` sobre `src/skills/`, e não por erro de escrita do caso.
  - [x] **EVIDENCE**: `npm run test:tdd` com 16 arquivos em RED e os 133 casos anteriores verdes; 50 casos marcados com `SPECSFY` sobre os dezesseis `AC`. Registrado na seção 12.
  - [x] **IMPROVE**: Passar o registro anterior de fato: na fatia 1b a idempotência existia no código e não funcionava pela linha de comando por falta disso.

- [x] T012 [P] [TEST] [TDD] [US-021] Derivar de AC-030 o caso em tests/skills-doctor-garantia.test.ts — Refs: US-021, FR-024, NFR-021, AC-030 — Depends: none
  - [x] **PREP**: Ler o Gherkin de AC-030 e fixar o critério: o relato informa que a referência não é fixada pela origem e não promete conteúdo idêntico entre máquinas.
  - [x] **EXECUTE**: Escrever o caso em `tests/skills-doctor-garantia.test.ts`, com marcador `SPECSFY` por asserção, raízes em diretório temporário e o executor do instalador injetado, para que nenhum caso toque o projeto real nem dependa de rede.
  - [x] **VERIFY**: RED observado — `npm run test:tdd` reprova o arquivo inteiro por `Cannot find module` sobre `src/skills/`, e não por erro de escrita do caso.
  - [x] **EVIDENCE**: `npm run test:tdd` com 16 arquivos em RED e os 133 casos anteriores verdes; 50 casos marcados com `SPECSFY` sobre os dezesseis `AC`. Registrado na seção 12.
  - [x] **IMPROVE**: Afirmar sobre o texto do relato o que a spec exige dele, para que a limitação não desapareça numa reescrita futura.

- [x] T013 [P] [TEST] [TDD] [US-022] Derivar de AC-031 o caso em tests/skills-install-parcial.test.ts — Refs: US-022, FR-020, NFR-021, AC-031 — Depends: none
  - [x] **PREP**: Ler o Gherkin de AC-031 e fixar o critério: execução interrompida no meio não gera entrada no registro e é relatada como não instalada.
  - [x] **EXECUTE**: Escrever o caso em `tests/skills-install-parcial.test.ts`, com marcador `SPECSFY` por asserção, raízes em diretório temporário e o executor do instalador injetado, para que nenhum caso toque o projeto real nem dependa de rede.
  - [x] **VERIFY**: RED observado — `npm run test:tdd` reprova o arquivo inteiro por `Cannot find module` sobre `src/skills/`, e não por erro de escrita do caso.
  - [x] **EVIDENCE**: `npm run test:tdd` com 16 arquivos em RED e os 133 casos anteriores verdes; 50 casos marcados com `SPECSFY` sobre os dezesseis `AC`. Registrado na seção 12.
  - [x] **IMPROVE**: Provocar o término com erro pelo executor injetado, exercitando o caminho real de falha.

- [x] T014 [P] [TEST] [TDD] [US-020] Derivar de AC-032 o caso em tests/skills-nao-destrutivo.test.ts — Refs: US-020, FR-021, FR-022, FR-026, NFR-020, NFR-022, AC-032 — Depends: none
  - [x] **PREP**: Ler o Gherkin de AC-032 e fixar o critério: recusa por conflito e reexecução preservam o conteúdo inteiro, e nada fora da raiz é tocado.
  - [x] **EXECUTE**: Escrever o caso em `tests/skills-nao-destrutivo.test.ts`, com marcador `SPECSFY` por asserção, raízes em diretório temporário e o executor do instalador injetado, para que nenhum caso toque o projeto real nem dependa de rede.
  - [x] **VERIFY**: RED observado — `npm run test:tdd` reprova o arquivo inteiro por `Cannot find module` sobre `src/skills/`, e não por erro de escrita do caso.
  - [x] **EVIDENCE**: `npm run test:tdd` com 16 arquivos em RED e os 133 casos anteriores verdes; 50 casos marcados com `SPECSFY` sobre os dezesseis `AC`. Registrado na seção 12.
  - [x] **IMPROVE**: Cobrir os três caminhos no mesmo caso, porque a garantia é sobre o conjunto deles e não sobre cada um isolado.

- [x] T015 [P] [TEST] [TDD] [US-020] Derivar de AC-033 o caso em tests/skills-inventory-symlink.test.ts — Refs: US-020, FR-021, FR-022, NFR-022, AC-033 — Depends: none
  - [x] **PREP**: Ler o Gherkin de AC-033 e fixar o critério: um diretório de skills que é link para fora do projeto é reportado como inválido, com a razão citando o confinamento.
  - [x] **EXECUTE**: Escrever o caso em `tests/skills-inventory-symlink.test.ts`, com marcador `SPECSFY` por asserção, raízes em diretório temporário e o executor do instalador injetado, para que nenhum caso toque o projeto real nem dependa de rede.
  - [x] **VERIFY**: RED observado — `npm run test:tdd` reprova o arquivo inteiro por `Cannot find module` sobre `src/skills/`, e não por erro de escrita do caso.
  - [x] **EVIDENCE**: `npm run test:tdd` com 16 arquivos em RED e os 133 casos anteriores verdes; 50 casos marcados com `SPECSFY` sobre os dezesseis `AC`. Registrado na seção 12.
  - [x] **IMPROVE**: Criar o link no caso, em diretório temporário, para exercitar a detecção e não a suposição.

- [x] T016 [P] [TEST] [TDD] [US-021] Derivar de AC-034 o caso em tests/skills-source-oficial.test.ts — Refs: US-021, FR-023, FR-025, AC-034 — Depends: none
  - [x] **PREP**: Ler o Gherkin de AC-034 e fixar o critério: a origem gravada no registro é a oficial e nenhuma outra aparece.
  - [x] **EXECUTE**: Escrever o caso em `tests/skills-source-oficial.test.ts`, com marcador `SPECSFY` por asserção, raízes em diretório temporário e o executor do instalador injetado, para que nenhum caso toque o projeto real nem dependa de rede.
  - [x] **VERIFY**: RED observado — `npm run test:tdd` reprova o arquivo inteiro por `Cannot find module` sobre `src/skills/`, e não por erro de escrita do caso.
  - [x] **EVIDENCE**: `npm run test:tdd` com 16 arquivos em RED e os 133 casos anteriores verdes; 50 casos marcados com `SPECSFY` sobre os dezesseis `AC`. Registrado na seção 12.
  - [x] **IMPROVE**: Conferir o conjunto inteiro de origens registradas, e não apenas a presença da oficial.

- [x] T017 [P] [TEST] [TDD] [US-022] Derivar de AC-035 o caso em tests/skills-source-arbitraria.test.ts — Refs: US-022, FR-025, NFR-021, AC-035 — Depends: none
  - [x] **PREP**: Ler o Gherkin de AC-035 e fixar o critério: origem que não a oficial é recusada com a explicação, e nada é baixado nem instalado.
  - [x] **EXECUTE**: Escrever o caso em `tests/skills-source-arbitraria.test.ts`, com marcador `SPECSFY` por asserção, raízes em diretório temporário e o executor do instalador injetado, para que nenhum caso toque o projeto real nem dependa de rede.
  - [x] **VERIFY**: RED observado — `npm run test:tdd` reprova o arquivo inteiro por `Cannot find module` sobre `src/skills/`, e não por erro de escrita do caso.
  - [x] **EVIDENCE**: `npm run test:tdd` com 16 arquivos em RED e os 133 casos anteriores verdes; 50 casos marcados com `SPECSFY` sobre os dezesseis `AC`. Registrado na seção 12.
  - [x] **IMPROVE**: Cobrir mais de uma forma de origem inválida, para que a regra não fique presa a um literal.

#### Fase 3 — Código, cada tarefa atrás do seu RED

- [x] T018 [CODE] [US-022] Implementar em src/skills/source.ts — Refs: US-022, FR-025, AC-026, AC-034, AC-035 — Depends: T008, T016, T017
  - [x] **PREP**: RED confirmado em T008, T016 e T017; `docs/` reconstruído por `$specsfy-documentator` antes da alteração.
  - [x] **EXECUTE**: `src/skills/source.ts` nomeia `OFFICIAL_SOURCE` numa constante e devolve resultado discriminado para qualquer outra origem, sem lançar. Não importa `node:fs`, de modo que a regra é exercitável sem instalar nada.
  - [x] **VERIFY**: Os casos de `skills-source-terceiro` e `skills-source-arbitraria` passam a GREEN. `npx tsc --noEmit` em exit 0. `grep` por `process.cwd` e `process.env` no arquivo devolve zero.
  - [x] **EVIDENCE**: Comandos, contagem e o resultado do `grep` registrados na seção 12.
  - [x] **IMPROVE**: A mensagem de recusa nomeia a origem aceita e diz que a recebida não é reconhecida na mesma frase, atendendo às duas asserções sem duplicar texto.

  <!-- specsfy:evidence {"task": "T018", "refs": ["US-022", "FR-025", "AC-026", "AC-034", "AC-035"], "files": ["src/skills/source.ts"], "commands": [{"run": "npm run test:tdd", "exit": 0}, {"run": "npx tsc --noEmit", "exit": 0}]} -->

- [x] T019 [CODE] [US-020] Implementar em src/skills/inventory.ts — Refs: US-020, FR-021, FR-022, NFR-020, NFR-022, AC-021, AC-032, AC-033 — Depends: T003, T014, T015
  - [x] **PREP**: RED confirmado em T003, T014 e T015; `docs/` reconstruído antes da alteração.
  - [x] **EXECUTE**: `src/skills/inventory.ts` enumera os conjuntos sob `.claude/skills/` e detecta link simbólico em qualquer nível, devolvendo o resultado inválido com a razão. Recebe a raiz por parâmetro.
  - [x] **VERIFY**: `skills-inventory-symlink` e `skills-install-copia` passam a GREEN. `grep` por `process.cwd` e `process.env` devolve zero.
  - [x] **EVIDENCE**: Comandos, contagem e o resultado do `grep` registrados na seção 12.
  - [x] **IMPROVE**: A varredura desce a árvore inteira em vez de parar no primeiro nível, porque link aninhado tira conteúdo do projeto do mesmo modo.

  <!-- specsfy:evidence {"task": "T019", "refs": ["US-020", "FR-021", "FR-022", "NFR-020", "NFR-022", "AC-021", "AC-032", "AC-033"], "files": ["src/skills/inventory.ts"], "commands": [{"run": "npm run test:tdd", "exit": 0}, {"run": "npx tsc --noEmit", "exit": 0}]} -->

- [x] T020 [CODE] [US-020] Implementar em src/skills/install.ts — Refs: US-020, US-022, FR-020, FR-026, NFR-021, AC-020, AC-027, AC-028, AC-031 — Depends: T002, T009, T010, T013, T018, T019
  - [x] **PREP**: RED confirmado em T002, T009, T010 e T013, com T018 e T019 em GREEN; `docs/` reconstruído antes da alteração.
  - [x] **EXECUTE**: `src/skills/install.ts` resolve a origem, enumera com `--list`, recusa conflito antes de escrever e só então instala com alvo restrito, cópia e sem interação. Nenhuma forma global é construída no arquivo.
  - [x] **VERIFY**: Os casos de `skills-install-alvo`, `skills-conflito`, `skills-install-falha` e `skills-install-parcial` passam a GREEN.
  - [x] **EVIDENCE**: Comandos, contagens e as saídas dos caminhos de falha registrados na seção 12.
  - [x] **IMPROVE**: O caso de conflito exigiu enumerar antes de escrever: descobrir o conflito depois seria descobri-lo já tendo sobrescrito. O `--list` da CLI real cobre isso, e o executor do teste passou a modelá-lo.

  <!-- specsfy:evidence {"task": "T020", "refs": ["US-020", "US-022", "FR-020", "FR-022", "FR-026", "NFR-021", "NFR-022", "AC-020", "AC-022", "AC-027", "AC-028", "AC-031"], "files": ["src/skills/install.ts", "tests/skills-fixtures.ts"], "commands": [{"run": "npm run test:tdd", "exit": 0}, {"run": "npx tsc --noEmit", "exit": 0}]} -->

- [x] T021 [CODE] [US-021] Implementar em src/skills/record.ts — Refs: US-021, FR-023, FR-024, NFR-020, AC-023, AC-029, AC-030, AC-032, AC-034 — Depends: T005, T011, T012, T014, T016, T019
  - [x] **PREP**: RED confirmado em T005, T011, T012, T014 e T016, com T019 em GREEN; `docs/` reconstruído antes da alteração.
  - [x] **EXECUTE**: `src/skills/record.ts` lê o lockfile do instalador, converte em entradas do registro, compara o registrado com o presente e devolve o relato com a declaração de garantia. Nenhuma escrita.
  - [x] **VERIFY**: `skills-registro`, `skills-doctor-presenca`, `skills-doctor-deriva`, `skills-doctor-garantia`, `skills-idempotente` e `skills-source-oficial` passam a GREEN, com a suíte inteira em 181 de 181 casos e 53 de 53 arquivos.
  - [x] **EVIDENCE**: Comandos, contagens e a comparação da árvore antes e depois registrados na seção 12.
  - [x] **IMPROVE**: A procedência é lida do lockfile e nunca recalculada, conforme `DEC-028`. O hash por skill já vem computado pelo instalador, e duplicá-lo criaria duas verdades sobre o mesmo conteúdo.

  <!-- specsfy:evidence {"task": "T021", "refs": ["US-021", "FR-023", "FR-024", "NFR-020", "AC-023", "AC-029", "AC-030", "AC-032", "AC-034"], "files": ["src/skills/record.ts", "tests/skills-confinamento.test.ts", "tests/skills-nao-destrutivo.test.ts"], "commands": [{"run": "npm run test:tdd", "exit": 0}, {"run": "npx tsc --noEmit", "exit": 0}]} -->

- [x] T022 [CODE] [US-020] Implementar em src/setup/run.ts — Refs: US-020, FR-020, FR-026, AC-020, AC-029 — Depends: T020, T021
  - [x] **PREP**: T020 e T021 em GREEN; `docs/` reconstruído antes da alteração.
  - [x] **EXECUTE**: `SetupOptions` ganhou `skills`, opcional, no mesmo padrão de `bridgeEnv`: ausente, a instalação é pulada. `runSetup` calcula a raiz uma vez, repassa o registro anterior lido do lockfile e junta o relato dos conjuntos ao dos hooks.
  - [x] **VERIFY**: A suíte inteira segue em 181 de 181 casos e 53 de 53 arquivos, incluindo os 133 anteriores. `npx tsc --noEmit` e `npm run build` em exit 0.
  - [x] **EVIDENCE**: Comandos, contagem e a forma do relato registrados na seção 12.
  - [x] **IMPROVE**: Descobri que `installSkills` estava declarada assíncrona sem necessidade: nada nela aguarda, e o executor real será síncrono. Mantê-la assim obrigaria `runSetup` a virar assíncrona e quebraria os 133 casos existentes. Passou a síncrona, e os casos que a aguardavam seguem válidos porque `await` sobre valor comum resolve para ele.

  <!-- specsfy:evidence {"task": "T022", "refs": ["US-020", "FR-020", "FR-026", "AC-020", "AC-029"], "files": ["src/setup/run.ts", "src/skills/install.ts"], "commands": [{"run": "npm run test:tdd", "exit": 0}, {"run": "npx tsc --noEmit", "exit": 0}, {"run": "npm run build", "exit": 0}]} -->

- [x] T023 [CODE] [US-021] Implementar em src/doctor.ts — Refs: US-021, FR-024, AC-024, AC-025, AC-030 — Depends: T006, T007, T012, T021
  - [x] **PREP**: RED confirmado em T006, T007 e T012, com T021 em GREEN; `docs/` reconstruído antes da alteração.
  - [x] **EXECUTE**: `inspectDependencies` passou a aceitar uma raiz opcional e, quando informada, acrescenta ao relatório os conjuntos, a declaração de garantia e a divergência, combinando o código de saída. Sem raiz, o comportamento anterior é preservado inteiro. `cli.ts` passa a raiz do processo, que é legítima ali: quem executa o comando está no projeto.
  - [x] **VERIFY**: Os casos do `doctor` passam a GREEN e a suíte segue em 181 de 181. `grep` por escrita em `src/doctor.ts` não devolve ocorrência.
  - [x] **EVIDENCE**: Comandos, contagem e o resultado do `grep` registrados na seção 12.
  - [x] **IMPROVE**: A raiz é parâmetro opcional em vez de obrigatório, para que as chamadas existentes continuem válidas sem edição e o `doctor` siga utilizável sem projeto.

  <!-- specsfy:evidence {"task": "T023", "refs": ["US-021", "FR-024", "AC-024", "AC-025", "AC-030"], "files": ["src/doctor.ts", "src/cli.ts"], "commands": [{"run": "npm run test:tdd", "exit": 0}, {"run": "npx tsc --noEmit", "exit": 0}, {"run": "npm run build", "exit": 0}]} -->

- [x] T028 [TEST] [TDD] [US-021] Derivar de AC-023 o caso de persistência em tests/skills-registro-persistido.test.ts — Refs: US-021, FR-023, AC-023 — Depends: T021
  - [x] **PREP**: Reler o Gherkin de AC-023 e a seção 9: `o registro de instalação` é `.common-rules/install.json`, e não o lockfile do instalador. O caso de T005 afirma sobre o valor devolvido pela leitura, e não sobre o disco.
  - [x] **EXECUTE**: Escrever o caso em `tests/skills-registro-persistido.test.ts`, conferindo que o arquivo do projeto ganha a lista `skills` com nome, origem, procedência e momento, e que a lista `hooks` permanece.
  - [x] **VERIFY**: RED observado — dois dos três casos reprovam porque a lista `skills` não existe no arquivo gravado; o terceiro passa porque os sete hooks já são persistidos.
  - [x] **EVIDENCE**: `npx vitest run tests/skills-registro-persistido.test.ts` com 2 reprovando e 1 aprovando. Registrado na seção 12.
  - [x] **IMPROVE**: A lacuna existia porque o caso original conferia o retorno da função em vez do arquivo escrito. É o mesmo defeito que a fatia 1b descobriu tarde, e a correção segue a mesma direção: afirmar sobre o disco.

- [x] T029 [CODE] [US-021] Persistir a lista skills em src/setup/record.ts e src/setup/run.ts — Refs: US-021, FR-023, AC-023, AC-029 — Depends: T028
  - [x] **PREP**: T028 em RED; `docs/` reconstruído antes da alteração.
  - [x] **EXECUTE**: `InstallRecord` ganhou a lista opcional `skills`, e `runSetup` foi reordenado: a instalação passou a preceder a montagem do registro, porque é o lockfile que ela produz que fornece a procedência gravada. Montar o registro antes deixaria a lista vazia.
  - [x] **VERIFY**: A suíte fecha em 184 de 184 casos e 54 de 54 arquivos. `npx tsc --noEmit` e `npm run build` em exit 0.
  - [x] **EVIDENCE**: Comandos, contagens e o conteúdo gravado registrados na seção 12.
  - [x] **IMPROVE**: A lacuna existia porque o caso de `AC-023` afirmava sobre o valor devolvido pela leitura do lockfile, e a spec distingue esse arquivo do registro do projeto. Ler o Gherkin com a seção 9 ao lado teria evitado; passei a conferir o vocabulário da seção 9 antes de escrever casos que citam "o registro".

  <!-- specsfy:evidence {"task": "T029", "refs": ["US-021", "FR-023", "AC-023", "AC-029"], "files": ["src/setup/record.ts", "src/setup/run.ts"], "commands": [{"run": "npm run test:tdd", "exit": 0}, {"run": "npx tsc --noEmit", "exit": 0}, {"run": "npm run build", "exit": 0}]} -->

#### Fase 4 — Fechamento

- [x] T024 [DOC] Registrar instalador, módulos e ampliação do registro em .specsfy/STACK.md — Refs: FR-020 — Depends: T022, T023
  - [x] **PREP**: Mudanças de estrutura conferidas: quatro arquivos em `src/skills/`, a dependência nova e a lista acrescentada ao registro.
  - [x] **EXECUTE**: `.specsfy/STACK.md` ganhou a seção `Conjuntos de skills`, com a responsabilidade de cada módulo. A dependência já havia entrado antes, quando o monitor a cobrou.
  - [x] **VERIFY**: `build_documentation --check` em exit 0 e o monitor de contexto em `CURRENT`.
  - [x] **EVIDENCE**: Comandos e exit codes registrados na seção 12.
  - [x] **IMPROVE**: A seção registra por que a instalação usa cópia e não link, e que a entrega dá rastreabilidade e não reprodutibilidade, para que nenhuma das duas precise ser redescoberta.

- [x] T025 [DOC] Descrever em PROJECT.md que o setup instala os dois conjuntos — Refs: US-020 — Depends: T022, T023
  - [x] **PREP**: Localizadas as linhas do `setup` e do `doctor` na tabela de comandos.
  - [x] **EXECUTE**: `PROJECT.md` descreve os dois ecossistemas lado a lado, a cópia real, a procedência no registro e o relato de deriva sem reparo. As duas linhas da tabela de comandos foram atualizadas.
  - [x] **VERIFY**: `build_documentation --check` em exit 0, e a afirmação conferida contra a superfície real.
  - [x] **EVIDENCE**: Comando, exit code e o trecho alterado registrados na seção 12.
  - [x] **IMPROVE**: Conferi de passagem as contagens escritas à mão no arquivo, defeito que já apareceu duas vezes; a linha de módulos e testes foi corrigida na auditoria anterior e segue correta.

- [x] T026 [DOC] Registrar em .gitignore a decisão sobre versionar skills-lock.json — Refs: FR-023 — Depends: T021
  - [x] **PREP**: Retomado o achado D4 do Definition Gate, agora com a persistência já implementada em T029.
  - [x] **EXECUTE**: O `.gitignore` registra a decisão de manter o `skills-lock.json` ignorado, com a razão: é artefato de ferramenta, regenerável, escrito também por uma dependência, e a procedência que este produto controla passou a viver em `.common-rules/install.json`.
  - [x] **VERIFY**: `git status --porcelain` não mostra o arquivo, e o comentário descreve a decisão e sua reversibilidade.
  - [x] **EVIDENCE**: Trecho alterado e saída de `git status` registrados na seção 12.
  - [x] **IMPROVE**: A decisão só ficou clara depois de T029: sem a persistência no registro do projeto, manter o lockfile ignorado teria perdido a procedência. A ordem das tarefas escondeu isso, e a dependência de T026 em T021 deveria ter sido em T029.

- [x] T027 [OPS] Fechar o Delivery Gate na seção 13 de specs/completed/0005-fatia-1h-skills-lado-a-lado/spec.md — Refs: NFR-020, NFR-021, NFR-022 — Depends: T024, T025, T026, T029
  - [x] **PREP**: Vinte e oito tarefas concluídas, e cada `[CODE]` com seu comentário de evidência.
  - [x] **EXECUTE**: Suíte completa, `npm run verify`, e os auditores de aceite, evidência, rastreabilidade e research.
  - [x] **VERIFY**: 184 casos em 54 arquivos; `tsc` e `build` em exit 0; `verify` em exit 0 a partir de clone limpo, em 5s; diretório pessoal com 42 entradas antes e depois.
  - [x] **EVIDENCE**: Comandos, contagens, exit codes e a contagem do diretório pessoal registrados na seção 13.
  - [x] **IMPROVE**: Sete linhas da matriz seguiam marcadas como RED depois de os casos ficarem verdes, e só o `verify_acceptance` percebeu, acusando `AC-022` e `AC-032` sem resultado. Marcar a matriz junto de cada tarefa, e não no fechamento, evitaria — mas a tarefa que fecha os casos de confinamento não é a que os declara, e essa distância é a causa.

### 15. Ordem de execução

`T001` primeiro e sozinho: os casos que exercitam a instalação precisam do binário local, e fixá-lo antes evita que qualquer caso caia numa busca à ponta.

Em seguida a Fase 2 inteira, com as dezesseis tarefas em paralelo. Cada uma escreve num arquivo distinto de `tests/` e nenhuma depende das outras.

A Fase 3 segue a direção da dependência entre módulos. `T018` e `T019` são as únicas sem predecessor de código: a origem não toca o sistema de arquivos, e o inventário não conhece instalação nem registro. `T020` consome as duas, `T021` consome o inventário, e `T022` e `T023` apenas ligam o que já está pronto ao `setup` e ao `doctor` existentes.

Caminho crítico: `T001 → T003 → T019 → T021 → T023 → T024 → T027`. Sete das vinte e sete tarefas, passando por `T019` porque o inventário é predecessor tanto da instalação quanto do registro.

O fechamento admite paralelismo entre `T024`, `T025` e `T026`, que tocam arquivos diferentes, mas `T024` e `T025` precisam de `T022` e `T023` concluídas para descrever a superfície real em vez da planejada.

## Ato III — Entregar e validar

### 16. Dependências, riscos e suposições

#### Dependências

- Fatia 1b concluída, que fornece o `setup`, o registro e a detecção do alvo.
- Fatia 1a concluída, que fornece o `doctor` e a resolução em camadas.
- Pacote `skills`, da vercel-labs, declarado como dependência npm em versão exata, hoje 1.5.23, e invocado pelo binário local que ele expõe. Ele já chegava ao projeto por via transitiva, como dependência de `@promovaweb/specsfy` em faixa `^1.5.22`; declará-lo direto e exato o traz para dentro da regra de fixação, que a faixa transitiva não respeitava.

#### Riscos

- **Relatar instalação que não ocorreu** → é o defeito que a fatia 1b cometeu, quando o comando dizia ter instalado sete hooks sem escrever arquivo algum. Mitigação: `AC-028` e `AC-031` exigem que ausência e interrupção cheguem como erro, e a suíte confere o disco.
- **Conteúdo por link simbólico** → o hash deixaria de descrever o que o agente lê, e o ferramental do Specsfy recusa caminho por link. Mitigação: `FR-021` exige cópia, `AC-021` confere a ausência de links e `AC-033` trata link como inválido.
- **Prometer reprodutibilidade** → o instalador não a oferece, e afirmá-la seria falso. Mitigação: `NFR-021` e `AC-030` exigem que o relato declare o alcance real.
- **Origem de terceiro passar por oficial** → skills são instruções que entram no contexto do agente. Mitigação: `FR-025`, com `AC-026`, `AC-034` e `AC-035`.
- **Sobrescrita entre ecossistemas** → perderia conteúdo de um dos dois. Mitigação: `FR-026` e `AC-027`, que recusam em vez de resolver.
- **Instalar fora do projeto** → o instalador oferece a forma global, e a regra do projeto a proíbe. Mitigação: `FR-022` e a comparação da árvore do diretório do usuário.

#### Suposições

Registradas na seção 13, todas reversíveis.

### 17. Decisões

- **DEC-020**: Os dois ecossistemas ficam instalados e íntegros; o `common-rules` não escolhe entre eles. *Razão*: formulação direta de quem responde pelo produto. *Alternativas descartadas*: preterir um, mesclar conteúdos, ou tratar as skills como detectáveis à maneira dos backends de agente.
- **DEC-021**: A origem oficial é o instalador `skills` apontando para `mattpocock/skills`, e é a única aceita. *Razão*: o autor não publica no npm, e existe no registro uma republicação de terceiro com nome plausível apontando o repositório original nos metadados. *Alternativas descartadas*: consumir o pacote npm de terceiro; embutir cópia no próprio `common-rules`.
- **DEC-022**: A instalação usa cópia real, nunca link simbólico. *Razão*: `R-020` mostrou que o link é o padrão do instalador. Conteúdo por link vive fora do projeto, e então o hash não descreve o que o agente lê, duas máquinas divergem sem registro, e o ferramental do Specsfy recusa caminho por link.
- **DEC-023**: A procedência vive no registro que a fatia 1b já grava, e não em arquivo novo. *Razão*: é a mesma pergunta — o que este `setup` colocou aqui — e um segundo arquivo criaria duas verdades que divergem.
- **DEC-024**: A entrega dá rastreabilidade, não reprodutibilidade, e declara isso. *Razão corrigida por observação*: o instalador **grava** um lockfile com hash por skill, ao contrário do que a primeira leitura do README sugeria. O que ele não registra é referência de commit ou versão do conjunto, de modo que reexecutar continua buscando a ponta. O lockfile diz o que se obteve, não o que se deve obter. Registrar como limitação assumida evita que ela seja tratada como dívida a ser paga pelo épico de checksum, que também não a resolveria: checksum sobre arquivo que o mesmo processo escreve detecta divergência, não impede substituição.
- **DEC-027**: O instalador entra como dependência npm fixada em versão exata, e é invocado pelo binário local. *Razão*: `npx` em tempo de execução buscaria a ponta a cada chamada, o que contradiz a regra de fixação e a de preferir a cópia local. Fixá-lo o coloca na camada 1 da DEC-002, junto dos demais subsistemas npm. *Alternativa descartada*: invocação por `npx`, que deixaria o executável fora de qualquer garantia de versão.
- **DEC-028**: A procedência é lida do `skills-lock.json` do instalador, e o registro do `common-rules` a referencia em vez de recalculá-la. *Razão*: recalcular criaria duas verdades sobre o mesmo conteúdo, que divergem com o tempo. *Consequência a resolver no plano*: esse arquivo está hoje no `.gitignore` deste repositório, de modo que a procedência não seria versionada.
- **DEC-025**: O `doctor` relata e não repara. *Razão*: mantém a separação já decidida entre diagnosticar e reparar, e preserva a proibição de reparo destrutivo.
- **DEC-026**: Apenas o alvo Claude Code é instalado, e a forma global do instalador não é usada. *Razão*: o alvo decidido para o `setup` é Claude Code com detecção, e a regra do projeto proíbe escrever fora dele.

### 18. Definition of Done

- [x] `Definition Gate` está `Passed`.
- [x] `Plan Gate` está `Passed`.
- [x] `Delivery Gate` está `Passed`.
- [x] Todos os cenários `AC` aplicáveis passam.
- [x] Todos os requisitos possuem evidência de verificação registrada na seção 12.
- [x] Todas as tarefas da seção 14 estão concluídas.
- [x] Nenhuma entrada instalada é link simbólico, conferido por inspeção do sistema de arquivos.
- [x] O diretório do usuário tem a mesma árvore antes e depois da suíte.
- [x] Os três caminhos de falha do instalador foram exercitados e nenhum produz relato de sucesso.
- [x] `.specsfy/STACK.md` registra o instalador, os módulos novos e a ampliação do registro.
- [x] `PROJECT.md` descreve que o `setup` instala os dois conjuntos e o que o `doctor` passa a relatar.
