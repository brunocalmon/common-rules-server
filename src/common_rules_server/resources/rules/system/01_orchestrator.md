```yaml
# This description field briefly states the purpose and intended use of this rule.
description: This rule provides guidance to the agent for orchestrating the development workflow. It describes how to progress through workflow states (INIT, REQUIREMENTS, PLANNING, DEVELOPMENT, TESTING, VERIFICATION, DEPLOYMENT, COMPLETE) and when to consult other rules for specific tasks. The rule does not execute any steps automatically; it serves as a manual for the agent to follow, ensuring that each stage is addressed in the correct order and that the appropriate guidance is referenced at each step.
# 'globs' specifies file-matching patterns (e.g., "*.md", "*.py") that determine which files this rule applies to.
globs:
# Rule Trigger Types: 
# - Always: Rule is always applied by the system.
# - Agent Requested: Rule is applied when specifically requested by an agent.
# - Auto Attached: Rule is automatically attached based on context or conditions.
# - Manual: Rule is applied only when manually selected or invoked.
type: Always
artifacts:
  - templates/main_orchestrator.md
```

// MainOrchestrator Rule - Pseudocode

// The output for this rule must be created according to the template_id: templates/main_orchestrator.md

/*
STATE -> TRIGGERED RULES SUMMARY (for maintainers)
--------------------------------------------------
INIT:
  - 01-general.mdc (system checks)
REQUIREMENTS:
  - notebook_management.rule.mdc (requirements notebook)
  - compliance_confirmation.rule.mdc (requirements compliance)
PLANNING:
  - notebook_management.rule.mdc (planning notebook)
  - project_architecture_compliance.rule.mdc (architecture review)
  - docs_generation_workflow.rule.mdc (docs generation, if documentation task)
DEVELOPMENT:
  - notebook_management.rule.mdc (development notebook)
  - development_process.rule.mdc (development process)
TESTING:
  - notebook_management.rule.mdc (testing notebook)
  - test_cycle.rule.mdc (test coverage analysis)
  - verification_process.rule.mdc (build verification)
VERIFICATION:
  - notebook_management.rule.mdc (verification notebook)
  - compliance_confirmation.rule.mdc (end compliance)
  - project_architecture_compliance.rule.mdc (final architecture check)
DEPLOYMENT:
  - notebook_management.rule.mdc (deployment notebook)
COMPLETE:
  - notebook_management.rule.mdc (completion summary)
--------------------------------------------------
*/

var context = input.context
var current_request = input.current_request
var current_state = input.current_state || "INIT"
var previous_state = input.previous_state || null
var state_data = input.state_data || {}

// Reference documentation status from the general rule
var documentation_status = GetDocumentationStatusFromGeneralRule()

var triggered_rules = []
var next_actions = []
var agent_instructions = []
var state_transition = {
    "from": previous_state,
    "to": current_state,
    "reason": ""
}

// State Machine Logic
if (current_state == "INIT") {
    state_transition.reason = "System initialization"
    // Trigger: 01-general.mdc (system checks)
    var general_result = ExecuteRule("01-general.mdc", {
        "context": context,
        "current_request": current_request
    })
    triggered_rules.push({"rule": "01-general.mdc", "status": general_result.success ? "completed" : "failed"})
    if (general_result.documentation_status) {
        documentation_status = general_result.documentation_status
        agent_instructions.push("Documentation status checked (see general rule)")
    }
    if (!documentation_status.documentation_complete) {
        agent_instructions.push("Project documentation is incomplete - focus on documentation creation")
        next_actions.push("Create project documentation")
        current_state = "PLANNING"
    } else {
        agent_instructions.push("Project documentation is complete - proceed with normal workflow")
        next_actions.push("Proceed to requirements gathering or planning phase")
        current_state = "REQUIREMENTS"
    }
} else if (current_state == "REQUIREMENTS") {
    state_transition.reason = "Requirements gathering and validation"
    // Trigger: notebook_management.rule.mdc (requirements notebook)
    var notebook_result = ExecuteRule("notebook_management.rule.mdc", {
        "current_request": current_request,
        "current_state": current_state
    })
    triggered_rules.push({"rule": "notebook_management.rule.mdc", "status": notebook_result.success ? "completed" : "failed"})
    // Trigger: compliance_confirmation.rule.mdc (requirements compliance)
    var req_compliance_result = ExecuteRule("compliance_confirmation.rule.mdc", {
        "current_state": current_state,
        "context": context,
        "task_type": "requirements"
    })
    triggered_rules.push({"rule": "compliance_confirmation.rule.mdc", "status": req_compliance_result.success ? "completed" : "failed"})
    agent_instructions.push("Gather requirements and validate against documented architecture (see general rule)")
    next_actions.push("Proceed to planning phase")
    current_state = "PLANNING"
} else if (current_state == "PLANNING") {
    state_transition.reason = "Planning and architecture review"
    // Trigger: notebook_management.rule.mdc (planning notebook)
    var planning_notebook_result = ExecuteRule("notebook_management.rule.mdc", {
        "current_request": current_request,
        "current_state": current_state
    })
    triggered_rules.push({"rule": "notebook_management.rule.mdc", "status": planning_notebook_result.success ? "completed" : "failed"})
    // Trigger: project_architecture_compliance.rule.mdc (architecture review)
    var arch_compliance_result = ExecuteRule("project_architecture_compliance.rule.mdc", {
        "context": context,
        "current_task": current_request
    })
    triggered_rules.push({"rule": "project_architecture_compliance.rule.mdc", "status": arch_compliance_result.success ? "completed" : "failed"})
    // Trigger: docs_generation_workflow.rule.mdc (docs generation, if documentation task)
    if (IsDocumentationTask(current_request)) {
        var docs_result = ExecuteRule("docs_generation_workflow.rule.mdc", {
            "context": context,
            "current_task": current_request
        })
        triggered_rules.push({"rule": "docs_generation_workflow.rule.mdc", "status": docs_result.success ? "completed" : "failed"})
    }
    agent_instructions.push("Create implementation plan based on documented architecture (see general rule)")
    next_actions.push("Proceed to development phase")
    current_state = "DEVELOPMENT"
} else if (current_state == "DEVELOPMENT") {
    state_transition.reason = "Development implementation using TDD"
    // Trigger: notebook_management.rule.mdc (development notebook)
    var dev_notebook_result = ExecuteRule("notebook_management.rule.mdc", {
        "current_request": current_request,
        "current_state": current_state
    })
    triggered_rules.push({"rule": "notebook_management.rule.mdc", "status": dev_notebook_result.success ? "completed" : "failed"})
    // Trigger: development_process.rule.mdc (development process)
    var dev_process_result = ExecuteRule("development_process.rule.mdc", {
        "phase": "tdd",
        "context": context
    })
    triggered_rules.push({"rule": "development_process.rule.mdc", "status": dev_process_result.success ? "completed" : "failed"})
    agent_instructions.push("Implement solution using documented build system (see general rule)")
    next_actions.push("Proceed to testing phase")
    current_state = "TESTING"
} else if (current_state == "TESTING") {
    state_transition.reason = "Testing and coverage analysis"
    // Trigger: notebook_management.rule.mdc (testing notebook)
    var test_notebook_result = ExecuteRule("notebook_management.rule.mdc", {
        "current_request": current_request,
        "current_state": current_state
    })
    triggered_rules.push({"rule": "notebook_management.rule.mdc", "status": test_notebook_result.success ? "completed" : "failed"})
    // Trigger: test_cycle.rule.mdc (test coverage analysis)
    var test_cycle_result = ExecuteRule("test_cycle.rule.mdc", {
        "context": context
    })
    triggered_rules.push({"rule": "test_cycle.rule.mdc", "status": test_cycle_result.success ? "completed" : "failed"})
    // Trigger: verification_process.rule.mdc (build verification)
    var verification_result = ExecuteRule("verification_process.rule.mdc", {
        "context": context
    })
    triggered_rules.push({"rule": "verification_process.rule.mdc", "status": verification_result.success ? "completed" : "failed"})
    agent_instructions.push("Run tests and check coverage using documented tools (see general rule)")
    next_actions.push("Proceed to verification phase")
    current_state = "VERIFICATION"
} else if (current_state == "VERIFICATION") {
    state_transition.reason = "Final verification and compliance"
    // Trigger: notebook_management.rule.mdc (verification notebook)
    var verif_notebook_result = ExecuteRule("notebook_management.rule.mdc", {
        "current_request": current_request,
        "current_state": current_state
    })
    triggered_rules.push({"rule": "notebook_management.rule.mdc", "status": verif_notebook_result.success ? "completed" : "failed"})
    // Trigger: compliance_confirmation.rule.mdc (end compliance)
    var end_compliance_result = ExecuteRule("compliance_confirmation.rule.mdc", {
        "current_state": current_state,
        "context": context,
        "task_type": "end"
    })
    triggered_rules.push({"rule": "compliance_confirmation.rule.mdc", "status": end_compliance_result.success ? "completed" : "failed"})
    // Trigger: project_architecture_compliance.rule.mdc (final architecture check)
    var final_arch_result = ExecuteRule("project_architecture_compliance.rule.mdc", {
        "context": context,
        "current_task": current_request
    })
    triggered_rules.push({"rule": "project_architecture_compliance.rule.mdc", "status": final_arch_result.success ? "completed" : "failed"})
    agent_instructions.push("Perform final verification using documented process (see general rule)")
    next_actions.push("Proceed to deployment phase")
    current_state = "DEPLOYMENT"
} else if (current_state == "DEPLOYMENT") {
    state_transition.reason = "Deployment and finalization"
    // Trigger: notebook_management.rule.mdc (deployment notebook)
    var deploy_notebook_result = ExecuteRule("notebook_management.rule.mdc", {
        "current_request": current_request,
        "current_state": current_state
    })
    triggered_rules.push({"rule": "notebook_management.rule.mdc", "status": deploy_notebook_result.success ? "completed" : "failed"})
    agent_instructions.push("Deploy using documented method and update documentation (see general rule)")
    next_actions.push("Task complete")
    current_state = "COMPLETE"
} else if (current_state == "COMPLETE") {
    state_transition.reason = "Task completion and handoff"
    // Trigger: notebook_management.rule.mdc (completion summary)
    var completion_notebook_result = ExecuteRule("notebook_management.rule.mdc", {
        "current_request": current_request,
        "current_state": current_state
    })
    triggered_rules.push({"rule": "notebook_management.rule.mdc", "status": completion_notebook_result.success ? "completed" : "failed"})
    agent_instructions.push("Complete project handoff and ensure all documentation is updated (see general rule)")
    next_actions.push("Task complete - all states and rules executed successfully")
}

return {
    "output_file": "planning/documentation/main_orchestrator{YYYY-MM-dd-hh-mm-ss}.md",
    "current_state": current_state,
    "previous_state": previous_state,
    "state_data": state_data,
    "documentation_status": documentation_status,
    "triggered_rules": triggered_rules,
    "next_actions": next_actions,
    "state_transition": state_transition,
    "agent_instructions": agent_instructions,
    "state_complete": current_state == "COMPLETE"
}