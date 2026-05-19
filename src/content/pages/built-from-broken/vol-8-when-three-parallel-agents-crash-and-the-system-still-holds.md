---
title: "Built from Broken: Vol. 8"
slug: "vol-8-when-three-parallel-agents-crash-and-the-system-still-holds"
pillar: "built-from-broken"
description: "Three parallel sub-agents crashed mid-flight on a multi-step deploy. The disciplines we'd built over six months turned what looked like a six-hour redo into a n"
publishDate: "2026-05-19"
tags: ["QWF", "QWU", "built-from-broken", "ai-agent", "claude-code", "multi-agent", "resilience", "migrations"]
series: "Built from Broken"
volume: 8
hook: "Three sub-agents in flight. VM died. Crash-recovery took ninety minutes, not six hours. The disciplines held."
isHome: false
---
# Built from Broken: Vol. 8
## When Three Parallel Agents Crash Mid-Flight (and the Disciplines Make It Triage, Not Redo)

> *Built from Broken is a series from the Quietly Working Foundation about real problems we face running AI-powered nonprofit operations... and the real solutions we build. Every fix exists because something failed first. We show the receipts.*

---

## The Problem: The Crash That Should Have Cost Six Hours

A multi-agent fan-out is a small architectural bet. You spawn three sub-agents in parallel, each working a different slice of the same release. The promise is concurrency. The risk is that any one of them crashing forces you to redo the others. At ninety minutes of work per sub-agent, a three-way crash budgets out at six hours of redo... if your only recovery mode is "respawn each one and pray they finish the same work clean."

Ours took ninety minutes. Not because we got lucky. Because the disciplines we'd built over six months were already inside the failure mode, doing their job, before anyone touched a keyboard.

This is the volume about the moment those disciplines paid off in compound. The breakage was real. The recovery was disciplined. The proof is in git.

### What Was Happening

We were mid-way through a Phase 1 implementation on one of our internal apps. The release graph had a clean dependency: Steps 1.1 and 1.2 shipped sequentially (schema substrate, then mutation API), which unlocked Steps 1.3, 1.4, and 1.5 to run in parallel. The orchestrator session (we call it Lead Advisor) had authored three kickoff prompts, one per sub-step, and spawned three sub-agents in a single message with backgrounded execution.

The kickoffs carried the disciplines forward:

- One focused commit per repo per sub-step. No grab-bag commits.
- Rebase against the remote before every push, because parallel sub-agents writing to the same branch will interleave.
- Sub-agents must not touch shared status files. The orchestrator handles those sequentially after acceptance, to avoid a three-way merge conflict on the single most-edited file in the repo.
- After deploying any workflow, explicitly verify environment variables are reachable from inside the execution context. The deploy platform's env-var surface is independent from the code's env-var surface.
- One of the three sub-steps would push real production data (seven donor-partners getting migrated into a new system). Dry-run first. Preview JSON payloads. Surface to Lead Advisor for review before live push.

Three sub-agents went out. The orchestrator session settled in to wait. The next fan-out (Steps 1.6, 1.7, 1.8) was queued behind 1.3 closing.

Then the VM crashed.

### What the Crash Looked Like

The first sub-agent had been killed by an API rate-limit failure mid-smoke. The other two went silent post-crash with no return notification. None of the three sub-agents had sent a close-out report.

When the orchestrator session restarted, the state on disk was mixed:

- Some files were committed under proper close-out messages.
- Some files were committed... but under a generic "vault: inbox processed" message from an auto-commit cron that ran at 18:00 UTC during the crash window. That cron is normally invisible; in this incident it became the safety net we hadn't planned to rely on.
- Some files were uncommitted but on disk, waiting for a sub-agent that was never coming back to finalize the commit.
- The deployed-state had moved substantially. Two database migrations had been applied. A new API token had been provisioned. A new column had been added to the production data table. A workflow had been imported into the workflow orchestrator and marked active. Seven donor-partners had been pushed to the new system with idempotent-replay semantics.

The orchestrator's first question wasn't "what did I lose." It was the question the user had asked the moment the session restarted, which is the question this article is built on:

> *"Can you check where you were interrupted and start up from there? Also, please let me know if anything that you were working on was broken by the crash so we can purposely include it in our plan, if needed."*

The honest answer to that question, after ninety minutes of forensic work, was: **nothing was broken by the crash that needed to be redone.** Deployed state was atomic per migration. The contract held cleanly under partial-execution conditions. The vault auto-commit cron had caught the in-flight files of the third sub-agent as a safety net no one had asked for. What was missing was not technical state. It was the version-control and reporting layer the sub-agents would have produced if they hadn't died.

That gap... the gap between "what made it to disk" and "what made it through the reporting workflow"... was ninety minutes of triage, not six hours of rebuild. The article is about why.

### Why the Naive Recovery Path Costs Six Hours

The instinct after a multi-agent crash is to respawn each sub-agent and let them finish. That feels safe. It is, in fact, the most expensive option.

A respawn-and-pray recovery costs you four kinds of time you didn't budget:

**Time 1: The sub-agent re-runs the work it already finished.** It doesn't know what's already committed. It doesn't know which database migrations have been applied. It doesn't know which API tokens have been provisioned. The first thing a fresh sub-agent does is the work the previous one already did, which means re-asserting state that's already there.

**Time 2: The sub-agent collides with itself in the database.** Re-running a migration that's already applied either succeeds quietly (in which case the second run wasted minutes) or fails noisily (in which case the second run wasted minutes plus debug time). Re-pushing the same seven donor-partners either succeeds because idempotent-replay catches it or duplicates the rows because it doesn't.

**Time 3: The second sub-agent's smoke tests rediscover the same contract bugs the first one already hit.** The smoke harness has the same assumptions about the deployed endpoint that the first run did. If those assumptions were wrong then, they're wrong now. You pay for the same bug discovery twice.

**Time 4: The orchestrator can't tell which sub-agent's commit is authoritative.** Now there are two commit chains: the one that died mid-flight, and the one that came back to redo it. Merging them is its own forensic exercise.

The cost compounds. Six hours is the optimistic estimate. The pessimistic estimate is "you give up on parallel fan-outs because the recovery story is worse than the speedup."

The verify-first triage path costs you ninety minutes of forensic probing and three to five surgical fixes. The disciplines are what make that path possible.

---

## The Solution: Three Disciplines That Made Triage Possible

Three patterns did the load-bearing work in this recovery. We've been building them for six months across unrelated incidents. Vol 8 documents the moment they composed.

### Discipline 1: Atomic Migrations as the Recovery Floor

Every database migration we ship is wrapped in a transaction:

```sql
BEGIN;

ALTER TABLE your_table
  ADD COLUMN your_new_column uuid REFERENCES other_table(id);

CREATE INDEX your_new_index
  ON your_table (your_new_column)
  WHERE your_new_column IS NOT NULL;

COMMIT;
```

The `BEGIN; ... COMMIT;` wrap is one of those rules that reads like ceremony until the day it isn't. If the agent dies mid-migration, the connection drops, the server rolls back, and the database is in the state-before. It is never in a partial state. There is no half-migrated schema. The agent crashing during a migration is operationally identical to the agent never starting it.

This is the recovery floor. It means a forensic probe of the database tells you the truth: either the migration ran or it didn't. There is no "it ran partway and now your data is corrupted" branch to debug.

In our crash, both migrations had applied cleanly. The probe was three queries against the system catalog:

```sql
-- Did the migration run?
SELECT name, applied_at FROM your_migrations_table
WHERE name LIKE '%phase_1_3%' OR name LIKE '%phase_1_4%';

-- Does the new column exist?
SELECT column_name FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'your_table'
  AND column_name = 'your_new_column';

-- Are the new rows there?
SELECT count(*) FROM your_table
WHERE your_new_column IS NOT NULL;
```

Three queries. A minute of work. We knew the schema layer was clean before we'd opened a single file on disk.

### Discipline 2: Vault Auto-Commit Cron as File-State Safety Net

This one was a happy accident that turned into a teachable pattern.

We run a generic cron job in the working repo that commits any in-progress file changes to the main branch every few hours. Its commit message is intentionally bland: "vault: inbox processed." The cron exists because our system's primary input surface is an Obsidian vault where humans and agents are constantly authoring files, and we want on-disk file changes to survive a crash even if the author didn't think to commit.

During our incident, that cron ran at 18:00 UTC. Right when the third sub-agent was mid-flight. The cron caught its files as a snapshot.

The trade-off is real: when the cron picks up an in-flight sub-agent's work, the commit message loses the semantic framing the sub-agent would have written. A clean close-out would have said `qcm: Phase 1.5a close-out (7 donor-partners migrated; idempotent replay verified)`. The cron said `vault: inbox processed`. The orchestrator had to re-attribute the commit retroactively, by reading the diff and matching it against the kickoff's deliverable list.

That re-attribution is a five-minute exercise. The alternative (lost disk state) is a much more expensive one.

The pattern, generalized:

- Run a cron job that auto-commits to your working branch every N minutes.
- Use a generic commit message. The cron isn't trying to be semantic; it's trying to be a snapshot.
- After a crash, the orchestrator's first git log read recovers what state survived versus what state needs reconstructing.
- When you're doing a destructive operation (a force-push, a branch rebase, anything where uncommitted state is intentional), pause the cron explicitly.

It is the file-system equivalent of `BEGIN; ... COMMIT;`. Same shape. Different surface.

### Discipline 3: Verify-First Triage Instead of Respawn-and-Pray

Once atomic migrations told us the schema was clean and the auto-commit cron told us the disk state was preserved, the question shifted. Not "what was lost," but "what's the smallest set of moves that closes the open work without re-doing what's already done."

The forensic sequence is repeatable. Anyone running a multi-agent crash recovery can follow it:

1. **Map deployed state.** Query the production database via your management API for the rows you expect each migration to have created. Query for the rows you expect each script to have inserted. The deployed surface is the ground truth.

2. **Map disk state.** Run `git status` and `git log --since="<crash timestamp>"`. Identify what files were committed during the crash window, what files are uncommitted but on disk, and what files are missing entirely.

3. **Run each sub-agent's smoke tests independently, from a cold session.** Do not respawn the sub-agent. Run the smoke harness the sub-agent would have run. The smoke results are your contract verification. They tell you whether the deployed state matches the proposal.

4. **Identify contract-drift fixes.** If a smoke fails, the failure is almost always a place where the sub-agent's smoke harness assumed a shape the deployed endpoint doesn't actually have. We'll dig into this discipline next; it deserves its own section.

5. **Author missing deliverables that the sub-agents never reached.** The kickoff prompts named the deliverables. Match what's on disk against the kickoff list. Anything that's missing, the orchestrator authors directly... rather than respawning the sub-agent to do it.

6. **Commit each rescue artifact under a proper close-out message.** Replace the generic auto-commit cron messages in the project's update log with semantic re-attributions: "Phase 1.5a close-out (auto-committed by cron during crash; deliverable list completed by orchestrator on rescue)."

7. **Update the system status file last.** This is the single most-edited file across the project; the orchestrator owns it sequentially. Three sub-agents writing to it in parallel would have produced a three-way merge conflict on push.

In our crash, the smoke runs were the part that surfaced real work. The schema was clean. The disk state was preserved. But two of the three sub-agents' smoke harnesses had contract-drift bugs that only the deployed endpoint could reveal. Without verify-first triage, those bugs would have shipped invisibly past the crash and surfaced in later phases as much harder problems to diagnose.

---

## The Contract-Drift Fixes (Where the Real Reader-Value Lives)

If you're running parallel-agent fan-outs, the part of this article you came for is probably here.

When the orchestrator ran each sub-agent's smoke harness independently after the crash, two of the three came back clean. The third had three test failures. Every one of them was a place where the sub-agent's smoke harness had assumed something about the deployed endpoint that wasn't true.

These are the kinds of bugs that don't show up in code review. They don't show up in static analysis. They don't show up in a fresh agent reading the design proposal. They only surface when you hit the live deployed endpoint with a real HTTP request and read what it actually rejected.

### Drift 1: Foreign Key the Smoke Didn't Know Existed

The smoke was inserting into a table that had a foreign-key constraint the sub-agent hadn't read carefully. The constraint pointed at a parent table the smoke wasn't seeding. The fix was a two-line addition to the smoke's setup phase:

```python
# Before (smoke fails with FK violation)
test_row = {
    "name": "test_widget",
    "config": {"foo": "bar"},
}

# After (smoke seeds the FK parent first)
parent_row = client.post("/parent_resource", {
    "id": test_run_parent_id,
    "name": "test_run_parent",
}).json()

test_row = {
    "name": "test_widget",
    "config": {"foo": "bar"},
    "parent_id": parent_row["id"],   # <-- the field the constraint requires
}
```

The proposal text described the table and didn't enumerate every foreign key. The agent inferred the shape from the description and missed the constraint. Static review of the smoke against the proposal would not have caught this. The live endpoint did.

### Drift 2: Required Body Field That Wasn't in the Smoke

A POST endpoint had a required field in the request body that wasn't in the proposal's example payload. The agent had copied the example and inferred it was the complete contract. The endpoint rejected the request with a 400 and a clear error message naming the missing field. The fix was a one-line addition to the request body:

```python
# Before (endpoint returns 400: "missing required field: new_key_id")
rotate_response = client.post(
    f"/api/tokens/{token_id}/rotate",
    json={"reason": "test rotation"},
)

# After (endpoint accepts and rotates)
rotate_response = client.post(
    f"/api/tokens/{token_id}/rotate",
    json={"reason": "test rotation", "new_key_id": "test_run_key"},
)
```

The proposal's example payload was an illustrative subset, not a complete contract. The agent assumed it was a complete contract. The endpoint corrected the assumption.

### Drift 3: HTTP Status Code the Smoke Wasn't Expecting

The third drift was the smallest and the most instructive. The smoke had a status-code assertion that expected a 200 OK. The endpoint actually returned a 201 Created (because the operation created a new resource, which is semantically distinct from a read). The fix was widening the assertion:

```python
# Before (smoke fails because actual response is 201)
assert response.status_code == 200, f"expected 200, got {response.status_code}"

# After (smoke accepts the semantically-correct 201)
assert response.status_code in (200, 201), \
    f"expected 200 or 201, got {response.status_code}"
```

The proposal had said "the endpoint returns a successful response." The agent had read "successful response" as 200. The endpoint had read its own semantics correctly and returned 201. Neither was wrong; the smoke was over-specific.

### Why These Three Surfaced Only at the Live Boundary

This is the discipline that took us several incidents to internalize. We now write it as a rule:

**Static review of a smoke harness against a written proposal will catch maybe half of the contract-drift bugs in that harness. The other half only surface when the smoke runs against the live deployed endpoint and reads what the endpoint actually rejected.**

The corollary, for smoke-authoring agents: every assertion in a smoke harness should be preceded by a verify-first HTTP probe of the actual response shape. Not in production, not against real data, but against a synthetic request that produces the same shape. The agent that authored this smoke had not done that probe. The post-crash orchestrator did the probe in ninety seconds per assertion, and each fix landed inside a single commit.

We're putting this rule in our kickoff template now. Future sub-agents will probe before they assert.

---

## How to Build Your Own Multi-Agent Resilience

If you're running parallel sub-agents on your own infrastructure, here's the build order for the disciplines that turn a crash from "redo" into "triage."

### Step 1: Wrap Every Migration in a Transaction

This is the cheapest discipline and the highest payoff. Every schema-changing migration ships with `BEGIN; ... COMMIT;` brackets. Every data-migration script (the kind that inserts batches into production tables) ships with the same wrap.

```sql
-- migration_NNN_descriptive_name.sql
BEGIN;

-- All schema or data changes here.

COMMIT;
```

The cost is one line at the top and one line at the bottom. The payoff is that no agent crash can leave the database half-migrated. The state is always state-before or state-after, never in-between.

For multi-statement data migrations, wrap the whole batch:

```python
def migrate_donor_partners_batch(rows):
    """Migrate a batch under one transaction; rolls back on any failure."""
    with conn.transaction():
        for row in rows:
            conn.execute("INSERT INTO new_table (...) VALUES (...)", row)
    # If any insert raises, the entire batch rolls back.
```

### Step 2: Run an Auto-Commit Safety-Net Cron

Add a cron entry to your working repo that commits any uncommitted changes every fifteen to thirty minutes:

```bash
# In your crontab (adjust path + interval to taste)
*/15 * * * * cd /path/to/your/working/repo && \
  git add -A && \
  git diff --cached --quiet || \
  (git commit -m "snapshot: auto-commit" && git push origin main)
```

The `git diff --cached --quiet` check is the trick. It exits with 0 (success) if nothing is staged, which makes the `||` branch skip the commit when there's nothing to commit. You get a snapshot when there are changes, and silence when there aren't.

Pause it explicitly during destructive operations (force-push, branch rebases, anything where uncommitted state is intentional):

```bash
# Pause the cron in one terminal while you do a destructive op
sudo crontab -l > /tmp/crontab.backup
sudo crontab -r
# ... do your destructive thing ...
sudo crontab /tmp/crontab.backup   # restore
```

The generic commit message is a feature, not a bug. It tells the orchestrator "this was the cron, not a sub-agent's semantic close-out." On rescue, the orchestrator re-attributes by reading the diff against the kickoff's deliverable list.

### Step 3: Author Kickoff Prompts That Forbid Touching Shared Files

The kickoff prompt for each parallel sub-agent should explicitly enumerate which files are "per-sub-step" (the sub-agent owns them; commits them) versus "shared" (the orchestrator owns them; sub-agent must not touch).

Template:

```markdown
## Files You May Edit

(New files in distinct paths, scoped to this sub-step):
- src/your_module/new_file.py
- migrations/NNN_your_migration.sql
- tests/your_module/test_smoke.py

## Files You Must NOT Touch

These are owned by the orchestrator and will be updated sequentially
after acceptance. Touching them creates a three-way merge conflict
when the parallel sub-agents push:

- README.md
- CHANGELOG.md
- system_status.md (or whatever your shared status file is)
- requirements.txt (or your equivalent dependency manifest)
```

This sounds like ceremony. It's a five-minute addition to a kickoff. It saves you a multi-hour merge-conflict debug when three sub-agents push to the same branch in close succession.

### Step 4: Build a Verify-First Smoke Authoring Habit

Every smoke harness for a deployed endpoint should start by probing the endpoint for the actual response shape, then writing assertions against that shape.

```python
# Probe first. This is the verify-first move.
probe_response = client.post(your_endpoint, sample_payload)
print(f"Status: {probe_response.status_code}")
print(f"Body: {probe_response.json()}")
# Now you know the actual shape. Author the assertions against it.

# Assert against verified shape.
assert probe_response.status_code in (200, 201)
assert "id" in probe_response.json()
assert "created_at" in probe_response.json()
```

This is the discipline that prevents the three contract-drift bugs from this article. The cost is fifteen seconds of probing per endpoint. The payoff is that you find the smoke's assumptions wrong at author-time instead of at recovery-time.

Generalize this into your kickoff template:

```markdown
## Smoke Authoring Rule

Before writing any assertion against a deployed endpoint, probe the
endpoint with a synthetic request and read the actual response shape.
Then write assertions against that shape. Do not infer the shape from
the proposal text. The proposal is illustrative; the deployed endpoint
is authoritative.
```

### Step 5: Document the Crash-Recovery Sequence

Write down the seven-step sequence from "Discipline 3: Verify-First Triage" above. Put it in your operations runbook. The first time you actually have a multi-agent crash, you do not want to be inventing the recovery sequence in real time.

Our runbook entry is roughly five hundred words. The orchestrator session reads it at the start of any rescue. The structure is identical every time: map deployed state, map disk state, run smokes, identify drift, author missing deliverables, commit under semantic messages, update shared status last. We've now run the sequence twice. Both times in under two hours. Both times the failure surface ended up smaller than we'd feared on first read.

### Step 6: Practice the Recovery on a Non-Critical Run

This is the step every team skips and the one that makes the most difference.

Before you trust the disciplines under real crash conditions, simulate a crash on a non-critical run. Spawn three sub-agents on a low-stakes parallel task. Let two of them finish; kill the third deliberately mid-flight. Walk the orchestrator through the recovery sequence. Find out where your runbook is unclear, where your auto-commit cron caught state you didn't expect, where your kickoff prompts allowed sub-agents to touch shared files anyway.

The first real crash should not be the first time the disciplines compose. We learned ours under real conditions, which is the expensive way. The cheap way is to rehearse.

---

## The Framework: The Triage-Not-Redo Contract

There's a transferable principle underneath the specifics, and it's worth naming.

**A multi-agent crash is recoverable in minutes instead of hours when the deployed state is atomic, the disk state is snapshotted, and the recovery path is forensic verification of what survived rather than wholesale re-execution of what was lost.**

We call this **The Triage-Not-Redo Contract.** Every discipline that fed into the recovery is one bet against the day a sub-agent dies. The bets compose. The composition is what turns a six-hour redo into a ninety-minute triage.

Three properties make this concrete:

### Property 1: Deployed State Is Atomic

You cannot triage what you cannot verify. Atomic migrations and transaction-wrapped data writes are what make the deployed surface verifiable. Without them, recovery means re-executing the migration on the assumption that it was probably-applied-but-maybe-not, which is the worst kind of work.

### Property 2: Disk State Is Snapshotted

You cannot triage what you cannot read. Auto-commit crons (or any equivalent file-state safety net) are what make disk state recoverable after a crash. Without them, the sub-agent's in-progress files are either on a disk that the next session can't easily reach, or they're lost entirely because the sub-agent never got to its first commit.

### Property 3: Recovery Is Forensic, Not Generative

You cannot triage if your default move is to respawn-and-pray. The recovery sequence has to be a sequence of probes (what's there, what's missing, what's drifted) followed by a small set of surgical fixes. Generative recovery (respawn the sub-agent and have it re-create the work) is more expensive than forensic recovery in every dimension: more time, more risk of duplication, more chance of contract drift surfacing later as a much harder bug.

### Where This Fits in the Series

Each volume in this series has documented a layer of self-annealing infrastructure. Vol 1 moved documentation into agent context. Vol 4 made shared resources self-resolve under collision. Vol 5 moved live data into agent context. Vol 7 moved organizational values into agent context. Vol 8 is the volume where those disciplines compose against a real multi-agent failure and the system holds.

The lesson is not that any single discipline saved us. The lesson is that the disciplines were already in place, doing their jobs, when the failure mode arrived. We didn't deploy any of them in response to this crash. They were waiting. That's what self-annealing infrastructure looks like at the operational layer... it does its work before the incident, so the incident is small.

---

## What We Learned

### The disciplines have to be already-in-place; the crash is the wrong time to author them.

Every discipline in this article was built in response to an earlier incident. Atomic migrations came out of a deploy that half-applied. The auto-commit cron came out of a vault edit session that lost an hour of work. The verify-first smoke pattern came out of a series of contract-drift bugs that surfaced in late-phase smokes. Each one was authored after a different small failure.

What this crash proved is that none of them have to be invented in the moment. They were sitting there. We didn't have to remember them. They were running.

### Atomic migrations are the single highest-payoff discipline.

If you take one thing from this article, take this: `BEGIN; ... COMMIT;` wrap every migration. Two lines. The payoff is that no crash can ever leave your schema half-applied. The recovery probe becomes a single SQL query. The forensic floor becomes deterministic.

Every database engine in production use supports transactional DDL. There is no excuse for not using it. The cost is two lines; the benefit is that crash recovery is bounded.

### The auto-commit cron is the discipline most people don't realize they need.

We didn't build the auto-commit cron for crash recovery. We built it for a different purpose (capturing vault edits that humans forget to commit). It happened to be exactly the right safety net during this crash. The pattern generalizes: long-running agent work that authors files over hours needs a file-state safety net. The mechanism is a cron job. The implementation is fifteen lines. The payoff arrives the day a sub-agent crashes mid-flight.

### Contract drift is invisible until you hit the live endpoint.

Three smokes broke in the same incident. Every one of them was a place where the sub-agent had inferred the contract from the proposal text instead of probing the deployed endpoint. None of the three would have been caught by static review. All of them were one-line fixes once the live endpoint corrected the assumption.

The verify-first probe is the discipline that prevents this category of bug. It belongs in every smoke-authoring kickoff from now on.

### Ninety minutes vs six hours is the receipt.

The thing that matters about this incident is not that nothing was lost. The thing that matters is that the recovery was bounded. Three sub-agents had crashed. Six hours of work was in flight. The disciplines turned that into a ninety-minute forensic triage with three one-line smoke fixes and one missing handoff note that the orchestrator authored directly.

The gap between "triage" and "redo" is the discipline gap. We close it one incident at a time. Vol 8 documents the moment the gap closed enough to matter.

### The kiddos get the long game when the infrastructure holds.

This is the thing that motivates the work. We run a small nonprofit that serves precious monsters and younglings still finding their footing. The infrastructure that keeps the lights on for them has to hold under the worst conditions, not just the best. Every discipline in this article exists because somewhere down the line, a youngling on the other end of one of our programs needs the system to be working when they reach it.

A six-hour outage in our infrastructure is a six-hour outage in someone's path to hope. Ninety minutes is bad. Six hours is worse. The disciplines that bound the cost are the disciplines that keep the mission breathing through the failure modes that will keep coming.

---

## The "Start Here" Prompt

If you want to build the Triage-Not-Redo Contract into your own multi-agent setup, give your AI agent this prompt:

```
I run multi-agent fan-outs where one orchestrator spawns several
sub-agents to work parallel slices of a release. I want to build the
disciplines that make a sub-agent crash a recoverable event instead
of a six-hour redo.

Audit my infrastructure for the three load-bearing disciplines and
build whatever is missing:

1. ATOMIC MIGRATIONS: Find every database migration and every data-
   migration script in the codebase. Verify each one is wrapped in a
   BEGIN; ... COMMIT; transaction. For any migration that isn't,
   add the wrap. Document the rule in the project README so future
   migrations follow it.

2. FILE-STATE SAFETY NET: Determine if there's an auto-commit cron
   (or equivalent) running against the working repo. If not, propose
   one with a fifteen-to-thirty-minute interval and a generic commit
   message. Show me the exact crontab entry and explain the
   "pause during destructive operations" rule.

3. KICKOFF PROMPT TEMPLATE: Review the kickoff prompt format I use
   for spawning sub-agents. Verify each kickoff explicitly enumerates
   which files the sub-agent may edit versus which are shared (owned
   by the orchestrator). If not, propose the template additions. The
   goal is that three parallel sub-agents pushing in close succession
   should never produce a merge conflict on a shared status file.

4. VERIFY-FIRST SMOKE PATTERN: Pull one recent smoke harness from
   the codebase. Audit whether the assertions were authored against
   the deployed endpoint's actual response shape or against the
   proposal text. If against the proposal text, refactor one
   assertion to demonstrate the verify-first pattern: probe the
   endpoint, print the response, then write the assertion. Add the
   pattern to the smoke-authoring section of my kickoff template.

5. CRASH-RECOVERY RUNBOOK: Author a runbook entry titled
   "Multi-Agent Crash Recovery" that names the seven-step sequence:
   map deployed state, map disk state, run smokes independently,
   identify contract drift, author missing deliverables, commit
   under semantic messages, update shared status last. Put it where
   the orchestrator session will read it at the start of any
   rescue.

6. REHEARSAL PLAN: Propose a low-stakes simulation where I spawn
   three sub-agents on a non-critical parallel task, kill one of
   them deliberately, and walk the orchestrator through the
   recovery sequence. The goal is to find the gaps in my runbook
   before the first real crash.

Don't just report findings. Build the missing pieces. For every
discipline, the verification is: can I demonstrate it works by
running a simulated crash and recovering without re-executing the
work that was already done?
```

Copy that. Paste it. Your orchestrator gets the runbook. The next crash gets bounded.

---

## See The Whole Ecosystem

QWF builds an interconnected family of apps. [Quietly Spotting](https://quietlyspotting.org) is the hub. Around it orbit Quietly Writing, Quietly Quoting, Quietly Networking, Quietly Knocking, Quietly Tracking, and more. See the [live ecosystem map](https://quietlyspotting.org/#ecosystem) for what's shipped, what's building, and how it all connects.

The disciplines in this volume are one small piece of how the family stays up under load. Resilience at the operational layer is what lets the rest of the ecosystem keep serving the people who depend on it... younglings reaching for hope, donor-partners reaching for trust, supporters reaching for tools that hold under their own conditions. The infrastructure is quiet. The work it protects is not.

## Related Reading

Self-annealing infrastructure works best when you see the whole architecture. The disciplines compose across volumes; each one tightens a different surface.

- Vol 1 of this series moved documentation paths into agent context (the hook that injects required reading before work starts).
- Vol 4 made shared resources self-resolve under collision (the kitchen design that survives roommates who never met).
- Vol 5 moved live data rows into agent context (open issues injected at session start so the agent sees what's already in flight).
- Vol 7 moved organizational values into agent context (schemas the agent reads every session, with WHY attached).
- The companion piece *How to Give Your AI Agent Superpowers* covers the broader memory and skills architecture that holds all of this together.

---

## About This Series

**Built from Broken** is published by the [Quietly Working Foundation](https://quietlyworking.org) (QWF), a 501(c)(3) nonprofit. Our mission is to serve youth 30 and younger... helping them discover purpose, build skills, and create legacy. We do this through product-based fundraising programs and student training.

We run a nonprofit almost entirely on AI agent infrastructure. Our backoffice is an Obsidian vault orchestrated by Claude Code (Anthropic's CLI-based AI coding agent), built on a three-layer architecture... Directives (what to do), Orchestration (the AI agent making decisions), and Execution (deterministic Python scripts doing the work). We build tools, we break things, we fix them... and then we write down what happened so you don't have to learn it the hard way.

This volume grew from a multi-agent fan-out that crashed mid-flight with three sub-agents in the air and a fourth fan-out queued behind them. The recovery took ninety minutes when the naive estimate was six hours. The disciplines that closed the gap had been built over six months across unrelated incidents. Vol 8 is the volume where they composed for the first time in compound, on a real failure, and the receipts ended up in git.

**The name:** "Built from Broken" comes from a core belief... that brokenness isn't something to hide. It's proof of what's possible. Every solution in this series exists because something failed. We show the scars, not to complain, but because someone else is hitting the same wall right now... and the fastest way through is knowing they're not alone.

---

*Built from Broken, Vol. 8 ... Published May 2026*
*Quietly Working Foundation | quietlyworking.org*
*Written by Chaplain TIG with Claude (Anthropic)*