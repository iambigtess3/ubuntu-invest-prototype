//
// Not a tab, so it does not add itself to window.Screens. It covers the phone
// screen until the person finishes or skips. Nothing entered is saved or sent:
// it only replaces the sample name, phone and email in js/data.js for this visit.

(function () {
  const phone = document.querySelector('.phone');
  let layer = null;
  let form = { fullName: '', phone: '', email: '' };

  const background = () =>
    [document.querySelector('.screens'), document.querySelector('.tabbar'), document.getElementById('overlay-root')].filter(Boolean);

  // Brand motif from the website: members in a ring around a shared core
  function ringArt() {
    const dots = Array.from({ length: 12 }, (_, i) => {
      const a = (i / 12) * Math.PI * 2 - Math.PI / 2;
      const big = i % 3 === 0;
      return `<circle cx="${(100 + Math.cos(a) * 70).toFixed(1)}" cy="${(100 + Math.sin(a) * 70).toFixed(1)}" r="${big ? 9 : 6}" fill="${big ? '#1F8A5B' : '#6E9BCB'}"/>`;
    }).join('');
    return `
      <svg class="ob-art" viewBox="0 0 200 200" aria-hidden="true" focusable="false">
        <circle cx="100" cy="100" r="70" fill="none" stroke="#E2802A" stroke-width="2" opacity="0.7"/>
        ${dots}
        <circle cx="100" cy="100" r="22" fill="#E2802A"/>
      </svg>`;
  }

  // ---------- Steps ----------
  function stepWelcome() {
    layer.innerHTML = `
      <div class="ob-hero">
        ${ringArt()}
      </div>
      <div class="ob-content">
        <h1 class="ob-title" tabindex="-1">Ubuntu Invest</h1>
        <p class="ob-lede">Invest in the Rwanda Stock Exchange from your phone, on your own or together with your ikimina.</p>
        <ul class="ob-points" role="list">
          <li>${UI.icon('invest')}<span>Buy shares in companies listed on the Rwanda Stock Exchange</span></li>
          <li>${UI.icon('circle')}<span>Invest as a group with Our Circle, with your own share tracked separately</span></li>
          <li>${UI.icon('alert')}<span>Clear about risk: investments can lose value</span></li>
        </ul>
        <div class="ob-actions">
          <button type="button" class="btn btn-primary btn-block" data-ob="signup">Create account</button>
          <button type="button" class="btn btn-quiet btn-block" data-ob="skip">Skip to the app</button>
        </div>
        <p class="ob-note">Prototype. No real account is created and no money is involved.</p>
      </div>`;
    layer.querySelector('.ob-title').focus();
  }

  function validate() {
    const errors = [];
    if (form.fullName.trim().length < 2) errors.push({ field: 'ob-name', message: 'Enter your full name.' });
    const digits = form.phone.replace(/\D/g, '');
    if (!/^7\d{8}$/.test(digits)) {
      errors.push({ field: 'ob-phone', message: 'Enter a 9-digit mobile number that starts with 7.' });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      errors.push({ field: 'ob-email', message: 'Enter an email address like name@example.com.' });
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
    const errorFor = (id) => (errors.find((e) => e.field === id) || {}).message;
    layer.innerHTML = `
      <div class="ob-content ob-form-step">
        <button type="button" class="back-btn" data-ob="back">${UI.icon('chevronLeft', { size: 22 })}<span>Back</span></button>
        <h1 class="ob-title ob-title-sm" tabindex="-1">Create your account</h1>
        <p class="muted">It takes a minute. In the live product, you'd also verify your identity with the proposed broker partner.</p>

        ${
          errors.length
            ? `<div class="error-summary" role="alert" tabindex="-1">
                <p class="error-summary-title">Fix ${errors.length === 1 ? 'this problem' : `these ${errors.length} problems`} to continue</p>
                <ul role="list">
                  ${errors.map((e) => `<li><a href="#${e.field}" data-focus="${e.field}">${e.message}</a></li>`).join('')}
                </ul>
              </div>`
            : ''
        }

        <form class="ob-form" novalidate>
          ${field({ id: 'ob-name', label: 'Full name', value: form.fullName, autocomplete: 'name', error: errorFor('ob-name') })}
          ${field({
            id: 'ob-phone',
            label: 'Mobile number',
            value: form.phone,
            type: 'tel',
            inputmode: 'tel',
            autocomplete: 'tel-national',
            prefix: '+250',
            hint: '9 digits, starting with 7',
            error: errorFor('ob-phone'),
          })}
          ${field({
            id: 'ob-email',
            label: 'Email',
            value: form.email,
            type: 'email',
            inputmode: 'email',
            autocomplete: 'email',
            error: errorFor('ob-email'),
          })}
          <div class="notice">
            ${UI.icon('info')}
            <p>Prototype: these details aren't saved or sent anywhere, and are cleared when the page reloads.</p>
          </div>
          <button type="submit" class="btn btn-primary btn-block" data-ob="create">Create account</button>
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
    button.innerHTML = '<span class="spinner" aria-hidden="true"></span><span>Creating your account…</span>';
    layer.querySelectorAll('button, input').forEach((node) => {
      node.disabled = true;
    });
    UI.announce('Creating your sample account');
    await UI.wait(900);
    stepDone();
  }

  function stepDone() {
    const first = form.fullName.trim().split(/\s+/)[0];
    layer.innerHTML = `
      <div class="ob-content ob-done">
        <span class="result-icon">${UI.icon('checkCircle', { size: 30 })}</span>
        <h1 class="ob-title ob-title-sm" tabindex="-1">Welcome, ${UI.esc(first)}!</h1>
        <p class="muted">Your sample account is ready. Everything you'll see is simulated.</p>
        <ul class="ob-points" role="list">
          <li>${UI.icon('home')}<span>See your balance and holdings on Home</span></li>
          <li>${UI.icon('invest')}<span>Try a simulated buy in Invest</span></li>
          <li>${UI.icon('circle')}<span>See how a Circle member can leave without affecting others</span></li>
        </ul>
        <button type="button" class="btn btn-primary btn-block" data-ob="finish">Go to Home</button>
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
    layer.setAttribute('aria-label', 'Welcome to Ubuntu Invest');
    phone.appendChild(layer);
    background().forEach((node) => node.setAttribute('inert', ''));

    layer.addEventListener('click', (event) => {
      const link = event.target.closest('[data-focus]');
      if (link) {
        event.preventDefault();
        layer.querySelector(`#${link.dataset.focus}`).focus();
        return;
      }
      const button = event.target.closest('[data-ob]');
      if (!button) return;
      const action = button.dataset.ob;
      if (action === 'signup') stepSignup();
      if (action === 'back') stepWelcome();
      if (action === 'skip') close({ saveDetails: false });
      if (action === 'finish') close({ saveDetails: true });
    });

    layer.addEventListener('submit', (event) => {
      event.preventDefault();
      submit();
    });

    stepWelcome();
  }

  window.Onboarding = { start };
  start();
})();
