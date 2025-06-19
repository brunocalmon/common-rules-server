```yaml
# This description field briefly states the purpose and intended use of this rule.
description: This rule provides guidance to the agent for validating project architecture compliance. It describes how to check if the actual project structure, architecture patterns, module responsibilities, and build configuration match the documented requirements. The rule does not perform compliance checks automatically; the agent should follow the instructions to review, report, and recommend improvements.
# 'globs' specifies file-matching patterns (e.g., "*.md", "*.py") that determine which files this rule applies to.
globs: 
# Rule Trigger Types: 
# - Always: Rule is always applied by the system.
# - Agent Requested: Rule is applied when specifically requested by an agent.
# - Auto Attached: Rule is automatically attached based on context or conditions.
# - Manual: Rule is applied only when manually selected or invoked.
type: Agent Requested
artifacts:
  - templates/project_architecture_compliance.md
```

// ProjectArchitectureCompliance Rule - Pseudocode

// The output for this rule must be created according to the template_id: templates/project_architecture_compliance.md

var context = input.context
var current_task = input.current_task

var documentation_status = {
    "readme_exists": false,
    "architecture_exists": false,
    "documentation_complete": false
}

var compliance_status = {
    "project_structure": "pending",
    "architecture_patterns": "pending",
    "module_responsibilities": "pending",
    "build_configuration": "pending"
}

var issues = []
var recommendations = []
var agent_instructions = []

// Step 1: Check Documentation Status
documentation_status.readme_exists = FileExists("README.md")
documentation_status.architecture_exists = FileExists("ARCHITECTURE.md")
documentation_status.documentation_complete = documentation_status.readme_exists && documentation_status.architecture_exists

if !documentation_status.documentation_complete:
    if !documentation_status.readme_exists:
        issues.append("README.md is missing")
        recommendations.append("Create README.md with project overview and requirements")
        agent_instructions.push("Ask user to create README.md or help create it through questions")
    if !documentation_status.architecture_exists:
        issues.append("ARCHITECTURE.md is missing")
        recommendations.append("Create ARCHITECTURE.md with technical architecture and patterns")
        agent_instructions.push("Ask user to create ARCHITECTURE.md or help create it through questions")
    agent_instructions.push("Cannot validate compliance without complete documentation")
    agent_instructions.push("Complete documentation creation before proceeding with compliance check")
else:
    agent_instructions.push("Read README.md and ARCHITECTURE.md to understand project requirements")
    agent_instructions.push("Validate current implementation against documented architecture")

// Step 2: Check Project Structure Compliance (if docs exist)
if documentation_status.documentation_complete:
    var architecture_doc = ReadFile("ARCHITECTURE.md")
    var readme_doc = ReadFile("README.md")
    
    agent_instructions.push("Parse documented structure from README.md and ARCHITECTURE.md")
    agent_instructions.push("Compare actual project structure with documented structure")
    
    var documented_structure = ParseDocumentedStructure(architecture_doc, readme_doc)
    var actual_structure = GetActualProjectStructure()
    
    if documented_structure && actual_structure:
        if CompareStructures(documented_structure, actual_structure):
            compliance_status.project_structure = "compliant"
            agent_instructions.push("Project structure matches documented architecture")
        else:
            compliance_status.project_structure = "non-compliant"
            var structure_issues = FindStructureIssues(documented_structure, actual_structure)
            for issue in structure_issues:
                issues.append("Project structure: " + issue)
                recommendations.append("Update structure to match documentation: " + issue)
            agent_instructions.push("Project structure does not match documented architecture")
            agent_instructions.push("Ask user to update structure or update documentation")
    else:
        compliance_status.project_structure = "pending"
        agent_instructions.push("Cannot parse documented structure - ask user for clarification")
        agent_instructions.push("Update ARCHITECTURE.md with clear structure definition")

// Step 3: Check Architecture Patterns Compliance (if docs exist)
if documentation_status.documentation_complete:
    agent_instructions.push("Check if current implementation follows documented architecture patterns")
    agent_instructions.push("Validate against patterns specified in ARCHITECTURE.md")
    
    var documented_patterns = ParseArchitecturePatterns(architecture_doc)
    var actual_patterns = GetActualArchitecturePatterns()
    
    if documented_patterns && actual_patterns:
        if ComparePatterns(documented_patterns, actual_patterns):
            compliance_status.architecture_patterns = "compliant"
            agent_instructions.push("Architecture patterns match documented requirements")
        else:
            compliance_status.architecture_patterns = "non-compliant"
            var pattern_issues = FindPatternIssues(documented_patterns, actual_patterns)
            for issue in pattern_issues:
                issues.append("Architecture pattern: " + issue)
                recommendations.append("Update implementation to follow documented pattern: " + issue)
            agent_instructions.push("Architecture patterns do not match documented requirements")
            agent_instructions.push("Ask user to update implementation or update documentation")
    else:
        compliance_status.architecture_patterns = "pending"
        agent_instructions.push("Cannot parse documented patterns - ask user for clarification")
        agent_instructions.push("Update ARCHITECTURE.md with clear pattern definitions")

// Step 4: Check Module Responsibilities Compliance (if docs exist)
if documentation_status.documentation_complete:
    agent_instructions.push("Check if all modules have documented responsibilities")
    agent_instructions.push("Validate against responsibilities specified in ARCHITECTURE.md")
    
    var module_responsibilities = ParseModuleResponsibilities(architecture_doc)
    var actual_modules = GetActualModules()
    
    if module_responsibilities && actual_modules:
        var missing_responsibilities = []
        for module in actual_modules:
            if !HasDocumentedResponsibility(module, module_responsibilities):
                missing_responsibilities.append(module)
        
        if missing_responsibilities.length == 0:
            compliance_status.module_responsibilities = "compliant"
            agent_instructions.push("All modules have documented responsibilities")
        else:
            compliance_status.module_responsibilities = "non-compliant"
            for module in missing_responsibilities:
                issues.append("Module without documented responsibility: " + module)
                recommendations.append("Document responsibility for module: " + module)
            agent_instructions.push("Some modules lack documented responsibilities")
            agent_instructions.push("Ask user to document missing responsibilities in ARCHITECTURE.md")
    else:
        compliance_status.module_responsibilities = "pending"
        agent_instructions.push("Cannot parse module responsibilities - ask user for clarification")
        agent_instructions.push("Update ARCHITECTURE.md with clear module responsibility definitions")

// Step 5: Check Build Configuration Compliance (if docs exist)
if documentation_status.documentation_complete:
    agent_instructions.push("Check if build configuration matches documented requirements")
    agent_instructions.push("Validate against build system specified in ARCHITECTURE.md")
    
    var documented_build = ParseBuildConfiguration(architecture_doc)
    var actual_build = GetActualBuildConfiguration()
    
    if documented_build && actual_build:
        if CompareBuildConfigurations(documented_build, actual_build):
            compliance_status.build_configuration = "compliant"
            agent_instructions.push("Build configuration matches documented requirements")
        else:
            compliance_status.build_configuration = "non-compliant"
            var build_issues = FindBuildIssues(documented_build, actual_build)
            for issue in build_issues:
                issues.append("Build configuration: " + issue)
                recommendations.append("Update build configuration to match documentation: " + issue)
            agent_instructions.push("Build configuration does not match documented requirements")
            agent_instructions.push("Ask user to update build configuration or update documentation")
    else:
        compliance_status.build_configuration = "pending"
        agent_instructions.push("Cannot parse documented build configuration - ask user for clarification")
        agent_instructions.push("Update ARCHITECTURE.md with clear build configuration definition")

// The agent must use the template_id: templates/project_architecture_compliance.md to format the output
