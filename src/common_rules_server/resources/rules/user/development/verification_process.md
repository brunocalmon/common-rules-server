```yaml
# This description field briefly states the purpose and intended use of this rule.
description: This rule provides guidance to the agent for performing a comprehensive verification process for software projects. It describes how to check documentation status, execute build processes, and validate code quality. The rule does not perform any verification steps automatically; the agent should use it as a checklist and reporting guide for project validation.
# 'globs' specifies file-matching patterns (e.g., "*.md", "*.py") that determine which files this rule applies to.
globs: 
# Rule Trigger Types: 
# - Always: Rule is always applied by the system.
# - Agent Requested: Rule is applied when specifically requested by an agent.
# - Auto Attached: Rule is automatically attached based on context or conditions.
# - Manual: Rule is applied only when manually selected or invoked.
type: Agent Requested
artifacts:
  - templates/verification_process.md
```
// VerificationProcess Rule - Pseudocode

// The output for this rule must be created according to the template_id: templates/verification_process.md

var context = input.context

var documentation_status = {
    "readme_exists": false,
    "architecture_exists": false,
    "build_process_documented": false
}

var build_status = {
    "clean_build": "pending",
    "code_generation": "pending", 
    "code_quality": "pending",
    "test_coverage": "pending",
    "test_summary": "pending"
}

var errors = []
var warnings = []
var next_action = ""
var build_system = "unknown"
var build_command = ""

// Check documentation status first
var readme_exists = FileExists("README.md")
var architecture_exists = FileExists("ARCHITECTURE.md")

documentation_status.readme_exists = readme_exists
documentation_status.architecture_exists = architecture_exists

if !readme_exists || !architecture_exists:
    // Documentation is missing - instruct Agent to ask user
    errors.append("Cannot proceed with verification - README.md and/or ARCHITECTURE.md are missing")
    next_action = "Ask user to create missing documentation with build and verification instructions"
    
    return {
        "output_file": "planning/documentation/verification_process{YYYY-MM-dd-hh-mm-ss}.md",
        "build_status": build_status,
        "build_system": build_system,
        "build_command": build_command,
        "errors": errors,
        "warnings": warnings,
        "next_action": next_action,
        "documentation_status": documentation_status,
        "all_passed": false
    }

// Agent Instructions: Read build process from documentation
var agent_instructions = []
agent_instructions.push("Read README.md to understand build and verification process")
agent_instructions.push("Read ARCHITECTURE.md to understand build system and commands")
agent_instructions.push("Follow documented build and verification commands")
agent_instructions.push("If build process is not documented, ask user to specify")

// Detect build system from project files
if FileExists("build.gradle") || FileExists("build.gradle.kts"):
    build_system = "gradle"
    build_command = "Read build commands from README.md or ARCHITECTURE.md"
elif FileExists("pom.xml"):
    build_system = "maven"
    build_command = "Read build commands from README.md or ARCHITECTURE.md"
elif FileExists("package.json"):
    build_system = "npm"
    build_command = "Read build commands from README.md or ARCHITECTURE.md"
elif FileExists("requirements.txt") || FileExists("pyproject.toml"):
    build_system = "python"
    build_command = "Read build commands from README.md or ARCHITECTURE.md"
elif FileExists("Cargo.toml"):
    build_system = "cargo"
    build_command = "Read build commands from README.md or ARCHITECTURE.md"
else:
    build_system = "unknown"
    build_command = "Ask user to specify build system and commands"

documentation_status.build_process_documented = true

// Step 1: Clean Build (using documented commands)
agent_instructions.push("Execute clean build using documented commands")
agent_instructions.push("If build fails, ask user for guidance on fixing build issues")

// Note: Actual build command execution would be handled by the Agent
// based on the documented commands in README.md and ARCHITECTURE.md
var build_result = {
    "exit_code": 0, // Placeholder - Agent would execute actual documented commands
    "stdout": "",
    "stderr": ""
}

if build_result.exit_code == 0:
    build_status.clean_build = "pass"
    build_status.code_generation = "pass"
    build_status.test_coverage = "pass"
    build_status.test_summary = "pass"
    next_action = "Proceed to code quality validation using documented process"
else:
    build_status.clean_build = "fail"
    errors.append("Build failed - ask user to check build configuration and fix issues")
    next_action = "Ask user to fix build errors before proceeding"

// Step 2: Code Quality Validation (only if build passed)
if build_status.clean_build == "pass":
    agent_instructions.push("Execute code quality checks using documented commands")
    agent_instructions.push("If code quality checks fail, ask user for guidance on fixing issues")
    
    // Note: Actual code quality command execution would be handled by the Agent
    // based on the documented commands in README.md and ARCHITECTURE.md
    var quality_result = {
        "exit_code": 0, // Placeholder - Agent would execute actual documented commands
        "stdout": "",
        "stderr": ""
    }
    
    if quality_result.exit_code == 0:
        build_status.code_quality = "pass"
        next_action = "All verification steps passed using documented process"
    else:
        build_status.code_quality = "fail"
        errors.append("Code quality checks failed - ask user to fix quality issues")
        next_action = "Ask user to fix code quality violations"

// Extract warnings from output (if any)
if build_result.stdout:
    for line in build_result.stdout.splitlines():
        if "warning" in line.lower():
            warnings.append(line.strip())

var output_file = "planning/documentation/verification_process{YYYY-MM-dd-hh-mm-ss}.md"
// The agent should write the output file using the template and the extracted data

return {
    "output_file": output_file,
    "build_status": build_status,
    "build_system": build_system,
    "build_command": build_command,
    "errors": errors,
    "warnings": warnings,
    "next_action": next_action,
    "documentation_status": documentation_status,
    "all_passed": build_status.clean_build == "pass" && build_status.code_quality == "pass"
}
