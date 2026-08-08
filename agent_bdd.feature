# agent_bdd.feature — Common Rules MCP Server Integration Tests
# This file is read by get_bdd_scenario(page) and executed by the AI agent.
# Each Scenario is paginated independently (1 per page).
# The agent calls the real MCP tools and validates exact responses.

Feature: get_context — Progressive Disclosure
  The get_context tool returns metadata for all available resources
  without leaking their full bodies, saving tokens for the agent.

  Scenario: Returns all built-in resources with required metadata fields
    Given the MCP server "common-rules-server-local-test" is running
    And no user overrides exist in .common-rules/
    When I call get_context with no arguments
    Then the response is a JSON list
    And every item in the list contains the key "kind"
    And every item in the list contains the key "name"
    And every item in the list contains the key "description"
    And every item in the list contains the key "source" with value "built-in"
    And every item in the list contains the key "relationships"
    And no item in the list contains the key "body"
    And no item in the list contains the key "file"

  Scenario: Context includes all expected resource kinds
    Given the MCP server "common-rules-server-local-test" is running
    When I call get_context with no arguments
    Then the response contains items with kind "rule"
    And the response contains items with kind "skill"
    And the response contains items with kind "agent"
    And the response contains items with kind "workflow"
    And the response contains items with kind "loop"

  Scenario: Context includes the orchestrator rule with its relationships
    Given the MCP server "common-rules-server-local-test" is running
    When I call get_context with no arguments
    Then the response contains an item where kind is "rule" and name is "orchestrator"
    And that item has a "relationships" object
    And that item's relationships include "comes-from" with target "/general" and required true
    And that item's relationships include "can-invoke" with target "/grill-me" and required false
    And that item's relationships include "output" with value "templates/orchestrator.md"

Feature: get_resource — Full Resource Retrieval
  The get_resource tool returns the complete parsed resource including
  YAML frontmatter fields, the Markdown body, and the file path.

  Scenario: Fetch rule:general returns full structure
    Given the MCP server "common-rules-server-local-test" is running
    When I call get_resource with kind "rule" and name "general"
    Then the response is a JSON object
    And the response has key "kind" with value "rule"
    And the response has key "name" with value "general"
    And the response has key "description" with value "Quick workspace health check — docs, git, build status. Applied automatically at the start of every session."
    And the response has key "type" with value "Always"
    And the response has key "source" with value "built-in"
    And the response has key "body" which is a non-empty string
    And the response has key "file" which ends with "resources/rules/general.md"
    And the response has key "env" which is an object
    And the response "env" has key "optional" containing "README_PATH"
    And the response "env" has key "optional" containing "WIKI_DIR"
    And the response "relationships" has key "goes-to" as a list with at least 1 item
    And the first item in "goes-to" has target "/orchestrator" and required true

  Scenario: Fetch skill:tdd returns TDD skill with env requirements
    Given the MCP server "common-rules-server-local-test" is running
    When I call get_resource with kind "skill" and name "tdd"
    Then the response is a JSON object
    And the response has key "kind" with value "skill"
    And the response has key "name" with value "tdd"
    And the response has key "trigger" with value "model-invoked"
    And the response has key "env" which is an object
    And the response "env" has key "requires" containing "TEST_COMMAND"
    And the response has key "body" which contains "Red." and "Green."
    And the response "relationships" has key "goes-to" as a list
    And the first item in "goes-to" has target "/verify" and required true

  Scenario: Fetch agent:reviewer returns persona and constraints
    Given the MCP server "common-rules-server-local-test" is running
    When I call get_resource with kind "agent" and name "reviewer"
    Then the response is a JSON object
    And the response has key "kind" with value "agent"
    And the response has key "name" with value "reviewer"
    And the response has key "persona" which is a non-empty string
    And the response "relationships" has key "uses" as a list
    And the first item in "uses" has target "/review" and required true

  Scenario: Fetch workflow:feature-dev returns phases
    Given the MCP server "common-rules-server-local-test" is running
    When I call get_resource with kind "workflow" and name "feature-dev"
    Then the response is a JSON object
    And the response has key "kind" with value "workflow"
    And the response has key "name" with value "feature-dev"
    And the response has key "phases" which is a list with at least 3 items
    And the response "relationships" has key "output" with value "templates/workflow-summary.md"

  Scenario: Fetch loop:pr-babysit returns recurrence config
    Given the MCP server "common-rules-server-local-test" is running
    When I call get_resource with kind "loop" and name "pr-babysit"
    Then the response is a JSON object
    And the response has key "kind" with value "loop"
    And the response has key "name" with value "pr-babysit"
    And the response "relationships" has key "can-invoke" as a list
    And the first item in "can-invoke" has target "/verify" and required true

  Scenario: Fetch nonexistent resource returns error
    Given the MCP server "common-rules-server-local-test" is running
    When I call get_resource with kind "skill" and name "nonexistent-skill"
    Then the response is a JSON object
    And the response has key "error" with value "Resource skill:nonexistent-skill not found."

Feature: setup_config — Environment Detection
  The setup_config tool auto-detects the project's build system
  and returns the merged configuration with defaults, auto-detected,
  and .env file values.

  Scenario: Auto-detects Python project from pyproject.toml
    Given the MCP server "common-rules-server-local-test" is running
    And the project root contains a file "pyproject.toml"
    When I call setup_config with no arguments
    Then the response is a JSON object
    And the response has key "config" which is an object
    And the response "config" has key "BUILD_SYSTEM" with value "python"
    And the response "config" has key "PROJECT_LANGUAGE" with value "python"
    And the response "config" has key "README_PATH" with value "README.md"
    And the response "config" has key "COVERAGE_THRESHOLD" with value "80"
    And the response "config" has key "STRIP_AI_COAUTHORS" with value "true"
    And the response "config" has key "RESOURCES_DIR" with value ".common-rules-server/resources/"
    And the response has key "env_status" which is an object
    And the response has key "git_hooks" which is an object
    And the response "env_status" has key "auto_detected" which is an object
    And the response "env_status" "auto_detected" has key "BUILD_SYSTEM" with value "python"
    And the response "env_status" "auto_detected" has key "PROJECT_LANGUAGE" with value "python"

  Scenario: Returns correct env_status when no config.env file exists
    Given the MCP server "common-rules-server-local-test" is running
    And no file ".common-rules-server/config.env" exists in the project root
    When I call setup_config with no arguments
    Then the response "env_status" has key "file_exists" with value true
    And the response "env_status" has key "file_path" which ends with "config.env"

Feature: create_resource — Dynamic Resource Creation
  The create_resource tool writes a new YAML-frontmatter Markdown file
  to the user's project-local .common-rules-server/resources/ directory.

  Scenario: Create a new skill and verify structure
    Given the MCP server "common-rules-server-local-test" is running
    When I call create_resource with kind "skill", name "test-bdd-skill", description "A BDD test skill", and body "## Instructions\nRun BDD tests."
    Then the response is a string containing "Created skill test-bdd-skill at"
    And the file ".common-rules/test-bdd-skill.md" exists on disk
    And the file content starts with "---"
    And the YAML frontmatter contains key "kind" with value "skill"
    And the YAML frontmatter contains key "name" with value "test-bdd-skill"
    And the YAML frontmatter contains key "description" with value "A BDD test skill"
    And the body after the frontmatter contains "## Instructions"
    # Cleanup: delete .common-rules/test-bdd-skill.md after validation

Feature: get_bdd_scenario — Paginated Test Scenarios
  The get_bdd_scenario tool reads this very file and returns
  one scenario at a time so the agent can execute tests in a loop.

  Scenario: Page 1 returns the first scenario
    Given the MCP server "common-rules-server-local-test" is running
    And the file "agent_bdd.feature" exists in the project root
    When I call get_bdd_scenario with page 1
    Then the response is a JSON object
    And the response has key "page" with value 1
    And the response has key "total_pages" which is greater than 0
    And the response has key "has_next" with value true
    And the response has key "scenario" which is an object
    And the response "scenario" has key "name" which is a non-empty string
    And the response "scenario" has key "body" which is a non-empty string

  Scenario: Last page has has_next false
    Given the MCP server "common-rules-server-local-test" is running
    And the file "agent_bdd.feature" exists in the project root
    When I call get_bdd_scenario with page equal to total_pages
    Then the response has key "has_next" with value false
    And the response has key "scenario" which is an object

  Scenario: Out-of-range page returns error
    Given the MCP server "common-rules-server-local-test" is running
    When I call get_bdd_scenario with page 9999
    Then the response is a JSON object
    And the response has key "error" which contains "out of range"
