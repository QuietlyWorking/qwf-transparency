<script>
  /** @type {{ data: any }} */
  let { data } = $props();

  let expandedCat = $state(null);
  let selectedEntity = $state(null);
  let hoveredGraphIdx = $state(null);

  const categories = $derived(data?.categories ?? []);
  const entities = $derived(data?.entities ?? []);
  const summary = $derived(data?.summary ?? {});

  const expandedEntities = $derived(
    expandedCat
      ? entities
          .filter(e => e.category === expandedCat)
          .sort((a, b) => (a.sort_order ?? 99) - (b.sort_order ?? 99))
      : []
  );

  // Connection graph data for selected entity
  const connections = $derived(selectedEntity?.detail?.connections ?? []);
  const graphNodes = $derived(() => {
    if (!connections.length) return [];
    const size = 260;
    const cx = size / 2;
    const cy = size / 2;
    const radius = cx * 0.65;
    return connections.map((name, i) => {
      const angle = (i / connections.length) * Math.PI * 2 - Math.PI / 2;
      const resolved = entities.find(e =>
        e.name.toLowerCase() === name.toLowerCase() ||
        e.name.toLowerCase().includes(name.toLowerCase()) ||
        name.toLowerCase().includes(e.name.toLowerCase())
      );
      return {
        label: name,
        entity: resolved || null,
        x: cx + Math.cos(angle) * radius,
        y: cy + Math.sin(angle) * radius,
      };
    });
  });

  /** Icon map */
  const ICON = {
    grid: '💻', heart: '❤️', cog: '⚙️', server: '🏗️', book: '📚', pen: '✏️', globe: '🌐',
    pencil: '✍️', calculator: '🧮', handshake: '🤝', door: '🚪', telescope: '🔭',
    house: '🏠', target: '🎯', 'heart-pulse': '💜', 'circle-dot': '⊙', 'mail-heart': '💌',
    shield: '🛡️', medal: '🎖️', palette: '🎨', network: '🌍', flame: '🔥',
    sparkles: '✨', mailbox: '📬', coins: '🪙', bot: '🤖', activity: '📊',
    sparkle: '✦', trophy: '🏆', footprints: '👣', zap: '⚡', newspaper: '📰',
    layers: '📂', lightbulb: '💡', briefcase: '💼', key: '🔑',
    calendar: '📅', video: '📹', eye: '👁️', settings: '⚙️',
    users: '👥', database: '🗄️', mail: '📧', cloud: '☁️', layout: '📄', workflow: '🔄',
  };

  function toggleCategory(id) {
    if (expandedCat === id) {
      expandedCat = null;
      selectedEntity = null;
    } else {
      expandedCat = id;
      selectedEntity = null;
    }
  }

  function selectEntity(entity) {
    selectedEntity = selectedEntity?.id === entity.id ? null : entity;
  }

  function statusColor(status) {
    if (status === 'production' || status === 'active') return 'var(--eco-success)';
    if (status === 'alpha') return 'var(--eco-warning)';
    if (status === 'building') return 'var(--eco-info)';
    return 'var(--eco-dim)';
  }

  function isLive(status) {
    return status === 'production' || status === 'active';
  }

  // Animated stat counter
  let statsVisible = $state(false);
  let displayApps = $state(0);
  let displayHealth = $state(0);
  let displayPrograms = $state(0);

  function animateCounters() {
    if (statsVisible) return;
    statsVisible = true;
    const targets = {
      apps: summary.apps_online ?? 0,
      health: summary.system_health_pct ?? 0,
      programs: summary.programs_active ?? 0,
    };
    const start = performance.now();
    const dur = 1000;
    function tick(now) {
      const p = Math.min((now - start) / dur, 1);
      const e = 1 - Math.pow(1 - p, 3); // ease-out cubic
      displayApps = Math.round(targets.apps * e);
      displayHealth = Math.round(targets.health * e);
      displayPrograms = Math.round(targets.programs * e);
      if (p < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  // IntersectionObserver to trigger count-up
  let statsRef = $state(null);
  $effect(() => {
    if (!statsRef) return;
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) animateCounters();
    }, { threshold: 0.5 });
    io.observe(statsRef);
    return () => io.disconnect();
  });
</script>

<div class="eco-block">
  <!-- Header -->
  <div class="eco-block__header">
    <span class="eco-block__star">✦</span>
    <span class="eco-block__title">The Quietly Working Universe</span>
    <a class="eco-block__viewall" href="/living-proof/">View All</a>
  </div>

  <!-- Category Rings -->
  <div class="eco-block__rings">
    {#each categories as cat}
      <button
        class="eco-ring"
        class:eco-ring--expanded={expandedCat === cat.id}
        style="--ring-color: {cat.color}"
        onclick={() => toggleCategory(cat.id)}
        aria-label="{cat.label}: {cat.count} entities, {cat.live_count} active"
        aria-expanded={expandedCat === cat.id}
      >
        <span class="eco-ring__icon">{ICON[cat.icon] || '•'}</span>
        <span class="eco-ring__label">{cat.label}</span>
        <span class="eco-ring__count">{cat.count}</span>
        <span class="eco-ring__dots">
          {#each Array(Math.min(cat.live_count, 5)) as _}
            <span class="eco-pulse eco-pulse--breathe" style="
              width: 5px; height: 5px; border-radius: 50%;
              background: var(--eco-success); display: inline-block;
              box-shadow: 0 0 5px var(--eco-success);
            "></span>
          {/each}
        </span>
      </button>
    {/each}
  </div>

  <!-- Expanded Entity Grid -->
  {#if expandedCat && expandedEntities.length > 0}
    <div class="eco-block__expanded">
      <div class="eco-block__grid">
        {#each expandedEntities as entity}
          <button
            class="eco-card eco-card--compact"
            class:eco-card--selected={selectedEntity?.id === entity.id}
            style="--card-color: {entity.color}"
            onclick={() => selectEntity(entity)}
            type="button"
          >
            <div class="eco-card__header">
              <span class="eco-card__icon">{ICON[entity.icon] || '•'}</span>
              <span class="eco-pulse" class:eco-pulse--breathe={isLive(entity.status)} style="
                width: 6px; height: 6px; border-radius: 50%;
                background: {statusColor(entity.status)}; display: inline-block;
                box-shadow: {isLive(entity.status) ? '0 0 6px ' + statusColor(entity.status) : 'none'};
              "></span>
            </div>
            <div class="eco-card__name">{entity.name}</div>
            {#if entity.student_training}
              <span class="eco-card__badge" title="Student training component">MP</span>
            {/if}
          </button>
        {/each}
      </div>

      <!-- Entity Detail Panel -->
      {#if selectedEntity}
        <div class="eco-detail" style="--detail-color: {selectedEntity.color}">
          <button class="eco-detail__close" onclick={() => selectedEntity = null}>✕</button>

          <div class="eco-detail__header">
            <span class="eco-detail__icon">{ICON[selectedEntity.icon] || '•'}</span>
            <div class="eco-detail__title-area">
              <h4 class="eco-detail__name">{selectedEntity.name}</h4>
              <div class="eco-detail__tagline">{selectedEntity.tagline || ''}</div>
            </div>
            <div class="eco-detail__status">
              <span class="eco-pulse" class:eco-pulse--breathe={isLive(selectedEntity.status)} style="
                width: 8px; height: 8px; border-radius: 50%;
                background: {statusColor(selectedEntity.status)}; display: inline-block;
                box-shadow: {isLive(selectedEntity.status) ? '0 0 8px ' + statusColor(selectedEntity.status) : 'none'};
              "></span>
              <span class="eco-detail__status-label">{selectedEntity.status}</span>
            </div>
          </div>

          <div class="eco-detail__body" class:eco-detail__body--split={connections.length > 0}>
            <div class="eco-detail__content">
              {#if selectedEntity.detail?.summary}
                <p class="eco-detail__summary">{selectedEntity.detail.summary}</p>
              {/if}

              {#if selectedEntity.detail?.highlights?.length}
                <ul class="eco-detail__highlights">
                  {#each selectedEntity.detail.highlights as hl}
                    <li>{hl}</li>
                  {/each}
                </ul>
              {/if}
            </div>

            <!-- Connection Graph -->
            {#if connections.length > 0}
              <div class="eco-detail__graph-area">
                <div class="eco-detail__graph-label">Connections</div>
                <div class="eco-graph">
                  <svg width="260" height="260" viewBox="0 0 260 260" class="eco-graph__svg">
                    <defs>
                      <filter id="glow-center" x="-50%" y="-50%" width="200%" height="200%">
                        <feGaussianBlur stdDeviation="4" result="blur" />
                        <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                      </filter>
                      <filter id="glow-hover" x="-50%" y="-50%" width="200%" height="200%">
                        <feGaussianBlur stdDeviation="3" result="blur" />
                        <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                      </filter>
                    </defs>

                    <!-- Connection lines -->
                    {#each graphNodes() as node, i}
                      <line
                        x1="130" y1="130" x2={node.x} y2={node.y}
                        stroke={node.entity?.color || 'var(--eco-dim)'}
                        stroke-opacity={hoveredGraphIdx === i ? 0.8 : 0.25}
                        stroke-width={hoveredGraphIdx === i ? 2 : 1}
                        stroke-dasharray={node.entity ? 'none' : '4 3'}
                        class="eco-graph__link"
                      />
                    {/each}

                    <!-- Animated pulses along lines -->
                    {#each graphNodes() as node, i}
                      <circle r="2" fill={node.entity?.color || 'var(--eco-dim)'} opacity="0.6" class="eco-graph__line-pulse">
                        <animateMotion dur="{2.5 + i * 0.3}s" repeatCount="indefinite" path="M130,130 L{node.x},{node.y}" />
                      </circle>
                    {/each}

                    <!-- Outer nodes -->
                    {#each graphNodes() as node, i}
                      <!-- svelte-ignore a11y_no_static_element_interactions -->
                      <g
                        class="eco-graph__node" class:eco-graph__node--clickable={!!node.entity}
                        onmouseenter={() => hoveredGraphIdx = i}
                        onmouseleave={() => hoveredGraphIdx = null}
                        onclick={() => { if (node.entity?.public_link && node.entity?.url) window.open(node.entity.url, '_blank', 'noopener'); }}
                        style="cursor: {node.entity ? 'pointer' : 'default'}"
                      >
                        <circle
                          cx={node.x} cy={node.y} r={hoveredGraphIdx === i ? 20 : 16}
                          fill="var(--eco-bg-card)" stroke={node.entity?.color || 'var(--eco-dim)'}
                          stroke-width={hoveredGraphIdx === i ? 2.5 : 1.5}
                          filter={hoveredGraphIdx === i ? 'url(#glow-hover)' : undefined}
                        />
                        <text x={node.x} y={node.y + 1} text-anchor="middle" dominant-baseline="central"
                          font-size={hoveredGraphIdx === i ? '13' : '11'} class="eco-graph__node-icon">
                          {node.entity ? (ICON[node.entity.icon] || '•') : '?'}
                        </text>
                        <text x={node.x} y={node.y + (hoveredGraphIdx === i ? 32 : 28)}
                          text-anchor="middle" font-size="8" fill="var(--eco-text-muted)" class="eco-graph__node-label">
                          {node.label.length > 14 ? node.label.slice(0, 12) + '…' : node.label}
                        </text>
                      </g>
                    {/each}

                    <!-- Center node -->
                    <g class="eco-graph__center">
                      <circle cx="130" cy="130" r="26" fill="var(--eco-bg-card)"
                        stroke={selectedEntity.color} stroke-width="2.5" filter="url(#glow-center)" />
                      <text x="130" y="131" text-anchor="middle" dominant-baseline="central"
                        font-size="16" class="eco-graph__center-icon">
                        {ICON[selectedEntity.icon] || '•'}
                      </text>
                    </g>

                    <!-- Tooltip -->
                    {#if hoveredGraphIdx !== null && graphNodes()[hoveredGraphIdx]}
                      {@const node = graphNodes()[hoveredGraphIdx]}
                      {@const tipText = node.entity ? node.entity.name : node.label}
                      {@const tipW = Math.min(tipText.length * 6.5 + 16, 160)}
                      {@const tipX = Math.max(tipW / 2, Math.min(node.x, 260 - tipW / 2))}
                      {@const tipY = node.y - 30}
                      <g pointer-events="none">
                        <rect x={tipX - tipW / 2} y={tipY - 11} width={tipW} height="22" rx="5"
                          fill="var(--eco-nebula)" stroke="var(--eco-border)" opacity="0.95" />
                        <text x={tipX} y={tipY + 1} text-anchor="middle" dominant-baseline="central"
                          font-size="10" font-weight="600" fill="var(--eco-text)">{tipText}</text>
                      </g>
                    {/if}
                  </svg>
                </div>
              </div>
            {/if}
          </div>

          <!-- Footer links -->
          {#if selectedEntity.url && selectedEntity.public_link}
            <div class="eco-detail__footer">
              <a class="eco-detail__cta" href={selectedEntity.url} target="_blank" rel="noopener">
                Visit {selectedEntity.name} ↗
              </a>
            </div>
          {/if}
        </div>
      {/if}
    </div>
  {/if}

  <!-- Stats -->
  <div class="eco-block__stats" bind:this={statsRef}>
    <span class="eco-stat">
      <span class="eco-stat__value">{displayApps}</span>
      <span class="eco-stat__label">apps online</span>
    </span>
    <span class="eco-block__dot">·</span>
    <span class="eco-stat">
      <span class="eco-stat__value">{displayHealth}%</span>
      <span class="eco-stat__label">system health</span>
    </span>
    <span class="eco-block__dot">·</span>
    <span class="eco-stat">
      <span class="eco-stat__value">{displayPrograms}</span>
      <span class="eco-stat__label">programs active</span>
    </span>
  </div>

  <!-- Pulse bar -->
  <div class="eco-block__pulse-bar"></div>
</div>

<style>
  /* ---- Tokens ---- */
  .eco-block {
    --eco-deep-space: #0a0a14;
    --eco-cosmos: #12121f;
    --eco-nebula: #1a1a2e;
    --eco-nebula-purple: #4a1a6b;
    --eco-magenta: #9b3d8f;
    --eco-success: #2dd4bf;
    --eco-warning: #d4782c;
    --eco-error: #e85d75;
    --eco-info: #9b3d8f;
    --eco-dim: #6b6780;
    --eco-stardust: #e8e4f0;
    --eco-moonlight: #a8a4b8;
    --eco-accent: #2dd4bf;
    --eco-bg: var(--bg-primary, var(--eco-deep-space));
    --eco-bg-card: var(--bg-card, var(--eco-cosmos));
    --eco-bg-hover: var(--bg-tertiary, var(--eco-nebula));
    --eco-text: var(--text-primary, var(--eco-stardust));
    --eco-text-muted: var(--text-secondary, var(--eco-moonlight));
    --eco-border: var(--border-color, rgba(107, 103, 128, 0.2));
    --eco-font-mono: 'JetBrains Mono', 'Fira Code', monospace;
    --eco-duration: 250ms;
    --eco-ease: cubic-bezier(0, 0, 0.2, 1);

    background: var(--eco-bg);
    border-radius: 16px;
    padding: 24px;
    max-width: 800px;
    margin: 0 auto;
    color: var(--eco-text);
    font-family: inherit;
  }

  /* ---- Animations ---- */
  @keyframes pulse-breathe {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }
  @keyframes pulse-bar {
    0% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
  }
  @keyframes line-pulse-flow {
    0% { opacity: 0.6; }
    50% { opacity: 0.2; }
    100% { opacity: 0.6; }
  }
  @keyframes detail-expand {
    from { opacity: 0; max-height: 0; }
    to { opacity: 1; max-height: 2000px; }
  }

  :global(.eco-pulse--breathe) {
    animation: pulse-breathe 3s ease-in-out infinite;
  }

  @media (prefers-reduced-motion: reduce) {
    :global(.eco-pulse--breathe) { animation: none; }
    .eco-block__pulse-bar { animation: none; }
    .eco-graph__line-pulse { animation: none; opacity: 0; }
  }

  /* ---- Header ---- */
  .eco-block__header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 20px;
  }
  .eco-block__star {
    font-size: 18px;
    color: var(--eco-accent);
  }
  .eco-block__title {
    font-size: 16px;
    font-weight: 700;
    flex: 1;
  }
  .eco-block__viewall {
    font-size: 12px;
    color: var(--eco-accent);
    text-decoration: none;
    opacity: 0.8;
    transition: opacity var(--eco-duration);
  }
  .eco-block__viewall:hover { opacity: 1; }

  /* ---- Category Rings ---- */
  .eco-block__rings {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    justify-content: center;
    margin-bottom: 16px;
  }
  .eco-ring {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    padding: 12px 14px;
    border-radius: 12px;
    border: 1px solid var(--eco-border);
    background: var(--eco-bg-card);
    cursor: pointer;
    transition: all var(--eco-duration) var(--eco-ease);
    min-width: 72px;
    color: var(--eco-text);
    font-family: inherit;
    font-size: inherit;
  }
  .eco-ring:hover, .eco-ring--expanded {
    background: var(--eco-bg-hover);
    border-color: var(--ring-color, var(--eco-accent));
    box-shadow: 0 0 12px color-mix(in srgb, var(--ring-color, var(--eco-accent)) 30%, transparent);
  }
  .eco-ring__icon { font-size: 20px; line-height: 1; }
  .eco-ring__label {
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: var(--eco-text-muted);
  }
  .eco-ring__count {
    font-size: 16px;
    font-weight: 700;
    font-family: var(--eco-font-mono);
    color: var(--ring-color, var(--eco-accent));
  }
  .eco-ring__dots {
    display: flex;
    gap: 3px;
    min-height: 5px;
  }

  /* ---- Entity Cards ---- */
  .eco-block__expanded {
    padding: 12px 0;
    border-top: 1px solid var(--eco-border);
    border-bottom: 1px solid var(--eco-border);
    margin-bottom: 16px;
  }
  .eco-block__grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
    gap: 8px;
  }
  .eco-card {
    display: flex;
    flex-direction: column;
    gap: 4px;
    padding: 10px 12px;
    border-radius: 8px;
    border: 1px solid var(--eco-border);
    background: var(--eco-bg-card);
    text-align: left;
    color: var(--eco-text);
    cursor: pointer;
    font-family: inherit;
    font-size: inherit;
    transition: all var(--eco-duration) var(--eco-ease);
    position: relative;
  }
  .eco-card--compact { padding: 8px 10px; }
  .eco-card:hover {
    border-color: var(--card-color, var(--eco-accent));
    background: var(--eco-bg-hover);
    box-shadow: 0 2px 8px color-mix(in srgb, var(--card-color, var(--eco-accent)) 15%, transparent);
  }
  .eco-card--selected {
    border-color: var(--card-color, var(--eco-accent));
    background: var(--eco-bg-hover);
    box-shadow: 0 0 16px color-mix(in srgb, var(--card-color, var(--eco-accent)) 25%, transparent);
  }
  .eco-card__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .eco-card__icon { font-size: 16px; line-height: 1; }
  .eco-card__name { font-size: 13px; font-weight: 600; }
  .eco-card__badge {
    position: absolute;
    top: 6px;
    right: 6px;
    font-size: 9px;
    font-weight: 700;
    padding: 1px 4px;
    border-radius: 3px;
    background: var(--eco-nebula-purple);
    color: var(--eco-stardust);
    letter-spacing: 0.5px;
  }

  /* ---- Detail Panel ---- */
  .eco-detail {
    margin-top: 12px;
    padding: 20px;
    border-radius: 12px;
    border: 1px solid var(--detail-color, var(--eco-accent));
    background: var(--eco-bg-card);
    box-shadow: 0 4px 20px color-mix(in srgb, var(--detail-color, var(--eco-accent)) 10%, transparent);
    position: relative;
    animation: detail-expand 300ms var(--eco-ease) forwards;
    overflow: hidden;
  }
  .eco-detail__close {
    position: absolute;
    top: 12px; right: 12px;
    width: 28px; height: 28px;
    border-radius: 50%;
    border: 1px solid var(--eco-border);
    background: var(--eco-bg);
    color: var(--eco-text-muted);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 14px;
    font-family: inherit;
    transition: all var(--eco-duration);
  }
  .eco-detail__close:hover {
    border-color: var(--detail-color, var(--eco-accent));
    color: var(--eco-text);
  }
  .eco-detail__header {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 16px;
    padding-right: 36px;
  }
  .eco-detail__icon { font-size: 28px; line-height: 1; }
  .eco-detail__title-area { flex: 1; min-width: 0; }
  .eco-detail__name {
    font-size: 18px;
    font-weight: 700;
    margin: 0;
  }
  .eco-detail__tagline {
    font-size: 13px;
    color: var(--eco-text-muted);
  }
  .eco-detail__status {
    display: flex;
    align-items: center;
    gap: 6px;
    flex-shrink: 0;
  }
  .eco-detail__status-label {
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: var(--eco-text-muted);
  }
  .eco-detail__body { margin-bottom: 16px; }
  .eco-detail__body--split {
    display: flex;
    gap: 20px;
    align-items: flex-start;
  }
  .eco-detail__content { flex: 1; min-width: 0; }
  .eco-detail__graph-area {
    flex-shrink: 0;
    width: 260px;
    display: flex;
    flex-direction: column;
    align-items: center;
  }
  .eco-detail__graph-label {
    font-size: 10px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 1px;
    color: var(--eco-dim);
    margin-bottom: 4px;
  }
  .eco-detail__summary {
    font-size: 14px;
    line-height: 1.6;
    margin: 0 0 12px 0;
  }
  .eco-detail__highlights {
    list-style: none;
    padding: 0;
    margin: 0 0 16px 0;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .eco-detail__highlights li {
    font-size: 13px;
    padding-left: 18px;
    position: relative;
  }
  .eco-detail__highlights li::before {
    content: '→';
    position: absolute;
    left: 0;
    color: var(--detail-color, var(--eco-accent));
  }
  .eco-detail__footer {
    display: flex;
    gap: 12px;
    padding-top: 12px;
    border-top: 1px solid var(--eco-border);
  }
  .eco-detail__cta {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 8px 16px;
    border-radius: 8px;
    background: var(--detail-color, var(--eco-accent));
    color: var(--eco-deep-space);
    font-size: 13px;
    font-weight: 700;
    text-decoration: none;
    transition: all var(--eco-duration);
  }
  .eco-detail__cta:hover {
    opacity: 0.9;
    box-shadow: 0 2px 12px color-mix(in srgb, var(--detail-color, var(--eco-accent)) 40%, transparent);
  }

  /* ---- Connection Graph ---- */
  .eco-graph { width: 100%; max-width: 280px; }
  .eco-graph__svg { overflow: visible; }
  .eco-graph__link { transition: stroke-opacity 200ms, stroke-width 200ms; }
  .eco-graph__line-pulse { animation: line-pulse-flow 2s ease-in-out infinite; }
  .eco-graph__node { transition: transform 200ms var(--eco-ease); }
  .eco-graph__node--clickable { cursor: pointer; }
  .eco-graph__node--clickable:hover circle { stroke-width: 2.5; }
  .eco-graph__node-icon,
  .eco-graph__node-label,
  .eco-graph__center-icon { pointer-events: none; user-select: none; }
  .eco-graph__node-label { font-family: inherit; }
  .eco-graph__center { pointer-events: none; }

  /* ---- Stats ---- */
  .eco-block__stats {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    margin-bottom: 12px;
  }
  .eco-block__dot { color: var(--eco-dim); font-size: 10px; }
  .eco-stat { display: inline-flex; align-items: baseline; gap: 4px; font-size: 13px; }
  .eco-stat__value {
    font-weight: 700;
    font-size: 16px;
    font-family: var(--eco-font-mono);
    color: var(--eco-accent);
  }
  .eco-stat__label {
    color: var(--eco-text-muted);
    font-size: 12px;
  }

  /* ---- Pulse Bar ---- */
  .eco-block__pulse-bar {
    height: 2px;
    border-radius: 1px;
    background: linear-gradient(90deg, var(--eco-accent), var(--eco-magenta), var(--eco-warning), var(--eco-accent));
    background-size: 200% 100%;
    animation: pulse-bar 4s ease-in-out infinite;
  }

  /* ---- Responsive ---- */
  @media (max-width: 640px) {
    .eco-block__rings { gap: 6px; }
    .eco-ring { min-width: 60px; padding: 8px 10px; }
    .eco-ring__icon { font-size: 16px; }
    .eco-ring__label { font-size: 9px; }
    .eco-ring__count { font-size: 14px; }
    .eco-block__grid { grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); }
    .eco-block__stats { flex-wrap: wrap; gap: 4px; }
    .eco-detail { padding: 16px; }
    .eco-detail__header { flex-wrap: wrap; }
    .eco-detail__body--split { flex-direction: column; }
    .eco-detail__graph-area { width: 100%; max-width: 260px; align-self: center; }
  }
</style>
