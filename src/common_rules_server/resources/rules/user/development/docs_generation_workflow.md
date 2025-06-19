```yaml
# This description field briefly states the purpose and intended use of this rule.
description: This rule provides guidance to the agent for managing documentation generation projects through structured phases such as requirements analysis, strategy planning, stakeholder input, and implementation planning. The rule does not generate documentation automatically; the agent should use it as a manual to track and document each phase thoroughly.
# 'globs' specifies file-matching patterns (e.g., "*.md", "*.py") that determine which files this rule applies to.
globs: 
# Rule Trigger Types: 
# - Always: Rule is always applied by the system.
# - Agent Requested: Rule is applied when specifically requested by an agent.
# - Auto Attached: Rule is automatically attached based on context or conditions.
# - Manual: Rule is applied only when manually selected or invoked.
type: Agent Requested
artifacts:
  - templates/docs_generation_workflow.md
```
// DocsGenerationWorkflow Rule - Pseudocode

// The output for this rule must be created according to the template_id: templates/docs_generation_workflow.md

var current_phase = input.phase // "requirements", "analysis", "planning", "stakeholder_input"
var feature_description = input.feature_description
var context = input.context

var status = "pending"
var clear_statement = ""
var current_flow_analysis = ""
var open_questions = []
var stakeholder_questionnaire = ""
var strategy_options = []
var pros_cons = []
var impact_analysis = {
    "business": [],
    "technical": [],
    "compliance": []
}
var recommended_strategy = ""
var planning_checklist = []

if current_phase == "requirements":
    // Requirements Analysis Phase
    status = "in_progress"
    
    // Generate clear statement of requirement
    clear_statement = GenerateClearStatement(feature_description, context)
    
    // Analyze current flow
    current_flow_analysis = AnalyzeCurrentFlow(feature_description, context)
    
    // Identify open questions
    open_questions = IdentifyOpenQuestions(feature_description, context)
    
    // Create stakeholder questionnaire if needed
    if open_questions.length > 0:
        stakeholder_questionnaire = CreateStakeholderQuestionnaire(open_questions, feature_description)
        status = "completed"
        // Next phase would be stakeholder_input
    else:
        status = "completed"
        // Next phase would be analysis

else if current_phase == "analysis":
    // Strategy Analysis Phase
    status = "in_progress"
    
    // Generate strategy options
    strategy_options = GenerateStrategyOptions(feature_description, context)
    
    // Analyze pros and cons for each option
    for option in strategy_options:
        var analysis = AnalyzeOption(option, context)
        pros_cons.append({
            "option": option,
            "pros": analysis.pros,
            "cons": analysis.cons
        })
    
    // Perform impact analysis
    for option in strategy_options:
        var business_impact = AnalyzeBusinessImpact(option, context)
        var technical_impact = AnalyzeTechnicalImpact(option, context)
        var compliance_impact = AnalyzeComplianceImpact(option, context)
        
        impact_analysis.business.append(business_impact)
        impact_analysis.technical.append(technical_impact)
        impact_analysis.compliance.append(compliance_impact)
    
    // Recommend best strategy
    recommended_strategy = RecommendStrategy(strategy_options, pros_cons, impact_analysis)
    status = "completed"

else if current_phase == "planning":
    // Planning Phase
    status = "in_progress"
    
    // Generate planning checklist
    planning_checklist = GeneratePlanningChecklist(recommended_strategy, context)
    
    // Validate checklist completeness
    var validation_result = ValidateChecklist(planning_checklist, context)
    if validation_result.valid:
        status = "completed"
    else:
        // Add missing items to checklist
        for missing_item in validation_result.missing_items:
            planning_checklist.append(missing_item)
        status = "completed"

else if current_phase == "stakeholder_input":
    // Stakeholder Input Phase
    status = "in_progress"
    
    // Process stakeholder responses
    var stakeholder_responses = ProcessStakeholderResponses(stakeholder_questionnaire)
    
    // Update requirements based on input
    clear_statement = UpdateClearStatement(clear_statement, stakeholder_responses)
    open_questions = UpdateOpenQuestions(open_questions, stakeholder_responses)
    
    // If all questions answered, move to analysis
    if open_questions.length == 0:
        status = "completed"
        // Next phase would be analysis
    else:
        // Update questionnaire with remaining questions
        stakeholder_questionnaire = UpdateStakeholderQuestionnaire(open_questions, feature_description)
        status = "completed"
