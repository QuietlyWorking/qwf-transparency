---
title: "QWU Backoffice Content Intelligence System"
slug: "content-intelligence-architecture"
pillar: "built-from-broken"
description: "**Last Updated:** 2026-04-07"
publishDate: "2026-04-06"
modifiedDate: "2026-04-07"
tags: ["content-pipeline", "automation", "ai", "architecture", "transparency"]
isHome: false
---
# QWU Backoffice Content Intelligence System
## A Complete Architecture for AI-Powered Content Creation, Distribution, and Institutional Knowledge

**Version:** 1.1.0
**Last Updated:** 2026-04-07
**Published by:** Quietly Working Foundation (QWF) — [quietlyworking.org](https://quietlyworking.org)
**Part of:** [QWU Public Transparency Project](https://github.com/QuietlyWorking)

---

## Who This Document Is For

You're an AI automation developer. You're comfortable in terminal. You use Claude (Desktop or Code) regularly and you've built workflows with it. You may not write code from scratch, but you can read it, modify it, and prompt Claude to generate it. You've probably heard of "vibe coding."

This document gives you the complete architecture of a content intelligence system that:

- Watches YouTube videos using Google Gemini's multimodal capabilities
- Extracts transcripts, articles, social snippets, key quotes, intelligence notes, and verified visual frames
- Indexes classified wisdom into a searchable database (8,071 entries and growing)
- Routes content across 7 nonprofit programs with audience-specific "Big Why" statements
- Adapts content into 3 distinct brand voices across 5 social platforms
- Presents everything to a human in a Command Center for approval
- Automatically distributes 15-25 adapted posts over 3-5 days via Vista Social
- Tracks what was posted where and when

Every component is documented with enough detail that you can hand a section to your own Claude instance and say: "Help me implement this pattern for my use case."

We built this at QWF — the Quietly Working Foundation, a 501(c)(3) nonprofit that runs 7 fundraising programs. We're publishing it because our mission is to help others, and this system has proven valuable enough that other developers have asked how it works. So here it is. All of it.

---

## Table of Contents

1. [Why We Built This](#why-we-built-this)
2. [The 30-Second Overview](#the-30-second-overview)
3. [The 3-Layer Architecture — The Foundation Everything Runs On](#the-3-layer-architecture)
4. [The Full Pipeline — Stage by Stage](#the-full-pipeline)
   - [Stage 1: The Wisdom Library — Institutional Knowledge That Compounds](#stage-1-the-wisdom-library)
   - [Stage 2: Video Processing — Gemini Watches, Claude Analyzes](#stage-2-video-processing)
   - [Stage 3: Frame Extraction — Gemini Sees, ffmpeg Captures, Gemini Vision Verifies](#stage-3-frame-extraction)
   - [Stage 4: Article Building — 10 Enhancements for WordPress](#stage-4-article-building)
   - [Stage 5: Content Atoms — Decomposition for Scale](#stage-5-content-atoms)
   - [Stage 6: Program Routing — The Big Why Engine](#stage-6-program-routing)
   - [Stage 7: Voice Adaptation — Same Idea, Different Personality](#stage-7-voice-adaptation)
   - [Stage 8: Human-in-the-Loop — The HQ Command Center](#stage-8-human-in-the-loop)
   - [Stage 9: Automated Distribution — Vista Social at Scale](#stage-9-automated-distribution)
   - [Stage 10: Tracking and the Feedback Loop](#stage-10-tracking)
5. [The Content Calendar — Scheduled Publishing](#the-content-calendar)
6. [Social Post Quality Gates — Voice Integrity at Scale](#social-post-quality-gates)
7. [The Feeder Network — How the Wisdom Library Gets Fed](#the-feeder-network)
8. [Tool Wisdom Libraries — Deep Dive](#tool-wisdom-libraries)
9. [The Model Strategy — Quality First](#the-model-strategy)
10. [Our QWU Toolstack — What We Use and Why](#our-toolstack)
11. [Gotchas, Learnings, and Things That Bit Us](#gotchas-and-learnings)
12. [Decision Tree — What Do You Actually Need?](#decision-tree)
13. [Implementation Recipes — Copy-Paste to Claude](#implementation-recipes)
14. [Cost Reality Check](#cost-reality-check)
15. [Script Inventory](#script-inventory)

---

## Why We Built This

The Quietly Working Foundation runs 7 fundraising programs, each serving a different audience:

| Program | Code | Audience | Voice |
|---------|------|----------|-------|
| Quietly Working Foundation | QWF | Broad — youth empowerment supporters | TIG Standard (quiet strength) |
| The Missing Pixel Project | MP | Underserved youth discovering creative careers + creative industry mentors | TIG Standard (student focus) |
| War on Hopelessness | WOH | Adversity survivors, empowerment community | WOH Combat (loud, defiant) |
| Locals 4 Good | L4G | Local business owners | L4G B2B (professional confidence) |
| International Youth Service Registry | IYSR | Youth-serving organizations | TIG Standard (partnership focus) |
| Quietly Working Creative | QWC | Creative professionals | TIG Standard (creative angle) |
| America's Children of Fallen Heroes | ACOFH | Children of fallen military and first responders | Reverent (extreme sensitivity) |

That's 7 audiences, 25+ social profiles, 5 platforms (Instagram, Twitter/X, LinkedIn, Facebook, TikTok), and 3 distinct brand voices.

Our founder, Chaplain TIG, creates content daily — primarily through curating and analyzing YouTube videos from experts across technology, creativity, business, and leadership. Before this system, sharing one video with all programs meant manually rewriting the same idea 15-20 different ways. The result was predictable: 2-3 posts per video, inconsistent voice, forgotten channels, no tracking, and massive waste of the insights contained in every video.

**The vision (from Grace Andrews, former Brand Director of Diary of a CEO):**

> "You are a media business that happens to sell products."

We took that literally. Every QWF program needed to become a media voice with its own audience relationship. Content needed to flow from creation through intelligent routing, with each program speaking to its audience about the right topics in the right voice.

**The result:** One video now produces 15-25 audience-specific social posts, a richly enhanced WordPress article on chaplaintig.com, classified wisdom entries that make future content smarter, and a human reviews all of it in one place before anything goes live.

---

## The 30-Second Overview

```
YouTube Video
     │
     ▼
[GEMINI] Watches entire video (multimodal — sees visuals + hears audio)
     │
     ▼
[CLAUDE OPUS] Analyzes transcript → article.md, social.md, quotes.md, intel.md
     │
     ▼
[GEMINI + FFMPEG] Identifies key visual moments → extracts frames → Gemini Vision verifies each frame
     │
     ▼
[WISDOM INDEXER] Extracts classified insights → wisdom.db (8,071+ entries, 1,187 experts, 208 tools)
     ���
     ▼
[ARTICLE BUILDER] Generates WordPress article with 10 enhancements (chapters, takeaways, constellation map, echoes, wiki links, SEO VideoObject, etc.)
     │
     ▼
[CONTENT ROUTER] Decomposes into atoms → scores against 7 programs → generates Big Why statements
     │
     ▼
[VOICE ADAPTER] Creates platform-specific posts in 3 voice profiles (TIG Standard, WOH Combat, L4G B2B)
     │
     ▼
[HQ COMMAND CENTER] Human reviews everything — content, routing, posts — approves/edits/rejects
     │
     ▼
[VISTA SOCIAL API] Schedules 15-25 posts across programs, spread over 3-5 days
     │
     ▼
[TRACKING] Distribution log + HQ Supabase records + Discord transparency notifications
```

**The human touches the pipeline exactly once — at the HQ approval stage.** Everything before is automated preparation. Everything after is automated execution.

---

## The 3-Layer Architecture

This is the foundation of the QWU Backoffice. It's not specific to content — it's a general pattern for making AI automation reliable. Every system we build follows this structure.

### Why AI Alone Isn't Enough

LLMs are probabilistic. They're brilliant at judgment, analysis, and creative synthesis. They're terrible at consistency across multi-step operations. If Claude handles an 8-step pipeline entirely in conversation:

- 90% accuracy per step
- 8 steps: 0.9^8 = **43% overall success rate**

You don't notice failures immediately. They compound silently until something visibly breaks. A misclassified wisdom entry leads to a bad routing decision which leads to an irrelevant post on the wrong program's social feed.

### The Fix: Separate What AI Is Good At from What Code Is Good At

```
┌─────────────────────────────────────────────────────┐
│  LAYER 1: DIRECTIVES (What to do)                   │
│                                                      │
│  Markdown files in 005 Operations/Directives/        │
│  Define: goals, inputs, tools, steps, outputs,       │
│  edge cases. Written in natural language.             │
│  These are institutional memory.                     │
│                                                      │
│  Example: content_distribution.md                    │
│  Example: video_frame_extraction.md                  │
│  Example: tool_wisdom_library_standard.md            │
└────────────────────────┬───────��────────────────────┘
                         │ reads
┌────────────────────────▼────────────��───────────────┐
│  LAYER 2: ORCHESTRATION (Decision making)            │
│                                                      │
│  This is Claude (via Claude Code on our VM).         │
│  Reads directives. Calls scripts in the right order. │
│  Handles errors. Asks for clarification.             │
│  Updates directives with learnings.                  │
│  The AI is GLUE between intent and execution.        │
└────────────────────────┬────────────────────────────┘
                         │ calls
┌────────────────────────▼────────────────────────────┐
│  LAYER 3: EXECUTION (Doing the work)                 │
���                                                      │
│  Python scripts in 005 Operations/Execution/         │
│  Deterministic. Testable. Fast.                      │
│  Take inputs → return {success, data, error}         │
│  Handle API calls, data processing, file operations. │
│                                                      │
│  Example: process_video_content.py                   │
│  Example: route_content_programs.py                  │
│  Example: distribute_content_social.py               │
└─────────────────────────────────────────────────────┘
```

**The self-annealing loop:** When something breaks, the AI:
1. Reads the error message and stack trace
2. Diagnoses root cause (not just symptoms)
3. Fixes the script
4. Tests it again
5. Updates the directive with what was learned
6. The system is now stronger than before

Every failure makes the system more robust. Our directives are living documents — their changelogs read like a history of everything we've learned the hard way.

### What This Looks Like on Disk (QWU Backoffice)

```
qwu_backOffice/
├── 000 Inbox/
│   ├── ___Content/           # Video processing outputs (per-UID folders)
│   └── ___Approved/          # Approved content ready for publish
├── 003 Entities/
│   ├─��� Experts/              # Expert profiles (1,187 individuals)
���   ├── Tools/                # Tool entity profiles (TWL Layer 1)
│   └─�� Taxonomies/           # Category signals, playlist mappings
├���─ 004 Knowledge/
│   └── Captures/             # Wisdom capture documents
├── 005 Operations/
│   ├── Directives/           # Layer 1: SOPs in Markdown
│   ├── Execution/            # Layer 3: Python scripts
│   └── Data/                 # Persistent databases (wisdom.db, etc.)
└── .claude/
    └── skills/
        ├── qwf-programs/     # Program definitions
        └── qwf-brand-voice/  # Voice profile definitions
```

> **Implementation Recipe: 3-Layer Architecture**
>
> *Paste this into your Claude instance along with your use case description:*
>
> "I want to set up a 3-layer architecture for AI-assisted automation. Layer 1: Markdown directive files that define what to do (goals, inputs, steps, outputs, edge cases). Layer 2: You (Claude) as the orchestrator — read directives, call scripts, handle errors, update directives with learnings. Layer 3: Python scripts that take inputs and return `{success: bool, data: any, error: str|null}`. My use case is: [DESCRIBE]. Create the folder structure, a template directive, and a template execution script."

---

## The Full Pipeline — Stage by Stage

### Stage 1: The Wisdom Library — Institutional Knowledge That Compounds

Before content creation comes knowledge accumulation. The Wisdom Library is a searchable SQLite database of classified insights extracted from every piece of content that flows through the system.

**Current scale:**
- **8,071** total wisdom entries
- **1,187** unique experts contributing insights
- **208** tools tagged with specific wisdom
- **5,396** tool-tag associations (entries often reference multiple tools)

**What makes it different from bookmarks or notes:**

| Bookmarks/Notes | Wisdom Library |
|----------------|---------------|
| "Saved this video about Supabase" | 12 discrete insights extracted, each classified by topic, tool (with version), industry vertical, authority level |
| Finding something: scroll and hope | `SELECT * FROM wisdom WHERE tool='Supabase' AND authority_level='vendor_official' AND is_actionable=1` |
| No context after 2 weeks | Full provenance: expert name, source URL, source date, timestamp in video, content folder |
| Static once saved | Evolving: new entries daily, stale entries flagged, superseded entries linked to replacements |

**The database schema:**

```sql
-- Core wisdom entries
wisdom (
    id TEXT PRIMARY KEY,          -- Unique hash
    insight TEXT NOT NULL,         -- The actual knowledge nugget
    context TEXT,                  -- Surrounding information
    expert_name TEXT NOT NULL,     -- Who said it
    expert_id TEXT,                -- Link to 003 Entities/Experts/
    source_url TEXT,               -- YouTube URL, article URL, etc.
    source_title TEXT,             -- Video/article title
    source_date DATE,              -- When the source was published
    indexed_date DATETIME,         -- When we captured it
    insight_type TEXT,             -- observation, technique, opinion, fact, prediction
    tone TEXT,                     -- analytical, passionate, cautionary, etc.
    content_folder TEXT,           -- Trace back to source material
    timestamp_start TEXT,          -- For video deep-links (e.g., "14:32")
    authority_level TEXT,          -- vendor_official / self_discovered / expert_validated / community
    is_actionable INTEGER,         -- Can you DO something with this insight?
    superseded_by TEXT,            -- Link to newer insight that replaces this one
    usage_count INTEGER            -- How many times this insight has been referenced
)

-- Multi-dimensional classification (many-to-many relationships)
wisdom_verticals  (wisdom_id, vertical, relevance_score)   -- Which industries?
wisdom_topics     (wisdom_id, topic)                        -- What subjects?
wisdom_concerns   (wisdom_id, concern)                      -- What problems?
wisdom_tools      (wisdom_id, tool_name, tool_version)      -- Which tools?
```

**Authority levels and weights:**

Not all knowledge is equal. A tip from Supabase's official blog carries more weight than a Reddit comment:

| Level | Weight | Example |
|-------|--------|---------|
| vendor_official | 1.0 | Supabase blog post about a new feature |
| self_discovered | 0.9 | Something we found through our own testing |
| expert_validated | 0.8 | Technique demonstrated by a recognized expert on YouTube |
| community | 0.5 | Stack Overflow answer, forum discussion |

**Content sources that feed the library:**

| Source Type | Script Function | What Gets Extracted |
|------------|----------------|-------------------|
| YouTube videos | `index_content_folder()` | Quotes with timestamps, insights, tool references, speaker attribution |
| Tweet threads | `index_tweets()` | Individual tweet insights, thread context |
| Newsletters | `index_newsletter()` | Key takeaways, tool announcements, expert opinions |
| Web articles | `index_web_article()` | Article insights with tool tagging |
| LinkedIn posts | `index_linkedin_posts()` | Professional insights, industry observations |

The indexer (`wisdom_indexer.py` v1.9.0) uses Claude Opus for classification. Why the most expensive model? Because misclassified wisdom compounds into bad recommendations downstream. The marginal cost difference is dollars; the quality difference is the entire system's reliability.

**Speaker attribution — a hard-won lesson:**

Early versions assigned all quotes from a video to the channel owner. But many videos feature interviews or multiple speakers. Version 1.9.0 added per-quote speaker attribution: the indexer parses `quotes.md` for attribution markers, cross-references with `_metadata.json` for channel/expert mapping, and sets authority levels per speaker. A vendor CEO's statement about their own product gets `vendor_official` weight; a commentator's observation gets `expert_validated`.

**Wisdom decay:**

Knowledge about rapidly evolving tools goes stale fast. The system tracks this:
- **Under 3 months:** Full weight
- **3-6 months:** Review flag
- **6-12 months:** Stale flag
- **Over 12 months:** Marked as potentially superseded

For stable tools (e.g., ffmpeg, SQLite), the decay timeline is much longer.

> **Implementation Recipe: Wisdom Library**
>
> "I want to build a wisdom library — a SQLite database that stores classified insights from content I consume. Each entry needs: insight text, expert name, source URL/title/date, topics (many-to-many), tools referenced (many-to-many with version), authority level (official/expert/community/self), actionability flag, and a timestamp for video deep-links. I need: (1) the SQLite schema, (2) a Python indexing script that uses Claude to extract and classify insights from text, (3) a query utility for filtering. My main content sources are: [LIST YOURS]."

---

### Stage 2: Video Processing �� Gemini Watches, Claude Analyzes

This is where raw YouTube videos become structured content assets.

**Script:** `process_video_content.py` (v2.5.0)

**Why two AI models?** Each does what it's best at:
- **Google Gemini** (multimodal): Can literally "watch" a video — processing both the audio AND visual track simultaneously. No other model does this at the same quality. It handles transcription with visual context awareness.
- **Claude Opus** (flagship): Takes the transcript and generates the actual content — article drafts, social snippets, intelligence analysis. Claude's writing quality and analytical depth are superior for these tasks.

**The processing pipeline, step by step:**

**Step 1: Ground Truth Metadata (YouTube Data API v3)**

Before any AI touches the video, we fetch verified metadata from YouTube's API:
- Actual title (not what Gemini might hallucinate)
- Channel name and ID (for attribution)
- Publish date
- Duration
- Description

This is stored in `_metadata.json` as ground truth. **This step exists because of a painful lesson** (see Gotchas section): Gemini occasionally hallucinated video attribution, crediting quotes to the wrong person.

**Step 2: Gemini Multimodal Transcription**

Gemini receives the full video file and produces:
- Complete transcript with timestamps
- Key visual moments (timestamps where informational content appears on screen — charts, diagrams, UI demonstrations)
- Content summary
- Speaker identification (for multi-speaker videos)

Gemini model chain with fallbacks: Gemini 3.1 Pro → 2.5 Pro → 2.5 Flash → 2.0 Flash. If the newest model has an issue, it cascades to the next.

**Step 3: Claude Opus Content Generation**

Claude receives the transcript and ground truth metadata, then generates five output files:

| File | Purpose | What Claude Produces |
|------|---------|---------------------|
| `article.md` | Long-form article draft | 1,500-3,000 word article with headers, wiki links, and frontmatter |
| `social.md` | Social media snippets | Platform-aware posts (Instagram, Twitter, LinkedIn, Facebook) |
| `quotes.md` | Key quotes | 5-8 timestamped quotes with speaker attribution |
| `intel.md` | Internal intelligence | Observations not suitable for publishing — analysis, opportunities, competitive notes |
| `_metadata.json` | Structured metadata | Topics, categories, visual richness assessment, expert mappings |

**Step 4: Visual Richness Assessment**

Claude analyzes the transcript and determines a `visual_richness` score:
- **high:** Video contains charts, diagrams, UI demos, comparisons (worth extracting many frames)
- **low:** Some visual content mixed with talking head (extract selectively)
- **none:** Pure talking head (skip frame extraction, use YouTube thumbnails)

This assessment gates Stage 3 (Frame Extraction) — no point downloading a 2-hour podcast just to capture frames of two people sitting in chairs.

**Step 5: Wisdom Indexing**

If auto-indexing is enabled (and it usually is), the wisdom indexer runs immediately after content generation. Insights from `quotes.md` and `intel.md` are extracted, classified, and stored in `wisdom.db`. This means the wisdom library grows with every video processed.

**Output structure for a single video:**

```
000 Inbox/___Content/20260406-143022/
├── article.md            # Long-form article draft
├── social.md             # Social snippets per platform
├��─ quotes.md             # Key quotes with timestamps + speaker attribution
├── intel.md              # Internal intelligence notes
├── transcript.md         # Full transcript
├── _metadata.json        # Structured metadata + ground truth
└── frames/               # (Created in Stage 3)
    ├── frame_02m15s.png  # A-classified: verified informational
    ├── frame_08m42s.png  # A-classified: chart comparison
    └── rejected/
        └── frame_05m30s.png  # Filtered: talking head
```

**Daily orchestration:**

The `tig_video_pipeline_orchestrator.py` (v1.5.0) runs on a cron schedule and:
1. Checks monitored YouTube playlists for new videos (via YouTube Data API)
2. Skips already-processed videos (tracked in a JSON manifest)
3. Runs the full pipeline on each new video
4. Creates WordPress draft posts on chaplaintig.com
5. Inserts approval requests into the HQ Command Center (via Supabase)
6. Sends a Discord notification for transparency (read-only — not for commands)

Processing volume: 20-40+ videos per day.

> **Implementation Recipe: Video Processing**
>
> "I want to build a video-to-content pipeline. Given a YouTube URL: (1) fetch ground truth metadata from YouTube Data API, (2) transcribe using Gemini's multimodal video processing (it watches the video, not just audio), (3) analyze with Claude to generate an article draft, social snippets, key quotes with timestamps, and internal intelligence notes, (4) store in a structured folder with a metadata JSON. I need the processing script, the output folder structure, and the metadata schema. Show me how to handle Gemini model fallback chains and ground truth validation."

---

### Stage 3: Frame Extraction — Gemini Sees, ffmpeg Captures, Gemini Vision Verifies

This is one of the most technically interesting parts of the system. It uses AI at three different points in a single pipeline.

**The philosophy:** Frames are for comprehension, not decoration. A good frame answers: "What was on screen at this moment that I can't convey in words?" If the answer is "a person talking," skip it.

**The two-phase approach:**

#### Phase 1: Smart Timestamp Selection (Gemini — During Video Watching)

When Gemini transcribes the video (Stage 2), it simultaneously identifies `key_visual_moments` — timestamps where informative visual content appears on screen. The prompt includes:

```
## Key Visual Moments for Frame Extraction
Identify 5-8 timestamps where the most informative visual content appears.
INCLUDE: graphs, charts, diagrams, comparison shots, on-screen text, UI demos,
         data tables, annotated images, slides with key content
EXCLUDE: talking heads, faces, b-roll, intro/outro, sponsor segments
Format: [MM:SS] - brief description of what's visible
```

**Why this is powerful:** Gemini has WATCHED the video. It knows what's on screen at every moment. It can distinguish between a slide showing a architecture diagram at [14:32] and a talking head at [14:35]. Traditional approaches (extract frames at fixed intervals, or at quote timestamps) miss the informational frames and capture the useless ones.

Each visual moment includes a content type classification:

| Content Type | Examples |
|-------------|----------|
| CHART | Data visualizations, performance graphs, comparison charts |
| DIAGRAM | Architecture diagrams, flow charts, schematics |
| COMPARISON | Before/after, side-by-side, A/B tests |
| TEXT | Key definitions, section headers, code snippets |
| UI | Settings panels, menu walkthroughs, tool demonstrations |
| DEMO | Step-by-step processes, technique examples |
| TABLE | Spreadsheets, specification tables, comparison matrices |
| SLIDE | Presentation slides with key content |
| ANNOTATED | Photos/images with arrows, circles, labels |

#### The Download Step (yt-dlp + Cloudflare WARP)

YouTube periodically blocks automated downloads with "Sign in to confirm you're not a bot." We solved this with Cloudflare WARP running in a Docker container (`warp-socks`) on port 1080, providing a SOCKS5 proxy for yt-dlp. Fresh browser cookies are exported when needed.

The script downloads the video to a temporary directory, extracts frames at the identified timestamps using ffmpeg, then deletes the video file to save disk space.

**Fallback when download fails:** YouTube's thumbnail API provides auto-generated thumbnails at 25%, 50%, and 75% of the video duration. These are labeled "unverified" and used as backup visual assets.

#### Phase 2: Post-Extraction Verification (Gemini Vision)

After ffmpeg captures the frames, each one is sent to Gemini Vision for verification:

```
Classify this video frame. Is it:
A) Informational (chart, diagram, text, UI, comparison, demonstration)
B) Face/talking head (person speaking to camera)
C) Generic (b-roll, transition, intro/outro, filler)
Respond with just the letter and a 5-word description.
```

Only frames classified as **A (Informational)** are kept.

**Context-aware verification (a critical refinement):**

Early Phase 2 testing revealed a problem: Gemini Vision would reject frames that showed informational overlays on top of other imagery. For example, a frame showing text annotations overlaid on a bird photograph was rejected because Vision "saw" a bird, not the annotations.

The fix: Phase 2 now receives Phase 1's description of what should be at that timestamp. So when verifying the frame at [14:32], Gemini Vision knows "Phase 1 said this timestamp shows a comparison chart of rendering speeds" and can look for the chart rather than just describing what it sees. Timestamp matching uses ±3 second tolerance.

**Real-world results from testing:**

Processing a photography tutorial video: 29 frames extracted → 11 kept (informational: charts, UI screenshots, comparison images) → 18 filtered (13 talking heads, 5 generic b-roll). That's a 62% rejection rate — without verification, the article would have been cluttered with useless screenshots.

**Caption quality:**

Phase 2 also generates captions for approved frames. We discovered that Phase 1 captions (generated while watching the video, with full narrative context) are significantly better than Phase 2 captions (generated from a single static frame). The article builder now prefers Phase 1's narrative-aware captions:

- **Phase 2 caption (single frame):** "Capitalized word PASSION is visible"
- **Phase 1 caption (video context):** "Reynolds reveals comedy was never his passion... it was survival"

Content type tags (CHART, DIAGRAM, etc.) are stripped from displayed captions — they're metadata for the system, not reader-facing text.

**Frame naming convention:**

| Source | Pattern | Example |
|--------|---------|---------|
| Key moment (ffmpeg) | `frame_{MM}m{SS}s.png` | `frame_02m15s.png` |
| Contact sheet | `cs_{MM}m{SS}s.png` | `cs_05m30s.png` |
| YouTube thumbnail fallback | `thumb_{N}pct.jpg` | `thumb_50pct.jpg` |

> **Implementation Recipe: Intelligent Frame Extraction**
>
> "I want to extract informational frames from YouTube videos — not talking heads, not b-roll, but charts, diagrams, UI demos, and comparison shots. I need a two-phase approach: (1) During transcription, have Gemini identify timestamps with visual content and classify what's on screen, (2) After extracting frames with ffmpeg, verify each with Gemini Vision — only keep frames classified as 'informational.' Phase 2 should receive Phase 1's description as context to prevent false rejections. Show me how to build both phases and the fallback path when video download fails."

---

### Stage 4: Article Building — 10 Enhancements for WordPress

The article builder transforms processed content into a richly enhanced WordPress blog post, formatted for the Divi theme on chaplaintig.com.

**Script:** `tig_article_builder.py` (v1.3.0)

**The 10 enhancements:**

| # | Enhancement | What It Does |
|---|------------|-------------|
| 1 | **Watch/Read Toggle** | Hero section with embedded YouTube player + one-click toggle between watching the video and reading the article. Displays duration and word count so the reader can choose. |
| 2 | **Timestamped Chapters** | Chapter navigation generated from article headers. Each chapter links to the corresponding timestamp in the YouTube video for instant deep-linking. |
| 3 | **Key Takeaways** | 3-5 bullet-point takeaways displayed prominently above the article body. Generated from article analysis — the "if you read nothing else, read this" section. |
| 4 | **TIG Izm Pull-Quotes** | For videos from TIG's own YouTube channel, quotes are styled as "TIG Izms" — aphoristic pull-quotes that punctuate the article. |
| 5 | **Ideas Connected Constellation** | A visual map showing how this article's concepts connect to other articles on chaplaintig.com. Uses a knowledge graph database (`tig_graph.db`) to find semantic connections. |
| 6 | **Echoes (Quote Threads)** | When a quote in the current article echoes wisdom from other articles, the system surfaces those connections — "This idea connects to what [Expert B] said about [Topic]." Powered by the wisdom library. |
| 7 | **SEO VideoObject (JSON-LD)** | Structured data for Google's video rich results. Includes video title, description, thumbnails, duration, upload date — generated automatically from metadata. |
| 8 | **Clickable Wiki Links** | Concepts mentioned in the article that have their own articles on chaplaintig.com become clickable links. The `tig_graph.db` provides the lookup: concept name → WordPress post URL. |
| 9 | **Read Next** | Related article suggestions based on the constellation map — not random, but semantically connected content. |
| 10 | **Backlink Awareness** | The article knows which other articles link TO it. This enables "Referenced by" sections and helps with internal linking strategy. |

**How verified frames appear in articles:**

The article builder integrates frames from Stage 3 directly into the article body:
- Frames are inserted at their corresponding article sections (matched by timestamp to chapter position)
- A-classified frames get full-width display with captions (from Phase 1's narrative descriptions)
- Dark theme styling matches chaplaintig.com's aesthetic (background: #0a0a1a, accent: #33e8d8)
- Images link to the timestamp in the YouTube video for the reader to see the full context

**The knowledge graph behind enhancements 5, 6, 8, 9, 10:**

The `tig_graph.db` (managed by `tig_connection_engine.py`) is a SQLite database tracking:
- Every article published on chaplaintig.com
- Semantic tags and wiki link concepts per article
- Edge weights between articles based on shared concepts
- Quote thread connections from the wisdom library

When a new article is built, it's registered in the graph, edges are computed, and the constellation map is regenerated. This means every new article makes the entire site's internal linking smarter.

> **Implementation Recipe: Enhanced Article Builder**
>
> "I want to build a WordPress article generator that takes processed content (article draft, quotes, frames, metadata) and produces a richly enhanced blog post. I need: a video hero with watch/read toggle, timestamped chapter navigation, key takeaways section, pull-quotes, and SEO JSON-LD. The article should include verified frames at relevant sections with captions. Output as formatted HTML compatible with [your WordPress theme]. Show me the builder architecture and how to integrate visual assets."

---

### Stage 5: Content Atoms — Decomposition for Scale

Instead of treating each video as "one thing that gets one social post," we decompose it into reusable atoms that can be reassembled in different combinations for different audiences.

**Atom types:**

| Atom | What It Is | Source |
|------|-----------|--------|
| Core Insight | Single sentence capturing the essential idea | Claude extraction from article.md |
| Quotable Moments | 3-5 timestamped quotes with speaker attribution | quotes.md (from Stage 2) |
| Key Stats/Facts | Specific numbers, dates, verifiable claims | Claude extraction from article.md + intel.md |
| Visual Assets | Verified frames (A-classified) | frames/ folder (from Stage 3) |
| Video Clips | 30-66 second social video segments | Planned: Remotion templates |
| Big Why Statements | Per-program explanations of relevance | Claude + Big Why template library |

**Molecules (program-specific posts) assembled from atoms:**

- **chaplaintig.com** — Full article (all atoms) + video clip for social promotion
- **QWF social** — Core insight + Big Why (foundation-level) + verified frame + article link
- **MP social** — Core insight + Big Why (student opportunity) + quotable moment + video clip
- **WOH social** — Core insight rewritten in Combat voice + Big Why + video clip
- **L4G social** — Core insight + Big Why (business application) + verified frame (only if business-relevant)
- **IYSR social** — Core insight + Big Why (YSO partnership value) + link
- **QWC social** — Core insight + Big Why (creative industry angle) + frame
- **ACOFH** — Only if grief/service-relevant. Reverent tone. NEVER auto-routed.

**The compounding effect:** One 20-minute YouTube video → 6 content atoms → 7 possible program molecules → 5 platforms each → up to 35 unique posts (in practice, 15-25 after routing filters out irrelevant programs).

---

### Stage 6: Program Routing — The Big Why Engine

**Script:** `route_content_programs.py` (v1.0.0)

**The most important concept in the entire system: The Big Why Rule.**

Every cross-program share MUST have a program-specific "Big Why" statement. Not "our founder posted this." Not "check out this video." Each program earns the share by explaining why THIS content matters to THAT audience.

**Bad (generic):** "Check out this great video about AI!"

**Good (Big Why for MP — student program):** "This researcher just proved that small creative studios can now do what only Hollywood VFX houses could do 3 years ago — and that's exactly the opportunity our students are training to seize."

**Good (Big Why for L4G — business program):** "If your local business isn't using these AI tools yet, your competitor across town will be by next quarter. Here's what to prioritize."

**Good (Big Why for WOH — combat voice):** "They said only big studios could do this. They were WRONG. And you don't need their permission to prove it."

Same video. Three completely different angles. Each one speaks directly to its audience's values and concerns.

**How routing works:**

1. Load content atoms from metadata
2. Load all 7 program definitions (audience description, content affinity rules, sensitivity gates)
3. Single Claude Opus call with atoms + program descriptions → relevance score 0.0-1.0 per program with reasoning
4. Apply hard gates:
   - ACOFH has `never_share_outward` — content from other programs NEVER auto-routes there
   - Minimum threshold: 0.3 (below this = not relevant enough)
   - Grief/loss content → manual review flag regardless of routing
   - Controversial topics → per-platform approval required
5. For each qualifying program, generate a Big Why from the template library

**The Big Why Template Library** (`big_why_templates.json`):

Each program has 2-3 rotating templates with fill-in variables:

```json
{
  "L4G": {
    "voice_profile": "l4g-b2b",
    "audience": "Local business owners looking to grow using modern tools and community connections",
    "templates": [
      "This matters for local businesses because {specific_reason}. Here's how to apply it: {application}.",
      "Your competitors are already exploring this. {what_changed} — and local businesses that move first win."
    ],
    "content_affinity": {
      "technology_business": "high",
      "technology_creative": "medium",
      "personal_development": "low"
    }
  }
}
```

Claude fills `{specific_reason}`, `{what_changed}`, and `{application}` from the content atoms. The template ensures structural consistency; Claude provides the specifics.

**Voice profile assignment at routing time:**

| Program | Voice Profile | Adaptation Level |
|---------|--------------|-----------------|
| QWF | TIG Standard | Minor tone adjustment |
| MP | TIG Standard | Minor (student-focused) |
| WOH | WOH Combat | Full concept rewrite — different energy entirely |
| L4G | L4G B2B | Full rewrite — business-first framing |
| ACOFH | Reverent (TIG Standard variant) | Manual gate required |
| IYSR | TIG Standard | Minor (partnership-focused) |
| QWC | TIG Standard | Minor (creative angle) |

> **Implementation Recipe: Content Router + Big Why Engine**
>
> "I have [N] audience segments. Each has a description, content affinity profile, and voice assignment. Given content atoms (core insight, key facts, quotes), I need a router that: (1) scores relevance 0.0-1.0 per segment using Claude, (2) applies minimum thresholds and hard gates (one segment should never receive auto-routed content), (3) generates a 'Big Why' statement per qualifying segment using templates with fill-in variables. The Big Why must explain why THIS content matters to THAT audience — never generic. Store routing decisions in metadata JSON. Template library in a separate JSON file."

---

### Stage 7: Voice Adaptation — Same Idea, Different Personality

**Script:** `adapt_content_voice.py` (v1.0.0)

This is where one piece of content becomes many, each speaking in the right voice for its audience and formatted for each platform's constraints.

**Our three voice profiles:**

| Voice | Programs | Energy | Key Traits | Punctuation |
|-------|----------|--------|-----------|-------------|
| TIG Standard | QWF, MP, IYSR, QWC, ACOFH (reverent) | Quiet strength | Vulnerable warrior, nerdy mystic, authentic vulnerability | Ellipsis (...) always — NEVER em dashes |
| WOH Combat | WOH | Loud action | Battle cry, combat verbs, defiant, calls to action | Exclamation points OK, short punchy sentences |
| L4G B2B | L4G | Professional confidence | Business-value-first, ROI-focused, minimal emoji | Clean, professional, no spirituality |

**Platform constraints built into adaptation:**

| Platform | Char Limit | Hashtags | Emoji | Key Rule |
|----------|-----------|----------|-------|----------|
| Instagram | 2,200 (150 visible before "more") | 5-15 | 2-4 | Hook in first 150 chars — this is all most people see |
| Twitter/X | 280 | 1-3 | 1-2 | Every single word counts |
| LinkedIn | 3,000 | 3-5 | 1-2 | Professional framing, link in comments not body |
| Facebook | ~500 optimal | 1-3 | 2-4 | Concise performs better despite higher limit |
| TikTok | 2,200 | 3-5 | 2-4 | Caption is secondary to video |

**Batching by voice to minimize cost:**

Instead of making 7 separate LLM calls (one per program), the system groups programs by voice profile:

- **Batch 1 (TIG Standard):** QWF + MP + IYSR + QWC → one Claude Opus call, minor variations per program
- **Batch 2 (WOH Combat):** WOH → one call, full rewrite
- **Batch 3 (L4G B2B):** L4G → one call, full rewrite

Result: 2-3 LLM calls instead of 7. Each call produces all platform variants for all programs in that voice group.

**Visual asset selection per post:**

The LLM picks the best verified frame for each post based on caption relevance:
- Instagram: Always include the strongest visual
- Twitter: Can skip image for pure text impact
- LinkedIn: Professional-looking visuals preferred
- Fallback chain: verified frame → article thumbnail → YouTube thumbnail → program logo

**Content sharing rules (what can flow where):**

| From Voice | To Voice | Allowed? | How |
|-----------|----------|---------|-----|
| TIG Standard | TIG Standard variants | Yes | Minor tone adjustment |
| TIG Standard | WOH Combat | Concept only | Full rewrite — too different in energy |
| TIG Standard | L4G B2B | If business-relevant | Full rewrite — different framing entirely |
| WOH Combat | Any other | Concept only | Too aggressive for other audiences |
| L4G B2B | Any other | Rarely | Too business-specific |
| ACOFH | Anyone | NEVER | Content too sensitive for redistribution |

**Output:** `social_variants.json` — every post for every program for every platform:

```json
{
  "program": "WOH",
  "platform": "instagram",
  "voice": "woh-combat",
  "content": "They said only big studios could do this. They said you needed million-dollar budgets...\n\nThey. Were. WRONG.\n\nThis researcher just proved that one person with the right AI tools can produce what used to take a 50-person VFX team.\n\nYour limitation was never talent. It was access. And that barrier just crumbled.",
  "hashtags": ["#WarOnHopelessness", "#NeverQuit", "#AICreativity", "#ProveThemWrong"],
  "media": "frame_08m42s.png",
  "atoms_used": ["core_insight", "big_why_woh", "visual_chart_comparison"],
  "big_why": "The creative tools that were gatekept by studios are now in YOUR hands. No permission needed."
}
```

> **Implementation Recipe: Voice Adaptation**
>
> "I have [N] brand voices, each with personality traits, energy level, vocabulary preferences, and punctuation rules. Given content atoms and routing decisions, I need a voice adaptation engine that: (1) groups programs by voice profile, (2) makes batched Claude calls to generate platform-specific posts (respecting character limits and hashtag counts), (3) selects the best visual asset per post, (4) outputs structured JSON with all variants. My voices are: [DESCRIBE EACH]. My platforms: [LIST WITH CONSTRAINTS]."

---

### Stage 8: Human-in-the-Loop — The HQ Command Center

Everything before this stage is automated preparation. Everything after is automated execution. This stage is where a human applies judgment.

**The principle:** AI is excellent at generating options. Humans are excellent at choosing between them.

**The HQ Command Center** is a web application built on Supabase (database + auth) with a React frontend, hosted at hq.quietlyworking.org. It's QWF's operational hub for all approval workflows, but content review is one of its primary functions.

**What the human sees:**

1. **Content card** — Title, thumbnail, topics, word count, WordPress preview link
2. **Routing panel** — Each program with its relevance score, Big Why preview, toggle on/off
3. **Social variants** — Every adapted post for every platform, editable inline
4. **Visual assets** — Verified frames available for selection

**Three possible actions:**
- **Approve** — Content is good, routing is right, posts are ready → triggers publish chain
- **Edit** — Adjust routing (add/remove programs), modify post text, change visuals → then approve
- **Reject** — Not appropriate for publication. Archived, not deleted.

**The action log (audit trail):**

Every decision writes to an `hq_action_log` table in Supabase:
- What action was taken
- By whom
- When
- What was changed (if edit)
- Which content item

This creates a complete audit trail. It also triggers the next stage.

**The write-back mechanism (n8n bridge):**

An n8n workflow on the QWU n8n server runs every 5 minutes:
1. Queries HQ Supabase for unprocessed action log entries
2. SSHes to the processing VM (claude-dev)
3. Runs `write_back_dirty_items.py` (v1.2.0)

The write-back script executes the full publish chain:

```
Human approves in HQ
        │
        ▼
n8n detects (5-min poll) → SSH to processing VM
        │
        ▼
write_back_dirty_items.py
        │
        ├── route_content_programs.py (if not already routed)
        ├── adapt_content_voice.py (if not already adapted)
        ├── tig_publish_article.py (WordPress publish on chaplaintig.com)
        └── distribute_content_social.py (Vista Social scheduling)
```

**Why Discord was replaced:**

We originally used Discord for content approval — slash commands to approve/reject. Problems:
- No visual preview of social posts
- No inline editing
- No routing adjustment UI
- Slash commands aren't a great approval UX for complex decisions
- Discord would drop context in long threads

Discord now serves as a **read-only transparency feed**: "New content ready for review in HQ" and "Content published to chaplaintig.com with 18 social posts scheduled." Humans go to HQ to act; they glance at Discord to stay informed.

**Why n8n as the bridge (not a webhook or cron):**

n8n provides:
- Reliable scheduling with retry logic
- Error alerting if the SSH command fails
- Visual workflow monitoring
- No custom infrastructure needed

A simple cron job would work but offers no visibility or retry. A webhook would be faster but requires exposing an endpoint and handling auth. n8n is the pragmatic middle ground.

> **Implementation Recipe: HITL Approval + Write-Back**
>
> "I need a human-in-the-loop content approval system. Requirements: (1) A web UI showing content cards with routing recommendations and toggle controls, (2) approve/edit/reject actions that write to a database log, (3) a background process that polls for approved items and triggers a publish chain. I'm using Supabase for the database. For background polling, I could use n8n, cron, or webhooks — recommend the best approach for my scale. Help me design the data model (action queue + action log tables) and the write-back script."

---

### Stage 9: Automated Distribution — Vista Social at Scale

**Script:** `distribute_content_social.py` (v1.0.0)

Vista Social is our social media management platform. We chose it because it supports all our platforms, has a reasonable API, and handles the actual posting mechanics so we don't have to build OAuth flows for 5 different social networks.

**How distribution works:**

1. Load `social_variants.json` from the content folder
2. Map each program to its Vista Social profile IDs (QWF has Instagram + Twitter + LinkedIn + Facebook, WOH has Instagram + Twitter, etc.)
3. Schedule posts with intelligent timing:

| When | What Gets Posted | Why |
|------|-----------------|-----|
| Day 0 (+2 hours) | Highest-relevance program, primary platform | Strike while the content is fresh |
| Day 0 (+6 hours) | chaplaintig.com profiles (founder's personal brand) | Same-day personal sharing |
| Day 1-2 | Secondary programs, different platforms | Spread the wave, don't blast |
| Day 3-5 | Remaining posts (long tail) | Extended reach over time |

**Rules:**
- Maximum 2 posts per program per day (respect your audience)
- Video posts get peak engagement time slots
- Never schedule to the same platform twice in the same hour

4. All API calls go through `vista_social_api.py` (v1.1.0) — a dedicated wrapper with:
   - **Built-in rate limiting:** 48 req/min with 20% safety margin against Vista Social's 60 req/min API limit
   - **Structured responses:** Every call returns `{success, data, error}` — no raw HTTP parsing in calling code
   - **Comprehensive logging:** Every API call logged with timestamp, endpoint, response code
   - **Dry-run mode:** Test the full pipeline without actually posting

5. Distribution log written to:
   - `{uid}/distribution_log.json` in the content folder
   - HQ Supabase (status, post count, log)
   - Discord transparency notification

**Why a wrapper around every external API:**

This is a universal principle we follow. Direct API calls are fragile:
- Rate limits hit unexpectedly → pipeline crashes
- Auth tokens expire → silent failures
- Response formats change → parsing breaks
- No logging → impossible to debug

The wrapper handles all of this. The calling code just says "schedule this post to this profile at this time" and gets back success or failure with a clear error message.

> **Implementation Recipe: Social Distribution Engine**
>
> "I need to schedule social posts across multiple profiles and platforms via [your social media tool]'s API. Requirements: (1) rate-limited API wrapper that proactively throttles (not reactively), (2) intelligent timing — spread posts over 3-5 days, max 2 per profile per day, (3) distribution logging (what posted where, when), (4) dry-run mode for testing. Help me build the wrapper module first, then the scheduling logic."

---

### Stage 10: Tracking and the Feedback Loop

**Current state:** Distribution logging is fully built. Performance analytics feedback loop is planned.

**What exists today:**

Every scheduled post is tracked with:
- Platform and profile
- Content text and media
- Scheduled time
- Vista Social post ID (for later analytics retrieval)
- Which content atoms were used
- Which Big Why was applied

HQ Supabase records track distribution status per content item: how many posts scheduled, which programs, distribution log.

**What's planned (the self-improving loop):**

1. Vista Social analytics API pulls engagement metrics (likes, comments, shares, clicks) per post
2. Metrics correlate with: program, platform, voice profile, content type, Big Why template used
3. Patterns feed back into the content router:
   - "L4G posts about AI tools get 3x engagement on LinkedIn vs. Instagram" → router shifts L4G priority
   - "WOH Combat voice on vulnerability topics gets lower engagement than WOH Standard blend" → adaptation adjusts
   - "Big Why template #2 consistently outperforms template #1 for MP" → template weighting updates

4. Over time, the router learns what works for each audience without manual tuning

**Why we built the pipeline before the feedback loop:** You can't optimize what doesn't exist. The pipeline needed to be working and producing data before analytics could tell us anything meaningful. Build the machine, run it, collect data, THEN optimize.

---

## The Content Calendar — Scheduled Publishing

Not all content comes from the video pipeline. Some posts are planned in advance — event announcements, campaign content, recurring series, seasonal posts. The Content Calendar system handles these.

**Script:** `process_content_calendar.py` (v1.0.0)
**Directive:** `process_content_calendar.md`
**Schedule:** Daily at 6 AM Pacific via n8n, plus manual runs for specific dates.

**How it works:**

Each planned content item lives as a Markdown file in `005 Operations/Content Calendar/` with YAML frontmatter:

```yaml
---
scheduled: 2026-04-15
platform: instagram
program: QWF
delivery: automated
status: approved
vista_profile: "@quietlyworking"
---

Your post content here...
```

The calendar processor runs daily and:

1. **Scans** all calendar files for items matching today's date
2. **Filters** to `status: approved` only (skips published, failed, or draft)
3. **Categorizes** by delivery mode:

| Delivery Mode | Platforms | What Happens |
|--------------|-----------|-------------|
| `automated` | Vista Social, Discord, WordPress | API calls execute publishing directly |
| `reminder` | Circle.so, Skool, Press Ranger | Discord notification sent — human posts manually |
| `manual` | L4G Production, special campaigns | Logged only — human handles everything |

4. **Publishes** automated items via `vista_social_api.py` (same rate-limited wrapper as Stage 9)
5. **Updates** frontmatter with `status: published` and `published_at` timestamp
6. **Summarizes** to Discord `#agent-log` channel

**How it relates to the video pipeline:** The video pipeline (Stages 2-9) handles content that originates from YouTube videos — reactive, based on what experts publish. The Content Calendar handles content that's planned proactively — campaigns, announcements, recurring series. Both use the same distribution infrastructure (Vista Social wrapper, HQ tracking).

**Why Markdown files instead of a database?** Calendar items are often drafted collaboratively, benefit from version control (git history shows who changed what), and can be reviewed in Obsidian alongside the rest of the vault. The frontmatter-as-metadata pattern means the same file is both the content and its scheduling configuration.

> **Implementation Recipe: Content Calendar**
>
> "I want a content calendar system where each planned post is a Markdown file with scheduling metadata in YAML frontmatter (date, platform, program, delivery mode, status). I need a daily processor that: (1) scans for items matching today's date, (2) routes by delivery mode (automated vs. reminder vs. manual), (3) publishes automated items via my social media API, (4) sends Discord reminders for manual items, (5) updates the file's status after publishing. Show me the frontmatter schema and the processor script."

---

## Social Post Quality Gates — Voice Integrity at Scale

When you're generating 15-25 social posts per content item across 3 voice profiles and 5 platforms, quality control can't be manual. The QWF social post system includes built-in quality gates that ensure every post maintains brand voice integrity before it reaches the HQ approval stage.

**Directive:** `qwf_write_social_post.md` (v1.1.0)

### The Self-Review Checklist

Every social post — whether generated by the content pipeline or written individually — passes through a 4-category self-review before delivery:

**Voice & Style:**
- Correct voice profile applied? (TIG Standard vs. WOH Combat vs. L4G B2B)
- Uses ellipsis (...) not em dashes? (TIG's #1 punctuation rule — no exceptions)
- Opening varied? (no crutch phrases like "Did you know..." or "Here's the thing...")
- Active verbs throughout?
- Every word necessary? (Hemingway principle — trim ruthlessly)

**Message & Mission:**
- Gets to the point fast?
- Key message clear?
- CTA obvious?
- Hope-forward? (No guilt, shame, or fear appeals — ever. QWF builds people up.)

**Tone & Feel:**
- Authentic? (Sounds human, not corporate)
- Appropriate vulnerability/energy for the voice profile?
- Nerd elements present? (TIG Standard — the "nerdy mystic" quality)
- Combat energy maintained? (WOH — defiant, not despairing)

**Technical:**
- Emoji usage appropriate for the platform?
- Within platform character limit?
- Hashtags appropriate for platform count?
- Read-aloud test passed? (Would this sound natural spoken out loud?)

### The Post Structure by Voice

Each voice profile has a defined post structure:

**TIG Standard** (QWF, MP, IYSR, QWC):
1. Hook — punchy observation or vulnerable truth
2. Body — lyrical build, value, insight
3. Point — hard-hitting takeaway
4. CTA — direct invitation + gentle encouragement
5. Hashtags

**WOH Combat** (War on Hopelessness):
1. Hook — defiant statement, combat energy
2. Body — battle cry, empowerment
3. Point — "you are powerful"
4. CTA — "join the fight"
5. Hashtags — `#WarOnHopelessness` always primary

**L4G B2B** (Locals 4 Good):
1. Hook — business value statement
2. Body — clear offer/benefit
3. CTA — concrete next step
4. Minimal hashtags

### Sensitivity Gates

Beyond voice consistency, certain content triggers additional review:

| Gate | Trigger | Action |
|------|---------|--------|
| **ACOFH Sensitivity** | Any content touching children of fallen military or first responders | Heightened review: no humor, no casual tone, reverent approach. Flag if topic seems too sensitive for social. |
| **Grief/Loss Detection** | Content mentioning death, loss, fallen heroes | Manual review required even if ACOFH isn't in routing |
| **Hope Filter** | Post uses guilt, shame, or fear as motivator | Rejected. QWF builds people up — never manipulates through negative emotion. |
| **Youth Safety** | Content involving or targeting youth | Additional review for age-appropriateness |
| **Controversial Topics** | Content on polarizing subjects | Per-platform explicit approval required (no batch approve) |
| **Family Liaison** | ACOFH content referencing specific families | Must pass through family liaison review — never publish without family approval |

### Optimal Posting Times

The system uses platform-specific engagement windows when scheduling:

| Platform | Best Times | Best Days |
|----------|-----------|-----------|
| Instagram | 11am-1pm, 7-9pm | Tue, Wed, Fri |
| Facebook | 1-4pm | Wed, Thu, Fri |
| Twitter/X | 8-10am, 12pm | Tue, Wed, Thu |
| LinkedIn | 7-8am, 12pm, 5-6pm | Tue, Wed, Thu |
| TikTok | 7-9am, 12-3pm, 7-11pm | Tue, Thu, Fri |

### Student Training Component

Social post creation is one of the first tasks delegated to Missing Pixel students as a training exercise. Posts are eligible for student involvement when:
- Timeline allows 2+ weeks buffer (no rush)
- Content is general (not crisis, not ACOFH family-specific)
- Scope is defined (topic, platform, objective clear)
- Learning value exists (new platform, new voice practice)

Students draft posts using the same voice profiles and quality gates. The `qwf-creative-director` agent evaluates their work against the checklist before it enters the HQ approval queue. This creates a structured learning environment where students practice real brand voice writing with safety rails.

> **Implementation Recipe: Social Post Quality Gates**
>
> "I need a quality gate system for social media posts. Each post should pass through a self-review checklist before delivery, covering: voice consistency, message clarity, tone authenticity, and technical compliance (character limits, hashtag counts). I have [N] voice profiles, each with a defined post structure. I also need sensitivity gates — certain content types (grief, controversy, youth-facing) trigger additional manual review. Show me the checklist framework, the voice-specific structures, and how to implement sensitivity detection."

---

## The Feeder Network — How the Wisdom Library Gets Fed

The content pipeline (Stages 2-10) processes individual videos into distributed social posts. But the **wisdom library** (Stage 1) draws from a much wider network of automated monitors that continuously scan the internet for expert knowledge. This is the system that makes the wisdom library grow from hundreds to thousands of entries without manual curation.

### The Content Pipeline Supervisor

Everything is orchestrated by the **Content Pipeline Supervisor** (`content_pipeline_supervisor.py` v1.1.0) — a master scheduler that coordinates 20+ downstream scripts across five pipeline groups:

| Pipeline Group | Frequency | What It Does |
|---------------|-----------|-------------|
| **Queue** | Every 30 min via n8n | Process content calendar, handle pending reviews, queue social posts |
| **Expert Intelligence** | Daily at 7 AM Pacific | Monitor Twitter, LinkedIn, newsletters for new expert content |
| **YouTube/Video** | Daily at 7 AM Pacific | Detect new videos, process, extract frames, build articles |
| **Wisdom** | Daily at 7 AM Pacific | Index new content, synthesize entries |
| **TIG Izms** | Daily/on-demand | Capture and merge quotable insights from TIG's own content |

The supervisor runs sequentially for dependent pipelines and uses a parallel executor (`content_pipeline_parallel.py` v1.0.0) for independent tasks — the expert monitors (Twitter + LinkedIn + newsletter + audit) run simultaneously, achieving 60-70% faster execution than sequential processing.

### The Six Automated Feeder Channels

Each channel monitors a different content source, extracts insights, and feeds them to `wisdom_indexer.py` for classification and storage.

#### 1. YouTube Channel Monitor

**Script:** `youtube_monitor.py` (v1.1.0)

Watches YouTube channels from the expert registry for new uploads. When a new video is detected:
1. Triggers the full video processing pipeline (`process_video_content.py`)
2. Auto-indexes extracted insights to wisdom.db
3. Updates the expert profile with `last_checked` and `last_video_id`
4. Sends a Discord notification to the intel digest channel

The expert registry tracks which channels to watch, how frequently, and what priority tier they belong to. A-tier experts (daily watchers) get checked first.

#### 2. Twitter/X Monitor

**Script:** `twitter_monitor.py` (v1.0.1)

Monitors Twitter/X accounts of watched experts via Apify's tweet-scraper actor.

- **Cost:** ~$0.40 per 1,000 tweets via Apify
- **Tracks:** `last_tweet_id` per expert to only capture new content
- **Priority tiers:** A-tier experts checked daily, B-tier weekly, C-tier monthly
- **Output:** Each tweet batch is indexed to wisdom.db, capture document generated in `004 Knowledge/Captures/`

Usage: can target all experts, a specific priority tier, or a single expert by name.

#### 3. LinkedIn Monitor

**Script:** `linkedin_monitor.py` (v1.0.0)

Monitors LinkedIn profiles for new posts from watched experts via Apify's LinkedIn actor.

- **Cost:** ~$5 per 1,000 posts via Apify
- **Tracks:** `last_post_id` per expert
- **Same priority tier system** as Twitter
- **Output:** Posts indexed to wisdom.db with professional/industry context preserved

#### 4. Newsletter Monitor

**Script:** `newsletter_monitor.py` (v1.0.0)

Monitors the Outlook inbox (via Microsoft Graph API) for newsletters from whitelisted intelligence sources.

- **Whitelist:** `003 Entities/Taxonomies/newsletter_intel_sources.yaml` — curated list of newsletters worth monitoring
- **Process:** Scans inbox for new emails from whitelisted senders → extracts content → indexes to wisdom.db → generates capture document
- **Audit flow:** A separate `newsletter_audit_review.py` provides a Discord-based review workflow for managing the whitelist (keep, unsubscribe, block domain)

This is the only feeder that requires email access — it monitors the organizational inbox for high-quality newsletters from tool vendors, industry analysts, and expert commentators.

#### 5. Web Article Monitor

**Script:** `capture_web_articles.py` (v1.1.0)

Monitors web blogs and news sites configured in `web_intel_sources.yaml`.

- **Sources:** 10 active web sources including vendor official blogs, expert sites, and community forums
- **Method:** RSS feeds where available, HTML scraping as fallback
- **Tool tagging:** Each source in the YAML config specifies which tools it covers, so captured articles automatically get tagged in `wisdom_tools`
- **Part of the TWL system:** This is how vendor-official wisdom enters the library automatically. When Supabase publishes a blog post about a new feature, it gets captured, classified, and indexed without manual intervention.

#### 6. Vendor Intelligence Capture

**Script:** `vendor_intel_capture.py` (v1.1.0)

A manual + programmatic capture tool for vendor events that don't come through automated channels — pricing changes, promotional events, feature announcements discovered during normal work.

- **Event types:** pricing change, feature launch, deprecation, promotional generosity, breaking change, security advisory
- **Polarity tracking:** positive / negative / neutral — feeds into vendor health scoring
- **Audit trail:** Events have a review workflow (pending → applied/dismissed)
- **Registry:** 32 vendors tracked across 3 tiers in `vendor_registry.yaml`

This is the "catch-all" for intelligence that falls outside the automated monitors. Someone discovers that a tool is offering a limited-time deal, or a breaking change is announced in a Discord server — `vendor_intel_capture.py` captures it with full provenance.

### How It All Flows Together

```
                    ┌─── YouTube Monitor ──── New videos ──┐
                    ├─── Twitter Monitor ──── New tweets ──┤
                    ├─── LinkedIn Monitor ─── New posts ───┤
Content Pipeline    ├─── Newsletter Monitor ─ New emails ──┼──→ wisdom_indexer.py ──→ wisdom.db
Supervisor          ├─── Web Article Monitor ─ New articles┤     (8,071+ entries)
(daily cron)        ├─── Vendor Intel Capture  Manual events┤
                    │                                       │
                    └─── YouTube Video Pipeline ────────────┘
                         (Stages 2-4: transcribe → frames → article)
                              │
                              ▼
                         Content enters Stages 5-10
                         (route → adapt → approve → distribute)
```

**The compounding effect:** Every day, these 6 channels add 10-50 new wisdom entries to the database. After months of continuous operation, the library has grown to 8,071 entries from 1,187 experts covering 208 tools. This depth means the content router (Stage 6) and voice adapter (Stage 7) have rich context for generating Big Why statements and audience-specific posts. The system literally gets smarter every day.

### The Expert Registry — The Hub of the Feeder Network

All monitors share a common expert registry (`expert_registry.py`) that tracks:
- Expert name, platforms (YouTube channel, Twitter handle, LinkedIn URL)
- Priority tier (A/B/C) — determines monitoring frequency
- Last checked date and last content ID per platform
- Capture count (how many insights we've indexed from this expert)
- Expertise areas and tool associations

When a new expert is added to the registry, all relevant monitors automatically start watching their content. When an expert is downgraded from A-tier to C-tier, monitoring frequency decreases accordingly. The registry is the single source of truth for "who are we learning from?"

> **Implementation Recipe: Automated Feeder Network**
>
> "I want to build an automated intelligence gathering system that monitors multiple content sources and feeds a central wisdom database. I need monitors for: (1) YouTube channels — detect new videos from a registry of experts, (2) Twitter/X — capture tweets from watched accounts via Apify, (3) web blogs — monitor RSS feeds and scrape articles from vendor blogs, (4) newsletters — scan email inbox for whitelisted senders. Each monitor should: track what was last captured per source, only process new content, index insights to a SQLite wisdom database, and generate capture documents. I need a supervisor script that orchestrates all monitors on a daily schedule. Show me the expert registry design and the supervisor architecture."

---

## Tool Wisdom Libraries — Deep Dive

TWLs deserve their own section because they're a meta-system — a system for building knowledge about the tools you use to build systems.

**The core problem:** Tools are complex. Knowledge about them is scattered across vendor docs, YouTube tutorials, Stack Overflow, community forums, and hard-won personal experience. When a tool updates, nobody audits whether accumulated knowledge still applies. When a team member discovers a gotcha, it lives in a Slack message that nobody will ever find again.

**The solution: A 5-layer knowledge structure per tool.**

### Layer 1: Entity Profile

**Location:** `003 Entities/Tools/{Tool Name}.md`

Quick reference card: what the tool is, our specific configuration, access details, cost, and which experts in our system teach about it.

### Layer 2: Operational Directive

**Location:** `005 Operations/Directives/{tool}_tool_wisdom.md`

Deep operational knowledge: capabilities we actively use, gotchas and workarounds, integration patterns with other tools, cost optimization, version history and migration notes.

**Example gotcha from our n8n TWL:**

> **If v2 node requires `"combinator": "and"` in the conditions object.** Without it, the node defaults to always-true, routing all items to output 0 regardless of conditions. This one issue caused 80% of our workflow failures before we documented it.

### Layer 3: Indexed Wisdom

All `wisdom.db` entries tagged with this tool via the `wisdom_tools` join table. Queryable, synthesizable, authority-ranked.

### Layer 4: Source Registry

Vendor blogs, expert YouTube channels, newsletters that feed wisdom. Configured in `web_intel_sources.yaml` for monitoring. Currently tracking 10 active web sources and 32 vendors across 3 tiers.

### Layer 5: Cross-Tool Intelligence

When Tool A works with Tool B, both TWLs reference each other. Integration patterns, known conflicts, recommended approaches for combined usage.

**Example:** Our Supabase TWL notes that "Supabase node v1 in n8n is buggy — generates `id..value` instead of `id.eq.value` in PostgREST queries. Use HTTP Request nodes with direct PostgREST API calls instead." This cross-references the n8n TWL which has the same information from the other direction.

**TWLs we've built (with maturity scores):**

| Tool | Score | Status | Key Topics |
|------|-------|--------|-----------|
| Claude (API + Code) | 12 | Complete | Model tiers, adaptive thinking, prompt caching, API patterns |
| n8n | 12 | Complete | Node gotchas, webhook requirements, SSH patterns, deployment |
| Divi (WordPress theme) | 10 | Complete | Shortcode conventions, styling patterns, module configs |
| Supabase | 9 | Complete | Management API, PostgREST, edge functions, auth config |
| ComfyUI | 9 | Complete | Workflow patterns, model management, node configurations |
| NotebookLM | 9 | Complete | Source management, audio generation, research synthesis |
| Lovable | 8 | Complete | Prompt conventions, app architecture, Vite gotchas |
| Weavy | 7 | Complete | Chat integration, real-time features, embedding patterns |
| BrightLocal | — | New | Local SEO, citations, HMAC auth, competitive landscape |

> **Implementation Recipe: Tool Wisdom Library System**
>
> "I want to build a Tool Wisdom Library system. For each important tool in my stack, I need 5 layers: (1) entity profile (quick reference card), (2) operational directive (deep knowledge: gotchas, patterns, costs), (3) indexed wisdom entries in a database tagged by tool, (4) source registry (vendor blogs, expert channels to monitor), (5) cross-tool links. Start with the database schema for tool tagging, then help me create my first TWL for [YOUR MOST-USED TOOL]. Use this scoring matrix to prioritize: daily use +3, complex +2, expert ecosystem +2, integrated with 2+ systems +2, expensive +1, rapidly evolving +1, used by team +1."

---

## The Model Strategy — Quality First

Every LLM call in the QWU Backoffice follows a "Flagship First" strategy, managed through a centralized configuration module (`model_config.py` v2.1.0).

**The principle:** Start with the most capable model for everything. Only downgrade when there is a specific, defensible reason. The reason must be logged.

**Why this matters for content systems:** A cheaper model might classify wisdom entries 85% accurately instead of 95%. Across 8,000+ entries, that's 800+ misclassifications. Those feed into routing decisions, which feed into social posts. The cost difference between Claude Opus and a cheaper model is a few dollars per month at our volume. The quality difference is systemic.

**Our tier system:**

| Tier | Model | When We Use It |
|------|-------|---------------|
| FLAGSHIP (default) | Claude Opus 4.6 (1M context, adaptive thinking) | Everything requiring judgment — content analysis, wisdom classification, routing decisions, voice adaptation |
| SYNTHESIS | Claude Sonnet 4.5 (1M context) | Large-context tasks where flagship cost isn't justified |
| STANDARD | Claude Sonnet 4.5 | Genuinely categorical classification tasks |
| FAST | DeepSeek | Mechanical pattern matching only (name parsing, format conversion) |
| VIDEO | Gemini (3.1 Pro → 2.5 Pro → 2.5 Flash chain) | Video transcription (multimodal — no other model can watch video) |

**How it works in practice:**

All scripts import from a single `model_config.py`. The default is always FLAGSHIP. Downgrading requires a `reason` parameter that gets logged:

```python
from model_config import llm_call, ModelTier

# Default: FLAGSHIP. No tier specified. Quality matters.
response = llm_call(
    messages=[{"role": "user", "content": prompt}],
    reason="Content routing — quality directly affects post relevance",
    script_name="route_content_programs.py"
)

# Explicit downgrade: REQUIRES justification
response = llm_call(
    messages=[{"role": "user", "content": prompt}],
    tier=ModelTier.FAST,
    reason="Name parsing — mechanical pattern matching, no judgment needed",
    script_name="parse_names.py"
)
```

**Adaptive thinking (Claude Opus 4.6):**

Opus supports adaptive thinking — Claude decides when and how much to reason before responding. For complex analysis tasks (meeting intelligence, content routing), enabling thinking produces noticeably better results:

```python
response = llm_call(
    messages=[{"role": "user", "content": prompt}],
    thinking=True,  # Let Claude reason before responding
    effort="high",  # Control thinking depth: low/medium/high/max
    reason="Content review — deep reasoning catches sensitivity issues",
    script_name="process_content_review.py"
)
```

**All calls route through OpenRouter** — a unified LLM gateway that provides single-key access to multiple model providers. Benefits:
- Single API key and billing
- Unified response format regardless of underlying provider
- Easy model switching without code changes
- Cost logging per script, per tier, per call

---

## Our QWU Toolstack — What We Use and Why

| Tool | Role in the Pipeline | Why We Chose It |
|------|---------------------|----------------|
| **Claude Code** | Orchestration layer (Layer 2) — reads directives, calls scripts, handles errors, self-anneals | Best AI coding assistant available; runs on our VM via terminal |
| **Claude Opus 4.6** | All content analysis, classification, routing, and generation | Quality-First strategy — best reasoning model available |
| **Google Gemini** | Video transcription (multimodal — watches video) and frame verification (Gemini Vision) | Only model that processes full video files natively |
| **YouTube Data API v3** | Ground truth metadata, playlist monitoring | Authoritative source for video attribution |
| **Python** | All execution scripts (Layer 3) | Universal, well-supported, extensive library ecosystem |
| **SQLite** | Wisdom database, graph database, supervisor databases | Zero-config, file-based, perfect for single-VM architecture |
| **ffmpeg** | Frame extraction from downloaded videos | Industry standard for video/image processing |
| **yt-dlp** | YouTube video download (for frame extraction) | Best YouTube downloader, actively maintained |
| **Cloudflare WARP** | SOCKS5 proxy for yt-dlp when YouTube blocks downloads | Solves bot detection without requiring VPN infrastructure |
| **WordPress (Divi)** | Article publishing on chaplaintig.com | Existing platform, Divi theme for rich formatting |
| **Supabase** | HQ Command Center database + auth | Postgres-based, excellent API, real-time subscriptions |
| **Vista Social** | Social media scheduling across all platforms | Supports all our platforms, reasonable API, handles OAuth complexity |
| **n8n** | Workflow orchestration (write-back polling, scheduled jobs) | Self-hosted, visual workflows, reliable scheduling with retry |
| **OpenRouter** | Unified LLM gateway | Single billing, unified API, easy model switching |
| **Discord** | Transparency notifications (read-only) | Team already uses it; great for async awareness |
| **Azure VM** | Processing infrastructure (claude-dev) | Our existing cloud provider |

**Every external API is wrapped in a dedicated Python module.** Vista Social has `vista_social_api.py`. Supabase calls go through standardized helper functions. This means:
- Rate limiting is proactive, not reactive
- Every call is logged
- Response formats are normalized
- Dry-run mode exists for testing
- When a vendor changes their API, we update one file

---

## Gotchas, Learnings, and Things That Bit Us

These lessons cost real hours. They're free for you.

### 1. Gemini Hallucinated Video Attribution (Cost: 2 days)

**What happened:** We let Gemini report the video title and channel name from its transcription. For most videos, it was correct. But occasionally, Gemini would attribute quotes to the wrong person — especially when the video featured interviews where multiple people were mentioned.

**Root cause:** Gemini processes the entire video holistically. If a video mentions "as Elon Musk said..." and the actual speaker is a different creator commenting on Musk, Gemini sometimes reversed the attribution.

**The fix:** Fetch ground truth metadata from YouTube Data API FIRST. Use that for all attribution. Gemini handles transcription and analysis only — never trust it for verifiable facts.

**The principle:** Trust AI for analysis. Never trust it for facts that can be verified from a structured API. This applies everywhere, not just video.

### 2. Discord as an Approval Interface (Cost: 3 weeks of suboptimal workflow)

**What happened:** We used Discord slash commands for content approval. `/approve`, `/reject`, `/edit`.

**Why it failed:** Discord is a messaging platform, not a decision platform. No visual previews, no inline editing, no routing controls. Every approval required context-switching between Discord and a preview URL.

**The fix:** Built the HQ Command Center with visual cards, routing toggles, inline editing. Discord became read-only transparency.

**The principle:** Use the right tool for each job. Messaging tools are great for notifications. Terrible for structured decisions with visual context.

### 3. Frame Extraction Without AI Verification (Cost: Cluttered articles)

**What happened:** We extracted frames at key timestamps from videos and used them all. Most frames from talking-head videos are just... a person talking.

**The numbers:** A photography tutorial video produced 29 frames. Without verification, all 29 would go in the article. With Gemini Vision verification: 11 kept (charts, UI screenshots, comparisons), 18 filtered (13 talking heads, 5 generic b-roll).

**The fix:** Two-phase verification. Phase 1: Gemini identifies visual moments during transcription. Phase 2: Gemini Vision verifies each extracted frame independently.

**The principle:** AI-generated content needs AI-quality-checking. One model generates, another verifies. The cost is minimal; the quality improvement is dramatic.

### 4. Phase 2 Rejected Informational Frames (Cost: 1 day)

**What happened:** Gemini Vision rejected frames showing informational overlays (text annotations, comparison labels) on top of photographic backgrounds. It "saw" the photograph and classified it as generic, missing the overlay content entirely.

**Example:** A frame showing bird photography with text annotation "ISO 6400, f/5.6, 1/2000s" was rejected because Vision saw a bird.

**The fix:** Context-aware verification. Phase 2 now receives Phase 1's description of what should be at that timestamp. "Phase 1 said: settings comparison overlay at [14:32]." Gemini Vision uses this context to look for the expected content rather than just freely describing what it sees. ±3 second timestamp tolerance handles slight alignment differences.

**The principle:** When using one AI to verify another AI's work, give the verifier context about what to expect.

### 5. Phase 2 Caption Quality Was Poor (Cost: Ongoing until fixed)

**What happened:** Phase 2 generated captions from static single frames. Results were OCR-like: "Capitalized word PASSION is visible." Not useful for readers.

**Root cause:** Gemini Vision sees a single frame with no context. Phase 1 sees the entire video with full narrative context.

**The fix:** Article builder now prefers Phase 1 captions (video-watching, narrative-aware): "Reynolds reveals comedy was never his passion... it was survival." Phase 2 captions are fallback only. Content type tags (CHART, DIAGRAM, etc.) stripped from displayed captions.

**The principle:** Context-rich captions come from the model that watched the video, not the model that saw one frame.

### 6. YouTube Bot Detection Blocks yt-dlp (Recurring)

**What happens:** YouTube periodically detects yt-dlp as automated and blocks downloads with "Sign in to confirm you're not a bot."

**The fix:** Cloudflare WARP running in a Docker container (`warp-socks`) on port 1080 provides a SOCKS5 proxy. Combined with periodic fresh cookie exports from a browser session.

**When WARP also fails:** Phase 1 (Gemini identifying visual moments) still works because Gemini accesses the video through Google's infrastructure, not yt-dlp. Fallback: YouTube auto-thumbnails at 25%/50%/75% of video duration. Less precise, but the pipeline doesn't break.

**The principle:** Every stage should have a degradation path. Don't let one tool's failure crash the whole pipeline.

### 7. Supabase Node v1 in n8n Is Buggy (Cost: Many hours)

**What happened:** n8n's built-in Supabase node generates incorrect PostgREST queries — `id..value` instead of `id.eq.value`. Queries silently return wrong results.

**The fix:** Use HTTP Request nodes with direct PostgREST API calls instead of the Supabase node. Set both `apikey` and `Authorization: Bearer` headers.

**The principle:** When a platform's native integration is buggy, use the raw API directly. It's more work upfront but eliminates a class of mysterious failures.

### 8. n8n If Node Without Combinator (Cost: 80% of early workflow failures)

**What happened:** n8n's If node v2 requires `"combinator": "and"` in the conditions JSON. Without it, the node defaults to ALWAYS TRUE, routing all items to output 0 regardless of your conditions.

**The fix:** Always include `"combinator": "and"` (or `"or"`) in If node conditions. Test by sending items that SHOULD fail the condition and verifying they route to output 1.

**The principle:** When a workflow tool silently ignores your conditions, the failures look like data problems, not configuration problems. Always test the failure path, not just the success path.

### 9. Generic Cross-Posting Feels Like Spam (Cost: Audience trust)

**What happened:** Early attempts at multi-program sharing just copied the same post to different channels. "Check out this video!" on 7 different program feeds.

**Why it failed:** Audiences smell inauthenticity instantly. A post written for creative professionals doesn't resonate with local business owners. It feels like spam.

**The fix:** The Big Why Rule. Every cross-program share must have a program-specific explanation of why THIS content matters to THAT audience. Not generic. Not "our founder posted this." Each program earns the share.

**The principle:** Scale doesn't mean duplication. It means adaptation. The marginal cost of an LLM rewriting a post for a specific audience is negligible. The trust cost of sending irrelevant content is significant.

### 10. Building Analytics Before the Pipeline Existed (Almost)

**What almost happened:** We nearly started building the engagement feedback loop before the basic distribution pipeline was working.

**Why we stopped:** You can't optimize what doesn't exist. There was no data to analyze, no baselines to compare against.

**The principle:** Build the pipeline first. Get content flowing. Collect data. THEN optimize. Premature optimization of a content system means optimizing the wrong thing.

### 11. Long Videos (>2 hours) Hit Gemini's Frame Limit

**What happened:** Gemini has a 10,800-frame limit for video processing. Videos longer than ~2 hours at standard frame rates exceed this.

**The fix:** For long-form content (podcast recordings, full conference talks), we fall back to an Apify actor for transcription and use Gemini only for frame identification on time-bounded segments.

**The principle:** Know your model's limits before they surprise you in production. Document them in your Tool Wisdom Library.

### 12. Content-Type Tags Leaked Into Published Captions

**What happened:** Phase 1 frame descriptions included content type tags like "[CHART] Performance comparison of three rendering engines." These tags leaked into the WordPress article captions.

**The fix:** Article builder strips content type tags from displayed captions. Tags are metadata for the system's internal use (routing which frames to which posts), not reader-facing text.

**The principle:** Internal metadata and public-facing content are different things. Filter before display.

---

## Decision Tree — What Do You Actually Need?

### Solo Creator (1 brand, 1-3 platforms)

**Build:**
- Stage 2: Video processing → structured content
- Stage 7: Voice adaptation (one voice, platform formatting only)
- Simple approval: review in terminal, approve to schedule

**Skip:** Wisdom library (overkill), content atoms (one audience), routing (one program), HQ Command Center (terminal is fine)

### Small Team (1-2 brands, 3-5 platforms)

**Build:**
- Stage 1: Basic wisdom library (insights, skip tool tagging)
- Stage 2: Video processing
- Stage 5: Content atoms (enables reuse across brands)
- Stage 7: Voice adaptation (1-2 voices)
- Stage 8: Simple HITL (Supabase + basic web UI)
- Stage 9: Distribution

**Skip:** Full TWL system, elaborate routing (manual is fine for 2 brands)

### Organization (3+ brands, 10+ profiles, multiple voices)

**Build everything.** Start with Stages 2→8→9 (content flowing with approval). Then add 5→6→7 (scaling and voice). Then Stage 1 (compounding knowledge). Then Stage 10 (optimization).

### Agency (Multiple clients)

**Build everything with multi-tenancy.** Each client gets their own voice profiles, Big Why templates, program definitions, and social profile mappings. The pipeline, wisdom library, and infrastructure are shared.

---

## Implementation Recipes — Copy-Paste to Claude

Each recipe is self-contained. Paste it into Claude Desktop or Claude Code with your own context.

### Recipe 1: The Foundation

```
I want to set up a 3-layer architecture for AI automation based on the QWU 
Backoffice pattern:

Layer 1 (Directives): Markdown SOPs — goals, inputs, steps, outputs, edge cases.
Layer 2 (Orchestration): Claude — reads directives, calls scripts, self-anneals.
Layer 3 (Execution): Python scripts — deterministic, return {success, data, error}.

My use case: [DESCRIBE]
My tools: [LIST]
My content sources: [LIST]
My audiences: [LIST]

Create: folder structure, template directive, template script, .env template.
```

### Recipe 2: Wisdom Library

```
Build me a wisdom library (SQLite) for classified insights from content I consume.

Each entry needs: insight text, expert name, source URL/title/date, topics 
(many-to-many), tools referenced (many-to-many with version), authority level 
(vendor_official/expert_validated/community/self_discovered), actionability flag, 
video timestamp for deep-links.

I need: SQLite schema, Python indexing script using Claude for classification, 
and a query utility that filters by topic, tool, expert, authority level.

My sources: [LIST — YouTube, newsletters, articles, etc.]
```

### Recipe 3: Video-to-Content Pipeline

```
Build a video processing pipeline:
1. Fetch ground truth metadata from YouTube Data API (NEVER trust LLM for attribution)
2. Transcribe with Gemini multimodal (it watches the video)
3. During transcription, identify key visual moments with content types (CHART, DIAGRAM, UI, etc.)
4. Analyze with Claude to generate: article draft, social snippets, key quotes with timestamps, intel notes
5. Extract frames at visual moment timestamps using ffmpeg
6. Verify each frame with Gemini Vision — keep only informational frames (A-classified)
7. Phase 2 verification gets Phase 1 descriptions as context (prevents false rejections)
8. Index wisdom entries from the content

Output: structured folder with article.md, social.md, quotes.md, intel.md, 
_metadata.json, frames/ directory.

My publishing platform: [WordPress/Ghost/etc.]
My social platforms: [LIST with character limits]
```

### Recipe 4: Content Routing + Big Why

```
Build a content routing system for [N] audience segments:

[LIST EACH: name, description, voice, content preferences]

Given content atoms (core insight, quotes, stats, visuals):
1. Score relevance 0.0-1.0 per segment using Claude
2. Apply minimum threshold (0.3) and hard gates
3. Generate Big Why statements per qualifying segment

Big Why = "Why THIS content matters to THAT audience." Not generic. Specific.
Template example: "This matters for [audience] because {reason}. {connection_to_goals}."

Need: routing script, Big Why template library (JSON), voice profile assignments.
```

### Recipe 5: Voice Adaptation + Distribution

```
Build voice adaptation + automated distribution:

My voices: [DESCRIBE EACH — energy, vocabulary, punctuation rules]
My platforms: [LIST with char limits, hashtag counts, emoji rules]

1. Group programs by voice profile for batched LLM calls
2. Generate platform-specific posts respecting constraints
3. Select best visual asset per post based on caption relevance
4. Schedule via [social media tool] API with:
   - Rate limiting (proactive, not reactive)
   - 3-5 day spread, max 2 per profile per day
   - Video posts get peak engagement slots
5. Log everything (what posted where, when)

Need: voice profiles, adaptation script, API wrapper with rate limiting, 
distribution scheduler, distribution log format.
```

---

## Cost Reality Check

Real costs for running this system at QWF's scale (~30 videos/month, ~500 social posts/month):

### LLM Costs (Monthly Estimate)

| Task | Model | Calls/Month | Est. Cost |
|------|-------|------------|-----------|
| Video transcription | Gemini Pro | ~30 | $15-30 |
| Content analysis + article generation | Claude Opus | ~30 | $20-40 |
| Wisdom classification | Claude Opus | ~300+ entries | $10-20 |
| Content routing + Big Why | Claude Opus | ~30 | $5-10 |
| Voice adaptation (batched) | Claude Opus | ~60-90 | $15-30 |
| Frame verification | Gemini Vision | ~200+ frames | $5-10 |
| **Total LLM** | | | **$70-140/month** |

### The ROI Math

**Without this system:** 1 person manually writes 3-5 social posts per video = ~100 posts/month at 15-20 min each = 25-33 hours/month.

**With this system:** Same person reviews and approves in HQ = ~30 min per video = 15 hours/month, producing ~500 adapted posts. 5x the output in half the time.

### Scaling Behavior

The system scales sub-linearly:
- Infrastructure costs are fixed (same VM whether you process 10 or 100 videos)
- Only LLM costs scale with volume
- Adding a new program adds ~1 extra LLM call per content item
- The wisdom library gets MORE valuable with scale (lookups are free; only indexing costs)

---

## Script Inventory

Complete list of scripts in the content intelligence pipeline:

| Script | Version | Stage | Purpose |
|--------|---------|-------|---------|
| `process_video_content.py` | v2.5.0 | Capture | YouTube → Gemini transcription → Claude analysis → 5 output files |
| `extract_video_frames.py` | v1.2.0 | Capture | yt-dlp download → ffmpeg frame extraction → thumbnail fallback |
| `wisdom_indexer.py` | v1.9.0 | Knowledge | Content → classified wisdom entries in SQLite (multi-source) |
| `generate_wisdom_capture.py` | — | Knowledge | Generate human-readable capture documents after indexing |
| `wisdom_query.py` | — | Knowledge | Query wisdom.db by tool, topic, expert, authority |
| `wisdom_synthesizer.py` | — | Knowledge | Synthesize multiple wisdom entries into summaries |
| `tig_article_builder.py` | v1.3.0 | Article | Content → WordPress article with 10 enhancements (Divi format) |
| `tig_video_pipeline_orchestrator.py` | v1.5.0 | Orchestration | Daily cron → detect new videos → full pipeline → HQ + Discord |
| `route_content_programs.py` | v1.0.0 | Routing | Content atoms → program relevance scoring → Big Why generation |
| `adapt_content_voice.py` | v1.0.0 | Adaptation | Voice-adapted variants per program per platform (batched) |
| `distribute_content_social.py` | v1.0.0 | Distribution | Multi-program Vista Social scheduling with timing spread |
| `vista_social_api.py` | v1.1.0 | Distribution | Rate-limited Vista Social API wrapper (48 req/min safety) |
| `write_back_dirty_items.py` | v1.2.0 | HITL Bridge | HQ approval → route → adapt → publish → distribute chain |
| `tig_publish_article.py` | v1.2.0 | Publishing | Approved draft → published WordPress article on chaplaintig.com |
| `model_config.py` | v2.1.0 | Infrastructure | Centralized LLM config — Quality First, all tiers, cost logging |
| `generate_constellation_map.py` | — | Article | Knowledge graph visualization for Ideas Connected section |

---

## What's Next (Planned)

| Feature | Status | Impact |
|---------|--------|--------|
| Performance feedback loop | Planned | Vista Social analytics → router optimization |
| Remotion social video clips | Planned | 30-66 second video clips from content atoms |
| HQ platform preview cards | Planned | Approximate visual preview of posts per platform |
| Content calendar view | Planned | Week/month view of scheduled distribution |
| QWR Agency tier extraction | Future | Multi-tenant version for QWR supporters |

---

## Closing

> "You are a media business that happens to sell products."
> — Grace Andrews, former Brand Director, Diary of a CEO

The QWU Backoffice Content Intelligence System operationalizes that principle. Every QWF program is a media voice with its own audience relationship. Content flows from capture through intelligent routing, and each program speaks to its audience about the right topics in the right voice.

The technology: Claude + Gemini + Python + SQLite + a few APIs.
The architecture: 3 layers (directive, orchestration, execution).
The magic: Decomposition (atoms, molecules, Big Why, voice profiles).

But the real insight is simpler: **Humans should make decisions. Machines should handle everything else.** The human touches this pipeline exactly once — at the approval stage. They see everything the system prepared, apply their judgment, and the rest happens automatically.

That's the pattern. Take what works for you. Leave what doesn't.

---

*Built by the Quietly Working Foundation. Published as part of the QWU Public Transparency Project.*
*System architecture by Chaplain TIG with Claude Code.*