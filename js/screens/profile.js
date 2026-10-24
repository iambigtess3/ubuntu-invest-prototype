// Profile tab
//
// Your details, transaction history (js/screens/history.js), a full demo reset
// and log out. Settings that didn't work yet (notifications, security, linked
// accounts) are deferred until they can do something real.

window.Screens = window.Screens || {};

Screens.profile = function (el) {
  const data = SampleData;
  const scroller = () => el.closest('.screens');
  let view = 'main';
  let historyView = null;

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
        <h1 class="screen-title" tabindex="-1">Profile</h1>
      </header>

      <section class="card profile-card" aria-label="Your details">
        <span class="avatar is-you profile-avatar" aria-hidden="true">${UI.esc(initials(u.fullName))}</span>
        <div class="profile-details">
          <p class="profile-name">${UI.esc(u.fullName)}</p>
          <p class="small muted">${UI.esc(u.phone)}</p>
          <p class="small muted">${UI.esc(u.email)}</p>
          <span class="tag tag-sim">Sample account</span>
        </div>
      </section>

      <ul class="list" role="list">
        <li>
          <button type="button" class="row" data-action="history">
            <span class="row-icon">${UI.icon('clock', { size: 20 })}</span>
            <span class="row-main">
              <span class="row-title">Transaction history</span>
              <span class="row-meta">Shares, Our Circle and funds</span>
            </span>
            <span class="row-chevron">${UI.icon('chevronRight', { size: 20 })}</span>
          </button>
        </li>
        <li>
          <button type="button" class="row" data-action="reset">
            <span class="row-icon">${UI.icon('refresh', { size: 20 })}</span>
            <span class="row-main">
              <span class="row-title">Reset demo</span>
              <span class="row-meta">Restore balances, shares, history and Our Circle</span>
            </span>
            <span class="row-chevron">${UI.icon('chevronRight', { size: 20 })}</span>
          </button>
        </li>
      </ul>

      <button type="button" class="btn btn-secondary btn-block" data-action="logout">Log out</button>

      <p class="small muted center">Sample account. Details aren't saved or sent anywhere. In the live product, identity checks would happen with the proposed broker partner.</p>
    `;
  }

  // ---------- History sub-view ----------
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

  // ---------- Sheets ----------
  function resetSheet() {
    const sheet = UI.openSheet({ title: 'Reset the demo?' });
    sheet.body.innerHTML = `
      <p class="muted">Balances, shares, transaction history and Our Circle go back to how they started. You stay signed in as ${UI.esc(data.firstName())}.</p>
      <div class="sheet-actions">
        <button type="button" class="btn btn-primary btn-block" data-step="reset">Reset demo</button>
        <button type="button" class="btn btn-quiet btn-block" data-sheet-close>Cancel</button>
      </div>`;
    sheet.body.addEventListener('click', (event) => {
      if (!event.target.closest('[data-step="reset"]')) return;
      sheet.close({ silent: true });
      data.resetAll();
      if (window.resetScrollPositions) window.resetScrollPositions();
      const row = el.querySelector('[data-action="reset"]');
      if (row) row.focus();
      UI.toast('Demo reset to its starting state', { icon: 'refresh' });
    });
  }

  function logoutSheet() {
    const sheet = UI.openSheet({ title: 'Log out of the demo?' });
    sheet.body.innerHTML = `
      <p class="muted">You'll go back to the welcome screen, and the demo resets to its starting state.</p>
      <div class="sheet-actions">
        <button type="button" class="btn btn-primary btn-block" data-step="logout">Log out</button>
        <button type="button" class="btn btn-quiet btn-block" data-sheet-close>Cancel</button>
      </div>`;
    sheet.body.addEventListener('click', (event) => {
      if (!event.target.closest('[data-step="logout"]')) return;
      sheet.close({ silent: true });
      data.resetAll({ resetUser: true });
      if (window.resetScrollPositions) window.resetScrollPositions();
      if (window.Onboarding) window.Onboarding.start();
    });
  }

  // ---------- Events ----------
  el.addEventListener('click', (event) => {
    if (view !== 'main') return; // the history view handles its own clicks
    const button = event.target.closest('button[data-action]');
    if (!button || !el.contains(button)) return;
    const action = button.dataset.action;
    if (action === 'history') openHistory();
    if (action === 'reset') resetSheet();
    if (action === 'logout') logoutSheet();
  });

  // Name, phone or email may change after onboarding; a reset closes history
  data.onChange((kind) => {
    if (kind === 'reset' && historyView) {
      historyView.stop();
      historyView = null;
    }
    if (view === 'main' || kind === 'reset') renderMain();
  });

  // Tapping the Profile tab again closes history
  el.addEventListener('tabreselect', () => {
    if (!historyView) return;
    historyView.stop();
    historyView = null;
    renderMain();
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
