// Our Circle tab
//
// Investor demo of group investing. Every member, amount and return here is
// simulated sample data. No real money is held or moved, and returns are
// never guaranteed.
//
// How the sample numbers work: each member bought pool "units" at a different
// simulated price, so each share is tracked separately. The demo controls
// switch the current unit price between a simulated gain and a simulated loss.

window.Screens = window.Screens || {};

Screens.circle = function (el) {
  // ---------- Sample data ----------
  const CIRCLE = {
    name: 'Kimironko Traders',
    savingsTotal: 50000, // ikimina cash rotation, never invested
    nextPayoutDate: '30 November', // next ikimina payout goes to the signed-up user (sample)
    decision: 'Majority vote',
    decisionRule: 'At least 3 of the 5 members must agree before the pool invests.',
  };

  const START_UNIT = 1000; // simulated unit price when the pool started
  const SCENARIOS = {
    gain: { unit: 1068, seed: 7 },
    loss: { unit: 946, seed: 19 },
  };

  // Same names as the website demo. `entry` = simulated price paid per unit.
  const MEMBERS = [
    { id: 'aline', name: 'Aline', putIn: 40000, entry: 950 },
    { id: 'jean', name: 'Jean', putIn: 25000, entry: 1000, isYou: true }, // the signed-up user
    { id: 'grace', name: 'Grace', putIn: 30000, entry: 1040 },
    { id: 'eric', name: 'Eric', putIn: 20000, entry: 980 },
    { id: 'divine', name: 'Divine', putIn: 35000, entry: 1010 },
  ];
  MEMBERS.forEach((m) => {
    m.units = m.putIn / m.entry;
  });

  const BAR_SCALE = 50000; // RWF represented by a full-width bar

  // The signed-up user's display name comes from the shared profile (js/data.js),
  // so it always matches Home and Profile. Falls back to the sample name.
  const you = MEMBERS.find((m) => m.isYou);
  const syncYourName = () => {
    if (window.SampleData) you.name = SampleData.firstName();
  };
  syncYourName();

  // Wording that changes when the member is the person using the app
  const possessive = (m) => (m.isYou ? 'Your' : `${m.name}'s`);
  const putInBy = (m) => (m.isYou ? 'you put in' : `${m.name} put in`);

  // A 6-month simulated path from START_UNIT to `end`, with some realistic wobble
  function poolPath(seed, end, points = 126) {
    const rand = UI.seeded(seed);
    const walk = [0];
    for (let i = 1; i < points; i++) walk.push(walk[i - 1] + (rand() - 0.5) * 0.035);
    const last = walk[points - 1];
    return walk.map((w, i) => {
      const t = i / (points - 1);
      return START_UNIT + (end - START_UNIT) * t + (w - last * t) * START_UNIT;
    });
  }
  Object.values(SCENARIOS).forEach((s) => {
    s.path = poolPath(s.seed, s.unit);
  });

  // ---------- State ----------
  const state = {
    scenario: 'gain',
    withdrawn: {}, // memberId -> { payout } once a simulated withdrawal is requested
    unchanged: new Set(), // members highlighted as "Unchanged" after a withdrawal
    lastWithdrawal: null,
    barsRevealed: false,
  };
  const shown = { pool: null, members: {} }; // last displayed numbers, for count animations

  const unitPrice = () => SCENARIOS[state.scenario].unit;
  const isWithdrawn = (m) => Boolean(state.withdrawn[m.id]);
  const valueOf = (m) => (isWithdrawn(m) ? 0 : m.units * unitPrice());
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
          <p class="screen-subtitle">${UI.esc(CIRCLE.name)}, ${MEMBERS.length} members <span class="tag tag-sim">Sample Circle</span></p>
        </div>
        <button type="button" class="icon-btn" data-action="about" aria-label="How Our Circle works">${UI.icon('info', { size: 22 })}</button>
      </header>

      <section class="section" aria-labelledby="pots-title">
        <h2 id="pots-title" class="section-title">Two pots, kept separate</h2>

        <article class="savings-pot" aria-labelledby="savings-title">
          <span class="pot-icon">${UI.icon('coins', { size: 22 })}</span>
          <div class="pot-body">
            <div class="pot-row">
              <h3 id="savings-title" class="pot-title">Ikimina savings</h3>
              <p class="pot-value num">${UI.rwf(CIRCLE.savingsTotal)}</p>
            </div>
            <p class="pot-note">Cash rotation, not invested. Market changes and pool withdrawals don't affect it.</p>
            <p class="pot-meta" data-next-payout></p>
          </div>
        </article>

        <article class="card-hero on-navy pool" aria-labelledby="pool-title">
          <div class="pool-top">
            <h3 id="pool-title" class="pool-label">Invested pool</h3>
            <span class="tag tag-sim">Simulated</span>
          </div>
          <p class="pool-value num" data-pool-value></p>
          <p class="pool-change" data-pool-change></p>
          <div class="pool-chart" data-pool-chart></div>
          <p class="pool-chart-caption">Simulated pool performance, last 6 months. Can go down as well as up.</p>
          <div class="decision">
            <span class="badge">${UI.icon('vote', { size: 16 })}${UI.esc(CIRCLE.decision)}</span>
            <p>${UI.esc(CIRCLE.decisionRule)}</p>
          </div>
        </article>
      </section>

      <section class="section" aria-labelledby="members-title">
        <h2 id="members-title" class="section-title">Members' invested shares</h2>
        <p class="section-intro">Each bar is one member's own money in the pool, tracked separately. Tap a member to see their share or simulate a withdrawal.</p>
        <div class="bar-legend" aria-hidden="true">
          <span><i class="legend-swatch legend-value"></i>Value kept</span>
          <span><i class="legend-swatch legend-gain"></i>Gain</span>
          <span><i class="legend-swatch legend-loss"></i>Loss</span>
          <span><i class="legend-tick"></i>Amount put in</span>
        </div>
        <div class="demo-result" data-demo-result role="status" hidden></div>
        <ul class="member-list" role="list" data-member-list>
          ${MEMBERS.map(memberRow).join('')}
        </ul>
      </section>

      <section class="card rules" aria-labelledby="rules-title">
        <h2 id="rules-title" class="section-title">How this Circle works</h2>
        <ul class="rule-list" role="list">
          <li>${UI.icon('vote')}<div><strong>Decisions</strong><p>${UI.esc(CIRCLE.decision)}: ${UI.esc(CIRCLE.decisionRule.toLowerCase())}</p></div></li>
          <li>${UI.icon('users')}<div><strong>Each share is tracked</strong><p>Every contribution to the pool is recorded against the member who made it.</p></div></li>
          <li>${UI.icon('clock')}<div><strong>Withdrawals</strong><p>Any member can request their whole invested share. Payouts typically take 2–3 days, but this isn't guaranteed, and the amount can be less than was put in.</p></div></li>
          <li>${UI.icon('coins')}<div><strong>Savings stay separate</strong><p>Withdrawing from the pool never changes the ikimina savings rotation.</p></div></li>
        </ul>
      </section>

      <section class="demo-controls" aria-labelledby="demo-title">
        <h2 id="demo-title" class="demo-title">Demo controls</h2>
        <p class="small muted">For presenters. Switch the simulated market outcome, or reset the demo to replay it.</p>
        <button type="button" class="switch" role="switch" aria-checked="false" data-action="scenario" aria-describedby="scenario-hint">
          <span>Show a simulated loss</span>
          <span class="switch-track" aria-hidden="true"></span>
        </button>
        <p class="small muted" id="scenario-hint" data-scenario-hint></p>
        <button type="button" class="btn btn-secondary btn-block" data-action="reset">${UI.icon('refresh', { size: 18 })}Reset demo</button>
        <p class="small muted" data-reset-note aria-hidden="true"></p>
      </section>

      <p class="screen-footnote">
        Prototype only. All members, amounts and returns are simulated. No real money is held or moved, returns are never guaranteed,
        and fees are to be confirmed with the proposed broker partner.
      </p>
    `;
  }

  function memberRow(m) {
    return `
      <li>
        <button type="button" class="member${m.isYou ? ' is-you' : ''}" data-member="${m.id}">
          <span class="avatar" aria-hidden="true" data-initial></span>
          <span class="member-body">
            <span class="member-top">
              <span class="member-name"><span data-name></span>${m.isYou ? '<span class="you-tag">You</span>' : ''}</span>
              <span class="member-value num" data-value></span>
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
              <span class="member-putin num">Put in ${UI.rwf(m.putIn)}</span>
              <span data-change></span>
            </span>
            <span class="member-status" data-status></span>
          </span>
          ${UI.icon('chevronRight', { size: 20 })}
        </button>
      </li>`;
  }

  // ---------- Updates (numbers animate, bars glide) ----------
  function setBar(bar, m) {
    const s = BAR_SCALE;
    const v = Math.min(valueOf(m), s) / s;
    const p = Math.min(m.putIn, s) / s;
    const withdrawn = isWithdrawn(m) || !state.barsRevealed;
    const set = (name, value) => bar.style.setProperty(name, String(value));
    if (withdrawn) {
      set('--base', 0);
      set('--g0', 0);
      set('--g1', 0);
      set('--l0', 0);
      set('--l1', 0);
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
    const value = poolValue();
    const putIn = poolPutIn();
    const change = putIn ? ((value - putIn) / putIn) * 100 : 0;

    // Pool numbers
    const poolValueEl = el.querySelector('[data-pool-value]');
    if (animate && shown.pool !== null) UI.animateNumber(poolValueEl, shown.pool, value, UI.rwf);
    else poolValueEl.textContent = UI.rwf(value);
    shown.pool = value;

    el.querySelector('[data-pool-change]').innerHTML = putIn
      ? `${UI.change(change)}<span>since start, from ${UI.rwf(putIn)} put in</span>`
      : '<span>No money is invested in the pool right now.</span>';

    const path = SCENARIOS[state.scenario].path;
    const total = ((path[path.length - 1] - path[0]) / path[0]) * 100;
    const chart = el.querySelector('[data-pool-chart]');
    chart.innerHTML = UI.lineChart(path, {
      width: 320,
      height: 96,
      area: true,
      label: `Simulated pool performance over the last 6 months: ${total >= 0 ? 'up' : 'down'} ${Math.abs(total).toFixed(1)}%.`,
    });

    syncYourName();
    el.querySelector('[data-next-payout]').textContent = `Next payout: you (${you.name}), ${CIRCLE.nextPayoutDate} (sample)`;

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
    const switchEl = el.querySelector('[data-action="scenario"]');
    switchEl.setAttribute('aria-checked', String(state.scenario === 'loss'));
    el.querySelector('[data-scenario-hint]').textContent =
      state.scenario === 'loss'
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
        Payout ${UI.rwf(state.withdrawn[last.id].payout)}, typically 2–3 days, not guaranteed.
        ${others ? `The other ${others} ${others === 1 ? 'member\'s share is' : 'members\' shares are'} unchanged.` : ''}
        The ikimina savings are unchanged.</p>`;
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
            <p><strong>Withdrawal requested (simulated).</strong> Payout ${UI.rwf(state.withdrawn[m.id].payout)}. Payouts typically take 2–3 days, but this isn't guaranteed.</p>
          </div>
          <dl class="summary">
            <div><dt>Put in</dt><dd>${UI.rwf(m.putIn)}</dd></div>
            <div><dt>Still invested</dt><dd>${UI.rwf(0)}</dd></div>
          </dl>
          <p class="small muted">Use Reset demo at the bottom of the screen to replay the withdrawal.</p>
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
          <span>${
            loss
              ? 'I understand this withdrawal would lock in a loss.'
              : "I understand the payout amount isn't final until the sale completes."
          }</span>
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
      const payout = valueOf(m);
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
      applyWithdrawal(m, payout);
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
  function applyWithdrawal(m, payout) {
    state.withdrawn[m.id] = { payout };
    state.lastWithdrawal = m.id;
    state.unchanged = new Set();
    state.barsRevealed = true;

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
    // No toast here: the result banner and the row's status explain the change
    // without covering the bars.
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
        <li>${UI.icon('vote')}<span><strong>Decisions</strong> follow the method the group chose: majority vote, a trusted decision-maker, or an automatic plan.</span></li>
        <li>${UI.icon('clock')}<span><strong>Leaving</strong> means withdrawing your own share. Payouts typically take 2–3 days and aren't guaranteed. Other members aren't affected.</span></li>
      </ul>
      <div class="notice notice-warn">
        ${UI.icon('info')}
        <p>This is a prototype. Our Circle's legal structure, including who legally owns pooled investments, is still to be confirmed. The broker partnership is proposed.</p>
      </div>
      <button type="button" class="btn btn-secondary btn-block" data-sheet-close>Close</button>`;
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
      state.scenario = state.scenario === 'gain' ? 'loss' : 'gain';
      state.unchanged = new Set();
      state.barsRevealed = true;
      update();
      UI.announce(
        `Showing a simulated ${state.scenario}. Pool value ${UI.rwf(poolValue())}.`
      );
    } else if (button.dataset.action === 'reset') {
      state.scenario = 'gain';
      state.withdrawn = {};
      state.unchanged = new Set();
      state.lastWithdrawal = null;
      state.barsRevealed = true;
      update();
      const note = el.querySelector('[data-reset-note]');
      note.textContent = 'Demo reset: everyone is back in the pool and the gain is showing.';
      UI.announce(note.textContent);
    } else if (button.dataset.action === 'about') {
      aboutSheet();
    }
  });

  render();
  update({ animate: false });
  if (window.SampleData) SampleData.onChange(() => update({ animate: false }));
  revealBarsWhenVisible();
};
