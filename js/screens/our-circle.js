// Our Circle tab
//
// Investor demo of group investing. Every member, amount and return is
// simulated sample data from js/data.js (SampleData.circle). No real money is
// held or moved, and returns are never guaranteed.
//
// Each member bought pool "units" at a different simulated price, so each share
// is tracked separately. The demo controls switch between a simulated gain and
// a simulated loss. Text comes from js/i18n/*.js; sentences about a member have
// a "you" version and a "member" version, because languages phrase them differently.

window.Screens = window.Screens || {};

Screens.circle = function (el) {
  const data = SampleData;
  const circle = data.circle;
  const MEMBERS = circle.members;
  const BAR_SCALE = 50000; // RWF represented by a full-width bar

  const t = (key, vars) => I18N.t(key, vars);
  // Picks the "you" or "member" version of a sentence, e.g. circle.sheet.title.you / .member
  const who = (m, key, vars = {}) => t(`${key}.${m.isYou ? 'you' : 'member'}`, { name: UI.esc(m.name), ...vars });
  const rule = () => t('circle.decision.rule', { count: circle.votesNeeded, total: MEMBERS.length });

  // A 6-month simulated path from the start unit price to `end`, with some wobble
  function poolPath(seed, end, points = 126) {
    const rand = UI.seeded(seed);
    const walk = [0];
    for (let i = 1; i < points; i++) walk.push(walk[i - 1] + (rand() - 0.5) * 0.035);
    const last = walk[points - 1];
    return walk.map((w, i) => {
      const t = i / (points - 1);
      return circle.startUnit + (end - circle.startUnit) * t + (w - last * t) * circle.startUnit;
    });
  }
  const paths = {};
  Object.entries(circle.scenarios).forEach(([key, s]) => {
    paths[key] = poolPath(s.seed, s.unit);
  });

  // ---------- Screen-only state (money state lives in SampleData) ----------
  const state = {
    tab: 'overview', // 'overview' | 'members'
    unchanged: new Set(), // members highlighted as "Unchanged" after a withdrawal
    lastWithdrawal: null,
    barsRevealed: false,
  };
  const shown = { pool: null, members: {} }; // last displayed numbers, for count animations

  const isWithdrawn = (m) => Boolean(circle.withdrawn[m.id]);
  const valueOf = (m) => data.circleMemberValue(m);
  const activeMembers = () => MEMBERS.filter((m) => !isWithdrawn(m));
  const poolValue = () => activeMembers().reduce((sum, m) => sum + valueOf(m), 0);
  const poolPutIn = () => activeMembers().reduce((sum, m) => sum + m.putIn, 0);
  const memberChange = (m) => ((valueOf(m) - m.putIn) / m.putIn) * 100;
  const byId = (id) => MEMBERS.find((m) => m.id === id);

  // ---------- Initial render ----------
  const COLORS = { savings: '#E2802A', pool: '#13355A', pending: '#8FB3DA' };

  function render() {
    el.innerHTML = `
      <header class="screen-head">
        <div>
          <h1 class="screen-title">${t('tab.circle')}</h1>
          <p class="screen-subtitle">${t('circle.tagline')}</p>
        </div>
        <button type="button" class="icon-btn" data-action="about" aria-label="${UI.esc(t('circle.about.title'))}">${UI.icon('info', { size: 22 })}</button>
      </header>

      ${UI.illustration('circle', { banner: true, className: 'circle-banner' })}

      <section aria-labelledby="circle-stats-title">
        <h2 id="circle-stats-title" class="sr-only">${t('circle.subtitle', { circle: UI.esc(circle.name), count: MEMBERS.length })}</h2>
        <p class="circle-name">${t('circle.subtitle', { circle: UI.esc(circle.name), count: MEMBERS.length })} <span class="tag tag-sim">${t('common.simulated')}</span></p>
        <dl class="stats">
          <div class="stat"><dt class="stat-label">${t('circle.stat.members')}</dt><dd class="stat-value" data-stat-members></dd></div>
          <div class="stat"><dt class="stat-label">${t('circle.stat.pool')}</dt><dd class="stat-value" data-circle-value></dd></div>
          <div class="stat"><dt class="stat-label">${t('circle.stat.change')}</dt><dd class="stat-value" data-stat-change></dd></div>
        </dl>
      </section>

      <div class="segmented circle-tabs" role="group" aria-label="${UI.esc(t('circle.tabsLabel'))}">
        <button type="button" data-tab-panel="overview" aria-pressed="${state.tab === 'overview'}">${t('circle.tab.overview')}</button>
        <button type="button" data-tab-panel="members" aria-pressed="${state.tab === 'members'}">${t('circle.tab.members')}</button>
      </div>

      <div class="circle-panel" data-panel="overview" ${state.tab === 'overview' ? '' : 'hidden'}>
        <button type="button" class="card your-share" data-member="${MEMBERS.find((m) => m.isYou).id}">
          <span class="your-share-art">${UI.peopleArt('pair')}</span>
          <span class="your-share-text">
            <span class="your-share-label">${t('circle.yourShare')}</span>
            <span class="your-share-value num" data-your-value></span>
            <span class="your-share-meta" data-your-meta></span>
          </span>
          <span class="row-chevron">${UI.icon('chevronRight', { size: 20 })}</span>
        </button>

        <section class="card breakdown-card" aria-labelledby="breakdown-title">
          <h2 id="breakdown-title" class="section-title">${t('circle.breakdown')}</h2>
          <div class="breakdown-body">
            <div class="breakdown-chart" data-donut></div>
            <ul class="breakdown-legend" role="list" data-legend></ul>
          </div>
          <p class="small muted">${t('circle.savingsNote')}</p>
        </section>

        <article class="card-hero on-navy pool" aria-labelledby="pool-title">
          <div class="hero-top">
            <h3 id="pool-title" class="hero-label">${t('circle.pool')}</h3>
            <span class="tag tag-sim">${t('common.simulated')}</span>
          </div>
          <p class="hero-value" data-pool-value></p>
          <p class="hero-change" data-pool-change></p>
          <div class="hero-chart" data-pool-chart></div>
          <p class="chart-note">${t('chart.startLine')}</p>
          <p class="pool-caption">${t('circle.poolCaption')}</p>
          <div class="decision">
            <span class="badge">${UI.icon('vote', { size: 16 })}${t(`circle.decision.${circle.decision}`)}</span>
            <p>${rule()}</p>
          </div>
        </article>

        <p class="pot-meta" data-next-payout></p>
        <button type="button" class="btn btn-secondary btn-block" data-tab-panel="members">${UI.icon('users', { size: 18 })}${t('circle.viewMembers')}</button>
      </div>

      <section class="section circle-panel" data-panel="members" aria-labelledby="members-title" ${state.tab === 'members' ? '' : 'hidden'}>
        <h2 id="members-title" class="section-title">${t('circle.members')}</h2>
        <p class="section-intro">${t('circle.membersIntro')}</p>
        <div class="bar-legend" aria-hidden="true">
          <span><i class="legend-swatch legend-value"></i>${t('circle.legend.value')}</span>
          <span><i class="legend-swatch legend-gain"></i>${t('circle.legend.gain')}</span>
          <span><i class="legend-swatch legend-loss"></i>${t('circle.legend.loss')}</span>
          <span><i class="legend-tick"></i>${t('circle.legend.putIn')}</span>
        </div>
        <div class="demo-result" data-demo-result role="status" hidden></div>
        <ul class="list member-list" role="list" data-member-list>
          ${MEMBERS.map(memberRow).join('')}
        </ul>
      </section>

      <section class="demo-controls" aria-labelledby="demo-title">
        <h2 id="demo-title" class="demo-title">${t('circle.demo.title')}</h2>
        <p class="small muted">${t('circle.demo.intro')}</p>
        <button type="button" class="switch" role="switch" aria-checked="false" data-action="scenario" aria-describedby="scenario-hint">
          <span>${t('circle.demo.loss')}</span>
          <span class="switch-track" aria-hidden="true"></span>
        </button>
        <p class="small muted" id="scenario-hint" data-scenario-hint></p>
        <button type="button" class="btn btn-secondary btn-block" data-action="reset">${UI.icon('refresh', { size: 18 })}${t('circle.demo.reset')}</button>
        <p class="small muted" data-reset-note aria-hidden="true"></p>
      </section>
    `;
  }

  // Switch between Overview and Members without redrawing (keeps the demo state)
  function setTab(tab, { focus = true } = {}) {
    state.tab = tab;
    el.querySelectorAll('.circle-tabs [data-tab-panel]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.tabPanel === tab)));
    el.querySelectorAll('[data-panel]').forEach((panel) => {
      panel.hidden = panel.dataset.panel !== tab;
    });
    if (tab === 'members' && !state.barsRevealed) revealBarsWhenVisible();
    if (focus) el.querySelector(`.circle-tabs [data-tab-panel="${tab}"]`).focus();
  }

  function memberRow(m) {
    return `
      <li>
        <button type="button" class="row member" data-member="${m.id}">
          <span class="member-avatar" data-avatar></span>
          <span class="member-body">
            <span class="member-top">
              <span class="row-title member-name"><span data-name></span>${m.isYou ? `<span class="you-tag">${t('common.you')}</span>` : ''}</span>
              <span class="row-amount" data-value></span>
            </span>
            <span class="bar" aria-hidden="true" data-bar>
              <span class="bar-track">
                <span class="bar-layer bar-base"></span>
                <span class="bar-layer bar-gain"></span>
                <span class="bar-layer bar-loss"></span>
              </span>
              <span class="bar-mark"></span>
            </span>
            <span class="member-bottom">
              <span class="row-meta num">${t('circle.putIn', { amount: UI.rwf(m.putIn) })}</span>
              <span data-change></span>
            </span>
            <span class="member-status" data-status></span>
          </span>
          <span class="row-chevron">${UI.icon('chevronRight', { size: 20 })}</span>
        </button>
      </li>`;
  }

  // ---------- Updates (numbers animate, bars glide) ----------
  function setBar(bar, m) {
    const v = Math.min(valueOf(m), BAR_SCALE) / BAR_SCALE;
    const p = Math.min(m.putIn, BAR_SCALE) / BAR_SCALE;
    const empty = isWithdrawn(m) || !state.barsRevealed;
    const set = (name, value) => bar.style.setProperty(name, String(value));
    if (empty) {
      ['--base', '--g0', '--g1', '--l0', '--l1'].forEach((name) => set(name, 0));
    } else if (v >= p) {
      set('--base', p);
      set('--g0', p);
      set('--g1', v);
      set('--l0', p);
      set('--l1', p);
    } else {
      set('--base', v);
      set('--g0', v);
      set('--g1', v);
      set('--l0', v);
      set('--l1', p);
    }
    set('--mark', p);
    bar.classList.toggle('is-empty', isWithdrawn(m));
  }

  function update({ animate = true } = {}) {
    const you = data.yourCircleMember(); // keeps your name in sync with the profile
    const value = poolValue();
    const putIn = poolPutIn();
    const change = putIn ? ((value - putIn) / putIn) * 100 : 0;

    // Circle value card, your share card and the breakdown donut
    const pending = MEMBERS.reduce((sum, m) => sum + (circle.withdrawn[m.id] ? circle.withdrawn[m.id].payout : 0), 0);
    el.querySelector('[data-circle-value]').textContent = UI.rwf(value);
    el.querySelector('[data-stat-members]').textContent = I18N.formatNumber(MEMBERS.length);
    el.querySelector('[data-stat-change]').innerHTML = UI.change(putIn ? ((value - putIn) / putIn) * 100 : 0);
    const yourValue = data.yourCircleValue();
    const yourPending = data.yourPendingPayout();
    el.querySelector('[data-your-value]').textContent = UI.rwf(yourPending || yourValue);
    el.querySelector('[data-your-meta]').innerHTML = yourPending
      ? `<span class="tag tag-sim">${t('common.pending')}</span>`
      : `${t('home.ofPool', { pct: UI.pct(value ? (yourValue / value) * 100 : 0, 0).replace('+', '') })}`;
    const parts = [
      { key: 'savings', label: t('circle.savings'), value: circle.savingsTotal, color: COLORS.savings },
      { key: 'pool', label: t('circle.pool'), value, color: COLORS.pool },
      { key: 'pending', label: t('circle.breakdown.pending'), value: pending, color: COLORS.pending },
    ];
    el.querySelector('[data-donut]').innerHTML = UI.donut(parts, { size: 112, thickness: 18 });
    el.querySelector('[data-legend]').innerHTML = parts
      .map((p) => `<li><i class="legend-dot" style="background:${p.color}"></i><span>${p.label}</span><strong class="num">${UI.rwf(p.value)}</strong></li>`)
      .join('');

    el.querySelector('[data-next-payout]').textContent = t('circle.nextPayout', { name: you.name, date: I18N.formatDate(circle.nextPayoutDate, 'dayMonthLong') });

    // Pool numbers
    const poolValueEl = el.querySelector('[data-pool-value]');
    if (animate && shown.pool !== null) UI.animateNumber(poolValueEl, shown.pool, value, UI.rwf);
    else poolValueEl.textContent = UI.rwf(value);
    shown.pool = value;

    el.querySelector('[data-pool-change]').innerHTML = putIn
      ? `${UI.change(change)}<span>${t('circle.sinceStart', { amount: UI.rwf(putIn) })}</span>`
      : `<span>${t('circle.poolEmpty')}</span>`;

    const path = paths[circle.scenario];
    const total = ((path[path.length - 1] - path[0]) / path[0]) * 100;
    el.querySelector('[data-pool-chart]').innerHTML = UI.lineChart(path, {
      width: 320,
      height: 96,
      area: true,
      baseline: true,
      label: t(total >= 0 ? 'circle.chart.up' : 'circle.chart.down', { pct: UI.pct(Math.abs(total)).replace('+', '') }),
    });

    // Members
    MEMBERS.forEach((m) => {
      const row = el.querySelector(`.member[data-member="${m.id}"]`);
      row.querySelector('span[data-name]').textContent = m.name;
      const avatar = row.querySelector('[data-avatar]');
      if (avatar.dataset.avatarFor !== m.name) {
        avatar.dataset.avatarFor = m.name; // remembers who is drawn, so it's only redrawn when the name changes
        avatar.innerHTML = UI.avatar(m.isYou ? 'you' : m.name, { you: m.isYou, size: 44 });
      }

      const valueEl = row.querySelector('[data-value]');
      const memberValue = valueOf(m);
      const previous = shown.members[m.id];
      if (animate && previous !== undefined) UI.animateNumber(valueEl, previous, memberValue, UI.rwf);
      else valueEl.textContent = UI.rwf(memberValue);
      shown.members[m.id] = memberValue;

      setBar(row.querySelector('[data-bar]'), m);
      row.querySelector('[data-change]').innerHTML = isWithdrawn(m) ? '' : UI.change(memberChange(m));

      const status = row.querySelector('[data-status]');
      row.classList.toggle('is-withdrawn', isWithdrawn(m));
      row.classList.toggle('is-unchanged', state.unchanged.has(m.id));
      if (isWithdrawn(m)) {
        status.innerHTML = `${UI.icon('clock', { size: 15 })}<span>${t('circle.status.requested')}</span>`;
      } else if (state.unchanged.has(m.id)) {
        status.innerHTML = `${UI.icon('check', { size: 15 })}<span>${t('circle.status.unchanged')}</span>`;
      } else {
        status.innerHTML = '';
      }
    });

    // Demo controls
    el.querySelector('[data-action="scenario"]').setAttribute('aria-checked', String(circle.scenario === 'loss'));
    el.querySelector('[data-scenario-hint]').textContent =
      circle.scenario === 'loss'
        ? t('circle.demo.hintLoss')
        : t('circle.demo.hintGain');

    // Result banner after a withdrawal
    const result = el.querySelector('[data-demo-result]');
    const last = state.lastWithdrawal && byId(state.lastWithdrawal);
    if (last && isWithdrawn(last)) {
      const others = MEMBERS.filter((m) => m.id !== last.id && !isWithdrawn(m)).length;
      result.hidden = false;
      result.innerHTML = `
        ${UI.icon('checkCircle', { size: 20 })}
        <p><strong>${who(last, 'circle.result.title')}</strong>
        ${t('circle.result.payout', { amount: UI.rwf(circle.withdrawn[last.id].payout) })}
        ${others ? t('circle.result.others', { count: others }) : t('circle.result.savingsOnly')}</p>`;
    } else {
      result.hidden = true;
      result.innerHTML = '';
    }
  }

  // Bars grow in the first time the member list scrolls into view
  function revealBarsWhenVisible() {
    const list = el.querySelector('[data-member-list]');
    const reveal = () => {
      if (state.barsRevealed) return;
      state.barsRevealed = true;
      MEMBERS.forEach((m) => setBar(el.querySelector(`.member[data-member="${m.id}"] [data-bar]`), m));
    };
    if (UI.reducedMotion() || !('IntersectionObserver' in window)) {
      reveal();
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          observer.disconnect();
          setTimeout(reveal, 150);
        }
      },
      { threshold: 0.2 }
    );
    observer.observe(list);
  }

  // ---------- Member sheet and withdrawal flow ----------
  function openMember(m) {
    const sheet = UI.openSheet({ title: who(m, 'circle.sheet.title') });
    let acknowledged = false;

    function overview() {
      sheet.setTitle(who(m, 'circle.sheet.title'));
      if (isWithdrawn(m)) {
        sheet.body.innerHTML = `
          ${UI.illustration('withdrawalPending', { banner: true })}
          <h3 class="result-title">${t('circle.pending.title')}</h3>
          <dl class="summary">
            <div><dt>${t('circle.warn.payout')}</dt><dd>${UI.rwf(circle.withdrawn[m.id].payout)}</dd></div>
            <div><dt>${t('circle.legend.putIn')}</dt><dd>${UI.rwf(m.putIn)}</dd></div>
            <div><dt>${t('circle.sheet.stillInvested')}</dt><dd>${UI.rwf(0)}</dd></div>
            <div><dt>${t('circle.pending.status')}</dt><dd><span class="status status-pending">${t('common.pending')}</span></dd></div>
          </dl>
          <div class="notice notice-ok">
            ${UI.icon('clock')}
            <p>${t('circle.sheet.requestedBody', { amount: UI.rwf(circle.withdrawn[m.id].payout) })}</p>
          </div>
          <p class="small muted">${t('circle.sheet.replayHint')}</p>
          <button type="button" class="btn btn-secondary btn-block" data-step="close">${t('common.close')}</button>`;
        return;
      }
      const value = valueOf(m);
      const share = (value / poolValue()) * 100;
      sheet.body.innerHTML = `
        <dl class="summary">
          <div><dt>${t('circle.legend.putIn')}</dt><dd>${UI.rwf(m.putIn)}</dd></div>
          <div><dt>${t('circle.sheet.valueNow')}</dt><dd>${UI.rwf(value)}</dd></div>
          <div><dt>${t('circle.sheet.change')}</dt><dd>${UI.change(memberChange(m))}</dd></div>
          <div><dt>${t('circle.sheet.shareOfPool')}</dt><dd>${UI.pct(share).replace('+', '')}</dd></div>
        </dl>
        <div class="notice">
          ${UI.icon('coins')}
          <p>${who(m, 'circle.sheet.savingsSeparate')}</p>
        </div>
        <div class="sheet-actions">
          <button type="button" class="btn btn-primary btn-block" data-step="warn">${t('circle.sheet.simulate')}</button>
          <button type="button" class="btn btn-quiet btn-block" data-step="close">${t('common.close')}</button>
        </div>`;
    }

    function warning(error = '') {
      const value = valueOf(m);
      const loss = value < m.putIn;
      const others = activeMembers().length - 1;
      sheet.setTitle(who(m, 'circle.warn.title'));
      sheet.body.innerHTML = `
        <div class="payout">
          <span class="payout-label">${t('circle.warn.payout')}</span>
          <span class="payout-value num">${UI.rwf(value)}</span>
          <span class="payout-sub">${t('circle.putIn', { amount: UI.rwf(m.putIn) })}, ${UI.change(memberChange(m))}</span>
        </div>
        ${
          loss
            ? `<div class="notice notice-danger">
                ${UI.icon('alert')}
                <p><strong>${who(m, 'circle.warn.loss', { amount: UI.rwf(m.putIn - value) })}</strong> ${t('circle.warn.lockIn')}</p>
              </div>`
            : ''
        }
        <ul class="warn-list" role="list">
          <li>${UI.icon('alert')}<span>${t('circle.warn.risk')}</span></li>
          <li>${UI.icon('clock')}<span>${t('circle.warn.timing')}</span></li>
          <li>${UI.icon('info')}<span>${t('circle.warn.fees')}</span></li>
          <li>${UI.icon('users')}<span>${others > 0 ? t('circle.warn.others', { count: others }) : t('circle.warn.savingsOnly')}</span></li>
        </ul>
        <label class="check">
          <input type="checkbox" id="wd-ack" ${acknowledged ? 'checked' : ''} ${error ? 'aria-invalid="true" aria-describedby="wd-error"' : ''}>
          <span>${loss ? t('circle.warn.ackLoss') : t('circle.warn.ackGain')}</span>
        </label>
        ${error ? `<p class="error" id="wd-error" role="alert">${UI.icon('alert', { size: 16 })}<span>${error}</span></p>` : ''}
        <div class="sheet-actions">
          <button type="button" class="btn btn-primary btn-block" data-step="confirm">${t('circle.warn.confirm')}</button>
          <button type="button" class="btn btn-quiet btn-block" data-step="back">${t('common.goBack')}</button>
        </div>`;
      if (error) sheet.body.querySelector('#wd-ack').focus();
      else sheet.focusTitle();
    }

    async function confirm() {
      if (!acknowledged) {
        warning(t('common.ackError'));
        return;
      }
      const button = sheet.body.querySelector('[data-step="confirm"]');
      button.setAttribute('aria-busy', 'true');
      button.innerHTML = `<span class="spinner" aria-hidden="true"></span><span>${t('circle.warn.requesting')}</span>`;
      sheet.body.querySelectorAll('button, input').forEach((node) => {
        node.disabled = true;
      });
      sheet.lock();
      UI.announce(t('circle.warn.requesting'));
      await UI.wait(1100);

      sheet.close({ silent: true });
      applyWithdrawal(m);
    }

    sheet.body.addEventListener('change', (event) => {
      if (event.target.id === 'wd-ack') acknowledged = event.target.checked;
    });

    sheet.body.addEventListener('click', (event) => {
      const button = event.target.closest('button');
      if (!button) return;
      const step = button.dataset.step;
      if (step === 'warn') warning();
      if (step === 'back') {
        overview();
        sheet.focusTitle();
      }
      if (step === 'confirm') confirm();
      if (step === 'close') sheet.close();
    });

    overview();
  }

  // The key moment: one member leaves, everyone else stays exactly the same
  function applyWithdrawal(m) {
    if (state.tab !== 'members') setTab('members', { focus: false }); // the audience sees the bars move
    state.lastWithdrawal = m.id;
    state.unchanged = new Set();
    state.barsRevealed = true;
    const payout = data.requestCircleWithdrawal(m.id); // shared data: Home and history update too

    const row = el.querySelector(`.member[data-member="${m.id}"]`);
    row.classList.add('is-flash');
    setTimeout(() => row.classList.remove('is-flash'), 1600);

    update();

    // Centre the member (after the result banner appears) so the audience sees
    // their bar empty while the others stay put
    row.scrollIntoView({ block: 'center', behavior: UI.reducedMotion() ? 'auto' : 'smooth' });

    // After the selected bar empties, label the others as unchanged
    setTimeout(
      () => {
        activeMembers().forEach((other) => state.unchanged.add(other.id));
        update({ animate: false });
      },
      UI.reducedMotion() ? 0 : 650
    );

    row.focus({ preventScroll: true });
    const others = activeMembers().length;
    setTimeout(() => {
      UI.announce(
        `${who(m, 'circle.result.title')} ${t('circle.result.payout', { amount: UI.rwf(payout) })} ` +
          `${t('circle.announce.pool', { amount: UI.rwf(poolValue()) })} ${others ? t('circle.result.others', { count: others }) : ''}`
      );
    }, 900);
  }

  function aboutSheet() {
    const sheet = UI.openSheet({ title: t('circle.about.title') });
    sheet.body.innerHTML = `
      ${circleArt()}
      <p>${t('circle.about.intro')}</p>
      <ul class="warn-list" role="list">
        <li>${UI.icon('coins')}<span><strong>${t('circle.savings')}</strong> ${t('circle.about.savings')}</span></li>
        <li>${UI.icon('invest')}<span><strong>${t('circle.pool')}</strong> ${t('circle.about.pool')}</span></li>
        <li>${UI.icon('vote')}<span><strong>${t('circle.about.decisionsTitle')}</strong> ${t('circle.about.decisions', { rule: rule() })}</span></li>
        <li>${UI.icon('clock')}<span><strong>${t('circle.about.leavingTitle')}</strong> ${t('circle.about.leaving')}</span></li>
      </ul>
      <div class="notice notice-warn">
        ${UI.icon('info')}
        <p>${t('circle.about.legal')}</p>
      </div>
      <button type="button" class="btn btn-secondary btn-block" data-sheet-close>${t('common.close')}</button>`;
  }

  // Illustration for the How it works sheet: separate pots, members around a shared pool
  function circleArt() {
    const dots = Array.from({ length: 5 }, (_, i) => {
      const a = (i / 5) * Math.PI * 2 - Math.PI / 2;
      return `<circle cx="${(150 + Math.cos(a) * 46).toFixed(1)}" cy="${(70 + Math.sin(a) * 46).toFixed(1)}" r="9" fill="${i === 1 ? '#13355A' : '#6E9BCB'}"/>`;
    }).join('');
    return `
      <svg class="circle-art" viewBox="0 0 220 140" aria-hidden="true" focusable="false">
        <rect x="8" y="40" width="64" height="60" rx="12" fill="#FCEEDF"/>
        <ellipse cx="40" cy="62" rx="18" ry="7" fill="none" stroke="#8A4B0B" stroke-width="3"/>
        <path d="M22 62v12c0 4 8 7 18 7s18-3 18-7V62" fill="none" stroke="#8A4B0B" stroke-width="3"/>
        <circle cx="150" cy="70" r="46" fill="none" stroke="#E2802A" stroke-width="2" stroke-dasharray="4 5"/>
        <circle cx="150" cy="70" r="18" fill="#E2802A"/>
        <path d="M142 74l6-6 4 4 7-8" fill="none" stroke="#FFFFFF" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
        ${dots}
        <path d="M84 70h12" stroke="#B7C6D8" stroke-width="2" stroke-dasharray="3 4"/>
      </svg>`;
  }

  function clearScreenState() {
    state.unchanged = new Set();
    state.lastWithdrawal = null;
  }

  // ---------- Events ----------
  el.addEventListener('click', (event) => {
    const button = event.target.closest('button');
    if (!button || !el.contains(button)) return;

    const resetNote = el.querySelector('[data-reset-note]');
    if (resetNote && button.dataset.action !== 'reset') resetNote.textContent = '';

    if (button.dataset.tabPanel) {
      setTab(button.dataset.tabPanel);
    } else if (button.dataset.member) {
      openMember(byId(button.dataset.member));
    } else if (button.dataset.action === 'scenario') {
      state.unchanged = new Set();
      state.barsRevealed = true;
      data.setCircleScenario(circle.scenario === 'gain' ? 'loss' : 'gain');
      UI.announce(`${circle.scenario === 'loss' ? t('circle.demo.hintLoss') : t('circle.demo.hintGain')} ${t('circle.announce.pool', { amount: UI.rwf(poolValue()) })}`);
    } else if (button.dataset.action === 'reset') {
      clearScreenState();
      state.barsRevealed = true;
      data.resetCircle();
      resetNote.textContent = t('circle.demo.resetNote');
      UI.announce(resetNote.textContent);
    } else if (button.dataset.action === 'about') {
      aboutSheet();
    }
  });

  // Tapping the Our Circle tab again returns to Overview
  el.addEventListener('tabreselect', () => {
    if (state.tab !== 'overview') setTab('overview', { focus: false });
  });

  // Shared data changed (here, in Profile's full reset, or a new sign-up)
  data.onChange((kind) => {
    if (kind === 'buy') return;
    if (kind === 'reset') clearScreenState();
    update({ animate: kind === 'circle' });
  });

  // Switching language redraws the screen but keeps the demo exactly where it is
  I18N.onChange(() => {
    render();
    update({ animate: false });
    if (!state.barsRevealed) revealBarsWhenVisible(); // watch the new member list
  });

  render();
  update({ animate: false });
  revealBarsWhenVisible();
};
