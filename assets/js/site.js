/* Shared behaviour: mobile nav toggle + current-page marking. */
(function () {
  'use strict';

  var toggle = document.querySelector('.nav-toggle');
  var nav = document.querySelector('.nav');

  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      var open = nav.getAttribute('data-open') === 'true';
      nav.setAttribute('data-open', String(!open));
      toggle.setAttribute('aria-expanded', String(!open));
      toggle.textContent = open ? 'Menu' : 'Close';
    });
  }

  // Mark the active nav item without hand-editing six files.
  var here = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav a').forEach(function (a) {
    var target = a.getAttribute('href');
    if (target === here) a.setAttribute('aria-current', 'page');
  });

  // Tooltips show on hover and keyboard focus via CSS. Touch has neither,
  // so tapping toggles them here. One open at a time.
  var tips = document.querySelectorAll('.tip');
  tips.forEach(function (tip) {
    tip.addEventListener('click', function (event) {
      event.preventDefault();
      var open = tip.getAttribute('aria-expanded') === 'true';
      tips.forEach(function (t) { t.setAttribute('aria-expanded', 'false'); });
      tip.setAttribute('aria-expanded', String(!open));
    });
  });

  document.addEventListener('click', function (event) {
    if (event.target.closest && event.target.closest('.tip')) return;
    tips.forEach(function (t) { t.setAttribute('aria-expanded', 'false'); });
  });
})();
