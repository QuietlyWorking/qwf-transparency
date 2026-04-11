<script>
  /** @type {{ data: any }} */
  let { data } = $props();

  let activeCategory = $state('all');

  const summary = $derived(data?.summary);
  const categories = $derived(data?.categories ?? []);
  const entities = $derived(data?.entities ?? []);

  const filtered = $derived(
    activeCategory === 'all'
      ? entities
      : entities.filter(e => e.category === activeCategory)
  );

  const sorted = $derived(
    [...filtered].sort((a, b) => {
      const statusOrder = { production: 0, active: 1, alpha: 2, building: 3, planning: 4, standby: 5 };
      return (statusOrder[a.status] ?? 99) - (statusOrder[b.status] ?? 99);
    })
  );

  const statusColors = {
    production: 'var(--aurora-teal, #2dd4bf)',
    active: 'var(--color-success, #2dd4bf)',
    alpha: 'var(--stellar-orange, #d4782c)',
    building: 'var(--cosmic-magenta, #9b3d8f)',
    planning: 'var(--dim-star, #6b6780)',
    standby: 'var(--dim-star, #6b6780)',
  };
</script>

{#if summary}
<div class="ecosystem">
  <!-- Health summary -->
  <div class="health-row">
    <div class="health-card">
      <span class="health-value">{summary.system_health_pct}%</span>
      <span class="health-label">System Health</span>
    </div>
    <div class="health-card">
      <span class="health-value">{summary.total_entities}</span>
      <span class="health-label">Entities</span>
    </div>
    <div class="health-card">
      <span class="health-value">{summary.apps_online}</span>
      <span class="health-label">Apps Online</span>
    </div>
    <div class="health-card">
      <span class="health-value">{summary.supervisor_success_pct}%</span>
      <span class="health-label">Supervisor Success</span>
    </div>
  </div>

  <!-- Category filter -->
  <div class="filters">
    <button
      class="filter-btn"
      class:active={activeCategory === 'all'}
      onclick={() => activeCategory = 'all'}
    >
      All ({entities.length})
    </button>
    {#each categories as cat}
      <button
        class="filter-btn"
        class:active={activeCategory === cat.id}
        onclick={() => activeCategory = cat.id}
        style="--cat-color: {cat.color}"
      >
        {cat.label} ({cat.count})
      </button>
    {/each}
  </div>

  <!-- Entity grid -->
  <div class="entity-grid">
    {#each sorted as entity}
      <div class="entity-card">
        <div class="entity-header">
          <span
            class="status-dot"
            style="background: {statusColors[entity.status] || 'var(--dim-star)'}"
            title={entity.status}
          ></span>
          <span class="entity-name">{entity.name}</span>
        </div>
        <div class="entity-meta">
          <span class="entity-status">{entity.status}</span>
          {#if entity.health_pct != null}
            <span class="entity-health">{entity.health_pct}%</span>
          {/if}
        </div>
      </div>
    {/each}
  </div>
</div>
{/if}

<style>
  .ecosystem {
    background: var(--bg-card, #12121f);
    border: 1px solid var(--border-color, rgba(74, 26, 107, 0.4));
    border-radius: 0.75rem;
    padding: 1.5rem;
  }

  .health-row {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 1rem;
    margin-bottom: 1.5rem;
  }

  .health-card {
    text-align: center;
    padding: 0.75rem;
    background: var(--bg-tertiary, #1a1a2e);
    border-radius: 0.5rem;
  }

  .health-value {
    display: block;
    font-size: 1.5rem;
    font-weight: 800;
    color: var(--text-heading, #fff);
  }

  .health-label {
    font-size: 0.75rem;
    color: var(--dim-star, #6b6780);
    text-transform: uppercase;
    letter-spacing: 0.03em;
  }

  .filters {
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem;
    margin-bottom: 1.25rem;
  }

  .filter-btn {
    background: var(--bg-tertiary, #1a1a2e);
    border: 1px solid transparent;
    border-radius: 1rem;
    padding: 0.3rem 0.75rem;
    font-size: 0.8rem;
    color: var(--text-secondary, #a8a4b8);
    cursor: pointer;
    font-family: inherit;
    transition: all 0.15s;
  }

  .filter-btn:hover {
    border-color: var(--cat-color, var(--border-hover));
    color: var(--text-heading, #fff);
  }

  .filter-btn.active {
    background: var(--cat-color, var(--cosmic-magenta));
    color: #fff;
    border-color: var(--cat-color, var(--cosmic-magenta));
  }

  .entity-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(14rem, 1fr));
    gap: 0.6rem;
  }

  .entity-card {
    background: var(--bg-tertiary, #1a1a2e);
    border-radius: 0.5rem;
    padding: 0.75rem 1rem;
    transition: transform 0.15s;
  }

  .entity-card:hover {
    transform: translateY(-1px);
  }

  .entity-header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 0.3rem;
  }

  .status-dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    flex-shrink: 0;
  }

  .entity-name {
    font-size: 0.88rem;
    font-weight: 600;
    color: var(--text-heading, #fff);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .entity-meta {
    display: flex;
    justify-content: space-between;
    font-size: 0.75rem;
    color: var(--dim-star, #6b6780);
    padding-left: 1.15rem;
  }

  .entity-health {
    font-weight: 500;
    color: var(--aurora-teal, #2dd4bf);
  }

  @media (max-width: 640px) {
    .health-row {
      grid-template-columns: repeat(2, 1fr);
    }

    .entity-grid {
      grid-template-columns: 1fr;
    }
  }
</style>
