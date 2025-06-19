```yaml
# This description field briefly states the purpose and intended use of this rule.
description: This rule provides guidance to the agent for performing testing and coverage analysis. It outlines how to check for required documentation, execute build and test commands using documented procedures, analyze code coverage, and identify missing tests. The rule does not automate any testing or analysis; the agent should follow the steps to ensure testing aligns with project standards and to generate comprehensive test cycle reports.
# 'globs' specifies file-matching patterns (e.g., "*.md", "*.py") that determine which files this rule applies to.
globs: 
# Rule Trigger Types: 
# - Always: Rule is always applied by the system.
# - Agent Requested: Rule is applied when specifically requested by an agent.
# - Auto Attached: Rule is automatically attached based on context or conditions.
# - Manual: Rule is applied only when manually selected or invoked.
type: Agent Requested
artifacts:
  - templates/test_cycle.md
```
// TestCycle Rule - Pseudocode

// The output for this rule must be created according to the template_id: templates/test_cycle.md

var context = input.context

var documentation_status = {
    "readme_exists": false,
    "architecture_exists": false,
    "testing_process_documented": false
}

var coverage_percentage = 0
var uncovered_methods = []
var uncovered_branches = []
var missing_tests = []
var actions_taken = []
var next_action = ""
var test_system = "unknown"
var coverage_tool = "unknown"

// Check documentation status first
var readme_exists = FileExists("README.md")
var architecture_exists = FileExists("ARCHITECTURE.md")

documentation_status.readme_exists = readme_exists
documentation_status.architecture_exists = architecture_exists

if !readme_exists || !architecture_exists:
    // Documentation is missing - instruct Agent to ask user
    actions_taken.append("Cannot proceed with test cycle - README.md and/or ARCHITECTURE.md are missing")
    next_action = "Ask user to create missing documentation with testing and coverage instructions"
    
    return {
        "output_file": "planning/documentation/test_cycle{YYYY-MM-dd-hh-mm-ss}.md",
        "coverage_percentage": coverage_percentage,
        "uncovered_methods": uncovered_methods,
        "uncovered_branches": uncovered_branches,
        "missing_tests": missing_tests,
        "actions_taken": actions_taken,
        "next_action": next_action,
        "documentation_status": documentation_status,
        "coverage_complete": false
    }

// Agent Instructions: Read testing process from documentation
var agent_instructions = []
agent_instructions.push("Read README.md to understand testing and coverage process")
agent_instructions.push("Read ARCHITECTURE.md to understand testing framework and tools")
agent_instructions.push("Follow documented testing and coverage commands")
agent_instructions.push("If testing process is not documented, ask user to specify")

// Detect test system from project files
if FileExists("build.gradle") || FileExists("build.gradle.kts"):
    test_system = "gradle"
    coverage_tool = "Read coverage tool from README.md or ARCHITECTURE.md"
elif FileExists("pom.xml"):
    test_system = "maven"
    coverage_tool = "Read coverage tool from README.md or ARCHITECTURE.md"
elif FileExists("package.json"):
    test_system = "npm"
    coverage_tool = "Read coverage tool from README.md or ARCHITECTURE.md"
elif FileExists("requirements.txt") || FileExists("pyproject.toml"):
    test_system = "python"
    coverage_tool = "Read coverage tool from README.md or ARCHITECTURE.md"
elif FileExists("Cargo.toml"):
    test_system = "cargo"
    coverage_tool = "Read coverage tool from README.md or ARCHITECTURE.md"
else:
    test_system = "unknown"
    coverage_tool = "Ask user to specify testing framework and coverage tool"

documentation_status.testing_process_documented = true

// Step 1: Build and Test Execution (using documented commands)
agent_instructions.push("Execute build and test commands using documented process")
agent_instructions.push("If build fails, ask user for guidance on fixing build issues")

// Note: Actual build command execution would be handled by the Agent
// based on the documented commands in README.md and ARCHITECTURE.md
var build_result = {
    "exit_code": 0, // Placeholder - Agent would execute actual documented commands
    "stdout": "",
    "stderr": ""
}

if build_result.exit_code != 0:
    actions_taken.append("Build failed - ask user to fix build errors")
    next_action = "Ask user to fix build errors and retry"
    goto END

actions_taken.append("Build and test execution completed successfully using documented process")

// Step 2: Coverage Analysis (using documented tools)
agent_instructions.push("Execute coverage analysis using documented coverage tool")
agent_instructions.push("If coverage tool is not documented, ask user to specify")

// Note: Actual coverage analysis would be handled by the Agent
// based on the documented coverage tool in README.md and ARCHITECTURE.md
var coverage_data = {
    "coverage_percentage": 85, // Placeholder - Agent would get actual coverage
    "uncovered_methods": ["method1", "method2"], // Placeholder
    "uncovered_branches": ["branch1", "branch2"] // Placeholder
}

coverage_percentage = coverage_data.coverage_percentage
uncovered_methods = coverage_data.uncovered_methods
uncovered_branches = coverage_data.uncovered_branches

if coverage_percentage < 100:
    actions_taken.append("Coverage is under 100% - implementing missing tests using documented approach")
    
    // Identify missing tests
    for method in uncovered_methods:
        missing_tests.append("Test for method: " + method)
    
    for branch in uncovered_branches:
        missing_tests.append("Test for branch: " + branch)
    
    next_action = "Ask user to implement missing tests or guide through test implementation"
    
    // Note: Test implementation would be guided by the Agent
    // based on the documented testing approach in README.md and ARCHITECTURE.md
    if missing_tests.length > 0:
        var next_test = missing_tests[0]
        actions_taken.append("Identified missing test: " + next_test)
        next_action = "Ask user to implement missing tests using documented testing framework"
else:
    actions_taken.append("Coverage is 100% - process complete using documented approach")
    next_action = "Move to next task"

END:
return {
    "output_file": "planning/documentation/test_cycle{YYYY-MM-dd-hh-mm-ss}.md",
    "coverage_percentage": coverage_percentage,
    "uncovered_methods": uncovered_methods,
    "uncovered_branches": uncovered_branches,
    "missing_tests": missing_tests,
    "actions_taken": actions_taken,
    "next_action": next_action,
    "documentation_status": documentation_status,
    "test_system": test_system,
    "coverage_tool": coverage_tool,
    "coverage_complete": coverage_percentage == 100
}
