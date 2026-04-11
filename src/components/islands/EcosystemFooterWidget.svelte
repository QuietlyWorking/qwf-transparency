<script>
  /** @type {{ data: any }} */
  let { data } = $props();

  let activeCategory = $state(null);

  const categories = $derived(data?.categories ?? []);
  const entities = $derived(data?.entities ?? []);
  const summary = $derived(data?.summary ?? {});

  const activeEntities = $derived(
    activeCategory
      ? entities.filter(e => e.category === activeCategory).slice(0, 8)
      : []
  );

  function toggleCategory(id) {
    activeCategory = activeCategory === id ? null : id;
  }
</script>

<div class="ecosystem-widget">
  <div class="widget-header">
    <svg class="star-icon" width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M8 0L9.2 5.8L15 7L9.2 8.2L8 14L6.8 8.2L1 7L6.8 5.8Z" fill="currentColor" opacity="0.8"/>
      <path d="M13 1L13.5 3.5L16 4L13.5 4.5L13 7L12.5 4.5L10 4L12.5 3.5Z" fill="currentColor" opacity="0.5"/>
    </svg>
    <span class="widget-title">The Quietly Working Universe</span>
  </div>

  <div class="category-rings">
    {#each categories as cat}
      <button
        class="ring"
        class:active={activeCategory === cat.id}
        style="--ring-color: {cat.color}"
        onclick={() => toggleCategory(cat.id)}
        title="{cat.label}: {cat.count} total, {cat.live_count} live"
      >
        <span class="ring-count">{cat.count}</span>
        <span class="ring-label">{cat.label}</span>
      </button>
    {/each}
  </div>

  {#if activeCategory && activeEntities.length > 0}
    <div class="entity-list">
      {#each activeEntities as entity}
        <span class="entity-chip" class:live={entity.status === 'production' || entity.status === 'active'}>
          {#if entity.url && entity.public_link}
            <a href={entity.url} target="_blank" rel="noopener">{entity.name}</a>
          {:else}
            {entity.name}
          {/if}
        </span>
      {/each}
    </div>
  {/if}

  <div class="widget-stats">
    <span>{summary.apps_online} apps online</span>
    <span class="stat-sep">&middot;</span>
    <span>{summary.system_health_pct}% system health</span>
    <span class="stat-sep">&middot;</span>
    <span>{summary.programs_active} programs active</span>
  </div>

  <a href="/living-proof/" class="widget-link">
    Explore the full ecosystem &rarr;
  </a>
</div>

<style>
  .ecosystem-widget {
    background: var(--bg-card, #12121f);
    border: 1px solid var(--border-color, rgba(74, 26, 107, 0.4));
    border-radius: 0.75rem;
    padding: 1.5rem;
    text-align: center;
  }

  .widget-header {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    margin-bottom: 1.25rem;
  }

  .star-icon {
    color: var(--aurora-teal, #2dd4bf);
  }

  .widget-title {
    font-size: 0.85rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--text-secondary, #a8a4b8);
  }

  .category-rings {
    display: flex;
    justify-content: center;
    gap: 0.5rem;
    flex-wrap: wrap;
    margin-bottom: 1rem;
  }

  .ring {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.2rem;
    background: none;
    border: 2px solid var(--ring-color);
    border-radius: 50%;
    width: 3.5rem;
    height: 3.5rem;
    justify-content: center;
    cursor: pointer;
    transition: background 0.2s, transform 0.2s, box-shadow 0.2s;
    font-family: inherit;
  }

  .ring:hover {
    background: color-mix(in srgb, var(--ring-color) 15%, transparent);
    transform: scale(1.08);
  }

  .ring.active {
    background: color-mix(in srgb, var(--ring-color) 20%, transparent);
    box-shadow: 0 0 12px color-mix(in srgb, var(--ring-color) 40%, transparent);
    transform: scale(1.1);
  }

  .ring-count {
    font-size: 0.9rem;
    font-weight: 700;
    color: var(--ring-color);
    line-height: 1;
  }

  .ring-label {
    font-size: 0.55rem;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: var(--text-secondary, #a8a4b8);
    line-height: 1;
  }

  .entity-list {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 0.4rem;
    margin-bottom: 1rem;
    padding: 0.75rem;
    background: var(--bg-tertiary, #1a1a2e);
    border-radius: 0.5rem;
  }

  .entity-chip {
    font-size: 0.78rem;
    padding: 0.25rem 0.6rem;
    border-radius: 1rem;
    background: var(--bg-secondary, #12121f);
    border: 1px solid var(--border-color, rgba(74, 26, 107, 0.4));
    color: var(--text-secondary, #a8a4b8);
  }

  .entity-chip.live {
    border-color: var(--aurora-teal, #2dd4bf);
    color: var(--aurora-teal, #2dd4bf);
  }

  .entity-chip a {
    color: inherit;
    text-decoration: none;
  }

  .entity-chip a:hover {
    text-decoration: underline;
  }

  .widget-stats {
    font-size: 0.8rem;
    color: var(--dim-star, #6b6780);
    margin-bottom: 0.75rem;
  }

  .stat-sep {
    margin: 0 0.35rem;
  }

  .widget-link {
    font-size: 0.8rem;
    color: var(--aurora-teal, #2dd4bf);
    text-decoration: none;
    font-weight: 500;
  }

  .widget-link:hover {
    text-decoration: underline;
  }

  @media (max-width: 640px) {
    .ring {
      width: 3rem;
      height: 3rem;
    }

    .ring-count {
      font-size: 0.8rem;
    }

    .ring-label {
      font-size: 0.5rem;
    }

    .widget-stats {
      display: flex;
      flex-direction: column;
      gap: 0.2rem;
    }

    .stat-sep {
      display: none;
    }
  }
</style>
