---
title: "Claude Desktop Prompt Pack — Self-Hosted n8n on Azure"
slug: "n8n-azure-claude-prompts"
pillar: "open-playbook"
description: "*Copy-paste prompts for troubleshooting, upgrades, and operations. Designed to front-load context so Claude doesn't have to guess your setup.*"
tags: ["how-to", "n8n", "azure", "claude-desktop", "prompts"]
isHome: false
---
# Claude Desktop Prompt Pack — Self-Hosted n8n on Azure

*Copy-paste prompts for troubleshooting, upgrades, and operations. Designed to front-load context so Claude doesn't have to guess your setup.*

Companion to: [Self-Hosting n8n on Azure - The Guide I Wish Existed](../Self-Hosting%20n8n%20on%20Azure%20-%20The%20Guide%20I%20Wish%20Existed.md)

---

## How to Use This File

Each section below is a ready-to-paste Claude prompt. The pattern is always the same:

1. **What you're doing** (setup, troubleshooting, upgrading)
2. **Your environment** (OS, tools, versions)
3. **The current output** (commands + their actual results)
4. **What help you need**
5. **Guardrails** (don't run destructive commands without asking)

Fill in the bracketed `[PLACEHOLDERS]` with your actual values. The more specific your prompt, the better Claude's answer.

Open Claude Desktop → paste → let it walk you through.

---

## Setup Prompts

### First-Time Setup Walkthrough

```
I'm setting up a self-hosted n8n instance on an Azure VM following the
Quietly Working n8n-on-Azure guide. I'm at the step where I need to
[DESCRIBE WHERE YOU ARE].

My setup:
- Azure VM: Ubuntu 22.04, B2s (2 vCPU, 4 GB RAM)
- Domain: n8n.[YOURDOMAIN].com
- Using Docker Compose with Caddy + Postgres + n8n
- SSH'd into the VM as azureuser

Walk me through the next step. Tell me what command to run, what output
to expect, and what to do if it fails. Do not assume prior Linux
expertise. Ask before running anything destructive (rm, docker rm,
docker volume rm).
```

### DNS Not Resolving Yet

```
I added an A record for n8n.[YOURDOMAIN].com pointing to my Azure VM's
public IP [VM_IP]. It's been [N] minutes and I'm still getting:

$ dig +short n8n.[YOURDOMAIN].com
[PASTE OUTPUT]

$ nslookup n8n.[YOURDOMAIN].com
[PASTE OUTPUT]

DNS provider: [Cloudflare / GoDaddy / Namecheap / other]
Proxy status (if Cloudflare): [DNS only / proxied]

Help me debug. Is this propagation delay, a record misconfiguration,
or something else?
```

### Azure CLI Login Issues

```
I'm trying to log into Azure CLI from my VM to configure blob storage
for backups. I ran:

$ az login
[PASTE OUTPUT / ERROR]

The VM is Ubuntu 22.04 in Azure. My storage account is called
[STORAGE_ACCOUNT_NAME] in resource group [RESOURCE_GROUP].

Walk me through getting authenticated. I'd prefer to use the connection
string directly (avoid needing to log in from the VM at all) if that's
simpler.
```

---

## Troubleshooting Prompts

### Container Is Crashing or Restarting

```
My n8n container is [CRASHING / RESTARTING / REFUSING CONNECTIONS /
SHOWING 502].

Output of:

$ cd ~/n8n && docker compose ps
[PASTE]

$ docker compose logs n8n --tail=100
[PASTE]

$ docker compose logs n8n-postgres --tail=50
[PASTE]

$ docker compose logs caddy --tail=50
[PASTE]

Help me diagnose. Ask me for more info if you need it. Walk me through
fixes one at a time, starting with the most likely cause. Do not run
destructive commands (docker rm, docker volume rm, rm -rf) without
confirming with me first.
```

### SSL Certificate Not Issuing

```
Caddy is [FAILING TO GET A CERT / RETURNING SSL ERRORS / STUCK IN A
REDIRECT LOOP].

$ docker compose logs caddy --tail=100
[PASTE]

$ dig +short n8n.[YOURDOMAIN].com
[PASTE]

$ curl -vI https://n8n.[YOURDOMAIN].com 2>&1 | head -50
[PASTE]

Sanity checks I've already done:
- DNS points to my VM's public IP: [yes / no]
- Azure NSG allows 80 and 443 inbound: [yes / no]
- UFW allows 80 and 443: [yes / no]
- If Cloudflare: proxy status is [DNS only / proxied]

Walk through the most likely causes in order. Caddy needs port 80 to
talk to Let's Encrypt for the HTTP-01 challenge.
```

### 502 Bad Gateway

```
Visiting https://n8n.[YOURDOMAIN].com returns 502 Bad Gateway.

$ docker compose ps
[PASTE]

$ docker compose logs n8n --tail=50
[PASTE]

$ docker compose logs caddy --tail=50
[PASTE]

$ curl -v http://127.0.0.1:5678 2>&1 | head -20
[PASTE - should hit n8n directly]

Is n8n not up? Is Caddy configured to wrong upstream? Walk through.
```

### Workflow $env Access Not Working

```
Inside an n8n workflow, I'm trying to reference an env var like
$env.MY_VAR and getting an error or empty value. My .env has:

MY_VAR=some-value

Output of:

$ cat ~/n8n/.env | grep -v ENCRYPTION | grep -v PASSWORD
[PASTE - redact secrets]

$ docker exec n8n env | grep MY_VAR
[PASTE]

$ docker exec n8n env | grep N8N_BLOCK_ENV
[PASTE]

Help me fix. I know the gotcha is usually N8N_BLOCK_ENV_ACCESS_IN_NODE
needing to be explicitly set to false.
```

### Webhook Returning 404 Despite Being Published

```
I imported a workflow with a webhook node. The workflow shows as
published. But calling the webhook URL returns 404.

$ curl -v https://n8n.[YOURDOMAIN].com/webhook/[PATH]
[PASTE]

$ docker exec n8n-postgres psql -U n8n -d n8n -c "SELECT id, name, active FROM workflow_entity WHERE name = '[WORKFLOW_NAME]';"
[PASTE]

$ docker exec n8n-postgres psql -U n8n -d n8n -c "SELECT * FROM webhook_entity WHERE path = '[PATH]';"
[PASTE]

Help me debug. I know webhook nodes need UUID-style IDs and a webhookId
field to register properly.
```

---

## Operations Prompts

### Adding a New Environment Variable

```
I need to add a new environment variable [VAR_NAME=value] to my n8n
instance so I can reference it in workflows as $env.VAR_NAME.

Walk me through:
1. Editing ~/n8n/.env safely
2. Whether I need to also edit docker-compose.yml (I do if I'm using
   individual `environment:` keys, I don't if I'm using env_file)
3. Restarting with `docker compose up -d` (not `restart`, which doesn't
   pick up env changes)
4. Verifying the variable is visible inside the n8n container

My n8n docker-compose currently uses: [env_file / environment: keys]
```

### Upgrading n8n

```
My n8n is currently running version [FROM `docker exec n8n n8n --version`].
I want to upgrade to the latest.

My docker-compose.yml pins the image to:
[PASTE image: line]

Walk me through:
1. Backing up postgres first (I want a fresh dump before touching anything)
2. Pulling the new image safely (change tag or use :latest?)
3. Stopping, pulling, and restarting
4. Verifying the upgrade succeeded
5. What to do if it doesn't start (rollback procedure)

If there are breaking changes between my version and the latest, flag
them and suggest whether to jump there directly or step through
intermediate versions.
```

### Manual Backup Right Now

```
I want to take an ad-hoc backup of n8n right now (not waiting for
tonight's cron job). Walk me through:

1. Running ~/n8n/scripts/backup.sh manually
2. Verifying the file was created and uploaded to Azure Blob
3. How to verify the backup is actually restorable (without messing
   up my running n8n)

My blob container is [CONTAINER_NAME] in storage account
[STORAGE_ACCOUNT_NAME].
```

### Backup Restore Dry-Run

```
I want to verify my nightly backup is actually restorable without
affecting production. Walk me through:

1. Spinning up a throwaway Docker environment (on the same VM or on
   my laptop)
2. Downloading the latest backup from Azure Blob
3. Restoring it into the throwaway postgres
4. Running n8n against it to confirm workflows are intact
5. Cleaning up the throwaway environment

My latest backup filename pattern is: n8n_backup_YYYYMMDD_HHMMSS.sql.gz
```

### Adding Azure Blob Backups (Post-Setup)

```
I set up n8n using the setup script. Backups are configured to run
nightly, but the Azure Blob upload is commented out (no connection
string yet). I just created an Azure Storage account and a container
called [CONTAINER_NAME]. My connection string is:

[PASTE - I know you won't store it]

Walk me through:
1. Adding it to ~/n8n/.env safely
2. Testing the upload with one manual run
3. Confirming the cron job is scheduled correctly
4. Verifying the blob container has the file

Do not echo the connection string back to me in your response.
```

### Scheduling the Backup Cron Job

```
I want to schedule ~/n8n/scripts/backup.sh to run nightly at 3 AM
Pacific. My VM's timezone is [RUN `timedatectl` AND PASTE].

Walk me through:
1. Running `crontab -e` and adding the right line
2. Converting 3 AM Pacific to the right UTC time based on my VM TZ
3. Verifying the cron entry is active
4. Testing that the script runs correctly on schedule (or forcing
   a test run with `run-parts` or similar)
```

---

## Disaster Recovery Prompts

### My VM Is Down, I Need to Rebuild

```
My n8n Azure VM is [UNREACHABLE / CORRUPTED / BEING RESIZED]. I have:

- My latest backup in Azure Blob at [CONTAINER/PATH]
- My .env backed up in my password manager
- My domain and DNS still configured

Walk me through rebuilding from scratch:
1. Creating a fresh VM (same size/region, or specify different)
2. Running the setup script with my SAME domain
3. Pasting my original .env encryption key (critical!)
4. Downloading and restoring the latest backup
5. Verifying workflows are intact and credentials decrypt
6. Updating DNS if the IP changed
7. Re-pointing monitoring

Total downtime budget: [MINUTES]. Go.
```

### Postgres Database Corruption

```
My n8n-postgres container is [PANICKING / REFUSING TO START / SHOWING
CORRUPTION ERRORS IN LOGS].

$ docker compose logs n8n-postgres --tail=200
[PASTE]

I have a backup from [TIMESTAMP]. Walk me through:
1. Diagnosing whether this is filesystem corruption, disk full, or
   something recoverable in place
2. If not recoverable: safely destroying the postgres volume
3. Restoring from backup
4. Bringing n8n back up
5. Reconnecting to any external systems the workflows talk to

My encryption key is in my password manager. I have it ready.
```

### Lost My Encryption Key

```
I lost my N8N_ENCRYPTION_KEY from .env. Restoring the backup will give
me workflow structure back, but all encrypted credentials (API keys,
OAuth tokens, SSH keys) will be unrecoverable.

Walk me through:
1. Confirming I actually lost it (check password manager, backup .env,
   any scripts that might have captured it)
2. Rebuilding the credential vault from scratch
3. Which credentials I'll need to re-enter (help me inventory them)
4. Preventing this from happening again (a backup-.env-too strategy)
```

---

## Meta Prompts

### Something Weird Just Happened

```
Something weird is happening with my self-hosted n8n. Here's what I
see:

[DESCRIBE WHAT YOU SEE - be specific: URL that's broken, error message,
behavior that changed]

When did it start:
[TIMING - right after an upgrade? after a system reboot? out of nowhere?]

I've already tried:
[LIST WHAT YOU TRIED AND THE RESULT]

My setup is Ubuntu 22.04 + Docker Compose + Caddy + Postgres + n8n on
an Azure B2s VM. Ask me questions before suggesting fixes.
```

### I'm Going to Do Something Risky, Check Me

```
I'm about to [DESCRIBE THE ACTION]. My goal is [OUTCOME].

The commands I'm planning to run:

[PASTE COMMANDS]

Before I execute: review these commands and tell me:
1. Any command that could cause data loss
2. Any command that could cause downtime
3. A safer way to accomplish the same goal if one exists
4. What to check beforehand, during, and after
5. Rollback procedure if it goes wrong

This is production. Be paranoid on my behalf.
```

### Review My Configuration

```
Review my n8n production configuration for anything that's missing,
risky, or could be improved:

$ cat ~/n8n/docker-compose.yml
[PASTE]

$ cat ~/n8n/.env | sed 's/=.*/=REDACTED/'
[PASTE with secrets redacted]

$ cat ~/n8n/Caddyfile
[PASTE]

Looking for:
- Security issues (exposed ports, default passwords, missing headers)
- Reliability issues (missing healthchecks, missing restart policies)
- Gotchas specific to n8n I might have missed
- Anything that would embarrass me if a real engineer saw it

Rank findings by severity.
```

---

## Tips for Better AI Troubleshooting

1. **Paste actual output, not summaries.** "Docker said something about a network error" is useless. The raw error message is gold.

2. **Include what you already tried.** Saves both of you time. Claude won't suggest things you've ruled out.

3. **Specify your constraints.** "This is production, do not cause downtime" vs "this is a throwaway test VM" changes the answer completely.

4. **Front-load guardrails.** "Do not run destructive commands without asking" in the prompt prevents overconfident suggestions.

5. **Upgrade your model for hard problems.** Claude 4.7 (or whatever the flagship is when you read this) for architecture decisions and tricky debugging. Cheaper/faster models for routine operations.

6. **Save the prompts that work.** Next time you hit the same weird thing, you'll have a template.

---

*Maintained by [Quietly Working Universe](https://quietlyworking.org) as part of our public transparency project.*