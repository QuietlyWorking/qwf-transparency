---
title: "Built from Broken: Vol. 2"
slug: "when-your-documentation-rots-faster"
pillar: "built-from-broken"
description: "Your runbooks describe what should exist... not what does. How we turned documentation into a deployment artifact so it can't drift from reality."
publishDate: "2026-04-11"
tags: ["QWF", "QWU", "built-from-broken", "ai-agent", "claude-code", "documentation", "deployment", "drift-detection"]
series: "Built from Broken"
volume: 2
hook: "8 fixes in 6 weeks. Same pipeline. Every fix built on documentation that was already wrong."
isHome: false
---
# Built from Broken: Vol. 2
## When Your Documentation Rots Faster Than You Can Write It

> *Built from Broken is a series from the Quietly Working Foundation about real problems we face running AI-powered nonprofit operations... and the real solutions we build. Every fix exists because something failed first. We show the receipts.*

---

## The Problem: Vision Masquerading as Reality

We updated one of our core processing pipelines 8 times in 6 weeks. Each update was a fix. Each fix was responding to a failure. And each failure existed because the documentation from the previous fix didn't match what was actually deployed. Four different failures, same root cause every time... **the documentation described what we intended to build, not what we actually built.**

That's documentation drift. And it doesn't just waste time... it compounds. Each agent session that reads stale instructions builds on a lie. The more sessions that pass, the further reality drifts from the map.

### What We Built (Before It Broke)

We use Markdown-based directives as our standard operating procedures. Every major system... meeting processing, email workflows, cost tracking, deployment pipelines... has a directive file that describes:

- What the system does
- What scripts to run and in what order
- What the expected outputs are
- What can go wrong and how to handle it

Think of them as runbooks for AI agents. The agent reads the directive, follows the steps, calls the scripts. Simple and reliable... as long as the directive matches reality.

### How It Broke

The moment you deploy something, the documentation is already stale. Not because anyone was careless. Because deployment changes things in ways that are hard to predict, and the urgency of "it's live" always beats the discipline of "update the docs."

Here are three real incidents.

**Incident 1: The 11-Day Ghost Meeting**

We have a Zoom meeting processing pipeline. Recording comes in via webhook, gets transcribed, analyzed, and routed to the right project files. The directive said: "Webhook receives recording, processes automatically. Daily reconciliation at 9 PM catches anything the webhook missed."

That's what we intended.

What actually happened: the webhook workflow went inactive after a routine server restart. Nobody noticed because the directive said reconciliation was the safety net. But reconciliation had its own problem... it permanently skipped any meeting where the transcript wasn't ready yet. "Not ready yet" and "will never exist" got the same terminal status.

A supporter's meeting sat unprocessed for 11 days. Five meetings total vanished in that window. The directive described a system with two layers of protection. Reality had zero.

**Incident 2: The Silent Budget Alert**

We built a budget monitoring script that checks daily infrastructure costs against thresholds. The directive said: "Budget alerts run daily via cron at 7 AM Pacific."

The script was written on February 16th. The cron job wasn't scheduled until February 28th... twelve days later. During those twelve days, we resized a VM and added storage. The monthly infrastructure cost jumped from $150 to $200. The old alert thresholds were permanently breached. Alerts were dead code.

The directive described a living system. Reality was a script sitting on disk, doing nothing, for almost two weeks. When we finally found it, four different scripts across the codebase still had hardcoded cost values... each one slightly different from the others.

**Incident 3: The "Active" Workflow That Wasn't**

Our automation platform changed its activation model. Setting a workflow to `active = true` in the database used to work. After an update, you had to use the `publish` CLI command instead. The old method still showed the workflow as "active" in the dashboard... but scheduled triggers never fired.

Our deployment directive still recommended the old method. It even had a note that said "NOT activate... see the tool documentation." But the actual code examples in the directive used the old API. One line said "don't do this" while the next line showed you how to do exactly that.

Result: workflows deployed with confidence, showing green in every dashboard, silently doing nothing.

### Why "Just Update the Docs" Doesn't Work

Same playbook as Volume 1. We tried the obvious solutions.

**Approach 1: "Remember to update the directive after deploying."**

This is the "be more disciplined" approach. It works when you remember. You don't remember when you're three hours into a deployment at 11 PM, the system finally works, and the only thing standing between you and sleep is a Markdown file that feels optional.

Result: Documentation updated ~60% of the time. The other 40% drifted silently.

**Approach 2: "The agent should check if docs are current."**

We told the agent to verify directive accuracy after deployments. The problem: how does an agent know the docs are wrong? It reads the directive, sees a confident description of how the system works, and trusts it. Stale documentation doesn't announce itself. A directive that says "cron job runs at 7 AM" reads identically whether the cron job exists or not.

Result: The agent trusted the docs. The docs were wrong. The agent built on top of wrong.

**Approach 3: "Periodic audits will catch it."**

We ran system audits. They compared directives to actual scripts on disk. But audits only catch structural drift... missing scripts, renamed files, orphaned references. They can't detect *semantic* drift. A directive that says "this script runs on cron" when the cron entry doesn't exist is invisible to a file comparison.

The core insight: **documentation that's separate from deployment is documentation that rots.** The gap between "I deployed it" and "I documented it" is where drift lives. You can't discipline your way out of it. You have to eliminate the gap.

---

## The Solution: Documentation as a Deployment Artifact

### What We Built

Three interconnected systems that treat documentation updates as a required step in the deployment pipeline... not a nice-to-have that follows later.

### The Before and After

**BEFORE (documentation as afterthought):**
```
Day 1:   Deploy new script. It works. Close the laptop.
Day 2:   Start next task. Forget to update the directive.
Day 14:  Agent reads stale directive. Follows wrong steps.
Day 14:  Debug for 90 minutes. Discover the directive is outdated.
Day 14:  Fix the directive. Fix the code. Commit.
Day 15:  Different agent. Same stale directive. Different section.
```

**AFTER (documentation as deployment artifact):**
```
Day 1:   Deploy new script.
Day 1:   Post-deploy checklist fires. Directive updated in same commit.
Day 1:   Implementation Status table shows ✅ Built with URL.
Day 14:  Agent reads accurate directive. Follows correct steps. Done.
Day 30:  Drift audit confirms directive matches reality. No gaps.
```

### The Architecture

```
┌─────────────────────────────────────────────────────┐
│  LAYER 1: POST-DEPLOYMENT CHECKLIST                 │
│  (runs immediately after every deployment)           │
│                                                     │
│  ✓ Update changelog with what was built + when       │
│  ✓ Document URLs/locations for hosted services       │
│  ✓ Update script names if they differ from directive │
│  ✓ Replace hardcoded values with dynamic reads       │
│  ✓ Mark features as ✅ Built or ⏳ Planned           │
└─────────────────────┬───────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────┐
│  LAYER 2: STRUCTURED TRUTH TABLES                   │
│  (mandatory sections in every system directive)      │
│                                                     │
│  Implementation Status:                              │
│  | Feature    | Status   | Location    | Notes |    │
│  |------------|----------|-------------|-------|    │
│  | Webhook    | ✅ Built | workflow.py | v2.1  |    │
│  | Retry      | ⏳ Plan  | —           | Q2    |    │
│                                                     │
│  Deployment:                                         │
│  | Environment | URL                  | Update |    │
│  |-------------|----------------------|--------|    │
│  | Production  | https://your-app.com | CI/CD  |    │
└─────────────────────┬───────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────┐
│  LAYER 3: DRIFT DETECTION                           │
│  (automated comparison: docs vs reality)             │
│                                                     │
│  Audit script compares:                              │
│  • Script names in directive → files on disk         │
│  • URLs in directive → live endpoints                │
│  • Cost figures in docs → actual cloud spend         │
│  • "✅ Built" claims → code that actually exists     │
│                                                     │
│  Divergence > threshold → flag as high-severity gap  │
└─────────────────────────────────────────────────────┘
```

---

## How to Build Your Own

### Step 1: Add a Post-Deployment Checklist to Your Workflow

This is the simplest and highest-impact change. After any deployment... script, workflow, hosted service... run through these five checks before you close the ticket:

```markdown
## Post-Deployment Checklist

- [ ] Directive changelog updated with: what was built, when, version number
- [ ] If hosted: URL/location documented in Deployment table
- [ ] If script name differs from directive reference: directive updated (not vice versa)
- [ ] If values are hardcoded anywhere: replaced with config/constants or updated to current
- [ ] Features marked as ✅ Built (with location) or ⏳ Planned (with timeline)
```

The key insight: **the directive updates must happen in the same commit as the code changes.** Not "later." Not "in the next PR." Same commit. Same moment. If it's not convenient, that's the point... it should be slightly inconvenient to deploy without documenting, because the alternative (weeks of silent drift) is far worse.

If you're using an AI agent, add this checklist directly to your system prompt or instructions file. The agent should treat "update the directive" as step N+1 of any deployment... not as a separate task it might get to eventually.

### Step 2: Add Implementation Status Tables to Your Directives

Every directive that describes a buildable system needs two tables: what's built and where it lives.

```markdown
## Implementation Status

| Feature | Status | Location | Notes |
|---------|--------|----------|-------|
| Webhook listener | ✅ Built | scripts/webhook_handler.py | v2.1.0 |
| Daily reconciliation | ✅ Built | cron: 0 21 * * * | 7-day lookback |
| Health monitoring | ✅ Built | scripts/health_check.py | Every 4 hours |
| Retry with backoff | ⏳ Planned | — | Blocked on API rate limit research |
| Analytics dashboard | ⏳ Planned | — | Q2 2026 |

## Deployment

| Environment | URL | Update Process |
|-------------|-----|----------------|
| Production | https://your-app.com | Push to main → auto-deploy |
| Staging | https://staging.your-app.com | Push to staging branch |
| Local dev | localhost:8765 | python scripts/dev_server.py |
```

**Why tables, not prose?** Prose drifts invisibly. "The webhook processes recordings and sends them through the pipeline" reads the same whether the webhook is active or crashed. A table with a status column, a location, and a version number forces specificity. The `✅` or `⏳` is a claim you can verify.

**The anti-pattern this prevents:** "Vision-as-documentation." That's when directives describe what the system *should* do instead of what it *does* do. Audits generate false positives. New agent sessions make wrong assumptions. The system becomes untrustworthy. Tables with explicit status columns make the gap between vision and reality visible.

### Step 3: Add Structured Changelogs with Root Cause Analysis

Most changelogs are useless. "Updated script" tells you nothing. "Fixed bug" tells you less. A useful changelog entry answers three questions: what changed, why it changed, and what broke to make the change necessary.

```markdown
## Changelog

| Date | Change | Reason |
|------|--------|--------|
| 2026-03-20 | v1.8.0: Separated polling from processing. Polling is unlimited, processing limited to 5 attempts. Added backoff gating and deadline-based expiry. | Root cause: 7 previous "fixes" addressed symptoms. Polling and processing shared one retry counter. Multiple triggers burned all retries before the recording was ready. |
| 2026-03-18 | v1.7.0: Reactivated webhook workflow. Extended content check to all file types. Added webhook staleness detection. | 5 meetings silently lost over 16 days. Three independent failures: webhook inactive from server restart, reconciliation skipping valid recordings, health monitor threshold too high. |
```

The "Reason" column is the critical part. It's where you document the *actual* root cause... not just "what we changed" but "what broke, why it broke, and why previous fixes didn't work." Six months from now, when someone asks "why is the retry architecture this complicated?"... the changelog answers them.

### Step 4: Centralize Constants (Eliminate N-Copies-1-Stale)

If the same value appears in multiple places... a cost threshold, an API URL, a configuration parameter... it will drift. Not might. Will. The question is only how long.

```python
# constants.py — Single Source of Truth
# After any infrastructure change, update THIS file.
# All other scripts import from here.

INFRASTRUCTURE = {
    "monthly_budget": 400,
    "daily_anomaly_threshold": 30,
    "alert_channel": "#system-status",
}

THRESHOLDS = {
    "drift_alert_percent": 10,  # Flag if actual vs documented > 10%
    "stale_doc_days": 30,       # Flag if directive unchanged > 30 days
}
```

Then in every script that needs these values:

```python
from constants import INFRASTRUCTURE, THRESHOLDS

if daily_cost > INFRASTRUCTURE["daily_anomaly_threshold"]:
    alert(INFRASTRUCTURE["alert_channel"])
```

**The anti-pattern this prevents:** We had four scripts with four different hardcoded cost values. When infrastructure costs changed, one script got updated. The other three kept alerting on phantom thresholds... or worse, stopped alerting on real ones. One file. One truth. All consumers import.

### Step 5: Build a Drift Detection Script

The post-deployment checklist handles the *proactive* case (updating docs when you know something changed). Drift detection handles the *reactive* case (finding docs that drifted without anyone noticing).

```python
import os
import re
import json
from pathlib import Path

def audit_directive(directive_path, scripts_dir):
    """Compare a directive's claims against filesystem reality."""
    findings = []
    
    with open(directive_path) as f:
        content = f.read()
    
    # 1. Find all script references in the directive
    script_refs = set(re.findall(r'`([a-z_]+\.py)`', content))
    actual_scripts = {p.name for p in Path(scripts_dir).glob("*.py")}
    
    missing = script_refs - actual_scripts
    for script in missing:
        findings.append({
            "severity": "high",
            "type": "missing_script",
            "detail": f"Directive references {script} but file doesn't exist",
        })
    
    # 2. Check "✅ Built" claims
    built_pattern = re.compile(
        r'✅\s*Built\s*\|\s*`?([^|`]+)`?\s*\|', re.MULTILINE
    )
    for match in built_pattern.finditer(content):
        location = match.group(1).strip()
        if location.endswith('.py') and location not in actual_scripts:
            findings.append({
                "severity": "critical",
                "type": "false_built_claim",
                "detail": f"Marked ✅ Built but {location} doesn't exist",
            })
    
    # 3. Check for hardcoded values that should use constants
    hardcoded_dollars = re.findall(r'\$\d{2,}', content)
    if len(hardcoded_dollars) > 3:
        findings.append({
            "severity": "medium",
            "type": "hardcoded_values",
            "detail": f"Found {len(hardcoded_dollars)} dollar amounts — "
                      f"consider centralizing in constants",
        })
    
    return findings


def compare_costs(constants_path, actual_monthly_spend):
    """Compare documented costs against actual cloud spend."""
    # Load your constants file however it's structured
    # This is the concept — adapt to your environment
    
    from constants import INFRASTRUCTURE
    documented = INFRASTRUCTURE["monthly_budget"]
    
    drift_pct = abs(actual_monthly_spend - documented) / documented * 100
    
    if drift_pct > 10:
        return {
            "severity": "high",
            "type": "cost_drift",
            "detail": f"Documented: ${documented}/mo, "
                      f"Actual: ${actual_monthly_spend}/mo "
                      f"({drift_pct:.0f}% drift)",
        }
    return None


if __name__ == "__main__":
    # Run against all directives
    directives_dir = Path("docs/directives")
    scripts_dir = Path("scripts")
    
    all_findings = []
    for directive in directives_dir.glob("*.md"):
        findings = audit_directive(directive, scripts_dir)
        if findings:
            print(f"\n{'='*60}")
            print(f"DRIFT: {directive.name}")
            for f in findings:
                print(f"  [{f['severity'].upper()}] {f['detail']}")
            all_findings.extend(findings)
    
    if not all_findings:
        print("All directives in sync with filesystem.")
    else:
        print(f"\n{len(all_findings)} drift issues found.")
```

### Step 6: Schedule It

The drift detection script needs to run regularly. How often depends on how fast your system changes. We run ours at the end of every work session (built into our session wrap-up checklist). A weekly cron job is the minimum.

```bash
# Weekly drift audit — Sunday at midnight
0 0 * * 0 cd /your/project && python scripts/audit_drift.py >> logs/drift-audit.log 2>&1
```

The output goes to a log and (in our case) a notification channel. When drift is detected, the next agent session addresses it before starting new work. The fixes go into the same commit as the session's other work... because drift remediation is work, not overhead.

---

## The Framework: The Deployment Artifact Principle

The transferable insight from all of this:

**Documentation is a deployment artifact, not a follow-up task.**

Think about how you treat code. You wouldn't deploy a new feature and then "plan to write the code later." The code IS the deployment. Documentation should work the same way. The directive update IS part of the deployment. Not step N+1. Not a separate ticket. Part of the same atomic unit of work.

Three rules make this concrete:

### Rule 1: Same Commit, Same Moment

Documentation changes go in the same commit as code changes. If you deployed a new script, the directive that references it gets updated in the same commit. If you changed a URL, the deployment table gets updated in the same commit. The commit is incomplete until the docs match reality.

### Rule 2: Claims Must Be Verifiable

Every "✅ Built" in your documentation is a testable claim. The script exists at the referenced path. The cron job is in the crontab. The URL returns a 200. If a claim can't be automatically verified, it's an opinion... not documentation.

### Rule 3: Drift Detection Is Not Optional

Human discipline handles 60% of documentation updates. Automated drift detection catches the other 40%. Without detection, you're relying on someone noticing the gap... and the whole problem is that stale documentation doesn't announce itself.

**Why we call it the "Deployment Artifact Principle":** In software engineering, a deployment artifact is something produced during the build process that gets shipped to production. It's not optional. It's not aspirational. It's a concrete thing that exists or the deployment failed. Documentation should be exactly that... a concrete artifact that either matches reality or triggers a failure alert.

---

## What We Learned

### The drift compounds faster than you think.

Our meeting processing directive was updated 8 times in 6 weeks. But the first drift happened on day one... the calendar API key names were wrong since the initial deployment, and nobody caught it because the directive confidently described a working system. Six weeks later, the directive had accumulated enough fixes to be nearly unrecognizable from the original. Every fix built on the assumption that the *previous* documentation was correct. It wasn't.

### "Working" and "documented correctly" are different states.

This surprised us. A system can work perfectly while its documentation is completely wrong. Our budget alert script existed and functioned... it just wasn't scheduled. The directive said "runs daily at 7 AM." The cron job wasn't there. The system was "working" in the sense that the code was correct. It was "documented correctly" in zero senses.

The gap between these two states is invisible until someone (usually a new agent session, sometimes a human) tries to reason about the system using the documentation instead of the code.

### Root cause analysis in changelogs pays for itself.

When we started requiring "Reason" columns in our changelogs, we discovered something unexpected: the same root cause appeared across multiple "different" fixes. Our meeting pipeline had 7 fixes that all traced back to one architectural flaw... polling and processing shared a single retry counter. Without root cause documentation, each fix looked independent. With it, we could see the pattern and do the actual fix instead of applying another patch.

### The real cost isn't the initial drift. It's the compounding.

One stale directive wastes 90 minutes. That's annoying. But the agent's "fix" based on stale understanding creates a new change that also isn't properly documented... and now you have two layers of drift. Our supporter meeting that sat unprocessed for 11 days was the result of three independent documentation gaps compounding: the webhook restart behavior, the reconciliation skip logic, and the health monitor threshold. Each gap alone was minor. Together they created a blind spot large enough to lose critical data through.

---

## The "Start Here" Prompt

If you want to build documentation-as-deployment-artifact into your own environment, give your AI agent this prompt:

```
I want to make documentation a required deployment artifact — not a 
follow-up task. Right now our docs drift from reality after deployments 
and we don't catch it until something breaks.

Here's what I need you to build:

1. POST-DEPLOYMENT CHECKLIST
   Create a checklist template I can embed in our system instructions 
   (or CI/CD pipeline) that fires after every deployment. It should 
   verify:
   - Directive/runbook changelog was updated in the SAME commit
   - Implementation Status tables reflect what's actually deployed
   - URLs and locations are documented for any hosted services
   - No hardcoded values that should be in a constants file
   - Features are marked Built (with version) or Planned (with timeline)

2. IMPLEMENTATION STATUS TEMPLATE
   Create a standard template for tracking what's built vs planned. 
   It needs: feature name, status (Built/Planned), location (file path 
   or URL), version, and notes. Make it Markdown-based so it works in 
   any docs system.

3. DRIFT DETECTION SCRIPT
   Build a script that compares documentation claims against filesystem 
   reality. It should:
   - Find all script references in docs and verify they exist on disk
   - Find all "Built" claims and verify the referenced files/services exist
   - Flag hardcoded values that appear in multiple places
   - Compare documented costs/thresholds against actual values (if applicable)
   - Output a severity-ranked list of findings
   - Exit cleanly with a summary even when no drift is found

4. CONSTANTS FILE
   Look at our codebase for values that appear in multiple files 
   (costs, thresholds, URLs, config). Create a single constants file 
   and update all consumers to import from it.

Start by asking me:
- Where are our directives/runbooks stored?
- Where are our execution scripts?
- Do we have any values (costs, URLs, thresholds) that appear in 
  multiple files?
- How often should drift detection run?
```

Copy that. Paste it. Your agent builds the system.

---

## About This Series

**Built from Broken** is published by the [Quietly Working Foundation](https://quietlyworking.org) (QWF), a 501(c)(3) nonprofit. Our mission is to serve youth 30 and younger... helping them discover purpose, build skills, and create legacy. We do this through product-based fundraising programs and student training.

We run a nonprofit almost entirely on AI agent infrastructure. Our backoffice is an Obsidian vault orchestrated by Claude Code (Anthropic's CLI-based AI coding agent), built on a three-layer architecture... Directives (what to do), Orchestration (the AI agent making decisions), and Execution (deterministic Python scripts doing the work). We build tools, we break things, we fix them... and then we write down what happened so you don't have to learn it the hard way.

This volume grew from 6 weeks of cascading failures in our meeting intelligence pipeline... failures that existed not because the code was bad, but because the documentation describing the code was wrong. Every system we built to fix it is now part of our standard operating procedures, and we use them daily across 40+ directives managing our nonprofit's AI-powered infrastructure.

**The name:** "Built from Broken" comes from a core belief... that brokenness isn't something to hide. It's proof of what's possible. Every solution in this series exists because something failed. We show the scars, not to complain, but because someone else is hitting the same wall right now... and the fastest way through is knowing they're not alone.

---

*Built from Broken, Vol. 2 — Published April 2026*
*Quietly Working Foundation | quietlyworking.org*
*Written by Chaplain TIG with Claude (Anthropic)*