// Transaction history: a full screen without a tab, opened from Home's
// "See all" and from Profile (HistoryScreen.open()), with a back button that
// returns to where you came from. Also shares row helpers on window.Views
// (Home's "Recent activity" uses Views.txRow).
// All transactions are simulated sample data.
// Each transaction stores facts (type, company, shares); the words come from
// the translations, so history reads correctly in every language.

window.Views = window.Views || {};

(function () {
  const t = (key, vars) => I18N.t(key, vars);

  const TYPE_ICON = {
    buy: 'invest',
    sell: 'invest',
    deposit: 'wallet',
    'circle-invest': 'circle',
    'circle-savings': 'coins',
    'circle-withdrawal': 'clock',
  };

  // "Bought 300 shares of I&M Bank Rwanda", "Our Circle: invested pool" …
  Views.txTitle = (tx) => {
    const company = tx.companyId ? SampleData.companyById(tx.companyId).name : '';
    return t(`tx.title.${tx.type}`, { count: tx.shares || 0, company });
  };

  Views.txDetail = (tx) => t(`tx.detail.${tx.detail}`, { circle: SampleData.circle.name });

  // One transaction row, in the shared list style. Money in is green with "+";
  // money out is plain with "−" (spending isn't a loss). Pending payouts say so.
  Views.txRow = (tx) => {
    const incoming = tx.amount > 0;
    const iconClass = tx.group === 'circle' ? ' is-circle' : tx.group === 'funds' ? ' is-funds' : '';
    return `
      <li>
        <div class="row tx">
          <span class="row-icon${iconClass}">${UI.icon(TYPE_ICON[tx.type] || 'info', { size: 20 })}</span>
          <span class="row-main">
            <span class="row-title">${UI.esc(Views.txTitle(tx))}</span>
            <span class="row-meta">${UI.esc(Views.txDetail(tx))}, ${UI.esc(I18N.formatDate(tx.date))}</span>
          </span>
          <span class="row-end">
            <span class="row-amount${incoming && !tx.pending ? ' is-in' : ''}">${UI.signedRwf(tx.amount)}</span>
            ${tx.pending ? `<span class="tag tag-sim">${t('common.pending')}</span>` : ''}
          </span>
        </div>
      </li>`;
  };

  const FILTERS = ['all', 'investments', 'circle', 'funds'];

  // Renders the full history into `el`. With `onBack`, shows a back button.
  // `persistent` keeps it listening after Back (for the always-present screen).
  Views.history = (el, { onBack = null, focus = true, persistent = false } = {}) => {
    let filter = 'all';

    function render() {
      const items = SampleData.transactions.filter((tx) => filter === 'all' || tx.group === filter);

      // Group by month, newest first
      const groups = [];
      items.forEach((tx) => {
        const month = I18N.formatDate(tx.date, 'monthYear');
        const last = groups[groups.length - 1];
        if (last && last.month === month) last.items.push(tx);
        else groups.push({ month, items: [tx] });
      });

      el.innerHTML = `
        ${onBack ? `<button type="button" class="back-btn" data-history-action="back">${UI.icon('chevronLeft', { size: 22 })}<span>${t('common.back')}</span></button>` : ''}

        <header>
          <h1 class="screen-title" tabindex="-1" data-history-title>${t('history.title')}</h1>
          <p class="screen-subtitle">${t('history.subtitle')}</p>
        </header>

        <div class="segmented" role="group" aria-label="${UI.esc(t('history.filterLabel'))}">
          ${FILTERS.map((f) => `<button type="button" data-filter="${f}" aria-pressed="${f === filter}">${t(`history.filter.${f}`)}</button>`).join('')}
        </div>

        ${
          groups.length
            ? groups
                .map(
                  (g) => `
              <section class="section" aria-label="${UI.esc(g.month)}">
                <h2 class="tx-month">${UI.esc(g.month)}</h2>
                <ul class="list" role="list">
                  ${g.items.map((tx) => Views.txRow(tx)).join('')}
                </ul>
              </section>`
                )
                .join('')
            : `<div class="empty">
                ${UI.icon('clock', { size: 28 })}
                <strong>${t('history.empty.title')}</strong>
                <span>${t('history.empty.body')}</span>
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
        if (!persistent) stop();
        onBack();
      }
    }

    // Keep the list current if data or the language changes while it's open
    const unsubscribe = SampleData.onChange(render);
    const unsubscribeLang = I18N.onChange(render);
    function stop() {
      el.removeEventListener('click', onClick);
      unsubscribe();
      unsubscribeLang();
    }

    el.addEventListener('click', onClick);
    render();
    if (focus) el.querySelector('[data-history-title]').focus();
    return { stop };
  };
})();

// The History screen (no tab)
window.Screens = window.Screens || {};
Screens.history = function (el) {
  Views.history(el, { onBack: () => App.back(), focus: false, persistent: true });
};

// Open it from anywhere, with focus on its title
window.HistoryScreen = {
  open() {
    App.show('history');
    const title = document.querySelector('#history [data-history-title]');
    if (title) title.focus();
  },
};
