// Shared UI helpers used by every screen: money formatting, icons, charts,
// bottom sheets, toasts and screen-reader announcements.
// Shared file: agree with each other before changing it.
// Load this before any screen file (see index.html).

(function () {
  const UI = {};
  const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

  UI.reducedMotion = () => reducedMotionQuery.matches;
  UI.wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  // Escape text before putting it inside an HTML string
  UI.esc = (value) =>
    String(value).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  // ---------- Numbers (formatted for the current language by js/i18n.js) ----------
  UI.groupDigits = (n) => I18N.formatNumber(Math.round(n));

  // "RWF 245,000" in English, "245 000 RWF" in French, "245,000 Frw" in Kinyarwanda
  UI.rwf = (amount) => I18N.formatMoney(amount);

  // Signed values use a real minus sign (−) so screen readers say "minus"
  UI.signedRwf = (amount) => `${I18N.sign(Math.round(amount))}${I18N.formatMoney(amount)}`;

  UI.pct = (value, digits = 1) => I18N.formatPercent(value, digits);

  // Gain/loss label: arrow + sign + colour, so colour is never the only signal
  UI.change = (pct) => {
    const rounded = Number(pct.toFixed(1));
    const dir = rounded > 0 ? 'up' : rounded < 0 ? 'down' : 'flat';
    const icon = dir === 'up' ? 'arrowUp' : dir === 'down' ? 'arrowDown' : 'minus';
    return `<span class="change ${dir}">${UI.icon(icon, { size: 15 })}<span class="num">${UI.pct(pct)}</span></span>`;
  };

  // Count numbers up or down smoothly (skipped when reduced motion is on)
  UI.animateNumber = (el, from, to, format) => {
    if (!el) return;
    if (UI.reducedMotion() || from === to) {
      el.textContent = format(to);
      return;
    }
    const start = performance.now();
    const duration = 700;
    const step = (now) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      el.textContent = format(from + (to - from) * eased);
      if (t < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };

  // ---------- Sample data helpers ----------
  // Repeatable pseudo-random numbers, so sample charts look the same every time
  UI.seeded = (seed) => () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  // A simulated price path of `days` points that ends exactly at `end`
  UI.simPath = ({ seed, end, days, drift = 0, vol = 0.01 }) => {
    const rand = UI.seeded(seed);
    const raw = [1];
    for (let i = 1; i < days; i++) {
      const shock = (rand() - 0.5) * 2 * vol;
      raw.push(raw[i - 1] * (1 + drift + shock));
    }
    const scale = end / raw[raw.length - 1];
    return raw.map((v) => v * scale);
  };

  // ---------- Icons (one outline family, 24px grid) ----------
  const ICONS = {
    home: '<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V20a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V9.5"/>',
    invest: '<path d="M3 17l6-6 4 4 8-8"/><path d="M15 7h6v6"/>',
    circle:
      '<circle cx="12" cy="12" r="7"/><circle cx="12" cy="5" r="2.2" fill="currentColor" stroke="none"/>' +
      '<circle cx="18.06" cy="15.5" r="2.2" fill="currentColor" stroke="none"/><circle cx="5.94" cy="15.5" r="2.2" fill="currentColor" stroke="none"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
    users:
      '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><path d="M16 4.6a3.5 3.5 0 0 1 0 6.8"/><path d="M18 14.3a6.5 6.5 0 0 1 3.5 5.7"/>',
    arrowUp: '<path d="M12 19V5"/><path d="M6 11l6-6 6 6"/>',
    arrowDown: '<path d="M12 5v14"/><path d="M18 13l-6 6-6-6"/>',
    minus: '<path d="M6 12h12"/>',
    chevronLeft: '<path d="M15 18l-6-6 6-6"/>',
    chevronRight: '<path d="M9 18l6-6-6-6"/>',
    close: '<path d="M18 6 6 18"/><path d="M6 6l12 12"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5"/><path d="M12 7.5h.01"/>',
    alert:
      '<path d="M10.3 3.9 2.6 17.4a2 2 0 0 0 1.7 3h15.4a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/><path d="M12 9v4"/><path d="M12 17h.01"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
    checkCircle: '<circle cx="12" cy="12" r="9"/><path d="M8 12.5l2.7 2.7L16.2 9.5"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    coins:
      '<ellipse cx="9" cy="7" rx="6" ry="3"/><path d="M3 7v4c0 1.7 2.7 3 6 3s6-1.3 6-3V7"/><path d="M3 11v4c0 1.7 2.7 3 6 3 .7 0 1.4-.1 2-.2"/>' +
      '<ellipse cx="16" cy="15" rx="5" ry="2.5"/><path d="M11 15v3.5c0 1.4 2.2 2.5 5 2.5s5-1.1 5-2.5V15"/>',
    vote: '<path d="M5 8h14v11a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V8z"/><path d="M8 8V4h8v4"/><path d="M9 14l2 2 4-4"/>',
    refresh:
      '<path d="M3 12a9 9 0 0 1 15.5-6.3L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-15.5 6.3L3 16"/><path d="M3 21v-5h5"/>',
    shield: '<path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3z"/>',
    book: '<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5z"/><path d="M4 20.5A2.5 2.5 0 0 0 6.5 23"/><path d="M8 7h8M8 11h6"/>',
    leaf: '<path d="M5 19c0-8 5-14 15-15-1 10-7 15-15 15z"/><path d="M5 19l7-7"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/>',
    plus: '<path d="M12 5v14"/><path d="M5 12h14"/>',
    history: '<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l3 2"/>',
    logout: '<path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3"/><path d="M10 17l-5-5 5-5"/><path d="M5 12h11"/>',
    cash: '<rect x="3" y="6" width="18" height="12" rx="2"/><circle cx="12" cy="12" r="2.5"/><path d="M7 9.5v5M17 9.5v5"/>',
    globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><path d="M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3z"/>',
    wallet:
      '<path d="M3 7a2 2 0 0 1 2-2h12a1 1 0 0 1 1 1v2"/><path d="M3 7v11a2 2 0 0 0 2 2h14a1 1 0 0 0 1-1v-3"/><path d="M21 11h-4a2 2 0 0 0 0 4h4v-4z"/>',
  };

  // label given = meaningful icon; no label = decorative, hidden from screen readers
  UI.icon = (name, { size = 20, label = '' } = {}) => {
    const a11y = label ? `role="img" aria-label="${UI.esc(label)}"` : 'aria-hidden="true" focusable="false"';
    return `<svg class="icon" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" ${a11y}>${ICONS[name] || ''}</svg>`;
  };

  // ---------- Illustrations (small inline SVGs in brand colours) ----------
  // Success: a green check inside the brand ring of members
  UI.successArt = () => {
    const dots = Array.from({ length: 8 }, (_, i) => {
      const a = (i / 8) * Math.PI * 2 - Math.PI / 2;
      return `<circle cx="${(40 + Math.cos(a) * 34).toFixed(1)}" cy="${(40 + Math.sin(a) * 34).toFixed(1)}" r="${i % 2 ? 2.5 : 3.5}" fill="${i % 2 ? '#6E9BCB' : '#E2802A'}"/>`;
    }).join('');
    return `<svg class="success-art" viewBox="0 0 80 80" width="80" height="80" aria-hidden="true" focusable="false">
      ${dots}<circle cx="40" cy="40" r="24" fill="#E3F3EB"/><circle cx="40" cy="40" r="17" fill="#1F8A5B"/>
      <path d="M32 40.5l5.5 5.5 11-11.5" fill="none" stroke="#FFFFFF" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  };

  // ---------- Charts ----------
  // Simple SVG line chart. Colour comes from CSS `color` on the parent.
  // Pass `label` (a plain-language summary) so screen readers get the trend.
  // baseline: true draws a dashed line at the starting value, so it's easy to see
  // whether the line ended above (gain) or below (loss) where it began.
  UI.lineChart = (points, { width = 320, height = 120, strokeWidth = 2, padding = 6, area = false, baseline = false, label = '' } = {}) => {
    const min = Math.min(...points);
    const max = Math.max(...points);
    const span = max - min || 1;
    const stepX = width / (points.length - 1);
    const coords = points.map((v, i) => [i * stepX, padding + (height - padding * 2) * (1 - (v - min) / span)]);
    const line = coords.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`).join(' ');
    const a11y = label ? `role="img" aria-label="${UI.esc(label)}"` : 'aria-hidden="true" focusable="false"';
    const areaPath = area ? `<path class="chart-area" d="${line} L${width} ${height} L0 ${height} Z"/>` : '';
    const startY = coords[0][1].toFixed(1);
    const baselinePath = baseline
      ? `<path class="chart-baseline" d="M0 ${startY} L${width} ${startY}" vector-effect="non-scaling-stroke"/>`
      : '';
    return (
      `<svg class="chart" viewBox="0 0 ${width} ${height}" preserveAspectRatio="none" ${a11y}>` +
      `${areaPath}${baselinePath}<path class="chart-line" d="${line}" stroke-width="${strokeWidth}" vector-effect="non-scaling-stroke"/></svg>`
    );
  };

  // ---------- Announcements and toasts ----------
  UI.announce = (message) => {
    const region = document.getElementById('live-region');
    if (!region) return;
    region.textContent = '';
    setTimeout(() => {
      region.textContent = message;
    }, 60);
  };

  UI.toast = (message, { icon = 'checkCircle' } = {}) => {
    const region = document.getElementById('toast-region');
    if (!region) return;
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `${UI.icon(icon)}<span>${UI.esc(message)}</span>`;
    region.appendChild(toast);
    UI.announce(message);
    setTimeout(() => {
      toast.classList.add('is-leaving');
      setTimeout(() => toast.remove(), 300);
    }, 3600);
  };

  // ---------- Bottom sheet (dialog inside the phone frame) ----------
  // Returns { body, setTitle, focusTitle, lock, unlock, close }.
  let activeSheet = null;

  UI.openSheet = ({ title = '', onClose } = {}) => {
    if (activeSheet) activeSheet.close({ silent: true });

    const root = document.getElementById('overlay-root');
    const opener = document.activeElement;
    const titleId = `sheet-title-${Date.now()}`;
    const layer = document.createElement('div');
    layer.className = 'sheet-layer';
    layer.innerHTML = `
      <div class="sheet-scrim" data-sheet-close></div>
      <div class="sheet" role="dialog" aria-modal="true" aria-labelledby="${titleId}">
        <div class="sheet-handle" aria-hidden="true"></div>
        <div class="sheet-head">
          <h2 class="sheet-title" id="${titleId}" tabindex="-1"></h2>
          <button type="button" class="sheet-close" data-sheet-close aria-label="${UI.esc(I18N.t('common.close'))}">${UI.icon('close', { size: 22 })}</button>
        </div>
        <div class="sheet-body"></div>
      </div>`;
    root.appendChild(layer);

    const sheet = layer.querySelector('.sheet');
    const scrim = layer.querySelector('.sheet-scrim');
    const titleEl = layer.querySelector('.sheet-title');
    const background = [document.querySelector('.screens'), document.querySelector('.tabbar')].filter(Boolean);
    background.forEach((node) => node.setAttribute('inert', ''));

    const focusables = () =>
      [...sheet.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')].filter(
        (node) => !node.disabled && node.offsetParent !== null
      );

    const onKey = (event) => {
      if (event.key === 'Escape' && !controller.locked) {
        event.preventDefault();
        controller.close();
      }
      if (event.key === 'Tab') {
        const items = focusables();
        if (!items.length) return;
        const first = items[0];
        const last = items[items.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };

    const controller = {
      body: layer.querySelector('.sheet-body'),
      locked: false,
      closed: false,
      setTitle(text) {
        titleEl.textContent = text;
      },
      focusTitle() {
        titleEl.focus();
      },
      lock() {
        controller.locked = true;
        layer.querySelectorAll('[data-sheet-close]').forEach((node) => {
          if (node.tagName === 'BUTTON') node.disabled = true;
        });
      },
      unlock() {
        controller.locked = false;
        layer.querySelectorAll('button[data-sheet-close]').forEach((node) => {
          node.disabled = false;
        });
      },
      // silent: skip onClose and focus return (caller handles focus)
      close({ silent = false } = {}) {
        if (controller.closed) return;
        controller.closed = true;
        document.removeEventListener('keydown', onKey);
        background.forEach((node) => node.removeAttribute('inert'));
        scrim.classList.remove('is-open');
        sheet.classList.remove('is-open');
        const remove = () => layer.remove();
        if (UI.reducedMotion()) remove();
        else setTimeout(remove, 300);
        if (activeSheet === controller) activeSheet = null;
        if (!silent) {
          if (onClose) onClose();
          if (opener && document.contains(opener)) opener.focus();
        }
      },
    };

    layer.addEventListener('click', (event) => {
      if (event.target.closest('[data-sheet-close]') && !controller.locked) controller.close();
    });
    document.addEventListener('keydown', onKey);

    controller.setTitle(title);
    activeSheet = controller;

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        scrim.classList.add('is-open');
        sheet.classList.add('is-open');
        titleEl.focus();
      });
    });

    return controller;
  };

  // ---------- Logo (one central component; settings in js/brand.js) ----------
  // Sized by height inside a fixed box, so a future logo with a different shape
  // doesn't move anything around it.
  UI.logo = ({ size = 32, showName = true, label = true } = {}) => {
    const brand = window.BRAND || { name: 'Ubuntu Invest', logo: { src: 'assets/logo-mark.svg', includesName: false, aspect: 1 } };
    const width = Math.round(size * (brand.logo.aspect || 1));
    const name = showName && !brand.logo.includesName ? `<span class="logo-name">${UI.esc(brand.name)}</span>` : '';
    const alt = label && !name ? UI.esc(brand.name) : '';
    return `<span class="logo" style="--logo-h:${size}px">
      <img class="logo-img" src="${UI.esc(brand.logo.src)}" width="${width}" height="${size}" alt="${alt}">${name}</span>`;
  };

  // ---------- Illustrations (pictures listed in js/illustrations.js) ----------
  // banner: crop to a 16:10 strip for the top of a screen. Decorative (empty alt).
  UI.illustration = (key, { banner = false, className = '' } = {}) => {
    const item = (window.ILLUSTRATIONS || {})[key];
    if (!item) return '';
    return `<img class="illustration${banner ? ' is-banner' : ''}${className ? ` ${className}` : ''}" src="${UI.esc(item.src)}"
      width="${item.width}" height="${item.height}" alt="" decoding="async">`;
  };

  // ---------- People illustrations (warm, community style; flat SVG) ----------
  const SKIN = ['#8D5524', '#6B3E26', '#A0663D', '#5A3420', '#7A4A2A'];
  const CLOTHES = ['#13355A', '#1F8A5B', '#E2802A', '#2F5D8A', '#B85F12'];
  const WRAPS = ['#E2802A', '#1F8A5B', '#F2C14E', '#13355A'];
  const HAIR = '#22160F';

  // One person: shoulders, neck, head, and hair or a headwrap
  function person(x, y, s, i, opts = {}) {
    const skin = SKIN[i % SKIN.length];
    const shirt = CLOTHES[(i + (opts.shift || 0)) % CLOTHES.length];
    const wrap = i % 2 === 0;
    return `<g transform="translate(${x} ${y}) scale(${s})">
      <path d="M-24 46 C-24 22 -14 16 0 16 C14 16 24 22 24 46 Z" fill="${shirt}"/>
      <rect x="-5" y="6" width="10" height="12" rx="4" fill="${skin}"/>
      <ellipse cx="0" cy="-4" rx="12" ry="13.5" fill="${skin}"/>
      ${
        wrap
          ? `<path d="M-13 -6 C-13 -24 13 -24 13 -6 C9 -12 -9 -12 -13 -6 Z" fill="${WRAPS[i % WRAPS.length]}"/><circle cx="9" cy="-19" r="5" fill="${WRAPS[i % WRAPS.length]}"/>`
          : `<path d="M-12.5 -5 C-14 -20 14 -21 12.5 -5 C10 -12 -9 -13 -12.5 -5 Z" fill="${HAIR}"/>`
      }
      <circle cx="-4.5" cy="-3" r="1.4" fill="${HAIR}"/><circle cx="4.5" cy="-3" r="1.4" fill="${HAIR}"/>
      <path d="M-4 4 Q0 7 4 4" fill="none" stroke="${HAIR}" stroke-width="1.4" stroke-linecap="round"/>
    </g>`;
  }

  // variant: 'welcome' (scene with sun and hills), 'group' (4 people), 'pair' (2 people)
  UI.peopleArt = (variant = 'group') => {
    if (variant === 'welcome') {
      return `<svg class="people-art people-welcome" viewBox="0 0 320 200" aria-hidden="true" focusable="false">
        <circle cx="262" cy="58" r="34" fill="#F2B36B"/>
        <path d="M0 132 C60 96 110 104 160 122 C210 140 260 104 320 114 V200 H0 Z" fill="#B9D7B0"/>
        <path d="M0 152 C70 128 140 140 200 150 C250 158 290 140 320 144 V200 H0 Z" fill="#7FB38A"/>
        ${person(98, 128, 1.45, 1, { shift: 1 })}
        ${person(222, 128, 1.45, 3, { shift: 2 })}
        ${person(160, 140, 1.6, 0)}
        <rect x="149" y="176" width="22" height="14" rx="3" fill="#13355A"/>
      </svg>`;
    }
    const n = variant === 'pair' ? 2 : 4;
    const w = variant === 'pair' ? 110 : 190;
    const people = Array.from({ length: n }, (_, i) => person(28 + i * ((w - 56) / (n - 1)), 44 + (i % 2) * 6, 0.95, i + 1, { shift: i })).join('');
    return `<svg class="people-art people-${variant}" viewBox="0 0 ${w} 96" aria-hidden="true" focusable="false">
      <ellipse cx="${w / 2}" cy="92" rx="${w / 2 - 6}" ry="6" fill="#000" opacity="0.06"/>${people}</svg>`;
  };

  // Illustrated avatar for a member (stable look per name); "you" gets a navy ring
  UI.avatar = (name, { you = false, size = 44 } = {}) => {
    let h = 0;
    for (const c of String(name)) h = (h * 31 + c.charCodeAt(0)) >>> 0;
    const i = h % 5;
    return `<svg class="avatar-art${you ? ' is-you' : ''}" width="${size}" height="${size}" viewBox="-30 -30 60 60" aria-hidden="true" focusable="false">
      <circle r="29" fill="${['#FCEEDF', '#E3F3EB', '#E7EEF6', '#F6E3D3', '#EAF1E2'][i]}"/>
      <clipPath id="av-${h}"><circle r="29"/></clipPath>
      <g clip-path="url(#av-${h})">${person(0, 6, 1, i)}</g>
      ${you ? '<circle r="28" fill="none" stroke="#13355A" stroke-width="2.5"/>' : ''}
    </svg>`;
  };

  // ---------- Donut chart (decorative; always show a text legend beside it) ----------
  UI.donut = (segments, { size = 120, thickness = 18 } = {}) => {
    const r = (size - thickness) / 2;
    const c = 2 * Math.PI * r;
    const total = segments.reduce((sum, seg) => sum + seg.value, 0) || 1;
    let offset = 0;
    const arcs = segments
      .filter((seg) => seg.value > 0)
      .map((seg) => {
        const len = (seg.value / total) * c;
        const arc = `<circle r="${r}" cx="${size / 2}" cy="${size / 2}" fill="none" stroke="${seg.color}" stroke-width="${thickness}"
          stroke-dasharray="${len.toFixed(2)} ${(c - len).toFixed(2)}" stroke-dashoffset="${(-offset).toFixed(2)}" transform="rotate(-90 ${size / 2} ${size / 2})"/>`;
        offset += len;
        return arc;
      })
      .join('');
    return `<svg class="donut" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" aria-hidden="true" focusable="false">
      <circle r="${r}" cx="${size / 2}" cy="${size / 2}" fill="none" stroke="#EEF2F6" stroke-width="${thickness}"/>${arcs}</svg>`;
  };

  window.UI = UI;
})();
