```yaml
# This description field briefly states the purpose and intended use of this rule.
description: This rule provides structured guidance to the agent for performing a comprehensive workspace review. It outlines how to check rule compliance, documentation status, cost/time tracking, system status, and commit status. The rule does not perform any actions automatically; instead, it offers a checklist and instructions for the agent to follow when reviewing the project state and preparing reports.
# 'globs' specifies file-matching patterns (e.g., "*.md", "*.py") that determine which files this rule applies to.
globs:
# Rule Trigger Types: 
# - Always: Rule is always applied by the system.
# - Agent Requested: Rule is applied when specifically requested by an agent.
# - Auto Attached: Rule is automatically attached based on context or conditions.
# - Manual: Rule is applied only when manually selected or invoked.
type: Always
artifacts:
  - templates/general_system_rule.md
```

// GeneralSystemRule - Pseudocode

// The output for this rule must be created according to the template_id: templates/general_system_rule.md

var context = input.context
var current_request = input.current_request
var response_data = input.response_data

var rule_compliance = {
    "user_rules_source": "",
    "applied_rules": [],
    "priority": ""
}

var documentation_status = {
    "readme_exists": false,
    "architecture_exists": false,
    "documentation_complete": false
}

var cost_tracking = {
    "current_time": "",
    "token_usage": 0,
    "estimated_cost": 0.0
}

var system_status = {
    "workspace_root": "",
    "current_directory": "",
    "git_status": "unknown",
    "build_status": "unknown"
}

var commit_status = {
    "pending_changes": false,
    "commit_reminder": "",
    "suggested_command": ""
}

var agent_instructions = []

// Step 1: Rule Compliance Check
var cursor_rules_exist = DirectoryExists(".cursor/rules")
if cursor_rules_exist:
    rule_compliance.user_rules_source = ".cursor/rules"
    rule_compliance.priority = ".cursor/rules takes priority"
    rule_compliance.applied_rules = ListFiles(".cursor/rules", "*.mdc")
else:
    rule_compliance.user_rules_source = "common-rules-server"
    rule_compliance.priority = "MCP server rules"
    rule_compliance.applied_rules = GetUserRulesFromMCPServer()

// Step 2: Documentation Status Check
documentation_status.readme_exists = FileExists("README.md")
documentation_status.architecture_exists = FileExists("ARCHITECTURE.md")
documentation_status.documentation_complete = documentation_status.readme_exists && documentation_status.architecture_exists

if documentation_status.documentation_complete:
    agent_instructions.push("Read README.md to understand project overview, usage, and stack information")
    agent_instructions.push("Read ARCHITECTURE.md to understand project structure and architectural patterns")
    agent_instructions.push("Follow the documented architecture and development process")
else if documentation_status.readme_exists:
    agent_instructions.push("README.md exists but ARCHITECTURE.md is missing")
    agent_instructions.push("Ask user to create ARCHITECTURE.md with project structure and architectural information")
    agent_instructions.push("Do not assume any specific architecture - ask user for clarification")
else if documentation_status.architecture_exists:
    agent_instructions.push("ARCHITECTURE.md exists but README.md is missing")
    agent_instructions.push("Ask user to create README.md with project overview, usage, and stack information")
    agent_instructions.push("Do not assume any specific technology stack - ask user for clarification")
else:
    agent_instructions.push("Both README.md and ARCHITECTURE.md are missing")
    agent_instructions.push("Ask user to create project documentation")
    agent_instructions.push("Ask user to specify project structure, technology stack, and architectural patterns")
    agent_instructions.push("Do not make any assumptions about technologies or patterns")

// Step 3: Cost & Time Tracking
var time_command = "date -u +\"%Y-%m-%d %H:%M:%S UTC\""
var time_result = ExecuteCommand(time_command)
cost_tracking.current_time = time_result.stdout.strip()

// Calculate token usage and cost
cost_tracking.token_usage = CalculateTokenUsage(current_request, response_data)
cost_tracking.estimated_cost = CalculateMonetaryCost(cost_tracking.token_usage)

// Step 4: System Status Check
system_status.workspace_root = GetWorkspaceRoot()
system_status.current_directory = GetCurrentDirectory()

// Check git status
var git_status_command = "git status --porcelain"
var git_status_result = ExecuteCommand(git_status_command)
if git_status_result.exit_code == 0:
    if git_status_result.stdout.strip():
        system_status.git_status = "dirty"
        commit_status.pending_changes = true
        commit_status.commit_reminder = "Don't forget to commit your changes!"
        commit_status.suggested_command = "git add . && git commit -m \"[Your commit message here]\""
    else:
        system_status.git_status = "clean"
        commit_status.pending_changes = false

// Check build status (read from documentation, don't assume)
if documentation_status.documentation_complete:
    agent_instructions.push("Check README.md and ARCHITECTURE.md for build system information")
    agent_instructions.push("Use the documented build commands for verification")
    agent_instructions.push("If build system is not documented, ask user to specify")
else:
    agent_instructions.push("Cannot determine build system without documentation")
    agent_instructions.push("Ask user to specify build system and commands")
    system_status.build_status = "unknown"

return {
    "output_file": "planning/documentation/general_system_rule{YYYY-MM-dd-hh-mm-ss}.md",
    "rule_compliance": rule_compliance,
    "documentation_status": documentation_status,
    "cost_tracking": cost_tracking,
    "system_status": system_status,
    "commit_status": commit_status,
    "agent_instructions": agent_instructions,
    "system_ready": system_status.build_status == "success" || system_status.build_status == "unknown",
    "documentation_complete": documentation_status.documentation_complete
}