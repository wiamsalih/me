// Runs at the top of <body>, before first paint, so saved accessibility
// settings apply immediately instead of animating in. site.js handles the panel.
(function () {
  try {
    var prefs = JSON.parse(localStorage.getItem('a11y-prefs-v1') || '{}');
    var b = document.body;
    if (prefs.fontScale) document.documentElement.style.fontSize = (prefs.fontScale * 100) + '%';
    if (prefs.contrast) b.classList.add('a11y-contrast');
    if (prefs.dyslexia) b.classList.add('a11y-dyslexia');
    if (prefs.underline) b.classList.add('a11y-underline');
    if (prefs.motion) b.classList.add('a11y-reduce-motion');
  } catch (e) { /* storage unavailable: use defaults */ }
})();
