---
title: "Built from Broken: Vol. 9"
slug: "vol-9-when-your-ai-agent-can-t-see-its-own-mind"
pillar: "built-from-broken"
description: "Your AI agent can't see how full its own memory is. By the time it can tell, it's already operating on lossy reconstruction. We built the eyes, the handoff, and"
publishDate: "2026-05-26"
tags: ["QWF", "QWU", "built-from-broken", "ai-agent", "claude-code", "hooks", "context-management", "git-worktree", "compaction"]
series: "Built from Broken"
volume: 9
hook: "The agent couldn't see its own memory. Three commits in, the very bug we were building to fix struck the build itself."
isHome: false
---
# Built from Broken: Vol. 9
## When Your AI Agent Can't See Its Own Mind

> *Built from Broken is a series from the Quietly Working Foundation about real problems we face running AI-powered nonprofit operations... and the real solutions we build. Every fix exists because something failed first. We show the receipts.*

---

## The Problem: The Agent Is Driving Blind, and Doesn't Know It

By the third context compaction in a single session, the agent is operating on summaries of summaries with full confidence and partial accuracy. Specific code fades first. Then exact line numbers. Then the reasoning chain that led to a decision. The agent feels coherent. The agent is not. And there is no in-band API the agent can call mid-turn to ask the system "how much of my memory have I lost?"

That second sentence is the one that costs you. The agent can't see its own degradation, so it can't slow down, can't hand off, can't ask for help. It just keeps producing work that looks like work and is sometimes wrong in ways that won't show up until later.

This volume is about two fixes that turned out to share a single principle. The first fix gave the agent eyes for its own context state and a handoff model that refuses to cross the compaction boundary. The second fix arrived because midway through building the first, the exact class of bug we were building to prevent struck the build itself. Both fixes do the same thing at different layers... they refuse to operate on proxies and reach for the deepest source of truth available.

### The Originating Pain

For weeks before the fix, the human in the loop (Chaplain TIG) had been manually typing percentages into prompts. "You have about 37% context left." "We're getting close, wrap soon." "I think you're past compaction, you've been off lately." The agent would receive these notes and adjust... slow down, commit, hand off, whatever was appropriate. But the human was doing the agent's perceptual work. The agent never knew on its own.

The pattern that surfaced again and again was the same shape:

- A long session would feel productive
- One compaction would fire silently around the 200K-token range, dropping the rolling window onto the older turns
- A second compaction would fire later
- The agent would keep responding fluently, but the quality of its judgment would slip in ways that only showed up retroactively (a decision it would have caught at 100% capacity, missed at 60%; a directive it would have recalled, forgotten; a memory rule it would have applied, vague-summarized past)
- The human would notice the slip three turns later, two turns of work after the slip
- Recovery meant starting a fresh session, reconstructing context manually, paying the cost twice

The first instinct was to make the agent more careful. Stronger language in the system prompt. "WHEN YOU FEEL UNCERTAIN, ASK." "FLAG ANY GAPS IN YOUR RECALL." Voluntary discipline. We had been down that road in Vol 1 of this series and we knew the ending. Voluntary discipline doesn't fire under speed.

The second instinct was to make the agent smarter about its own state. Have it estimate its own token usage by counting characters and dividing by four. That works until the cached prefix is large (it always is), at which point the estimate is off by 15-25% in the wrong direction. The alert would fire after compaction had already started. The whole point would be defeated.

The third instinct was to ask the platform: surely Claude Code exposes a `getContextFill()` call the agent can use mid-turn? It does not. As of Claude Code v2.1.145, `/context` is a visual grid command for humans and `/usage` is cumulative cost over time. Hooks see `PreCompact` events. None of those reach the running agent mid-response.

We were staring at the same shape Vol 1 had taught us. The data exists. The agent can't see it. Move the data to where the agent is.

### Then the Bug We Were Fixing Struck the Build

Mid-flight in the build... three commits in, working on the context-window detection chain that would make the system future-proof when Claude Code starts exposing the window size in hook payloads... the orchestrator session staged a few files for commit. `git status --short` confirmed they were staged. `git commit -m "..."` immediately reported "no changes added to commit."

That doesn't happen.

A look at `git log --oneline -5` showed a fresh commit nobody in this session had authored. Subject line: "session 377 wrap-up: daily journal Session 377 entry..." A parallel Claude session, working an unrelated project, had run its own `/session-wrap-up --scope=essential` at exactly the wrong moment and had used a broader `git add` than the rules permit. Its broader staging swept the orchestrator session's uncommitted edits into the parallel session's commit. Under the parallel session's message.

The code was intact on the remote branch. We verified with `git show <hash> -- <our files>` and a quick grep for our version strings. Nothing was lost. What was lost was the audit trail. The commit that said "context-window detection chain (env > payload > default)" never existed. The work was filed under someone else's wrap-up.

The fix we were building was, in the abstract, exactly the fix this collision needed. Both failures had the same shape: an agent operating on a proxy ("my context feels fine" / "broader git add will only catch my own files because I asked it nicely") when ground truth was elsewhere (the transcript JSONL with exact token counts / the shared filesystem with no concept of session ownership). The proxy was cheaper per look. The proxy was much more expensive per consequence.

That recognition is the seed of the article.

### Why the Obvious Fixes Don't Work

For the context-fill problem, we burned a few hours on dead ends before settling on transcript JSONL token counts. The candidates and why they failed:

**Polling the API for context state.** There is no such call. The agent can ask Anthropic's API for its own usage in the response it just sent, but only the human-facing tooling can show it back. The running agent cannot read it without going through a hook, and hooks fire on tool events, not on agent free-thinking.

**Character-count divided by four.** Classic estimation. Off by 15-25% in the wrong direction because the cached prefix (which has its own token count) doesn't compress to four-chars-per-token. By the time the estimate said "70%", actual usage was often past 90%. Alert fires after compaction. System defeated.

**Calibrating the prefix budget once via `count_tokens()`.** Cheaper than polling, accurate enough, but still a moving target as the prefix grows mid-session. And it costs API calls. And the entire complexity layer exists to estimate something that the platform was already telling us, in the next sentence.

What the platform was already telling us... and what we'd missed... is that the transcript JSONL file Claude Code writes to disk per session contains a `usage` block per assistant message with the exact Anthropic API token counts. `input_tokens + cache_read_input_tokens + cache_creation_input_tokens`. Authoritative source. No estimation needed. We had been looking at a model of the data when the data itself was sitting on disk in the same directory.

That's the first move of the article's framework. Whenever you find yourself estimating something, ask whether the platform is already telling you the answer somewhere you forgot to look.

For the parallel-collision problem, the obvious fixes also failed for structural reasons. The agent system prompt already said "stage by specific filenames, never `git add -A` or `git add <directory>`." That rule protected the orchestrator from its own broad stages. It did not protect the orchestrator from the parallel session's broad stages, because git has no concept of session-ownership of uncommitted edits. The working tree is shared. Whatever any session stages, gets staged. Voluntary discipline in one session does not bind another.

A coordination protocol (sessions announce intended stages in a shared SQLite table; consume before staging) would work in theory and break at the seams in practice. Every coordination layer is a thing that drifts. The thing that catches drift cannot itself be the thing that introduces drift.

The structural answer was git worktrees. They already exist in git for exactly this scenario. Each worktree gets its own working tree and its own index, sharing only the `.git` object store. A broader `git add` in one worktree cannot reach into another worktree's index. Sessions can't clobber each other because they are not, at the index level, in the same place.

The principle underneath both fixes is the same. When the proxy is "my own discipline" or "my own estimate", reach for the structural ground truth. The agent's introspection is unreliable. The transcript JSONL is not. The agent's filename hygiene is unreliable. The shared index is the bug. The fix at both layers is to refuse the proxy and operate on the thing itself.

---

## The Solution: Eyes, Handoff, and Per-Session Isolation

Three pieces, built together. Each one stands alone. Together they implement the handoff-driven operating model... the agent crosses the compaction boundary intentionally, by starting a fresh session, not by being summarized into one.

### Piece 1: The Threshold Monitor

A PostToolUse hook that fires after every tool call. It reads the transcript JSONL file for this session, finds the most recent assistant message's `usage` block, sums the three relevant token counts, divides by the effective context window, and decides whether to inject an alert as `additionalContext` into the next turn.

Three thresholds, not five. We picked 70 / 90 / 95 after a design conversation that started at "alert every 10%" and ended at "every alert costs agent attention; redundant alerts become noise; pick the meaningful transitions." The 70% alert is awareness-only. The 90% alert is HANDOFF MODE. The 95% alert is EMERGENCY HANDOFF.

The 90% line is empirically calibrated. The [`/session-wrap-up` skill](https://transparency.quietlyworking.org/open-playbook/user-manual/#qcm--qwu-context-manager) (which commits in-flight work, writes a fresh-session kickoff prompt, updates memory, etc.) consumes less than 10% of context budget in real-world runs. So 90% is the bulletproof line. Earlier-than-90% lines waste productive capacity for a safety margin the system has proven it doesn't need.

### Piece 2: Tiered Wrap-Up

This is the part of the design conversation worth quoting in full, because most agent-system builders would settle for two options where there are actually three.

At 95% context fill, the obvious choice is binary: run the full wrap-up (and probably hit compaction mid-wrap), or skip it (and lose the in-flight state). Both are bad. The third option is to split the wrap-up into Tier 1 and Tier 2 by what is reconstructable from disk after a fresh session starts.

Tier 1 (run now, even under emergency pressure):

- Commit any uncommitted work, even if the message is rough
- Update agent memory with anything new and load-bearing
- Update the project's system-status file
- Write a fresh-session kickoff prompt with an "In-Flight State" section and a "Deferred Items" section
- Trigger the session snapshot mechanism

Tier 2 (defer to the fresh session; reconstructable):

- User manual entries
- Application `/docs` sync
- Transparency-site sync
- Detailed After-Action Report
- Cross-reference work between directives

The split holds because Tier 1 items would be lost or expensive-to-recreate if compaction fired before they ran. Tier 2 items can be rebuilt by a fresh session reading the kickoff prompt and the new memory entries. Under emergency pressure, you protect what's irreplaceable and accept the asymmetry of doing the rest in cold blood with a clean context.

That tiered split is the design move that converts "skip the wrap-up at 95%" from a survival mode into a graceful degradation pattern.

### Piece 3: Per-Session Git Worktrees

A small CLI helper that wraps `git worktree add` with a session-label convention, a session-branch namespace, and lifecycle commands for create / list / info / cleanup / prune. The contract is simple: any parallel Claude session expected to run more than fifteen minutes spawns its own worktree, commits on its own `session/<label>` branch, and merges back to `main` explicitly when done.

The collision that surfaced this need can no longer happen between two worktree-equipped sessions. They share only the `.git` object store. The index, the staging area, the working tree are all per-session. A broad `git add` in one cannot reach into the other.

The lifecycle commands matter as much as the spawn. `cleanup` refuses to remove a worktree whose commits aren't merged to main (unless `--force`), protecting against accidental loss. `prune` sweeps stale worktrees older than seven days that are fully merged, keeping the working-trees directory tidy. The lifecycle is what makes the helper safe to depend on at the moment of speed pressure when a parallel session is being spawned in a hurry.

### The Hook-Side Lock

One design detail in the threshold monitor deserves its own callout because it generalizes. The 90% and 95% alerts each fire once per session and then mark themselves fired in a SQLite table. They also check a `wrap_up_completions` table before firing... if any `/session-wrap-up` (full or essential) has already completed in this session, the alerts suppress.

The temptation here is to handle suppression with text. Make the alert language conditional. "If you have already run wrap-up, ignore this." We rejected that path. At 95% context fill, the agent's reading discipline is at its lowest reliability of the entire session. Asking the agent to read carefully and ignore correctly is asking the wrong system to do the work. The right place to put the lock is the hook layer, where a simple SQL check makes the bad state structurally unreachable.

The principle generalizes: **make bad state unreachable, not avoidable-with-care.** That was round four of the design conversation and it is the meta-rule of the whole article. Every layer of the system that depends on the agent behaving correctly under stress is a layer that will fail under stress. Push the constraint down to where it can be enforced structurally.

### The Before and After

**BEFORE:**

```
Long session opens. Agent works through hours of context.
Compaction fires silently around 200K tokens.
Agent keeps responding. Quality slips on judgment calls.
Human notices three turns later. Pays cost of recovery.

In parallel: a second session in the same repo runs git add
on a directory. Sweeps the first session's uncommitted work
into the wrong commit. Code survives. Audit trail lies.
```

**AFTER:**

```
Long session opens. Agent works through hours of context.
At 70%, awareness alert. Agent notes a clean handoff boundary
in the next stretch of work.
At 90%, HANDOFF MODE. Agent runs /session-wrap-up at the next
safe pause. Fresh session takes over with 100% capacity.
At 95% (rare; only if 90% was missed), tiered wrap-up runs.
Tier 1 protects irreplaceable work. Tier 2 defers to the
fresh session reading the kickoff prompt.

In parallel: every parallel session spawned a worktree.
Separate indexes. Broader git add in one cannot reach the
other. Collision class structurally impossible.
```

### The Architecture

```
+---------------------------------------------------------------+
|  Claude Code session                                          |
|                                                               |
|  Every tool call -> PostToolUse hook                          |
|         |                                                     |
|         v                                                     |
|  Read transcript JSONL (this session's file on disk)          |
|  Find last 'assistant' message's `usage` block                |
|  Compute: input + cache_read + cache_creation = tokens        |
|  Compute: tokens / effective_context_window = percent         |
|         |                                                     |
|         v                                                     |
|  Check SQLite: has this threshold fired this session?         |
|  Check SQLite: has wrap-up already completed this session?    |
|         |                                                     |
|         v                                                     |
|  If alert is due: inject as additionalContext                 |
|  Else: emit empty JSON, exit 0                                |
|                                                               |
+---------------------------------------------------------------+

+---------------------------------------------------------------+
|  Parallel sessions in the same repo                           |
|                                                               |
|  Each session spawns a worktree at start:                     |
|    /your_worktrees/<label>/  (separate working tree)          |
|    branch: session/<label>   (separate index, throwaway)      |
|    shared: ../.git/          (object store only)              |
|                                                               |
|  Broader `git add` in worktree A cannot reach into            |
|  worktree B's index. Collision class structurally absent.     |
|                                                               |
|  Merge to main is explicit: from main worktree,               |
|    git merge session/<label>                                  |
+---------------------------------------------------------------+
```

---

## How to Build Your Own

You don't need our specific platform. You need an AI coding agent that writes transcripts to disk, a hook system that can inject context into the next turn, and a git repo. The pattern works against any agent that exposes those three things.

### Step 1: Find the Ground-Truth Token Counts

Most AI coding agents write per-session transcript files somewhere on disk. The transcript is the agent's own record of what happened, including what the underlying model API returned. If your agent's transcripts include the API's `usage` response (input tokens, cache read tokens, cache creation tokens), you have ground truth without an estimation layer.

For Claude Code specifically, the transcript path is passed to every hook as `transcript_path` in the stdin payload. Each line is a JSON record. Records with `type: "assistant"` contain a `message.usage` block. Sum the three counts; that's your current context fill in tokens.

```python
def latest_context_tokens(transcript_path):
    """
    Return the most-recent assistant message's total context-input tokens.
    No estimation. The Anthropic API already told us this number.
    """
    if not transcript_path or not os.path.exists(transcript_path):
        return 0
    latest_usage = None
    with open(transcript_path, 'rb') as f:
        for line in f:
            try:
                d = json.loads(line)
            except (json.JSONDecodeError, ValueError):
                continue
            if d.get('type') == 'assistant':
                usage = d.get('message', {}).get('usage')
                if usage:
                    latest_usage = usage
    if not latest_usage:
        return 0
    return (
        int(latest_usage.get('input_tokens', 0) or 0)
        + int(latest_usage.get('cache_read_input_tokens', 0) or 0)
        + int(latest_usage.get('cache_creation_input_tokens', 0) or 0)
    )
```

If your agent platform doesn't expose this, look for an equivalent. The principle holds even if the implementation moves: somewhere, the underlying API told your agent how many tokens it just used. Find that file. Don't estimate.

### Step 2: Detect the Effective Context Window

Different models have different windows. Hardcoding 200K is wrong for a 1M-token model; hardcoding 1M is wrong for a 200K-token model. The right pattern is a precedence chain:

```python
def detect_context_window(payload):
    # 1. Explicit lock-in via env var (highest precedence)
    env_val = os.environ.get('YOUR_AGENT_CONTEXT_WINDOW', '').strip()
    if env_val and env_val.isdigit():
        return int(env_val), 'env'

    # 2. Hook payload field (future-proof; not exposed today, but no-op-adopted
    #    if/when the platform exposes it)
    if isinstance(payload, dict):
        for key in ('context_window', 'model_context_window', 'max_context_tokens'):
            v = payload.get(key)
            if isinstance(v, int) and v > 0:
                return v, f'payload:{key}'

    # 3. Default for your environment (set to match your trajectory)
    return DEFAULT_CONTEXT_WINDOW, 'default'
```

Cache the detected value per session in SQLite so it stays stable mid-session even if the env var changes. The cached source field is observable for diagnostics... when something looks off later, you can tell whether the window came from env, payload, or default.

A note on the default: pick the value that matches your trajectory, not the value that's conservative. Defaulting smaller has one visible failure mode every session (phantom early alerts). Defaulting larger has one rare failure mode (silent under-alerting on the smaller-window edge case) that is recoverable via the env var override. The expensive-feeling option is usually the cheaper one across the year.

### Step 3: Pick Three Meaningful Thresholds

Resist the urge to alert at five thresholds. Every alert is a context injection that costs agent attention. The shape we landed on:

- **70%** ... awareness only. The agent notes a clean handoff boundary in its next stretch of work. Do not spawn long-running background sub-agents past this point.
- **90%** ... HANDOFF MODE. Wrap up at the next safe handoff point. Do not start new work. Safe = (no uncommitted work) + (no in-flight sub-agents awaiting return) + (not mid-response to the user's pending question).
- **95%** ... EMERGENCY HANDOFF. Tiered wrap-up. Tier 1 only; Tier 2 deferred to the fresh session.

Calibrate the 90% line to your own wrap-up cost. Ours empirically consumes less than 10% of budget, so 90% is the bulletproof line. If your wrap-up is heavier, move the threshold down accordingly.

### Step 4: Persist Alert State in SQLite

Two tables, both keyed on session ID:

```sql
CREATE TABLE IF NOT EXISTS threshold_alerts (
    session_id TEXT NOT NULL,
    threshold INTEGER NOT NULL,
    fired_at TEXT NOT NULL,
    observed_tokens INTEGER NOT NULL,
    observed_percent REAL NOT NULL,
    PRIMARY KEY (session_id, threshold)
);

CREATE TABLE IF NOT EXISTS wrap_up_completions (
    session_id TEXT PRIMARY KEY,
    scope TEXT NOT NULL,
    completed_at TEXT NOT NULL,
    triggered_by_threshold INTEGER
);
```

The `threshold_alerts` table is what makes alerts one-shot per session per threshold. The `wrap_up_completions` table is what makes the suppression work. Both are tiny. WAL mode + a 3-second busy timeout handles concurrent writes.

### Step 5: Make the Suppression Structural

When your wrap-up skill completes, write a row to `wrap_up_completions`. When the threshold monitor evaluates 90% and 95% alerts, check that table first; if any wrap-up has completed, suppress. Mark the threshold as fired anyway so the monitor doesn't keep re-evaluating it.

```python
if threshold in (90, 95) and wrap_up_completed(conn, session_id):
    mark_fired(conn, session_id, threshold, tokens, percent)
    continue
```

The temptation to handle this in alert text instead is real. Resist it. At 95% context fill, the agent's reading discipline is at its lowest. The bad state must be unreachable, not avoidable-with-care.

### Step 6: Build the Tiered Wrap-Up

Add a `--scope=essential` flag to your wrap-up skill. Walk the same step list as the full wrap-up but mark each step Tier 1 (always runs) or Tier 2 (skipped under essential scope).

Tier 1, in order:

1. Commit any uncommitted work. Stage by specific filenames; never `git add -A` or `git add <directory>`.
2. Update agent memory with anything new and load-bearing.
3. Update the project's system-status file with what just shipped.
4. Write a fresh-session kickoff prompt that includes an "In-Flight State" section (what was being worked on, what the next concrete action is) and a "Deferred Items" section (the Tier 2 items the fresh session must pick up).
5. Trigger your session snapshot mechanism.
6. Write the `wrap_up_completions` sentinel row.

Tier 2, deferred:

- User manual entries
- Application docs sync
- Public transparency site sync
- After-Action Reports
- Cross-reference work between directives

The split holds because Tier 1 protects work that would be lost or expensive to recreate. Tier 2 work can be done in cold blood by a fresh session reading the kickoff prompt.

### Step 7: Spawn a Worktree per Parallel Session

Every parallel session expected to run more than fifteen minutes spawns a worktree at start:

```bash
git worktree add /your_worktrees/<session-label> -b session/<session-label> main
cd /your_worktrees/<session-label>
# work here; commits land on session/<session-label>
```

When the work is done, from the main worktree:

```bash
git merge session/<session-label>
git push
# then clean up the worktree
git worktree remove /your_worktrees/<session-label>
git branch -d session/<session-label>
```

Wrap these in a small CLI helper so spawning takes one command and cleanup respects unmerged work (refuses to remove unless `--force`). The helper is fifteen minutes to write and pays back the first time two parallel sessions don't clobber each other.

Two non-obvious details:

- **Timeout.** `git worktree add` on a large repo can take well over thirty seconds because it populates the working tree from scratch. Use 300s as the helper's timeout. Default-30s will leave half-initialized worktrees in a lock state that's a pain to clean up.
- **Inherited working tree state.** A new worktree inherits the source's uncommitted file state at the moment of creation. That looks like noise but isn't your session's work; only `git rev-list --count main..session/<label>` measures actual work this worktree produced. Don't gate cleanup on uncommitted file count; gate it on unmerged commits.

### Step 8: Add the Defensive Fallback

Even with the threshold monitor in place, a session can still hit compaction occasionally. Maybe the user typed past 95%, maybe a single tool call returned a payload large enough to trip compaction in one go. For those cases, add a `PreCompact` hook that resets `threshold_alerts` and `wrap_up_completions` for the current session, so the post-compaction continuation starts with a fresh alert budget.

This hook firing is a SIGNAL that handoff discipline failed for that session. In a tuned system it rarely fires. When it does, it's a flag to investigate the session's events and figure out what slipped past the 90% line.

---

## The Framework: Ground Truth at the Edges

There's a transferable principle underneath both fixes, and it's worth naming.

**Refuse to operate on proxies. At every boundary where your agent meets the world, find the deepest available source of truth, and reach for that. The proxy is cheaper per look. The deeper source is cheaper per consequence.**

We call this **Ground Truth at the Edges.** Most agent systems have at least one of these boundaries. The agent meets the platform (how full is my context). The agent meets the operating system (which port is free, which file is locked). The agent meets the version control system (which commit is mine, which staging area am I in). At every one of those edges, a proxy exists that looks like ground truth and isn't. And every proxy hides a failure mode that compounds.

Three boundaries in this volume:

**Boundary 1: Agent meets its own memory.**
The proxy is "the agent feels coherent." The ground truth is the `usage` block in the transcript JSONL. The proxy fails by hiding compaction drift behind fluent prose. The ground truth fixes the failure mode by making the percentage observable in the agent's own working context.

**Boundary 2: Agent meets parallel agents in the same repo.**
The proxy is "I'll stage my own files carefully." The ground truth is per-session worktrees with independent indexes. The proxy fails because shared filesystems don't honor your session's intent when another session reaches in. The ground truth fixes it by removing the shared surface entirely.

**Boundary 3: Agent reading discipline at high context fill.**
The proxy is "the alert text will tell the agent to suppress under condition X." The ground truth is a SQL check in the hook that suppresses structurally before the alert ever reaches the agent. The proxy fails because reading discipline is least reliable exactly when alerts matter most. The ground truth fixes it by enforcing the suppression where it can't be ignored.

### The Two Halves of the Principle

The first half is observable: read the deepest source of truth instead of estimating it. The second half is structural: when you find yourself depending on the agent to behave correctly under stress, push the constraint down to a layer that can enforce it without the agent's cooperation. Round four of the design conversation distilled this into a single rule:

> Make bad state unreachable, not avoidable-with-care.

That rule generalizes far beyond context management. Any time you find yourself writing "if X then please don't Y", check whether you can make Y impossible when X is true. Hook-side gates, structural isolation, atomic operations, type systems, schema constraints. All of these are different ways of putting the same insight to work. The agent's voluntary discipline is the wrong layer to hang a guarantee on.

### Where This Sits in the Series

The series has accumulated a pattern. Vol 1 moved documentation paths into agent context (the hook that injects required reading before work starts). Vol 5 moved live data rows into agent context. Vol 7 moved organizational values into agent context. Vol 8 documented the disciplines that turn a multi-agent crash into a ninety-minute triage instead of a six-hour redo.

Vol 9 is the first volume where the data being moved into context is **the agent's own state**. Every prior volume put something the agent didn't know into reach. This one puts what the agent IS into reach. That distinction matters for the next class of problems coming. Once agents can see themselves, the operating loop changes. The agent stops being a passive worker that humans monitor and starts being a co-pilot that can call its own pauses, hand off at clean boundaries, and refuse to keep going when its own state has degraded past usefulness.

That's the long-game wager underneath the small fix. Eyes change what the system can do.

---

## What We Learned

### The bug we were fixing struck the build mid-flight, and the recovery was part of the article.

When the parallel-session collision swept our v2.2.1 work into the wrong commit, the first reaction was the wrong one. Annoyance. The temptation to rewrite history. The second reaction was the right one, and it was the user who named it: *"What is your recommendation?"* That question pulled the moment back into the same shape as the rest of the build. The bug was real. The recovery was structural. Both fit inside the framework we were writing.

The recognition that the bug-mid-build was the proof-of-concept moment for the framework was the article. We didn't bolt it on. The build extended naturally to include the worktree helper, the directive, the memory entry. Three more commits. Same principle. The article you're reading exists because the failure validated the framework before the framework was finished being written.

### Token counts in transcript JSONL are public-facing and underused.

We spent hours building estimation layers before realizing the platform was telling us the exact number in a file on disk. That's an embarrassing receipt but it's the right one to print. Anyone building agent observability on top of an AI coding tool should start by checking what the transcript file contains. The Anthropic API's `usage` block schema is documented. Reading it from the transcript JSONL is one `json.loads()` per line. There's no estimation that beats the source.

If your platform doesn't write transcripts to disk, ask for it. The cost to the platform of writing per-message usage to disk is near zero. The value of having ground truth available to hooks is the difference between an observability system that works and one that doesn't.

### Three thresholds beat five every time.

Our first design called for alerts at 50, 60, 70, 80, 90 percent. The push-back was specific: every alert is a context injection that costs agent attention. Alerts that don't trigger distinct action are noise. Three meaningful transitions (awareness, handoff, emergency) are signal. The trimmed shape lands every time.

The general principle is older than agents. Any alerting system that fires for transitions the recipient can't act on differently produces fatigue, not safety. Trim to the transitions that matter.

### The hook-side lock is the part most teams will skip.

We could have shipped suppression in the alert text. *"If you have already run wrap-up, you can ignore this."* It would have worked most of the time. It would have failed at 95% context fill, which is the moment it most needed to work. The right place to put the suppression is in the hook, before the alert is generated, where a SQL check makes the bad state unreachable.

If you take one design move from this article, take that one. Wherever you find yourself writing "the agent will read this carefully and act correctly under stress," look for the layer below where you can enforce the constraint structurally. The agent's discipline is the wrong rail to hang a guarantee on.

### Per-session worktrees are git's built-in answer.

Coordination protocols are tempting. They're also fragile in exactly the ways shared-filesystem coordination always is. Git worktrees are the right answer because they were designed for this scenario. Separate indexes, shared object store, throwaway branches, explicit merges. The whole pattern is fifteen minutes of CLI helper around `git worktree add` plus a directive that says "spawn one per parallel session over fifteen minutes."

The cost of NOT using worktrees is one collision per couple-dozen parallel-session pairs, on average. Each collision is roughly thirty minutes of forensic work to verify nothing was lost and re-label the audit trail. The cost of using worktrees is ten seconds at spawn and one cleanup command at end. The math works the moment you have more than one parallel session per week.

### The agent doesn't have to suffer for its own state to be visible.

The whole arc of this volume is the moment where the human stopped being responsible for the agent's perceptual labor. For weeks, the human had been typing percentages into prompts. After the build shipped, the agent could see itself. The thing that changed for the human wasn't that the agent got smarter. It was that the agent stopped requiring a babysitter for its own context state. The human's attention went back to the actual problem.

That's the receipt that matters. Every minute the human spent on the agent's perceptual labor was a minute that didn't go to the kiddos we serve. Eyes for the agent are minutes for the mission.

---

## The "Start Here" Prompt

If you want to build this for your own AI coding agent, give it this prompt:

```
I want to build a context-fill monitoring and handoff system for my AI
coding agent. The goal: the agent can see its own context state in real
time, hands off to a fresh session at a clean threshold before the window
fills, and never crosses the compaction boundary except by intention.

I also want to prevent the parallel-session git-collision class of bug
that strikes when two agent sessions in the same repo accidentally stage
each other's uncommitted edits into the wrong commit.

Here is what I need you to do:

1. Find out where my AI agent writes its per-session transcript file.
   Confirm it includes the underlying API's usage response per assistant
   message (input tokens, cache read tokens, cache creation tokens).
   If it does, we will read that as ground truth. If not, propose an
   estimation fallback and document its expected error margin.

2. Build a PostToolUse hook (or your platform's equivalent) that:
   - Reads the transcript JSONL for this session
   - Sums the most recent assistant message's three token counts
   - Divides by an effective context window detected via this precedence:
     env var > hook payload field > default constant
   - Caches the detected window per session in SQLite
   - Fires alerts at 70 / 90 / 95 percent (one-shot per session per
     threshold; persisted in a threshold_alerts table)
   - Suppresses 90 and 95 alerts if wrap_up_completions table shows a
     wrap-up already ran this session
   - Injects alerts as additionalContext on the next turn
   - Fail-open: any error exits 0 and emits empty JSON

3. Update my session-wrap-up skill to support a --scope=essential flag.
   Tier 1 (always runs): commit work staged by specific filenames; update
   agent memory; update project status; write a fresh-session kickoff
   prompt with In-Flight State + Deferred Items sections; trigger session
   snapshot; write the wrap_up_completions sentinel row.
   Tier 2 (deferred to fresh session under essential scope): user manual,
   docs sync, public site sync, AAR, cross-reference work.

4. Add a PreCompact hook (or equivalent) that resets threshold_alerts
   and wrap_up_completions for the current session if compaction fires
   anyway. This hook firing is a signal that handoff discipline failed.

5. Build a small CLI helper that wraps git worktree for parallel sessions:
   - create <label>: spawns /your_worktrees/<label>/ on branch
     session/<label>; 300-second timeout for large repos
   - list: shows all active session worktrees
   - info <label>: shows commits ahead of main, last commit, merge status
   - cleanup <label>: refuses if unmerged commits; --force to discard
   - prune: sweeps merged worktrees older than 7 days
   Document the contract: any parallel session >15 minutes spawns a
   worktree.

6. Test end-to-end:
   - Start a fresh session. Verify the 70% alert injection format.
   - Run wrap-up. Verify suppression works for subsequent 90/95 alerts.
   - Spawn two parallel sessions with worktrees. Verify a broad git add
     in one cannot reach the other's index.

Do not let any layer depend on the agent reading carefully under stress.
At every constraint, push the enforcement to the hook or the file system
or the index, where it can be made structurally unreachable to violate.
```

Copy that. Paste it into a fresh agent session. The agent will interview you about your platform's specifics and build the whole thing.

---

## See The Whole Ecosystem

QWF builds an interconnected family of apps and programs. [Quietly Spotting](https://quietlyspotting.org) is the hub. Around it orbit Quietly Writing, Quietly Quoting, Quietly Networking, Quietly Knocking, Quietly Tracking, and more. See the [live ecosystem map](https://quietlyspotting.org/#ecosystem) for what's shipped, what's building, and how it all connects.

The fixes in this volume are infrastructure underneath all of it. The agent that helps a donor-partner reach a younger Locals 4 Good ad-spot, the agent that drafts a Quietly Writing article, the agent that triages a Quietly Networking introduction... they all run inside sessions that have a context budget. The threshold monitor and worktree pattern are how those agents stay sharp across long days, so the work for the people we serve doesn't degrade with the agent's memory.

## Related Reading

The pattern in this volume builds on architecture established across the series. Each volume tightens a different surface; the disciplines compose.

- Vol 1 moved documentation paths into agent context (the hook that injects required reading before work starts)
- Vol 4 made shared resources self-resolve under collision (the kitchen design that survives roommates who never met)
- Vol 5 moved live data rows into agent context (open issues injected the moment you mention an app)
- Vol 6 cut per-session resource taxes by swapping eager transports for lazy ones (HTTP MCPs instead of stdio)
- Vol 7 moved organizational values into agent context (schemas the agent reads every session, with WHY attached)
- Vol 8 documented the disciplines that turned a multi-agent crash from a six-hour redo into a ninety-minute triage

Vol 9 is the volume where the data being moved into agent context is the agent's own state.

---

## About This Series

**Built from Broken** is published by the [Quietly Working Foundation](https://quietlyworking.org) (QWF), a 501(c)(3) nonprofit. Our mission is to serve youth 30 and younger... helping them discover purpose, build skills, and create legacy. We do this through product-based fundraising programs and student training.

We run a nonprofit almost entirely on AI agent infrastructure. Our backoffice is an Obsidian vault orchestrated by Claude Code (Anthropic's CLI-based AI coding agent), built on a three-layer architecture... Directives (what to do), Orchestration (the AI agent making decisions), and Execution (deterministic Python scripts doing the work). We build tools, we break things, we fix them... and then we write down what happened so you don't have to learn it the hard way.

This volume grew from a long working day that ended with a single question to a fresh chat: *"is there any way for a Claude agent in a VS Code environment to determine the status of memory context?"* The research came back: no, not in band, not mid-turn. By the end of the same session, three commits had shipped that gave the agent eyes, a fourth had shipped that gave parallel sessions structural isolation, and the very bug being fixed had struck the build itself and become the proof of the framework. Vol 9 is the volume where the agent stopped requiring a babysitter for its own context state, and where the principle underneath the fix earned its name.

**The name:** "Built from Broken" comes from a core belief... that brokenness isn't something to hide. It's proof of what's possible. Every solution in this series exists because something failed. We show the scars, not to complain, but because someone else is hitting the same wall right now... and the fastest way through is knowing they're not alone.

---

*Built from Broken, Vol. 9 ... Published May 2026*
*Quietly Working Foundation | quietlyworking.org*
*Written by Chaplain TIG with Claude (Anthropic)*