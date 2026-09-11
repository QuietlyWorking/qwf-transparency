---
title: "Built from Broken: Vol. 10"
slug: "vol-10-when-your-ai-agent-runs-out-of-road-mid-flow"
pillar: "built-from-broken"
description: "A Claude Max subscription is not one number. It is three limits with three reset clocks, and the one that stops you is the one the headline hides. We built a ca"
publishDate: "2026-09-11"
tags: ["QWF", "QWU", "built-from-broken", "ai-agent", "claude-code", "capacity", "multi-account", "observability"]
series: "Built from Broken"
volume: 10
hook: "The dashboard said 53% used. The model I was actually using sat at 90%, severity critical. Every new session went to the exhausted account for an afternoon, and every surface said fine."
isHome: false
---
# Built from Broken: Vol. 10
## When Your AI Agent Runs Out of Road Mid-Flow

> *Built from Broken is a series from the Quietly Working Foundation about real problems we face running AI-powered nonprofit operations... and the real solutions we build. Every fix exists because something failed first. We show the receipts.*

---

## The Problem: The Number You Watch Is Not the Number That Stops You

A Claude Max subscription reads as one percentage. It is at least three, each on its own reset clock, and on the day this build shipped the headline read **53% used** while the weekly limit on the model doing the actual work sat at **90%, severity critical**. Route your work on the headline and you will land it on an account that looks half-empty and is effectively out.

That is the shape of every problem in this volume. The number was true. It was also not the number that mattered.

Here is what "three limits, three clocks" looks like once you can see it. This is the capacity card we built, as it read one evening during the build: two subscriptions, every limit on each, when each refills, and one line at the top answering the only question that matters.

![bfb-vol10-claude-capacity-card.png](/images/bfb-vol10-claude-capacity-card.png)

Notice the word BINDING. It is not on the same row for both accounts. On the main account the 5-hour session window is what binds right now. On the second account it is the weekly limit on the frontier model. The headline number on either card tells you none of that.

We run ten to fifteen Claude Code sessions at the same time across one operator. Ten of them are useful at any given moment. When the weekly cap on our development model hits, all of them stop at once, in the middle of whatever they were building, and the reset is days away. The obvious fix is a second subscription. The obvious fix is right, and it is also where the real problem starts... because nothing in the product tells you which of your subscriptions to open next, and the moment you have two you are doing that arithmetic in your head, badly, while trying to think about the work.

### What a subscription actually is

Anthropic's own usage endpoint (the one the Claude Code client calls to draw its `/usage` screen) returns a list of independent limits. On a Max plan today there are three that matter:

- A rolling **5-hour session window**
- A **weekly all-models pool**
- A **weekly pool scoped to one model** (reported with that model's display name)

Each has its own `resets_at`. The scoped weekly limit is the one that runs out first if you do serious agentic work on the frontier model, and it is the one the headline number does not show. We learned this by reading the endpoint, not the marketing page, and the whole design below turns on it.

The second thing that turns the design: **reset clocks stagger.** Two subscriptions bought on different days refill on different days. Ours refill Thursday and Sunday. That staggering IS the value of holding more than one... something has almost always just come back. A picker that ignored reset time would waste most of what you paid for.

### Why Build This at All

Two triggers, and you only need one of them.

**Trigger 1: one subscription stops you mid-flow.** If you run serious agentic work on the frontier model, the scoped weekly limit will hit while you are in the middle of something. Not at a clean boundary. Mid-build, mid-thought, with a dozen sessions holding context you cannot cheaply rebuild. A second subscription on a different reset day is the fix, and the moment you have two, "which one do I open" becomes a question you answer twenty times a day. This system exists so nobody answers it by hand.

**Trigger 2: you want another model family in your everyday development family.** Not as a science project on the side, but sitting beside Claude in the same gauge, chosen by the same picker, started through the same doors. Another vendor's coding-agent subscription. A local model on your own hardware. Whatever comes next. The failure mode without a system like this is that each new subscription becomes its own island: its own usage screen, its own login ritual, its own missing skills and settings, and a human doing the arithmetic across all of them.

So the design has two rules that look like over-engineering for two Claude accounts and are not:

- **Growth is zero-config.** The poller discovers any new login directory on its own. Subscription three costs one login and nothing else.
- **The mark is the family, the number is the account.** On the card, each account carries the model family's mark and its own number. A second family gets its own mark and its own numbering beside it, with no redesign of the card or the table underneath.

Receipts, in order: as of this writing, two Claude accounts are live and everything below is proven on them. The card and the capacity table were built with headroom for a second family; the picker and the two doors are Claude-specific today and would gain a family-aware branch when a second family actually arrives. We are saying what is built, not what is planned.

### What This Is Not: The Other Way We Use Many Models

We already run many models. Our execution layer (the deterministic Python scripts that do the actual work) calls every LLM through OpenRouter, one gateway, one key, one bill. A script does not say "call Claude." It says "I need the FLAGSHIP tier for this judgment call" or "the FAST tier for this name-parsing step" or "the VIDEO tier for this recording," and a single model-config module maps each tier to whichever model currently earns that slot, Claude or Gemini or Whisper. When a better model ships, we change one mapping and every script inherits it. When a pipeline needs three different models in five steps, that is the normal shape, not a special case.

That is the right tool when an **agent inside a process** needs a specific model for a specific step, billed per token, with no human in the loop.

It is the wrong tool for the thing this volume is about. The daily development work... the ten to fifteen interactive sessions where a person and an agent build the system itself... runs on subscriptions, not per-token API calls, because at that volume a subscription is the only thing that makes sense and because the coding agent is the product, not just the model behind it. Subscriptions come with logins, quotas, reset clocks, and editor integration. None of that exists in the API world, and OpenRouter cannot route a chat panel.

So, two systems, two jobs:

- **OpenRouter, in the execution layer:** any model, per call, per step, chosen by tier. Pipelines and scripts.
- **This system, in the development layer:** any number of subscriptions, from any family, chosen per new session by room left. People and agents building together.

They do not overlap and they do not compete. If you only have the first, you are still doing quota arithmetic by hand every morning. If you only have the second, your scripts are welded to one vendor.

### The Originating Pain

Before the fix, the human in the loop (Chaplain TIG) was the router. Open a session, wonder which account has room, open the usage screen in one account, open it in the other, compare three numbers against three numbers, pick one, forget the answer by the next session twenty minutes later. He brought a research document on running multiple subscriptions to a working session on 2026-09-08 and asked for a system that would do that arithmetic for him and grow to five accounts without a rewrite.

The research document was directionally right and wrong in two places that mattered. It called the third-party account-switching tool "Node/npm-based" three times. It is Python. A different package of the same name, by a different author, exists on npm. Following the document as written would have installed a stranger's package and then handed it Claude login credentials. We caught it by checking both registries before installing anything. A name match across ecosystems is not identity.

The second miss was silence on the thing that decides the design: the document treated a subscription as one quota. TIG supplied the correction himself, from watching his own account hit the scoped limit while the headline looked fine.

### Then the Instruments Started Lying

We built the system in one long day. Over the next two days, three faults surfaced. Every one of them was silent. Every one of them left every surface reading healthy. They are the reason this article exists.

**Fault 1 (2026-09-08): the second subscription that was secretly the first one.**
We registered the new login into its own config directory. The terminal showed a clean first-run setup and "Claude Max" in the header. The capacity card showed two accounts. Every reading agreed... because they were the same readings. Session 2% / weekly 53% / scoped 90%, twice. The browser had handed back the existing session instead of a fresh login. Root cause: **private windows share one session with each other.** A second private window is not a clean browser. A browser or profile that has never signed in to Claude is.

A fresh config directory looks identical whether the login worked or not. The setup screen tells you the DIRECTORY is new. It never tells you which ACCOUNT is in it, and the usage numbers cannot tell you either, because a duplicate returns the same numbers. Only identity can. The profile endpoint returns an account uuid, and two directories sharing one uuid are one subscription. Had we not checked, the picker would have routed work to "the fresh subscription" and landed it on the exhausted one while the card displayed double the capacity that existed.

**Fault 2 (2026-09-08, within the hour of building the guard for it): the editor updated itself and took the switchboard with it.**
The VS Code extension went from 2.1.263 to 2.1.266 in the middle of the session. An extension update installs into a NEW directory. Our launcher lived in the old one. Every chat panel would have quietly returned to one subscription on the next window reload, nothing broken, nothing said. While fixing that we found the version directories were being compared as strings, which sorts 2.1.99 after 2.1.100 and would have installed into a stale extension while reporting success.

**Fault 3 (2026-09-09, an afternoon): the picker sent every new session to the account at 92% while the other sat at 10%, and the card said "most room: the other one" the whole time.**
The second subscription's login token expired around 10 AM Pacific. Only a running client renews a token, nothing was running on that account, so the usage endpoint answered every read with **HTTP 429** (not 401... and the 429s kept coming for minutes after a fresh token existed). The poller wrote nothing for a failed account. The card kept its last good rows with only a small "3h ago" as the tell. The local snapshot dropped the account entirely, so the picker saw only the main one and routed everything there.

Self-locking. Nothing routed to the account, so nothing renewed its token, so it stayed unreadable, so nothing routed to it. Two surfaces, both truthful from what they had, neither able to say "I cannot read this."

**Fault 3b (overnight 2026-09-09 into 09-10): a live session is not a renewing session.**
The keep-alive we wrote for Fault 3 skipped any account with a running Claude process, reasoning that the client renews its own token. It does... only when it talks to Claude. Windows left open at the prompt overnight made no calls. Both logins expired (8:40 PM and 9:00 PM Pacific), the keep-alive stood down every ten minutes saying "a session is running" with the token an hour dead, the poller failed three runs in a row on every account at once, and nothing said so anywhere a person looks. Recovery was TIG opening a new window in the morning... the manual rescue the script exists to replace.

### Why the Obvious Fixes Don't Work

**Auto-rotating a running session onto whichever login has room.** Third-party tools offer this. We ruled it out permanently. Choosing where a NEW session starts is allocating capacity you already paid for. Yanking a live conversation onto a different login to dodge a cap is a different act: hazardous with a dozen sessions open (which one just moved?), and the one behavior that actually reads as limit evasion. Our understanding of Anthropic's position is that what they ban is a relay or proxy pooling OAuth tokens and impersonating the official client. Running the official binary against separate config directories, each holding your own paid login, is the pattern they document and tolerate. We stay on that side of the line and never move a running session.

**Adopting the third-party switcher as-is.** Once the dangerous modes were off the table, the only thing left in it was setting one environment variable, which we can do ourselves. Its quota reading was not per-model, so it could not route on the limit that actually binds. That left an outside package sitting in the credential path, bought for nothing. An outside reviewer independently reached the same conclusion.

**Per-panel environment variables in the editor.** Probed, not assumed: every Claude chat panel across every VS Code window on a remote host is a child of ONE extension host process with ONE environment. There is no per-panel way to say which account a panel should use. Anthropic's feature request for this is open.

**Routing by folder.** Also impossible here. Every panel runs from the same checkout.

**Refreshing tokens ourselves to keep idle accounts readable.** Racing the client's own refresh can revoke the refresh token and log the account out entirely. The client owns renewal. We can only give it a reason to run.

The insight underneath all of these: **the gauge has three states, not two.** Room, no room, and cannot read. Every silent fault above was a "cannot read" that got rendered as one of the other two. Fix that at the instrument, and the routing on top of it stops lying.

---

## The Solution: One Gauge, One Brain, Two Doors, One Heartbeat

Six small pieces. Each one exists because of a specific fault above.

### Piece 1: The Poller (the gauge)

Every 20 minutes, a read-only script walks every Claude config directory on the machine, calls the usage endpoint with that login's bearer token, and upserts one row per (account x limit kind x model scope) into a small table. It also calls the profile endpoint and stores the account uuid on every row, and refuses to count two directories sharing one uuid as two subscriptions.

Rules that came from the faults:

- **Percentages, never token counts.** The weekly ceiling moves (a temporary boost was live during our build). A percentage is correct on both sides of a ceiling change.
- **Fail loud.** A missing `limits` array is an error, never an empty success. An expired token is reported as `needs_login`, never as zero usage. "No data" and "plenty of room" must never look the same.
- **Never send a token you can see is expired.** The credentials file carries the expiry. Sending a dead token earned 429s that stalled every reader for three extra minutes at a time.
- **A failed read is written down, not skipped.** The last good numbers are carried forward with a `last_ok_at`, the row gets a `read_status` and an `unreadable_since`, and the card shows an amber "unreadable since... why" note per account.
- **Store Anthropic's own `severity` and `is_active` as given.** Their thresholds stay theirs.
- **Every-account-blind leaves a record** in our ops channel, once on the way in and once on recovery. Never every 20 minutes, never a page... an idle evening must not interrupt anyone.
- **Read-only against credentials.** Never writes a credential file, never refreshes a token, never prints one.
- **Zero-config growth.** Any new `~/.claude-*` directory holding a login is discovered automatically. Adding a fifth subscription needs no code change.

### Piece 2: The Capacity Card (the display)

One card in our internal command center, on the desktop dashboard, on the subscriptions page, and on the phone... because "can I start something right now" is the away-from-desk question. Every account, every limit, the percent used, when each one refills, Anthropic's severity, and a line at the top that answers the only question that matters: **Most room now: which account, and how much of the binding limit is left.** The limit that currently binds is marked. Each account carries its own number beside the model-family mark, derived from account identity and never from list position, because the list re-sorts as capacity shifts.

### Piece 3: The Picker (the brain)

One read-only script decides which config directory a NEW session should use. Both front doors call it, so they can never disagree.

The rule:

1. **Disqualify anything spent on ANY window.** Headroom on the scoped limit of an account with no all-models headroom is headroom you cannot spend... you would hit a wall on the first message.
2. **Among the living, rank by the weakest link:** the weekly limit scoped to the model you actually work in. TIG's own call and the right one.
3. **A window refilling within 25 minutes counts as already refilled.** An account at 92% that resets in fifteen minutes is worth more, for work starting now, than one at 70% that resets Thursday.
4. **An unreadable account is not a dead account.** Route on its last good reading for up to six hours. Weekly limits move slowly, and the session that lands there is precisely what renews its token.
5. **Every uncertain path returns the default account and says why.** Stale snapshot, unreadable file, unknown session id, no accounts at all... you get your normal account. The worst outcome must be "you got your usual login," never "your editor would not start."
6. **Resumes are pinned by finding which account directory actually holds the conversation.** No separate record to drift.

### Piece 4: Two Doors (terminal and editor)

**The terminal door** is a twenty-line shell wrapper: ask the picker, export the config-directory variable, exec the real client. Force an account by number or name if you want to.

**The editor door** is the hard part. The extension starts each chat by running one specific program file it bundles, at a writable path, with no signature beside it. We put a small launcher at that path. It asks the same picker, sets the same one environment variable, and execs the real binary, unmodified, which still talks to Anthropic directly. It proxies nothing and pools nothing. The interception is of the editor's launch, not of anyone's traffic.

The honest cost: editing a vendor's extension directory is unsupported, and every extension update installs into a new directory and leaves the launcher behind. So a repair script runs every ten minutes, compares extension versions numerically, reinstalls when needed, probes six behaviors against a stand-in before it touches the real directory, self-reverts on any failed probe, and **records both repairs and failed repairs** to a table the card reads. A system that quietly fixes itself teaches nobody that the ground keeps moving. Worse, the failure case is the quiet one: a failed repair leaves a perfectly working editor with no switchboard and no error anywhere, which is exactly the shape of problem that costs half your paid capacity for weeks before anyone asks why one subscription is doing all the work.

### Piece 5: Config Sync (so the second account is the same agent)

Anything living with the repo is shared by every account for free: project hooks, agents, project skills, permissions, MCP servers, the project instructions file. What is NOT shared is the whole user layer: the user settings file (output style, model, effort, status line, user hooks, enabled plugins), user skills, output-style definitions, the plugin store. A fresh login gets a ~67-byte settings file and runs with none of that... quietly, looking completely normal.

The sync script symlinks the shared pieces from the primary account into every secondary one. Symlinks, not copies: a copy is a promise to remember, and a stale copy reports nothing. Credentials stay separate (the entire point) and so does conversation history, because sharing a writable history store across two accounts and two client builds (the editor and the CLI run different versions) is how it gets corrupted.

### Piece 6: The Keep-Alive (the heartbeat)

A token lives about eight hours and only the running client renews it. So every ten minutes a script checks each account's expiry and, for any account within fifteen minutes of expiry or past it, runs the official client once with a one-word prompt on the cheapest model, in a scratch directory with no project hooks loaded. The client renews its own token as a side effect. One tiny call per account per eight hours.

Two guards, both from Fault 3b:

- **A live session gets fifteen minutes past expiry to prove it is awake.** After that it is idle by evidence and the keep-alive renews underneath it, which is the same move as opening a new window and is safe for every other session on that directory (they re-read the credentials file; this is how many windows on one account already coexist).
- **Stand down if the credentials file changed in the last two minutes.** Something else just renewed, and a second renewal on its heels is the race that can revoke the refresh token.

### The Before and After

**Before** (one subscription, or two managed by hand):

```
09:00  Open session 1 on the main account. Work.
10:30  Open sessions 2 through 8. Work.
13:40  Scoped weekly limit hits on the main account. Eight sessions stop.
13:41  Open the usage screen. Headline says 53%. Confused.
13:45  Find the per-model line. 100%. Reset: Thursday.
13:50  Sign out, sign in to the second account in every window. Lose two
       resumable conversations to the wrong directory. Work resumes ~14:30.
       Output style, status line, and user skills are missing and nobody
       notices until the tone of the replies changes.
```

**After** (the system as it runs today):

```
09:00  Open a chat panel. Switchboard asks the picker: account #2 has
       the most room on the binding limit. Session starts there. Same
       hooks, same skills, same output style.
10:30  Open seven more. Each one lands wherever the room is at that
       moment. Resumed conversations stay where they live.
13:40  Account #1's scoped limit hits. The sessions already on it keep
       their own client's 70% warning; no session is moved.
13:41  Every NEW session lands on #2 automatically. Phone shows the card:
       "Most room now: #2 (61% left)". Nothing to look up.
Thu    #1 refills. Picker starts preferring it again. Nobody did anything.
```

### The Architecture

```
              ┌──────────────────────────────────────────────┐
              │  Anthropic (official endpoints, official client)│
              │   /api/oauth/usage      /api/oauth/profile    │
              └───────────▲───────────────────────▲──────────┘
                          │ read-only, per login   │ identity (uuid)
                          │                        │
   every 20 min   ┌───────┴────────────────────────┴───────┐
   ───────────►   │ POLLER  (fail-loud, %, three states)    │
                  │  ~/.claude/  ~/.claude-002/  ~/.claude-N │
                  └──────┬─────────────────────────┬────────┘
                         │ upsert                  │ snapshot
                         ▼                         ▼
              ┌────────────────────┐    ┌──────────────────────┐
              │ capacity table     │    │ local snapshot (json)│
              │ (account x limit)  │    └──────────┬───────────┘
              └─────────┬──────────┘               │
                        │                          ▼
                        ▼                ┌──────────────────────┐
              ┌────────────────────┐     │ PICKER (read-only)   │
              │ CAPACITY CARD      │     │ living only → weakest│
              │ desktop/page/phone │     │ link → reset ≤25m →  │
              │ "Most room now"    │     │ stale ≤6h → default  │
              └────────────────────┘     └───┬──────────────┬───┘
                                             │              │
                              ┌──────────────┘              └──────────────┐
                              ▼                                            ▼
                 ┌────────────────────────┐                  ┌────────────────────────┐
                 │ TERMINAL DOOR          │                  │ EDITOR DOOR            │
                 │ launch script → picker │                  │ launcher at the path   │
                 │ → CLAUDE_CONFIG_DIR →  │                  │ the extension runs →   │
                 │ exec claude            │                  │ picker → exec real bin │
                 └────────────────────────┘                  └───────────▲────────────┘
                                                                         │ reinstall on
   every 10 min   ┌───────────────────────────┐   ┌──────────────────────┴──────────┐
   ───────────►   │ KEEP-ALIVE  (one-word     │   │ REPAIR  (numeric version compare,│
                  │ prompt, cheapest model,   │   │ probe-then-install, self-revert, │
                  │ 15-min idle override,     │   │ records repairs AND failures)    │
                  │ 2-min recent-touch guard) │   └─────────────────────────────────┘
                  └───────────────────────────┘
   every 10 min   ┌───────────────────────────┐
   ───────────►   │ CONFIG SYNC  (symlink the │
                  │ user layer; keep creds +  │
                  │ history separate)         │
                  └───────────────────────────┘
```

---

## How to Build Your Own

Everything below is environment-agnostic. Swap the placeholder names for your own. Every snippet runs with your values filled in. We assume Claude Code on a Linux box with VS Code Remote; the shape ports to a Mac with paths changed.

### Step 0: Get a genuinely second subscription

- Use a real alias on a domain you own (`claude002@your-domain`, zero-padded so accounts sort), **not** a plus-address. Plus-tags are the recognized one-mailbox-many-accounts pattern, are commonly normalized away, and give no separate billing trail.
- Register it into its own config directory: `CLAUDE_CONFIG_DIR=~/.claude-claude002 claude` and complete the login.
- **Use a browser or profile that has never signed in to Claude.** Not a private window. Read the account name on the authorization page before approving.
- Then verify by identity, never by numbers:

```python
# verify_accounts.py ... is each login a DIFFERENT subscription?
import json, urllib.request
from pathlib import Path

PROFILE = "https://api.anthropic.com/api/oauth/profile"
HEADERS = {"anthropic-beta": "oauth-2025-04-20", "Content-Type": "application/json"}

def identity(token):
    req = urllib.request.Request(PROFILE, headers={**HEADERS, "Authorization": f"Bearer {token}"})
    with urllib.request.urlopen(req, timeout=30) as r:
        acct = json.loads(r.read()).get("account") or {}
    return acct.get("uuid"), acct.get("email_address")

home = Path.home()
dirs = [home / ".claude"] + sorted(p for p in home.glob(".claude-*") if p.is_dir())
seen = {}
for d in dirs:
    cred = d / ".credentials.json"
    if not cred.is_file():
        continue
    tok = (json.loads(cred.read_text()).get("claudeAiOauth") or {}).get("accessToken")
    uuid, email = identity(tok)          # never print tok
    tag = "DUPLICATE of " + seen[uuid] if uuid in seen else "ok"
    seen.setdefault(uuid, d.name)
    print(f"{d.name:22} {email:36} {tag}")
```

If two directories print the same uuid, you have one subscription signed in twice. Delete the duplicate directory and log in again from a clean browser.

### Step 1: Read the real limits, and store three states

```python
# poll_limits.py ... run every 20 minutes
import json, time, urllib.request, urllib.error
from datetime import datetime, timezone
from pathlib import Path

USAGE = "https://api.anthropic.com/api/oauth/usage"
HEADERS = {"anthropic-beta": "oauth-2025-04-20", "Content-Type": "application/json"}
SNAPSHOT = Path("your_state_dir/claude_capacity.json")

def read_usage(token):
    req = urllib.request.Request(USAGE, headers={**HEADERS, "Authorization": f"Bearer {token}"})
    with urllib.request.urlopen(req, timeout=30) as r:
        payload = json.loads(r.read())
    limits = payload.get("limits")
    if not isinstance(limits, list):
        raise RuntimeError("usage payload has no limits[] ... endpoint changed?")  # fail LOUD
    return [{
        "kind": l.get("kind"),                       # session / weekly_all / weekly_scoped
        "model": ((l.get("scope") or {}).get("model") or {}).get("display_name") or "",
        "percent": l.get("percent"),                  # percent USED. Store this, never tokens.
        "resets_at": l.get("resets_at"),
        "severity": l.get("severity"),                # theirs, as given
        "is_active": l.get("is_active"),
    } for l in limits]

def poll_one(d, prior):
    cred = d / ".credentials.json"
    oauth = (json.loads(cred.read_text()).get("claudeAiOauth") or {})
    token, exp_ms = oauth.get("accessToken"), oauth.get("expiresAt") or 0
    now = datetime.now(timezone.utc).isoformat()
    if not token:
        status = "needs_login"
    elif exp_ms and exp_ms / 1000 < time.time():
        status = "token_expired"                      # do NOT send it; that earns 429s
    else:
        try:
            return {"dir": str(d), "status": "ok", "observed_at": now,
                    "last_ok_at": now, "limits": read_usage(token)}
        except urllib.error.HTTPError as e:
            status = f"http_{e.code}"
        except Exception as e:
            status = type(e).__name__
    # The third state: carry the last good numbers forward, and SAY it failed.
    old = prior.get(str(d), {})
    return {"dir": str(d), "status": status, "observed_at": now,
            "last_ok_at": old.get("last_ok_at"), "unreadable_since": old.get("unreadable_since") or now,
            "limits": old.get("limits", [])}

if __name__ == "__main__":
    prior = {a["dir"]: a for a in json.loads(SNAPSHOT.read_text()).get("accounts", [])} if SNAPSHOT.exists() else {}
    home = Path.home()
    dirs = [home / ".claude"] + sorted(p for p in home.glob(".claude-*") if p.is_dir())
    accounts = [poll_one(d, prior) for d in dirs if (d / ".credentials.json").is_file()]
    SNAPSHOT.write_text(json.dumps({"written_at": datetime.now(timezone.utc).isoformat(),
                                    "accounts": accounts}, indent=2))
    # Then upsert each account's limits into your_database, one row per
    # (account, kind, model) so the table never grows with time.
```

Design notes for this step:

- Also fetch and store the account uuid from Step 0 on every row, and skip any directory whose uuid you have already seen this run. That is the duplicate guard, made permanent.
- Upsert on `(account, kind, model)`. If your database's upsert target is a unique index, make sure it is over plain columns... an index over `coalesce(model, '')` is not a valid upsert target in PostgREST, and every poll will INSERT a new row that looks plausible. We caught that one before the first write. Make `model` `NOT NULL DEFAULT ''` instead.
- The endpoint is undocumented. Everything here is written so a change fails loudly, and `observed_at` leaves staleness visible on whatever you render.

### Step 2: Render it where you actually look

Whatever your dashboard is, the card needs, per account: each limit's percent used, its reset time in your timezone, Anthropic's severity, and an amber note when `status != "ok"` with the reason and `unreadable_since`. At the top, one line: **Most room now: <account> (<percent left> on the binding limit)**, computed by the same rule the picker uses (Step 3) so the card and the router can never disagree. Put it on your phone. The question it answers is asked away from the desk.

### Step 3: The picker

```python
# pick_account.py ... prints ONE config directory. Read-only. Fail-safe.
import json, sys
from datetime import datetime, timezone, timedelta
from pathlib import Path

SNAPSHOT = Path("your_state_dir/claude_capacity.json")
DEFAULT = Path.home() / ".claude"
SCOPED_MODEL = "Fable"          # the model your development actually runs in
REFILL_SOON_MIN = 25            # a window resetting this soon counts as refilled
ROUTE_ON_STALE_MAX_MIN = 360    # route on an unreadable account's last reading up to this age
SNAPSHOT_MAX_AGE_MIN = 90       # older than this, stop pretending

def bail(why):
    print(f"pick: {why}; using default", file=sys.stderr)
    print(DEFAULT); sys.exit(0)

def effective(limit, now):
    """Percent used, treating an imminent reset as already refilled."""
    r = limit.get("resets_at")
    if r:
        try:
            if datetime.fromisoformat(r.replace("Z", "+00:00")) - now <= timedelta(minutes=REFILL_SOON_MIN):
                return 0.0
        except ValueError:
            pass
    return float(limit.get("percent") or 0)

def resume_dir(session_id):
    for d in [DEFAULT] + sorted(Path.home().glob(".claude-*")):
        if any((d / "projects").rglob(f"{session_id}.jsonl")):
            return d
    return None

if __name__ == "__main__":
    if len(sys.argv) > 2 and sys.argv[1] == "--resume":
        d = resume_dir(sys.argv[2])
        print(d or DEFAULT); sys.exit(0)          # a conversation lives where it lives
    if not SNAPSHOT.exists():
        bail("no snapshot")
    snap = json.loads(SNAPSHOT.read_text())
    now = datetime.now(timezone.utc)
    written = datetime.fromisoformat(snap["written_at"])
    if now - written > timedelta(minutes=SNAPSHOT_MAX_AGE_MIN):
        bail("snapshot stale")

    candidates = []
    for a in snap.get("accounts", []):
        if a["status"] != "ok":
            ok_at = a.get("last_ok_at")
            if not ok_at or now - datetime.fromisoformat(ok_at) > timedelta(minutes=ROUTE_ON_STALE_MAX_MIN):
                continue                          # unreadable too long: stop pretending
        limits = a.get("limits") or []
        if not limits:
            continue
        # 1. Disqualify anything spent on ANY window.
        if any(effective(l, now) >= 100 for l in limits):
            continue
        # 2. Weakest link = the weekly limit scoped to the model you work in.
        scoped = [l for l in limits if l["kind"] == "weekly_scoped" and l["model"] == SCOPED_MODEL]
        weakest = effective(scoped[0], now) if scoped else max(effective(l, now) for l in limits)
        candidates.append((weakest, a["dir"]))
    if not candidates:
        bail("no living account")
    candidates.sort()
    print(candidates[0][1])
```

Why each rule is there is in the Solution section above. The one people argue with is rule 5 (default on any doubt). Keep it. The picker sits in front of your editor's launch path; a clever picker that throws is an editor that will not open.

### Step 4: The terminal door

```bash
#!/bin/bash
# launch_claude.sh ... start a session on the chosen subscription.
#   launch_claude.sh              auto (most room)
#   launch_claude.sh 2            force account #2
PICKER="your_scripts_dir/pick_account.py"
case "$1" in
  1|primary) DIR="$HOME/.claude"; shift ;;
  [0-9]*)    DIR="$HOME/.claude-claude$(printf '%03d' "$1")"; shift ;;
  "")        DIR=$(python3 "$PICKER") ;;
esac
[ -d "$DIR" ] || { echo "No such account: $DIR" >&2; exit 1; }
echo "Claude on: $(basename "$DIR")" >&2
CLAUDE_CONFIG_DIR="$DIR" exec claude "$@"
```

### Step 5: The editor door (the switchboard)

Find the bundled binary the extension actually runs. On VS Code Remote it lives under `~/.vscode-server/extensions/anthropic.claude-code-<version>/resources/native-binary/claude`. Confirm it by listing the process tree while a chat panel is open. Then:

1. Rename the real binary to `claude.real` **in the same directory**.
2. Write a launcher at the original path:

```bash
#!/bin/bash
# switchboard ... sits where the editor expects the client. Proxies nothing.
HERE="$(cd "$(dirname "$0")" && pwd)"
REAL="$HERE/claude.real"
PICKER="your_scripts_dir/pick_account.py"
if [ -z "$CLAUDE_CONFIG_DIR" ]; then
  # A resume carries its session id; pin it to the directory that holds it.
  RESUME=""
  for ((i=1; i<=$#; i++)); do
    [ "${!i}" = "--resume" ] && j=$((i+1)) && RESUME="${!j}"
  done
  if [ -n "$RESUME" ]; then DIR=$(python3 "$PICKER" --resume "$RESUME"); else DIR=$(python3 "$PICKER"); fi
  [ -d "$DIR" ] && export CLAUDE_CONFIG_DIR="$DIR"
fi
exec "$REAL" "$@"
```

3. `chmod +x` it. Open a new chat panel. Confirm with `ls -l /proc/<pid>/environ`-style inspection (or print `CLAUDE_CONFIG_DIR` from inside the session) that the panel landed where the picker said.

Write the install as a script that **probes before it commits**: copy the real binary to a temp dir, install the launcher there, and check that (a) `--version` passes through, (b) an explicit `CLAUDE_CONFIG_DIR` is honored untouched, (c) a `--resume` pins to the right directory, (d) an unknown session falls back to default, (e) exit codes pass through, (f) the launcher survives a missing picker. Only then touch the real directory, and revert on any failure.

### Step 6: Repair on every extension update

```python
# repair_switchboard.py ... every 10 minutes
import re, shutil, subprocess
from pathlib import Path

EXT_GLOB = ".vscode-server/extensions/anthropic.claude-code-*"
def version_key(p):                      # NUMERIC compare: 2.1.100 > 2.1.99
    return tuple(int(x) for x in re.findall(r"\d+", p.name.split("claude-code-")[-1]))

dirs = sorted(Path.home().glob(EXT_GLOB), key=version_key)
newest = dirs[-1] if dirs else None
if not newest:
    raise SystemExit("no extension dir")
bin_path = newest / "resources/native-binary/claude"
installed = (newest / "resources/native-binary/claude.real").exists() and b"switchboard" in bin_path.read_bytes()[:400]
if not installed:
    result = subprocess.run(["python3", "your_scripts_dir/install_switchboard.py", "--install"])
    # Record BOTH outcomes somewhere the card reads: extension version,
    # installed true/false, last_repaired_at, last_repair_error (write it
    # even on success so a stale failure is cleared).
```

The point is not the reinstall. The point is the record. A failed repair looks exactly like a working editor.

### Step 7: Sync the user layer

```python
# sync_account_config.py ... symlink, never copy
import shutil
from datetime import datetime
from pathlib import Path

PRIMARY = Path.home() / ".claude"
SHARED = ["settings.json", "skills", "output-styles", "commands", "plugins", "statusline-command.sh"]
for acct in sorted(p for p in Path.home().glob(".claude-*") if (p / ".credentials.json").is_file()):
    for name in SHARED:
        src, dst = PRIMARY / name, acct / name
        if not src.exists() or (dst.is_symlink() and dst.resolve() == src.resolve()):
            continue
        if dst.exists() or dst.is_symlink():      # keep, never delete
            dst.rename(acct / f"{name}.replaced-{datetime.now():%Y%m%d%H%M%S}")
        dst.symlink_to(src)
        print(f"{acct.name}: linked {name}")
# Deliberately NOT shared: .credentials.json, projects/, sessions/, history.jsonl,
# file-history/ and the big per-account .claude.json (merge only its mcpServers key).
```

### Step 8: The keep-alive

```python
# keep_tokens_alive.py ... every 10 minutes
import json, os, subprocess, time
from pathlib import Path

RENEW_WITHIN_MIN = 15       # act this close to expiry (or past it)
OVERRIDE_AFTER_MIN = 15     # a live session gets this long past expiry to prove it is awake
RECENT_TOUCH_S = 120        # stand down if something else just renewed

def live_session(cfg):
    """Is any claude process running with this config directory?"""
    primary = str(cfg) == str(Path.home() / ".claude")
    pids = subprocess.run(["pgrep", "-f", "claude"], capture_output=True, text=True).stdout.split()
    for pid in pids:
        try:
            env = Path(f"/proc/{pid}/environ").read_bytes().split(b"\0")
        except OSError:
            continue
        dirs = [e.split(b"=", 1)[1] for e in env if e.startswith(b"CLAUDE_CONFIG_DIR=")]
        if (dirs and dirs[0] == str(cfg).encode()) or (primary and not dirs):
            return True
    return False

for cfg in [Path.home() / ".claude"] + sorted(Path.home().glob(".claude-*")):
    cred = cfg / ".credentials.json"
    if not cred.is_file():
        continue
    exp_ms = (json.loads(cred.read_text()).get("claudeAiOauth") or {}).get("expiresAt") or 0
    mins_left = (exp_ms / 1000 - time.time()) / 60
    if mins_left > RENEW_WITHIN_MIN:
        continue
    if time.time() - cred.stat().st_mtime < RECENT_TOUCH_S:
        print(f"{cfg.name}: recently touched, standing down"); continue
    if live_session(cfg) and mins_left > -OVERRIDE_AFTER_MIN:
        print(f"{cfg.name}: live session, giving it {mins_left + OVERRIDE_AFTER_MIN:.0f} more min"); continue
    subprocess.run(["claude", "-p", "ok", "--model", "haiku", "--setting-sources", "user"],
                   cwd="/tmp", env={**os.environ, "CLAUDE_CONFIG_DIR": str(cfg)},
                   capture_output=True, timeout=120)
    print(f"{cfg.name}: renewed via the official client")
```

Success is "the client answered," not "expiry advanced." The client renews only when IT judges the token close to expiry; asked early it answers and keeps the old token, which is fine.

### Step 9: Wire the crons and test

```
*/20 * * * *  poll_limits.py
*/10 * * * *  sync_account_config.py ; repair_switchboard.py ; keep_tokens_alive.py
```

Tests that caught real faults for us, in the order they earned their place:

1. Run the verify script right after every login. Two directories, two uuids, or you are not done.
2. Mark one account's snapshot entry `status: http_429` by hand with a `last_ok_at` three hours old. The picker must still route to it. Set `last_ok_at` to seven hours old. It must fall back.
3. Delete the snapshot. The editor must still open (on the default account).
4. Set an account's token expiry in a scratch copy to an hour ago, with a fake live process holding that directory. The keep-alive must renew anyway.
5. Simulate an extension update by creating an empty `anthropic.claude-code-9.9.9` directory. The repair must pick it (numerically), install, and record.
6. Watch the card for one full evening with no sessions open. Every account must stay readable.

---

## The Framework: The Third State

There is a transferable principle underneath every fault in this volume, and it is small enough to fit on a sticky note.

**Every gauge has three states, not two. Room, no room, and cannot read. The silent failures live wherever the third state is rendered as one of the first two.**

We call it **The Third State.** It showed up five times in three days:

- The poller skipped a failed account, so the card showed the last good number (rendered as "room") while the picker saw nothing (rendered as "no room"). Same fact, two lies, both truthful from what each surface had.
- The duplicate login rendered "cannot tell which account this is" as "two accounts with identical room."
- The keep-alive rendered "a process exists" as "a session is renewing," when the truth was "cannot tell if it is awake."
- The editor update rendered "the launcher is gone" as "everything works," because it did.
- Even our own shell did it: a broken `grep` returned nothing, and nothing looks exactly like "no match."

The fix is the same every time. **Make the third state a first-class value with a timestamp, carry the last good reading beside it, and route on that reading for a bounded age.** Never collapse it to zero. Never collapse it to fine. Never let a process's existence stand in for a process's activity. And when the gauge measures identity, measure identity... a uuid, not a number that happens to match.

The corollary is about instruments that never fire: **the dangerous failure is the one that leaves everything working.** A launcher that vanishes on update, a repair that reverts itself cleanly, a poller that quietly skips. Each one costs half your paid capacity for as long as nobody asks. If a component can fail without an error, give it a record that a human will eventually read, at the tier that matters (a record, not a page, for anything that can wait until morning).

### Where This Sits in the Series

Vol 9 was about the agent's own memory being invisible to the agent. This volume is about the agent's own **fuel** being invisible to the operator, and about the instruments we built to fix that going blind in ways that looked like health. Both live under the same rule Vol 9 named: refuse to operate on proxies. Vol 10 adds the specific proxy that fooled us most: **a stale good number**. It is the most convincing proxy there is, because it was true once.

---

## What We Learned

### The number that stops you is the one the headline hides.

We would have built a wrong system without TIG's correction on day one. He had watched his own account sit at a healthy headline while the model he was working in went critical, and he named the weakest link before the code existed. Everything routes on it now. If you take one design move from this article, take that one: find the limit that actually binds your work, and rank on it, among accounts that are alive on every other limit too.

### Never move a running session. Only choose where a new one starts.

This is the line that keeps a capacity system on the right side of the vendor. It is also the line that keeps it safe with a dozen windows open. We built the whole thing so that a session, once started, is never touched, and a resumed conversation always lands where it lives. The extension's own 70% warning covers the session that eventually drains its subscription. That is enough.

### A fresh directory looks identical whether the login worked or not.

We will keep saying this until it stops being true. The setup screen tells you the directory is new. Only the profile endpoint tells you whose it is. Verify by uuid, every time, before you trust a single number.

### A live process is not a live signal.

Fault 3b was the most instructive because the reasoning behind the original rule was sound. The client does renew its own token. It just does not do it while sitting at a prompt. Existence is not activity, and a keep-alive that treats them as the same thing is a keep-alive that stands down exactly when it is needed.

### The ground moves, and it moves quietly.

The extension updated inside the working session that built the guard for extension updates. Within the hour. It was almost funny. It is the reason the repair records its failures as carefully as its successes.

### Our own shell lied to us mid-build, and it was our fault.

On our box, `grep` inside an agent shell is a function that execs the Claude binary as a grep replacement. We were renaming that binary to install the switchboard. So every `grep` in every agent shell failed for a few minutes, and a failed grep is indistinguishable from "no match." The agent reported to TIG that his fresh session had landed on the wrong subscription. It had not. Re-reading the process environment in Python corrected it within a turn, but the lesson went into the installer's header in capital letters: an absent result is not evidence of absence unless you know the instrument ran.

### The human stopped being the router.

Before this, every new session began with a person opening two usage screens and comparing six numbers. After it, a person opens a chat panel. The card is on the phone for the moments away from the desk. Every minute not spent doing arithmetic about quotas is a minute for the younglings we serve. That is the receipt that matters.

---

## The "Start Here" Prompt

If you want to build this for your own Claude Code setup, give your agent this prompt:

```
I hold more than one Claude Max subscription and I want every NEW session
to start on whichever one has the most usable room, without me checking
anything by hand. I never want a RUNNING session moved to another login.

Build me the following, as small read-only-where-possible scripts:

1. VERIFY. A script that walks ~/.claude and every ~/.claude-* directory,
   calls Anthropic's OAuth profile endpoint with each login's bearer token
   (header anthropic-beta: oauth-2025-04-20), and prints each directory's
   account email and uuid. Flag any two directories sharing a uuid as ONE
   subscription. Never print a token.

2. POLL (every 20 min). For each login, call the OAuth usage endpoint and
   read the limits[] array (kind: session / weekly_all / weekly_scoped,
   percent, resets_at, scope.model.display_name, severity, is_active).
   Store PERCENTAGES, never token counts. Upsert one row per
   (account, kind, model) into my database, with the account uuid, and
   write a local JSON snapshot. Three states, explicitly: ok, no room,
   and CANNOT READ. If a token is expired, do not send it; mark the
   account token_expired. If a read fails, carry the last good limits
   forward with last_ok_at and unreadable_since and say so. A missing
   limits[] array is an ERROR, never an empty success. Leave a single
   record in my ops channel when EVERY account is unreadable, and again
   on recovery ... never per poll, never a page.

3. CARD. Render every account and every limit (percent used, reset time
   in my timezone, their severity), an amber "unreadable since <when>:
   <why>" note per account, and one line at the top: "Most room now:
   <account> (<percent left> on the binding limit)". Make it work on my
   phone.

4. PICK. A read-only script that prints one config directory. Rules:
   disqualify any account at 100% on ANY limit; among the rest, rank by
   the weekly limit scoped to <my development model>; treat a window
   resetting within 25 minutes as already refilled; route on an
   unreadable account's last good reading up to 6 hours old; on ANY
   doubt (stale snapshot, missing file, unknown session id) print the
   default ~/.claude and say why on stderr. With --resume <session-id>,
   print whichever directory actually contains that session's transcript.

5. TWO DOORS. (a) A shell launcher for the terminal that asks PICK, sets
   CLAUDE_CONFIG_DIR, and execs claude. (b) For the VS Code extension:
   find the bundled binary it runs (under the extension's
   resources/native-binary/), rename it to claude.real, and place a
   launcher at the original path that asks PICK (honoring an existing
   CLAUDE_CONFIG_DIR and pinning --resume) and execs claude.real. Probe
   six behaviors against a temp copy before touching the real directory,
   and self-revert on failure.

6. REPAIR (every 10 min). Find the newest extension directory comparing
   versions NUMERICALLY, reinstall the launcher if it is missing, and
   record extension version, installed true/false, last repair time and
   last repair error (write the error field on success too, to clear it).

7. SYNC (every 10 min). Symlink settings.json, skills, output-styles,
   commands, plugins and the status-line script from ~/.claude into every
   secondary directory. Never copy. Never touch .credentials.json,
   projects/, sessions/, history.jsonl, file-history/ or .claude.json
   (merge only its mcpServers key).

8. KEEP-ALIVE (every 10 min). For any login within 15 minutes of expiry
   or past it: stand down if the credentials file changed in the last 2
   minutes; if a live claude process holds that directory, give it 15
   minutes past expiry, then renew anyway; renew by running the OFFICIAL
   client once with a one-word prompt on the cheapest model from a scratch
   cwd with --setting-sources user. Never refresh a token yourself.

Test: two uuids after login; picker routes on a 3h-old unreadable
reading and falls back on a 7h-old one; editor opens with no snapshot;
keep-alive renews under an idle live process; repair prefers version
2.1.100 over 2.1.99 (prove the compare is numeric); card stays readable
through an evening with no sessions open.

Do not build anything that moves a running session, pools tokens, or
stands between the client and Anthropic. Only choose where a NEW session
starts, on my own paid logins.
```

Copy that. Paste it into a fresh agent session. It will interview you about your editor and paths and build the whole thing.

---

## See The Whole Ecosystem

QWF builds an interconnected family of apps and programs. [Quietly Spotting](https://quietlyspotting.org) is the hub. Around it orbit Quietly Writing, Quietly Quoting, Quietly Networking, Quietly Knocking, Quietly Tracking, and more. See the [live ecosystem map](https://quietlyspotting.org/#ecosystem) for what's shipped, what's building, and how it all connects.

Capacity is one plane of a bigger system. Every app in that map is built and maintained by agent sessions that run on the subscriptions this volume is about. The picker and the card are how ten of those sessions keep moving on a Thursday afternoon when one login runs dry... so the work for the people we serve keeps its pace even when the fuel gauge does not.

## Related Reading

- Vol 1 moved documentation paths into agent context (the hook that injects required reading before work starts)
- Vol 4 made shared resources self-resolve under collision (the kitchen design that survives roommates who never met)
- Vol 8 documented the disciplines that turned a multi-agent crash from a six-hour redo into a ninety-minute triage
- Vol 9 gave the agent eyes for its own context state, and named the rule this volume runs on: refuse to operate on proxies

Vol 10 is the volume where the proxy that fooled us was a number that used to be true.

---

## About This Series

**Built from Broken** is published by the [Quietly Working Foundation](https://quietlyworking.org) (QWF), a 501(c)(3) nonprofit. Our mission is to serve youth 30 and younger... helping them discover purpose, build skills, and create legacy. We do this through product-based fundraising programs and student training.

We run a nonprofit almost entirely on AI agent infrastructure. Our backoffice is an Obsidian vault orchestrated by Claude Code (Anthropic's CLI-based AI coding agent), built on a three-layer architecture... Directives (what to do), Orchestration (the AI agent making decisions), and Execution (deterministic Python scripts doing the work). We build tools, we break things, we fix them... and then we write down what happened so you don't have to learn it the hard way.

This volume grew from one working day in September 2026 that started with a research document and a second login, and two more days of the instruments we built going quietly blind in three different ways. Every script described here is running on our machine as you read this, and the card is on a phone.

**The name:** "Built from Broken" comes from a core belief... that brokenness isn't something to hide. It's proof of what's possible. Every solution in this series exists because something failed. We show the scars, not to complain, but because someone else is hitting the same wall right now... and the fastest way through is knowing they're not alone.

---

*Built from Broken, Vol. 10 ... Published September 2026*
*Quietly Working Foundation | quietlyworking.org*
*Written by Chaplain TIG with Claude (Anthropic)*