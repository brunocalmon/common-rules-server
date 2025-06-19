```yaml
# This description field briefly states the purpose and intended use of this rule.
description: This rule provides guidance to the agent for handling Java code style compliance. It describes how to detect build tools, locate Checkstyle configurations, and validate code style. The rule does not perform validation or remediation automatically; the agent should follow the instructions to check and address style issues.
# 'globs' specifies file-matching patterns (e.g., "*.md", "*.py") that determine which files this rule applies to.
globs: *.java
# Rule Trigger Types: 
# - Always: Rule is always applied by the system.
# - Agent Requested: Rule is applied when specifically requested by an agent.
# - Auto Attached: Rule is automatically attached based on context or conditions.
# - Manual: Rule is applied only when manually selected or invoked.
type: Auto Attached
# The 'artifacts' property lists related configuration files (such as Checkstyle and suppressions XMLs)
# that are referenced by this rule. These files help define the code style standards and exceptions
# for Java projects, and should be used by the agent when performing style validation.
artifacts:
  - code_style/checkstyle.xml
  - code_style/suppressions.xml
  - templates/java_code_style.md
```
// JavaCodeStyle Rule - Pseudocode

// The output for this rule must be created according to the template_id: templates/java_code_style.md

var context = input.context
var java_files = input.java_files

var build_tool = "unknown"
var checkstyle_config = ""
var suppressions_config = ""
var validation_status = "pending"
var violations = []
var warnings = []
var remediation_steps = []

// Step 1: Detect build tool
if FileExists("build.gradle") || FileExists("build.gradle.kts"):
    build_tool = "gradle"
else if FileExists("pom.xml"):
    build_tool = "maven"
else:
    build_tool = "unknown"

// Step 2: Locate checkstyle configuration
var possible_config_paths = [
    "checkstyle.xml",
    "config/checkstyle.xml",
    "build/checkstyle.xml",
    "src/main/resources/checkstyle.xml"
]

for path in possible_config_paths:
    if FileExists(path):
        checkstyle_config = path
        break

var possible_suppressions_paths = [
    "suppressions.xml",
    "config/suppressions.xml",
    "build/suppressions.xml",
    "src/main/resources/suppressions.xml"
]

for path in possible_suppressions_paths:
    if FileExists(path):
        suppressions_config = path
        break

// Step 3: Run checkstyle validation
if build_tool == "gradle":
    var gradle_command = "./gradlew checkstyle"
    var result = ExecuteCommand(gradle_command)
    
    if result.exit_code == 0:
        validation_status = "pass"
    else:
        validation_status = "fail"
        var output_lines = result.stdout.splitlines()
        for line in output_lines:
            if "violation" in line.lower():
                violations.append(line.strip())
            elif "warning" in line.lower():
                warnings.append(line.strip())

else if build_tool == "maven":
    var maven_command = "mvn checkstyle:check"
    var result = ExecuteCommand(maven_command)
    
    if result.exit_code == 0:
        validation_status = "pass"
    else:
        validation_status = "fail"
        var output_lines = result.stdout.splitlines()
        for line in output_lines:
            if "violation" in line.lower():
                violations.append(line.strip())
            elif "warning" in line.lower():
                warnings.append(line.strip())

else:
    // Fallback: Use checkstyle directly if available
    if checkstyle_config:
        var checkstyle_command = "java -jar checkstyle.jar -c " + checkstyle_config + " src/"
        var result = ExecuteCommand(checkstyle_command)
        
        if result.exit_code == 0:
            validation_status = "pass"
        else:
            validation_status = "fail"
            var output_lines = result.stdout.splitlines()
            for line in output_lines:
                if "violation" in line.lower():
                    violations.append(line.strip())
                elif "warning" in line.lower():
                    warnings.append(line.strip())
    else:
        validation_status = "fail"
        violations.append("Checkstyle configuration not found")

// Step 4: Generate remediation steps
if validation_status == "fail":
    if violations.length > 0:
        remediation_steps.append("Fix the following style violations:")
        for violation in violations:
            remediation_steps.append("- " + violation)
    
    if !checkstyle_config:
        remediation_steps.append("Add checkstyle.xml configuration file to the project")
    
    if build_tool == "unknown":
        remediation_steps.append("Specify build tool (Gradle or Maven) for automated validation")

return {
    "output_file": output_file,
    "build_tool": build_tool,
    "checkstyle_config": checkstyle_config,
    "suppressions_config": suppressions_config,
    "validation_status": validation_status,
    "violations": violations,
    "warnings": warnings,
    "remediation_steps": remediation_steps,
    "validation_passed": validation_status == "pass"
}

