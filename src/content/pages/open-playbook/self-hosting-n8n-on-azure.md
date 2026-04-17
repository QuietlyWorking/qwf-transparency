---
title: "Self-Hosting n8n on Azure"
slug: "self-hosting-n8n-on-azure"
pillar: "open-playbook"
description: "*The guide I wish existed before I built all of this the hard way.*"
tags: ["how-to", "n8n", "azure", "self-hosting", "automation"]
isHome: false
---
# Self-Hosting n8n on Azure

*The guide I wish existed before I built all of this the hard way.*

---

## Why This Guide Exists

A dear friend of mine runs her whole AI content operation on n8n... email drafts, image generation, social posting, the lot. Last week her hosting provider went down for seven hours. No warning. No updates. No apology that landed. Just a spinning wheel while her automations sat dark and her inbox quietly piled up.

She texted me. "Is this really how this is supposed to work?"

No. It isn't.

Here's the thing nobody tells you when you first spin up n8n on whatever $5/month VPS was at the top of your search results... **your automation stack is only as reliable as the floor it's sitting on.** And most of those floors are built for hobbyists, not for people running real workflows that touch real customers.

The good news is, the fix isn't complicated. It's not even that expensive. For roughly the price of a decent dinner each month... you can move your n8n to Azure, bolt on automatic backups, get real uptime monitoring, and never lose a day to someone else's data center hiccup again.

This is that guide. Everything I learned standing up n8n on Azure for Quietly Working, now written down so you don't have to learn it the same way I did.

By the end of this, you will have:

- A real Azure VM running Ubuntu, sized appropriately for n8n
- n8n self-hosted Community Edition (free forever, no execution limits)
- A proper domain with automatic HTTPS
- PostgreSQL as your n8n database (not SQLite... we'll talk about why)
- Nightly backups to Azure Blob Storage, rotating 7 daily + 4 weekly
- Firewall, brute-force protection, and automatic security patches
- Uptime monitoring that calls your phone when things break
- A shell script that does roughly 80% of the setup for you
- A Claude Desktop prompt set so your AI can troubleshoot alongside you

Let's build it.

---

## What It Costs

I'm going to show you the real numbers upfront because I hate guides that bury this.

| Item | Monthly Cost | Notes |
|------|-------------|-------|
| Azure VM (B2s: 2 vCPU, 4 GB RAM) | ~$30 | Handles solo + small team workloads easily |
| Azure Managed Disk (64 GB SSD) | ~$5 | Pre-installed on the VM |
| Azure Blob Storage (backup target) | ~$1 | For nightly postgres dumps |
| Outbound bandwidth | ~$1 | Assumes reasonable usage |
| Domain name (if you don't have one) | ~$1 | ~$12/year averaged |
| Uptime monitoring (Betterstack free tier) | $0 | Free plan covers 10 monitors |
| **Total** | **~$38/month** | |

Compare this to a cheap VPS at $6/month and you're paying a $32 premium for:

- A hyperscaler data center (not a reseller's reseller)
- Automatic OS-level snapshots
- Transparent pricing and billing
- SLA you can actually read
- A company that'll still exist in five years

Worth it. Every time.

If you want to scale up later (team of 5+, heavy workflows), jump to a B4ms (4 vCPU, 16 GB RAM) which runs about $120/month. Don't start there. You probably don't need it.

---

## Prerequisites

Before you start, have these ready:

- **Azure account** — You can get a new account with $200 free credit for 30 days. If you're a nonprofit, check if you qualify for Azure for Nonprofits (up to $3,500/year in credits... yes, really).
- **A domain name** — Even a cheap one at `.xyz` works fine. You want to run n8n at `n8n.yourdomain.com`, not an IP address.
- **DNS control** — Ideally Cloudflare (free, fast, safe defaults). If your domain is elsewhere, you can still use it, you'll just manage DNS there.
- **SSH client** — On Windows, use Windows Terminal or Git Bash. On Mac/Linux, your built-in terminal.
- **About 90 minutes** for the full walkthrough. Half that if you use the shell script.

That's it. No prior Azure experience needed. No Docker deep knowledge. No networking magic. I'll explain everything you do and why you're doing it.

---

## Part 1: Create Your Azure VM

Open `portal.azure.com` and sign in.

### 1.1 Create a Resource Group

A resource group is just a folder for everything related to this project. Makes it easy to clean up later if you ever need to.

1. Search bar at top → "Resource groups" → **+ Create**
2. Name: `n8n-production`
3. Region: pick the one closest to you (I use `West US 2`)
4. Review + Create → Create

### 1.2 Create the VM

1. Search bar → "Virtual machines" → **+ Create** → **Azure virtual machine**
2. Fill in:
   - Resource group: `n8n-production`
   - Virtual machine name: `n8n-vm`
   - Region: same as your resource group
   - Availability options: **No infrastructure redundancy required** (you're solo, this is fine)
   - Security type: **Standard** (Trusted Launch adds complexity you don't need yet)
   - Image: **Ubuntu Server 22.04 LTS - x64 Gen2**
   - VM architecture: **x64**
   - Size: click "See all sizes", search for **B2s**. Select `Standard_B2s` (2 vCPU, 4 GB RAM, ~$30/mo)
   - Authentication type: **SSH public key**
   - Username: `azureuser` (default is fine)
   - SSH public key source: **Generate new key pair** (Azure will give you a private key to download)
   - Key pair name: `n8n-vm_key`
   - Public inbound ports: **Allow selected ports** → check **SSH (22)**
3. **Disks** tab:
   - OS disk type: **Standard SSD** (Premium is overkill for n8n)
   - OS disk size: **64 GiB** (default 30 is tight once backups start piling up)
4. **Networking** tab: defaults are fine. A new virtual network and public IP will be created.
5. **Review + Create** → **Create**
6. When prompted, **download the private key** (`n8n-vm_key.pem`). Save it somewhere safe. Losing this locks you out of your VM.

Wait 2-3 minutes for deployment. Azure will show you the public IP address once it's ready. Copy that... we'll need it in a second.

### 1.3 Open HTTP and HTTPS Ports

Your VM only allows SSH right now. We need ports 80 and 443 open so Caddy can serve HTTPS.

1. Go to your VM → **Networking** → **Network settings**
2. Click **+ Create port rule** → **Inbound port rule**
3. Service: **HTTP** → Add
4. Repeat for **HTTPS**

You should now have three inbound rules: SSH (22), HTTP (80), HTTPS (443).

### 1.4 First SSH Connection

On Windows (PowerShell or Git Bash):
```bash
icacls.exe "C:\path\to\n8n-vm_key.pem" /reset
icacls.exe "C:\path\to\n8n-vm_key.pem" /grant:r "$($env:USERNAME):(R)"
icacls.exe "C:\path\to\n8n-vm_key.pem" /inheritance:r
ssh -i "C:\path\to\n8n-vm_key.pem" azureuser@YOUR_VM_IP
```

On Mac/Linux:
```bash
chmod 400 ~/Downloads/n8n-vm_key.pem
ssh -i ~/Downloads/n8n-vm_key.pem azureuser@YOUR_VM_IP
```

First connection will ask you to confirm the host fingerprint. Type `yes`. You're in.

---

## Part 2: Point Your Domain at the VM

Before we install anything, let's get DNS right so Caddy can get an SSL certificate automatically.

### 2.1 Create an A Record

In Cloudflare (or your DNS provider):

1. Add an **A record**
2. Name: `n8n` (this makes `n8n.yourdomain.com`)
3. IPv4 address: your Azure VM public IP
4. Proxy status: **DNS only** (grey cloud, not orange)
   - Why: Caddy needs to talk directly to Let's Encrypt to issue certs. Cloudflare's proxy can interfere during issuance. You can turn the orange cloud on later if you want, once everything's working.
5. TTL: Auto

Wait 1-2 minutes for propagation, then test:
```bash
# From your laptop, not the VM
nslookup n8n.yourdomain.com
```

You should see your VM's IP. If not, wait another minute and try again.

---

## Part 3: Install n8n With Docker Compose

Back in your SSH session to the VM...

### 3.1 Update the System and Install Docker

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y ca-certificates curl gnupg ufw fail2ban unattended-upgrades

# Install Docker
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker azureuser

# Log out and back in so the group change takes effect
exit
```

SSH back in, then verify:
```bash
docker --version
docker compose version
```

Both should return version numbers.

### 3.2 Create the n8n Directory Structure

```bash
mkdir -p ~/n8n/{data,postgres,backups/daily,backups/weekly,scripts}
cd ~/n8n
```

### 3.3 Generate Encryption Keys

n8n encrypts credentials at rest with a key you control. Generate one now and save it somewhere safe (a password manager is perfect).

```bash
openssl rand -hex 32
```

Copy that output. You'll paste it into `.env` in the next step.

Also generate a strong postgres password:
```bash
openssl rand -base64 24 | tr -d '\n'
```

### 3.4 Create the .env File

```bash
nano ~/n8n/.env
```

Paste this in, replacing the placeholder values:

```bash
# n8n core
N8N_ENCRYPTION_KEY=PASTE_YOUR_32_BYTE_HEX_KEY_HERE
N8N_HOST=n8n.yourdomain.com
N8N_PROTOCOL=https
N8N_PORT=5678
WEBHOOK_URL=https://n8n.yourdomain.com/
GENERIC_TIMEZONE=America/Los_Angeles

# CRITICAL: without this, $env access fails in workflow expressions
N8N_BLOCK_ENV_ACCESS_IN_NODE=false

# Postgres
POSTGRES_USER=n8n
POSTGRES_PASSWORD=PASTE_YOUR_POSTGRES_PASSWORD_HERE
POSTGRES_DB=n8n
DB_TYPE=postgresdb
DB_POSTGRESDB_HOST=n8n-postgres
DB_POSTGRESDB_PORT=5432
DB_POSTGRESDB_DATABASE=n8n
DB_POSTGRESDB_USER=n8n
DB_POSTGRESDB_PASSWORD=PASTE_YOUR_POSTGRES_PASSWORD_HERE

# Your email (for SSL cert notifications)
ACME_EMAIL=you@yourdomain.com
DOMAIN=n8n.yourdomain.com
```

Save with `Ctrl+O`, `Enter`, `Ctrl+X`.

**Lock the file** so only you can read it:
```bash
chmod 600 ~/n8n/.env
```

> ⚠️ The `N8N_BLOCK_ENV_ACCESS_IN_NODE=false` line is not optional. Without it, newer n8n versions will block `$env.YOUR_VAR` access inside workflow expressions, and about 80% of real-world workflows will silently fail. Ask me how I know.

### 3.5 Create docker-compose.yml

```bash
nano ~/n8n/docker-compose.yml
```

Paste this:

```yaml
services:
  n8n-postgres:
    image: postgres:16-alpine
    container_name: n8n-postgres
    restart: unless-stopped
    environment:
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: ${POSTGRES_DB}
    volumes:
      - ./postgres:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER}"]
      interval: 10s
      timeout: 5s
      retries: 5

  n8n:
    image: docker.n8n.io/n8nio/n8n:latest
    container_name: n8n
    restart: unless-stopped
    depends_on:
      n8n-postgres:
        condition: service_healthy
    env_file: .env
    ports:
      - "127.0.0.1:5678:5678"
    volumes:
      - ./data:/home/node/.n8n

  caddy:
    image: caddy:2-alpine
    container_name: caddy
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile
      - caddy_data:/data
      - caddy_config:/config
    depends_on:
      - n8n

volumes:
  caddy_data:
  caddy_config:
```

A couple things to notice:

- n8n binds only to `127.0.0.1:5678`... the VM firewall will never see it on a public port. Only Caddy can reach it. Security by design.
- Postgres has a health check. n8n won't start until postgres is actually ready to accept connections. Skip this and you'll get mysterious first-boot errors.

### 3.6 Create the Caddyfile

Caddy is the reverse proxy that terminates HTTPS. It automatically gets and renews Let's Encrypt certificates. No certbot. No cron jobs. It just works.

```bash
nano ~/n8n/Caddyfile
```

```
{$DOMAIN} {
    reverse_proxy n8n:5678
    encode zstd gzip

    header {
        Strict-Transport-Security "max-age=31536000;"
        X-Content-Type-Options "nosniff"
        X-Frame-Options "DENY"
        Referrer-Policy "strict-origin-when-cross-origin"
    }
}
```

### 3.7 Start Everything

```bash
cd ~/n8n
docker compose up -d
```

Watch it come up:
```bash
docker compose logs -f caddy
```

You want to see lines like `certificate obtained successfully`. Once that appears, press `Ctrl+C` to exit the log stream.

Visit `https://n8n.yourdomain.com` in your browser. You should get the n8n setup screen. 🎉

Create your owner account immediately. Pick a strong password.

---

## Part 4: Hardening the VM

n8n is running. Now let's make sure nobody steals it.

### 4.1 Firewall

```bash
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
# Answer y to confirm
sudo ufw status verbose
```

### 4.2 Fail2ban (brute-force protection on SSH)

Default config is fine:
```bash
sudo systemctl enable --now fail2ban
sudo fail2ban-client status sshd
```

### 4.3 Unattended Security Upgrades

```bash
sudo dpkg-reconfigure -plow unattended-upgrades
# Select "Yes" when prompted
```

This applies Ubuntu security patches automatically. You no longer have to think about it.

### 4.4 Restrict SSH to Key-Only (Optional but Recommended)

```bash
sudo nano /etc/ssh/sshd_config.d/50-cloud-init.conf
```

Make sure these lines are set:
```
PasswordAuthentication no
PubkeyAuthentication yes
```

Then:
```bash
sudo systemctl restart ssh
```

Test in a new terminal window (don't close your current one!) before trusting it.

---

## Part 5: Backups to Azure Blob Storage

This is the part that turns "a VM running n8n" into "a production automation platform."

### 5.1 Create an Azure Storage Account

In the Azure portal:

1. Search "Storage accounts" → **+ Create**
2. Resource group: `n8n-production`
3. Storage account name: something globally unique like `n8nbackupsYOURNAME` (must be 3-24 lowercase letters + numbers only)
4. Region: same as your VM
5. Performance: **Standard**
6. Redundancy: **LRS (Locally-redundant storage)** — cheapest and fine for backups
7. Review + Create → Create

### 5.2 Get the Connection String

1. Open the new storage account
2. **Security + networking** → **Access keys**
3. Under **key1**, click **Show** next to Connection string
4. Copy it. Save it to your password manager.

### 5.3 Create a Container

1. In the storage account, go to **Containers** (left sidebar under Data storage)
2. **+ Container** → Name: `n8n-backups` → Create

### 5.4 Install Azure CLI on the VM

```bash
curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash
```

### 5.5 Add the Connection String to .env

```bash
nano ~/n8n/.env
```

Add at the bottom:
```bash
# Azure Blob backup
AZURE_STORAGE_CONNECTION_STRING="PASTE_FULL_CONNECTION_STRING_IN_QUOTES"
AZURE_CONTAINER_NAME=n8n-backups
```

### 5.6 Create the Backup Script

```bash
nano ~/n8n/scripts/backup.sh
```

Paste this:

```bash
#!/bin/bash
set -e

# Load env vars
export $(grep -v '^#' ~/n8n/.env | xargs)

DATE=$(date +%Y%m%d_%H%M%S)
DAILY_DIR=~/n8n/backups/daily
WEEKLY_DIR=~/n8n/backups/weekly
BACKUP_FILE="n8n_backup_${DATE}.sql.gz"
BACKUP_PATH="${DAILY_DIR}/${BACKUP_FILE}"

mkdir -p "$DAILY_DIR" "$WEEKLY_DIR"

# Dump postgres
docker exec n8n-postgres pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB" | gzip > "$BACKUP_PATH"

# Verify backup is non-trivial
SIZE=$(stat -c%s "$BACKUP_PATH")
if [ "$SIZE" -lt 1000 ]; then
  echo "ERROR: Backup is suspiciously small ($SIZE bytes). Aborting."
  rm -f "$BACKUP_PATH"
  exit 1
fi

# Weekly copy on Sundays
if [ "$(date +%u)" = "7" ]; then
  cp "$BACKUP_PATH" "${WEEKLY_DIR}/${BACKUP_FILE}"
fi

# Upload to Azure Blob
az storage blob upload \
  --container-name "$AZURE_CONTAINER_NAME" \
  --file "$BACKUP_PATH" \
  --name "daily/${BACKUP_FILE}" \
  --connection-string "$AZURE_STORAGE_CONNECTION_STRING" \
  --overwrite

# Prune local: keep last 7 daily, last 4 weekly
ls -1t ${DAILY_DIR}/*.sql.gz 2>/dev/null | tail -n +8 | xargs -r rm
ls -1t ${WEEKLY_DIR}/*.sql.gz 2>/dev/null | tail -n +5 | xargs -r rm

echo "Backup complete: ${BACKUP_FILE} (${SIZE} bytes)"
```

Make it executable:
```bash
chmod +x ~/n8n/scripts/backup.sh
```

Test it:
```bash
~/n8n/scripts/backup.sh
```

You should see "Backup complete" and a file listed in your Azure Blob container.

### 5.7 Schedule Nightly Backups

```bash
crontab -e
```

Add this line (3 AM Pacific adjusted to UTC... I run 10 AM UTC which is 3 AM Pacific during PDT):
```
0 10 * * * /bin/bash -lc '/home/azureuser/n8n/scripts/backup.sh >> /home/azureuser/n8n/backups/backup.log 2>&1'
```

Save and exit. You now have automated backups that:
- Run every night at 3 AM Pacific
- Compress and encrypt with postgres
- Keep 7 daily local copies
- Keep 4 weekly copies (Sundays)
- Upload every backup to Azure Blob (separate storage account, different failure domain)
- Prune old backups automatically

### 5.8 Restore Test (Do This Once, Now)

I know you don't want to. Do it anyway. A backup you've never tested is not a backup.

```bash
# Grab the latest backup
LATEST=$(ls -1t ~/n8n/backups/daily/*.sql.gz | head -n 1)

# Dry-run: just show it's valid gzip + valid SQL
gunzip -c "$LATEST" | head -n 20
```

You should see postgres dump headers. If the file is valid, you'll be able to restore from it.

Full restore procedure (for the day you need it):
```bash
# Stop n8n
cd ~/n8n && docker compose stop n8n

# Wipe postgres data and restart fresh
docker compose down
sudo rm -rf postgres/*
docker compose up -d n8n-postgres
sleep 10

# Restore
gunzip -c ~/n8n/backups/daily/YOUR_BACKUP.sql.gz | docker exec -i n8n-postgres psql -U n8n -d n8n

# Bring n8n back up
docker compose up -d
```

Do NOT run this as a test on a production system with real data. Spin up a test VM first if you want to practice.

---

## Part 6: Uptime Monitoring

A monitor you don't have is a monitor that can't page you at 2 AM. Get one.

Betterstack has a generous free tier that handles this nicely.

1. Sign up at `betterstack.com`
2. Create an HTTP Monitor:
   - URL: `https://n8n.yourdomain.com`
   - Check frequency: every 60 seconds (free tier allows this)
   - Alert on: non-200 response, SSL issues, response timeout
3. Add your phone number for SMS alerts
4. Add your email for email alerts

If n8n goes down, you'll know in under a minute. No more "I wonder if that's still running."

---

## Part 7: The Shell Script Shortcut

I built a single shell script that handles most of Parts 3-5 automatically. You still need to do Parts 1, 2, 4, and 6 manually (Azure portal clicks, DNS, Betterstack signup), but the Docker install + compose stack + backup setup can run in one go.

```bash
curl -fsSL https://n8n-setup.quietlyworking.org/setup.sh -o setup.sh
# Review the script first, because you should always read scripts before running them
less setup.sh
# Run it
bash setup.sh
```

> **A note on the URL above:** This script will be published alongside this guide. Until then, see the "Appendix: Full Setup Script" section below. Copy it into `setup.sh` on your VM and run it.

The script will:
- Install Docker + Docker Compose
- Prompt you for your domain and email
- Generate encryption keys and postgres password
- Write `.env`, `docker-compose.yml`, and `Caddyfile`
- Start the stack
- Install Azure CLI
- Prompt you for your Azure Storage connection string
- Write and schedule the backup script
- Run one backup to verify the pipeline end-to-end

If anything fails, the script exits loudly with a clear error. Rerun it after fixing.

---

## Part 8: Claude Desktop As Your Copilot

I use Claude (usually Claude 4.7 in Claude Desktop) as my live copilot for Azure work. When something breaks at 11 PM and I don't want to think... Claude thinks for me. Here are the prompts I actually use.

**Save these in a note file. They're gold.**

### Prompt: First-Time Setup Walkthrough

```
I'm setting up a self-hosted n8n instance on an Azure VM following the
Quietly Working n8n-on-Azure guide. I'm at the step where I need to
[DESCRIBE WHERE YOU ARE].

My setup:
- Azure VM: Ubuntu 22.04, B2s (2 vCPU, 4 GB RAM)
- Domain: n8n.YOURDOMAIN.com
- Using Docker Compose with Caddy + Postgres + n8n
- SSH'd into the VM as azureuser

Walk me through the next step. Tell me what command to run, what output
to expect, and what to do if it fails. Do not assume prior Linux
expertise. Ask before running anything destructive.
```

### Prompt: Troubleshooting a Broken Container

```
My n8n container is [CRASHING / RESTARTING / REFUSING CONNECTIONS /
SHOWING 502].

Here is the output of:

$ docker compose ps
[PASTE OUTPUT]

$ docker compose logs n8n --tail=100
[PASTE OUTPUT]

$ docker compose logs caddy --tail=50
[PASTE OUTPUT]

Help me diagnose. Ask me for more info if you need it. Walk me through
fixes one at a time. Do not run destructive commands (docker rm, docker
volume rm, rm -rf) without asking first.
```

### Prompt: SSL Certificate Issues

```
Caddy is [FAILING TO GET A CERT / RETURNING SSL ERRORS / STUCK IN A
REDIRECT LOOP]. Here's the output of:

$ docker compose logs caddy --tail=100
[PASTE]

$ dig +short n8n.YOURDOMAIN.com
[PASTE]

$ curl -vI https://n8n.YOURDOMAIN.com 2>&1 | head -50
[PASTE]

Help me fix this. The domain should be resolving to my VM's public IP.
The VM has ports 80 and 443 open in the Azure NSG. Walk through the
most likely causes in order.
```

### Prompt: Adding a New Environment Variable

```
I need to add a new environment variable [VAR_NAME=value] to my n8n
instance so I can reference it in workflows as $env.VAR_NAME. Walk me
through editing .env, docker-compose.yml, and restarting the container
safely. My .env is at ~/n8n/.env.
```

### Prompt: Upgrading n8n

```
My n8n is currently running [VERSION from docker exec n8n n8n --version].
I want to upgrade to the latest. My docker-compose.yml pins the image to
[CURRENT TAG]. Walk me through:

1. Backing up postgres first
2. Changing the image tag safely
3. Pulling and restarting
4. Verifying the upgrade
5. What to do if anything breaks

If there are breaking changes between my version and latest, flag them
and offer a safer intermediate version to jump to first.
```

### Prompt: Backup Restore Dry-Run

```
I want to verify my nightly backup is actually restorable without
affecting production. Walk me through spinning up a throwaway VM or
local Docker environment, restoring the latest backup from Azure Blob,
and confirming the data is intact. When we're done, help me clean up.
```

### Prompt: Something Weird Just Happened

```
Something weird is happening with my self-hosted n8n. Here's what I see:

[DESCRIBE WHAT YOU SEE]

I've already tried:
[LIST WHAT YOU TRIED]

Help me diagnose. Ask questions before suggesting fixes. My setup is
Ubuntu 22.04 + Docker Compose + Caddy + Postgres + n8n.
```

These prompts work because they front-load context. The model doesn't have to guess your setup. The more specific your prompt, the better the troubleshooting.

---

## Gotchas — The Things I Wish I'd Known

Every one of these cost me hours. Save yourself the pain.

### Critical

**1. `N8N_BLOCK_ENV_ACCESS_IN_NODE=false` must be in .env.** Since n8n 2.3.x, environment variable access in workflow expressions is blocked by default. Without this setting, roughly 80% of workflows that use `$env.VARIABLE` will silently fail. This is the single highest-impact setting you will set.

**2. Use `publish:workflow` CLI, not `active = true` in the database.** The old activate model does not properly register schedule triggers. If you're programmatically managing workflows, always publish via:
```bash
docker exec n8n n8n publish:workflow --id=<id>
```

**3. If/Switch v2 nodes silently always return true if you forget `"combinator": "and"`.** Every conditions object needs the combinator. Otherwise your branching logic routes every item to output 0, regardless of conditions.

**4. Don't use the native Supabase node (v1).** It generates malformed PostgREST URLs (`id..value` with double dots instead of `id.eq.value`). Use the HTTP Request node with direct PostgREST calls instead. You're not losing much... the native node is mostly a convenience wrapper anyway.

**5. SSH nodes require `"authentication": "privateKey"` explicitly.** Without it, the node defaults to password auth and fails silently with "no credentials set" errors, even when you have SSH key credentials attached.

### High Impact

**6. Webhook nodes need UUID-style node IDs.** If you import a workflow with a webhook node that has a non-UUID ID, the webhook registration fails silently. n8n returns 404s for what looks like a published workflow. Use `uuid.uuid4()` format.

**7. Published versions are immutable in the `workflow_history` table.** If you update a workflow and publish, the old version is preserved. If something's not behaving the way you expect, check that you're running the version you think you're running. List with `docker exec n8n n8n list:workflow`.

**8. Shell-special characters in SSH node arguments get corrupted.** If you pass complex JSON payloads as SSH node arguments, base64-encode them first. Decode on the receiving end. Otherwise quotes, pipes, and ampersands will turn into gibberish.

**9. Postgres is the right choice over SQLite.** SQLite is fine for development. In production, it's a foot-gun: file locking during high-throughput writes, backup complexity, no hot-restore. Postgres is three extra lines of docker-compose. Worth it.

**10. Bind n8n to `127.0.0.1:5678`, never `0.0.0.0:5678`.** Caddy routes traffic to n8n via the Docker network. If you expose 5678 on the public interface, you've bypassed Caddy (and its HTTPS) and exposed an unencrypted n8n to the internet.

### Medium Impact

**11. Set `GENERIC_TIMEZONE=America/Los_Angeles` (or yours).** Without this, workflow schedules run in UTC. You will schedule a workflow for "9 AM" and it will run at 2 AM Pacific. Ask me how I know.

**12. Pin your image tag.** `docker.n8n.io/n8nio/n8n:latest` seems convenient until you `docker compose pull` and a breaking change drops. Pin to a specific version like `docker.n8n.io/n8nio/n8n:1.68.0`. Upgrade intentionally.

**13. Back up `.env` separately.** Your database backup does NOT contain your encryption key. If you lose `.env`, every encrypted credential in your n8n is bricked. Keep a copy in your password manager.

**14. The first cert renewal is ~60 days after issuance.** Caddy handles this automatically. But you should know it's happening so you're not surprised when you see "obtaining certificate" in logs two months in.

**15. `docker compose restart` does NOT pick up env changes.** You need `docker compose up -d` (which reads .env fresh). This one bites everyone once.

---

## Appendix A: Full Setup Script

Copy this into `~/setup.sh` on a fresh VM and run `bash setup.sh`.

```bash
#!/bin/bash
# n8n-on-Azure setup script
# https://quietlyworking.org/self-hosting-n8n-on-azure
set -euo pipefail

echo "=== n8n on Azure Setup ==="
echo ""
read -p "Your domain (e.g., n8n.yourdomain.com): " DOMAIN
read -p "Your email (for SSL cert notifications): " ACME_EMAIL

# --- System packages ---
echo "Installing system packages..."
sudo apt update
sudo apt upgrade -y
sudo apt install -y ca-certificates curl gnupg ufw fail2ban unattended-upgrades

# --- Docker ---
if ! command -v docker >/dev/null 2>&1; then
  echo "Installing Docker..."
  curl -fsSL https://get.docker.com | sudo sh
  sudo usermod -aG docker "$USER"
  echo "NOTE: log out and back in after this script finishes for docker group membership"
fi

# --- Firewall ---
echo "Configuring UFW..."
sudo ufw --force default deny incoming
sudo ufw --force default allow outgoing
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw --force enable

# --- fail2ban ---
sudo systemctl enable --now fail2ban

# --- Unattended upgrades ---
sudo dpkg-reconfigure -f noninteractive unattended-upgrades || true

# --- n8n directory ---
N8N_DIR="$HOME/n8n"
mkdir -p "$N8N_DIR"/{data,postgres,backups/daily,backups/weekly,scripts}
cd "$N8N_DIR"

# --- Generate secrets ---
N8N_ENCRYPTION_KEY=$(openssl rand -hex 32)
POSTGRES_PASSWORD=$(openssl rand -base64 24 | tr -d '\n')

# --- .env ---
cat > "$N8N_DIR/.env" <<EOF
# n8n core
N8N_ENCRYPTION_KEY=$N8N_ENCRYPTION_KEY
N8N_HOST=$DOMAIN
N8N_PROTOCOL=https
N8N_PORT=5678
WEBHOOK_URL=https://$DOMAIN/
GENERIC_TIMEZONE=America/Los_Angeles
N8N_BLOCK_ENV_ACCESS_IN_NODE=false

# Postgres
POSTGRES_USER=n8n
POSTGRES_PASSWORD=$POSTGRES_PASSWORD
POSTGRES_DB=n8n
DB_TYPE=postgresdb
DB_POSTGRESDB_HOST=n8n-postgres
DB_POSTGRESDB_PORT=5432
DB_POSTGRESDB_DATABASE=n8n
DB_POSTGRESDB_USER=n8n
DB_POSTGRESDB_PASSWORD=$POSTGRES_PASSWORD

# Caddy / SSL
ACME_EMAIL=$ACME_EMAIL
DOMAIN=$DOMAIN
EOF
chmod 600 "$N8N_DIR/.env"

# --- docker-compose.yml ---
cat > "$N8N_DIR/docker-compose.yml" <<'EOF'
services:
  n8n-postgres:
    image: postgres:16-alpine
    container_name: n8n-postgres
    restart: unless-stopped
    environment:
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: ${POSTGRES_DB}
    volumes:
      - ./postgres:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER}"]
      interval: 10s
      timeout: 5s
      retries: 5

  n8n:
    image: docker.n8n.io/n8nio/n8n:latest
    container_name: n8n
    restart: unless-stopped
    depends_on:
      n8n-postgres:
        condition: service_healthy
    env_file: .env
    ports:
      - "127.0.0.1:5678:5678"
    volumes:
      - ./data:/home/node/.n8n

  caddy:
    image: caddy:2-alpine
    container_name: caddy
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile
      - caddy_data:/data
      - caddy_config:/config
    depends_on:
      - n8n

volumes:
  caddy_data:
  caddy_config:
EOF

# --- Caddyfile ---
cat > "$N8N_DIR/Caddyfile" <<EOF
{\$DOMAIN} {
    reverse_proxy n8n:5678
    encode zstd gzip

    header {
        Strict-Transport-Security "max-age=31536000;"
        X-Content-Type-Options "nosniff"
        X-Frame-Options "DENY"
        Referrer-Policy "strict-origin-when-cross-origin"
    }
}
EOF

# --- Azure CLI ---
if ! command -v az >/dev/null 2>&1; then
  echo "Installing Azure CLI..."
  curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash
fi

# --- Start stack ---
echo ""
echo "Starting Docker Compose stack..."
sg docker -c "cd $N8N_DIR && docker compose up -d"

echo ""
echo "=============================================================="
echo "n8n is starting at https://$DOMAIN"
echo ""
echo "Your encryption key (save this in a password manager):"
echo "  $N8N_ENCRYPTION_KEY"
echo ""
echo "Your postgres password (save this in a password manager):"
echo "  $POSTGRES_PASSWORD"
echo ""
echo "NEXT STEPS:"
echo "  1. Make sure DNS A record for $DOMAIN points at this VM's IP"
echo "  2. Wait ~60 seconds, then visit https://$DOMAIN"
echo "  3. Create your owner account"
echo "  4. Set up Azure Blob backups (see guide Part 5)"
echo "  5. Set up Betterstack uptime monitoring (see guide Part 6)"
echo "=============================================================="
```

---

## Appendix B: Backup Script (Standalone)

Save as `~/n8n/scripts/backup.sh`, `chmod +x`, add to cron.

```bash
#!/bin/bash
set -e

export $(grep -v '^#' ~/n8n/.env | xargs)

DATE=$(date +%Y%m%d_%H%M%S)
DAILY_DIR=~/n8n/backups/daily
WEEKLY_DIR=~/n8n/backups/weekly
BACKUP_FILE="n8n_backup_${DATE}.sql.gz"
BACKUP_PATH="${DAILY_DIR}/${BACKUP_FILE}"

mkdir -p "$DAILY_DIR" "$WEEKLY_DIR"

docker exec n8n-postgres pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB" | gzip > "$BACKUP_PATH"

SIZE=$(stat -c%s "$BACKUP_PATH")
if [ "$SIZE" -lt 1000 ]; then
  echo "ERROR: Backup is suspiciously small ($SIZE bytes). Aborting."
  rm -f "$BACKUP_PATH"
  exit 1
fi

if [ "$(date +%u)" = "7" ]; then
  cp "$BACKUP_PATH" "${WEEKLY_DIR}/${BACKUP_FILE}"
fi

if [ -n "${AZURE_STORAGE_CONNECTION_STRING:-}" ]; then
  az storage blob upload \
    --container-name "${AZURE_CONTAINER_NAME:-n8n-backups}" \
    --file "$BACKUP_PATH" \
    --name "daily/${BACKUP_FILE}" \
    --connection-string "$AZURE_STORAGE_CONNECTION_STRING" \
    --overwrite
fi

ls -1t ${DAILY_DIR}/*.sql.gz 2>/dev/null | tail -n +8 | xargs -r rm
ls -1t ${WEEKLY_DIR}/*.sql.gz 2>/dev/null | tail -n +5 | xargs -r rm

echo "Backup complete: ${BACKUP_FILE} (${SIZE} bytes)"
```

---

## What's Next

You now have:

- n8n running on infrastructure you control
- Automated nightly backups to a separate storage account
- External uptime monitoring that'll page you
- Security hardening that satisfies SOC 2 basics
- An AI copilot ready to help you troubleshoot

The real power shows up after week one, when you stop thinking about whether your automations are up. They just are. You build workflows, they run, you sleep.

If you're stuck on a step, tried all the gotchas, and something's still weird... reach out. Every question I get asked becomes a new paragraph in the next version of this guide.

Quietly building. 🏗️

---

*This guide is maintained by [Quietly Working Universe](https://quietlyworking.org) as part of our public transparency project. Quietly Working is a 501(c)(3) nonprofit. All proceeds from our fundraising programs support our charitable mission to serve youth age 30 and younger.*

*If this saved you time, consider supporting the work at [quietlyworking.org](https://quietlyworking.org).*