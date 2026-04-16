---
title: "Built from Broken: Vol. 4"
slug: "vol-4-when-your-ai-agent-breaks-your-other-ai-agent"
pillar: "built-from-broken"
description: "One agent started a debug server. Another agent's production service couldn't start. 35 minutes of downtime... and The Autonomous Roommate Problem that makes it"
publishDate: "2026-04-15"
tags: ["QWF", "QWU", "built-from-broken", "ai-agent", "claude-code", "infrastructure", "systemd", "shared-resources"]
series: "Built from Broken"
volume: 4
hook: "35 minutes of downtime. Two agents. One port. Neither knew the other existed."
isHome: false
---
# Built from Broken: Vol. 4
## When Your AI Agent Breaks Your Other AI Agent

> *Built from Broken is a series from the Quietly Working Foundation about real problems we face running AI-powered nonprofit operations... and the real solutions we build. Every fix exists because something failed first. We show the receipts.*

---

## The Problem: Roommates Who Never Met

You start running two agent sessions at once. Maybe three. One's handling your webhook server. One's doing research. One's debugging something. You're getting more done than ever. And then one of them kills the other one. Not maliciously. Not even carelessly. It just... didn't know the other one existed.

Here's the thing nobody tells you... **this is a sign of success, not failure.** If agent sessions are colliding with each other, it means you've built enough real infrastructure for conflicts to be possible. You've graduated from "one agent doing one thing" to an actual multi-agent system. That's a milestone. It just doesn't feel like one when your SMS gateway is down.

### What Happened

April 2026. A monitoring alert fires at 11:56 PM. Our SMS gateway... the service that handles all inbound text messages, routes them to handlers, and keeps our communication pipeline running... is down.

We SSH in and check the service status:

```
× sms-webhook.service - SMS Webhook Server
     Active: failed (Result: exit-code)
     Process: ExecStart=python webhook_server.py (code=exited, status=1/FAILURE)
```

The journal tells the story:

```
OSError: [Errno 98] Address already in use
```

Port 8765. The webhook server's port. Something else is sitting on it.

We check what's holding the port:

```bash
ss -tlnp | grep 8765
```

```
LISTEN  0  5  0.0.0.0:8765  0.0.0.0:*  users:(("python3",pid=546178,fd=3))
```

A Python process. But not our webhook server. We check the PID:

```
python3 -m http.server 8765
```

A bare-bones debug HTTP server. Sitting on the exact same port our production SMS gateway needs. Started 2 minutes before the gateway crashed.

Here's what happened: another Claude Code session... working on a completely different task... spun up a quick HTTP server for debugging. It picked port 8765. Why that port? Probably because the agent saw it referenced somewhere in the codebase. Or the agent just needed a port and 8765 seemed as good as any.

The debug server grabbed the port. The SMS gateway (which restarts periodically for updates) tried to bind to the same port. Failed. Tried again. Failed. Tried 11 times over 12 seconds. Exhausted its restart budget. Gave up.

35 minutes of downtime. Not because anything was broken. Because two roommates tried to use the kitchen at the same time... and neither one knew the other existed.

### Why This Wasn't a Bug

Let's be clear about something: **nobody did anything wrong here.**

The first agent needed a debug server. Starting one on an available port is a perfectly reasonable thing to do. The second agent (our webhook service) expected its port to be available. Also perfectly reasonable.

The problem isn't either agent's behavior. The problem is the assumption that shared resources will always be available... that what's free right now will stay free. In a single-agent world, that assumption holds. The moment you have two agents sharing infrastructure, it doesn't.

And you can't solve this by telling Agent B "don't use port 8765." Agent B starts fresh every session. It has no memory of that conversation. No awareness of Agent A's services. No concept of shared infrastructure etiquette.

This isn't a coordination problem. It's a design problem.

### Why the Service Didn't Self-Heal

The crash itself was bad. But the real failure was that the service *couldn't recover*.

Our systemd service had `Restart=always` configured. Which sounds like it should handle this. But here's what actually happens:

1. Service crashes because the port is occupied
2. Systemd waits 5 seconds, restarts it
3. Port is still occupied (debug server is still running)
4. Service crashes again
5. Repeat 11 times in 60 seconds
6. Systemd hits `StartLimitBurst` (max restarts in a window)
7. Service enters `failed` state permanently
8. No more restart attempts until manual intervention

`Restart=always` doesn't mean "restart forever." It means "restart until you've tried too many times, then give up." And when the failure condition is persistent (another process holding the port), every restart attempt fails identically.

The service had the right impulse (keep trying) but no mechanism to fix the underlying problem (clear the port).

---

## The Solution: Design for Conflict, Not Prevention

You can't prevent all resource collisions between independent agents. You can make them harmless.

### What We Built

Two layers. One at the application level, one at the OS level.

**Layer 1: Application — `SO_REUSEADDR`**

The Python `HTTPServer` class doesn't set `SO_REUSEADDR` by default. This means when the previous server process dies, the OS keeps the socket in `TIME_WAIT` state for up to 60 seconds. During that window, no new process can bind to the same port... even if it's the rightful owner trying to restart.

We added a one-line subclass:

```python
class ReusableHTTPServer(HTTPServer):
    allow_reuse_address = True
```

This tells the OS: "I know this port was recently in use. Let me bind to it anyway." It handles the most common restart scenario... the old process died, the socket is in limbo, the new process needs to take over.

**Layer 2: OS — `ExecStartPre` port cleanup**

`SO_REUSEADDR` handles stale sockets. But it doesn't help when a *different, living process* is actively listening on the port. That requires eviction.

We added a systemd drop-in that runs before every service start:

```ini
[Service]
ExecStartPre=/bin/bash -c "fuser -k 8765/tcp 2>/dev/null || true"
```

`fuser -k` finds and kills whatever process is holding the port. The `|| true` ensures the service starts even if nothing was holding the port (so the kill command failing is fine).

This runs before every start attempt. If a debug server is squatting on the port... dead. If an orphaned process from a crashed session is lingering... dead. If nothing's there... no-op. The service starts either way.

### The Before and After

**BEFORE (without protection):**
```
11:54 PM  Agent B starts debug server on port 8765
11:55 PM  SMS gateway tries to restart (periodic update)
11:55 PM  OSError: Address already in use
11:55 PM  systemd restarts... fails again
11:55 PM  11 restart attempts in 12 seconds, all fail
11:56 PM  Service enters permanent failure state
11:56 PM  Monitoring alert fires
12:31 AM  Human intervenes, kills rogue process, restarts service

Total: 35 minutes of SMS downtime. Manual intervention required.
```

**AFTER (with both layers):**
```
11:54 PM  Agent B starts debug server on port 8765
11:55 PM  SMS gateway tries to restart (periodic update)
11:55 PM  ExecStartPre fires: fuser -k 8765/tcp (kills debug server)
11:55 PM  SO_REUSEADDR: socket binds cleanly
11:55 PM  SMS gateway starts successfully
11:55 PM  Monitoring: all clear

Total: ~2 seconds. Automatic. No human needed.
```

### The Architecture

```
+--------------------------------------------------+
|  Service needs to start (restart or boot)        |
+-------------------------+------------------------+
                          |
                          v
+--------------------------------------------------+
|  LAYER 1: ExecStartPre (OS level)               |
|                                                  |
|  fuser -k [port]/tcp 2>/dev/null || true         |
|                                                  |
|  Effect: Kills ANY process on the port.          |
|  If nothing's there: no-op.                      |
|  If debug server is squatting: evicted.          |
|  If orphaned process is lingering: cleaned up.   |
+-------------------------+------------------------+
                          |
                          v
+--------------------------------------------------+
|  LAYER 2: SO_REUSEADDR (Application level)       |
|                                                  |
|  allow_reuse_address = True                      |
|                                                  |
|  Effect: Binds even if socket is in TIME_WAIT.   |
|  Handles the gap between process death and       |
|  OS socket cleanup.                              |
+-------------------------+------------------------+
                          |
                          v
+--------------------------------------------------+
|  Service binds to port. Starts serving.          |
|  Zero downtime. No human intervention.           |
+--------------------------------------------------+
```

Two layers because they solve different problems. `ExecStartPre` handles living squatters. `SO_REUSEADDR` handles dead socket ghosts. Together, the service starts regardless of port state.

---

## How to Build Your Own

This isn't just about ports. The pattern applies to any shared resource where independent agents might collide.

### Step 1: Inventory Your Shared Resources

Before you can protect resources, you need to know what's shared. Ask your agent to audit:

```bash
# What ports are services listening on?
ss -tlnp

# What background processes are running?
ps aux | grep python

# What files are locked?
lsof +D /path/to/shared/directory

# What systemd services exist?
systemctl list-units --type=service --state=running
```

Build a table:

| Resource | Type | Owner | Port/Path | Risk If Occupied |
|----------|------|-------|-----------|------------------|
| Webhook server | Port | sms-webhook.service | 8765 | SMS pipeline down |
| API server | Port | api-server.service | 3000 | API unavailable |
| SQLite DB | File lock | multiple scripts | data/app.db | Write failures |
| Temp directory | File system | multiple agents | /tmp/workdir/ | Data corruption |

This is your collision map.

### Step 2: Add `SO_REUSEADDR` to Every Long-Running Server

This should be the default for any Python HTTP server that runs as a service. The standard library's `HTTPServer` doesn't set it, which is a footgun for any production use.

```python
from http.server import HTTPServer

class ReusableHTTPServer(HTTPServer):
    """Allows port reuse after service restart.
    
    Without this, a restarting service can fail to bind for up to
    60 seconds while the OS holds the previous socket in TIME_WAIT.
    """
    allow_reuse_address = True

# Use it exactly like HTTPServer
server = ReusableHTTPServer(('0.0.0.0', port), YourHandler)
server.serve_forever()
```

**Why this isn't the default in Python's standard library** is one of those historical decisions that costs everyone time. Flask, FastAPI, and most frameworks set it automatically. The bare `HTTPServer` does not. If you're running bare `HTTPServer` in production... fix this now.

### Step 3: Add `ExecStartPre` to Your systemd Services

For any systemd service that binds to a specific port, add a drop-in config:

```bash
# Create the drop-in directory if it doesn't exist
mkdir -p /etc/systemd/system/your-service.service.d/

# Create the port-cleanup config
cat > /etc/systemd/system/your-service.service.d/port-cleanup.conf << 'EOF'
[Service]
ExecStartPre=/bin/bash -c "fuser -k YOUR_PORT/tcp 2>/dev/null || true"
EOF

# Reload systemd to pick up the change
systemctl daemon-reload
```

**Why a drop-in instead of editing the main service file?** Drop-ins survive service file updates. If you edit the main `.service` file and a package update overwrites it, your port cleanup disappears. Drop-ins are additive and persistent.

**Why `|| true`?** Without it, `fuser -k` returns a non-zero exit code when nothing is using the port. systemd treats non-zero `ExecStartPre` as a failure and refuses to start the service. The `|| true` makes "nothing to kill" a success condition.

### Step 4: Handle File-Based Collisions

Ports aren't the only shared resource. SQLite databases, temp files, and lock files are collision targets too.

For SQLite (the most common file-based collision):

```python
import sqlite3

# Enable WAL mode for concurrent readers
conn = sqlite3.connect('your_database.db')
conn.execute('PRAGMA journal_mode=WAL')

# Set a busy timeout instead of immediately failing
conn.execute('PRAGMA busy_timeout=5000')  # Wait up to 5 seconds
```

For temp files, use unique prefixes:

```python
import tempfile
import os

# Bad: fixed path that any agent might use
WORK_DIR = '/tmp/agent-work/'

# Good: unique path per process
WORK_DIR = tempfile.mkdtemp(prefix='agent-work-')
```

For lock files, use advisory locks with timeouts:

```python
import fcntl
import time

def acquire_lock(lock_path, timeout=10):
    """Acquire a file lock with timeout."""
    lock_file = open(lock_path, 'w')
    deadline = time.time() + timeout
    while time.time() < deadline:
        try:
            fcntl.flock(lock_file, fcntl.LOCK_EX | fcntl.LOCK_NB)
            return lock_file
        except BlockingIOError:
            time.sleep(0.5)
    raise TimeoutError(f"Could not acquire lock: {lock_path}")
```

### Step 5: Add Resource Checks to Your Monitoring

Your monitoring should catch resource collisions early, before they cause outages.

```python
import subprocess
import json

def check_port_conflicts(expected_services):
    """Check that expected services own their expected ports.
    
    expected_services: dict mapping port numbers to expected
    process names, e.g., {8765: 'webhook_server', 3000: 'api_server'}
    """
    conflicts = []
    
    for port, expected_name in expected_services.items():
        result = subprocess.run(
            ['ss', '-tlnp', f'sport = :{port}'],
            capture_output=True, text=True
        )
        
        if expected_name not in result.stdout:
            if result.stdout.strip():
                # Something else is on this port
                conflicts.append({
                    'port': port,
                    'expected': expected_name,
                    'actual': result.stdout.strip(),
                    'severity': 'critical'
                })
            else:
                # Nothing on this port (service might be down)
                conflicts.append({
                    'port': port,
                    'expected': expected_name,
                    'actual': 'nothing',
                    'severity': 'warning'
                })
    
    return conflicts
```

Run this every health check cycle. If someone else is on a port your service needs... you know before the next restart fails.

### Step 6: Document Your Service Ports

This is the simplest step and the one most people skip. Keep a living document of what ports are used for what:

```markdown
## Service Port Registry

| Port | Service | Protocol | Notes |
|------|---------|----------|-------|
| 8765 | SMS webhook server | HTTP | Twilio inbound |
| 3000 | API server | HTTP | Internal API |
| 5432 | PostgreSQL | TCP | Database |
| 6379 | Redis | TCP | Cache |
```

When an agent needs a port for debugging, it can check this document first. It won't always do this... agents are amnesic. But it reduces the odds. And when a collision does happen, the document tells you instantly whose port got stepped on.

---

## The Framework: The Autonomous Roommate Problem

Here's the transferable principle:

**When independent agents share infrastructure without shared awareness, resource collisions are inevitable. The solution is never agent coordination... it's infrastructure that self-resolves conflicts.**

We call this **The Autonomous Roommate Problem.** Your agents are roommates who share an apartment but never talk to each other. They can't coordinate schedules. They can't leave notes that stick. Every morning, they wake up with complete amnesia about what the other one did last night.

You cannot solve this with communication. You solve it with kitchen design.

Three rules make this concrete:

### Rule 1: Never Rely on Agent Memory for Resource Coordination

You might be tempted to add instructions: "Don't use port 8765, it's reserved for the webhook server." This works for exactly one session. The next session starts fresh. The instruction might be in a config file, but the agent might not read it. Or might read it and still pick that port because a different part of the codebase references it.

Agent memory is probabilistic. Resource coordination requires deterministic guarantees. Don't ask agents to remember... build systems that enforce.

### Rule 2: Every Shared Resource Needs a Collision Protocol

For every entry in your resource inventory, define what happens when two agents try to use it simultaneously:

| Resource Type | Collision | Protocol |
|---------------|-----------|----------|
| Network port | Two processes bind same port | `ExecStartPre` eviction + `SO_REUSEADDR` |
| SQLite database | Concurrent writes | WAL mode + busy timeout |
| Temp directory | Overlapping file names | Per-process unique directories |
| Config file | Simultaneous edits | File locking with timeout |
| API rate limit | Concurrent requests | Shared rate limiter with backoff |

If you can't define the collision protocol, you're hoping it doesn't happen. Hope is not a strategy for production systems.

### Rule 3: Design for Recovery, Not Prevention

You will never prevent all collisions. An agent doing something unexpected with a shared resource is... what agents do. They improvise. That's the whole point of using them.

So instead of trying to prevent every possible collision (which is impossible and makes your system brittle), design each service to recover from collisions automatically:

- **Port collisions:** `ExecStartPre` clears the port. Service starts clean.
- **File lock collisions:** Timeout and retry. Dead locks get cleaned up.
- **Database collisions:** WAL mode handles concurrent access gracefully.
- **Process collisions:** PID files with stale-PID detection.

The pattern is always the same: detect the conflict, resolve it automatically, proceed without human intervention.

**The evolution across this series:**

| Volume | Problem | Layer | Solution Pattern |
|--------|---------|-------|-----------------|
| Vol. 1 | Agent skips documentation | Input preparation | Hook injects reminders before work starts |
| Vol. 3 | Agent fabricates facts | Output validation | Hook blocks tool calls with verifiable errors |
| Vol. 4 | Agent conflicts with agent | Infrastructure | Self-resolving resource protocols |

Each volume moves down the stack. From what the agent reads, to what it writes, to the infrastructure it runs on. The principle stays the same: **don't ask agents to behave... build systems where misbehavior self-corrects.**

---

## What We Learned

### The first reaction is always wrong.

When you see one agent take down another agent's service, your gut says: "I'm doing this wrong. I should run fewer agents. I should be more careful." 

No.

You should run MORE agents. You should push harder on concurrency. And you should make every shared resource self-healing so that collisions resolve automatically instead of causing outages.

The instinct to scale back is the instinct to stay small. The alternative is to build infrastructure that handles the chaos. That's what production systems do. Airlines don't reduce flights when two planes need the same runway... they build air traffic control. Your infrastructure needs the same thinking.

### `SO_REUSEADDR` should be the default for any production HTTP server.

This is such a basic thing. And yet our webhook server ran for months without it. Flask and FastAPI set it automatically. The Python standard library's `HTTPServer` does not. If you're running bare `HTTPServer` (or anything built on `socketserver.TCPServer`)... check this today. Right now. Before you hit the same 35-minute outage we did.

### systemd drop-ins are the right tool for service hardening.

We could have edited the main `.service` file. But drop-ins are better for three reasons:

1. They survive service file updates
2. They're modular... one concern per file (port cleanup, memory limits, failure notification)
3. They're auditable... `ls /etc/systemd/system/your.service.d/` shows you every modification at a glance

Our SMS gateway now has three drop-ins: memory limits, failure notifications, and port cleanup. Each one was added after a specific incident. Each one makes the service more resilient. That's what self-annealing looks like at the OS level.

### The real question isn't "what broke?" It's "why didn't it self-heal?"

This is the mindset shift.

Something breaking is normal. Expected. Inevitable. The failure isn't the crash... it's the fact that the crash required a human to fix. If the service had cleared the port before starting, the whole incident would have been a one-second blip in the logs instead of 35 minutes of downtime and a monitoring alert.

When something breaks in your infrastructure, ask three questions:

1. **What broke?** (The diagnosis)
2. **Why didn't it recover automatically?** (The real failure)
3. **How do I make this self-resolving?** (The lasting fix)

Question 1 fixes today's problem. Question 3 fixes the category of problems. Most people stop at question 1. The difference between "fixing incidents" and "building reliable systems" is whether you get to question 3.

And here's the thing... question 3 is exactly the right thing to ask your AI agent. "How do we make sure this never happens again?" That question prompted the two-layer fix in this article. The agent diagnosed the port conflict, proposed `SO_REUSEADDR` for socket-level recovery, and designed the `ExecStartPre` drop-in for process-level eviction. Defense in depth... from a single well-aimed question.

### 35 minutes taught us more than 3 months of clean operation.

That's the whole thesis of this series. Clean operation teaches you nothing. Clean operation means your assumptions haven't been tested yet. The 35-minute outage exposed: missing socket options, no pre-start cleanup, no port ownership verification in health checks, and no documentation of which ports are reserved.

All of those gaps existed during the 3 months of clean operation. We just didn't know about them. The outage was the teacher. The fixes are the curriculum.

---

## The "Start Here" Prompt

If you're running multiple AI agent sessions on shared infrastructure and want to audit for resource collisions before they cause an outage, give your agent this prompt:

```
I run multiple AI agent sessions on the same server, and I need to 
audit for shared resource conflicts before they cause outages. One 
of my services recently went down because another agent session 
grabbed the same port. I want to make this category of problem 
impossible.

Audit my infrastructure for shared-resource collision risks and 
build protection for each one:

1. INVENTORY: Scan for all shared resources:
   - Network ports in use (ss -tlnp)
   - Background services and their ports (systemctl list-units)
   - SQLite databases that multiple scripts access
   - Shared temp directories or work directories
   - Lock files or PID files
   - Any file paths referenced by more than one script

2. BUILD A COLLISION MAP: For each shared resource, document:
   - What uses it
   - What happens if two agents access it simultaneously
   - Current protection (if any)
   - Risk level (critical/medium/low)

3. FIX CRITICAL RISKS:
   - For any service binding a port: add SO_REUSEADDR 
     (allow_reuse_address = True in Python) and add a systemd 
     ExecStartPre that runs "fuser -k PORT/tcp" before starting
   - For SQLite databases: enable WAL mode and set busy_timeout
   - For temp directories: switch to per-process unique directories 
     (tempfile.mkdtemp with a prefix)
   - For services without health checks: add a health endpoint

4. ADD MONITORING: Build a port-ownership check that verifies 
   expected services own their expected ports. Run it as part 
   of regular health checks. Alert if a port is occupied by an 
   unexpected process.

5. CREATE A SERVICE PORT REGISTRY: Document every port, which 
   service owns it, and what protocol it uses. Put this somewhere 
   agents will find it (like your project's main config or docs).

Don't just report findings... fix them. For each fix, verify it 
works by testing that the service can restart cleanly even when 
the port is occupied by a dummy process.
```

Copy that. Paste it. Your agent builds the safety net.

---

## About This Series

**Built from Broken** is published by the [Quietly Working Foundation](https://quietlyworking.org) (QWF), a 501(c)(3) nonprofit. Our mission is to serve youth 30 and younger... helping them discover purpose, build skills, and create legacy. We do this through product-based fundraising programs and student training.

We run a nonprofit almost entirely on AI agent infrastructure. Our backoffice is an Obsidian vault orchestrated by Claude Code (Anthropic's CLI-based AI coding agent), built on a three-layer architecture... Directives (what to do), Orchestration (the AI agent making decisions), and Execution (deterministic Python scripts doing the work). We build tools, we break things, we fix them... and then we write down what happened so you don't have to learn it the hard way.

This volume grew from a 35-minute outage at 11:56 PM... one agent session starting a debug server that killed another agent's production service. The kind of thing that makes you question whether running multiple agents is worth the complexity. It is. You just have to build the kitchen so the roommates can't burn it down... even when they don't know the other one's cooking.

**The name:** "Built from Broken" comes from a core belief... that brokenness isn't something to hide. It's proof of what's possible. Every solution in this series exists because something failed. We show the scars, not to complain, but because someone else is hitting the same wall right now... and the fastest way through is knowing they're not alone.

---

*Built from Broken, Vol. 4 — Published April 2026*
*Quietly Working Foundation | quietlyworking.org*
*Written by Chaplain TIG with Claude (Anthropic)*