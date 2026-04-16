---
title: "Built from Broken: Vol. 1"
slug: "when-your-ai-agent-keeps-forgetting"
pillar: "built-from-broken"
description: "Your agent has the docs. It just doesn't read them. A 50-line Python hook that fires before every prompt... and the Self-Annealing Triad that makes it stick."
publishDate: "2026-04-08"
tags: ["QWF", "QWU", "built-from-broken", "ai-agent", "claude-code", "transparency"]
series: "Built from Broken"
volume: 1
hook: "The docs existed. The agent didn't read them. 40 minutes of debugging... for a fix on line 47."
isHome: false
---
# Built from Broken: Vol. 1
## When Your AI Agent Keeps Forgetting What It Already Knows

> *Built from Broken is a series from the Quietly Working Foundation about real problems we face running AI-powered nonprofit operations... and the real solutions we build. Every fix in this series exists because something failed first. We show the receipts.*

---

## The Problem: Documented Wisdom, Voluntarily Ignored

At 90% accuracy per step, a five-step AI agent task succeeds only 59% of the time. That's not a rounding error... that's a coin flip with extra steps. And every avoidable mistake compounds into system-level unreliability. You don't need your agent to be perfect. You need to stop it from making the *same* mistake twice.

### What We Built (Before It Broke)

We maintain something called **Tool Wisdom Libraries** (TWLs). Think of them as "hard-won cheat sheets" for every major tool in our stack. Each one is a Markdown file that captures the gotchas, working patterns, and landmines our team has discovered through actual use.

For example, our Supabase TWL documents that Cloudflare's bot protection blocks API requests that don't include a specific `User-Agent` header. Our n8n TWL documents that activating a workflow by setting `active = true` in the database doesn't actually register scheduled triggers... you have to use the `publish:workflow` CLI command instead.

These aren't theoretical. Each entry was written in the aftermath of a real debugging session. Blood on the page.

We had the knowledge. It was organized. It was accessible. Our main agent instructions file (the equivalent of a `CLAUDE.md` or system prompt) literally said: **"Before working with these tools, read their TWL first."**

### How It Broke

The agent didn't read them.

Not maliciously. Not even randomly. It was a pattern. Under time pressure, with a complex task, the agent would skip the "read the docs first" step and go straight to execution. Then it would hit a gotcha that was already documented... and spend 30 to 60 minutes debugging something we'd already solved.

Here are three real incidents:

**Incident 1: The Cloudflare 1010 Block**
Task: Query Supabase API from a Python script.
What happened: Agent wrote the script, ran it, got a mysterious 403 error. Spent 40 minutes investigating Supabase permissions, Row Level Security policies, API key scoping. The actual problem? Cloudflare's bot protection was blocking the request because it didn't include a `User-Agent` header. This was documented in our Supabase TWL... line 47.

**Incident 2: The Silent Workflow**
Task: Deploy an n8n automation workflow.
What happened: Agent set `active = true` in the n8n database. Workflow appeared active in the UI. But scheduled triggers never fired. The agent diagnosed the issue, tried three different fixes, then discovered you have to use the `publish:workflow` CLI command. This was documented in our n8n TWL... the #1 rule in bold.

**Incident 3: The Wrong API**
Task: Pull local SEO data from BrightLocal.
What happened: Agent called the Management API (which handles account operations) instead of the Data API (which returns actual SEO metrics). Got confusing error responses. Spent time investigating authentication when the real problem was using the wrong base URL entirely. Our BrightLocal TWL had this as its opening paragraph... "Management API and Data API are separate systems."

Same pattern every time:
1. Agent gets a task involving a specific tool
2. Agent skips the TWL because the task feels straightforward
3. Agent hits a documented gotcha
4. Agent debugs from scratch
5. Agent eventually finds the answer... which was already written down

### Why "Just Tell It to Read" Doesn't Work

We tried the obvious fixes:

**Approach 1: Stronger instructions.**
We added more emphatic language to our system prompt. "MUST read TWLs." "CRITICAL: Read before proceeding." Bold text. Capital letters.

Result: Marginal improvement. The agent would sometimes read the TWL... but under complex multi-step tasks, it would still skip the reading step to "save time." Language models optimize for the task at hand, not for meta-instructions about preparation.

**Approach 2: Hoping agents would learn.**
We figured that after hitting the same gotcha twice, the agent would develop a pattern of checking docs first.

Result: Agents don't carry memory between sessions by default. Every new conversation starts fresh. The agent that debugged the Cloudflare 1010 block on Monday doesn't exist on Tuesday. A new agent makes the same mistake.

**Approach 3: Verbal reminders.**
We (the human) would remember to say "check the TWL first" when assigning tasks.

Result: This works... when you remember. Which you don't, because you're focused on the actual problem, not on babysitting the agent's preparation habits.

The core issue: **voluntary compliance doesn't scale.** When reading documentation is optional... even "strongly recommended" optional... it gets skipped under pressure. This is true for humans. It's true for AI agents. The only thing that works reliably is making compliance automatic.

---

## The Solution: A Hook That Reads the Room

### What Are Hooks?

If you're using Claude Code (Anthropic's terminal-based AI coding agent), hooks are shell commands that execute automatically in response to specific events. They're configured in your `settings.json` file and fire without any human intervention.

The key events you can hook into:

| Event | When It Fires |
|-------|--------------|
| `UserPromptSubmit` | Every time you send a message to the agent |
| `PreToolUse` | Before the agent uses a specific tool (file read, bash command, etc.) |
| `PostToolUse` | After a tool completes |
| `Stop` | When the agent finishes its response |

Hooks can do two things:
1. **Inject a system message** that the agent sees before it responds (by returning JSON with a `systemMessage` field)
2. **Block an action** by returning a non-zero exit code (for `PreToolUse` hooks)

The contract is simple: your hook receives JSON on stdin, returns JSON on stdout, and exits with code 0. If it fails or times out, Claude Code ignores it and continues. Safe by default.

### What We Built

A Python script that runs on every `UserPromptSubmit` event. It does three things:

1. **Scans your message** for keywords related to tools in your stack
2. **Looks up** which documentation files are relevant to those tools
3. **Injects a system message** telling the agent exactly which files to read before proceeding

That's it. No machine learning. No embeddings. No vector databases. Just a keyword map and a system message. Sometimes the simplest fix is the right one.

### The Architecture

```
┌──────────────────────────────────────────────┐
│  You type: "Deploy the Supabase edge function"│
└──────────────────┬───────────────────────────┘
                   │
                   ▼
┌──────────────────────────────────────────────┐
│  HOOK: Keyword Scanner                       │
│                                              │
│  Message contains "supabase" + "edge function"│
│  → Match: supabase domain                    │
│  → Required reading: supabase_tool_wisdom.md │
│  → Gotcha context: User-Agent header,        │
│    project registry, Management vs Data API  │
└──────────────────┬───────────────────────────┘
                   │
                   ▼
┌──────────────────────────────────────────────┐
│  SYSTEM MESSAGE INJECTED                     │
│                                              │
│  "Read supabase_tool_wisdom.md before        │
│   proceeding. Contains: User-Agent header    │
│   gotcha (Cloudflare 1010), project registry │
│   (8 projects), Management vs Data API..."   │
└──────────────────┬───────────────────────────┘
                   │
                   ▼
┌──────────────────────────────────────────────┐
│  AGENT RESPONSE                              │
│                                              │
│  Agent reads the TWL. Sees the User-Agent    │
│  requirement. Includes it in the script.     │
│  No 403. No debugging. Done.                 │
└──────────────────────────────────────────────┘
```

### The Before and After

**BEFORE (without hook):**
```
10:00  You: "Deploy the Supabase edge function for email verification"
10:01  Agent: writes the function, deploys it
10:02  Agent: "Deployed! Testing now..."
10:03  Agent: "Getting a 403 error. Investigating..."
10:15  Agent: "Checked RLS policies, they look correct..."
10:25  Agent: "Found it — Cloudflare blocks requests without User-Agent header"
10:30  Agent: "Fixed and redeployed. Working now."

Total: 30 minutes. Problem was documented. Knowledge existed. Wasn't used.
```

**AFTER (with hook):**
```
10:00  You: "Deploy the Supabase edge function for email verification"
       [Hook fires silently, injects TWL reminder]
10:01  Agent: reads supabase_tool_wisdom.md
10:02  Agent: writes the function WITH User-Agent header
10:03  Agent: "Deployed and tested. Working."

Total: 3 minutes. Same outcome. No debugging theatre.
```

---

## How to Build Your Own

You don't need our specific tools or domains. The pattern is universal. Here's the blueprint.

### Step 1: Map Your Domains

Create a dictionary of every tool/domain your agent works with. For each one, define:
- **Keywords** that indicate the agent is about to work with this tool
- **Required reading** — file paths to documentation the agent should read first
- **Context** — a one-line summary of why this reading matters (the gotcha headline)

Example structure (Python):

```python
DOMAINS = {
    "your_database": {
        "keywords": ["postgres", "database", "migration", "sql"],
        "required": [
            "docs/database-patterns.md",
            "docs/migration-checklist.md",
        ],
        "context": "Contains connection pooling limits, migration rollback procedures, and the production replica lag gotcha.",
    },
    "your_ci_cd": {
        "keywords": ["deploy", "pipeline", "github actions", "ci"],
        "required": [
            "docs/deploy-runbook.md",
        ],
        "context": "Contains the artifact caching bug workaround and the 10-minute timeout on staging deploys.",
    },
    # Add every tool that has bitten you
}
```

**How to decide what goes in the map:** Think about the last five times your agent wasted time on something it should have known. What documentation existed that would have prevented it? That's your first set of domains.

### Step 2: Build the Keyword Scanner

The scanner needs to handle two types of keywords:
- **Short keywords** (3 characters or fewer, like "sql" or "ci") need word-boundary matching so they don't false-trigger on random substrings
- **Longer keywords** can use simple substring matching

```python
import re

def extract_keywords(user_message, domains):
    """Scan a message for domain keywords. Returns set of matched domain names."""
    text_lower = user_message.lower()
    matched = set()

    for domain_name, config in domains.items():
        for keyword in config["keywords"]:
            if len(keyword) <= 3:
                # Short words need boundaries: "sql" shouldn't match "dismissal"
                if re.search(r'\b' + re.escape(keyword) + r'\b', text_lower):
                    matched.add(domain_name)
                    break
            else:
                if keyword in text_lower:
                    matched.add(domain_name)
                    break

    return matched
```

### Step 3: Build the Reminder Generator

When domains match, build a Markdown message listing what the agent needs to read and why.

```python
def build_reminder(matched_domains, domains):
    """Build a system message listing required reading for matched domains."""
    if not matched_domains:
        return None

    lines = [
        "## Required Reading Before Proceeding",
        "",
        "The following documentation is relevant to this task.",
        "**Read these files BEFORE writing code or making changes.**",
        "They contain gotchas that have cost hours of debugging.",
        "",
    ]

    for domain_name in sorted(matched_domains):
        config = domains[domain_name]
        display_name = domain_name.replace("_", " ").title()

        lines.append(f"### {display_name}")
        lines.append(f"*{config['context']}*")
        for filepath in config["required"]:
            lines.append(f"- `{filepath}`")
        lines.append("")

    return "\n".join(lines)
```

### Step 4: Wire It Up as a Hook

The hook reads JSON from stdin, processes it, and writes JSON to stdout. Always exits 0 (non-zero would block the user's message).

```python
import json
import sys

def main():
    # Read the hook event from stdin
    try:
        input_data = json.load(sys.stdin)
    except (json.JSONDecodeError, EOFError):
        input_data = {}

    # Extract the user's message
    # (Claude Code may use different field names depending on the event type)
    user_message = (
        input_data.get("user_prompt", "")
        or input_data.get("prompt", "")
        or input_data.get("content", "")
    )

    if not user_message:
        print(json.dumps({}))
        sys.exit(0)

    # Scan for domain keywords
    matched = extract_keywords(user_message, DOMAINS)

    if matched:
        reminder = build_reminder(matched, DOMAINS)
        if reminder:
            # Inject the reminder as a system message
            print(json.dumps({"systemMessage": reminder}))
            sys.exit(0)

    # No matches — no injection needed
    print(json.dumps({}))
    sys.exit(0)

if __name__ == "__main__":
    main()
```

### Step 5: Register the Hook

In your Claude Code settings (`.claude/settings.json` in your project directory), add the hook to the `UserPromptSubmit` event:

```json
{
  "hooks": {
    "UserPromptSubmit": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "python3 /path/to/your/twl_preload.py",
            "timeout": 3
          }
        ]
      }
    ]
  }
}
```

**Timeout:** 3 seconds is plenty. This script does string matching... it should finish in under 100 milliseconds. The timeout is a safety net, not a performance target.

**Multiple hooks:** You can chain multiple hooks on the same event. They run in order. Each can inject its own system message.

### Step 6: Test It

Send your agent a message that should trigger the hook:

```
You: "I need to update the database migration for the users table"
```

If your domain map includes "database" with keywords like "migration"... the hook should fire and inject a reminder to read your database documentation. You'll see the agent acknowledge and read the docs before proceeding.

If nothing happens, check:
1. Is the hook path correct and the file executable?
2. Is the `settings.json` in the right location? (`.claude/settings.json` in your project root)
3. Does the script run standalone? (`echo '{"user_prompt":"test database migration"}' | python3 your_hook.py`)

---

## The Three-Part Self-Annealing Framework

The hook alone solves 80% of the problem. But systems drift. New tools get added. Documentation gets created but never linked into the hook. Over time, the hook's keyword map falls out of sync with reality... and you're back to square one.

We solved this with a framework we call **the self-annealing triad:**

### Part 1: Enforcement (The Hook)

This is the preload hook described above. It makes compliance automatic. The agent doesn't choose to read the docs... the system ensures it happens.

**What it catches:** Known gotchas for known tools.
**What it misses:** New tools not yet added to the keyword map.

### Part 2: Detection (Drift Check)

A script that runs during our end-of-session review. It compares three sources of truth:

1. **Documentation files on disk** — What wisdom libraries actually exist?
2. **The hook's keyword map** — What does the hook know about?
3. **The main instructions file** — What tools are documented in our system prompt?

If a new documentation file exists on disk but isn't in the hook... drift detected. If the hook references a file that was deleted... drift detected.

Here's the concept (adapt the paths to your environment):

```python
import glob
import re

# 1. Find all wisdom/documentation files on disk
docs_on_disk = set(glob.glob("docs/*_patterns.md"))

# 2. Parse the hook script for referenced files
with open(".claude/hooks/twl_preload.py") as f:
    hook_content = f.read()
docs_in_hook = set(re.findall(r'"(docs/\w+_patterns\.md)"', hook_content))

# 3. Compare
missing_from_hook = docs_on_disk - docs_in_hook
orphaned_in_hook = docs_in_hook - docs_on_disk

if missing_from_hook:
    print("DRIFT: These docs exist but aren't in the hook:")
    for doc in sorted(missing_from_hook):
        print(f"  ADD -> {doc}")

if orphaned_in_hook:
    print("DRIFT: Hook references these deleted docs:")
    for doc in sorted(orphaned_in_hook):
        print(f"  REMOVE -> {doc}")

if not missing_from_hook and not orphaned_in_hook:
    print("Hook is in sync with documentation on disk.")
```

### Part 3: Remediation (Session Wrap-Up Step)

The drift check doesn't run by itself. It's embedded in our end-of-session routine... a structured checklist the agent runs after completing significant work.

The relevant step says: *"Run the drift detection script. If drift is detected, update the hook's keyword map before committing."*

This closes the loop. New documentation → drift detected at session end → hook updated → next session's agent automatically reads it.

```
New tool added → TWL written → Drift check at session end
        ↑                              │
        │          Hook updated ←──────┘
        │                │
        └── Next session: agent reads the new TWL automatically
```

**The principle:** Self-annealing systems need all three parts. Enforcement without detection decays over time. Detection without remediation just generates warnings nobody acts on. Remediation without enforcement means you're back to voluntary compliance.

---

## Why This Works (And What We Learned)

### It's boring. That's the point.

There's no machine learning in this solution. No embeddings. No retrieval-augmented generation. No vector database. Just a dictionary, some regex, and a system message.

We could have built something fancier. Semantic similarity matching on the user's message. An embedding-based retrieval system that finds the most relevant documentation. A secondary AI agent that decides what the primary agent should read.

We didn't. Because every layer of complexity is another thing that can break... and the whole point was to reduce the number of things that break. A keyword match either fires or it doesn't. You can debug it with `echo` and `grep`. You can understand the entire system by reading one file.

### The false positive rate is nearly zero.

If someone mentions "supabase" in their message, they're about to work with Supabase. The keyword-to-domain mapping is tight enough that false triggers are rare. And when they do happen... the worst case is the agent reads documentation it didn't need. That's a 30-second cost. The alternative (not reading documentation it DID need) is a 30-minute cost.

### It changed how we think about agent preparation.

Before the hook, we thought about documentation as a resource the agent *could* use. After the hook, we think about documentation as a pre-flight checklist the agent *must* complete. The shift from "available" to "automatic" is the entire insight.

### The compound math works in reverse too.

Every gotcha the hook prevents is a step that doesn't fail. If the hook prevents one mistake per five-step task, you go from 59% to 66% success rate (at 90% base accuracy). Prevent two mistakes? 73%. The math compounds in your favor when you eliminate known failure modes.

---

## The "Start Here" Prompt

If you want to build this for your own environment, give your Claude Code agent this prompt:

```
I want to build a "preload hook" for Claude Code that automatically reminds 
you to read relevant documentation before starting work on specific tools 
or domains.

Here's the concept:
- A Python script registered as a UserPromptSubmit hook in .claude/settings.json
- It scans my message for keywords related to tools in our stack
- When it finds matches, it injects a system message listing which documentation 
  files you should read before proceeding
- The system message includes a one-line summary of WHY each file matters 
  (the key gotcha or critical pattern)

Here's what I need you to do:

1. Ask me which tools/domains I work with regularly
2. For each one, ask me:
   - What keywords indicate I'm about to work with this tool?
   - Which documentation files should you read first?
   - What's the #1 gotcha or pattern that documentation captures?
3. Build the hook script with a DOMAINS dictionary mapping keywords → files
4. Register it in .claude/settings.json under UserPromptSubmit
5. Test it by having me send a message that should trigger it

Also build a drift detection script I can run periodically to make sure 
the hook's keyword map stays in sync with documentation files on disk.

The hook must:
- Read JSON from stdin, write JSON to stdout
- Always exit 0 (never block the user's message)
- Complete in under 3 seconds
- Handle missing or malformed input gracefully
```

Copy that. Paste it into a new Claude Code session. Your agent will interview you about your tools and build the whole thing.

---

## About This Series

**Built from Broken** is published by the [Quietly Working Foundation](https://quietlyworking.org) (QWF), a 501(c)(3) nonprofit. Our mission is to serve youth 30 and younger... helping them discover purpose, build skills, and create legacy. We do this through product-based fundraising programs and student training.

We run a nonprofit almost entirely on AI agent infrastructure. Our backoffice is an Obsidian vault orchestrated by Claude Code (Anthropic's CLI-based AI coding agent), built on a three-layer architecture... Directives (what to do), Orchestration (the AI agent making decisions), and Execution (deterministic Python scripts doing the work). We build tools, we break things, we fix them... and then we write down what happened so you don't have to learn it the hard way.

**The name:** "Built from Broken" comes from a core belief... that brokenness isn't something to hide. It's proof of what's possible. Every solution in this series exists because something failed. We show the scars, not to complain, but because someone else is hitting the same wall right now... and the fastest way through is knowing they're not alone.

---

*Built from Broken, Vol. 1 — Published April 2026*
*Quietly Working Foundation | quietlyworking.org*
*Written by Chaplain TIG with Claude (Anthropic)*