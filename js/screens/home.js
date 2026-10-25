// Home tab
//
// Dashboard: total value (green card) with its breakdown (cash, shares, your
// Our Circle share), your Circle card, your investments and recent activity.
// Reads js/data.js, so it always matches Invest, Our Circle and History.
// All figures are simulated.

window.Screens = window.Screens || {};

Screens.home = function (el) {
  const data = SampleData;
  const t = (key, vars) => I18N.t(key, vars);
  const goToTab = (name) => document.querySelector(`.tab[data-tab="${name}"]`).click();

  // Your share of the invested pool (active members only)
  function poolShare(circleShare) {
    const pool = data.circle.members.reduce((sum, m) => sum + data.circleMemberValue(m), 0);
    return pool ? (circleShare / pool) * 100 : 0;
  }

  // Value of your shares over the past month (for the small trend line)
  function monthSeries() {
    const series = new Array(22).fill(0);
    data.companies.forEach((c) => {
      const shares = data.holdings[c.id] || 0;
      if (!shares) return;
      c.path.slice(-22).forEach((price, i) => {
        series[i] += shares * price;
      });
    });
    return series;
  }

  function render() {
    const shares = data.investmentsValue();
    const yesterday = data.investmentsValueYesterday();
    const circleShare = data.yourCircleValue();
    const pending = data.yourPendingPayout();
    const total = shares + data.balance + circleShare + pending; // each part counted once
    const todayAmount = shares - yesterday;
    const todayPct = yesterday ? (todayAmount / yesterday) * 100 : 0;
    const held = data.companies.filter((c) => data.holdings[c.id]);
    const recent = data.transactions.slice(0, 3);
    const series = monthSeries();

    el.innerHTML = `
      <header class="screen-head">
        <div>
          <h1 class="screen-title" tabindex="-1">${t('home.greeting', { name: UI.esc(data.firstName()) })}</h1>
          <p class="screen-subtitle">${t('home.subtitle')}</p>
        </div>
      </header>

      <section class="card-hero on-navy is-green home-total" aria-labelledby="balance-title">
        <div class="hero-top">
          <h2 id="balance-title" class="hero-label">${t('home.total')}</h2>
          <span class="tag tag-sim">${t('common.simulated')}</span>
        </div>
        <p class="hero-value summary-value">${UI.rwf(total)}</p>
        <p class="hero-change">${UI.change(todayPct)}<span class="num">${UI.signedRwf(todayAmount)}</span><span>${t('home.todayOnShares')}</span></p>
        ${shares ? `<div class="home-spark" aria-hidden="true">${UI.lineChart(series, { width: 320, height: 56, strokeWidth: 2, padding: 4 })}</div>` : ''}
      </section>

      <dl class="stats home-stats">
        ${stat('home.split.cash', UI.rwf(data.balance))}
        ${stat('home.split.shares', UI.rwf(shares))}
        ${stat('home.circle.title', UI.rwf(pending || circleShare), pending ? `<span class="status status-pending">${t('common.pending')}</span>` : '')}
      </dl>

      <button type="button" class="btn btn-primary btn-block" data-action="invest">${t('home.investNow')}</button>

      ${data.kyc.status === 'verified' ? '' : verifyPrompt()}

      ${circleCard(circleShare, pending)}

      <section class="section" aria-labelledby="holdings-title">
        <div class="section-row">
          <h2 id="holdings-title" class="section-title">${t('home.myInvestments')}</h2>
          ${held.length ? `<button type="button" class="link-btn" data-action="invest">${t('common.seeAll')}</button>` : ''}
        </div>
        ${held.length ? `<ul class="list" role="list">${held.map((c) => holdingRow(c, shares)).join('')}</ul>` : emptyPortfolio()}
      </section>

      <section class="section" aria-labelledby="activity-title">
        <div class="section-row">
          <h2 id="activity-title" class="section-title">${t('home.activity')}</h2>
          <button type="button" class="link-btn" data-action="history">${t('common.seeAll')}</button>
        </div>
        <ul class="list" role="list">
          ${recent.map((tx) => Views.txRow(tx)).join('')}
        </ul>
      </section>
    `;
  }

  // One figure in the strip under the total (the three add up to the total)
  function stat(labelKey, value, extra = '') {
    return `
      <div class="stat">
        <dt class="stat-label">${t(labelKey)}</dt>
        <dd class="stat-value breakdown-value">${value}</dd>
        ${extra ? `<dd>${extra}</dd>` : ''}
      </div>`;
  }

  // Gentle reminder until the (simulated) identity check is done
  function verifyPrompt() {
    return `
      <button type="button" class="card row verify-prompt" data-action="verify">
        <span class="tile">${UI.icon('shield', { size: 20 })}</span>
        <span class="row-main">
          <span class="row-title">${t('home.verify.title')}</span>
          <span class="row-meta">${t('home.verify.body')}</span>
        </span>
        <span class="row-chevron">${UI.icon('chevronRight', { size: 20 })}</span>
      </button>`;
  }

  // "Your Circle" card: illustration, your share (or pending payout), share of the pool
  function circleCard(circleShare, pending) {
    const pct = UI.pct(poolShare(circleShare), 0).replace('+', '');
    return `
      <section aria-labelledby="home-circle-title">
        <button type="button" class="card circle-card" data-action="circle">
          <span class="circle-card-art">${UI.illustration('circle')}</span>
          <span class="circle-card-text">
            <span id="home-circle-title" class="circle-card-title">${t('home.circleCard')}</span>
            <span class="circle-card-value num">${UI.rwf(pending || circleShare)}</span>
            <span class="circle-card-meta">${pending ? t('home.circle.pending') : t('home.ofPool', { pct })}</span>
          </span>
          <span class="row-chevron">${UI.icon('chevronRight', { size: 20 })}</span>
        </button>
      </section>`;
  }

  // A holding with a bar showing its part of all your shares
  function holdingRow(c, sharesTotal) {
    const count = data.holdings[c.id];
    const value = count * c.price;
    const part = sharesTotal ? (value / sharesTotal) * 100 : 0;
    const today = ((c.path[data.DAYS - 1] - c.path[data.DAYS - 2]) / c.path[data.DAYS - 2]) * 100;
    return `
      <li>
        <button type="button" class="row holding" data-company="${c.id}">
          <span class="mark" aria-hidden="true">${UI.esc(c.mark)}</span>
          <span class="row-main">
            <span class="holding-top">
              <span class="row-title">${UI.esc(c.name)}</span>
              <span class="holding-part">${UI.pct(part, 0).replace('+', '')}</span>
            </span>
            <span class="meter" aria-hidden="true"><span style="width:${part.toFixed(1)}%"></span></span>
            <span class="sr-only">${t('home.ofShares', { pct: UI.pct(part, 0).replace('+', '') })}</span>
            <span class="holding-bottom">
              <span class="row-meta">${t('common.shares', { count })}</span>
              <span class="row-amount">${UI.rwf(value)}</span>
            </span>
          </span>
          <span class="row-end">
            ${UI.change(today)}
            <span class="sr-only">${t('common.todaySimulated')}</span>
          </span>
        </button>
      </li>`;
  }

  function emptyPortfolio() {
    return `
      <div class="card empty-portfolio">
        ${UI.illustration('emptyPortfolio', { banner: true })}
        <strong>${t('home.empty.title')}</strong>
        <span class="muted">${t('home.empty.body')}</span>
        <button type="button" class="btn btn-primary btn-block" data-action="invest">${t('home.empty.cta')}</button>
      </div>`;
  }

  el.addEventListener('click', (event) => {
    const button = event.target.closest('button');
    if (!button || !el.contains(button)) return;
    const action = button.dataset.action;
    if (action === 'invest') goToTab('invest');
    if (action === 'circle') goToTab('circle');
    if (action === 'history') HistoryScreen.open();
    if (action === 'verify') KYC.open();
    if (button.dataset.company) {
      goToTab('invest');
      if (window.InvestScreen) window.InvestScreen.openCompany(button.dataset.company);
    }
  });

  // Re-render when any screen changes the shared data, or the language changes
  data.onChange(render);
  I18N.onChange(render);
  render();
};
