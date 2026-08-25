# Aplicação e implementações

<!-- specsfy:documentator:start -->
## Superfícies

Categorias: Serviços, Rotas e APIs, Páginas, Componentes, Testes e Outras fontes.

Relação: relaciona cada arquivo observado à sua superfície.

| Categoria | Arquivo | Símbolos |
| --- | --- | --- |
| Outras fontes | src/cli.ts | CommandOutcome, formatReport, formatSetup, COMMANDS, ALIASES, resolveCommand, run |
| Outras fontes | src/doctor.ts | DependencyResult, Report, Environment, NPM_SUBSYSTEMS, PYTHON_SUBSYSTEM, NPM_HINT, PYTHON_HINT, pick |
| Outras fontes | src/hooks/claude-code.ts | TranslatedHook, EVENT_MAP, translateForClaudeCode, wrap, unwrap, FRAGMENT_START, FRAGMENT_END, PREAMBLE |
| Outras fontes | src/hooks/detect.ts | TargetEnvironment, Detection, TARGET, EVIDENCE, detectTarget |
| Outras fontes | src/hooks/source.ts | Hook, EVENTS, scalar, scriptFrom, readHook |
| Outras fontes | src/setup/bridge.ts | PYTHON_SUBSYSTEM, PINNED_VERSION, VENV_DIR, BridgeEnvironment, BridgeResult, bridgePythonSubsystem |
| Outras fontes | src/setup/env.ts | detectEnvironment |
| Outras fontes | src/setup/record.ts | RecordEntry, InstallRecord, RECORD_PATH, readRecord, writeRecord, entriesToRemove, matches |
| Outras fontes | src/setup/run.ts | TARGET_SETTINGS, SetupOptions, SetupResult, loadHooks, runSetup |
| Outras fontes | src/version.ts | readVersion |
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
| Testes | tests/hooks-translate.test.ts | CORPUS |
| Testes | tests/local-run.test.ts | ROOT |
| Testes | tests/manifest.test.ts | NPM_SUBSYSTEMS |
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
| Testes | tests/surface.test.ts | PROIBIDOS |
| Testes | tests/version.test.ts | ROOT |
| Outras fontes | vitest.config.ts | — |
<!-- specsfy:documentator:end -->
