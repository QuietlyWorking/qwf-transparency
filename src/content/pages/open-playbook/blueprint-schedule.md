---
title: "Architecture Blueprint — Schedule Timeline"
slug: "blueprint-schedule"
pillar: "open-playbook"
description: "A 24-hour timeline of everything that runs automatically... 48 workflows across scheduled, webhook-triggered, polling, and manual categories, with cost optimiza"
publishDate: "2026-04-16"
tags: ["QWF", "QWU", "architecture", "scheduling", "workflows", "automation"]
hook: "48 workflows. 24 hours. Here's when everything fires and why."
isHome: false
---
# Architecture Blueprint — Schedule Timeline

This is Page 5 of 5 in the QWU Backoffice Architecture Map series... the schedule and timeline view. Every automated workflow mapped across a 24-hour clock... scheduled jobs at fixed times, recurring polls on intervals, and webhook-triggered responses that fire on demand. The cost optimization section shows when to run batch jobs for maximum savings.

```
╔═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╗
║                                                                                                                                                                       ║
║   ███████╗ ██████╗██╗  ██╗███████╗██████╗ ██╗   ██╗██╗     ███████╗     ██╗       ████████╗██╗███╗   ███╗███████╗██╗     ██╗███╗   ██╗███████╗                         ║
║   ██╔════╝██╔════╝██║  ██║██╔════╝██╔══██╗██║   ██║██║     ██╔════╝    ██╔╝       ╚══██╔══╝██║████╗ ████║██╔════╝██║     ██║████╗  ██║██╔════╝                         ║
║   ███████╗██║     ███████║█████╗  ██║  ██║██║   ██║██║     █████╗     ██╔╝           ██║   ██║██╔████╔██║█████╗  ██║     ██║██╔██╗ ██║█████╗                           ║
║   ╚════██║██║     ██╔══██║██╔══╝  ██║  ██║██║   ██║██║     ██╔══╝    ██╔╝            ██║   ██║██║╚██╔╝██║██╔══╝  ██║     ██║██║╚██╗██║██╔══╝                           ║
║   ███████║╚██████╗██║  ██║███████╗██████╔╝╚██████╔╝███████╗███████╗ ██╔╝             ██║   ██║██║ ╚═╝ ██║███████╗███████╗██║██║ ╚████║███████╗                         ║
║   ╚══════╝ ╚═════╝╚═╝  ╚═╝╚══════╝╚═════╝  ╚═════╝ ╚══════╝╚══════╝ ╚═╝              ╚═╝   ╚═╝╚═╝     ╚═╝╚══════╝╚══════╝╚═╝╚═╝  ╚═══╝╚══════╝            PAGE 5 · v1.3.0 ║
║                                                                                                                                                                       ║
╠═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╣
║                                                                                                                                                                       ║
║   ┌─────────────────────────────────────────────────────────────────────── 24-HOUR WORKFLOW TIMELINE ───────────────────────────────────────────────────────────────┐ ║
║   │                                                                                                                                                                 │ ║
║   │    12AM   1AM   2AM   3AM   4AM   5AM   6AM   7AM   8AM   9AM  10AM  11AM  12PM   1PM   2PM   3PM   4PM   5PM   6PM   7PM   8PM   9PM  10PM  11PM  12AM          │ ║
║   │     │     │     │     │     │     │     │     │     │     │     │     │     │     │     │     │     │     │     │     │     │     │     │     │     │           │ ║
║   │     ├─────┴─────┴─────┴─────┴─────┴─────┴─────┴─────┴─────┴─────┴─────┴─────┴─────┴─────┴─────┴─────┴─────┴─────┴─────┴─────┴─────┴─────┴─────┴─────┤           │ ║
║   │     │                                                                                                                                             │           │ ║
║   │     │  SCHEDULED WORKFLOWS (Fixed Times)                                                                                                          │           │ ║
║   │     │  ─────────────────────────────────                                                                                                          │           │ ║
║   │     │                         ┌───────────────┐                                                                                                   │           │ ║
║   │     │  SuiteDash Sync         │▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│  6:00 AM  vault-to-suitedash  ~5 min                                                              │           │ ║
║   │     │                         └───────────────┘                                                                                                   │           │ ║
║   │     │                               ┌─────────┐                                                                                                   │           │ ║
║   │     │  Circle Sync                  │▓▓▓▓▓▓▓▓▓│  6:30 AM  circle-sync  ~3 min                                                                     │           │ ║
║   │     │                               └─────────┘                                                                                                   │           │ ║
║   │     │                                     ┌─────────┐                                                                                             │           │ ║
║   │     │  Morning Briefing                   │▓▓▓▓▓▓▓▓▓│  7:00 AM  morning-briefing  ~2 min                                                          │           │ ║
║   │     │                                     └─────────┘                                                                                             │           │ ║
║   │     │  ┌───────────────┐                                                                                                                         │           │ ║
║   │     │  │▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│  2:00 AM  daily-synthesis-workflow  ~10 min                                                                             │           │ ║
║   │     │  └───────────────┘                                                                                                                         │           │ ║
║   │     │  Daily Synthesis                                                                                                                           │           │ ║
║   │     │                                                                                                                                             │           │ ║
║   │     │  RECURRING WORKFLOWS (Interval-Based)                                                                                                       │           │ ║
║   │     │  ────────────────────────────────────                                                                                                       │           │ ║
║   │     │     ┌─┐   ┌─┐   ┌─┐   ┌─┐   ┌─┐   ┌─┐   ┌─┐   ┌─┐   ┌─┐   ┌─┐   ┌─┐   ┌─┐   ┌─┐   ┌─┐   ┌─┐   ┌─┐   ┌─┐   ┌─┐   ┌─┐   ┌─┐   ┌─┐   ┌─┐   │           │ ║
║   │     │  E  │░│   │░│   │░│   │░│   │░│   │░│   │░│   │░│   │░│   │░│   │░│   │░│   │░│   │░│   │░│   │░│   │░│   │░│   │░│   │░│   │░│   │░│   │           │ ║
║   │     │  M  └─┘   └─┘   └─┘   └─┘   └─┘   └─┘   └─┘   └─┘   └─┘   └─┘   └─┘   └─┘   └─┘   └─┘   └─┘   └─┘   └─┘   └─┘   └─┘   └─┘   └─┘   └─┘   │           │ ║
║   │     │  A  Every 15 minutes: outlook-email-workflow (fetch + classify)                                                                             │           │ ║
║   │     │  I                                                                                                                                          │           │ ║
║   │     │  L                                                                                                                                          │           │ ║
║   │     │       ┌──┐      ┌──┐      ┌──┐      ┌──┐      ┌──┐      ┌──┐      ┌──┐      ┌──┐      ┌──┐      ┌──┐      ┌──┐      ┌──┐      ┌──┐           │           │ ║
║   │     │  I    │▒▒│      │▒▒│      │▒▒│      │▒▒│      │▒▒│      │▒▒│      │▒▒│      │▒▒│      │▒▒│      │▒▒│      │▒▒│      │▒▒│      │▒▒│           │           │ ║
║   │     │  N    └──┘      └──┘      └──┘      └──┘      └──┘      └──┘      └──┘      └──┘      └──┘      └──┘      └──┘      └──┘      └──┘           │           │ ║
║   │     │  B    Every 30 minutes: inbox-processing-workflow (capture → process → route)                                                               │           │ ║
║   │     │  O                                                                                                                                          │           │ ║
║   │     │  X                                                                                                                                          │           │ ║
║   │     │                                                                                                                                             │           │ ║
║   │     │  EVENT-DRIVEN WORKFLOWS (Webhooks)                                                                                                          │           │ ║
║   │     │  ─────────────────────────────────                                                                                                          │           │ ║
║   │     │                                                                                                                                             │           │ ║
║   │     │  W    ════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════      │           │ ║
║   │     │  E    Zoom recording completed → zoom-recording-webhook → transcribe → analyze → deliver recap                                              │           │ ║
║   │     │  B                                                                                                                                          │           │ ║
║   │     │  H    ════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════      │           │ ║
║   │     │  O    Instantly reply received → lead-response-webhook → notify Discord → update SuiteDash → create follow-up                               │           │ ║
║   │     │  O                                                                                                                                          │           │ ║
║   │     │  K    ════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════      │           │ ║
║   │     │  S    SMS received (Twilio) → ezer-omnibus → classify intent → handle → respond                                                             │           │ ║
║   │     │                                                                                                                                             │           │ ║
║   │     │       ════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════      │           │ ║
║   │     │       Discord reaction added → approval-reaction-poller → process approval → execute action                                                 │           │ ║
║   │     │                                                                                                                                             │           │ ║
║   │     ├─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤           │ ║
║   │    12AM   1AM   2AM   3AM   4AM   5AM   6AM   7AM   8AM   9AM  10AM  11AM  12PM   1PM   2PM   3PM   4PM   5PM   6PM   7PM   8PM   9PM  10PM  11PM  12AM          │ ║
║   │                                                                                                                                                                 │ ║
║   └─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘ ║
║                                                                                                                                                                       ║
║   ┌─────────────────────────────────────────────────────────────────────── WORKFLOW INVENTORY ──────────────────────────────────────────────────────────────────────┐ ║
║   │                                                                                                                                                                 │ ║
║   │   SCHEDULED (15)                          WEBHOOK-TRIGGERED (12)                          POLLING (8)                           MANUAL (5)    SUPERVISORS (8)  │ ║
║   │   ───────────────                         ──────────────────────                          ───────────                           ──────────    ────────────────  │ ║
║   │                                                                                                                                                                 │ ║
║   │   02:00  daily-synthesis-workflow        zoom-recording-webhook                          discord-dm-poller (5 min)             lead-generation-workflow        │ ║
║   │   05:00  twin-snapshot-weekly (Sun)      lead-response-webhook                           discord-reply-poller (5 min)          content-production-workflow     │ ║
║   │   06:00  vault-to-suitedash              appointment-booking-webhook                     approval-reaction-poller (1 min)      expert-research-workflow        │ ║
║   │   06:30  circle-sync-workflow            sms-inbound-webhook (Twilio)                    gv-email-monitor (15 min)             entity-enrichment-workflow      │ ║
║   │   07:00  morning-briefing                discord-dm-received                             linkedin-intelligence (1 hr)          audit-system-workflow           │ ║
║   │   09:00  n8n-version-monitor (Mon)       calendar-event-webhook                          expert-content-monitor (6 hr)                                         │ ║
║   │   21:00  sos-daily-digest                content-approval-webhook                        bni-visitor-forward (5 min)           ───────────────────────         │ ║
║   │   20:00  sos-weekly-report (Sun)         gdocs-change-webhook                                                                  operations-supervisor           │ ║
║   │   */15m  outlook-email-workflow          portal-login-webhook                                                                  lead-intel-supervisor           │ ║
║   │   */30m  inbox-processing-workflow       form-submission-webhook                                                               content-pipeline-supervisor     │ ║
║   │   */6hr  expert-intelligence             payment-received-webhook                                                              relationship-intel-supervisor   │ ║
║   │   */24hr youtube-sync-workflow           subscription-change-webhook                                                           student-programs-supervisor     │ ║
║   │                                                                                                                                                                 │ ║
║   └─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘ ║
║                                                                                                                                                                       ║
║   ┌───────────────────────────────────────────────────────── COST OPTIMIZATION WINDOWS ─────────────────────────────────────────────────────────────────────────────┐ ║
║   │                                                                                                                                                                 │ ║
║   │    12AM   1AM   2AM   3AM   4AM   5AM   6AM   7AM   8AM   9AM  10AM  11AM  12PM   1PM   2PM   3PM   4PM   5PM   6PM   7PM   8PM   9PM  10PM  11PM  12AM          │ ║
║   │     │     │     │     │     │     │     │     │     │     │     │     │     │     │     │     │     │     │     │     │     │     │     │     │     │           │ ║
║   │     │                                                                                                                                             │           │ ║
║   │     │  ┌─────────────────────────────────────────────────┐                                               ┌─────────────────────────────────────┐  │           │ ║
║   │     │  │░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░│  OFF-PEAK: Lower API costs (12AM-6AM PT)      │░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░│  │           │ ║
║   │     │  │░░░░░░░░░░ BATCH PROCESSING WINDOW ░░░░░░░░░░░░░░│  Best for: bulk enrichment, large scrapes      │░░░ BATCH PROCESSING WINDOW ░░░░░░░░│  │           │ ║
║   │     │  └─────────────────────────────────────────────────┘                                               └─────────────────────────────────────┘  │           │ ║
║   │     │                                                                                                                                             │           │ ║
║   │     │                       ┌───────────────────────────────────────────────────────────────────────────────────────────┐                         │           │ ║
║   │     │                       │▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│  PEAK HOURS (6AM-6PM PT)                │           │ ║
║   │     │                       │▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ REAL-TIME PROCESSING ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│  Priority: User-facing, time-sensitive │           │ ║
║   │     │                       └───────────────────────────────────────────────────────────────────────────────────────────┘                         │           │ ║
║   │     │                                                                                                                                             │           │ ║
║   │     │  COST TIPS:                                                                                                                                 │           │ ║
║   │     │  • Run bulk lead enrichment during off-peak (save ~15% on API costs)                                                                        │           │ ║
║   │     │  • Schedule large Apify scrapes for 2-4 AM PT                                                                                               │           │ ║
║   │     │  • Defer non-urgent Claude calls to batch windows                                                                                           │           │ ║
║   │     │  • Real-time email processing always runs (user expectation)                                                                                │           │ ║
║   │     │                                                                                                                                             │           │ ║
║   └─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘ ║
║                                                                                                                                                                       ║
╠═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╣
║   TIMEZONE: Pacific (PT/PST)  │  n8n HOST: qwu-n8n VM  │  TOTAL WORKFLOWS: 48  │  SCHEDULED: 15 │  WEBHOOK: 12  │  POLLING: 8  │  MANUAL: 5  │  SUPERVISORS: 8      ║
╚═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╝
```

---

*Part of the QWU Backoffice Architecture Map series (5 pages). See the live interactive version at [twin.quietlyworking.org](https://twin.quietlyworking.org).*

*Quietly Working Foundation | quietlyworking.org | 501(c)(3)*