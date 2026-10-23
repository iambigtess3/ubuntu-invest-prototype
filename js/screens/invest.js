// Invest tab
//
// Everything on this screen is simulated sample data: prices, balances,
// holdings and orders. No real market prices, money or trades.
// Views: "list" (portfolio + companies) and "detail" (one company + buy sheet).

window.Screens = window.Screens || {};

Screens.invest = function (el) {
  // ---------- Sample data (shared, from js/data.js; simulated, not real prices) ----------
  const { companies, DAYS } = SampleData;

  const RANGES = {
    '1W': { points: 6, label: 'past week' },
    '1M': { points: 22, label: 'past month' },
    '3M': { points: 64, label: 'past 3 months' },
    '1Y': { points: DAYS, label: 'past year' },
  };

  const state = {
    view: 'list',
    selectedId: null,
    range: '1M', // portfolio chart
    detailRange: '1M', // company chart
    orders: [], // simulated orders placed this session (balance and holdings live in SampleData)
    listScroll: 0,
  };

  const scroller = () => el.closest('.screens');
  const byId = (id) => companies.find((c) => c.id === id);
  const sharesLabel = (n) => `${UI.groupDigits(n)} ${n === 1 ? 'share' : 'shares'}`;

  // Value of the current holdings over the chosen range
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

  // ---------- Rendering ----------
  function render() {
    if (state.view === 'detail') renderDetail();
    else renderList();
  }

  function renderList() {
    const series = portfolioSeries(state.range);
    const value = series[series.length - 1];
    const hasHoldings = value > 0;
    const change = pctChange(series);
    const changeAmount = value - series[0];
    const range = RANGES[state.range];
    const owned = companies.filter((c) => SampleData.holdings[c.id]).length;
    const chartLabel = hasHoldings
      ? `Simulated portfolio value ${change >= 0 ? 'rose' : 'fell'} ${Math.abs(change).toFixed(1)}% over the ${range.label}, from ${UI.rwf(series[0])} to ${UI.rwf(value)}.`
      : '';

    el.innerHTML = `
      <header class="screen-head">
        <div>
          <h1 class="screen-title">Invest</h1>
          <p class="screen-subtitle">Rwanda Stock Exchange, simulated</p>
        </div>
      </header>

      <section class="card-hero on-navy portfolio" aria-labelledby="portfolio-title">
        <div class="portfolio-top">
          <h2 id="portfolio-title" class="portfolio-label">Your portfolio</h2>
          <span class="tag tag-sim">Simulated</span>
        </div>
        <p class="portfolio-value num">${UI.rwf(value)}</p>
        <p class="portfolio-change">
          ${UI.change(change)}
          <span class="num">${UI.signedRwf(changeAmount)}</span>
          <span>${range.label}</span>
        </p>
        <div class="portfolio-chart">
          ${hasHoldings ? UI.lineChart(series, { width: 320, height: 110, area: true, label: chartLabel }) : ''}
        </div>
        <div class="segmented" role="group" aria-label="Portfolio chart range">
          ${Object.keys(RANGES)
            .map((r) => `<button type="button" data-range="${r}" aria-pressed="${r === state.range}">${r}</button>`)
            .join('')}
        </div>
        <dl class="portfolio-foot">
          <div>
            <dt>Available to invest</dt>
            <dd class="num">${UI.rwf(SampleData.balance)}</dd>
          </div>
          <div>
            <dt>Holdings</dt>
            <dd class="num">${owned} ${owned === 1 ? 'company' : 'companies'}</dd>
          </div>
        </dl>
      </section>

      <section class="section" aria-labelledby="market-title">
        <h2 id="market-title" class="section-title">Companies</h2>
        <p class="section-intro">Prices are simulated for this prototype. They are not real or current market prices.</p>
        <ul class="stock-list" role="list">
          ${companies.map(stockRow).join('')}
        </ul>
      </section>

      <section class="section" aria-labelledby="orders-title">
        <h2 id="orders-title" class="section-title">Simulated orders</h2>
        ${state.orders.length ? ordersList() : emptyOrders()}
      </section>

      <p class="screen-footnote">
        Prototype only. Nothing on this screen is a real investment, price, balance or trade.
        Orders would be placed through a proposed licensed broker partner. Fees are to be confirmed with that partner.
      </p>
    `;
  }

  function stockRow(c) {
    const today = ((c.path[DAYS - 1] - c.path[DAYS - 2]) / c.path[DAYS - 2]) * 100;
    const month = c.path.slice(-RANGES['1M'].points);
    const trend = month[month.length - 1] >= month[0] ? 'up' : 'down';
    const shares = SampleData.holdings[c.id] || 0;
    return `
      <li>
        <button type="button" class="stock" data-stock="${c.id}">
          <span class="stock-mark" aria-hidden="true">${UI.esc(c.mark)}</span>
          <span class="stock-main">
            <span class="stock-name">${UI.esc(c.name)}</span>
            <span class="stock-meta">${shares ? `You own ${sharesLabel(shares)}` : UI.esc(c.sector)}</span>
          </span>
          <span class="stock-spark ${trend}" aria-hidden="true">
            ${UI.lineChart(month, { width: 64, height: 28, strokeWidth: 1.75, padding: 3 })}
          </span>
          <span class="stock-price">
            <span class="num stock-price-value">${UI.rwf(c.price)}</span>
            ${UI.change(today)}
            <span class="sr-only">today, simulated price</span>
          </span>
        </button>
      </li>`;
  }

  function ordersList() {
    return `
      <ul class="order-list" role="list">
        ${state.orders
          .map(
            (o) => `
          <li class="order">
            <span class="order-icon">${UI.icon('checkCircle')}</span>
            <span class="order-main">
              <span class="order-title">Bought ${sharesLabel(o.shares)} of ${UI.esc(o.name)}</span>
              <span class="order-meta">Simulated order at ${o.time}</span>
            </span>
            <span class="order-amount num">${UI.rwf(o.cost)}</span>
          </li>`
          )
          .join('')}
      </ul>`;
  }

  function emptyOrders() {
    return `
      <div class="empty">
        ${UI.icon('invest', { size: 28 })}
        <strong>No simulated orders yet</strong>
        <span>Choose a company above to try the buy flow.</span>
      </div>`;
  }

  function renderDetail() {
    const c = byId(state.selectedId);
    const range = RANGES[state.detailRange];
    const series = c.path.slice(-range.points);
    const change = pctChange(series);
    const trend = change >= 0 ? 'up' : 'down';
    const shares = SampleData.holdings[c.id] || 0;
    const summary = `Simulated price ${change >= 0 ? 'rose' : 'fell'} ${Math.abs(change).toFixed(1)}% over the ${range.label}, from ${UI.rwf(series[0])} to ${UI.rwf(series[series.length - 1])}.`;

    el.innerHTML = `
      <button type="button" class="back-btn" data-action="back">${UI.icon('chevronLeft', { size: 22 })}<span>Invest</span></button>

      <header class="detail-head">
        <span class="stock-mark stock-mark-lg" aria-hidden="true">${UI.esc(c.mark)}</span>
        <div>
          <h1 class="detail-title" tabindex="-1">${UI.esc(c.name)}</h1>
          <p class="small muted">${UI.esc(c.sector)}. Listed on the Rwanda Stock Exchange.</p>
        </div>
      </header>

      <section class="card detail-price" aria-labelledby="detail-price-label">
        <div class="detail-price-row">
          <h2 id="detail-price-label" class="sr-only">Simulated price</h2>
          <p class="detail-price-value num">${UI.rwf(c.price)}</p>
          <span class="tag tag-sim">Simulated price</span>
        </div>
        <p class="detail-change">${UI.change(change)} <span class="muted">${range.label}</span></p>
        <div class="detail-chart ${trend}">
          ${UI.lineChart(series, { width: 320, height: 140, area: true, label: summary })}
        </div>
        <div class="segmented" role="group" aria-label="Price chart range">
          ${Object.keys(RANGES)
            .map((r) => `<button type="button" data-detail-range="${r}" aria-pressed="${r === state.detailRange}">${r}</button>`)
            .join('')}
        </div>
      </section>

      ${
        shares
          ? `
        <section class="card position" aria-labelledby="position-title">
          <h2 id="position-title" class="section-title">Your simulated position</h2>
          <dl class="summary">
            <div><dt>Shares</dt><dd>${UI.groupDigits(shares)}</dd></div>
            <div><dt>Value at simulated price</dt><dd>${UI.rwf(shares * c.price)}</dd></div>
          </dl>
        </section>`
          : ''
      }

      <div class="notice notice-warn">
        ${UI.icon('alert')}
        <p>Share prices can go down as well as up, and you could get back less than you invest. Simulated past performance says nothing about future results.</p>
      </div>

      <div class="detail-cta">
        <button type="button" class="btn btn-primary btn-block" data-action="buy">Buy ${UI.esc(c.name)}</button>
        <p class="small muted center">Simulated order. No real trade is placed.</p>
      </div>
    `;
  }

  // ---------- Buy flow (bottom sheet) ----------
  function openBuy(c) {
    const sheet = UI.openSheet({ title: `Buy ${c.name}` });
    sheet.body.classList.add('buy-sheet'); // lets invest.css size the quick-amount chips
    let amount = 0;
    let acknowledged = false;

    const estimate = () => {
      const shares = Math.floor(amount / c.price);
      return { shares, cost: shares * c.price };
    };

    function validate() {
      if (!amount) return 'Enter an amount to invest.';
      if (amount < c.price) return `Enter at least ${UI.rwf(c.price)} to buy one share.`;
      if (amount > SampleData.balance) return `That's more than your available sample balance of ${UI.rwf(SampleData.balance)}.`;
      return '';
    }

    function estimateText() {
      if (!amount) return 'Choose an amount to see an estimate.';
      if (amount < c.price) return `One share costs ${UI.rwf(c.price)} at the simulated price.`;
      const { shares, cost } = estimate();
      return `About ${sharesLabel(shares)}, estimated cost ${UI.rwf(cost)}.`;
    }

    function stepAmount(error = '') {
      sheet.setTitle(`Buy ${c.name}`);
      sheet.body.innerHTML = `
        <p class="small muted">Simulated price ${UI.rwf(c.price)} per share. In the live product, the final price would be set when an order is filled.</p>
        <div class="field">
          <label for="buy-amount">Amount to invest</label>
          <div class="input-wrap">
            <span class="input-prefix" aria-hidden="true">RWF</span>
            <input id="buy-amount" class="input" inputmode="numeric" autocomplete="off"
              value="${amount ? UI.groupDigits(amount) : ''}"
              aria-describedby="buy-hint${error ? ' buy-error' : ''}" ${error ? 'aria-invalid="true"' : ''}>
          </div>
          <p class="hint" id="buy-hint">Available: ${UI.rwf(SampleData.balance)} (sample balance)</p>
          ${error ? `<p class="error" id="buy-error" role="alert">${UI.icon('alert', { size: 16 })}<span>${error}</span></p>` : ''}
        </div>
        <div class="chips" role="group" aria-label="Quick amounts">
          ${[5000, 10000, 25000]
            .map((v) => `<button type="button" class="chip" data-amount="${v}" aria-pressed="${amount === v}">${UI.rwf(v)}</button>`)
            .join('')}
        </div>
        <p class="estimate" data-estimate aria-live="polite">${estimateText()}</p>
        <button type="button" class="btn btn-primary btn-block" data-step="review">Review order</button>
      `;
      if (error) sheet.body.querySelector('#buy-amount').focus();
    }

    function stepReview(error = '') {
      const { shares, cost } = estimate();
      sheet.setTitle('Review simulated order');
      sheet.body.innerHTML = `
        <dl class="summary">
          <div><dt>Company</dt><dd>${UI.esc(c.name)}</dd></div>
          <div><dt>Shares</dt><dd>${UI.groupDigits(shares)}</dd></div>
          <div><dt>Simulated price</dt><dd>${UI.rwf(c.price)}</dd></div>
          <div><dt>Estimated cost</dt><dd>${UI.rwf(cost)}</dd></div>
          <div><dt>Fees</dt><dd>To be confirmed with broker partner</dd></div>
          <div><dt>Placed through</dt><dd>Proposed licensed broker partner</dd></div>
        </dl>
        <div class="notice">
          ${UI.icon('info')}
          <p>This is a simulated order. No money moves and no trade is placed.</p>
        </div>
        <label class="check">
          <input type="checkbox" id="buy-ack" ${acknowledged ? 'checked' : ''} ${error ? 'aria-invalid="true" aria-describedby="ack-error"' : ''}>
          <span>I understand share prices can go down as well as up, and I could get back less than I invest.</span>
        </label>
        ${error ? `<p class="error" id="ack-error" role="alert">${UI.icon('alert', { size: 16 })}<span>${error}</span></p>` : ''}
        <div class="sheet-actions">
          <button type="button" class="btn btn-primary btn-block" data-step="confirm">Place simulated order</button>
          <button type="button" class="btn btn-quiet btn-block" data-step="amount">Change amount</button>
        </div>
      `;
      if (error) sheet.body.querySelector('#buy-ack').focus();
      else sheet.focusTitle();
    }

    async function confirm() {
      if (!acknowledged) {
        stepReview('Tick the box to confirm you understand the risk.');
        return;
      }
      const { shares, cost } = estimate();
      const button = sheet.body.querySelector('[data-step="confirm"]');
      button.setAttribute('aria-busy', 'true');
      button.innerHTML = '<span class="spinner" aria-hidden="true"></span><span>Placing simulated order…</span>';
      sheet.body.querySelectorAll('button, input').forEach((node) => {
        node.disabled = true;
      });
      sheet.lock();
      UI.announce('Placing simulated order');
      await UI.wait(1100);

      // Shared data: Home and Transaction history update automatically
      SampleData.recordBuy({ companyId: c.id, shares, cost });
      state.orders.unshift({
        name: c.name,
        shares,
        cost,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      });

      sheet.unlock();
      stepSuccess(shares, cost);
    }

    function stepSuccess(shares, cost) {
      sheet.setTitle('Order placed');
      sheet.body.innerHTML = `
        <div class="result">
          <span class="result-icon">${UI.icon('checkCircle', { size: 30 })}</span>
          <h3 class="result-title">Simulated order placed</h3>
          <p class="muted">You bought ${sharesLabel(shares)} of ${UI.esc(c.name)} for an estimated ${UI.rwf(cost)}.</p>
        </div>
        <dl class="summary">
          <div><dt>Shares now held</dt><dd>${UI.groupDigits(SampleData.holdings[c.id])}</dd></div>
          <div><dt>Available to invest</dt><dd>${UI.rwf(SampleData.balance)}</dd></div>
        </dl>
        <div class="notice">
          ${UI.icon('info')}
          <p>No real trade was made. In the live product, orders would go through the proposed licensed broker partner and could take time to complete.</p>
        </div>
        <button type="button" class="btn btn-primary btn-block" data-step="done">Done</button>
      `;
      sheet.focusTitle();
    }

    sheet.body.addEventListener('input', (event) => {
      if (event.target.id === 'buy-amount') {
        const digits = event.target.value.replace(/\D/g, '').slice(0, 9);
        amount = Number(digits) || 0;
        event.target.value = digits ? UI.groupDigits(amount) : '';
        event.target.removeAttribute('aria-invalid');
        sheet.body.querySelectorAll('.chip').forEach((chip) => chip.setAttribute('aria-pressed', String(Number(chip.dataset.amount) === amount)));
        sheet.body.querySelector('[data-estimate]').textContent = estimateText();
      }
    });

    sheet.body.addEventListener('change', (event) => {
      if (event.target.id === 'buy-ack') acknowledged = event.target.checked;
    });

    sheet.body.addEventListener('keydown', (event) => {
      if (event.target.id === 'buy-amount' && event.key === 'Enter') {
        event.preventDefault();
        sheet.body.querySelector('[data-step="review"]').click();
      }
    });

    sheet.body.addEventListener('click', (event) => {
      const button = event.target.closest('button');
      if (!button) return;
      if (button.dataset.amount) {
        amount = Number(button.dataset.amount);
        stepAmount();
        sheet.body.querySelector(`[data-amount="${amount}"]`).focus();
      }
      const step = button.dataset.step;
      if (step === 'review') {
        const error = validate();
        if (error) stepAmount(error);
        else stepReview();
      }
      if (step === 'amount') {
        stepAmount();
        sheet.body.querySelector('#buy-amount').focus();
      }
      if (step === 'confirm') confirm();
      if (step === 'done') {
        sheet.close({ silent: true });
        render();
        // No toast: it would cover the Back button. The success screen and the
        // "Simulated orders" list already confirm the buy.
        UI.announce(`Simulated order placed: ${c.name}`);
        const buy = el.querySelector('[data-action="buy"]');
        if (buy) buy.focus();
      }
    });

    stepAmount();
  }

  // ---------- Events ----------
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
    } else if (button.dataset.stock) {
      state.listScroll = scroller().scrollTop;
      state.selectedId = button.dataset.stock;
      state.detailRange = '1M';
      state.view = 'detail';
      render();
      scroller().scrollTop = 0;
      el.querySelector('.detail-title').focus();
    } else if (button.dataset.action === 'back') {
      const lastId = state.selectedId;
      state.view = 'list';
      render();
      scroller().scrollTop = state.listScroll;
      const row = el.querySelector(`[data-stock="${lastId}"]`);
      if (row) row.focus({ preventScroll: true });
    } else if (button.dataset.action === 'buy') {
      openBuy(byId(state.selectedId));
    }
  });

  render();
};
