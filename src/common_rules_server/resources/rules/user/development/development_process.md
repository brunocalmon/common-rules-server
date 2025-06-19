```yaml
# This description field briefly states the purpose and intended use of this rule.
description: This rule provides guidance to the agent for orchestrating the development process. It describes how to check documentation status, manage phases (documentation review, TDD implementation, verification, deviation handling), and ensure adherence to project-specific workflows. The rule does not perform any orchestration automatically; the agent should use it as a manual for each phase.
# 'globs' specifies file-matching patterns (e.g., "*.md", "*.py") that determine which files this rule applies to.
globs: 
# Rule Trigger Types: 
# - Always: Rule is always applied by the system.
# - Agent Requested: Rule is applied when specifically requested by an agent.
# - Auto Attached: Rule is automatically attached based on context or conditions.
# - Manual: Rule is applied only when manually selected or invoked.
type: Agent Requested
artifacts:
  - templates/development_process.md
```

// DevelopmentProcess Rule - Pseudocode

// The output for this rule must be created according to the template_id: templates/development_process.md

var current_phase = input.phase // "documentation", "tdd", "verification", "deviation"
var context = input.context

var documentation_status = {
    "readme_exists": false,
    "architecture_exists": false,
    "development_process_documented": false
}

var status = "pending"
var current_sub_rule = ""
var process_flow = {
    "documentation_review": "pending",
    "tdd_implementation": "pending",
    "verification_steps": "pending",
    "deviation_handling": "pending"
}
var next_action = ""

// Check documentation status first
var readme_exists = FileExists("README.md")
var architecture_exists = FileExists("ARCHITECTURE.md")

documentation_status.readme_exists = readme_exists
documentation_status.architecture_exists = architecture_exists

if !readme_exists || !architecture_exists:
    // Documentation is missing - instruct Agent to ask user
    status = "pending"
    next_action = "Ask user to create missing documentation (README.md and/or ARCHITECTURE.md)"
    current_sub_rule = "documentation_required"
    
    // Agent Instructions
    var agent_instructions = []
    if !readme_exists:
        agent_instructions.push("README.md is missing - ask user to create project README with development process")
    if !architecture_exists:
        agent_instructions.push("ARCHITECTURE.md is missing - ask user to create architecture documentation")
    agent_instructions.push("Wait for user to provide documentation before proceeding with development process")
    
    return {
        "output_file": "planning/documentation/development_process{YYYY-MM-dd-hh-mm-ss}.md",
        "current_phase": current_phase,
        "status": status,
        "current_sub_rule": current_sub_rule,
        "process_flow": process_flow,
        "next_action": next_action,
        "documentation_status": documentation_status,
        "agent_instructions": agent_instructions,
        "phase_complete": false,
        "all_phases_complete": false
    }

// Documentation exists - read development process from project docs
var development_process_documented = false
if readme_exists && architecture_exists:
    // Agent Instructions: Read development process from documentation
    var agent_instructions = []
    agent_instructions.push("Read README.md to understand documented development process")
    agent_instructions.push("Read ARCHITECTURE.md to understand documented development workflow")
    agent_instructions.push("Follow the development process as documented in project files")
    agent_instructions.push("If development process is unclear in documentation, ask user for clarification")
    
    development_process_documented = true
    documentation_status.development_process_documented = true

if current_phase == "documentation":
    // Execute Documentation Review Process
    status = "in_progress"
    current_sub_rule = "documentation_process.rule.mdc"
    
    // Agent Instructions: Review documentation against project requirements
    var agent_instructions = []
    agent_instructions.push("Review README.md and ARCHITECTURE.md for completeness")
    agent_instructions.push("Check if development process is clearly documented")
    agent_instructions.push("Validate documentation against current project requirements")
    agent_instructions.push("If documentation is incomplete, ask user to update it")
    
    var doc_result = ExecuteSubRule("documentation_process.rule.mdc", {
        "phase": "review",
        "documentation_type": "technical",
        "context": context,
        "readme_exists": readme_exists,
        "architecture_exists": architecture_exists
    })
    
    if doc_result.review_complete:
        process_flow.documentation_review = "completed"
        status = "completed"
        next_action = "Proceed to TDD implementation using documented process"
    else:
        process_flow.documentation_review = "failed"
        status = "failed"
        next_action = "Fix documentation issues before proceeding"

else if current_phase == "tdd":
    // Execute TDD Implementation
    status = "in_progress"
    current_sub_rule = "tdd_process.rule.mdc"
    
    // Agent Instructions: Follow documented TDD process
    var agent_instructions = []
    agent_instructions.push("Read TDD process from README.md or ARCHITECTURE.md")
    agent_instructions.push("Follow documented testing approach for this project")
    agent_instructions.push("If TDD process is not documented, ask user to specify testing approach")
    agent_instructions.push("Use project-specific test framework and tools as documented")
    
    var tdd_result = ExecuteSubRule("tdd_process.rule.mdc", {
        "phase": "red",
        "test_description": context.current_task,
        "context": context,
        "readme_exists": readme_exists,
        "architecture_exists": architecture_exists
    })
    
    if tdd_result.test_status == "completed":
        process_flow.tdd_implementation = "completed"
        status = "completed"
        next_action = "Proceed to verification steps using documented process"
    else:
        process_flow.tdd_implementation = "failed"
        status = "failed"
        next_action = "Fix TDD implementation issues"

else if current_phase == "verification":
    // Execute Verification Steps
    status = "in_progress"
    current_sub_rule = "verification_process.rule.mdc"
    
    // Agent Instructions: Follow documented verification process
    var agent_instructions = []
    agent_instructions.push("Read verification process from README.md or ARCHITECTURE.md")
    agent_instructions.push("Follow documented build and verification commands")
    agent_instructions.push("If verification process is not documented, ask user to specify")
    agent_instructions.push("Use project-specific verification tools as documented")
    
    var verification_result = ExecuteSubRule("verification_process.rule.mdc", {
        "context": context,
        "readme_exists": readme_exists,
        "architecture_exists": architecture_exists
    })
    
    if verification_result.all_passed:
        process_flow.verification_steps = "completed"
        status = "completed"
        next_action = "Development process complete"
    else:
        process_flow.verification_steps = "failed"
        status = "failed"
        next_action = "Fix verification failures"

else if current_phase == "deviation":
    // Handle Deviations
    status = "in_progress"
    current_sub_rule = "deviation_process.rule.mdc"
    
    // Agent Instructions: Follow documented deviation process
    var agent_instructions = []
    agent_instructions.push("Read deviation process from README.md or ARCHITECTURE.md")
    agent_instructions.push("Follow documented deviation approval process")
    agent_instructions.push("If deviation process is not documented, ask user to specify")
    agent_instructions.push("Document deviation according to project standards")
    
    var deviation_result = ExecuteSubRule("deviation_process.rule.mdc", {
        "deviation_type": context.deviation_type,
        "reason": context.deviation_reason,
        "impact": context.deviation_impact,
        "requested_by": context.requested_by,
        "context": context,
        "readme_exists": readme_exists,
        "architecture_exists": architecture_exists
    })
    
    if deviation_result.deviation_approved:
        process_flow.deviation_handling = "completed"
        status = "completed"
        next_action = "Proceed with approved deviation"
    else:
        process_flow.deviation_handling = "failed"
        status = "failed"
        next_action = "Deviation not approved - follow standard process"

return {
    "output_file": "planning/documentation/development_process{YYYY-MM-dd-hh-mm-ss}.md",
    "current_phase": current_phase,
    "status": status,
    "current_sub_rule": current_sub_rule,
    "process_flow": process_flow,
    "next_action": next_action,
    "documentation_status": documentation_status,
    "phase_complete": status == "completed",
    "all_phases_complete": process_flow.documentation_review == "completed" && 
                          process_flow.tdd_implementation == "completed" && 
                          process_flow.verification_steps == "completed"
}
