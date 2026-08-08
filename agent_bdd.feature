# Agent-executed acceptance scenarios for the common-rules MCP server.
#
# These are carried out by an agent calling the real tools, not by a test
# runner. Read them one at a time with get_bdd_scenario(page=N): perform the
# Given and When steps for real, then check each Then against what actually
# came back.
#
# Every contract below is exact. Nothing is abbreviated, elided or invented.
# Where a scenario names a field, that field exists with that name; where it
# names a value, the system produces that value. If an observation disagrees
# with a scenario, one of the two is wrong and that is the finding.

Feature: Common Rules orchestration server

  The server exposes five tools. get_context maps everything available in one
  call, get_resource reads one resource in full, create_resource adds a
  project-scoped resource, setup_config configures the project and its
  surroundings, and get_bdd_scenario walks this file one scenario at a time.

  Background:
    Given the common-rules MCP server is connected and its tools are listed
    And the working project is a git repository containing pyproject.toml
    And the built-in resource kit is present and unmodified

  # ---------------------------------------------------------------- get_context

  @get_context @discovery
  Scenario: get_context returns the whole map in a single call
    Given no arguments are needed
    When I call get_context()
    Then the response is an object with exactly these top-level keys:
      | config            |
      | env_status        |
      | resources         |
      | resource_counts   |
      | total_resources   |
      | project_overrides |
      | gated_out         |
      | problems          |
      | integrity         |
      | usage             |
    And "total_resources" equals 40
    And "resource_counts" equals {"rule": 4, "skill": 19, "agent": 6, "workflow": 4, "loop": 1, "hook": 6}
    And "problems" is an empty list
    And no element of "resources" contains a "body" key

  @get_context @progressive_disclosure
  Scenario: get_context withholds instruction bodies so the map stays cheap
    Given get_context is the first call of a session
    When I call get_context()
    And I inspect every element of "resources"
    Then each element has the keys "kind", "name", "description", "relationships", "env" and "source"
    And no element has a key named "body"
    And no element has a key named "template"
    And "usage" equals "Call get_resource(kind, name) for full instructions. Resources reference each other as /name in their relationship tables."

  @get_context @relationships
  Scenario: the general rule declares a required edge to the orchestrator
    Given the built-in kit is loaded
    When I call get_context()
    And I select the element of "resources" where "kind" is "rule" and "name" is "general"
    Then "type" equals "Always"
    And "source" equals "built-in"
    And "relationships.goes_to" equals:
      """
      [{"target": "/orchestrator", "required": true, "note": "Findings here decide which workflow fits"}]
      """
    And "relationships.output" equals "templates/general.md"

  @get_context @integrity
  Scenario: every relationship in the default kit points at something that exists
    Given the built-in kit is loaded
    When I call get_context()
    And I read the "integrity" object
    Then "integrity.ok" is true
    And "integrity.unparseable" is an empty list
    And "integrity.dangling_references" is an empty list
    And "integrity.missing_templates" is an empty list

  @get_context @gating
  Scenario: optional resources stay out of the catalogue until their flag is set
    Given ENABLE_NOTEBOOKS, ENABLE_DAILY_LOGBOOK, ENABLE_COMPLIANCE and ENABLE_DEVIATION are all "false"
    And LINTER_TOOL is empty
    When I call get_context()
    Then "gated_out" contains an entry with "name" equal to "notebook" and "gate" equal to "ENABLE_NOTEBOOKS"
    And "gated_out" contains an entry with "name" equal to "code-style" and "gate" equal to "LINTER_TOOL"
    And "gated_out" contains exactly 5 entries
    And no element of "resources" has "name" equal to "notebook"

  @get_context @gating
  Scenario: enabling a flag brings its resource into the catalogue
    Given ENABLE_NOTEBOOKS is set to "true" in .common-rules-server/config.env
    When I call get_context()
    Then "resources" contains an element with "kind" equal to "skill" and "name" equal to "notebook"
    And "total_resources" equals 41
    And "gated_out" contains exactly 4 entries
    And no entry in "gated_out" has "name" equal to "notebook"

  # --------------------------------------------------------------- get_resource

  @get_resource @contract
  Scenario: get_resource returns instructions, template and configuration status
    Given the built-in skill "tdd" exists
    When I call get_resource(kind="skill", name="tdd")
    Then the response has exactly these keys:
      | kind            |
      | name            |
      | description     |
      | trigger         |
      | relationships   |
      | env             |
      | source          |
      | file            |
      | body            |
      | resolved_env    |
      | unresolved_env  |
      | template_ref    |
      | template        |
    And "kind" equals "skill"
    And "name" equals "tdd"
    And "trigger" equals "model-invoked"
    And "env.requires" equals ["TEST_COMMAND"]
    And "template_ref" equals "templates/tdd.md"
    And "template" is a non-empty string beginning with "# TDD Cycle"

  @get_resource @placeholders
  Scenario: configured placeholders are substituted into the instructions
    Given README_PATH is "README.md" and WIKI_DIR is ".docs" in the resolved configuration
    When I call get_resource(kind="skill", name="docs")
    Then "resolved_env" equals:
      """
      {"README_PATH": "README.md", "WIKI_DIR": ".docs", "DOCS_PROTOCOL": ".docs/DOCUMENTATION-PROTOCOL.md"}
      """
    And "unresolved_env" is an empty list
    And "body" contains the text "README.md at the repository root is a hub"
    And "body" does not contain the text "{{README_PATH}}"
    And "body" does not contain the text "{{WIKI_DIR}}"

  @get_resource @placeholders
  Scenario: an unset placeholder is left visible rather than blanked
    Given TEST_COMMAND is empty in the resolved configuration
    When I call get_resource(kind="skill", name="tdd")
    Then "unresolved_env" contains "TEST_COMMAND"
    And "body" still contains the literal text "{{TEST_COMMAND}}"
    And "body" does not contain the text "Run `` and watch it fail"

  @get_resource @placeholders
  Scenario: report templates keep their own fill-in slots untouched
    Given the skill "verify" declares templates/verify.md as its output
    When I call get_resource(kind="skill", name="verify")
    And I read the "template" string
    Then "template" contains the literal text "{{BUILD_RESULT}}"
    And "template" contains the literal text "{{PASSED}}"
    And "template" contains the literal text "{{FAILED}}"

  @get_resource @errors
  Scenario: an unknown resource name returns the available names instead of failing silently
    Given no skill named "nonexistent-skill" exists
    When I call get_resource(kind="skill", name="nonexistent-skill")
    Then the response has a key "error" equal to "No skill named 'nonexistent-skill'."
    And the response has a key "available" which is a list of strings
    And "available" contains "tdd"
    And "available" contains "verify"
    And the response has a key "hint" equal to "Call get_context() to list every resource."

  # ------------------------------------------------------------ create_resource

  @create_resource @happy_path
  Scenario: a created resource lands in the project under its kind directory
    Given RESOURCES_DIR is ".common-rules-server/resources"
    And no project skill named "demo-skill" exists
    When I call create_resource(kind="skill", name="demo-skill", description="A demonstration skill.", body="## Instructions\n\nDo the thing.")
    Then "created" is true
    And "path" equals ".common-rules-server/resources/skills/demo-skill.md"
    And "kind" equals "skill"
    And "name" equals "demo-skill"
    And "validation" equals {"valid": true, "errors": [], "warnings": []}
    And the file at that path begins with "---"
    And the file contains the line "kind: skill"
    And the file contains the line "trigger: user-invoked"

  @create_resource @discovery
  Scenario: a created resource becomes discoverable immediately
    Given create_resource has just created the skill "demo-skill"
    When I call get_context()
    Then "resources" contains an element with "kind" equal to "skill" and "name" equal to "demo-skill"
    And that element has "source" equal to "project"
    And "project_overrides" contains "demo-skill"

  @create_resource @override
  Scenario: a project resource shadows the built-in of the same kind and name
    Given the built-in skill "verify" exists with source "built-in"
    When I call create_resource(kind="skill", name="verify", description="Project-specific verification.", body="## Instructions\n\nRun the project pipeline.")
    Then "created" is true
    And "validation.warnings" contains "This overrides the built-in verify."
    When I call get_resource(kind="skill", name="verify")
    Then "source" equals "project"
    And "body" contains the text "Run the project pipeline."
    And the built-in file on disk is unchanged

  @create_resource @validation
  Scenario: an invalid kind is rejected with the list of valid kinds
    Given "gadget" is not a resource kind
    When I call create_resource(kind="gadget", name="thing", description="A thing.", body="Body.")
    Then "created" is false
    And "error" equals "Invalid kind 'gadget'. Expected one of: rule, skill, agent, workflow, loop."
    And no file is written anywhere under RESOURCES_DIR

  @create_resource @security
  Scenario: a name that would escape the resources directory is rejected
    Given RESOURCES_DIR is ".common-rules-server/resources"
    When I call create_resource(kind="skill", name="../evil", description="Escape attempt.", body="Body.")
    Then "created" is false
    And "error" equals "Invalid name '../evil'. Use kebab-case (letters, digits, hyphens)."
    And no file named "evil.md" exists outside the resources directory
    And no file is created in the parent of RESOURCES_DIR

  @create_resource @validation
  Scenario: an empty description is rejected because discovery depends on it
    Given a description is what lets another agent choose this resource
    When I call create_resource(kind="skill", name="undescribed", description="", body="## Instructions\n\nSomething.")
    Then "created" is false
    And "error" equals "A description is required."

  # ---------------------------------------------------------------- setup_config

  @setup_config @first_run
  Scenario: first run writes a fully explained configuration file
    Given .common-rules-server/config.env does not exist
    When I call setup_config()
    Then the file .common-rules-server/config.env exists
    And "env_status.file_exists" is true
    And every key in "config" appears in that file on its own line
    And each key in that file is preceded by at least one comment line beginning with "#"
    And the file contains the comment line "# NEEDS INPUT: no safe default."
    And "config.WIKI_DIR" equals ".docs"
    And "config.COVERAGE_THRESHOLD" equals "80"
    And "config.STRIP_AI_COAUTHORS" equals "true"
    And "config.AUTO_INSTALL_MCPS" equals "false"

  @setup_config @detection
  Scenario: the build system is detected from files present in the project
    Given the project root contains pyproject.toml
    When I call setup_config()
    Then "env_status.auto_detected.BUILD_SYSTEM" equals "python"
    And "env_status.auto_detected.PROJECT_LANGUAGE" equals "python"
    And "env_status.detection_evidence.BUILD_SYSTEM" equals "pyproject.toml"

  @setup_config @needs_input
  Scenario: settings that cannot be guessed are reported rather than invented
    Given TEST_COMMAND has no safe default
    When I call setup_config()
    Then "env_status.needs_input" contains "TEST_COMMAND"
    And "next_steps" contains an entry mentioning "TEST_COMMAND"
    And "config.TEST_COMMAND" equals ""

  @setup_config @idempotence
  Scenario: re-running setup preserves values the user has set
    Given .common-rules-server/config.env exists with the line "TEST_COMMAND=uv run pytest"
    And it also contains the line "COVERAGE_THRESHOLD=95"
    When I call setup_config() a second time
    Then "config.TEST_COMMAND" equals "uv run pytest"
    And "config.COVERAGE_THRESHOLD" equals "95"
    And "env_status.needs_input" does not contain "TEST_COMMAND"
    And the file still contains its explanatory comments

  @setup_config @preservation
  Scenario: configuration keys the server does not recognise are preserved
    Given .common-rules-server/config.env contains the line "MY_CUSTOM_KEY=custom-value"
    When I call setup_config()
    Then the file still contains the line "MY_CUSTOM_KEY=custom-value"
    And "env_status.unknown_keys" contains "MY_CUSTOM_KEY"
    And the file contains the comment line "# Not recognised by this server; preserved so you do not lose them."

  # ------------------------------------------------------- commit authorship

  @setup_config @git_hook @authorship
  Scenario: setup installs the hook that keeps AI trailers out of commit authorship
    Given the project is a git repository with no commit-msg hook
    And STRIP_AI_COAUTHORS is "true"
    When I call setup_config()
    Then "git_hooks.enabled" is true
    And "git_hooks.installed" is true
    And "git_hooks.action" equals "installed"
    And the file .git/hooks/commit-msg exists and is executable
    And that file contains the marker "common-rules:strip-ai-trailers"

  @git_hook @authorship
  Scenario: an AI co-author trailer is removed from a commit message
    Given the commit-msg hook is installed
    And a commit message file containing exactly:
      """
      feat: add pagination to the scenario reader

      Co-authored-by: Claude <noreply@anthropic.com>
      """
    When the commit-msg hook runs against that file
    Then the resulting file contains the line "feat: add pagination to the scenario reader"
    And the resulting file does not contain any line beginning with "Co-authored-by:"
    And no temporary file matching "*.common-rules.*" is left in the directory

  @git_hook @authorship
  Scenario: a human co-author trailer survives, because it is a real claim about authorship
    Given the commit-msg hook is installed
    And a commit message file containing exactly:
      """
      fix: correct the off-by-one in page bounds

      Co-authored-by: Ana Pereira <ana@example.com>
      Co-authored-by: Cursor <noreply@cursor.sh>
      """
    When the commit-msg hook runs against that file
    Then the resulting file contains the line "Co-authored-by: Ana Pereira <ana@example.com>"
    And the resulting file does not contain the line "Co-authored-by: Cursor <noreply@cursor.sh>"

  @git_hook @authorship
  Scenario: a generated-with advertising footer is removed
    Given the commit-msg hook is installed
    And a commit message file containing exactly:
      """
      docs: rewrite the setup guide

      🤖 Generated with Claude Code
      """
    When the commit-msg hook runs against that file
    Then the resulting file contains the line "docs: rewrite the setup guide"
    And the resulting file does not contain the text "Generated with"

  @git_hook @safety
  Scenario: an existing commit-msg hook is preserved and still runs first
    Given .git/hooks/commit-msg already exists and does not contain the common-rules marker
    When I call setup_config()
    Then "git_hooks.action" equals "chained"
    And the file .git/hooks/commit-msg.pre-common-rules exists and is executable
    And it holds the original hook content unchanged
    And the new .git/hooks/commit-msg invokes commit-msg.pre-common-rules before filtering
    And "git_hooks.notes" contains an entry mentioning "preserved"

  @git_hook @opt_out
  Scenario: turning the setting off removes the hook rather than leaving it behind
    Given the common-rules commit-msg hook is installed
    And STRIP_AI_COAUTHORS is set to "false" in .common-rules-server/config.env
    When I call setup_config()
    Then "git_hooks.enabled" is false
    And "git_hooks.action" equals "uninstalled"
    And the file .git/hooks/commit-msg no longer contains the marker "common-rules:strip-ai-trailers"

  # --------------------------------------------------- editor and companions

  @setup_config @ide
  Scenario: orchestration guidance is written where the detected editor will read it
    Given the project root contains a .cursor directory
    When I call setup_config()
    Then "ide_rules.detected" contains "cursor"
    And "ide_rules.written" contains an entry whose "path" equals ".cursor/rules/common-rules-orchestrator.mdc"
    And that file contains the marker "<!-- BEGIN common-rules (managed — edits inside are overwritten) -->"
    And that file contains the text "Call `get_context()` once"
    And that file contains the text "code-review-graph"
    And that file contains the text "context-mode"

  @setup_config @ide @idempotence
  Scenario: re-running setup replaces the guidance block instead of appending another
    Given .cursor/rules/common-rules-orchestrator.mdc already contains one managed block
    When I call setup_config() again
    Then the file contains the marker "<!-- BEGIN common-rules (managed — edits inside are overwritten) -->" exactly once
    And the file contains the marker "<!-- END common-rules -->" exactly once
    And any content the user wrote outside the managed block is unchanged

  @setup_config @ide
  Scenario: with no editor detected the setup asks rather than scattering files
    Given the project root contains no .cursor, .claude, .windsurf, .antigravity, .gemini or AGENTS.md
    When I call setup_config()
    Then "ide_rules.detected" is an empty list
    And "ide_rules.written" is an empty list
    And "ide_rules.action_required" is a non-empty string mentioning "Ask the user which editor"
    And "next_steps" contains that string

  @setup_config @companions
  Scenario: missing companion servers are reported, not silently installed
    Given AUTO_INSTALL_MCPS is "false"
    And neither code-review-graph nor context-mode is present in any MCP configuration
    When I call setup_config()
    Then "companions.applied" is false
    And "companions.proposals" contains an entry with "server" equal to "code-review-graph"
    And "companions.proposals" contains an entry with "server" equal to "context-mode"
    And "companions.skipped" contains an entry mentioning "AUTO_INSTALL_MCPS is not enabled"
    And no MCP configuration file on disk has been modified

  # ------------------------------------------------------------ get_bdd_scenario

  @get_bdd_scenario @pagination
  Scenario: the first page carries everything needed to run that scenario alone
    Given agent_bdd.feature exists in the project root
    When I call get_bdd_scenario(page=1)
    Then the response has the keys "feature", "feature_description", "feature_file", "background", "scenario", "page", "total_pages", "has_next", "next_page" and "instruction"
    And "feature" equals "Common Rules orchestration server"
    And "page" equals 1
    And "has_next" is true
    And "next_page" equals 2
    And "background" is a non-empty string containing "the common-rules MCP server is connected"
    And "scenario.name" equals "get_context returns the whole map in a single call"
    And "scenario.keyword" equals "Scenario"
    And "scenario.tags" equals ["@get_context", "@discovery"]

  @get_bdd_scenario @pagination
  Scenario: paging forward reaches a final page that says it is final
    Given agent_bdd.feature has N scenarios where N equals the value of "total_pages"
    When I call get_bdd_scenario(page=N)
    Then "page" equals N
    And "has_next" is false
    And "next_page" is null
    And "instruction" contains the text "This is the last scenario"

  @get_bdd_scenario @errors
  Scenario: a page beyond the end reports the valid range instead of an empty result
    Given the feature file has a known number of scenarios
    When I call get_bdd_scenario(page=9999)
    Then the response has a key "error"
    And "error" contains the text "Page 9999 is out of range"
    And "error" contains the text "valid pages 1-"
    And "has_next" is false
    And the response has no key "scenario"

  @get_bdd_scenario @errors
  Scenario: page zero is rejected rather than silently treated as page one
    Given pages are numbered from 1
    When I call get_bdd_scenario(page=0)
    Then the response has a key "error"
    And "error" contains the text "Page 0 is out of range"
    And the response has no key "scenario"

  @get_bdd_scenario @execution
  Scenario: each page tells the agent to observe rather than assume
    Given any valid page number
    When I call get_bdd_scenario(page=2)
    Then "instruction" contains the text "Execute this scenario for real"
    And "instruction" contains the text "Report the observed value, not the expected one"
    And "instruction" contains the text "call get_bdd_scenario(page=3)"

  # ------------------------------------------------------------ native hooks

  @hooks @enforcement
  Scenario: setup installs lifecycle hooks into every detected editor
    Given the project contains a .cursor directory
    And the default kit ships 6 hook resources
    When I call setup_config()
    Then "editor_hooks.installed" contains an entry with "ide" equal to "cursor"
    And that entry has "hook_count" equal to 6
    And that entry has "config" equal to ".cursor/hooks.json"
    And the file .cursor/hooks/guard-secrets.sh exists and is executable
    And that file contains the marker "common-rules:managed-hook"

  @hooks @cursor
  Scenario: a Cursor hook returns the permission contract Cursor documents
    Given .cursor/hooks/guard-secrets.sh has been generated
    When I run that script with the input {"command":"cat .env"}
    Then the exit code is 0
    And stdout parses as JSON with "permission" equal to "deny"
    And "user_message" explains that credentials would reach the transcript

  @hooks @claude
  Scenario: the same hook blocks through Claude Code's exit code contract
    Given .claude/hooks/guard-secrets.sh has been generated from the same resource
    When I run that script with the input {"tool_input":{"command":"cat .env"}}
    Then the exit code is 2
    And stderr contains the blocking reason
    And stdout is empty

  @hooks @portability
  Scenario: one hook definition produces the right shape for each editor
    Given the hook resource "guard-destructive" declares the canonical event "before-shell"
    When setup_config installs it for cursor, claude and antigravity
    Then .cursor/hooks.json maps it under the event "beforeShellExecution"
    And .claude/settings.json maps it under "PreToolUse" with matcher "Bash"
    And .agents/hooks.json maps it under "PreToolUse" with matcher "run_command"
    And all three scripts contain the same hook logic

  @hooks @enforcement
  Scenario: the session briefing reaches the agent without the agent choosing to read anything
    Given .claude/hooks/orchestration-briefing.sh has been generated
    When I run that script with the input {}
    Then stdout parses as JSON
    And "hookSpecificOutput.hookEventName" equals "SessionStart"
    And "hookSpecificOutput.additionalContext" instructs the agent to call get_context()

  @hooks @authorship
  Scenario: a commit crediting an AI co-author is blocked before the command runs
    Given .cursor/hooks/protect-authorship.sh has been generated
    When I run it with a git commit command whose message contains "Co-authored-by: Claude <noreply@anthropic.com>"
    Then "permission" equals "deny"
    When I run it with a git commit command whose message contains "Co-authored-by: Ana Pereira <ana@example.com>"
    Then "permission" equals "allow"

  @hooks @safety
  Scenario: hand-written hooks are preserved when generated ones are installed
    Given .cursor/hooks.json already contains a handler "./my-own-formatter.sh" under "afterFileEdit"
    When I call setup_config()
    Then .cursor/hooks.json still contains "./my-own-formatter.sh" under "afterFileEdit"
    And it also contains the generated handlers

  @hooks @safety
  Scenario: unrelated Claude settings survive hook installation
    Given .claude/settings.json contains "theme": "dark"
    When I call setup_config()
    Then .claude/settings.json still contains "theme": "dark"
    And it now contains a "hooks" object

  @hooks @coverage
  Scenario: an event an editor does not support is reported rather than dropped
    Given Antigravity has no equivalent of the canonical event "before-prompt"
    When hooks are installed for antigravity
    Then "editor_hooks.unsupported" contains an entry naming that hook and that editor
    And no script for it is written under .agents/hooks/
    And "next_steps" mentions that the automation is unavailable there

  # ------------------------------------------------------------- self-check

  @self_check @discipline
  Scenario: every resource carries a questionnaire it must answer before finishing
    When I call get_context()
    Then every element of "resources" has a non-empty "self_check" list
    And every entry in every "self_check" list is phrased as a question

  @self_check @discipline
  Scenario: the questionnaire arrives with the instructions
    When I call get_resource(kind="skill", name="tdd")
    Then "self_check" is a list containing "Did I watch each test fail before making it pass, or write it green?"
    And "self_check" contains a question about where expected values come from

  @self_check @discipline
  Scenario: the self-review rule defines how the questionnaire is used
    When I call get_resource(kind="rule", name="self-review")
    Then "type" equals "Always"
    And "body" instructs extending the checklist before starting
    And "body" states that the work is done only when every answer is yes
    And "body" states that nothing is written to disk

  # --------------------------------------------------------------- receipt

  @receipt @reporting
  Scenario: the session receipt is a global always-applied rule
    When I call get_resource(kind="rule", name="session-receipt")
    Then "type" equals "Always"
    And "body" contains the key "schema_version"
    And "body" contains the key "verification"
    And "body" contains the key "outstanding"
    And "body" states that verification must name something observed

  # ------------------------------------------------------------------ sync

  @sync @portability
  Scenario: the whole kit exports to Cursor's documented layout
    Given the project contains a .cursor directory
    When I call sync_to_ide(ides=["cursor"])
    Then "synced" contains one entry with "ide" equal to "cursor"
    And .cursor/rules/general.mdc exists with "alwaysApply: true" in its frontmatter
    And .cursor/skills/tdd/SKILL.md exists with "name: tdd" in its frontmatter
    And .cursor/agents/reviewer.md exists
    And .cursor/hooks.json exists

  @sync @portability
  Scenario: the whole kit exports to Claude Code's documented layout
    When I call sync_to_ide(ides=["claude"])
    Then .claude/skills/tdd/SKILL.md exists
    And .claude/agents/reviewer.md exists
    And .claude/settings.json contains a "hooks" object
    And CLAUDE.md contains a managed block holding every Always rule

  @sync @portability
  Scenario: the whole kit exports to Antigravity's documented layout
    When I call sync_to_ide(ides=["antigravity"])
    Then .agents/skills/tdd/SKILL.md exists
    And .agents/hooks.json exists
    And AGENTS.md contains a managed block holding every Always rule

  @sync @commands
  Scenario: user-invocable resources become typeable commands in Claude Code
    When I call sync_to_ide(ides=["claude"], include_hooks=false)
    Then CLAUDE.md contains the section "## Custom Commands"
    And CLAUDE.md contains the line "<chat-commands>"
    And CLAUDE.md contains the line "- /grill-me:"
    And CLAUDE.md contains the line "- /feature-dev:"
    And CLAUDE.md contains the line "- /pr-babysit:"
    And CLAUDE.md contains the line "</chat-commands>"
    And CLAUDE.md does not contain the line "- /guard-secrets:"

  @sync @commands
  Scenario: an editor that does not read the command block never receives one
    When I call sync_to_ide(ides=["antigravity"], include_hooks=false)
    Then AGENTS.md does not contain the line "<chat-commands>"

  @sync @commands
  Scenario: a command with trigger "both" stays model-invokable
    When I call sync_to_ide(ides=["claude"], include_hooks=false)
    Then CLAUDE.md contains the line "- /grill-me:"
    And .claude/skills/grill-me/SKILL.md does not contain "disable-model-invocation"
    And .claude/skills/to-spec/SKILL.md contains "disable-model-invocation: true"

  @sync @completeness
  Scenario: nothing loadable is left behind
    When I call sync_to_ide(ides=["cursor"], include_hooks=false)
    Then "files_written" equals the number of non-hook resources in get_context()
    And every resource name in get_context() appears in the written paths

  @sync @fidelity
  Scenario: a user-invoked skill is exported as manual-only where the editor supports it
    When I call sync_to_ide(ides=["claude"])
    Then .claude/skills/to-spec/SKILL.md contains "disable-model-invocation: true"
    And .claude/skills/tdd/SKILL.md does not contain "disable-model-invocation"

  @sync @fidelity
  Scenario: the self-check travels into every native format
    When I call sync_to_ide(ides=["cursor", "claude", "antigravity"])
    Then .cursor/skills/tdd/SKILL.md contains a "## Self-check" section
    And .claude/skills/tdd/SKILL.md contains a "## Self-check" section
    And .agents/skills/tdd/SKILL.md contains a "## Self-check" section

  @sync @safety
  Scenario: re-syncing is stable and preserves what the user wrote
    Given CLAUDE.md contains the user's own line "Always use tabs."
    When I call sync_to_ide(ides=["claude"]) twice
    Then CLAUDE.md still contains "Always use tabs."
    And CLAUDE.md contains exactly one managed block
    And the content of .claude/skills/tdd/SKILL.md is identical after both runs

  @sync @safety
  Scenario: cleaning removes only what sync generated
    Given sync has run for cursor
    And .cursor/skills/my-own/SKILL.md was written by hand
    When I call sync_to_ide(ides=["cursor"], clean=true)
    Then .cursor/skills/my-own/SKILL.md still exists
    And .cursor/skills/tdd/SKILL.md no longer exists
    And "removed" lists the generated files

  @sync @gating
  Scenario: a gated resource is not exported either
    Given ENABLE_NOTEBOOKS is "false"
    When I call sync_to_ide(ides=["cursor"])
    Then .cursor/skills/notebook/SKILL.md does not exist
