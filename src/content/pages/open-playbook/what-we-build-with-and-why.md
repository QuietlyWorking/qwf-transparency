---
title: "What We Build With... And Why"
slug: "what-we-build-with-and-why"
pillar: "open-playbook"
description: "*A field guide to our tech stack, for every kind of nerd.*"
tags: ["how-to", "architecture", "stack", "sveltekit", "cloudflare", "supabase", "ai", "ecosystem", "qsp"]
isHome: false
---
# Don't Panic

*A field guide to our tech stack, for every kind of nerd.*

---

If "GitHub" sounds like an EDM band and "the cloud" sounds like weather... don't panic. The most useful book in the galaxy had two big friendly words on the cover for exactly this feeling. We'll start every piece in plain English. The cape comes later, and only if you want it. 🚀

Folks keep asking what we use to build our websites and our apps. I love that you're curious enough to dig in. So here's the whole toolbox... no mystery, no gatekeeping. What we use, and why each piece earned its spot.

First, the frame. Because the tools don't make sense without it.

We're a nonprofit building for the long haul. No investors tapping their watch. No demo day. No pressure to look impressive in somebody's pitch deck next quarter. That freedom changes everything about how you pick your tools. When nobody's rushing you, you quit optimizing for "fast to show off" and start optimizing for "still standing in ten years." Durable beats shiny. Every single time.

There's a second filter, and it matters just as much. These apps aren't only products. They're a classroom. Younglings in our training programs learn to build on this exact stack. So every choice has to pass one more test... can a self-taught kid who's never written a line of code actually learn this? If the answer is no, it doesn't go in the toolbox. No matter how clever it is.

Boring, durable, open, cheap to run, teachable. That's the whole philosophy.

## How to read this

We're all walking the same road at different paces. So pick your traveler:

- 🪶 **The Hobbit** ... you're curious and smart, and you couldn't read code if your life depended on it. You're home here. Start every piece with the Hobbit.
- 🗡️ **The Ranger** ... you can read a little of the wild. You've dabbled with Claude or Lovable, you know what Cloudflare is, and you're ready to don the cape.
- 🧙 **The Wizard** ... you've read the Silmarillion twice and you dream in assembly. The deep cuts are for you.

**Find your level and read just that lane down the page. Or read all three for each piece, and watch the same idea get deeper. No wrong way to travel.**

The toolbox, in one breath: we build the screens with **SvelteKit**, host them on **Cloudflare**, store everything in **Supabase**, write our articles in **Astro**, wire it all together with **n8n**, and weave **Claude** through the back office to multiply the human touch. Now the why, one piece at a time.

---

## The frontend: SvelteKit (the screens you actually touch)

🪶 **Hobbit:** This is the part of the app you see and tap. We use a tool called Svelte to build it, and we picked it for one reason that probably matters to you more than you'd guess: it makes pages load fast on a beat-up phone with two bars of signal. The folks we serve aren't on the newest hardware. Fast and light isn't a flex for us. It's respect.

🗡️ **Ranger:** If you've poked at web stuff, you've heard of React. SvelteKit is the road less traveled, and it's a better road for us. React makes you write a lot of plumbing just to get water out of the tap. Svelte cuts the plumbing... you write less code, and it compiles away before anyone visits, so the browser gets a tiny fast page instead of a heavy engine to boot up. Want to try the cape on? `npm create svelte` and you've got an app running in about ninety seconds. That's the whole barrier now.

🧙 **Wizard:** Svelte 5 with runes (`$state`, `$derived`, `$effect`) instead of the virtual-DOM diffing tax. It's a compiler, not a runtime framework, so reactivity is resolved at build time and the shipped bundle is a fraction of an equivalent React tree. SvelteKit gives us SSR out of the box, which is the real reason we left React SPAs behind... a client-rendered single-page app is functionally invisible to Google's crawler, and for a nonprofit that lives or dies on being found, that's disqualifying. `adapter-cloudflare` targets Workers natively. We pay a small ecosystem-maturity tax versus React, and we take that trade gladly for the bundle size, the SSR, and the fact that a self-taught youngling can read a `.svelte` file and actually follow it.

And it isn't a fragile one-person hobby. Svelte was born in a newsroom. Rich Harris built it while making interactive graphics for The Guardian and The New York Times, fighting to get rich, data-heavy stories to load fast for readers on whatever phone they happened to own. That origin is the whole reason the framework is obsessed with speed... it was built for exactly the people we build for. In 2021, Vercel hired Rich to work on Svelte full-time, so a serious company now backs its future without stripping away the independent, open-source soul it started with. The thing we picked for our screens was made by someone who cared about the reader on the bad connection. That's not an accident we'd trade away.

## The hosting: Cloudflare (where the apps live)

🪶 **Hobbit:** The old way to put a website online was to rent a computer somewhere, keep it patched, keep it awake, and pray it didn't fall over at 2am. We don't do that. Cloudflare wakes our apps up when someone visits, does the work, and lets them rest. We pay for what gets used, and what gets used by a young nonprofit is close to nothing. It also serves the page from a city near you, so it snaps open no matter where you are.

🗡️ **Ranger:** Cloudflare Pages plus Workers. "Serverless," which means there's no box we babysit and it scales to zero when nobody's home. We deploy by pushing to GitHub, an automated build kicks off, and sixty seconds later it's live and global. The free tier is generous enough that a whole family of apps runs for the price of a coffee. This is the part that still feels like magic to me.

🧙 **Wizard:** Pages for the built assets, Workers as the runtime at the edge... V8 isolates rather than containers, so cold starts round to nothing. The whole thing rides the same global network that already fronts a huge slice of the internet. We said no to standing up and patching a VM for anything a supporter touches, because scale-to-zero economics matter enormously when you guard every dollar so more of it reaches people. We keep a small back-office box or two for internal chores, but nothing in front of a supporter depends on a server we have to keep awake.

## The backend: Supabase (the data, and the door)

🪶 **Hobbit:** Supabase holds all the information and guards who's allowed in... who can log in, who's allowed to see what, where the files go. Building that part from scratch is where most projects quietly drown. We skip the drowning, and that lets us spend our time on the stuff that actually helps people.

🗡️ **Ranger:** Managed Postgres plus authentication plus file storage plus little serverless functions, all in one. You get a real SQL database and real login flows without standing any of it up yourself. And it's open source, which means your data stays yours... no company holding it hostage.

🧙 **Wizard:** Postgres underneath, not a NoSQL toy that buckles under a real query. Row-Level Security pushes authorization down into the database itself, so a leaky client physically can't over-fetch what it shouldn't. Auth, storage, edge functions, realtime, all in the same skin. We chose it over Firebase precisely because it's Postgres and open source... if we ever had to leave, the schema and the data walk out the door with us. In our work we're guests on a lot of systems, and we never build on ground we can't walk away from.

## The content sites: Astro (the writing, including this page)

🪶 **Hobbit:** An app and an essay are different animals. An app needs to be clickable and clever. An essay just needs to open instantly and be easy to read. So for our articles and docs we use a different tool that's built for exactly that... words that load before you blink.

🗡️ **Ranger:** Astro ships almost no JavaScript for a content page, so it loads near-instantly and Google reads it perfectly. We don't use the heavy app framework to hang a picture. Right tool, right job.

🧙 **Wizard:** Islands architecture... zero JS by default, hydrate only the interactive bits. Static output to the same Cloudflare edge as everything else. Content Collections for type-safe markdown, `set:html` when we need to drop in raw HTML. The app stack and the content stack split cleanly along the interactivity seam: 80% app goes SvelteKit, 80% content goes Astro. Matching the tool to the seam, instead of forcing one framework to do both jobs badly, is most of the discipline.

And the longevity question got answered in the best way possible. In January 2026, Cloudflare acquired The Astro Technology Company outright. Fred Schott and the team who build Astro now build it from inside the same company that hosts it for us. The framework and the ground it runs on are one set of people now. And Cloudflare put the promise in writing: Astro stays MIT-licensed, openly governed, and portable to any host... not just theirs. So our content layer and our hosting layer became the same hands, and we still kept the right to walk away with everything if we ever needed to. In a field where today's hot tool is tomorrow's abandoned repo, that's about as safe a bet as it gets.

## The wiring: n8n (the quiet automations)

🪶 **Hobbit:** This is the wiring closet. It connects the apps to each other and runs the quiet chores in the background... the reminders, the syncs, the little handoffs that used to live in my head and fall through the cracks. Nobody sees it. Everything depends on it.

🗡️ **Ranger:** n8n is an automation platform, like Zapier but you own it. Visual workflows, webhooks, scheduled jobs. We run our own copy, so the wiring belongs to us and we're not paying a middleman per task as we grow.

🧙 **Wizard:** Self-hosted Community Edition, secrets via environment, webhook and cron triggers, SSH and HTTP nodes reaching into the rest of the stack. Self-hosting keeps the data on our own ground and dodges per-execution pricing that punishes scale. The trade is we own the uptime... which is why it's monitored and backed up nightly. Owning your own nervous system is worth the babysitting. If you want the whole build, start to finish, I wrote it up in [Self-Hosting n8n on Azure - The Guide I Wish Existed](/open-playbook/self-hosting-n8n-on-azure/).

## The brain: Claude (multiplying the human touch)

🪶 **Hobbit:** This is the AI woven through the back office, and you might be reading words it helped shape right now. It's not here to replace the human touch... it's here to multiply it. For decades I collected hundreds of business cards and watched them pile in a corner while relationships cooled, because I'm one broken human with twenty-four hours like everybody else. The AI fills that breach. It reaches the moments I physically can't, so folks still feel seen even when I'm stretched too thin to do it myself.

🗡️ **Ranger:** We build on Claude and the Claude Agent SDK... agents that read our files, run our scripts, and take real action behind guardrails, not just chat in a box. If you've dabbled with Claude or ChatGPT or Lovable, this is that same power, pointed at real work and wired into everything else we just talked about. This is the cape. It's lighter than you think.

🧙 **Wizard:** Agent SDK with custom tools exposed over MCP, flagship-model-by-default (we spend on quality for anything touching judgment or a human, rather than shaving tokens), structured outputs, prompt caching, adaptive thinking. The architecture deliberately separates the probabilistic layer (the model's judgment) from the deterministic layer (plain Python that does the actual writes), because compounding 90%-per-step across five steps lands you at 59% and a bad day. Push the determinism down into tested code, keep the model on the decisions. That seam is the whole game, and the full method is in [How to Give Your AI Agent Superpowers](/built-from-broken/how-to-give-your-ai-agent-superpowers/).

---

## One honest note: we're mid-journey

Some of our apps already run on this clean stack. Some still run on the faster tools we used to get off the ground... Lovable to prototype, React to grow... and we're moving them over one at a time. We're doing it now, on purpose, while it's calm and before thousands of people lean on these things. You fix the roof while the sun's out. Migrating in a storm is how good organizations break.

None of these tools are exotic, and that's the point. We didn't chase the trend that'll be embarrassing in two years. We picked tools that are open, cheap to run, fast for the people on the worst phones, and simple enough that a kid healing from a hard life can learn to build on them and walk into a real career.

## Why this is the best time in history to be one of us

Remember the last shot of The Last Jedi? Not a Skywalker. Not a bloodline. A nameless stable kid on a backwater planet, sweeping a barn, who quietly pulls a broom to his hand with the Force and looks up at the stars. For a whole galaxy, power belonged to an order, then a chosen few. And there's the kid with the broom.

That's right now.

The making of software... the magic that used to need a computer science degree and venture money... is reaching the broom kids. The self-taught. The ones nobody bet on. Every tool in this article is a broom. And the Force is finally everybody's. ✨

The stack isn't the mission. People are the mission. The stack is just how we keep the lights on... quietly, durably, for as long as folks need us.

And if any of this sparked a question, whether you're a Hobbit or a Wizard... ask me. I'll geek out with you all day. 🚀

---

## See The Whole Ecosystem

QWF builds an interconnected family of apps. [Quietly Spotting](https://quietlyspotting.org) is the hub. Around it orbit Quietly Writing, Quietly Quoting, Quietly Networking, Quietly Knocking, Quietly Tracking, and more. See the [live ecosystem map](https://quietlyspotting.org/#ecosystem) for what's shipped, what's building, and how it all connects.

This article is the trailhead. Every tool above is one plane of a bigger universe... follow the threads below to go deeper on any of them.

## Related Reading

The overview is the map. These are the trails.

- [How to Give Your AI Agent Superpowers](/built-from-broken/how-to-give-your-ai-agent-superpowers/) ... the full method behind the Claude layer
- [Self-Hosting n8n on Azure - The Guide I Wish Existed](/open-playbook/self-hosting-n8n-on-azure/) ... the automation layer, built start to finish
- [The Tool Shed](/open-playbook/the-tool-shed/) ... all 48+ tools we run, scored on Heart, Soul, and 12 other metrics
- [Nonprofit Tech Access Guide](/open-playbook/nonprofit-tech-access-guide/) ... how nonprofits reach many of these tools at no or low cost
- [QWU Values](/living-proof/values/) ... why we publish any of this in the first place

---

*Written by Chaplain TIG... June 2026*
*From the workshop, not the boardroom.* 🛠️