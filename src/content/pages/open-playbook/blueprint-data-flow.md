---
title: "Architecture Blueprint ... Data Flow Pipelines"
slug: "blueprint-data-flow"
pillar: "open-playbook"
description: "How data moves through QWF's four core pipelines... inbox processing, lead generation, email intelligence, and meeting intelligence. Every arrow is a real scrip"
publishDate: "2026-04-16"
tags: ["QWF", "QWU", "architecture", "data-flow", "pipelines", "automation"]
hook: "Four pipelines. Inbox to insight. Every arrow is a script that actually runs."
isHome: false
---
# Architecture Blueprint ... Data Flow Pipelines

This is Page 2 of 5 in the QWU Backoffice Architecture Map series... the data flow view. Four core pipelines show how information enters the system, gets classified, enriched, and routed to the right destination. Each step names the actual script responsible.

```
╔═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╗
║                                                                                                                                                                       ║
║   ██████╗  █████╗ ████████╗ █████╗     ███████╗██╗      ██████╗ ██╗    ██╗    ██████╗ ██╗██████╗ ███████╗██╗     ██╗███╗   ██╗███████╗███████╗                        ║
║   ██╔══██╗██╔══██╗╚══██╔══╝██╔══██╗    ██╔════╝██║     ██╔═══██╗██║    ██║    ██╔══██╗██║██╔══██╗██╔════╝██║     ██║████╗  ██║██╔════╝██╔════╝                        ║
║   ██║  ██║███████║   ██║   ███████║    █████╗  ██║     ██║   ██║██║ █╗ ██║    ██████╔╝██║██████╔╝█████╗  ██║     ██║██╔██╗ ██║█████╗  ███████╗                        ║
║   ██║  ██║██╔══██║   ██║   ██╔══██║    ██╔══╝  ██║     ██║   ██║██║███╗██║    ██╔═══╝ ██║██╔═══╝ ██╔══╝  ██║     ██║██║╚██╗██║██╔══╝  ╚════██║                        ║
║   ██████╔╝██║  ██║   ██║   ██║  ██║    ██║     ███████╗╚██████╔╝╚███╔███╔╝    ██║     ██║██║     ███████╗███████╗██║██║ ╚████║███████╗███████║                        ║
║   ╚═════╝ ╚═╝  ╚═╝   ╚═╝   ╚═╝  ╚═╝    ╚═╝     ╚══════╝ ╚═════╝  ╚══╝╚══╝     ╚═╝     ╚═╝╚═╝     ╚══════╝╚══════╝╚═╝╚═╝  ╚═══╝╚══════╝╚══════╝       PAGE 2 · v1.2.0 ║
║                                                                                                                                                                       ║
╠═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╣
║                                                                                                                                                                       ║
║   ┌─────────────────────────────────────────────────────────────── INBOX PROCESSING PIPELINE ───────────────────────────────────────────────────────────────────────┐ ║
║   │                                                                                                                                                                 │ ║
║   │   ┌──────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐               │ ║
║   │   │   CAPTURE    │     │   RECEIVE    │     │   CLASSIFY   │     │   EXTRACT    │     │   RESOLVE    │     │    ROUTE     │     │    STORE     │               │ ║
║   │   │   SOURCES    │────▶│   & PARSE    │────▶│   CONTENT    │────▶│   ENTITIES   │────▶│   IDENTITY   │────▶│   CONTENT    │────▶│   & SYNC     │               │ ║
║   │   ├──────────────┤     ├──────────────┤     ├──────────────┤     ├──────────────┤     ├──────────────┤     ├──────────────┤     ├──────────────┤               │ ║
║   │   │ Telegram Bot │     │ n8n Webhook  │     │ Claude API   │     │ NER + Regex  │     │ SuiteDash    │     │ ___Tasks/    │     │ 003 Entities │               │ ║
║   │   │ Voice Notes  │     │ File Parser  │     │ 12 Categories│     │ People       │     │ Lookup       │     │ ___Review/   │     │ 001 Daily    │               │ ║
║   │   │ Web Clips    │     │ Transcribe   │     │ Confidence   │     │ Orgs         │     │ Create New   │     │ ___Log/      │     │ SuiteDash    │               │ ║
║   │   │ Screenshots  │     │ OCR Extract  │     │ Score 0-1    │     │ Dates        │     │ Link Exist   │     │ Discord      │     │ Discord Log  │               │ ║
║   │   └──────────────┘     └──────────────┘     └──────────────┘     └──────────────┘     └──────────────┘     └──────────────┘     └──────────────┘               │ ║
║   │                                                                                                                                                                 │ ║
║   │   process_inbox.md ──▶ telegram_capture.py ──▶ classify_content.py ──▶ extract_entities.py ──▶ resolve_identity.py ──▶ route_content.py ──▶ sync_to_crm.py     │ ║
║   │                                                                                                                                                                 │ ║
║   └─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘ ║
║                                                                                                                                                                       ║
║   ┌─────────────────────────────────────────────────────────────── LEAD GENERATION PIPELINE ────────────────────────────────────────────────────────────────────────┐ ║
║   │                                                                                                                                                                 │ ║
║   │   ┌─────────────────────────────────────────────────────────────┐                ┌─────────────────────────────────────────────────────────────┐               │ ║
║   │   │                     SOURCE SELECTION                        │                │                     ENRICHMENT CASCADE                       │               │ ║
║   │   │   ┌─────────────┐ ┌─────────────┐ ┌─────────────┐          │                │   ┌─────────────┐ ┌─────────────┐ ┌─────────────┐            │               │ ║
║   │   │   │ LinkedIn    │ │ Google Maps │ │   Apollo    │          │                │   │   Email     │ │  LinkedIn   │ │  Company    │            │               │ ║
║   │   │   │ Sales Nav   │ │   Local     │ │   B2B DB    │          │                │   │   Finder    │ │    URL      │ │   Name      │            │               │ ║
║   │   │   │ ~$0.10/lead │ │ ~$0.01/lead │ │ ~$0.05/lead │          │                │   │  Anymail    │ │  from Name  │ │  Cleanup    │            │               │ ║
║   │   │   └──────┬──────┘ └──────┬──────┘ └──────┬──────┘          │                │   └──────┬──────┘ └──────┬──────┘ └──────┬──────┘            │               │ ║
║   │   │          │               │               │                  │                │          │               │               │                  │               │ ║
║   │   │   ┌─────────────┐ ┌─────────────┐ ┌─────────────┐          │                │   ┌─────────────┐ ┌─────────────┐ ┌─────────────┐            │               │ ║
║   │   │   │ Yellow Pgs  │ │    Yelp     │ │ Crunchbase  │          │      ────▶     │   │   Google    │ │  Instagram  │ │    BNI      │            │               │ ║
║   │   │   │  Regional   │ │  Reviews    │ │  Startups   │          │                │   │   Reviews   │ │   Handle    │ │   Member    │            │               │ ║
║   │   │   │ ~$0.01/lead │ │ ~$0.02/lead │ │ ~$0.03/lead │          │                │   │  + Summary  │ │  + Metrics  │ │    Data     │            │               │ ║
║   │   │   └─────────────┘ └─────────────┘ └─────────────┘          │                │   └─────────────┘ └─────────────┘ └─────────────┘            │               │ ║
║   │   └─────────────────────────────────────────────────────────────┘                └─────────────────────────────────────────────────────────────┘               │ ║
║   │                              │                                                                              │                                                   │ ║
║   │                              ▼                                                                              ▼                                                   │ ║
║   │                   ┌──────────────────────┐     ┌──────────────────────┐     ┌──────────────────────┐     ┌──────────────────────┐                              │ ║
║   │                   │    DEDUPLICATE       │────▶│     VALIDATE         │────▶│    SCORE & RANK      │────▶│    EXPORT            │                              │ ║
║   │                   │    fuzzy match       │     │     email + phone    │     │    lead quality      │     │    Google Sheets     │                              │ ║
║   │                   │    merge records     │     │     domain check     │     │    0-100 score       │     │    SuiteDash CRM     │                              │ ║
║   │                   └──────────────────────┘     └──────────────────────┘     └──────────────────────┘     └──────────────────────┘                              │ ║
║   │                                                                                                                                                                 │ ║
║   │   generate_leads.md ──▶ scrape_[source].py ──▶ deduplicate_leads.py ──▶ enrich_[type].py ──▶ validate_leads.py ──▶ score_leads.py ──▶ export_to_sheets.py      │ ║
║   │                                                                                                                                                                 │ ║
║   └─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘ ║
║                                                                                                                                                                       ║
║   ┌─────────────────────────────────────────────────────────────── EMAIL INTELLIGENCE PIPELINE ─────────────────────────────────────────────────────────────────────┐ ║
║   │                                                                                                                                                                 │ ║
║   │   ┌──────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────────────────────────────────────────────────────────────────────────┐           │ ║
║   │   │   OUTLOOK    │     │    FETCH     │     │   CLASSIFY   │     │                              ACTIONS BY TYPE                                     │           │ ║
║   │   │   MAILBOX    │────▶│   via Graph  │────▶│   via Claude │────▶│   ┌────────────────┐  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐│           │ ║
║   │   ├──────────────┤     ├──────────────┤     ├──────────────┤     │   │  ACTION_REQ    │  │  FYI_ONLY      │  │  NEWSLETTER    │  │  LEAD_REPLY    ││           │ ║
║   │   │ Inbox Folder │     │ Last 24 hrs  │     │ 12 Categories│     │   │  ────────────  │  │  ────────────  │  │  ────────────  │  │  ────────────  ││           │ ║
║   │   │ 15-min poll  │     │ Unread Only  │     │ + Confidence │     │   │  Create Task   │  │  Archive       │  │  Extract Links │  │  Discord Alert ││           │ ║
║   │   │ MS Graph API │     │ Parse Body   │     │ + Summary    │     │   │  Discord Alert │  │  Log Only      │  │  Wisdom Synth  │  │  SuiteDash Tag ││           │ ║
║   │   └──────────────┘     └──────────────┘     └──────────────┘     │   │  Draft Reply   │  │                │  │  Archive       │  │  Follow-up     ││           │ ║
║   │                                                                  │   └────────────────┘  └────────────────┘  └────────────────┘  └────────────────┘│           │ ║
║   │                                                                  │   ┌────────────────┐  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐│           │ ║
║   │                                                                  │   │  MEETING_INV   │  │  RECEIPT       │  │  MARKETING     │  │  SPAM          ││           │ ║
║   │                                                                  │   │  ────────────  │  │  ────────────  │  │  ────────────  │  │  ────────────  ││           │ ║
║   │                                                                  │   │  Cal Extract   │  │  Log Amount    │  │  Unsubscribe?  │  │  Block+Delete  ││           │ ║
║   │                                                                  │   │  Prep Briefing │  │  Expense Track │  │  Archive       │  │  Report        ││           │ ║
║   │                                                                  │   └────────────────┘  └────────────────┘  └────────────────┘  └────────────────┘│           │ ║
║   │                                                                  └──────────────────────────────────────────────────────────────────────────────────┘           │ ║
║   │                                                                                                                                                                 │ ║
║   │   process_outlook_email.md ──▶ outlook_pipeline.py ──▶ classify_email.py ──▶ [action_handler].py ──▶ update_crm.py ──▶ send_notifications.py                   │ ║
║   │                                                                                                                                                                 │ ║
║   └─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘ ║
║                                                                                                                                                                       ║
║   ┌─────────────────────────────────────────────────────────────── MEETING INTELLIGENCE PIPELINE ───────────────────────────────────────────────────────────────────┐ ║
║   │                                                                                                                                                                 │ ║
║   │   ┌──────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐               │ ║
║   │   │    ZOOM      │     │   WEBHOOK    │     │  DOWNLOAD    │     │  TRANSCRIBE  │     │   ANALYZE    │     │   EXTRACT    │     │   DELIVER    │               │ ║
║   │   │  RECORDING   │────▶│   TRIGGER    │────▶│   MEDIA      │────▶│   AUDIO      │────▶│   via Claude │────▶│   OUTPUTS    │────▶│   RESULTS    │               │ ║
║   │   ├──────────────┤     ├──────────────┤     ├──────────────┤     ├──────────────┤     ├──────────────┤     ├──────────────┤     ├──────────────┤               │ ║
║   │   │ Auto-record  │     │ n8n catches  │     │ MP4 + M4A    │     │ Whisper API  │     │ Meeting Type │     │ Action Items │     │ 001 Daily/   │               │ ║
║   │   │ Cloud save   │     │ recording.   │     │ to .tmp/     │     │ or Deepgram  │     │ Detection    │     │ Decisions    │     │ Discord      │               │ ║
║   │   │ complete evt │     │ completed    │     │ 24hr retain  │     │ Speaker ID   │     │ Key Topics   │     │ Follow-ups   │     │ Email Recap  │               │ ║
║   │   └──────────────┘     └──────────────┘     └──────────────┘     └──────────────┘     └──────────────┘     └──────────────┘     └──────────────┘               │ ║
║   │                                                                                                                                                                 │ ║
║   │   process_zoom_recording.md ──▶ zoom_webhook_handler.py ──▶ download_recording.py ──▶ transcribe.py ──▶ analyze_meeting.py ──▶ generate_recap.py               │ ║
║   │                                                                                                                                                                 │ ║
║   └─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘ ║
║                                                                                                                                                                       ║
╠═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╣
║   LEGEND    ─────▶ Data Flow    ┌───┐ Processing Step    [script.py] Execution    ~$X.XX Estimated Cost per Operation                                                 ║
╚═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╝
```

---

*Part of the QWU Backoffice Architecture Map series (5 pages). See the live interactive version at [twin.quietlyworking.org](https://twin.quietlyworking.org).*

*Quietly Working Foundation | quietlyworking.org | 501(c)(3)*