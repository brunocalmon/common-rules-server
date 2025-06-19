```yaml
# This description field briefly states the purpose and intended use of this rule.
description: This rule provides guidance to the agent for handling deviation requests from established development processes (API-First, OpenAPI, Documentation, TDD, Architecture). It describes how to request, document, and track deviations, but does not process or approve deviations automatically. The agent should follow the workflow to ensure proper approval and documentation updates.
# 'globs' specifies file-matching patterns (e.g., "*.md", "*.py") that determine which files this rule applies to.
globs: 
# Rule Trigger Types: 
# - Always: Rule is always applied by the system.
# - Agent Requested: Rule is applied when specifically requested by an agent.
# - Auto Attached: Rule is automatically attached based on context or conditions.
# - Manual: Rule is applied only when manually selected or invoked.
type: Agent Requested
artifacts:
  - templates/deviation_process.md
```

// DeviationProcess Rule - Pseudocode

// The output for this rule must be created according to the template_id: templates/deviation_process.md

var deviation_type = input.deviation_type
var reason = input.reason
var impact = input.impact
var requested_by = input.requested_by
var context = input.context

var approval_status = "pending"
var approved_by = ""
var approval_date = ""
var conditions = []
var files_to_update = []
var updates_required = []

// Step 1: Stop - Check if deviation is necessary
if IsDeviationNecessary(deviation_type, context.current_task):
    // Step 2: Explain - Detailed explanation
    var detailed_explanation = GenerateDetailedExplanation(reason, context.current_task)
    
    // Step 3: Highlight - Explicit mention of aspects that cannot be followed
    var aspects_not_followed = IdentifyAspectsNotFollowed(deviation_type, context.current_task)
    
    // Step 4: Request Permission
    var permission_request = RequestPermission(deviation_type, detailed_explanation, aspects_not_followed)
    
    // Step 5: Document - Document the deviation request
    var deviation_document = {
        "type": deviation_type,
        "reason": reason,
        "impact": impact,
        "requested_by": requested_by,
        "detailed_explanation": detailed_explanation,
        "aspects_not_followed": aspects_not_followed,
        "request_date": GetCurrentDate()
    }
    
    // Step 6: Update Documentation (if approved)
    if permission_request.approved:
        approval_status = "approved"
        approved_by = permission_request.approved_by
        approval_date = GetCurrentDate()
        conditions = permission_request.conditions
        
        // Identify documentation that needs updates
        if deviation_type == "API-First":
            files_to_update.append("ARCHITECTURE.md")
            updates_required.append("Update API-first development section")
        if deviation_type == "OpenAPI":
            files_to_update.append("README.md")
            updates_required.append("Update OpenAPI specification references")
        if deviation_type == "Documentation":
            files_to_update.append("docs/")
            updates_required.append("Update documentation process")
        if deviation_type == "TDD":
            files_to_update.append("tdd-process.mdc")
            updates_required.append("Update TDD process documentation")
        if deviation_type == "Architecture":
            files_to_update.append("ARCHITECTURE.md")
            updates_required.append("Update architecture documentation")
        
        // Log approved deviation
        LogApprovedDeviation(deviation_document, approved_by, approval_date, conditions)
    else:
        approval_status = "rejected"
        // Log rejected deviation
        LogRejectedDeviation(deviation_document, permission_request.rejection_reason)
