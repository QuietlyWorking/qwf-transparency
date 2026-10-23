---
title: "Built from Broken: Vol. 12"
slug: "vol-12-when-a-3-am-email-knows-something-about-your-ai-that-you-don-t"
pillar: "built-from-broken"
description: "At 3:06 AM Anthropic emailed us that our prompt cache hit rate was low. It was right: our reply-drafting agent was paying full price, on every call, to re-read "
publishDate: "2026-10-21"
tags: ["QWF", "QWU", "built-from-broken", "prompt-caching", "claude-api", "ai-agent", "cost-alerts"]
series: "Built from Broken"
volume: 12
hook: "3:06 AM: \"Your Claude API prompt cache hit rate is low\". It was right. Three quarters of what our agent sent, it had sent one call before."
isHome: false
---
# Built from Broken: Vol. 12
## When a 3 AM Email Knows Something About Your AI That You Don't

*Saving money with prompt caching*

> *Built from Broken is a series from the Quietly Working Foundation about real problems we face running AI-powered nonprofit operations... and the real solutions we build. Every fix exists because something failed first. We show the receipts.*

---

## The Problem: The Alarm Was Right

At 3:06 AM on October 21, 2026, an email from Anthropic landed in TIG's inbox. The subject line:

> *"Your Claude API prompt cache hit rate is low"*

A 3 AM email about money is a classic phishing shape. So nobody clicked anything. We proved it first. SPF, DKIM and DMARC all passed for Anthropic's own mail domain, and every link in it pointed back to that same domain. It was real. Of the 83 Anthropic emails in TIG's mailbox, it was the first of its kind.

It was also right. One of our agents was paying full price, on every call, to re-read the conversation it had just sent. **Three quarters of everything it sent the model was the previous call, sent again. Its cache covered 17%.**

The email was specific: *"Caching repeated content like system prompts could save The Quietly Working Foundation up to 42% of its direct API spend."* And it was honest about its own edges: *"This estimate covers direct API traffic only. Claude Code is excluded since it manages caching automatically."*

Hold onto four of those words: *direct API traffic only.* They turned out to be the most important words in the email.

### One key, one agent

We found one direct Anthropic API key, kept in five secret stores across our systems. By our own records (our usage ledger, plus each app's own usage tables), about nine tenths of that key's use belonged to one agent. A nightly receipt reader and one app's photo reader made up most of the rest. Every other app sat idle.

That agent drafts email replies. When someone on a short list TIG chose writes to him, it reads the thread, looks up what it needs with read-only tools, and puts a reply in his drafts folder. It never sends anything. TIG reads every draft and sends it himself, or doesn't. It went live on October 7.

### The loop that cached only its opening

The agent works in a loop. It calls a tool, reads the result, thinks, and calls again. The API keeps no memory between calls, so every call sends the whole conversation so far: the instructions, the email, every tool result, every step of the agent's own reasoning.

Prompt caching exists for exactly this. Mark a point in the prompt, and the next call that starts with the same text reads everything up to that mark from cache. On the model we use, a cache read costs a twentieth of the normal input price. A cache write costs a quarter more than normal input, so only the reads save anything.

Our code marked two points: the end of the instructions, and the end of the first message. Nothing after that. So every call read the opening from cache... and paid full price, again, for everything the agent had done since.

The usage ledger had the fingerprint. Every call the agent made from October 5, tests included, up to the fix:

- **194 calls in 42 runs.**
- **17% of the prompt read from cache.**
- **Of the 37 runs with three or more calls, the cache reads grew in none.** In all 37, the reads were the same number on every call after the first.

The longest run was 15 calls. From call 2 to call 15 it read exactly 7,150 tokens from cache, every time. Meanwhile its prompt grew from 7,154 tokens to 80,488. By the last call, the cache covered 9% of what it sent.

Flat reads. That's the signature. Remember it.

### What it cost a person

The agent has a spending cap for each email. We built it on purpose, so a loop that never finishes can't run up a bill while nobody is watching.

On October 20, one message hit it. That was the 15-call run. Fifteen calls in, the next call would not fit under the cap, so the agent stopped. No draft was made.

The gate did its job. About a second later, it sent TIG a text: that email had hit the per-email spending cap.

The text was true. It pointed at the wrong thing. It said *budget*. The real problem was *waste*. Re-priced with the whole conversation cached, those same 15 calls would have cost about a fifth as much. (We can't promise the agent would have finished in the one call it had left before its separate call limit. We can promise the cap would not have stopped those 15 calls.)

That's the scar. A cost-control gate did exactly what we built it to do, and one person's email got no draft for TIG to review... because the budget it guarded was leaking somewhere it couldn't see.

### Why the obvious fix doesn't work

The fix exists, and it's one setting. Anthropic's API supports automatic caching: you add a single `cache_control` field at the top of the request and, in the docs' words, *"The system automatically applies the cache breakpoint to the last cacheable block."* In a loop, that marker lands at the end of the conversation on every call, so each call reads everything the call before it wrote, as long as each turn adds fewer than 20 blocks (a run of tool results counts as one). The docs again: *"With automatic caching, the cache point moves forward automatically as conversations grow."*

The obvious way to write it is the way the docs show it: one more argument on the create call.

Our pinned Python SDK is version 0.79.0. That argument arrived in 0.83.0, twelve days later. (Today the SDK is two major versions past our pin.) Hand the argument to 0.79.0 and you get this, before a single byte leaves the machine:

```
TypeError: Messages.create() got an unexpected keyword argument 'cache_control'
```

That's not a docs bug. The docs describe the current SDK. Our pin was older than the feature.

And that's where it would have hurt. Our agent catches every exception and turns it into a failed draft. So written the obvious way, the fix would have failed every single email, before spending anything at all. TIG's texts would have said only that the drafter "ran into a problem." And the test suite would have stayed green, because our tests used a fake client that accepted any argument at all.

What we shipped sends the same field through the SDK's own pass-through for request fields it doesn't know yet, `extra_body`, and a test pins it on every call. A three-call live test of the exact request read 0, then 2,689, then 3,680 tokens from cache. Growing.

One call through the real SDK, even offline, would have caught that TypeError at once. Our tests never would have. The test that pins the fix still runs against the same easygoing fake; the real-signature test in the Blueprint below is the one we wish we'd had.

### The part the email couldn't see

Then the story turned.

Most of our model calls never touch that key. Over the 30 days from September 21 to October 20, 94.5% of our scripts' model calls went through OpenRouter, a gateway that sells several vendors' models behind one API, Claude among them.

OpenRouter's own numbers for those 30 days: about 3,000 requests. A bill more than six times what our own records show for the whole direct key. And **zero cached tokens.** Not one. (That month was the agent's first. Even at its newest weekly pace, the gateway still runs about twice the size of the direct key.)

Zero, because none of our calls asked. On Claude models, OpenRouter caches only what a request marks, and its own guide says so: *"Most providers automatically enable prompt caching, but note that some (see Alibaba and Anthropic below) require you to enable it on a per-message basis."*

Anthropic's email could not have mentioned any of it. None of that traffic went through our Anthropic key, and the email told us so in plain words: *"direct API traffic only."*

That's not a flaw in the email. It's the shape of every vendor alarm. **A vendor can only see the slice of your spend that the vendor bills.**

And our own meter had the same shape. Our usage ledger only sees the calls that write to it. The apps' server functions keep their own usage records and never wrote to it. Until this week, the receipt reader never did either. We hold no admin key that could pull Anthropic's full usage report by script, so the only complete record of what our direct key spends is the usage page in Anthropic's console.

### Why the same fix fails there

So we tried the same setting on the gateway. It didn't help, in a way worth knowing.

Our gateway calls are one-shot: a short block of fixed instructions, then one record to score or classify, then done. Automatic caching puts its marker on the last block... and on a one-shot call, the last block is the record, different every time. We tested it on the wire. Two calls: the cache was written twice and read zero times. A marker on the fixed instructions instead wrote once, then read once.

Anthropic's own guide names this trap, under "Common mistake": *"Automatic caching has the same problem: it places the breakpoint on the last cacheable block, which in this structure is the one that changes every request."*

So on the gateway, caching is now something each script opts into, proven with a live pair before it's switched on. On that fleet as it runs today, it's worth very little. Our fixed instructions are short and our records are long, and some instructions are under the model's 512-token minimum, so they can't be cached at all.

### The bigger waste: paying twice for the same work

The bigger waste was simpler. It lived on both meters, and no cache could touch it. We were paying twice for the same work.

- **An article scorer** re-scored every eligible article at noon every day, 32 or 33 of them. Its "has anything changed?" check could never say no: the site sync counted every published file as synced, changed or not, and stamped a fresh timestamp into a data file on every run. Over the 30 days to October 21, **951 of 973 day-over-day re-scores (97.7%) sent the model a prompt byte-for-byte identical to the day before.** On 13 of those 30 days, no article had changed at all. Those identical re-scores alone were about a tenth of the gateway's 30-day bill.
- **Two nightly mail classifiers** search 48 hours back, every 24 hours. By design, about half of each night's mail is mail they already read the night before.
- **A receipt reader** for our software subscriptions (this one on the direct key) kept paying to re-read files. Since July, 51 of its 85 reads (60%) were a file it had already read, and 84 of the 85 found no amount at all. None of those calls ever reached our ledger.

A cache makes a repeat cheaper. It never asks whether the repeat needed to happen.

### The insight

Every meter has an edge.

Anthropic's alarm saw the traffic Anthropic bills, and it was right about all of it. Our ledger saw the calls that wrote to it. Neither one lied. Each was honest about a smaller world than the one we live in.

So the first question after any alarm is the obvious one: is it real? The second is the one nobody asks: what can it not see? And the third only shows up once you're looking: did this work need doing twice at all?

---

## The Solution: One Setting, Then a Wider Look

We changed five things.

1. **The loop now caches the whole conversation.** Automatic caching, sent in the form our SDK accepts, with a test that pins it on every call. The explicit markers stay on the instructions and the first message, so the instructions keep their own read point across runs, and the email keeps one within a run. That's three of the four markers the API allows.
2. **A signature anyone can read.** Healthy is each call reading nearly all of the call before it, so the reads grow on every call. Flat reads mean it broke again.
3. **Opt-in caching on the gateway,** switched on per script only after a live pair proves the second call reads.
4. **An answer memory for each repeat spender.** Each one fingerprints exactly what the model is sent and remembers what it answered. The two mail classifiers' memories start in record-only mode: the model is still called every time, and the memory only counts how often a repeat comes back with the same answer. The article scorer went further, by TIG's call: its prompts were byte-for-byte identical, so it now reuses a remembered score while an article is unchanged. And the receipt reader now reads each file once.
5. **A question we now ask of every vendor alarm:** what can this one not see?

### The Before and After

The same 15-call email from October 20. *Before* is what really happened. *After* is the same calls re-priced with the whole conversation cached: arithmetic, not a re-run.

```
Cache reads per call, in tokens

call           1       2       3       4       5     ...      13      14      15
before         0   7,150   7,150   7,150   7,150     ...   7,150   7,150   7,150
after          0   7,154  16,001  29,091  34,200     ...  73,040  74,708  80,201

share of the prompt read from cache:   before 13%     after 89%
cost of those 15 calls:                after = about a fifth of before
```

Across all 194 calls before the fix, the same re-pricing comes out **53% cheaper** for this one agent. The email's "up to 42%" covered the whole key, over its own time window, so the two aren't the same measurement. They point the same way.

The first two real emails after the fix went in at 1:10 that afternoon:

```
first real email, 4:22 PM    reads  0  ->  5,342  ->  7,852    56% of the prompt from cache
second real email            reads  0  ->  5,931  ->  9,720    57% of the prompt from cache
```

Growing, both times. Each call read nearly everything the call before it sent.

### Where the marker sits

```
BEFORE: two fixed markers (*), both in the opening

call 1   [instructions*][email*]
call 2   [instructions*][email*][turn 1]
call 3   [instructions*][email*][turn 1][turn 2]
call 4   [instructions*][email*][turn 1][turn 2][turn 3]
         |---- from cache -----|| full price, every call |

AFTER: the same two, plus one automatic marker (>) that moves to the end

call 1   [instructions*][email*>]
call 2   [instructions*][email*][turn 1>]
call 3   [instructions*][email*][turn 1][turn 2>]
call 4   [instructions*][email*][turn 1][turn 2][turn 3>]
         |--- from cache, up to call 3's > ----||- new -|

A turn is the agent's answer plus the tool results it asked for.
On call 1 both markers sit on the email; the API treats that as one.
```

### Who can see what

The same traffic, through two different meters:

| Traffic | Anthropic's alarm | Our own ledger |
|---|---|---|
| The reply agent (direct key) | sees it | sees it |
| The receipt reader (direct key) | sees it | blind until this week |
| The apps' server functions (direct key) | sees it | blind: they keep their own records |
| Our scripts on the gateway | blind: the gateway bills them | sees them |
| Everything on the direct key, all callers | only Anthropic's console has the total | no |

### The response, as a routine

```
 a vendor alarm arrives
          |
          v
 1. PROVE IT ........... sender, SPF / DKIM / DMARC, link hosts. Click nothing.
          |
          v
 2. WHO SPENDS ......... every key, every place it lives, every caller by share
          |
          v
 3. FINGERPRINT ........ cache reads per call, per run: flat, healthy, lagging, none
          |
          v
 4. FIX AND PIN ........ the setting, in the form YOUR toolkit accepts, plus a test
          |
          v
 5. WATCH .............. the next real run: reads must grow
          |
          v
 6. WIDEN .............. what can this alarm not see?
          |
          v
 7. REPEAT WORK ........ did this work need doing twice at all?
```

---

## How to Build Your Own

Everything below is environment-agnostic. Swap the placeholders for your own. Every script ran against test data on our machine before it went into this article. Python, with Anthropic's official SDK.

### Step 1: Prove the alarm before you believe it

A real vendor email and a phishing email look the same at 3 AM. Your own mail provider already checked the difference and wrote its verdict into a header. Read that one, and only that one: any sender can add a fake verdict further down. Most mail clients will save a message as a `.eml` file ("show original," "view source," or "save as").

```python
#!/usr/bin/env python3
# check_alarm_email.py ... is this vendor email real? Reads a saved .eml file and prints the sender,
# the SPF / DKIM / DMARC verdicts in each Authentication-Results header, and every link host.
# Opens nothing, clicks nothing.
#   python3 check_alarm_email.py saved_message.eml
# Trust only the header your OWN mail provider wrote: its first field names the server, and it is
# normally the topmost. Any sender can add a fake one further down.
import re
import sys
from email import policy
from email.parser import BytesParser
from urllib.parse import urlparse

with open(sys.argv[1], "rb") as f:
    msg = BytesParser(policy=policy.default).parse(f)
print("From:     ", msg["From"])
print("Reply-To: ", msg["Reply-To"] or "(none)")
headers = msg.get_all("Authentication-Results") or []
if not headers:
    print("Checks:    no Authentication-Results header, so treat it as unverified")
for i, header in enumerate(headers):
    text = str(header)
    verdicts = dict(re.findall(r"\b(spf|dkim|dmarc)=(\w+)", text))
    domains = sorted(set(re.findall(r"(?:smtp\.mailfrom|header\.d|header\.from)=([\w.-]+)", text)))
    where = "topmost: trust it if your provider wrote it" if i == 0 else "further down: ignore"
    print(f"Checks:    {verdicts or 'none found'} for {domains or 'no domain'}")
    print(f"           written by {text.split(';')[0].strip()} ({where})")
body = msg.get_body(preferencelist=("html", "plain"))
content = body.get_content() if body else ""
urls = re.findall(r"""href=["']([^"']+)["']""", content) + re.findall(r"""https?://[^\s"'<>)]+""", content)
print("Links to: ", sorted({urlparse(u).netloc for u in urls if urlparse(u).netloc}) or "(no links)")
print("\nReal only if your own provider's header shows all three passing for the vendor's own domain,")
print("the From address is on that domain, and every link host belongs to the vendor.")
print("Even then, go to the vendor's site yourself.")
```

**Why:** the alarm is about to change how you spend money and time. Ten seconds of headers decides whether it deserves either. Ours passed all three for Anthropic's mail domain, with every link on that domain. Make a forged copy of a test file (flip the verdicts, swap the link host, add a fake "pass" header underneath) and the output changes in front of you.

### Step 2: Find who spends

Before touching code, list every key the vendor bills to you and every place each one lives: secret stores, CI secrets, server functions, and any build that bakes a key into what it deploys. Then rank every caller of every key by its share of use, from your own logs.

Two things to look for:

- **One caller that dominates.** Ours was about nine tenths of the key. Fix that one first and the alarm's number moves.
- **Callers that never log.** Write them down now. They will matter in Step 7.

**Why:** the email is about a key, not a program. Until you know which program is behind the number, every fix is a guess.

### Step 3: Read the fingerprint

Log the `usage` block of every API response, plus a timestamp and one id per agent run:

```python
import datetime
import json

def log_usage(resp, run_id, path="usage.jsonl"):
    row = resp.usage.model_dump() | {"run_id": run_id,
                                     "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat()}
    with open(path, "a", encoding="utf-8") as f:
        f.write(json.dumps(row, default=str) + "\n")
```

Then read it back as runs:

```python
#!/usr/bin/env python3
# cache_reads_report.py ... read-only: cache reads per call, per run, from your own usage log.
#   python3 cache_reads_report.py usage.jsonl
# One JSON object per API call. It needs the three usage fields the API returns on every response
# (cache_read_input_tokens, cache_creation_input_tokens, input_tokens) plus a timestamp, and
# ideally a run_id you log once per agent run. Log resp.usage.model_dump() and you have them.
# Prints numbers only, never prompt or answer text.
import json
import sys
from datetime import datetime

GAP_S = 120     # without a run_id: calls further apart than this start a new run
KEEP_UP = 0.9   # healthy: each call reads at least this share of the previous call's whole prompt


def calls(path):
    with open(path, encoding="utf-8") as f:
        for line in f:
            if line.strip():
                row = json.loads(line)
                row["read"] = int(row.get("cache_read_input_tokens") or 0)
                row["wrote"] = int(row.get("cache_creation_input_tokens") or 0)
                row["prompt"] = row["read"] + row["wrote"] + int(row.get("input_tokens") or 0)
                row["t"] = datetime.fromisoformat(row["timestamp"].replace("Z", "+00:00"))
                yield row


def runs(rows):
    out = []
    for r in sorted(rows, key=lambda r: r["t"]):
        prev = out[-1][-1] if out else None
        same = prev is not None and (
            r.get("run_id") == prev.get("run_id") if r.get("run_id") is not None
            else (r["t"] - prev["t"]).total_seconds() <= GAP_S and r["prompt"] >= prev["prompt"])
        if same:
            out[-1].append(r)
        else:
            out.append([r])
    return out


def verdict(run):
    reads = [c["read"] for c in run]
    if len(run) < 3:
        return "too short to judge"
    if not any(reads):
        return "NO CACHE: nothing is being read"
    if len(set(reads[1:])) == 1:
        return "FLAT: only the opening is cached; the tail is paid in full every call"
    if all(b["read"] >= KEEP_UP * a["prompt"] for a, b in zip(run, run[1:])):
        return "HEALTHY: each call reads nearly all of the call before it"
    if all(b > a for a, b in zip(reads[1:], reads[2:])):
        return "LAGGING: reads grow but fall behind the prompt; a marker may be out of the lookback's reach"
    return "MIXED: look at where the reads drop"


all_runs = runs(list(calls(sys.argv[1])))
tally = {}
for run in all_runs:
    v = verdict(run)
    tally[v.split(":")[0]] = tally.get(v.split(":")[0], 0) + 1
    print(f"{run[0]['timestamp']}  {len(run):>2} calls  reads {[c['read'] for c in run]}  {v}")
prompt = sum(c["prompt"] for r in all_runs for c in r)
read = sum(c["read"] for r in all_runs for c in r)
print(f"\n{len(all_runs)} runs. {read:,} of {prompt:,} prompt tokens read from cache ({read / max(prompt, 1):.0%}).")
print("Verdicts:", ", ".join(f"{k} {v}" for k, v in sorted(tally.items())))
```

A test file you can run it on, shaped like our own before and after, with made-up timestamps (save as `fixture_usage.jsonl`):

```
{"timestamp": "2026-01-05T10:00:00+00:00", "run_id": "before", "cache_read_input_tokens": 0, "cache_creation_input_tokens": 7150, "input_tokens": 4}
{"timestamp": "2026-01-05T10:00:04+00:00", "run_id": "before", "cache_read_input_tokens": 7150, "cache_creation_input_tokens": 0, "input_tokens": 8851}
{"timestamp": "2026-01-05T10:00:08+00:00", "run_id": "before", "cache_read_input_tokens": 7150, "cache_creation_input_tokens": 0, "input_tokens": 21941}
{"timestamp": "2026-01-05T10:00:12+00:00", "run_id": "before", "cache_read_input_tokens": 7150, "cache_creation_input_tokens": 0, "input_tokens": 27050}
{"timestamp": "2026-01-06T10:00:00+00:00", "run_id": "after", "cache_read_input_tokens": 0, "cache_creation_input_tokens": 5342, "input_tokens": 4}
{"timestamp": "2026-01-06T10:00:14+00:00", "run_id": "after", "cache_read_input_tokens": 5342, "cache_creation_input_tokens": 2510, "input_tokens": 2}
{"timestamp": "2026-01-06T10:00:34+00:00", "run_id": "after", "cache_read_input_tokens": 7852, "cache_creation_input_tokens": 2438, "input_tokens": 2}
```

It should print one **FLAT** run and one **HEALTHY** run.

How to read it:

- **FLAT** is what we had. The opening is cached and nothing after it is.
- **HEALTHY** means each call read nearly all of the call before it (at least 90% of its whole prompt).
- **LAGGING** means the reads grow but fall behind the prompt. Look for a turn that adds 20 or more blocks, which pushes the last cache entry out of the lookback's reach.
- **NO CACHE** on a loop means nothing is marked at all. On a one-shot call it may be fine: see Step 8.
- **MIXED** usually means something early in the prompt changed between calls: a date, an id, a reordered tool list. One changed byte and every read after it misses.

**Why a run view and not a hit rate:** a hit rate is one number for everything. Our 17% hid 37 runs that were all broken the same way. Per call, per run, the pattern is impossible to miss.

### Step 4: Cache the whole conversation, in the form your SDK accepts

```python
#!/usr/bin/env python3
# cached_tool_loop.py ... a manual tool loop that caches the WHOLE conversation on every call,
# not just its opening.
#   pip install anthropic            (0.83.0 or newer takes cache_control as an argument)
#   export ANTHROPIC_API_KEY=...     then: python3 cached_tool_loop.py "your task"
# Healthy output: "read" grows on every call after the first. Flat reads mean the tail is not cached.
import inspect
import sys

import anthropic

MODEL = "claude-opus-5-5"
EFFORT = "high"                   # Opus 5.5 defaults to medium: say what you mean
MAX_CALLS = 16                    # a hard stop for a loop that never finishes
CACHE = {"type": "ephemeral"}     # 5 minutes. {"type": "ephemeral", "ttl": "1h"} costs 2x to write

# The stable part: byte-identical on every call, in every run. No dates, names or ids in here.
SYSTEM = [{"type": "text",
           "text": "<your instructions. On Opus 5.5 the prompt up to this marker, tools included, "
                   "must reach 512 tokens, or this marker caches nothing>",
           "cache_control": CACHE}]   # optional explicit marker: the shared prefix keeps its own read point
TOOLS = [{"name": "lookup",
          "description": "Look up one record by its key.",
          "input_schema": {"type": "object", "properties": {"key": {"type": "string"}},
                           "required": ["key"], "additionalProperties": False}}]


def run_tool(name, args):
    """Your tools go here. Return a string."""
    return f"<the record for {args.get('key')}>"


def caching_kwargs(client):
    """Top-level automatic caching, in whichever form this SDK accepts.

    SDKs before 0.83.0 have no cache_control argument on messages.create and raise TypeError on
    one. A loop that catches every exception turns that into a failure on every single run. The
    same JSON field can always travel through extra_body, the SDK's pass-through for request fields
    it does not know yet. Ask the real signature instead of guessing from a version number."""
    if "cache_control" in inspect.signature(client.messages.create).parameters:
        return {"cache_control": CACHE}
    return {"extra_body": {"cache_control": CACHE}}


def run(client, task, log=print):
    messages = [{"role": "user", "content": task}]
    cache = caching_kwargs(client)
    for call in range(1, MAX_CALLS + 1):
        resp = client.messages.create(
            model=MODEL, max_tokens=16000, system=SYSTEM, tools=TOOLS, messages=messages,
            output_config={"effort": EFFORT}, **cache)
        u = resp.usage
        log(f"call {call}: read {u.cache_read_input_tokens or 0:,} | "
            f"wrote {u.cache_creation_input_tokens or 0:,} | uncached {u.input_tokens:,}")
        if resp.stop_reason == "refusal":
            # Opus 5.5 can also retry a refusal on another model (server-side fallbacks, beta). That
            # turn reads the other model's own cold cache, so this caching example leaves it out.
            details = getattr(resp, "stop_details", None)   # older SDKs have no such field
            raise RuntimeError(f"declined ({getattr(details, 'category', None)})")
        if resp.stop_reason == "max_tokens":
            raise RuntimeError("the answer was cut off")
        if resp.stop_reason != "tool_use":
            return resp
        # Append the assistant turn UNCHANGED (thinking blocks included) and never edit history:
        # one changed byte early in the prompt and every later read misses.
        messages.append({"role": "assistant", "content": resp.content})
        results = [{"type": "tool_result", "tool_use_id": b.id, "content": run_tool(b.name, b.input)}
                   for b in resp.content if b.type == "tool_use"]
        messages.append({"role": "user", "content": results})   # every result in ONE message
    raise RuntimeError(f"no answer after {MAX_CALLS} calls")


if __name__ == "__main__":
    final = run(anthropic.Anthropic(), sys.argv[1] if len(sys.argv) > 1 else "Look up key A.")
    print(next((b.text for b in final.content if b.type == "text"), ""))
```

The design decisions, and why:

- **Automatic caching on top, an explicit marker on the instructions.** The automatic marker follows the conversation's end; the explicit one gives your instructions a read point that survives anything later in the conversation. That's two of the API's four markers. Count yours: four explicit markers leave no room for the automatic one, and the API returns a 400.
- **Ask the signature, don't trust the version you think you have.** The same code then works on an old pin and a new SDK. Ours was twelve days too old for the argument.
- **Append, never edit.** The cache is a prefix match. Rewrite one early block and every later read misses.
- **All tool results in one message.** Anthropic's guide counts a run of consecutive tool results as one position in its 20-block lookback, so a turn with several tool calls doesn't push the last cache entry out of reach.
- **Mind the minimum.** On Opus 5.5 the prompt up to a marker, tools included, must reach 512 tokens, or that marker caches nothing, and the API returns no error. If reads stay at zero on a short prompt, that's why.

We ran this loop's test on SDK 0.79.0 (which takes the pass-through) and 0.83.0 (which takes the argument). Version 2 of the SDK shipped the day we wrote this; the current 2.1.0 source has the same argument, but we haven't run the loop there.

### Step 5: Test with the real signature

This is the test that would have caught our trap. The fake client is built from the real one, so it accepts exactly the arguments your installed SDK accepts:

```python
#!/usr/bin/env python3
# test_cached_tool_loop.py ... runs the loop against a fake that carries the REAL SDK's signature.
#   python3 test_cached_tool_loop.py      (no key, no network, no cost)
# A fake written as `def create(self, **kw)` accepts any argument at all, so it would pass a
# cache_control argument that the installed SDK rejects. create_autospec copies the real
# signature, so the test fails the way production would.
from types import SimpleNamespace as NS
from unittest import mock

import anthropic

import cached_tool_loop as loop


def reply(stop, blocks, read, wrote, uncached=3):
    usage = NS(cache_read_input_tokens=read, cache_creation_input_tokens=wrote, input_tokens=uncached)
    return NS(stop_reason=stop, content=blocks, usage=usage, stop_details=None)


def tool_call(i):
    return NS(type="tool_use", id=f"tu{i}", name="lookup", input={"key": f"K{i}"})


def fake_client(replies):
    client = anthropic.Anthropic(api_key="test-not-used")    # built offline; nothing is sent
    real = client.messages.create
    client.messages.create = mock.create_autospec(real, side_effect=replies)
    return client


# 1. The loop picks the form this SDK accepts, and the real signature lets it through.
replies = [reply("tool_use", [tool_call(1)], 0, 2700),
           reply("tool_use", [tool_call(2)], 2700, 990),
           reply("end_turn", [NS(type="text", text="done")], 3690, 400)]
client = fake_client(replies)
lines = []
final = loop.run(client, "Look up K1, then K2.", log=lines.append)
assert final.stop_reason == "end_turn" and len(lines) == 3
kwargs = [c.kwargs for c in client.messages.create.call_args_list]
form = "argument" if "cache_control" in kwargs[0] else "extra_body"
assert all(k.get("cache_control") or k.get("extra_body", {}).get("cache_control") for k in kwargs)
logged = [int(l.split("read ")[1].split(" |")[0].replace(",", "")) for l in lines]
assert logged == [0, 2700, 3690], "the loop should log every call's cache reads"
print(f"1. anthropic {anthropic.__version__}: the loop sent automatic caching as {form} on all 3 calls")

# 2. The obvious form, tried against the real signature.
client = fake_client([reply("end_turn", [], 0, 0)])
try:
    client.messages.create(model=loop.MODEL, max_tokens=16, messages=[], cache_control=loop.CACHE)
    print("2. this SDK takes cache_control as an argument")
except TypeError as e:
    print(f"2. this SDK rejects the argument, as production would: {e}")
print("all checks passed")
```

On our pinned 0.79.0 it prints:

```
1. anthropic 0.79.0: the loop sent automatic caching as extra_body on all 3 calls
2. this SDK rejects the argument, as production would: got an unexpected keyword argument 'cache_control'
all checks passed
```

**Why:** a fake that takes `**kw` agrees with everything, so it can never tell you that your toolkit disagrees. Copy the real signature and your tests fail where production would. Our own suite still has the easygoing kind. This is the test we wish it had.

### Step 6: Prove it live, then watch

A test proves the code. Only a live call proves the API. Run the loop once on a small, real-shaped task (ask whoever pays the bill first; three calls is plenty). The `read` column must grow on every call after the first. Ours read 0, then 2,689, then 3,680.

Then don't stop at the probe. Run Step 3's report on the next real run in production. That's the one that counts. Ours was 0, then 5,342, then 7,852, on a real email that afternoon.

### Step 7: Ask what the alarm cannot see

Run this on any vendor cost email, before you decide the problem is solved:

```markdown
## What can this alarm NOT see?

- [ ] Which keys does this vendor bill to us? List every one, and every place each one lives:
      secret stores, CI secrets, server functions, and any build that bakes a key in.
- [ ] Which of our traffic reaches the same models through someone else: a gateway, a cloud
      marketplace, a reseller? The vendor sees that traffic as theirs, not ours. If any of it
      bills through our own key, it IS on this alarm. Check.
- [ ] What does the alarm exclude, in its own words? (Ours: "direct API traffic only.")
- [ ] Which of our callers never write to our own usage log? Server functions, cron jobs,
      one-off tools. Our meter has an edge too.
- [ ] Can we pull the vendor's full usage report by script? If not, who can read the console?
- [ ] What does "healthy" look like for each traffic shape? A fleet of one-shot calls can't
      have a high cache hit rate, and may not need one.
- [ ] For every blind slice: name the one instrument that CAN see it, or write down that
      nothing does.
```

**Why:** the email answered its question honestly. This checklist is for the questions it was never in a position to ask.

### Step 8: Check for repeat work before you tune anything

Before you make a repeat cheaper, find out whether it should happen at all. Fingerprint exactly what each call sends, per call site, and count:

```python
#!/usr/bin/env python3
# repeat_work_report.py ... read-only: how much of your model spend is the same work, paid for twice?
#   python3 repeat_work_report.py calls.jsonl
# Log one JSON row per model call, BEFORE you decide anything:
#   {"timestamp": "...", "site": "nightly_classifier",
#    "prompt_sha256": fingerprint(model=..., system=..., messages=..., tools=..., effort=...),
#    "prefix_sha256": fingerprint(model=..., tools=..., system=...),     # the stable front part
#    "prefix_tokens": 1800}                                              # from a real response
# Hashes only: the log never holds a prompt, so it can live anywhere.
import collections
import hashlib
import json
import sys
from datetime import datetime

WINDOW_S = 300        # the default cache lifetime: a prefix only pays if it comes back this soon
MIN_PREFIX = 512      # Opus 5.5's minimum cacheable length; check yours (Haiku 4.5 is 4,096)
WRITE, READ = 1.25, 0.05   # Opus 5.5: a 5-minute write costs 1.25x input, a read 0.05x
BREAK_EVEN = (WRITE - 1) / ((WRITE - 1) + (1 - READ))   # share of calls that must read: about 21%
REPEAT_BAR = 0.20     # this share of calls repeating earlier work is worth an answer memory


def fingerprint(**request):
    """Everything the model will see, made canonical: the same request gives the same hash anywhere."""
    blob = json.dumps(request, sort_keys=True, ensure_ascii=False, separators=(",", ":"), default=str)
    return hashlib.sha256(blob.encode("utf-8")).hexdigest()


def report(path):
    rows = [json.loads(l) for l in open(path, encoding="utf-8") if l.strip()]
    for r in rows:
        r["t"] = datetime.fromisoformat(r["timestamp"].replace("Z", "+00:00"))
    by_site = collections.defaultdict(list)
    for r in sorted(rows, key=lambda r: r["t"]):
        by_site[r["site"]].append(r)
    for site, calls in sorted(by_site.items()):
        seen, last_prefix, repeats, reuse = set(), {}, 0, 0
        days = collections.defaultdict(lambda: [0, 0])
        for c in calls:
            day = days[c["t"].date().isoformat()]   # days follow each timestamp's own offset
            day[0] += 1
            if c["prompt_sha256"] in seen:         # this exact work was already paid for
                repeats += 1
                day[1] += 1
            seen.add(c["prompt_sha256"])
            p = c.get("prefix_sha256")
            if p and p in last_prefix and (c["t"] - last_prefix[p]).total_seconds() <= WINDOW_S:
                reuse += 1                         # a cache written by the last call would still be warm
            if p:
                last_prefix[p] = c["t"]
        n = len(calls)
        prefix = min((c.get("prefix_tokens") or 0) for c in calls)
        if repeats / n >= REPEAT_BAR:
            advice = "ANSWER MEMORY: the same work comes back; remember the answer (record-only first)"
        elif reuse / n > BREAK_EVEN and prefix >= MIN_PREFIX:
            advice = "CACHE THE PREFIX: it comes back warm often enough to pay for the writes"
        elif reuse / n > BREAK_EVEN:
            advice = f"cache would pay, but the stable prefix ({prefix} tokens) is under the minimum"
        else:
            advice = "leave it: neither the work nor the prefix comes back often enough"
        print(f"{site}: {n} calls, {repeats / n:.0%} repeat earlier work, "
              f"{reuse / n:.0%} reuse a prefix within {WINDOW_S // 60} min (break-even {BREAK_EVEN:.0%})")
        print("   per day (calls / already paid for): " +
              ", ".join(f"{d[5:]} {v[0]}/{v[1]}" for d, v in sorted(days.items())))
        print(f"   -> {advice}")


if __name__ == "__main__":
    report(sys.argv[1])
```

On test data shaped like our three cases (a daily scorer, an overlapping nightly classifier, and an agent loop), it says:

```
agent_loop: 12 calls, 0% repeat earlier work, 92% reuse a prefix within 5 min (break-even 21%)
   per day (calls / already paid for): 10-15 12/0
   -> CACHE THE PREFIX: it comes back warm often enough to pay for the writes
daily_scorer: 165 calls, 79% repeat earlier work, 97% reuse a prefix within 5 min (break-even 21%)
   per day (calls / already paid for): 10-15 33/0, 10-16 33/33, 10-17 33/32, 10-18 33/33, 10-19 33/33
   -> ANSWER MEMORY: the same work comes back; remember the answer (record-only first)
nightly_classifier: 100 calls, 40% repeat earlier work, 95% reuse a prefix within 5 min (break-even 21%)
   per day (calls / already paid for): 10-16 20/0, 10-17 20/10, 10-18 20/10, 10-19 20/10, 10-20 20/10
   -> ANSWER MEMORY: the same work comes back; remember the answer (record-only first)
```

The scorer's stable prefix in that test data is 54 tokens, like our real one: far under the 512-token minimum, so a cache could never have helped it anyway.

Where the report says ANSWER MEMORY, here is the smallest honest one. It ships record-only:

```python
#!/usr/bin/env python3
# answer_memory.py ... remember a model's answer by the fingerprint of exactly what it was sent.
# Ships RECORD-ONLY: it always calls the model, so behavior and cost do not change, and it counts
# how often a repeat came back with the same answer. Flip LIVE only when that count says reuse is safe.
import json
import sqlite3
import time

LIVE = False                    # record-only until the evidence is in
DB_PATH = "answer_memory.db"    # it stores ANSWERS: keep it wherever the data they came from may live

db = sqlite3.connect(":memory:" if __name__ == "__main__" else DB_PATH)   # the dry run leaves no file
db.execute("CREATE TABLE IF NOT EXISTS memory (fp TEXT PRIMARY KEY, answer TEXT, first_seen REAL, "
           "repeats INTEGER DEFAULT 0, agreed INTEGER DEFAULT 0)")


def same_decision(old, new):
    """Define 'the same answer' for YOUR task. A score that wobbles by a point is often the same
    decision; a different category is not. Exact equality is the strictest choice."""
    return old == new


def remembered(fp, call_model):
    row = db.execute("SELECT answer FROM memory WHERE fp = ?", (fp,)).fetchone()
    if row and LIVE:
        db.execute("UPDATE memory SET repeats = repeats + 1 WHERE fp = ?", (fp,))
        db.commit()
        return json.loads(row[0])                     # the work was already paid for once
    answer = call_model()                             # record-only: pay, then compare
    if row:
        agreed = int(same_decision(json.loads(row[0]), answer))
        db.execute("UPDATE memory SET repeats = repeats + 1, agreed = agreed + ? WHERE fp = ?", (agreed, fp))
    else:
        db.execute("INSERT INTO memory (fp, answer, first_seen) VALUES (?, ?, ?)",
                   (fp, json.dumps(answer), time.time()))
    db.commit()
    return answer


def evidence():
    repeats, agreed = db.execute("SELECT COALESCE(SUM(repeats), 0), COALESCE(SUM(agreed), 0) FROM memory").fetchone()
    return f"{repeats} repeats, {agreed} came back with the same answer"


if __name__ == "__main__":    # a dry run with a fake model: nothing is sent anywhere
    for day in range(3):
        for item in ("A", "B", "C"):
            remembered(f"fp-{item}", lambda: {"qualifies": item != "C"})
    print(evidence())
```

The design decisions, and why:

- **Fingerprint everything the model sees.** Model, instructions, messages, tools, effort. Two calls are the same work only if every one of those matches.
- **Hashes, not prompts, in the report's log.** That log can live anywhere because it holds nothing anyone wrote. The answer memory is different: it stores answers, so keep it wherever the data it came from is allowed to live.
- **Record first.** A memory that answers from the past is a behavior change. Start by watching: let the repeats show whether they get the same answer, and decide what "the same" means before anything is reused. A score that moves a point a day on an unchanged article may still be the same decision. Our mail classifiers are still watching. For our article scorer the evidence was overwhelming (byte-for-byte identical prompts), and TIG made the call: a remembered score now stands while the article is unchanged.
- **The break-even is arithmetic.** A cache write costs 0.25x extra; a read saves 0.95x. So caching pays only when more than about 21% of calls come back within the cache window to read. Below that, it's a surcharge.

### Step 9: Tests that earned their place

1. **Run the real-signature test** (Step 5). It must name the form your SDK accepts, and on an SDK older than 0.83.0 it must show the TypeError coming from the real signature.
2. **Run the run report on the test file** (Step 3). One FLAT, one HEALTHY.
3. **Feed the email check a forged copy** (Step 1). Change `spf=pass` to `spf=fail`, swap the link host, and add a fake all-pass header underneath. The output must change, and the fake header must be marked "further down: ignore."
4. **Run one small live loop** (Step 6), with permission. Reads must grow.
5. **Run the run report on the next real production run.** That's the one that counts.
6. **Run the repeat report on a week of fingerprints** before you choose between a cache and an answer memory.
7. **Dry-run the answer memory** with a fake model. It should count every repeat and change nothing.

---

## The Framework: The Edge of the Meter

Every meter has an edge. It measures what it was built to see, and nothing past that line.

- **A vendor's alarm** sees the traffic the vendor bills. Inside that line, it can be exactly right. Ours was.
- **Your own ledger** sees the calls that write to it. Server functions, cron jobs and one-off tools can live their whole lives outside it.
- **A hit rate** sees one number for everything. Our 17% hid 37 runs that were broken in exactly the same way.

**When an alarm arrives, ask three questions in order. Is it real? What can it not see? Did the work need doing twice?**

1. **Is it real?** Prove the alarm before you spend a minute on it. Then believe it. Ours passed every check, and what it pointed at was real.
2. **What can it not see?** Name every meter's edge and what lives past it. Anthropic's alarm could not see a gateway bill more than six times larger with zero cache reads. Our own ledger could not see the callers that never wrote to it.
3. **Did the work need doing twice?** Caching saves money only when the same prefix really repeats, and the healthy signature is reads that grow call over call, keeping up with the prompt. But before you tune how cheaply you repeat work, ask whether it needed repeating at all. The clearest waste on the gateway was a 97.7% repeat that no cache could touch.

We call it **The Edge of the Meter.**

### Where this sits in the series

Vol 9 named the rule underneath everything here: refuse to operate on proxies. A vendor's alarm is the most authoritative proxy you will ever get, which is exactly why it's easy to forget it's one. Vol 10 named The Third State: room, no room, and cannot read. A meter that can't see a caller doesn't report zero for it. It reports nothing, and nothing looks a lot like zero. Vol 11's Four Witnesses said a witness can only testify to what it saw. Anthropic's email was a good witness. It testified, accurately, about the one key it could see.

---

## What We Learned

### A 3 AM email about money deserves suspicion first, and belief second.

The headers settled it in minutes. Then the right move was to take it seriously. Their email was specific, accurate, and honest about its own scope. What it pointed at was real.

### A cap that fires is a symptom, not a diagnosis.

Our spending cap told TIG the truth at once: this email hit its cap. It could not tell him why the budget ran out. The why was in the cache reads, and nothing was reading those until the email arrived.

### Your tests are only as strict as your fakes.

A fake client that accepts any argument will bless a call your real toolkit rejects. We had 148 green tests that could not have caught the one mistake that would have failed every email. Build your fakes from the real signature.

### The docs describe the current toolkit. Your pin describes yours.

Anthropic's docs were right. Our SDK was twelve days too old for the argument they show. Read the signature you actually have.

### Flat is a signature. So is growth.

Seventeen percent sounded like a number to improve. Thirty-seven runs, each with a flat read, sounded like a bug. The second view is the one that found it.

### Every meter has an edge, including ours.

It's easy to read a vendor's alarm as a verdict on your whole bill. It's a verdict on the part the vendor can see. Then our own ledger turned out to have the same kind of edge: callers that never wrote to it, and no admin key to pull the vendor's full report. Write down where every meter stops, especially your own.

### Before you make a repeat cheaper, ask whether it needed to happen.

The cache fix was worth doing. But on the gateway, the clearest saving was an article scorer re-sending byte-identical prompts every day, behind a "has anything changed?" check that could never say no. Caching could not have found that. A fingerprint did.

### Our first write-up of this day was wrong in at least five places.

The day this happened, our own account said the cap failed quietly, that the bad fix would have failed silently, that the gateway was twice the direct spend, that the receipt reader re-read one file every day, and that no Anthropic email could be answered. All five were wrong. The cap texted TIG about a second after it fired. The bad fix would have been loud and vague, not silent. The gateway was more than six times larger over the same 30 days. Sixty percent of the receipt reader's reads were files it had already read, not one file every day. And only the cache email came from a no-reply address; Anthropic's billing emails reply to a support address. The fact-check for this article caught all five, and every correction here was re-checked at the source. The receipts include the corrections.

### The thank-you.

Thank you, Anthropic, for the nudge. Your 3 AM email spotted a leak we hadn't, said so in plain words, and was honest about where its own view stopped. Every alarm should be that good.

Every token we stop paying for twice is a little more room for the work that matters: the younglings we serve.

---

## The "Start Here" Prompt

If you want to build this for your own setup, give your agent this prompt:

```
I got (or want to be ready for) an email from my AI vendor saying my prompt
cache hit rate is low. Help me prove it, fix what's real, and find what the
email can't see. Work in this order, and stop to ask me before anything that
costs money.

1. PROVE IT. I'll save the email as a .eml file. Write a script that prints
   the sender, the Reply-To, the SPF/DKIM/DMARC verdicts from the
   Authentication-Results header, and the host of every link. Never open a
   link. Tell me plainly whether it's real.

2. WHO SPENDS. List every API key I hold with this vendor and every place each
   one lives (secret stores, CI secrets, server functions, builds that bake a
   key in). Rank every caller of each key by its share of use, from my own
   logs. Tell me which callers never log at all.

3. FINGERPRINT. Write a read-only script over my usage log that groups calls
   into runs and prints the cache reads for every call. Flag FLAT runs (the
   same read on every call after the first: only the opening is cached),
   HEALTHY runs (each call reads nearly all of the call before it), LAGGING
   runs (reads grow but fall behind the prompt) and runs with no cache at
   all. Numbers only, never prompt text.

4. FIX THE LOOP. For any tool loop, add top-level automatic caching
   (cache_control {"type": "ephemeral"} on the request). Check the INSTALLED
   SDK's real signature first: if messages.create has no cache_control
   argument, send the same field through extra_body. Keep the instructions
   byte-identical, append every turn unchanged, never edit history. Write a
   test whose fake client is built with unittest.mock.create_autospec from
   the real client, so a bad argument fails in the test the way it would in
   production.

5. PROVE IT LIVE. Ask me first. Run three small calls of the real request
   shape and show me the cache reads. They must grow on every call after the
   first. Then run the step 3 script on the next real run.

6. WIDEN. Make a checklist of what this vendor's alarm cannot see: gateways
   and resellers selling me the same models, callers that never log, anything
   the email excludes in its own words. For each blind spot, name what CAN
   see it, or say that nothing does.

7. REPEAT WORK. Log a SHA-256 fingerprint of exactly what each call sends,
   per call site, plus one for its stable prefix. Report how many calls repeat
   work already paid for, per day, and how many reuse the prefix within five
   minutes. Recommend an answer memory (record-only first) where work repeats,
   caching where the prefix comes back warm and is above the model's minimum
   cacheable length, and nothing anywhere else.

Don't change my defaults, keys, or spend caps. Hand me the findings and the one
change you'd make first.
```

Copy that. Paste it into a fresh agent session. It will ask you for the email and your logs, and build the rest around what it finds.

---

## See The Whole Ecosystem

QWF builds an interconnected family of apps and programs. [Quietly Spotting](https://quietlyspotting.org) is the hub. Around it orbit Quietly Writing, Quietly Quoting, Quietly Networking, Quietly Knocking, Quietly Tracking, and more. See the [live ecosystem map](https://quietlyspotting.org/#ecosystem) for what's shipped, what's building, and how it all connects.

Cost is one plane of a bigger system. Every app on that map is built and maintained by agent sessions like the ones in this story, on one shared budget, so every call we stop paying for twice goes back into the work for the people we serve.

## Related Reading

- Vol 9 gave the agent eyes for its own context state, and named the rule this series keeps returning to: refuse to operate on proxies. A vendor's alarm is the most trustworthy proxy we have, and still a proxy.
- Vol 10 kept two subscriptions alive and named The Third State: room, no room, and cannot read. A meter that cannot see a caller is the third state wearing a zero.
- Vol 11 named The Four Witnesses: every source can only testify to what it saw. This volume met a fifth witness, a vendor's alarm, honest about exactly one key.

Vol 12 is the volume where the alarm was right, and the bigger lesson was everything it could not see.

---

## About This Series

**Built from Broken** is published by the [Quietly Working Foundation](https://quietlyworking.org) (QWF), a 501(c)(3) nonprofit. Our mission is to serve youth 30 and younger... helping them discover purpose, build skills, and create legacy. We do this through product-based fundraising programs and student training.

We run a nonprofit almost entirely on AI agent infrastructure. Our backoffice is an Obsidian vault orchestrated by Claude Code (Anthropic's CLI-based AI coding agent), built on a three-layer architecture... Directives (what to do), Orchestration (the AI agent making decisions), and Execution (deterministic Python scripts doing the work). We build tools, we break things, we fix them... and then we write down what happened so you don't have to learn it the hard way.

This volume grew from one day, October 21, 2026: a 3 AM email, a fix by early afternoon, a real email confirming it by late afternoon, and a fact-check that corrected five lines of our own first account. Every number here was re-counted from our own records, re-read from a live page, or copied from the raw output of the test that produced it.

**The name:** "Built from Broken" comes from a core belief... that brokenness isn't something to hide. It's proof of what's possible. Every solution in this series exists because something failed. We show the scars, not to complain, but because someone else is hitting the same wall right now... and the fastest way through is knowing they're not alone.

---

*Built from Broken, Vol. 12 ... Published October 2026*
*Quietly Working Foundation | quietlyworking.org*
*Written by Chaplain TIG with Claude (Anthropic)*