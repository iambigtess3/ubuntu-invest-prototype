// Home tab
//
// Dashboard: total balance, holdings and recent activity. Reads js/data.js,
// so it always matches Invest, Our Circle and history. All figures are simulated.

window.Screens = window.Screens || {};

Screens.home = function (el) {
  const data = SampleData;
  const goToTab = (name) => document.querySelector(`.tab[data-tab="${name}"]`).click();
  const sharesLabel = (n) => `${UI.groupDigits(n)} ${n === 1 ? 'share' : 'shares'}`;
  const shortDate = (date) => date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });

  function render() {
    const shares = data.investmentsValue();
    const yesterday = data.investmentsValueYesterday();
    const circleShare = data.yourCircleValue();
    const pending = data.yourPendingPayout();
    const total = shares + data.balance + circleShare + pending;
    const todayAmount = shares - yesterday;
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
        <div class="hero-top">
          <h2 id="balance-title" class="hero-label">Total balance</h2>
          <span class="tag tag-sim">Simulated</span>
        </div>
        <p class="hero-value">${UI.rwf(total)}</p>
        <p class="hero-change">
          ${UI.change(todayPct)}
          <span class="num">${UI.signedRwf(todayAmount)}</span>
          <span>today on your shares</span>
        </p>
        <dl class="hero-split">
          <div><dt>Shares</dt><dd>${UI.rwf(shares)}</dd></div>
          <div><dt>Our Circle</dt><dd>${pending ? `${UI.rwf(pending)} pending` : UI.rwf(circleShare)}</dd></div>
          <div><dt>Cash to invest</dt><dd>${UI.rwf(data.balance)}</dd></div>
        </dl>
        <button type="button" class="btn btn-primary btn-block" data-action="invest">Invest now</button>
      </section>

      <section class="section" aria-labelledby="holdings-title">
        <h2 id="holdings-title" class="section-title">Your shares</h2>
        ${
          held.length
            ? `<ul class="list" role="list">${held.map(holdingRow).join('')}</ul>`
            : `<div class="empty">
                ${UI.icon('invest', { size: 28 })}
                <strong>No shares yet</strong>
                <span>Buy your first shares from the Invest tab.</span>
              </div>`
        }
      </section>

      <section class="section" aria-labelledby="activity-title">
        <h2 id="activity-title" class="section-title">Recent activity</h2>
        <ul class="list" role="list">
          ${recent.map((tx) => Views.txRow(tx, shortDate(tx.date))).join('')}
        </ul>
        <button type="button" class="btn btn-quiet btn-block" data-action="history">See all activity</button>
      </section>
    `;
  }

  function holdingRow(c) {
    const shares = data.holdings[c.id];
    const today = ((c.path[data.DAYS - 1] - c.path[data.DAYS - 2]) / c.path[data.DAYS - 2]) * 100;
    return `
      <li>
        <button type="button" class="row" data-company="${c.id}">
          <span class="mark" aria-hidden="true">${UI.esc(c.mark)}</span>
          <span class="row-main">
            <span class="row-title">${UI.esc(c.name)}</span>
            <span class="row-meta">${sharesLabel(shares)}</span>
          </span>
          <span class="row-end">
            <span class="row-amount">${UI.rwf(shares * c.price)}</span>
            ${UI.change(today)}
            <span class="sr-only">today, simulated</span>
          </span>
        </button>
      </li>`;
  }

  el.addEventListener('click', (event) => {
    const button = event.target.closest('button');
    if (!button || !el.contains(button)) return;
    if (button.dataset.action === 'invest') goToTab('invest');
    if (button.dataset.company) {
      goToTab('invest');
      if (window.InvestScreen) window.InvestScreen.openCompany(button.dataset.company);
    }
    if (button.dataset.action === 'history') {
      goToTab('profile');
      if (window.ProfileScreen) window.ProfileScreen.openHistory();
    }
  });

  // Re-render when any screen changes the shared data (a buy, a withdrawal, a reset)
  data.onChange(render);
  render();
};
