// Profile tab
//
// Your details, transaction history (js/screens/history.js), a full demo reset
// and log out. Settings that didn't work yet (notifications, security, linked
// accounts) are deferred until they can do something real.

window.Screens = window.Screens || {};

Screens.profile = function (el) {
  const data = SampleData;
  const t = (key, vars) => I18N.t(key, vars);
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
        <h1 class="screen-title" tabindex="-1">${t('profile.title')}</h1>
      </header>

      <section class="profile-head" aria-label="${UI.esc(u.fullName)}">
        ${UI.avatar('you', { you: true, size: 88 })}
        <p class="profile-name">${UI.esc(u.fullName)}</p>
        <p class="small muted">${UI.esc(u.phone)} · ${UI.esc(u.email)}</p>
        <span class="tag tag-sim">${t('profile.sample')}</span>
      </section>

      <ul class="list" role="list">
        <li>
          <button type="button" class="row" data-action="language">
            <span class="tile">${UI.icon('globe', { size: 20 })}</span>
            <span class="row-main"><span class="row-title">${t('profile.language')}</span></span>
            <span class="row-end-inline"><span class="row-meta">${languageName(I18N.lang)}</span>${UI.icon('chevronRight', { size: 20 })}</span>
          </button>
        </li>
        <li>
          <button type="button" class="row" data-action="verify">
            <span class="tile${data.kyc.status === 'verified' ? ' is-shares' : ''}">${UI.icon('shield', { size: 20 })}</span>
            <span class="row-main">
              <span class="row-title">${t('profile.kyc')}</span>
              <span class="row-meta">${kycMeta()}</span>
            </span>
            <span class="row-end-inline"><span class="tag ${data.kyc.status === 'verified' ? 'tag-ok' : 'tag-sim'}">${kycLabel()}</span>${UI.icon('chevronRight', { size: 20 })}</span>
          </button>
        </li>
        <li>
          <button type="button" class="row" data-action="history">
            <span class="tile">${UI.icon('history', { size: 20 })}</span>
            <span class="row-main">
              <span class="row-title">${t('history.title')}</span>
              <span class="row-meta">${t('profile.historyMeta')}</span>
            </span>
            ${UI.icon('chevronRight', { size: 20 })}
          </button>
        </li>
      </ul>

      <ul class="list list-danger" role="list">
        <li>
          <button type="button" class="row" data-action="reset">
            <span class="tile is-danger">${UI.icon('refresh', { size: 20 })}</span>
            <span class="row-main">
              <span class="row-title">${t('profile.reset')}</span>
              <span class="row-meta">${t('profile.resetMeta')}</span>
            </span>
            ${UI.icon('chevronRight', { size: 20 })}
          </button>
        </li>
        <li>
          <button type="button" class="row" data-action="logout">
            <span class="tile is-danger">${UI.icon('logout', { size: 20 })}</span>
            <span class="row-main">
              <span class="row-title">${t('profile.logout')}</span>
              <span class="row-meta">${t('profile.logoutBody')}</span>
            </span>
            ${UI.icon('chevronRight', { size: 20 })}
          </button>
        </li>
      </ul>

      <p class="small muted center">${t('profile.footnote')}</p>
    `;
  }

  // Return keyboard focus to a row after a sheet closes (the list may have redrawn)
  const focusRow = (action) => {
    const row = el.querySelector(`[data-action="${action}"]`);
    if (row) row.focus();
  };

  // Transaction history is a full screen with a back button (no tab)
  function openHistory() {
    HistoryScreen.open();
  }

  // ---------- Identity verification (simulated) ----------
  const kycLabel = () => t(`kyc.status.${data.kyc.status}`);
  const kycMeta = () =>
    data.kyc.status === 'verified' ? t('profile.kycMetaDone', { document: t(`kyc.doc.${data.kyc.document}`) }) : t('profile.kycMetaTodo');

  // Language names: native name, with the English name for clarity
  const languageName = (code) => {
    const l = I18N.LANGUAGES.find((x) => x.code === code);
    return l.native ? `${l.native} (${l.name})` : l.name;
  };

  function verifiedSheet() {
    const sheet = UI.openSheet({ title: t('profile.kyc') });
    sheet.body.innerHTML = `
      <div class="result">
        ${UI.successArt()}
        <h3 class="result-title">${t('kyc.verified.title')}</h3>
        <p class="muted">${t('profile.kycDoneBody')}</p>
      </div>
      <button type="button" class="btn btn-secondary btn-block" data-sheet-close>${t('common.close')}</button>`;
  }

  // ---------- Language ----------
  function languageSheet() {
    const sheet = UI.openSheet({ title: t('profile.language'), onClose: () => focusRow('language') });
    sheet.body.innerHTML = `
      <fieldset class="lang-list">
        <legend class="sr-only">${t('profile.language')}</legend>
        ${I18N.LANGUAGES.map(
          (l) => `
          <label class="lang-option">
            <input type="radio" name="lang" value="${l.code}" ${l.code === I18N.lang ? 'checked' : ''}>
            <span class="lang-name" lang="${l.html}">${l.native || l.name}</span>
            <span class="lang-en">${l.native ? l.name : ''}</span>
          </label>`
        ).join('')}
      </fieldset>
      <p class="small muted">${t('language.draftNote')}</p>
      <button type="button" class="btn btn-secondary btn-block" data-sheet-close>${t('common.done')}</button>`;
    sheet.body.addEventListener('change', (event) => {
      if (event.target.name !== 'lang') return;
      sheet.close({ silent: true });
      I18N.set(event.target.value); // every screen re-renders; balances stay as they are
      focusRow('language');
      UI.announce(t('language.changed', { language: languageName(event.target.value) }));
    });
  }

  // ---------- Sheets ----------
  function resetSheet() {
    const sheet = UI.openSheet({ title: t('profile.resetTitle') });
    sheet.body.innerHTML = `
      <p class="muted">${t('profile.resetBody', { name: UI.esc(data.firstName()) })}</p>
      <div class="sheet-actions">
        <button type="button" class="btn btn-primary btn-block" data-step="reset">${t('profile.reset')}</button>
        <button type="button" class="btn btn-quiet btn-block" data-sheet-close>${t('common.cancel')}</button>
      </div>`;
    sheet.body.addEventListener('click', (event) => {
      if (!event.target.closest('[data-step="reset"]')) return;
      sheet.close({ silent: true });
      data.resetAll();
      if (window.resetScrollPositions) window.resetScrollPositions();
      const row = el.querySelector('[data-action="reset"]');
      if (row) row.focus();
      UI.toast(t('profile.resetDone'), { icon: 'refresh' });
    });
  }

  function logoutSheet() {
    const sheet = UI.openSheet({ title: t('profile.logoutTitle') });
    sheet.body.innerHTML = `
      <p class="muted">${t('profile.logoutBody')}</p>
      <div class="sheet-actions">
        <button type="button" class="btn btn-primary btn-block" data-step="logout">${t('profile.logout')}</button>
        <button type="button" class="btn btn-quiet btn-block" data-sheet-close>${t('common.cancel')}</button>
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
    if (action === 'verify') {
      if (data.kyc.status === 'verified') verifiedSheet();
      else KYC.open();
    }
    if (action === 'reset') resetSheet();
    if (action === 'language') languageSheet();
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

  // Language change: redraw the main view (history redraws itself)
  I18N.onChange(() => {
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
