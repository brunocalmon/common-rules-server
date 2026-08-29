# Backlog: Epic Phase 2: extensoes locais verificaveis e reparo assistido

| Metainformação | Valor |
| --- | --- |
| ID | BACKLOG-0004 |
| Status | Ready for specification |
| Produto | common-rules |
| Épico | Phase 2 — extensibilidade local |
| Funcionalidade | Extensões locais, reparo assistido e hidratação adiada |
| Tipo | épico |
| Prioridade | Posterior à Phase 1; não inicia antes de 1c, 1d e 1e |
| Milestones | |
| Criado em | 2026-08-29 |
| Spec promovida | Nenhuma |

## Ideia original

Do ADR 001, depois de descartado o que colide com decisões vinculantes: um diretório de extensões locais no repositório consumidor, com caminho único de escrita pela CLI e verificação por checksum; separação entre um doctor somente-leitura e um comando heal que repara; e hidratação de regras sob demanda. A pessoa responsável corrigiu quatro pontos do ADR na conversa: conformidade de versão em vez de imutabilidade do upstream; doctor permanece leitura e o reparo vira comando próprio, que move para quarentena e nunca apaga; recusa em voz alta no lugar de fallback silencioso; e a garantia do caminho único de escrita é detectabilidade, não prevenção de injeção.

## Problema percebido

Hoje não há como a pessoa ajustar um hook ou uma regra entregue pelo common-rules sem editar o arquivo que o setup escreve, o que a próxima execução sobrescreve. Não existe caminho para customização que sobreviva a uma reinstalação, nem forma de distinguir o que a ferramenta gerou do que alguém alterou à mão.

## Pessoa afetada ou beneficiada

A pessoa que mantém este repositório e precisa de hotfix local sem esperar release; e, por extensão, quem instalar o common-rules e quiser adaptar um guardrail ao próprio contexto.

## Resultado ou valor esperado

Customização local que sobrevive à reinstalação, divergência detectável em vez de silenciosa, e reparo explícito e reversível quando algo sai do lugar.

## Contexto

Deriva do ADR 001 capturado em specs/inbox/2026-08-29-145241. Sucede a Phase 1, cujas fatias 1c, 1d e 1e continuam abertas. Três propostas do ADR foram rejeitadas por colidirem com decisões já vinculantes, e a hidratação sob demanda foi adiada depois de medição que mostrou o Claude Code já entregando 17x de economia por conta própria.

## Referências relacionadas

| Caminho | Relação |
| --- | --- |
| `specs/inbox/2026-08-29-145241-adr-001-harness-extensivel-com-lazy-loading-shadow-dom-e-doctor-com-rollback.md` | origem — ADR completo, preservado sem alteração |
| `specs/backlog/0003-phase-1-mvp-typescript-subsistemas.md` | épico precedente — fatias 1c, 1d e 1e seguem abertas |
| `specs/completed/0002-phase-1a-esqueleto-typescript/spec.md` | limita — DEC-002 fixa a regra de resolução e a proibição de instalar globalmente |
| `specs/completed/0003-fatia-1b-setup-hooks/spec.md` | limita — DEC-001 estabelece que o `specsfy` é o motor de skills e o `common-rules` é wrapper; `hooks/` é a verdade única dos sete hooks |
| `specs/planned/0004-fatia-1f-servidor-mcp/spec.md` | limita — DEC-002 fixa recusar em vez de adivinhar diante de estado não confirmável |

## Comportamento esperado

Duas fatias ativas e uma adiada.

**Fatia A — extensões locais verificáveis.** A pessoa pede uma customização por uma skill de fachada, que não escreve nada e apenas aciona a CLI. A CLI resolve categoria, template e destino, grava o artefato e registra seu checksum. Numa execução seguinte, tudo que não veio por esse caminho aparece como divergente.

**Fatia B — reparo assistido.** O `doctor` continua estritamente somente-leitura, relata divergências e sai com código diferente de zero nomeando o que um reparo resolveria. Um comando próprio executa o reparo, movendo o arquivo divergente para quarentena antes de restaurar o original.

**Fatia C — camada de orquestração em `CLAUDE.md`.** Uma extensão escrita pelo
mesmo caminho único e ancorada pelo mesmo mecanismo das demais, que ensina o
agente a acionar os dois ecossistemas instalados pela fatia 1h em vez de o
`common-rules` escolher entre eles. `AGENTS.md` fica de fora até a fatia 1d
abrir a detecção de outros backends, e entrará como ponteiro mínimo para o
`CLAUDE.md`, sem duplicar conteúdo.

**Fatia D — hidratação sob demanda, adiada.** Volta quando uma segunda IDE entrar no escopo, e não antes. A medição da conversa mostrou que o Claude Code já entrega o comportamento por conta própria.

## Regras de negócio

- Todo artefato de extensão é escrito por um único caminho, a CLI. A skill de fachada captura intenção e aciona o comando; ela não grava arquivo nem registro.
- Divergência entre o arquivo e o checksum registrado produz recusa anunciada, que nomeia o arquivo e não aplica a extensão. Não há recuo silencioso.
- O reparo move o arquivo divergente para quarentena. Nunca apaga.
- O `doctor` não altera o sistema de arquivos sob nenhuma condição.
- Artefato escrito pelo `setup` não aceita a categoria `new`; aceita apenas `override` ou `extension`, e a tentativa de `new` é recusada com o motivo.
- Artefato customizado em conflito de nome gera anúncio e escolha entre pular e substituir, sem escolha padrão silenciosa.
- O escopo de propriedade é o que o próprio `setup` escreve: os sete hooks e seu registro. Artefato de dependência não é sobrescrito localmente.

## Critérios de aceitação

```gherkin
Scenario: extensão criada pelo caminho único permanece após reinstalação
  Given uma extensão criada pelo comando da CLI, com checksum registrado
  When o setup roda de novo sobre o mesmo projeto
  Then a extensão continua aplicada
  And o registro segue reconhecendo seu checksum

Scenario: arquivo alterado à mão é recusado em voz alta
  Given um artefato de extensão editado fora da CLI
  When o doctor examina o projeto
  Then ele nomeia o arquivo divergente
  And sai com código diferente de zero
  And nada no sistema de arquivos é alterado

Scenario: o reparo preserva o que substitui
  Given um artefato divergente apontado pelo doctor
  When o comando de reparo é executado
  Then o arquivo divergente existe na quarentena
  And o artefato original volta ao lugar
  And nenhum arquivo foi apagado

Scenario: artefato do setup não aceita categoria new
  Given um dos sete hooks que o setup escreve
  When alguém pede sua criação como new
  Then o comando recusa
  And explica que apenas override ou extension se aplicam a artefato gerenciado
```

## Qualidades e operação

- **Reversibilidade**: nenhuma operação desta entrega destrói conteúdo. Quarentena em vez de exclusão, sempre.
- **Detectabilidade**: a garantia do caminho único não é impedir que alguém escreva o arquivo, e sim que qualquer escrita fora dele apareça. Requisito e teste devem enunciar isso, e não "impede injeção de prompt".
- **Separação de responsabilidade**: diagnosticar e reparar são comandos distintos, para que a pessoa nunca perca dados ao pedir um diagnóstico.

## Dependências

- Phase 1 concluída, incluindo as fatias 1c, 1d e 1e, ainda abertas.
- SPEC-0004 entregue, já que o servidor MCP e a CLI compartilham a lógica que esta entrega estende.
- Um inventário de propriedade por dependência. O `specsfy` já publica o seu em `.specsfy/skills-lock.json`; falta confirmar se `context-mode` e `code-review-graph` publicam equivalente.

## Situações de erro

- Checksum ausente para arquivo presente no diretório de extensões → tratar como divergente e recusar, sem apagar.
- Quarentena não gravável → recusar o reparo inteiro em vez de reparar pela metade.
- Conflito de nome com artefato de dependência → recusar, apontando que o caminho é a montante.
- Registro de checksum corrompido → recusar e pedir reexecução do `setup`, sem reconstruir por inferência.

## Escopo

**Incluído**: camada de orquestração em `CLAUDE.md`, escrita pelo caminho único e ancorada como qualquer extensão; diretório de extensões locais no repositório consumidor; comando de criação com categorias `override`, `extension` e `new`; registro de checksum; skill de fachada que só aciona a CLI; `doctor` somente-leitura ampliado para relatar divergência; comando de reparo com quarentena.

**Fora de escopo**: `AGENTS.md`, que espera a fatia 1d; instalar os conjuntos de skills, que é da fatia 1h; instalar dependências no ambiente global, em qualquer forma; `doctor` que reverte, apaga ou muta; recuo silencioso diante de divergência; hidratação sob demanda, adiada até a entrada de uma segunda IDE; override de skills do `specsfy` ou de qualquer artefato de dependência; alvos de editor além do Claude Code, que pertencem à Phase 1.

## Dúvidas, decisões e riscos

**Decisões tomadas nesta rodada**

- **D1**: A hidratação sob demanda sai do caminho agora e volta amarrada à entrada de outra IDE. *Razão*: a medição mostrou o corpo das vinte SKILL.md em 137 KB contra 8 KB de frontmatter sempre ativo, ou seja, 17x de economia que a plataforma já entrega. O que resta de estático são cerca de 12 KB de `PROJECT.md`, `RULES.md` e `STACK.md`, que pertencem ao `specsfy`. O valor sobrevive apenas em IDEs que carregam arquivos de regra inteiros, e essas estão fora do escopo decidido.
- **D2**: Telemetria por `trace_id` não entra aqui. É pequena e aditiva, e vira fatia da Phase 1 junto do registro auditável que a fatia 1b já grava. O restante forma este épico de Phase 2.
- **D3**: A regra de resolução da SPEC-0002 não muda: preferir a cópia local, aceitar a global quando não houver local, nunca instalar globalmente. *Razão*: preferir a global faz o comportamento depender da máquina, que é justamente o que o `doctor` existe para tornar visível. Conformidade de versão não torna as duas ordens equivalentes, porque a global pode bater hoje e derivar amanhã sem que nada no projeto registre isso.
- **D5**: A camada de orquestração em `CLAUDE.md` pertence a este épico, e não à fatia 1h. *Razão*: é o roteador do sistema de override, da mesma família de âncoras e extensões desta entrega; colocá-la na fatia de instalação duplicaria mecanismo. Instalar os dois ecossistemas e registrar já tem valor de ponta a ponta sozinho. *Nota*: esta fatia escapou do refinamento inicial do ADR 001, onde constava como roteador de uma linha, e voltou por uma diretiva posterior.
- **D4**: O sistema de extensões cobre apenas os artefatos que o próprio `setup` escreve — os sete hooks e seu registro. *Razão*: estender a skills do `specsfy` violaria a imutabilidade do upstream e criaria um fork do motor de skills; escopo aberto a qualquer dependência não tem fronteira definida.

**Propostas do ADR rejeitadas, registradas para não serem herdadas**

- Instalar as ferramentas upstream em diretórios oficiais, contra a proibição de instalar globalmente na SPEC-0002.
- `doctor` que bloqueia, reverte ou exclui, capacidade destrutiva em comando de diagnóstico.
- "Fallback silencioso" diante de divergência, contra a decisão de recusar em vez de adivinhar.
- A afirmação de que o checksum impede injeção de prompt. O mesmo processo escreve o arquivo e o registro; a propriedade real é detectabilidade.

**Riscos**

- Sem inventário de propriedade por dependência, a proteção de `new` vira lista chumbada que envelhece a cada atualização do `specsfy`.
- Quarentena sem política de expiração acumula lixo indefinidamente.
- O formato das âncoras de injeção ainda não foi decidido, e escolha ruim aqui contamina todos os artefatos gerados.

## Pronto para desenvolvimento

Diagnóstico: o brief é suficiente para especificar as fatias A e B. A fatia C permanece adiada com gatilho nomeado. Não é autorização de implementação: o épico não começa antes de a Phase 1 fechar.

Decisões que a especificação ainda precisa tomar: formato das âncoras de injeção; onde vive a quarentena e se expira; se o reparo é subcomando do `doctor` ou comando irmão; e confirmação de que `context-mode` e `code-review-graph` publicam inventário de propriedade.

## Próximo passo

Fechar a Phase 1 antes de especificar este épico. A ordem imediata continua sendo implementar a SPEC-0004 a partir de T015, depois as fatias 1c, 1d, 1e e a fatia nova de telemetria.
