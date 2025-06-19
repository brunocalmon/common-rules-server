```yaml
# This description field briefly states the purpose and intended use of this rule.
description: This rule provides guidance to the agent for managing project documentation. It describes how to review, update, and create essential documentation (including README.md and ARCHITECTURE.md) before and after development tasks. The rule does not create or update documentation automatically; the agent should follow the outlined steps to ensure documentation completeness and accuracy.
# 'globs' specifies file-matching patterns (e.g., "*.md", "*.py") that determine which files this rule applies to.
globs: 
# Rule Trigger Types: 
# - Always: Rule is always applied by the system.
# - Agent Requested: Rule is applied when specifically requested by an agent.
# - Auto Attached: Rule is automatically attached based on context or conditions.
# - Manual: Rule is applied only when manually selected or invoked.
type: Agent Requested
artifacts:
  - templates/documentation_process.md
```
// DocumentationProcess Rule - Pseudocode

// The output for this rule must be created according to the template_id: templates/documentation_process.md

var current_phase = input.phase // "review", "update", or "create"
var documentation_type = input.documentation_type
var context = input.context

var documentation_status = {
    "readme_exists": false,
    "architecture_exists": false,
    "project_documentation": "missing"
}

var status = "pending"
var files_to_review = []
var issues_found = []
var actions_required = []
var files_updated = []
var changes_made = []
var verification_status = "pending"

// Check documentation status first
var readme_exists = FileExists("README.md")
var architecture_exists = FileExists("ARCHITECTURE.md")

documentation_status.readme_exists = readme_exists
documentation_status.architecture_exists = architecture_exists

if readme_exists && architecture_exists:
    documentation_status.project_documentation = "complete"
else if readme_exists || architecture_exists:
    documentation_status.project_documentation = "incomplete"
else:
    documentation_status.project_documentation = "missing"

if current_phase == "review":
    // Documentation Review Phase
    status = "in_progress"
    
    // Agent Instructions: Check documentation status and review
    var agent_instructions = []
    agent_instructions.push("Check if README.md and ARCHITECTURE.md exist")
    agent_instructions.push("Review existing documentation for completeness and accuracy")
    agent_instructions.push("If documentation is missing, ask user to create it")
    agent_instructions.push("If documentation is incomplete, ask user to complete it")
    
    if !readme_exists:
        issues_found.append("README.md is missing")
        actions_required.append("Ask user to create README.md with project overview and setup instructions")
    
    if !architecture_exists:
        issues_found.append("ARCHITECTURE.md is missing")
        actions_required.append("Ask user to create ARCHITECTURE.md with technical architecture and development process")
    
    if readme_exists && architecture_exists:
        // Review existing documentation
        agent_instructions.push("Read README.md to understand project structure and setup")
        agent_instructions.push("Read ARCHITECTURE.md to understand technical architecture")
        agent_instructions.push("Validate documentation against current project requirements")
        
        files_to_review.push("README.md")
        files_to_review.push("ARCHITECTURE.md")
        
        // Check for additional documentation directories
        var docs_directory = "docs/"
        if DirectoryExists(docs_directory):
            var doc_files = ListFiles(docs_directory, "*.md")
            for file in doc_files:
                if IsRelevantForTask(file, context.current_task):
                    files_to_review.append(file)
        
        // Check for technical details in notebooks
        var notebook_files = FindNotebookFiles()
        for notebook in notebook_files:
            if ContainsTechnicalDetails(notebook):
                issues_found.append("Technical details found in notebook: " + notebook)
                actions_required.append("Ask user if technical details should be migrated to docs/ directory")
        
        // Review documentation accuracy
        for doc_file in files_to_review:
            var review_result = ReviewDocumentation(doc_file, context.current_task)
            if review_result.has_issues:
                issues_found.append("Documentation issues in " + doc_file + ": " + review_result.issues)
                actions_required.append("Ask user to update " + doc_file + " to reflect current implementation")
    
    if issues_found.length == 0:
        status = "completed"
        actions_required.push("Documentation review complete - proceed with implementation")
    else:
        actions_required.push("Ask user to address documentation issues before proceeding with implementation")

else if current_phase == "update":
    // Documentation Update Phase
    status = "in_progress"
    
    // Agent Instructions: Update documentation after implementation
    var agent_instructions = []
    agent_instructions.push("Read README.md and ARCHITECTURE.md to understand current documentation")
    agent_instructions.push("Update documentation to reflect implementation changes")
    agent_instructions.push("If documentation structure is unclear, ask user for guidance")
    agent_instructions.push("Ensure documentation remains accurate and up-to-date")
    
    if readme_exists && architecture_exists:
        // Update existing documentation
        for doc_file in files_to_review:
            var update_result = UpdateDocumentation(doc_file, context.implementation_changes)
            if update_result.updated:
                files_updated.append(doc_file)
                changes_made.append("Updated " + doc_file + ": " + update_result.changes)
        
        // Migrate technical details from notebooks if user requested
        for notebook in FindNotebookFiles():
            if ContainsTechnicalDetails(notebook):
                var migration_result = MigrateTechnicalDetails(notebook, "docs/")
                if migration_result.success:
                    files_updated.append(migration_result.new_file)
                    changes_made.append("Migrated technical details from " + notebook + " to " + migration_result.new_file)
        
        // Verify documentation accuracy
        var verification_result = VerifyDocumentationAccuracy(files_updated)
        if verification_result.accurate:
            verification_status = "completed"
            status = "completed"
            changes_made.append("Documentation verification completed successfully")
        else:
            verification_status = "pending"
            issues_found.append("Documentation verification failed: " + verification_result.issues)
            actions_required.append("Ask user to fix documentation accuracy issues")
    else:
        issues_found.append("Cannot update documentation - README.md and/or ARCHITECTURE.md are missing")
        actions_required.append("Ask user to create missing documentation files first")

else if current_phase == "create":
    // Documentation Creation Phase
    status = "in_progress"
    
    // Agent Instructions: Help user create documentation
    var agent_instructions = []
    agent_instructions.push("Ask user to provide project overview for README.md")
    agent_instructions.push("Ask user to provide technical architecture details for ARCHITECTURE.md")
    agent_instructions.push("Guide user through documentation creation process")
    agent_instructions.push("Ensure documentation follows project standards")
    
    if !readme_exists:
        issues_found.append("README.md needs to be created")
        actions_required.append("Ask user to provide project overview, setup instructions, and usage examples")
    
    if !architecture_exists:
        issues_found.append("ARCHITECTURE.md needs to be created")
        actions_required.append("Ask user to provide technical architecture, development process, and build instructions")
    
    status = "completed"
    actions_required.push("Documentation creation process initiated - wait for user input")
