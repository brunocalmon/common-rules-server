---
kind: skill
name: review-security
description: >-
  Focused security review of code changes.
  Use when changes touch auth, input handling, data exposure, or crypto.
trigger: user-invoked
relationships:
  comes-from:
    - target: /review
      required: false
  output: templates/review-security.md
---

## Relationships

| Relation | Target | Required? | Notes |
|----------|--------|-----------|-------|
| comes-from | /review | no | Escalated from general review |
| output | templates/review-security.md | yes | Security review report |

## Instructions

Review the diff specifically for security concerns:

1. **Injection** — SQL, command, XSS, template injection.
2. **Auth/AuthZ** — bypass, privilege escalation, missing checks.
3. **Data exposure** — secrets in code, PII logging, error leakage.
4. **Crypto** — weak algorithms, hardcoded keys, insecure randomness.
5. **Dependencies** — known vulnerabilities in added packages.

For each finding: severity (critical/high/medium/low), description, fix.