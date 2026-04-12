---
title: "Built from Broken: Vol. 3"
slug: "when-your-ai-agent-hallucinates-calendar-facts"
pillar: "built-from-broken"
description: "At the Quietly Working Foundation (QWF), we run a nonprofit almost entirely on AI agent infrastructure. Our backoffice is an Obsidian vault orchestrated by Clau"
publishDate: "2026-04-12"
tags: ["QWF", "QWU", "built-from-broken", "ai-agent", "claude-code", "hooks", "date-validation", "hallucination"]
series: "Built from Broken"
volume: 3
isHome: false
---
# Built from Broken: Vol. 3
## When Your AI Agent Hallucinates Calendar Facts

> *Built from Broken is a series from the Quietly Working Foundation about real problems we face running AI-powered nonprofit operations... and the real solutions we build. Every fix exists because something failed first. We show the receipts.*

---

## The Series

At the Quietly Working Foundation (QWF), we run a nonprofit almost entirely on AI agent infrastructure. Our backoffice is an Obsidian vault orchestrated by Claude Code (Anthropic's CLI-based AI coding agent). We have a three-layer architecture... Directives (what to do), Orchestration (the AI agent making decisions), and Execution (deterministic Python scripts doing the work).

We build tools. We break things. We fix them. Then we write down what happened so you don't have to learn it the hard way.

This is Volume 3.

---

## The Math That Erodes Trust

Small factual errors are worse than big failures.

That sounds backwards. But think about it. A big failure... a crashed server, a broken deployment, a total outage... that's visible. Alarming. It gets fixed because everyone notices. A wrong day-of-week in an email? That's the kind of error the recipient notices, questions your competence over, and never mentions to you.

Let's do the math on an AI agent that composes emails with dates:

| Emails/Week | Hallucination Rate | Wrong Dates/Year | Trust Impact |
|:-----------:|:------------------:|:----------------:|:------------:|
| 10 | 5% | 26 | Noticeable pattern |
| 20 | 5% | 52 | One per week |
| 20 | 10% | 104 | Two per week |
| 50 | 5% | 130 | Reputation damage |

At 20 emails per week with a 5% hallucination rate, you're sending one factually incorrect email every single week. Fifty-two trust-eroding errors per year. Each one small enough to dismiss individually. Together? A pattern that makes people stop trusting your communications.

The scary part: the agent doesn't know it's wrong. It had the correct date. It just fabricated the day name. And it does this with complete confidence.

---

## The Problem: Correct Data, Fabricated Context

### What Happened

Spring 2026. Our agent was composing a follow-up email to a chapter member after a networking meeting. Standard stuff... summarize the conversation, reference the meeting date, include next steps.

The email contained a date with the wrong day-of-week name attached to it. The agent claimed the meeting happened on a certain weekday. But the actual date in the email fell on a completely different day. It had the date right. It fabricated which day of the week that date falls on.

And it wrote that fabrication into an email addressed to a real person who attended that meeting and knows exactly what day it was.

This isn't a knowledge gap. The agent didn't lack information. It had the date right there in the sentence. It just... made up the day name. Like a student who shows their work correctly on a math problem and then writes the wrong answer at the bottom.

### Why This Is a Different Beast

In Vol. 1, we solved the problem of agents not reading documentation. That was an INPUT problem... the agent wasn't loading the right knowledge before doing work. We fixed it with a `UserPromptSubmit` hook that injects reading reminders.

This is an OUTPUT problem. The agent has all the information it needs. The failure happens when it generates text... when it writes something into the world.

And that distinction matters, because the obvious fixes all target the wrong layer.

### Why Obvious Fixes Don't Work

**Approach 1: Add a memory rule.**

We could add "always verify day-of-week names against actual calendar data" to our agent's instructions. But we learned in Vol. 1 that voluntary compliance doesn't scale. Memory rules are suggestions. Under complex multi-step tasks, agents optimize for the primary objective and skip meta-instructions about self-checking. The same pattern, different symptom.

**Approach 2: Use the datetime utility.**

We already have a utility script that returns the correct current date and time in Pacific timezone. It solves the question "what day is it right now?" But this agent didn't get the current date wrong. It got a date IN THE PAST right and then attached the wrong day name to it. The utility solves INPUT (what's today's date?), not OUTPUT (is the day name I just wrote correct?).

**Approach 3: Post-send review.**

We could have the agent review its emails before sending. But the agent wrote the wrong day name with full confidence. Asking it to review its own output is asking it to catch an error it doesn't know it made. It's like proofreading your own typos... the brain fills in what it expects to see.

The core insight from Vol. 1 applies here, but at a different layer: **deterministic enforcement beats probabilistic rules.** Don't ask the agent to check itself. Build a guardrail it can't bypass.

---

## The Solution: Validate Output, Not Just Input

### The Evolution

Vol. 1's hook validates what the agent READS. It fires on `UserPromptSubmit`... before the agent starts working... and injects documentation reminders. Preparation enforcement.

This solution validates what the agent WRITES. It fires on `PreToolUse`... before the agent saves a file, sends a command, or edits content... and blocks the action if it contains a verifiable factual error. Output validation.

Together they form bookends. One ensures the agent starts with the right knowledge. The other ensures it doesn't ship wrong facts. The system is self-annealing at the architectural level.

### What We Built

A `PreToolUse` hook that intercepts Bash commands, file writes, and file edits. Before the tool executes, the hook:

1. Scans the tool's input content for day-of-week names near recognizable dates
2. Parses dates in three formats: text ("June 11th, 2026"), ISO ("2026-06-11"), and US ("06/11/2026")
3. Computes the actual calendar day using Python's `datetime` module
4. If mismatch: **blocks the tool call** with a specific error message telling the agent what the correct day is
5. Uses a 200-character proximity threshold... the day name and date must appear near each other to trigger validation (avoids false positives across paragraphs)
6. Exempts scratch directories so test files and hook development don't trigger false blocks

### The Before and After

**BEFORE (without hook):**
```
9:00  Agent: composes follow-up email referencing a meeting date
9:01  Agent: writes the wrong day-of-week name next to the correct date
9:01  Agent: creates Outlook draft via Graph API
9:02  Agent: "Draft created. Ready to review."
9:03  You: review the draft, notice the day name is wrong
9:04  You: "That's not the right day of the week"
9:05  Agent: "You're right, fixing that..."
9:06  Agent: patches the draft

Total: 6 minutes + your attention + your trust taking a small hit.
What if you didn't catch it? Sent to a real person with wrong info.
```

**AFTER (with hook):**
```
9:00  Agent: composes follow-up email referencing a meeting date
9:01  Agent: writes the wrong day-of-week name next to the correct date
9:01  [Hook fires, blocks the write]
9:01  Hook: "BLOCKED: Day name doesn't match calendar. The date is
       actually [correct day]. Fix before proceeding."
9:02  Agent: corrects to the right day name
9:02  Agent: creates Outlook draft
9:03  Agent: "Draft created. Ready to review."

Total: 3 minutes. Correct on arrival. Zero trust erosion.
```

### The Architecture

```
+--------------------------------------------------+
|  Agent writes: email content with a day name      |
|  paired with a calendar date                      |
+-------------------------+------------------------+
                          |
                          v
+--------------------------------------------------+
|  TOOL CALL: Write file / Edit file / Bash         |
|  (content includes day-of-week + date)            |
+-------------------------+------------------------+
                          |
                          v
+--------------------------------------------------+
|  HOOK: PreToolUse -- Date Validator               |
|                                                   |
|  1. Scan content for day names + date patterns    |
|  2. Day name found near a parseable date          |
|  3. Parse date into Python datetime object        |
|  4. Compute actual day: strftime("%A")            |
|  5. Compare claimed day vs actual day             |
|  6. MISMATCH? Block with error. MATCH? Allow.     |
+-------------------------+------------------------+
                          |
              +-----------+-----------+
              v                       v
+-------------------+   +-----------------------------+
|  MATCH: Exit 0    |   |  MISMATCH: Exit 1 (BLOCK)   |
|  Tool proceeds    |   |  Error: "Date X is actually  |
|                   |   |  [correct day]. Fix the day  |
|                   |   |  name before proceeding."    |
+-------------------+   +-----------------------------+
```

---

## How to Build Your Own

### Step 1: Define the Date Patterns

You need to catch dates in multiple formats. People (and agents) write dates differently depending on context.

```python
import re

# Day names to match (case-insensitive)
DAY_NAMES = [
    "monday", "tuesday", "wednesday", "thursday",
    "friday", "saturday", "sunday"
]

# Month names for text-format dates
MONTH_NAMES = {
    "january": 1, "february": 2, "march": 3, "april": 4,
    "may": 5, "june": 6, "july": 7, "august": 8,
    "september": 9, "october": 10, "november": 11, "december": 12
}

# Three date patterns to catch:
# 1. Text: "June 11th, 2026" or "June 11, 2026"
TEXT_DATE = re.compile(
    r'(?P<month>' + '|'.join(MONTH_NAMES.keys()) + r')\s+'
    r'(?P<day>\d{1,2})(?:st|nd|rd|th)?,?\s+'
    r'(?P<year>\d{4})',
    re.IGNORECASE
)

# 2. ISO: "2026-06-11"
ISO_DATE = re.compile(r'(?P<year>\d{4})-(?P<month>\d{2})-(?P<day>\d{2})')

# 3. US: "06/11/2026"
US_DATE = re.compile(r'(?P<month>\d{2})/(?P<day>\d{2})/(?P<year>\d{4})')
```

**Why three formats?** Agents are unpredictable about date formatting. The same agent might write "June 11th, 2026" in an email and "2026-06-11" in a filename in the same session. Catch them all.

### Step 2: Build the Proximity Matcher

A day name and a date appearing in the same document don't necessarily refer to each other. The day name needs to be *near* the date to trigger validation.

```python
PROXIMITY_THRESHOLD = 200  # characters

def find_day_date_pairs(text):
    """Find day-of-week names that appear near parseable dates."""
    pairs = []
    text_lower = text.lower()

    # Find all day name positions
    day_positions = []
    for day in DAY_NAMES:
        for match in re.finditer(r'\b' + day + r'\b', text_lower):
            day_positions.append((day, match.start(), match.end()))

    # Find all date positions
    date_matches = []
    for pattern in [TEXT_DATE, ISO_DATE, US_DATE]:
        for match in pattern.finditer(text_lower if pattern == TEXT_DATE
                                      else text):
            date_matches.append(match)

    # Check proximity
    for day_name, day_start, day_end in day_positions:
        for date_match in date_matches:
            date_start = date_match.start()
            date_end = date_match.end()

            # Calculate distance between closest edges
            if day_end <= date_start:
                distance = date_start - day_end
            elif date_end <= day_start:
                distance = day_start - date_end
            else:
                distance = 0  # overlapping

            if distance <= PROXIMITY_THRESHOLD:
                pairs.append({
                    "day_name": day_name,
                    "date_match": date_match,
                    "distance": distance,
                })

    return pairs
```

**Why 200 characters?** It's roughly two sentences. Close enough that a day name and date are likely referring to the same event. Far enough apart to catch common patterns like "our Thursday, June 11th, 2026 meeting" or "June 11th, 2026 (last Thursday)."

### Step 3: Parse and Validate

For each day-date pair, parse the date into a Python `datetime` object and check whether the claimed day name matches reality.

```python
from datetime import date

def parse_date_from_match(match):
    """Extract a date object from a regex match."""
    groups = match.groupdict()

    # Handle text month names
    month = groups.get("month", "")
    if month.isdigit():
        month_num = int(month)
    else:
        month_num = MONTH_NAMES.get(month.lower())
        if not month_num:
            return None

    try:
        return date(
            int(groups["year"]),
            month_num,
            int(groups["day"])
        )
    except (ValueError, KeyError):
        return None


def validate_pairs(pairs):
    """Check each day-date pair for mismatches. Return list of errors."""
    errors = []

    for pair in pairs:
        parsed = parse_date_from_match(pair["date_match"])
        if not parsed:
            continue

        actual_day = parsed.strftime("%A").lower()
        claimed_day = pair["day_name"].lower()

        if actual_day != claimed_day:
            errors.append({
                "claimed": pair["day_name"].title(),
                "actual": actual_day.title(),
                "date": parsed.strftime("%B %d, %Y"),
                "matched_text": pair["date_match"].group(0),
            })

    return errors
```

### Step 4: Wire It Up as a PreToolUse Hook

The hook intercepts tool calls before they execute. If date validation fails, it returns a non-zero exit code to block the action.

```python
import json
import sys

# Paths where validation should be skipped
# (scratch files, hook development, temp directories)
EXEMPT_PATHS = [".tmp/", "/tmp/", ".claude/hooks/"]


def is_exempt(file_path):
    """Check if a file path is in an exempt directory."""
    if not file_path:
        return False
    return any(exempt in file_path for exempt in EXEMPT_PATHS)


def extract_content_and_path(input_data):
    """Pull the text content and file path from the tool input."""
    tool_name = input_data.get("tool_name", "")
    tool_input = input_data.get("tool_input", {})

    if tool_name == "Bash":
        return tool_input.get("command", ""), None
    elif tool_name == "Write":
        return tool_input.get("content", ""), tool_input.get("file_path")
    elif tool_name == "Edit":
        return tool_input.get("new_string", ""), tool_input.get("file_path")
    return "", None


def main():
    try:
        input_data = json.load(sys.stdin)
    except (json.JSONDecodeError, EOFError):
        # Safe default: allow the tool call
        print(json.dumps({}))
        sys.exit(0)

    content, file_path = extract_content_and_path(input_data)

    # Skip exempt paths
    if is_exempt(file_path):
        print(json.dumps({}))
        sys.exit(0)

    # Skip if no content to validate
    if not content or len(content) < 10:
        print(json.dumps({}))
        sys.exit(0)

    # Find and validate day-date pairs
    pairs = find_day_date_pairs(content)
    if not pairs:
        print(json.dumps({}))
        sys.exit(0)

    errors = validate_pairs(pairs)
    if not errors:
        print(json.dumps({}))
        sys.exit(0)

    # Build error message and BLOCK the tool call
    messages = []
    for err in errors:
        messages.append(
            f"'{err['claimed']}, {err['date']}' is incorrect. "
            f"{err['date']} is actually {err['actual']}. "
            f"Fix the day name before proceeding."
        )

    error_text = "DATE VALIDATION FAILED:\n" + "\n".join(messages)
    print(json.dumps({"error": error_text}))
    sys.exit(1)  # Non-zero = block the tool call


if __name__ == "__main__":
    main()
```

**Key design decisions:**

- **Exit 1 blocks the tool call.** Unlike the Vol. 1 hook (which injects a reminder and exits 0), this hook *prevents* the action. A wrong date in an email is worse than a delayed email. Blocking is the right call.
- **Exempt paths are essential.** Without them, the hook catches test data, scratch files, and even its own development. We learned this the hard way (more on that below).
- **The error message tells the agent the correct day.** Don't just say "wrong"... say what's right. The agent fixes it in one pass instead of guessing.

### Step 5: Register the Hook

In your Claude Code settings (`.claude/settings.json`):

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "python3 .claude/hooks/date_validator.py",
            "timeout": 3
          }
        ]
      }
    ]
  }
}
```

**Performance:** The hook scans text with regex and does basic datetime arithmetic. It finishes in under 100 milliseconds. The 3-second timeout is a safety net.

**Coexistence with other hooks:** This hook runs on `PreToolUse`. The Vol. 1 hook runs on `UserPromptSubmit`. They don't interfere. You can (and should) run both.

### Step 6: Test It

Build a test suite in an exempt directory (like `.tmp/tests/`) with cases covering:

- **Correct pairs:** A date with its actual day-of-week name (e.g., a date you've verified falls on a specific day, paired with that correct day name). Should pass through.
- **Incorrect pairs:** A date paired with a day name that doesn't match the calendar. Should block.
- **All three formats:** Text dates, ISO dates, US-format dates... each with correct and incorrect day names.
- **Day names alone:** Just "we met on a certain weekday" with no parseable date nearby. Should pass.
- **Dates alone:** Just a bare date with no day-of-week claim. Should pass.
- **Proximity edge cases:** A day name in one paragraph and a date three paragraphs later. Should pass (too far apart to trigger).
- **Exempt paths:** Writes to `.tmp/` should pass even with mismatched data.

**Important:** Use `python3 -c "from datetime import date; print(date(Y,M,D).strftime('%A'))"` to verify your test data before writing it. Don't trust your own memory of what day a date falls on. We didn't... and the hook caught us. More on that below.

---

## The Framework: The Output Validation Principle

The transferable insight:

**Don't add rules for agents to follow. Build guardrails they can't bypass. And validate OUTPUT, not just INPUT.**

Most agent reliability work focuses on preparation... better prompts, better context, better documentation loading. That's necessary. But it only covers half the failure surface. The other half is what the agent generates. And generated output can contain fabricated facts even when the input was perfect.

Three rules make this concrete:

### Rule 1: If It's Verifiable, Verify It

A day-of-week name paired with a calendar date is a checkable fact. It's either right or wrong. There's no ambiguity, no judgment call, no context needed. When a fact in generated output is deterministically verifiable... verify it deterministically. Don't ask the agent to self-check.

### Rule 2: Block, Don't Warn

Vol. 1's hook injects a reminder (soft enforcement). This hook blocks the action (hard enforcement). The difference: a wrong date in a sent email can't be unsent. When the cost of the error is external... when it reaches a real person... blocking is appropriate. Save the soft enforcement for preparation steps where the cost of getting it wrong is just wasted time.

### Rule 3: Validate at the Boundary

The best place to catch output errors is at the boundary between the agent and the outside world. For Claude Code, that boundary is tool calls... the moment the agent tries to write a file, send a command, or edit content. `PreToolUse` hooks sit exactly at that boundary. They're the last gate before generated text becomes committed reality.

**The evolution from Vol. 1:**

| | Vol. 1 Hook | Vol. 3 Hook |
|---|---|---|
| **Event** | UserPromptSubmit | PreToolUse |
| **Validates** | Input (what the agent reads) | Output (what the agent writes) |
| **Action** | Inject reminder (exit 0) | Block tool call (exit 1) |
| **Catches** | Knowledge gaps | Fabricated facts |
| **Together** | Preparation enforcement + output validation |

Two hooks. Two layers. The system gets stronger with each one.

---

## What We Learned

### The hook caught us hallucinating while building it.

This is the part that still makes me laugh.

We wrote a test suite. Sixteen test cases covering all three date formats, proximity thresholds, edge cases, the works. One test case asserted that a certain 2026 date fell on one day of the week. The hook blocked it. We checked the calendar. The date actually fell on a different day entirely.

The hook was right. We were wrong. The tool we built to catch AI hallucinations caught a *human* hallucination in the test data. That's... honestly the best possible endorsement of the approach. If the people building the validator can't get day names right, the agent definitely can't.

### The bootstrapping problem is real.

Our first version of the test suite ran tests through the Bash tool... which meant the hook intercepted the test commands themselves. The tests contained intentional mismatched data (day names paired with dates they don't belong to), and the hook faithfully blocked every test that included a mismatch.

The hook was working perfectly. It was just working too well to let us test it.

Solution: exempt paths. The `.tmp/` and `.claude/hooks/` directories are excluded from validation. Test data lives there. Hook development happens there. The hook protects everything else.

And yes... when writing *this very article*, the hook blocked multiple drafts because the examples and narrative contained day-date combinations that triggered validation. The hook doesn't care about your intent. It cares about calendar math. We had to restructure the article multiple times to avoid placing day-of-week names near parseable dates in illustrative contexts. The tool is relentless. That's the point.

### Small errors compound into credibility damage.

A wrong day name in one email is forgettable. A wrong day name twice in a month starts a pattern. Three times in a quarter and people start double-checking everything you send. The damage isn't in any single error... it's in the erosion of default trust.

This is especially true for AI-generated communications. People are already primed to look for AI mistakes. A fabricated day-of-week confirms their suspicion that "the AI is writing these" and downgrades everything from that source. One wrong weekday can undo months of reliable communication.

### Output validation is an underexplored space.

Almost all AI agent tooling focuses on input: better prompts, retrieval-augmented generation, few-shot examples, context windows. The output side... verifying what the agent produces before it ships... is strangely neglected. But that's where the stakes are highest. Input mistakes waste the agent's time. Output mistakes waste everyone else's trust.

### Test results.

16 out of 16 test cases passed. The hook correctly:
- Catches mismatched day names in text-format dates
- Catches mismatches in ISO-format dates
- Catches mismatches in US-format dates
- Allows correct day-date pairs through
- Ignores day names without nearby dates
- Ignores dates without nearby day names
- Respects the proximity threshold (no false positives across paragraphs)
- Passes exempt paths without validation

Zero false positives in production usage since deployment.

---

## The "Start Here" Prompt

If you want to build date output validation for your own agent, give it this prompt:

```
I want to build a "date validator" hook for Claude Code that catches 
hallucinated day-of-week names before they reach output files or emails.

The problem: AI agents sometimes pair dates with the wrong day-of-week 
name. They have the date right but fabricate the day name. I need a 
PreToolUse hook that catches this at the boundary, before any tool 
writes the bad data.

Build me:

1. A Python script registered as a PreToolUse hook that intercepts 
   Bash, Write, and Edit tool calls
2. It should scan the tool input content for day-of-week names 
   appearing near recognizable dates
3. Support three date formats:
   - Text: "June 11th, 2026" or "June 11, 2026"
   - ISO: "2026-06-11"
   - US: "06/11/2026"
4. Use proximity matching (200 characters) so a day name and date 
   must be near each other to trigger validation
5. If a mismatch is found: BLOCK the tool call (exit code 1) with 
   an error message that tells me what the correct day is
6. Exempt certain directories from validation (like .tmp/ and 
   .claude/hooks/) so test data and hook development don't trigger 
   false blocks

The hook must:
- Read JSON from stdin, write JSON to stdout
- Exit 0 to allow, exit 1 to block
- Complete in under 100ms (just regex + datetime math)
- Handle missing or malformed input gracefully
- Never block if it can't parse (fail-open for unparseable content, 
  fail-closed only for verifiable mismatches)

Also build a test suite with at least 12 cases covering:
- All three date formats (good and bad)
- Proximity threshold (near vs far day-date pairs)
- Day names without dates and dates without day names
- Exempt path behavior

IMPORTANT: Put the test data in an exempt directory so the hook 
doesn't block the tests themselves. And verify every test date 
with datetime before writing it... don't trust your memory of 
what day a date falls on.
```

Copy that. Paste it. Your agent builds the guardrail.

---

## What's Next

This volume and Vol. 1 form two halves of a pattern: validate what the agent reads, validate what the agent writes. Future volumes will explore:

- **How we prevent agents from making risky changes** to systems they don't own (The Guest Principle)
- **How we handle agent memory across sessions** when the agent starts fresh every time (Persistent Intelligence Architecture)
- **How we test AI scripts without burning paid API credits** (The Cheapskate Testing Protocol)

Each volume: the math, the problem, the real incidents, the solution, the blueprint, and the prompt to build it yourself.

---

## About This Series

**Built from Broken** is published by the [Quietly Working Foundation](https://quietlyworking.org) (QWF), a 501(c)(3) nonprofit. Our mission is to serve youth 30 and younger... helping them discover purpose, build skills, and create legacy. We do this through product-based fundraising programs and student training.

This volume grew from a single wrong day name in a single email... the kind of error most people would fix and forget. We didn't forget. We built a hook that makes it impossible for the error to reach output, and in the process discovered that the humans building the fix couldn't get day names right either. Brokenness isn't limited to AI. Neither are the solutions.

**The name:** "Built from Broken" comes from a core belief... that brokenness isn't something to hide. It's proof of what's possible. Every solution in this series exists because something failed. We show the scars, not to complain, but because someone else is hitting the same wall right now... and the fastest way through is knowing they're not alone.

---

*Built from Broken, Vol. 3 — Published April 2026*
*Quietly Working Foundation | quietlyworking.org*
*Written by Chaplain TIG with Claude (Anthropic)*