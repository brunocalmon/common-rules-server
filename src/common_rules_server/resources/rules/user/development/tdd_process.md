```yaml
# This description field briefly states the purpose and intended use of this rule.
description: This rule provides guidance to the agent for following and tracking Test-Driven Development (TDD) cycles (Red-Green-Refactor). It describes how to check documentation status, identify test frameworks, and structure outputs for each phase. The rule does not execute or track TDD cycles automatically; the agent should use it as a manual for proper TDD workflow execution.
# 'globs' specifies file-matching patterns (e.g., "*.md", "*.py") that determine which files this rule applies to.
globs: 
# Rule Trigger Types: 
# - Always: Rule is always applied by the system.
# - Agent Requested: Rule is applied when specifically requested by an agent.
# - Auto Attached: Rule is automatically attached based on context or conditions.
# - Manual: Rule is applied only when manually selected or invoked.
type: Agent Requested
artifacts:
  - templates/tdd_process.md
```

// TDDProcess Rule - Pseudocode

/*
Expected Output Template (Markdown):

# TDD Process Execution

## Documentation Status
- README.md: <exists|missing>
- ARCHITECTURE.md: <exists|missing>
- TDD Process Documented: <yes|no>

## Current Cycle
- Phase: <red|green|refactor>
- Test: <test description>
- Status: <pending|running|completed|failed>

## Test Framework
- Test System: <detected test system>
- Test Commands: <commands from documentation>

## Test Coverage
- Total tests: <number>
- Passing tests: <number>
- Failing tests: <number>
- Coverage: <percentage>%

## Next Steps
- <next action>
*/

var current_phase = input.phase // "red", "green", or "refactor"
var test_description = input.test_description
var context = input.context

var documentation_status = {
    "readme_exists": false,
    "architecture_exists": false,
    "tdd_process_documented": false
}

var test_status = "pending"
var total_tests = 0
var passing_tests = 0
var failing_tests = 0
var coverage_percentage = 0
var next_action = ""
var test_system = "unknown"
var test_commands = ""

// Check documentation status first
var readme_exists = FileExists("README.md")
var architecture_exists = FileExists("ARCHITECTURE.md")

documentation_status.readme_exists = readme_exists
documentation_status.architecture_exists = architecture_exists

if !readme_exists || !architecture_exists:
    // Documentation is missing - instruct Agent to ask user
    test_status = "failed"
    next_action = "Ask user to create missing documentation with TDD process instructions"
    
    return {
        "output_file": "planning/documentation/tdd_process{YYYY-MM-dd-hh-mm-ss}.md",
        "current_phase": current_phase,
        "test_description": test_description,
        "test_status": test_status,
        "total_tests": total_tests,
        "passing_tests": passing_tests,
        "failing_tests": failing_tests,
        "coverage_percentage": coverage_percentage,
        "next_action": next_action,
        "documentation_status": documentation_status,
        "test_system": test_system,
        "test_commands": test_commands
    }

// Agent Instructions: Read TDD process from documentation
var agent_instructions = []
agent_instructions.push("Read README.md to understand TDD process and testing approach")
agent_instructions.push("Read ARCHITECTURE.md to understand testing framework and commands")
agent_instructions.push("Follow documented TDD process and testing commands")
agent_instructions.push("If TDD process is not documented, ask user to specify")

// Detect test system from project files
if FileExists("build.gradle") || FileExists("build.gradle.kts"):
    test_system = "gradle"
    test_commands = "Read test commands from README.md or ARCHITECTURE.md"
elif FileExists("pom.xml"):
    test_system = "maven"
    test_commands = "Read test commands from README.md or ARCHITECTURE.md"
elif FileExists("package.json"):
    test_system = "npm"
    test_commands = "Read test commands from README.md or ARCHITECTURE.md"
elif FileExists("requirements.txt") || FileExists("pyproject.toml"):
    test_system = "python"
    test_commands = "Read test commands from README.md or ARCHITECTURE.md"
elif FileExists("Cargo.toml"):
    test_system = "cargo"
    test_commands = "Read test commands from README.md or ARCHITECTURE.md"
else:
    test_system = "unknown"
    test_commands = "Ask user to specify testing framework and commands"

documentation_status.tdd_process_documented = true

if current_phase == "red":
    // Write failing test using documented approach
    agent_instructions.push("Write failing test using documented testing framework")
    agent_instructions.push("Follow documented test structure and conventions")
    agent_instructions.push("If test framework is unclear, ask user for guidance")
    
    test_status = "running"
    next_action = "Ask user to write failing test using documented testing approach"
    
    // Note: Actual test writing would be guided by the Agent
    // based on the documented testing approach in README.md and ARCHITECTURE.md
    var test_written = true // Placeholder - Agent would guide test writing
    
    if test_written:
        test_status = "completed"
        next_action = "Move to green phase - implement minimum code to pass using documented approach"
    else:
        test_status = "failed"
        next_action = "Ask user to fix test implementation"

else if current_phase == "green":
    // Implement minimum code to pass test using documented approach
    agent_instructions.push("Implement minimum code to pass test using documented approach")
    agent_instructions.push("Follow documented coding standards and patterns")
    agent_instructions.push("If implementation approach is unclear, ask user for guidance")
    
    test_status = "running"
    next_action = "Ask user to implement minimum code to pass test using documented approach"
    
    // Note: Actual implementation would be guided by the Agent
    // based on the documented approach in README.md and ARCHITECTURE.md
    var implementation_complete = true // Placeholder - Agent would guide implementation
    
    if implementation_complete:
        test_status = "completed"
        next_action = "Move to refactor phase - improve code quality using documented approach"
    else:
        test_status = "failed"
        next_action = "Ask user to fix implementation to make test pass"

else if current_phase == "refactor":
    // Refactor while keeping tests passing using documented approach
    agent_instructions.push("Refactor code while keeping tests passing using documented approach")
    agent_instructions.push("Follow documented refactoring guidelines and standards")
    agent_instructions.push("If refactoring approach is unclear, ask user for guidance")
    
    test_status = "running"
    next_action = "Ask user to refactor code using documented approach while ensuring tests pass"
    
    // Note: Actual refactoring would be guided by the Agent
    // based on the documented approach in README.md and ARCHITECTURE.md
    var refactoring_complete = true // Placeholder - Agent would guide refactoring
    
    if refactoring_complete:
        test_status = "completed"
        next_action = "Move to next test or complete if all tests pass using documented approach"
    else:
        test_status = "failed"
        next_action = "Ask user to revert refactoring and try different approach"

// Calculate test statistics using documented approach
agent_instructions.push("Calculate test statistics using documented testing tools")
agent_instructions.push("If test statistics are unclear, ask user for guidance")

// Note: Actual test statistics would be calculated by the Agent
// based on the documented testing tools in README.md and ARCHITECTURE.md
total_tests = 10 // Placeholder - Agent would get actual count
passing_tests = 8 // Placeholder - Agent would get actual count
failing_tests = 2 // Placeholder - Agent would get actual count
coverage_percentage = 85 // Placeholder - Agent would get actual coverage

// The output for this rule must be created according to the template_id: templates/tdd_process.md

return {
    "output_file": "planning/documentation/tdd_process{YYYY-MM-dd-hh-mm-ss}.md",
    "current_phase": current_phase,
    "test_description": test_description,
    "test_status": test_status,
    "total_tests": total_tests,
    "passing_tests": passing_tests,
    "failing_tests": failing_tests,
    "coverage_percentage": coverage_percentage,
    "next_action": next_action,
    "documentation_status": documentation_status,
    "test_system": test_system,
    "test_commands": test_commands
}
