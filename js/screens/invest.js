// Invest tab
//
// Everything on this screen is simulated sample data: prices, balances,
// holdings and orders (all from js/data.js). No real market prices, money or trades.
// Views: "list" (search, sector filters, companies, your shares) and
// "detail" (one company: chart, "How many shares?" and the buy sheet).
// Text comes from js/i18n/*.js.

window.Screens = window.Screens || {};

Screens.invest = function (el) {
  const { companies, DAYS } = SampleData;
  const t = (key, vars) => I18N.t(key, vars);

  const RANGES = {
    '1W': { points: 6 },
    '1M': { points: 22 },
    '3M': { points: 64 },
    '1Y': { points: DAYS },
  };
  const rangeButtons = (attr, current) =>
    Object.keys(RANGES)
      .map((r) => `<button type="button" ${attr}="${r}" aria-pressed="${r === current}" aria-label="${UI.esc(t(`range.${r}.long`))}">${t(`range.${r}`)}</button>`)
      .join('');

  const state = {
    view: 'list',
    selectedId: null,
    range: '1M',
    detailRange: '1M',
    query: '',
    sector: 'all',
    qty: 1,
    qtyError: '',
    listScroll: 0,
  };

  const scroller = () => el.closest('.screens');
  const byId = (id) => companies.find((c) => c.id === id);
  const sharesLabel = (n) => t('common.shares', { count: n });
  const sector = (c) => t(`sector.${c.sector}`);
  const todayChange = (c) => ((c.path[DAYS - 1] - c.path[DAYS - 2]) / c.path[DAYS - 2]) * 100;
  const maxAffordable = (c) => Math.floor(SampleData.balance / c.price);

  function portfolioSeries(range) {
    const n = RANGES[range].points;
    const series = new Array(n).fill(0);
    companies.forEach((c) => {
      const shares = SampleData.holdings[c.id] || 0;
      if (!shares) return;
      c.path.slice(-n).forEach((price, i) => {
        series[i] += shares * price;
      });
    });
    return series;
  }

  const pctChange = (series) => (series[0] ? ((series[series.length - 1] - series[0]) / series[0]) * 100 : 0);

  function render() {
    if (state.view === 'detail') renderDetail();
    else renderList();
  }

  // ---------- List ----------
  function visibleCompanies() {
    const q = state.query.trim().toLowerCase();
    return companies.filter(
      (c) => (state.sector === 'all' || c.sector === state.sector) && (!q || c.name.toLowerCase().includes(q) || c.mark.toLowerCase().includes(q))
    );
  }

  function companyRows() {
    const list = visibleCompanies();
    if (!list.length) {
      return `<div class="empty">
          ${UI.icon('search', { size: 28 })}
          <strong>${t('invest.noResults.title')}</strong>
          <span>${t('invest.noResults.body')}</span>
        </div>`;
    }
    return `<ul class="list" role="list">${list.map(stockRow).join('')}</ul>`;
  }

  function renderList() {
    const sectors = [...new Set(companies.map((c) => c.sector))];
    const series = portfolioSeries(state.range);
    const value = series[series.length - 1];
    const hasHoldings = value > 0;
    const change = pctChange(series);
    const past = t(`range.${state.range}.past`);
    const chartLabel = hasHoldings
      ? t(change >= 0 ? 'invest.chart.up' : 'invest.chart.down', { pct: UI.pct(Math.abs(change)).replace('+', ''), period: past, from: UI.rwf(series[0]), to: UI.rwf(value) })
      : '';

    el.innerHTML = `
      <header class="screen-head">
        <div>
          <h1 class="screen-title">${t('invest.title')}</h1>
          <p class="screen-subtitle">${t('invest.subtitle')}</p>
        </div>
      </header>

      <div class="search">
        ${UI.icon('search', { size: 20 })}
        <input type="search" id="invest-search" value="${UI.esc(state.query)}" placeholder="${UI.esc(t('invest.search'))}" aria-label="${UI.esc(t('invest.search'))}" autocomplete="off">
      </div>

      <div class="filters" role="group" aria-label="${UI.esc(t('invest.filterLabel'))}">
        <button type="button" class="chip" data-sector="all" aria-pressed="${state.sector === 'all'}">${t('invest.filter.all')}</button>
        ${sectors.map((s) => `<button type="button" class="chip" data-sector="${s}" aria-pressed="${state.sector === s}">${t(`sector.${s}`)}</button>`).join('')}
      </div>

      <section class="section" aria-labelledby="market-title">
        <h2 id="market-title" class="sr-only">${t('invest.companies')}</h2>
        <div data-company-list aria-live="polite">${companyRows()}</div>
        <p class="section-intro">${t('invest.companiesIntro')}</p>
      </section>

      <section class="card-hero on-navy portfolio" aria-labelledby="portfolio-title">
        <div class="hero-top">
          <h2 id="portfolio-title" class="hero-label">${t('invest.yourShares')}</h2>
          <span class="tag tag-sim">${t('common.simulated')}</span>
        </div>
        <p class="hero-value">${UI.rwf(value)}</p>
        <p class="hero-change">
          ${UI.change(change)}
          <span class="num">${UI.signedRwf(value - series[0])}</span>
          <span>${past}</span>
        </p>
        <div class="hero-chart">
          ${hasHoldings ? UI.lineChart(series, { width: 320, height: 104, area: true, baseline: true, label: chartLabel }) : ''}
        </div>
        <p class="chart-note">${t('chart.startLine')}</p>
        <div class="segmented" role="group" aria-label="${UI.esc(t('invest.chartRange'))}">
          ${rangeButtons('data-range', state.range)}
        </div>
        <dl class="hero-split">
          <div><dt>${t('invest.available')}</dt><dd>${UI.rwf(SampleData.balance)}</dd></div>
        </dl>
      </section>

      <details class="card learn">
        <summary>${UI.icon('info', { size: 20 })}<span>${t('learn.share.q')}</span></summary>
        <p>${t('learn.share.a')}</p>
      </details>
    `;
  }

  function stockRow(c) {
    const month = c.path.slice(-22);
    const trend = month[month.length - 1] >= month[0] ? 'up' : 'down';
    const shares = SampleData.holdings[c.id] || 0;
    return `
      <li>
        <button type="button" class="row stock" data-stock="${c.id}">
          <span class="mark" aria-hidden="true">${UI.esc(c.mark)}</span>
          <span class="row-main">
            <span class="row-title">${UI.esc(c.name)}</span>
            <span class="row-meta stock-meta">
              <span class="num">${UI.rwf(c.price)}</span>
              ${UI.change(todayChange(c))}
              <span class="sr-only">${t('invest.todaySimPrice')}</span>
            </span>
            ${shares ? `<span class="row-meta">${t('invest.youOwn', { shares: sharesLabel(shares) })}</span>` : ''}
          </span>
          <span class="spark ${trend}" aria-hidden="true">${UI.lineChart(month, { width: 64, height: 28, strokeWidth: 1.75, padding: 3 })}</span>
          <span class="row-chevron">${UI.icon('chevronRight', { size: 20 })}</span>
        </button>
      </li>`;
  }

  // ---------- Company detail ----------
  function qtyError(c, qty) {
    if (!qty || qty < 1) return t('buy.error.qty');
    if (qty * c.price > SampleData.balance) return t('buy.error.qtyBalance', { shares: sharesLabel(qty), amount: UI.rwf(qty * c.price) });
    return '';
  }

  function renderDetail() {
    const c = byId(state.selectedId);
    const range = RANGES[state.detailRange];
    const past = t(`range.${state.detailRange}.past`);
    const series = c.path.slice(-range.points);
    const change = pctChange(series);
    const trend = change >= 0 ? 'up' : 'down';
    const shares = SampleData.holdings[c.id] || 0;
    const summary = t(change >= 0 ? 'invest.priceChart.up' : 'invest.priceChart.down', {
      pct: UI.pct(Math.abs(change)).replace('+', ''),
      period: past,
      from: UI.rwf(series[0]),
      to: UI.rwf(series[series.length - 1]),
    });
    const max = maxAffordable(c);

    el.innerHTML = `
      <div class="title-row detail-head">
        <button type="button" class="icon-btn back-icon" data-action="back" aria-label="${UI.esc(t('common.back'))}">${UI.icon('chevronLeft', { size: 22 })}</button>
        <span class="mark mark-lg" aria-hidden="true">${UI.esc(c.mark)}</span>
        <div class="detail-name">
          <h1 class="detail-title" tabindex="-1">${UI.esc(c.name)}</h1>
          <p class="small muted">${t('invest.listed', { sector: sector(c) })}</p>
        </div>
      </div>

      <section class="card detail-price" aria-labelledby="detail-price-label">
        <div class="detail-price-row">
          <h2 id="detail-price-label" class="sr-only">${t('invest.simPrice')}</h2>
          <p class="detail-price-value num">${UI.rwf(c.price)}</p>
          <span class="tag tag-sim">${t('invest.simPrice')}</span>
        </div>
        <p class="detail-change">${UI.change(change)} <span class="muted">${past}</span></p>
        <div class="detail-chart ${trend}">
          ${UI.lineChart(series, { width: 320, height: 140, area: true, baseline: true, label: summary })}
        </div>
        <p class="chart-note">${t('chart.startLine')}</p>
        <div class="segmented" role="group" aria-label="${UI.esc(t('invest.chartRange'))}">
          ${rangeButtons('data-detail-range', state.detailRange)}
        </div>
      </section>

      ${
        shares
          ? `
        <section class="card position" aria-labelledby="position-title">
          <h2 id="position-title" class="section-title">${t('invest.position')}</h2>
          <dl class="summary">
            <div><dt>${t('invest.sharesLabel')}</dt><dd>${UI.groupDigits(shares)}</dd></div>
            <div><dt>${t('invest.valueAtSim')}</dt><dd>${UI.rwf(shares * c.price)}</dd></div>
          </dl>
        </section>`
          : ''
      }

      <section class="card buy-box" aria-labelledby="qty-title">
        <h2 id="qty-title" class="section-title">${t('buy.howMany')}</h2>
        <div class="stepper">
          <button type="button" data-qty="-1" aria-label="${UI.esc(t('buy.decrease'))}" ${state.qty <= 1 ? 'disabled' : ''}>${UI.icon('minus', { size: 20 })}</button>
          <input id="buy-qty" inputmode="numeric" autocomplete="off" value="${state.qty}" aria-label="${UI.esc(t('buy.qtyLabel'))}"
            aria-describedby="qty-cost${state.qtyError ? ' qty-error' : ''}" ${state.qtyError ? 'aria-invalid="true"' : ''}>
          <button type="button" data-qty="1" aria-label="${UI.esc(t('buy.increase'))}" ${state.qty >= max ? 'disabled' : ''}>${UI.icon('plus', { size: 20 })}</button>
        </div>
        <p class="qty-cost" id="qty-cost" aria-live="polite">${t('buy.estLine', { amount: UI.rwf(state.qty * c.price) })}</p>
        <p class="hint">${t('buy.available', { amount: UI.rwf(SampleData.balance) })}</p>
        ${state.qtyError ? `<p class="error" id="qty-error" role="alert">${UI.icon('alert', { size: 16 })}<span>${state.qtyError}</span></p>` : ''}
        <button type="button" class="btn btn-success btn-block" data-action="buy">${t('buy.buyShares')}</button>
        <p class="small muted center">${t('buy.noRealTrade')}</p>
      </section>

      <div class="notice notice-warn">
        ${UI.icon('alert')}
        <p>${t('invest.risk')}</p>
      </div>
    `;
  }

  // ---------- Buy sheet: review → processing → success ----------
  function openBuy(c, qty) {
    const sheet = UI.openSheet({ title: t('buy.reviewTitle') });
    let acknowledged = false;
    const cost = qty * c.price;

    function stepReview(error = '') {
      sheet.setTitle(t('buy.reviewTitle'));
      sheet.body.innerHTML = `
        <dl class="summary">
          <div><dt>${t('buy.company')}</dt><dd>${UI.esc(c.name)}</dd></div>
          <div><dt>${t('invest.sharesLabel')}</dt><dd>${UI.groupDigits(qty)}</dd></div>
          <div><dt>${t('invest.simPrice')}</dt><dd>${UI.rwf(c.price)}</dd></div>
          <div><dt>${t('buy.estCost')}</dt><dd>${UI.rwf(cost)}</dd></div>
          <div><dt>${t('buy.cashAfter')}</dt><dd>${UI.rwf(SampleData.balance - cost)}</dd></div>
          <div><dt>${t('buy.fees')}</dt><dd>${t('buy.feesValue')}</dd></div>
          <div><dt>${t('buy.placedThrough')}</dt><dd>${t('buy.broker')}</dd></div>
        </dl>
        <div class="notice notice-ok">
          ${UI.icon('info')}
          <p>${t('buy.simNotice')}</p>
        </div>
        ${
          SampleData.kyc.status === 'verified'
            ? ''
            : `<div class="notice notice-warn">${UI.icon('shield')}<p>${t('buy.kycNotice')}</p></div>`
        }
        <label class="check">
          <input type="checkbox" id="buy-ack" ${acknowledged ? 'checked' : ''} ${error ? 'aria-invalid="true" aria-describedby="ack-error"' : ''}>
          <span>${t('buy.ack')}</span>
        </label>
        ${error ? `<p class="error" id="ack-error" role="alert">${UI.icon('alert', { size: 16 })}<span>${error}</span></p>` : ''}
        <div class="sheet-actions">
          <button type="button" class="btn btn-success btn-block" data-step="confirm">${t('buy.confirmPurchase')}</button>
          <button type="button" class="btn btn-quiet btn-block" data-sheet-close>${t('common.cancel')}</button>
        </div>
      `;
      if (error) sheet.body.querySelector('#buy-ack').focus();
    }

    async function confirm() {
      if (!acknowledged) {
        stepReview(t('common.ackError'));
        return;
      }
      const button = sheet.body.querySelector('[data-step="confirm"]');
      button.setAttribute('aria-busy', 'true');
      button.innerHTML = `<span class="spinner" aria-hidden="true"></span><span>${t('buy.placing')}</span>`;
      sheet.body.querySelectorAll('button, input').forEach((node) => {
        node.disabled = true;
      });
      sheet.lock();
      UI.announce(t('buy.placing'));
      await UI.wait(1100);
      // Shared data: Home, History and Our Circle stay in step
      SampleData.recordBuy({ companyId: c.id, shares: qty, cost });
      sheet.unlock();
      stepSuccess();
    }

    function stepSuccess() {
      sheet.setTitle(t('buy.placedTitle'));
      sheet.body.innerHTML = `
        <div class="result">
          ${UI.illustration('purchaseSuccess', { banner: true, className: 'success-frame' })}
          <h3 class="result-title">${t('buy.successTitle')}</h3>
          <p class="muted">${t('buy.placedBody', { shares: sharesLabel(qty), company: UI.esc(c.name), amount: UI.rwf(cost) })}</p>
        </div>
        <dl class="summary">
          <div><dt>${t('buy.nowHeld')}</dt><dd>${UI.groupDigits(SampleData.holdings[c.id])}</dd></div>
          <div><dt>${t('invest.available')}</dt><dd>${UI.rwf(SampleData.balance)}</dd></div>
        </dl>
        <div class="notice notice-ok">
          ${UI.icon('info')}
          <p>${t('buy.placedNotice')}</p>
        </div>
        <div class="sheet-actions">
          <button type="button" class="btn btn-primary btn-block" data-step="portfolio">${t('buy.viewPortfolio')}</button>
          <button type="button" class="btn btn-secondary btn-block" data-step="done">${t('buy.another')}</button>
        </div>
      `;
      sheet.focusTitle();
    }

    sheet.body.addEventListener('change', (event) => {
      if (event.target.id === 'buy-ack') acknowledged = event.target.checked;
    });
    sheet.body.addEventListener('click', (event) => {
      const button = event.target.closest('button');
      if (!button) return;
      if (button.dataset.step === 'confirm') confirm();
      if (button.dataset.step === 'portfolio') {
        sheet.close({ silent: true });
        state.view = 'list';
        render();
        UI.announce(t('buy.placedAnnounce', { company: c.name }));
        document.querySelector('.tab[data-tab="home"]').click();
        return;
      }
      if (button.dataset.step === 'done') {
        sheet.close({ silent: true });
        state.view = 'list';
        state.qtyError = '';
        render();
        scroller().scrollTop = 0;
        UI.announce(t('buy.placedAnnounce', { company: c.name }));
        const search = el.querySelector('#invest-search');
        if (search) search.focus();
      }
    });

    stepReview();
  }

  // ---------- Events ----------
  function openCompany(id) {
    state.listScroll = scroller().scrollTop;
    state.selectedId = id;
    state.detailRange = '1M';
    const c = byId(id);
    state.qty = Math.max(1, Math.min(10, maxAffordable(c)));
    state.qtyError = '';
    state.view = 'detail';
    render();
    scroller().scrollTop = 0;
    el.querySelector('.detail-title').focus();
  }

  function setQty(qty) {
    const c = byId(state.selectedId);
    state.qty = Math.max(0, Math.min(qty, 999999));
    state.qtyError = '';
    const input = el.querySelector('#buy-qty');
    if (input && document.activeElement === input) {
      // Update the cost line and buttons without redrawing the field being typed in
      el.querySelector('#qty-cost').textContent = t('buy.estLine', { amount: UI.rwf(state.qty * c.price) });
      // Clear any earlier error as soon as the number changes
      const err = el.querySelector('#qty-error');
      if (err) err.remove();
      input.removeAttribute('aria-invalid');
      input.setAttribute('aria-describedby', 'qty-cost');
      el.querySelector('[data-qty="-1"]').disabled = state.qty <= 1;
      el.querySelector('[data-qty="1"]').disabled = state.qty >= maxAffordable(c);
      return;
    }
    render();
  }

  el.addEventListener('input', (event) => {
    if (event.target.id === 'invest-search') {
      state.query = event.target.value;
      el.querySelector('[data-company-list]').innerHTML = companyRows();
    }
    if (event.target.id === 'buy-qty') {
      const digits = event.target.value.replace(/\D/g, '').slice(0, 6);
      event.target.value = digits;
      setQty(Number(digits) || 0);
    }
  });

  el.addEventListener('click', (event) => {
    const button = event.target.closest('button');
    if (!button || !el.contains(button)) return;

    if (button.dataset.range) {
      state.range = button.dataset.range;
      render();
      el.querySelector(`[data-range="${state.range}"]`).focus();
    } else if (button.dataset.detailRange) {
      state.detailRange = button.dataset.detailRange;
      render();
      el.querySelector(`[data-detail-range="${state.detailRange}"]`).focus();
    } else if (button.dataset.sector) {
      state.sector = button.dataset.sector;
      el.querySelectorAll('[data-sector]').forEach((chip) => chip.setAttribute('aria-pressed', String(chip.dataset.sector === state.sector)));
      el.querySelector('[data-company-list]').innerHTML = companyRows();
    } else if (button.dataset.stock) {
      openCompany(button.dataset.stock);
    } else if (button.dataset.qty) {
      setQty(state.qty + Number(button.dataset.qty));
      const again = el.querySelector(`[data-qty="${button.dataset.qty}"]`);
      if (again && !again.disabled) again.focus();
      else el.querySelector('#buy-qty').focus();
    } else if (button.dataset.action === 'back') {
      const lastId = state.selectedId;
      state.view = 'list';
      render();
      scroller().scrollTop = state.listScroll;
      const row = el.querySelector(`[data-stock="${lastId}"]`);
      if (row) row.focus({ preventScroll: true });
    } else if (button.dataset.action === 'buy') {
      const c = byId(state.selectedId);
      state.qtyError = qtyError(c, state.qty);
      if (state.qtyError) {
        render();
        el.querySelector('#buy-qty').focus();
        return;
      }
      openBuy(c, state.qty);
    }
  });

  // Home opens a company directly from "Your shares"
  window.InvestScreen = { openCompany };

  // Tapping the Invest tab again goes back to the company list
  el.addEventListener('tabreselect', () => {
    if (state.view === 'list') return;
    state.view = 'list';
    render();
  });

  // Switching language keeps the current view and data
  I18N.onChange(render);

  // A full demo reset (Profile) puts Invest back on its list view
  SampleData.onChange((kind) => {
    if (kind !== 'reset') return;
    state.view = 'list';
    state.range = '1M';
    state.query = '';
    state.sector = 'all';
    render();
  });

  render();
};
