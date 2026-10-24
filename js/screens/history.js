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
    'circle-withdrawal': 'clock',
  };

  // One transaction row, in the shared list style. Money in is green with "+";
  // money out is plain with "−" (spending isn't a loss). Pending payouts say so.
  Views.txRow = (tx, dateText) => {
    const incoming = tx.amount > 0;
    const iconClass = tx.group === 'circle' ? ' is-circle' : tx.group === 'funds' ? ' is-funds' : '';
    return `
      <li>
        <div class="row tx">
          <span class="row-icon${iconClass}">${UI.icon(TYPE_ICON[tx.type] || 'info', { size: 20 })}</span>
          <span class="row-main">
            <span class="row-title">${UI.esc(tx.title)}</span>
            <span class="row-meta">${UI.esc(tx.detail)}, ${UI.esc(dateText)}</span>
          </span>
          <span class="row-end">
            <span class="row-amount${incoming && !tx.pending ? ' is-in' : ''}">${UI.signedRwf(tx.amount)}</span>
            ${tx.pending ? '<span class="tag tag-sim">Pending</span>' : ''}
          </span>
        </div>
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
          <p class="screen-subtitle">Simulated transactions. No real money moved, and the list resets when the page reloads.</p>
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
                <ul class="list" role="list">
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
