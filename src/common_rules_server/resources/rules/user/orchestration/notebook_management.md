```yaml
# This description field briefly states the purpose and intended use of this rule.
description: This rule provides structured guidance to the agent for managing notebook creation and maintenance to track development requests, decisions, and progress. It describes how to organize and document notebook entries, but does not create or update notebooks automatically. The agent should follow the outlined steps to ensure comprehensive tracking and documentation.
# 'globs' specifies file-matching patterns (e.g., "*.md", "*.py") that determine which files this rule applies to.
globs: 
# Rule Trigger Types: 
# - Always: Rule is always applied by the system.
# - Agent Requested: Rule is applied when specifically requested by an agent.
# - Auto Attached: Rule is automatically attached based on context or conditions.
# - Manual: Rule is applied only when manually selected or invoked.
type: Agent Requested
# The 'artifacts' property lists any related files or resources that are referenced by this rule.
# For notebook management, this could include templates, example notebooks, or configuration files.
# If there are no associated files, leave the list empty as shown below.
artifacts:
  - templates/notebook_management.md
```
# Notebook Management Rule

## Rule Intent
This rule manages all notebook operations including creation, updates, organization, and content management for development tracking and documentation.

## Notebook Operations

### Creation and Organization
- **Directory Structure**: `./notebook/YYYY-MM-DD/`
- **File Naming**: `YYYY-MM-DD_HH-MM-SS_UTC_title.md`
- **Content Structure**: Request, reasoning, applied rules, cost tracking

### Content Management
- **Request Documentation**: Record all development requests
- **Reasoning Tracking**: Document decision-making process
- **Rule Application**: Track which rules were applied
- **Cost Monitoring**: Track token usage and estimated costs
- **Progress Tracking**: Monitor todo list and completion status

### Integration Points
- **System Rules**: Receives data from general system rule
- **Development Process**: Integrates with development workflow
- **Compliance Tracking**: Documents compliance activities
- **Daily Summaries**: Provides data for daily logbook summaries

## Expected Output
- Notebook file created/updated
- Directory structure maintained
- Content properly formatted
- Integration with other rules documented

// NotebookManagement Rule - Pseudocode

// The output for this rule must be created according to the template_id: templates/notebook_management.md

var context = input.context
var current_request = input.current_request
var current_state = input.current_state
var applied_rules = input.applied_rules
var decisions_made = input.decisions_made
var open_questions = input.open_questions
var next_actions = input.next_actions

var notebook_info = {
    "notebook_file": "",
    "notebook_directory": "",
    "status": "pending",
    "content_sections": []
}

// Step 1: Generate timestamp and title
var timestamp_command = "date -u +\"%Y-%m-%d_%H-%M-%S_UTC\""
var timestamp_result = ExecuteCommand(timestamp_command)
var timestamp = timestamp_result.stdout.strip()

var title = GenerateNotebookTitle(current_request, current_state)
notebook_info.notebook_file = timestamp + "_" + title + ".md"

// Step 2: Create directory structure
var date_command = "date -u +\"%Y-%m-%d\""
var date_result = ExecuteCommand(date_command)
var date = date_result.stdout.strip()

notebook_info.notebook_directory = "./notebook/" + date + "/"

// Create notebook directory if it doesn't exist
if !DirectoryExists(notebook_info.notebook_directory):
    CreateDirectory(notebook_info.notebook_directory)

// Step 3: Generate notebook content
var notebook_content = GenerateNotebookContent(
    current_request, 
    current_state, 
    applied_rules, 
    decisions_made, 
    open_questions, 
    next_actions
)

// Step 4: Write notebook file
WriteFile(notebook_info.notebook_directory + notebook_info.notebook_file, notebook_content)
notebook_info.status = "created"

// Step 5: Update content sections list
notebook_info.content_sections = [
    "Request",
    "Current State", 
    "Applied Rules",
    "Decisions Made",
    "Open Questions",
    "Next Actions"
]

function GenerateNotebookTitle(request, state) {
    var title = state.toLowerCase().replace("_", "-")
    var request_words = request.split(" ").slice(0, 3).join("-")
    return title + "-" + request_words
}

function GenerateNotebookContent(request, state, rules, decisions, questions, actions) {
    // The agent must use the template_id: templates/notebook_management.md to format the output
    // and fill in the required sections with the provided data.
    return "" // Implementation is agent-specific
}

var content_summary = {
    "request": current_request,
    "current_state": current_state,
    "applied_rules_count": applied_rules.length,
    "decisions_count": decisions_made.length,
    "questions_count": open_questions.length,
    "actions_count": next_actions.length
}

var output_file = "planning/documentation/notebook_management{YYYY-MM-dd-hh-mm-ss}.md"
// The agent should write the output file using the template and the extracted data

return {
    "output_file": output_file,
    "notebook_info": notebook_info,
    "content_summary": content_summary,
    "notebook_created": notebook_info.status == "created"
}

