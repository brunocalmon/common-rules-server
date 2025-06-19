```yaml
# This description field briefly states the purpose and intended use of this rule.
description: This rule provides guidance to the agent for validating project compliance against documented requirements in README.md and ARCHITECTURE.md. It outlines how to check alignment with project architecture, development processes, and compliance standards, and how to generate compliance reports. The rule does not perform compliance checks automatically; the agent should follow the instructions to perform validation and reporting.
# 'globs' specifies file-matching patterns (e.g., "*.md", "*.py") that determine which files this rule applies to.
globs: 
# Rule Trigger Types: 
# - Always: Rule is always applied by the system.
# - Agent Requested: Rule is applied when specifically requested by an agent.
# - Auto Attached: Rule is automatically attached based on context or conditions.
# - Manual: Rule is applied only when manually selected or invoked.
type: Agent Requested
artifacts:
  - templates/compliance_confirmation.md
```
// ComplianceConfirmation Rule - Pseudocode

// The output for this rule must be created according to the template_id: templates/compliance_confirmation.md

var current_state = input.current_state
var context = input.context
var task_type = input.task_type // "beginning", "end", or "requirements"

var documentation_status = {
    "readme_exists": false,
    "architecture_exists": false,
    "compliance_requirements_documented": false
}

// Check documentation status first
var readme_exists = FileExists("README.md")
var architecture_exists = FileExists("ARCHITECTURE.md")

documentation_status.readme_exists = readme_exists
documentation_status.architecture_exists = architecture_exists

if !readme_exists || !architecture_exists:
    // Documentation is missing - instruct Agent to ask user
    var agent_instructions = []
    agent_instructions.push("Cannot confirm compliance - README.md and/or ARCHITECTURE.md are missing")
    agent_instructions.push("Ask user to create missing documentation with compliance requirements")
    
    return {
        "output_file": "planning/documentation/compliance_confirmation{YYYY-MM-dd-hh-mm-ss}.md",
        "documentation_status": documentation_status,
        "agent_instructions": agent_instructions,
        "compliance_confirmed": false
    }

// Agent Instructions: Read compliance requirements from documentation
var agent_instructions = []
agent_instructions.push("Read README.md to understand project compliance requirements")
agent_instructions.push("Read ARCHITECTURE.md to understand architectural compliance standards")
agent_instructions.push("Validate compliance against documented requirements")
agent_instructions.push("If compliance requirements are unclear, ask user for clarification")

documentation_status.compliance_requirements_documented = true

if task_type == "beginning":
    var workspace_root = GetWorkspaceRoot()
    var current_dir = GetCurrentDirectory()
    var project_structure_verified = VerifyProjectStructure()
    var build_path = GetBuildCommandPath() // Project-agnostic build path
    var supporting_evidence = GetSupportingEvidence()
    
    var relevant_components = []
    for component in context.project_structure:
        if IsRelevantForTask(component, context.current_task):
            relevant_components.append(component)
    
    return {
        "output_file": "planning/documentation/compliance_confirmation_beginning{YYYY-MM-dd-hh-mm-ss}.md",
        "workspace_root": workspace_root,
        "current_dir": current_dir,
        "project_structure_verified": project_structure_verified,
        "build_path": build_path,
        "supporting_evidence": supporting_evidence,
        "relevant_components": relevant_components,
        "documentation_status": documentation_status,
        "agent_instructions": agent_instructions
    }

else if task_type == "requirements":
    // Requirements compliance check
    var requirements_compliance = []
    var requirements_issues = []
    
    // Agent Instructions: Check requirements compliance
    agent_instructions.push("Read requirements from README.md and ARCHITECTURE.md")
    agent_instructions.push("Validate current task against documented requirements")
    agent_instructions.push("If requirements are unclear, ask user for clarification")
    
    // Note: Actual requirements validation would be done by the Agent
    // based on the documented requirements in README.md and ARCHITECTURE.md
    var requirements_valid = true // Placeholder - Agent would validate requirements
    
    if requirements_valid:
        requirements_compliance.push("Requirements align with documented project requirements")
        requirements_compliance.push("Task scope is within documented project boundaries")
    else:
        requirements_issues.push("Task requirements unclear - ask user for clarification")
        requirements_issues.push("Task scope may exceed documented project boundaries")
    
    return {
        "output_file": "planning/documentation/compliance_confirmation_requirements{YYYY-MM-dd-hh-mm-ss}.md",
        "requirements_compliance": requirements_compliance,
        "requirements_issues": requirements_issues,
        "documentation_status": documentation_status,
        "agent_instructions": agent_instructions,
        "requirements_valid": requirements_valid
    }

else if task_type == "end":
    var architecture_compliance = []
    var development_compliance = []
    var approved_deviations = []
    var supporting_evidence = GetSupportingEvidence()
    
    // Agent Instructions: Check final compliance
    agent_instructions.push("Read final compliance requirements from README.md and ARCHITECTURE.md")
    agent_instructions.push("Validate all changes against documented compliance standards")
    agent_instructions.push("If compliance is unclear, ask user for clarification")
    
    // Check architecture compliance using documented requirements
    // Note: Actual compliance checking would be done by the Agent
    // based on the documented requirements in README.md and ARCHITECTURE.md
    var architecture_requirements = ["Architecture pattern compliance", "Code structure compliance", "Build process compliance"]
    for requirement in architecture_requirements:
        var is_compliant = true // Placeholder - Agent would check compliance
        if is_compliant:
            architecture_compliance.push("Compliant with " + requirement + " as documented")
        else:
            approved_deviations.push("Deviation from " + requirement + " - ask user for approval")
    
    // Check development process compliance using documented process
    var process_requirements = ["Documentation first", "Test-driven development", "Verification complete"]
    for requirement in process_requirements:
        var is_compliant = true // Placeholder - Agent would check compliance
        if is_compliant:
            development_compliance.push("Followed " + requirement + " as documented")
        else:
            approved_deviations.push("Deviation from " + requirement + " - ask user for approval")
    
    return {
        "output_file": "planning/documentation/compliance_confirmation_end{YYYY-MM-dd-hh-mm-ss}.md",
        "architecture_compliance": architecture_compliance,
        "development_compliance": development_compliance,
        "approved_deviations": approved_deviations,
        "supporting_evidence": supporting_evidence,
        "documentation_status": documentation_status,
        "agent_instructions": agent_instructions,
        "compliance_confirmed": approved_deviations.length == 0
    }
