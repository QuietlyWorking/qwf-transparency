<script>
  /** @type {{ data: any }} */
  let { data } = $props();

  let expanded = $state(false);

  const summary = $derived(data?.monthly_summary);
  const budget = $derived(data?.budget);
  const sources = $derived(
    summary?.sources
      ? Object.entries(summary.sources)
          .filter(([, v]) => v > 0)
          .sort(([, a], [, b]) => b - a)
      : []
  );
  const total = $derived(summary?.total_mtd ?? 0);
  const month = $derived(summary?.month ?? '');
  const budgetTotal = $derived(budget?.monthly_total_budget ?? 0);
  const percentUsed = $derived(budget?.percent_used ?? 0);
  const projected = $derived(budget?.projected_month_end ?? 0);
  const generatedAt = $derived(
    data?.generated_at
      ? new Date(data.generated_at).toLocaleDateString('en-US', {
          month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit'
        })
      : ''
  );

  const sourceLabels = {
    llm: 'AI Models',
    azure: 'Azure VMs',
    supabase: 'Supabase',
    apify: 'Web Scraping',
    esp: 'Email Platform',
    betterstack: 'Monitoring',
    email: 'Email Delivery',
  };

  const sourceColors = {
    llm: 'var(--cosmic-magenta)',
    azure: 'var(--color-info)',
    supabase: '#3ECF8E',
    apify: 'var(--color-success)',
    esp: 'var(--stellar-orange)',
    betterstack: 'var(--aurora-teal)',
    email: 'var(--dim-star)',
  };
</script>

{#if summary}
<div class="cost-widget">
  <div class="cost-header">
    <div>
      <span class="eyebrow">Operating Costs</span>
      <span class="month">{month}</span>
    </div>
    <div class="total">${total.toFixed(2)}</div>
  </div>

  <!-- Budget bar -->
  <div class="budget-bar-container">
    <div class="budget-bar">
      <div
        class="budget-fill"
        class:over={percentUsed > 90}
        style="width: {Math.min(percentUsed, 100)}%"
      ></div>
    </div>
    <div class="budget-meta">
      <span>{percentUsed.toFixed(0)}% of ${budgetTotal} budget</span>
      <span>Projected: ${projected.toFixed(0)}</span>
    </div>
  </div>

  <!-- Source breakdown -->
  <button class="toggle" onclick={() => expanded = !expanded}>
    {expanded ? 'Hide' : 'Show'} breakdown
    <span class="chevron" class:open={expanded}>&#9662;</span>
  </button>

  {#if expanded}
    <div class="breakdown">
      {#each sources as [key, value]}
        <div class="source-row">
          <div class="source-label">
            <span class="dot" style="background: {sourceColors[key] || 'var(--dim-star)'}"></span>
            {sourceLabels[key] || key}
          </div>
          <div class="source-bar-wrap">
            <div
              class="source-bar"
              style="width: {(value / total * 100).toFixed(1)}%; background: {sourceColors[key] || 'var(--dim-star)'}"
            ></div>
          </div>
          <div class="source-value">${value.toFixed(2)}</div>
        </div>
      {/each}
    </div>
  {/if}

  <div class="timestamp">Data as of {generatedAt}</div>
</div>
{/if}

<style>
  .cost-widget {
    background: var(--bg-card, #12121f);
    border: 1px solid var(--border-color, rgba(74, 26, 107, 0.4));
    border-radius: 0.75rem;
    padding: 1.5rem;
  }

  .cost-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 1.25rem;
  }

  .eyebrow {
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--aurora-teal, #2dd4bf);
    display: block;
  }

  .month {
    font-size: 0.85rem;
    color: var(--dim-star, #6b6780);
  }

  .total {
    font-size: 2rem;
    font-weight: 800;
    color: var(--text-heading, #fff);
  }

  .budget-bar-container {
    margin-bottom: 1rem;
  }

  .budget-bar {
    height: 6px;
    background: var(--bg-tertiary, #1a1a2e);
    border-radius: 3px;
    overflow: hidden;
  }

  .budget-fill {
    height: 100%;
    background: var(--aurora-teal, #2dd4bf);
    border-radius: 3px;
    transition: width 0.5s ease;
  }

  .budget-fill.over {
    background: var(--color-warning, #d4782c);
  }

  .budget-meta {
    display: flex;
    justify-content: space-between;
    font-size: 0.78rem;
    color: var(--dim-star, #6b6780);
    margin-top: 0.35rem;
  }

  .toggle {
    background: none;
    border: none;
    color: var(--text-secondary, #a8a4b8);
    font-size: 0.85rem;
    cursor: pointer;
    padding: 0.5rem 0;
    display: flex;
    align-items: center;
    gap: 0.35rem;
    font-family: inherit;
  }

  .toggle:hover {
    color: var(--aurora-teal, #2dd4bf);
  }

  .chevron {
    font-size: 0.7em;
    transition: transform 0.2s;
  }

  .chevron.open {
    transform: rotate(180deg);
  }

  .breakdown {
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
    margin-top: 0.5rem;
    padding-top: 0.75rem;
    border-top: 1px solid var(--border-color, rgba(74, 26, 107, 0.4));
  }

  .source-row {
    display: grid;
    grid-template-columns: 8rem 1fr 4rem;
    align-items: center;
    gap: 0.75rem;
  }

  .source-label {
    font-size: 0.85rem;
    color: var(--text-secondary, #a8a4b8);
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    flex-shrink: 0;
  }

  .source-bar-wrap {
    height: 4px;
    background: var(--bg-tertiary, #1a1a2e);
    border-radius: 2px;
    overflow: hidden;
  }

  .source-bar {
    height: 100%;
    border-radius: 2px;
    transition: width 0.4s ease;
  }

  .source-value {
    text-align: right;
    font-size: 0.85rem;
    font-weight: 500;
    color: var(--text-primary, #e8e4f0);
    font-variant-numeric: tabular-nums;
  }

  .timestamp {
    margin-top: 1rem;
    font-size: 0.75rem;
    color: var(--dim-star, #6b6780);
    text-align: right;
  }

  @media (max-width: 640px) {
    .source-row {
      grid-template-columns: 6rem 1fr 3.5rem;
    }
  }
</style>
