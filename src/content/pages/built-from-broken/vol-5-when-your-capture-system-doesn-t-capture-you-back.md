---
title: "Built from Broken: Vol. 5"
slug: "vol-5-when-your-capture-system-doesn-t-capture-you-back"
pillar: "built-from-broken"
description: "Capture is half the contract. Surfacing is the other half. A UserPromptSubmit hook that pulls live issue-tracker items from a database and injects them into con"
publishDate: "2026-04-19"
tags: ["QWF", "QWU", "built-from-broken", "ai-agent", "claude-code", "hooks", "gtd", "productivity"]
series: "Built from Broken"
volume: 5
hook: "I had 21 ideas in a 'don't forget' panel. The panel never reminded me. One sat 4 weeks past due while I worked on the same app daily."
isHome: false
---
# Built from Broken: Vol. 5
## When Your Capture System Doesn't Capture You Back

> *Built from Broken is a series from the Quietly Working Foundation about real problems we face running AI-powered nonprofit operations... and the real solutions we build. Every fix in this series exists because something failed first. We show the receipts.*

---

## The Problem: Capture Without Surfacing Is Hoarding

David Allen's *Getting Things Done* makes one promise above all others... your mind is for *having* ideas, not *holding* them. When you trust your capture system to surface what matters at the right moment, your brain releases its grip. You stop swirling. You can finally focus.

Here's the catch: that promise breaks the moment your capture system stops capturing you back. Items pile up in a panel that you have to remember to open. The act of capturing them feels like progress... but if they never resurface at the right moment, you've just moved the swirling thoughts from inside your head into a digital folder. The mental load doesn't go away. It just relocates.

We had 21 of these items. One had been sitting open for four weeks while I worked on the same app daily. I'm the one who filed it. I'm the one who never reopened the panel.

### What We Built (Before It Broke)

Our Personal Command Center has a Bugs/Ideas/Suggestions panel. A clean Kanban board. Five columns: Triage, Backlog, In Progress, Done, Won't Do. Each card belongs to one of our nonprofit's apps via a `source_app` tag. Filter, sort, search. Real-time updates. Mobile-responsive.

Two paths to add an item:
1. The web UI's "Add Issue" form
2. Auto-sync from each app's bug-report widget

It works exactly the way you'd expect. The data is well-structured, prioritized, labeled. The board is beautiful.

And here's the failure: **a beautiful panel still requires you to open it.** Every fix to make the panel "more visible" added friction to the act of remembering to look. A persistent badge in the sidebar. Email digests. A widget on the dashboard. Each one performed for a week, then faded into UI fatigue. The eye stops seeing what's always there.

### How It Broke

I'd start a working session focused on one of our apps... let's say our local-business listings tool. I'd dive in, work for two hours, ship a feature, and never once think to check the panel for what I'd previously captured about that app.

Three real incidents from the last two months:

**Incident 1: The Four-Week Stale Item**
I'd added "Decommission [legacy system] on March 31 — Phase 2 fully deployed, only need to validate data in the new UI" on March 17. I gave it a label so I'd find it later. Then I worked on that app *daily* for the next four weeks without ever reopening the panel. The decommission target date came and went. I only discovered the stale item on April 19, after building the hook this article describes... which surfaced it the first time I mentioned the app's name in a conversation.

**Incident 2: The Captured-and-Lost Idea**
Mid-session, I had a great idea for one of our supporter-facing apps: "page-aware button animations on the service pages... residential roofing page builds a roof, solar pages animate panels in." I knew it was good. I told my agent. Then I went back to the actual work I was doing, and the idea evaporated... because adding it required switching to the web UI, and switching meant losing my place. I rebuilt the same idea two weeks later from scratch. Twice.

**Incident 3: The Blind Restart**
Every new chat session started cold. Even if I'd captured 5 ideas about WHELHO yesterday, today's session about WHELHO didn't know they existed. I'd brainstorm in a vacuum. Sometimes I'd surface old ideas mid-conversation by accident, realize they were already filed, and feel the small sting of duplicated mental work.

Same pattern every time:

1. I capture an idea (sometimes)
2. The idea sits in a panel I don't reopen
3. I start a new session focused on the same app
4. I have no idea what's already filed
5. I either forget the previous capture entirely... or rediscover it weeks later

### Why "Just Check the Panel" Doesn't Work

I tried every obvious fix.

**Approach 1: Make the panel more visible.**
Bigger badge. Brighter color. Top of the sidebar. Persistent toast notification when items aged past a threshold.

Result: One week of useful attention, then UI fatigue. The eye stops seeing what's always there. The badge becomes wallpaper.

**Approach 2: Build a habit.**
Tell yourself "always check the panel before starting work on an app." Add it to a checklist. Pin it in your daily review.

Result: Habits work for things you do daily. They fail when work spans dozens of contexts and the right time to check is "the moment you mention this specific app." You can't habitualize a context-dependent action across 16 different contexts.

**Approach 3: Email digests.**
Daily summary of open items by app. Weekly aging report. "Here are your 3 oldest unfinished ideas for this app."

Result: Email is the worst possible surface for "I'm about to start work on X." By the time you read the digest, you're not in the right headspace to act. By the time you're in the right headspace, the digest is buried.

**Approach 4: Hope the AI agent remembers.**
"Hey agent, before we work on this app, check the issue tracker."

Result: Same failure mode as Vol 1 of this series. Voluntary compliance under time pressure equals skipped steps. The agent doesn't check unless you make it impossible not to. And if you have to remember to *tell* the agent to check, you've added a memory step that defeats the whole point.

The core issue: **a capture system that requires you to remember to look is not a capture system... it's a database with extra steps.** GTD's promise of "mind like water" only fires when surfacing is automatic. The moment surfacing becomes voluntary, your brain knows. It re-engages the holding loop. The swirl returns.

---

## The Solution: A Hook That Surfaces Before You Recall

### The Insight

Vol 1 of this series solved a related problem: AI agents skipped reading documentation under time pressure. We built a `UserPromptSubmit` hook that scanned the user's message for tool keywords and injected a system message reminding the agent to read the relevant docs *before* starting work.

Same architecture works here. Different data plane.

In Vol 1, the data was static (documentation files on disk). In this volume, the data is live (open items in a database table). The pattern is identical: scan the prompt for canonical keywords, look up matching context, inject it into the agent's view before any work begins.

The reader doesn't have to remember to check the panel. The panel comes to them.

### What We Built

A Python script that runs on every `UserPromptSubmit` event. It does five things:

1. **Scans your message** for app/project keywords (acronym OR full name, both cases)
2. **Queries your issue tracker database** for strictly-open items belonging to those apps
3. **Caches the result per session** (so multi-turn conversations don't hammer the database)
4. **Tracks per-app "last seen" timestamps** (so it can highlight items added since you last touched that app)
5. **Injects a compact system message** with priority-coded items, stalled-item warnings, and cross-app label crosslinks

That's the proactive surfacing. Two more pieces complete the contract:

6. **A capture skill** — a slash command that inserts new items into the same database with one line, no UI switch
7. **A close-the-loop step** — a session-wrap-up routine that lists items for apps touched this session and prompts you to mark resolved/in-progress/note

Capture is easy. Surface is automatic. Decay is built-in. Trust gets earned.

### The Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  CAPTURE PATH                                                │
│                                                              │
│  You: "/hq-add bug WHELHO planet rotation breaks on Samsung"│
│       ↓                                                      │
│  Skill resolves type + app code + priority                  │
│       ↓                                                      │
│  POST to issue tracker DB → confirmation + short ID         │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  SURFACE PATH (the hook)                                     │
│                                                              │
│  You: "Let me work on Quietly Spotting (QSP) today..."      │
│       ↓                                                      │
│  Hook scans message → matches: {qsp}                        │
│       ↓                                                      │
│  Cache hit?                                                  │
│       ├── YES → use cached rows                             │
│       └── NO  → query issue tracker DB                      │
│                  WHERE source_app IN (matched)              │
│                  AND status IN (pending, ack, in_progress)  │
│       ↓                                                      │
│  Format with: priority icons, age, stalled flags,           │
│               "new since last touch" highlights,            │
│               cross-app label crosslinks                    │
│       ↓                                                      │
│  Inject as system message → agent sees BEFORE working       │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  DECAY PATH (close-the-loop)                                 │
│                                                              │
│  End of session: agent runs --close-the-loop                │
│       ↓                                                      │
│  Detects apps mentioned this session (from event log)       │
│       ↓                                                      │
│  Lists open items per app → "Did we resolve any?"           │
│       ↓                                                      │
│  PATCH status / notes / priority for each item discussed   │
│       ↓                                                      │
│  Inbox shrinks. Trust earned.                               │
└─────────────────────────────────────────────────────────────┘
```

### The Before and After

**BEFORE (without the hook):**
```
Day 1, 9:00 AM
You: "Add this to my list — decommission the legacy system by March 31"
Agent: [adds to issue tracker panel]
You: [closes panel, returns to work]

Day 2-28
You work on this app daily. Never reopen the panel. The decommission item ages.
Brain occasionally remembers there's "something" about this app you should check.
You don't check. The swirl continues.

Day 29 (April 17)
Decommission deadline passed two weeks ago.
You discover this only because someone mentions the legacy system at random.

Total cognitive cost: ~28 days of low-grade background anxiety + a missed deadline.
```

**AFTER (with the hook):**
```
Day 1, 9:00 AM
You: "/hq-add idea QSP decommission the legacy system by March 31"
Skill: "Filed as a1b2c3d4. Priority: normal. Done."
You: [returns to work — ZERO context switch]

Day 2, 9:00 AM
You: "Let me work on Quietly Spotting (QSP) today..."
[Hook fires silently, ~400ms]
Agent's view (before responding):
  **Quietly Spotting** (qsp) — 1 open: ⚪1
    ⚪ normal [Triage] idea "decommission the legacy system by March 31"
                            (1d) `a1b2c3d4`

Agent: "Open item: decommission the legacy system by March 31. Want to tackle that
       first or work on something else?"

You: [decision made, work continues with full context]

Total cognitive cost: zero. The system carried the item until you returned to it.
```

The reader's experience is the headline. The agent didn't need a reminder to check. The user didn't need to remember to ask. The system surfaced the item the moment its context became relevant, and not a millisecond before.

---

## How to Build Your Own

You don't need our specific issue tracker, our specific apps, or our specific database. The pattern works with any system where you can:

- Tag items with a canonical "project/app/area" code
- Query open items via API or direct database access
- Run a UserPromptSubmit hook in your AI agent (Claude Code supports this natively)

Here's the blueprint.

### Step 1: Define Your Canonical App/Project Registry

You need a single source of truth for what counts as "an app" or "a project" in your world. This is the registry your hook will key off of.

For most teams this is already implicit... it's the list of products, repos, or projects you actually work on. Make it explicit. Each entry needs:

- A short canonical code (3-4 lowercase letters works well)
- A human-readable display name
- A status (so you can filter to active projects)

If you don't have a registry table yet, create one. Even a flat YAML file works:

```yaml
# your_app_registry.yaml
apps:
  - code: web
    name: Public Website
    status: production
  - code: api
    name: Backend API
    status: production
  - code: mob
    name: Mobile App
    status: alpha
  - code: doc
    name: Documentation Site
    status: production
```

The point is consistency. Every issue you file gets tagged with one of these codes. Your hook will match keywords to these codes.

### Step 2: Build the Keyword Map

For each app in your registry, define two types of triggers:

- **Acronyms** — short, unique strings matched with case-insensitive word boundaries (so "API" matches but "applies" doesn't)
- **Phrases** — longer strings matched as case-insensitive substrings (so "backend api" or "Public Website" both work)

```python
APPS = {
    "web": {
        "name": "Public Website",
        "acronyms": ["WEB"],
        "phrases": ["public website", "marketing site"],
    },
    "api": {
        "name": "Backend API",
        "acronyms": ["API"],
        "phrases": ["backend api", "core api"],
    },
    "mob": {
        "name": "Mobile App",
        "acronyms": ["MOB"],
        "phrases": ["mobile app", "ios app", "android app"],
    },
    # ...add every app worth surfacing for
}
```

**Strong triggers only.** Two-character acronyms (like "HQ" or "MP") are too noisy... they match random substrings. Skip the acronym for those and require a longer phrase like "HQ Command Center" or "Missing Pixel project." False positives flood every prompt and erode trust faster than missing items would.

The goal: when the user mentions a tracked app, they almost certainly want context about it. Tune for high precision over high recall.

### Step 3: Build the Query Layer

Your hook needs to fetch open items from your issue tracker for the matched apps. The query is straightforward... it's the same query whether you're using Supabase, raw Postgres, Linear's API, Jira, Notion, or even a flat SQLite file.

The shape:

```sql
SELECT id, source_app, type, status, priority, message, created_at, acknowledged_at
FROM issues
WHERE source_app IN ('web', 'api')           -- matched app codes
  AND status IN ('pending', 'in_progress')   -- strictly open
ORDER BY priority ASC, created_at DESC
LIMIT 25 PER APP;
```

Wrap this in a function that takes the matched app codes and returns a dict of `{app_code: [rows]}`. Use whatever auth your tracker requires (env variable for API tokens or DB credentials... never hardcode).

```python
import os
import requests

def fetch_open_issues(app_codes):
    """Fetch strictly-open items from your issue tracker, grouped by app code."""
    if not app_codes:
        return {}

    # Adapt this block to your stack. PostgREST shown here.
    url = os.environ["YOUR_DB_URL"]
    key = os.environ["YOUR_DB_KEY"]

    apps_filter = "(" + ",".join(app_codes) + ")"

    resp = requests.get(
        f"{url}/rest/v1/your_issues_table",
        headers={"apikey": key, "Authorization": f"Bearer {key}"},
        params={
            "select": "id,source_app,type,status,priority,message,created_at",
            "source_app": f"in.{apps_filter}",
            "status": "in.(pending,in_progress)",
            "order": "priority.asc,created_at.desc",
        },
        timeout=4,
    )
    if resp.status_code not in (200, 206):
        return {}

    by_app = {code: [] for code in app_codes}
    for row in resp.json():
        sa = row["source_app"]
        if sa in by_app:
            by_app[sa].append(row)
    return by_app
```

**Cache aggressively.** Your hook fires on every prompt, and most multi-turn conversations stay focused on the same app. A 5-minute per-session cache eliminates redundant queries with no cost to freshness:

```python
import json, time
from pathlib import Path

CACHE_FILE = Path(".tmp/issues_cache.json")

def get_cached(session_id, app_codes, ttl=300):
    if not CACHE_FILE.exists():
        return {}, set(app_codes)
    cache = json.loads(CACHE_FILE.read_text())
    sess = cache.get(session_id, {})
    now = time.time()
    fresh, missing = {}, set()
    for code in app_codes:
        entry = sess.get(code)
        if entry and (now - entry.get("ts", 0)) < ttl:
            fresh[code] = entry["rows"]
        else:
            missing.add(code)
    return fresh, missing
```

### Step 4: Build the Injection Formatter

This is where the rubber meets the road. The injected text appears in your agent's view before it responds. It needs to be compact, scannable, and action-oriented.

Design rules:

- **One line per item.** Multi-line cards take too much vertical space.
- **Lead with priority.** Color-coded icons (🔴 blocking, 🟠 urgent, ⚪ normal, ⚫ low) read faster than text.
- **Truncate descriptions.** First 80 chars + ellipsis. The full text is one click away.
- **Show age.** "(2d)" or "(3w)" so the eye can spot stale items.
- **Surface the meta.** Stalled-item warnings, "new since last touch" markers, cross-app patterns.
- **End with an action hint.** "Ask Claude to mark resolved/add notes/etc."

Example output for one app:

```
**Public Website** (web) — 3 open: 🔴1 ⚪2
  🔴 blocking [Triage] bug "Checkout button missing on mobile" (1d) `abc12345`
  ⚪ normal   [Backlog] idea "Add testimonial carousel to homepage" (5d) `def67890`
  ⚪ normal   [Backlog] idea "Footer copyright year is hardcoded" (2w) `ghi23456`
  🆕 1 new since last touch (3d ago)
  🔗 cross-app labels: "auth" also in api(2)
```

### Step 5: Wire It Up as a UserPromptSubmit Hook

Same Claude Code hook architecture from Vol 1. Read JSON from stdin, write JSON to stdout, always exit 0.

```python
import json, sys

def main():
    payload = json.loads(sys.stdin.read() or "{}")
    prompt = payload.get("prompt", "")
    session_id = payload.get("session_id", "default")

    matched = extract_apps(prompt, APPS)
    if not matched:
        print("{}")  # silent on no match
        return 0

    cached, missing = get_cached(session_id, matched)
    by_app = dict(cached)
    if missing:
        fresh = fetch_open_issues(missing)
        for code in missing:
            by_app[code] = fresh.get(code, [])
        update_cache(session_id, {c: by_app[c] for c in missing})

    injection = build_injection(by_app)
    print(json.dumps({"systemMessage": injection}))
    return 0

if __name__ == "__main__":
    sys.exit(main())
```

Register in `.claude/settings.json`:

```json
{
  "hooks": {
    "UserPromptSubmit": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "python3 /path/to/your/issues_preload.py",
            "timeout": 6
          }
        ]
      }
    ]
  }
}
```

Six-second timeout is comfortable for a network query. Local DB queries finish in milliseconds. The hook fails silently on any error (returns `{}`) so a network blip never breaks your conversation.

### Step 6: Build the Capture Path

The surfacing half of the trust contract is the hard part to build but easy to use. The capture half is the opposite: trivial to build, but requires conscious design to keep frictionless.

The rule: **capture must not interrupt flow.** No web UI switch. No multi-step form. No required fields beyond the bare minimum.

Build a slash command (or whatever shortcut your agent supports) that takes one line:

```
/issues-add <type> <app> <description>
```

Examples:

```
/issues-add bug web checkout button missing on mobile
/issues-add idea api support webhooks for events
/issues-add suggestion mob redesign settings screen
```

Behind the scenes, your agent parses the type/app/description and POSTs to your issue tracker. Return the new short ID and the tracker URL filtered to that app. Total time: 2 seconds.

The user thought the idea, said it, and went back to work. Their brain just released its hold.

### Step 7: Build the Decay Path

The third leg of the triad. Without it, the inbox only grows. With it, the inbox earns trust by visibly shrinking when work happens.

Add a "close-the-loop" routine to your end-of-session checklist. It does three things:

1. **Detects apps you actually worked on this session** (parse your agent's event log for app keywords)
2. **Queries open items for those apps** (same query as the hook)
3. **Prompts the user/agent to update statuses** for items discussed during the session

Concept (your event log shape will vary):

```python
def close_the_loop():
    # 1. Find apps mentioned in this session's prompts
    apps_touched = scan_session_log_for_apps()

    if not apps_touched:
        print("No tracked apps detected in this session.")
        return

    # 2. Pull open items for those apps
    by_app = fetch_open_issues(apps_touched)

    # 3. List them and prompt for updates
    print("## Items to triage from this session\n")
    for code, rows in by_app.items():
        if not rows:
            continue
        print(f"\n**{code}** — {len(rows)} open items:")
        for r in rows:
            print(f"  - `{r['id'][:8]}` {r['priority']} | {r['message'][:80]}")
    print("\nFor each item: did we resolve it? Start it? Add a note?")
    print("Use the short ID to PATCH status/notes.")
```

The agent reads the report, talks through it with you, and runs PATCH calls for items you actually touched. Items move out of the open queue. The next session sees a smaller list. Trust compounds.

### Step 8: Test It

Send your agent a message that mentions one of your tracked apps:

```
You: "Let me work on the Backend API today"
```

You should see the agent's response start with awareness of your open API items... or you should see it acknowledge that the inbox is clean. Either way, you have proof that surfacing is automatic.

If nothing fires, check:

1. Is the hook executable? (`chmod +x` on Unix)
2. Is the path in `settings.json` correct?
3. Does it run standalone? `echo '{"prompt":"test API"}' | python3 your_hook.py`
4. Does your registry actually contain the app code your keyword maps to?

---

## The Framework: The Trusted Inbox Triad

Every capture system promises freedom. Most deliver guilt. The difference is whether all three legs of the triad are present.

```
                  ┌──────────────┐
                  │   CAPTURE    │
                  │ (frictionless│
                  │     add)     │
                  └──────┬───────┘
                         │
                         ▼
              ┌──────────────────────┐
              │       SURFACE        │
              │ (automatic, by       │
              │  canonical keyword   │
              │  match, before recall│
              │  is needed)          │
              └──────────┬───────────┘
                         │
                         ▼
                  ┌──────────────┐
                  │    DECAY     │
                  │ (close-the-  │
                  │  loop, items │
                  │  resolve,    │
                  │  inbox       │
                  │  shrinks)    │
                  └──────────────┘

         All three required. Skip any → trust breaks.
```

### Capture (frictionless add)

If the act of capturing requires switching context — opening a web UI, filling a form, choosing from dropdowns — the capture won't happen consistently. You'll capture the loud ideas and lose the quiet ones, which is the inverse of what you want. Most quiet ideas are the ones worth keeping.

Optimize for the moment of "I just thought of something." From thought to filed-and-forgotten should take less than 5 seconds. Anything slower fails the bar.

### Surface (automatic, before recall)

This is the leg that almost everyone misses. They build beautiful capture systems and call it done. But capture without surface is hoarding. The mind doesn't release its grip on an idea until it trusts the system to bring it back at the right moment.

"Right moment" is not "in your daily review." Daily reviews are too late and too coarse. The right moment is *the second you start thinking about the relevant context.* Surfacing has to be context-aware and triggered by the user's own behavior, not by a calendar.

This is why the keyword-match-on-prompt pattern works so well. The user's prompt is the highest-quality signal of what context they're in. Match it, surface relevant items, do nothing if no match. You can't get a more precise trigger than the user telling you what they're thinking about.

### Decay (items resolve, inbox shrinks)

Without decay, the inbox is a graveyard. Items accumulate, age, become noise, and eventually train the brain to ignore the surface step. The surfacing leg fails not because it stops firing, but because the user stops trusting what fires.

Decay isn't automatic — humans have to make resolution decisions. But the system can prompt for those decisions at the right moment (end of a session where the relevant app was touched), and execute the resolutions on the user's behalf with one line of confirmation.

The triad is self-reinforcing. Easy capture means more captures. Reliable surface means more captures get acted on. Built-in decay means the inbox stays trustworthy. Skip any leg, and the whole structure collapses back into the original problem... a panel that grows faster than it shrinks, that the user stops opening, that quietly fails to deliver on its promise.

---

## What We Learned

### This is a cognitive bandwidth problem, not a productivity problem.

We started building this thinking it would help us "manage our backlog better." Then we shipped it and noticed something different. The first time the hook surfaced a four-week-old stale item, what we felt wasn't satisfaction at finding the item. It was the absence of the low-grade anxiety we'd been carrying around since mid-March about "something about that legacy system I should remember."

The item wasn't urgent. It was just *there*, in the back of the mind, draining attention from whatever was actually in front of us. The hook didn't make us more productive. It made us less anxious. And the productivity gain came from no longer spending micro-cycles on background worry.

GTD wasn't selling productivity. It was selling *peace*. We finally understood the difference.

### Surfacing is harder than capturing because it's a coordination problem.

Capture is a single user action — file the thing. Surface requires the system to know *when* the user is in the right context to receive it. That's a coordination problem between the user's mental state and the system's data.

Most capture tools punt on this. They make the surface step manual: "you have to open the app." A few make it scheduled: "we send you a daily digest." Both are too coarse to match the moment. The keyword-match-on-prompt pattern works because the user's prompt is the most precise signal of context that exists. Use it.

### The receipt that mattered most was the smallest.

The flashy receipt is "we surfaced a 4-week-old stale item." That's the headline. But the receipt that mattered more was this... in the first conversation after the hook went live, the user said "let me work on QSP today" and the agent responded with full awareness of QSP's open items in the same breath as its first answer. No friction. No context switch. No "let me check first." The system just *knew*.

That's the moment where trust starts to compound. Once the user sees that surface is automatic, they file more. Once they file more, decay matters more. Once decay matters more, they actually run the close-the-loop step. The triad self-reinforces.

### This is Vol 1 with a different data plane.

We didn't realize until the architecture review that this is structurally identical to the TWL preload hook from Vol 1. Same UserPromptSubmit event. Same keyword scanner. Same canonical registry. Same system-message injection. The only difference is the data source... documentation on disk in Vol 1, live database rows here.

Which means the principle is bigger than either implementation. **Any context that should be surfaced before work begins, based on what the user just said they're working on, can use this same architecture.** Open Linear tickets. Open PRs needing review. Active feature flags. Recent incident reports. Customer feedback for a specific product. The pattern generalizes.

If you built Vol 1's hook, you've already built 80% of this one. Swap the data layer. Keep everything else.

### Boring beats clever, again.

We could have built this with semantic search. RAG over the issue tracker. A secondary AI that decides what's relevant. We didn't. The keyword map is 16 entries. The query is 4 lines of SQL. The injection formatter is a glorified printf.

Every layer of complexity is a layer that can break. And the cost of a missed item (the user works on an app blind to its open issues) is small compared to the cost of a flaky surfacing system (the user stops trusting the surface step entirely). When trust is the asset, simplicity is the moat.

---

## The "Start Here" Prompt

If you want to build this for your own environment, give your AI agent this prompt:

```
I want to build a "trusted inbox" system for my issue tracker that has three
parts:

1. SURFACE: A UserPromptSubmit hook that scans my message for app/project
   keywords and injects open issues for those apps into your context
   automatically, before you respond.

2. CAPTURE: A slash command (or equivalent shortcut) that lets me file new
   items in one line, no UI switch.

3. DECAY: A session-wrap-up step that lists open items for apps I touched
   this session and helps me update statuses for items I worked on.

Here's what I need you to do:

1. Ask me about my issue tracker:
   - Where is it? (Linear, Jira, Notion, custom database, etc.)
   - How do I authenticate to it? (env vars only, never paste credentials)
   - What's the schema for an issue? (status field, app/project tag field,
     priority field, description field, ID field)

2. Ask me about my apps/projects registry:
   - List the apps/projects you want this to fire for
   - For each: a short canonical code, a display name, and the keywords
     (acronyms + full-name phrases) that should trigger surfacing for it

3. Build the SURFACE hook:
   - Python script registered as UserPromptSubmit in .claude/settings.json
   - Reads stdin JSON, writes stdout JSON, always exits 0
   - Scans the prompt for app keywords (acronym word-boundary OR phrase
     substring, case-insensitive)
   - Queries my issue tracker for matched apps' open items
   - Caches per session for 5 minutes
   - Tracks per-app "last seen" timestamps in a persistent file
   - Formats and injects a compact system message with priority icons,
     age, stalled-item warnings, "new since last touch" highlights
   - Falls silent on no match or any error

4. Build the CAPTURE skill:
   - Slash command parses type/app/description from one line
   - Resolves app names to canonical codes
   - POSTs to my issue tracker with sensible defaults (priority=normal,
     status=pending, etc.)
   - Returns the new short ID and a direct link

5. Build the DECAY step:
   - Add a section to my session-wrap-up routine
   - Detects apps mentioned this session from my agent's event log
   - Lists open items for those apps
   - Prompts me to mark resolved/in-progress/add notes for items worked on

6. Test the whole flow end-to-end with a real example.

The hook must:
- Read JSON from stdin, write JSON to stdout
- Always exit 0 (never block my prompt)
- Complete in under 6 seconds (network query)
- Handle missing credentials, network errors, and malformed input gracefully
- Be silent (output {}) when no app keyword is matched

The capture skill must:
- Take a single one-line input
- Never require a UI switch or web form
- Confirm in 2 seconds or less

The decay step must:
- Be embedded in the existing session-wrap-up routine, not a separate skill
- Surface items by app, with short IDs for easy reference
```

Copy that. Paste it into a new agent session. The agent will interview you about your stack and build the whole triad.

---

## About This Series

**Built from Broken** is published by the [Quietly Working Foundation](https://quietlyworking.org) (QWF), a 501(c)(3) nonprofit. Our mission is to serve youth 30 and younger... helping them discover purpose, build skills, and create legacy. We do this through product-based fundraising programs and student training.

We run a nonprofit almost entirely on AI agent infrastructure. Our backoffice is an Obsidian vault orchestrated by Claude Code (Anthropic's CLI-based AI coding agent), built on a three-layer architecture... Directives (what to do), Orchestration (the AI agent making decisions), and Execution (deterministic Python scripts doing the work). We build tools, we break things, we fix them... and then we write down what happened so you don't have to learn it the hard way.

This volume is the natural companion to Vol 1. That one made the agent read what was already known. This one makes the agent see what's already open. Same architectural skeleton, different muscle. If you built Vol 1's hook, you can build this in an afternoon... and your brain will thank you.

**The name:** "Built from Broken" comes from a core belief... that brokenness isn't something to hide. It's proof of what's possible. Every solution in this series exists because something failed. We show the scars, not to complain, but because someone else is hitting the same wall right now... and the fastest way through is knowing they're not alone.

---

*Built from Broken, Vol. 5 — Published April 2026*
*Quietly Working Foundation | quietlyworking.org*
*Written by Chaplain TIG with Claude (Anthropic)*