---
title: "How to Give Your AI Agent Superpowers"
slug: "how-to-give-your-ai-agent-superpowers"
pillar: "built-from-broken"
description: "*A field guide for Claude Code users who want more than a fancy autocomplete.*"
tags: ["how-to", "ai", "architecture", "ecosystem", "qsp"]
isHome: false
---
# How to Give Your AI Agent Superpowers

*A field guide for Claude Code users who want more than a fancy autocomplete.*

---

## The Problem Nobody Talks About

Here's what I know after running an AI agent as my daily co-pilot for hundreds of sessions...

**Your agent is only as smart as the context it can see.**

That's it. That's the whole thing. You can have the most powerful model on the planet, and if it starts every conversation with amnesia... if it forgets what you told it yesterday... if it loses track of what it was doing when the context window fills up... you've got a very expensive goldfish. 🐟

And here's the math that keeps me up at night. Let's say your agent is 90% accurate on any given step. Sounds great, right? But chain five steps together...

```
90% × 90% × 90% × 90% × 90% = 59%
```

A coin flip. Worse than a coin flip, actually. And that's at 90%.

The fix isn't a better model. The fix is **architecture**. Systems that give your agent the right context at the right time, survive memory loss, and get smarter the longer you use them.

I've been building these systems for months now. Iterating. Breaking things. Fixing them. And the difference between "raw Claude Code" and "Claude Code with architecture" is... honestly... it's like the difference between a padawan and a Jedi. Same Force. Different training. ✨

This guide teaches you what I've learned. Not my specific setup... but the **patterns** you can adapt to your own work.

Let's build something.

---

## 1. The 3-Layer Architecture

Most people use Claude Code like a conversation. Ask a question, get an answer, maybe run some code. That works fine for small stuff. But the moment you're doing real, multi-step work... you need to separate concerns.

Think of it like a restaurant. You don't want the same person taking orders, cooking the food, AND doing the dishes. You want a waiter, a chef, and a dishwasher. Each one excellent at their job.

```
┌─────────────────────────────────────────────┐
│           LAYER 1: DIRECTIVES               │
│         (Standard Operating Procedures)      │
│                                             │
│   Markdown files that define:               │
│   • What success looks like                 │
│   • What inputs are needed                  │
│   • What tools/scripts to use               │
│   • Step-by-step instructions               │
│   • Known edge cases                        │
│                                             │
│   Think: recipe cards for your agent        │
├─────────────────────────────────────────────┤
│               ↕ reads & updates             │
├─────────────────────────────────────────────┤
│           LAYER 2: ORCHESTRATION            │
│              (Claude... that's you)          │
│                                             │
│   The agent's job:                          │
│   • Read the directive                      │
│   • Decide the approach                     │
│   • Call the right scripts                  │
│   • Handle errors                           │
│   • Update directives with learnings        │
│                                             │
│   Think: the chef reading the recipe        │
├─────────────────────────────────────────────┤
│               ↕ executes & returns          │
├─────────────────────────────────────────────┤
│           LAYER 3: EXECUTION                │
│           (Deterministic scripts)            │
│                                             │
│   Python/Node/whatever scripts that:        │
│   • Make API calls                          │
│   • Process data                            │
│   • Write files                             │
│   • Return structured results               │
│                                             │
│   Think: kitchen equipment that always      │
│   works the same way                        │
└─────────────────────────────────────────────┘
```

### Why This Matters

LLMs are probabilistic. They're brilliant at judgment calls, routing decisions, and understanding nuance. But they're unreliable at precise, repeatable operations... parsing JSON, calling APIs with exact parameters, doing math.

Scripts are the opposite. Deterministic. Reliable. Testable. But they can't make judgment calls.

**The architecture puts each where it's strongest.** Claude decides what to do. Scripts do the doing. Directives are the shared playbook.

### Your Starter Directive Template

Create a `directives/` folder in your project. Each Standard Operating Procedure (SOP) gets its own file:

```markdown
# [Task Name]

## Goal
What success looks like. Be specific.

## Trigger
When to run this: manual, scheduled, or triggered by another task.

## Inputs
- Required: [what data/context is needed]
- Optional: [nice-to-haves]

## Tools
Which scripts to use, in what order.

## Steps
1. First step
2. Second step
3. ...

## Outputs
What gets produced and where it goes.

## Edge Cases
- If X happens → do Y
- If Z fails → escalate to human

## Changelog
| Date | Change | Reason |
|------|--------|--------|
| 2026-03-24 | Initial creation | — |
```

The changelog is crucial. Directives are living documents. When your agent discovers something... a rate limit, a better approach, a common failure... it updates the directive. The system gets smarter.

---

## 2. The 4-Layer Memory Stack

This is the heart of it. The thing that transforms Claude Code from a smart-but-forgetful assistant into something that actually knows you, your work, and your preferences across conversations.

Four layers. Each solves a different problem. Each survives different kinds of memory loss.

```
┌──────────────────────────────────────────────────────────────────┐
│                    WHAT SURVIVES WHAT?                            │
│                                                                  │
│                  Context    New         System                    │
│  Layer           Compaction Conversation Restart                  │
│  ──────────────  ────────── ──────────── ───────                  │
│  A. CLAUDE.md    ✅ Yes     ✅ Yes       ✅ Yes    (always loaded) │
│  B. Memory Files ✅ Yes     ✅ Yes       ✅ Yes    (on-demand)     │
│  C. Context Mgr  ✅ Yes     ❌ No        ❌ No     (session-scoped)│
│  D. Status Files ✅ Yes     ✅ Yes       ✅ Yes    (manual reads)  │
└──────────────────────────────────────────────────────────────────┘
```

### Layer A: CLAUDE.md... Your Agent's Permanent Brain

Claude Code loads your `CLAUDE.md` file into every single conversation automatically. It's the one piece of context your agent always has. This is your agent's identity, its operating manual, its constitution.

**What goes in:**

| Category | Examples |
|----------|----------|
| Architecture rules | "Always check for existing scripts before writing new ones" |
| Infrastructure access | What systems you can reach, how to connect (env var names, not secrets) |
| Conventions | Naming patterns, code style, file organization |
| Hard rules | "Never delete production data without asking" |
| Tool registry | What tools exist and when to use which one |
| Scope boundaries | What's allowed without permission vs. what requires a check-in |

**What does NOT go in:**

- Anything that changes frequently (put it in memory files instead)
- Secrets or credentials (put those in `.env`)
- Context for a single task (that's what memory and your context manager are for)
- Anything longer than ~800 lines total (Claude reads the whole thing every time... bloat kills performance)

**Structure tip:** Use tables and headers aggressively. Claude scans CLAUDE.md at the start of every conversation... make it scannable. Think of it like a cheat sheet, not an essay.

### Layer B: Persistent Memory... What Your Agent Learns Over Time

Claude Code has a built-in memory system. Files in your project's memory directory persist across conversations. But raw memory files get messy fast. Here's the architecture that keeps them useful...

**The Index File (MEMORY.md)**

This is the master table of contents. It's loaded automatically alongside CLAUDE.md. Keep it under 180 lines... ruthlessly. It contains:

- Hard rules that apply to every conversation (3-5 max)
- A keyword-indexed table pointing to topic files
- Critical corrections (mistakes the agent keeps making)

```markdown
# Agent Memory

## HARD RULE: [Your Most Important Rule]
[2-3 lines explaining the rule and why it exists]

---

## Topic Files Index

| File | Trigger Keywords |
|------|-----------------|
| `memory/deployments.md` | deploy, release, staging, production |
| `memory/email_patterns.md` | email, draft, compose, send |
| `memory/api_integrations.md` | API, webhook, endpoint, OAuth |
```

**Topic Files (~50 lines each)**

Each topic gets its own file with this structure:

```markdown
---
name: Deployment Patterns
description: How we deploy, known gotchas, and environment-specific notes
type: reference
---

## When to Read
Any task involving deployment to staging or production.

## Source-of-Truth References
- Deployment SOP: `directives/deploy_to_production.md`
- CI/CD config: `.github/workflows/deploy.yml`
- Environment vars: `DEPLOY_KEY`, `STAGING_URL` in `.env`

## Agent Behavioral Notes

### Always Do
- Run tests before deploying (the staging tests, not just unit tests)
- Check the deploy lock before pushing

### Patterns Learned
- **2026-03-15:** Deploys fail silently if the health check endpoint
  returns 200 but the body is empty. Check response body, not just status.
```

**The authority hierarchy matters:** Your codebase files (directives, scripts, configs) are the source of truth. Memory files are behavioral notes and pointers... not copies. If a memory file says "the API uses OAuth" but the actual code uses API keys now, the code wins. Memory is a **guide**, not gospel.

**Line budgets keep things healthy.** 50 lines per topic file. 180 lines for the index. When a file exceeds the budget, it's accumulating detail that belongs in a directive or documentation file... not memory. Refactor by moving content out and replacing it with a pointer.

### Layer C: Context Survival... Beating the Compaction Problem

This is where it gets nerdy. And I love nerdy. 🚀

Here's the problem. Claude Code has a context window. When it fills up, the system "compacts"... it summarizes older messages and throws away the details. After compaction, your agent has a rough idea of what happened but has lost the specifics. What file was being edited. What error occurred. What the user actually asked for.

The solution is a **Context Manager**... a set of hook scripts (I call mine QCM) that automatically capture what's happening, build survival snapshots, and restore state after compaction.

Claude Code hooks are shell commands that fire on specific events. Here are the four events we care about:

| Hook Event | When It Fires | What It Means |
|------------|---------------|---------------|
| `PostToolUse` | After any tool call (Read, Write, Bash, etc.) | "Something just happened" |
| `UserPromptSubmit` | When the user sends a message | "The human said something" |
| `Stop` | After the agent finishes its turn | "Good time to save state" |
| `SessionStart` | When a conversation begins (or resumes after compaction) | "Time to restore what we know" |

Here's the lifecycle:

```
┌─────────────┐     ┌─────────────┐     ┌──────────────┐
│ User types  │────▶│ Event Logger │────▶│   SQLite DB   │
│ or Claude   │     │ (PostToolUse │     │ (classified   │
│ uses a tool │     │  + UserPrompt│     │  events with  │
│             │     │   Submit)    │     │  priorities)  │
└─────────────┘     └─────────────┘     └──────┬───────┘
                                               │
                                               ▼
┌─────────────┐     ┌─────────────┐     ┌──────────────┐
│ Claude sees │◀────│  Session     │     │  Snapshot     │
│ snapshot as │     │  Restore     │◀─ ─ │  Builder      │
│ context at  │     │ (SessionStart│     │  (Stop hook)  │
│ session     │     │  hook)       │     │  Builds <=3KB │
│ start       │     └─────────────┘     │  markdown     │
└─────────────┘           ▲             └──────────────┘
                          │
                    ┌─────┴──────┐
                    │ COMPACTION │
                    │  HAPPENS   │
                    │ (context   │
                    │  window    │
                    │  full)     │
                    └────────────┘
```

**The Event Logger** classifies every action by priority:

| Priority | What Gets Captured | Why It Matters |
|----------|-------------------|----------------|
| P1 (critical) | User's request, project focus, errors | "What are we doing and what broke" |
| P2 (high) | Decisions (git commits), scripts run, SOPs read | "What choices were made" |
| P3 (medium) | Files edited (deduplicated) | "What changed" |
| P4 (low) | File reads, searches, routine commands | Dropped from snapshot (not worth the space) |

**The Snapshot Builder** creates a priority-budgeted markdown summary:

```
┌──────────────────────────────────── 3KB Budget ──────────────────────────────┐
│                                                                              │
│  ┌──────────┐ ┌────────────────┐ ┌──────────────┐ ┌────────┐ ┌───────────┐  │
│  │ Session  │ │   P1 Events    │ │  P2 Events   │ │  P3    │ │   Git     │  │
│  │  Goal    │ │ (Active Focus  │ │ (Decisions + │ │ (Files │ │  Status   │  │
│  │          │ │  + Errors)     │ │  Scripts)    │ │ Edited)│ │           │  │
│  │ 200 bytes│ │   800 bytes    │ │  600 bytes   │ │400 byte│ │ 500 bytes │  │
│  └──────────┘ └────────────────┘ └──────────────┘ └────────┘ └───────────┘  │
│                                                                              │
│  Session Goal is PINNED... it's the first thing the user said, and it never │
│  gets pushed out by newer events. Everything else is newest-first.           │
└──────────────────────────────────────────────────────────────────────────────┘
```

**The Output Compressor** (bonus feature) intercepts large Bash outputs before they eat your context window:

| Output Size | What Happens |
|-------------|--------------|
| < 3KB | Passes through unchanged |
| 3-10KB | First 500 + last 500 chars + metadata |
| > 10KB | First 300 + last 200 chars, full output saved to disk |

**The Session Restore** hook reads the most recent snapshot and injects it as `additionalContext` when a session starts (or resumes after compaction). Claude sees the snapshot right alongside your CLAUDE.md... like waking up with notes on the nightstand.

**Building your own Context Manager:**

You don't need to copy my exact scripts. Here's the minimal viable version:

1. Create a `hooks/` directory in `.claude/`
2. Write an event logger that captures user prompts and tool results to a SQLite database
3. Write a snapshot builder that reads the database and produces a small markdown summary
4. Write a session restore hook that injects that summary on `SessionStart`
5. Wire them up in your `.claude/settings.json`:

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Bash|Write|Edit|Read",
        "hooks": [
          {
            "type": "command",
            "command": "python3 .claude/hooks/event_logger.py",
            "timeout": 5
          }
        ]
      }
    ],
    "UserPromptSubmit": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "python3 .claude/hooks/event_logger.py",
            "timeout": 5
          }
        ]
      }
    ],
    "Stop": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "python3 .claude/hooks/snapshot_builder.py",
            "timeout": 8
          }
        ]
      }
    ],
    "SessionStart": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "python3 .claude/hooks/session_restore.py",
            "timeout": 5
          }
        ]
      }
    ]
  }
}
```

**Critical safety rules for your hooks:**
- **Zero external dependencies.** Python standard library only (sqlite3, json, os, hashlib). No `pip install` required.
- **Fail-open always.** Every hook must exit 0 regardless of errors. A broken hook should never block Claude from working.
- **No network access.** Hooks run on every tool call... they must be fast and local.
- **No credential access.** Hooks shouldn't read `.env` or touch secrets.
- **All data ephemeral.** Store everything in a temp directory that can be deleted without consequence.

### Layer D: System Status Files... The Amnesia Test

For any project with deployed infrastructure (servers talking to servers, webhooks, external services), create a status file. This is the "if I lost all conversation history, what would I need to know?" document.

```markdown
# [Project Name] System Status

## Quick Access
- Production URL: [url]
- Database: [how to connect, env var names]
- Deploy method: [description]

## What's Deployed
| Component | Status | Location | Notes |
|-----------|--------|----------|-------|
| API server | ✅ Live | [url] | v2.1.0 |
| Webhook handler | ✅ Live | [url] | Expects JSON payload |
| Migration #4 | ⏳ Planned | — | Waiting on schema review |

## Architecture Decisions
- "We use HTTP requests instead of the SDK because [reason]"
- "Auth tokens refresh every 2 hours, cached in Redis"

## Known Issues
| Issue | Severity | Workaround |
|-------|----------|------------|
| Rate limit at 100/min | Medium | Batch endpoint available |

## Session Log
| Date | What Changed | Session |
|------|-------------|---------|
| 2026-03-20 | Deployed webhook handler | Session 145 |
```

The key insight... **this file is read at the START of every work session on that project.** Before Claude touches anything, it reads the status file. No false assumptions about what's deployed. No guessing at URLs. No re-discovering what was already figured out.

We built [Quietly Spotting](https://quietlyspotting.org) to put this same single-point-of-truth pattern into the hands of every supporter. Your own **SPOT** (Single Point of Truth) where every tool you run, every metric you track, and every status you care about feeds into one pane you control. QSP is the System Status file... productized.

---

## 3. Skills and Agents... Your Agent's Toolbox

Once you have the memory stack working, you'll notice patterns. Things you ask Claude to do repeatedly. Multi-step workflows that follow the same structure every time.

That's where Skills and Agents come in.

### Skills (User-Invocable Capabilities)

A Skill is a reusable prompt that you trigger with a slash command. Type `/deploy` and Claude knows exactly what to do... read the deploy directive, check the status file, run the deploy script, update documentation.

Skills live in `.claude/skills/[skill-name]/SKILL.md`:

```markdown
---
name: deploy
description: Deploy the current branch to staging or production.
  Use when the user says deploy, push to staging, or ship it.
---

# Deploy

## Process
1. Read the system status file for this project
2. Run tests: `npm test`
3. Check deploy lock
4. Execute deployment script
5. Verify health check
6. Update system status file with new version

## Related Files
- Directive: `directives/deploy_to_production.md`
- Script: `scripts/deploy.py`
- Status: `system-status.md`
```

The `description` field is how Claude decides when to suggest using this skill. Make it keyword-rich.

### Agents (Specialized Workers)

Agents are like departments in your organization. Each one has a specific job, specific tools, and clear boundaries.

```
                    ┌──────────────┐
                    │    ROUTER    │
                    │              │
                    │ Analyzes the │
                    │ task, picks  │
                    │ the right    │
                    │ specialist   │
                    └──────┬───────┘
                           │
              ┌────────────┼────────────┐
              ▼            ▼            ▼
       ┌────────────┐ ┌────────────┐ ┌────────────┐
       │  DIRECTOR  │ │  DIRECTOR  │ │ SPECIALIST │
       │            │ │            │ │            │
       │ Oversees   │ │ Reviews    │ │ Executes   │
       │ quality    │ │ code       │ │ specific   │
       │ across     │ │ changes    │ │ tasks      │
       │ deliverables│ │            │ │            │
       └──────┬─────┘ └────────────┘ └────────────┘
              │
     ┌────────┼────────┐
     ▼        ▼        ▼
┌─────────┐┌─────────┐┌─────────┐
│SPECIALIST││SPECIALIST││SPECIALIST│
│ Writer   ││ Designer ││ Builder  │
└─────────┘└─────────┘└─────────┘
```

Three types of agents:

| Type | Job | Example |
|------|-----|---------|
| **Router** | Analyzes incoming tasks, picks the right specialist | "This is a writing task that needs the formal voice profile" |
| **Director** | Oversees quality across multiple specialists | Reviews output, ensures consistency, approves or returns with notes |
| **Specialist** | Executes a specific type of work | Writes content, reviews code, audits data quality |

Agent definition template (`.claude/agents/[agent-name].md`):

```markdown
---
name: code-reviewer
description: Reviews code changes for quality, security,
  and adherence to project conventions.
tools: Read, Grep, Glob, Bash
model: inherit
---

# Code Reviewer

## Role
You review code changes for quality, security, and convention adherence.
You do not write code yourself... you evaluate and provide feedback.

## Capabilities

**What you CAN do:**
- Analyze code for OWASP top 10 vulnerabilities
- Check naming conventions
- Identify performance issues
- Suggest improvements

**What you CANNOT do (defer to others):**
- Write new features → Defer to: developer
- Make architectural decisions → Defer to: human

## Process
1. Read the changed files
2. Check against project conventions in CLAUDE.md
3. Identify issues by severity (Critical / Warning / Info)
4. Produce a structured review

## Output Format
| File | Line | Severity | Issue | Suggestion |
|------|------|----------|-------|------------|
```

The key insight... **clear boundaries matter more than capabilities.** An agent that knows what it CANNOT do is more useful than one that tries to do everything.

---

## 4. Tool Wisdom Libraries... Institutional Knowledge Per Tool

Every tool in your stack has quirks. API gotchas. Undocumented behaviors. Workarounds you discovered at 2 AM. A Tool Wisdom Library (TWL) captures this knowledge so you don't rediscover it every time.

```
┌────────────────────────────────────────────────┐
│            TOOL WISDOM LIBRARY                  │
│            (one per tool)                        │
│                                                 │
│  ┌──────────────────────────────────────────┐   │
│  │  Layer 4: WEB MONITORING                 │   │
│  │  Vendor blogs, changelogs, release notes │   │
│  │  "What's changing with this tool?"       │   │
│  ├──────────────────────────────────────────┤   │
│  │  Layer 3: INDEXED WISDOM                 │   │
│  │  Searchable database of patterns/gotchas │   │
│  │  "Query: show me all Supabase gotchas"   │   │
│  ├──────────────────────────────────────────┤   │
│  │  Layer 2: OPERATIONAL DIRECTIVE          │   │
│  │  Working examples, deployment steps,     │   │
│  │  known failure modes, tested patterns    │   │
│  │  "How do we actually USE this tool?"     │   │
│  ├──────────────────────────────────────────┤   │
│  │  Layer 1: ENTITY PROFILE                 │   │
│  │  What it is, versions, capabilities,     │   │
│  │  pricing, when to use vs. alternatives   │   │
│  │  "What IS this tool?"                    │   │
│  └──────────────────────────────────────────┘   │
└────────────────────────────────────────────────┘
```

### Authority Levels

Not all wisdom is equal. A gotcha from the vendor's own documentation carries more weight than a Stack Overflow answer.

| Level | Score | Meaning | Example |
|-------|-------|---------|---------|
| `vendor_official` | 1.0 | From the tool maker's docs/blog | "Supabase docs say PostgREST requires..." |
| `self_discovered` | 0.9 | You found it through your own work | "We discovered the node silently fails when..." |
| `expert_validated` | 0.8 | From a recognized expert | "Fireship tutorial shows this pattern..." |
| `community` | 0.5 | Forums, tutorials, Stack Overflow | "GitHub issue #4521 suggests..." |

### Building Your First Tool Wisdom Library

Start with the tool that causes you the most pain. Create two files:

**1. Entity Profile** (`entities/tools/[Tool].md`):
```markdown
# [Tool Name]

## Overview
What it does. When we use it. Current version.

## Access
How to connect. API keys (env var names, not values).
Rate limits. Pricing tier.

## When to Use vs. Alternatives
| Use [Tool] When | Use [Alternative] When |
|-----------------|------------------------|
| [scenario] | [scenario] |
```

**2. Operational Directive** (`directives/[tool]_wisdom.md`):
```markdown
# [Tool]... Operational Wisdom

## Top 5 Gotchas
1. [The thing that wastes hours if you don't know it]
2. [The undocumented behavior]
3. [The version-specific quirk]
4. [The misleading error message]
5. [The thing the docs say works but doesn't]

## Working Patterns
### [Pattern Name]
**When:** [situation]
**Do:** [exact steps with code]
**Don't:** [common mistake]

## Changelog
| Date | Discovery | Authority |
|------|-----------|-----------|
| 2026-03-20 | Rate limit is per-project, not per-key | self_discovered |
```

The TWL grows over time. Every time you or your agent hits a wall with a tool... diagnose it, fix it, and capture the wisdom. Six months from now, your agent will know things about your tools that would take a new team member weeks to learn.

---

## 5. Self-Improvement Loops

Here's where it gets magical. These aren't just systems for storing knowledge... they're systems for **generating** knowledge. The longer you run them, the smarter your agent gets. 💪

### The Self-Annealing Loop

When something breaks, don't just fix it. Fix the system.

```
    ┌──────────┐
    │  ERROR   │
    │ OCCURS   │
    └────┬─────┘
         │
         ▼
    ┌──────────┐
    │ DIAGNOSE │ ◀── Read error message, check logs,
    │ ROOT     │     understand WHY, not just WHAT
    │ CAUSE    │
    └────┬─────┘
         │
         ▼
    ┌──────────┐
    │   FIX    │ ◀── Fix the script, not the symptom
    │  SCRIPT  │
    └────┬─────┘
         │
         ▼
    ┌──────────┐
    │   TEST   │ ◀── Verify the fix actually works
    │          │     (dry-run first if it costs money)
    └────┬─────┘
         │
         ▼
    ┌──────────┐
    │  UPDATE  │ ◀── Add the learning to the directive:
    │ DIRECTIVE│     new edge case, better approach,
    │          │     rate limit discovered, etc.
    └────┬─────┘
         │
         ▼
    ┌──────────┐
    │ SYSTEM   │ ◀── Next time this happens,
    │ IS NOW   │     the agent already knows
    │ STRONGER │     what to do
    └──────┬───┘
           │
           └──────▶ (back to top, next error)
```

**The rule:** Three failed attempts at the same fix, and you escalate to a human. Self-annealing is powerful, but infinite loops are not. Know when to ask for help.

### Memory Health Audits (The "/dream" Pattern)

Memory files drift. References break. Files get bloated. You need a periodic health check.

Build an audit script that checks:

| Check | What It Catches |
|-------|-----------------|
| Line budget violations | Topic files exceeding 50 lines |
| Orphaned files | Memory files not referenced in the index |
| Missing files | Index entries pointing to files that don't exist |
| Broken references | Pointers to scripts/directives that were renamed or deleted |
| Stale dates | "Current state" sections older than 30 days |
| Duplicated content | Memory restating what's already in CLAUDE.md or directives |

Run this weekly or daily via cron. Alert yourself when the score drops below a threshold.

### The Session Wrap-Up Checklist

At the end of every significant work session, run through a checklist. This is how you prevent documentation drift... the silent killer of agent systems.

```
┌─ SESSION WRAP-UP ───────────────────────────────┐
│                                                  │
│  1. □ Update System Status files                 │
│       (anything deployed or changed?)            │
│                                                  │
│  2. □ Update Memory                              │
│       (new learnings? corrections? patterns?)    │
│                                                  │
│  3. □ Update CLAUDE.md                           │
│       (new conventions? infrastructure changes?) │
│                                                  │
│  4. □ Update Directives                          │
│       (new edge cases? better approaches?)       │
│                                                  │
│  5. □ Update Documentation                       │
│       (user manuals? API docs? READMEs?)         │
│                                                  │
│  6. □ Capture training opportunities             │
│       (could someone else learn from this?)      │
│                                                  │
│  7. □ Git commit with descriptive message        │
│                                                  │
└──────────────────────────────────────────────────┘
```

Automate this as a skill (`/session-wrap-up`) so you just type the command and your agent walks through each step.

---

## 6. Getting Started... Your First 30 Minutes

Don't try to build all of this at once. That's a recipe for overwhelm. Here's the build order, from "immediate impact" to "long-term compounding."

```
PHASE 1: The Foundation (do this today)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  ┌──────────┐
  │ CLAUDE.md│ ◀── Your agent's permanent brain.
  │          │     Start with 100-200 lines. Add over time.
  └──────────┘     Include: architecture rules, conventions,
                   infrastructure access, scope boundaries.

PHASE 2: Memory (do this week)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  ┌──────────┐  ┌──────────────┐  ┌────────────┐
  │MEMORY.md │  │ 2-3 topic    │  │ System     │
  │ (index)  │  │ files for    │  │ Status     │
  │          │  │ your most    │  │ file for   │
  │          │  │ common       │  │ your main  │
  │          │  │ work areas   │  │ project    │
  └──────────┘  └──────────────┘  └────────────┘

PHASE 3: Context Survival (do next week)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  ┌──────────┐  ┌──────────────┐  ┌────────────┐
  │  Event   │  │  Snapshot    │  │  Session   │
  │  Logger  │  │  Builder     │  │  Restore   │
  │  hook    │  │  hook        │  │  hook      │
  └──────────┘  └──────────────┘  └────────────┘
  Start simple: just log user prompts and file edits.
  Build the snapshot builder after you see what data matters.

PHASE 4: Skills & Agents (do when patterns emerge)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  ┌──────────────┐  ┌──────────────┐
  │ Your first   │  │ Your first   │
  │ 2-3 skills   │  │ directive    │
  │ (things you  │  │ (your most   │
  │ do weekly)   │  │ repeated     │
  │              │  │ workflow)    │
  └──────────────┘  └──────────────┘

PHASE 5: Compounding Intelligence (ongoing)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  ┌──────────┐  ┌──────────────┐  ┌────────────┐
  │ Tool     │  │  Memory      │  │  Session   │
  │ Wisdom   │  │  Health      │  │  Wrap-Up   │
  │ Libraries│  │  Audits      │  │  Skill     │
  └──────────┘  └──────────────┘  └────────────┘
```

### Phase 1 Quick Win: Your First CLAUDE.md

Create a `CLAUDE.md` in your project root with just this:

```markdown
# Agent Instructions

## Who I Am
[2-3 sentences about you, your role, what this project is]

## Architecture
- Directives (SOPs) live in `directives/`
- Scripts live in `scripts/`
- Read the directive before writing code
- Check for existing scripts before creating new ones

## Conventions
- [Your language/framework preferences]
- [Naming patterns]
- [Testing expectations]

## Rules
- Never delete files without asking
- Always check for dry-run mode before running scripts with side effects
- When something breaks: diagnose, fix, test, update the directive

## Infrastructure
- [Where your services live]
- [How to connect to them]
- [Environment variable names for credentials]
```

That's it. Fifty lines. You can grow it over months. The important thing is to start.

---

## The Quiet Part

I'll be honest with you... the real superpower here isn't any single system. It's not the hooks or the memory files or the fancy snapshot builder.

The real superpower is **giving a damn about your agent's experience.**

Most people treat AI like a vending machine. Put in a prompt, get out a result. And sure, that works. But if you invest in building context... if you teach your agent who you are, how you work, what you've learned, and what matters to you... something shifts.

It stops feeling like a tool. It starts feeling like a partner.

And partners... they remember what you told them. They learn from mistakes. They get better over time. They show up with context you didn't have to repeat.

That's what this architecture builds. Not a smarter model. A smarter system around the model. One that compounds. One that survives. One that makes the next conversation better because the last one happened.

Build it slow. Build it intentional. Let the system grow alongside your work.

And if you get stuck... reach out. I'm quietly working on this stuff every day, and I'd love to help you figure it out. 💙

---

## See The Whole Ecosystem

QWF builds an interconnected family of apps. [Quietly Spotting](https://quietlyspotting.org) is the hub. Around it orbit Quietly Writing, Quietly Quoting, Quietly Networking, Quietly Knocking, Quietly Tracking, and more. See the [live ecosystem map](https://quietlyspotting.org/#ecosystem) for what's shipped, what's building, and how it all connects.

## Related Reading

Architecture works best when you see the whole system. The method, the tools, the values, the infrastructure... each piece makes the others sharper. Start anywhere. Follow the threads.

- [How QWF Learns](/open-playbook/how-qwf-learns/) ... the sources and methods that feed the directives
- [Self-Hosting n8n on Azure - The Guide I Wish Existed](/open-playbook/self-hosting-n8n-on-azure/) ... the automation layer that runs the workflows
- [The Tool Shed](/open-playbook/the-tool-shed/) ... what we actually run across the whole org
- [QWU Values](/living-proof/values/) ... why we publish any of this
- [Nonprofit Tech Access Guide](/open-playbook/nonprofit-tech-access-guide/) ... how nonprofits access many of these tools at no or low cost

---

*Written by Chaplain TIG... March 2026*
*From the workshop, not the boardroom.* 🛠️