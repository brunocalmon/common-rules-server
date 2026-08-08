---
kind: skill
name: review-security
description: >-
  Focused security review of a change. Use when it touches authentication,
  authorisation, untrusted input, secrets or cryptography.
trigger: user-invoked
relationships:
  comes-from:
    - target: /review
      required: false
      note: Escalated from a general review
  output: templates/review-security.md
---

## Relationships

| Relation | Target | Required? | Notes |
|----------|--------|-----------|-------|
| comes-from | /review | no | Escalated from general review |
| output | templates/review-security.md | yes | Security review report |

## Instructions

Review the change against each category. Trace data from where it enters to
where it is used — a vulnerability is a path, and reading the sink alone will
not show you one.

| Category | What to look for |
|---|---|
| Injection | Untrusted input reaching SQL, shell, a template engine, a path, or rendered markup without escaping appropriate to that sink |
| Authorisation | Missing or bypassable checks, checks on the wrong subject, privilege that widens along a code path |
| Data exposure | Secrets committed, credentials or personal data in logs, internal detail in error responses |
| Cryptography | Broken or home-made algorithms, hardcoded keys, predictable randomness where unpredictability is required |
| Dependencies | Newly added packages, and known advisories against them |

For each finding: severity, the exact path from entry point to sink, the
conditions that make it exploitable, and the fix.

Say clearly which categories you checked and found clean. A security review that
reports only findings leaves the reader unable to tell what was examined.
