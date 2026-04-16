---
title: "Architecture Blueprint — Mission Control Overview"
slug: "blueprint-mission-control"
pillar: "open-playbook"
description: "The full system overview of QWF's AI-powered nonprofit backoffice... 12 external integrations, 48 workflows, 7 processing subsystems, and an 8,884-file Obsidian"
publishDate: "2026-04-16"
tags: ["QWF", "QWU", "architecture", "infrastructure", "ai-agent", "transparency"]
hook: "12 integrations. 48 workflows. 7 subsystems. One Obsidian vault running a nonprofit."
isHome: false
---
# Architecture Blueprint — Mission Control Overview

This is Page 1 of 5 in the QWU Backoffice Architecture Map series... the 30,000-foot view of everything. External integrations at the top, orchestration layer in the middle, processing subsystems below, and the vault storage layer at the foundation. Every box on this map is a real system running in production.

```
╔═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╗
║                                                                                                                                                                       ║
║    ██████╗ ██╗    ██╗██╗   ██╗    ██████╗  █████╗  ██████╗██╗  ██╗ ██████╗ ███████╗███████╗██╗ ██████╗███████╗                                                        ║
║   ██╔═══██╗██║    ██║██║   ██║    ██╔══██╗██╔══██╗██╔════╝██║ ██╔╝██╔═══██╗██╔════╝██╔════╝██║██╔════╝██╔════╝                                                        ║
║   ██║   ██║██║ █╗ ██║██║   ██║    ██████╔╝███████║██║     █████╔╝ ██║   ██║█████╗  █████╗  ██║██║     █████╗                                                          ║
║   ██║▄▄ ██║██║███╗██║██║   ██║    ██╔══██╗██╔══██║██║     ██╔═██╗ ██║   ██║██╔══╝  ██╔══╝  ██║██║     ██╔══╝                                                          ║
║   ╚██████╔╝╚███╔███╔╝╚██████╔╝    ██████╔╝██║  ██║╚██████╗██║  ██╗╚██████╔╝██║     ██║     ██║╚██████╗███████╗                                                        ║
║    ╚══▀▀═╝  ╚══╝╚══╝  ╚═════╝     ╚═════╝ ╚═╝  ╚═╝ ╚═════╝╚═╝  ╚═╝ ╚═════╝ ╚═╝     ╚═╝     ╚═╝ ╚═════╝╚══════╝       ARCHITECTURE MAP · THE ENGINE ROOM · v1.3.0     ║
║                                                                                                                                                                       ║
╠═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╣
║                                                                                                                                                                       ║
║   ┌─────────────────────────────────────────────────────────────────── EXTERNAL INTEGRATIONS ───────────────────────────────────────────────────────────────────────┐ ║
║   │                                                                                                                                                                 │ ║
║   │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐   │ ║
║   │  │OPENROUTER│ │  APIFY   │ │SUITEDASH │ │ DISCORD  │ │  GOOGLE  │ │ OUTLOOK  │ │   ZOOM   │ │   n8n    │ │ INSTANTLY│ │  TWILIO  │ │  VISTA   │ │  AZURE   │   │ ║
║   │  │   LLMs   │ │ Scraping │ │   CRM    │ │   Bot    │ │ APIs (4) │ │ MS Graph │ │ Meetings │ │ Workflows│ │  Email   │ │SMS/Voice │ │  Social  │ │   VMs    │   │ ║
║   │  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘   │ ║
║   │       │            │            │            │            │            │            │            │            │            │            │            │         │ ║
║   └───────┼────────────┼────────────┼────────────┼────────────┼────────────┼────────────┼────────────┼────────────┼────────────┼────────────┼────────────┼─────────┘ ║
║           │            │            │            │            │            │            │            │            │            │            │            │           ║
║           ▼            ▼            ▼            ▼            ▼            ▼            ▼            ▼            ▼            ▼            ▼            ▼           ║
║   ┌═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════┐   ║
║   ║                                                        n8n ORCHESTRATION LAYER                                                                                ║   ║
║   ║   ═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════     ║   ║
║   ║                                              48 Workflows · Scheduled · Webhook · Event-Driven                                                                ║   ║
║   ║                                                                                                                                                               ║   ║
║   ║   [inbox-processing] [lead-generation] [email-pipeline] [meeting-intel] [content-calendar] [circle-sync] [daily-synthesis] [expert-intel] [approval-poller]  ║   ║
║   ║   [discord-dm-poll]  [discord-reply]   [gdocs-sync]     [ez-terminal]   [content-review]   [gv-monitor]   [linkedin-intel]  [youtube-sync]  [appointment]    ║   ║
║   ╚═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╝   ║
║           │            │            │            │            │            │            │                                                                              ║
║           ▼            ▼            ▼            ▼            ▼            ▼            ▼                                                                              ║
║   ┌───────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐   ║
║   │                                                           PROCESSING SUBSYSTEMS                                                                               │   ║
║   │                                                                                                                                                               │   ║
║   │   ┌─────────────────────────┐  ┌─────────────────────────┐  ┌─────────────────────────┐  ┌─────────────────────────┐  ┌─────────────────────────┐             │   ║
║   │   │      INBOX ZONE         │  │      LEAD ENGINE        │  │      EMAIL INTEL        │  │    CONTENT STUDIO       │  │     MEETING INTEL       │             │   ║
║   │   │  ─────────────────────  │  │  ─────────────────────  │  │  ─────────────────────  │  │  ─────────────────────  │  │  ─────────────────────  │             │   ║
║   │   │                         │  │                         │  │                         │  │                         │  │                         │             │   ║
║   │   │  Capture → Process →    │  │  7 Lead Sources:        │  │  Outlook Integration    │  │  QWF Creative Suite     │  │  Zoom Recordings        │             │   ║
║   │   │  Classify → Route       │  │   • LinkedIn Sales Nav  │  │  ─────────────────────  │  │  ─────────────────────  │  │  1-2-1 Meetings         │             │   ║
║   │   │  ─────────────────────  │  │   • Google Maps         │  │  process_outlook_email  │  │  Social Posts           │  │  BNI Chat Analysis      │             │   ║
║   │   │  Telegram → Inbox       │  │   • Apollo              │  │  Email Classification   │  │  Email Campaigns        │  │  ─────────────────────  │             │   ║
║   │   │  Voice Notes → Text     │  │   • Yellow Pages        │  │  Auto-Response Draft    │  │  Scripts & Copy         │  │  Morning Briefing       │             │   ║
║   │   │  Web Clips → Entities   │  │   • Yelp                │  │  Action Item Extract    │  │  Print Pieces           │  │  Meeting Prep           │             │   ║
║   │   │  ─────────────────────  │  │   • Crunchbase          │  │                         │  │  Social Graphics        │  │  Follow-up Generation   │             │   ║
║   │   │  Directives: 3          │  │   • Generic (custom)    │  │  Directives: 2          │  │  L4G Postcards          │  │                         │             │   ║
║   │   │  Scripts: 8             │  │  ─────────────────────  │  │  Scripts: 12            │  │  ─────────────────────  │  │  Directives: 6          │             │   ║
║   │   │                         │  │  8 Enrichers:           │  │                         │  │  Directives: 10         │  │  Scripts: 15            │             │   ║
║   │   │                         │  │   • Email (Anymail)     │  │                         │  │  Scripts: 18            │  │                         │             │   ║
║   │   │                         │  │   • LinkedIn URL        │  │                         │  │                         │  │                         │             │   ║
║   │   │                         │  │   • Google Reviews      │  │                         │  │                         │  │                         │             │   ║
║   │   │                         │  │   • Instagram           │  │                         │  │                         │  │                         │             │   ║
║   │   │                         │  │   • Friendly Names      │  │                         │  │                         │  │                         │             │   ║
║   │   │                         │  │   • BNI Members         │  │                         │  │                         │  │                         │             │   ║
║   │   │                         │  │  ─────────────────────  │  │                         │  │                         │  │                         │             │   ║
║   │   │                         │  │  Directives: 18         │  │                         │  │                         │  │                         │             │   ║
║   │   │                         │  │  Scripts: 35            │  │                         │  │                         │  │                         │             │   ║
║   │   └─────────────────────────┘  └─────────────────────────┘  └─────────────────────────┘  └─────────────────────────┘  └─────────────────────────┘             │   ║
║   │                                                                                                                                                               │   ║
║   │   ┌───────────────────────────────────────────────────────────────────────┐  ┌───────────────────────────────────────────────────────────────────────┐       │   ║
║   │   │                         CIRCLE SYNC                                   │  │                         EZER OMNIBUS                                  │       │   ║
║   │   │  ───────────────────────────────────────────────────────────────────  │  │  ───────────────────────────────────────────────────────────────────  │       │   ║
║   │   │                                                                       │  │                                                                       │       │   ║
║   │   │  SuiteDash CRM ←→ Obsidian Entities       5-Tier Circle System        │  │  External Gateway: SMS + Voice                (949) 373-3730          │       │   ║
║   │   │  ─────────────────────────────────────    ────────────────────────    │  │  ─────────────────────────────────────────────────────────────────    │       │   ║
║   │   │  Contact sync (bidirectional)             T5: Inner Circle (VIP)      │  │  Health Tracking    │  Calendar Queries  │  Program Inquiries        │       │   ║
║   │   │  Tag management                           T4: Champions               │  │  SMS → Parse → Route → Handle → Respond → Log                        │       │   ║
║   │   │  Custom field mapping                     T3: Engaged                 │  │  ─────────────────────────────────────────────────────────────────    │       │   ║
║   │   │  Auto-tier assignment                     T2: Known                   │  │  Directives: 2                                                        │       │   ║
║   │   │  ─────────────────────────────────────    T1: Aware                   │  │  Scripts: 4                                                           │       │   ║
║   │   │  Directives: 5     Scripts: 12                                        │  │                                                                       │       │   ║
║   │   └───────────────────────────────────────────────────────────────────────┘  └───────────────────────────────────────────────────────────────────────┘       │   ║
║   │                                                                                                                                                               │   ║
║   │   ┌───────────────────────────────────────────────────────────────────────┐  ┌───────────────────────────────────────────────────────────────────────┐       │   ║
║   │   │                      SUPERVISOR OBS (SOS)                             │  │                         FORGE INTEL                                   │       │   ║
║   │   │  ───────────────────────────────────────────────────────────────────  │  │  ───────────────────────────────────────────────────────────────────  │       │   ║
║   │   │                                                                       │  │                                                                       │       │   ║
║   │   │  5 Domain Supervisors:              Monitoring Layer:                 │  │  Relationship Intelligence:    Fundraising Fuel Lines:               │       │   ║
║   │   │   • Operations                       • Activity logging               │  │   • Contact deduplication       • ALLOY (Major Donors)               │       │   ║
║   │   │   • Lead Intelligence                • Daily digest (9 PM)            │  │   • Health scoring              • CRUCIBLE (Foundations)             │       │   ║
║   │   │   • Content Pipeline                 • Weekly report (Sun 8 PM)       │  │   • Opportunity surfacing       • EMBER (Recurring)                  │       │   ║
║   │   │   • Relationship Intel               • Token/cost tracking            │  │   • Ask coordination            • Cross-fuel detection               │       │   ║
║   │   │   • Student Programs                                                  │  │  ─────────────────────────────────────────────────────────────────    │       │   ║
║   │   │  ─────────────────────────────────────────────────────────────────    │  │  Directives: 1     Scripts: 3                                        │       │   ║
║   │   │  Directives: 1     Scripts: 8                                         │  │                                                                       │       │   ║
║   │   └───────────────────────────────────────────────────────────────────────┘  └───────────────────────────────────────────────────────────────────────┘       │   ║
║   │                                                                                                                                                               │   ║
║   └───────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘   ║
║                                                                          │                                                                                            ║
║                                                                          ▼                                                                                            ║
║   ╔═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╗   ║
║   ║                                                         VAULT STORAGE LAYER                                                                                   ║   ║
║   ║   ═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════     ║   ║
║   ║                                                  Obsidian Vault · 8,884 Files · Markdown-First                                                                ║   ║
║   ║                                                                                                                                                               ║   ║
║   ║   ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐           ║   ║
║   ║   │   000 Inbox     │  │   001 Daily     │  │  002 Projects   │  │  003 Entities   │  │  004 Knowledge  │  │ 005 Operations  │  │  100 Resources  │           ║   ║
║   ║   │  ─────────────  │  │  ─────────────  │  │  ─────────────  │  │  ─────────────  │  │  ─────────────  │  │  ─────────────  │  │  ─────────────  │           ║   ║
║   ║   │  398 files      │  │  464 files      │  │  42 files       │  │  4,248 files    │  │  79 files       │  │  121 files      │  │  1,699 files    │           ║   ║
║   ║   │  ─────────────  │  │  ─────────────  │  │  ─────────────  │  │  ─────────────  │  │  ─────────────  │  │  ─────────────  │  │  ─────────────  │           ║   ║
║   ║   │  ___Capture     │  │  Daily Notes    │  │  Active Work    │  │  People         │  │  Articles       │  │  Directives     │  │  YouTube        │           ║   ║
║   ║   │  ___Processing  │  │  Reviews        │  │  Deliverables   │  │  Organizations  │  │  Books          │  │  Execution      │  │  PDFs           │           ║   ║
║   ║   │  ___Review      │  │  Briefings      │  │  Task Tracking  │  │  Experts        │  │  Concepts       │  │  Workflows      │  │  Media          │           ║   ║
║   ║   │  ___Tasks       │  │                 │  │                 │  │  Tools          │  │  How-To         │  │  Templates      │  │  Templates      │           ║   ║
║   ║   └─────────────────┘  └─────────────────┘  └─────────────────┘  └─────────────────┘  └─────────────────┘  └─────────────────┘  └─────────────────┘           ║   ║
║   ╚═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╝   ║
║                                                                                                                                                                       ║
╠═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╣
║                                                                                                                                                                       ║
║   ┌─────────────────────────────────────────┐   ┌─────────────────────────────────────────┐   ┌─────────────────────────────────────────────────────────────────────┐ ║
║   │           SYSTEM METRICS                │   │           QUICK REFERENCE              │   │                    EMERGENCY PANEL                                   │ ║
║   │  ─────────────────────────────────────  │   │  ─────────────────────────────────────  │   │  ─────────────────────────────────────────────────────────────────  │ ║
║   │                                         │   │                                         │   │                                                                     │ ║
║   │   Directives        100                 │   │   /inbox → process_inbox.md             │   │   Inbox stuck?        → check process_inbox.md + logs              │ ║
║   │   Python Scripts    212                 │   │   /leads → generate_leads.md            │   │   Email not flowing?  → check outlook_pipeline.py                  │ ║
║   │   n8n Workflows     48                  │   │   /email → process_outlook_email.md     │   │   SuiteDash OOS?      → check circle_sync.py + API status          │ ║
║   │   API Integrations  20+                 │   │   /sync  → sync_vault_to_suitedash.md   │   │   Leads not enrich?   → check enrich_leads.md + Apify quota        │ ║
║   │   Vault Files       8,884               │   │   /meet  → process_zoom_recording.md    │   │   Discord silent?     → check webhook URLs + bot token             │ ║
║   │   Entity Records    355                 │   │   /qwf   → qwf_produce_creative_asset   │   │   n8n down?           → ssh qwu-n8n, docker compose up -d          │ ║
║   │   ─────────────────────────────────     │   │   /ezer  → ezer_omnibus.md              │   │   ─────────────────────────────────────────────────────────────    │ ║
║   │   Last Audit: 2026-01-24                │   │                                         │   │   VM: claude-dev (backoffice) | qwu-n8n (orchestration)            │ ║
║   │   Overall Health: 80%                   │   │   Logs: .tmp/logs/YYYY-MM-DD.log        │   │   Monitoring: Betterstack + Discord #system-status                 │ ║
║   │                                         │   │   Creds: .env (never commit)            │   │                                                                     │ ║
║   └─────────────────────────────────────────┘   └─────────────────────────────────────────┘   └─────────────────────────────────────────────────────────────────────┘ ║
║                                                                                                                                                                       ║
║   ┌───────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐║
║   │  LEGEND    ══ Orchestration Layer    ── Data Flow    │ Subsystem Boundary    ◆ External API    ▼ Direction    ┌─┐ Component                                      │║
║   └───────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘║
║                                                                                                                                                                       ║
║                                                    The Quietly Working Foundation · quietlyworking.org · 501(c)(3)                                                    ║
║                                                                                                                                                                       ║
╚═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╝
```

---

*Part of the QWU Backoffice Architecture Map series (5 pages). See the live interactive version at [twin.quietlyworking.org](https://twin.quietlyworking.org).*

*Quietly Working Foundation | quietlyworking.org | 501(c)(3)*