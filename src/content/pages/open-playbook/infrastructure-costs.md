---
title: "What It Costs To Run QWF"
slug: "infrastructure-costs"
pillar: "open-playbook"
description: "This page exists because we believe donor-partners deserve to see exactly where every dollar goes... not a polished pie chart, the actual line items."
tags: ["transparency", "infrastructure", "costs", "operations"]
isHome: false
---
# What It Costs To Run QWF

This page exists because we believe donor-partners deserve to see exactly where every dollar goes... not a polished pie chart, the actual line items.

Every figure on this page is generated automatically from the same constants file our backoffice scripts use. When infrastructure changes, this page changes. When we update a constant, an audit runs the next morning and reconciles it against the actual Azure invoice. If they disagree by more than 5%, the system raises an alert before anyone can publish a wrong number.

_Last regenerated: 2026-04-26 (Pacific). Constants verified: 2026-04-25._

---

## The Headline

- **Fixed monthly infrastructure:** $378.54
- **Variable monthly budget (LLM + scraping):** up to $400.00
- **Grand total at full variable spend:** up to $778.54/month

That funds 13 active apps, ~50 automation workflows, ~280 Python scripts, and the entire backoffice that keeps QWF running.

**Most recent month-to-date Azure spend (live):** $175.57 as of 2026-04-26.

---

## Azure (cloud compute, storage, networking)

Two virtual machines + supporting infrastructure. The big one runs the backoffice; the small one runs n8n workflow orchestration.

| Resource | Monthly Cost | What it does |
|----------|-------------:|--------------|
| claude-dev compute (D8as_v6, 8 vCPU, 32 GB) | $170.82 | Main backoffice VM... runs all Python scripts, hosts the Digital Twin API, manages the Obsidian vault that is QWF's brain |
| claude-dev disk (128 GB NVMe Premium SSD) | $27.00 | Storage for the vault, databases, and execution environment |
| qwu-n8n compute (B2s, 2 vCPU, 4 GB) | $30.00 | n8n workflow orchestration (~50 active workflows for emails, scheduling, monitoring) |
| qwu-n8n disk (Standard SSD) | $4.00 | n8n workflow + execution data |
| 2x static public IPs | $8.00 | One per VM, $4 each |
| Pre-resize rollback snapshot | $0.72 | Safety net... deletable after stability confirmed |
| **Azure subtotal** | **$240.54** | |

## Supabase (databases + auth + edge functions)

One Supabase organization on the Pro plan. 12 apps each get their own MICRO-tier project; 1 app runs on the Free tier.

| Component | Monthly Cost | What it does |
|-----------|-------------:|--------------|
| Supabase Pro org base | $25.00 | Single org covering all QWF apps |
| Included compute credit | ($10.00) | Pro plan credit (offsets one MICRO project) |
| 12 MICRO projects @ $10.00 each | $120.00 | One per app: QWR, HQ, QQT, QRP, QSP, QNT, QKN, Pocket EZ, L4G, QTR, WHL, GreenCal CC |
| **Supabase subtotal** | **$135.00** | |

## Other Fixed Infrastructure

| Service | Monthly Cost | What it does |
|---------|-------------:|--------------|
| RackNerd VPS (ESP) | $3.00 | Self-hosted email service provider on a $35/year VPS that actually works (annual: $35.49) |
| Betterstack monitoring | $0.00 | Lifetime AppSumo license... no recurring cost |
| Email (M365) | $0.00 | Included in existing M365 license |

## Variable Costs (Budgets, Not Floors)

Two things scale with use: AI model calls (LLM) and external data scraping (Apify). These are budgets we monitor daily; actual spend is usually well below.

| Bucket | Monthly Budget | What it pays for |
|--------|---------------:|------------------|
| OpenRouter (LLM API) | $300.00 | Claude + other models for content analysis, automation, research |
| Apify (web scraping) | $75.00 | Lead generation, public data collection (LinkedIn, maps, etc.) |
| **Variable budget total** | **$400.00** | |

If we hit 75% of either budget, the system pings a Discord alert. If we hit 90%, that becomes a critical alert. We have not exceeded these budgets at the monthly level.

---

## The Bottom Line

**Fixed:** $378.54/month. **Maximum if every variable budget hits 100%:** $778.54/month.

That covers every app, every automation, every dashboard, every email, every database, every monitor. No hidden line items. No marketing budget hidden in 'operations'. No executive compensation buried in 'professional services'.

If you want to see exactly which services map to which programs, see [The Tool Shed](/open-playbook/the-tool-shed/) for the full vendor-by-vendor breakdown of all 48+ tools we use.

---

## How This Number Stays Honest

Three things keep this page from drifting into marketing fiction:

1. **Single source of truth.** Every dollar figure on this page comes from `cost_constants.py` in our public-by-default backoffice. The Digital Twin, internal dashboards, audit reports, and this transparency page all read the same constants.
2. **Daily reconciliation.** A scheduled audit pulls our actual Azure spend each morning and compares it to the constants. Drift over 10% raises an alert.
3. **Monthly invoice reconciliation.** On the 8th of each month, after Azure's invoice settles, we pull the finalized total for the prior month and reconcile it against the constants with a tighter 5% threshold.

**Most recent monthly reconciliation:** 2026-03 (internal report; full backoffice is browseable on GitHub)

**Source script:** `005 Operations/Execution/generate_cost_transparency.py`
**Constants file:** `005 Operations/Execution/cost_constants.py`
**Daily audit:** `005 Operations/Execution/audit_system.py` (cron 6 AM Pacific)
**Monthly reconciliation:** `005 Operations/Execution/reconcile_azure_invoice.py` (cron 9 AM Pacific on the 8th)