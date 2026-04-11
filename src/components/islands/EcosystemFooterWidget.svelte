<script>
  /** @type {{ data: any }} */
  let { data } = $props();

  let selectedEntity = $state(null);
  let hoveredGraphIdx = $state(null);
  let searchQuery = $state('');
  let sidebarCollapsed = $state(false);

  const categories = $derived(data?.categories ?? []);
  const entities = $derived(data?.entities ?? []);
  const summary = $derived(data?.summary ?? {});

  // All categories and statuses active by default
  let activeCategories = $state(new Set());
  let activeStatuses = $state(new Set(['production', 'active', 'alpha', 'building', 'planning', 'standby']));

  // Initialize categories on first render
  $effect(() => {
    if (categories.length > 0 && activeCategories.size === 0) {
      activeCategories = new Set(categories.map(c => c.id));
    }
  });

  const STATUS_OPTIONS = [
    { value: 'production', label: 'Live', dot: '●' },
    { value: 'active', label: 'Active', dot: '●' },
    { value: 'alpha', label: 'Alpha', dot: '◐' },
    { value: 'building', label: 'Building', dot: '◔' },
    { value: 'planning', label: 'Planned', dot: '○' },
  ];

  // Filter and group entities
  const filtered = $derived(() => {
    const q = searchQuery.toLowerCase();
    return entities
      .filter(e => activeCategories.has(e.category))
      .filter(e => activeStatuses.has(e.status))
      .filter(e => !q || e.name.toLowerCase().includes(q) || (e.tagline || '').toLowerCase().includes(q))
      .sort((a, b) => {
        const catA = categories.findIndex(c => c.id === a.category);
        const catB = categories.findIndex(c => c.id === b.category);
        if (catA !== catB) return catA - catB;
        return (a.sort_order ?? 99) - (b.sort_order ?? 99);
      });
  });

  const grouped = $derived(() => {
    const groups = {};
    for (const entity of filtered()) {
      if (!groups[entity.category]) groups[entity.category] = [];
      groups[entity.category].push(entity);
    }
    return groups;
  });

  // Connection graph for selected entity
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
      return { label: name, entity: resolved || null, x: cx + Math.cos(angle) * radius, y: cy + Math.sin(angle) * radius };
    });
  });

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
    const next = new Set(activeCategories);
    if (next.has(id)) next.delete(id); else next.add(id);
    activeCategories = next;
  }

  function toggleStatus(val) {
    const next = new Set(activeStatuses);
    if (next.has(val)) next.delete(val); else next.add(val);
    activeStatuses = next;
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

  // Animated stat counters
  let statsVisible = $state(false);
  let displayEntities = $state(0);
  let displayApps = $state(0);
  let displayHealth = $state(0);

  function animateCounters() {
    if (statsVisible) return;
    statsVisible = true;
    const targets = { entities: summary.total_entities ?? 0, apps: summary.apps_online ?? 0, health: summary.system_health_pct ?? 0 };
    const start = performance.now();
    const dur = 1000;
    function tick(now) {
      const p = Math.min((now - start) / dur, 1);
      const e = 1 - Math.pow(1 - p, 3);
      displayEntities = Math.round(targets.entities * e);
      displayApps = Math.round(targets.apps * e);
      displayHealth = Math.round(targets.health * e);
      if (p < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  let headerRef = $state(null);
  $effect(() => {
    if (!headerRef) return;
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) animateCounters();
    }, { threshold: 0.3 });
    io.observe(headerRef);
    return () => io.disconnect();
  });
</script>

<div class="eco-page">
  <!-- Header -->
  <div class="eco-page__header" bind:this={headerRef}>
    <span class="eco-page__star">✦</span>
    <span class="eco-page__title">The Quietly Working Universe</span>
    <div class="eco-page__summary">
      <span class="eco-stat">
        <span class="eco-stat__value">{displayEntities}</span>
        <span class="eco-stat__label">entities</span>
      </span>
      <span class="eco-stat">
        <span class="eco-stat__value">{displayApps}</span>
        <span class="eco-stat__label">apps online</span>
      </span>
      <span class="eco-stat">
        <span class="eco-stat__value">{displayHealth}%</span>
        <span class="eco-stat__label">health</span>
      </span>
    </div>
  </div>

  <div class="eco-page__body">
    <!-- Sidebar -->
    <aside class="eco-filter" class:eco-filter--collapsed={sidebarCollapsed}>
      <button class="eco-filter__toggle" onclick={() => sidebarCollapsed = !sidebarCollapsed}
        aria-label={sidebarCollapsed ? 'Show filters' : 'Hide filters'}>
        {sidebarCollapsed ? '›' : '‹'}
      </button>

      {#if !sidebarCollapsed}
        <div class="eco-filter__search">
          <input type="text" placeholder="Search..." bind:value={searchQuery} class="eco-filter__input" />
        </div>

        <div class="eco-filter__section">
          <div class="eco-filter__heading">Categories</div>
          {#each categories as cat}
            <label class="eco-filter__option">
              <input type="checkbox" checked={activeCategories.has(cat.id)} onchange={() => toggleCategory(cat.id)} />
              <span style="color: {cat.color}">{cat.label}</span>
              <span class="eco-filter__count">{cat.count}</span>
            </label>
          {/each}
        </div>

        <div class="eco-filter__section">
          <div class="eco-filter__heading">Status</div>
          {#each STATUS_OPTIONS as opt}
            <label class="eco-filter__option">
              <input type="checkbox" checked={activeStatuses.has(opt.value)} onchange={() => toggleStatus(opt.value)} />
              <span>{opt.dot} {opt.label}</span>
            </label>
          {/each}
        </div>
      {/if}
    </aside>

    <!-- Main content -->
    <main class="eco-page__content">
      {#each Object.entries(grouped()) as [catId, catEntities]}
        {@const catDef = categories.find(c => c.id === catId)}
        <section class="eco-page__section">
          <h2 class="eco-page__section-title" style="color: {catDef?.color || 'inherit'}">
            {catDef?.label || catId}
            <span class="eco-page__section-count">{catEntities.length}</span>
          </h2>
          <div class="eco-page__grid">
            {#each catEntities as entity}
              <button
                class="eco-card"
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
                <div class="eco-card__tagline">{entity.tagline || ''}</div>
                {#if entity.student_training}
                  <span class="eco-card__badge" title="Student training component">MP</span>
                {/if}
              </button>
            {/each}
          </div>

          <!-- Detail panel renders inside its category section -->
          {#if selectedEntity && catEntities.some(e => e.id === selectedEntity.id)}
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

                        {#each graphNodes() as node, i}
                          <line x1="130" y1="130" x2={node.x} y2={node.y}
                            stroke={node.entity?.color || 'var(--eco-dim)'}
                            stroke-opacity={hoveredGraphIdx === i ? 0.8 : 0.25}
                            stroke-width={hoveredGraphIdx === i ? 2 : 1}
                            stroke-dasharray={node.entity ? 'none' : '4 3'}
                            class="eco-graph__link" />
                        {/each}

                        {#each graphNodes() as node, i}
                          <circle r="2" fill={node.entity?.color || 'var(--eco-dim)'} opacity="0.6" class="eco-graph__line-pulse">
                            <animateMotion dur="{2.5 + i * 0.3}s" repeatCount="indefinite" path="M130,130 L{node.x},{node.y}" />
                          </circle>
                        {/each}

                        {#each graphNodes() as node, i}
                          <!-- svelte-ignore a11y_no_static_element_interactions -->
                          <g class="eco-graph__node" class:eco-graph__node--clickable={!!node.entity}
                            onmouseenter={() => hoveredGraphIdx = i}
                            onmouseleave={() => hoveredGraphIdx = null}
                            onclick={() => { if (node.entity?.public_link && node.entity?.url) window.open(node.entity.url, '_blank', 'noopener'); }}
                            style="cursor: {node.entity ? 'pointer' : 'default'}">
                            <circle cx={node.x} cy={node.y} r={hoveredGraphIdx === i ? 20 : 16}
                              fill="var(--eco-bg-card)" stroke={node.entity?.color || 'var(--eco-dim)'}
                              stroke-width={hoveredGraphIdx === i ? 2.5 : 1.5}
                              filter={hoveredGraphIdx === i ? 'url(#glow-hover)' : undefined} />
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

                        <g class="eco-graph__center">
                          <circle cx="130" cy="130" r="26" fill="var(--eco-bg-card)"
                            stroke={selectedEntity.color} stroke-width="2.5" filter="url(#glow-center)" />
                          <text x="130" y="131" text-anchor="middle" dominant-baseline="central"
                            font-size="16" class="eco-graph__center-icon">
                            {ICON[selectedEntity.icon] || '•'}
                          </text>
                        </g>

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

              {#if selectedEntity.url && selectedEntity.public_link}
                <div class="eco-detail__footer">
                  <a class="eco-detail__cta" href={selectedEntity.url} target="_blank" rel="noopener">
                    Visit {selectedEntity.name} ↗
                  </a>
                </div>
              {/if}
            </div>
          {/if}
        </section>
      {/each}

      {#if filtered().length === 0}
        <div class="eco-page__empty">No entities match your filters.</div>
      {/if}
    </main>
  </div>

  <!-- Pulse bar -->
  <div class="eco-block__pulse-bar"></div>
</div>

<style>
  /* ---- Tokens ---- */
  .eco-page {
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
  .eco-page__header {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 24px;
    flex-wrap: wrap;
  }
  .eco-page__star { font-size: 24px; color: var(--eco-accent); }
  .eco-page__title { font-size: 20px; font-weight: 700; flex: 1; min-width: 200px; }
  .eco-page__summary { display: flex; gap: 16px; }

  /* ---- Stats ---- */
  .eco-stat { display: inline-flex; align-items: baseline; gap: 4px; font-size: 13px; }
  .eco-stat__value {
    font-weight: 700;
    font-size: 16px;
    font-family: var(--eco-font-mono);
    color: var(--eco-accent);
  }
  .eco-stat__label { color: var(--eco-text-muted); font-size: 12px; }

  /* ---- Body ---- */
  .eco-page__body { display: flex; gap: 20px; }
  .eco-page__content { flex: 1; min-width: 0; }

  /* ---- Sidebar ---- */
  .eco-filter {
    width: 200px;
    flex-shrink: 0;
    border-right: 1px solid var(--eco-border);
    padding-right: 16px;
    position: relative;
  }
  .eco-filter--collapsed { width: 32px; padding-right: 0; border-right: none; }
  .eco-filter__toggle {
    position: absolute;
    top: 0; right: -12px;
    width: 24px; height: 24px;
    border-radius: 50%;
    border: 1px solid var(--eco-border);
    background: var(--eco-bg-card);
    color: var(--eco-text-muted);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    font-family: inherit;
    z-index: 1;
  }
  .eco-filter__search { margin-bottom: 16px; }
  .eco-filter__input {
    width: 100%;
    padding: 6px 10px;
    border-radius: 6px;
    border: 1px solid var(--eco-border);
    background: var(--eco-bg-card);
    color: var(--eco-text);
    font-size: 13px;
    font-family: inherit;
    outline: none;
  }
  .eco-filter__input:focus { border-color: var(--eco-accent); }
  .eco-filter__section { margin-bottom: 16px; }
  .eco-filter__heading {
    font-size: 10px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 1px;
    color: var(--eco-dim);
    margin-bottom: 8px;
  }
  .eco-filter__option {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    cursor: pointer;
    padding: 3px 0;
    color: var(--eco-text);
  }
  .eco-filter__option input[type="checkbox"] { accent-color: var(--eco-accent); }
  .eco-filter__count { margin-left: auto; color: var(--eco-dim); font-size: 11px; }

  /* ---- Category Sections ---- */
  .eco-page__section { margin-bottom: 24px; }
  .eco-page__section-title {
    font-size: 14px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 1px;
    margin: 0 0 12px 0;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .eco-page__section-count { font-size: 11px; font-weight: 400; color: var(--eco-dim); }
  .eco-page__grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 10px;
  }
  .eco-page__empty {
    text-align: center;
    color: var(--eco-dim);
    padding: 48px 24px;
    font-size: 14px;
  }

  /* ---- Entity Cards ---- */
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
  .eco-card__tagline { font-size: 11px; color: var(--eco-text-muted); line-height: 1.3; }
  .eco-card__badge {
    position: absolute;
    top: 6px; right: 6px;
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
  .eco-detail__name { font-size: 18px; font-weight: 700; margin: 0; }
  .eco-detail__tagline { font-size: 13px; color: var(--eco-text-muted); }
  .eco-detail__status { display: flex; align-items: center; gap: 6px; flex-shrink: 0; }
  .eco-detail__status-label {
    font-size: 11px; font-weight: 600;
    text-transform: uppercase; letter-spacing: 0.5px;
    color: var(--eco-text-muted);
  }
  .eco-detail__body { margin-bottom: 16px; }
  .eco-detail__body--split { display: flex; gap: 20px; align-items: flex-start; }
  .eco-detail__content { flex: 1; min-width: 0; }
  .eco-detail__graph-area {
    flex-shrink: 0; width: 260px;
    display: flex; flex-direction: column; align-items: center;
  }
  .eco-detail__graph-label {
    font-size: 10px; font-weight: 700;
    text-transform: uppercase; letter-spacing: 1px;
    color: var(--eco-dim); margin-bottom: 4px;
  }
  .eco-detail__summary { font-size: 14px; line-height: 1.6; margin: 0 0 12px 0; }
  .eco-detail__highlights {
    list-style: none; padding: 0; margin: 0 0 16px 0;
    display: flex; flex-direction: column; gap: 6px;
  }
  .eco-detail__highlights li { font-size: 13px; padding-left: 18px; position: relative; }
  .eco-detail__highlights li::before {
    content: '→'; position: absolute; left: 0;
    color: var(--detail-color, var(--eco-accent));
  }
  .eco-detail__footer {
    display: flex; gap: 12px; padding-top: 12px;
    border-top: 1px solid var(--eco-border);
  }
  .eco-detail__cta {
    display: inline-flex; align-items: center; gap: 6px;
    padding: 8px 16px; border-radius: 8px;
    background: var(--detail-color, var(--eco-accent));
    color: var(--eco-deep-space);
    font-size: 13px; font-weight: 700;
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
  .eco-graph__node-icon, .eco-graph__node-label, .eco-graph__center-icon {
    pointer-events: none; user-select: none;
  }
  .eco-graph__node-label { font-family: inherit; }
  .eco-graph__center { pointer-events: none; }

  /* ---- Pulse Bar ---- */
  .eco-block__pulse-bar {
    height: 2px; border-radius: 1px; margin-top: 24px;
    background: linear-gradient(90deg, var(--eco-accent), var(--eco-magenta), var(--eco-warning), var(--eco-accent));
    background-size: 200% 100%;
    animation: pulse-bar 4s ease-in-out infinite;
  }

  /* ---- Responsive ---- */
  @media (max-width: 768px) {
    .eco-page__body { flex-direction: column; }
    .eco-filter {
      width: 100%; border-right: none;
      border-bottom: 1px solid var(--eco-border);
      padding-right: 0; padding-bottom: 16px;
    }
    .eco-filter__toggle { display: none; }
    .eco-page__grid { grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); }
    .eco-detail { padding: 16px; }
    .eco-detail__header { flex-wrap: wrap; }
    .eco-detail__body--split { flex-direction: column; }
    .eco-detail__graph-area { width: 100%; max-width: 260px; align-self: center; }
    .eco-page__summary { gap: 10px; }
  }
</style>
