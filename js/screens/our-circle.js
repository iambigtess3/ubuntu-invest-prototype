// Our Circle tab
//
// Investor demo of group investing. Every member, amount and return is
// simulated sample data from js/data.js (SampleData.circle). No real money is
// held or moved, and returns are never guaranteed.
//
// Each member bought pool "units" at a different simulated price, so each share
// is tracked separately. The demo controls switch between a simulated gain and
// a simulated loss.

window.Screens = window.Screens || {};

Screens.circle = function (el) {
  const data = SampleData;
  const circle = data.circle;
  const MEMBERS = circle.members;
  const BAR_SCALE = 50000; // RWF represented by a full-width bar

  // Wording that changes when the member is the person using the app
  const possessive = (m) => (m.isYou ? 'Your' : `${m.name}'s`);
  const putInBy = (m) => (m.isYou ? 'you put in' : `${m.name} put in`);

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
  function render() {
    el.innerHTML = `
      <header class="screen-head">
        <div>
          <h1 class="screen-title">Our Circle</h1>
          <p class="screen-subtitle">${UI.esc(circle.name)}, ${MEMBERS.length} members</p>
        </div>
        <button type="button" class="icon-btn" data-action="about" aria-label="How Our Circle works">${UI.icon('info', { size: 22 })}</button>
      </header>

      <section class="section" aria-labelledby="pots-title">
        <h2 id="pots-title" class="section-title">Two pots, kept separate</h2>

        <article class="card savings-pot" aria-labelledby="savings-title">
          <span class="row-icon is-circle">${UI.icon('coins', { size: 22 })}</span>
          <div class="pot-body">
            <div class="pot-row">
              <h3 id="savings-title" class="pot-title">Ikimina savings</h3>
              <p class="pot-value num">${UI.rwf(circle.savingsTotal)}</p>
            </div>
            <p class="pot-note">Cash rotation, not invested. Not affected by the market or by withdrawals.</p>
            <p class="pot-meta" data-next-payout></p>
          </div>
        </article>

        <article class="card-hero on-navy pool" aria-labelledby="pool-title">
          <div class="hero-top">
            <h3 id="pool-title" class="hero-label">Invested pool</h3>
            <span class="tag tag-sim">Simulated</span>
          </div>
          <p class="hero-value" data-pool-value></p>
          <p class="hero-change" data-pool-change></p>
          <div class="hero-chart" data-pool-chart></div>
          <p class="pool-caption">Last 6 months. Can go down as well as up, and returns are never guaranteed.</p>
          <div class="decision">
            <span class="badge">${UI.icon('vote', { size: 16 })}${UI.esc(circle.decision)}</span>
            <p>${UI.esc(circle.decisionRule)}</p>
          </div>
        </article>
      </section>

      <section class="section" aria-labelledby="members-title">
        <h2 id="members-title" class="section-title">Each member's share</h2>
        <p class="section-intro">Every bar is one member's own money in the pool. Tap a member to see their share or simulate a withdrawal.</p>
        <div class="bar-legend" aria-hidden="true">
          <span><i class="legend-swatch legend-value"></i>Value</span>
          <span><i class="legend-swatch legend-gain"></i>Gain</span>
          <span><i class="legend-swatch legend-loss"></i>Loss</span>
          <span><i class="legend-tick"></i>Put in</span>
        </div>
        <div class="demo-result" data-demo-result role="status" hidden></div>
        <ul class="list member-list" role="list" data-member-list>
          ${MEMBERS.map(memberRow).join('')}
        </ul>
      </section>

      <section class="demo-controls" aria-labelledby="demo-title">
        <h2 id="demo-title" class="demo-title">Demo controls</h2>
        <p class="small muted">For presenters. Switch the simulated market outcome, or reset this demo to replay it.</p>
        <button type="button" class="switch" role="switch" aria-checked="false" data-action="scenario" aria-describedby="scenario-hint">
          <span>Show a simulated loss</span>
          <span class="switch-track" aria-hidden="true"></span>
        </button>
        <p class="small muted" id="scenario-hint" data-scenario-hint></p>
        <button type="button" class="btn btn-secondary btn-block" data-action="reset">${UI.icon('refresh', { size: 18 })}Reset Circle demo</button>
        <p class="small muted" data-reset-note aria-hidden="true"></p>
      </section>
    `;
  }

  function memberRow(m) {
    return `
      <li>
        <button type="button" class="row member" data-member="${m.id}">
          <span class="avatar${m.isYou ? ' is-you' : ''}" aria-hidden="true" data-initial></span>
          <span class="member-body">
            <span class="member-top">
              <span class="row-title member-name"><span data-name></span>${m.isYou ? '<span class="you-tag">You</span>' : ''}</span>
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
              <span class="row-meta num">Put in ${UI.rwf(m.putIn)}</span>
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

    el.querySelector('[data-next-payout]').textContent = `Next payout: you (${you.name}), ${circle.nextPayoutDate} (sample)`;

    // Pool numbers
    const poolValueEl = el.querySelector('[data-pool-value]');
    if (animate && shown.pool !== null) UI.animateNumber(poolValueEl, shown.pool, value, UI.rwf);
    else poolValueEl.textContent = UI.rwf(value);
    shown.pool = value;

    el.querySelector('[data-pool-change]').innerHTML = putIn
      ? `${UI.change(change)}<span>since start, from ${UI.rwf(putIn)} put in</span>`
      : '<span>No money is invested in the pool right now.</span>';

    const path = paths[circle.scenario];
    const total = ((path[path.length - 1] - path[0]) / path[0]) * 100;
    el.querySelector('[data-pool-chart]').innerHTML = UI.lineChart(path, {
      width: 320,
      height: 96,
      area: true,
      label: `Simulated pool performance over the last 6 months: ${total >= 0 ? 'up' : 'down'} ${Math.abs(total).toFixed(1)}%.`,
    });

    // Members
    MEMBERS.forEach((m) => {
      const row = el.querySelector(`[data-member="${m.id}"]`);
      row.querySelector('[data-name]').textContent = m.name;
      row.querySelector('[data-initial]').textContent = m.name.charAt(0).toUpperCase();

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
        status.innerHTML = `${UI.icon('clock', { size: 15 })}<span>Withdrawal requested, est. <span class="nowrap">2–3 days</span></span>`;
      } else if (state.unchanged.has(m.id)) {
        status.innerHTML = `${UI.icon('check', { size: 15 })}<span>Unchanged</span>`;
      } else {
        status.innerHTML = '';
      }
    });

    // Demo controls
    el.querySelector('[data-action="scenario"]').setAttribute('aria-checked', String(circle.scenario === 'loss'));
    el.querySelector('[data-scenario-hint]').textContent =
      circle.scenario === 'loss'
        ? 'Now showing a simulated loss: the pool is worth less than members put in.'
        : 'Now showing a simulated gain. Turn this on to show a simulated loss.';

    // Result banner after a withdrawal
    const result = el.querySelector('[data-demo-result]');
    const last = state.lastWithdrawal && byId(state.lastWithdrawal);
    if (last && isWithdrawn(last)) {
      const others = MEMBERS.filter((m) => m.id !== last.id && !isWithdrawn(m)).length;
      result.hidden = false;
      result.innerHTML = `
        ${UI.icon('checkCircle', { size: 20 })}
        <p><strong>${UI.esc(possessive(last))} withdrawal was requested (simulated).</strong>
        Payout ${UI.rwf(circle.withdrawn[last.id].payout)}, typically 2–3 days, not guaranteed.
        ${others ? `The other ${others} ${others === 1 ? "member's share is" : "members' shares are"} unchanged, and so are the ikimina savings.` : 'The ikimina savings are unchanged.'}</p>`;
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
      MEMBERS.forEach((m) => setBar(el.querySelector(`[data-member="${m.id}"] [data-bar]`), m));
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
    const sheet = UI.openSheet({ title: `${possessive(m)} invested share` });
    let acknowledged = false;

    function overview() {
      sheet.setTitle(`${possessive(m)} invested share`);
      if (isWithdrawn(m)) {
        sheet.body.innerHTML = `
          <div class="notice">
            ${UI.icon('clock')}
            <p><strong>Withdrawal requested (simulated).</strong> Payout ${UI.rwf(circle.withdrawn[m.id].payout)}. Payouts typically take 2–3 days, but this isn't guaranteed.</p>
          </div>
          <dl class="summary">
            <div><dt>Put in</dt><dd>${UI.rwf(m.putIn)}</dd></div>
            <div><dt>Still invested</dt><dd>${UI.rwf(0)}</dd></div>
          </dl>
          <p class="small muted">Use Reset Circle demo at the bottom of the screen to replay the withdrawal.</p>
          <button type="button" class="btn btn-secondary btn-block" data-step="close">Close</button>`;
        return;
      }
      const value = valueOf(m);
      const share = (value / poolValue()) * 100;
      sheet.body.innerHTML = `
        <dl class="summary">
          <div><dt>Put in</dt><dd>${UI.rwf(m.putIn)}</dd></div>
          <div><dt>Value now (simulated)</dt><dd>${UI.rwf(value)}</dd></div>
          <div><dt>Change</dt><dd>${UI.change(memberChange(m))}</dd></div>
          <div><dt>Share of the pool</dt><dd>${share.toFixed(1)}%</dd></div>
        </dl>
        <div class="notice">
          ${UI.icon('coins')}
          <p>${UI.esc(possessive(m))} ikimina savings are separate and aren't part of this amount.</p>
        </div>
        <div class="sheet-actions">
          <button type="button" class="btn btn-primary btn-block" data-step="warn">Simulate withdrawal</button>
          <button type="button" class="btn btn-quiet btn-block" data-step="close">Close</button>
        </div>`;
    }

    function warning(error = '') {
      const value = valueOf(m);
      const loss = value < m.putIn;
      const others = activeMembers().length - 1;
      sheet.setTitle(m.isYou ? 'Withdraw your share?' : `Withdraw ${m.name}'s share?`);
      sheet.body.innerHTML = `
        <div class="payout">
          <span class="payout-label">Estimated payout (simulated)</span>
          <span class="payout-value num">${UI.rwf(value)}</span>
          <span class="payout-sub">Put in ${UI.rwf(m.putIn)}, ${UI.change(memberChange(m))}</span>
        </div>
        ${
          loss
            ? `<div class="notice notice-danger">
                ${UI.icon('alert')}
                <p><strong>This share is worth ${UI.rwf(m.putIn - value)} less than ${UI.esc(putInBy(m))}.</strong> Withdrawing now would lock in that loss.</p>
              </div>`
            : ''
        }
        <ul class="warn-list" role="list">
          <li>${UI.icon('alert')}<span>Investments can go down as well as up. The final amount depends on prices when the sale completes.</span></li>
          <li>${UI.icon('clock')}<span>Payouts typically take 2–3 days. This isn't guaranteed.</span></li>
          <li>${UI.icon('info')}<span>Fees are to be confirmed with the broker partner.</span></li>
          <li>${UI.icon('users')}<span>${others > 0 ? `The other ${others} ${others === 1 ? "member's share" : "members' shares"} and the` : 'The'} ikimina savings won't change.</span></li>
        </ul>
        <label class="check">
          <input type="checkbox" id="wd-ack" ${acknowledged ? 'checked' : ''} ${error ? 'aria-invalid="true" aria-describedby="wd-error"' : ''}>
          <span>${loss ? 'I understand this withdrawal would lock in a loss.' : "I understand the payout amount isn't final until the sale completes."}</span>
        </label>
        ${error ? `<p class="error" id="wd-error" role="alert">${UI.icon('alert', { size: 16 })}<span>${error}</span></p>` : ''}
        <div class="sheet-actions">
          <button type="button" class="btn btn-primary btn-block" data-step="confirm">Confirm withdrawal</button>
          <button type="button" class="btn btn-quiet btn-block" data-step="back">Go back</button>
        </div>`;
      if (error) sheet.body.querySelector('#wd-ack').focus();
      else sheet.focusTitle();
    }

    async function confirm() {
      if (!acknowledged) {
        warning('Tick the box to confirm you understand the risk.');
        return;
      }
      const button = sheet.body.querySelector('[data-step="confirm"]');
      button.setAttribute('aria-busy', 'true');
      button.innerHTML = '<span class="spinner" aria-hidden="true"></span><span>Requesting withdrawal…</span>';
      sheet.body.querySelectorAll('button, input').forEach((node) => {
        node.disabled = true;
      });
      sheet.lock();
      UI.announce('Requesting simulated withdrawal');
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
    state.lastWithdrawal = m.id;
    state.unchanged = new Set();
    state.barsRevealed = true;
    const payout = data.requestCircleWithdrawal(m.id); // shared data: Home and history update too

    const row = el.querySelector(`[data-member="${m.id}"]`);
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
        `${possessive(m)} simulated withdrawal was requested. Payout ${UI.rwf(payout)}, typically 2 to 3 days, not guaranteed. ` +
          `Pool value is now ${UI.rwf(poolValue())}. ${others ? `The other ${others} members' shares are unchanged.` : ''}`
      );
    }, 900);
  }

  function aboutSheet() {
    const sheet = UI.openSheet({ title: 'How Our Circle works' });
    sheet.body.innerHTML = `
      <p>Our Circle brings an ikimina (a rotating savings group) into the app. The group keeps its normal cash rotation, and members can also choose to invest together in a separate pool.</p>
      <ul class="warn-list" role="list">
        <li>${UI.icon('coins')}<span><strong>Ikimina savings</strong> stay as cash and rotate between members as they do today.</span></li>
        <li>${UI.icon('invest')}<span><strong>The invested pool</strong> is optional. Each member's money in it is tracked separately, and its value can go down as well as up.</span></li>
        <li>${UI.icon('vote')}<span><strong>Decisions</strong> follow the method the group chose. This Circle uses a majority vote: ${UI.esc(circle.decisionRule.charAt(0).toLowerCase() + circle.decisionRule.slice(1))}</span></li>
        <li>${UI.icon('clock')}<span><strong>Leaving</strong> means withdrawing your own whole share. Payouts typically take 2–3 days and aren't guaranteed, and the amount can be less than you put in. Other members aren't affected.</span></li>
      </ul>
      <div class="notice notice-warn">
        ${UI.icon('info')}
        <p>This is a prototype. Our Circle's legal structure, including who legally owns pooled investments, is still to be confirmed. The broker partnership is proposed.</p>
      </div>
      <button type="button" class="btn btn-secondary btn-block" data-sheet-close>Close</button>`;
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

    if (button.dataset.member) {
      openMember(byId(button.dataset.member));
    } else if (button.dataset.action === 'scenario') {
      state.unchanged = new Set();
      state.barsRevealed = true;
      data.setCircleScenario(circle.scenario === 'gain' ? 'loss' : 'gain');
      UI.announce(`Showing a simulated ${circle.scenario}. Pool value ${UI.rwf(poolValue())}.`);
    } else if (button.dataset.action === 'reset') {
      clearScreenState();
      state.barsRevealed = true;
      data.resetCircle();
      resetNote.textContent = 'Circle demo reset: everyone is back in the pool and the gain is showing.';
      UI.announce(resetNote.textContent);
    } else if (button.dataset.action === 'about') {
      aboutSheet();
    }
  });

  // Shared data changed (here, in Profile's full reset, or a new sign-up)
  data.onChange((kind) => {
    if (kind === 'buy') return;
    if (kind === 'reset') clearScreenState();
    update({ animate: kind === 'circle' });
  });

  render();
  update({ animate: false });
  revealBarsWhenVisible();
};
