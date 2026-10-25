// Learn tab: short financial-education guides, filterable by level.
// General information only (each guide says it isn't financial advice).
// Text comes from js/i18n/*.js (learn.a.<id>.*); add a guide by adding an
// entry below and its strings in all three language files.

window.Screens = window.Screens || {};

Screens.learn = function (el) {
  const t = (key, vars) => I18N.t(key, vars);

  const GUIDES = [
    { id: 'share', level: 'beginner', minutes: 3, icon: 'invest' },
    { id: 'risk', level: 'beginner', minutes: 3, icon: 'alert' },
    { id: 'circle', level: 'beginner', minutes: 4, icon: 'users' },
    { id: 'diversify', level: 'intermediate', minutes: 4, icon: 'leaf' },
    { id: 'orders', level: 'intermediate', minutes: 3, icon: 'coins' },
  ];
  const LEVELS = ['all', 'beginner', 'intermediate'];
  let level = 'all';

  function rows() {
    return GUIDES.filter((g) => level === 'all' || g.level === level)
      .map(
        (g) => `
        <li>
          <button type="button" class="row guide" data-guide="${g.id}">
            <span class="tile is-shares">${UI.icon(g.icon, { size: 22 })}</span>
            <span class="row-main">
              <span class="row-title">${t(`learn.a.${g.id}.title`)}</span>
              <span class="row-meta">${t(`learn.a.${g.id}.summary`)}</span>
              <span class="guide-meta">${t('learn.minutes', { count: g.minutes })} · ${t(`learn.level.${g.level}`)}</span>
            </span>
            <span class="row-chevron">${UI.icon('chevronRight', { size: 20 })}</span>
          </button>
        </li>`
      )
      .join('');
  }

  function render() {
    el.innerHTML = `
      <header class="screen-head">
        <div>
          <h1 class="screen-title">${t('learn.title')}</h1>
          <p class="screen-subtitle">${t('learn.subtitle')}</p>
        </div>
      </header>

      ${UI.illustration('learn', { banner: true })}

      <div class="filters" role="group" aria-label="${UI.esc(t('learn.filterLabel'))}">
        ${LEVELS.map((l) => `<button type="button" class="chip" data-level="${l}" aria-pressed="${l === level}">${t(`learn.level.${l}`)}</button>`).join('')}
      </div>

      <ul class="list" role="list" data-guides>${rows()}</ul>

      <p class="small muted center">${t('learn.notAdvice')}</p>
    `;
  }

  function openGuide(id) {
    const g = GUIDES.find((x) => x.id === id);
    const sheet = UI.openSheet({
      title: t(`learn.a.${id}.title`),
      onClose: () => {
        const row = el.querySelector(`[data-guide="${id}"]`);
        if (row) row.focus();
      },
    });
    sheet.body.innerHTML = `
      <p class="guide-meta">${t('learn.minutes', { count: g.minutes })} · ${t(`learn.level.${g.level}`)}</p>
      <div class="guide-body">
        <p>${t(`learn.a.${id}.p1`)}</p>
        <p>${t(`learn.a.${id}.p2`)}</p>
        <p>${t(`learn.a.${id}.p3`)}</p>
      </div>
      <div class="notice notice-ok">
        ${UI.icon('info')}
        <p>${t('learn.notAdvice')}</p>
      </div>
      <button type="button" class="btn btn-secondary btn-block" data-sheet-close>${t('common.close')}</button>`;
  }

  el.addEventListener('click', (event) => {
    const button = event.target.closest('button');
    if (!button || !el.contains(button)) return;
    if (button.dataset.level) {
      level = button.dataset.level;
      el.querySelectorAll('[data-level]').forEach((chip) => chip.setAttribute('aria-pressed', String(chip.dataset.level === level)));
      el.querySelector('[data-guides]').innerHTML = rows();
    }
    if (button.dataset.guide) openGuide(button.dataset.guide);
  });

  // Tapping the Learn tab again shows every guide
  el.addEventListener('tabreselect', () => {
    if (level === 'all') return;
    level = 'all';
    render();
  });

  I18N.onChange(render);
  render();
};
