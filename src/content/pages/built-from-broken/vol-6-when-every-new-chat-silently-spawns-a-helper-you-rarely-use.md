---
title: "Built from Broken: Vol. 6"
slug: "vol-6-when-every-new-chat-silently-spawns-a-helper-you-rarely-use"
pillar: "built-from-broken"
description: "stdio MCP servers spawn on every chat session start. HTTP MCPs don't. Swap the transport, reclaim the RAM, document the principle so the next agent never makes "
publishDate: "2026-04-20"
tags: ["QWF", "QWU", "built-from-broken", "ai-agent", "claude-code", "mcp", "infrastructure", "performance"]
series: "Built from Broken"
volume: 6
hook: "Load avg 30 on a 4-core box. Five chats open, five copies of the same helper, roughly 23 GB of RAM... eaten before the work even started."
isHome: false
---
# Built from Broken: Vol. 6
## When Every New Chat Silently Spawns a Helper You Rarely Use

> *Built from Broken is a series from the Quietly Working Foundation about real problems we face running AI-powered nonprofit operations... and the real solutions we build. Every fix in this series exists because something failed first. We show the receipts.*

---

## The Problem: You're Paying to Open, Not to Use

Our 4-core dev VM hit a load average of 30. That's 7.5× oversubscribed. The box was grinding on nothing... no builds, no scrapers, no heavy scripts. Five AI agent chat sessions were open. That's it. And those five chats had quietly spawned five identical copies of the same helper process, collectively holding roughly 23 GB of RAM, before a single prompt had been typed.

Nothing was broken. Nothing was leaking. The system was doing exactly what we'd told it to do. That was the problem.

### What We Built (Before It Broke)

Modern AI coding agents (Claude Code, in our case) support a plugin protocol called **MCP** (Model Context Protocol). MCP lets you bolt external tools onto your agent... web scrapers, database explorers, design tools, whatever. You declare them in a config file (`.mcp.json`), and from that moment on, the agent can call those tools as naturally as it calls its built-in ones.

MCP supports two transports:

- **stdio** — the agent spawns a local process for the MCP server and talks to it over pipes
- **HTTP** — the agent makes HTTP calls to a server running somewhere (localhost, vendor-hosted, wherever)

Both work. Both deliver the same functionality from the user's point of view. You add a tool, you use it from chat, done.

We had five MCPs registered. One of them was a well-known web-scraping vendor with a massive actor library. We used that vendor heavily in our backend Python scripts... scraping Google Maps, LinkedIn profiles, Reddit posts, YouTube transcripts. More than a thousand runs in the last month. It earned its keep.

The MCP we registered for that vendor used the stdio transport. That was the default in the vendor's docs. We copied the example and moved on.

### How It Broke

The failure mode isn't obvious until you open multiple chats at once.

Here's what an stdio MCP does at chat-session start:

1. Agent reads `.mcp.json`
2. Agent spawns every stdio server listed (via `npx`, `python`, or whatever command you specified)
3. Each server initializes, loads its tool definitions, connects to the vendor's API, and sits idle
4. The agent maintains the process for the life of the session

That "sits idle" step is the silent killer. The vendor's stdio MCP was a full Node.js process pulling down the vendor's SDK, initializing telemetry, and parking ~2-4 GB of RAM per session. When we had one chat open, it was annoying. When we had five open, it was 23 GB of resident memory for capability that chat sessions touched *maybe* twice a week.

Three real incidents from one Monday morning:

**Incident 1: The Load Average of Thirty**
Ran our VM pulse script. Output: `load avg: 30.12, 28.44, 22.18`. On a 4-core box. Top-level reaction: "something is spinning in a tight loop." Opened `htop`. Nothing was spinning in a tight loop. The CPU wasn't pinned... the machine was just memory-starved and swapping. Five identical processes, each consuming a few GB of RAM, with nothing apparently running.

**Incident 2: The Obvious Wrong Answer**
First instinct: "an MCP process must be orphaned. Kill it and reclaim the RAM." Ran `ps -ef | grep <mcp-server-name>` and cross-referenced parent PIDs against active agent sessions. Every single process mapped to a live chat. Nothing was orphaned. The system was working exactly as designed.

**Incident 3: The Missing Escape Hatch**
Next instinct: "there must be a way to lazy-load stdio MCPs... only spawn them when the agent actually needs them." Spent an hour reading docs, issues, and source. In the current Claude Code version (2.1.x, verified on our machine), there is **no such toggle**. No `disabledMcpjsonServers` key. No hook that can intercept at spawn time. No mid-session enable. The only way to not pay the stdio tax is to not use stdio.

Same pattern underneath all three:
1. We picked a transport because it was the default example
2. The transport's cost is per-session, not per-use
3. The chat-time value of the tool was small; the chat-time tax was large
4. The system had no built-in way to rebalance... so the tax kept compounding

### Why "Just Turn It Off When You're Not Using It" Doesn't Work

Every obvious fix failed for the same structural reason.

**Approach 1: Remove the MCP from the config.**
If the chat rarely uses it, maybe don't register it at all?

Why it fails: the tool is genuinely useful in chat for the 5% of moments when you need it. Removing it means rebuilding the workflow around "open a separate chat with a different config" or "shell out to the API manually." Both destroy the point of MCP (seamless in-chat tool access). The right answer isn't to remove the capability. It's to not pay for idle capability.

**Approach 2: Close sessions you aren't actively using.**
If each session costs a few GB of RAM, just be disciplined about closing them.

Why it fails: we open multiple sessions on purpose. Different chats work on different contexts in parallel. Closing them to save memory defeats the whole point of having a multi-session agent workflow. That's asking the user to subsidize a tooling bug with their own workflow.

**Approach 3: Upgrade the VM.**
More RAM. Bigger box. Problem solved.

Why it fails: the cost grows linearly with session count. Every additional session re-pays the tax. You can outrun the problem with hardware for a while... until you can't. And hardware upgrades don't fix the principle: you're paying at open, not at use.

**Approach 4: Wait for the agent platform to ship lazy-loading.**
Claude Code is a fast-moving product. This gap could close any week.

Why it fails *today*: the gap is open *today*. The VM is grinding *today*. We can't run our daily ops on a hypothetical future feature, no matter how plausible. When the platform ships lazy-loading for stdio MCPs, we'll celebrate... and the fix in this article will become obsolete. That's fine. The principle underneath the fix is durable even after the specific workaround stops being needed.

The core insight: **the tool transport isn't a cosmetic detail. It's the difference between paying on open and paying on use.** When the cost is paid on open, and you open often, the cost compounds in ways that don't show up in a tidy column on a spec sheet. They show up as load average 30 on a Monday morning.

---

## The Solution: Swap the Transport, Keep the Capability

### The Insight

Most MCP vendors offering significant chat-time value now publish a **hosted HTTP endpoint** that implements the same protocol. The functionality is identical from the agent's point of view. The difference is where the server runs.

- **stdio**: a process spawned on *your* machine, *per session*, held in RAM from open to close
- **HTTP**: a server running in the vendor's cloud (or a long-lived local daemon), reached on demand

With HTTP, there is no per-session spawn. The agent makes an HTTP request the moment it actually needs to call a tool. Between calls, your machine holds exactly zero resources for that MCP. When five chats are idle, the RAM cost is not 5 × (whatever stdio costs). It's zero.

That's the whole solution. Change the transport, keep everything else.

### What We Built

A six-line edit to `.mcp.json`. Specifically:

1. Removed the `"command": "npx ..."` block
2. Removed the `"args": [...]` block
3. Removed the `"env": {...}` block with the process-level environment variables
4. Changed `"type": "stdio"` to `"type": "http"`
5. Added `"url": "<vendor hosted MCP endpoint>"`
6. Added an `"headers": { "Authorization": "Bearer <token>" }` block

That's the surface change. The structural change is bigger. Every future chat session now starts with zero MCP spawn for this vendor. Memory footprint at session open: unchanged. Memory footprint when the agent actually calls a tool: small, transient, released when the call returns.

### The Before and After

**BEFORE (stdio transport):**
```
t=0      You open a new chat session
t=+0.2s  Agent reads .mcp.json
t=+0.4s  Agent spawns vendor-mcp-server via npx
t=+2.1s  Server loads Node.js, vendor SDK, tool definitions
t=+3.5s  Server connects to vendor API, ready to serve
t=+3.5s  Memory held: ~2-4 GB
t=+3.5s  You type your first prompt
...
t=+2h    Session ends
t=+2h    Memory held through the entire two hours: ~2-4 GB
```
Multiply by N concurrent sessions. N × 2-4 GB of RAM sitting idle.

**AFTER (HTTP transport):**
```
t=0      You open a new chat session
t=+0.2s  Agent reads .mcp.json
t=+0.2s  Agent records the HTTP URL. No spawn.
t=+0.2s  Memory held: 0
t=+0.2s  You type your first prompt
...
t=+42m   Agent finally calls a vendor tool for the first time
t=+42m   Single HTTPS request. Response streams back. Memory transient.
t=+42m   Request completes. Memory released.
...
t=+2h    Session ends
t=+2h    Memory held through the entire two hours: 0
```

Same capability. Same tools. Same agent behavior from the user's point of view. The only thing that changed is who holds resources and when.

### The Architecture

```
┌────────────────────────────────────────────────────────────────┐
│  stdio TRANSPORT (pay on open)                                 │
│                                                                 │
│  Chat session opens                                             │
│       │                                                         │
│       ▼                                                         │
│  Agent spawns MCP server process  ◄── RAM cost starts here     │
│       │                                                         │
│       ▼                                                         │
│  Server idles, holding RAM...      ◄── ... continues forever   │
│       │                                                         │
│       ▼                                                         │
│  Agent calls tool (rare)                                       │
│       │                                                         │
│       ▼                                                         │
│  Server handles call, keeps holding RAM                        │
│       │                                                         │
│       ▼                                                         │
│  Session closes, process dies     ◄── RAM finally released    │
└────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────┐
│  HTTP TRANSPORT (pay on use)                                   │
│                                                                 │
│  Chat session opens                                             │
│       │                                                         │
│       ▼                                                         │
│  Agent records URL. No spawn.      ◄── zero RAM cost           │
│       │                                                         │
│       ▼                                                         │
│  Agent calls tool (rare)                                       │
│       │                                                         │
│       ▼                                                         │
│  HTTPS request → vendor server → JSON response                 │
│       │                                                         │
│       ▼                                                         │
│  Response parsed. Memory transient. ◄── released immediately   │
│       │                                                         │
│       ▼                                                         │
│  Session closes                                                │
└────────────────────────────────────────────────────────────────┘
```

---

## How to Build Your Own

You don't need our specific vendor, our specific VM, or our specific agent. The pattern works for any MCP where a hosted HTTP endpoint exists (or where you can run a long-lived HTTP daemon yourself).

### Step 1: Inventory Your MCP Transports

Open your `.mcp.json` (or whatever config file your agent uses for MCP). Look at every registered server. For each one, note the transport type.

```jsonc
{
  "mcpServers": {
    "vendor-a": {
      "type": "stdio",           // ← pay on open
      "command": "npx",
      "args": ["-y", "some-mcp-server@latest"],
      "env": { "API_KEY": "..." }
    },
    "vendor-b": {
      "type": "http",            // ← pay on use
      "url": "https://mcp.vendor-b.com"
    },
    "self-hosted-tool": {
      "type": "http",
      "url": "http://127.0.0.1:29979/mcp"  // ← long-lived local daemon, still pay-on-use
    }
  }
}
```

Count how many are stdio. Each one is a per-session tax.

### Step 2: Measure the Tax

Open a fresh chat session. Once the agent is ready, check your process table for each stdio MCP server.

```bash
# macOS / Linux — replace <server-name> with whatever runs under npx/python
ps -o pid,rss,command -C node | grep <server-name>
# or more broadly:
ps -ax -o pid,rss,command | grep '[y]our-mcp-server-name'
```

The `rss` column is resident set size in kilobytes. Divide by 1024 for MB. That number is what every session is paying.

Multiply by your typical concurrent-session count. That's your total idle tax.

If the tax is small (say, under 100 MB per session), you can probably leave stdio alone. If the tax is measured in gigabytes, keep going.

### Step 3: Check for a Hosted HTTP Endpoint

For each stdio MCP, check the vendor's current documentation for a hosted HTTP endpoint. Most mature MCP vendors now offer one, often alongside the stdio option. Search for:

- "MCP HTTP endpoint"
- "Streamable HTTP"
- "hosted MCP server"
- "MCP API URL"

**Watch out for the deprecated SSE trap.** The original HTTP spec for MCP used Server-Sent Events (SSE). Many early HTTP MCP docs point at `/sse` endpoints. Those are being sunset across the ecosystem in favor of **Streamable HTTP** at the root URL. If the docs you find look dated, search the vendor's release notes or changelog for "Streamable HTTP" or "MCP HTTP migration" before you commit. Using the wrong variant produces a connection that *almost* works and then fails on tool invocation.

If no hosted endpoint exists, your next option is to run an HTTP MCP daemon yourself (a single long-lived process that all chat sessions share). That still beats stdio's per-session tax, because one resident process is cheaper than N.

If neither is possible, document the gap, monitor the vendor's roadmap, and decide whether the chat-time value justifies the tax.

### Step 4: Make the Swap

The actual edit is tiny. Here's the before-and-after for one server block.

**Before (stdio):**
```jsonc
{
  "mcpServers": {
    "your-vendor": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "your-vendor-mcp-server@latest"],
      "env": {
        "YOUR_VENDOR_API_KEY": "sk-...",
        "YOUR_VENDOR_TELEMETRY": "false"
      }
    }
  }
}
```

**After (HTTP):**
```jsonc
{
  "mcpServers": {
    "your-vendor": {
      "type": "http",
      "url": "https://mcp.your-vendor.com",
      "headers": {
        "Authorization": "Bearer sk-..."
      }
    }
  }
}
```

Two notes on credentials:

- **Hardcode with care.** Many MCP config files live in `.gitignore`'d locations. If yours does, hardcoding the bearer token is equivalent-risk to any other local-file credential. If your config is tracked by git, do not hardcode.
- **Environment interpolation is inconsistent.** Some agent versions support `${ENV_VAR}` inside `.mcp.json` headers. Some don't. Test a static value first to confirm the HTTP swap works end-to-end, then decide whether interpolation is reliable enough to layer on top. We tested hardcoded values first and verified they are honored; we'll layer interpolation once we see it documented as stable.

### Step 5: Verify the Swap Worked

Restart your agent (existing sessions keep their spawned stdio processes until they exit... you want a fresh one). Then run three checks.

**Check 1: The MCP connects at all.**
Open a new chat, list your agent's available MCP servers, and confirm the vendor shows up with "connected" status. If authentication is wrong, you'll see a connection error immediately.

**Check 2: A tool call returns a real result.**
Invoke the cheapest, most benign tool on that MCP (a search, a status check, a list operation). If the call returns valid data, auth is working end-to-end.

**Check 3: No stdio process was spawned.**
From a fresh shell, check the process table:

```bash
ps -ax -o pid,ppid,command | grep '[y]our-mcp-server-name'
```

For a newly-opened session, you should see *zero* rows. (Older sessions may still have their stdio processes, which will drain as those sessions close. Focus on the parent PID of fresh sessions.)

If all three checks pass, the swap is live. Existing sessions finish paying their stdio tax; every new session pays nothing.

### Step 6: Lock the Lesson Into System Memory

The most important step is also the easiest to skip. Write down the principle somewhere your agent will see it on future decisions.

For Claude Code specifically, that's the agent's memory directory. For other agents, it might be a CLAUDE.md file, a system-prompt addendum, or a documented rule in your runbook. The shape we used:

```markdown
---
name: MCP Transport Choice (stdio vs HTTP)
description: Prefer HTTP MCPs over stdio. stdio spawns per session; HTTP is lazy.
type: reference
---

# MCP Transport Choice

## Rule
Prefer HTTP MCPs over stdio whenever a vendor-hosted or long-lived local
HTTP endpoint exists. stdio servers spawn on every session start and hold
RAM for the life of the session. HTTP is lazy... zero baseline, pay on use.

## When to Apply
- Adopting a new MCP-enabled vendor: check for a hosted HTTP endpoint first
- Converting existing MCPs: migrate heavy stdio servers to HTTP as capacity matters
- Rarely-used stdio MCPs with no HTTP alternative: consider removing entirely

## Known Gotchas
- Legacy SSE endpoints are being deprecated in favor of Streamable HTTP at root URL
- Static Bearer headers work; env interpolation support varies by agent version
- Existing sessions keep their spawned stdio processes until they exit
```

The next time you're adding an MCP, that rule fires before you fall into the same trap.

---

## The Framework: The Lazy Transport Principle

Every external capability your dev environment adds has a cost profile. The question is *when you pay*.

```
                 ┌───────────────────────────────┐
                 │   EAGER TRANSPORT (stdio-like)│
                 │                               │
                 │   Cost at open: HIGH          │
                 │   Cost at idle: HIGH          │
                 │   Cost at use:  Small         │
                 │                               │
                 │   Total = f(session count)    │
                 └───────────────┬───────────────┘
                                 │
                                 │  grows linearly with
                                 │  how often you open
                                 │
                                 ▼
                 ┌───────────────────────────────┐
                 │   LAZY TRANSPORT (HTTP-like)  │
                 │                               │
                 │   Cost at open: ~0            │
                 │   Cost at idle: ~0            │
                 │   Cost at use:  Small         │
                 │                               │
                 │   Total = f(actual use)       │
                 └───────────────────────────────┘

        The right default is lazy. Always. Unless proven otherwise.
```

### Eager transports are fine... when you'll use the tool constantly

If you open one long-lived chat session and that session hammers the tool every few minutes, the per-session spawn is amortized. You're paying for something you're using. The math works.

### Eager transports punish rare-use tools in multi-session workflows

If you open multiple chats (because you work on parallel threads), *and* most of those chats don't use the tool, the eager transport charges you every time anyway. The tool "pays rent" in every session whether the session needs it or not.

This is why the failure surfaces at scale. One chat, one eager MCP, one idle process... annoying but survivable. Five chats, five eager MCPs, five idle processes... system-level load problem that doesn't trace back to any specific command you ran.

### The principle generalizes well beyond MCP

Anywhere your dev environment adds a capability, ask:

- **Dev server plugins** — does this plugin cost memory just by being installed, or only when it does work?
- **LSP servers** — does my IDE spawn one per window, per project, per language? How many idle ones am I maintaining right now?
- **Editor extensions** — how many of them are running background indexers I never use?
- **Docker sidecars** — is this container essential, or does it sit idle 23 hours a day?
- **Browser extensions** — how much memory are the ones I rarely use holding across every tab?

The audit is the same every time: **cost on open, cost on idle, cost on use.** Lazy transports keep the first two near zero. Eager transports don't.

### The hope

We fully hope this specific workaround becomes obsolete. The cleanest fix isn't in our hands... it's in the agent platform shipping true lazy-loading for stdio MCPs, so the choice of transport stops implying a permanent RAM tax. When that ships, the specific edit in this article won't matter anymore. Vendors can offer either transport; users can pick either; neither choice taxes the idle case.

Until then, the workaround is a two-minute edit, and the underlying principle (prefer lazy over eager when the work pattern is bursty) stays true long after this particular gap closes.

---

## What We Learned

### The defaults in vendor docs encode assumptions you haven't audited.

The vendor's example used stdio. We copied it because copying examples is how anyone gets started. The example didn't say "this transport holds 2-4 GB per session; consider the HTTP option if you run multiple sessions." That's not a dig at the vendor... their example has to pick *something*. The lesson is that every "default" is a shipped assumption about someone's use case, and that someone might not be you.

Audit the shape of the cost, not just whether the thing works.

### Load average 30 is the receipt, not the problem.

Our first instinct was to debug the load average as if it were a runaway process. It wasn't. It was a composition effect... five individually-sane things adding up to an insane total. The diagnostic that mattered wasn't "what's spinning?" but "what's every session paying just to be open?"

Composition bugs don't show up in any single component. They show up in the aggregate, and you only see them when you look at the aggregate deliberately. A quick VM-level pulse check is a cheap habit that catches whole categories of "no single thing is wrong" problems.

### Backend scripts don't need MCP at all.

The vendor whose MCP we swapped is heavily used in our backend Python automation... over a thousand runs in the last month. Zero of those runs go through the MCP. They hit the vendor's API directly. The MCP exists purely for the occasional "hey agent, look up X for me" moment in chat. That's the whole reason the stdio tax was so disproportionate. We were paying for a chat affordance we used rarely, collected in RAM, permanently.

The broader lesson: **know which of your MCPs are actually earning their keep in chat, and be honest about the ones that aren't.** Rarely-used MCPs with no HTTP alternative are candidates for removal, not preservation.

### This is structurally the same conversation as "install vs. run."

The stdio-vs-HTTP split shows up in other places under different names. VS Code extensions that run on install vs. on demand. LSP servers that spin up per-project vs. on-file-open. Docker containers declared `restart: always` vs. on-demand services. CI runners held warm vs. spun up per job. The specific tradeoffs vary, but the question is the same: *when do I want to pay for this?*

We hope our specific workaround becomes a non-issue. The underlying question... "when am I paying, and does that match when I'm using?"... will outlive any specific tool.

---

## The "Start Here" Prompt

If you want to audit and fix this in your own environment, give your AI agent this prompt:

```
I want to audit my MCP (Model Context Protocol) server configuration for
per-session resource taxes and swap any heavy stdio MCPs to HTTP transport
where a hosted endpoint exists.

Here's what I need you to do:

1. Read my MCP config file (most commonly .mcp.json in the project root).
   List every registered MCP server and its transport type (stdio vs http).

2. For each stdio server, look up current documentation to check whether
   the vendor now publishes a hosted HTTP endpoint. Be specific about
   whether it's the modern Streamable HTTP variant or a deprecated /sse
   variant... the two are not interchangeable.

3. For each stdio server I might keep, help me measure its per-session
   RAM cost. Tell me the exact ps command to run and how to read the
   output.

4. Recommend a prioritized list of swaps:
   - Definitely swap (high RAM cost, hosted HTTP exists, modern variant)
   - Consider swapping (moderate cost or legacy HTTP variant)
   - Keep stdio (small cost, no HTTP alternative, or frequently used)
   - Consider removing (rarely used, no HTTP alternative, high cost)

5. For each swap I approve, give me the exact before/after JSON for that
   server block. Include a note on credential handling:
   - Is my config file gitignored? If yes, hardcoding the bearer token is
     equivalent-risk to other local-file credentials.
   - If my config is tracked by git, do NOT hardcode. We'll use a different
     pattern (env injection at session start, or a separate secrets file).

6. After I make the edit, tell me the exact three verification checks to
   run:
   - MCP connects with "connected" status
   - A benign tool call returns a real result
   - ps output shows no new stdio process spawned from a fresh session

7. Finally, write a short memory/reference rule (matching my agent's
   memory format if one exists) that captures the principle "prefer lazy
   transports over eager ones when a hosted HTTP endpoint exists" so
   future sessions default correctly.

Do NOT make any edits until I approve each step. Start by reading the
config file and showing me the inventory.
```

Copy that. Paste it into a new agent session. You'll have your audit and a short list of swaps in ten minutes.

---

## About This Series

**Built from Broken** is published by the [Quietly Working Foundation](https://quietlyworking.org) (QWF), a 501(c)(3) nonprofit. Our mission is to serve youth 30 and younger... helping them discover purpose, build skills, and create legacy. We do this through product-based fundraising programs and student training.

We run a nonprofit almost entirely on AI agent infrastructure. Our backoffice is an Obsidian vault orchestrated by Claude Code (Anthropic's CLI-based AI coding agent), built on a three-layer architecture... Directives (what to do), Orchestration (the AI agent making decisions), and Execution (deterministic Python scripts doing the work). We build tools, we break things, we fix them... and then we write down what happened so you don't have to learn it the hard way.

This volume is about an invisible cost that only becomes visible at scale. A single chat session paying a small tax to be open feels like nothing. Five sessions paying the same tax in parallel is a system-level problem with no single cause. The workaround is a two-minute edit. The principle underneath the workaround is the real deliverable... and it'll still matter in five years, long after this specific agent-platform gap has closed.

**The name:** "Built from Broken" comes from a core belief... that brokenness isn't something to hide. It's proof of what's possible. Every solution in this series exists because something failed. We show the scars, not to complain, but because someone else is hitting the same wall right now... and the fastest way through is knowing they're not alone.

---

*Built from Broken, Vol. 6 — Published April 2026*
*Quietly Working Foundation | quietlyworking.org*
*Written by Chaplain TIG with Claude (Anthropic)*