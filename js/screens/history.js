// Transaction history view (opened from Profile and from Home's "See all activity")
//
// Not a tab, so it does not add itself to window.Screens. It adds helpers to
// window.Views instead. All transactions are simulated sample data.

window.Views = window.Views || {};

(function () {
  const TYPE_ICON = {
    buy: 'invest',
    sell: 'invest',
    deposit: 'wallet',
    'circle-invest': 'circle',
    'circle-savings': 'coins',
  };

  // One transaction row. Money in is green with "+"; money out is plain with "−".
  Views.txRow = (tx, dateText) => {
    const incoming = tx.amount > 0;
    return `
      <li class="tx">
        <span class="tx-icon tx-${tx.group}">${UI.icon(TYPE_ICON[tx.type] || 'info', { size: 20 })}</span>
        <span class="tx-main">
          <span class="tx-title">${UI.esc(tx.title)}</span>
          <span class="tx-meta">${UI.esc(tx.detail)}, ${UI.esc(dateText)}</span>
        </span>
        <span class="tx-amount num ${incoming ? 'is-in' : ''}">${UI.signedRwf(tx.amount)}</span>
      </li>`;
  };

  const FILTERS = [
    { id: 'all', label: 'All' },
    { id: 'investments', label: 'Shares' },
    { id: 'circle', label: 'Our Circle' },
    { id: 'funds', label: 'Funds' },
  ];

  // Renders the full history into `el`. `onBack` returns to the previous view.
  Views.history = (el, { onBack }) => {
    let filter = 'all';

    function render() {
      const items = SampleData.transactions.filter((tx) => filter === 'all' || tx.group === filter);

      // Group by month, newest first
      const groups = [];
      items.forEach((tx) => {
        const month = tx.date.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
        const last = groups[groups.length - 1];
        if (last && last.month === month) last.items.push(tx);
        else groups.push({ month, items: [tx] });
      });

      el.innerHTML = `
        <button type="button" class="back-btn" data-history-action="back">${UI.icon('chevronLeft', { size: 22 })}<span>Profile</span></button>

        <header>
          <h1 class="screen-title" tabindex="-1" data-history-title>Transaction history</h1>
          <p class="screen-subtitle">Simulated transactions. No real money moved.</p>
        </header>

        <div class="segmented" role="group" aria-label="Filter transactions">
          ${FILTERS.map((f) => `<button type="button" data-filter="${f.id}" aria-pressed="${f.id === filter}">${f.label}</button>`).join('')}
        </div>

        ${
          groups.length
            ? groups
                .map(
                  (g) => `
              <section class="section" aria-label="${UI.esc(g.month)}">
                <h2 class="tx-month">${UI.esc(g.month)}</h2>
                <ul class="tx-list" role="list">
                  ${g.items.map((tx) => Views.txRow(tx, tx.date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }))).join('')}
                </ul>
              </section>`
                )
                .join('')
            : `<div class="empty">
                ${UI.icon('clock', { size: 28 })}
                <strong>No transactions here yet</strong>
                <span>Try another filter, or make a simulated buy in Invest.</span>
              </div>`
        }

        <p class="screen-footnote">Prototype only. These transactions are sample data and are cleared when the page reloads.</p>
      `;
    }

    function onClick(event) {
      const button = event.target.closest('button');
      if (!button || !el.contains(button)) return;
      if (button.dataset.filter) {
        filter = button.dataset.filter;
        render();
        el.querySelector(`[data-filter="${filter}"]`).focus();
      }
      if (button.dataset.historyAction === 'back') {
        stop();
        onBack();
      }
    }

    // Keep the list current if a buy happens while history is open
    const unsubscribe = SampleData.onChange(render);
    function stop() {
      el.removeEventListener('click', onClick);
      unsubscribe();
    }

    el.addEventListener('click', onClick);
    render();
    el.querySelector('[data-history-title]').focus();
    return { stop };
  };
})();
