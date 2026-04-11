<script>
  /** @type {{ data: any }} */
  let { data } = $props();

  let search = $state('');
  let activeCategory = $state('all');
  let activeTier = $state(0); // 0 = all
  let sortBy = $state('qwsScore');
  let sortDir = $state('desc');

  const tools = $derived(data?.tools ?? []);
  const categories = $derived(data?.categories ?? []);
  const tiers = $derived(data?.tiers ?? []);
  const stats = $derived(data?.stats ?? {});

  const filtered = $derived(() => {
    let result = tools;

    // Search
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter(t =>
        t.name.toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q) ||
        (t.description && t.description.toLowerCase().includes(q))
      );
    }

    // Category filter
    if (activeCategory !== 'all') {
      result = result.filter(t => t.category === activeCategory);
    }

    // Tier filter
    if (activeTier > 0) {
      result = result.filter(t => t.tier === activeTier);
    }

    return result;
  });

  const sorted = $derived(() => {
    const items = [...filtered()];
    const dir = sortDir === 'desc' ? -1 : 1;

    items.sort((a, b) => {
      if (sortBy === 'name') {
        return dir * a.name.localeCompare(b.name);
      }
      if (sortBy === 'category') {
        return dir * a.category.localeCompare(b.category);
      }
      if (sortBy === 'tier') {
        return dir * (a.tier - b.tier);
      }
      // Numeric sorts — nulls go last
      const aVal = a[sortBy];
      const bVal = b[sortBy];
      if (aVal == null && bVal == null) return 0;
      if (aVal == null) return 1;
      if (bVal == null) return -1;
      return dir * (aVal - bVal);
    });

    return items;
  });

  const tierColors = {
    1: 'var(--aurora-teal, #2dd4bf)',
    2: 'var(--cosmic-magenta, #9b3d8f)',
    3: 'var(--stellar-orange, #d4782c)',
    4: 'var(--dim-star, #6b6780)',
  };

  const tierLabels = {
    1: 'Star',
    2: 'Strong',
    3: 'Solid',
    4: 'Reference',
  };

  function toggleSort(field) {
    if (sortBy === field) {
      sortDir = sortDir === 'desc' ? 'asc' : 'desc';
    } else {
      sortBy = field;
      sortDir = field === 'name' || field === 'category' ? 'asc' : 'desc';
    }
  }

  function clearFilters() {
    search = '';
    activeCategory = 'all';
    activeTier = 0;
    sortBy = 'qwsScore';
    sortDir = 'desc';
  }

  const hasActiveFilters = $derived(
    search.trim() !== '' || activeCategory !== 'all' || activeTier > 0
  );

  function scoreBarWidth(score) {
    if (score == null) return '0%';
    return `${(score / 5) * 100}%`;
  }
</script>

{#if tools.length > 0}
<div class="tool-shed">
  <!-- Stats bar -->
  <div class="stats-row">
    <div class="stat-card">
      <span class="stat-value">{stats.total}</span>
      <span class="stat-label">Tools</span>
    </div>
    <div class="stat-card">
      <span class="stat-value">{stats.scored}</span>
      <span class="stat-label">Scored</span>
    </div>
    <div class="stat-card">
      <span class="stat-value">{stats.avgScore}</span>
      <span class="stat-label">Avg QWS</span>
    </div>
    <div class="stat-card">
      <span class="stat-value">{filtered().length}</span>
      <span class="stat-label">Showing</span>
    </div>
  </div>

  <!-- Search -->
  <div class="search-row">
    <div class="search-wrap">
      <svg class="search-icon" viewBox="0 0 20 20" fill="currentColor" width="16" height="16">
        <path fill-rule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clip-rule="evenodd" />
      </svg>
      <input
        type="text"
        bind:value={search}
        placeholder="Search tools, categories, or descriptions..."
        class="search-input"
      />
      {#if search}
        <button class="search-clear" onclick={() => search = ''}>&#10005;</button>
      {/if}
    </div>
  </div>

  <!-- Tier filter -->
  <div class="filter-section">
    <span class="filter-label">Tier</span>
    <div class="filters">
      <button
        class="filter-btn"
        class:active={activeTier === 0}
        onclick={() => activeTier = 0}
      >All</button>
      {#each tiers as tier}
        <button
          class="filter-btn"
          class:active={activeTier === tier.id}
          onclick={() => activeTier = activeTier === tier.id ? 0 : tier.id}
          style="--cat-color: {tierColors[tier.id]}"
        >
          {tier.name} ({tier.count})
        </button>
      {/each}
    </div>
  </div>

  <!-- Category filter -->
  <div class="filter-section">
    <span class="filter-label">Category</span>
    <div class="filters">
      <button
        class="filter-btn"
        class:active={activeCategory === 'all'}
        onclick={() => activeCategory = 'all'}
      >All</button>
      {#each categories as cat}
        <button
          class="filter-btn"
          class:active={activeCategory === cat}
          onclick={() => activeCategory = activeCategory === cat ? 'all' : cat}
        >{cat}</button>
      {/each}
    </div>
  </div>

  <!-- Sort controls -->
  <div class="sort-row">
    <span class="filter-label">Sort by</span>
    <div class="sort-buttons">
      {#each [
        { key: 'qwsScore', label: 'QWS Score' },
        { key: 'heart', label: 'Heart' },
        { key: 'childInv', label: 'Child/Inv' },
        { key: 'tier', label: 'Tier' },
        { key: 'name', label: 'Name' },
      ] as opt}
        <button
          class="sort-btn"
          class:active={sortBy === opt.key}
          onclick={() => toggleSort(opt.key)}
        >
          {opt.label}
          {#if sortBy === opt.key}
            <span class="sort-arrow">{sortDir === 'desc' ? '\u2193' : '\u2191'}</span>
          {/if}
        </button>
      {/each}
    </div>
    {#if hasActiveFilters}
      <button class="clear-btn" onclick={clearFilters}>Clear filters</button>
    {/if}
  </div>

  <!-- Tool cards -->
  <div class="tool-grid">
    {#each sorted() as tool (tool.name)}
      <div class="tool-card">
        <div class="tool-header">
          <span class="tier-badge" style="background: {tierColors[tool.tier]}">
            {tierLabels[tool.tier]}
          </span>
          <span class="tool-category">{tool.category}</span>
        </div>
        <h3 class="tool-name">{tool.name}</h3>

        {#if tool.qwsScore != null}
          <div class="score-section">
            <div class="score-main">
              <span class="score-value">{tool.qwsScore}</span>
              <span class="score-max">/5</span>
            </div>
            <div class="score-bar-wrap">
              <div
                class="score-bar"
                style="width: {scoreBarWidth(tool.qwsScore)}; background: {tierColors[tool.tier]}"
              ></div>
            </div>
          </div>

          <div class="dimension-row">
            {#if tool.heart != null}
              <div class="dimension">
                <span class="dim-label">Heart</span>
                <span class="dim-value">{tool.heart}</span>
              </div>
            {/if}
            {#if tool.childInv != null}
              <div class="dimension">
                <span class="dim-label">Child/Inv</span>
                <span class="dim-value">{tool.childInv}</span>
              </div>
            {/if}
          </div>
        {:else}
          <div class="score-section">
            <span class="unscored">Not yet scored</span>
          </div>
        {/if}

        {#if tool.description}
          <p class="tool-desc">{tool.description}</p>
        {/if}
      </div>
    {/each}
  </div>

  {#if sorted().length === 0}
    <div class="empty-state">
      <p>No tools match your filters.</p>
      <button class="clear-btn" onclick={clearFilters}>Clear all filters</button>
    </div>
  {/if}
</div>
{/if}

<style>
  .tool-shed {
    background: var(--bg-card, #12121f);
    border: 1px solid var(--border-color, rgba(74, 26, 107, 0.4));
    border-radius: 0.75rem;
    padding: 1.5rem;
    margin-bottom: 2rem;
  }

  /* Stats */
  .stats-row {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 0.75rem;
    margin-bottom: 1.25rem;
  }

  .stat-card {
    text-align: center;
    padding: 0.6rem;
    background: var(--bg-tertiary, #1a1a2e);
    border-radius: 0.5rem;
  }

  .stat-value {
    display: block;
    font-size: 1.4rem;
    font-weight: 800;
    color: var(--text-heading, #fff);
  }

  .stat-label {
    font-size: 0.7rem;
    color: var(--dim-star, #6b6780);
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  /* Search */
  .search-row {
    margin-bottom: 1rem;
  }

  .search-wrap {
    position: relative;
    display: flex;
    align-items: center;
  }

  .search-icon {
    position: absolute;
    left: 0.75rem;
    color: var(--dim-star, #6b6780);
    pointer-events: none;
  }

  .search-input {
    width: 100%;
    padding: 0.6rem 2rem 0.6rem 2.25rem;
    background: var(--bg-tertiary, #1a1a2e);
    border: 1px solid var(--border-color, rgba(74, 26, 107, 0.4));
    border-radius: 0.5rem;
    color: var(--text-primary, #e8e4f0);
    font-size: 0.88rem;
    font-family: inherit;
    outline: none;
    transition: border-color 0.15s;
  }

  .search-input::placeholder {
    color: var(--dim-star, #6b6780);
  }

  .search-input:focus {
    border-color: var(--aurora-teal, #2dd4bf);
  }

  .search-clear {
    position: absolute;
    right: 0.5rem;
    background: none;
    border: none;
    color: var(--dim-star, #6b6780);
    cursor: pointer;
    font-size: 0.85rem;
    padding: 0.25rem;
    line-height: 1;
  }

  .search-clear:hover {
    color: var(--text-heading, #fff);
  }

  /* Filters */
  .filter-section {
    margin-bottom: 0.75rem;
  }

  .filter-label {
    font-size: 0.72rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: var(--dim-star, #6b6780);
    margin-right: 0.5rem;
  }

  .filters {
    display: flex;
    flex-wrap: wrap;
    gap: 0.35rem;
    margin-top: 0.3rem;
  }

  .filter-btn {
    background: var(--bg-tertiary, #1a1a2e);
    border: 1px solid transparent;
    border-radius: 1rem;
    padding: 0.25rem 0.7rem;
    font-size: 0.78rem;
    color: var(--text-secondary, #a8a4b8);
    cursor: pointer;
    font-family: inherit;
    transition: all 0.15s;
    white-space: nowrap;
  }

  .filter-btn:hover {
    border-color: var(--cat-color, var(--border-hover, rgba(155, 61, 143, 0.6)));
    color: var(--text-heading, #fff);
  }

  .filter-btn.active {
    background: var(--cat-color, var(--cosmic-magenta, #9b3d8f));
    color: #fff;
    border-color: var(--cat-color, var(--cosmic-magenta, #9b3d8f));
  }

  /* Sort */
  .sort-row {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin-bottom: 1.25rem;
    padding-bottom: 1rem;
    border-bottom: 1px solid var(--border-color, rgba(74, 26, 107, 0.4));
  }

  .sort-buttons {
    display: flex;
    flex-wrap: wrap;
    gap: 0.3rem;
  }

  .sort-btn {
    background: var(--bg-tertiary, #1a1a2e);
    border: 1px solid transparent;
    border-radius: 0.35rem;
    padding: 0.2rem 0.6rem;
    font-size: 0.78rem;
    color: var(--text-secondary, #a8a4b8);
    cursor: pointer;
    font-family: inherit;
    transition: all 0.15s;
    display: flex;
    align-items: center;
    gap: 0.2rem;
  }

  .sort-btn:hover {
    border-color: var(--aurora-teal, #2dd4bf);
    color: var(--text-heading, #fff);
  }

  .sort-btn.active {
    background: var(--aurora-teal, #2dd4bf);
    color: var(--deep-space, #0a0a14);
    border-color: var(--aurora-teal, #2dd4bf);
    font-weight: 600;
  }

  .sort-arrow {
    font-size: 0.7em;
  }

  .clear-btn {
    background: none;
    border: 1px solid var(--border-color, rgba(74, 26, 107, 0.4));
    border-radius: 0.35rem;
    padding: 0.2rem 0.6rem;
    font-size: 0.78rem;
    color: var(--stellar-orange, #d4782c);
    cursor: pointer;
    font-family: inherit;
    margin-left: auto;
  }

  .clear-btn:hover {
    border-color: var(--stellar-orange, #d4782c);
  }

  /* Tool grid */
  .tool-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(16rem, 1fr));
    gap: 0.75rem;
  }

  .tool-card {
    background: var(--bg-tertiary, #1a1a2e);
    border: 1px solid transparent;
    border-radius: 0.6rem;
    padding: 1rem;
    transition: all 0.15s;
  }

  .tool-card:hover {
    border-color: var(--border-hover, rgba(155, 61, 143, 0.6));
    transform: translateY(-1px);
  }

  .tool-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.4rem;
  }

  .tier-badge {
    font-size: 0.65rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: var(--deep-space, #0a0a14);
    padding: 0.1rem 0.45rem;
    border-radius: 0.25rem;
  }

  .tool-category {
    font-size: 0.72rem;
    color: var(--dim-star, #6b6780);
  }

  .tool-name {
    font-size: 1rem;
    font-weight: 700;
    color: var(--text-heading, #fff);
    margin-bottom: 0.5rem;
    line-height: 1.2;
  }

  /* Scores */
  .score-section {
    margin-bottom: 0.5rem;
  }

  .score-main {
    display: flex;
    align-items: baseline;
    gap: 0.15rem;
    margin-bottom: 0.3rem;
  }

  .score-value {
    font-size: 1.35rem;
    font-weight: 800;
    color: var(--text-heading, #fff);
    font-variant-numeric: tabular-nums;
  }

  .score-max {
    font-size: 0.75rem;
    color: var(--dim-star, #6b6780);
  }

  .score-bar-wrap {
    height: 4px;
    background: rgba(255, 255, 255, 0.06);
    border-radius: 2px;
    overflow: hidden;
  }

  .score-bar {
    height: 100%;
    border-radius: 2px;
    transition: width 0.35s ease;
  }

  .unscored {
    font-size: 0.78rem;
    color: var(--dim-star, #6b6780);
    font-style: italic;
  }

  .dimension-row {
    display: flex;
    gap: 1rem;
    margin-bottom: 0.5rem;
  }

  .dimension {
    display: flex;
    align-items: center;
    gap: 0.3rem;
  }

  .dim-label {
    font-size: 0.7rem;
    color: var(--dim-star, #6b6780);
  }

  .dim-value {
    font-size: 0.8rem;
    font-weight: 600;
    color: var(--text-primary, #e8e4f0);
    font-variant-numeric: tabular-nums;
  }

  .tool-desc {
    font-size: 0.8rem;
    color: var(--text-secondary, #a8a4b8);
    line-height: 1.45;
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  /* Empty state */
  .empty-state {
    text-align: center;
    padding: 3rem 1rem;
    color: var(--dim-star, #6b6780);
  }

  .empty-state p {
    margin-bottom: 0.75rem;
    font-size: 0.95rem;
  }

  /* Responsive */
  @media (max-width: 640px) {
    .stats-row {
      grid-template-columns: repeat(2, 1fr);
    }

    .tool-grid {
      grid-template-columns: 1fr;
    }

    .sort-row {
      flex-direction: column;
      align-items: flex-start;
    }

    .clear-btn {
      margin-left: 0;
    }
  }
</style>
