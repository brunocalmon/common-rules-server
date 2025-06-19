```yaml
# This description field briefly states the purpose and intended use of this rule.
description: This rule provides guidance to the agent for generating a daily logbook summary by analyzing notebook entries for a specific date. It describes how to extract and synthesize key information, but does not generate summaries automatically. The agent should follow the outlined steps to track progress and maintain organized documentation.
# 'globs' specifies file-matching patterns (e.g., "*.md", "*.py") that determine which files this rule applies to.
globs:
# Rule Trigger Types: 
# - Always: Rule is always applied by the system.
# - Agent Requested: Rule is applied when specifically requested by an agent.
# - Auto Attached: Rule is automatically attached based on context or conditions.
# - Manual: Rule is applied only when manually selected or invoked.
type: Agent Requested
artifacts:
  - templates/daily_logbook_summary.md
```

// DailyLogbookSummary Rule - Pseudocode

// The output for this rule must be created according to the template_id: templates/daily_logbook_summary.md

var target_date = input.target_date // Format: YYYY-MM-DD
var context = input.context

var notebook_files = []
var overall_reflection = ""
var achievements = []
var challenges = []
var pending_items = []
var improvements = []
var open_questions = []

// Step 1: Find all notebook files for the target date
var notebook_directory = "./notebook/" + target_date + "/"
if DirectoryExists(notebook_directory):
    var files = ListFiles(notebook_directory, "YYYY-MM-DD_HH-MM-SS_UTC_*.md")
    for file in files:
        if IsDateMatch(file, target_date):
            notebook_files.append(file)

// Step 2: Read and analyze all notebook files
for notebook_file in notebook_files:
    var content = ReadFile(notebook_file)
    var analysis = AnalyzeNotebookContent(content)
    
    // Extract achievements
    for achievement in analysis.achievements:
        if !achievements.contains(achievement):
            achievements.append(achievement)
    
    // Extract challenges
    for challenge in analysis.challenges:
        if !challenges.contains(challenge):
            challenges.append(challenge)
    
    // Extract pending items
    for pending in analysis.pending_items:
        if !pending_items.contains(pending):
            pending_items.append(pending)
    
    // Extract improvements
    for improvement in analysis.improvements:
        if !improvements.contains(improvement):
            improvements.append(improvement)
    
    // Extract open questions
    for question in analysis.open_questions:
        if !open_questions.contains(question):
            open_questions.append(question)

// Step 3: Generate overall reflection
overall_reflection = GenerateOverallReflection(notebook_files, achievements, challenges, pending_items)

// Step 4: Prepare output according to the template
// (The agent must use the template_id: templates/daily_logbook_summary.md to format the output)

var output_file = "./notebook/logbook_" + target_date + ".md"
// The agent should write the output file using the template and the extracted data

return {
    "output_file": output_file,
    "target_date": target_date,
    "notebook_files_processed": notebook_files.length,
    "achievements_count": achievements.length,
    "challenges_count": challenges.length,
    "pending_items_count": pending_items.length,
    "improvements_count": improvements.length,
    "open_questions_count": open_questions.length,
    "summary_created": true
}

