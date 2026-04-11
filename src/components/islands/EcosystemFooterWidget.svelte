<script>
  /** @type {{ data: any }} */
  let { data } = $props();

  let selectedEntity = $state(null);
  let hoveredGraphIdx = $state(null);
  let searchQuery = $state('');
  let sidebarCollapsed = $state(false);
  let copyBtnText = $state('Copy');

  const categories = $derived(data?.categories ?? []);
  const entities = $derived(data?.entities ?? []);
  const summary = $derived(data?.summary ?? {});

  let activeCategories = $state(new Set());
  let activeStatuses = $state(new Set(['production', 'active', 'alpha', 'building', 'planning', 'standby']));

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

  const SOCIAL_ICONS = {
    instagram: { label: 'Instagram', base: 'https://instagram.com/', svg: 'M12 2.2c2.7 0 3 0 4.1.1 1 .1 1.5.2 1.9.4.5.2.8.4 1.1.7.3.3.6.7.7 1.1.2.4.3.9.4 1.9 0 1.1.1 1.4.1 4.1s0 3-.1 4.1c-.1 1-.2 1.5-.4 1.9-.2.5-.4.8-.7 1.1-.3.3-.7.6-1.1.7-.4.2-.9.3-1.9.4-1.1 0-1.4.1-4.1.1s-3 0-4.1-.1c-1-.1-1.5-.2-1.9-.4-.5-.2-.8-.4-1.1-.7-.3-.3-.6-.7-.7-1.1-.2-.4-.3-.9-.4-1.9 0-1.1-.1-1.4-.1-4.1s0-3 .1-4.1c.1-1 .2-1.5.4-1.9.2-.5.4-.8.7-1.1.3-.3.7-.6 1.1-.7.4-.2.9-.3 1.9-.4 1.1 0 1.4-.1 4.1-.1zm0-2.2C9.3 0 8.9 0 7.8.1c-1.2.1-2 .2-2.7.5C4.4.8 3.8 1.2 3.2 1.8 2.6 2.4 2.2 3 1.9 3.7c-.3.7-.5 1.5-.5 2.7C1.3 7.5 1.3 7.9 1.3 10.6v2.8c0 2.7 0 3.1.1 4.2.1 1.2.2 2 .5 2.7.3.7.7 1.3 1.3 1.9.6.6 1.2 1 1.9 1.3.7.3 1.5.5 2.7.5 1.1.1 1.5.1 4.2.1s3.1 0 4.2-.1c1.2-.1 2-.2 2.7-.5.7-.3 1.3-.7 1.9-1.3.6-.6 1-1.2 1.3-1.9.3-.7.5-1.5.5-2.7.1-1.1.1-1.5.1-4.2s0-3.1-.1-4.2c-.1-1.2-.2-2-.5-2.7-.3-.7-.7-1.3-1.3-1.9-.6-.6-1.2-1-1.9-1.3-.7-.3-1.5-.5-2.7-.5C15.1 0 14.7 0 12 0zm0 5.8a6.2 6.2 0 100 12.4 6.2 6.2 0 000-12.4zm0 10.2a4 4 0 110-8 4 4 0 010 8zm6.4-10.5a1.4 1.4 0 110-2.9 1.4 1.4 0 010 2.9z' },
    facebook: { label: 'Facebook', base: 'https://facebook.com/', svg: 'M24 12c0-6.6-5.4-12-12-12S0 5.4 0 12c0 6 4.4 11 10.1 11.9v-8.4H7.1V12h3V9.4c0-3 1.8-4.6 4.5-4.6 1.3 0 2.7.2 2.7.2v2.9h-1.5c-1.5 0-2 .9-2 1.9V12h3.3l-.5 3.5h-2.8v8.4C19.6 23 24 18 24 12z' },
    x: { label: 'X', base: 'https://x.com/', svg: 'M18.9 1.2h3.7l-8 9.2L24 22.8h-7.4l-5.8-7.6-6.6 7.6H.5l8.6-9.8L0 1.2h7.6l5.2 6.9 6.1-6.9zm-1.3 19.4h2L6.5 3.2H4.3l13.3 17.4z' },
    linkedin: { label: 'LinkedIn', base: 'https://linkedin.com/', svg: 'M20.4 20.5h-3.6v-5.6c0-1.3 0-3.1-1.9-3.1-1.9 0-2.1 1.5-2.1 2.9v5.7H9.3V9h3.4v1.6h.1c.5-.9 1.6-1.9 3.4-1.9 3.6 0 4.3 2.4 4.3 5.5v6.3zM5.3 7.4a2.1 2.1 0 110-4.2 2.1 2.1 0 010 4.2zM7.1 20.5H3.5V9h3.6v11.5zM22.2 0H1.8C.8 0 0 .8 0 1.7v20.5c0 1 .8 1.8 1.8 1.8h20.4c1 0 1.8-.8 1.8-1.8V1.7c0-1-.8-1.7-1.8-1.7z' },
    youtube: { label: 'YouTube', base: 'https://youtube.com/', svg: 'M23.5 6.2s-.2-1.7-.9-2.4c-.9-.9-1.8-.9-2.3-1C17 2.6 12 2.6 12 2.6s-5 0-8.3.2c-.5.1-1.4.1-2.3 1-.7.7-.9 2.4-.9 2.4S.2 8.2.2 10.1v1.8c0 1.9.3 3.9.3 3.9s.2 1.7.9 2.4c.9.9 2 .9 2.5 1 1.8.2 7.6.2 7.6.2s5 0 8.3-.3c.5-.1 1.4-.1 2.3-1 .7-.7.9-2.4.9-2.4s.2-1.9.2-3.9v-1.8c0-1.9-.2-3.8-.2-3.8zM9.5 15.6V8.4l6.3 3.6-6.3 3.6z' },
    tiktok: { label: 'TikTok', base: 'https://tiktok.com/', svg: 'M12.5.1h3.4c.3 2 1.3 3.4 3.5 3.7v3.5c-1.2-.1-2.4-.4-3.5-1.1v5c0 6.3-6.8 8.2-9.6 3.7-1.7-2.9-.7-8 5.6-8.2v3.6c-.5.1-1 .2-1.4.4-1.3.5-2 1.4-1.8 2.9.4 2.7 4.6 3.5 4.3-.7V.1h-.5z' },
  };

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

  const connections = $derived(selectedEntity?.detail?.connections ?? []);
  const graphNodes = $derived(() => {
    if (!connections.length) return [];
    const size = 260, cx = size / 2, cy = size / 2, radius = cx * 0.65;
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

  /**
   * Linkify — auto-link entity names and [markdown](links) in text.
   * Returns sanitized HTML string for use with {@html}.
   */
  function linkify(text) {
    if (!text) return '';
    // Build entity map sorted longest-first
    const entityMap = entities
      .filter(e => e.url || e.detail?.cta_url)
      .map(e => ({ name: e.name, url: e.url || e.detail?.cta_url }))
      .sort((a, b) => b.name.length - a.name.length);

    // Step 1: Parse markdown links [text](url)
    const segments = [];
    const mdRe = /\[([^\]]+)\]\(([^)]+)\)/g;
    let lastIdx = 0, m;
    while ((m = mdRe.exec(text)) !== null) {
      if (m.index > lastIdx) segments.push({ type: 'text', value: text.slice(lastIdx, m.index) });
      segments.push({ type: 'link', value: m[1], url: m[2] });
      lastIdx = m.index + m[0].length;
    }
    if (lastIdx < text.length) segments.push({ type: 'text', value: text.slice(lastIdx) });

    // Step 2: For text segments, auto-link entity names
    let html = '';
    for (const seg of segments) {
      if (seg.type === 'link') {
        html += `<a href="${esc(seg.url)}" target="_blank" rel="noopener" class="eco-inline-link">${esc(seg.value)}</a>`;
        continue;
      }
      let t = seg.value;
      const used = new Set();
      const matches = [];
      for (const { name, url } of entityMap) {
        let si = 0;
        while (true) {
          const idx = t.indexOf(name, si);
          if (idx === -1) break;
          const before = idx > 0 ? t[idx - 1] : ' ';
          const after = idx + name.length < t.length ? t[idx + name.length] : ' ';
          const wb = /[\s.,;:!?'"()\[\]—–\-]/.test(before) || idx === 0;
          const wa = /[\s.,;:!?'"()\[\]—–\-]/.test(after) || idx + name.length === t.length;
          if (wb && wa) {
            let overlap = false;
            for (let i = idx; i < idx + name.length; i++) { if (used.has(i)) { overlap = true; break; } }
            if (!overlap) {
              matches.push({ start: idx, end: idx + name.length, name, url });
              for (let i = idx; i < idx + name.length; i++) used.add(i);
            }
          }
          si = idx + 1;
        }
      }
      matches.sort((a, b) => a.start - b.start);
      let pos = 0;
      for (const em of matches) {
        if (em.start > pos) html += esc(t.slice(pos, em.start));
        html += `<a href="${esc(em.url)}" target="_blank" rel="noopener" class="eco-inline-link eco-inline-link--entity">${esc(em.name)}</a>`;
        pos = em.end;
      }
      if (pos < t.length) html += esc(t.slice(pos));
    }
    return html;
  }

  function esc(s) {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

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
    copyBtnText = 'Copy';
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

  const STATUS_LABEL = { production: 'Live', active: 'Active', alpha: 'Alpha', building: 'Building', planning: 'Planned', standby: 'Standby' };

  function copyBoilerplate(text) {
    navigator.clipboard.writeText(text);
    copyBtnText = 'Copied!';
    setTimeout(() => { copyBtnText = 'Copy'; }, 2000);
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

          <!-- Detail panel -->
          {#if selectedEntity && catEntities.some(e => e.id === selectedEntity.id)}
            {@const detail = selectedEntity.detail}
            {@const media = detail?.media}
            <div class="eco-detail" style="--detail-color: {selectedEntity.color}">
              <button class="eco-detail__close" onclick={() => selectedEntity = null}>✕</button>

              <div class="eco-detail__header">
                <span class="eco-detail__icon">{ICON[selectedEntity.icon] || '•'}</span>
                <div class="eco-detail__title-area">
                  <h4 class="eco-detail__name">{selectedEntity.name}</h4>
                  <div class="eco-detail__tagline">{@html linkify(selectedEntity.tagline)}</div>
                </div>
                <div class="eco-detail__status">
                  <span class="eco-pulse" class:eco-pulse--breathe={isLive(selectedEntity.status)} style="
                    width: 8px; height: 8px; border-radius: 50%;
                    background: {statusColor(selectedEntity.status)}; display: inline-block;
                    box-shadow: {isLive(selectedEntity.status) ? '0 0 8px ' + statusColor(selectedEntity.status) : 'none'};
                  "></span>
                  <span class="eco-detail__status-label">{STATUS_LABEL[selectedEntity.status] || selectedEntity.status}</span>
                </div>
              </div>

              <div class="eco-detail__body" class:eco-detail__body--split={connections.length > 0}>
                <div class="eco-detail__content">
                  {#if detail?.logo_url}
                    <div class="eco-detail__logo">
                      <img src={detail.logo_url} alt="{selectedEntity.name} logo" loading="lazy" />
                    </div>
                  {/if}

                  {#if detail?.summary}
                    <p class="eco-detail__summary">{@html linkify(detail.summary)}</p>
                  {:else if selectedEntity.description}
                    <p class="eco-detail__summary">{@html linkify(selectedEntity.description)}</p>
                  {/if}

                  {#if detail?.highlights?.length}
                    <ul class="eco-detail__highlights">
                      {#each detail.highlights as hl}
                        <li>{@html linkify(hl)}</li>
                      {/each}
                    </ul>
                  {/if}

                  {#if detail?.diagram_url}
                    <div class="eco-detail__diagram">
                      <img src={detail.diagram_url} alt="{selectedEntity.name} diagram" loading="lazy" />
                    </div>
                  {/if}

                  <!-- Live metrics -->
                  {#if selectedEntity.live}
                    <div class="eco-detail__metrics">
                      {#if selectedEntity.live.uptime_pct != null}
                        <div class="eco-detail__metric">
                          <span class="eco-detail__metric-value">{selectedEntity.live.uptime_pct}%</span>
                          <span class="eco-detail__metric-label">uptime</span>
                        </div>
                      {/if}
                      {#if selectedEntity.live.health}
                        <div class="eco-detail__metric">
                          <span class="eco-pulse eco-pulse--breathe" style="
                            width: 8px; height: 8px; border-radius: 50%; display: inline-block;
                            background: {statusColor(selectedEntity.status)};
                            box-shadow: 0 0 8px {statusColor(selectedEntity.status)};
                          "></span>
                          <span class="eco-detail__metric-label">{selectedEntity.live.health}</span>
                        </div>
                      {/if}
                      {#if selectedEntity.live.success_rate != null}
                        <div class="eco-detail__metric">
                          <span class="eco-detail__metric-value">{selectedEntity.live.success_rate}%</span>
                          <span class="eco-detail__metric-label">success</span>
                        </div>
                      {/if}
                    </div>
                  {/if}

                  <!-- MP Training badge -->
                  {#if selectedEntity.student_training}
                    <div class="eco-detail__badge-area">
                      <span class="eco-detail__mp-badge">Missing Pixel Training Ground</span>
                    </div>
                  {/if}

                  <!-- Media Kit -->
                  {#if media}
                    <div class="eco-media">
                      <div class="eco-media__divider"></div>
                      <div class="eco-media__header">Media Kit</div>

                      {#if media.logos?.length}
                        <div class="eco-media__logos">
                          <div class="eco-media__section-label">Logos</div>
                          <div class="eco-media__logo-grid">
                            {#each media.logos as asset}
                              <a class="eco-media__logo-item" href={asset.url}
                                download={asset.url.split('/').pop() || asset.label}
                                rel="noopener" title="Download {asset.label}">
                                <img src={asset.url} alt={asset.label} loading="lazy" />
                                <span class="eco-media__logo-meta">
                                  {asset.label}
                                  <span class="eco-media__logo-format">{asset.format}</span>
                                </span>
                              </a>
                            {/each}
                          </div>
                        </div>
                      {/if}

                      {#if media.social && Object.keys(media.social).length > 0}
                        <div class="eco-media__social">
                          <div class="eco-media__section-label">Social</div>
                          <div class="eco-media__social-row">
                            {#each Object.entries(media.social) as [platform, handle]}
                              {#if SOCIAL_ICONS[platform] && handle}
                                {@const info = SOCIAL_ICONS[platform]}
                                <a class="eco-media__social-link"
                                  href="{info.base}{handle.replace(/^[@/]+/, '')}"
                                  target="_blank" rel="noopener" title="{info.label}: {handle}">
                                  <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                                    <path d={info.svg}></path>
                                  </svg>
                                  <span>{handle}</span>
                                </a>
                              {/if}
                            {/each}
                          </div>
                        </div>
                      {/if}

                      {#if media.boilerplate}
                        <div class="eco-media__boilerplate">
                          <div class="eco-media__section-label">Boilerplate</div>
                          <div class="eco-media__boilerplate-text">{media.boilerplate}</div>
                          <button class="eco-media__copy-btn" onclick={() => copyBoilerplate(media.boilerplate)}>
                            {copyBtnText}
                          </button>
                        </div>
                      {/if}
                    </div>
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

              <!-- Footer with CTA + visit link -->
              <div class="eco-detail__footer">
                {#if detail?.cta_label && detail?.cta_url}
                  <a class="eco-detail__cta" href={detail.cta_url} target="_blank" rel="noopener">
                    {detail.cta_label}
                  </a>
                {/if}
                {#if selectedEntity.public_link && selectedEntity.url}
                  <a class="eco-detail__link" href={selectedEntity.url} target="_blank" rel="noopener">
                    Visit {selectedEntity.name} →
                  </a>
                {/if}
              </div>
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
    padding: 24px;
    color: var(--eco-text);
    font-family: inherit;
  }

  /* ---- Animations ---- */
  @keyframes pulse-breathe { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
  @keyframes pulse-bar { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }
  @keyframes line-pulse-flow { 0% { opacity: 0.6; } 50% { opacity: 0.2; } 100% { opacity: 0.6; } }
  @keyframes detail-expand { from { opacity: 0; max-height: 0; } to { opacity: 1; max-height: 3000px; } }

  :global(.eco-pulse--breathe) { animation: pulse-breathe 3s ease-in-out infinite; }
  @media (prefers-reduced-motion: reduce) {
    :global(.eco-pulse--breathe) { animation: none; }
    .eco-block__pulse-bar { animation: none; }
    .eco-graph__line-pulse { animation: none; opacity: 0; }
  }

  /* ---- Inline Links (linkified entity names + markdown links) ---- */
  :global(.eco-inline-link) {
    color: var(--eco-accent, #2dd4bf);
    text-decoration: none;
    border-bottom: 1px solid transparent;
    transition: border-color 0.2s ease, color 0.2s ease;
  }
  :global(.eco-inline-link:hover) {
    border-bottom-color: var(--eco-accent, #2dd4bf);
    color: #5eead4;
  }
  :global(.eco-inline-link--entity) { color: var(--detail-color, var(--eco-accent, #2dd4bf)); }
  :global(.eco-inline-link--entity:hover) { border-bottom-color: var(--detail-color, var(--eco-accent, #2dd4bf)); }

  /* ---- Header ---- */
  .eco-page__header { display: flex; align-items: center; gap: 12px; margin-bottom: 24px; flex-wrap: wrap; }
  .eco-page__star { font-size: 24px; color: var(--eco-accent); }
  .eco-page__title { font-size: 20px; font-weight: 700; flex: 1; min-width: 200px; }
  .eco-page__summary { display: flex; gap: 16px; }

  /* ---- Stats ---- */
  .eco-stat { display: inline-flex; align-items: baseline; gap: 4px; font-size: 13px; }
  .eco-stat__value { font-weight: 700; font-size: 16px; font-family: var(--eco-font-mono); color: var(--eco-accent); }
  .eco-stat__label { color: var(--eco-text-muted); font-size: 12px; }

  /* ---- Body ---- */
  .eco-page__body { display: flex; gap: 20px; }
  .eco-page__content { flex: 1; min-width: 0; }

  /* ---- Sidebar ---- */
  .eco-filter { width: 200px; flex-shrink: 0; border-right: 1px solid var(--eco-border); padding-right: 16px; position: relative; }
  .eco-filter--collapsed { width: 32px; padding-right: 0; border-right: none; }
  .eco-filter__toggle { position: absolute; top: 0; right: -12px; width: 24px; height: 24px; border-radius: 50%; border: 1px solid var(--eco-border); background: var(--eco-bg-card); color: var(--eco-text-muted); cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 12px; font-family: inherit; z-index: 1; }
  .eco-filter__search { margin-bottom: 16px; }
  .eco-filter__input { width: 100%; padding: 6px 10px; border-radius: 6px; border: 1px solid var(--eco-border); background: var(--eco-bg-card); color: var(--eco-text); font-size: 13px; font-family: inherit; outline: none; }
  .eco-filter__input:focus { border-color: var(--eco-accent); }
  .eco-filter__section { margin-bottom: 16px; }
  .eco-filter__heading { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: var(--eco-dim); margin-bottom: 8px; }
  .eco-filter__option { display: flex; align-items: center; gap: 6px; font-size: 12px; cursor: pointer; padding: 3px 0; color: var(--eco-text); }
  .eco-filter__option input[type="checkbox"] { accent-color: var(--eco-accent); }
  .eco-filter__count { margin-left: auto; color: var(--eco-dim); font-size: 11px; }

  /* ---- Sections ---- */
  .eco-page__section { margin-bottom: 24px; }
  .eco-page__section-title { font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 12px 0; display: flex; align-items: center; gap: 8px; }
  .eco-page__section-count { font-size: 11px; font-weight: 400; color: var(--eco-dim); }
  .eco-page__grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 10px; }
  .eco-page__empty { text-align: center; color: var(--eco-dim); padding: 48px 24px; font-size: 14px; }

  /* ---- Entity Cards ---- */
  .eco-card { display: flex; flex-direction: column; gap: 4px; padding: 10px 12px; border-radius: 8px; border: 1px solid var(--eco-border); background: var(--eco-bg-card); text-align: left; color: var(--eco-text); cursor: pointer; font-family: inherit; font-size: inherit; transition: all var(--eco-duration) var(--eco-ease); position: relative; }
  .eco-card:hover { border-color: var(--card-color, var(--eco-accent)); background: var(--eco-bg-hover); box-shadow: 0 2px 8px color-mix(in srgb, var(--card-color, var(--eco-accent)) 15%, transparent); }
  .eco-card--selected { border-color: var(--card-color, var(--eco-accent)); background: var(--eco-bg-hover); box-shadow: 0 0 16px color-mix(in srgb, var(--card-color, var(--eco-accent)) 25%, transparent); }
  .eco-card__header { display: flex; align-items: center; justify-content: space-between; }
  .eco-card__icon { font-size: 16px; line-height: 1; }
  .eco-card__name { font-size: 13px; font-weight: 600; }
  .eco-card__tagline { font-size: 11px; color: var(--eco-text-muted); line-height: 1.3; }
  .eco-card__badge { position: absolute; top: 6px; right: 6px; font-size: 9px; font-weight: 700; padding: 1px 4px; border-radius: 3px; background: var(--eco-nebula-purple); color: var(--eco-stardust); letter-spacing: 0.5px; }

  /* ---- Detail Panel ---- */
  .eco-detail { margin-top: 12px; padding: 20px; border-radius: 12px; border: 1px solid var(--detail-color, var(--eco-accent)); background: var(--eco-bg-card); box-shadow: 0 4px 20px color-mix(in srgb, var(--detail-color, var(--eco-accent)) 10%, transparent); position: relative; animation: detail-expand 300ms var(--eco-ease) forwards; overflow: hidden; }
  .eco-detail__close { position: absolute; top: 12px; right: 12px; width: 28px; height: 28px; border-radius: 50%; border: 1px solid var(--eco-border); background: var(--eco-bg); color: var(--eco-text-muted); cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 14px; font-family: inherit; transition: all var(--eco-duration); }
  .eco-detail__close:hover { border-color: var(--detail-color, var(--eco-accent)); color: var(--eco-text); }
  .eco-detail__header { display: flex; align-items: center; gap: 12px; margin-bottom: 16px; padding-right: 36px; }
  .eco-detail__icon { font-size: 28px; line-height: 1; }
  .eco-detail__title-area { flex: 1; min-width: 0; }
  .eco-detail__name { font-size: 18px; font-weight: 700; margin: 0; }
  .eco-detail__tagline { font-size: 13px; color: var(--eco-text-muted); }
  .eco-detail__status { display: flex; align-items: center; gap: 6px; flex-shrink: 0; }
  .eco-detail__status-label { font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; color: var(--eco-text-muted); }
  .eco-detail__body { margin-bottom: 16px; }
  .eco-detail__body--split { display: flex; gap: 20px; align-items: flex-start; }
  .eco-detail__content { flex: 1; min-width: 0; }
  .eco-detail__graph-area { flex-shrink: 0; width: 260px; display: flex; flex-direction: column; align-items: center; }
  .eco-detail__graph-label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: var(--eco-dim); margin-bottom: 4px; }
  .eco-detail__logo { float: right; margin: 0 0 12px 16px; max-width: 120px; }
  .eco-detail__logo img { width: 100%; height: auto; border-radius: 8px; }
  .eco-detail__summary { font-size: 14px; line-height: 1.6; margin: 0 0 12px 0; }
  .eco-detail__highlights { list-style: none; padding: 0; margin: 0 0 16px 0; display: flex; flex-direction: column; gap: 6px; }
  .eco-detail__highlights li { font-size: 13px; padding-left: 18px; position: relative; }
  .eco-detail__highlights li::before { content: '→'; position: absolute; left: 0; color: var(--detail-color, var(--eco-accent)); }
  .eco-detail__diagram { margin: 16px 0; border-radius: 8px; overflow: hidden; }
  .eco-detail__diagram img { width: 100%; height: auto; }

  /* Metrics */
  .eco-detail__metrics { display: flex; gap: 16px; padding: 12px 0; border-top: 1px solid var(--eco-border); margin-bottom: 12px; }
  .eco-detail__metric { display: flex; align-items: center; gap: 6px; }
  .eco-detail__metric-value { font-size: 16px; font-weight: 700; font-family: var(--eco-font-mono); color: var(--detail-color, var(--eco-accent)); }
  .eco-detail__metric-label { font-size: 11px; color: var(--eco-text-muted); text-transform: uppercase; letter-spacing: 0.5px; }

  /* MP Badge */
  .eco-detail__badge-area { margin-bottom: 12px; }
  .eco-detail__mp-badge { display: inline-block; font-size: 10px; font-weight: 700; padding: 3px 8px; border-radius: 4px; background: var(--eco-nebula-purple); color: var(--eco-stardust); letter-spacing: 0.5px; text-transform: uppercase; }

  /* Footer */
  .eco-detail__footer { display: flex; gap: 12px; align-items: center; padding-top: 12px; border-top: 1px solid var(--eco-border); }
  .eco-detail__cta { display: inline-flex; align-items: center; gap: 6px; padding: 8px 16px; border-radius: 8px; background: var(--detail-color, var(--eco-accent)); color: var(--eco-deep-space); font-size: 13px; font-weight: 700; text-decoration: none; transition: all var(--eco-duration); }
  .eco-detail__cta:hover { opacity: 0.9; box-shadow: 0 2px 12px color-mix(in srgb, var(--detail-color, var(--eco-accent)) 40%, transparent); }
  .eco-detail__link { font-size: 13px; color: var(--detail-color, var(--eco-accent)); text-decoration: none; opacity: 0.8; transition: opacity var(--eco-duration); }
  .eco-detail__link:hover { opacity: 1; }

  /* ---- Media Kit ---- */
  .eco-media { margin-top: 16px; }
  .eco-media__divider { height: 1px; background: var(--eco-border); margin-bottom: 12px; }
  .eco-media__header { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px; color: var(--eco-text-muted); margin-bottom: 12px; }
  .eco-media__section-label { font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; color: var(--eco-text-muted); margin-bottom: 6px; }
  .eco-media__logos { margin-bottom: 14px; }
  .eco-media__logo-grid { display: flex; flex-wrap: wrap; gap: 8px; }
  .eco-media__logo-item { display: flex; flex-direction: column; align-items: center; gap: 4px; padding: 8px; border-radius: 8px; background: color-mix(in srgb, var(--eco-bg-card) 80%, white 3%); border: 1px solid var(--eco-border); text-decoration: none; color: var(--eco-text); transition: all var(--eco-duration); max-width: 120px; }
  .eco-media__logo-item:hover { border-color: var(--detail-color, var(--eco-accent)); box-shadow: 0 2px 8px color-mix(in srgb, var(--detail-color, var(--eco-accent)) 20%, transparent); }
  .eco-media__logo-item img { max-width: 96px; max-height: 48px; object-fit: contain; }
  .eco-media__logo-meta { font-size: 9px; text-align: center; line-height: 1.3; color: var(--eco-text-muted); }
  .eco-media__logo-format { display: inline-block; margin-left: 4px; padding: 1px 4px; border-radius: 3px; background: var(--eco-border); font-size: 8px; font-weight: 700; text-transform: uppercase; }
  .eco-media__social { margin-bottom: 14px; }
  .eco-media__social-row { display: flex; flex-wrap: wrap; gap: 6px; }
  .eco-media__social-link { display: inline-flex; align-items: center; gap: 5px; padding: 4px 10px; border-radius: 6px; background: color-mix(in srgb, var(--eco-bg-card) 80%, white 3%); border: 1px solid var(--eco-border); color: var(--eco-text-muted); font-size: 11px; text-decoration: none; transition: all var(--eco-duration); }
  .eco-media__social-link:hover { color: var(--eco-text); border-color: var(--detail-color, var(--eco-accent)); }
  .eco-media__social-link svg { flex-shrink: 0; opacity: 0.7; }
  .eco-media__social-link:hover svg { opacity: 1; }
  .eco-media__boilerplate { margin-bottom: 8px; }
  .eco-media__boilerplate-text { font-size: 12px; line-height: 1.5; color: var(--eco-text-muted); padding: 8px 10px; border-radius: 6px; background: color-mix(in srgb, var(--eco-bg-card) 80%, white 3%); border: 1px solid var(--eco-border); margin-bottom: 6px; }
  .eco-media__copy-btn { font-family: inherit; font-size: 10px; font-weight: 600; padding: 3px 10px; border-radius: 4px; border: 1px solid var(--eco-border); background: transparent; color: var(--eco-text-muted); cursor: pointer; transition: all var(--eco-duration); }
  .eco-media__copy-btn:hover { border-color: var(--detail-color, var(--eco-accent)); color: var(--eco-text); }

  /* ---- Connection Graph ---- */
  .eco-graph { width: 100%; max-width: 280px; }
  .eco-graph__svg { overflow: visible; }
  .eco-graph__link { transition: stroke-opacity 200ms, stroke-width 200ms; }
  .eco-graph__line-pulse { animation: line-pulse-flow 2s ease-in-out infinite; }
  .eco-graph__node { transition: transform 200ms var(--eco-ease); }
  .eco-graph__node--clickable { cursor: pointer; }
  .eco-graph__node--clickable:hover circle { stroke-width: 2.5; }
  .eco-graph__node-icon, .eco-graph__node-label, .eco-graph__center-icon { pointer-events: none; user-select: none; }
  .eco-graph__node-label { font-family: inherit; }
  .eco-graph__center { pointer-events: none; }

  /* ---- Pulse Bar ---- */
  .eco-block__pulse-bar { height: 2px; border-radius: 1px; margin-top: 24px; background: linear-gradient(90deg, var(--eco-accent), var(--eco-magenta), var(--eco-warning), var(--eco-accent)); background-size: 200% 100%; animation: pulse-bar 4s ease-in-out infinite; }

  /* ---- Responsive ---- */
  @media (max-width: 768px) {
    .eco-page__body { flex-direction: column; }
    .eco-filter { width: 100%; border-right: none; border-bottom: 1px solid var(--eco-border); padding-right: 0; padding-bottom: 16px; }
    .eco-filter__toggle { display: none; }
    .eco-page__grid { grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); }
    .eco-detail { padding: 16px; }
    .eco-detail__header { flex-wrap: wrap; }
    .eco-detail__body--split { flex-direction: column; }
    .eco-detail__graph-area { width: 100%; max-width: 260px; align-self: center; }
    .eco-detail__logo { float: none; margin: 0 0 12px 0; max-width: 80px; }
    .eco-detail__metrics { flex-wrap: wrap; gap: 8px; }
    .eco-detail__footer { flex-direction: column; align-items: stretch; }
    .eco-detail__cta { text-align: center; justify-content: center; }
    .eco-page__summary { gap: 10px; }
  }
</style>
