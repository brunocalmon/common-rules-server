# Aplicação e implementações

<!-- specsfy:documentator:start -->
## Superfícies

Categorias: Serviços, Rotas e APIs, Páginas, Componentes, Testes e Outras fontes.

Relação: relaciona cada arquivo observado à sua superfície.

| Categoria | Arquivo | Símbolos |
| --- | --- | --- |
| Outras fontes | src/approval/context.ts | TerminalContext, realTerminalContext, resolveChannel |
| Outras fontes | src/approval/decide.ts | DecisionSource, StdinReader, documentSource, interactiveSource, realSource, ApprovalResult, interpret |
| Outras fontes | src/approval/render.ts | PlannedItem, RenderedPlan, renderPlan |
| Outras fontes | src/cli.ts | CommandOutcome, formatReport, formatSetup, COMMANDS, ALIASES, resolveCommand, run |
| Outras fontes | src/doctor.ts | DependencyResult, Report, Environment, NPM_SUBSYSTEMS, PYTHON_SUBSYSTEM, NPM_HINT, PYTHON_HINT, pick |
| Outras fontes | src/hooks/claude-code.ts | TranslatedHook, EVENT_MAP, translateForClaudeCode, wrap, unwrap, FRAGMENT_START, FRAGMENT_END, PREAMBLE |
| Outras fontes | src/hooks/detect.ts | TargetEnvironment, Detection, TARGET, EVIDENCE, detectTarget |
| Outras fontes | src/hooks/source.ts | Hook, EVENTS, scalar, scriptFrom, readHook |
| Outras fontes | src/mcp/main.ts | — |
| Outras fontes | src/mcp/root.ts | PROJECT_MARKERS, validateRoot |
| Outras fontes | src/mcp/server.ts | SERVER_NAME, createServer |
| Outras fontes | src/mcp/tool.ts | TOOL_NAME, TOOL_DESCRIPTION, SetupToolResult, executeSetup |
| Outras fontes | src/setup/bridge.ts | PYTHON_SUBSYSTEM, PINNED_VERSION, VENV_DIR, BridgeEnvironment, BridgeResult, bridgePythonSubsystem |
| Outras fontes | src/setup/env.ts | detectEnvironment |
| Outras fontes | src/setup/record.ts | RecordEntry, SkillsRecordEntry, InstallRecord, RECORD_PATH, readRecord, writeRecord, entriesToRemove, matches |
| Outras fontes | src/setup/run.ts | TARGET_SETTINGS, SetupOptions, SetupResult, loadHooks, runSetup |
| Outras fontes | src/setup/write.ts | writeSettings, writeRecordFile, readRecordFile |
| Outras fontes | src/skills/install.ts | TARGET_AGENT, InstallOptions, InstallResult, installSkills |
| Outras fontes | src/skills/inventory.ts | SKILLS_DIR, SkillsInspection, inspectSkills |
| Outras fontes | src/skills/record.ts | LOCK_PATH, LockEntry, SkillRecordEntry, SkillReportRow, SkillReport, GUARANTEE_NOTE, readLock, toRecordEntries |
| Outras fontes | src/skills/source.ts | OFFICIAL_SOURCE, resolveSource |
| Outras fontes | src/telemetry/read.ts | readTrace |
| Outras fontes | src/telemetry/trace.ts | TRACE_ID_LENGTH, TraceSource, generateId, nowIso, realSource |
| Outras fontes | src/version.ts | readVersion |
| Testes | tests/aprovacao-contexto-canalizado.test.ts | — |
| Testes | tests/aprovacao-contexto-terminal.test.ts | — |
| Testes | tests/aprovacao-documento-aprova.test.ts | — |
| Testes | tests/aprovacao-documento-malformado.test.ts | — |
| Testes | tests/aprovacao-documento-recusa.test.ts | — |
| Testes | tests/aprovacao-documento-sem-campo.test.ts | — |
| Testes | tests/aprovacao-entrada-vazia.test.ts | — |
| Testes | tests/aprovacao-fixtures.ts | projeto, arvore, contextoFixo, decisaoFixa, decisaoQueLancaSeChamada, documentoFixo |
| Testes | tests/aprovacao-fonte-injetada.test.ts | — |
| Testes | tests/aprovacao-formas-equivalentes.test.ts | PLANO |
| Testes | tests/aprovacao-libera-escrita.test.ts | — |
| Testes | tests/aprovacao-padrao-producao.test.ts | — |
| Testes | tests/aprovacao-plano-apresentado.test.ts | — |
| Testes | tests/aprovacao-plano-fiel.test.ts | — |
| Testes | tests/aprovacao-recusa-preserva.test.ts | — |
| Testes | tests/aprovacao-sem-alvo.test.ts | — |
| Testes | tests/aprovacao-sem-mudanca.test.ts | — |
| Testes | tests/budget.test.ts | BUDGET_SECONDS |
| Testes | tests/build.test.ts | ROOT |
| Testes | tests/cycle-command.test.ts | ROOT |
| Testes | tests/cycle-failure.test.ts | ROOT |
| Testes | tests/cycle-timings.test.ts | ROOT |
| Testes | tests/doctor-missing.test.ts | — |
| Testes | tests/doctor-ok.test.ts | — |
| Testes | tests/hooks-blocking.test.ts | CORPUS, rodarGuard |
| Testes | tests/hooks-corpus.test.ts | CORPUS |
| Testes | tests/hooks-escape.test.ts | HOSTIL |
| Testes | tests/hooks-permissive.test.ts | CORPUS, rodarGuard |
| Testes | tests/hooks-raw-command.test.ts | HOOKS_SEM_BLOCO, comandoDeclarado |
| Testes | tests/hooks-translate.test.ts | CORPUS |
| Testes | tests/local-run.test.ts | ROOT |
| Testes | tests/manifest.test.ts | NPM_SUBSYSTEMS |
| Testes | tests/mcp-confinement.test.ts | — |
| Testes | tests/mcp-environment.test.ts | — |
| Testes | tests/mcp-failure.test.ts | raizSemPermissao |
| Testes | tests/mcp-fixtures.ts | projetoDescartavel, diretorioVazio, arvore |
| Testes | tests/mcp-idempotent.test.ts | — |
| Testes | tests/mcp-parity.test.ts | pelaLinhaDeComando |
| Testes | tests/mcp-root.test.ts | — |
| Testes | tests/mcp-surface.test.ts | conectar |
| Testes | tests/mcp-tool-install.test.ts | — |
| Testes | tests/mcp-tool-invalid-root.test.ts | — |
| Testes | tests/mcp-tool-missing-root.test.ts | — |
| Testes | tests/pinning.test.ts | PINNED |
| Testes | tests/scripts.test.ts | — |
| Testes | tests/setup-bridge.test.ts | — |
| Testes | tests/setup-detect.test.ts | — |
| Testes | tests/setup-dryrun.test.ts | — |
| Testes | tests/setup-idempotent.test.ts | — |
| Testes | tests/setup-install.test.ts | — |
| Testes | tests/setup-record.test.ts | — |
| Testes | tests/setup-revert.test.ts | — |
| Testes | tests/setup-surface.test.ts | PROIBIDOS |
| Testes | tests/setup-writes.test.ts | projeto |
| Testes | tests/skills-confinamento.test.ts | — |
| Testes | tests/skills-conflito.test.ts | comConflito |
| Testes | tests/skills-doctor-deriva.test.ts | projetoDivergente |
| Testes | tests/skills-doctor-garantia.test.ts | projetoInstalado |
| Testes | tests/skills-doctor-presenca.test.ts | projetoConsistente |
| Testes | tests/skills-fixtures.ts | CONJUNTO_SPECSFY, CONJUNTO_MATTPOCOCK, projetoComSkills, arvore, trocarPorLink, executorFalso, escreverLock, foraDoProjeto |
| Testes | tests/skills-idempotente.test.ts | — |
| Testes | tests/skills-install-alvo.test.ts | — |
| Testes | tests/skills-install-copia.test.ts | — |
| Testes | tests/skills-install-falha.test.ts | — |
| Testes | tests/skills-install-parcial.test.ts | — |
| Testes | tests/skills-inventory-symlink.test.ts | — |
| Testes | tests/skills-nao-destrutivo.test.ts | — |
| Testes | tests/skills-registro-persistido.test.ts | registroGravado |
| Testes | tests/skills-registro.test.ts | — |
| Testes | tests/skills-source-arbitraria.test.ts | — |
| Testes | tests/skills-source-oficial.test.ts | — |
| Testes | tests/skills-source-terceiro.test.ts | — |
| Testes | tests/surface.test.ts | PROIBIDOS |
| Testes | tests/trace-doctor-relata.test.ts | relatorio |
| Testes | tests/trace-doctor-sem-registro.test.ts | — |
| Testes | tests/trace-execucoes-distintas.test.ts | — |
| Testes | tests/trace-fixtures.ts | INSTANTE_FIXO, ID_FIXO, EPOCA, origemFixa, projeto, gravarRegistro, registroAntigo, arvore |
| Testes | tests/trace-forma.test.ts | — |
| Testes | tests/trace-gerador-deterministico.test.ts | traceCom |
| Testes | tests/trace-gerador-vazio.test.ts | registro |
| Testes | tests/trace-hooks-e-skills.test.ts | registroCompleto |
| Testes | tests/trace-instante-epoca.test.ts | comEpoca |
| Testes | tests/trace-instante-injetado.test.ts | — |
| Testes | tests/trace-marca-execucao.test.ts | registroDe |
| Testes | tests/trace-no-relato.test.ts | — |
| Testes | tests/trace-opacidade.test.ts | — |
| Testes | tests/trace-padrao-producao.test.ts | semInjecao |
| Testes | tests/trace-registro-antigo.test.ts | semTrace |
| Testes | tests/trace-relogio-deterministico.test.ts | instanteDe |
| Testes | tests/trace-sem-epoca.test.ts | entradas |
| Testes | tests/version.test.ts | ROOT |
| Outras fontes | vitest.config.ts | — |
<!-- specsfy:documentator:end -->
