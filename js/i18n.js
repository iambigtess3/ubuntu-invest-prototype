// Translations and number/date formatting for every screen.
// Shared file: agree with each other before changing it.
//
// How to use in a screen:
//   I18N.t('home.title')                     → text in the current language
//   I18N.t('home.greeting', { name: 'Ange' }) → fills {name}
//   I18N.t('common.shares', { count: 3 })     → picks the right plural form
//   I18N.onChange(fn)                         → re-render when the language changes
//
// Strings live in js/i18n/en.js, rw.js and fr.js. Any key missing in a
// language falls back to English. Static text in index.html uses
// data-i18n="key" (text) or data-i18n-attr="aria-label:key" (attributes).
// The choice is saved in this browser and never resets financial data.

window.I18N = (function () {
  const STORAGE_KEY = 'ubuntu-invest-language';
  const strings = {};
  const listeners = new Set();
  const missing = new Set();

  // `cta` is always shown in the language itself ("Continue in …")
  const LANGUAGES = [
    { code: 'en', name: 'English', html: 'en', locale: 'en-RW', short: 'EN', cta: 'Continue in English' },
    { code: 'rw', name: 'Kinyarwanda', native: 'Ikinyarwanda', html: 'rw', locale: 'rw', short: 'RW', cta: 'Komeza mu Kinyarwanda' },
    { code: 'fr', name: 'French', native: 'Français', html: 'fr', locale: 'fr-RW', short: 'FR', cta: 'Continuer en français' },
  ];

  let lang = 'en';
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (LANGUAGES.some((l) => l.code === saved)) lang = saved;
  } catch (e) {
    /* storage unavailable: use English */
  }

  const info = () => LANGUAGES.find((l) => l.code === lang);

  function add(code, dict) {
    strings[code] = Object.assign(strings[code] || {}, dict);
  }

  function lookup(key) {
    if (strings[lang] && key in strings[lang]) return strings[lang][key];
    if (strings.en && key in strings.en) {
      if (lang !== 'en') missing.add(`${lang}:${key}`);
      return strings.en[key];
    }
    missing.add(`en:${key}`);
    return key;
  }

  // Plural rules: Chrome has no Kinyarwanda data, so it uses English rules (1 = one)
  function pluralForm(count) {
    try {
      return new Intl.PluralRules(info().locale).select(count);
    } catch (e) {
      return count === 1 ? 'one' : 'other';
    }
  }

  function t(key, vars = {}) {
    let value = lookup(key);
    if (value && typeof value === 'object') {
      value = value[pluralForm(vars.count)] || value.other;
    }
    return String(value).replace(/\{(\w+)\}/g, (match, name) => {
      if (!(name in vars)) return match;
      const v = vars[name];
      return typeof v === 'number' ? formatNumber(v) : v;
    });
  }

  // ---------- Formatting ----------
  // Kinyarwanda isn't in the browser's locale data, so it's formatted here:
  // commas for thousands and "Frw" after the amount (to confirm with a native speaker).
  const RW_MONTHS = ['Mutarama', 'Gashyantare', 'Werurwe', 'Mata', 'Gicurasi', 'Kamena', 'Nyakanga', 'Kanama', 'Nzeri', 'Ukwakira', 'Ugushyingo', 'Ukuboza'];

  function formatNumber(n, digits = 0) {
    const opts = { minimumFractionDigits: digits, maximumFractionDigits: digits };
    if (lang === 'rw') return new Intl.NumberFormat('en-US', opts).format(n);
    return new Intl.NumberFormat(info().locale, opts).format(n);
  }

  function formatMoney(amount) {
    const n = formatNumber(Math.abs(Math.round(amount)));
    if (lang === 'fr') return `${n}\u00a0RWF`;
    if (lang === 'rw') return `${n}\u00a0Frw`;
    return `RWF\u00a0${n}`;
  }

  // Real minus sign (−) so screen readers say "minus"
  function sign(n) {
    return n > 0 ? '+' : n < 0 ? '−' : '';
  }

  function formatPercent(pct, digits = 1) {
    const rounded = Number(pct.toFixed(digits));
    const body = formatNumber(Math.abs(rounded), digits);
    return lang === 'fr' ? `${sign(rounded)}${body}\u00a0%` : `${sign(rounded)}${body}%`;
  }

  function formatDate(date, style = 'dayMonth') {
    if (lang === 'rw') {
      const month = RW_MONTHS[date.getMonth()];
      return style === 'monthYear' ? `${month} ${date.getFullYear()}` : `${date.getDate()} ${month}`;
    }
    const opts = style === 'monthYear' ? { month: 'long', year: 'numeric' } : style === 'dayMonthLong' ? { day: 'numeric', month: 'long' } : { day: 'numeric', month: 'short' };
    const text = new Intl.DateTimeFormat(info().locale, opts).format(date);
    return style === 'monthYear' ? text.charAt(0).toUpperCase() + text.slice(1) : text;
  }

  // ---------- Static text in index.html ----------
  function applyStatic() {
    document.documentElement.lang = info().html;
    document.querySelectorAll('[data-i18n]').forEach((node) => {
      node.textContent = t(node.dataset.i18n);
    });
    document.querySelectorAll('[data-i18n-attr]').forEach((node) => {
      node.dataset.i18nAttr.split(';').forEach((pair) => {
        const [attr, key] = pair.split(':');
        node.setAttribute(attr.trim(), t(key.trim()));
      });
    });
    document.title = t('app.title');
  }

  function set(code) {
    if (!LANGUAGES.some((l) => l.code === code) || code === lang) return;
    lang = code;
    try {
      localStorage.setItem(STORAGE_KEY, code);
    } catch (e) {
      /* not saved, but still switches */
    }
    applyStatic();
    listeners.forEach((fn) => fn(code));
  }

  return {
    LANGUAGES,
    add,
    t,
    set,
    get lang() {
      return lang;
    },
    isDraft: () => lang !== 'en', // Kinyarwanda and French await native-speaker review
    onChange(fn) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
    applyStatic,
    formatNumber,
    formatMoney,
    formatPercent,
    formatDate,
    sign,
    missing,
  };
})();
