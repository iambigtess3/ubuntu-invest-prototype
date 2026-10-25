// Identity verification (KYC), simulated.
//
// Used after sign-up (inside onboarding) and from Profile. Nothing real is
// collected: no document numbers, no photos, no camera. The "photos" are
// sample placeholders, and the review always finishes as a simulated approval.
//
// KYC.render(container, { onFinish, onSkip }) draws the flow into a container.
// KYC.open() shows it full-screen over the app (used by Profile and Home).

window.KYC = (function () {
  const STEPS = 3;
  const t = (key, vars) => I18N.t(key, vars);

  // Simple illustrations (brand colours, no external files)
  const ART = {
    intro: `
      <svg class="kyc-art" viewBox="0 0 200 140" aria-hidden="true" focusable="false">
        <rect x="30" y="28" width="120" height="80" rx="10" fill="#FFFFFF" stroke="#13355A" stroke-width="3"/>
        <circle cx="62" cy="62" r="14" fill="#E7EEF6"/>
        <circle cx="62" cy="57" r="6" fill="#13355A"/>
        <path d="M51 74a11 11 0 0 1 22 0" fill="#13355A"/>
        <rect x="86" y="50" width="48" height="6" rx="3" fill="#13355A"/>
        <rect x="86" y="62" width="36" height="6" rx="3" fill="#B7C6D8"/>
        <rect x="46" y="88" width="88" height="6" rx="3" fill="#B7C6D8"/>
        <path d="M150 70l22 9v16c0 13-9 22-22 27-13-5-22-14-22-27V79l22-9z" fill="#1F8A5B"/>
        <path d="M140 96l7 7 14-15" fill="none" stroke="#FFFFFF" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>`,
    'national-id': `
      <svg viewBox="0 0 48 32" aria-hidden="true" focusable="false"><rect x="1.5" y="1.5" width="45" height="29" rx="4" fill="#FFFFFF" stroke="currentColor" stroke-width="2.5"/><circle cx="14" cy="14" r="5" fill="currentColor"/><path d="M7 25a7 7 0 0 1 14 0" fill="currentColor"/><rect x="25" y="10" width="15" height="3" rx="1.5" fill="currentColor"/><rect x="25" y="17" width="11" height="3" rx="1.5" fill="#B7C6D8"/></svg>`,
    passport: `
      <svg viewBox="0 0 48 32" aria-hidden="true" focusable="false"><rect x="10" y="1.5" width="28" height="29" rx="3" fill="currentColor"/><circle cx="24" cy="13" r="6" fill="none" stroke="#FFFFFF" stroke-width="2"/><path d="M18 13h12M24 7c2.5 2 2.5 10 0 12M24 7c-2.5 2-2.5 10 0 12" fill="none" stroke="#FFFFFF" stroke-width="1.5"/><rect x="17" y="23" width="14" height="2.5" rx="1.25" fill="#FFFFFF"/></svg>`,
    selfie: `
      <svg viewBox="0 0 48 32" aria-hidden="true" focusable="false"><circle cx="24" cy="16" r="14" fill="#FFFFFF" stroke="currentColor" stroke-width="2.5"/><circle cx="19" cy="14" r="1.8" fill="currentColor"/><circle cx="29" cy="14" r="1.8" fill="currentColor"/><path d="M18.5 20.5c3 3 8 3 11 0" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>`,
  };

  const DOCS = ['national-id', 'passport']; // labels: kyc.doc.<id>, kyc.docHint.<id>

  function progress(step) {
    return `
      <div class="kyc-progress">
        <p class="kyc-step-label">${t('kyc.step', { step, total: STEPS })}</p>
        <div class="kyc-bar" role="progressbar" aria-label="${UI.esc(t('kyc.progressLabel'))}" aria-valuemin="1" aria-valuemax="${STEPS}" aria-valuenow="${step}" aria-valuetext="${UI.esc(t('kyc.step', { step, total: STEPS }))}">
          ${Array.from({ length: STEPS }, (_, i) => `<span class="${i < step ? 'is-done' : ''}"></span>`).join('')}
        </div>
      </div>`;
  }

  function render(container, { onFinish, onSkip }) {
    let choice = SampleData.kyc.document;
    let photos = { document: false, selfie: false };

    // Each step starts at the top (so the illustration and progress show), then focus the title
    const focusTitle = () => {
      container.scrollTop = 0;
      const title = container.querySelector('.kyc-title');
      if (title) title.focus({ preventScroll: true });
    };

    let current = () => stepChoose();

    function stepChoose(error = '') {
      current = () => stepChoose(error);
      container.innerHTML = `
        <div class="kyc" data-kyc>
          ${progress(1)}
          ${UI.illustration('kyc', { banner: true, className: 'kyc-illustration' })}
          <h1 class="kyc-title" tabindex="-1">${t('kyc.title')}</h1>
          <span class="tag tag-sim kyc-sim">${t('common.simulated')}</span>
          <p class="muted">${t('kyc.why')}</p>
          <div class="notice notice-ok">
            ${UI.icon('info')}
            <p>${t('kyc.nothingCollected')}</p>
          </div>
          <fieldset class="kyc-choices" ${error ? 'aria-describedby="kyc-error"' : ''}>
            <legend>${t('kyc.choose')}</legend>
            ${DOCS.map(
                (id) => `
              <label class="kyc-choice">
                <input type="radio" name="kyc-doc" value="${id}" data-kyc-choice="${id}" ${choice === id ? 'checked' : ''}>
                <span class="kyc-choice-art">${ART[id]}</span>
                <span class="kyc-choice-text">
                  <span class="kyc-choice-label">${t(`kyc.doc.${id}`)}</span>
                  <span class="kyc-choice-hint">${t(`kyc.docHint.${id}`)}</span>
                </span>
              </label>`
              )
              .join('')}
          </fieldset>
          ${error ? `<p class="error" id="kyc-error" role="alert">${UI.icon('alert', { size: 16 })}<span>${t(error)}</span></p>` : ''}
          <div class="kyc-actions">
            <button type="button" class="btn btn-primary btn-block" data-kyc-action="next">${t('common.continue')}</button>
            <button type="button" class="btn btn-quiet btn-block" data-kyc-action="skip">${t('kyc.skip')}</button>
          </div>
        </div>`;
      if (error) container.querySelector('[data-kyc-choice]').focus();
      else focusTitle();
    }

    function stepPhotos(error = '') {
      current = () => stepPhotos(error);
      const task = (key, art, title, hint) => `
        <li class="kyc-task ${photos[key] ? 'is-done' : ''}">
          <span class="kyc-task-art">${art}</span>
          <span class="kyc-task-text">
            <span class="kyc-task-title">${title}</span>
            <span class="kyc-task-hint">${photos[key] ? t('kyc.photoAdded') : hint}</span>
          </span>
          ${
            photos[key]
              ? `<span class="kyc-task-done">${UI.icon('checkCircle', { size: 22, label: t('common.done') })}</span>`
              : `<button type="button" class="btn btn-secondary kyc-task-btn" data-kyc-photo="${key}">${t('kyc.addSample')}</button>`
          }
        </li>`;
      container.innerHTML = `
        <div class="kyc" data-kyc>
          <button type="button" class="back-btn" data-kyc-action="back">${UI.icon('chevronLeft', { size: 22 })}<span>${t('common.back')}</span></button>
          ${progress(2)}
          <h1 class="kyc-title" tabindex="-1">${t('kyc.photosTitle')}</h1>
          <span class="tag tag-sim kyc-sim">${t('common.simulated')}</span>
          <p class="muted">${t('kyc.photosIntro')}</p>
          <ul class="kyc-tasks" role="list">
            ${task('document', ART[choice], t(`kyc.photoOf.${choice}`), t('kyc.photoHint'))}
            ${task('selfie', ART.selfie, t('kyc.selfie'), t('kyc.selfieHint'))}
          </ul>
          ${error ? `<p class="error" role="alert">${UI.icon('alert', { size: 16 })}<span>${t(error)}</span></p>` : ''}
          <div class="kyc-actions">
            <button type="button" class="btn btn-primary btn-block" data-kyc-action="submit">${t('kyc.submit')}</button>
            <button type="button" class="btn btn-quiet btn-block" data-kyc-action="skip">${t('kyc.skip')}</button>
          </div>
        </div>`;
      focusTitle();
    }

    function stepReview(state) {
      current = () => stepReview(state);
      const item = (label, done, current) => `
        <li class="kyc-track-item ${done ? 'is-done' : ''} ${current ? 'is-current' : ''}">
          <span class="kyc-track-dot">${done ? UI.icon('check', { size: 14 }) : current ? '<span class="spinner" aria-hidden="true"></span>' : ''}</span>
          <span>${label}</span>
        </li>`;
      const verified = state === 'verified';
      container.innerHTML = `
        <div class="kyc" data-kyc>
          ${progress(3)}
          ${verified ? UI.illustration('kyc', { banner: true, className: 'kyc-illustration' }) : ''}
          <h1 class="kyc-title" tabindex="-1">${verified ? t('kyc.verified.title') : t('kyc.checking')}</h1>
          <span class="tag tag-sim kyc-sim">${t('common.simulated')}</span>
          <ol class="kyc-track" role="list" aria-live="polite">
            ${item(t('kyc.track.submitted'), true, false)}
            ${item(verified ? t('kyc.track.reviewed') : t('kyc.track.reviewing'), verified, !verified)}
            ${item(t('kyc.status.verified'), verified, false)}
          </ol>
          <p class="muted">${
            verified
              ? t('kyc.verified.body')
              : t('kyc.checkingBody')
          }</p>
          ${verified ? `<div class="kyc-actions"><button type="button" class="btn btn-primary btn-block" data-kyc-action="finish">${t('common.continue')}</button></div>` : ''}
        </div>`;
      focusTitle();
    }

    async function submit() {
      if (!photos.document || !photos.selfie) {
        stepPhotos('kyc.error.photos');
        return;
      }
      SampleData.updateKyc({ status: 'in-review', document: choice });
      stepReview('in-review');
      UI.announce(t('kyc.checking'));
      await UI.wait(1600);
      SampleData.updateKyc({ status: 'verified' });
      stepReview('verified');
      UI.announce(`${t('kyc.verified.title')}. ${t('common.simulated')}.`);
    }

    container.onclick = (event) => {
      const button = event.target.closest('button');
      if (!button) return;
      const action = button.dataset.kycAction;
      if (button.dataset.kycPhoto) {
        photos[button.dataset.kycPhoto] = true;
        stepPhotos();
        const next = container.querySelector('[data-kyc-photo]') || container.querySelector('[data-kyc-action="submit"]');
        if (next) next.focus();
      }
      if (action === 'next') {
        if (!choice) stepChoose('kyc.error.choose');
        else stepPhotos();
      }
      if (action === 'back') stepChoose();
      if (action === 'submit') submit();
      if (action === 'skip') onSkip();
      if (action === 'finish') onFinish();
    };
    container.onchange = (event) => {
      if (event.target.name === 'kyc-doc') choice = event.target.value;
    };

    // Redraw the current step if the language changes while the flow is open
    const unsubscribe = I18N.onChange(() => {
      if (!document.contains(container) || !container.querySelector('[data-kyc]')) {
        unsubscribe();
        return;
      }
      current();
    });

    stepChoose();
  }

  // Full-screen version, over the app (Profile and Home use this)
  function open() {
    const phone = document.querySelector('.phone');
    const opener = document.activeElement;
    const background = [document.querySelector('.screens'), document.querySelector('.tabbar')].filter(Boolean);
    const layer = document.createElement('div');
    layer.className = 'onboarding';
    layer.setAttribute('role', 'dialog');
    layer.setAttribute('aria-modal', 'true');
    layer.setAttribute('aria-label', t('kyc.title'));
    phone.appendChild(layer);
    background.forEach((node) => node.setAttribute('inert', ''));

    const close = () => {
      background.forEach((node) => node.removeAttribute('inert'));
      layer.remove();
      // The screen behind may have re-rendered with the new status; fall back to the current tab
      const target = opener && document.contains(opener) ? opener : document.querySelector('.tab[aria-current="page"]');
      if (target) target.focus();
    };
    render(layer, { onFinish: close, onSkip: close });
  }

  return { render, open };
})();
