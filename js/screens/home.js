// Home tab
//
// Dashboard: total balance, holdings, a link into Our Circle and recent activity.
// Reads js/data.js, so it always matches Invest. All figures are simulated.

window.Screens = window.Screens || {};

Screens.home = function (el) {
  const data = SampleData;
  const goToTab = (name) => document.querySelector(`.tab[data-tab="${name}"]`).click();
  const sharesLabel = (n) => `${UI.groupDigits(n)} ${n === 1 ? 'share' : 'shares'}`;
  const shortDate = (date) => date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });

  function render() {
    const investments = data.investmentsValue();
    const yesterday = data.investmentsValueYesterday();
    const total = investments + data.balance;
    const todayAmount = investments - yesterday;
    const todayPct = yesterday ? (todayAmount / yesterday) * 100 : 0;
    const held = data.companies.filter((c) => data.holdings[c.id]);
    const recent = data.transactions.slice(0, 3);

    el.innerHTML = `
      <header class="screen-head">
        <div>
          <h1 class="screen-title" tabindex="-1">Hello, ${UI.esc(data.firstName())}</h1>
          <p class="screen-subtitle">Here's your simulated account today.</p>
        </div>
      </header>

      <section class="card-hero on-navy home-balance" aria-labelledby="balance-title">
        <div class="home-balance-top">
          <h2 id="balance-title" class="home-balance-label">Total balance</h2>
          <span class="tag tag-sim">Simulated</span>
        </div>
        <p class="home-balance-value num">${UI.rwf(total)}</p>
        <p class="home-balance-change">
          ${UI.change(todayPct)}
          <span class="num">${UI.signedRwf(todayAmount)}</span>
          <span>today on investments</span>
        </p>
        <dl class="home-split">
          <div><dt>Investments</dt><dd class="num">${UI.rwf(investments)}</dd></div>
          <div><dt>Available to invest</dt><dd class="num">${UI.rwf(data.balance)}</dd></div>
        </dl>
        <button type="button" class="btn btn-primary btn-block" data-action="invest">Invest now</button>
      </section>

      <section class="section" aria-labelledby="holdings-title">
        <h2 id="holdings-title" class="section-title">Your holdings</h2>
        ${
          held.length
            ? `<ul class="holding-list" role="list">
                ${held.map(holdingRow).join('')}
              </ul>`
            : `<div class="empty">
                ${UI.icon('invest', { size: 28 })}
                <strong>No holdings yet</strong>
                <span>Buy your first shares from the Invest tab.</span>
              </div>`
        }
      </section>

      <section class="card home-circle" aria-labelledby="home-circle-title">
        <span class="home-circle-icon">${UI.icon('circle', { size: 24 })}</span>
        <div class="home-circle-body">
          <h2 id="home-circle-title" class="home-circle-title">Our Circle</h2>
          <p class="small muted">Kimironko Traders, 5 members. Savings and the invested pool are kept separate.</p>
        </div>
        <button type="button" class="btn btn-secondary btn-block" data-action="circle">Open Our Circle</button>
      </section>

      <section class="section" aria-labelledby="activity-title">
        <h2 id="activity-title" class="section-title">Recent activity</h2>
        <ul class="tx-list" role="list">
          ${recent.map((tx) => Views.txRow(tx, shortDate(tx.date))).join('')}
        </ul>
        <button type="button" class="btn btn-quiet btn-block" data-action="history">See all activity</button>
      </section>

      <p class="screen-footnote">
        Prototype only. Balances, holdings and activity are simulated. No real money, trades or accounts are involved.
      </p>
    `;
  }

  function holdingRow(c) {
    const shares = data.holdings[c.id];
    const today = ((c.path[data.DAYS - 1] - c.path[data.DAYS - 2]) / c.path[data.DAYS - 2]) * 100;
    return `
      <li class="holding">
        <span class="holding-mark" aria-hidden="true">${UI.esc(c.mark)}</span>
        <span class="holding-main">
          <span class="holding-name">${UI.esc(c.name)}</span>
          <span class="holding-meta">${sharesLabel(shares)}</span>
        </span>
        <span class="holding-value">
          <span class="num">${UI.rwf(shares * c.price)}</span>
          ${UI.change(today)}
          <span class="sr-only">today, simulated</span>
        </span>
      </li>`;
  }

  el.addEventListener('click', (event) => {
    const button = event.target.closest('button');
    if (!button || !el.contains(button)) return;
    if (button.dataset.action === 'invest') goToTab('invest');
    if (button.dataset.action === 'circle') goToTab('circle');
    if (button.dataset.action === 'history') {
      goToTab('profile');
      if (window.ProfileScreen) window.ProfileScreen.openHistory();
    }
  });

  // Re-render when another screen changes the shared data (e.g. a buy in Invest)
  data.onChange(render);
  render();
};
