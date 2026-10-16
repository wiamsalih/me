// Shared behaviour for every page: nav state, reveal-on-scroll, typed name,
// and the accessibility toolkit (injected here so each page gets the same panel).

(function () {
  const STORAGE_KEY = 'a11y-prefs-v1';
  const DEFAULTS = { fontScale: 1, contrast: false, dyslexia: false, underline: false, motion: false };
  const body = document.body;
  const systemReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  let prefs = Object.assign({}, DEFAULTS);
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) prefs = Object.assign(prefs, JSON.parse(raw));
  } catch (e) { /* ignore, use defaults */ }

  function motionReduced() {
    return prefs.motion || systemReducedMotion.matches;
  }

  // ===== Nav =====
  const nav = document.getElementById('nav');
  if (nav) {
    const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  // ===== Reveal on scroll =====
  const revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    revealEls.forEach((el) => observer.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add('visible'));
  }

  // ===== Typed name (home only) =====
  const typedName = document.getElementById('typedName');
  if (typedName) {
    const text = typedName.textContent.trim();
    if (!motionReduced()) {
      typedName.textContent = '';
      let index = 0;
      const typeEffect = () => {
        if (index < text.length) {
          typedName.innerHTML = text.slice(0, index + 1) + '<span class="cursor" aria-hidden="true"></span>';
          index += 1;
          setTimeout(typeEffect, 90);
        } else {
          typedName.innerHTML = text + '<span class="cursor" aria-hidden="true"></span>';
        }
      };
      window.addEventListener('load', () => setTimeout(typeEffect, 350));
    }
  }

  // ===== Accessibility toolkit =====
  const ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    '<circle cx="12" cy="4" r="1.6" fill="currentColor" stroke="none"></circle>' +
    '<path d="M5 8.5 12 7l7 1.5"></path><path d="M12 7v6"></path><path d="M9 21l3-8 3 8"></path><path d="M6 12l6 1.5L18 12"></path></svg>';

  function row(id, label, desc, ariaLabel) {
    return '<div class="a11y-row"><div><div class="a11y-row-label" id="' + id + '-label">' + label + '</div>' +
      '<div class="a11y-row-desc">' + desc + '</div></div>' +
      '<button type="button" class="a11y-switch" id="' + id + '" role="switch" aria-checked="false" aria-pressed="false" aria-label="' + ariaLabel + '"></button></div>';
  }

  const toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.id = 'a11y-toggle';
  toggle.setAttribute('aria-haspopup', 'true');
  toggle.setAttribute('aria-expanded', 'false');
  toggle.setAttribute('aria-controls', 'a11y-panel');
  toggle.setAttribute('aria-label', 'Open accessibility options');
  toggle.innerHTML = ICON;

  const panel = document.createElement('div');
  panel.id = 'a11y-panel';
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-modal', 'false');
  panel.setAttribute('aria-labelledby', 'a11y-heading');
  panel.innerHTML =
    '<h2 id="a11y-heading">Accessibility</h2>' +
    '<div class="a11y-row"><div><div class="a11y-row-label">Text size</div><div class="a11y-row-desc">Adjust reading size</div></div>' +
    '<div class="a11y-btn-group"><button type="button" class="a11y-mini-btn" id="a11y-font-dec" aria-label="Decrease text size">A−</button>' +
    '<button type="button" class="a11y-mini-btn" id="a11y-font-inc" aria-label="Increase text size">A+</button></div></div>' +
    row('a11y-contrast', 'High contrast', 'Black background, bright text', 'Toggle high contrast mode') +
    row('a11y-dyslexia', 'Dyslexia-friendly font', 'Simpler letterforms, more spacing', 'Toggle dyslexia-friendly font') +
    row('a11y-underline', 'Underline links', 'Make links easier to spot', 'Toggle underlined links') +
    row('a11y-motion', 'Reduce motion', 'Turn off animations &amp; fade-ins', 'Toggle reduced motion') +
    '<button type="button" class="a11y-reset" id="a11y-reset">Reset to default</button>';

  const footer = document.querySelector('footer');
  body.insertBefore(toggle, footer);
  body.insertBefore(panel, footer);

  const switches = {
    contrast: document.getElementById('a11y-contrast'),
    dyslexia: document.getElementById('a11y-dyslexia'),
    underline: document.getElementById('a11y-underline'),
    motion: document.getElementById('a11y-motion'),
  };
  const classMap = {
    contrast: 'a11y-contrast',
    dyslexia: 'a11y-dyslexia',
    underline: 'a11y-underline',
    motion: 'a11y-reduce-motion',
  };

  function savePrefs() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs)); } catch (e) { /* storage unavailable */ }
  }

  function applyPrefs() {
    document.documentElement.style.fontSize = (prefs.fontScale * 100) + '%';
    Object.keys(classMap).forEach((key) => {
      body.classList.toggle(classMap[key], !!prefs[key]);
      switches[key].setAttribute('aria-checked', String(!!prefs[key]));
      switches[key].setAttribute('aria-pressed', String(!!prefs[key]));
    });
    if (prefs.motion) revealEls.forEach((el) => el.classList.add('visible'));
  }

  function openPanel() {
    panel.classList.add('open');
    toggle.setAttribute('aria-expanded', 'true');
    document.getElementById('a11y-font-dec').focus();
  }
  function closePanel(returnFocus) {
    panel.classList.remove('open');
    toggle.setAttribute('aria-expanded', 'false');
    if (returnFocus) toggle.focus();
  }

  toggle.addEventListener('click', () => {
    if (panel.classList.contains('open')) { closePanel(false); } else { openPanel(); }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && panel.classList.contains('open')) closePanel(true);
  });

  document.addEventListener('click', (e) => {
    if (panel.classList.contains('open') && !panel.contains(e.target) && !toggle.contains(e.target)) {
      closePanel(false);
    }
  });

  document.getElementById('a11y-font-inc').addEventListener('click', () => {
    prefs.fontScale = Math.min(1.6, +(prefs.fontScale + 0.1).toFixed(2));
    applyPrefs();
    savePrefs();
  });
  document.getElementById('a11y-font-dec').addEventListener('click', () => {
    prefs.fontScale = Math.max(0.8, +(prefs.fontScale - 0.1).toFixed(2));
    applyPrefs();
    savePrefs();
  });

  Object.keys(switches).forEach((key) => {
    switches[key].addEventListener('click', () => {
      prefs[key] = !prefs[key];
      applyPrefs();
      savePrefs();
    });
  });

  document.getElementById('a11y-reset').addEventListener('click', () => {
    prefs = Object.assign({}, DEFAULTS);
    applyPrefs();
    savePrefs();
  });

  applyPrefs();
})();
