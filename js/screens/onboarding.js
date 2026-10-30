//
// Not a tab, so it does not add itself to window.Screens. It covers the phone
// screen until the person finishes or skips. Nothing entered is saved or sent:
// it only replaces the sample name, phone and email in js/data.js for this visit.

(function () {
  const phone = document.querySelector('.phone');
  let layer = null;
  let form = { fullName: '', phone: '', email: '' };
  const t = (key, vars) => I18N.t(key, vars);
  let current = () => {}; // the step on screen, redrawn if the language changes



  const background = () =>
    [document.querySelector('.screens'), document.querySelector('.tabbar'), document.getElementById('overlay-root')].filter(Boolean);



  // ---------- Steps ----------
  // Step 1: LYNK welcome. Full-screen forest with the glass spiral (picture set in
  // js/illustrations.js → welcome); motion and colours live in css/screens/onboarding.css.
  function stepWelcome() {
    current = stepWelcome;
    const art = (window.ILLUSTRATIONS || {}).welcome || { src: '', width: 720, height: 2512 };
    // The picture is 4 seamless repeats of the spiral in one image; the CSS moves
    // it up by exactly one repeat in a loop, so the helix turns endlessly.
    const img = (extra = '') =>
      `<img class="lw-flow"${extra} src="${UI.esc(art.src)}" width="${art.width}" height="${art.height}" alt="" decoding="async">`;
    layer.innerHTML = `
      <div class="ob-welcome">
        <div class="lw-bg" aria-hidden="true">
          <div class="lw-glow"></div>
          <div class="lw-spiral">
            <div class="lw-spiral-inner">
              ${img(' fetchpriority="high"')}
              <div class="lw-sheen">${img()}</div>
            </div>
          </div>
          <div class="lw-shade"></div>
        </div>

        <div class="lw-top">
          ${UI.logo({ size: 30 })}
          <button type="button" class="lw-skip" data-ob="skip">${t('ob.skip')}</button>
        </div>

        <div class="lw-center">
          <h1 class="ob-title lw-title" tabindex="-1">${t('ob.headline')}</h1>
          <p class="lw-lede">${t('ob.lede')}</p>
          <span class="lw-tag">${t('common.simulated')}</span>
        </div>

        <div class="lw-bottom">
          <button type="button" class="lw-cta" data-ob="start">
            <span>${t('ob.getStarted')}</span>
            <span class="lw-cta-arrow" aria-hidden="true"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" focusable="false"><path d="M5 12h14"/><path d="M13 6l6 6-6 6"/></svg></span>
          </button>
          <p class="lw-note">${t('ob.note')}</p>
        </div>
      </div>`;

    // Fade the spiral in only once its picture is decoded and ready to paint, so the
    // fade always runs on a visible image (no pop-in). It's preloaded in index.html,
    // so this is usually immediate. The fallback only matters if loading stalls.
    const spiral = layer.querySelector('.lw-spiral');
    const first = spiral.querySelector('.lw-flow');
    let shown = false;
    const show = () => {
      if (shown) return;
      shown = true;
      requestAnimationFrame(() => spiral.classList.add('is-ready'));
    };
    const ready = first.decode ? first.decode() : new Promise((resolve) => (first.complete ? resolve() : first.addEventListener('load', resolve, { once: true })));
    ready.then(show, show);
    setTimeout(show, 4000);

    layer.scrollTop = 0;
    layer.querySelector('.ob-title').focus({ preventScroll: true });
  }

  // Step 2: choose a language (switches instantly; can be changed later in Profile)
  function stepLanguage() {
    current = stepLanguage;
    layer.innerHTML = `
      <div class="ob-content">
        <button type="button" class="back-btn" data-ob="back-welcome">${UI.icon('chevronLeft', { size: 22 })}<span>${t('common.back')}</span></button>
        <h1 class="ob-title ob-title-sm" tabindex="-1">${t('ob.langTitle')}</h1>
        <p class="muted">${t('ob.langHint')}</p>
        <fieldset class="ob-langs">
          <legend class="sr-only">${t('ob.langTitle')}</legend>
          ${I18N.LANGUAGES.map(
            (l) => `
            <label class="ob-lang-option">
              <input type="radio" name="ob-lang" value="${l.code}" data-lang="${l.code}" ${l.code === I18N.lang ? 'checked' : ''}>
              <span class="ob-lang-badge" aria-hidden="true">${l.short}</span>
              <span class="ob-lang-text">
                <span class="ob-lang-name" lang="${l.html}">${l.native || l.name}</span>
                <span class="ob-lang-cta" lang="${l.html}">${l.cta}</span>
              </span>
            </label>`
          ).join('')}
        </fieldset>
        <p class="small muted">${t('language.draftNote')}</p>
        <button type="button" class="btn btn-primary btn-block" data-ob="signup">${t('common.continue')}</button>
      </div>`;
    layer.scrollTop = 0;
    layer.querySelector('.ob-title').focus({ preventScroll: true });
  }

  function validate() {
    const errors = [];
    if (form.fullName.trim().length < 2) errors.push({ field: 'ob-name', key: 'ob.error.name' });
    const digits = form.phone.replace(/\D/g, '');
    if (!/^7\d{8}$/.test(digits)) {
      errors.push({ field: 'ob-phone', key: 'ob.error.phone' });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      errors.push({ field: 'ob-email', key: 'ob.error.email' });
    }
    return errors;
  }

  function field({ id, label, value, type = 'text', inputmode, autocomplete, prefix, hint, error }) {
    const describedBy = [hint ? `${id}-hint` : '', error ? `${id}-error` : ''].filter(Boolean).join(' ');
    const input = `<input id="${id}" class="input ob-input" type="${type}" value="${UI.esc(value)}"
      ${inputmode ? `inputmode="${inputmode}"` : ''} autocomplete="${autocomplete}"
      ${describedBy ? `aria-describedby="${describedBy}"` : ''} ${error ? 'aria-invalid="true"' : ''}>`;
    return `
      <div class="field">
        <label for="${id}">${label}</label>
        ${prefix ? `<div class="input-wrap"><span class="input-prefix" aria-hidden="true">${prefix}</span>${input}</div>` : input}
        ${hint ? `<p class="hint" id="${id}-hint">${hint}</p>` : ''}
        ${error ? `<p class="error" id="${id}-error">${UI.icon('alert', { size: 16 })}<span>${error}</span></p>` : ''}
      </div>`;
  }

  function stepSignup(errors = []) {
    current = () => stepSignup(errors);
    const found = (id) => errors.find((e) => e.field === id);
    const errorFor = (id) => (found(id) ? t(found(id).key) : '');
    layer.innerHTML = `
      <div class="ob-content ob-form-step">
        <button type="button" class="back-btn" data-ob="back">${UI.icon('chevronLeft', { size: 22 })}<span>${t('common.back')}</span></button>
        <h1 class="ob-title ob-title-sm" tabindex="-1">${t('ob.signupTitle')}</h1>
        <p class="muted">${t('ob.signupIntro')}</p>

        ${
          errors.length
            ? `<div class="error-summary" role="alert" tabindex="-1">
                <p class="error-summary-title">${t('ob.errorSummary', { count: errors.length })}</p>
                <ul role="list">
                  ${errors.map((e) => `<li><a href="#${e.field}" data-focus="${e.field}">${t(e.key)}</a></li>`).join('')}
                </ul>
              </div>`
            : ''
        }

        <form class="ob-form" novalidate>
          ${field({ id: 'ob-name', label: t('ob.name'), value: form.fullName, autocomplete: 'name', error: errorFor('ob-name') })}
          ${field({
            id: 'ob-phone',
            label: t('ob.phone'),
            value: form.phone,
            type: 'tel',
            inputmode: 'tel',
            autocomplete: 'tel-national',
            prefix: '+250',
            hint: t('ob.phoneHint'),
            error: errorFor('ob-phone'),
          })}
          ${field({
            id: 'ob-email',
            label: t('ob.email'),
            value: form.email,
            type: 'email',
            inputmode: 'email',
            autocomplete: 'email',
            error: errorFor('ob-email'),
          })}
          <div class="notice">
            ${UI.icon('info')}
            <p>${t('ob.privacy')}</p>
          </div>
          <button type="submit" class="btn btn-primary btn-block" data-ob="create">${t('ob.create')}</button>
        </form>
      </div>`;

    if (errors.length) layer.querySelector('.error-summary').focus();
    else layer.querySelector('.ob-title').focus();
  }

  async function submit() {
    form.fullName = layer.querySelector('#ob-name').value;
    form.phone = layer.querySelector('#ob-phone').value;
    form.email = layer.querySelector('#ob-email').value;
    const errors = validate();
    if (errors.length) {
      stepSignup(errors);
      return;
    }
    const button = layer.querySelector('[data-ob="create"]');
    button.setAttribute('aria-busy', 'true');
    button.innerHTML = `<span class="spinner" aria-hidden="true"></span><span>${t('ob.creating')}</span>`;
    layer.querySelectorAll('button, input').forEach((node) => {
      node.disabled = true;
    });
    UI.announce(t('ob.creating'));
    await UI.wait(900);
    stepVerify();
  }

  // Simulated identity check straight after sign-up (can be skipped)
  function stepVerify() {
    current = () => {}; // the verification flow redraws itself on a language change
    KYC.render(layer, { onFinish: stepDone, onSkip: stepDone });
  }

  function stepDone() {
    current = stepDone;
    layer.onclick = null; // stop listening for verification buttons
    layer.onchange = null;
    const first = form.fullName.trim().split(/\s+/)[0];
    const verified = SampleData.kyc.status === 'verified';
    layer.innerHTML = `
      <div class="ob-content ob-done">
        ${UI.successArt()}
        <h1 class="ob-title ob-title-sm" tabindex="-1">${t('ob.welcome', { name: UI.esc(first) })}</h1>
        <p class="muted">${t('ob.ready')}</p>
        <p class="ob-kyc-status">${
          verified
            ? `${UI.icon('shield', { size: 18 })}<span>${t('ob.kycDone')}</span>`
            : `${UI.icon('info', { size: 18 })}<span>${t('ob.kycLater')}</span>`
        }</p>
        <ul class="ob-points" role="list">
          <li>${UI.icon('home')}<span>${t('ob.next1')}</span></li>
          <li>${UI.icon('invest')}<span>${t('ob.next2')}</span></li>
          <li>${UI.icon('circle')}<span>${t('ob.next3')}</span></li>
        </ul>
        <button type="button" class="btn btn-primary btn-block" data-ob="finish">${t('ob.goHome')}</button>
      </div>`;
    layer.querySelector('.ob-title').focus();
  }

  // ---------- Open / close ----------
  function close({ saveDetails }) {
    if (saveDetails) {
      const digits = form.phone.replace(/\D/g, '');
      SampleData.updateUser({
        fullName: form.fullName.trim(),
        phone: `+250 ${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`,
        email: form.email.trim(),
      });
    }
    background().forEach((node) => node.removeAttribute('inert'));
    const leaving = layer;
    layer = null;
    leaving.classList.add('is-leaving');
    setTimeout(() => leaving.remove(), UI.reducedMotion() ? 0 : 260);
    document.querySelector('.tab[data-tab="home"]').click();
    const title = document.querySelector('#home .screen-title');
    if (title) title.focus();
  }

  function start() {
    if (layer) return;
    form = { fullName: '', phone: '', email: '' };
    layer = document.createElement('div');
    layer.className = 'onboarding';
    layer.setAttribute('role', 'dialog');
    layer.setAttribute('aria-modal', 'true');
    layer.setAttribute('aria-label', t('ob.dialogLabel'));
    phone.appendChild(layer);
    background().forEach((node) => node.setAttribute('inert', ''));

    layer.addEventListener('click', (event) => {
      const link = event.target.closest('[data-focus]');
      if (link) {
        event.preventDefault();
        layer.querySelector(`#${link.dataset.focus}`).focus();
        return;
      }
      const langButton = event.target.closest('[data-lang]');
      if (langButton) {
        I18N.set(langButton.dataset.lang);
        const again = layer.querySelector(`[data-lang="${langButton.dataset.lang}"]`);
        if (again) again.focus();
        return;
      }
      const button = event.target.closest('[data-ob]');
      if (!button) return;
      const action = button.dataset.ob;
      if (action === 'signup') stepSignup();
      if (action === 'back') stepLanguage();
      if (action === 'back-welcome') stepWelcome();
      if (action === 'start') stepLanguage();
      if (action === 'skip') close({ saveDetails: false });
      if (action === 'finish') close({ saveDetails: true });
    });

    layer.addEventListener('change', (event) => {
      if (event.target.name !== 'ob-lang') return;
      I18N.set(event.target.value); // redraws this step in the new language
      const again = layer.querySelector(`[data-lang="${event.target.value}"]`);
      if (again) again.focus();
    });

    layer.addEventListener('submit', (event) => {
      event.preventDefault();
      submit();
    });

    stepWelcome();
  }

  // Redraw the current step in the new language, keeping anything typed
  I18N.onChange(() => {
    if (!layer) return;
    layer.setAttribute('aria-label', t('ob.dialogLabel'));
    ['fullName:#ob-name', 'phone:#ob-phone', 'email:#ob-email'].forEach((pair) => {
      const [key, sel] = pair.split(':');
      const input = layer.querySelector(sel);
      if (input) form[key] = input.value;
    });
    current();
  });

  window.Onboarding = { start };
  start();
})();
