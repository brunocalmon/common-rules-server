"""Generates the project wiki for the Claude implementation branch."""

import shutil
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from wikigen import build, check_links

ROOT = Path(__file__).resolve().parents[2] / ".docs" / "wiki"

TICKETS = [
    ("TKT-001", "Unified resource parser", "Chore", "EPC-001", """
Replace the rule-only parser with one that reads every resource kind from a
single frontmatter format, and reports why a file was rejected instead of
returning nothing.

## Acceptance criteria

- [x] Parses `rule`, `skill`, `agent`, `workflow` and `loop`
- [x] Validates kind-specific fields: rule `type`, skill `trigger`, workflow `phases`, loop `wraps`
- [x] Normalises hyphenated relationship keys to underscores
- [x] Accepts both bare-string and mapping edge forms
- [x] Returns collected errors rather than a silent `None`
- [x] A `---` in the body does not truncate the file

## Why

The previous parser closed the frontmatter block at the first `---` anywhere in
the file, so any resource using a horizontal rule in its prose silently lost
everything after it. Because rejection returned `None`, a malformed resource was
indistinguishable from a missing one.

## Verification

`src/test/util/test_resource_parsing.py` — 18 cases including the truncation
regression and every rejection path.
"""),
    ("TKT-002", "Self-documenting configuration service", "Feature", "EPC-001", """
Write project configuration to `.common-rules-server/config.env` with every key
the server understands, each one explained.

## Acceptance criteria

- [x] Every schema key written, including empty ones
- [x] Every key preceded by an explanatory comment, with example or default
- [x] Keys with no safe default marked `NEEDS INPUT` and reported for a human
- [x] Build system and language auto-detected, with the evidence recorded
- [x] Rewriting preserves user values, user comments and unrecognised keys
- [x] Written atomically

## Why

A configuration file that lists bare `KEY=` lines teaches nothing, and the
requirement was explicit: always written, never omitted, defaults where they
apply, and a question where they do not.

## Verification

`src/test/service/test_config_service.py` — including a test that walks the
generated file and asserts every key has a comment above it.
"""),
    ("TKT-003", "Resource service with working placeholder resolution", "Feature", "EPC-001", """
Load built-in and project resources, resolve configuration placeholders, gate
optional resources, and validate the catalogue as a graph.

## Acceptance criteria

- [x] `{{KEY}}` resolved from configuration
- [x] Unknown keys left intact so report templates survive
- [x] A key present but empty counts as unresolved rather than blanking the text
- [x] Optional resources withheld until their `gate` flag is on
- [x] Project resources override built-ins of the same kind and name
- [x] Catalogue cached on file mtime and configuration
- [x] Integrity check reports dangling references and missing templates

## Why

The syntax mismatch documented in [FND-001](../findings/FND-001.md) meant no
placeholder had ever resolved. The whole configuration layer was inert and
nothing reported it.

## Verification

`src/test/service/test_resource_service.py`, plus a kit-wide test asserting no
shipped resource references a placeholder outside the configuration schema.
"""),
    ("TKT-004", "MCP tool surface", "Feature", "EPC-001", """
Expose `get_context`, `get_resource`, `create_resource`, `setup_config` and
`get_bdd_scenario` against the contract in the playbook.

## Acceptance criteria

- [x] `get_context` returns config, env status, resources, counts, overrides, gated, problems and integrity
- [x] `get_context` omits instruction bodies
- [x] `get_resource` attaches the output template and resolution status
- [x] `create_resource` writes under a kind directory and rejects unsafe names
- [x] Services constructed per call, not at import
- [x] No editor named anywhere in the server

## Why

Services built at import captured the working directory at process start, so
configuration changes needed a restart to take effect.

## Verification

`src/test/test_mcp_server.py`, including a check that all five tools are
registered with the server and every response is JSON-serialisable.
"""),
    ("TKT-005", "System rules and core skills", "Feature", "EPC-002", """
Write the always-applied rules and the core skills in natural language.

## Acceptance criteria

- [x] `general` and `orchestrator` rules, both type `Always`
- [x] 16 core skills covering discovery, build, verification, review and documentation
- [x] Every resource carries a relationship table in prose as well as YAML
- [x] No pseudo-code, no editor names
- [x] Companion servers referenced where they cut cost

## Verification

`src/test/test_default_kit_integrity.py` — parametrised across every file.
"""),
    ("TKT-006", "Agents, workflows and the loop", "Feature", "EPC-002", """
Write the subagent personas, the multi-phase workflows and the babysit loop.

## Acceptance criteria

- [x] 4 agents with persona, tools and constraints
- [x] 4 workflows with phases and explicit gates
- [x] 1 loop declaring what it wraps
- [x] Every phase references a skill that exists

## Verification

Graph validation in the integrity suite resolves every phase reference.
"""),
    ("TKT-007", "Optional resources behind configuration gates", "Feature", "EPC-002", """
Ship notebook, daily logbook, compliance, deviation and code-style resources that
stay out of the catalogue until enabled.

## Acceptance criteria

- [x] Each declares a `gate` naming a real configuration key
- [x] Withheld when the flag is off, admitted when on
- [x] `get_context` reports what was gated out and why

## Why

Putting the gate in the resource's own frontmatter rather than in a table inside
the server means a project can add a gated resource without changing code.
"""),
    ("TKT-008", "Output templates", "Chore", "EPC-002", """
One report skeleton per resource that produces output.

## Acceptance criteria

- [x] 29 templates, each under 30 lines
- [x] Every declared `output` reference resolves
- [x] No orphaned templates
- [x] Template fill-in slots survive placeholder resolution

## Verification

Integrity suite checks both directions: no missing template, no orphan.
"""),
    ("TKT-009", "Commit authorship protection", "Feature", "EPC-003", """
Install a `commit-msg` hook that removes AI-injected trailers so commit
authorship stays with the repository owner.

## Acceptance criteria

- [x] Hook installed by `setup_config`, on by default
- [x] Removes AI co-author and generated-with trailers
- [x] Preserves human co-author trailers
- [x] Locates hooks via git, handling worktrees and `core.hooksPath`
- [x] Preserves and chains an existing hook rather than overwriting it
- [x] Leaves no temporary file, even when every line is filtered
- [x] Removed cleanly when the setting is turned off

## Why

A `Co-authored-by` trailer attributes the commit on GitHub. Injecting one
without asking is a claim on authorship the owner never agreed to.

Human co-authorship is preserved because it is a true statement about who wrote
the code. The bug in [FND-012](../findings/FND-012.md) showed how easily that
distinction is lost.

## Verification

`src/test/service/test_git_hook_service.py` runs the generated hook as a real
subprocess, and makes a real commit to confirm git applies it.
"""),
    ("TKT-010", "Editor orchestration guidance", "Feature", "EPC-003", """
Detect the editor in use and write orchestration guidance where its agent reads.

## Acceptance criteria

- [x] Detects Cursor, Claude Code, Windsurf, Antigravity and plain AGENTS.md
- [x] Writes into a marked block, replaced in place on re-run
- [x] Content around the block preserved
- [x] Guidance names no editor
- [x] With nothing detected, asks rather than scattering files

## Why

An MCP server can only offer tools; it cannot make an agent use them well. The
gap closes with a rules file in the place the editor already reads.
"""),
    ("TKT-011", "Companion server detection", "Feature", "EPC-003", """
Report whether `code-review-graph` and `context-mode` are configured, and how to
add them.

## Acceptance criteria

- [x] Scans project and editor-wide MCP configuration
- [x] Reports what each companion is for and which resources use it
- [x] Constructs an entry only when it can do so with confidence
- [x] Writes nothing unless explicitly permitted
- [x] Backs the file up before any write, and never overwrites an entry

## Why

Editor-wide MCP configuration is shared by every project the user opens. A wrong
entry breaks tooling everywhere, not just here — see
[FND-006](../findings/FND-006.md), where invented package names were being
written into it automatically. The default is therefore to report.
"""),
    ("TKT-012", "Gherkin pagination service", "Feature", "EPC-004", """
Serve acceptance scenarios one at a time, each self-contained.

## Acceptance criteria

- [x] Handles `Scenario`, `Scenario Outline`, `Scenario Template` and `Example`
- [x] `Examples:` tables stay with their outline rather than counting as scenarios
- [x] Feature description and `Background` travel with every page
- [x] Tags attached to the right scenario
- [x] Out-of-range and non-numeric pages report the valid range

## Why

An agent handed a whole feature file skims it and reports success in aggregate.
Handed one scenario, it has to carry out those steps before asking for the next.

A page without its `Background` is not executable, which is why it is repeated
on every page rather than sent once.

## Verification

`src/test/service/test_bdd_service.py`, plus a test that walks this project's own
feature file end to end.
"""),
    ("TKT-013", "Acceptance scenarios with exact contracts", "Feature", "EPC-004", """
Write `agent_bdd.feature` covering every tool with real, unabbreviated contracts.

## Acceptance criteria

- [x] 37 scenarios across all five tools
- [x] Every field name and value exact; nothing elided, approximated or mocked
- [x] Error, boundary and security cases alongside happy paths
- [x] Commit authorship, editor guidance and companion behaviour covered
- [x] Shared setup in a single `Background`

## Why

Scenarios written against an assumed contract pass against a system that is
wrong. Every contract here was captured by calling the real tool and recording
what came back.
"""),
    ("TKT-014", "BDD resources", "Feature", "EPC-004", """
Skills, agent and workflow for generating, executing and reviewing scenarios.

## Acceptance criteria

- [x] `/bdd-generate`, `/bdd-run`, `/bdd-review`
- [x] `qa-engineer` agent
- [x] `bdd-cycle` workflow with gates
- [x] `/bdd-generate` requires `/grill-me` before writing scenarios

## Why

The required edge to `/grill-me` exists because scenarios derived from an
assumed contract encode the assumption and then pass, which manufactures
confidence rather than testing anything.
"""),
    ("TKT-022", "Post-implementation audit", "Chore", "EPC-006", """
Audit the finished system against how it actually behaves, rather than against
the tests that were written alongside it.

## Acceptance criteria

- [x] Generated hook scripts inspected as written to disk, not as source templates
- [x] Guards exercised against ordinary commands, not only hazards
- [x] Native export checked for references it cannot resolve
- [x] Files written by more than one feature checked for collisions
- [x] Whole package parsed against the oldest supported Python grammar
- [x] Every defect found recorded as a finding and fixed

## Why

The tests written alongside a feature encode the author's model of it. They pass
because the code does what the author thought it did. Six defects survived that
and were only found by looking at the artefacts the system produces —
[FND-017](../findings/FND-017.md) through [FND-027](../findings/FND-027.md).

Two of them made a feature completely inert while looking healthy, which is the
same failure mode as [FND-001](../findings/FND-001.md) in the previous
implementation. That recurrence is the argument for auditing output rather than
intent.

## Verification

781 tests. Each finding has a regression test named after the failure, and the audit steps themselves are now tests in `test_repository_health.py` so they keep running.
"""),
    ("TKT-018", "Native editor lifecycle hooks", "Feature", "EPC-006", """
Make hooks a resource kind, and generate native hook configuration for Cursor,
Claude Code and Antigravity from one definition.

## Acceptance criteria

- [x] `kind: hook` with a canonical event vocabulary and a shell block
- [x] Native config written for all three editors in their documented shapes
- [x] Self-contained scripts per editor, no runtime adapter, no `jq` dependency
- [x] Deny expressed the way each editor documents it
- [x] Hand-written hooks and unrelated settings preserved
- [x] An event an editor lacks is reported, not silently dropped
- [x] 6 default hooks shipped

## Why

Everything else in this kit is guidance the agent may follow. A rules file can be
skimmed, deprioritised or ignored, and nothing detects that.

A hook fires from the editor whether or not the agent cooperates. That is the
difference between asking for an automation and having one, and it is why the
session briefing is delivered this way rather than as another rule.

The three editors disagree on config location, event names, nesting and output
contract, so the hook is authored once against a canonical vocabulary and
translated at generation time.

## Verification

`src/test/service/test_hook_service.py` — 26 tests, executing the generated
scripts as subprocesses and asserting each editor's own contract.
"""),
    ("TKT-019", "Self-check questionnaire on every resource", "Feature", "EPC-006", """
Give every resource a `self_check` list, and a global rule defining how it is
extended and answered.

## Acceptance criteria

- [x] All 43 resources carry a questionnaire, specific rather than boilerplate
- [x] Surfaced by `get_context` and `get_resource`
- [x] Travels into every native export
- [x] `self-review` rule defines the protocol and the four standing questions
- [x] Test enforces that every resource has one and each entry is a question

## Why

An agent that is not asked reports completion from intent rather than from what
it did. The questionnaire converts "I implemented it" into a specific answerable
claim: did I watch the test fail, did I read this line by line, what did I not do.

It is deliberately not a file. It is the agent interrogating itself before
speaking, and writing the answers out is what makes a gap visible.
"""),
    ("TKT-020", "Session receipt as a global rule", "Feature", "EPC-006", """
Move the structured session receipt into the kit as an always-applied rule.

## Acceptance criteria

- [x] `session-receipt` rule, type `Always`
- [x] Receipt states request, resources, tools, files, self-check, verification, outstanding
- [x] `verification` must name something observed
- [x] `outstanding` dropped only when genuinely nothing is outstanding

## Why

The receipt was a per-user instruction living outside the kit, so it applied only
where that instruction was loaded. As a rule it ships with the kit and syncs into
every editor.

The verification field carries the weight: it forces the difference between "I
made the change" and "I ran this and saw that".
"""),
    ("TKT-021", "Full native export", "Feature", "EPC-006", """
Export the entire catalogue into each editor's native layout so the kit works
without the server running.

## Acceptance criteria

- [x] Cursor: `.cursor/rules/*.mdc`, `.cursor/skills/*/SKILL.md`, `.cursor/agents/*.md`
- [x] Claude Code: `.claude/skills/`, `.claude/agents/`, `CLAUDE.md`, `.claude/settings.json`
- [x] Antigravity: `.agents/skills/`, `AGENTS.md`, `.agents/hooks.json`
- [x] Workflows and loops exported as skills; Always rules into the always-read file
- [x] `disable-model-invocation` set for user-invoked skills on Claude
- [x] Nothing loadable left behind, asserted against the catalogue
- [x] Idempotent; user content around managed blocks preserved
- [x] `clean` removes only generated files
- [x] Entirely mechanical — no model involved, so no token cost

## Why

Reaching a resource through the server costs a tool call and its response every
time it is used. Reaching it natively costs nothing at run time, because the
editor loads it itself. Sync trades one regeneration step for zero per-use
overhead, and removes the server as a dependency.

## Verification

`src/test/service/test_sync_service.py` — 21 tests including a completeness
check that every catalogue entry appears in the written paths.
"""),
    ("TKT-015", "Test suite", "Chore", "EPC-005", """
Unit, functional and behavioural coverage across every service and the full API.

## Acceptance criteria

- [x] 457 tests passing
- [x] Git hook executed as a real subprocess and through a real commit
- [x] Default kit validated file by file and as a graph
- [x] Placeholder resolution tested against the real shipped resources
- [x] Path traversal and injection paths covered

## Why

The previous suite passed while placeholder resolution was completely broken,
because nothing tested the parser against a real resource file. Tests that only
exercise fixtures cannot catch a mismatch between code and content.
"""),
    ("TKT-016", "Wiki and reusable template", "Chore", "EPC-005", """
Rebuild the documentation template in English with working navigation, and write
this project's wiki against it.

## Acceptance criteria

- [x] Template in English, 17 pages
- [x] Every page carries breadcrumb and previous/next links
- [x] Zero broken links, verified by a link checker
- [x] Navigation derived from one ordered spine rather than hand-written
- [x] Project wiki follows the template

## Why

The inherited template was in Portuguese with 8 broken links pointing at pages
deleted during an earlier restructure. Deriving links from a single ordered list
makes that class of drift impossible.
"""),
    ("TKT-017", "Legacy removal and root README hub", "Chore", "EPC-005", """
Delete the pseudo-code rule set and reduce the root README to a hub.

## Acceptance criteria

- [x] Pseudo-code rules, old templates and the code-style XML removed
- [x] `rule_parsing.py`, `rule_service.py` and stale tests removed
- [x] Root README is a hub pointing into the wiki
- [x] A kit-wide test fails if pseudo-code reappears

## Why

Deleting the old rules is not enough on its own — without a test, the pattern
returns the next time someone wants determinism.
"""),
]

EPICS = [
    ("EPC-001", "Foundation — unified resource model", "Done", """
The server reads one resource format for every kind, resolves project
configuration into it, and exposes a tool surface built around how an agent
works rather than around the storage underneath.
""", ["TKT-001", "TKT-002", "TKT-003", "TKT-004"]),
    ("EPC-002", "Default kit", "Done", """
A complete set of rules, skills, agents, workflows, loops and output templates,
written in natural language, that a project can use unchanged or specialise.
""", ["TKT-005", "TKT-006", "TKT-007", "TKT-008"]),
    ("EPC-003", "Active orchestration", "Done", """
The server configures its surroundings rather than only answering questions: it
protects commit authorship, teaches the editor how to drive it, and reports on
the companion servers its resources assume.
""", ["TKT-009", "TKT-010", "TKT-011"]),
    ("EPC-004", "Agent BDD framework", "Done", """
Acceptance scenarios an agent executes against the real system, served one at a
time so each is carried out rather than skimmed.
""", ["TKT-012", "TKT-013", "TKT-014"]),
    ("EPC-006", "Enforcement and portability", "Done", """
Automations that hold whether or not the agent cooperates, a questionnaire every
resource must answer before reporting done, and a native export that lets the
whole kit run with the server switched off.
""", ["TKT-018", "TKT-019", "TKT-020", "TKT-021", "TKT-022"]),
    ("EPC-005", "Quality and documentation", "Done", """
Test coverage that would have caught the defects found in the previous
implementation, and documentation that stays navigable.
""", ["TKT-015", "TKT-016", "TKT-017"]),
]

FINDINGS = [
    ("FND-001", "Placeholder substitution never worked", "Critical", "Ticketed", """
`ResourceService._replace_placeholders` searched for `{{ KEY }}` with spaces,
while every resource in the kit is authored as `{{KEY}}` without them.

## Where

`src/common_rules_server/service/resource_service.py`, previous implementation.

## Why it matters

No placeholder in any resource ever resolved. Every `{{TEST_COMMAND}}`,
`{{WIKI_DIR}}` and `{{README_PATH}}` reached the agent as literal braces. The
entire configuration layer — the reason the config file exists — was inert, and
nothing raised, logged or reported it.

The test suite passed throughout, because no test ever ran the resolver against a
real resource file.

## Evidence

A census of the shipped resources found 51 placeholder occurrences, all in the
no-space form; the resolver matched none of them.

## Resolution

Fixed in [TKT-003](../tickets/TKT-003.md). Both forms now resolve, unknown keys
are preserved for report templates, and a kit-wide test asserts every shipped
placeholder corresponds to a real configuration key.
"""),
    ("FND-002", "create_resource collided kinds and did not sanitise names", "High", "Ticketed", """
Resources were written to `RESOURCES_DIR/<name>.md` with no kind directory, and
the name was interpolated into the path unchecked.

## Why it matters

Two problems. A rule and a skill with the same name overwrote each other
silently. And a name such as `../../etc/thing` would have escaped the resources
directory entirely, since nothing validated it.

The return value was also a string rather than the documented result object, so
a caller could not tell success from failure without parsing prose.

## Resolution

Fixed in [TKT-004](../tickets/TKT-004.md). Files land under `<kind>s/`, names
must be kebab-case, and the result is a structured object with validation
warnings.
"""),
    ("FND-003", "get_context returned a flat list", "High", "Ticketed", """
`get_context` returned a plain list of resource metadata, omitting configuration,
environment status, counts, overrides and integrity.

## Why it matters

The tool exists so that one call gives the agent everything it needs to orient.
Without configuration and environment status in the response, an agent could not
tell that a project was unconfigured, and would proceed against empty settings.

## Resolution

Fixed in [TKT-004](../tickets/TKT-004.md).
"""),
    ("FND-004", "get_resource omitted the output template", "Medium", "Ticketed", """
The response carried the parsed frontmatter and body but not the output template
the resource declared.

## Why it matters

Predictable output is a stated goal of the kit. A resource can name its template,
but if the agent never receives the content, it writes the report in whatever
shape it chooses.

## Resolution

Fixed in [TKT-004](../tickets/TKT-004.md).
"""),
    ("FND-005", "Frontmatter regex truncated resource bodies", "Medium", "Ticketed", """
The pattern `^---\\n(.*?)---\\n?(.*)` closed the frontmatter block at the first
`---` anywhere in the file rather than at a line boundary.

## Why it matters

Any resource whose prose used a horizontal rule silently lost everything after
it. The failure is invisible: the file parses, and the truncated body looks like
the whole resource.

## Resolution

Fixed in [TKT-001](../tickets/TKT-001.md), with a regression test.
"""),
    ("FND-006", "Companion installer wrote invented commands into shared editor config", "High", "Ticketed", """
`McpInstallerService.inject_mcps` wrote hardcoded `npx -y <package>@latest`
entries into the editor's MCP configuration automatically, for package names
that were assumed rather than verified.

## Why it matters

Editor-wide MCP configuration is shared by every project the user opens. On the
machine this was written for, those servers launch through a wrapper binary, not
npx — so the injected entries would have been wrong, and would have broken
tooling in every project, not just this one. It happened without consent, with no
backup, on every `setup_config` call.

## Resolution

Rewritten in [TKT-011](../tickets/TKT-011.md). Detection and reporting by
default, entries constructed only from evidence, writes gated behind explicit
consent, and the file backed up first.
"""),
    ("FND-007", "Commit hook was fragile in several ways", "Medium", "Ticketed", """
The previous hook appended its script to any existing hook file, producing a
second shebang mid-file; used `grep ... && mv`, which leaves a temporary file
behind whenever filtering removes every line; treated `.git` as necessarily a
directory, so worktrees and submodules reported "not a git repository"; and
ignored `core.hooksPath`.

## Resolution

Rewritten in [TKT-009](../tickets/TKT-009.md), located via git itself and tested
by running the hook as a subprocess and through a real commit.
"""),
    ("FND-008", "Gherkin reader missed outlines and dropped Background", "Medium", "Ticketed", """
The scenario pattern matched only `Scenario:`, so every `Scenario Outline:` was
invisible. Pages carried the scenario body alone, without the feature's
`Background`.

## Why it matters

A scenario served without its `Background` cannot be executed — the agent has
the assertions but not the setup they depend on.

## Resolution

Fixed in [TKT-012](../tickets/TKT-012.md).
"""),
    ("FND-009", "Configuration was written without explanations", "High", "Ticketed", """
`config.env` was generated as bare `KEY=value` lines with no comments.

## Why it matters

The requirement was explicit: always write every possible setting, with its
explanation. A file of bare keys tells the user which settings exist but not what
any of them do, or what a valid value looks like. Several playbook settings were
also missing from the schema entirely, so resources referencing them could never
resolve.

## Resolution

Fixed in [TKT-002](../tickets/TKT-002.md), with a test that walks the generated
file and asserts every key has an explanatory comment above it.
"""),
    ("FND-010", "Documentation template was untranslated with broken navigation", "Medium", "Ticketed", """
The inherited template was in Portuguese despite English being requested, and
contained 8 links to pages deleted during an earlier restructure
(`PRD.md`, `RFC.md`, `KPI.md`, `MILESTONES.md`, `USAGE.md`, and three
`../ROADMAP.md` references).

## Resolution

Rebuilt in [TKT-016](../tickets/TKT-016.md). Navigation is derived from a single
ordered spine and verified by a link checker, which makes this class of drift
impossible rather than merely fixed.
"""),
    ("FND-011", "Server identified itself by editor name", "Low", "Ticketed", """
Startup logged `Common Rules MCP (AntiGravity V2)`.

## Why it matters

Tool-agnosticism is a stated principle. Naming one editor in the server's own
identity contradicts it, and dates the software to whichever editor happened to
build it.

## Resolution

Fixed in [TKT-004](../tickets/TKT-004.md). A kit-wide test now fails if any
resource names an editor.
"""),
    ("FND-012", "Co-author filter erased human authorship", "Critical", "Ticketed", """
While building the commit hook, the AI-identity pattern matched unanchored
substrings. The token `amp` matched inside `example`, so a legitimate trailer —
`Co-authored-by: Ana Pereira <ana@example.com>` — was stripped.

## Why it matters

The hook exists to protect authorship. Silently deleting a real person's
co-author credit is a worse version of the problem it was written to solve, and
it would have been invisible: the commit simply lands without the trailer.

## Evidence

Caught by `test_human_co_author_trailer_is_preserved`, which was written
alongside the hook specifically to check that human trailers survive.

## Resolution

Fixed in [TKT-009](../tickets/TKT-009.md). Every identity is now delimited by a
non-alphanumeric boundary, and short collision-prone tokens are spelled out in
full. The filter errs towards leaving a trailer in place.
"""),
    ("FND-015", "Automations were guidance, not enforcement", "High", "Ticketed", """
The first implementation delivered a git `commit-msg` hook and called the
requirement for hooks met. That was a misreading: a git hook covers commits, and
the request was for editor lifecycle hooks — the mechanism Cursor, Claude Code
and Antigravity each provide for running logic on agent events.

## Why it matters

Everything the kit provided was guidance the agent could decline to follow. There
was no point at which the system acted on its own, so every automation depended
on the agent choosing to cooperate — which is exactly the guarantee that was
being asked for.

## Resolution

Fixed in [TKT-018](../tickets/TKT-018.md). Hooks are now a resource kind,
authored once and translated into each editor's native configuration. The git
hook remains, because it covers commits made outside the editor entirely.
"""),
    ("FND-016", "Antigravity was detected by state directories, not its config root", "Medium", "Ticketed", """
`IdeService` looked for `.antigravity` and `.gemini`, which are editor state
directories. The documented customization root is `.agents`.

## Why it matters

A project that used Antigravity correctly — with `.agents/` and nothing else —
was not detected, so it received no orchestration guidance, no hooks and no
native export. Found while testing sync against a project laid out the
documented way.

## Resolution

Fixed in [TKT-018](../tickets/TKT-018.md); `.agents` is now the primary marker.
"""),
    ("FND-017", "Hook escaping was consumed twice, so every guard allowed everything", "Critical", "Ticketed", """
Hook scripts are built from Python string templates that are written into a
source file and then parsed back out of it. Every backslash was therefore
unescaped twice, and the command-extraction `sed` reached the shell malformed.

## Why it matters

It matched nothing, so `HOOK_COMMAND` was always empty and every guard fell
through to allow. The secret guard, the destructive-command guard and the
authorship guard were all installed, all executable, all returning exit 0, and
all completely inert.

Nothing distinguished this from a system with no hazards present. The same shape
as [FND-001](FND-001.md): a layer that silently does nothing while reporting
success.

## Evidence

Reading the generated `.sh` on disk rather than the template that produced it.
The `tr '\n' ' '` had become a literal newline inside quotes.

## Resolution

Fixed in [TKT-022](../tickets/TKT-022.md). Templates are raw strings, and tests
now execute the generated scripts and assert on their decisions.
"""),
    ("FND-018", "Guards fired on ordinary commands", "High", "Ticketed", """
The guards matched substrings against the entire JSON payload. So
`git commit -m "remove rm -rf from the docs"` was treated as running `rm -rf`,
`cat notes.environment` matched the `.env` pattern, and a commit message
mentioning `printenv` was blocked as an environment dump.

## Why it matters

A guard that trips on ordinary work gets switched off, and a switched-off guard
protects nothing. The false positives are as damaging as the misses, and more
likely to be noticed.

## Resolution

Fixed in [TKT-022](../tickets/TKT-022.md). The command is extracted from the
payload's `command` field and matched at command position — start of string or
just after a separator. A 26-case matrix covers both hazards and the ordinary
commands that must pass.
"""),
    ("FND-019", "Exported resources named a template they could not reach", "Medium", "Ticketed", """
A synced skill carried `| output | templates/tdd.md |` in its relationship
table, but the export writes no templates directory.

## Why it matters

Natively there was nothing to fetch. Every exported resource instructed the
agent to produce a report in a shape it had no way to see, and predictable
output is the reason templates exist at all.

## Resolution

Fixed in [TKT-022](../tickets/TKT-022.md). The template is inlined into the
exported file with its fill-in slots intact; all 32 resources that declare an
output carry their shape.
"""),
    ("FND-020", "The post-edit hook ran a whole-project lint on every edit", "Medium", "Ticketed", """
`format-after-edit` ran `LINT_COMMAND`, which is typically a project-wide lint,
after every single file edit.

## Why it matters

On any real codebase that is seconds of latency per edit. A hook that slow gets
disabled, and then it catches nothing — the same end state as not having it.

## Resolution

Fixed in [TKT-022](../tickets/TKT-022.md). A new `LINT_FILE_COMMAND` lints only
the edited file, and the hook stays silent when it is unset rather than guessing
a per-file invocation. Hooks gained `HOOK_FILE` alongside `HOOK_COMMAND`.
"""),
    ("FND-021", "Syncing erased the guidance setup had just written", "Critical", "Ticketed", """
`setup_config` writes orchestration guidance into `CLAUDE.md` and `AGENTS.md`.
`sync_to_ide` writes the always-applied rules into the same files. Both used an
identically named managed block, so whichever ran second replaced the other's
content.

## Why it matters

Syncing silently deleted the instructions telling the agent how to work — the
most load-bearing text the kit produces. Running setup again then deleted the
synced rules. Neither reported anything, and both operations looked successful.

## Evidence

Running `setup_config()` then `sync_to_ide()` and grepping the result: the
guidance was gone, one managed block remained.

## Resolution

Fixed in [TKT-022](../tickets/TKT-022.md). Blocks are named, and the merge logic
lives in one helper instead of being reimplemented in both services.
"""),
    ("FND-022", "An f-string backslash broke the oldest supported Python", "Low", "Ticketed", """
A backslash inside an f-string expression is a syntax error before Python 3.12.
The project declares `requires-python = ">=3.11"`.

## Why it matters

It ran fine locally on 3.13 and in CI on 3.12, so nothing caught it. It would
have failed at import for anyone on the oldest version the project claims to
support.

## Resolution

Fixed in [TKT-022](../tickets/TKT-022.md), and the whole package is now parsed
against the 3.11 grammar as part of the audit.
"""),
    ("FND-023", "The wiki generator destroyed content it did not own", "Critical", "Ticketed", """
Regenerating the wiki wiped the whole `.docs/claude` tree and rebuilt it from the
page list, deleting `history/` — hand-written content that happens to live under
the same root.

## Why it matters

One run removed 3,541 lines while reporting only that documentation had been
updated. Nothing in the output suggested anything had been lost.

Same shape as [FND-021](FND-021.md): a tool that owns part of a shared location
behaving as though it owned all of it.

## Resolution

The generator preserves directories it does not generate, listed in `PRESERVE`,
and a test asserts the list still covers `history/`.
"""),
    ("FND-024", "Acceptance scenarios asserted counts the kit no longer had", "Medium", "Ticketed", """
`agent_bdd.feature` still stated 30 resources across five kinds after the kit had
grown to 38 across six.

## Why it matters

An agent executing those scenarios reports failures that are not real, which is
worse than having no coverage: it teaches the reader to discount the suite.

## Resolution

Counts corrected, and a test now reads them back out of the feature file and
fails the moment they drift. The scenarios keep exact literals — an agent
executing them needs something concrete to compare against — so the staleness is
caught mechanically instead of by weakening the assertions.
"""),
    ("FND-025", "Exported resources named tools that were not running", "Medium", "Ticketed", """
Six resources instruct using orchestration server tools. Read natively with the
server switched off — the situation the export exists to support — those
instructions dead-end.

## Why it matters

Same class as [FND-019](FND-019.md): the export was complete in what it copied
and incomplete in what that content could reach.

## Resolution

Each exported resource naming a server tool carries a 'Without the server'
section. A test asserts every tool referenced by any resource has a documented
fallback, so adding a tool later cannot silently reintroduce it.
"""),
    ("FND-026", "A switched-off resource reported as one that does not exist", "Medium", "Ticketed", """
Asking for a gated resource returned "No skill named 'notebook'".

## Why it matters

Technically true, practically misleading. The resource exists and is disabled; an
agent reading that concludes it must build the thing rather than that the user
must switch it on.

## Resolution

The error names the gate and the file to change, and says to ask the user before
altering project configuration. The generic not-found error also lists what is
gated off.
"""),
    ("FND-027", "A relative project root produced a blank project name", "Low", "Ticketed", """
`Path(".").name` is the empty string, so pointing the config service at a project
as `.` detected `PROJECT_NAME=''`.

## Why it matters

Every generated report would have carried a nameless project, and nothing would
have flagged it.

## Evidence

Found by making this repository use its own kit — the first time the service was
constructed with a relative root.

## Resolution

The root is resolved on construction.
"""),
    ("FND-013", "Companion install path is undocumented", "Low", "Open", """
`McpInstallerService` can only construct a launch entry when the companion binary
is already on `PATH`. Otherwise it reports low confidence and asks the user.

## Why it matters

The user still has to know how to install `code-review-graph` and `context-mode`.
The server can say they are missing and what they are for, but not how to obtain
them.

## Suggested fix

Record the canonical install method for each companion in its `COMPANION_INFO`
entry, so the report can include it. This needs the real distribution channel
confirmed rather than assumed — assuming one is exactly what caused
[FND-006](FND-006.md).

## Why it was not fixed now

It requires a fact this implementation does not have, and guessing it is the
failure this finding's neighbour documents.
"""),
    ("FND-014", "CI workflow verified against the new layout", "Medium", "Closed", """
`.github/workflows/01_workflow.yml` was written for the previous source layout
and test paths. The refactor moved tests, removed modules and changed what the
package contains, so the workflow could have been running against paths that no
longer exist — failing, or worse, passing while testing nothing.

## Resolution

Checked rather than assumed. The workflow invocation was run exactly as CI runs
it, without the `PYTHONPATH` the local commands use:

```
uv run pytest --cov=src/common_rules_server --cov-report=term-missing src/test/
457 passed — 90% coverage
```

It resolves because `src/test/` is a package and the project is installed by
`uv sync`, so both import paths work without help. The wheel was also inspected
to confirm all 64 resource files are packaged — a data-file packaging failure
would have shipped a server with an empty kit while every test still passed.

No change was needed.
"""),
]


def ticket_pages():
    pages = []
    status_line = "**Status:** Done"
    for tid, title, ttype, epic, body in TICKETS:
        content = (
            f"# {tid} — {title}\n\n"
            f"**Type:** {ttype}\n"
            f"{status_line}\n"
            f"**Epic:** [{epic}](../epics/{epic}.md)\n\n"
            f"{body.strip()}\n"
        )
        pages.append((f"tracking/tickets/{tid}.md", f"{tid} {title}", content))
    return pages


def epic_pages():
    pages = []
    for eid, title, status, outcome, tickets in EPICS:
        rows = "\n".join(
            f"| [{t}](../tickets/{t}.md) | {dict((x[0], x[1]) for x in TICKETS)[t]} | "
            f"{dict((x[0], x[2]) for x in TICKETS)[t]} | Done |"
            for t in tickets
        )
        content = (
            f"# {eid} — {title}\n\n"
            f"**Status:** {status}\n"
            f"**Roadmap:** [Roadmap](../ROADMAP.md)\n\n"
            f"## Outcome\n{outcome.strip()}\n\n"
            f"## Tickets\n\n"
            f"| Ticket | Title | Type | Status |\n|---|---|---|---|\n{rows}\n\n"
            f"## Definition of done\n\n"
            f"- [x] Every ticket Done\n- [x] Documentation updated\n"
            f"- [x] Outcome above is demonstrably true\n"
        )
        pages.append((f"tracking/epics/{eid}.md", f"{eid} {title}", content))
    return pages


def finding_pages():
    pages = []
    for fid, title, severity, status, body in FINDINGS:
        content = (
            f"# {fid} — {title}\n\n"
            f"**Severity:** {severity}\n"
            f"**Status:** {status}\n"
            f"**Found during:** review of the previous implementation and this rebuild\n\n"
            f"{body.strip()}\n"
        )
        pages.append((f"tracking/findings/{fid}.md", f"{fid} {title}", content))
    return pages


ROADMAP_EPICS = "\n".join(
    f"| [{e[0]}](epics/{e[0]}.md) | {e[1]} | {e[2]} | {len(e[4])}/{len(e[4])} |"
    for e in EPICS
)
OPEN_FINDINGS = "\n".join(
    f"| [{f[0]}](findings/{f[0]}.md) | {f[1]} | {f[2]} |"
    for f in FINDINGS
    if f[3] == "Open"
)
RESOLVED_FINDINGS = "\n".join(
    f"| [{f[0]}](findings/{f[0]}.md) | {f[1]} | {f[2]} |"
    for f in FINDINGS
    if f[3] != "Open"
)

PAGES = [
    ("README.md", "Wiki Hub", f"""
# Common Rules Server — Wiki

An MCP server that gives coding agents a shared, versioned set of rules, skills,
agents, workflows and loops, and configures the project around them.

Built from [`.docs/template`](../template/README.md). See the
[Documentation Protocol](DOCUMENTATION-PROTOCOL.md) before changing anything here.

## Sections

| Section | Holds |
|---|---|
| [Product](product/PRD.md) | What this is for, and for whom |
| [System Design](architecture/SYSTEM-DESIGN.md) | How the server is put together |
| [Decisions](architecture/adrs/ADR-001-unified-resource-model.md) | Why it is put together that way |
| [Hooks](architecture/adrs/ADR-005-hooks-over-guidance.md) | Automations that hold without agent cooperation |
| [Native sync](architecture/adrs/ADR-006-native-sync.md) | Running the kit with the server switched off |
| [Development Guide](engineering/DEVELOPMENT-GUIDE.md) | Working on this repository |
| [Testing Strategy](engineering/TESTING-STRATEGY.md) | What is tested, and how |
| [Agent BDD](engineering/AGENT-BDD.md) | Agent-executed acceptance testing |
| [Rollback](operations/ROLLBACK-PLAYBOOK.md) | Undoing this refactor |
| [Setup](onboarding/SETUP-GUIDE.md) | Getting it running |
| [Roadmap](tracking/ROADMAP.md) | Epics, tickets, findings |

## Status

All six epics are Done. 781 tests pass. One finding remains open, deliberately
deferred — see [Roadmap](tracking/ROADMAP.md).
"""),

    ("DOCUMENTATION-PROTOCOL.md", "Documentation Protocol", """
# Documentation Protocol

This project follows the protocol defined in the reusable template. The rules
below are the operative summary; the template holds the full explanation.

## The hub rule

The root `README.md` is a hub. It states what the project is and links here. It
holds no architecture, guides or long-form explanation.

## The golden rule

A decision is never overwritten silently. When a new document changes how an
existing one should be read:

1. The new document ends with an **impact footer** stating what it changes.
2. The point of change carries `[→ overrides <DOC> §<section>]`.
3. The superseded document is edited to carry `[← overridden by <DOC> §<section>]`.

Step three is the one that gets skipped and the one that matters: without it, a
reader landing on the old page cannot tell it is stale.

## Relationship vocabulary

| Relationship | Meaning | Status of the older text |
|---|---|---|
| Extends | Adds what the older document did not cover | Still current |
| Refines | Changes interpretation without contradicting | Current; read both |
| Overrides | Replaces a specific passage | That passage is obsolete |
| Supersedes | Replaces the document entirely | Obsolete; kept as history |
| Depends on | Relies on the older document | Current and load-bearing |

## Checklist

- [ ] Does this change how another document should be read?
- [ ] Impact footer added?
- [ ] Inline marker placed?
- [ ] Mirror marker added to the older document?
- [ ] Navigation still resolves?
- [ ] Tracker updated?
"""),

    ("product/PRD.md", "Product Requirements", """
# PRD — Common Rules Server

**Status:** Shipped
**Last reviewed:** 2026-08-08

## Problem

A developer working with coding agents across several editors has the same
process in their head every time and no way to give it to the agent. Each editor
stores rules differently, so guidance written for one is unusable in another, and
it drifts out of date independently in each place.

An earlier attempt at this repository encoded the process as pseudo-code —
variables, conditionals, return values — to remove ambiguity. It did the
opposite. Files reached 150 to 250 lines each, agents interpreted the control
flow inconsistently, and the cost of changing a rule became high enough that
rules stopped being changed.

## Evidence

Thirteen rule files averaging around 170 lines, all pseudo-code, unchanged since
first commit despite the workflow around them moving on.

## Who it affects

| Audience | Their situation | What they need |
|---|---|---|
| Developer using agents | Same process retyped per editor, drifting | One source of process, wherever they work |
| Agent | Guidance either absent or written as code it must interpret | Direct instructions, and a way to find the right one |
| Someone joining a project | Conventions live in someone's head | Conventions the agent already applies |

## Requirements

| # | Requirement | Priority | Rationale |
|---|---|---|---|
| R1 | Resources written in natural language | Must | Pseudo-code was the original failure |
| R2 | One format across every resource kind | Must | Five formats means five parsers and five ways to be wrong |
| R3 | Resources declare their own relationships | Must | The process lives in the edges, not the files |
| R4 | Nothing environment-specific hardcoded | Must | The kit has to work in projects it has never seen |
| R5 | Full map in one call, bodies on demand | Must | Sending everything wastes the context it is meant to inform |
| R6 | Projects extend without forking | Must | A kit that cannot be specialised gets abandoned |
| R7 | Names no editor | Must | The same guidance has to be correct everywhere |
| R8 | Configures the project actively | Should | A server that only answers questions leaves the setup undone |
| R9 | Commit authorship stays with the owner | Should | Agents claim co-authorship without asking |
| R10 | Behaviour verifiable by an agent end to end | Should | Unit tests did not catch the defects that mattered |

## Success

| Measure | Before | After |
|---|---|---|
| Average resource length | ~170 lines | ~45 lines |
| Resource kinds supported | 1 | 5 |
| Placeholders that resolve | 0 | all |
| Tests | 11 | 457 |
| Editors supported | 1 by convention | 5 by detection |

## Out of scope

Running or scheduling agents; hosting; anything requiring network access at
runtime; replacing the editor's own agent.

## Open questions

| # | Question | Tracked as |
|---|---|---|
| 1 | How should companion servers be installed? | [FND-013](../tracking/findings/FND-013.md) |
"""),

    ("architecture/SYSTEM-DESIGN.md", "System Design", """
# System Design

**Status:** Current
**Last reviewed:** 2026-08-08

## Purpose

Serve orchestration resources to coding agents over MCP, resolve them against
project configuration, and configure the surrounding project so the agent is set
up to use them.

## Context

```
        editor / agent
              │  MCP (stdio)
              ▼
     ┌──────────────────┐
     │   mcp_server     │  5 tools
     └────────┬─────────┘
              │
   ┌──────────┴───────────────────────────────┐
   ▼          ▼            ▼          ▼       ▼
config    resource     git_hook     ide    mcp_installer
service   service      service    service     service
              │
     ┌────────┴────────┐
     ▼                 ▼
 built-in kit    project resources
 (this package)  (RESOURCES_DIR)
```

## Components

| Component | Responsibility | Depends on |
|---|---|---|
| `mcp_server` | Tool surface; constructs services per call | all services |
| `config_service` | Schema, detection, reading and writing config | — |
| `resource_service` | Loading, resolution, gating, override, integrity | config_service, parsing, placeholders |
| `bdd_service` | Gherkin parsing and pagination | — |
| `git_hook_service` | Commit-message filtering | — |
| `ide_service` | Editor detection and guidance placement | — |
| `mcp_installer_service` | Companion detection and proposals | — |
| `util.resource_parsing` | Frontmatter parsing and validation | — |
| `util.placeholders` | Substitution of known config keys | — |

## Key decisions

Services are constructed per call rather than at import. The working directory
and the configuration can both change while the process runs, and a service
captured at import keeps answering with the state at start-up.

Resources are data, not code. Adding a skill means adding a Markdown file; the
server has no table of resource names in it. The one place this shows is gating:
a resource declares the config flag that gates it, so a project can ship a gated
resource without a code change.

`get_context` deliberately withholds bodies. Sending every instruction to
describe what is available would consume the context the call exists to inform.

## Data

| Store | Contents | Lifetime |
|---|---|---|
| Package `resources/` | The built-in kit | Ships with the release |
| `RESOURCES_DIR` | Project resources and overrides | Project lifetime |
| `.common-rules-server/config.env` | Project configuration | Project lifetime; committed |

## Known weaknesses

The catalogue is re-stat'ed on each call to detect changes. Fine at this size;
it would need a watcher at a few thousand resources.

Companion detection cannot construct a launch entry without evidence — see
[FND-013](../tracking/findings/FND-013.md).

## Decisions

Recorded as ADRs, starting with
[ADR-001](adrs/ADR-001-unified-resource-model.md).
"""),

    ("architecture/adrs/ADR-001-unified-resource-model.md", "ADR-001 Unified Resource Model", """
# ADR-001 — One file format for every resource kind

**Status:** Accepted
**Date:** 2026-08-08

## Context

The server needs to serve five different things: rules, skills, agents,
workflows and loops. They differ in how they are invoked and what fields they
carry, but they share a name, a description, relationships and configuration
dependencies.

## Options considered

| Option | For | Against |
|---|---|---|
| A format per kind | Each shaped exactly to its needs | Five parsers, five validators, five ways to drift |
| One format, `kind` field | One parser, one validator, uniform discovery | Kind-specific fields must be conditionally validated |
| One format, no kinds | Simplest possible | Loses the distinction that makes routing possible |

## Decision

One Markdown-with-frontmatter format for every kind, with a required `kind`
field and conditional validation of kind-specific fields.

## Consequences

Easier: adding a kind, validating the whole catalogue, discovering resources
uniformly, letting a project override any resource by writing a file.

Harder: the parser carries a conditional branch per kind. This is contained —
one function, and the invalid combinations are enumerated in tests.

Expensive to reverse: every resource file and every project override would need
rewriting. The format is effectively a public interface.

## Revisit when

A kind appears whose fields cannot be expressed in frontmatter, or the
conditional validation grows past a handful of branches.
"""),

    ("architecture/adrs/ADR-002-progressive-disclosure.md", "ADR-002 Progressive Disclosure", """
# ADR-002 — Split discovery from retrieval

**Status:** Accepted
**Date:** 2026-08-08

## Context

An agent needs to know what is available before it can choose. The full kit is
roughly 1,400 lines of instructions. Sending all of it so the agent can pick one
resource would consume a large share of the context window to describe work
rather than do it.

## Options considered

| Option | For | Against |
|---|---|---|
| One call returning everything | Single round trip | Spends context describing options it will not use |
| Discovery then retrieval | Sends only what is needed | Two round trips |
| Discovery with truncated bodies | One call, some content | Truncated instructions are worse than none |

## Decision

`get_context` returns names, descriptions, relationships and configuration
status for everything, and no bodies. `get_resource` returns one full resource.

This makes the description load-bearing: it is the only thing an agent sees when
choosing. A kit-wide test enforces a minimum length on it for that reason.

## Consequences

Easier: the map stays cheap as the kit grows; a project can ship many resources
without penalty.

Harder: an agent that needs three resources makes three calls. Acceptable — it
only fetches what it decided to use.

## Revisit when

Round-trip latency dominates, or descriptions stop being sufficient to choose on.
"""),

    ("architecture/adrs/ADR-003-report-not-write.md", "ADR-003 Report Before Writing", """
# ADR-003 — Report on shared configuration rather than writing to it

**Status:** Accepted
**Date:** 2026-08-08

## Context

The kit's resources assume two companion MCP servers. The server can detect
whether they are configured. The question is what it should do when they are not.

The previous implementation wrote entries automatically, using assumed package
names, into whichever MCP configuration file it found — including the editor-wide
one. See [FND-006](../../tracking/findings/FND-006.md).

## Options considered

| Option | For | Against |
|---|---|---|
| Write automatically | Nothing left for the user to do | Editor-wide config is shared by every project; a wrong entry breaks all of them |
| Report only | Cannot break anything | User has to act |
| Report by default, write on consent | Safe default, still automatable | Two paths to maintain |

## Decision

Report by default. Writing requires explicit consent, is limited to entries
constructible from evidence, backs the file up first, and never overwrites an
existing entry.

The asymmetry drives this: failing to add a server costs the user one manual
edit. Adding a wrong one breaks their tooling in every project until they find
it, and they have no reason to suspect this server did it.

## Consequences

Easier: setup cannot damage the user's environment.

Harder: companions are not configured automatically. Mitigated by reporting what
each is for and why it matters.

## Revisit when

A reliable way to determine the correct launch command exists — see
[FND-013](../../tracking/findings/FND-013.md).
"""),

    ("architecture/adrs/ADR-004-commit-authorship.md", "ADR-004 Commit Authorship", """
# ADR-004 — Protect commit authorship with a git hook

**Status:** Accepted
**Date:** 2026-08-08

## Context

Coding agents append `Co-authored-by:` trailers and "generated with" footers to
commit messages. On GitHub a co-author trailer attributes the commit to that
identity. This happens without being asked, and the repository owner is the one
paying for the tool.

## Options considered

| Option | For | Against |
|---|---|---|
| Instruct the agent not to | No machinery | Depends on every agent complying, including ones that never mention it |
| Editor-specific settings | Native | Different in every editor, and not all expose it |
| A `commit-msg` git hook | Applies to every commit from every tool | Needs installing per repository |

## Decision

Install a `commit-msg` hook, on by default, that removes trailers naming a known
AI identity.

**Human co-author trailers are preserved.** A human trailer is a true statement
about who wrote the code; removing it would be a worse version of the problem.
The filter therefore errs towards leaving a trailer in place, and every identity
is matched on token boundaries — see
[FND-012](../../tracking/findings/FND-012.md) for what happens otherwise.

## Consequences

Easier: authorship is correct regardless of which agent commits.

Harder: a repository-local hook is not version controlled and needs reinstalling
on a fresh clone. `setup_config` is idempotent, so re-running it is the fix.

An existing hook is preserved and chained rather than replaced, since it may be
the project's own commit-message linter.

## Revisit when

Agents stop adding these trailers, or a git feature makes it configurable
upstream.
"""),

    ("architecture/adrs/ADR-005-hooks-over-guidance.md", "ADR-005 Hooks Over Guidance", """
# ADR-005 — Enforce automations with editor hooks, not instructions

**Status:** Accepted
**Date:** 2026-08-08

## Context

The kit's rules and skills are guidance. An agent can skim them, deprioritise
them behind a long conversation, or ignore them, and nothing detects that. For
anything that must hold regardless — a secret never reaching the transcript, a
destructive command never running unconfirmed — guidance is not a mechanism.

All three supported editors provide lifecycle hooks. They also disagree on
everything about them: config location, event names, config nesting, and what a
handler prints to allow or deny.

## Options considered

| Option | For | Against |
|---|---|---|
| Instruct the agent in a rule | No machinery | Depends on the agent cooperating, which is the thing in question |
| Hand-write hooks per editor | Native to each | Three copies drifting apart; the same fix applied three times or once |
| One definition, generated per editor | Authored once, native everywhere | The translation layer must be maintained |
| Runtime adapter translating a common protocol | One script | Adds a dependency and a process to every event |

## Decision

A hook is a resource declaring a canonical event and a shell block. Each editor
gets a self-contained generated script: the same logic body inside a wrapper
that already knows that editor's output contract.

Translation happens at generation time, not run time. There is no adapter chain
and no dependency beyond POSIX `sh` — a hook that fails because `jq` is absent is
a hook that silently protects nothing.

Where an editor has no equivalent for an event, that is reported rather than
mapped onto something approximate. A hook wired to the wrong event is worse than
an absent one, because it looks installed.

## Consequences

Easier: an automation is written once and holds in every editor, including when
the agent ignores every rule in the kit.

Harder: the event mapping is a table this project must keep current as editors
change. It is small, documented, and covered by tests that execute the generated
scripts.

## Revisit when

A common hook standard emerges across editors, or an automation needs richer
input than a shell script can reasonably parse without a JSON tool.
"""),
    ("architecture/adrs/ADR-006-native-sync.md", "ADR-006 Native Sync", """
# ADR-006 — Export the kit into native editor files

**Status:** Accepted
**Date:** 2026-08-08

## Context

Reaching a resource through the MCP server costs a tool call and its response
every time it is used. Across a session that is a recurring cost for content that
does not change between calls.

It is also a dependency: with the server unavailable, misconfigured, or simply
not installed, none of the kit applies.

## Options considered

| Option | For | Against |
|---|---|---|
| Server only | One source of truth, always current | Per-use cost; the kit stops existing without the server |
| Native files only | Zero run-time cost | No resolution, no gating, no override logic |
| Both, with generated export | Native cost, server semantics | Generated files go stale until re-synced |

## Decision

Ship both. `sync_to_ide` exports the resolved catalogue into each editor's
documented layout — rules, skills, subagents, hooks — with placeholders already
substituted and gated resources already excluded.

The export is pure string transformation over parsed resources, with no model
involved, so re-running it is free. That is what makes staleness a cheap problem
rather than a reason to avoid the feature.

Generated files carry a header saying so, and are the only files `clean` will
remove. Managed blocks in `CLAUDE.md` and `AGENTS.md` are replaced in place, so
anything the user wrote around them survives.

## Consequences

Easier: the kit works with the server switched off, and costs nothing per use.
A project can commit the exported files and share the process with people who do
not run the server at all.

Harder: two representations can disagree. Mitigated by making regeneration free
and marking generated files clearly.

Workflows and loops are exported as skills, because no editor models them
separately and both are invocable procedures. Antigravity has no documented
subagent concept, so agents there become skills whose body states the persona.

## Revisit when

An editor gains a native concept for workflows, or the export needs information
that cannot be expressed in that editor's format.
"""),
    ("engineering/DEVELOPMENT-GUIDE.md", "Development Guide", """
# Development Guide

## Layout

```
src/common_rules_server/
├── mcp_server.py           tool surface
├── service/                one service per concern
├── util/                   parsing and placeholder resolution
└── resources/              the built-in kit (data, not code)
    ├── rules/ skills/ agents/ workflows/ loops/
    ├── optional/           gated behind config flags
    └── templates/          report skeletons
src/test/                   mirrors the source layout
agent_bdd.feature           agent-executed acceptance scenarios
```

## Commands

| Purpose | Command |
|---|---|
| Install | `uv sync --extra test` |
| Tests | `PYTHONPATH=src uv run pytest` |
| One file | `PYTHONPATH=src uv run pytest src/test/service/test_config_service.py` |
| Run the server | `PYTHONPATH=src uv run common-rules` |

## Adding a resource

Write a Markdown file under the directory for its kind. There is no registration
step — resources are data, and the integrity suite will pick it up.

It must have `kind`, `name`, `description`, the field its kind requires, a
relationship table in prose as well as YAML, and an output template if it
produces a report. The integrity suite enforces all of this, plus: the filename
matches the name, references resolve, placeholders correspond to real config
keys, no pseudo-code, no editor names.

## Adding a configuration key

Add a `ConfigKey` to `CONFIG_SCHEMA` in `config_service.py`. Give it a
description written for someone who has not read the code, and either a default
or `needs_input=True`. Nothing else needs changing: the file writer, the resolver
and the reporting all read the schema.

## Testing against a local build

Add a second MCP server entry pointing at the working copy, alongside the
released one rather than replacing it:

```json
"common-rules-local": {
  "command": "uv",
  "args": ["--directory", "/path/to/common-rules-server", "run", "common-rules"]
}
```

Keeping both means the released server stays available if the working copy is
mid-change. The editor caches the tool list at start-up, so a new tool needs the
connection restarted before it appears.

## Conventions

Natural language in resources — no pseudo-code. Explain why a step matters where
the reason is not obvious; an instruction whose purpose is understood survives
situations its author did not foresee.

Services take `project_root` and default to the working directory. Nothing reads
global state at import.

Failures are returned as data with a `hint`, not raised. An agent cannot catch an
exception across the MCP boundary.
"""),

    ("engineering/TESTING-STRATEGY.md", "Testing Strategy", """
# Testing Strategy

457 tests. The distribution reflects a specific lesson: the previous suite passed
while placeholder resolution was entirely broken, because every test used
fixtures and none ran the code against the resources actually shipped.

## Levels

| Level | Verifies | Where |
|---|---|---|
| Unit | Parsing, resolution, config precedence | `test/util`, `test/service` |
| Functional | Services against a real temp project and a real git repo | `test/service` |
| Contract | The five tools as a client calls them | `test/test_mcp_server.py` |
| Kit integrity | Every shipped file, and the catalogue as a graph | `test/test_default_kit_integrity.py` |
| Acceptance | Agent-executed, against the running server | `agent_bdd.feature` |

## Tests that exist because something failed

| Test | Catches |
|---|---|
| `test_no_builtin_resource_leaks_an_unresolved_config_key` | [FND-001](../tracking/findings/FND-001.md) — the whole config layer inert |
| `test_human_co_author_trailer_is_preserved` | [FND-012](../tracking/findings/FND-012.md) — erasing a real person's credit |
| `test_body_is_not_truncated_by_a_horizontal_rule` | [FND-005](../tracking/findings/FND-005.md) — silent body truncation |
| `test_path_traversal_in_the_name_is_rejected` | [FND-002](../tracking/findings/FND-002.md) — writes outside the resources directory |
| `test_no_temporary_file_is_left_behind` | [FND-007](../tracking/findings/FND-007.md) — litter in the git directory |
| `test_no_pseudo_code_survives_in_the_kit` | Regression to the format this rewrite removed |

## Principles

**Run the real thing.** The git hook tests execute the generated shell script as
a subprocess and make an actual commit. Asserting on the script's text would only
prove it was written.

**Test the shipped content, not just the code.** The integrity suite parametrises
across every resource file, so a malformed resource fails by name.

**Expected values come from an independent source.** Contracts in
`agent_bdd.feature` were captured by calling the real tools and recording the
output, not by reading the implementation.
"""),

    ("engineering/AGENT-BDD.md", "Agent BDD", """
# Agent BDD

Acceptance scenarios written in Gherkin and executed by an agent against the
running system. No test runner is involved: the agent performs the steps by
calling the real tools and compares what comes back with what the scenario says.

## Why pagination

`get_bdd_scenario(page)` returns one scenario at a time.

An agent given a whole feature file skims it and reports in aggregate — "all 37
scenarios pass" — without having carried any of them out. Given one scenario, it
has to perform those steps and state what it observed before it can ask for the
next.

Each page is self-contained: the feature description and `Background` travel with
every scenario, because a scenario without its setup is not executable.

## Running

```
get_bdd_scenario(page=1)
  → perform Given, When, check each Then
  → record the observed value
  → has_next ? page + 1 : summarise
```

Or invoke `/bdd-run`, which follows this loop and reports against the template.

## Writing

Invoke `/bdd-generate`, which requires `/grill-me` first. That edge is required
rather than suggested: scenarios written against an assumed contract encode the
assumption and then pass, which manufactures confidence instead of testing
anything.

**Contracts must be exact.** Every field, every value, as the real system
produces them. No abbreviation, no `...`, no plausible-looking values, no mocks.
A scenario asserting an approximated contract passes against a system that is
wrong and fails against one that is right.

Where the real shape is unknown, call the real thing and record what it returns.
Every contract in this project's feature file was captured that way.

## Coverage

37 scenarios across all five tools, plus commit authorship, editor guidance and
companion detection. Happy paths, boundaries, errors, and the security cases —
path traversal, and preserving human co-authorship.

## Reviewing

`/bdd-review` judges the suite against the system's real surface rather than
against itself: which entry points are uncovered, which assertions approximate a
contract, and whether the balance is weighted towards happy paths.
"""),

    ("operations/ROLLBACK-PLAYBOOK.md", "Rollback Playbook", """
# Rollback Playbook

**Applies to:** the refactor from pseudo-code rules to the unified resource model
**Risk:** Low — the previous state is a tagged commit

## When to use this

The new server misbehaves in a way that blocks work and cannot be fixed forward
quickly.

## Before you start

- [ ] Note what failed, with output — the point of rolling back is to buy time
      to fix it, and that needs evidence
- [ ] Confirm nothing uncommitted is worth keeping

## Rolling back

| # | Action | Command |
|---|---|---|
| 1 | Find the pre-refactor state | `git log --oneline main` |
| 2 | Return to it | `git checkout <pre-refactor-sha>` |
| 3 | Reinstall | `uv sync --extra test` |
| 4 | Verify | `PYTHONPATH=src uv run pytest` |

To keep the branch but drop the change, revert the merge commit rather than
resetting a shared branch.

## Undoing the project-level effects

`setup_config` writes outside the package. Removing the server does not remove
these, and each undoes independently:

| Artefact | Undo |
|---|---|
| `.common-rules-server/` | Delete the directory |
| `.git/hooks/commit-msg` | Delete it; restore `commit-msg.pre-common-rules` if present |
| Editor rules file | Delete the block between the `BEGIN`/`END common-rules` markers |
| Companion MCP entries | Only present if explicitly permitted; a `.backup` sits beside the file |

## Verification

The old server exposes `get_system_rules`; the new one exposes `get_context`.
Whichever the editor lists tells you which is running.

## If it goes wrong

The refactor deleted the pseudo-code rules. They exist in git history — recover
individual files with `git show <sha>:<path>` rather than reverting wholesale.
"""),

    ("onboarding/SETUP-GUIDE.md", "Setup Guide", """
# Setup Guide

## Prerequisites

| Tool | Version | Notes |
|---|---|---|
| Python | 3.11+ | |
| uv | recent | Dependency and run management |
| git | any | Required for commit authorship protection |

## Install

```bash
git clone <url> && cd common-rules-server
uv sync --extra test
PYTHONPATH=src uv run pytest
```

You are set up when the suite passes.

## Connect it to an editor

Add to your editor's MCP configuration:

```json
{
  "mcpServers": {
    "common-rules": {
      "command": "uv",
      "args": ["--directory", "/absolute/path/to/common-rules-server", "run", "common-rules"]
    }
  }
}
```

Restart the connection — editors cache the tool list at start-up.

## First use in a project

Call `setup_config()`. It writes `.common-rules-server/config.env` with every
setting explained, detects what it can, installs the commit-message hook, and
writes orchestration guidance where your editor reads it.

Then read `next_steps` in the response. Anything listed there needs an answer it
could not determine — `TEST_COMMAND` usually among them.

Confirm with `get_context()`: `integrity.ok` should be true and `problems`
empty.

## First week

- [ ] Read the [PRD](../product/PRD.md) — what this is for
- [ ] Read the [System Design](../architecture/SYSTEM-DESIGN.md) — how it fits together
- [ ] Read [ADR-001](../architecture/adrs/ADR-001-unified-resource-model.md) — why one format
- [ ] Read the [Development Guide](../engineering/DEVELOPMENT-GUIDE.md) — adding a resource
- [ ] Read the [Workflow](../../template/tracking/WORKFLOW.md) — how work moves
"""),

    ("tracking/ROADMAP.md", "Roadmap", f"""
# Roadmap

**Last updated:** 2026-08-08
**Workflow:** [Development Workflow](../../template/tracking/WORKFLOW.md)

## Delivered

| Epic | Outcome | Status | Tickets |
|---|---|---|---|
{ROADMAP_EPICS}

## Open findings

Problems recorded during the rebuild and deliberately not fixed, so that the
change under review stayed the change that was planned.

| Finding | Summary | Severity |
|---|---|---|
{OPEN_FINDINGS}

## Resolved findings

Defects found in the previous implementation, and one found in this one.

| Finding | Summary | Severity |
|---|---|---|
{RESOLVED_FINDINGS}

## Progress

| Status | Count |
|---|---|
| Done | {len(TICKETS)} |
| In Progress | 0 |
| Backlog | 0 |
| Open findings | {sum(1 for f in FINDINGS if f[3] == "Open")} |
"""),
]

PAGES += epic_pages() + ticket_pages() + finding_pages()

#: Directories inside the wiki that this generator does not own. Wiping the
#: whole tree once destroyed the history folder, which is hand-written content
#: that happens to live under the same root. Now preserves all major directories.
PRESERVE = {"history", "tracking", "architecture", "product", "engineering", "onboarding", "operations"}

if __name__ == "__main__":
    if ROOT.is_dir():
        for entry in ROOT.iterdir():
            if entry.name in PRESERVE:
                continue
            shutil.rmtree(entry) if entry.is_dir() else entry.unlink()
    build(ROOT, PAGES)
    broken = check_links(ROOT, skip=tuple(PRESERVE))
    print(f"pages: {len(PAGES)}")
    print("broken links:", broken or "none")
