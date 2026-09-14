(function () {
  var root = document.querySelector('[data-category-ring]');
  if (!root) return;
  var wheel = root.querySelector('[data-ring-wheel]');
  var cards = Array.from(root.querySelectorAll('[data-ring-card]'));
  var dots = Array.from(root.querySelectorAll('[data-ring-go]'));
  var scene = root.querySelector('[data-ring-scene]');
  var status = root.querySelector('[data-ring-status]');
  var motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  var rotation = 0;
  var index = 0;
  var pointer = null;
  var suppressClick = false;
  if (cards.length !== 6 || dots.length !== cards.length) return;

  // Auto-rotation: each card gets AUTO_MS on screen, shown by a fill bar on
  // its dot. Paused (not reset) while hovered, focused, or the tab is
  // hidden — tracked as a set of reasons so overlapping pauses behave.
  var AUTO_MS = 5000;
  root.style.setProperty('--ring-autoplay-ms', AUTO_MS + 'ms');
  var timer = null;
  var tickStart = 0;
  var remaining = AUTO_MS;
  var pauseReasons = Object.create(null);

  function isPaused() {
    for (var key in pauseReasons) if (pauseReasons[key]) return true;
    return false;
  }

  function armTimer(ms) {
    window.clearTimeout(timer);
    tickStart = Date.now();
    timer = window.setTimeout(function () { go(rotation + 1); }, ms);
  }

  function pause(reason) {
    var was = isPaused();
    pauseReasons[reason] = true;
    if (was) return;
    window.clearTimeout(timer);
    timer = null;
    remaining -= Date.now() - tickStart;
    root.classList.add('is-autoplay-paused');
  }

  function resume(reason) {
    delete pauseReasons[reason];
    if (isPaused() || motion.matches) return;
    root.classList.remove('is-autoplay-paused');
    armTimer(remaining > 60 ? remaining : AUTO_MS);
  }

  function restartAuto() {
    remaining = AUTO_MS;
    root.classList.remove('is-autoplay-paused');
    dots.forEach(function (dot) { dot.classList.remove('is-progressing'); });
    if (motion.matches) return;
    var active = dots[index];
    // Force a reflow so the fill animation restarts from empty every time.
    void active.offsetWidth;
    active.classList.add('is-progressing');
    if (!isPaused()) armTimer(AUTO_MS);
  }

  function go(next) {
    // Keep turns unbounded so crossing 6 → 1 continues in the same direction.
    rotation = next;
    index = ((next % cards.length) + cards.length) % cards.length;
    wheel.style.setProperty('--ring-angle', (-rotation * 360 / cards.length) + 'deg');
    cards.forEach(function (card, n) {
      var active = n === index;
      var distance = (n - index + cards.length) % cards.length;
      card.classList.toggle('is-active', active);
      card.classList.toggle('is-neighbor', distance === 1 || distance === cards.length - 1);
      card.setAttribute('aria-hidden', active ? 'false' : 'true');
      card.inert = !active;
      dots[n].setAttribute('aria-pressed', active ? 'true' : 'false');
    });
    status.textContent = ('0' + (index + 1)).slice(-2) + ' / 06 — ' + cards[index].getAttribute('data-category-name');
    restartAuto();
  }

  root.querySelector('[data-ring-prev]').addEventListener('click', function () { go(rotation - 1); });
  root.querySelector('[data-ring-next]').addEventListener('click', function () { go(rotation + 1); });
  dots.forEach(function (dot, n) {
    dot.addEventListener('click', function () {
      var delta = (n - index + cards.length) % cards.length;
      if (delta > cards.length / 2) delta -= cards.length;
      go(rotation + delta);
    });
  });
  root.addEventListener('keydown', function (event) {
    var next;
    if (event.key === 'ArrowRight') next = rotation + 1;
    else if (event.key === 'ArrowLeft') next = rotation - 1;
    else if (event.key === 'Home') next = rotation - index;
    else if (event.key === 'End') next = rotation - index + cards.length - 1;
    else return;
    event.preventDefault();
    // If a card action has focus, move it to a persistent control before
    // making that card inert. Arrow controls otherwise retain their focus.
    if (scene.contains(document.activeElement)) dots[((next % 6) + 6) % 6].focus({ preventScroll: true });
    go(next);
  });

  scene.addEventListener('pointerdown', function (event) {
    if (!event.isPrimary || event.button !== 0) return;
    pointer = { id: event.pointerId, x: event.clientX, y: event.clientY };
    suppressClick = false;
    pause('drag');
  });
  window.addEventListener('pointerup', function (event) {
    if (!pointer || event.pointerId !== pointer.id) return;
    var dx = event.clientX - pointer.x;
    var dy = event.clientY - pointer.y;
    pointer = null;
    if (Math.abs(dx) >= 45 && Math.abs(dx) >= Math.abs(dy) * 1.3) {
      suppressClick = true;
      go(rotation + (dx < 0 ? 1 : -1));
      window.setTimeout(function () { suppressClick = false; }, 0);
    }
    resume('drag');
  });
  window.addEventListener('pointercancel', function () { pointer = null; resume('drag'); });
  scene.addEventListener('click', function (event) {
    if (!suppressClick) return;
    event.preventDefault();
    event.stopPropagation();
  }, true);

  root.addEventListener('pointerenter', function () { pause('hover'); });
  root.addEventListener('pointerleave', function () { resume('hover'); });
  root.addEventListener('focusin', function () { pause('focus'); });
  root.addEventListener('focusout', function () {
    window.setTimeout(function () {
      if (!root.contains(document.activeElement)) resume('focus');
    }, 0);
  });
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) pause('hidden');
    else resume('hidden');
  });
  motion.addEventListener('change', function () { restartAuto(); });

  root.classList.add('is-ready');
  root.setAttribute('aria-roledescription', 'carousel');
  cards.forEach(function (card, n) {
    card.setAttribute('aria-roledescription', 'slide');
    card.setAttribute('aria-label', (n + 1) + ' of 6');
  });
  root.querySelector('[data-ring-controls]').hidden = false;
  status.hidden = false;
  go(0);
})();
