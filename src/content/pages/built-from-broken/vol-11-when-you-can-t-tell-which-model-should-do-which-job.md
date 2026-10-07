---
title: "Built from Broken: Vol. 11"
slug: "vol-11-when-you-can-t-tell-which-model-should-do-which-job"
pillar: "built-from-broken"
description: "Which Claude model, and which effort level, for which kind of work? We wrote rules, rewrote them three times in under two hours, and watched three more beliefs "
publishDate: "2026-10-07"
tags: ["QWF", "QWU", "built-from-broken", "claude-code", "model-selection", "effort-levels", "evaluation"]
series: "Built from Broken"
volume: 11
hook: "Three versions of our AI model rules in under two hours. Three more beliefs gone the next day. Most had a real source... answering a question we never asked it."
isHome: false
---
# Built from Broken: Vol. 11
## When You Can't Tell Which Model Should Do Which Job

> *Built from Broken is a series from the Quietly Working Foundation about real problems we face running AI-powered nonprofit operations... and the real solutions we build. Every fix exists because something failed first. We show the receipts.*

---

## The Problem: Every Source Was Right About Something Else

> "one of my greatest internal struggles has been understanding these models relative to our own internal usage, where they fit, how the effort levels map out for our specific work types"
>
> ... Chaplain TIG, October 7, 2026

On October 6, 2026, our written rules for which Claude model and which effort level to use went through **three versions in under two hours**. The next day, **three more beliefs** inside those rules turned out wrong, or only half right. Most had a real source behind them. One had no source at all, and it read exactly as confidently as the rest.

That is the shape of this volume. The sources were real. They were answering a different question than the one we were asking them.

### Two dials, every session

Every Claude Code session starts with two choices. The model: Opus 5.5, Fable 5.1, Sonnet 5.5, Haiku 5.5. And the effort level: low, medium, high, xhigh, max.

Anthropic's Claude Code team put the difference in one line in a [July 2026 post](https://claude.com/blog/claude-model-and-effort-level-in-claude-code): *"The model setting is roughly how capable; the effort setting is roughly how thorough."* Effort is more than thinking time. Per the same post, it *"controls how much work Claude does on your request overall"*... how many files it reads, how much it verifies, how far it pushes before it checks back in with you.

We run ten to fifteen Claude Code sessions at once, across two subscriptions (Vol 10 is the story of keeping both of them alive). Every one of those sessions makes both choices. Pick wrong and you either wait on thinking you didn't need, or clean up after thinking you didn't ask for. Fifteen windows, every working day.

And the defaults moved under us. Claude Code runs Opus 5.5 at **medium** effort out of the box. Opus 5 before it defaulted to high. Anthropic's [effort documentation](https://platform.claude.com/docs/en/build-with-claude/effort) says a request that leaves effort unset on Opus 5.5 *"runs one level lower than it did on Claude Opus 5"*.

So the question is real, and it never stops being asked. Which model, which effort, for which kind of our work?

### Day one: three versions in under two hours

On the evening of October 5, TIG asked for research: cost aside, which model is best for our development work, and what should our rules be? A session researched it from the model notes Anthropic ships inside Claude Code and wrote the rules into our Claude guide.

**Version 1, committed 1:17 PM Pacific on October 6,** said Anthropic had published no head-to-head comparison between Opus 5.5 and Fable 5.1. So, it reasoned, the line between them should follow supervision rather than difficulty.

**Version 2 landed twelve minutes later.** Fan-out verifiers had been checking an outside research report against about 35 live sources, and one of those sources was Anthropic's own [Opus 5.5 launch page](https://www.anthropic.com/claude-opus-5-5). Fable 5.1 is a column in every benchmark on it. Opus 5.5 beats Fable 5.1 on every row:

| Benchmark (Anthropic's launch table) | Opus 5.5 | Fable 5.1 |
|---|---|---|
| Terminal-Bench 4.0 | 66.4% | 55.8% |
| FrontierCode v1.1 | 54.4% | 50.3% |
| CursorBench 4.0 | 57.8% | 51.8% |
| GDPval-AA v2.1 | 1846 Elo | 1735 Elo |
| OSWorld 2.1 (partial) | 81.8% | 80.7% |

The miss was not a hallucination. It was true of the source it came from. Those bundled notes benchmark Opus 5.5 only against Opus 5. We let *"this page has no comparison"* quietly grow into *"no comparison exists."*

**Version 3 landed at 3:00 PM,** because TIG supplied the one thing no document could:

> "my time is my most valuable asset ... I'm almost always wanting the absolute highest quality output rather than the fastest or most economical."

That reshaped every rule. One model and one effort per kind of work, chosen up front, named with a reason. No "start low and raise it after a miss." That pattern bills every miss to the scarcest thing we have... a person's attention, at every approval gate.

And "highest quality" did not turn out to mean "max." Hold that thought.

### Day two: three beliefs fall in one session

**Belief 1: "Effort is fixed for the session."**

Our rules said "fixed for the session" as if it were a property of the tool. TIG pushed back:

> "since the last versions of Fable AND Opus, you can switch models AND effort levels with each new entry."

He was right about effort. Claude Code's [prompt-caching docs](https://code.claude.com/docs/en/prompt-caching): *"On Opus 5.5, Sonnet 5.5, Haiku 5.5, and Fable 5.1 with an API key or a Claude subscription, changing effort keeps the cache, and Claude Code applies the new level without asking."* On most other models, *"changing the effort level mid-session means the next request reads the entire conversation history with no cache hits."*

We didn't stop at the docs. Claude Code's transcripts record the effort level and the cache numbers on every response, so we counted. Counts only, never content. Inside the one-hour cache window (what a subscription's main conversation gets within the plan's included usage), as of October 7:

- **Opus 5.5 kept the cache on 34 of 34 effort changes.**
- **Fable 5.1 kept it on 15 of 15.**
- **Opus 5 lost it on 21 of 21.** The worst single loss pushed about 657 thousand tokens back through uncached.

After more than an hour idle, every change lost the cache on every model, because the cache had already expired.

One wrinkle made the logs worth their weight. At the raw API, Opus 5 *does* support the cache-keeping kind of effort change. Claude Code just doesn't use it on that model. The API docs describe what the model allows; the tool's docs describe what the tool does with it. Only your own logs show which one your sessions actually live in.

Model switches are a different animal: *"Each model has its own cache."* The four model switches we typed in the last nine days each re-sent the whole conversation uncached on the very next turn... roughly **98 thousand, 264 thousand, 484 thousand, and 557 thousand tokens.** Across every session we still have, the same count finds 38 model switches inside the cache window, typed or automatic. 37 lost the cache. One kept it, and we have not worked out why.

While we were in there, we found our own guide's list of which models get cache-friendly effort changes was wrong in two places. It named Opus 5, which loses the cache in Claude Code, and left out Opus 5.5, which keeps it.

**Belief 2: "max shows no reliable quality gain on code."**

That line sat in our guide. No Anthropic source says it. What Anthropic does say, in the effort documentation: `max` is *"Absolute maximum capability with no constraints on token spending."* And, in its guidance for an earlier Opus: *"On most workloads `max` adds significant cost for relatively small quality gains, and on some structured-output or less intelligence-sensitive tasks it can lead to overthinking."*

TIG looked at the launch charts and asked the question anyone would:

> "how come in every single chart ... the max effort level is always higher scoring than xhigh?"

So we read the charts point by point. The Opus 5.5 launch page plots Opus 5.5 at all five effort levels on six benchmarks. **Max is on top on four of them. Not six.**

| Opus 5.5 benchmark | low | medium (default) | high | xhigh | max |
|---|---|---|---|---|---|
| Terminal-Bench 4.0 | 38.5 | 57.6 | 64.2 | **66.4** | 64.8 |
| FrontierCode v1.1 | 47.3 | **54.6** | 54.0 | 51.4 | 54.4 |
| CursorBench 4.0 | 43.7 | 52.5 | 56.0 | 56.0 | **57.8** |
| GDPval-AA v2.1 (Elo) | 1224 | 1576 | 1692 | 1820 | **1846** |
| AutomationBench | 23.3 | 28.6 | 32.0 | 34.4 | **40.0** |
| WANDR | 31.2 | 62.8 | 67.3 | 71.3 | **72.3** |

*Scores read from the chart data on Anthropic's launch page, October 7, 2026. Five of the six charts carry at least one point we matched against the page's own table or captions.*

On Terminal-Bench, Opus 5.5's best score came at **xhigh**, 1.6 points above max... and Anthropic prints a standard error of ±2.6 points for that model on that benchmark. On FrontierCode, the **default** edged max by 0.2. TIG had also remembered seeing a chart where xhigh beat max. That memory was right, on Anthropic's own page.

The reconciliation is the part worth keeping:

1. **A benchmark is made of hard tasks.** That is exactly where extra thinking pays. The overthinking warning is about easy, structured steps... which benchmarks barely contain and real sessions are full of.
2. **A chart shows the score and hides the wait.** Anthropic's notes for an earlier Opus reserve `max` for *"extremely hard, latency-insensitive cases."*
3. **Launch tables run at the ceiling on purpose.** *"Unless otherwise noted, all Claude Opus 5.5 results use adaptive thinking at max effort."* The level you get by default in Claude Code is medium.
4. **The biggest step is low to medium, on all six charts. Above medium, it depends on the benchmark.** On Terminal-Bench, medium to high is worth 6.6 points and xhigh to max is worth minus 1.6. On FrontierCode, nothing above medium beats medium. On GDPval, high to xhigh is the biggest of the upper steps. Near the top, most gaps are small enough to flip. The exception is AutomationBench, where xhigh to max is worth **5.6 points**, the largest top-of-dial gain on the page (with no error bar printed). That is one kind of work... and no chart can tell you whether your work is that kind.

The charts were right. The notes were right. Our one-line summary of them was wrong.

**Belief 3: "Fable goes quiet, and our terse reporting style makes it worse."**

Our sessions report in a deliberately terse style: no narration, no decoration. Anthropic's Fable 5.1 notes say that is exactly the kind of language to remove. Fable 5.1 *"writes fewer user-facing updates during long tool-calling turns than Claude Fable 5 ... Users see the agent go quiet for minutes, or a final message that describes only the last step..."* And: *"If the prompt contains anti-formatting language, remove it..."*

Half true.

Claude Code adds its own short reminder when a session has gone quiet across several tool calls (the same pattern Anthropic's notes describe for this exact problem). We counted how often it fired, per 100 main-conversation requests, in every session from September 3, when the reminder first appeared in our logs, through October 7. Each session counts toward the model it mostly ran on.

- **Opus 5.5:** about 10 (490 in 4,601)
- **Fable 5.1:** about 8 (477 in 5,837)
- **Opus 5:** almost never (11 in 4,855)

Different weeks, different work, so this shows that both current models go quiet under our style, not which one is quieter. What stayed Fable-specific, straight from the notes: a final message that can cover only the last step, and prose that runs denser, with *"longer sentences, fewer paragraph breaks."* On an unattended Fable run, that last message is the only thing anyone reads. So our reporting style gained a short section that only Fable follows: the summary covers the whole run, plain beats dense, and one line before any long stretch of work.

### The instrument that lied

When a new model ships, a release watch now reads Anthropic's pages for us (more on it below). On its first live run, for Sonnet 5.5 on October 6, its probe of our own call path reported that the model **"does not reason by default."**

Wrong. The probe's test prompt was a trick question that adaptive thinking judged too easy to bother thinking about. Nothing reasoned, and the probe read "nothing reasoned" as "it can't reason unless asked." The fix was a harder prompt and a new rule: a probe that cannot see the difference says **INCONCLUSIVE** instead of guessing. Re-run: thinking on by default, exactly as Anthropic's docs say.

Same lesson, smaller box. An instrument answered a question it couldn't see.

### Why the Obvious Fixes Don't Work

**"Just turn everything to max."** On a long deliverable above high, Anthropic's notes say Fable 5.1 *"may draft much of it in its thinking and then write it out again as the reply: a longer wait and roughly double the output tokens."* Opus 5.5 *"tends to think more per turn than Claude Opus 5, especially at `xhigh` and `max`."* Every one of those longer turns is a gate a person waits at. And max wasn't even on top on two of six charts.

**"Just use the defaults."** Anthropic's own advice, and good advice for most people: *"Our guidance is that for most tasks you should use the model's default effort level."* The same post says to treat effort *"more as a general preference than a task-by-task decision,"* and, when a result misses, to ask *"did it not try hard enough, or did it not know enough?"* and adjust. We agree with most of that. Our map is exactly a general preference by kind of work. Where we part ways is the starting point. For work a person is watching, we start above the default, so a miss is never the signal that raises it. That is a bet, not a measurement. (That post is dated July 7, 2026, before Opus 5.5 shipped.)

**"Just read the benchmarks."** Anthropic, on its own launch page: *"at these levels of capability we've found that benchmark margins have become a less reliable guide to real-world differences. In our own use, the gap between Opus 5.5 and Claude Fable 5.1 is narrower than these scores suggest."* When the vendor tells you its own margins are a weak guide, believe it.

**"Just ask the model."** A model knows the world as of its training. Anthropic's notes say Fable 5.1 at low effort *"answers from memory more"*, most visibly *"for named products, models, and tools it recognizes but has out-of-date knowledge of."* Which model should I use is precisely that kind of question.

**"Just test it ourselves."** Yes. That is the answer. We designed a blind evaluation harness in July 2026 and ratified its statistical bar on July 8. **It is not built.** The release watch's own status table says so in one word: the part that measures our work is *Planned*. We had been writing rules as if it existed.

### The insight

Each source answers exactly one question.

- **The vendor's charts:** how good can it get?
- **The vendor's notes:** what does it cost you to get there... in time, tokens, and behavior?
- **Your own logs:** what actually happened in your sessions?
- **Your own eval:** how good is it at *your* work?

We had the first three. We had been writing rules as if we had the fourth.

---

## The Solution: A Map That Says What It Knows

We didn't build one big new thing. We changed three things and named the fourth.

1. **Every row of the map carries its evidence**, and says plainly whether it has been measured on our own work.
2. **A release watch** re-reads the same Anthropic pages every time a model ships and refuses any quote it cannot find, word for word, on the page it came from.
3. **Log probes** answer mechanics questions (does the cache survive, how often does a session go quiet) from our own transcripts, counts only.
4. **The blind eval**, the only instrument that can answer "how good at our work," is named as the missing piece, with its first experiments already written down.

### The map

| Kind of work | Model | Effort | The evidence behind the row | Measured on our work? |
|---|---|---|---|---|
| Consequential work with a person watching: security, schema, production, anything with a safety boundary | Opus 5.5 | xhigh | Vendor charts (xhigh tops Terminal-Bench, where medium to xhigh is worth 8.8 points; on FrontierCode it is the lowest of the upper four levels). Our constraint (a wrong turn costs a day; no try-then-escalate). Against it: Opus 5.5's own notes say to "reserve `xhigh` and `max` for work where you have measured a quality gain"... and we have not | **No** |
| Routine attended work: writing, docs, small bounded code changes | Opus 5.5 | high | Vendor charts (medium to high gains on five of six). Vendor notes (Opus 5.5 thinks longer per turn at xhigh and max; Fable 5.1's notes say long deliverables get drafted twice above high, which we apply to Opus untested). Our constraint | **No.** Written down as one of the first experiments: high vs xhigh, all else held |
| A genuinely extreme, latency-insensitive reasoning problem, named as such up front | Opus 5.5 | max | Vendor docs ("absolute maximum capability"). Vendor notes for an earlier Opus (reserve it for "extremely hard, latency-insensitive cases"). Vendor charts (max on top on four of six) | **No** |
| Long runs nobody is watching | Fable 5.1 | high | Vendor docs (start at high, the default). Vendor notes (Fable 5.1 is the step up for "the hardest long-running agentic and research tasks," while Opus 5.5 is the default for most work). Our constraint (quiet minutes cost nothing when nobody is waiting) | **No** |
| Anything visual: charts, screenshots, UI, diagrams | Opus 5.5 | match the work | Vendor notes (at low, reads charts better than Opus 5 at its highest) | **No** |
| Code review | Opus 5.5 | match the work under review; ask for every finding with confidence and severity | Vendor notes for Opus 4.7 through Opus 5 (a "high-severity only" review prompt is followed literally and lowers how many real bugs get reported), carried to Opus 5.5 untested | **No** |
| Changing effort mid-session | Opus 5.5 or Fable 5.1 | lower freely; for a big raise, start there | Vendor docs **and our logs** (34 of 34, 15 of 15 kept; Opus 5: 0 of 21) | **Yes** (mechanics, not quality) |
| Switching model mid-session | any | switch at a boundary, ideally the start | Vendor docs **and our logs** (37 of 38 switches inside the window fully uncached, including all four we typed) | **Yes** (mechanics) |
| A session going quiet | Opus 5.5 and Fable 5.1 alike | the harness reminder covers it; Fable gets a whole-run summary rule | **Our logs** (about 10 and 8 per 100) plus vendor notes | **Yes** (frequency, not effect) |

Read the last column. **Six of nine rows have never been measured on our own work.** That is not a hole in the map. That is the map telling the truth... and it tells us exactly which experiment to run first.

Every recommendation any of our sessions makes now names its model and effort with a one-clause reason, so the person deciding never has to ask.

### Using the map mid-session

Because effort changes are free between entries on Opus 5.5 and Fable 5.1, "fixed for the session" became "set for the work." Choose the level before each stretch of work. Change it when the kind of work changes.

Two cautions. The Claude Code client we run carries the API's per-message effort beta header, so we read its cache-keeping change as that feature. Anthropic's notes for it (written for Fable 5.1) say: *"Lowering effort this way is reliable; raising works best for large jumps (e.g. `low` to `xhigh`)."* So if a stretch needs xhigh, start the session there rather than nudging up one notch. And per Claude Code's own docs, *"Claude Code applies `max` to the current session only"* unless you set it through an environment variable.

Model switches almost always cost one slow turn. Keep the model for the whole session and switch only at a natural boundary. The cheapest boundary is the start, while the conversation is still short. Anthropic's own tip agrees: *"Pick your model and effort level at the top of a session..."*

### The Before and After

The same task, twice: **a new model ships, and we need to know what it changes for us.**

**Before** (Opus 5.5 and Fable 5.1, by hand):

```
Oct 5, evening   TIG asks which model and effort our sessions should use.
                 A session researches it by hand from the notes bundled
                 with Claude Code.
Oct 6, 13:17     Rules v1 written down: "no head-to-head exists." Committed.
     13:28       Rules v2: Anthropic's launch page had one all along.
     15:00       Rules v3: TIG's constraint arrives. Rewritten again.
Oct 7            Three more beliefs fall in one session.
```

**After** (Haiku 5.5, by machine):

```
Oct 7            Haiku 5.5 is released.
     12:23       A card exists. Ten Anthropic pages read. 82 quotes, every
                 one found word for word on its own page. A probe of our
                 own call path. Five decisions drafted and parked on TIG's
                 calendar for the next morning.
Next morning     Five questions, one word each. Nothing changes without
                 his answer.
```

The machine doesn't decide. It reads the same pages every time, refuses to trust a quote it can't find, and puts the decision in front of the person at a time he chose.

### The Architecture

```
  Anthropic's pages          Our transcripts           Our real tasks
  (charts, notes, docs)      (counts only)             (frozen, versioned)
         |                          |                          |
         v                          v                          v
 +------------------+     +------------------+     +----------------------+
 | RELEASE WATCH    |     | LOG PROBES       |     | BLIND PAIRWISE EVAL  |
 | every 3 hours    |     | read-only        |     | statistics ratified  |
 | card: every quote|     | effort, switches,|     | July 2026            |
 | checked word for |     | quiet sessions   |     | NOT BUILT YET        |
 | word, plus probe |     |                  |     |                      |
 +--------+---------+     +--------+---------+     +----------+-----------+
          |                        |                          |
   how good can it get?     what actually            how good is it at
   what does it cost?       happened?                OUR work?
          |                        |                          |
          +------------+-----------+--------------------------+
                       |
                       v
          +---------------------------+
          | THE MAP                   |
          | kind of work -> model +   |
          | effort, every row labeled |
          | with the evidence behind  |
          | it and "measured on our   |
          | work: yes / no"           |
          +-------------+-------------+
                        |
                        v
          one model + one effort, chosen up front,
          named with a reason in every recommendation
```

---

## How to Build Your Own

Everything below is environment-agnostic. Swap the placeholders for your own. Every script ran on our machine before it went into this article. We assume Claude Code; the shape ports to any agent that writes transcripts.

### Step 1: Write your constraint in one sentence

Before any rule, write down what your rules are optimizing for. Ours is one person's time and the highest quality output. Yours might be a monthly budget, a latency target, or a team's review capacity. Every rule you write afterward should be explainable as "given that constraint, this."

**Why:** without it, every rule is a vibe, and you will rewrite it every time someone with a different unstated constraint reads it. Our version 3 was the first version with the constraint written down. The constraint has held since, even while the rules under it kept moving.

### Step 2: Ask your logs before you write a rule about mechanics

If a rule is about how the tool behaves (does the cache survive an effort change, does a model switch cost anything), your own transcripts can answer it. This script reads Claude Code's transcripts and prints counts and token numbers only. Transcripts can hold anything you ever typed, so it never prints content, and neither should anything you build on it.

```python
#!/usr/bin/env python3
# effort_cache_check.py ... did your mid-session effort and model changes keep the prompt cache?
# Read-only. Prints counts and token numbers only, never message content.
#   python3 effort_cache_check.py                       every project under ~/.claude/projects
#   python3 effort_cache_check.py "~/.claude/projects/<your-project>/*.jsonl"
import collections, glob, json, os, sys
from datetime import datetime

PATTERN = sys.argv[1] if len(sys.argv) > 1 else "~/.claude/projects/*/*.jsonl"
CACHE_WINDOW_S = 3600   # one hour: a subscription's main conversation within plan usage. API key: 300, unless promptCacheTtl is 1h
KEPT_SHARE = 0.5        # "kept" = the next request read at least half of the previous prefix from cache


def when(stamp):
    try:
        return datetime.fromisoformat(stamp.replace("Z", "+00:00"))
    except (AttributeError, ValueError):
        return None


def responses(path):
    """One record per main-conversation API response: model, effort, cache read and write, time."""
    seen = set()
    with open(path, encoding="utf-8", errors="replace") as f:
        for line in f:
            if '"assistant"' not in line:
                continue
            try:
                ev = json.loads(line)
            except json.JSONDecodeError:
                continue
            if ev.get("type") != "assistant" or ev.get("isSidechain"):
                continue                                  # sub-agent traffic has its own cache
            msg = ev.get("message") or {}
            mid, model = msg.get("id"), msg.get("model")
            if not model or model == "<synthetic>" or mid in seen:
                continue                                  # one response can span several lines
            seen.add(mid)
            usage = msg.get("usage") or {}
            yield {"model": model,
                   "effort": ev.get("effort"),            # recorded per response by recent Claude Code builds
                   "read": usage.get("cache_read_input_tokens") or 0,
                   "write": usage.get("cache_creation_input_tokens") or 0,
                   "t": when(ev.get("timestamp"))}


tally, biggest = collections.Counter(), collections.Counter()
files = glob.glob(os.path.expanduser(PATTERN))
for path in files:
    prev = None
    for cur in responses(path):
        if prev and cur["t"] and prev["t"]:
            if cur["model"] != prev["model"]:
                change = ("model switch", f'{prev["model"]} -> {cur["model"]}')
            elif cur["effort"] and prev["effort"] and cur["effort"] != prev["effort"]:
                change = ("effort change", cur["model"])
            else:
                change = None
            if change:
                warm = (cur["t"] - prev["t"]).total_seconds() < CACHE_WINDOW_S
                kept = cur["read"] >= KEPT_SHARE * (prev["read"] + prev["write"])
                key = (*change, "inside window" if warm else "after idle", "kept" if kept else "LOST")
                tally[key] += 1
                if not kept:
                    biggest[key] = max(biggest[key], cur["write"])
        prev = cur

print(f"{len(files)} transcripts read")
for key in sorted(tally):
    note = f"   largest uncached re-send {biggest[key]:,} tokens" if biggest[key] else ""
    print(f"{key[0]:13} | {key[1]:42} | {key[2]:13} | {key[3]:4} x{tally[key]}{note}")
```

How to read it:

- **"effort change ... inside window ... kept"** is the good row. On Opus 5.5, Sonnet 5.5, Haiku 5.5 or Fable 5.1 (Fable from Claude Code 2.1.260), you should see only that... **if `CACHE_WINDOW_S` matches your real cache lifetime.** A subscription's main conversation gets an hour within the plan's included usage. Past the plan, or on an API key without `promptCacheTtl` set to `1h`, it gets five minutes. Set 300 there, or ordinary expiry will look like a broken cache.
- **"effort change ... inside window ... LOST"** on a current model means something is turning the cache-keeping path off for you: a cloud provider, a gateway, or the experimental-betas-off setting. Claude Code's prompt-caching page lists every exception.
- **"after idle ... LOST"** is expected everywhere. The cache had already expired.
- **"model switch"** rows count every switch, typed or not. Anything that changes the model for a turn (a skill that names its own model, an automatic fallback) is a switch, and Claude Code's docs say so.
- If you see no effort rows at all, your build may not record effort on each response. Open one transcript line by hand before you trust an empty result. Nothing looks exactly like "no changes."

**Why a script and not the docs:** in our case the API docs said one thing about Opus 5 and the tool did another. The docs tell you what is possible. Your logs tell you what your setup actually does.

### Step 3: Read a launch chart the way it was made

Before a vendor chart goes anywhere near a rule, collect four things from it:

1. **Every effort point, not just the headline.** Many launch pages draw one dot per effort level. Hover them, or read the page's accessible chart labels. A table row hides the curve; the curve is the information.
2. **The run conditions.** Look for the footnotes. Ours said results ran at max *"unless otherwise noted."* One benchmark ran at a different effort, and other footnotes changed how several more were run.
3. **The error bar.** If the gap between two levels is smaller than the printed standard error, the chart has not ranked them.
4. **The shipped default.** If the table ran at the ceiling and your tool defaults two notches down, the table is not describing the thing you will actually use.

Then write the row you are tempted to write, and label it **"vendor charts: how good can it get."** That label stops the row from pretending to be something else.

### Step 4: Write the map with an evidence column

A template you can copy. Fill it in honestly, especially the last column.

```markdown
# Session rules: which model, which effort

**Our constraint (one sentence):** <what these rules optimize, in your own words>

| Kind of work | Model | Effort | Evidence behind the row | Measured on OUR work? |
|---|---|---|---|---|
| <consequential, watched> | <model> | <level> | <vendor charts / vendor notes / our logs / our constraint> | <yes, with the experiment / no> |
| <routine, watched> | <model> | <level> | <...> | <...> |
| <long, unwatched> | <model> | <level> | <...> | <...> |
| <visual> | <model> | <level> | <...> | <...> |

**Mechanics (from our logs):**
- Changing effort mid-session: <keeps the cache? on which models? with what caveat?>
- Switching model mid-session: <what it costs; when we allow it>

**Every recommendation names a model and an effort, with a one-clause reason.**

**Re-decide when:** a new model ships (the release watch fires), or an eval result lands.
**First experiment to run:** <the "no" row you lean on most, one variable changed>
```

**Why the last column matters most:** a row with a vendor quote next to it looks exactly as authoritative as a row you measured. Only the column tells them apart. We had a "max shows no gain" row with no source at all, and it read just as confidently as the rest.

### Step 5: Watch for releases, and verify every quote

A new model is a predictable event. Treat it like one. The pattern:

1. **Detect.** Poll the vendor's model list on a schedule and report any ID you have never seen.
2. **Read a fixed set of pages, every time.** The model overview, the models table, the migration guide, the what's-new page, the prompting guide, the choosing-a-model page, the effort page, the release notes that name the model, your agent tool's model-config page, and the launch post. The same list every time is the point. Save what you read, with the date.
3. **Extract facts with a quote attached**, and only with a quote attached. Have a strong model propose each fact plus the verbatim sentence it rests on and which page it came from.
4. **Verify every quote deterministically.** A script, not a model, checks that each quote appears on its page. A paraphrase cannot pass, and a fragment too short to mean anything is refused.
5. **Probe your own call path**, and make the probe say INCONCLUSIVE when it cannot see the difference it is testing.
6. **Draft a short list of decisions** (ours are five: script tiers, session rules, effort, silent changes, and how the model works with the person) and put them in front of the person at a time they chose. Nothing changes without a human answer.

The detector, against Anthropic's Models API:

```python
#!/usr/bin/env python3
# watch_models.py ... run from cron every few hours. Reports any Claude model ID it has never seen.
# The first run records what exists today and reports nothing.
import json, os, sys, urllib.request
from pathlib import Path

STATE = Path(os.path.expanduser("~/your_state_dir/seen_models.json"))
URL = "https://api.anthropic.com/v1/models?limit=1000"


def live_ids():
    ids, after = [], None
    while True:
        url = URL + (f"&after_id={after}" if after else "")
        req = urllib.request.Request(url, headers={
            "anthropic-version": "2023-06-01",
            "x-api-key": os.environ["ANTHROPIC_API_KEY"]})
        with urllib.request.urlopen(req, timeout=30) as r:
            page = json.loads(r.read())
        if not isinstance(page.get("data"), list):
            raise RuntimeError("models list has no data[] ... endpoint changed?")   # fail loud
        ids += [m["id"] for m in page["data"]]
        if not page.get("has_more"):
            return ids
        after = page.get("last_id")


seen = set(json.loads(STATE.read_text())) if STATE.exists() else None
now = set(live_ids())
if seen is None:
    print(f"baseline: {len(now)} models recorded, nothing to report")
else:
    for model_id in sorted(now - seen):
        print(f"NEW MODEL: {model_id}")      # hand this to step 2: build its card
STATE.parent.mkdir(parents=True, exist_ok=True)
STATE.write_text(json.dumps(sorted(now | (seen or set())), indent=2))
```

The quote checker, which is the heart of the whole pattern:

```python
#!/usr/bin/env python3
# verify_quote.py ... does this quote appear, word for word, on the page it claims to come from?
#   python3 verify_quote.py page.md "the exact quote ... with an elided middle"
import re, sys

FOLD = {"\u2018": "'", "\u2019": "'", "\u201c": '"', "\u201d": '"', "\u2013": "-", "\u2014": "-",
        "\u00a0": " ", "\u2026": "..."}
MIN_WORDS = 4   # per fragment: "the" or "64.8" appears on almost any page, so it proves nothing


def fold(text):
    """Ignore what formatting changes, keep what words say: case, curly quotes, links, markdown marks, spacing."""
    for a, b in FOLD.items():
        text = text.replace(a, b)
    text = re.sub(r"\[([^\]]*)\]\([^)]*\)", r"\1", text)       # [link text](url) -> link text
    text = re.sub(r"[*_`|]", "", text)
    return re.sub(r"\s+", " ", text).strip().lower()


def verified(quote, page):
    """True only if every fragment of the quote appears in the page, in order, and no fragment is too
    short to mean anything. A '...' in the quote marks an elision. Quote a table row whole, not one cell."""
    body, at = fold(page), 0
    fragments = [f.strip() for f in fold(quote).split("...") if f.strip()]
    if not fragments or any(len(f.split()) < MIN_WORDS for f in fragments):
        return False
    for frag in fragments:
        at = body.find(frag, at)
        if at < 0:
            return False
        at += len(frag)
    return True


if __name__ == "__main__":
    page = open(sys.argv[1], encoding="utf-8").read()
    ok = verified(sys.argv[2], page)
    print("VERIFIED" if ok else "UNVERIFIED")
    sys.exit(0 if ok else 1)
```

Anthropic publishes a Markdown copy of each docs page (add `.md` to the URL), which makes step 2 a plain download. We ran this checker against the live effort page: the real sentence about `max` passed, with and without an elided middle. The line our guide used to carry (*"max shows no reliable quality gain on code"*) failed, as it should.

**Why a script checks the quotes and not a model:** a model asked "is this on the page?" can agree with you. A string search cannot. The minimum fragment size is there because "the" or a bare "66.4" appears somewhere on almost any page; quote a whole table row instead, so every number is checked in order. Links are folded to their text because docs pages wrap terms in links, and a true quote should not fail on markup. (Our first version of this checker passed `"max ... is ... the default"` and failed a true quote with a link in it. The fact-checker on this article caught both.)

### Step 6: Build the one instrument that answers your question

Only your own eval answers "how good is it at my work." The smallest honest version: a blind pairwise comparison of two settings on 10 to 20 of your own real tasks, with exactly one thing changed.

First, produce both sets of answers. Same requests, fresh sessions, one variable:

```bash
# One request per file in tasks/. Condition A = your current rule. Condition B = one change.
claude --version     # a client older than the model refuses it; update first
mkdir -p outputs_a outputs_b
for t in tasks/*.md; do
  id=$(basename "$t" .md)
  claude -p "$(cat "$t")" --model your-model --effort high  < /dev/null > "outputs_a/$id.md" \
    || { echo "A failed on $id"; exit 1; }
  claude -p "$(cat "$t")" --model your-model --effort xhigh < /dev/null > "outputs_b/$id.md" \
    || { echo "B failed on $id"; exit 1; }
done
```

Then judge them blind:

```python
#!/usr/bin/env python3
# pairwise_eval.py ... a blind pairwise comparison of two settings on YOUR OWN tasks.
#   tasks/<id>.md       the request, exactly as you gave it (10 to 20 real ones)
#   outputs_a/<id>.md   the answer under your current rule  (e.g. Opus at high)
#   outputs_b/<id>.md   the answer with ONE thing changed     (e.g. Opus at xhigh)
#   python3 pairwise_eval.py --dry-run   coin-flip judge: checks the plumbing, costs nothing
#   python3 pairwise_eval.py             real judge (needs ANTHROPIC_API_KEY and `pip install anthropic`)
import argparse, csv, json, random, re, statistics
from pathlib import Path

JUDGE_MODEL = "your-judge-model"      # a strong model; if you can, not the one under test
JUDGE_EFFORT = "high"
MAX_FAILED_SHARE = 0.1                # more failed judgments than this and the run proves nothing
RUBRIC = ("Judge which answer does the task better: correct, complete, follows every instruction, "
          "and fits this house voice: <one paragraph of your voice and hard rules>.")
PROMPT = """{rubric}

TASK:
{task}

ANSWER 1:
{one}

ANSWER 2:
{two}

Reply with JSON only: {{"winner": "1" or "2" or "tie", "why": "<one sentence>"}}"""


def judge(task, one, two, dry_run):
    """Returns "1", "2" or "tie", or None when the judge refused or its reply could not be read.
    Setup errors (no SDK, no key, a rejected parameter) are NOT caught: they stop the run, loudly."""
    if dry_run:
        return random.choice(["1", "2", "tie"])
    import anthropic
    msg = anthropic.Anthropic().messages.create(
        model=JUDGE_MODEL, max_tokens=16000, output_config={"effort": JUDGE_EFFORT},
        messages=[{"role": "user", "content": PROMPT.format(rubric=RUBRIC, task=task, one=one, two=two)}])
    if msg.stop_reason == "refusal":
        return None
    text = "".join(b.text for b in msg.content if b.type == "text")
    found = re.search(r"\{.*\}", text, re.S)
    try:
        winner = str(json.loads(found.group(0)).get("winner")) if found else None
    except json.JSONDecodeError:
        return None
    return winner if winner in ("1", "2", "tie") else None


def score_for_b(verdict, b_slot):
    """1 if B won, 0.5 for a tie, 0 if A won. A failed judgment counts against B: a change never wins by error."""
    if verdict is None:
        return 0.0
    return 0.5 if verdict == "tie" else float(verdict == b_slot)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--dry-run", action="store_true")
    args = ap.parse_args()
    rows, scores, failed = [], [], 0
    for task_file in sorted(Path("tasks").glob("*.md")):
        tid = task_file.stem
        task = task_file.read_text()
        a, b = Path("outputs_a", f"{tid}.md").read_text(), Path("outputs_b", f"{tid}.md").read_text()
        # Judge twice, swapping positions, so a judge that favors "the first one" cancels itself out.
        v1, v2 = judge(task, a, b, args.dry_run), judge(task, b, a, args.dry_run)
        failed += (v1 is None) + (v2 is None)
        scores.append((score_for_b(v1, "2") + score_for_b(v2, "1")) / 2)
        # A blind page for YOUR calibration pass: random order, the key kept in a separate file.
        b_slot = random.choice(["1", "2"])
        one, two = (b, a) if b_slot == "1" else (a, b)
        Path("calibration").mkdir(exist_ok=True)
        Path("calibration", f"{tid}.md").write_text(f"TASK:\n{task}\n\nANSWER 1:\n{one}\n\nANSWER 2:\n{two}\n")
        rows.append({"task": tid, "b_is_answer": b_slot, "judge_score_for_b": scores[-1]})
    if not scores:
        raise SystemExit("no tasks found in tasks/")
    print(f"{failed} of {2 * len(scores)} judgments failed (refused or unreadable) and counted against B.")
    if failed > MAX_FAILED_SHARE * 2 * len(scores):
        raise SystemExit("Too many failed judgments to trust this run. Fix the judge, then run it again.")
    # Bootstrap over tasks: how sure are we, given only this many?
    boots = sorted(statistics.mean(random.choices(scores, k=len(scores))) for _ in range(5000))
    lo, hi = boots[int(0.025 * len(boots))], boots[int(0.975 * len(boots))]
    print(f"{len(scores)} tasks. B's win rate {statistics.mean(scores):.0%} (95% interval {lo:.0%} to {hi:.0%}).")
    print("If that interval includes 50%, you have not shown a difference. Keep your current rule.")
    with open("calibration_key.csv", "w", newline="") as f:     # do not open this until you have judged
        writer = csv.DictWriter(f, fieldnames=list(rows[0]))
        writer.writeheader()
        writer.writerows(rows)
    print("Now judge calibration/*.md yourself, blind, then compare with calibration_key.csv.")


if __name__ == "__main__":
    main()
```

The design rules, each one a scar from somewhere:

- **One variable.** Same model, same requests, same tools, only effort changed (or only the model). Change two things and you learn nothing about either.
- **Real tasks, frozen.** Pull them from your actual work, across the kinds of work your map names, and do not edit them once a run starts.
- **Swap positions.** Judges like whichever answer comes first, or second. Judging each pair both ways cancels that.
- **Failures count against the change.** A refused or unparseable judgment never helps B. A change has to win on the merits.
- **Calibrate the judge against yourself first.** Judge 15 to 20 of the blind calibration pages yourself before you trust the machine at scale. If the judge disagrees with you materially, the judge is what needs fixing.
- **Respect the interval.** With 10 to 20 tasks, the interval will be wide. If it includes 50%, you have not shown a difference, and your current rule stands.
- **A small run is a screen, not a verdict.** It can drop a bad idea or earn a bigger test. Our own ratified bar for actually changing a rule is far larger: dozens of tasks, repeated runs, two judges, and a person to break ties.

**Why this is the step that matters:** every other step reads someone else's measurement or your own mechanics. This is the only one that looks at the output you actually care about.

### Step 7: Wire it and test it

```
# Cron runs with almost no environment: use absolute paths, load your key from a file only you can read,
# and send the output somewhere a person will actually see it.
0 */3 * * *  . $HOME/.your_env && /usr/bin/python3 $HOME/your_scripts/watch_models.py >> $HOME/your_logs/model_watch.log 2>&1
0 6 * * 1    /usr/bin/python3 $HOME/your_scripts/effort_cache_check.py >> $HOME/your_logs/cache_check.log 2>&1
```

Tests that earned their place:

1. **Run the cache check on your own transcripts.** If you claim effort changes are free, you should see "inside window ... kept" on every current-model row.
2. **Delete one ID from the watcher's state file and run it again.** It must report that ID as new. (Ours did, on the first try against the live API.)
3. **Feed the quote checker a sentence you know is false** about a page you saved. It must say UNVERIFIED. Then feed it the real sentence with the middle elided. It must say VERIFIED.
4. **Run the eval with `--dry-run` first.** A coin-flip judge should land near 50% with a wide interval. If it doesn't, your plumbing is biased before the judge ever speaks.
5. **Give the real judge one pair where you already know the answer**, and check it picks the right one in both positions. We gave it a one-line message with the wrong meeting day against one with the right day. It picked the right one both ways.
6. **Give your release probe a prompt so easy the model won't think about it.** It must say INCONCLUSIVE, not "this model doesn't reason."
7. **Run the generation loop once with a model your client is too old to know.** It must stop, not write the error message into an answer file for the judge to grade. (Ours caught exactly this: the `claude` command in our terminal was older than the one inside our editor, and its error text landed in both answer files before we added the check.)

---

## The Framework: The Four Witnesses

Every source of evidence is a witness. A witness can only testify to what it saw.

- **The vendor's charts** saw the ceiling: how good the model gets on hard, public tasks with no clock running.
- **The vendor's notes** saw the cost of getting there: the time, the tokens, the behavior that changes when you turn the dial.
- **Your own logs** saw your sessions: what the tool actually did, on your setup, on your models.
- **Your own eval** saw your work: whether the output got better at the thing you care about.

**Before you write a rule, name the witness it rests on. A rule resting on a witness that could not have seen the thing is a guess with a citation.**

We call it **The Four Witnesses.** Every miss in this volume was a witness asked about something it never saw:

- *"No head-to-head exists"* asked the bundled notes about a comparison they never contained. The launch page had seen it.
- *"Effort is fixed for the session"* was a discipline we wrote down as if it were a property of the tool, next to an older cache note with the wrong models on it. Our logs had seen the real behavior the whole time. We had not asked them.
- *"Max shows no gain on code"* had no witness at all. It was a summary that outlived its sources.
- *"Fable goes quiet, and our style makes it worse"* asked Fable's notes to compare Fable with Opus under our style. Only our logs had seen both.
- The probe that said *"does not reason by default"* asked a question too easy to see the answer. It should have said it couldn't tell.

The rule cuts the other way too. When a witness did see the thing, believe it over your summary of it. The charts said max tops most benchmarks. They were right. Our line saying max had no gain was wrong.

### Where this sits in the series

Vol 9 named the rule underneath all of these: refuse to operate on proxies. Vol 10 found the most convincing proxy there is, a stale good number, because it was true once. Vol 11 adds the proxy that fooled us this time: **a real source answering a question nobody asked it.** It is convincing for the same reason. Every word of it is true.

---

## What We Learned

### A citation is not a measurement.

Six of the nine rows on our map carry vendor evidence and have never been tested on our work. They looked exactly as solid as the rows we measured until we added the column that says which is which. The column cost nothing to add. It changed how every row reads.

### The best instrument in the room was the person asking questions.

All three day-two corrections started with a question from TIG. *"since the last versions of Fable AND Opus, you can switch models AND effort levels with each new entry."* *"how come in every single chart ... the max effort level is always higher scoring than xhigh?"* He was right about effort, and right that models can switch too, though a switch is never free. He was half right about the charts... and the half he got right was a memory of a chart where xhigh beat max, which turned out to be on Anthropic's own page. The agent's job was not to defend the rules. It was to go check.

### Defaults are a vendor's best guess for everyone. Your rules are a bet for you.

Anthropic recommends the default effort for most tasks, set as a general preference, adjusted when a result misses. That is good advice for most people, and our map follows most of it. We start higher on purpose, because a miss costs us the one resource we are protecting. That makes our map a bet. Writing "not measured" next to it is how we keep the bet honest until the experiment runs.

### An instrument that cannot see the difference must say so.

The release probe's first answer was confident and wrong. The fix was not a smarter probe so much as a humbler one: INCONCLUSIVE is a real answer, and it is the right one more often than you would think.

### Correct it the hour it is disproven.

On day one, the correction was committed twelve minutes after the rule it fixed, because it went in as soon as the evidence did. The day-two corrections went into the guide the same session they were found. A wrong rule that lives a week teaches fifteen sessions to be wrong.

### The quiet was not Fable's alone.

We were ready to rewrite our whole reporting style for one model. The logs said both current models go quiet under our style, and the harness reminder already fires for both. What remained Fable-specific turned out to be three sentences, not a rewrite.

### The missing piece is the one that answers the real question.

We designed a blind eval in July. We ratified its statistics. We did not build it. Meanwhile the other three witnesses were cheaper to ask, and they kept giving us answers. They were answering their own questions, not ours. One of its first experiments is already written down: Opus 5.5 at high against xhigh, everything else held. When it runs, that row gets its first number. A small first run is a screen. It can drop a bad idea or earn a bigger test. It cannot settle the question alone.

Every minute not spent re-deciding which model to open is a minute back for the younglings we serve. That is the receipt that matters.

---

## The "Start Here" Prompt

If you want to build this for your own setup, give your agent this prompt:

```
I run Claude Code most days and I can't tell which model and which effort
level fits which kind of my work. I want a written set of session rules
where every line says what evidence it rests on, plus the small tools that
keep those rules honest. Build it with me in this order, and stop to ask
me before anything that costs money.

1. CONSTRAINT. Ask me what my rules should optimize (my time, a budget,
   latency, review capacity) and write it down as one sentence at the top
   of a rules file.

2. LOGS FIRST. Write a read-only script that reads my Claude Code
   transcripts (~/.claude/projects/<my-project>/*.jsonl) and, for each
   change of effort or model between consecutive main-conversation
   responses, reports whether the next response kept the prompt cache
   (cache read >= half of the previous prefix), split by model and by
   inside vs outside the cache window. Print counts and token numbers
   ONLY. Never print or store message content. Run it and show me the
   table.

3. READ THE VENDOR LIVE. Fetch the current Anthropic pages for effort,
   the models overview, Claude Code's model-config and prompt-caching
   pages, and the launch post for each model I use. For each launch
   chart, collect the score at every effort level, the footnote that says
   what effort the table ran at, any standard error, and the shipped
   default. Quote every fact verbatim with its URL.

4. THE MAP. Draft a rules table: kind of work, model, effort, the evidence
   behind the row (vendor charts / vendor notes / my logs / my
   constraint), and "measured on my work: yes or no". Be blunt in that
   last column. Mechanics rows (effort changes, model switches) cite the
   step 2 numbers.

5. QUOTE CHECKER. Write a script that confirms a quote appears word for
   word on a saved page (fold case, curly quotes, markdown marks and
   whitespace; allow "..." elisions only with fragments in order; never
   accept a lone number). Run every quote in the rules file through it.
   Anything UNVERIFIED comes out or gets re-sourced.

6. RELEASE WATCH. A cron script that polls Anthropic's Models API
   (GET /v1/models, paginate with has_more and last_id), baselines
   silently on first run, and reports any new model ID. On a new ID,
   remind me to re-run steps 3 to 5 for it.

7. MY EVAL. Set up a blind pairwise comparison: 10 to 20 of my real
   tasks, two conditions that differ in ONE thing (start with the "no"
   row I lean on most), outputs generated with `claude -p --model
   --effort`, a judge that sees both answers in random order and is run
   twice with positions swapped, failures counted against the change, a
   bootstrap interval over tasks, and a blind calibration set for me to
   judge first. Build it with a --dry-run that uses a coin-flip judge and
   prove the plumbing before any paid call.

Do not change my settings or my default model. Do not decide for me. Hand
me the rules file and tell me which single experiment to run first.
```

Copy that. Paste it into a fresh agent session. It will interview you about your constraint and your work, and build the rest around your answers.

---

## See The Whole Ecosystem

QWF builds an interconnected family of apps and programs. [Quietly Spotting](https://quietlyspotting.org) is the hub. Around it orbit Quietly Writing, Quietly Quoting, Quietly Networking, Quietly Knocking, Quietly Tracking, and more. See the [live ecosystem map](https://quietlyspotting.org/#ecosystem) for what's shipped, what's building, and how it all connects.

Model choice is one plane of a bigger system. Every app on that map is built and maintained by agent sessions that start with the two choices this volume is about... which model, and how hard it should work. Getting those choices right, and honest about what we know, is how the work for the people we serve keeps its pace and its quality.

## Related Reading

- Vol 2 is about documentation that rots faster than you can write it. This volume watched a rule get corrected twelve minutes after it was committed, and added the column that shows how much each rule can be trusted.
- Vol 9 gave the agent eyes for its own context state, and named the rule this series keeps returning to: refuse to operate on proxies.
- Vol 10 kept two subscriptions alive and routed every new session to the one with the most room, and named The Third State: room, no room, and cannot read.

Vol 11 is the volume where every source was telling the truth... about something other than what we asked it.

---

## About This Series

**Built from Broken** is published by the [Quietly Working Foundation](https://quietlyworking.org) (QWF), a 501(c)(3) nonprofit. Our mission is to serve youth 30 and younger... helping them discover purpose, build skills, and create legacy. We do this through product-based fundraising programs and student training.

We run a nonprofit almost entirely on AI agent infrastructure. Our backoffice is an Obsidian vault orchestrated by Claude Code (Anthropic's CLI-based AI coding agent), built on a three-layer architecture... Directives (what to do), Orchestration (the AI agent making decisions), and Execution (deterministic Python scripts doing the work). We build tools, we break things, we fix them... and then we write down what happened so you don't have to learn it the hard way.

This volume grew from two days in October 2026, when our model rules changed three times in one afternoon and three more beliefs fell the next day. Every vendor number was re-read from a live page and every log number re-counted on the day it was written, and the blind eval this volume names as the missing piece is still not built.

**The name:** "Built from Broken" comes from a core belief... that brokenness isn't something to hide. It's proof of what's possible. Every solution in this series exists because something failed. We show the scars, not to complain, but because someone else is hitting the same wall right now... and the fastest way through is knowing they're not alone.

---

*Built from Broken, Vol. 11 ... Published October 2026*
*Quietly Working Foundation | quietlyworking.org*
*Written by Chaplain TIG with Claude (Anthropic)*