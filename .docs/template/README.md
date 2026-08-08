# Engineering Wiki — Template

A reusable documentation structure for any software project. Copy this
directory, rename it after your project, replace the placeholder content, and
delete what you do not need.

Documentation lives in the repository beside the code it describes, changes in
the same pull request as the code it describes, and is reviewed the same way.

## Sections

| Section | Holds | Read it when |
|---|---|---|
| [Product](product/PRD-TEMPLATE.md) | What is being built and for whom | Deciding whether something is in scope |
| [Architecture](architecture/SYSTEM-DESIGN-TEMPLATE.md) | Structure, and the decisions behind it | Changing how components fit together |
| [Engineering](engineering/CODING-STANDARDS-TEMPLATE.md) | How code is written, tested and reviewed | Writing or reviewing code |
| [Operations](operations/PLAYBOOK-TEMPLATE.md) | Running it, and recovering when it breaks | Deploying, or responding to an incident |
| [Onboarding](onboarding/SETUP-GUIDE-TEMPLATE.md) | Getting productive from nothing | Your first day |
| [Tracking](tracking/WORKFLOW.md) | Roadmap, epics, tickets, findings | Planning or picking up work |

## Principles

**No zombie documentation.** A page that describes a version of the system that
no longer exists is worse than no page, because it is trusted. Retire pages
through the [Documentation Protocol](DOCUMENTATION-PROTOCOL.md) rather than
leaving them to rot.

**Minimum viable documentation.** A few accurate pages beat many stale ones.
Every page you add is a page somebody has to keep true.

**The code is the source of truth for behaviour; documentation is the source of
truth for intent.** When they disagree about *what* the system does, the code
wins. Documentation exists to record *why*, which is the part that cannot be
recovered by reading the code.

**Write for the person who arrives without context.** They do not know the
history, the abbreviations, or which decisions are still live.


---

Next: [Documentation Protocol](DOCUMENTATION-PROTOCOL.md) →
