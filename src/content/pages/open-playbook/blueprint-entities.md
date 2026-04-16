---
title: "Architecture Blueprint — Entity Relationships"
slug: "blueprint-entities"
pillar: "open-playbook"
description: "How QWF tracks 4,248 entities across people, organizations, and experts... from YAML frontmatter schemas to the 5-tier Circle system that governs relationship p"
publishDate: "2026-04-16"
tags: ["QWF", "QWU", "architecture", "entities", "crm", "relationships"]
hook: "4,248 entities. 5 relationship tiers. Every contact has a lifecycle."
isHome: false
---
# Architecture Blueprint — Entity Relationships

This is Page 4 of 5 in the QWU Backoffice Architecture Map series... the entity and relationship map. Three entity types (People, Organizations, Experts) live as Markdown files with structured YAML frontmatter. The 5-tier Circle system governs how relationships progress from Aware to Inner Circle, with automated promotion and demotion triggers.

```
╔═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╗
║                                                                                                                                                                       ║
║   ███████╗███╗   ██╗████████╗██╗████████╗██╗   ██╗     ██╗       ██████╗ ███████╗██╗      █████╗ ████████╗██╗ ██████╗ ███╗   ██╗███████╗██╗  ██╗██╗██████╗ ███████╗   ║
║   ██╔════╝████╗  ██║╚══██╔══╝██║╚══██╔══╝╚██╗ ██╔╝    ██╔╝       ██╔══██╗██╔════╝██║     ██╔══██╗╚══██╔══╝██║██╔═══██╗████╗  ██║██╔════╝██║  ██║██║██╔══██╗██╔════╝   ║
║   █████╗  ██╔██╗ ██║   ██║   ██║   ██║    ╚████╔╝    ██╔╝        ██████╔╝█████╗  ██║     ███████║   ██║   ██║██║   ██║██╔██╗ ██║███████╗███████║██║██████╔╝███████╗   ║
║   ██╔══╝  ██║╚██╗██║   ██║   ██║   ██║     ╚██╔╝    ██╔╝         ██╔══██╗██╔══╝  ██║     ██╔══██║   ██║   ██║██║   ██║██║╚██╗██║╚════██║██╔══██║██║██╔═══╝ ╚════██║   ║
║   ███████╗██║ ╚████║   ██║   ██║   ██║      ██║    ██╔╝          ██║  ██║███████╗███████╗██║  ██║   ██║   ██║╚██████╔╝██║ ╚████║███████║██║  ██║██║██║     ███████║   ║
║   ╚══════╝╚═╝  ╚═══╝   ╚═╝   ╚═╝   ╚═╝      ╚═╝    ╚═╝           ╚═╝  ╚═╝╚══════╝╚══════╝╚═╝  ╚═╝   ╚═╝   ╚═╝ ╚═════╝ ╚═╝  ╚═══╝╚══════╝╚═╝  ╚═╝╚═╝╚═╝     ╚══════╝   ║
║                                                                                                                                                        PAGE 4 · v1.2.0 ║
╠═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╣
║                                                                                                                                                                       ║
║   ┌─────────────────────────────────────────────────────────────────────── ENTITY TYPES ────────────────────────────────────────────────────────────────────────────┐ ║
║   │                                                                                                                                                                 │ ║
║   │   ┌─────────────────────────────────────┐         ┌─────────────────────────────────────┐         ┌─────────────────────────────────────┐                       │ ║
║   │   │              PEOPLE                 │         │          ORGANIZATIONS              │         │              EXPERTS                │                       │ ║
║   │   │  003 Entities/People/               │         │  003 Entities/Organizations/        │         │  003 Entities/Experts/              │                       │ ║
║   │   │  ─────────────────────────────────  │         │  ─────────────────────────────────  │         │  ─────────────────────────────────  │                       │ ║
║   │   │  Count: ~328 records                │         │  Count: ~27 records                 │         │  Count: ~40 records                 │                       │ ║
║   │   │  ─────────────────────────────────  │         │  ─────────────────────────────────  │         │  ─────────────────────────────────  │                       │ ║
║   │   │                                     │         │                                     │         │                                     │                       │ ║
║   │   │  YAML FRONTMATTER:                  │         │  YAML FRONTMATTER:                  │         │  YAML FRONTMATTER:                  │                       │ ║
║   │   │  ┌─────────────────────────────┐    │         │  ┌─────────────────────────────┐    │         │  ┌─────────────────────────────┐    │                       │ ║
║   │   │  │ uid: suitedash-12345       │    │         │  │ uid: org-company-name       │    │         │  │ uid: expert-name            │    │                       │ ║
║   │   │  │ full_name: "John Smith"    │    │         │  │ name: "Company Inc"         │    │         │  │ name: "Expert Name"         │    │                       │ ║
║   │   │  │ email: john@example.com    │    │         │  │ type: [company, nonprofit]  │    │         │  │ tier: [A, B, C]             │    │                       │ ║
║   │   │  │ phone: "+1-555-123-4567"   │    │         │  │ website: example.com        │    │         │  │ domain: [AI, business]      │    │                       │ ║
║   │   │  │ company: "[[Company Inc]]" │    │         │  │ industry: Technology        │    │         │  │ twitter: @handle            │    │                       │ ║
║   │   │  │ title: "CEO"               │    │         │  │ employees: 50-200           │    │         │  │ youtube: channel_id         │    │                       │ ║
║   │   │  │ circle_tier: 3             │    │         │  │ revenue: $1M-10M            │    │         │  │ last_content: 2026-01-15    │    │                       │ ║
║   │   │  │ source: [bni, linkedin]    │    │         │  │ contacts: ["[[Person]]"]    │    │         │  │ monitoring: true            │    │                       │ ║
║   │   │  │ tags: [lead, prospect]     │    │         │  │ tags: [client, partner]     │    │         │  │ wisdom_sources: [youtube]   │    │                       │ ║
║   │   │  │ suitedash_id: "SD-12345"   │    │         │  └─────────────────────────────┘    │         │  └─────────────────────────────┘    │                       │ ║
║   │   │  └─────────────────────────────┘    │         │                                     │         │                                     │                       │ ║
║   │   │                                     │         │                                     │         │                                     │                       │ ║
║   │   └─────────────────────────────────────┘         └─────────────────────────────────────┘         └─────────────────────────────────────┘                       │ ║
║   │                                                                                                                                                                 │ ║
║   └─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘ ║
║                                                                                                                                                                       ║
║   ┌─────────────────────────────────────────────────────────────────────── CIRCLE TIER SYSTEM ──────────────────────────────────────────────────────────────────────┐ ║
║   │                                                                                                                                                                 │ ║
║   │                                           RELATIONSHIP PROGRESSION (Outer → Inner)                                                                              │ ║
║   │                                                                                                                                                                 │ ║
║   │      ┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐    │ ║
║   │      │                                                                                                                                                     │    │ ║
║   │      │   ┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐   │    │ ║
║   │      │   │                                                                                                                                             │   │    │ ║
║   │      │   │   ┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐   │   │    │ ║
║   │      │   │   │                                                                                                                                     │   │   │    │ ║
║   │      │   │   │   ┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐   │   │   │    │ ║
║   │      │   │   │   │                                                                                                                             │   │   │   │    │ ║
║   │      │   │   │   │   ┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐   │   │   │   │    │ ║
║   │      │   │   │   │   │                                                                                                                     │   │   │   │   │    │ ║
║   │      │   │   │   │   │                              TIER 5: INNER CIRCLE                                                                   │   │   │   │   │    │ ║
║   │      │   │   │   │   │                              ─────────────────────                                                                  │   │   │   │   │    │ ║
║   │      │   │   │   │   │                              VIP relationships, board, close advisors                                               │   │   │   │   │    │ ║
║   │      │   │   │   │   │                              Access: Full portal, direct contact, priority                                          │   │   │   │   │    │ ║
║   │      │   │   │   │   │                              SuiteDash Tag: "Circle-T5-InnerCircle"                                                 │   │   │   │   │    │ ║
║   │      │   │   │   │   │                                                                                                                     │   │   │   │   │    │ ║
║   │      │   │   │   │   └─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘   │   │   │   │    │ ║
║   │      │   │   │   │                                                                                                                             │   │   │   │    │ ║
║   │      │   │   │   │   TIER 4: CHAMPIONS  ·  Active supporters, regular collaborators, major donors                                              │   │   │   │    │ ║
║   │      │   │   │   │   Access: Extended portal, monthly check-ins  ·  SuiteDash Tag: "Circle-T4-Champion"                                        │   │   │   │    │ ║
║   │      │   │   │   │                                                                                                                             │   │   │   │    │ ║
║   │      │   │   │   └─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘   │   │   │    │ ║
║   │      │   │   │                                                                                                                                     │   │   │    │ ║
║   │      │   │   │   TIER 3: ENGAGED  ·  Regular interaction, newsletter subscribers, event attendees, small donors                                    │   │   │    │ ║
║   │      │   │   │   Access: Basic portal, quarterly updates  ·  SuiteDash Tag: "Circle-T3-Engaged"                                                    │   │   │    │ ║
║   │      │   │   │                                                                                                                                     │   │   │    │ ║
║   │      │   │   └─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘   │   │    │ ║
║   │      │   │                                                                                                                                             │   │    │ ║
║   │      │   │   TIER 2: KNOWN  ·  Have interacted at least once, responded to outreach, LinkedIn connection                                               │   │    │ ║
║   │      │   │   Access: Public resources only  ·  SuiteDash Tag: "Circle-T2-Known"                                                                        │   │    │ ║
║   │      │   │                                                                                                                                             │   │    │ ║
║   │      │   └─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘   │    │ ║
║   │      │                                                                                                                                                     │    │ ║
║   │      │   TIER 1: AWARE  ·  In our database but no meaningful interaction yet, cold leads, scraped contacts                                                 │    │ ║
║   │      │   Access: None  ·  SuiteDash Tag: "Circle-T1-Aware"                                                                                                 │    │ ║
║   │      │                                                                                                                                                     │    │ ║
║   │      └─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘    │ ║
║   │                                                                                                                                                                 │ ║
║   │   PROMOTION TRIGGERS:  T1→T2: Reply to email, connect on LinkedIn  │  T2→T3: Attend event, subscribe, donate  │  T3→T4: Regular engagement, significant gift   │ ║
║   │   DEMOTION TRIGGERS:   No interaction for 12 months  │  Unsubscribe  │  Request removal  │  Bounced email                                                       │ ║
║   │                                                                                                                                                                 │ ║
║   └─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘ ║
║                                                                                                                                                                       ║
║   ┌─────────────────────────────────────────────────────────────────────── RELATIONSHIP LINKS ──────────────────────────────────────────────────────────────────────┐ ║
║   │                                                                                                                                                                 │ ║
║   │   WIKILINK PATTERNS (Obsidian)                              SYNC TO SUITEDASH                              RELATIONSHIP TYPES                                   │ ║
║   │   ──────────────────────────────                            ──────────────────                              ──────────────────                                   │ ║
║   │                                                                                                                                                                 │ ║
║   │   Person → Organization:                                    Person fields synced:                          work_for      Person → Organization                  │ ║
║   │   company: "[[Acme Corp]]"                                  • full_name                                    knows         Person → Person                        │ ║
║   │                                                             • email (primary)                              member_of     Person → Organization (BNI)            │ ║
║   │   Person → Person:                                          • phone                                        referred_by   Person → Person                        │ ║
║   │   referred_by: "[[Jane Doe]]"                               • company (text)                               manages       Person → Project                       │ ║
║   │   knows: ["[[Bob Smith]]", "[[Sue Lee]]"]                   • title                                        expert_on     Expert → Topic                         │ ║
║   │                                                             • circle_tier (→ tag)                          monitors      System → Expert                        │ ║
║   │   Person → Expert:                                          • source (→ tag)                               affiliated    Organization → Organization            │ ║
║   │   follows: ["[[Simon Sinek]]"]                              • tags[] (→ tags)                                                                                   │ ║
║   │                                                                                                                                                                 │ ║
║   │   Backlinks auto-discovered by Obsidian graph view          Custom fields: linkedin_url, instagram_handle  Stored in YAML frontmatter + wikilinks              │ ║
║   │                                                                                                                                                                 │ ║
║   └─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘ ║
║                                                                                                                                                                       ║
║   ┌───────────────────────────────────────────────── ENTITY LIFECYCLE ─────────────────────────────────────────────────┐  ┌──────────────────────────────────────┐   ║
║   │                                                                                                                    │  │         SYNC ARCHITECTURE           │   ║
║   │   ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐    │  │  ────────────────────────────────    │   ║
║   │   │ DISCOVER │───▶│ CAPTURE  │───▶│ ENRICH   │───▶│ RESOLVE  │───▶│  STORE   │───▶│  SYNC    │───▶│ MAINTAIN │    │  │                                      │   ║
║   │   ├──────────┤    ├──────────┤    ├──────────┤    ├──────────┤    ├──────────┤    ├──────────┤    ├──────────┤    │  │   ┌──────────────────────────────┐   │   ║
║   │   │ Lead gen │    │ Create   │    │ Add data │    │ Dedup    │    │ Vault    │    │ SuiteDash│    │ Update   │    │  │   │      OBSIDIAN VAULT          │   │   ║
║   │   │ Meeting  │    │ stub     │    │ LinkedIn │    │ Match    │    │ 003/     │    │ CRM      │    │ Circle   │    │  │   │      (Source of Truth)       │   │   ║
║   │   │ Email    │    │ file     │    │ Email    │    │ existing │    │ Entities │    │ bi-dir   │    │ tier     │    │  │   └──────────────┬───────────────┘   │   ║
║   │   │ Referral │    │ in vault │    │ Reviews  │    │ records  │    │ folder   │    │ sync     │    │ as needed│    │  │                  │                   │   ║
║   │   └──────────┘    └──────────┘    └──────────┘    └──────────┘    └──────────┘    └──────────┘    └──────────┘    │  │                  ▼                   │   ║
║   │                                                                                                                    │  │   ┌──────────────────────────────┐   │   ║
║   │   Scripts: generate_leads.py → create_entity.py → enrich_*.py → resolve_identity.py → sync_vault_to_suitedash.py   │  │   │      SUITEDASH CRM           │   │   ║
║   │                                                                                                                    │  │   │      (Client Portal)         │   │   ║
║   │   Daily sync at 6:00 AM PT  │  Bidirectional: Vault ←→ SuiteDash  │  Conflict resolution: Vault wins               │  │   └──────────────────────────────┘   │   ║
║   │                                                                                                                    │  │                                      │   ║
║   └────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘  └──────────────────────────────────────┘   ║
║                                                                                                                                                                       ║
╠═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╣
║   ENTITY COUNT: ~4,248 files  │  PEOPLE: ~280  │  ORGS: ~40  │  EXPERTS: ~40  │  TOOLS: ~3,900  │  SYNC: Daily 6AM  │  CRM: SuiteDash  │  UID: type-name  ║
╚═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╝
```

---

*Part of the QWU Backoffice Architecture Map series (5 pages). See the live interactive version at [twin.quietlyworking.org](https://twin.quietlyworking.org).*

*Quietly Working Foundation | quietlyworking.org | 501(c)(3)*