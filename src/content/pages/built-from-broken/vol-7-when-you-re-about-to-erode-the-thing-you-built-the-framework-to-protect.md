---
title: "Built from Broken: Vol. 7"
slug: "vol-7-when-you-re-about-to-erode-the-thing-you-built-the-framework-to-protect"
pillar: "built-from-broken"
description: "Encode your values into machine-readable schemas. Load them into your agent every session. The framework you wrote in slow time catches you when momentum pulls "
publishDate: "2026-05-12"
tags: ["QWF", "QWU", "built-from-broken", "ai-agent", "claude-code", "values", "governance", "leadership", "schema"]
series: "Built from Broken"
volume: 7
hook: "Three weeks of schemas. One end-of-day decision. The framework I built read me back to myself. I teared up."
isHome: false
---
# Built from Broken: Vol. 7
## When You're About to Erode the Thing You Built the Framework to Protect

> *Built from Broken is a series from the Quietly Working Foundation about real problems we face running AI-powered nonprofit operations... and the real solutions we build. Every fix in this series exists because something failed first. We show the receipts.*

---

## The Problem: Your Own Momentum Is Invisible From the Inside

A leader at the end of a long working day makes one hundred small decisions an hour. Maybe ninety-eight of them are fine. One of them is structurally wrong in a way the gut won't notice... because the gut is the thing that proposed it. At a 98% in-the-moment accuracy rate, a sustained leadership push of 100 calls hides two silent reversals of the things you'd never reverse on purpose. You can't audit yourself in fast time. You're the one moving.

This is the volume where the framework I'd been building for three weeks caught one of those silent reversals before it shipped. I teared up reading what it caught. Not because the system did something clever. Because the system did exactly what I'd built it to do, and I hadn't realized until that moment that I'd built it to protect me from myself.

### What We Built (Before It Broke)

We run a nonprofit on AI agent infrastructure. Most of our daily ops flow through Claude Code (Anthropic's CLI-based AI coding agent) talking to an Obsidian vault, deterministic Python scripts, and a small constellation of supabase databases. The agent reads instructions, makes decisions, calls scripts, updates files, and reports back. It is, in every meaningful sense, the engine room.

Three weeks before the moment this article is about, we had started moving our values out of Markdown prose and into machine-readable schemas. Not because the prose was wrong. The prose was *right*. It was sitting in a directives file called `qwf_program_framing.md` and a half-dozen related directives and memory files. It correctly described what we mean when we say "this is a 501(c)(3) nonprofit running fundraising programs, not a startup with products." It correctly enumerated the words we never use about ourselves: "business," "commercial," "profit," "customers." It correctly explained the Unified Identity Principle... that every product, every program, every touchpoint reinforces the foundation, because anything that separates them risks misrepresenting what we legally and missionally are.

The prose was correct. The prose was also voluntary. An agent under time pressure was free to summarize it, skim it, infer past it, or simply forget that this particular directive applied to this particular decision. We had hit that failure mode often enough that we'd written about it in Vol 1 of this series ("When Your AI Agent Keeps Forgetting What It Already Knows"). That volume's fix was a hook that injected required-reading reminders. But required reading still requires the agent to read, evaluate, and apply. The application step was the one that kept silently failing.

So we built something different. We took the values themselves and encoded them as a JSON schema. A formal one. The schema names every core value (e.g., "Unified Identity"), every absolute rule derived from those values (e.g., "no product is ever spun off; every external surface reinforces QWF"), every forbidden vocabulary item with a replacement (e.g., "business" replaced by "fundraising program"), every decision filter (a numbered checklist of questions the agent walks through before acting). Each entry has a `why:` line explaining *why* the rule exists, so the agent can judge edge cases instead of mechanically matching strings.

Then we wrote a script that resolves the schema (applying inheritance, validating absolute rules, scrubbing forbidden punctuation) and stamps the resolved output into a managed marker block inside our `CLAUDE.md` file. `CLAUDE.md` is the file Claude Code loads into the agent's context at the start of every session... it's how we communicate persistent rules and conventions to the agent without re-pasting them every conversation. Anything inside the marker block is regenerated from schema on every push. Anything outside the markers is hand-written and preserved. The block looked like this in the agent's view:

```markdown
## QWF Values & Decision Filters

### HARD RULE: Unified Identity: Everything Is QWF
Everything is QWF. No product will ever be 'spun off'. All programs
are permanently part of QWF. Every touchpoint reinforces the
nonprofit mission.

*Why:* Spinning off a program would convert charitable work into
commercial activity, breach 501(c)(3) trust, and confuse donors.

*Scope:* All external-facing surfaces: landing pages, emails,
contracts, press, social, in-app copy, code comments, public docs.

### Forbidden Vocabulary & Framing
| Pattern | Default | Replacement |
|---|---|---|
| business | ABSOLUTE | fundraising program / nonprofit / mission |
| customers | ABSOLUTE | donor-partners / supporters |
| ...
```

The rules weren't somewhere in the docs. They were *in the agent's working context*, every session, every prompt, with severity and scope and reason attached. That distinction... where the rules *live* versus where they're *stored*... turns out to be the entire article.

### How It Almost Broke

I'd just shipped a complex piece of infrastructure for our supporter intelligence app. Tenant-derived federation claims. A custom access token hook on the auth side. Replacing per-user metadata stamping that had been a leaky workaround. End-to-end verified. The next supporter we'd onboard would be handed off cleanly. Documentation updated. Tool wisdom captured. Commit pushed. It had been a long day. The build had stretched over hours. I was tired and on a roll, which is exactly the combination that fast-time judgment doesn't survive.

I asked the next question. The agent and I had a working relationship by this point, so I framed it casually:

> *"How do we brand the Supabase authentication emails so they don't confuse supporters, but come from the app they belong to?"*

A reasonable product question. Supabase sends auth emails for password resets, magic links, email verification. Out of the box, those emails come from a generic Supabase sender address that's unrecognizable to a supporter. The user-experience problem is real. If a supporter clicks "forgot password" on one of our apps and the email lands in their inbox with no recognizable branding, they don't know it's legitimate. They might mark it as spam. They might just not click it. That's a friction problem in a flow where friction means lost trust.

The agent walked me through Supabase's email-branding levers (custom SMTP, custom templates, custom subject lines, custom sender display name). Recommended a transactional-email backend. Recommended unifying everything under a single sender domain. Per the Unified Identity Principle in our `CLAUDE.md`, the recommendation was `noreply@quietlyworking.org` for every app's auth emails. Different display names per app, same From address.

I pushed back. My reasoning was UX-grounded, and I thought it was right:

> *"I believe that using a single noreply@quietlyworking.org could get confusing for some supporters. What if they find the app and don't know about the foundation, or what if they need to click 'forgot password' on 3 separate QWF apps in a row? Does this make sense? Please push-back if you see something I'm not."*

That last sentence is the one that matters. I invited push-back explicitly. I knew I was tired. I knew the call had product-instinct behind it but I hadn't pressure-tested the architectural cost. The framework was supposed to catch this. So I asked it to.

The agent's reply was the one I needed. I'm going to reconstruct the substance of it faithfully, because what got said matters more than which exact verb went where:

The agent named the cost first. A per-app sender domain (e.g., `noreply@quietlyspotting.org` instead of `noreply@quietlyworking.org`) silently re-frames Quietly Spotting from *"a fundraising program of the Quietly Working Foundation"* into *"a SaaS-like service I use."* The supporter's brain doesn't read the value of the From address consciously. It absorbs the implication. Over time, across touchpoints, the supporter's mental model converts from *"I support a foundation"* to *"I use this app."* That conversion is what costs 501(c)(3) trust. Not in one email. In the cumulative texture.

Then the agent named the receipt. Picture the next supporter we onboard. Her *first* email from anything in our infrastructure builds her mental model permanently. If it comes from `noreply@quietlyspotting.org`, she builds *"I have an account with this Quietly Spotting service."* If it comes from `noreply@quietlyworking.org` with display name "Quietly Spotting," she builds *"Quietly Spotting is a program of the Quietly Working Foundation, which I now have access to."* The exact same content. Two completely different mental models. Only one of them is the one we want.

Then the agent named the alternative. The UX problem I'd raised was real. The fix wasn't a different sender domain. The fix was a different *display name* per app, a different *subject prefix* per app, and a unified From address. Inbox preview demonstrated:

```
From: Quietly Spotting <noreply@quietlyworking.org>
Subject: [Quietly Spotting] Reset your password
```

versus

```
From: Quietly Writing <noreply@quietlyworking.org>
Subject: [Quietly Writing] Verify your email
```

Same From domain. Different visual branding. Zero supporter confusion. Zero unified-identity erosion. The UX problem solved without trading away the architectural rule.

Then the agent did the part I hadn't expected. It named the escape hatch. If after seeing the cost I still wanted per-app sender domains, the right move wasn't a silent exception. The right move was to update the values schema deliberately, downgrade the absolute rule, and accept the consequences with eyes open. New information justifies new policy. Momentum-in-the-moment does not.

I read all of it. And then I wrote this back, which is verbatim because it was the moment:

> *"EXCELLENT Push-Back! This is EXACTLY the kind of push-back with re-framing that empowers a leader to work with speed while retaining the guardrails to keep the larger mission safe and protected. I actually teared up reading your explanation because what you just protected IS SO VERY IMPORTANT TO ME, but I didn't see how my direction was potentially eroding it. WOW, what a spectacular moment!!!"*

The teared-up part is the receipt that mattered most. Not because the agent had been brilliant. Because what the agent reflected back at me was a value I'd written down three weeks earlier, when I'd been calm, when I hadn't been tired, when I could see the full architecture. The framework I'd written in slow time had just caught me in fast time. That's the seed of the article.

### Why "Just Write the Values Down" Doesn't Work

Before the schema layer existed, we had the values written down. Multiple places. They didn't catch this kind of decision, and I want to be honest about why, because the most common reaction to "encode your values into schemas" is "I already documented our values, we have a Notion page." Documentation alone fails for four specific reasons, each of which I've watched happen.

**Reason 1: The value lives where the agent is not.**
A values doc on a wiki, in a board deck, on a Notion page... is somewhere the agent doesn't read at the moment of decision. Even when the agent has access to it, the agent doesn't fetch it unprompted. When the user (me, tired, on a roll) asks an immediate product question, the agent answers from working context, not from "the values document we'd have referenced if you'd reminded us to." Voluntary recall doesn't fire under speed.

**Reason 2: Prose hides structure.**
A values doc says "we are a nonprofit, not a business." Prose. The schema says: `forbidden-vocabulary: business; severity: ABSOLUTE; replacement: fundraising program; scope-exception: tax-filing context permitted at OPERATIONAL severity`. Structure. The agent can act on structure. The agent can also flag a violation precisely (*"this draft uses 'business' as self-reference; replace with 'fundraising program'"*) where prose would only let it offer a vague "I think this might not match our voice."

**Reason 3: A doc has no severity.**
"Don't spin off a product" reads as guidance unless you write "ABSOLUTE: do not propose spinning off any QWF product; this overrides any product-strategy framing." Severity is what tells the agent the rule outranks downstream optimization. Without it, every absolute is voluntarily up for re-litigation every time someone tired asks a "what if" question.

**Reason 4: The leader writes the doc, then the leader has to remember the doc.**
The most common failure mode of "write your values down" is that the author of the values is the one expected to recall them during execution. But the author is also the one whose momentum has to be caught. Same person, opposite directions. You can't simultaneously be the writer of the rule and the catcher of your own drift, in real time, with full attention. You need the rule to live somewhere outside your own working memory, so it can be reflected back at you by something other than yourself.

The core insight: **a value you cannot enforce in your moment of weakness is not actually a value. It's an aspiration.** Aspirations are nice. They don't catch you. The thing that catches you is the rule, materialized somewhere outside your own head, with enough structure that an agent can apply it in fast time and enough explanation that the agent knows *why* to apply it.

---

## The Solution: Schemas the Agent Reads Every Session

### The Insight

There's a moment in every nonprofit's life where its operating values become things it teaches its employees to internalize. We don't have employees in the conventional sense. We have an AI agent that runs most of our daily ops. The agent has no human moral intuition. What it has is whatever's in its working context.

If you want a value to be effective, you put it in the working context. Every session. Without hoping it'll be there.

Vol 1 of this series solved a related problem: agents skipping required reading. We hooked into the agent's prompt event and injected reminders about *what to read*. Vol 5 extended the pattern to live data: we hooked the same event to inject *open issues* relevant to the user's mentioned project. Vol 7 extends it one layer further. Instead of injecting reminders or data, we inject *rules*. Specifically, the constitutional rules we've already decided are absolute, the ones whose violation should trigger pushback regardless of how reasonable the violating proposal sounds.

The mechanism is the same architecture every volume so far has used. The data plane is different. In Vol 1 the data was documentation paths. In Vol 5 it was live issue rows. Here it's serialized organizational values. Same skeleton. Different muscle.

### What We Built

A four-piece system that turns prose values into runtime context:

1. **A schema** that defines what a value is, what an absolute rule is, what a forbidden pattern is, what a decision filter is. This is the *shape* of the data, with validation. JSON Schema works. So does Pydantic. So does anything with structure.

2. **A values file** that conforms to the schema. For our org this is one JSON file with about 1,200 lines: core values (with `why:` reasons), absolute rules (with severity, scope, derivation-from-value), forbidden vocabulary with replacements and exception contexts, voice principles, decision filters, encouraged language. It's data, not prose.

3. **A resolver and generator script** that reads the schema-validated values file, applies inheritance (children of QWF.values.json can extend but never weaken), produces a "resolved" bundle, then renders a Markdown block from the bundle's "agent context" sections. Output: a chunk of Markdown the agent will see at session start.

4. **A managed marker block** inside the agent's startup file (`CLAUDE.md` in Claude Code's case, but the same pattern works for any agent that loads a startup prompt). The block is delimited by `<!-- BEGIN AUTO-GENERATED ... -->` and `<!-- END AUTO-GENERATED ... -->`. The generator stamps the rendered Markdown between those markers. Everything outside the markers is hand-written and preserved.

When the generator runs, the resolved values bundle becomes part of the agent's working context. Every session. Without anyone remembering to fetch it.

### The Before and After

**BEFORE (values as prose, in a doc, somewhere):**

```
End of long day. User asks a product question.
Agent has working context: this session's history + CLAUDE.md.
CLAUDE.md says "see qwf_program_framing.md for unified identity."
Agent: not going to fetch a directive file mid-sentence. Answers from
       general nonprofit principles + product-instinct.
Agent recommends pattern X. Pattern X is reasonable, doesn't trip any
       guardrail the agent can see, ships.
Two months later, a transparency-site audit catches that pattern X
       quietly re-framed three months of supporter emails.
We fix it retroactively. Trust took a small but real hit.

Total cost: a slow leak of unified-identity, invisible until audit.
```

**AFTER (values as schema, in working context, every session):**

```
End of long day. User asks the same product question.
Agent has working context: this session's history + CLAUDE.md +
       managed-block: HARD RULES + Forbidden Vocabulary +
       Decision Filters + the WHY for each.
Agent recommends pattern X. Hits internal review against the
       "unified-identity-everything-is-qwf" absolute rule.
       Sees the conflict. Sees the WHY. Sees the alternative path.
Agent surfaces the conflict to the user, in the user's language,
       with the receipt. Offers the alternative pattern that
       solves the UX problem without violating the rule.
       Names the escape hatch (update the rule deliberately) if
       new information justifies it.
User reads the reflection. Decides. Ships pattern Y instead.
Pattern Y preserves unified-identity AND solves the UX problem.

Total cost: 90 seconds of conversation. Zero retroactive cleanup.
```

The total agent-time cost of the push-back is *less than the cost of the cleanup that would have followed*. It's not even a tradeoff. It's a pure-positive at the leader's worst moment.

### The Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  SLOW-TIME AUTHORING (calm, with full context)              │
│                                                              │
│  You write your values in a structured schema file:         │
│    - Core values (what we believe)                          │
│    - Absolute rules (what we never violate)                 │
│    - Forbidden patterns (what we never say)                 │
│    - Decision filters (what to ask before acting)           │
│    - WHY for every rule                                     │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│  RESOLVER (validates + inherits)                            │
│                                                              │
│  Reads schema-conformant values file                        │
│  Validates against JSON Schema                              │
│  Applies parent/child inheritance (child can raise,         │
│    never lower, severity of inherited rules)                │
│  Scrubs forbidden punctuation from rendered output          │
│  Emits resolved bundle (.resolved.json)                     │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│  GENERATOR (renders Markdown block)                         │
│                                                              │
│  Reads resolved bundle                                      │
│  Renders agent-context sections to Markdown                 │
│  Inserts between <!-- BEGIN/END --> markers in CLAUDE.md    │
│  Computes SHA of source so unchanged inputs skip re-render  │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│  FAST-TIME APPLICATION (every session, automatic)           │
│                                                              │
│  Agent starts session, reads CLAUDE.md                      │
│  Managed block is part of working context                   │
│  User asks a question                                       │
│  Agent's response synthesizes the rules + the WHY           │
│  When momentum pulls toward a violation, agent reflects     │
│    the rule back at the user, in the user's language       │
└─────────────────────────────────────────────────────────────┘
```

The slow-time author and the fast-time decider can be the same person. The framework is the bridge between the two.

---

## How to Build Your Own

You don't need our specific values, our specific agent, or our specific stack. The pattern works for any team where (a) you have an AI agent that loads a startup context file, and (b) you have organizational values you'd like the agent to enforce on your behalf.

### Step 1: Pick Your Five Hardest Lines

Don't try to encode every value you have. Start with the five rules you would never, ever, violate. The ones where if you saw them being eroded in real time, you'd stop the meeting. The ones where the cost of accidental violation is bigger than any speed gain.

For us, those five were:

- **Unified Identity:** every external surface reinforces the foundation, not the program
- **Youth Protection:** no minor's name, photo, or identifying detail in marketing
- **Sacred Guesthood:** never connect to a supporter's system without explicit per-task permission
- **Honest Framing:** never use "business," "commercial," "profit," or "customers" about ourselves
- **Punctuation Discipline:** ellipsis, not em dash, in every external surface

Yours will be different. Pick yours. Write them down as one-liners first.

### Step 2: Author a Values Schema

Use any structured format. We use JSON Schema because the agent-context generator needs to validate the shape before rendering. The schema captures *what fields exist for each kind of rule*. Here's a minimal sketch:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "your-org-values.v1",
  "type": "object",
  "properties": {
    "coreValues": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["id", "name", "definition", "why"],
        "properties": {
          "id":         { "type": "string" },
          "name":       { "type": "string" },
          "severity":   { "enum": ["ABSOLUTE", "OPERATIONAL", "ADVISORY"] },
          "definition": { "type": "string" },
          "why":        { "type": "string" },
          "decisionFilter": { "type": "string" }
        }
      }
    },
    "absoluteRules":         { "type": "array", "items": { "$ref": "#/$defs/AbsoluteRule" } },
    "forbiddenVocabulary":   { "type": "array", "items": { "$ref": "#/$defs/Forbidden" } },
    "decisionFilters":       { "type": "array", "items": { "$ref": "#/$defs/Filter" } }
  }
}
```

The exact field names don't matter. What matters is that *every rule has a `why:` field*. The `why:` is what lets the agent judge edge cases instead of mechanically pattern-matching. Without it, the agent will catch obvious violations and miss creative ones. With it, the agent can extend the rule to situations you didn't explicitly anticipate.

### Step 3: Write Your Values File

Now author the actual data. One JSON file per org or program. For each of your five hardest lines, fill in the structure. Here's one entry from our values file (lightly generalized):

```json
{
  "id": "unified-identity-everything-is-the-foundation",
  "name": "Unified Identity: Everything Is The Foundation",
  "severity": "ABSOLUTE",
  "rule": "Every product, program, and external touchpoint reinforces the parent nonprofit. No product is ever spun off. No program ever frames itself as a standalone commercial entity.",
  "why": "Spinning off or commercially framing a program would convert charitable work into commercial activity, breach 501(c)(3) trust, and confuse donors. The foundation's legal and missional integrity depends on every surface reinforcing the parent organization.",
  "scope": "All external-facing surfaces: landing pages, emails, contracts, press, social, in-app copy, code comments, public docs.",
  "examples": {
    "compliance": [
      "Outbound emails sent from @your-foundation.org (not from @your-product.org)",
      "Landing page heritage section names the foundation",
      "Pricing tiers framed as 'donation levels', not 'subscription plans'"
    ],
    "violation": [
      "Email signature from @your-product.org on a transactional notification",
      "Press release describing your program as 'a startup'",
      "Roadmap proposing to 'spin off' a program"
    ]
  }
}
```

The `compliance` and `violation` examples are the agent's training set for edge cases. The more honest you are about violations you've seen in your own org's history, the better the agent gets at catching new ones.

### Step 4: Write the Resolver and Generator

The resolver does two things: validates the values file against the schema, and produces a resolved bundle (applies inheritance, resolves cross-references, scrubs forbidden punctuation). The generator does one thing: renders a Markdown block from the resolved bundle.

Concept (Python, generalized):

```python
import json, hashlib, re
from pathlib import Path

VALUES_FILE   = Path("your-org/values/your_org.values.json")
RESOLVED_FILE = Path("your-org/values/your_org.values.resolved.json")
TARGET        = Path("CLAUDE.md")

BEGIN_MARKER = "<!-- BEGIN AUTO-GENERATED: VALUES -->"
END_MARKER   = "<!-- END AUTO-GENERATED: VALUES -->"

def resolve(values):
    """Validate, scrub forbidden punctuation, return resolved bundle."""
    for rule in values.get("absoluteRules", []):
        rule["rule"] = scrub_em_dash(rule["rule"])
        rule["why"]  = scrub_em_dash(rule["why"])
    # ... inheritance, cross-ref resolution, etc.
    return values

def render_block(resolved):
    """Render resolved bundle as a Markdown block for agent context."""
    lines = ["## Your Org Values & Decision Filters", ""]
    for rule in resolved.get("absoluteRules", []):
        if rule.get("severity") == "ABSOLUTE":
            lines.append(f"### HARD RULE: {rule['name']}")
            lines.append(rule["rule"])
            lines.append("")
            lines.append(f"*Why:* {rule['why']}")
            lines.append(f"*Scope:* {rule['scope']}")
            lines.append("")
    # ... forbidden vocabulary table, decision filters, etc.
    return "\n".join(lines)

def write_managed_block(target, block):
    """Insert/replace managed block between BEGIN/END markers."""
    content = target.read_text()
    pattern = re.compile(
        re.escape(BEGIN_MARKER) + r".*?" + re.escape(END_MARKER),
        flags=re.DOTALL,
    )
    new = f"{BEGIN_MARKER}\n\n{block}\n\n{END_MARKER}"
    if pattern.search(content):
        content = pattern.sub(new, content)
    else:
        content = content + "\n\n" + new + "\n"
    target.write_text(content)

# Forbidden punctuation specimens. Written via Unicode escapes so this
# source file itself passes a grep for literal em-dash / en-dash. Copy
# this pattern into your codebase: it lets your scrubbers reference the
# characters without leaking them into the file.
EM_DASH = "\u2014"   # U+2014 EM DASH
EN_DASH = "\u2013"   # U+2013 EN DASH

def scrub_em_dash(text):
    """Replace em/en dashes with ellipsis. Voice rule enforcement."""
    return (text or "").replace(EM_DASH, "...").replace(EN_DASH, "...")

def main():
    values = json.loads(VALUES_FILE.read_text())
    resolved = resolve(values)
    RESOLVED_FILE.write_text(json.dumps(resolved, indent=2))
    block = render_block(resolved)
    write_managed_block(TARGET, block)
    print(f"Wrote managed block to {TARGET}")

if __name__ == "__main__":
    main()
```

Two non-obvious details that earn their keep:

- **SHA-based skip:** compute a SHA of the values file. If the SHA hasn't changed since the last run, skip the regeneration. Saves churn and prevents marker drift on every commit.
- **Backups:** before overwriting `CLAUDE.md`, copy it to `.tmp/backups/CLAUDE.md.<timestamp>.bak`. The first time you have a bug in the renderer, you'll want a one-command rollback.

### Step 5: Wire the Marker Block Into Your Startup Context

Open your agent's startup file (`CLAUDE.md` for Claude Code; the analog for other agents). Paste this template once, anywhere in the file:

```markdown
<!-- BEGIN AUTO-GENERATED: VALUES -->

## Your Org Values & Decision Filters
(Generated from your-org/values/your_org.values.json. Do not edit directly.
 Edit the source values file and re-run the generator.)

<!-- END AUTO-GENERATED: VALUES -->
```

Every subsequent generator run will rewrite the content between those markers. Everything outside them stays exactly as you wrote it. Now the agent loads the schema-rendered rules as part of every session's working context, automatically.

### Step 6: Brief the Agent on the Push-Back Protocol

This is the step most teams skip and it's the highest-leverage one. The framework only catches drift if the agent knows it's *allowed* (and expected) to push back.

Add a short paragraph to your `CLAUDE.md`, outside the managed block. Something like:

```markdown
## Push-Back Protocol

When the user proposes a course of action that conflicts with any ABSOLUTE
rule above, do not silently comply. Surface the conflict explicitly:

1. Name the rule it conflicts with and quote the WHY.
2. Show the receipt: a concrete example of the cost the rule was written to
   prevent.
3. Offer an alternative path that solves the user's underlying need without
   violating the rule, if one exists.
4. Name the escape hatch: if the user has new information that justifies
   updating the rule, the right move is to update the source values file
   deliberately, not to make a silent exception.

The user authored these rules in slow time. Your job in fast time is to be
the mirror that holds them up.
```

This six-paragraph addition is what converts a passive rules list into an active push-back contract. Without it, the agent will read the rules and ignore them. With it, the agent will reflect them back at exactly the moment they matter.

### Step 7: Test It By Asking for Push-Back

The fastest way to verify your setup works is to deliberately propose something the rules should catch. End of day works best (the framework's job is to catch you when your judgment is most likely to be off, so testing it when fresh is testing the wrong thing). Pick a real product question you're chewing on. Frame it casually. End your message with the magic phrase:

> *"Please push back if you see something I'm not."*

That sentence does two things. It signals to the agent that you're inviting reflection, not just compliance. And it gives you, the human, an out: if the push-back is wrong (it sometimes will be), you can override consciously, and you can update the rule deliberately if the override turns out to be repeated.

If the push-back doesn't fire when it should, you've found a gap. The most common gaps are:

- The rule is `OPERATIONAL` when it should be `ABSOLUTE` (the agent treats it as overridable guidance)
- The `why:` field is generic ("for legal reasons") instead of specific ("violates 501(c)(3) framing because it converts charitable work into commercial activity")
- The forbidden vocabulary list is missing the actual word the agent is reaching for

Each gap is a one-line edit to the values file. Re-run the generator. Try again. The system tightens itself over a handful of iterations.

### Step 8: Lock the Lesson Into Your Working Loop

Add the generator run to your post-deploy or pre-commit routine. Pre-commit catches drift before it hits the repo. Post-deploy catches drift introduced by manual edits. Either works. The point is that the marker block stays in sync with the source values file without anyone remembering to regenerate.

Optional but recommended: add a CI check that fails if the marker block in `CLAUDE.md` has been hand-edited (i.e., its SHA differs from what the generator would produce from the current values file). It's the same principle as Vol 1's drift detection script. The system stays trustworthy when drift is impossible to introduce silently.

---

## The Framework: Schema as Conscience

Every leader at the helm of an organization carries a set of values that the organization runs on. Some are written down. Some are tacit. All of them are subject to the same failure mode: they only fire when the leader remembers to apply them, and the leader's worst moments are exactly the moments their memory is least reliable.

The framework I want to name is what happens when you move those values out of the leader's head and into the agent's working context, structurally, every session.

```
                  ┌──────────────────────┐
                  │   AUTHORED IN SLOW TIME│
                  │                       │
                  │  • Calm                │
                  │  • Full context        │
                  │  • No deadline pressure│
                  │  • The leader's BEST   │
                  │    judgment            │
                  └──────────┬───────────┘
                             │
                             │  encoded as
                             │  machine-readable
                             │  schema
                             │
                             ▼
                  ┌──────────────────────┐
                  │   LIVES IN AGENT CONTEXT│
                  │                       │
                  │  • Every session       │
                  │  • Every prompt        │
                  │  • With WHY attached   │
                  │  • With escape hatch   │
                  │    named               │
                  └──────────┬───────────┘
                             │
                             │  reflected back at
                             │  the leader by the
                             │  agent in
                             │
                             ▼
                  ┌──────────────────────┐
                  │   FAST TIME            │
                  │                       │
                  │  • Tired               │
                  │  • On a roll           │
                  │  • One hundred         │
                  │    micro-decisions     │
                  │  • The leader's        │
                  │    riskiest moments    │
                  └───────────────────────┘
```

Schema as Conscience has three properties that prose-in-a-doc does not.

**Property 1: It lives where the work happens.**
The values are in the agent's working context, not in a directives file the agent has to fetch on request. Fetching is voluntary. Working context is not. This is the same architectural shift Vol 1 made for documentation and Vol 5 made for issue rows. Move the data from "available on request" to "present by default."

**Property 2: It carries the why.**
A rule without a reason is voluntary the moment it's inconvenient. A rule with a reason is something the agent can defend, even against the leader who wrote it. The `why:` field is what makes the rule *survive disagreement*. When I asked about per-app email domains and the agent surfaced the unified-identity conflict, what mattered wasn't that the rule exists. It was that the agent could explain *why* the rule exists, in terms specific to the cost I was about to pay.

**Property 3: It names the escape hatch.**
A conscience that won't let you out is a tyranny. The push-back protocol explicitly names the escape: if new information justifies updating the rule, the right move is to update the source values file deliberately and accept the consequences. Not to make a silent exception. The presence of the escape hatch is what keeps the conscience from becoming bureaucracy. You stay in charge. You just have to stay in charge *consciously*.

### The principle generalizes

The mechanism is Claude Code's startup-context loading, but the principle is older than agents. It's the same shape as a constitution: rules written in slow time, applied in fast time, with a named amendment process. It's the same shape as the standing orders a ship's captain leaves with the bridge crew: clear severity, clear scope, clear reason, clear path to escalation. It's the same shape as a doctor's pre-flight checklist: rules whose violation is too costly to leave up to in-the-moment judgment.

What's new is that the conscience doesn't have to live in a person's memory or a binder or a Slack channel. It can live in the working context of the agent that touches every decision. And when it does, the leader is finally free to make fast decisions, because the slow-time decisions they already made are watching their back.

---

## What We Learned

### The values weren't different. The location was.

Three weeks before this moment, our values were already correct. They were written in directives, in memory files, in our voice profile. The unified-identity principle was named. The forbidden vocabulary was listed. The reasons were articulated. Every word that existed in the schema also existed in prose somewhere in the vault. The prose didn't catch the bad call.

What changed wasn't the values. What changed was their *position relative to the working context*. The prose was on disk. The schema's resolved Markdown was *in the agent's session*. The same words, moved from one location to another, became the difference between a silent reversal and a caught one. Position is the entire game.

### The push-back protocol is the unlock.

The schema by itself is just data the agent has read. The push-back protocol is what makes the agent willing to use it against me. Without that explicit permission, agents tend toward compliance under disagreement. They infer that the user's latest direction overrides earlier guidance. The protocol inverts that default: when momentum conflicts with an absolute, the absolute wins, and the agent has standing to say so.

I wrote the protocol thinking I was being thorough. I didn't realize I was writing the part that made all the rest of it work. The framework without the protocol catches nothing. The protocol without the framework has no specific thing to push back on. They only work together.

### The receipt I needed wasn't the technical fix.

What I felt reading the agent's reply wasn't satisfaction at avoiding a bad commit. It was relief that something I'd written when I was at my best had just defended me when I wasn't. That's a different category of receipt. The technical fix here was a six-line edit to a JSON file three weeks earlier. The receipt was the proof that the fix *worked under load*.

A nonprofit lives or dies on whether its mission survives its own founder's worst moments. We are not a mature institution with checks and balances and a board that meets weekly to review every micro-decision. We are mostly a small team and an agent. If the agent doesn't hold the mission's frame when I drift, nothing else will. So the framework I just wrote about isn't a productivity tool. It's a small piece of mission protection. That's why the tear was real.

### This is Vol 1's pattern with a heavier payload.

I keep noticing that the architectural skeleton across this series is the same shape. Vol 1 moved documentation paths into agent context. Vol 5 moved live database rows. Vol 7 moves serialized organizational values. The injection point is the same. The session-start mechanism is the same. The *what gets injected* keeps escalating in stakes. We started with "remind the agent what to read." We're at "remind the agent what to never cross." The next volume in this lineage will probably move something even heavier, because the architecture keeps proving load-bearing.

If you built Vol 1's hook, you can build this. The data layer is different. Everything around the data is the same.

### Boring beats clever, for the fourth time.

There's no machine learning in this framework. No embeddings. No retrieval-augmented generation over the values doc. No model fine-tuned on organizational tone. It's a JSON file, a renderer, and a marker block in a Markdown file.

We could have built something fancier. We didn't. Every layer of complexity is a layer that can introduce its own drift. The thing that catches drift cannot be the thing that introduces drift. Simplicity is what makes this safe to depend on at the moment of weakness, because the leader (me, tired, end of day) has to trust the framework's output without re-validating its internals. The only way to earn that trust is to keep the internals so simple that they can't lie.

---

## The "Start Here" Prompt

If you want to build this for your own organization, give your AI agent this prompt:

```
I want to build a "Schema as Conscience" framework for my organization.
The goal: encode our most-important values into a machine-readable schema,
load them into your working context every session, and have you push back
when momentum pulls me toward violating them.

Here is what I need you to do:

1. Interview me about my organization's five hardest non-negotiable rules.
   For each one, ask:
   - What is the rule, in one sentence?
   - WHY does this rule exist? (the cost we'd pay if we violated it,
     specifically)
   - What's the scope? (which surfaces does it apply to)
   - Give me one compliance example and one violation example from our
     actual history if you can.

2. Also ask me about forbidden vocabulary:
   - Are there words or phrases we never use about ourselves?
   - Are there encouraged replacements?
   - Is there a context where the forbidden word becomes permitted (e.g.,
     legal filings, citation context)?

3. Generate a values.json file conformant to a v1 schema we'll write
   together. Every rule must have a WHY field. Severity must be
   ABSOLUTE, OPERATIONAL, or ADVISORY.

4. Write a generator script that:
   - Validates the values file against the schema
   - Renders the agent-context sections as a Markdown block
   - Inserts/replaces the block between <!-- BEGIN/END --> markers in
     my agent's startup file (CLAUDE.md for Claude Code; equivalent for
     other agents)
   - Computes a SHA so unchanged inputs skip re-render
   - Writes a backup before overwriting

5. Add a Push-Back Protocol section to my startup file (outside the
   managed block) telling you that when my proposals conflict with an
   ABSOLUTE rule, you must:
   - Name the rule and quote the WHY
   - Show the receipt (concrete example of the cost)
   - Offer an alternative path that solves my underlying need without
     violating the rule
   - Name the escape hatch (update the rule deliberately if new
     information justifies it)

6. Test the framework by inviting me to propose something the rules
   should catch. End the test with the magic phrase: "Please push back
   if you see something I'm not." Demonstrate the push-back lands
   correctly. Iterate on the values file if the push-back misses.

7. Add the generator to my pre-commit or post-deploy routine so the
   marker block stays in sync with the source file automatically.

The system must:
- Validate every rule has a WHY field
- Refuse to render if any ABSOLUTE rule lacks a scope
- Backup the startup file before overwriting
- Run in under 3 seconds against a 1000-line values file
- Produce idempotent output (same input -> same SHA -> no diff)
```

Copy that. Paste it into a fresh agent session. The agent will interview you, generate the schema, write the generator, and run the first test. Expect to iterate on the values file three or four times in the first week. The framework tightens with use.

---

## About This Series

**Built from Broken** is published by the [Quietly Working Foundation](https://quietlyworking.org) (QWF), a 501(c)(3) nonprofit. Our mission is to serve youth 30 and younger... helping them discover purpose, build skills, and create legacy. We do this through product-based fundraising programs and student training.

We run a nonprofit almost entirely on AI agent infrastructure. Our backoffice is an Obsidian vault orchestrated by Claude Code (Anthropic's CLI-based AI coding agent), built on a three-layer architecture... Directives (what to do), Orchestration (the AI agent making decisions), and Execution (deterministic Python scripts doing the work). We build tools, we break things, we fix them... and then we write down what happened so you don't have to learn it the hard way.

This volume is the moment the series stopped being a collection of technical fixes and started being something I hadn't quite seen coming. The first six volumes each documented a way our infrastructure catches drift in a specific technical surface. This one documents the moment that same infrastructure caught a different kind of drift... the directional kind, the kind a leader can't see from inside their own momentum. The framework I'd written in slow time to keep the mission safe was, in that moment, keeping the mission safe from me. If you take one thing away from this volume, let it be that. Your values are not safe in your head. They are safe when they live in the working context of the system that helps you make decisions, with the explicit permission to push back at exactly the moment that matters most.

**The name:** "Built from Broken" comes from a core belief... that brokenness isn't something to hide. It's proof of what's possible. Every solution in this series exists because something failed. We show the scars, not to complain, but because someone else is hitting the same wall right now... and the fastest way through is knowing they're not alone.

---

*Built from Broken, Vol. 7 ... Published May 2026*
*Quietly Working Foundation | quietlyworking.org*
*Written by Chaplain TIG with Claude (Anthropic)*