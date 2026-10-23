// Profile tab
//
// Account details, settings and transaction history (js/screens/history.js).
// Every setting is simulated: nothing is saved or sent anywhere.

window.Screens = window.Screens || {};

Screens.profile = function (el) {
  const data = SampleData;
  const scroller = () => el.closest('.screens');
  let view = 'main';
  let historyView = null;

  // Sample settings (kept only while the page is open)
  const settings = {
    priceAlerts: true,
    circleActivity: true,
    productNews: false,
    pinOnOpen: true,
  };

  const initials = (name) =>
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join('') || '?';

  function renderMain() {
    view = 'main';
    const u = data.user;
    el.innerHTML = `
      <header class="screen-head">
        <h1 class="screen-title" tabindex="-1" data-profile-title>Profile</h1>
      </header>

      <section class="card profile-card" aria-label="Your details">
        <span class="profile-avatar" aria-hidden="true">${UI.esc(initials(u.fullName))}</span>
        <div class="profile-details">
          <p class="profile-name">${UI.esc(u.fullName)}</p>
          <p class="small muted">${UI.esc(u.phone)}</p>
          <p class="small muted">${UI.esc(u.email)}</p>
        </div>
        <span class="tag tag-sim">Sample account</span>
      </section>

      <section class="section" aria-labelledby="account-title">
        <h2 id="account-title" class="section-title">Account</h2>
        <ul class="settings-list" role="list">
          ${settingRow('history', 'clock', 'Transaction history', 'Buys, sells, Our Circle and funds')}
          ${settingRow('bank', 'wallet', 'Linked bank account', 'Mobile money (sample)')}
        </ul>
      </section>

      <section class="section" aria-labelledby="settings-title">
        <h2 id="settings-title" class="section-title">Settings</h2>
        <ul class="settings-list" role="list">
          ${settingRow('notifications', 'info', 'Notifications', notificationsSummary())}
          ${settingRow('security', 'shield', 'Security', settings.pinOnOpen ? 'PIN on open: on' : 'PIN on open: off')}
        </ul>
      </section>

      <button type="button" class="btn btn-secondary btn-block" data-action="logout">Log out</button>

      <p class="screen-footnote">
        Prototype only. This is a sample account. Details and settings are not saved or sent anywhere,
        and identity checks would happen with the proposed broker partner in the live product.
      </p>
    `;
  }

  function settingRow(action, icon, title, detail) {
    return `
      <li>
        <button type="button" class="setting" data-action="${action}">
          <span class="setting-icon">${UI.icon(icon, { size: 20 })}</span>
          <span class="setting-main">
            <span class="setting-title">${title}</span>
            <span class="setting-detail">${UI.esc(detail)}</span>
          </span>
          ${UI.icon('chevronRight', { size: 20 })}
        </button>
      </li>`;
  }

  function notificationsSummary() {
    const on = [settings.priceAlerts, settings.circleActivity, settings.productNews].filter(Boolean).length;
    return on ? `${on} of 3 on` : 'All off';
  }

  // The row list re-renders while a sheet is open, so return focus to the new row
  const focusRow = (action) => {
    const row = el.querySelector(`[data-action="${action}"]`);
    if (row) row.focus();
  };

  // ---------- Sub-views and sheets ----------
  function openHistory() {
    view = 'history';
    scroller().scrollTop = 0;
    historyView = Views.history(el, {
      onBack: () => {
        historyView = null;
        renderMain();
        scroller().scrollTop = 0;
        const row = el.querySelector('[data-action="history"]');
        if (row) row.focus();
      },
    });
  }

  function switchRow(key, label, hint) {
    return `
      <button type="button" class="switch" role="switch" aria-checked="${settings[key]}" data-setting="${key}">
        <span>${label}<span class="switch-hint">${hint}</span></span>
        <span class="switch-track" aria-hidden="true"></span>
      </button>`;
  }

  function wireSwitches(sheet) {
    sheet.body.addEventListener('click', (event) => {
      const button = event.target.closest('[data-setting]');
      if (!button) return;
      const key = button.dataset.setting;
      settings[key] = !settings[key];
      button.setAttribute('aria-checked', String(settings[key]));
      renderMain(); // keep the summary under each row current
    });
  }

  function notificationsSheet() {
    const sheet = UI.openSheet({ title: 'Notifications', onClose: () => focusRow('notifications') });
    sheet.body.innerHTML = `
      <div class="switch-list">
        ${switchRow('priceAlerts', 'Price changes', 'Big moves in companies you own')}
        ${switchRow('circleActivity', 'Our Circle activity', 'Contributions, votes and withdrawals')}
        ${switchRow('productNews', 'Product news', 'Updates about Ubuntu Invest')}
      </div>
      <p class="small muted">Prototype: these switches don't send real notifications.</p>
      <button type="button" class="btn btn-secondary btn-block" data-sheet-close>Done</button>`;
    wireSwitches(sheet);
  }

  function securitySheet() {
    const sheet = UI.openSheet({ title: 'Security', onClose: () => focusRow('security') });
    sheet.body.innerHTML = `
      <div class="switch-list">
        ${switchRow('pinOnOpen', 'Ask for a PIN when opening the app', 'Recommended on shared phones')}
      </div>
      <div class="notice">
        ${UI.icon('shield')}
        <p>In the live product, sign-in and identity checks would follow the proposed broker partner's requirements.</p>
      </div>
      <button type="button" class="btn btn-secondary btn-block" data-sheet-close>Done</button>`;
    wireSwitches(sheet);
  }

  function bankSheet() {
    const last3 = data.user.phone.replace(/\D/g, '').slice(-3);
    const sheet = UI.openSheet({ title: 'Linked bank account' });
    sheet.body.innerHTML = `
      <dl class="summary">
        <div><dt>Method</dt><dd>Mobile money</dd></div>
        <div><dt>Number</dt><dd>Ending ${UI.esc(last3)}</dd></div>
        <div><dt>Status</dt><dd>Sample, not connected</dd></div>
      </dl>
      <div class="notice">
        ${UI.icon('info')}
        <p>Adding or changing accounts isn't part of this prototype. No real account is connected.</p>
      </div>
      <button type="button" class="btn btn-secondary btn-block" data-sheet-close>Close</button>`;
  }

  function logoutSheet() {
    const sheet = UI.openSheet({ title: 'Log out of the demo?' });
    sheet.body.innerHTML = `
      <p class="muted">You'll go back to the welcome screen. Sample balances and activity stay as they are until the page reloads.</p>
      <div class="sheet-actions">
        <button type="button" class="btn btn-primary btn-block" data-step="logout">Log out</button>
        <button type="button" class="btn btn-quiet btn-block" data-sheet-close>Cancel</button>
      </div>`;
    sheet.body.addEventListener('click', (event) => {
      if (event.target.closest('[data-step="logout"]')) {
        sheet.close({ silent: true });
        if (window.Onboarding) window.Onboarding.start();
      }
    });
  }

  // ---------- Events ----------
  el.addEventListener('click', (event) => {
    if (view !== 'main') return; // the history view handles its own clicks
    const button = event.target.closest('button[data-action]');
    if (!button || !el.contains(button)) return;
    const action = button.dataset.action;
    if (action === 'history') openHistory();
    if (action === 'bank') bankSheet();
    if (action === 'notifications') notificationsSheet();
    if (action === 'security') securitySheet();
    if (action === 'logout') logoutSheet();
  });

  // Name, phone or email may change after onboarding
  data.onChange(() => {
    if (view === 'main') renderMain();
  });

  // Lets Home's "See all activity" open history directly
  window.ProfileScreen = {
    openHistory() {
      if (historyView) historyView.stop();
      openHistory();
    },
  };

  renderMain();
};
